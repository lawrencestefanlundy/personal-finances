'use client';

import { MonthlySnapshot, Expense } from '@/types/finance';
import { expenseCategories } from '@/data/categories';
import { formatCurrency } from '@/lib/formatters';

interface IncomeExpensePieProps {
  snapshot: MonthlySnapshot;
  expenses: Expense[];
}

export default function IncomeExpensePie({ snapshot }: IncomeExpensePieProps) {
  const entries = Object.entries(snapshot.expenseBreakdown).filter(([, v]) => v > 0);

  if (entries.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No expenses this month.</p>;
  }

  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-2">
      {entries
        .sort(([, a], [, b]) => b - a)
        .map(([name, value]) => {
          const pct = ((value / total) * 100).toFixed(1);
          const category = Object.values(expenseCategories).find(
            (c) => c.label.toLowerCase() === name.toLowerCase(),
          );
          const color = category?.color ?? '#6b7280';
          return (
            <div key={name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-700">{name}</span>
              </div>
              <span className="text-slate-900 font-medium">
                {formatCurrency(value)} ({pct}%)
              </span>
            </div>
          );
        })}
    </div>
  );
}
