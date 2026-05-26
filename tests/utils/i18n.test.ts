import { describe, it, expect, beforeEach, afterAll } from 'vitest';

const ORIGINAL_LANG = process.env.LICINEXUS_LANG;

async function importT() {
  return await import('../../src/utils/i18n.js');
}

describe('i18n', () => {
  beforeEach(() => {
    // Reset after each test
    delete process.env.LICINEXUS_LANG;
  });

  afterAll(() => {
    // Restore original
    if (ORIGINAL_LANG) {
      process.env.LICINEXUS_LANG = ORIGINAL_LANG;
    } else {
      delete process.env.LICINEXUS_LANG;
    }
  });

  it('defaults to Portuguese when LICINEXUS_LANG is not set', async () => {
    delete process.env.LICINEXUS_LANG;
    const { t } = await importT();
    const result = t('error.invalid_arguments', { msg: 'test' });
    expect(result).toBe('Argumentos inválidos: test');
  });

  it('defaults to Portuguese when LICINEXUS_LANG is set to pt', async () => {
    process.env.LICINEXUS_LANG = 'pt';
    const { t } = await importT();
    const result = t('error.invalid_arguments', { msg: 'test' });
    expect(result).toBe('Argumentos inválidos: test');
  });

  it('returns English when LICINEXUS_LANG is set to en', async () => {
    process.env.LICINEXUS_LANG = 'en';
    const { t } = await importT();
    const result = t('error.invalid_arguments', { msg: 'test' });
    expect(result).toBe('Invalid arguments: test');
  });

  it('interpolates multiple parameters', async () => {
    delete process.env.LICINEXUS_LANG;
    const { t } = await importT();
    const result = t('error.date_range_too_wide', {
      days: 400,
      max: 365,
      inicial: '20240101',
      final: '20250204',
    });
    expect(result).toContain('400');
    expect(result).toContain('365');
    expect(result).toContain('20240101');
    expect(result).toContain('20250204');
  });

  it('handles undefined and null parameters gracefully', async () => {
    delete process.env.LICINEXUS_LANG;
    const { t } = await importT();
    const result = t('error.pncp_http_status', {
      status: 422,
      url: '/test',
      suffix: undefined as unknown as string,
    });
    // {suffix} should be replaced with empty string
    expect(result).not.toContain('{suffix}');
    expect(result).toContain('422');
    expect(result).toContain('/test');
  });

  it('returns the key itself for unknown keys', async () => {
    delete process.env.LICINEXUS_LANG;
    const { t } = await importT();
    const result = t('error.nonexistent_key');
    expect(result).toBe('error.nonexistent_key');
  });

  it('translates PNCP timeout message correctly in PT', async () => {
    delete process.env.LICINEXUS_LANG;
    const { t } = await importT();
    const result = t('error.pncp_timeout', { timeout: 27000, url: '/test' });
    expect(result).toContain('27000');
    expect(result).toContain('/test');
  });

  it('translates PNCP timeout message correctly in EN', async () => {
    process.env.LICINEXUS_LANG = 'en';
    const { t } = await importT();
    const result = t('error.pncp_timeout', { timeout: 27000, url: '/test' });
    expect(result).toContain('27000');
    expect(result).toContain('timed out');
  });
});
