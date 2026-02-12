import { FinanceState, Scenario, YearlyProjection } from '@/types/finance';
import { computeYearlyProjections } from './projections';

export function applyScenario(state: FinanceState, scenario: Scenario): FinanceState {
  const modified = { ...state };

  // Apply asset growth rate overrides
  if (scenario.overrides.assetGrowthRates) {
    modified.assets = state.assets.map((asset) => {
      const override = scenario.overrides.assetGrowthRates?.[asset.id];
      if (override !== undefined) {
        return { ...asset, annualGrowthRate: override };
      }
      return asset;
    });
  }

  // Apply income adjustments (multipliers)
  if (scenario.overrides.incomeAdjustments) {
    modified.incomeStreams = state.incomeStreams.map((stream) => {
      const multiplier = scenario.overrides.incomeAdjustments?.[stream.id];
      if (multiplier !== undefined) {
        return { ...stream, amount: Math.round(stream.amount * multiplier) };
      }
      return stream;
    });
  }

  // Add/remove expenses
  if (scenario.overrides.additionalExpenses) {
    modified.expenses = [...state.expenses, ...scenario.overrides.additionalExpenses];
  }
  if (scenario.overrides.removedExpenseIds) {
    modified.expenses = modified.expenses.filter(
      (e) => !scenario.overrides.removedExpenseIds?.includes(e.id),
    );
  }

  return modified;
}

export function computeScenarioProjections(
  state: FinanceState,
  scenario: Scenario,
): YearlyProjection[] {
  const modifiedState = applyScenario(state, scenario);
  return computeYearlyProjections(modifiedState);
}

// Preset scenarios
export const presetScenarios: Scenario[] = [
  {
    id: 'preset-conservative',
    name: 'Conservative',
    description: 'All growth rates reduced by 2%',
    overrides: {
      assetGrowthRates: {
        'asset-instant': 0.015,
        'asset-isa': 0.04,
        'asset-lunar1': 0.04,
        'asset-lunar2': 0.04,
        'asset-cloudberry1': 0.04,
        'asset-sb-pension': 0.04,
        'asset-llb-pension': 0.04,
        'asset-kit-isa': 0.04,
        'asset-finn-isa': 0.04,
        'asset-house': 0.0,
        'asset-car': -0.05,
      },
    },
  },
  {
    id: 'preset-optimistic',
    name: 'Optimistic',
    description: 'All growth rates increased by 2%',
    overrides: {
      assetGrowthRates: {
        'asset-instant': 0.055,
        'asset-isa': 0.08,
        'asset-lunar1': 0.08,
        'asset-lunar2': 0.08,
        'asset-cloudberry1': 0.08,
        'asset-sb-pension': 0.08,
        'asset-llb-pension': 0.08,
        'asset-kit-isa': 0.08,
        'asset-finn-isa': 0.08,
        'asset-house': 0.04,
        'asset-car': -0.01,
      },
    },
  },
  {
    id: 'preset-recession',
    name: 'Property Crash',
    description: 'House value drops 20%, flat growth, funds at 2%',
    overrides: {
      assetGrowthRates: {
        'asset-house': -0.02,
        'asset-lunar1': 0.02,
        'asset-lunar2': 0.02,
        'asset-cloudberry1': 0.02,
        'asset-instant': 0.02,
        'asset-isa': 0.02,
        'asset-sb-pension': 0.02,
        'asset-llb-pension': 0.02,
      },
    },
  },
];
