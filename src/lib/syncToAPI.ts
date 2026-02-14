import type { FinanceAction } from '@/context/financeReducer';

/**
 * Maps reducer actions to API calls. Called after each optimistic dispatch
 * to persist the change to the database.
 */
export function syncToAPI(action: FinanceAction): void {
  const run = async () => {
    try {
      switch (action.type) {
        // Cash positions
        case 'ADD_CASH_POSITION':
          await fetch('/api/cash-positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'UPDATE_CASH_POSITION':
          await fetch(`/api/cash-positions/${action.payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'DELETE_CASH_POSITION':
          await fetch(`/api/cash-positions/${action.payload}`, { method: 'DELETE' });
          break;

        // Income streams
        case 'ADD_INCOME_STREAM':
          await fetch('/api/income-streams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'UPDATE_INCOME_STREAM':
          await fetch(`/api/income-streams/${action.payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'DELETE_INCOME_STREAM':
          await fetch(`/api/income-streams/${action.payload}`, { method: 'DELETE' });
          break;

        // Expenses
        case 'ADD_EXPENSE':
          await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'UPDATE_EXPENSE':
          await fetch(`/api/expenses/${action.payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'DELETE_EXPENSE':
          await fetch(`/api/expenses/${action.payload}`, { method: 'DELETE' });
          break;

        // Assets
        case 'ADD_ASSET':
          await fetch('/api/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'UPDATE_ASSET':
          await fetch(`/api/assets/${action.payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'DELETE_ASSET':
          await fetch(`/api/assets/${action.payload}`, { method: 'DELETE' });
          break;

        // Liabilities
        case 'ADD_LIABILITY':
          await fetch('/api/liabilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'UPDATE_LIABILITY':
          await fetch(`/api/liabilities/${action.payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'DELETE_LIABILITY':
          await fetch(`/api/liabilities/${action.payload}`, { method: 'DELETE' });
          break;

        // Transactions
        case 'ADD_TRANSACTIONS':
          await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'DELETE_TRANSACTION':
          await fetch(`/api/transactions/${action.payload}`, { method: 'DELETE' });
          break;
        case 'CLEAR_TRANSACTIONS':
          // Full state reimport will handle this
          break;

        // Carry positions
        case 'ADD_CARRY_POSITION':
          await fetch('/api/carry-positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'UPDATE_CARRY_POSITION':
          await fetch(`/api/carry-positions/${action.payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'DELETE_CARRY_POSITION':
          await fetch(`/api/carry-positions/${action.payload}`, { method: 'DELETE' });
          break;

        // Scenarios
        case 'ADD_SCENARIO':
          await fetch('/api/scenarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'UPDATE_SCENARIO':
          await fetch(`/api/scenarios/${action.payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
        case 'DELETE_SCENARIO':
          await fetch(`/api/scenarios/${action.payload}`, { method: 'DELETE' });
          break;

        // Settings
        case 'SET_ACTIVE_SCENARIO':
          await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activeScenarioId: action.payload ?? '' }),
          });
          break;
        case 'UPDATE_SETTINGS':
          await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;

        // Full state operations — handled by /api/state POST
        case 'IMPORT_DATA':
        case 'RESET_DATA':
          await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.payload),
          });
          break;
      }
    } catch (err) {
      console.error(`Failed to sync action ${action.type} to API:`, err);
    }
  };

  run();
}
