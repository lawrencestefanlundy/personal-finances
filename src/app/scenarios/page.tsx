'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { computeYearlyProjections } from '@/lib/projections';
import { computeScenarioProjections, presetScenarios } from '@/lib/scenarios';
import { formatCurrency } from '@/lib/formatters';
import ScenarioOverlay from '@/components/charts/ScenarioOverlay';
import { Scenario } from '@/types/finance';

export default function ScenariosPage() {
  const { state } = useFinance();
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  const allScenarios = [...presetScenarios, ...state.scenarios];
  const baseline = useMemo(() => computeYearlyProjections(state), [state]);

  const scenarioProjections = useMemo(() => {
    if (!selectedScenario) return null;
    return computeScenarioProjections(state, selectedScenario);
  }, [state, selectedScenario]);

  const baselineFinal = baseline[baseline.length - 1];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scenarios</h1>
        <p className="text-sm text-slate-500 mt-1">
          Compare different growth assumptions against your base case
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Select a Scenario</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allScenarios.map((scenario) => {
            const isSelected = selectedScenario?.id === scenario.id;
            return (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(isSelected ? null : scenario)}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <p className="font-semibold text-slate-900">{scenario.name}</p>
                <p className="text-sm text-slate-500 mt-1">{scenario.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Chart */}
      {selectedScenario && scenarioProjections && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Base Case vs {selectedScenario.name}
            </h2>
            <ScenarioOverlay
              baseline={baseline}
              scenario={scenarioProjections}
              scenarioName={selectedScenario.name}
            />
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Comparison Points</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Milestone</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">Base Case</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">{selectedScenario.name}</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'In 5 years', index: 5 },
                    { label: 'In 10 years', index: 10 },
                    { label: 'At retirement (65)', index: baseline.findIndex((p) => p.age === 65) },
                    { label: 'Final year', index: baseline.length - 1 },
                  ]
                    .filter((row) => row.index >= 0 && row.index < baseline.length)
                    .map((row) => {
                      const b = baseline[row.index];
                      const s = scenarioProjections[row.index];
                      const diff = (s?.netWealth ?? 0) - b.netWealth;
                      return (
                        <tr key={row.label} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-3 px-3 font-medium text-slate-900">
                            {row.label}
                            <span className="text-slate-400 text-xs ml-2">({b.year}, age {b.age})</span>
                          </td>
                          <td className="py-3 px-3 text-right text-purple-700 font-medium">
                            {formatCurrency(b.netWealth)}
                          </td>
                          <td className="py-3 px-3 text-right text-orange-600 font-medium">
                            {formatCurrency(s?.netWealth ?? 0)}
                          </td>
                          <td className={`py-3 px-3 text-right font-bold ${
                            diff >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* No scenario selected */}
      {!selectedScenario && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-400">Select a scenario above to see the comparison</p>
          <p className="text-sm text-slate-300 mt-2">
            Base case final net wealth: {formatCurrency(baselineFinal?.netWealth ?? 0)} at age {baselineFinal?.age}
          </p>
        </div>
      )}
    </div>
  );
}
