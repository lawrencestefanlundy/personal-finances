'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { FinanceState } from '@/types/finance';
import { financeReducer, FinanceAction } from './financeReducer';
import { loadState, saveState } from '@/lib/storage';
import { seedData } from '@/data/seedData';

interface FinanceContextValue {
  state: FinanceState;
  dispatch: React.Dispatch<FinanceAction>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, seedData, (initial) => {
    const stored = loadState();
    return stored || initial;
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  return <FinanceContext.Provider value={{ state, dispatch }}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
