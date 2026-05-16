import { describe, it, expect } from 'vitest';
import {
  daysBetweenPncpDates,
  defaultDateRange,
  isValidPncpDate,
  validatePncpDateRange,
} from '../../src/utils/dates.js';

describe('isValidPncpDate', () => {
  it('accepts valid 8-digit YYYYMMDD', () => {
    expect(isValidPncpDate('20240101')).toBe(true);
    expect(isValidPncpDate('20241231')).toBe(true);
    expect(isValidPncpDate('20301231')).toBe(true);
  });

  it('rejects wrong format YYYY-MM-DD', () => {
    expect(isValidPncpDate('2024-01-01')).toBe(false);
  });

  it('rejects strings that are too short or too long', () => {
    expect(isValidPncpDate('20240')).toBe(false);
    expect(isValidPncpDate('202401')).toBe(false);
    expect(isValidPncpDate('202401011')).toBe(false);
  });

  it('rejects non-numeric strings', () => {
    expect(isValidPncpDate('foo')).toBe(false);
    expect(isValidPncpDate('abcdefgh')).toBe(false);
  });
});

describe('daysBetweenPncpDates', () => {
  it('returns 0 for the same date', () => {
    expect(daysBetweenPncpDates('20240101', '20240101')).toBe(0);
  });

  it('returns 7 for one week apart', () => {
    expect(daysBetweenPncpDates('20240101', '20240108')).toBe(7);
  });

  it('returns negative when dataInicial is after dataFinal', () => {
    expect(daysBetweenPncpDates('20240108', '20240101')).toBe(-7);
  });

  it('returns null for invalid format', () => {
    expect(daysBetweenPncpDates('2024-01-01', '20240108')).toBeNull();
    expect(daysBetweenPncpDates('20240101', 'invalid')).toBeNull();
    expect(daysBetweenPncpDates('invalid', '20240108')).toBeNull();
  });
});

describe('validatePncpDateRange', () => {
  it('returns ok=true for a valid range within 365 days', () => {
    const result = validatePncpDateRange('20240101', '20240601');
    expect(result).toEqual({ ok: true });
  });

  it('returns ok=false when range exceeds 365 days', () => {
    const result = validatePncpDateRange('20220101', '20240101');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('exceeds the PNCP limit of 365 days');
  });

  it('returns ok=false when dataInicial is after dataFinal', () => {
    const result = validatePncpDateRange('20240110', '20240101');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('must be on or before dataFinal');
  });

  it('returns ok=false for invalid date format', () => {
    const result = validatePncpDateRange('2024-01-01', '20240108');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Invalid date format');
  });
});

describe('defaultDateRange', () => {
  it('returns 8-character YYYYMMDD strings for both ends', () => {
    const r = defaultDateRange(7);
    expect(r.dataInicial).toMatch(/^\d{8}$/);
    expect(r.dataFinal).toMatch(/^\d{8}$/);
  });

  it('start date is before end date', () => {
    const r = defaultDateRange(7);
    expect(Number(r.dataInicial)).toBeLessThan(Number(r.dataFinal));
  });

  it('respects custom daysBack value', () => {
    const r = defaultDateRange(30);
    const start = new Date(
      r.dataInicial.slice(0, 4),
      r.dataInicial.slice(4, 6) - 1,
      r.dataInicial.slice(6, 8),
    );
    const end = new Date(
      r.dataFinal.slice(0, 4),
      r.dataFinal.slice(4, 6) - 1,
      r.dataFinal.slice(6, 8),
    );
    const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    expect(diffDays).toBe(30);
  });
});
