'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { CashPosition, IncomeStream, Expense } from '@/types/finance';
import { computeMonthlySnapshots } from '@/lib/calculations';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import { expenseCategories } from '@/data/categories';
import CashFlowChart from '@/components/charts/CashFlowChart';
import IncomeExpensePie from '@/components/charts/IncomeExpensePie';
import EditableCell from '@/components/EditableCell';
import { PencilIcon, TrashIcon, PlusIcon } from '@/components/ui/Icons';
import SlidePanel from '@/components/ui/SlidePanel';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import CashPositionForm from '@/components/forms/CashPositionForm';
import IncomeStreamForm from '@/components/forms/IncomeStreamForm';
import ExpenseForm from '@/components/forms/ExpenseForm';
import ProviderLogo from '@/components/ui/ProviderLogo';

type PanelType = 'cashPosition' | 'income' | 'expense' | null;

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

  // CRUD state
  const [panelType, setPanelType] = useState<PanelType>(null);
  const [editingCash, setEditingCash] = useState<CashPosition | undefined>(undefined);
  const [editingIncome, setEditingIncome] = useState<IncomeStream | undefined>(undefined);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'cashPosition' | 'income' | 'expense' } | null>(null);

  const closePanel = () => { setPanelType(null); setEditingCash(undefined); setEditingIncome(undefined); setEditingExpense(undefined); };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const actionMap = {
      cashPosition: 'DELETE_CASH_POSITION' as const,
      income: 'DELETE_INCOME_STREAM' as const,
      expense: 'DELETE_EXPENSE' as const,
    };
    dispatch({ type: actionMap[deleteTarget.type], payload: deleteTarget.id });
    setDeleteTarget(null);
  };

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
                <th className="text-center py-2 px-3 font-semibold text-slate-600 w-16">
                  Actions
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
                <td colSpan={2} className="py-2 px-3 font-bold text-slate-700">
                  Cash Positions
                </td>
                <td className="py-2 px-3 text-center">
                  <button
                    onClick={() => { setEditingCash(undefined); setPanelType('cashPosition'); }}
                    className="p-1 rounded hover:bg-slate-200 text-blue-600"
                    title="Add Cash Position"
                  >
                    <PlusIcon />
                  </button>
                </td>
                <td colSpan={snapshots.length}></td>
              </tr>
              {state.cashPositions.map((cp) => (
                <tr key={cp.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                  <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <ProviderLogo provider={cp.provider} size={18} />
                      <span>{cp.name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-slate-400">Cash</td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingCash(cp); setPanelType('cashPosition'); }}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                        title="Edit"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: cp.id, name: cp.name, type: 'cashPosition' })}
                        className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
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
                <td colSpan={2} className="py-2 px-3 font-bold text-emerald-700">
                  Earnings
                </td>
                <td className="py-2 px-3 text-center">
                  <button
                    onClick={() => { setEditingIncome(undefined); setPanelType('income'); }}
                    className="p-1 rounded hover:bg-emerald-100 text-emerald-600"
                    title="Add Income Stream"
                  >
                    <PlusIcon />
                  </button>
                </td>
                <td colSpan={snapshots.length}></td>
              </tr>
              {state.incomeStreams.map((stream) => (
                <tr key={stream.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                  <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <ProviderLogo provider={stream.provider} size={18} />
                      <span>{stream.name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-slate-400 capitalize">{stream.frequency}</td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingIncome(stream); setPanelType('income'); }}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                        title="Edit"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: stream.id, name: stream.name, type: 'income' })}
                        className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
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
                <td className="py-2 px-3"></td>
                {snapshots.map((s) => (
                  <td key={s.month} className="py-2 px-3 text-right text-emerald-700">
                    {formatCurrency(s.totalIncome)}
                  </td>
                ))}
              </tr>

              {/* Expenses by Category */}
              {Object.entries(expensesByCategory).map(([category, expenses], catIdx) => {
                const meta = expenseCategories[category as keyof typeof expenseCategories];
                return (
                  <tbody key={category}>
                    <tr style={{ backgroundColor: meta?.bgColor || '#f9fafb' }}>
                      <td colSpan={2} className="py-2 px-3 font-bold" style={{ color: meta?.color }}>
                        {meta?.label || category}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {catIdx === 0 && (
                          <button
                            onClick={() => { setEditingExpense(undefined); setPanelType('expense'); }}
                            className="p-1 rounded hover:bg-red-100 text-red-500"
                            title="Add Expense"
                          >
                            <PlusIcon />
                          </button>
                        )}
                      </td>
                      <td colSpan={snapshots.length}></td>
                    </tr>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                        <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white">
                          <div className="flex items-center gap-2">
                            <ProviderLogo provider={expense.provider} size={18} />
                            <span>
                              {expense.name}
                              {expense.provider && (
                                <span className="text-slate-400 text-xs ml-1">({expense.provider})</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-slate-400 capitalize text-xs">{expense.frequency}</td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingExpense(expense); setPanelType('expense'); }}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                              title="Edit"
                            >
                              <PencilIcon />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: expense.id, name: expense.name, type: 'expense' })}
                              className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                              title="Delete"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
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

      {/* Slide Panels */}
      <SlidePanel
        open={panelType === 'cashPosition'}
        onClose={closePanel}
        title={editingCash ? 'Edit Cash Position' : 'Add Cash Position'}
      >
        <CashPositionForm existing={editingCash} onClose={closePanel} />
      </SlidePanel>

      <SlidePanel
        open={panelType === 'income'}
        onClose={closePanel}
        title={editingIncome ? 'Edit Income Stream' : 'Add Income Stream'}
      >
        <IncomeStreamForm existing={editingIncome} onClose={closePanel} />
      </SlidePanel>

      <SlidePanel
        open={panelType === 'expense'}
        onClose={closePanel}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
      >
        <ExpenseForm existing={editingExpense} onClose={closePanel} />
      </SlidePanel>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={deleteTarget !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        itemName={deleteTarget?.name ?? ''}
      />
    </div>
  );
}
