'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Asset, Liability } from '@/types/finance';
import { computeYearlyProjections } from '@/lib/projections';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { assetCategories } from '@/data/categories';
import WealthChart from '@/components/charts/WealthChart';
import AssetBreakdown from '@/components/charts/AssetBreakdown';
import LiabilityChart from '@/components/charts/LiabilityChart';
import StatCard from '@/components/StatCard';
import { PencilIcon, TrashIcon, PlusIcon } from '@/components/ui/Icons';
import SlidePanel from '@/components/ui/SlidePanel';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import AssetForm from '@/components/forms/AssetForm';
import LiabilityForm from '@/components/forms/LiabilityForm';

const LIABILITY_TYPE_LABELS: Record<string, string> = {
  mortgage: 'Mortgage',
  student_loan: 'Student Loan',
  credit_card: 'Credit Card',
  other: 'Other',
};

type PanelType = 'asset' | 'liability' | null;

export default function WealthPage() {
  const { state, dispatch } = useFinance();
  const [showEditor, setShowEditor] = useState(false);

  const projections = useMemo(() => computeYearlyProjections(state), [state]);

  const currentYear = projections[0];
  const finalYear = projections[projections.length - 1];
  const retirementYear = projections.find((p) => p.age === 65);

  // CRUD state
  const [panelType, setPanelType] = useState<PanelType>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [editingLiability, setEditingLiability] = useState<Liability | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'asset' | 'liability' } | null>(null);

  const closePanel = () => { setPanelType(null); setEditingAsset(undefined); setEditingLiability(undefined); };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const actionMap = {
      asset: 'DELETE_ASSET' as const,
      liability: 'DELETE_LIABILITY' as const,
    };
    dispatch({ type: actionMap[deleteTarget.type], payload: deleteTarget.id });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wealth Projection</h1>
          <p className="text-sm text-slate-500 mt-1">
            Long-term asset growth and net wealth forecast ({projections[0]?.year}–{projections[projections.length - 1]?.year})
          </p>
        </div>
        <button
          onClick={() => setShowEditor(!showEditor)}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            showEditor ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {showEditor ? 'Hide' : 'Edit'} Growth Rates
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Net Wealth Today"
          value={formatCurrency(currentYear?.netWealth ?? 0)}
          subtitle={`Age ${currentYear?.age}`}
          color="purple"
        />
        <StatCard
          title="At Retirement (65)"
          value={formatCurrency(retirementYear?.netWealth ?? 0)}
          subtitle={`Year ${retirementYear?.year}`}
          color="green"
        />
        <StatCard
          title="Liquid Assets Today"
          value={formatCurrency(currentYear?.liquidAssets ?? 0)}
          subtitle="Cash + savings + ISA + crypto"
          color="blue"
        />
        <StatCard
          title="Final Projection"
          value={formatCurrency(finalYear?.netWealth ?? 0)}
          subtitle={`Age ${finalYear?.age} (${finalYear?.year})`}
          color="amber"
        />
      </div>

      {/* Growth Rate Editor */}
      {showEditor && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Growth Rates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>
      )}

      {/* Net Wealth Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Net Wealth Over Time</h2>
        <WealthChart projections={projections} />
      </div>

      {/* Asset Breakdown + Liabilities Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Asset Breakdown</h2>
          <AssetBreakdown projections={projections} assets={state.assets} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Liability Paydown</h2>
          <LiabilityChart projections={projections} liabilities={state.liabilities} />
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Assets</h2>
          <button
            onClick={() => { setEditingAsset(undefined); setPanelType('asset'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Asset
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-600">Name</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-600">Category</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Value</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Growth</th>
                <th className="text-center py-2 px-3 font-semibold text-slate-600">Liquid</th>
                <th className="text-center py-2 px-3 font-semibold text-slate-600">Unlock</th>
                <th className="text-center py-2 px-3 font-semibold text-slate-600 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.assets.map((asset) => (
                <tr key={asset.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                  <td className="py-2 px-3 font-medium text-slate-900">{asset.name}</td>
                  <td className="py-2 px-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: assetCategories[asset.category]?.bgColor,
                        color: assetCategories[asset.category]?.color,
                      }}
                    >
                      {assetCategories[asset.category]?.label ?? asset.category}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900">{formatCurrency(asset.currentValue)}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{formatPercent(asset.annualGrowthRate)}</td>
                  <td className="py-2 px-3 text-center">
                    {asset.isLiquid ? (
                      <span className="text-emerald-600 text-xs font-medium">Yes</span>
                    ) : (
                      <span className="text-slate-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center text-xs text-slate-500">
                    {asset.unlockYear ?? '-'}
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
                <td className="py-2 px-3 text-right text-slate-900">
                  {formatCurrency(state.assets.reduce((sum, a) => sum + a.currentValue, 0))}
                </td>
                <td colSpan={4} className="py-2 px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Liabilities Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Liabilities</h2>
          <button
            onClick={() => { setEditingLiability(undefined); setPanelType('liability'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Liability
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-600">Name</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-600">Type</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Balance</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Rate</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Monthly</th>
                <th className="text-center py-2 px-3 font-semibold text-slate-600 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.liabilities.map((liability) => (
                <tr key={liability.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                  <td className="py-2 px-3 font-medium text-slate-900">{liability.name}</td>
                  <td className="py-2 px-3 text-slate-600 text-xs">
                    {LIABILITY_TYPE_LABELS[liability.type] ?? liability.type}
                  </td>
                  <td className="py-2 px-3 text-right text-red-600 font-medium">{formatCurrency(liability.currentBalance)}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{formatPercent(liability.interestRate)}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{formatCurrency(liability.monthlyPayment)}</td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="py-2 px-3 text-slate-900">Total</td>
                <td className="py-2 px-3"></td>
                <td className="py-2 px-3 text-right text-red-600">
                  {formatCurrency(state.liabilities.reduce((sum, l) => sum + l.currentBalance, 0))}
                </td>
                <td colSpan={3} className="py-2 px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Yearly Projection Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Yearly Projection Table</h2>
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
              {projections.map((p) => (
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
