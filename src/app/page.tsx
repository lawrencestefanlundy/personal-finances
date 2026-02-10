'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { CashPosition, IncomeStream, Expense } from '@/types/finance';
import { computeMonthlySnapshots } from '@/lib/calculations';
import { computeYearlyProjections } from '@/lib/projections';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import { expenseCategories, assetCategories } from '@/data/categories';
import EditableCell from '@/components/EditableCell';
import { PencilIcon, TrashIcon, PlusIcon } from '@/components/ui/Icons';
import SlidePanel from '@/components/ui/SlidePanel';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import CashPositionForm from '@/components/forms/CashPositionForm';
import IncomeStreamForm from '@/components/forms/IncomeStreamForm';
import ExpenseForm from '@/components/forms/ExpenseForm';
import ProviderLogo from '@/components/ui/ProviderLogo';
import TransactionList from '@/components/TransactionList';

type PanelType = 'cashPosition' | 'income' | 'expense' | null;

export default function OverviewPage() {
  const { state, dispatch } = useFinance();
  const [showMonths, setShowMonths] = useState(12);

  const snapshots = useMemo(
    () => computeMonthlySnapshots(state, showMonths),
    [state, showMonths]
  );
  const projections = useMemo(() => computeYearlyProjections(state), [state]);

  const liquidCash = state.cashPositions
    .filter((cp) => cp.category === 'cash' || cp.category === 'savings' || cp.category === 'crypto')
    .reduce((sum, cp) => sum + cp.balance, 0);
  const netWealth = projections[0]?.netWealth ?? 0;
  const totalAssets = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLiabilities = state.liabilities.reduce((sum, l) => sum + l.currentBalance, 0);

  // Group assets by category for net wealth breakdown
  const assetTotalsByCategory = useMemo(() => {
    const totals: Record<string, { label: string; total: number; color: string }> = {};
    for (const asset of state.assets) {
      const meta = assetCategories[asset.category as keyof typeof assetCategories];
      if (!totals[asset.category]) {
        totals[asset.category] = { label: meta?.label ?? asset.category, total: 0, color: meta?.color ?? '#6b7280' };
      }
      totals[asset.category].total += asset.currentValue;
    }
    return Object.values(totals).sort((a, b) => b.total - a.total);
  }, [state.assets]);

  // Group expenses by category for forecast table
  const expensesByCategory = useMemo(() => {
    const groups: Record<string, typeof state.expenses> = {};
    for (const expense of state.expenses) {
      if (!groups[expense.category]) groups[expense.category] = [];
      groups[expense.category].push(expense);
    }
    return groups;
  }, [state.expenses]);

  // Category subtotals per month
  const categorySubtotals = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    for (const [category, expenses] of Object.entries(expensesByCategory)) {
      result[category] = {};
      for (const s of snapshots) {
        let total = 0;
        for (const expense of expenses) {
          total += s.expenseBreakdown[expense.id] || 0;
        }
        result[category][s.month] = total;
      }
    }
    return result;
  }, [expensesByCategory, snapshots]);

  // Collapsible section state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    cash: true,
    earnings: true,
  });
  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const chevron = (isExpanded: boolean) => (
    <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Financial snapshot as of {formatMonth(state.settings.startMonth)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Wealth Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-sm font-medium text-slate-500">Net Wealth</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{formatCurrency(netWealth)}</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600 font-medium">Total Assets</span>
              <span className="font-semibold text-slate-900">{formatCurrency(totalAssets)}</span>
            </div>
            {assetTotalsByCategory.map((cat) => (
              <div key={cat.label} className="flex items-center justify-between text-sm pl-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-500">{cat.label}</span>
                </div>
                <span className="text-slate-700">{formatCurrency(cat.total)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
              <span className="text-red-600 font-medium">Total Liabilities</span>
              <span className="font-semibold text-red-600">−{formatCurrency(totalLiabilities)}</span>
            </div>
          </div>
        </div>

        {/* Liquid Cash Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Liquid Cash</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{formatCurrency(liquidCash)}</p>
            </div>
            <button
              onClick={() => { setEditingCash(undefined); setPanelType('cashPosition'); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
              Add
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {state.cashPositions.map((cp) => (
              <div key={cp.id} className="flex items-center justify-between text-sm group">
                <div className="flex items-center gap-2">
                  <ProviderLogo provider={cp.provider} size={16} />
                  <span className="text-slate-600">{cp.name}</span>
                  {cp.interestRate > 0 && (
                    <span className="text-xs text-slate-400">{(cp.interestRate * 100).toFixed(1)}%</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{formatCurrency(cp.balance)}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingCash(cp); setPanelType('cashPosition'); }}
                      className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                      title="Edit"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: cp.id, name: cp.name, type: 'cashPosition' })}
                      className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {state.transactions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <TransactionList transactions={state.transactions} />
            </div>
          )}
        </div>
      </div>

      {/* Monthly Forecast — Primary Feature */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Monthly Forecast</h2>
          <div className="flex gap-2">
            {[6, 12, 24].map((n) => (
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
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-600 sticky left-0 bg-white min-w-[200px] z-10">
                  Item
                </th>
                {snapshots.map((s) => (
                  <th key={s.month} className="text-right py-2 px-3 font-semibold text-slate-600 min-w-[100px]">
                    {formatMonth(s.month)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* === Cash Positions Section === */}
              <tr
                className="bg-slate-50 cursor-pointer hover:bg-slate-100"
                onClick={() => toggleSection('cash')}
              >
                <td className="py-2 px-3 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10">
                  <div className="flex items-center gap-2">
                    {chevron(!!expanded['cash'])}
                    <span>Cash Positions</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingCash(undefined); setPanelType('cashPosition'); }}
                      className="p-0.5 rounded hover:bg-slate-200 text-blue-600 ml-auto"
                      title="Add Cash Position"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </td>
                <td className="py-2 px-3 text-right font-semibold text-slate-700">
                  {formatCurrency(state.cashPositions.reduce((s, cp) => s + cp.balance, 0))}
                </td>
                {snapshots.slice(1).map((s) => (
                  <td key={s.month} className="py-2 px-3 text-right text-slate-300">-</td>
                ))}
              </tr>
              {expanded['cash'] && state.cashPositions.map((cp) => (
                <tr key={cp.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                  <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white pl-8 z-10">
                    <div className="flex items-center gap-2">
                      <ProviderLogo provider={cp.provider} size={18} />
                      <span>{cp.name}</span>
                      <div className="flex gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
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

              {/* === Earnings Section === */}
              <tr
                className="bg-emerald-50 cursor-pointer hover:bg-emerald-100"
                onClick={() => toggleSection('earnings')}
              >
                <td className="py-2 px-3 font-bold text-emerald-700 sticky left-0 bg-emerald-50 z-10">
                  <div className="flex items-center gap-2">
                    {chevron(!!expanded['earnings'])}
                    <span>Earnings</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingIncome(undefined); setPanelType('income'); }}
                      className="p-0.5 rounded hover:bg-emerald-100 text-emerald-600 ml-auto"
                      title="Add Income Stream"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </td>
                {snapshots.map((s) => (
                  <td key={s.month} className="py-2 px-3 text-right font-semibold text-emerald-700">
                    {s.totalIncome > 0 ? formatCurrency(s.totalIncome) : <span className="text-slate-200">-</span>}
                  </td>
                ))}
              </tr>
              {expanded['earnings'] && state.incomeStreams.map((stream) => (
                <tr key={stream.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                  <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white pl-8 z-10">
                    <div className="flex items-center gap-2">
                      <ProviderLogo provider={stream.provider} size={18} />
                      <span>{stream.name}</span>
                      <div className="flex gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
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

              {/* === Expense Categories === */}
              {Object.entries(expensesByCategory).map(([category, expenses], catIdx) => {
                const meta = expenseCategories[category as keyof typeof expenseCategories];
                const sectionKey = `expense-${category}`;
                const isExpanded = expanded[sectionKey];

                return (
                  <tbody key={category}>
                    <tr
                      style={{ backgroundColor: meta?.bgColor || '#f9fafb' }}
                      className="cursor-pointer"
                      onClick={() => toggleSection(sectionKey)}
                    >
                      <td className="py-2 px-3 font-bold sticky left-0 z-10" style={{ color: meta?.color, backgroundColor: meta?.bgColor || '#f9fafb' }}>
                        <div className="flex items-center gap-2">
                          {chevron(!!isExpanded)}
                          <span>{meta?.label || category}</span>
                          {catIdx === 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingExpense(undefined); setPanelType('expense'); }}
                              className="p-0.5 rounded hover:bg-red-100 text-red-500 ml-auto"
                              title="Add Expense"
                            >
                              <PlusIcon />
                            </button>
                          )}
                        </div>
                      </td>
                      {snapshots.map((s) => {
                        const subtotal = categorySubtotals[category]?.[s.month] || 0;
                        return (
                          <td key={s.month} className="py-2 px-3 text-right font-medium" style={{ color: meta?.color }}>
                            {subtotal > 0 ? formatCurrency(subtotal) : <span className="text-slate-200">-</span>}
                          </td>
                        );
                      })}
                    </tr>
                    {isExpanded && expenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                        <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white pl-8 z-10">
                          <div className="flex items-center gap-2">
                            <ProviderLogo provider={expense.provider} size={18} />
                            <span>
                              {expense.name}
                              {expense.provider && (
                                <span className="text-slate-400 text-xs ml-1">({expense.provider})</span>
                              )}
                            </span>
                            <div className="flex gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
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
                <td className="py-2 px-3 text-red-800 sticky left-0 bg-red-50 z-10">Total Expenses</td>
                {snapshots.map((s) => (
                  <td key={s.month} className="py-2 px-3 text-right text-red-700">
                    {formatCurrency(s.totalExpenses)}
                  </td>
                ))}
              </tr>

              {/* Net Cash Flow */}
              <tr className="border-b border-slate-200 bg-blue-50 font-bold">
                <td className="py-3 px-3 text-blue-900 sticky left-0 bg-blue-50 z-10">Net Cash Flow</td>
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
                <td className="py-3 px-3 text-slate-900 sticky left-0 bg-slate-100 z-10">Running Balance</td>
                {snapshots.map((s) => (
                  <td key={s.month} className={`py-3 px-3 text-right ${
                    s.runningBalance < 10000 ? 'text-red-700' : 'text-slate-900'
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
