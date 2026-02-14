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

  // Hydrate from API on mount
  useEffect(() => {
    fetch('/api/state')
      .then((res) => res.json())
      .then((data: FinanceState) => {
        dispatch({ type: 'IMPORT_DATA', payload: data });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load state from API:', err);
        setLoading(false);
      });
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
