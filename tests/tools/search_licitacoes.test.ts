import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/adapters/pncp.js', () => ({
  PncpError: class extends Error {},
  listContratacoes: vi.fn(),
}));

const { searchLicitacoes } = await import('../../src/tools/search_licitacoes.js');
const { listContratacoes } = await import('../../src/adapters/pncp.js');

const mockedList = vi.mocked(listContratacoes);

function fakeContratacao(overrides: Record<string, unknown> = {}) {
  return {
    numeroControlePNCP: '00000000000000-1-000001/2024',
    anoCompra: 2024,
    sequencialCompra: 1,
    objetoCompra: 'Aquisição de notebooks tipo I',
    valorTotalEstimado: 50000,
    modalidadeNome: 'Pregão - Eletrônico',
    situacaoCompraNome: 'Divulgada no PNCP',
    orgaoEntidade: { cnpj: '00000000000000', razaoSocial: 'Município X' },
    unidadeOrgao: { ufSigla: 'SP', municipioNome: 'São Paulo' },
    ...overrides,
  };
}

describe('search_licitacoes tool', () => {
  beforeEach(() => {
    mockedList.mockReset();
  });

  it('uses default date range and modalidades when not provided', async () => {
    mockedList.mockResolvedValue({ data: [], totalRegistros: 0 });
    const result = await searchLicitacoes.handler({});
    expect(result.isError).toBeFalsy();
    expect(mockedList).toHaveBeenCalledTimes(3);
    const calls = mockedList.mock.calls;
    const modalidades = calls.map((c) => c[0]!.codigoModalidadeContratacao).sort();
    expect(modalidades).toEqual([6, 8, 9]);
    for (const call of calls) {
      expect(call[0]!.dataInicial).toMatch(/^\d{8}$/);
      expect(call[0]!.dataFinal).toMatch(/^\d{8}$/);
    }
  });

  it('applies palavraChave client-side filter', async () => {
    mockedList.mockResolvedValue({
      data: [
        fakeContratacao({ objetoCompra: 'Aquisição de notebooks' }),
        fakeContratacao({ objetoCompra: 'Compra de canetas' }),
      ],
    });
    const result = await searchLicitacoes.handler({
      modalidades: [6],
      palavraChave: 'notebook',
    });
    const text = result.content[0]!.type === 'text' ? result.content[0]!.text : '';
    const parsed = JSON.parse(text);
    expect(parsed.results).toHaveLength(1);
    expect(parsed.results[0]!.objeto).toMatch(/notebooks/);
  });

  it('applies value range filter', async () => {
    mockedList.mockResolvedValue({
      data: [
        fakeContratacao({ valorTotalEstimado: 1000 }),
        fakeContratacao({ valorTotalEstimado: 50000 }),
        fakeContratacao({ valorTotalEstimado: 999999 }),
      ],
    });
    const result = await searchLicitacoes.handler({
      modalidades: [6],
      valorMinimo: 10000,
      valorMaximo: 100000,
    });
    const parsed = JSON.parse(result.content[0]!.type === 'text' ? result.content[0]!.text : '');
    expect(parsed.results).toHaveLength(1);
    expect(parsed.results[0]!.valorEstimado).toBe(50000);
  });

  it('returns error result on adapter failure', async () => {
    mockedList.mockRejectedValue(new Error('boom'));
    const result = await searchLicitacoes.handler({ modalidades: [6] });
    expect(result.isError).toBe(true);
  });

  it('rejects invalid argument shape', async () => {
    const result = await searchLicitacoes.handler({ uf: 'INVALID' });
    expect(result.isError).toBe(true);
  });
});
