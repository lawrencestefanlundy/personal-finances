import { CarryPosition } from '@/types/finance';

export interface CarryScenario {
  multiple: number;
  totalFundValue: number;
  totalProfit: number;
  hurdleAmount: number;
  profitAboveHurdle: number;
  totalCarryPool: number;
  personalCarry: number;
}

export function computeCarryScenarios(
  position: CarryPosition,
  multiples: number[] = [2.5, 3.0, 4.0, 5.0],
): CarryScenario[] {
  return multiples.map((multiple) => {
    const totalFundValue = multiple * position.fundSize;
    const totalProfit = totalFundValue - position.fundSize;
    const hurdleAmount = position.fundSize * position.hurdleRate;
    const profitAboveHurdle = Math.max(0, totalProfit - hurdleAmount);
    const totalCarryPool = profitAboveHurdle * position.carryPercent;
    const personalCarry = totalCarryPool * position.personalSharePercent;
    return {
      multiple,
      totalFundValue,
      totalProfit,
      hurdleAmount,
      profitAboveHurdle,
      totalCarryPool,
      personalCarry,
    };
  });
}

export function computePortfolioMetrics(position: CarryPosition) {
  const totalInvested = position.portfolioCompanies.reduce((sum, c) => sum + c.investedAmount, 0);
  const totalCurrentValuation = position.portfolioCompanies.reduce(
    (sum, c) => sum + c.currentValuation,
    0,
  );
  const portfolioMOIC = totalInvested > 0 ? totalCurrentValuation / totalInvested : 0;
  const activeCompanies = position.portfolioCompanies.filter(
    (c) => c.status === 'active' || c.status === 'marked_up',
  ).length;
  return { totalInvested, totalCurrentValuation, portfolioMOIC, activeCompanies };
}

export function computeTotalPersonalCarryAtMultiple(
  positions: CarryPosition[],
  multiple: number,
): number {
  return positions.reduce((sum, pos) => {
    const scenarios = computeCarryScenarios(pos, [multiple]);
    return sum + (scenarios[0]?.personalCarry ?? 0);
  }, 0);
}
