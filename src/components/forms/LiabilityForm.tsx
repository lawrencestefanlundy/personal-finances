'use client';

import { useState } from 'react';
import { Liability } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { generateId } from '@/lib/generateId';
import FormField from '@/components/ui/FormField';

const TYPES: { value: Liability['type']; label: string }[] = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'other', label: 'Other' },
];

interface LiabilityFormProps {
  existing?: Liability;
  onClose: () => void;
}

export default function LiabilityForm({ existing, onClose }: LiabilityFormProps) {
  const { dispatch } = useFinance();

  const [name, setName] = useState(existing?.name ?? '');
  const [provider, setProvider] = useState(existing?.provider ?? '');
  const [currentBalance, setCurrentBalance] = useState(existing?.currentBalance?.toString() ?? '');
  const [interestRate, setInterestRate] = useState(
    existing ? (existing.interestRate * 100).toString() : '',
  );
  const [monthlyPayment, setMonthlyPayment] = useState(existing?.monthlyPayment?.toString() ?? '');
  const [type, setType] = useState<Liability['type']>(existing?.type ?? 'other');
  const [endYear, setEndYear] = useState(existing?.endYear?.toString() ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectClass = inputClass;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!currentBalance || isNaN(Number(currentBalance)))
      errs.currentBalance = 'Valid balance is required';
    if (interestRate !== '' && isNaN(Number(interestRate))) errs.interestRate = 'Must be a number';
    if (monthlyPayment !== '' && isNaN(Number(monthlyPayment)))
      errs.monthlyPayment = 'Must be a number';
    if (endYear && (isNaN(Number(endYear)) || Number(endYear) < 2000 || Number(endYear) > 2100))
      errs.endYear = 'Valid year (2000-2100)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const liability: Liability = {
      id: existing?.id ?? generateId('liab'),
      name: name.trim(),
      currentBalance: Number(currentBalance),
      interestRate: interestRate ? Number(interestRate) / 100 : 0,
      monthlyPayment: monthlyPayment ? Number(monthlyPayment) : 0,
      type,
      ...(endYear ? { endYear: Number(endYear) } : {}),
      ...(provider.trim() ? { provider: provider.trim() } : {}),
    };

    if (existing) {
      dispatch({ type: 'UPDATE_LIABILITY', payload: liability });
    } else {
      dispatch({ type: 'ADD_LIABILITY', payload: liability });
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
          placeholder="e.g. Mortgage"
          className={inputClass}
        />
      </FormField>

      <FormField label="Provider / Lender">
        <input
          type="text"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="e.g. Aldermore, SLC"
          className={inputClass}
        />
      </FormField>

      <FormField label="Current Balance" required error={errors.currentBalance}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
          <input
            type="number"
            step="0.01"
            value={currentBalance}
            onChange={(e) => {
              setCurrentBalance(e.target.value);
              setErrors((prev) => ({ ...prev, currentBalance: '' }));
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

      <FormField label="Monthly Payment" error={errors.monthlyPayment}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
          <input
            type="number"
            step="0.01"
            value={monthlyPayment}
            onChange={(e) => {
              setMonthlyPayment(e.target.value);
              setErrors((prev) => ({ ...prev, monthlyPayment: '' }));
            }}
            className={`${inputClass} pl-7`}
          />
        </div>
      </FormField>

      <FormField label="Type" required>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as Liability['type'])}
          className={selectClass}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="End Year" error={errors.endYear}>
        <input
          type="number"
          value={endYear}
          onChange={(e) => {
            setEndYear(e.target.value);
            setErrors((prev) => ({ ...prev, endYear: '' }));
          }}
          placeholder="e.g. 2050"
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
          {existing ? 'Save Changes' : 'Add Liability'}
        </button>
      </div>
    </form>
  );
}
