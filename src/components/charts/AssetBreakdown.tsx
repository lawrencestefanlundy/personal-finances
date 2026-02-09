'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { YearlyProjection, Asset } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';
import { assetCategories } from '@/data/categories';

interface AssetBreakdownProps {
  projections: YearlyProjection[];
  assets: Asset[];
}

const ASSET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#06b6d4', '#a855f7', '#dc2626', '#0ea5e9', '#d946ef',
  '#65a30d', '#0891b2', '#c026d3', '#ea580c', '#4f46e5',
  '#059669', '#e11d48', '#7c3aed', '#2563eb',
];

export default function AssetBreakdown({ projections, assets }: AssetBreakdownProps) {
  const data = projections.map((p) => {
    const row: Record<string, number> = { year: p.year };
    for (const asset of assets) {
      row[asset.id] = p.assets[asset.id] || 0;
    }
    return row;
  });

  // Filter to assets that have non-zero values
  const activeAssets = assets.filter((a) =>
    projections.some((p) => (p.assets[a.id] || 0) > 0)
  );

  return (
    <ResponsiveContainer width="100%" height={500}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `£${(v / 1000000).toFixed(1)}M`}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number, name: string) => {
            const asset = assets.find((a) => a.id === name);
            return [formatCurrency(value), asset?.name || name];
          }) as any}
          labelFormatter={(label) => String(label)}
        />
        <Legend
          formatter={(value) => {
            const asset = assets.find((a) => a.id === value);
            return asset?.name || value;
          }}
        />
        {activeAssets.map((asset, i) => (
          <Area
            key={asset.id}
            type="monotone"
            dataKey={asset.id}
            stackId="1"
            stroke={ASSET_COLORS[i % ASSET_COLORS.length]}
            fill={ASSET_COLORS[i % ASSET_COLORS.length]}
            fillOpacity={0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
