import { FinanceState, CashPosition, IncomeStream, Expense, Asset, Liability, Scenario } from '@/types/finance';

export type FinanceAction =
  | { type: 'UPDATE_CASH_POSITION'; payload: CashPosition }
  | { type: 'UPDATE_INCOME_STREAM'; payload: IncomeStream }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'UPDATE_ASSET'; payload: Asset }
  | { type: 'UPDATE_LIABILITY'; payload: Liability }
  | { type: 'ADD_SCENARIO'; payload: Scenario }
  | { type: 'UPDATE_SCENARIO'; payload: Scenario }
  | { type: 'DELETE_SCENARIO'; payload: string }
  | { type: 'SET_ACTIVE_SCENARIO'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<FinanceState['settings']> }
  | { type: 'IMPORT_DATA'; payload: FinanceState }
  | { type: 'RESET_DATA'; payload: FinanceState };

function updateTimestamp(state: FinanceState): FinanceState {
  return { ...state, lastModified: new Date().toISOString() };
}

export function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'UPDATE_CASH_POSITION':
      return updateTimestamp({
        ...state,
        cashPositions: state.cashPositions.map((cp) =>
          cp.id === action.payload.id ? action.payload : cp
        ),
      });

    case 'UPDATE_INCOME_STREAM':
      return updateTimestamp({
        ...state,
        incomeStreams: state.incomeStreams.map((is) =>
          is.id === action.payload.id ? action.payload : is
        ),
      });

    case 'ADD_EXPENSE':
      return updateTimestamp({
        ...state,
        expenses: [...state.expenses, action.payload],
      });

    case 'UPDATE_EXPENSE':
      return updateTimestamp({
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      });

    case 'DELETE_EXPENSE':
      return updateTimestamp({
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload),
      });

    case 'UPDATE_ASSET':
      return updateTimestamp({
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      });

    case 'UPDATE_LIABILITY':
      return updateTimestamp({
        ...state,
        liabilities: state.liabilities.map((l) =>
          l.id === action.payload.id ? action.payload : l
        ),
      });

    case 'ADD_SCENARIO':
      return updateTimestamp({
        ...state,
        scenarios: [...state.scenarios, action.payload],
      });

    case 'UPDATE_SCENARIO':
      return updateTimestamp({
        ...state,
        scenarios: state.scenarios.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      });

    case 'DELETE_SCENARIO':
      return updateTimestamp({
        ...state,
        scenarios: state.scenarios.filter((s) => s.id !== action.payload),
        activeScenarioId: state.activeScenarioId === action.payload ? null : state.activeScenarioId,
      });

    case 'SET_ACTIVE_SCENARIO':
      return updateTimestamp({
        ...state,
        activeScenarioId: action.payload,
      });

    case 'UPDATE_SETTINGS':
      return updateTimestamp({
        ...state,
        settings: { ...state.settings, ...action.payload },
      });

    case 'IMPORT_DATA':
      return updateTimestamp(action.payload);

    case 'RESET_DATA':
      return updateTimestamp(action.payload);

    default:
      return state;
  }
}
