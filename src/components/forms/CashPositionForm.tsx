'use client';

import { useState } from 'react';
import { CashPosition } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { generateId } from '@/lib/generateId';
import FormField from '@/components/ui/FormField';

const CATEGORIES: { value: CashPosition['category']; label: string }[] = [
  { value: 'cash', label: 'Current Account' },
  { value: 'savings', label: 'Savings' },
  { value: 'isa', label: 'ISA' },
  { value: 'crypto', label: 'Crypto' },
];

interface CashPositionFormProps {
  existing?: CashPosition;
  onClose: () => void;
}

export default function CashPositionForm({ existing, onClose }: CashPositionFormProps) {
  const { dispatch } = useFinance();

  const [name, setName] = useState(existing?.name ?? '');
  const [provider, setProvider] = useState(existing?.provider ?? '');
  const [balance, setBalance] = useState(existing?.balance?.toString() ?? '');
  const [interestRate, setInterestRate] = useState(
    existing ? (existing.interestRate * 100).toString() : '',
  );
  const [category, setCategory] = useState<CashPosition['category']>(existing?.category ?? 'cash');
  const [isLiquid, setIsLiquid] = useState(existing?.isLiquid ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectClass = inputClass;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!balance || isNaN(Number(balance))) errs.balance = 'Valid balance is required';
    if (interestRate !== '' && isNaN(Number(interestRate))) errs.interestRate = 'Must be a number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cashPosition: CashPosition = {
      id: existing?.id ?? generateId('cash'),
      name: name.trim(),
      balance: Number(balance),
      interestRate: interestRate ? Number(interestRate) / 100 : 0,
      category,
      isLiquid,
      ...(provider.trim() ? { provider: provider.trim() } : {}),
    };

    if (existing) {
      dispatch({ type: 'UPDATE_CASH_POSITION', payload: cashPosition });
    } else {
      dispatch({ type: 'ADD_CASH_POSITION', payload: cashPosition });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Name" required error={errors.name}>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((prev) => ({ ...prev, name: '' }));
          }}
          placeholder="e.g. Bank Account"
          className={inputClass}
        />
      </FormField>

      <FormField label="Provider">
        <input
          type="text"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="e.g. Monzo, Chase"
          className={inputClass}
        />
      </FormField>

      <FormField label="Balance" required error={errors.balance}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
          <input
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => {
              setBalance(e.target.value);
              setErrors((prev) => ({ ...prev, balance: '' }));
            }}
            className={`${inputClass} pl-7`}
          />
        </div>
      </FormField>

      <FormField label="Interest Rate (%)" error={errors.interestRate}>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            value={interestRate}
            onChange={(e) => {
              setInterestRate(e.target.value);
              setErrors((prev) => ({ ...prev, interestRate: '' }));
            }}
            placeholder="0"
            className={`${inputClass} pr-7`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            %
          </span>
        </div>
      </FormField>

      <FormField label="Category" required>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CashPosition['category'])}
          className={selectClass}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isLiquid"
          checked={isLiquid}
          onChange={(e) => setIsLiquid(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isLiquid" className="text-sm text-slate-700">
          Liquid (easily accessible)
        </label>
      </div>

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
          {existing ? 'Save Changes' : 'Add Cash Position'}
        </button>
      </div>
    </form>
  );
}
