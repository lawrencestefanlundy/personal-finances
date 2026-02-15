import type { FinanceAction } from '@/context/financeReducer';

const RETRY_DELAY = 2000; // ms

/**
 * Maps reducer actions to API calls. Called after each optimistic dispatch
 * to persist the change to the database.
 *
 * Retries once on failure. On final failure, dispatches a 'sync-error'
 * CustomEvent on window so the UI can show a toast.
 */
export function syncToAPI(action: FinanceAction): void {
  run(action, 0);
}

async function run(action: FinanceAction, attempt: number): Promise<void> {
  try {
    await executeSync(action);
  } catch (err) {
    if (attempt < 1) {
      console.warn(`Sync failed for ${action.type}, retrying in ${RETRY_DELAY}ms...`, err);
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
      return run(action, attempt + 1);
    }
    console.error(`Sync failed for ${action.type} after ${attempt + 1} attempts:`, err);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sync-error', {
          detail: { action: action.type, error: String(err) },
        }),
      );
    }
  }
}

async function executeSync(action: FinanceAction): Promise<void> {
  switch (action.type) {
    // Cash positions
    case 'ADD_CASH_POSITION':
      await fetchOrThrow('/api/cash-positions', 'POST', action.payload);
      break;
    case 'UPDATE_CASH_POSITION':
      await fetchOrThrow(`/api/cash-positions/${action.payload.id}`, 'PUT', action.payload);
      break;
    case 'DELETE_CASH_POSITION':
      await fetchOrThrow(`/api/cash-positions/${action.payload}`, 'DELETE');
      break;

    // Income streams
    case 'ADD_INCOME_STREAM':
      await fetchOrThrow('/api/income-streams', 'POST', action.payload);
      break;
    case 'UPDATE_INCOME_STREAM':
      await fetchOrThrow(`/api/income-streams/${action.payload.id}`, 'PUT', action.payload);
      break;
    case 'DELETE_INCOME_STREAM':
      await fetchOrThrow(`/api/income-streams/${action.payload}`, 'DELETE');
      break;

    // Expenses
    case 'ADD_EXPENSE':
      await fetchOrThrow('/api/expenses', 'POST', action.payload);
      break;
    case 'UPDATE_EXPENSE':
      await fetchOrThrow(`/api/expenses/${action.payload.id}`, 'PUT', action.payload);
      break;
    case 'DELETE_EXPENSE':
      await fetchOrThrow(`/api/expenses/${action.payload}`, 'DELETE');
      break;

    // Assets
    case 'ADD_ASSET':
      await fetchOrThrow('/api/assets', 'POST', action.payload);
      break;
    case 'UPDATE_ASSET':
      await fetchOrThrow(`/api/assets/${action.payload.id}`, 'PUT', action.payload);
      break;
    case 'DELETE_ASSET':
      await fetchOrThrow(`/api/assets/${action.payload}`, 'DELETE');
      break;

    // Liabilities
    case 'ADD_LIABILITY':
      await fetchOrThrow('/api/liabilities', 'POST', action.payload);
      break;
    case 'UPDATE_LIABILITY':
      await fetchOrThrow(`/api/liabilities/${action.payload.id}`, 'PUT', action.payload);
      break;
    case 'DELETE_LIABILITY':
      await fetchOrThrow(`/api/liabilities/${action.payload}`, 'DELETE');
      break;

    // Transactions
    case 'ADD_TRANSACTIONS':
      await fetchOrThrow('/api/transactions', 'POST', action.payload);
      break;
    case 'DELETE_TRANSACTION':
      await fetchOrThrow(`/api/transactions/${action.payload}`, 'DELETE');
      break;
    case 'CLEAR_TRANSACTIONS':
      // Full state reimport will handle this
      break;

    // Carry positions
    case 'ADD_CARRY_POSITION':
      await fetchOrThrow('/api/carry-positions', 'POST', action.payload);
      break;
    case 'UPDATE_CARRY_POSITION':
      await fetchOrThrow(`/api/carry-positions/${action.payload.id}`, 'PUT', action.payload);
      break;
    case 'DELETE_CARRY_POSITION':
      await fetchOrThrow(`/api/carry-positions/${action.payload}`, 'DELETE');
      break;

    // Scenarios
    case 'ADD_SCENARIO':
      await fetchOrThrow('/api/scenarios', 'POST', action.payload);
      break;
    case 'UPDATE_SCENARIO':
      await fetchOrThrow(`/api/scenarios/${action.payload.id}`, 'PUT', action.payload);
      break;
    case 'DELETE_SCENARIO':
      await fetchOrThrow(`/api/scenarios/${action.payload}`, 'DELETE');
      break;

    // Settings
    case 'SET_ACTIVE_SCENARIO':
      await fetchOrThrow('/api/settings', 'PUT', { activeScenarioId: action.payload ?? '' });
      break;
    case 'UPDATE_SETTINGS':
      await fetchOrThrow('/api/settings', 'PUT', action.payload);
      break;

    // Full state operations — handled by /api/state POST
    case 'IMPORT_DATA':
    case 'RESET_DATA':
      await fetchOrThrow('/api/state', 'POST', action.payload);
      break;
  }
}

async function fetchOrThrow(url: string, method: string, body?: unknown): Promise<void> {
  const opts: RequestInit = {
    method,
    ...(body != null && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  };
  const res = await fetch(url, opts);
  if (!res.ok) {
    throw new Error(`${method} ${url} returned ${res.status}: ${res.statusText}`);
  }
}
