'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { computeYearlyProjections } from '@/lib/projections';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import WealthChart from '@/components/charts/WealthChart';
import AssetBreakdown from '@/components/charts/AssetBreakdown';
import LiabilityChart from '@/components/charts/LiabilityChart';
import StatCard from '@/components/StatCard';

export default function WealthPage() {
  const { state, dispatch } = useFinance();
  const [showEditor, setShowEditor] = useState(false);

  const projections = useMemo(() => computeYearlyProjections(state), [state]);

  const currentYear = projections[0];
  const finalYear = projections[projections.length - 1];
  const retirementYear = projections.find((p) => p.age === 65);

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

      {/* Asset Breakdown + Liabilities */}
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

      {/* Data Table */}
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
    </div>
  );
}
