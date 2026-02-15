'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
  ReactNode,
} from 'react';
import { FinanceState } from '@/types/finance';
import { financeReducer, FinanceAction } from './financeReducer';
import { syncToAPI } from '@/lib/syncToAPI';

const emptyState: FinanceState = {
  cashPositions: [],
  incomeStreams: [],
  expenses: [],
  assets: [],
  liabilities: [],
  transactions: [],
  carryPositions: [],
  scenarios: [],
  activeScenarioId: null,
  settings: {
    startMonth: '2026-02',
    projectionEndYear: 2053,
    birthYear: 1986,
    currency: 'GBP',
  },
  lastModified: '',
};

interface FinanceContextValue {
  state: FinanceState;
  dispatch: React.Dispatch<FinanceAction>;
  loading: boolean;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, emptyState);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Hydrate from API on mount (with retry for deployment transitions)
  useEffect(() => {
    let cancelled = false;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // ms

    async function loadState(attempt: number) {
      try {
        const res = await fetch('/api/state');
        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        if (cancelled) return;

        if (data && Array.isArray(data.cashPositions)) {
          dispatch({ type: 'IMPORT_DATA', payload: data as FinanceState });
        } else {
          console.error('API returned unexpected shape:', data);
          setError('Server returned invalid data. Please try refreshing.');
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error(`Failed to load state (attempt ${attempt}/${MAX_RETRIES}):`, err);

        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY));
          if (!cancelled) loadState(attempt + 1);
        } else {
          setError('Failed to connect to the server. Please try refreshing.');
          setLoading(false);
        }
      }
    }

    loadState(1);
    return () => {
      cancelled = true;
    };
  }, []);

  // Wrap dispatch to also sync to API (skip the initial IMPORT_DATA from hydration)
  const apiDispatch = useCallback(
    (action: FinanceAction) => {
      dispatch(action);
      if (!loading) {
        syncToAPI(action);
      }
    },
    [loading],
  );

  return (
    <FinanceContext.Provider value={{ state, dispatch: apiDispatch, loading }}>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-slate-500 mt-3 text-sm">Loading financial data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
