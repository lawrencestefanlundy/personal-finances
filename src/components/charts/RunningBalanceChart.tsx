'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { MonthlySnapshot } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';

interface RunningBalanceChartProps {
  snapshots: MonthlySnapshot[];
  dangerThreshold?: number;
}

function formatMonthShort(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(monthStr) - 1]} ${yearStr.slice(2)}`;
}

export default function RunningBalanceChart({ snapshots, dangerThreshold = 10000 }: RunningBalanceChartProps) {
  const data = snapshots.map((s) => ({
    month: s.month,
    label: formatMonthShort(s.month),
    balance: s.runningBalance,
    aboveDanger: s.runningBalance >= dangerThreshold ? s.runningBalance : dangerThreshold,
    belowDanger: s.runningBalance < dangerThreshold ? s.runningBalance : dangerThreshold,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number) => [formatCurrency(value), 'Running Balance']) as any}
          labelFormatter={(label) => String(label)}
        />
        <ReferenceLine
          y={dangerThreshold}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{ value: `£${(dangerThreshold / 1000).toFixed(0)}k threshold`, position: 'right', fontSize: 10, fill: '#ef4444' }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#3b82f6"
          fill="url(#balanceGradient)"
          strokeWidth={2}
          name="Running Balance"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
