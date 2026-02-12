'use client';

import { useState } from 'react';
import { CarryPosition, PortfolioCompany, PortfolioCompanyStatus } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { generateId } from '@/lib/generateId';
import FormField from '@/components/ui/FormField';

interface PortfolioCompanyFormProps {
  carryPosition: CarryPosition;
  existing?: PortfolioCompany;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: PortfolioCompanyStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'marked_up', label: 'Marked Up' },
  { value: 'exited', label: 'Exited' },
  { value: 'written_off', label: 'Written Off' },
];

export default function PortfolioCompanyForm({
  carryPosition,
  existing,
  onClose,
}: PortfolioCompanyFormProps) {
  const { dispatch } = useFinance();

  const [name, setName] = useState(existing?.name ?? '');
  const [investedAmount, setInvestedAmount] = useState(existing?.investedAmount?.toString() ?? '');
  const [currentValuation, setCurrentValuation] = useState(
    existing?.currentValuation?.toString() ?? '',
  );
  const [ownershipPercent, setOwnershipPercent] = useState(
    existing ? (existing.ownershipPercent * 100).toString() : '',
  );
  const [status, setStatus] = useState<PortfolioCompanyStatus>(existing?.status ?? 'active');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Company name is required';
    if (!investedAmount || isNaN(Number(investedAmount)))
      errs.investedAmount = 'Valid amount required';
    if (!currentValuation || isNaN(Number(currentValuation)))
      errs.currentValuation = 'Valid valuation required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const company: PortfolioCompany = {
      id: existing?.id ?? generateId('pco'),
      name: name.trim(),
      investedAmount: Number(investedAmount),
      currentValuation: Number(currentValuation),
      ownershipPercent: ownershipPercent ? Number(ownershipPercent) / 100 : 0,
      status,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    let updatedCompanies: PortfolioCompany[];
    if (existing) {
      updatedCompanies = carryPosition.portfolioCompanies.map((c) =>
        c.id === company.id ? company : c,
      );
    } else {
      updatedCompanies = [...carryPosition.portfolioCompanies, company];
    }

    dispatch({
      type: 'UPDATE_CARRY_POSITION',
      payload: { ...carryPosition, portfolioCompanies: updatedCompanies },
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Company Name" required error={errors.name}>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((prev) => ({ ...prev, name: '' }));
          }}
          placeholder="e.g. Acme Corp"
          className={inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Invested Amount" required error={errors.investedAmount}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              £
            </span>
            <input
              type="number"
              step="1"
              value={investedAmount}
              onChange={(e) => {
                setInvestedAmount(e.target.value);
                setErrors((prev) => ({ ...prev, investedAmount: '' }));
              }}
              className={`${inputClass} pl-7`}
            />
          </div>
        </FormField>

        <FormField label="Current Valuation" required error={errors.currentValuation}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              £
            </span>
            <input
              type="number"
              step="1"
              value={currentValuation}
              onChange={(e) => {
                setCurrentValuation(e.target.value);
                setErrors((prev) => ({ ...prev, currentValuation: '' }));
              }}
              className={`${inputClass} pl-7`}
            />
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Ownership %">
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={ownershipPercent}
              onChange={(e) => setOwnershipPercent(e.target.value)}
              placeholder="0"
              className={`${inputClass} pr-7`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              %
            </span>
          </div>
        </FormField>

        <FormField label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PortfolioCompanyStatus)}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

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
          {existing ? 'Save Changes' : 'Add Company'}
        </button>
      </div>
    </form>
  );
}
