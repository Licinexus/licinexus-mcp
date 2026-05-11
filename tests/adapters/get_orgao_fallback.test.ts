import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';

const pncpGet = vi.fn();
const consultaGet = vi.fn();

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  let counter = 0;
  const create = vi.fn((_cfg?: unknown) => {
    counter++;
    const get = counter === 1 ? consultaGet : pncpGet;
    return {
      get,
      defaults: {},
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    } as unknown as AxiosInstance;
  });
  return {
    ...actual,
    default: { ...actual.default, create, AxiosError: actual.AxiosError },
    create,
    AxiosError: actual.AxiosError,
  };
});

vi.mock('../../src/adapters/cnpj.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/adapters/cnpj.js')>(
    '../../src/adapters/cnpj.js',
  );
  return {
    ...actual,
    getCnpjData: vi.fn(),
  };
});

const { getOrgao } = await import('../../src/adapters/pncp.js');
const { getCnpjData, CnpjError } = await import('../../src/adapters/cnpj.js');
const { cache } = await import('../../src/cache/memory.js');

const mockedCnpj = vi.mocked(getCnpjData);

function makeAxiosError(status: number | undefined, code?: string): AxiosError {
  const err = new AxiosError('upstream');
  if (code) err.code = code;
  if (status !== undefined) {
    (err as unknown as { response: unknown }).response = { status } as unknown;
  }
  return err;
}

describe('getOrgao — BrasilAPI fallback', () => {
  beforeEach(() => {
    pncpGet.mockReset();
    consultaGet.mockReset();
    mockedCnpj.mockReset();
    cache.clear();
  });

  it('falls back to BrasilAPI when PNCP returns 503', async () => {
    pncpGet.mockRejectedValue(makeAxiosError(503));
    mockedCnpj.mockResolvedValue({
      cnpj: '00394544000185',
      razao_social: 'MINISTERIO DA SAUDE',
      nome_fantasia: 'MS',
      descricao_situacao_cadastral: 'Ativa',
      municipio: 'BRASILIA',
      uf: 'DF',
      natureza_juridica: { codigo: '1244', descricao: 'Órgão Público do Poder Executivo Federal' },
      _provider: 'brasilapi',
    });

    const result = await getOrgao('00394544000185');

    expect(result.razaoSocial).toBe('MINISTERIO DA SAUDE');
    expect(result.municipioNome).toBe('BRASILIA');
    expect(result.ufSigla).toBe('DF');
    expect(result.naturezaJuridicaCodigo).toBe('1244');
    expect((result as Record<string, unknown>)._source).toBe('brasilapi-fallback');
    expect(mockedCnpj).toHaveBeenCalledWith('00394544000185');
  });

  it('falls back on 502', async () => {
    pncpGet.mockRejectedValue(makeAxiosError(502));
    mockedCnpj.mockResolvedValue({
      cnpj: '00000000000191',
      razao_social: 'BANCO DO BRASIL SA',
      _provider: 'brasilapi',
    });

    const result = await getOrgao('00000000000191');
    expect(result.razaoSocial).toBe('BANCO DO BRASIL SA');
  });

  it('falls back on timeout (ECONNABORTED)', async () => {
    pncpGet.mockRejectedValue(makeAxiosError(undefined, 'ECONNABORTED'));
    mockedCnpj.mockResolvedValue({
      cnpj: '11111111000111',
      razao_social: 'Algum Orgão',
      _provider: 'brasilapi',
    });

    const result = await getOrgao('11111111000111');
    expect(result.razaoSocial).toBe('Algum Orgão');
  });

  it('does NOT fall back on 404', async () => {
    pncpGet.mockRejectedValue(makeAxiosError(404));

    await expect(getOrgao('99999999999999')).rejects.toThrow();
    expect(mockedCnpj).not.toHaveBeenCalled();
  });

  it('surfaces original PNCP error when fallback also fails', async () => {
    pncpGet.mockRejectedValue(makeAxiosError(503));
    mockedCnpj.mockRejectedValue(new CnpjError('BrasilAPI also down'));

    await expect(getOrgao('00394544000185')).rejects.toThrow();
  });

  it('hits PNCP first on success — no fallback needed', async () => {
    pncpGet.mockResolvedValue({
      data: {
        cnpj: '00394544000185',
        razaoSocial: 'MINISTERIO DA SAUDE',
        poderId: 'E',
        esferaId: 'F',
      },
    });

    const result = await getOrgao('00394544000185');
    expect(result.razaoSocial).toBe('MINISTERIO DA SAUDE');
    expect((result as Record<string, unknown>).poderId).toBe('E');
    expect(mockedCnpj).not.toHaveBeenCalled();
  });
});
