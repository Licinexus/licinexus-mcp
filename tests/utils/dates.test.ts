import { describe, it, expect } from 'vitest';
import { defaultDateRange, formatPncpDate, isValidPncpDate } from '../../src/utils/dates.js';

describe('formatPncpDate', () => {
  it('formats YYYYMMDD with zero padding', () => {
    expect(formatPncpDate(new Date('2024-03-05T12:00:00Z'))).toBe('20240305');
  });
});

describe('defaultDateRange', () => {
  it('returns 8-character strings for both ends', () => {
    const r = defaultDateRange(7);
    expect(r.dataInicial).toMatch(/^\d{8}$/);
    expect(r.dataFinal).toMatch(/^\d{8}$/);
  });

  it('start date is before end date', () => {
    const r = defaultDateRange(7);
    expect(Number(r.dataInicial)).toBeLessThan(Number(r.dataFinal));
  });
});

describe('isValidPncpDate', () => {
  it('accepts 8-digit strings', () => {
    expect(isValidPncpDate('20240101')).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isValidPncpDate('2024-01-01')).toBe(false);
    expect(isValidPncpDate('foo')).toBe(false);
    expect(isValidPncpDate('20240')).toBe(false);
  });
});
