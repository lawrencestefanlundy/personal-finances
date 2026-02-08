export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function formatMonthShort(month: string): string {
  const [, m] = month.split('-');
  const date = new Date(2000, parseInt(m) - 1);
  return date.toLocaleDateString('en-GB', { month: 'short' });
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-GB').format(value);
}

export function parseMonth(month: string): { year: number; month: number } {
  const [y, m] = month.split('-');
  return { year: parseInt(y), month: parseInt(m) };
}

export function addMonths(month: string, count: number): string {
  const { year, month: m } = parseMonth(month);
  const date = new Date(year, m - 1 + count);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthsBetween(start: string, end: string): string[] {
  const months: string[] = [];
  let current = start;
  while (current <= end) {
    months.push(current);
    current = addMonths(current, 1);
  }
  return months;
}
