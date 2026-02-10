'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { CashPosition } from '@/types/finance';
import StatCard from '@/components/StatCard';
import { computeMonthlySnapshots, computeAverageMonthlyBurn, computeMonthsOfRunway } from '@/lib/calculations';
import { computeYearlyProjections } from '@/lib/projections';
import { formatCurrency, formatMonth } from '@/lib/formatters';
import { expenseCategories } from '@/data/categories';
import { PencilIcon, TrashIcon, PlusIcon } from '@/components/ui/Icons';
import SlidePanel from '@/components/ui/SlidePanel';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import CashPositionForm from '@/components/forms/CashPositionForm';
import ProviderLogo from '@/components/ui/ProviderLogo';
import TransactionList from '@/components/TransactionList';

export default function OverviewPage() {
  const { state, dispatch } = useFinance();

  const snapshots = useMemo(() => computeMonthlySnapshots(state, 12), [state]);
  const projections = useMemo(() => computeYearlyProjections(state), [state]);

  const liquidCash = state.cashPositions
    .filter((cp) => cp.category === 'cash' || cp.category === 'savings' || cp.category === 'crypto')
    .reduce((sum, cp) => sum + cp.balance, 0);
  const netWealth = projections[0]?.netWealth ?? 0;
  const avgBurn = useMemo(() => computeAverageMonthlyBurn(snapshots), [snapshots]);
  const runway = useMemo(() => computeMonthsOfRunway(liquidCash, snapshots), [liquidCash, snapshots]);
  const currentSnapshot = snapshots[0];

  // CRUD state
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingCash, setEditingCash] = useState<CashPosition | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const openAdd = () => { setEditingCash(undefined); setPanelOpen(true); };
  const openEdit = (cp: CashPosition) => { setEditingCash(cp); setPanelOpen(true); };
  const closePanel = () => { setPanelOpen(false); setEditingCash(undefined); };

  const handleDelete = () => {
    if (deleteTarget) {
      dispatch({ type: 'DELETE_CASH_POSITION', payload: deleteTarget.id });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Financial snapshot as of {formatMonth(state.settings.startMonth)}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Net Wealth"
          value={formatCurrency(netWealth)}
          subtitle="Total assets minus liabilities"
          color="purple"
        />
        <StatCard
          title="Liquid Cash"
          value={formatCurrency(liquidCash)}
          subtitle="Cash + savings + crypto"
          color="green"
        />
        <StatCard
          title="Avg Monthly Expenses"
          value={formatCurrency(avgBurn)}
          subtitle="12-month average"
          color="amber"
        />
        <StatCard
          title="Months of Runway"
          value={runway === Infinity ? '∞' : `${Math.round(runway)}`}
          subtitle={runway === Infinity ? 'Net positive cash flow' : 'At current burn rate'}
          color="blue"
        />
      </div>

      {/* Cash Positions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Cash Positions</h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {state.cashPositions.map((cp) => (
            <div key={cp.id} className="group relative bg-slate-50 rounded-lg p-4">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(cp)}
                  className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                  title="Edit"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: cp.id, name: cp.name })}
                  className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <ProviderLogo provider={cp.provider} size={20} />
                <p className="text-sm text-slate-500">{cp.name}</p>
              </div>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(cp.balance)}</p>
              {cp.interestRate > 0 && (
                <p className="text-xs text-slate-400">{(cp.interestRate * 100).toFixed(1)}% interest</p>
              )}
            </div>
          ))}
        </div>
        {state.transactions.length > 0 && (
          <TransactionList transactions={state.transactions} />
        )}
      </div>

      {/* Next 3 Months */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Next 3 Months</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Month</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Income</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Expenses</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Net</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Balance</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.slice(0, 3).map((s) => {
                const isLow = s.runningBalance < 10000;
                return (
                  <tr
                    key={s.month}
                    className={`border-b border-slate-100 ${
                      isLow ? 'bg-red-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 text-sm text-slate-900 font-medium">
                      {formatMonth(s.month)}
                      {isLow && (
                        <span className="ml-2 text-xs text-red-600 font-medium">Low balance</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-emerald-600 font-medium">
                      {formatCurrency(s.totalIncome)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-red-600 font-medium">
                      {formatCurrency(s.totalExpenses)}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-medium ${
                      s.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(s.netCashFlow)}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-bold ${
                      isLow ? 'text-red-700' : 'text-slate-900'
                    }`}>
                      {formatCurrency(s.runningBalance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Expense Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">This Month&apos;s Expenses by Category</h2>
        {currentSnapshot && (
          <div className="space-y-2">
            {Object.entries(
              state.expenses.reduce((acc, expense) => {
                const amount = currentSnapshot.expenseBreakdown[expense.id] || 0;
                if (amount > 0) {
                  acc[expense.category] = (acc[expense.category] || 0) + amount;
                }
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const meta = expenseCategories[category as keyof typeof expenseCategories];
                return (
                  <div key={category} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: meta?.color || '#6b7280' }}
                      />
                      <span className="text-sm text-slate-700">{meta?.label || category}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(amount)}</span>
                  </div>
                );
              })}
            <div className="pt-2 border-t border-slate-200 flex justify-between">
              <span className="text-sm font-semibold text-slate-900">Total</span>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(currentSnapshot.totalExpenses)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Slide Panel for Cash Position Form */}
      <SlidePanel
        open={panelOpen}
        onClose={closePanel}
        title={editingCash ? 'Edit Cash Position' : 'Add Cash Position'}
      >
        <CashPositionForm existing={editingCash} onClose={closePanel} />
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
