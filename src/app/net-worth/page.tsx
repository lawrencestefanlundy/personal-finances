'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Asset, Liability } from '@/types/finance';
import { computeYearlyProjections } from '@/lib/projections';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { assetCategories } from '@/data/categories';
import { formatCostBasis, formatMoic, instrumentLabels, statusStyles } from '@/lib/investmentFormatters';
import WealthChart from '@/components/charts/WealthChart';
import LiabilityChart from '@/components/charts/LiabilityChart';
import StatCard from '@/components/StatCard';
import { PencilIcon, TrashIcon, PlusIcon } from '@/components/ui/Icons';
import SlidePanel from '@/components/ui/SlidePanel';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import AssetForm from '@/components/forms/AssetForm';
import LiabilityForm from '@/components/forms/LiabilityForm';
import ProviderLogo from '@/components/ui/ProviderLogo';

const LIABILITY_TYPE_LABELS: Record<string, string> = {
  mortgage: 'Mortgage',
  student_loan: 'Student Loan',
  credit_card: 'Credit Card',
  other: 'Other',
};

type PanelType = 'asset' | 'liability' | null;

export default function NetWorthPage() {
  const { state, dispatch } = useFinance();

  const projections = useMemo(() => computeYearlyProjections(state), [state]);

  const currentYear = projections[0];
  const netWorth = currentYear?.netWealth ?? 0;
  const totalAssets = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLiabilities = state.liabilities.reduce((sum, l) => sum + l.currentBalance, 0);
  const liquidAssets = state.assets.filter((a) => a.isLiquid).reduce((sum, a) => sum + a.currentValue, 0);
  const illiquidAssets = totalAssets - liquidAssets;

  // Group non-angel, non-fund assets by category
  const assetsByCategory = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    for (const asset of state.assets) {
      if (asset.category === 'angel' || asset.category === 'fund') continue;
      if (!groups[asset.category]) groups[asset.category] = [];
      groups[asset.category].push(asset);
    }
    return groups;
  }, [state.assets]);

  // Investment assets
  const angelAssets = state.assets.filter((a) => a.category === 'angel');
  const fundAssets = state.assets.filter((a) => a.category === 'fund');
  const angelTotal = angelAssets.reduce((sum, a) => sum + a.currentValue, 0);
  const angelCostTotal = angelAssets.reduce((sum, a) => sum + (a.costBasis ?? 0), 0);
  const activeCount = angelAssets.filter((a) => a.status === 'active' || !a.status).length;
  const exitedCount = angelAssets.filter((a) => a.status === 'exited').length;
  const writtenOffCount = angelAssets.filter((a) => a.status === 'written_off').length;

  // Group liabilities by type
  const liabilitiesByType = useMemo(() => {
    const groups: Record<string, Liability[]> = {};
    for (const liability of state.liabilities) {
      if (!groups[liability.type]) groups[liability.type] = [];
      groups[liability.type].push(liability);
    }
    return groups;
  }, [state.liabilities]);

  // Collapsible state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Milestone projections (today, age 45, 50, 55, 60, 65, final)
  const milestones = useMemo(() => {
    const targets = [currentYear?.age, 45, 50, 55, 60, 65];
    const result = targets
      .map((age) => projections.find((p) => p.age === age))
      .filter((p): p is typeof projections[0] => p !== undefined);
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

  // CRUD state
  const [panelType, setPanelType] = useState<PanelType>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [editingLiability, setEditingLiability] = useState<Liability | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'asset' | 'liability' } | null>(null);

  const closePanel = () => { setPanelType(null); setEditingAsset(undefined); setEditingLiability(undefined); };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'asset') {
      dispatch({ type: 'DELETE_ASSET', payload: deleteTarget.id });
    } else {
      dispatch({ type: 'DELETE_LIABILITY', payload: deleteTarget.id });
    }
    setDeleteTarget(null);
  };

  const chevron = (isExpanded: boolean) => (
    <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Net Worth</h1>
          <p className="text-sm text-slate-500 mt-1">
            Balance sheet, investments, and long-term projections ({projections[0]?.year}–{projections[projections.length - 1]?.year})
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Net Worth"
          value={formatCurrency(netWorth)}
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
          value={totalAssets > 0 ? `${Math.round((liquidAssets / totalAssets) * 100)}% / ${Math.round((illiquidAssets / totalAssets) * 100)}%` : '—'}
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
            onClick={() => { setEditingAsset(undefined); setPanelType('asset'); }}
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
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                {isExpanded && assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-1.5 px-3 pl-10 hover:bg-slate-50 group">
                    <div className="flex items-center gap-2">
                      <ProviderLogo provider={asset.provider} size={16} />
                      <span className="text-sm text-slate-700">{asset.name}</span>
                      <span className="text-xs text-slate-400">{formatPercent(asset.annualGrowthRate)}</span>
                      {asset.unlockYear && (
                        <span className="text-xs text-slate-400">unlock {asset.unlockYear}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(asset.currentValue)}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingAsset(asset); setPanelType('asset'); }}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                          title="Edit"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: asset.id, name: asset.name, type: 'asset' })}
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

          {/* Fund carry summary line */}
          {fundAssets.length > 0 && (
            <div
              className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-slate-50"
              onClick={() => toggleSection('funds')}
            >
              <div className="flex items-center gap-2">
                {chevron(!!expanded['funds'])}
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: assetCategories.fund?.bgColor, color: assetCategories.fund?.color }}
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
          {expanded['funds'] && fundAssets.map((fund) => (
            <div key={fund.id} className="flex items-center justify-between py-1.5 px-3 pl-10 hover:bg-slate-50 group">
              <div className="flex items-center gap-2">
                <ProviderLogo provider={fund.provider} size={16} />
                <span className="text-sm text-slate-700">{fund.name}</span>
                <span className="text-xs text-slate-400">{formatPercent(fund.annualGrowthRate)}</span>
                {fund.unlockYear && (
                  <span className="text-xs text-slate-400">unlock {fund.unlockYear}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900">{formatCurrency(fund.currentValue)}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingAsset(fund); setPanelType('asset'); }}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                    title="Edit"
                  >
                    <PencilIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Angel investments summary line */}
          {angelAssets.length > 0 && (
            <div
              className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-slate-50"
              onClick={() => toggleSection('angels')}
            >
              <div className="flex items-center gap-2">
                {chevron(!!expanded['angels'])}
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: assetCategories.angel?.bgColor, color: assetCategories.angel?.color }}
                >
                  Angel
                </span>
                <span className="text-sm text-slate-500">
                  ({angelAssets.length}) · {activeCount} active · {exitedCount} exited · {writtenOffCount} written off
                </span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(angelTotal)}</span>
            </div>
          )}

          {/* Liabilities section */}
          <div className="flex items-center justify-between py-2 px-3 bg-red-50 mt-4 rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-800">Liabilities</span>
              <button
                onClick={() => { setEditingLiability(undefined); setPanelType('liability'); }}
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
                  <span className="text-sm font-semibold text-red-600">{formatCurrency(subtotal)}</span>
                </div>
                {isExpanded && liabilities.map((liability) => (
                  <div key={liability.id} className="flex items-center justify-between py-1.5 px-3 pl-10 hover:bg-slate-50 group">
                    <div className="flex items-center gap-2">
                      <ProviderLogo provider={liability.provider} size={16} />
                      <span className="text-sm text-slate-700">{liability.name}</span>
                      <span className="text-xs text-slate-400">{formatPercent(liability.interestRate)}</span>
                      <span className="text-xs text-slate-400">{formatCurrency(liability.monthlyPayment)}/mo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-600">{formatCurrency(liability.currentBalance)}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingLiability(liability); setPanelType('liability'); }}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                          title="Edit"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: liability.id, name: liability.name, type: 'liability' })}
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
            <span className="font-bold text-purple-900 text-lg">{formatCurrency(netWorth)}</span>
          </div>
        </div>
      </div>

      {/* Fund Carry Positions */}
      {fundAssets.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Fund Carry Positions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fundAssets.map((fund) => (
              <div key={fund.id} className="group relative bg-slate-50 rounded-lg p-5">
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingAsset(fund); setPanelType('asset'); }}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                    title="Edit"
                  >
                    <PencilIcon />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <ProviderLogo provider={fund.provider} size={20} />
                  <h3 className="font-semibold text-slate-900">{fund.name}</h3>
                </div>
                <p className="text-2xl font-bold text-purple-700 mb-1">{formatCurrency(fund.currentValue)}</p>
                <div className="flex gap-3 text-xs text-slate-500 mb-2">
                  <span>{formatPercent(fund.annualGrowthRate)} growth</span>
                  {fund.unlockYear && <span>Unlock {fund.unlockYear}</span>}
                </div>
                {fund.notes && (
                  <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200 pt-2 mt-2">
                    {fund.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Angel Investments Table */}
      {angelAssets.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Angel Investments</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {formatCurrency(angelCostTotal)} deployed · {angelCostTotal > 0 ? `${(angelTotal / angelCostTotal).toFixed(2)}x` : '—'} portfolio MOIC
              </p>
            </div>
            <button
              onClick={() => { setEditingAsset(undefined); setPanelType('asset'); }}
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
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Cost Basis</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Current Value</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">MOIC</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-600">Tax Relief</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-600">Date</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-600">Status</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-600 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {angelAssets.map((asset) => (
                  <tr key={asset.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                    <td className="py-2 px-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <ProviderLogo provider={asset.provider} size={18} />
                        <div>
                          <span>{asset.name}</span>
                          {asset.platform && (
                            <span className="ml-1.5 text-xs text-slate-400">via {asset.platform}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {asset.instrument ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {instrumentLabels[asset.instrument] ?? asset.instrument}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">
                      {formatCostBasis(asset.costBasis, asset.costCurrency)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-900">{formatCurrency(asset.currentValue)}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={
                        asset.costBasis && asset.costBasis > 0 && asset.currentValue / asset.costBasis >= 1
                          ? 'text-emerald-600 font-medium'
                          : 'text-red-500 font-medium'
                      }>
                        {formatMoic(asset.currentValue, asset.costBasis)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {asset.taxScheme ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          asset.taxScheme === 'SEIS' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                        }`}>
                          {asset.taxScheme}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {asset.investmentDate ? (
                        new Date(asset.investmentDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                      ) : '—'}
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
                      ) : '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingAsset(asset); setPanelType('asset'); }}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                          title="Edit"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: asset.id, name: asset.name, type: 'asset' })}
                          className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-2 px-3 text-slate-900">Total</td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3 text-right text-slate-600">{formatCostBasis(angelCostTotal, 'GBP')}</td>
                  <td className="py-2 px-3 text-right text-slate-900">{formatCurrency(angelTotal)}</td>
                  <td className="py-2 px-3 text-right font-medium">
                    <span className={angelCostTotal > 0 && angelTotal / angelCostTotal >= 1 ? 'text-emerald-600' : 'text-red-500'}>
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
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Total Assets</th>
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
                  <td className="py-2 px-3 text-right text-slate-900">{formatCurrency(p.totalAssets)}</td>
                  <td className="py-2 px-3 text-right text-red-600">{formatCurrency(p.totalLiabilities)}</td>
                  <td className="py-2 px-3 text-right font-bold text-purple-700">{formatCurrency(p.netWealth)}</td>
                  <td className="py-2 px-3 text-right text-emerald-600">{formatCurrency(p.liquidAssets)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide Panels */}
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
