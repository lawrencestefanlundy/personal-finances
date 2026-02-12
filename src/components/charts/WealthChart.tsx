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
import { YearlyProjection } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';

interface WealthChartProps {
  projections: YearlyProjection[];
}

export default function WealthChart({ projections }: WealthChartProps) {
  const data = projections.map((p) => ({
    year: p.year,
    age: p.age,
    label: `${p.year} (${p.age})`,
    netWealth: p.netWealth,
    totalAssets: p.totalAssets,
    totalLiabilities: p.totalLiabilities,
    liquidAssets: p.liquidAssets,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${(v / 1000000).toFixed(1)}M`} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number, name: string) => [formatCurrency(value), name]) as any}
          labelFormatter={(label) => {
            const item = data.find((d) => d.year === label);
            return item ? `${item.year} (Age ${item.age})` : String(label);
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="netWealth"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.15}
          strokeWidth={2}
          name="Net Wealth"
        />
        <Area
          type="monotone"
          dataKey="liquidAssets"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.1}
          strokeWidth={2}
          name="Liquid Assets"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
