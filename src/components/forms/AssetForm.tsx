'use client';

import { useState } from 'react';
import { Asset, AssetCategory } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { generateId } from '@/lib/generateId';
import { assetCategories } from '@/data/categories';
import FormField from '@/components/ui/FormField';

interface AssetFormProps {
  existing?: Asset;
  onClose: () => void;
}

export default function AssetForm({ existing, onClose }: AssetFormProps) {
  const { dispatch } = useFinance();

  const [name, setName] = useState(existing?.name ?? '');
  const [provider, setProvider] = useState(existing?.provider ?? '');
  const [currentValue, setCurrentValue] = useState(existing?.currentValue?.toString() ?? '');
  const [annualGrowthRate, setAnnualGrowthRate] = useState(
    existing ? (existing.annualGrowthRate * 100).toString() : ''
  );
  const [category, setCategory] = useState<AssetCategory>(existing?.category ?? 'savings');
  const [isLiquid, setIsLiquid] = useState(existing?.isLiquid ?? true);
  const [unlockYear, setUnlockYear] = useState(existing?.unlockYear?.toString() ?? '');
  const [endYear, setEndYear] = useState(existing?.endYear?.toString() ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectClass = inputClass;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!currentValue || isNaN(Number(currentValue))) errs.currentValue = 'Valid value is required';
    if (annualGrowthRate !== '' && isNaN(Number(annualGrowthRate))) errs.annualGrowthRate = 'Must be a number';
    if (unlockYear && (isNaN(Number(unlockYear)) || Number(unlockYear) < 2000 || Number(unlockYear) > 2100)) errs.unlockYear = 'Valid year (2000-2100)';
    if (endYear && (isNaN(Number(endYear)) || Number(endYear) < 2000 || Number(endYear) > 2100)) errs.endYear = 'Valid year (2000-2100)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const asset: Asset = {
      id: existing?.id ?? generateId('asset'),
      name: name.trim(),
      currentValue: Number(currentValue),
      annualGrowthRate: annualGrowthRate ? Number(annualGrowthRate) / 100 : 0,
      category,
      isLiquid,
      ...(unlockYear ? { unlockYear: Number(unlockYear) } : {}),
      ...(endYear ? { endYear: Number(endYear) } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      ...(provider.trim() ? { provider: provider.trim() } : {}),
    };

    if (existing) {
      dispatch({ type: 'UPDATE_ASSET', payload: asset });
    } else {
      dispatch({ type: 'ADD_ASSET', payload: asset });
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
          placeholder="e.g. Lunar Fund I"
          className={inputClass}
        />
      </FormField>

      <FormField label="Provider">
        <input
          type="text"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="e.g. Vanguard, Coinbase"
          className={inputClass}
        />
      </FormField>

      <FormField label="Current Value" required error={errors.currentValue}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
          <input
            type="number"
            step="0.01"
            value={currentValue}
            onChange={(e) => { setCurrentValue(e.target.value); setErrors((prev) => ({ ...prev, currentValue: '' })); }}
            className={`${inputClass} pl-7`}
          />
        </div>
      </FormField>

      <FormField label="Annual Growth Rate (%)" error={errors.annualGrowthRate}>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            value={annualGrowthRate}
            onChange={(e) => { setAnnualGrowthRate(e.target.value); setErrors((prev) => ({ ...prev, annualGrowthRate: '' })); }}
            placeholder="0"
            className={`${inputClass} pr-7`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
        </div>
      </FormField>

      <FormField label="Category" required>
        <select value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)} className={selectClass}>
          {Object.entries(assetCategories).map(([value, meta]) => (
            <option key={value} value={value}>{meta.label}</option>
          ))}
        </select>
      </FormField>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="assetLiquid"
          checked={isLiquid}
          onChange={(e) => setIsLiquid(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="assetLiquid" className="text-sm text-slate-700">Liquid asset</label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Unlock Year" error={errors.unlockYear}>
          <input
            type="number"
            value={unlockYear}
            onChange={(e) => { setUnlockYear(e.target.value); setErrors((prev) => ({ ...prev, unlockYear: '' })); }}
            placeholder="e.g. 2030"
            className={inputClass}
          />
        </FormField>

        <FormField label="End Year" error={errors.endYear}>
          <input
            type="number"
            value={endYear}
            onChange={(e) => { setEndYear(e.target.value); setErrors((prev) => ({ ...prev, endYear: '' })); }}
            placeholder="e.g. 2040"
            className={inputClass}
          />
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
          {existing ? 'Save Changes' : 'Add Asset'}
        </button>
      </div>
    </form>
  );
}
