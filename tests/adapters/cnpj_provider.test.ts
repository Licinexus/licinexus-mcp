import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';

const httpGet = vi.fn();

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  const create = vi.fn(
    () =>
      ({
        get: httpGet,
        defaults: {},
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
      }) as unknown as AxiosInstance,
  );
  return {
    ...actual,
    default: { ...actual.default, create, AxiosError: actual.AxiosError },
    create,
    AxiosError: actual.AxiosError,
  };
});

const { getCnpjData, CnpjError } = await import('../../src/adapters/cnpj.js');
const { cache } = await import('../../src/cache/memory.js');

function makeAxiosError(status: number): AxiosError {
  const err = new AxiosError('upstream');
  (err as unknown as { response: unknown }).response = { status } as unknown;
  return err;
}

const OK_PACOTE_6 = {
  status: 1,
  razao: 'ALAS TECNOLOGIA LTDA',
  fantasia: 'CPFCNPJ',
  matrizEndereco: {
    logradouro: 'Rua Exemplo',
    numero: 100,
    complemento: 'Sala 5',
    bairro: 'Centro',
    cep: '30110-000',
    cidade: 'BELO HORIZONTE',
    uf: 'MG',
  },
  ibge: { cidade: { ibge_id: '3106200' } },
  simplesNacional: { optante: 'Sim', situacao: 'Optante' },
  porte: 'ME',
};

describe('getCnpjData — provedor cpfcnpj', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    httpGet.mockReset();
    cache.clear();
    process.env.CNPJ_PROVIDER = 'cpfcnpj';
    process.env.CPFCNPJ_TOKEN = 'test-token';
    delete process.env.CPFCNPJ_PACOTE;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('mapeia a resposta do pacote 6 para o shape canônico', async () => {
    httpGet.mockResolvedValue({ data: OK_PACOTE_6 });

    const result = await getCnpjData('27.272.134/0001-18');

    expect(result._provider).toBe('cpfcnpj');
    expect(result.cnpj).toBe('27272134000118');
    expect(result.razao_social).toBe('ALAS TECNOLOGIA LTDA');
    expect(result.nome_fantasia).toBe('CPFCNPJ');
    expect(result.logradouro).toBe('Rua Exemplo');
    expect(result.numero).toBe('100');
    expect(result.bairro).toBe('Centro');
    expect(result.cep).toBe('30110-000');
    expect(result.municipio).toBe('BELO HORIZONTE');
    expect(result.uf).toBe('MG');
    expect(result.codigo_municipio).toBe('3106200');
    expect(result.opcao_pelo_simples).toBe(true);
    expect(result.porte).toBe('ME');
  });

  it('usa o token e o pacote na URL da requisição', async () => {
    process.env.CPFCNPJ_PACOTE = '5';
    httpGet.mockResolvedValue({ data: OK_PACOTE_6 });

    await getCnpjData('27272134000118');

    expect(httpGet).toHaveBeenCalledWith('/test-token/5/27272134000118');
  });

  it('assume o pacote 6 quando CPFCNPJ_PACOTE não é definido', async () => {
    httpGet.mockResolvedValue({ data: OK_PACOTE_6 });

    await getCnpjData('27272134000118');

    expect(httpGet).toHaveBeenCalledWith('/test-token/6/27272134000118');
  });

  it('lança CnpjError quando a resposta traz status 0 e erro', async () => {
    httpGet.mockResolvedValue({
      data: { status: 0, erro: 'CNPJ inexistente', erroCodigo: '11' },
    });

    await expect(getCnpjData('27272134000118')).rejects.toBeInstanceOf(CnpjError);
    await expect(getCnpjData('27272134000118')).rejects.toThrow(/CNPJ inexistente/);
  });

  it('exige CPFCNPJ_TOKEN', async () => {
    delete process.env.CPFCNPJ_TOKEN;
    httpGet.mockResolvedValue({ data: OK_PACOTE_6 });

    await expect(getCnpjData('27272134000118')).rejects.toThrow(/CPFCNPJ_TOKEN/);
    expect(httpGet).not.toHaveBeenCalled();
  });

  it('converte HTTP 404 em CnpjError legível', async () => {
    httpGet.mockRejectedValue(makeAxiosError(404));

    await expect(getCnpjData('27272134000118')).rejects.toThrow(/not found at cpfcnpj/);
  });

  it('reaproveita o cache na segunda chamada', async () => {
    httpGet.mockResolvedValue({ data: OK_PACOTE_6 });

    await getCnpjData('27272134000118');
    await getCnpjData('27272134000118');

    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it('mantém o padrão brasilapi quando CNPJ_PROVIDER não é definido', async () => {
    delete process.env.CNPJ_PROVIDER;
    httpGet.mockResolvedValue({
      data: { cnpj: '27272134000118', razao_social: 'ALAS TECNOLOGIA LTDA' },
    });

    const result = await getCnpjData('27272134000118');

    expect(result._provider).toBe('brasilapi');
    expect(httpGet).toHaveBeenCalledWith('/api/cnpj/v1/27272134000118');
  });
});
