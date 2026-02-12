'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Asset } from '@/types/finance';
import { computeYearlyProjections } from '@/lib/projections';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { assetCategories } from '@/data/categories';
import AssetBreakdown from '@/components/charts/AssetBreakdown';
import StatCard from '@/components/StatCard';
import { PencilIcon, TrashIcon, PlusIcon } from '@/components/ui/Icons';
import SlidePanel from '@/components/ui/SlidePanel';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import AssetForm from '@/components/forms/AssetForm';
import ProviderLogo from '@/components/ui/ProviderLogo';

export default function AssetsPage() {
  const { state, dispatch } = useFinance();
  const [showEditor, setShowEditor] = useState(false);

  const projections = useMemo(() => computeYearlyProjections(state), [state]);

  const totalAssets = state.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const liquidAssets = state.assets
    .filter((a) => a.isLiquid)
    .reduce((sum, a) => sum + a.currentValue, 0);
  const illiquidAssets = totalAssets - liquidAssets;
  const angelTotal = state.assets
    .filter((a) => a.category === 'angel')
    .reduce((sum, a) => sum + a.currentValue, 0);

  // CRUD state
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const openAdd = () => {
    setEditingAsset(undefined);
    setPanelOpen(true);
  };
  const openEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setPanelOpen(true);
  };
  const closePanel = () => {
    setPanelOpen(false);
    setEditingAsset(undefined);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      dispatch({ type: 'DELETE_ASSET', payload: deleteTarget.id });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assets</h1>
          <p className="text-sm text-slate-500 mt-1">
            All assets and long-term investment breakdown
          </p>
        </div>
        <button
          onClick={() => setShowEditor(!showEditor)}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            showEditor
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {showEditor ? 'Hide' : 'Edit'} Growth Rates
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Assets"
          value={formatCurrency(totalAssets)}
          subtitle="All asset classes"
          color="purple"
        />
        <StatCard
          title="Liquid Assets"
          value={formatCurrency(liquidAssets)}
          subtitle="Easily accessible"
          color="green"
        />
        <StatCard
          title="Illiquid Assets"
          value={formatCurrency(illiquidAssets)}
          subtitle="Locked or restricted"
          color="amber"
        />
        <StatCard
          title="Angel Investments"
          value={formatCurrency(angelTotal)}
          subtitle={`${state.assets.filter((a) => a.category === 'angel' && a.currentValue > 0).length} active companies`}
          color="blue"
        />
      </div>

      {/* Growth Rate Editor */}
      {showEditor && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Growth Rates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
              >
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

      {/* Asset Breakdown Chart — Full Width */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Asset Breakdown Over Time</h2>
        <AssetBreakdown projections={projections} assets={state.assets} />
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">All Assets</h2>
          <button
            onClick={openAdd}
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
                  <td className="py-2 px-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <ProviderLogo provider={asset.provider} size={18} />
                      <span>{asset.name}</span>
                    </div>
                  </td>
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
                  <td className="py-2 px-3 text-right text-slate-900">
                    {formatCurrency(asset.currentValue)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">
                    {formatPercent(asset.annualGrowthRate)}
                  </td>
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
                        onClick={() => openEdit(asset)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                        title="Edit"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: asset.id, name: asset.name })}
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
                  {formatCurrency(totalAssets)}
                </td>
                <td colSpan={4} className="py-2 px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide Panel for Asset Form */}
      <SlidePanel
        open={panelOpen}
        onClose={closePanel}
        title={editingAsset ? 'Edit Asset' : 'Add Asset'}
      >
        <AssetForm existing={editingAsset} onClose={closePanel} />
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
