'use client';

import { useRef, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types/finance';
import { exportStateAsJSON, importStateFromJSON, clearState } from '@/lib/storage';
import { seedData } from '@/data/seedData';
import { formatCurrency } from '@/lib/formatters';

export default function SettingsPage() {
  const { state, dispatch } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const txFileInputRef = useRef<HTMLInputElement>(null);
  const [txImportStatus, setTxImportStatus] = useState<string | null>(null);
  const [showGrowthRates, setShowGrowthRates] = useState(false);

  const handleExport = () => {
    exportStateAsJSON(state);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importStateFromJSON(file);
      dispatch({ type: 'IMPORT_DATA', payload: imported });
      alert('Data imported successfully');
    } catch (err: unknown) {
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTransactionImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const transactions: Transaction[] = Array.isArray(data) ? data : data.transactions;
      if (!Array.isArray(transactions)) {
        throw new Error('Expected an array of transactions');
      }
      dispatch({ type: 'ADD_TRANSACTIONS', payload: transactions });
      setTxImportStatus(`Imported ${transactions.length} transactions (duplicates skipped)`);
    } catch (err: unknown) {
      setTxImportStatus(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    if (txFileInputRef.current) {
      txFileInputRef.current.value = '';
    }
  };

  const handleClearTransactions = () => {
    if (confirm('Are you sure? This will remove all imported transactions.')) {
      dispatch({ type: 'CLEAR_TRANSACTIONS' });
      setTxImportStatus(null);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure? This will reset all data to the original spreadsheet values.')) {
      clearState();
      dispatch({ type: 'RESET_DATA', payload: seedData });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage data, import/export, and preferences</p>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">General</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Birth Year</p>
              <p className="text-xs text-slate-400">Used to calculate age in projections</p>
            </div>
            <input
              type="number"
              value={state.settings.birthYear}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  payload: { birthYear: parseInt(e.target.value) || 1986 },
                })
              }
              className="w-24 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Projection End Year</p>
              <p className="text-xs text-slate-400">How far to forecast wealth projections</p>
            </div>
            <input
              type="number"
              value={state.settings.projectionEndYear}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  payload: { projectionEndYear: parseInt(e.target.value) || 2053 },
                })
              }
              className="w-24 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Start Month</p>
              <p className="text-xs text-slate-400">Cash flow forecast start date</p>
            </div>
            <input
              type="month"
              value={state.settings.startMonth}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  payload: { startMonth: e.target.value },
                })
              }
              className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Growth Rates */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Growth Rates</h2>
            <p className="text-xs text-slate-400">Annual growth assumptions used in projections</p>
          </div>
          <button
            onClick={() => setShowGrowthRates(!showGrowthRates)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              showGrowthRates ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {showGrowthRates ? 'Hide' : 'Show'}
          </button>
        </div>
        {showGrowthRates && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {state.assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{asset.name}</p>
                  <p className="text-xs text-slate-400">{formatCurrency(asset.currentValue)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={(asset.annualGrowthRate * 100).toFixed(1)}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) / 100;
                      if (!isNaN(rate)) {
                        dispatch({
                          type: 'UPDATE_ASSET',
                          payload: { ...asset, annualGrowthRate: rate },
                        });
                      }
                    }}
                    className="w-16 px-2 py-1 text-right text-sm border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Data Management</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Export Data</p>
              <p className="text-xs text-slate-400">Download all data as JSON</p>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Export JSON
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Import Data</p>
              <p className="text-xs text-slate-400">Restore from a previously exported JSON file</p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
              >
                Import JSON
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="text-sm font-medium text-red-600">Reset to Defaults</p>
              <p className="text-xs text-slate-400">
                Restore all data to original spreadsheet values
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors border border-red-200"
            >
              Reset Data
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Import */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Transaction Import</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Import Transactions</p>
              <p className="text-xs text-slate-400">
                Import a JSON file from the Monzo email parser script
              </p>
            </div>
            <div>
              <input
                ref={txFileInputRef}
                type="file"
                accept=".json"
                onChange={handleTransactionImport}
                className="hidden"
              />
              <button
                onClick={() => txFileInputRef.current?.click()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Import Transactions
              </button>
            </div>
          </div>

          {txImportStatus && (
            <p
              className={`text-xs ${txImportStatus.startsWith('Import failed') ? 'text-red-500' : 'text-emerald-600'}`}
            >
              {txImportStatus}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Stored Transactions: {state.transactions.length}
              </p>
              <p className="text-xs text-slate-400">
                {state.transactions.length > 0
                  ? `Latest: ${new Date(
                      [...state.transactions].sort(
                        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
                      )[0]?.date,
                    ).toLocaleDateString('en-GB')}`
                  : 'No transactions imported yet'}
              </p>
            </div>
            {state.transactions.length > 0 && (
              <button
                onClick={handleClearTransactions}
                className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors border border-red-200"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">About</h2>
        <div className="space-y-2 text-sm text-slate-500">
          <p>Last modified: {new Date(state.lastModified).toLocaleString()}</p>
          <p>Cash positions: {state.cashPositions.length}</p>
          <p>Income streams: {state.incomeStreams.length}</p>
          <p>Expenses: {state.expenses.length}</p>
          <p>Assets: {state.assets.length}</p>
          <p>Liabilities: {state.liabilities.length}</p>
          <p>Transactions: {state.transactions.length}</p>
          <p>Data stored in browser localStorage</p>
        </div>
      </div>
    </div>
  );
}
