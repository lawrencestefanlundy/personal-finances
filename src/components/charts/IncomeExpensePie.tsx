'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MonthlySnapshot, Expense } from '@/types/finance';
import { expenseCategories } from '@/data/categories';
import { formatCurrency } from '@/lib/formatters';

interface IncomeExpensePieProps {
  snapshot: MonthlySnapshot;
  expenses: Expense[];
}

export default function IncomeExpensePie({ snapshot, expenses }: IncomeExpensePieProps) {
  const categoryTotals: Record<string, number> = {};

  for (const expense of expenses) {
    const amount = snapshot.expenseBreakdown[expense.id] || 0;
    if (amount > 0) {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + amount;
    }
  }

  const data = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      name: expenseCategories[category as keyof typeof expenseCategories]?.label || category,
      value: amount,
      color: expenseCategories[category as keyof typeof expenseCategories]?.color || '#6b7280',
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Tooltip formatter={((value: number) => formatCurrency(value)) as any} />
      </PieChart>
    </ResponsiveContainer>
  );
}
