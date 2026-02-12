'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { CarryPosition, PortfolioCompany } from '@/types/finance';
import {
  computeCarryScenarios,
  computePortfolioMetrics,
  computeTotalPersonalCarryAtMultiple,
} from '@/lib/carryCalculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import StatCard from '@/components/StatCard';
import { PencilIcon, TrashIcon, PlusIcon } from '@/components/ui/Icons';
import SlidePanel from '@/components/ui/SlidePanel';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import CarryPositionForm from '@/components/forms/CarryPositionForm';
import PortfolioCompanyForm from '@/components/forms/PortfolioCompanyForm';
import ProviderLogo from '@/components/ui/ProviderLogo';

const MULTIPLES = [2.5, 3.0, 4.0, 5.0];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#10b981', bg: '#ecfdf5' },
  marked_up: { label: 'Marked Up', color: '#8b5cf6', bg: '#f5f3ff' },
  exited: { label: 'Exited', color: '#3b82f6', bg: '#eff6ff' },
  written_off: { label: 'Written Off', color: '#ef4444', bg: '#fef2f2' },
};

export default function CarryPage() {
  const { state, dispatch } = useFinance();

  // Carry position CRUD
  const [fundPanelOpen, setFundPanelOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<CarryPosition | undefined>(undefined);
  const [deleteFundTarget, setDeleteFundTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Portfolio company CRUD
  const [companyPanelOpen, setCompanyPanelOpen] = useState(false);
  const [companyContext, setCompanyContext] = useState<CarryPosition | null>(null);
  const [editingCompany, setEditingCompany] = useState<PortfolioCompany | undefined>(undefined);
  const [deleteCompanyTarget, setDeleteCompanyTarget] = useState<{
    carryPosition: CarryPosition;
    company: PortfolioCompany;
  } | null>(null);

  // Computed
  const totalCarryAt3x = useMemo(
    () => computeTotalPersonalCarryAtMultiple(state.carryPositions, 3.0),
    [state.carryPositions],
  );
  const totalCarryAt5x = useMemo(
    () => computeTotalPersonalCarryAtMultiple(state.carryPositions, 5.0),
    [state.carryPositions],
  );
  const totalCompanies = state.carryPositions.reduce(
    (sum, cp) => sum + cp.portfolioCompanies.length,
    0,
  );

  // Fund handlers
  const closeFundPanel = () => {
    setFundPanelOpen(false);
    setEditingFund(undefined);
  };
  const handleDeleteFund = () => {
    if (deleteFundTarget) {
      dispatch({ type: 'DELETE_CARRY_POSITION', payload: deleteFundTarget.id });
      setDeleteFundTarget(null);
    }
  };

  // Company handlers
  const openAddCompany = (cp: CarryPosition) => {
    setCompanyContext(cp);
    setEditingCompany(undefined);
    setCompanyPanelOpen(true);
  };
  const openEditCompany = (cp: CarryPosition, company: PortfolioCompany) => {
    setCompanyContext(cp);
    setEditingCompany(company);
    setCompanyPanelOpen(true);
  };
  const closeCompanyPanel = () => {
    setCompanyPanelOpen(false);
    setCompanyContext(null);
    setEditingCompany(undefined);
  };
  const handleDeleteCompany = () => {
    if (deleteCompanyTarget) {
      const { carryPosition, company } = deleteCompanyTarget;
      const updatedCompanies = carryPosition.portfolioCompanies.filter((c) => c.id !== company.id);
      dispatch({
        type: 'UPDATE_CARRY_POSITION',
        payload: { ...carryPosition, portfolioCompanies: updatedCompanies },
      });
      setDeleteCompanyTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carry Positions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fund carry modelling at various return multiples
          </p>
        </div>
        <button
          onClick={() => {
            setEditingFund(undefined);
            setFundPanelOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Fund
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Personal Carry @3x"
          value={formatCurrency(totalCarryAt3x)}
          subtitle="Across all funds"
          color="green"
        />
        <StatCard
          title="Personal Carry @5x"
          value={formatCurrency(totalCarryAt5x)}
          subtitle="Across all funds"
          color="purple"
        />
        <StatCard
          title="Funds"
          value={state.carryPositions.length.toString()}
          subtitle="Carry positions"
          color="blue"
        />
        <StatCard
          title="Portfolio Companies"
          value={totalCompanies.toString()}
          subtitle="Across all funds"
          color="amber"
        />
      </div>

      {/* Per-fund sections */}
      {state.carryPositions.map((cp) => (
        <FundSection
          key={cp.id}
          carryPosition={cp}
          onEditFund={() => {
            setEditingFund(cp);
            setFundPanelOpen(true);
          }}
          onDeleteFund={() => setDeleteFundTarget({ id: cp.id, name: cp.fundName })}
          onAddCompany={() => openAddCompany(cp)}
          onEditCompany={(company) => openEditCompany(cp, company)}
          onDeleteCompany={(company) => setDeleteCompanyTarget({ carryPosition: cp, company })}
        />
      ))}

      {state.carryPositions.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-500">No carry positions yet. Add a fund to get started.</p>
        </div>
      )}

      {/* Combined Summary Table */}
      {state.carryPositions.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Combined Carry Summary</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Multiple</th>
                  {state.carryPositions.map((cp) => (
                    <th key={cp.id} className="text-right py-2 px-3 font-semibold text-slate-600">
                      {cp.fundName}
                    </th>
                  ))}
                  <th className="text-right py-2 px-3 font-semibold text-slate-900">
                    Total Personal
                  </th>
                </tr>
              </thead>
              <tbody>
                {MULTIPLES.map((m) => {
                  const perFund = state.carryPositions.map((cp) => {
                    const scenarios = computeCarryScenarios(cp, [m]);
                    return scenarios[0];
                  });
                  const totalPersonal = perFund.reduce((s, sc) => s + (sc?.personalCarry ?? 0), 0);
                  return (
                    <tr key={m} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-900">{m.toFixed(1)}x</td>
                      {perFund.map((sc, i) => (
                        <td key={i} className="py-2 px-3 text-right text-slate-600">
                          {formatCurrency(sc?.personalCarry ?? 0)}
                        </td>
                      ))}
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(totalPersonal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide Panels */}
      <SlidePanel
        open={fundPanelOpen}
        onClose={closeFundPanel}
        title={editingFund ? 'Edit Fund' : 'Add Fund'}
      >
        <CarryPositionForm existing={editingFund} onClose={closeFundPanel} />
      </SlidePanel>

      <SlidePanel
        open={companyPanelOpen}
        onClose={closeCompanyPanel}
        title={editingCompany ? 'Edit Company' : 'Add Company'}
      >
        {companyContext && (
          <PortfolioCompanyForm
            carryPosition={companyContext}
            existing={editingCompany}
            onClose={closeCompanyPanel}
          />
        )}
      </SlidePanel>

      {/* Delete Confirmations */}
      <DeleteConfirmation
        open={deleteFundTarget !== null}
        onConfirm={handleDeleteFund}
        onCancel={() => setDeleteFundTarget(null)}
        itemName={deleteFundTarget?.name ?? ''}
      />
      <DeleteConfirmation
        open={deleteCompanyTarget !== null}
        onConfirm={handleDeleteCompany}
        onCancel={() => setDeleteCompanyTarget(null)}
        itemName={deleteCompanyTarget?.company.name ?? ''}
      />
    </div>
  );
}

// ─── Fund Section Component ─────────────────────────────────────────────────

interface FundSectionProps {
  carryPosition: CarryPosition;
  onEditFund: () => void;
  onDeleteFund: () => void;
  onAddCompany: () => void;
  onEditCompany: (company: PortfolioCompany) => void;
  onDeleteCompany: (company: PortfolioCompany) => void;
}

function FundSection({
  carryPosition,
  onEditFund,
  onDeleteFund,
  onAddCompany,
  onEditCompany,
  onDeleteCompany,
}: FundSectionProps) {
  const scenarios = useMemo(() => computeCarryScenarios(carryPosition, MULTIPLES), [carryPosition]);
  const metrics = useMemo(() => computePortfolioMetrics(carryPosition), [carryPosition]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Fund Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <ProviderLogo provider={carryPosition.provider} size={24} />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{carryPosition.fundName}</h2>
            <p className="text-xs text-slate-500">{carryPosition.provider}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEditFund}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            title="Edit Fund"
          >
            <PencilIcon />
          </button>
          <button
            onClick={onDeleteFund}
            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
            title="Delete Fund"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Fund Details */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-6 bg-slate-50 border-b border-slate-100">
        <div>
          <p className="text-xs text-slate-500">Fund Size</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(carryPosition.fundSize)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Committed</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(carryPosition.committedCapital)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Carry %</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatPercent(carryPosition.carryPercent)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Hurdle</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatPercent(carryPosition.hurdleRate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Personal Share</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatPercent(carryPosition.personalSharePercent)}
          </p>
        </div>
      </div>

      {/* Portfolio Companies */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Portfolio Companies ({carryPosition.portfolioCompanies.length})
          </h3>
          <button
            onClick={onAddCompany}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Add Company
          </button>
        </div>

        {carryPosition.portfolioCompanies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Name</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Invested</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Current Val</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Ownership</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">MOIC</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-600">Status</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-600 w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {carryPosition.portfolioCompanies.map((company) => {
                  const moic =
                    company.investedAmount > 0
                      ? company.currentValuation / company.investedAmount
                      : 0;
                  const statusMeta = STATUS_LABELS[company.status] ?? STATUS_LABELS.active;
                  return (
                    <tr
                      key={company.id}
                      className="border-b border-slate-50 hover:bg-slate-50 group"
                    >
                      <td className="py-2 px-3 font-medium text-slate-900">{company.name}</td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {formatCurrency(company.investedAmount)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-900">
                        {formatCurrency(company.currentValuation)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {formatPercent(company.ownershipPercent)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        <span className={moic >= 1 ? 'text-emerald-600' : 'text-red-600'}>
                          {moic.toFixed(1)}x
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditCompany(company)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                            title="Edit"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            onClick={() => onDeleteCompany(company)}
                            className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-2 px-3 text-slate-900">Total</td>
                  <td className="py-2 px-3 text-right text-slate-900">
                    {formatCurrency(metrics.totalInvested)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900">
                    {formatCurrency(metrics.totalCurrentValuation)}
                  </td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={metrics.portfolioMOIC >= 1 ? 'text-emerald-600' : 'text-red-600'}
                    >
                      {metrics.portfolioMOIC.toFixed(1)}x
                    </span>
                  </td>
                  <td colSpan={2} className="py-2 px-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center">
            No portfolio companies added yet.
          </p>
        )}
      </div>

      {/* Carry Scenario Table */}
      <div className="p-6 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Carry at Return Multiples</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-600">Multiple</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Fund Value</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Profit</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">
                  Carry Pool (Total)
                </th>
                <th className="text-right py-2 px-3 font-semibold text-emerald-700">
                  Personal Carry
                </th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((sc) => (
                <tr key={sc.multiple} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium text-slate-900">
                    {sc.multiple.toFixed(1)}x
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">
                    {formatCurrency(sc.totalFundValue)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">
                    {formatCurrency(sc.totalProfit)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900">
                    {formatCurrency(sc.totalCarryPool)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-700">
                    {formatCurrency(sc.personalCarry)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
