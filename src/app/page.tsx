'use client';

import React, { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  CashPosition,
  IncomeStream,
  Expense,
  Asset,
  EmailUpdate,
  Liability,
  CarryPosition,
  PortfolioCompany,
} from '@/types/finance';
import StatCard from '@/components/StatCard';
import { computeMonthlySnapshots } from '@/lib/calculations';
import { computeYearlyProjections } from '@/lib/projections';
import {
  computeCarryScenarios,
  computePortfolioMetrics,
  computeTotalPersonalCarryAtMultiple,
} from '@/lib/carryCalculations';
import { formatCurrency, formatMonth, formatPercent } from '@/lib/formatters';
import { expenseCategories, assetCategories } from '@/data/categories';
import {
  formatCostBasis,
  formatMoic,
  instrumentLabels,
  statusStyles,
} from '@/lib/investmentFormatters';
import WealthChart from '@/components/charts/WealthChart';
import LiabilityChart from '@/components/charts/LiabilityChart';
import EditableCell from '@/components/EditableCell';
import { PencilIcon, TrashIcon, PlusIcon } from '@/components/ui/Icons';
import SlidePanel from '@/components/ui/SlidePanel';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import CashPositionForm from '@/components/forms/CashPositionForm';
import IncomeStreamForm from '@/components/forms/IncomeStreamForm';
import ExpenseForm from '@/components/forms/ExpenseForm';
import AssetForm from '@/components/forms/AssetForm';
import LiabilityForm from '@/components/forms/LiabilityForm';
import CarryPositionForm from '@/components/forms/CarryPositionForm';
import PortfolioCompanyForm from '@/components/forms/PortfolioCompanyForm';
import ProviderLogo from '@/components/ui/ProviderLogo';
import TransactionList from '@/components/TransactionList';

const CARRY_MULTIPLES = [2.0, 3.0, 5.0];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#10b981', bg: '#ecfdf5' },
  marked_up: { label: 'Marked Up', color: '#8b5cf6', bg: '#f5f3ff' },
  exited: { label: 'Exited', color: '#3b82f6', bg: '#eff6ff' },
  written_off: { label: 'Written Off', color: '#ef4444', bg: '#fef2f2' },
};

const LIABILITY_TYPE_LABELS: Record<string, string> = {
  mortgage: 'Mortgage',
  student_loan: 'Student Loan',
  credit_card: 'Credit Card',
  other: 'Other',
};

type PanelType =
  | 'cashPosition'
  | 'income'
  | 'expense'
  | 'asset'
  | 'liability'
  | 'carryFund'
  | 'carryCompany'
  | null;

export default function DashboardPage() {
  const { state, dispatch } = useFinance();

  // ─── Cash Flow ──────────────────────────────────────────────────────────────
  const [showMonths, setShowMonths] = useState(12);
  const snapshots = useMemo(() => computeMonthlySnapshots(state, showMonths), [state, showMonths]);

  // ─── Projections ────────────────────────────────────────────────────────────
  const projections = useMemo(() => computeYearlyProjections(state), [state]);
  const currentYear = projections[0];
  const netWealth = currentYear?.netWealth ?? 0;

  const liquidCash = state.cashPositions
    .filter(
      (cp) =>
        cp.category === 'cash' ||
        cp.category === 'savings' ||
        cp.category === 'isa' ||
        cp.category === 'crypto',
    )
    .reduce((sum, cp) => sum + cp.balance, 0);

  // ─── Asset computations ─────────────────────────────────────────────────────
  const totalAssets = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLiabilities = state.liabilities
    .filter((l) => l.type !== 'student_loan')
    .reduce((sum, l) => sum + l.currentBalance, 0);
  const liquidAssets = state.assets
    .filter((a) => a.isLiquid)
    .reduce((sum, a) => sum + a.currentValue, 0);
  const illiquidAssets = totalAssets - liquidAssets;

  const assetsByCategory = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    for (const asset of state.assets) {
      if (asset.category === 'angel' || asset.category === 'fund') continue;
      if (!groups[asset.category]) groups[asset.category] = [];
      groups[asset.category].push(asset);
    }
    return groups;
  }, [state.assets]);

  const angelAssets = state.assets.filter((a) => a.category === 'angel');
  const fundAssets = state.assets.filter((a) => a.category === 'fund');
  const angelTotal = angelAssets.reduce((sum, a) => sum + a.currentValue, 0);
  const angelCostTotal = angelAssets.reduce((sum, a) => sum + (a.costBasis ?? 0), 0);
  const activeCount = angelAssets.filter((a) => a.status === 'active' || !a.status).length;
  const exitedCount = angelAssets.filter((a) => a.status === 'exited').length;
  const writtenOffCount = angelAssets.filter((a) => a.status === 'written_off').length;

  const liabilitiesByType = useMemo(() => {
    const groups: Record<string, Liability[]> = {};
    for (const liability of state.liabilities) {
      if (!groups[liability.type]) groups[liability.type] = [];
      groups[liability.type].push(liability);
    }
    return groups;
  }, [state.liabilities]);

  // Milestone projections
  const milestones = useMemo(() => {
    const targets = [currentYear?.age, 45, 50, 55, 60, 65];
    const result = targets
      .map((age) => projections.find((p) => p.age === age))
      .filter((p): p is (typeof projections)[0] => p !== undefined);
    const final = projections[projections.length - 1];
    if (final && (!result.length || result[result.length - 1].year !== final.year)) {
      result.push(final);
    }
    const seen = new Set<number>();
    return result.filter((p) => {
      if (seen.has(p.year)) return false;
      seen.add(p.year);
      return true;
    });
  }, [projections, currentYear]);

  // ─── Carry computations ─────────────────────────────────────────────────────
  const totalCarryAt2x = useMemo(
    () => computeTotalPersonalCarryAtMultiple(state.carryPositions, 2.0),
    [state.carryPositions],
  );
  const totalCarryAt3x = useMemo(
    () => computeTotalPersonalCarryAtMultiple(state.carryPositions, 3.0),
    [state.carryPositions],
  );
  const totalCarryAt5x = useMemo(
    () => computeTotalPersonalCarryAtMultiple(state.carryPositions, 5.0),
    [state.carryPositions],
  );

  // ─── Cash Flow expense grouping ────────────────────────────────────────────
  const expensesByCategory = useMemo(() => {
    const groups: Record<string, typeof state.expenses> = {};
    for (const expense of state.expenses) {
      if (!groups[expense.category]) groups[expense.category] = [];
      groups[expense.category].push(expense);
    }
    return groups;
  }, [state.expenses]);

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

  // ─── Collapsible state ──────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Angel email expansion state
  const [expandedAngel, setExpandedAngel] = useState<string | null>(null);
  const parsedEmailUpdates = useMemo(() => {
    const map: Record<string, EmailUpdate[]> = {};
    for (const asset of state.assets) {
      if (asset.category === 'angel' && asset.emailUpdates) {
        try {
          map[asset.id] = JSON.parse(asset.emailUpdates) as EmailUpdate[];
        } catch {
          map[asset.id] = [];
        }
      }
    }
    return map;
  }, [state.assets]);

  // ─── CRUD state ─────────────────────────────────────────────────────────────
  const [panelType, setPanelType] = useState<PanelType>(null);
  const [editingCash, setEditingCash] = useState<CashPosition | undefined>(undefined);
  const [editingIncome, setEditingIncome] = useState<IncomeStream | undefined>(undefined);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [editingLiability, setEditingLiability] = useState<Liability | undefined>(undefined);
  const [editingFund, setEditingFund] = useState<CarryPosition | undefined>(undefined);
  const [companyContext, setCompanyContext] = useState<CarryPosition | null>(null);
  const [editingCompany, setEditingCompany] = useState<PortfolioCompany | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type:
      | 'cashPosition'
      | 'income'
      | 'expense'
      | 'asset'
      | 'liability'
      | 'carryFund'
      | 'carryCompany';
    extra?: CarryPosition;
  } | null>(null);

  const closePanel = () => {
    setPanelType(null);
    setEditingCash(undefined);
    setEditingIncome(undefined);
    setEditingExpense(undefined);
    setEditingAsset(undefined);
    setEditingLiability(undefined);
    setEditingFund(undefined);
    setCompanyContext(null);
    setEditingCompany(undefined);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    switch (deleteTarget.type) {
      case 'cashPosition':
        dispatch({ type: 'DELETE_CASH_POSITION', payload: deleteTarget.id });
        break;
      case 'income':
        dispatch({ type: 'DELETE_INCOME_STREAM', payload: deleteTarget.id });
        break;
      case 'expense':
        dispatch({ type: 'DELETE_EXPENSE', payload: deleteTarget.id });
        break;
      case 'asset':
        dispatch({ type: 'DELETE_ASSET', payload: deleteTarget.id });
        break;
      case 'liability':
        dispatch({ type: 'DELETE_LIABILITY', payload: deleteTarget.id });
        break;
      case 'carryFund':
        dispatch({ type: 'DELETE_CARRY_POSITION', payload: deleteTarget.id });
        break;
      case 'carryCompany':
        if (deleteTarget.extra) {
          const updatedCompanies = deleteTarget.extra.portfolioCompanies.filter(
            (c) => c.id !== deleteTarget.id,
          );
          dispatch({
            type: 'UPDATE_CARRY_POSITION',
            payload: { ...deleteTarget.extra, portfolioCompanies: updatedCompanies },
          });
        }
        break;
    }
    setDeleteTarget(null);
  };

  const chevron = (isExpanded: boolean) => (
    <svg
      className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className="space-y-16">
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: OVERVIEW
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="overview" className="scroll-mt-20 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview as of {formatMonth(state.settings.startMonth)}
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Net Wealth"
            value={formatCurrency(netWealth)}
            subtitle="Total assets minus liabilities"
            color="purple"
          />
          <StatCard
            title="Liquid Cash"
            value={formatCurrency(liquidCash)}
            subtitle="Cash + savings + ISA + crypto"
            color="green"
          />
        </div>

        {/* Cash Positions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Cash Positions</h2>
            <button
              onClick={() => {
                setEditingCash(undefined);
                setPanelType('cashPosition');
              }}
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
                    onClick={() => {
                      setEditingCash(cp);
                      setPanelType('cashPosition');
                    }}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                    title="Edit"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    onClick={() =>
                      setDeleteTarget({ id: cp.id, name: cp.name, type: 'cashPosition' })
                    }
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
                  <p className="text-xs text-slate-400">
                    {(cp.interestRate * 100).toFixed(1)}% interest
                  </p>
                )}
              </div>
            ))}
          </div>
          {state.transactions.length > 0 && <TransactionList transactions={state.transactions} />}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: CASH FLOW
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="cash-flow" className="scroll-mt-20 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cash Flow</h1>
            <p className="text-sm text-slate-500 mt-1">Income, expenses, and running balance</p>
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

        {/* Monthly Forecast Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Forecast</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-600 sticky left-0 bg-white min-w-[200px]">
                    Item
                  </th>
                  {snapshots.map((s) => (
                    <th
                      key={s.month}
                      className="text-right py-2 px-3 font-semibold text-slate-600 min-w-[90px]"
                    >
                      {formatMonth(s.month)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Cash Positions */}
                <tr
                  className="bg-slate-50 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSection('cash')}
                >
                  <td className="py-2 px-3 font-bold text-slate-700 sticky left-0 bg-slate-50">
                    <div className="flex items-center gap-2">
                      {chevron(!!expanded['cash'])}
                      <span>Cash Positions</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-700">
                    {formatCurrency(state.cashPositions.reduce((s, cp) => s + cp.balance, 0))}
                  </td>
                  {snapshots.slice(1).map((s) => (
                    <td key={s.month} className="py-2 px-3 text-right text-slate-300">
                      -
                    </td>
                  ))}
                </tr>
                {expanded['cash'] &&
                  state.cashPositions.map((cp) => (
                    <tr key={cp.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                      <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white pl-8">
                        <div className="flex items-center gap-2">
                          <ProviderLogo provider={cp.provider} size={18} />
                          <span>{cp.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-900">
                        <EditableCell
                          value={cp.balance}
                          onSave={(value) =>
                            dispatch({
                              type: 'UPDATE_CASH_POSITION',
                              payload: { ...cp, balance: value },
                            })
                          }
                        />
                      </td>
                      {snapshots.slice(1).map((s) => (
                        <td key={s.month} className="py-2 px-3 text-right text-slate-300">
                          -
                        </td>
                      ))}
                    </tr>
                  ))}

                {/* Earnings */}
                <tr
                  className="bg-emerald-50 cursor-pointer hover:bg-emerald-100"
                  onClick={() => toggleSection('earnings')}
                >
                  <td className="py-2 px-3 font-bold text-emerald-700 sticky left-0 bg-emerald-50">
                    <div className="flex items-center gap-2">
                      {chevron(!!expanded['earnings'])}
                      <span>Earnings</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingIncome(undefined);
                          setPanelType('income');
                        }}
                        className="p-0.5 rounded hover:bg-emerald-100 text-emerald-600 ml-auto"
                        title="Add Income Stream"
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  </td>
                  {snapshots.map((s) => (
                    <td
                      key={s.month}
                      className="py-2 px-3 text-right font-semibold text-emerald-700"
                    >
                      {s.totalIncome > 0 ? (
                        formatCurrency(s.totalIncome)
                      ) : (
                        <span className="text-slate-200">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                {expanded['earnings'] &&
                  state.incomeStreams.map((stream) => (
                    <tr
                      key={stream.id}
                      className="border-b border-slate-50 hover:bg-slate-50 group"
                    >
                      <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white pl-8">
                        <div className="flex items-center gap-2">
                          <ProviderLogo provider={stream.provider} size={18} />
                          <span>{stream.name}</span>
                          <div className="flex gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingIncome(stream);
                                setPanelType('income');
                              }}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                              title="Edit"
                            >
                              <PencilIcon />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  id: stream.id,
                                  name: stream.name,
                                  type: 'income',
                                })
                              }
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

                {/* Expense Categories */}
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
                        <td
                          className="py-2 px-3 font-bold sticky left-0"
                          style={{
                            color: meta?.color,
                            backgroundColor: meta?.bgColor || '#f9fafb',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {chevron(!!isExpanded)}
                            <span>{meta?.label || category}</span>
                            {catIdx === 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingExpense(undefined);
                                  setPanelType('expense');
                                }}
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
                            <td
                              key={s.month}
                              className="py-2 px-3 text-right font-medium"
                              style={{ color: meta?.color }}
                            >
                              {subtotal > 0 ? (
                                formatCurrency(subtotal)
                              ) : (
                                <span className="text-slate-200">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      {isExpanded &&
                        expenses.map((expense) => (
                          <tr
                            key={expense.id}
                            className="border-b border-slate-50 hover:bg-slate-50 group"
                          >
                            <td className="py-2 px-3 text-slate-900 sticky left-0 bg-white pl-8">
                              <div className="flex items-center gap-2">
                                <ProviderLogo provider={expense.provider} size={18} />
                                <span>
                                  {expense.name}
                                  {expense.provider && (
                                    <span className="text-slate-400 text-xs ml-1">
                                      ({expense.provider})
                                    </span>
                                  )}
                                </span>
                                <div className="flex gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setEditingExpense(expense);
                                      setPanelType('expense');
                                    }}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                                    title="Edit"
                                  >
                                    <PencilIcon />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setDeleteTarget({
                                        id: expense.id,
                                        name: expense.name,
                                        type: 'expense',
                                      })
                                    }
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
                  <td className="py-2 px-3 text-red-800 sticky left-0 bg-red-50">Total Expenses</td>
                  {snapshots.map((s) => (
                    <td key={s.month} className="py-2 px-3 text-right text-red-700">
                      {formatCurrency(s.totalExpenses)}
                    </td>
                  ))}
                </tr>

                {/* Net Cash Flow */}
                <tr className="border-b border-slate-200 bg-blue-50 font-bold">
                  <td className="py-3 px-3 text-blue-900 sticky left-0 bg-blue-50">
                    Net Cash Flow
                  </td>
                  {snapshots.map((s) => (
                    <td
                      key={s.month}
                      className={`py-3 px-3 text-right ${s.netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
                    >
                      {formatCurrency(s.netCashFlow)}
                    </td>
                  ))}
                </tr>

                {/* Running Balance */}
                <tr className="bg-slate-100 font-bold">
                  <td className="py-3 px-3 text-slate-900 sticky left-0 bg-slate-100">
                    Running Balance
                  </td>
                  {snapshots.map((s) => (
                    <td
                      key={s.month}
                      className={`py-3 px-3 text-right ${s.runningBalance >= 0 ? 'text-slate-900' : 'text-red-700'}`}
                    >
                      {formatCurrency(s.runningBalance)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: ASSETS (merged net-worth + assets + wealth + carry)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="assets" className="scroll-mt-20 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assets</h1>
          <p className="text-sm text-slate-500 mt-1">
            Balance sheet, investments, carry, and long-term projections ({projections[0]?.year}–
            {projections[projections.length - 1]?.year})
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Net Worth"
            value={formatCurrency(netWealth)}
            subtitle={`Age ${currentYear?.age}`}
            color="purple"
          />
          <StatCard
            title="Total Assets"
            value={formatCurrency(totalAssets)}
            subtitle={`${state.assets.length} positions`}
            color="green"
          />
          <StatCard
            title="Total Liabilities"
            value={formatCurrency(totalLiabilities)}
            subtitle={`${state.liabilities.length} obligations`}
            color="amber"
          />
          <StatCard
            title="Liquid / Illiquid"
            value={
              totalAssets > 0
                ? `${Math.round((liquidAssets / totalAssets) * 100)}% / ${Math.round((illiquidAssets / totalAssets) * 100)}%`
                : '—'
            }
            subtitle={`${formatCurrency(liquidAssets)} accessible`}
            color="blue"
          />
        </div>

        {/* Net Worth Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Net Worth Over Time</h2>
          <WealthChart projections={projections} />
        </div>

        {/* Balance Sheet */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Balance Sheet</h2>
            <button
              onClick={() => {
                setEditingAsset(undefined);
                setPanelType('asset');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Asset
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-t-lg">
              <span className="font-bold text-emerald-800">Assets</span>
              <span className="font-bold text-emerald-800">{formatCurrency(totalAssets)}</span>
            </div>

            {Object.entries(assetsByCategory).map(([category, assets]) => {
              const meta = assetCategories[category as keyof typeof assetCategories];
              const subtotal = assets.reduce((sum, a) => sum + a.currentValue, 0);
              const sectionKey = `asset-${category}`;
              const isExpanded = expanded[sectionKey];
              return (
                <div key={category}>
                  <div
                    className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-slate-50"
                    onClick={() => toggleSection(sectionKey)}
                  >
                    <div className="flex items-center gap-2">
                      {chevron(!!isExpanded)}
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: meta?.bgColor, color: meta?.color }}
                      >
                        {meta?.label ?? category}
                      </span>
                      <span className="text-sm text-slate-500">({assets.length})</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {isExpanded &&
                    assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between py-1.5 px-3 pl-10 hover:bg-slate-50 group"
                      >
                        <div className="flex items-center gap-2">
                          <ProviderLogo provider={asset.provider} size={16} />
                          <span className="text-sm text-slate-700">{asset.name}</span>
                          <span className="text-xs text-slate-400">
                            {formatPercent(asset.annualGrowthRate)}
                          </span>
                          {asset.unlockYear && (
                            <span className="text-xs text-slate-400">
                              unlock {asset.unlockYear}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {formatCurrency(asset.currentValue)}
                          </span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingAsset(asset);
                                setPanelType('asset');
                              }}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                              title="Edit"
                            >
                              <PencilIcon />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({ id: asset.id, name: asset.name, type: 'asset' })
                              }
                              className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                              title="Delete"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              );
            })}

            {/* Fund carry line */}
            {fundAssets.length > 0 && (
              <div
                className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-slate-50"
                onClick={() => toggleSection('funds')}
              >
                <div className="flex items-center gap-2">
                  {chevron(!!expanded['funds'])}
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: assetCategories.fund?.bgColor,
                      color: assetCategories.fund?.color,
                    }}
                  >
                    Fund Carry
                  </span>
                  <span className="text-sm text-slate-500">({fundAssets.length})</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(fundAssets.reduce((sum, a) => sum + a.currentValue, 0))}
                </span>
              </div>
            )}
            {expanded['funds'] &&
              fundAssets.map((fund) => (
                <div
                  key={fund.id}
                  className="flex items-center justify-between py-1.5 px-3 pl-10 hover:bg-slate-50 group"
                >
                  <div className="flex items-center gap-2">
                    <ProviderLogo provider={fund.provider} size={16} />
                    <span className="text-sm text-slate-700">{fund.name}</span>
                    <span className="text-xs text-slate-400">
                      {formatPercent(fund.annualGrowthRate)}
                    </span>
                    {fund.unlockYear && (
                      <span className="text-xs text-slate-400">unlock {fund.unlockYear}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {formatCurrency(fund.currentValue)}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingAsset(fund);
                          setPanelType('asset');
                        }}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                        title="Edit"
                      >
                        <PencilIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {/* Angel line */}
            {angelAssets.length > 0 && (
              <div
                className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-slate-50"
                onClick={() => toggleSection('angels')}
              >
                <div className="flex items-center gap-2">
                  {chevron(!!expanded['angels'])}
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: assetCategories.angel?.bgColor,
                      color: assetCategories.angel?.color,
                    }}
                  >
                    Angel
                  </span>
                  <span className="text-sm text-slate-500">
                    ({angelAssets.length}) · {activeCount} active · {exitedCount} exited ·{' '}
                    {writtenOffCount} written off
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(angelTotal)}
                </span>
              </div>
            )}

            {/* Liabilities */}
            <div className="flex items-center justify-between py-2 px-3 bg-red-50 mt-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-800">Liabilities</span>
                <button
                  onClick={() => {
                    setEditingLiability(undefined);
                    setPanelType('liability');
                  }}
                  className="p-0.5 rounded hover:bg-red-100 text-red-500"
                  title="Add Liability"
                >
                  <PlusIcon />
                </button>
              </div>
              <span className="font-bold text-red-800">{formatCurrency(totalLiabilities)}</span>
            </div>
            {Object.entries(liabilitiesByType).map(([type, liabilities]) => {
              const subtotal = liabilities.reduce((sum, l) => sum + l.currentBalance, 0);
              const sectionKey = `liability-${type}`;
              const isExpanded = expanded[sectionKey];
              return (
                <div key={type}>
                  <div
                    className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-slate-50"
                    onClick={() => toggleSection(sectionKey)}
                  >
                    <div className="flex items-center gap-2">
                      {chevron(!!isExpanded)}
                      <span className="text-sm font-medium text-slate-700">
                        {LIABILITY_TYPE_LABELS[type] ?? type}
                      </span>
                      <span className="text-sm text-slate-500">({liabilities.length})</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {isExpanded &&
                    liabilities.map((liability) => (
                      <div
                        key={liability.id}
                        className="flex items-center justify-between py-1.5 px-3 pl-10 hover:bg-slate-50 group"
                      >
                        <div className="flex items-center gap-2">
                          <ProviderLogo provider={liability.provider} size={16} />
                          <span className="text-sm text-slate-700">{liability.name}</span>
                          <span className="text-xs text-slate-400">
                            {formatPercent(liability.interestRate)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatCurrency(liability.monthlyPayment)}/mo
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(liability.currentBalance)}
                          </span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingLiability(liability);
                                setPanelType('liability');
                              }}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                              title="Edit"
                            >
                              <PencilIcon />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  id: liability.id,
                                  name: liability.name,
                                  type: 'liability',
                                })
                              }
                              className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                              title="Delete"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              );
            })}

            {/* Net Worth total */}
            <div className="flex items-center justify-between py-3 px-3 bg-purple-50 rounded-b-lg mt-2 border-t-2 border-purple-200">
              <span className="font-bold text-purple-900">Net Worth</span>
              <span className="font-bold text-purple-900 text-lg">{formatCurrency(netWealth)}</span>
            </div>
          </div>
        </div>

        {/* Angel Investments Table */}
        {angelAssets.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Angel Investments</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {formatCurrency(angelCostTotal)} deployed ·{' '}
                  {angelCostTotal > 0 ? `${(angelTotal / angelCostTotal).toFixed(2)}x` : '—'}{' '}
                  portfolio MOIC
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingAsset(undefined);
                  setPanelType('asset');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Investment
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Name</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Instrument</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">
                      Cost Basis
                    </th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">
                      Current Value
                    </th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">MOIC</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-600">
                      Tax Relief
                    </th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-600">Date</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-600">Status</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-600 w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {angelAssets.map((asset) => {
                    const emails = parsedEmailUpdates[asset.id];
                    const hasEmails = emails && emails.length > 0;
                    const isAngelExpanded = expandedAngel === asset.id;
                    return (
                      <React.Fragment key={asset.id}>
                        <tr
                          className={`border-b border-slate-50 hover:bg-slate-50 group ${hasEmails ? 'cursor-pointer' : ''}`}
                          onClick={() =>
                            hasEmails && setExpandedAngel(isAngelExpanded ? null : asset.id)
                          }
                        >
                          <td className="py-2 px-3 font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              {hasEmails && (
                                <span className="text-slate-400 flex-shrink-0">
                                  {chevron(isAngelExpanded)}
                                </span>
                              )}
                              <ProviderLogo provider={asset.provider} size={18} />
                              <div>
                                <span>{asset.name}</span>
                                {asset.platform && (
                                  <span className="ml-1.5 text-xs text-slate-400">
                                    via {asset.platform}
                                  </span>
                                )}
                                {hasEmails && (
                                  <span className="ml-1.5 text-xs text-slate-400">
                                    ({emails.length} emails)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            {asset.instrument ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                {instrumentLabels[asset.instrument] ?? asset.instrument}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {formatCostBasis(asset.costBasis, asset.costCurrency)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-900">
                            {formatCurrency(asset.currentValue)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span
                              className={
                                asset.costBasis &&
                                asset.costBasis > 0 &&
                                asset.currentValue / asset.costBasis >= 1
                                  ? 'text-emerald-600 font-medium'
                                  : 'text-red-500 font-medium'
                              }
                            >
                              {formatMoic(asset.currentValue, asset.costBasis)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {asset.taxScheme ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${asset.taxScheme === 'SEIS' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}
                              >
                                {asset.taxScheme} Eligible
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                Not Eligible
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center text-xs text-slate-500">
                            {asset.investmentDate
                              ? new Date(asset.investmentDate).toLocaleDateString('en-GB', {
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {asset.status ? (
                              <span
                                className="inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                                style={{
                                  backgroundColor: statusStyles[asset.status]?.bg ?? '#f1f5f9',
                                  color: statusStyles[asset.status]?.text ?? '#475569',
                                }}
                              >
                                {asset.status === 'written_off' ? 'Written Off' : asset.status}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAsset(asset);
                                  setPanelType('asset');
                                }}
                                className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                                title="Edit"
                              >
                                <PencilIcon />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget({
                                    id: asset.id,
                                    name: asset.name,
                                    type: 'asset',
                                  });
                                }}
                                className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                                title="Delete"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isAngelExpanded && hasEmails && (
                          <tr>
                            <td
                              colSpan={9}
                              className="bg-slate-50 px-6 py-3 border-b border-slate-100"
                            >
                              <div className="max-h-64 overflow-y-auto space-y-2">
                                {emails.slice(0, 10).map((email, i) => (
                                  <div
                                    key={i}
                                    className="flex gap-3 text-xs border-b border-slate-100 pb-2 last:border-0"
                                  >
                                    <div className="flex-shrink-0 w-20 text-slate-400">
                                      {new Date(email.date).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-slate-700 truncate">
                                        {email.subject}
                                      </div>
                                      <div className="text-slate-400 truncate">
                                        {email.from} — {email.snippet}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="py-2 px-3 text-slate-900">Total</td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3 text-right text-slate-600">
                      {formatCostBasis(angelCostTotal, 'GBP')}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-900">
                      {formatCurrency(angelTotal)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      <span
                        className={
                          angelCostTotal > 0 && angelTotal / angelCostTotal >= 1
                            ? 'text-emerald-600'
                            : 'text-red-500'
                        }
                      >
                        {angelCostTotal > 0 ? `${(angelTotal / angelCostTotal).toFixed(2)}x` : '—'}
                      </span>
                    </td>
                    <td colSpan={4} className="py-2 px-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Carry Positions ── */}
        {state.carryPositions.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Carry Positions</h2>
              <button
                onClick={() => {
                  setEditingFund(undefined);
                  setPanelType('carryFund');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Fund
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Personal Carry @2x"
                value={formatCurrency(totalCarryAt2x)}
                subtitle="Across all funds"
                color="blue"
              />
              <StatCard
                title="Personal Carry @3x"
                value={formatCurrency(totalCarryAt3x)}
                subtitle="Across all funds"
                color="green"
              />
              <StatCard
                title="Personal Carry @5x"
                value={formatCurrency(totalCarryAt5x)}
                subtitle="Across all funds"
                color="purple"
              />
            </div>

            {state.carryPositions.map((cp) => (
              <FundSection
                key={cp.id}
                carryPosition={cp}
                onEditFund={() => {
                  setEditingFund(cp);
                  setPanelType('carryFund');
                }}
                onDeleteFund={() =>
                  setDeleteTarget({ id: cp.id, name: cp.fundName, type: 'carryFund' })
                }
                onAddCompany={() => {
                  setCompanyContext(cp);
                  setEditingCompany(undefined);
                  setPanelType('carryCompany');
                }}
                onEditCompany={(company) => {
                  setCompanyContext(cp);
                  setEditingCompany(company);
                  setPanelType('carryCompany');
                }}
                onDeleteCompany={(company) =>
                  setDeleteTarget({
                    id: company.id,
                    name: company.name,
                    type: 'carryCompany',
                    extra: cp,
                  })
                }
              />
            ))}

            {/* Combined Carry Summary */}
            {state.carryPositions.length > 1 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Combined Carry Summary
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 font-semibold text-slate-600">
                          Multiple
                        </th>
                        {state.carryPositions.map((cp) => (
                          <th
                            key={cp.id}
                            className="text-right py-2 px-3 font-semibold text-slate-600"
                          >
                            {cp.fundName}
                          </th>
                        ))}
                        <th className="text-right py-2 px-3 font-semibold text-slate-900">
                          Total Personal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {CARRY_MULTIPLES.map((m) => {
                        const perFund = state.carryPositions.map((cp) => {
                          const scenarios = computeCarryScenarios(cp, [m]);
                          return scenarios[0];
                        });
                        const totalPersonal = perFund.reduce(
                          (s, sc) => s + (sc?.personalCarry ?? 0),
                          0,
                        );
                        return (
                          <tr key={m} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-900">
                              {m.toFixed(1)}x
                            </td>
                            {perFund.map((sc, i) => (
                              <td key={i} className="py-2 px-3 text-right text-slate-600">
                                {formatCurrency(sc?.personalCarry ?? 0)}
                              </td>
                            ))}
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">
                              {formatCurrency(totalPersonal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Liability Paydown Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Liability Paydown</h2>
          <LiabilityChart projections={projections} liabilities={state.liabilities} />
        </div>

        {/* Milestone Projections */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Milestone Projections</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Year</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-600">Age</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">
                    Total Assets
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Liabilities</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Net Wealth</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Liquid</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((p) => (
                  <tr key={p.year} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-900">{p.year}</td>
                    <td className="py-2 px-3 text-center text-slate-500">{p.age}</td>
                    <td className="py-2 px-3 text-right text-slate-900">
                      {formatCurrency(p.totalAssets)}
                    </td>
                    <td className="py-2 px-3 text-right text-red-600">
                      {formatCurrency(p.totalLiabilities)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-purple-700">
                      {formatCurrency(p.netWealth)}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-600">
                      {formatCurrency(p.liquidAssets)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SLIDE PANELS
          ═══════════════════════════════════════════════════════════════════════ */}
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
      <SlidePanel
        open={panelType === 'asset'}
        onClose={closePanel}
        title={editingAsset ? 'Edit Asset' : 'Add Asset'}
      >
        <AssetForm existing={editingAsset} onClose={closePanel} />
      </SlidePanel>
      <SlidePanel
        open={panelType === 'liability'}
        onClose={closePanel}
        title={editingLiability ? 'Edit Liability' : 'Add Liability'}
      >
        <LiabilityForm existing={editingLiability} onClose={closePanel} />
      </SlidePanel>
      <SlidePanel
        open={panelType === 'carryFund'}
        onClose={closePanel}
        title={editingFund ? 'Edit Fund' : 'Add Fund'}
      >
        <CarryPositionForm existing={editingFund} onClose={closePanel} />
      </SlidePanel>
      <SlidePanel
        open={panelType === 'carryCompany'}
        onClose={closePanel}
        title={editingCompany ? 'Edit Company' : 'Add Company'}
      >
        {companyContext && (
          <PortfolioCompanyForm
            carryPosition={companyContext}
            existing={editingCompany}
            onClose={closePanel}
          />
        )}
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

// ─── Fund Section Component (for carry) ─────────────────────────────────────

interface FundSectionProps {
  carryPosition: CarryPosition;
  onEditFund: () => void;
  onDeleteFund: () => void;
  onAddCompany: () => void;
  onEditCompany: (company: PortfolioCompany) => void;
  onDeleteCompany: (company: PortfolioCompany) => void;
}

function FundSection({
  carryPosition,
  onEditFund,
  onDeleteFund,
  onAddCompany,
  onEditCompany,
  onDeleteCompany,
}: FundSectionProps) {
  const scenarios = useMemo(
    () => computeCarryScenarios(carryPosition, CARRY_MULTIPLES),
    [carryPosition],
  );
  const metrics = useMemo(() => computePortfolioMetrics(carryPosition), [carryPosition]);

  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moicFilter, setMoicFilter] = useState<string>('all');

  const filteredCompanies = useMemo(() => {
    return carryPosition.portfolioCompanies.filter((company) => {
      if (nameFilter && !company.name.toLowerCase().includes(nameFilter.toLowerCase()))
        return false;
      if (statusFilter !== 'all' && company.status !== statusFilter) return false;
      if (moicFilter !== 'all') {
        const moic =
          company.investedAmount > 0 ? company.currentValuation / company.investedAmount : 0;
        if (moicFilter === 'above1' && moic < 1) return false;
        if (moicFilter === 'below1' && moic >= 1) return false;
      }
      return true;
    });
  }, [carryPosition.portfolioCompanies, nameFilter, statusFilter, moicFilter]);

  const hasActiveFilters = nameFilter !== '' || statusFilter !== 'all' || moicFilter !== 'all';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <ProviderLogo provider={carryPosition.provider} size={24} />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{carryPosition.fundName}</h2>
            <p className="text-xs text-slate-500">{carryPosition.provider}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEditFund}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            title="Edit Fund"
          >
            <PencilIcon />
          </button>
          <button
            onClick={onDeleteFund}
            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
            title="Delete Fund"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-6 bg-slate-50 border-b border-slate-100">
        <div>
          <p className="text-xs text-slate-500">Fund Size</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(carryPosition.fundSize)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Committed</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(carryPosition.committedCapital)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Carry %</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatPercent(carryPosition.carryPercent)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Hurdle</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatPercent(carryPosition.hurdleRate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Personal Share</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatPercent(carryPosition.personalSharePercent)}
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Portfolio Companies ({carryPosition.portfolioCompanies.length})
            {hasActiveFilters && (
              <span className="ml-1 text-slate-400 font-normal">
                — showing {filteredCompanies.length}
              </span>
            )}
          </h3>
          <button
            onClick={onAddCompany}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Add Company
          </button>
        </div>
        {carryPosition.portfolioCompanies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Name</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Invested</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Current Val</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Ownership</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">MOIC</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-600">Status</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-600 w-20">
                    Actions
                  </th>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-1.5 px-3">
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="w-full text-xs font-normal px-2 py-1 border border-slate-200 rounded bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </th>
                  <th className="py-1.5 px-3" />
                  <th className="py-1.5 px-3" />
                  <th className="py-1.5 px-3" />
                  <th className="py-1.5 px-3">
                    <select
                      value={moicFilter}
                      onChange={(e) => setMoicFilter(e.target.value)}
                      className="w-full text-xs font-normal px-1 py-1 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      <option value="all">All</option>
                      <option value="above1">&ge; 1x</option>
                      <option value="below1">&lt; 1x</option>
                    </select>
                  </th>
                  <th className="py-1.5 px-3">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full text-xs font-normal px-1 py-1 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="marked_up">Marked Up</option>
                      <option value="exited">Exited</option>
                      <option value="written_off">Written Off</option>
                    </select>
                  </th>
                  <th className="py-1.5 px-3">
                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          setNameFilter('');
                          setStatusFilter('all');
                          setMoicFilter('all');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                        title="Clear filters"
                      >
                        Clear
                      </button>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => {
                  const moic =
                    company.investedAmount > 0
                      ? company.currentValuation / company.investedAmount
                      : 0;
                  const statusMeta = STATUS_LABELS[company.status] ?? STATUS_LABELS.active;
                  return (
                    <tr
                      key={company.id}
                      className="border-b border-slate-50 hover:bg-slate-50 group"
                    >
                      <td className="py-2 px-3 font-medium text-slate-900">{company.name}</td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {formatCurrency(company.investedAmount)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-900">
                        {formatCurrency(company.currentValuation)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {formatPercent(company.ownershipPercent)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        <span className={moic >= 1 ? 'text-emerald-600' : 'text-red-600'}>
                          {moic.toFixed(1)}x
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditCompany(company)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                            title="Edit"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            onClick={() => onDeleteCompany(company)}
                            className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-2 px-3 text-slate-900">Total</td>
                  <td className="py-2 px-3 text-right text-slate-900">
                    {formatCurrency(metrics.totalInvested)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900">
                    {formatCurrency(metrics.totalCurrentValuation)}
                  </td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={metrics.portfolioMOIC >= 1 ? 'text-emerald-600' : 'text-red-600'}
                    >
                      {metrics.portfolioMOIC.toFixed(1)}x
                    </span>
                  </td>
                  <td colSpan={2} className="py-2 px-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center">
            No portfolio companies added yet.
          </p>
        )}
      </div>

      <div className="p-6 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Carry at Return Multiples</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-600">Multiple</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Fund Value</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Profit</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">
                  Carry Pool (Total)
                </th>
                <th className="text-right py-2 px-3 font-semibold text-emerald-700">
                  Personal Carry
                </th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((sc) => (
                <tr key={sc.multiple} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium text-slate-900">
                    {sc.multiple.toFixed(1)}x
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">
                    {formatCurrency(sc.totalFundValue)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">
                    {formatCurrency(sc.totalProfit)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900">
                    {formatCurrency(sc.totalCarryPool)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-700">
                    {formatCurrency(sc.personalCarry)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
