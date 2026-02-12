export const currencySymbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', CHF: 'CHF ' };

export function formatCostBasis(amount: number | undefined, currency: string | undefined): string {
  if (!amount) return '—';
  const sym = currencySymbols[currency ?? 'GBP'] ?? '£';
  return `${sym}${amount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatMoic(currentValue: number, costBasis: number | undefined): string {
  if (!costBasis || costBasis === 0) return '—';
  const moic = currentValue / costBasis;
  return `${moic.toFixed(2)}x`;
}

export const instrumentLabels: Record<string, string> = {
  equity: 'Equity',
  safe: 'SAFE',
  options: 'Options',
  advance_subscription: 'ASA',
};

export const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: '#ecfdf5', text: '#059669' },
  exited: { bg: '#fef2f2', text: '#dc2626' },
  written_off: { bg: '#fef2f2', text: '#dc2626' },
};
