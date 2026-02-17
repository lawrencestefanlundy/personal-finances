'use client';

import React, { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  CashPosition,
  IncomeStream,
  Expense,
  ExpenseCategory,
  Asset,
  EmailUpdate,
  Liability,
  CarryPosition,
  PortfolioCompany,
} from '@/types/finance';
import { computeMonthlySnapshots } from '@/lib/calculations';
import { computeYearlyProjections } from '@/lib/projections';
import { computeCarryScenarios, computePortfolioMetrics } from '@/lib/carryCalculations';
import { formatCurrency, formatEUR, formatMonth, formatPercent } from '@/lib/formatters';
import { assetCategories, expenseCategories } from '@/data/categories';
import {
  formatCostBasis,
  formatMoic,
  instrumentLabels,
  statusStyles,
} from '@/lib/investmentFormatters';
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
import VehicleValuationCard from '@/components/VehicleValuationCard';
import PropertyValuationCard from '@/components/PropertyValuationCard';
import { useEurGbpRate } from '@/hooks/useEurGbpRate';

const CARRY_MULTIPLES = [2.0, 3.0, 5.0];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#10b981', bg: '#ecfdf5' },
  marked_up: { label: 'Marked Up', color: '#8b5cf6', bg: '#f5f3ff' },
  exited: { label: 'Exited', color: '#3b82f6', bg: '#eff6ff' },
  written_off: { label: 'Written Off', color: '#ef4444', bg: '#fef2f2' },
};

const GEOGRAPHY_COLORS: Record<string, { bg: string; text: string }> = {
  'United Kingdom': { bg: '#dbeafe', text: '#1e40af' },
  'United States': { bg: '#fce7f3', text: '#9d174d' },
  Germany: { bg: '#fef9c3', text: '#854d0e' },
  France: { bg: '#ede9fe', text: '#5b21b6' },
  Switzerland: { bg: '#fecaca', text: '#991b1b' },
  Finland: { bg: '#e0f2fe', text: '#075985' },
  Belgium: { bg: '#fef3c7', text: '#92400e' },
  Portugal: { bg: '#d1fae5', text: '#065f46' },
  Austria: { bg: '#ffe4e6', text: '#9f1239' },
  Denmark: { bg: '#cffafe', text: '#155e75' },
  Singapore: { bg: '#f3e8ff', text: '#6b21a8' },
  India: { bg: '#ffedd5', text: '#9a3412' },
  Israel: { bg: '#e0e7ff', text: '#3730a3' },
  Romania: { bg: '#fce7f3', text: '#831843' },
  Croatia: { bg: '#ccfbf1', text: '#134e4a' },
  Spain: { bg: '#fff7ed', text: '#c2410c' },
  Netherlands: { bg: '#fed7aa', text: '#9a3412' },
  Europe: { bg: '#e0f2fe', text: '#0369a1' },
};

function geographyBubble(geo: string | null | undefined) {
  if (!geo || geo === '—') return <span className="text-xs text-slate-400">—</span>;
  // Find matching colour by checking if geography starts with or contains a known country
  const primaryCountry = Object.keys(GEOGRAPHY_COLORS).find(
    (country) => geo.startsWith(country) || geo.includes(country),
  );
  const colors = primaryCountry
    ? GEOGRAPHY_COLORS[primaryCountry]
    : { bg: '#f1f5f9', text: '#475569' };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium max-w-[140px] truncate"
      style={{ backgroundColor: colors.bg, color: colors.text }}
      title={geo}
    >
      {geo}
    </span>
  );
}

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
  const snapshots = useMemo(() => computeMonthlySnapshots(state, 26), [state]);

  // ─── Projections ────────────────────────────────────────────────────────────
  const projections = useMemo(() => computeYearlyProjections(state), [state]);
  const currentYear = projections[0];

  const liquidCash = state.cashPositions
    .filter(
      (cp) =>
        cp.category === 'cash' ||
        cp.category === 'savings' ||
        cp.category === 'isa' ||
        cp.category === 'crypto',
    )
    .reduce((sum, cp) => sum + cp.balance, 0);

  // ─── FX Rate ───────────────────────────────────────────────────────────────
  const eurGbp = useEurGbpRate();

  // ─── Carry positions valued in GBP ────────────────────────────────────────
  const carryValuationGBP = useMemo(() => {
    return state.carryPositions.reduce((sum, cp) => {
      const fundEUR = cp.portfolioCompanies.reduce((s, c) => s + c.currentValuation, 0);
      return sum + fundEUR * eurGbp.rate;
    }, 0);
  }, [state.carryPositions, eurGbp.rate]);

  // ─── Asset computations ─────────────────────────────────────────────────────
  const baseAssets = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalAssets = baseAssets + carryValuationGBP;
  const totalLiabilities = state.liabilities
    .filter((l) => l.type !== 'student_loan')
    .reduce((sum, l) => sum + l.currentBalance, 0);
  const netWealth = totalAssets - totalLiabilities;
  const liquidAssets = state.assets
    .filter((a) => a.isLiquid)
    .reduce((sum, a) => sum + a.currentValue, 0);
  const illiquidAssets = totalAssets - liquidAssets;

  // ─── Expense category ordering (matches spreadsheet) ───────────────────────
  const EXPENSE_CATEGORY_ORDER: ExpenseCategory[] = [
    'debt',
    'investment',
    'school',
    'holiday',
    'groceries',
    'bills',
    'health',
    'car',
    'insurance',
    'subscriptions',
    'extracurricular',
    'house',
    'tax',
    'other',
  ];

  const expensesByCategory = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    for (const expense of state.expenses) {
      if (!groups[expense.category]) groups[expense.category] = [];
      groups[expense.category].push(expense);
    }
    return groups;
  }, [state.expenses]);

  // ─── SOFT commitment (ISA + savings not counted in day-to-day) ────────────
  const softCommitment = useMemo(() => {
    return state.cashPositions
      .filter((cp) => cp.category === 'isa' || cp.category === 'savings')
      .reduce((sum, cp) => sum + cp.balance, 0);
  }, [state.cashPositions]);

  const assetsByCategory = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    for (const asset of state.assets) {
      if (
        asset.category === 'angel' ||
        asset.category === 'fund' ||
        asset.category === 'children_isa'
      )
        continue;
      if (!groups[asset.category]) groups[asset.category] = [];
      groups[asset.category].push(asset);
    }
    return groups;
  }, [state.assets]);

  const angelAssets = state.assets.filter((a) => a.category === 'angel');
  const fundAssets = state.assets.filter((a) => a.category === 'fund');
  const childrenIsaAssets = state.assets.filter((a) => a.category === 'children_isa');
  const angelTotal = angelAssets.reduce((sum, a) => sum + a.currentValue, 0);
  const angelCostTotalGBP = angelAssets.reduce(
    (sum, a) => sum + (a.costBasisGBP ?? a.costBasis ?? 0),
    0,
  );
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

  // Angel filter + sort state
  const [angelStatusFilter, setAngelStatusFilter] = useState<
    'all' | 'active' | 'written_off' | 'exited'
  >('all');

  type AngelSortKey =
    | 'name'
    | 'instrument'
    | 'date'
    | 'geography'
    | 'industry'
    | 'cost'
    | 'gbpValue'
    | 'moic'
    | 'taxRelief'
    | 'status';
  const [angelSortKey, setAngelSortKey] = useState<AngelSortKey>('status');
  const [angelSortDir, setAngelSortDir] = useState<'asc' | 'desc'>('asc');

  const handleAngelSort = (key: AngelSortKey) => {
    if (angelSortKey === key) {
      setAngelSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setAngelSortKey(key);
      setAngelSortDir(
        key === 'name' ||
          key === 'instrument' ||
          key === 'geography' ||
          key === 'industry' ||
          key === 'status' ||
          key === 'taxRelief'
          ? 'asc'
          : 'desc',
      );
    }
  };

  const angelSortIndicator = (key: AngelSortKey) =>
    angelSortKey === key ? (angelSortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const filteredAngelAssets = (() => {
    const filtered =
      angelStatusFilter === 'all'
        ? angelAssets
        : angelAssets.filter((a) => {
            if (angelStatusFilter === 'active') return a.status === 'active' || !a.status;
            return a.status === angelStatusFilter;
          });

    const dir = angelSortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (angelSortKey) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'instrument':
          return dir * (a.instrument ?? '').localeCompare(b.instrument ?? '');
        case 'date':
          return dir * (a.investmentDate ?? '').localeCompare(b.investmentDate ?? '');
        case 'geography':
          return dir * (a.geography ?? '').localeCompare(b.geography ?? '');
        case 'industry':
          return dir * (a.industry ?? '').localeCompare(b.industry ?? '');
        case 'cost':
          return dir * ((a.costBasis ?? 0) - (b.costBasis ?? 0));
        case 'gbpValue':
          return (
            dir * ((a.costBasisGBP ?? a.costBasis ?? 0) - (b.costBasisGBP ?? b.costBasis ?? 0))
          );
        case 'moic': {
          const aMoic = a.costBasisGBP && a.costBasisGBP > 0 ? a.currentValue / a.costBasisGBP : 0;
          const bMoic = b.costBasisGBP && b.costBasisGBP > 0 ? b.currentValue / b.costBasisGBP : 0;
          return dir * (aMoic - bMoic);
        }
        case 'taxRelief':
          return dir * (a.taxScheme ?? '').localeCompare(b.taxScheme ?? '');
        case 'status': {
          const statusOrder: Record<string, number> = { active: 0, exited: 1, written_off: 2 };
          const orderDiff =
            (statusOrder[a.status || 'active'] ?? 0) - (statusOrder[b.status || 'active'] ?? 0);
          if (orderDiff !== 0) return dir * orderDiff;
          const aMoic = a.costBasisGBP && a.costBasisGBP > 0 ? a.currentValue / a.costBasisGBP : 0;
          const bMoic = b.costBasisGBP && b.costBasisGBP > 0 ? b.currentValue / b.costBasisGBP : 0;
          return -(aMoic - bMoic);
        }
        default:
          return 0;
      }
    });
  })();

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
          SECTION 1: SUMMARY
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="overview" className="scroll-mt-20 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview as of {formatMonth(state.settings.startMonth)}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Liquid Cash */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => toggleSection('summary-cash')}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-500">Liquid Cash</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">
                  {formatCurrency(liquidCash)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCash(undefined);
                    setPanelType('cashPosition');
                  }}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  title="Add Cash Position"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
                <span className="text-slate-400">{chevron(!!expanded['summary-cash'])}</span>
              </div>
            </div>
            {expanded['summary-cash'] && (
              <div className="px-6 pb-4 pt-0 border-t border-slate-100 space-y-1">
                {state.cashPositions.map((cp) => (
                  <div
                    key={cp.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded px-1 -mx-1 py-0.5"
                    onClick={() => {
                      setEditingCash(cp);
                      setPanelType('cashPosition');
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <ProviderLogo provider={cp.provider} size={14} />
                      <span className="text-xs text-slate-600">{cp.name}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-700 tabular-nums">
                      {formatCurrency(cp.balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Assets */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => toggleSection('summary-assets')}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-500">Total Assets</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">
                  {formatCurrency(totalAssets)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {state.assets.length} positions
                  {state.carryPositions.length > 0 && ` + ${state.carryPositions.length} carry`}
                </p>
              </div>
              <span className="text-slate-400">{chevron(!!expanded['summary-assets'])}</span>
            </div>
            {expanded['summary-assets'] && (
              <div className="px-6 pb-4 pt-0 border-t border-slate-100 space-y-1">
                {state.assets
                  .filter((a) => a.category !== 'angel')
                  .map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-1.5">
                        <ProviderLogo provider={asset.provider} size={14} />
                        <span className="text-xs text-slate-600">{asset.name}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-700 tabular-nums">
                        {formatCurrency(asset.currentValue)}
                      </span>
                    </div>
                  ))}
                {angelAssets.length > 0 && (
                  <div className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: assetCategories.angel?.color }}
                      />
                      <span className="text-xs text-slate-600">
                        Angel Investments ({angelAssets.length})
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-700 tabular-nums">
                      {formatCurrency(angelTotal)}
                    </span>
                  </div>
                )}
                {state.carryPositions.map((cp) => {
                  const fundEUR = cp.portfolioCompanies.reduce((s, c) => s + c.currentValuation, 0);
                  return (
                    <div key={cp.id} className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-1.5">
                        <ProviderLogo provider={cp.provider} size={14} />
                        <span className="text-xs text-slate-600">{cp.fundName}</span>
                        <span className="text-[10px] text-indigo-500">Carry</span>
                      </div>
                      <span className="text-xs font-medium text-slate-700 tabular-nums">
                        {formatCurrency(fundEUR * eurGbp.rate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total Liabilities */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => toggleSection('summary-liabilities')}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-500">Total Liabilities</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">
                  {formatCurrency(totalLiabilities)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {state.liabilities.length} obligations
                </p>
              </div>
              <span className="text-slate-400">{chevron(!!expanded['summary-liabilities'])}</span>
            </div>
            {expanded['summary-liabilities'] && (
              <div className="px-6 pb-4 pt-0 border-t border-slate-100 space-y-1">
                {state.liabilities.map((liability) => (
                  <div
                    key={liability.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded px-1 -mx-1 py-0.5"
                    onClick={() => {
                      setEditingLiability(liability);
                      setPanelType('liability');
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <ProviderLogo provider={liability.provider} size={14} />
                      <span className="text-xs text-slate-600">{liability.name}</span>
                    </div>
                    <span className="text-xs font-medium text-red-600 tabular-nums">
                      {formatCurrency(liability.currentBalance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Net Wealth */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => toggleSection('summary-netwealth')}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-500">Net Wealth</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">
                  {formatCurrency(netWealth)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Age {currentYear?.age}</p>
              </div>
              <span className="text-slate-400">{chevron(!!expanded['summary-netwealth'])}</span>
            </div>
            {expanded['summary-netwealth'] && (
              <div className="px-6 pb-4 pt-0 border-t border-slate-100 space-y-1">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-slate-600">Assets (excl. carry)</span>
                  <span className="text-xs font-medium text-emerald-600 tabular-nums">
                    {formatCurrency(baseAssets)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-slate-600">Carry Positions (EUR→GBP)</span>
                  <span className="text-xs font-medium text-indigo-600 tabular-nums">
                    {formatCurrency(carryValuationGBP)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-slate-600">Total Assets</span>
                  <span className="text-xs font-medium text-emerald-600 tabular-nums">
                    {formatCurrency(totalAssets)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-slate-600">Total Liabilities</span>
                  <span className="text-xs font-medium text-red-600 tabular-nums">
                    -{formatCurrency(totalLiabilities)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 mt-1 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-700">Net Wealth</span>
                  <span className="text-xs font-bold text-purple-600 tabular-nums">
                    {formatCurrency(netWealth)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5 mt-1">
                  <span className="text-xs text-slate-500">Liquid / Illiquid</span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {totalAssets > 0
                      ? `${Math.round((liquidAssets / totalAssets) * 100)}% / ${Math.round((illiquidAssets / totalAssets) * 100)}%`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-slate-400">EUR/GBP</span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {eurGbp.rate.toFixed(4)}
                    {eurGbp.date && ` (${eurGbp.date})`}
                    {eurGbp.source === 'fallback' && ' ⚠ fallback'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {state.transactions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <TransactionList transactions={state.transactions} />
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: CASH FLOW
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="cash-flow" className="scroll-mt-20 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cash Flow</h1>
        </div>

        {/* Monthly Forecast Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table
              className="w-full text-xs"
              style={{ minWidth: `${360 + snapshots.length * 85}px` }}
            >
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-2 px-3 font-semibold text-slate-600 sticky left-0 z-10 bg-slate-50 w-[200px] min-w-[200px]">
                    Item
                  </th>
                  <th className="text-left py-2 px-2 font-semibold text-slate-600 w-[110px] min-w-[110px]">
                    Provider
                  </th>
                  <th className="text-left py-2 px-2 font-semibold text-slate-600 w-[100px] min-w-[100px]">
                    Category
                  </th>
                  {snapshots.map((s) => (
                    <th
                      key={s.month}
                      className="text-right py-2 px-2 font-semibold text-slate-600 whitespace-nowrap"
                    >
                      {formatMonth(s.month)}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* ── Cash ── */}
              <tbody>
                <tr className="border-b border-slate-200 bg-blue-50">
                  <td
                    className="py-1.5 px-3 font-bold text-slate-800 sticky left-0 z-10 bg-blue-50"
                    colSpan={3 + snapshots.length}
                  >
                    Cash
                  </td>
                </tr>
                {state.cashPositions.map((cp) => (
                  <tr key={cp.id} className="border-b border-slate-50">
                    <td className="py-1 px-3 text-slate-700 sticky left-0 z-10 bg-white">
                      {cp.name}
                    </td>
                    <td className="py-1 px-2 text-slate-500">{cp.provider}</td>
                    <td className="py-1 px-2 text-slate-500 capitalize">{cp.category}</td>
                    <td className="py-1 px-2 text-right tabular-nums text-slate-700">
                      {formatCurrency(cp.balance)}
                    </td>
                    <td colSpan={snapshots.length - 1} />
                  </tr>
                ))}
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold">
                  <td className="py-1.5 px-3 text-slate-800 sticky left-0 z-10 bg-slate-50">
                    Total
                  </td>
                  <td className="py-1.5 px-2 bg-slate-50" />
                  <td className="py-1.5 px-2 bg-slate-50" />
                  <td className="py-1.5 px-2 text-right tabular-nums text-slate-800 bg-slate-50">
                    {formatCurrency(liquidCash)}
                  </td>
                  <td colSpan={snapshots.length - 1} className="bg-slate-50" />
                </tr>
              </tbody>

              {/* ── Blank row ── */}
              <tbody>
                <tr>
                  <td colSpan={3 + snapshots.length} className="py-1" />
                </tr>
              </tbody>

              {/* ── Earnings ── */}
              <tbody>
                <tr className="border-b border-slate-200 bg-emerald-50">
                  <td
                    className="py-1.5 px-3 font-bold text-slate-800 sticky left-0 z-10 bg-emerald-50"
                    colSpan={3 + snapshots.length}
                  >
                    <div className="flex items-center gap-2">
                      <span>Earnings</span>
                      <button
                        onClick={() => {
                          setEditingIncome(undefined);
                          setPanelType('income');
                        }}
                        className="p-0.5 rounded hover:bg-emerald-100 text-slate-400"
                        title="Add Income Stream"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {state.incomeStreams.map((stream) => (
                  <tr key={stream.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                    <td className="py-1 px-3 text-slate-700 sticky left-0 z-10 bg-white">
                      <div className="flex items-center gap-1">
                        <span>{stream.name}</span>
                        <div className="flex gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingIncome(stream);
                              setPanelType('income');
                            }}
                            className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                            title="Edit"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({ id: stream.id, name: stream.name, type: 'income' })
                            }
                            className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-1 px-2 text-slate-500">{stream.provider}</td>
                    <td className="py-1 px-2 text-slate-500 capitalize">{stream.frequency}</td>
                    {snapshots.map((s) => {
                      const amount = s.incomeBreakdown[stream.id] || 0;
                      return (
                        <td key={s.month} className="py-1 px-2 text-right tabular-nums">
                          {amount > 0 ? (
                            <span className="text-emerald-600">{formatCurrency(amount)}</span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-b border-slate-200 bg-emerald-50 font-semibold">
                  <td className="py-1.5 px-3 text-slate-800 sticky left-0 z-10 bg-emerald-50">
                    Total
                  </td>
                  <td className="py-1.5 px-2 bg-emerald-50" />
                  <td className="py-1.5 px-2 bg-emerald-50" />
                  {snapshots.map((s) => (
                    <td
                      key={s.month}
                      className="py-1.5 px-2 text-right tabular-nums text-emerald-700 bg-emerald-50"
                    >
                      {s.totalIncome > 0 ? (
                        formatCurrency(s.totalIncome)
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>

              {/* ── Blank row ── */}
              <tbody>
                <tr>
                  <td colSpan={3 + snapshots.length} className="py-1" />
                </tr>
              </tbody>

              {/* ── Expenses (grouped by category) ── */}
              <tbody>
                <tr className="border-b border-slate-200 bg-red-50">
                  <td
                    className="py-1.5 px-3 font-bold text-slate-800 sticky left-0 z-10 bg-red-50"
                    colSpan={3 + snapshots.length}
                  >
                    <div className="flex items-center gap-2">
                      <span>Expenses</span>
                      <button
                        onClick={() => {
                          setEditingExpense(undefined);
                          setPanelType('expense');
                        }}
                        className="p-0.5 rounded hover:bg-red-100 text-slate-400"
                        title="Add Expense"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {EXPENSE_CATEGORY_ORDER.filter(
                  (cat) => expensesByCategory[cat] && expensesByCategory[cat].length > 0,
                ).flatMap((cat) =>
                  expensesByCategory[cat].map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-slate-50 hover:bg-slate-50 group"
                    >
                      <td className="py-1 px-3 text-slate-700 sticky left-0 z-10 bg-white">
                        <div className="flex items-center gap-1">
                          <span>{expense.name}</span>
                          <div className="flex gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingExpense(expense);
                                setPanelType('expense');
                              }}
                              className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
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
                              className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                              title="Delete"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-1 px-2 text-slate-500">{expense.provider || ''}</td>
                      <td className="py-1 px-2">
                        <span
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            color: expenseCategories[expense.category]?.color,
                            backgroundColor: expenseCategories[expense.category]?.bgColor,
                          }}
                        >
                          {expenseCategories[expense.category]?.label}
                        </span>
                      </td>
                      {snapshots.map((s) => {
                        const amount = s.expenseBreakdown[expense.id] || 0;
                        return (
                          <td key={s.month} className="py-1 px-2 text-right tabular-nums">
                            {amount > 0 ? (
                              <span className="text-slate-700">{formatCurrency(amount)}</span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )),
                )}
                <tr className="border-b border-slate-200 bg-red-50 font-semibold">
                  <td className="py-1.5 px-3 text-slate-800 sticky left-0 z-10 bg-red-50">Total</td>
                  <td className="py-1.5 px-2 bg-red-50" />
                  <td className="py-1.5 px-2 bg-red-50" />
                  {snapshots.map((s) => (
                    <td
                      key={s.month}
                      className="py-1.5 px-2 text-right tabular-nums text-red-600 bg-red-50"
                    >
                      {s.totalExpenses > 0 ? (
                        formatCurrency(s.totalExpenses)
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>

              {/* ── Blank row ── */}
              <tbody>
                <tr>
                  <td colSpan={3 + snapshots.length} className="py-1" />
                </tr>
              </tbody>

              {/* ── Summary: Net, Total ── */}
              <tbody>
                <tr className="border-b border-slate-200 bg-yellow-50 font-bold">
                  <td className="py-1.5 px-3 text-slate-900 sticky left-0 z-10 bg-yellow-50">
                    Net
                  </td>
                  <td className="py-1.5 px-2 bg-yellow-50" />
                  <td className="py-1.5 px-2 bg-yellow-50" />
                  {snapshots.map((s) => (
                    <td
                      key={s.month}
                      className={`py-1.5 px-2 text-right tabular-nums bg-yellow-50 ${s.runningBalance >= 0 ? 'text-slate-900' : 'text-red-700'}`}
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
        </div>

        {/* Balance Sheet */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Balance Sheet</h2>
            {carryValuationGBP > 0 && (
              <span className="text-[10px] text-slate-400">
                EUR/GBP {eurGbp.rate.toFixed(4)}
                {eurGbp.source === 'ecb' && ' (ECB live)'}
                {eurGbp.source === 'ecb-cached' && ' (ECB cached)'}
                {eurGbp.source === 'fallback' && ' ⚠ fallback'}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-t-lg">
              <span className="font-bold text-emerald-800">Assets</span>
              <span className="font-bold text-emerald-800">{formatCurrency(totalAssets)}</span>
            </div>

            {state.assets
              .filter((a) => a.category !== 'angel')
              .map((asset) => {
                const meta = assetCategories[asset.category as keyof typeof assetCategories];
                return (
                  <div key={asset.id}>
                    <div className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 group">
                      <div className="flex items-center gap-2">
                        <ProviderLogo provider={asset.provider} size={16} />
                        <span className="text-sm text-slate-700">{asset.name}</span>
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: meta?.bgColor, color: meta?.color }}
                        >
                          {meta?.label ?? asset.category}
                        </span>
                        {asset.registration && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {asset.registration}
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
                    {asset.category === 'vehicle' && asset.registration && (
                      <div className="px-3 pb-2">
                        <VehicleValuationCard asset={asset} />
                      </div>
                    )}
                    {asset.category === 'property' &&
                      asset.purchasePrice &&
                      asset.propertyRegion && (
                        <div className="px-3 pb-2">
                          <PropertyValuationCard asset={asset} />
                        </div>
                      )}
                  </div>
                );
              })}
            {angelAssets.length > 0 && (
              <div className="flex items-center justify-between py-2 px-3 hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: assetCategories.angel?.color }}
                  />
                  <span className="text-sm text-slate-700">
                    Angel Investments ({angelAssets.length})
                  </span>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: assetCategories.angel?.bgColor,
                      color: assetCategories.angel?.color,
                    }}
                  >
                    Angel
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {formatCurrency(angelTotal)}
                </span>
              </div>
            )}
            {state.carryPositions.map((cp) => {
              const fundEUR = cp.portfolioCompanies.reduce((s, c) => s + c.currentValuation, 0);
              const fundGBP = fundEUR * eurGbp.rate;
              return (
                <div
                  key={cp.id}
                  className="flex items-center justify-between py-2 px-3 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <ProviderLogo provider={cp.provider} size={16} />
                    <span className="text-sm text-slate-700">{cp.fundName}</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      Carry
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatEUR(fundEUR)} @{eurGbp.rate.toFixed(4)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {formatCurrency(fundGBP)}
                  </span>
                </div>
              );
            })}

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
                  {formatCurrency(angelCostTotalGBP)} deployed (GBP) ·{' '}
                  {angelCostTotalGBP > 0 ? `${(angelTotal / angelCostTotalGBP).toFixed(2)}x` : '—'}{' '}
                  portfolio MOIC
                </p>
              </div>
            </div>
            {/* Status filter pills */}
            <div className="flex items-center gap-2 mb-4">
              {(
                [
                  { key: 'all', label: 'All', count: angelAssets.length },
                  { key: 'active', label: 'Active', count: activeCount },
                  { key: 'exited', label: 'Exited', count: exitedCount },
                  { key: 'written_off', label: 'Written Off', count: writtenOffCount },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setAngelStatusFilter(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    angelStatusFilter === f.key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {f.label}{' '}
                  <span
                    className={angelStatusFilter === f.key ? 'text-slate-300' : 'text-slate-400'}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th
                      className="text-left py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                      onClick={() => handleAngelSort('name')}
                    >
                      Name{angelSortIndicator('name')}
                    </th>
                    <th
                      className="text-left py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                      onClick={() => handleAngelSort('instrument')}
                    >
                      Instrument{angelSortIndicator('instrument')}
                    </th>
                    <th
                      className="text-center py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                      onClick={() => handleAngelSort('date')}
                    >
                      Date{angelSortIndicator('date')}
                    </th>
                    <th
                      className="text-left py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                      onClick={() => handleAngelSort('geography')}
                    >
                      Geography{angelSortIndicator('geography')}
                    </th>
                    <th
                      className="text-left py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                      onClick={() => handleAngelSort('industry')}
                    >
                      Industry{angelSortIndicator('industry')}
                    </th>
                    <th
                      className="text-right py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                      onClick={() => handleAngelSort('cost')}
                    >
                      Original Investment{angelSortIndicator('cost')}
                    </th>
                    <th
                      className="text-right py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                      onClick={() => handleAngelSort('gbpValue')}
                    >
                      GBP Value{angelSortIndicator('gbpValue')}
                    </th>
                    <th
                      className="text-right py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                      onClick={() => handleAngelSort('moic')}
                    >
                      MOIC{angelSortIndicator('moic')}
                    </th>
                    <th
                      className="text-center py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                      onClick={() => handleAngelSort('taxRelief')}
                    >
                      Tax Relief{angelSortIndicator('taxRelief')}
                    </th>
                    <th
                      className="text-center py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                      onClick={() => handleAngelSort('status')}
                    >
                      Status{angelSortIndicator('status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAngelAssets.map((asset) => {
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
                          <td className="py-2 px-3 text-center text-xs text-slate-500">
                            {asset.investmentDate
                              ? new Date(asset.investmentDate).toLocaleDateString('en-GB', {
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                            {asset.exitDate && (
                              <span className="block text-[10px] text-slate-400">
                                Exit:{' '}
                                {new Date(asset.exitDate).toLocaleDateString('en-GB', {
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-xs text-slate-500 max-w-[100px] truncate">
                            {asset.geography ?? '—'}
                          </td>
                          <td className="py-2 px-3 text-xs text-slate-500 max-w-[120px] truncate">
                            {asset.industry ?? '—'}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {formatCostBasis(asset.costBasis, asset.costCurrency)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-900">
                            {asset.costBasisGBP != null && asset.costBasisGBP > 0
                              ? formatCurrency(asset.costBasisGBP)
                              : asset.costBasis != null && asset.costBasis > 0
                                ? formatCurrency(asset.costBasis)
                                : '—'}
                            {asset.fxRate != null && (
                              <span className="block text-[10px] text-slate-400">
                                @{asset.fxRate.toFixed(4)}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span
                              className={
                                asset.costBasisGBP &&
                                asset.costBasisGBP > 0 &&
                                asset.currentValue / asset.costBasisGBP >= 1
                                  ? 'text-emerald-600 font-medium'
                                  : 'text-red-500 font-medium'
                              }
                            >
                              {formatMoic(
                                asset.currentValue,
                                asset.costBasisGBP ?? asset.costBasis,
                              )}
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
                        </tr>
                        {isAngelExpanded && hasEmails && (
                          <tr>
                            <td
                              colSpan={10}
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
                  {(() => {
                    const filteredCostGBP = filteredAngelAssets.reduce(
                      (sum, a) => sum + (a.costBasisGBP ?? a.costBasis ?? 0),
                      0,
                    );
                    const filteredTotal = filteredAngelAssets.reduce(
                      (sum, a) => sum + a.currentValue,
                      0,
                    );
                    return (
                      <tr className="bg-slate-50 font-semibold">
                        <td className="py-2 px-3 text-slate-900">
                          Total
                          {angelStatusFilter !== 'all' && (
                            <span className="ml-1 text-xs font-normal text-slate-400">
                              ({filteredAngelAssets.length} of {angelAssets.length})
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3"></td>
                        <td className="py-2 px-3"></td>
                        <td className="py-2 px-3 text-right text-slate-600">—</td>
                        <td className="py-2 px-3 text-right text-slate-900">
                          {formatCurrency(filteredCostGBP)}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">
                          <span
                            className={
                              filteredCostGBP > 0 && filteredTotal / filteredCostGBP >= 1
                                ? 'text-emerald-600'
                                : 'text-red-500'
                            }
                          >
                            {filteredCostGBP > 0
                              ? `${(filteredTotal / filteredCostGBP).toFixed(2)}x`
                              : '—'}
                          </span>
                        </td>
                        <td colSpan={3} className="py-2 px-3"></td>
                      </tr>
                    );
                  })()}
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
            </div>

            {state.carryPositions.map((cp) => (
              <FundSection
                key={cp.id}
                carryPosition={cp}
                eurGbpRate={eurGbp.rate}
                onEditFund={() => {
                  setEditingFund(cp);
                  setPanelType('carryFund');
                }}
                onDeleteFund={() =>
                  setDeleteTarget({ id: cp.id, name: cp.fundName, type: 'carryFund' })
                }
              />
            ))}
          </>
        )}
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
  eurGbpRate: number;
  onEditFund: () => void;
  onDeleteFund: () => void;
}

type FundSortKey =
  | 'name'
  | 'date'
  | 'geography'
  | 'industry'
  | 'ownership'
  | 'cost'
  | 'fairValue'
  | 'return'
  | 'moic'
  | 'irr'
  | 'status';

function FundSection({ carryPosition, eurGbpRate, onEditFund, onDeleteFund }: FundSectionProps) {
  const scenarios = useMemo(
    () => computeCarryScenarios(carryPosition, CARRY_MULTIPLES),
    [carryPosition],
  );
  const metrics = useMemo(() => computePortfolioMetrics(carryPosition), [carryPosition]);

  const [fundSortKey, setFundSortKey] = useState<FundSortKey>('name');
  const [fundSortDir, setFundSortDir] = useState<'asc' | 'desc'>('asc');

  const handleFundSort = (key: FundSortKey) => {
    if (fundSortKey === key) {
      setFundSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setFundSortKey(key);
      setFundSortDir(
        key === 'name' || key === 'geography' || key === 'industry' || key === 'status'
          ? 'asc'
          : 'desc',
      );
    }
  };

  const fundSortIndicator = (key: FundSortKey) =>
    fundSortKey === key ? (fundSortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const sortedCompanies = (() => {
    const dir = fundSortDir === 'asc' ? 1 : -1;
    return [...carryPosition.portfolioCompanies].sort((a, b) => {
      const statusOrder: Record<string, number> = {
        active: 0,
        marked_up: 1,
        exited: 2,
        written_off: 3,
      };
      switch (fundSortKey) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'date':
          return dir * (a.investmentDate ?? '').localeCompare(b.investmentDate ?? '');
        case 'geography':
          return dir * (a.geography ?? '').localeCompare(b.geography ?? '');
        case 'industry':
          return dir * (a.industry ?? '').localeCompare(b.industry ?? '');
        case 'ownership':
          return dir * ((a.ownershipPercent ?? 0) - (b.ownershipPercent ?? 0));
        case 'cost':
          return dir * (a.investedAmount - b.investedAmount);
        case 'fairValue':
          return dir * (a.currentValuation - b.currentValuation);
        case 'return': {
          const retA =
            a.currentValuation + (a.proceeds ?? 0) + (a.cashIncome ?? 0) - a.investedAmount;
          const retB =
            b.currentValuation + (b.proceeds ?? 0) + (b.cashIncome ?? 0) - b.investedAmount;
          return dir * (retA - retB);
        }
        case 'moic': {
          const moicA = a.investedAmount > 0 ? a.currentValuation / a.investedAmount : 0;
          const moicB = b.investedAmount > 0 ? b.currentValuation / b.investedAmount : 0;
          return dir * (moicA - moicB);
        }
        case 'irr':
          return dir * ((a.irr ?? 0) - (b.irr ?? 0));
        case 'status':
          return dir * ((statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0));
        default:
          return 0;
      }
    });
  })();

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

      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-4 p-6 bg-slate-50 border-b border-slate-100">
        <div>
          <p className="text-xs text-slate-500">Fund Size</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(carryPosition.fundSize * eurGbpRate)}
          </p>
          <p className="text-[10px] text-slate-400">{formatEUR(carryPosition.fundSize)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Committed</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(carryPosition.committedCapital * eurGbpRate)}
          </p>
          <p className="text-[10px] text-slate-400">{formatEUR(carryPosition.committedCapital)}</p>
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
        <div>
          <p className="text-xs text-slate-500">Location</p>
          <p className="text-sm font-semibold text-slate-900">{carryPosition.location ?? '—'}</p>
        </div>
        {scenarios.map((sc) => (
          <div key={sc.multiple}>
            <p className="text-xs text-slate-500">Carry @{sc.multiple.toFixed(0)}x</p>
            <p className="text-sm font-bold text-emerald-700">
              {formatCurrency(sc.personalCarry * eurGbpRate)}
            </p>
            <p className="text-[10px] text-slate-400">{formatEUR(sc.personalCarry)}</p>
          </div>
        ))}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Portfolio Companies ({carryPosition.portfolioCompanies.length})
          </h3>
        </div>
        {carryPosition.portfolioCompanies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th
                    className="text-left py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                    onClick={() => handleFundSort('name')}
                  >
                    Name{fundSortIndicator('name')}
                  </th>
                  <th
                    className="text-center py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                    onClick={() => handleFundSort('date')}
                  >
                    Date{fundSortIndicator('date')}
                  </th>
                  <th
                    className="text-left py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                    onClick={() => handleFundSort('geography')}
                  >
                    Geography{fundSortIndicator('geography')}
                  </th>
                  <th
                    className="text-left py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                    onClick={() => handleFundSort('industry')}
                  >
                    Industry{fundSortIndicator('industry')}
                  </th>
                  <th
                    className="text-right py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                    onClick={() => handleFundSort('ownership')}
                  >
                    Ownership{fundSortIndicator('ownership')}
                  </th>
                  <th
                    className="text-right py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                    onClick={() => handleFundSort('cost')}
                  >
                    Cost{fundSortIndicator('cost')}
                  </th>
                  <th
                    className="text-right py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                    onClick={() => handleFundSort('fairValue')}
                  >
                    Fair Value{fundSortIndicator('fairValue')}
                  </th>
                  <th
                    className="text-right py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                    onClick={() => handleFundSort('return')}
                  >
                    Return{fundSortIndicator('return')}
                  </th>
                  <th
                    className="text-right py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                    onClick={() => handleFundSort('moic')}
                  >
                    MOIC{fundSortIndicator('moic')}
                  </th>
                  <th
                    className="text-right py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                    onClick={() => handleFundSort('irr')}
                  >
                    IRR{fundSortIndicator('irr')}
                  </th>
                  <th
                    className="text-center py-2 px-3 font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                    onClick={() => handleFundSort('status')}
                  >
                    Status{fundSortIndicator('status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCompanies.map((company) => {
                  const moic =
                    company.investedAmount > 0
                      ? company.currentValuation / company.investedAmount
                      : 0;
                  const totalCashRealised = (company.proceeds ?? 0) + (company.cashIncome ?? 0);
                  const totalReturn =
                    company.currentValuation + totalCashRealised - company.investedAmount;
                  const statusMeta = STATUS_LABELS[company.status] ?? STATUS_LABELS.active;
                  return (
                    <tr
                      key={company.id}
                      className="border-b border-slate-50 hover:bg-slate-50 group"
                    >
                      <td className="py-2 px-3 font-medium text-slate-900">
                        <div>
                          <span>{company.name}</span>
                          {company.legalEntity && company.legalEntity !== company.name && (
                            <span className="block text-[10px] text-slate-400">
                              {company.legalEntity}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center text-xs text-slate-500 whitespace-nowrap">
                        {company.investmentDate ?? '—'}
                        {company.exitDate && (
                          <span className="block text-[10px] text-slate-400">
                            Exit: {company.exitDate}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">{geographyBubble(company.geography)}</td>
                      <td className="py-2 px-3 text-xs text-slate-500 max-w-[140px] truncate">
                        {company.industry ?? '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {formatPercent(company.ownershipPercent)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {formatEUR(company.investedAmount)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-900">
                        {formatEUR(company.currentValuation)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        <span className={totalReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                          {formatEUR(totalReturn)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        <span className={moic >= 1 ? 'text-emerald-600' : 'text-red-600'}>
                          {moic.toFixed(2)}x
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-xs">
                        {company.irr != null ? (
                          <span className={company.irr >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                            {(company.irr * 100).toFixed(1)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-2 px-3 text-slate-900">Total</td>
                  <td className="py-2 px-3" colSpan={4}></td>
                  <td className="py-2 px-3 text-right text-slate-900">
                    {formatEUR(metrics.totalInvested)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900">
                    {formatEUR(metrics.totalCurrentValuation)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium">
                    <span
                      className={
                        metrics.totalCurrentValuation - metrics.totalInvested >= 0
                          ? 'text-emerald-600'
                          : 'text-red-500'
                      }
                    >
                      {formatEUR(metrics.totalCurrentValuation - metrics.totalInvested)}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={metrics.portfolioMOIC >= 1 ? 'text-emerald-600' : 'text-red-600'}
                    >
                      {metrics.portfolioMOIC.toFixed(2)}x
                    </span>
                  </td>
                  <td className="py-2 px-3" colSpan={2}></td>
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
    </div>
  );
}
