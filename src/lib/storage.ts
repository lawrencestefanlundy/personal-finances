import { FinanceState } from '@/types/finance';

const STORAGE_KEY = 'finance-dashboard-state';

export function loadState(): FinanceState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FinanceState;
  } catch {
    return null;
  }
}

export function saveState(state: FinanceState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

export function exportStateAsJSON(state: FinanceState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance-dashboard-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importStateFromJSON(file: File): Promise<FinanceState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result as string) as FinanceState;
        if (!state.cashPositions || !state.incomeStreams || !state.expenses || !state.assets || !state.liabilities) {
          reject(new Error('Invalid finance data file'));
          return;
        }
        resolve(state);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
