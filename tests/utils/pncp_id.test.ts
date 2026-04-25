import { describe, it, expect } from 'vitest';
import { normalizeCnpj, parseNumeroControle, resolvePncpId } from '../../src/utils/pncp_id.js';

describe('parseNumeroControle', () => {
  it('parses a valid PNCP control number', () => {
    const id = parseNumeroControle('12345678000123-1-000042/2024');
    expect(id).toEqual({
      orgaoCnpj: '12345678000123',
      ano: 2024,
      sequencial: 42,
    });
  });

  it('throws on invalid format', () => {
    expect(() => parseNumeroControle('foo')).toThrow();
    expect(() => parseNumeroControle('12345-1-1/2024')).toThrow();
  });
});

describe('normalizeCnpj', () => {
  it('strips punctuation and validates length', () => {
    expect(normalizeCnpj('12.345.678/0001-23')).toBe('12345678000123');
    expect(normalizeCnpj('12345678000123')).toBe('12345678000123');
  });

  it('rejects invalid CNPJs', () => {
    expect(() => normalizeCnpj('12345')).toThrow();
    expect(() => normalizeCnpj('')).toThrow();
  });
});

describe('resolvePncpId', () => {
  it('resolves from numeroControlePNCP', () => {
    const id = resolvePncpId({ numeroControlePNCP: '12345678000123-1-000007/2025' });
    expect(id).toEqual({ orgaoCnpj: '12345678000123', ano: 2025, sequencial: 7 });
  });

  it('resolves from explicit components', () => {
    const id = resolvePncpId({
      orgaoCnpj: '12345678000123',
      ano: 2025,
      sequencial: 7,
    });
    expect(id).toEqual({ orgaoCnpj: '12345678000123', ano: 2025, sequencial: 7 });
  });
});
