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
import { formatCurrency } from '@/lib/formatters';

interface CashFlowChartProps {
  snapshots: MonthlySnapshot[];
}

function getQuarterLabel(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const monthNum = parseInt(monthStr);
  const quarter = Math.ceil(monthNum / 3);
  return `Q${quarter} ${yearStr}`;
}

interface QuarterlyData {
  quarter: string;
  income: number;
  expenses: number;
  balance: number;
  net: number;
}

function aggregateToQuarterly(snapshots: MonthlySnapshot[]): QuarterlyData[] {
  const quarterMap = new Map<string, { income: number; expenses: number; balance: number; net: number }>();

  for (const s of snapshots) {
    const label = getQuarterLabel(s.month);
    const existing = quarterMap.get(label);
    if (existing) {
      existing.income += s.totalIncome;
      existing.expenses += s.totalExpenses;
      existing.net += s.netCashFlow;
      existing.balance = s.runningBalance; // take last month's balance in the quarter
    } else {
      quarterMap.set(label, {
        income: s.totalIncome,
        expenses: s.totalExpenses,
        net: s.netCashFlow,
        balance: s.runningBalance,
      });
    }
  }

  return Array.from(quarterMap.entries()).map(([quarter, data]) => ({
    quarter,
    income: data.income,
    expenses: -data.expenses,
    balance: data.balance,
    net: data.net,
  }));
}

export default function CashFlowChart({ snapshots }: CashFlowChartProps) {
  const data = aggregateToQuarterly(snapshots);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
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
