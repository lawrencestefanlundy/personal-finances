'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { YearlyProjection, Liability } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';

interface LiabilityChartProps {
  projections: YearlyProjection[];
  liabilities: Liability[];
}

const LIABILITY_COLORS = ['#ef4444', '#f97316', '#f59e0b'];

export default function LiabilityChart({ projections, liabilities }: LiabilityChartProps) {
  const data = projections.map((p) => {
    const row: Record<string, number> = { year: p.year };
    for (const liability of liabilities) {
      row[liability.id] = p.liabilities[liability.id] || 0;
    }
    row.total = p.totalLiabilities;
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number, name: string) => {
            const liability = liabilities.find((l) => l.id === name);
            return [formatCurrency(value), liability?.name || name];
          }) as any}
        />
        <Legend
          formatter={(value) => {
            if (value === 'total') return 'Total Liabilities';
            const liability = liabilities.find((l) => l.id === value);
            return liability?.name || value;
          }}
        />
        {liabilities.map((liability, i) => (
          <Line
            key={liability.id}
            type="monotone"
            dataKey={liability.id}
            stroke={LIABILITY_COLORS[i % LIABILITY_COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
        <Line
          type="monotone"
          dataKey="total"
          stroke="#1e293b"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
