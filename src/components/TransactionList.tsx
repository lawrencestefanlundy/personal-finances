'use client';

import { useState } from 'react';
import { Transaction } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  limit?: number;
}

export default function TransactionList({ transactions, limit = 20 }: TransactionListProps) {
  const [expanded, setExpanded] = useState(false);

  if (transactions.length === 0) return null;

  // Sort newest first
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const shown = expanded ? sorted : sorted.slice(0, limit);

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-2"
      >
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Recent Transactions ({transactions.length})
      </button>

      {expanded && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Date</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Description</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-1.5 px-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-1.5 px-3 text-slate-900 truncate max-w-[200px]">
                    {tx.description}
                  </td>
                  <td
                    className={`py-1.5 px-3 text-right font-medium whitespace-nowrap ${
                      tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {tx.amount >= 0 ? '+' : ''}
                    {formatCurrency(Math.abs(tx.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!expanded && sorted.length > limit && (
        <p className="text-xs text-slate-400 mt-1 ml-6">
          {sorted.length} transactions total — click to expand
        </p>
      )}
    </div>
  );
}
