'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MonthlySnapshot } from '@/types/finance';
import { formatMonthShort, formatCurrency } from '@/lib/formatters';

interface CashFlowChartProps {
  snapshots: MonthlySnapshot[];
}

export default function CashFlowChart({ snapshots }: CashFlowChartProps) {
  const data = snapshots.map((s) => ({
    month: formatMonthShort(s.month),
    fullMonth: s.month,
    income: s.totalIncome,
    expenses: -s.totalExpenses,
    balance: s.runningBalance,
    net: s.netCashFlow,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis
          yAxisId="bars"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          yAxisId="line"
          orientation="right"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number, name: string) => [
            formatCurrency(Math.abs(value)),
            name === 'expenses' ? 'Expenses' : name === 'income' ? 'Income' : name === 'balance' ? 'Balance' : 'Net',
          ]) as any}
        />
        <Legend />
        <Bar yAxisId="bars" dataKey="income" fill="#10b981" name="Income" radius={[2, 2, 0, 0]} />
        <Bar yAxisId="bars" dataKey="expenses" fill="#ef4444" name="Expenses" radius={[2, 2, 0, 0]} />
        <Line
          yAxisId="line"
          type="monotone"
          dataKey="balance"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="Balance"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
