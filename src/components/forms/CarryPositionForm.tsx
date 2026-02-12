'use client';

import { useState } from 'react';
import { CarryPosition } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { generateId } from '@/lib/generateId';
import FormField from '@/components/ui/FormField';

interface CarryPositionFormProps {
  existing?: CarryPosition;
  onClose: () => void;
}

export default function CarryPositionForm({ existing, onClose }: CarryPositionFormProps) {
  const { dispatch } = useFinance();

  const [fundName, setFundName] = useState(existing?.fundName ?? '');
  const [provider, setProvider] = useState(existing?.provider ?? '');
  const [fundSize, setFundSize] = useState(existing?.fundSize?.toString() ?? '');
  const [committedCapital, setCommittedCapital] = useState(
    existing?.committedCapital?.toString() ?? '',
  );
  const [carryPercent, setCarryPercent] = useState(
    existing ? (existing.carryPercent * 100).toString() : '20',
  );
  const [hurdleRate, setHurdleRate] = useState(
    existing ? (existing.hurdleRate * 100).toString() : '8',
  );
  const [personalSharePercent, setPersonalSharePercent] = useState(
    existing ? (existing.personalSharePercent * 100).toString() : '',
  );
  const [linkedAssetId, setLinkedAssetId] = useState(existing?.linkedAssetId ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { state } = useFinance();
  const fundAssets = state.assets.filter((a) => a.category === 'fund');

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fundName.trim()) errs.fundName = 'Fund name is required';
    if (!fundSize || isNaN(Number(fundSize)) || Number(fundSize) <= 0)
      errs.fundSize = 'Valid fund size required';
    if (!committedCapital || isNaN(Number(committedCapital)) || Number(committedCapital) <= 0)
      errs.committedCapital = 'Valid committed capital required';
    if (!carryPercent || isNaN(Number(carryPercent))) errs.carryPercent = 'Valid carry % required';
    if (!personalSharePercent || isNaN(Number(personalSharePercent)))
      errs.personalSharePercent = 'Valid personal share % required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const position: CarryPosition = {
      id: existing?.id ?? generateId('carry'),
      fundName: fundName.trim(),
      provider: provider.trim(),
      fundSize: Number(fundSize),
      committedCapital: Number(committedCapital),
      carryPercent: Number(carryPercent) / 100,
      hurdleRate: hurdleRate ? Number(hurdleRate) / 100 : 0,
      personalSharePercent: Number(personalSharePercent) / 100,
      portfolioCompanies: existing?.portfolioCompanies ?? [],
      ...(linkedAssetId ? { linkedAssetId } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    if (existing) {
      dispatch({ type: 'UPDATE_CARRY_POSITION', payload: position });
    } else {
      dispatch({ type: 'ADD_CARRY_POSITION', payload: position });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Fund Name" required error={errors.fundName}>
        <input
          type="text"
          value={fundName}
          onChange={(e) => {
            setFundName(e.target.value);
            setErrors((prev) => ({ ...prev, fundName: '' }));
          }}
          placeholder="e.g. Lunar I"
          className={inputClass}
        />
      </FormField>

      <FormField label="Provider">
        <input
          type="text"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="e.g. Lunar Ventures"
          className={inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fund Size" required error={errors.fundSize}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              £
            </span>
            <input
              type="number"
              step="1"
              value={fundSize}
              onChange={(e) => {
                setFundSize(e.target.value);
                setErrors((prev) => ({ ...prev, fundSize: '' }));
              }}
              className={`${inputClass} pl-7`}
            />
          </div>
        </FormField>

        <FormField label="Committed Capital" required error={errors.committedCapital}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              £
            </span>
            <input
              type="number"
              step="1"
              value={committedCapital}
              onChange={(e) => {
                setCommittedCapital(e.target.value);
                setErrors((prev) => ({ ...prev, committedCapital: '' }));
              }}
              className={`${inputClass} pl-7`}
            />
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Carry %" required error={errors.carryPercent}>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={carryPercent}
              onChange={(e) => {
                setCarryPercent(e.target.value);
                setErrors((prev) => ({ ...prev, carryPercent: '' }));
              }}
              className={`${inputClass} pr-7`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              %
            </span>
          </div>
        </FormField>

        <FormField label="Hurdle Rate">
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={hurdleRate}
              onChange={(e) => setHurdleRate(e.target.value)}
              placeholder="0"
              className={`${inputClass} pr-7`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              %
            </span>
          </div>
        </FormField>

        <FormField label="Personal Share %" required error={errors.personalSharePercent}>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={personalSharePercent}
              onChange={(e) => {
                setPersonalSharePercent(e.target.value);
                setErrors((prev) => ({ ...prev, personalSharePercent: '' }));
              }}
              className={`${inputClass} pr-7`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              %
            </span>
          </div>
        </FormField>
      </div>

      <FormField label="Linked Asset">
        <select
          value={linkedAssetId}
          onChange={(e) => setLinkedAssetId(e.target.value)}
          className={inputClass}
        >
          <option value="">None</option>
          {fundAssets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.provider})
            </option>
          ))}
        </select>
      </FormField>

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
          {existing ? 'Save Changes' : 'Add Fund'}
        </button>
      </div>
    </form>
  );
}
