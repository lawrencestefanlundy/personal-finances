'use client';

import { useState } from 'react';
import { Expense, ExpenseFrequency, ExpenseCategory } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { generateId } from '@/lib/generateId';
import { expenseCategories } from '@/data/categories';
import FormField from '@/components/ui/FormField';
import MonthPicker from '@/components/ui/MonthPicker';

const FREQUENCIES: { value: ExpenseFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'termly', label: 'Termly' },
  { value: 'annual', label: 'Annual' },
  { value: 'bimonthly', label: 'Bimonthly' },
  { value: 'one-off', label: 'One-off' },
];

interface ExpenseFormProps {
  existing?: Expense;
  onClose: () => void;
}

export default function ExpenseForm({ existing, onClose }: ExpenseFormProps) {
  const { dispatch } = useFinance();

  const [name, setName] = useState(existing?.name ?? '');
  const [provider, setProvider] = useState(existing?.provider ?? '');
  const [amount, setAmount] = useState(existing?.amount?.toString() ?? '');
  const [frequency, setFrequency] = useState<ExpenseFrequency>(existing?.frequency ?? 'monthly');
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category ?? 'other');
  const [paymentMonths, setPaymentMonths] = useState<number[]>(existing?.paymentMonths ?? []);
  const [activeMonths, setActiveMonths] = useState<number[]>(existing?.activeMonths ?? []);
  const [startDate, setStartDate] = useState(existing?.startDate ?? '');
  const [endDate, setEndDate] = useState(existing?.endDate ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectClass = inputClass;

  const showPaymentMonths = ['quarterly', 'termly', 'annual', 'bimonthly'].includes(frequency);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) errs.amount = 'Valid amount is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const expense: Expense = {
      id: existing?.id ?? generateId('exp'),
      name: name.trim(),
      amount: Number(amount),
      frequency,
      category,
      ...(provider.trim() ? { provider: provider.trim() } : {}),
      ...(showPaymentMonths && paymentMonths.length > 0 ? { paymentMonths } : {}),
      ...(activeMonths.length > 0 ? { activeMonths } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    if (existing) {
      dispatch({ type: 'UPDATE_EXPENSE', payload: expense });
    } else {
      dispatch({ type: 'ADD_EXPENSE', payload: expense });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Core fields */}
      <FormField label="Name" required error={errors.name}>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
          placeholder="e.g. Council Tax"
          className={inputClass}
        />
      </FormField>

      <FormField label="Provider">
        <input
          type="text"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="e.g. Haringey Council"
          className={inputClass}
        />
      </FormField>

      <FormField label="Amount (per period)" required error={errors.amount}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors((prev) => ({ ...prev, amount: '' })); }}
            className={`${inputClass} pl-7`}
          />
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Frequency" required>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as ExpenseFrequency)} className={selectClass}>
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Category" required>
          <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={selectClass}>
            {Object.entries(expenseCategories).map(([value, meta]) => (
              <option key={value} value={value}>{meta.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Timing fields */}
      {showPaymentMonths && (
        <MonthPicker
          label="Payment Months"
          selected={paymentMonths}
          onChange={setPaymentMonths}
        />
      )}

      <MonthPicker
        label="Active Months (leave empty for all year)"
        selected={activeMonths}
        onChange={setActiveMonths}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start Date">
          <input
            type="month"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="End Date">
          <input
            type="month"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </div>

      {/* Notes */}
      <FormField label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional notes..."
          className={inputClass}
        />
      </FormField>

      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {existing ? 'Save Changes' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
}
