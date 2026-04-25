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
