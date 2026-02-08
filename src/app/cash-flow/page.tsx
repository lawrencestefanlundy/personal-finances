'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { computeMonthlySnapshots } from '@/lib/calculations';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import { expenseCategories } from '@/data/categories';
import CashFlowChart from '@/components/charts/CashFlowChart';
import IncomeExpensePie from '@/components/charts/IncomeExpensePie';
import EditableCell from '@/components/EditableCell';

export default function CashFlowPage() {
  const { state, dispatch } = useFinance();
  const [showMonths, setShowMonths] = useState(12);

  const snapshots = useMemo(
    () => computeMonthlySnapshots(state, showMonths),
    [state, showMonths]
  );

  const selectedSnapshot = snapshots[0];

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const groups: Record<string, typeof state.expenses> = {};
    for (const expense of state.expenses) {
      if (!groups[expense.category]) {
        groups[expense.category] = [];
      }
      groups[expense.category].push(expense);
    }
    return groups;
  }, [state.expenses]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cash Flow</h1>
          <p className="text-sm text-slate-500 mt-1">Monthly income, expenses, and running balance</p>
        </div>
        <div className="flex gap-2">
          {[6, 12, 24, 50].map((n) => (
            <button
              key={n}
              onClick={() => setShowMonths(n)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                showMonths === n
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {n}m
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Income vs Expenses</h2>
          <CashFlowChart snapshots={snapshots} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Expense Breakdown</h2>
          {selectedSnapshot && (
            <IncomeExpensePie snapshot={selectedSnapshot} expenses={state.expenses} />
          )}
        </div>
      </div>

      {/* Full Monthly Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Forecast</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-600 sticky left-0 bg-white min-w-[180px]">
                  Item
                </th>
                <th className="text-left py-2 px-3 font-semibold text-slate-600 min-w-[100px]">
                  Category
                </th>
                {snapshots.map((s) => (
                  <th key={s.month} className="text-right py-2 px-3 font-semibold text-slate-600 min-w-[90px]">
                    {formatMonth(s.month)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Cash Positions Section */}
              <tr className="bg-slate-50">
                <td colSpan={2 + snapshots.length} className="py-2 px-3 font-bold text-slate-700">
                  Cash Positions
                </td>
              </tr>
              {state.cashPositions.map((cp) => (
                <tr key={cp.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white">{cp.name}</td>
                  <td className="py-2 px-3 text-slate-400">Cash</td>
                  <td className="py-2 px-3 text-right text-slate-900">
                    <EditableCell
                      value={cp.balance}
                      onSave={(value) =>
                        dispatch({ type: 'UPDATE_CASH_POSITION', payload: { ...cp, balance: value } })
                      }
                    />
                  </td>
                  {snapshots.slice(1).map((s) => (
                    <td key={s.month} className="py-2 px-3 text-right text-slate-300">-</td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold">
                <td className="py-2 px-3 text-slate-900 sticky left-0 bg-slate-50">Total Cash</td>
                <td className="py-2 px-3"></td>
                <td className="py-2 px-3 text-right text-slate-900">
                  {formatCurrency(state.cashPositions.reduce((s, cp) => s + cp.balance, 0))}
                </td>
                {snapshots.slice(1).map((s) => (
                  <td key={s.month} className="py-2 px-3 text-right text-slate-300">-</td>
                ))}
              </tr>

              {/* Earnings Section */}
              <tr className="bg-emerald-50">
                <td colSpan={2 + snapshots.length} className="py-2 px-3 font-bold text-emerald-700">
                  Earnings
                </td>
              </tr>
              {state.incomeStreams.map((stream) => (
                <tr key={stream.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white">{stream.name}</td>
                  <td className="py-2 px-3 text-slate-400 capitalize">{stream.frequency}</td>
                  {snapshots.map((s) => {
                    const amount = s.incomeBreakdown[stream.id] || 0;
                    return (
                      <td key={s.month} className="py-2 px-3 text-right">
                        {amount > 0 ? (
                          <span className="text-emerald-600">{formatCurrency(amount)}</span>
                        ) : (
                          <span className="text-slate-200">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-b border-slate-200 bg-emerald-50 font-semibold">
                <td className="py-2 px-3 text-emerald-800 sticky left-0 bg-emerald-50">Total Income</td>
                <td className="py-2 px-3"></td>
                {snapshots.map((s) => (
                  <td key={s.month} className="py-2 px-3 text-right text-emerald-700">
                    {formatCurrency(s.totalIncome)}
                  </td>
                ))}
              </tr>

              {/* Expenses by Category */}
              {Object.entries(expensesByCategory).map(([category, expenses]) => {
                const meta = expenseCategories[category as keyof typeof expenseCategories];
                return (
                  <tbody key={category}>
                    <tr style={{ backgroundColor: meta?.bgColor || '#f9fafb' }}>
                      <td colSpan={2 + snapshots.length} className="py-2 px-3 font-bold" style={{ color: meta?.color }}>
                        {meta?.label || category}
                      </td>
                    </tr>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white">
                          {expense.name}
                          {expense.provider && (
                            <span className="text-slate-400 text-xs ml-1">({expense.provider})</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-400 capitalize text-xs">{expense.frequency}</td>
                        {snapshots.map((s) => {
                          const amount = s.expenseBreakdown[expense.id] || 0;
                          return (
                            <td key={s.month} className="py-2 px-3 text-right">
                              {amount > 0 ? (
                                <span className="text-red-600">{formatCurrency(amount)}</span>
                              ) : (
                                <span className="text-slate-200">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                );
              })}

              {/* Total Expenses */}
              <tr className="border-b border-slate-200 bg-red-50 font-semibold">
                <td className="py-2 px-3 text-red-800 sticky left-0 bg-red-50">Total Expenses</td>
                <td className="py-2 px-3"></td>
                {snapshots.map((s) => (
                  <td key={s.month} className="py-2 px-3 text-right text-red-700">
                    {formatCurrency(s.totalExpenses)}
                  </td>
                ))}
              </tr>

              {/* Net Cash Flow */}
              <tr className="border-b border-slate-200 bg-blue-50 font-bold">
                <td className="py-3 px-3 text-blue-900 sticky left-0 bg-blue-50">Net Cash Flow</td>
                <td className="py-3 px-3"></td>
                {snapshots.map((s) => (
                  <td key={s.month} className={`py-3 px-3 text-right ${
                    s.netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(s.netCashFlow)}
                  </td>
                ))}
              </tr>

              {/* Running Balance */}
              <tr className="bg-slate-100 font-bold">
                <td className="py-3 px-3 text-slate-900 sticky left-0 bg-slate-100">Running Balance</td>
                <td className="py-3 px-3"></td>
                {snapshots.map((s) => (
                  <td key={s.month} className={`py-3 px-3 text-right ${
                    s.runningBalance >= 0 ? 'text-slate-900' : 'text-red-700'
                  }`}>
                    {formatCurrency(s.runningBalance)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
