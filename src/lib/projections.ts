import { FinanceState, YearlyProjection, Asset, Liability } from '@/types/finance';

export function projectAssetValue(asset: Asset, baseYear: number, targetYear: number): number {
  if (asset.currentValue === 0) return 0;
  if (asset.endYear && targetYear > asset.endYear) return 0;

  // Assets always show their current value; unlockYear controls when growth begins
  const growthStartYear = asset.unlockYear ? Math.max(baseYear, asset.unlockYear) : baseYear;

  if (targetYear < growthStartYear) {
    // Before growth starts, value stays flat at current value
    return asset.currentValue;
  }

  const yearsGrowing = targetYear - growthStartYear;
  return asset.currentValue * Math.pow(1 + asset.annualGrowthRate, yearsGrowing);
}

function projectLiabilityBalance(
  liability: Liability,
  baseYear: number,
  targetYear: number,
): number {
  if (liability.endYear && targetYear > liability.endYear) return 0;

  if (liability.type === 'mortgage') {
    // Simple amortization: monthly payment reduces balance, interest accrues
    const monthsElapsed = (targetYear - baseYear) * 12;
    let balance = liability.currentBalance;
    const monthlyRate = liability.interestRate / 12;

    for (let m = 0; m < monthsElapsed; m++) {
      const interest = balance * monthlyRate;
      balance = balance + interest - liability.monthlyPayment;
      if (balance <= 0) return 0;
    }
    return Math.max(0, balance);
  }

  if (liability.type === 'student_loan') {
    // Student loans accrue interest (balance grows until written off)
    const years = targetYear - baseYear;
    return liability.currentBalance * Math.pow(1 + liability.interestRate, years);
  }

  return liability.currentBalance;
}

export function computeYearlyProjections(state: FinanceState): YearlyProjection[] {
  const projections: YearlyProjection[] = [];
  const startYear = parseInt(state.settings.startMonth.split('-')[0]);
  const endYear = state.settings.projectionEndYear;

  for (let year = startYear; year <= endYear; year++) {
    const age = year - state.settings.birthYear;

    // Project each asset
    const assets: Record<string, number> = {};
    let totalAssets = 0;
    let liquidAssets = 0;

    for (const asset of state.assets) {
      const value = Math.round(projectAssetValue(asset, startYear, year));
      assets[asset.id] = value;
      totalAssets += value;
      if (asset.isLiquid) {
        liquidAssets += value;
      }
    }

    // Project each liability
    const liabilities: Record<string, number> = {};
    let totalLiabilities = 0;

    for (const liability of state.liabilities) {
      const balance = Math.round(projectLiabilityBalance(liability, startYear, year));
      liabilities[liability.id] = balance;
      if (liability.type !== 'student_loan') {
        totalLiabilities += balance;
      }
    }

    projections.push({
      year,
      age,
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      netWealth: totalAssets - totalLiabilities,
      liquidAssets,
    });
  }

  return projections;
}
