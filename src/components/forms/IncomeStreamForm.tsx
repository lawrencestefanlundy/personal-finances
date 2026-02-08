'use client';

import { useState } from 'react';
import { IncomeStream, IncomeFrequency } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { generateId } from '@/lib/generateId';
import FormField from '@/components/ui/FormField';
import MonthPicker from '@/components/ui/MonthPicker';

const FREQUENCIES: { value: IncomeFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
];

const OWNERS: { value: IncomeStream['owner']; label: string }[] = [
  { value: 'lawrence', label: 'Lawrence' },
  { value: 'stephanie', label: 'Stephanie' },
  { value: 'joint', label: 'Joint' },
];

interface IncomeStreamFormProps {
  existing?: IncomeStream;
  onClose: () => void;
}

export default function IncomeStreamForm({ existing, onClose }: IncomeStreamFormProps) {
  const { dispatch } = useFinance();

  const [name, setName] = useState(existing?.name ?? '');
  const [amount, setAmount] = useState(existing?.amount?.toString() ?? '');
  const [frequency, setFrequency] = useState<IncomeFrequency>(existing?.frequency ?? 'monthly');
  const [owner, setOwner] = useState<IncomeStream['owner']>(existing?.owner ?? 'lawrence');
  const [taxable, setTaxable] = useState(existing?.taxable ?? true);
  const [paymentMonths, setPaymentMonths] = useState<number[]>(existing?.paymentMonths ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectClass = inputClass;

  const showPaymentMonths = frequency !== 'monthly';

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) errs.amount = 'Valid amount is required';
    if (showPaymentMonths && paymentMonths.length === 0) errs.paymentMonths = 'Select at least one payment month';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const income: IncomeStream = {
      id: existing?.id ?? generateId('inc'),
      name: name.trim(),
      amount: Number(amount),
      frequency,
      owner,
      taxable,
      ...(showPaymentMonths && paymentMonths.length > 0 ? { paymentMonths } : {}),
    };

    if (existing) {
      dispatch({ type: 'UPDATE_INCOME_STREAM', payload: income });
    } else {
      dispatch({ type: 'ADD_INCOME_STREAM', payload: income });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Name" required error={errors.name}>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
          placeholder="e.g. Salary"
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

      <FormField label="Frequency" required>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value as IncomeFrequency)} className={selectClass}>
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Owner" required>
        <select value={owner} onChange={(e) => setOwner(e.target.value as IncomeStream['owner'])} className={selectClass}>
          {OWNERS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </FormField>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="taxable"
          checked={taxable}
          onChange={(e) => setTaxable(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="taxable" className="text-sm text-slate-700">Taxable income</label>
      </div>

      {showPaymentMonths && (
        <div>
          <MonthPicker
            label="Payment Months"
            selected={paymentMonths}
            onChange={(m) => { setPaymentMonths(m); setErrors((prev) => ({ ...prev, paymentMonths: '' })); }}
          />
          {errors.paymentMonths && <p className="text-xs text-red-500 mt-1">{errors.paymentMonths}</p>}
        </div>
      )}

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
          {existing ? 'Save Changes' : 'Add Income Stream'}
        </button>
      </div>
    </form>
  );
}
