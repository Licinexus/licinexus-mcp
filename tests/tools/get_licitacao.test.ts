import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/adapters/pncp.js', () => ({
  PncpError: class extends Error {},
  getContratacao: vi.fn(),
}));

const { getLicitacao } = await import('../../src/tools/get_licitacao.js');
const { getContratacao } = await import('../../src/adapters/pncp.js');

const mocked = vi.mocked(getContratacao);

describe('get_licitacao tool', () => {
  beforeEach(() => mocked.mockReset());

  it('parses numeroControlePNCP and calls adapter', async () => {
    mocked.mockResolvedValue({
      numeroControlePNCP: '12345678000123-1-000042/2024',
      anoCompra: 2024,
      sequencialCompra: 42,
    } as never);
    const result = await getLicitacao.handler({
      numeroControlePNCP: '12345678000123-1-000042/2024',
    });
    expect(mocked).toHaveBeenCalledWith('12345678000123', 2024, 42);
    expect(result.isError).toBeFalsy();
  });

  it('accepts explicit components', async () => {
    mocked.mockResolvedValue({} as never);
    const result = await getLicitacao.handler({
      orgaoCnpj: '12345678000123',
      ano: 2024,
      sequencial: 7,
    });
    expect(mocked).toHaveBeenCalledWith('12345678000123', 2024, 7);
    expect(result.isError).toBeFalsy();
  });

  it('errors on invalid input', async () => {
    const result = await getLicitacao.handler({});
    expect(result.isError).toBe(true);
  });
});
