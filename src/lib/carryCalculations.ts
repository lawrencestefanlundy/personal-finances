import { CarryPosition } from '@/types/finance';

export interface CarryScenario {
  multiple: number;
  totalFundValue: number;
  totalProfit: number;
  hurdleAmount: number;
  profitAboveHurdle: number;
  totalCarryPool: number;
  personalCarry: number;
  discountedPersonalCarry: number; // present value after illiquidity discount
  discountFactor: number; // e.g. 0.58 for 3 years at 20%
  yearsToClose: number;
}

// VC secondaries standard illiquidity discount rate
const ILLIQUIDITY_DISCOUNT_RATE = 0.2;

export function computeCarryScenarios(
  position: CarryPosition,
  multiples: number[] = [2.5, 3.0, 4.0, 5.0],
  overrideFundSize?: number,
): CarryScenario[] {
  const fundSize = overrideFundSize ?? position.fundSize;
  const currentYear = new Date().getFullYear();
  const yearsToClose = position.fundCloseYear
    ? Math.max(0, position.fundCloseYear - currentYear)
    : 0;
  const discountFactor =
    yearsToClose > 0 ? 1 / Math.pow(1 + ILLIQUIDITY_DISCOUNT_RATE, yearsToClose) : 1;

  return multiples.map((multiple) => {
    const totalFundValue = multiple * fundSize;
    const totalProfit = totalFundValue - fundSize;
    const hurdleAmount = fundSize * position.hurdleRate;
    const profitAboveHurdle = Math.max(0, totalProfit - hurdleAmount);
    const totalCarryPool = profitAboveHurdle * position.carryPercent;
    const personalCarry = totalCarryPool * position.personalSharePercent;
    const discountedPersonalCarry = personalCarry * discountFactor;
    return {
      multiple,
      totalFundValue,
      totalProfit,
      hurdleAmount,
      profitAboveHurdle,
      totalCarryPool,
      personalCarry,
      discountedPersonalCarry,
      discountFactor,
      yearsToClose,
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
