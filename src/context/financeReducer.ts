import { FinanceState, CashPosition, IncomeStream, Expense, Asset, Liability, Scenario, Transaction } from '@/types/finance';

export type FinanceAction =
  | { type: 'ADD_CASH_POSITION'; payload: CashPosition }
  | { type: 'UPDATE_CASH_POSITION'; payload: CashPosition }
  | { type: 'DELETE_CASH_POSITION'; payload: string }
  | { type: 'ADD_INCOME_STREAM'; payload: IncomeStream }
  | { type: 'UPDATE_INCOME_STREAM'; payload: IncomeStream }
  | { type: 'DELETE_INCOME_STREAM'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: Asset }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'ADD_LIABILITY'; payload: Liability }
  | { type: 'UPDATE_LIABILITY'; payload: Liability }
  | { type: 'DELETE_LIABILITY'; payload: string }
  | { type: 'ADD_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'CLEAR_TRANSACTIONS' }
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
    case 'ADD_CASH_POSITION':
      return updateTimestamp({
        ...state,
        cashPositions: [...state.cashPositions, action.payload],
      });

    case 'UPDATE_CASH_POSITION':
      return updateTimestamp({
        ...state,
        cashPositions: state.cashPositions.map((cp) =>
          cp.id === action.payload.id ? action.payload : cp
        ),
      });

    case 'DELETE_CASH_POSITION':
      return updateTimestamp({
        ...state,
        cashPositions: state.cashPositions.filter((cp) => cp.id !== action.payload),
      });

    case 'ADD_INCOME_STREAM':
      return updateTimestamp({
        ...state,
        incomeStreams: [...state.incomeStreams, action.payload],
      });

    case 'UPDATE_INCOME_STREAM':
      return updateTimestamp({
        ...state,
        incomeStreams: state.incomeStreams.map((is) =>
          is.id === action.payload.id ? action.payload : is
        ),
      });

    case 'DELETE_INCOME_STREAM':
      return updateTimestamp({
        ...state,
        incomeStreams: state.incomeStreams.filter((is) => is.id !== action.payload),
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

    case 'ADD_ASSET':
      return updateTimestamp({
        ...state,
        assets: [...state.assets, action.payload],
      });

    case 'UPDATE_ASSET':
      return updateTimestamp({
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      });

    case 'DELETE_ASSET':
      return updateTimestamp({
        ...state,
        assets: state.assets.filter((a) => a.id !== action.payload),
      });

    case 'ADD_LIABILITY':
      return updateTimestamp({
        ...state,
        liabilities: [...state.liabilities, action.payload],
      });

    case 'UPDATE_LIABILITY':
      return updateTimestamp({
        ...state,
        liabilities: state.liabilities.map((l) =>
          l.id === action.payload.id ? action.payload : l
        ),
      });

    case 'DELETE_LIABILITY':
      return updateTimestamp({
        ...state,
        liabilities: state.liabilities.filter((l) => l.id !== action.payload),
      });

    case 'ADD_TRANSACTIONS': {
      // Merge new transactions, deduplicating by emailId where present
      const existingEmailIds = new Set(
        state.transactions.filter((t) => t.emailId).map((t) => t.emailId)
      );
      const newTransactions = action.payload.filter(
        (t) => !t.emailId || !existingEmailIds.has(t.emailId)
      );
      return updateTimestamp({
        ...state,
        transactions: [...state.transactions, ...newTransactions],
      });
    }

    case 'DELETE_TRANSACTION':
      return updateTimestamp({
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      });

    case 'CLEAR_TRANSACTIONS':
      return updateTimestamp({
        ...state,
        transactions: [],
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
