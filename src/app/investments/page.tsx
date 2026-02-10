'use client';

import { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Asset } from '@/types/finance';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { formatCostBasis, formatMoic, instrumentLabels, statusStyles } from '@/lib/investmentFormatters';
import StatCard from '@/components/StatCard';
import { PencilIcon, TrashIcon, PlusIcon } from '@/components/ui/Icons';
import SlidePanel from '@/components/ui/SlidePanel';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import AssetForm from '@/components/forms/AssetForm';
import ProviderLogo from '@/components/ui/ProviderLogo';

export default function InvestmentsPage() {
  const { state, dispatch } = useFinance();

  const angelAssets = state.assets.filter((a) => a.category === 'angel');
  const fundAssets = state.assets.filter((a) => a.category === 'fund');

  const angelTotal = angelAssets.reduce((sum, a) => sum + a.currentValue, 0);
  const angelCostTotal = angelAssets.reduce((sum, a) => sum + (a.costBasis ?? 0), 0);
  const activeCount = angelAssets.filter((a) => a.status === 'active' || !a.status).length;
  const exitedCount = angelAssets.filter((a) => a.status === 'exited').length;
  const writtenOffCount = angelAssets.filter((a) => a.status === 'written_off').length;

  // CRUD state
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const openAdd = () => { setEditingAsset(undefined); setPanelOpen(true); };
  const openEdit = (asset: Asset) => { setEditingAsset(asset); setPanelOpen(true); };
  const closePanel = () => { setPanelOpen(false); setEditingAsset(undefined); };

  const handleDelete = () => {
    if (deleteTarget) {
      dispatch({ type: 'DELETE_ASSET', payload: deleteTarget.id });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Investments</h1>
        <p className="text-sm text-slate-500 mt-1">Angel portfolio and fund carry positions</p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Deployed"
          value={formatCurrency(angelCostTotal)}
          subtitle={`${angelAssets.length} investments`}
          color="purple"
        />
        <StatCard
          title="Current Value"
          value={formatCurrency(angelTotal)}
          subtitle="Angel portfolio"
          color="green"
        />
        <StatCard
          title="Portfolio MOIC"
          value={angelCostTotal > 0 ? `${(angelTotal / angelCostTotal).toFixed(2)}x` : '—'}
          subtitle={angelTotal >= angelCostTotal ? 'Positive return' : 'Below cost basis'}
          color={angelTotal >= angelCostTotal ? 'green' : 'amber'}
        />
        <StatCard
          title="Status"
          value={`${activeCount} active`}
          subtitle={`${exitedCount} exited · ${writtenOffCount} written off`}
          color="blue"
        />
      </div>

      {/* Fund Carry Positions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Fund Carry Positions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fundAssets.map((fund) => (
            <div key={fund.id} className="group relative bg-slate-50 rounded-lg p-5">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(fund)}
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

      {/* Angel Investments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Angel Investments</h2>
          <button
            onClick={openAdd}
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
                <th className="text-center py-2 px-3 font-semibold text-slate-600">Tax</th>
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
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                        {asset.taxScheme}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
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
                    ) : '—'}
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
                <td className="py-2 px-3 text-right text-slate-600">{formatCostBasis(angelCostTotal, 'GBP')}</td>
                <td className="py-2 px-3 text-right text-slate-900">{formatCurrency(angelTotal)}</td>
                <td className="py-2 px-3 text-right font-medium">
                  <span className={angelCostTotal > 0 && angelTotal / angelCostTotal >= 1 ? 'text-emerald-600' : 'text-red-500'}>
                    {angelCostTotal > 0 ? `${(angelTotal / angelCostTotal).toFixed(2)}x` : '—'}
                  </span>
                </td>
                <td colSpan={3} className="py-2 px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide Panel */}
      <SlidePanel
        open={panelOpen}
        onClose={closePanel}
        title={editingAsset ? 'Edit Investment' : 'Add Investment'}
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
