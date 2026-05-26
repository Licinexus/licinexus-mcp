import { t } from './i18n.js';

export const PNCP_MAX_DATE_RANGE_DAYS = 365;

export function formatPncpDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function defaultDateRange(daysBack = 7): {
  dataInicial: string;
  dataFinal: string;
} {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - daysBack);
  return {
    dataInicial: formatPncpDate(start),
    dataFinal: formatPncpDate(end),
  };
}

export function isValidPncpDate(s: string): boolean {
  return /^\d{8}$/.test(s);
}

function parsePncpDate(s: string): Date | null {
  if (!isValidPncpDate(s)) return null;
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(4, 6)) - 1;
  const day = Number(s.slice(6, 8));
  const d = new Date(Date.UTC(year, month, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month || d.getUTCDate() !== day)
    return null;
  return d;
}

export function daysBetweenPncpDates(dataInicial: string, dataFinal: string): number | null {
  const start = parsePncpDate(dataInicial);
  const end = parsePncpDate(dataFinal);
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function validatePncpDateRange(
  dataInicial: string,
  dataFinal: string,
): { ok: true } | { ok: false; reason: string } {
  const days = daysBetweenPncpDates(dataInicial, dataFinal);
  if (days == null) {
    return { ok: false, reason: t('error.date_format') };
  }
  if (days < 0) {
    return {
      ok: false,
      reason: t('error.date_order', { inicial: dataInicial, final: dataFinal }),
    };
  }
  if (days > PNCP_MAX_DATE_RANGE_DAYS) {
    return {
      ok: false,
      reason: t('error.date_range_too_wide', {
        days,
        max: PNCP_MAX_DATE_RANGE_DAYS,
        inicial: dataInicial,
        final: dataFinal,
      }),
    };
  }
  return { ok: true };
}
