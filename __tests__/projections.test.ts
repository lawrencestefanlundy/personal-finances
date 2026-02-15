import { describe, it, expect } from 'vitest';
import { computeYearlyProjections } from '@/lib/projections';
import { FinanceState } from '@/types/finance';

function makeState(overrides: Partial<FinanceState> = {}): FinanceState {
  return {
    cashPositions: [],
    incomeStreams: [],
    expenses: [],
    assets: [],
    liabilities: [],
    transactions: [],
    carryPositions: [],
    scenarios: [],
    settings: {
      startMonth: '2026-02',
      projectionEndYear: 2030,
      birthYear: 1988,
      currency: 'GBP',
    },
    ...overrides,
  };
}

describe('computeYearlyProjections', () => {
  it('returns projections for each year from start to end', () => {
    const state = makeState();
    const projections = computeYearlyProjections(state);
    expect(projections).toHaveLength(5); // 2026..2030
    expect(projections[0].year).toBe(2026);
    expect(projections[4].year).toBe(2030);
  });

  it('computes correct age from birth year', () => {
    const state = makeState();
    const projections = computeYearlyProjections(state);
    expect(projections[0].age).toBe(2026 - 1988);
    expect(projections[4].age).toBe(2030 - 1988);
  });

  it('projects asset values with growth rate', () => {
    const state = makeState({
      assets: [
        {
          id: 'a1',
          name: 'Savings',
          currentValue: 10000,
          annualGrowthRate: 0.05,
          category: 'savings',
          isLiquid: true,
        },
      ],
    });
    const projections = computeYearlyProjections(state);
    expect(projections[0].totalAssets).toBe(10000);
    // Year 2 = 10000 * 1.05 = 10500
    expect(projections[1].totalAssets).toBe(10500);
    // Year 3 = 10000 * 1.05^2 = 11025
    expect(projections[2].totalAssets).toBe(11025);
  });

  it('excludes student loans from total liabilities', () => {
    const state = makeState({
      liabilities: [
        {
          id: 'l1',
          name: 'Mortgage',
          currentBalance: 200000,
          interestRate: 0.05,
          monthlyPayment: 1000,
          type: 'mortgage',
        },
        {
          id: 'l2',
          name: 'Student Loan',
          currentBalance: 30000,
          interestRate: 0.06,
          monthlyPayment: 0,
          type: 'student_loan',
          endYear: 2040,
        },
      ],
    });
    const projections = computeYearlyProjections(state);

    // Student loan balance should be tracked individually but NOT in totalLiabilities
    expect(projections[0].liabilities['l2']).toBeGreaterThan(0);
    // Total liabilities should only include the mortgage
    expect(projections[0].totalLiabilities).toBe(projections[0].liabilities['l1']);
  });

  it('calculates net wealth as assets minus liabilities (excluding student loans)', () => {
    const state = makeState({
      assets: [
        {
          id: 'a1',
          name: 'House',
          currentValue: 500000,
          annualGrowthRate: 0.02,
          category: 'property',
          isLiquid: false,
        },
      ],
      liabilities: [
        {
          id: 'l1',
          name: 'Mortgage',
          currentBalance: 200000,
          interestRate: 0.05,
          monthlyPayment: 1000,
          type: 'mortgage',
        },
        {
          id: 'l2',
          name: 'Student Loan',
          currentBalance: 30000,
          interestRate: 0.06,
          monthlyPayment: 0,
          type: 'student_loan',
          endYear: 2040,
        },
      ],
    });
    const projections = computeYearlyProjections(state);

    // Net wealth = assets - liabilities (student loan excluded from liabilities)
    expect(projections[0].netWealth).toBe(
      projections[0].totalAssets - projections[0].totalLiabilities,
    );
    // Student loan should NOT reduce net wealth
    expect(projections[0].netWealth).toBe(500000 - projections[0].liabilities['l1']);
  });

  it('returns zero for assets past their end year', () => {
    const state = makeState({
      assets: [
        {
          id: 'a1',
          name: 'Temp Asset',
          currentValue: 10000,
          annualGrowthRate: 0.05,
          category: 'savings',
          isLiquid: true,
          endYear: 2027,
        },
      ],
    });
    const projections = computeYearlyProjections(state);
    expect(projections[0].totalAssets).toBe(10000); // 2026
    expect(projections[1].totalAssets).toBe(10500); // 2027
    expect(projections[2].totalAssets).toBe(0); // 2028 — past end year
  });

  it('tracks liquid assets separately', () => {
    const state = makeState({
      assets: [
        {
          id: 'a1',
          name: 'Savings',
          currentValue: 10000,
          annualGrowthRate: 0,
          category: 'savings',
          isLiquid: true,
        },
        {
          id: 'a2',
          name: 'House',
          currentValue: 500000,
          annualGrowthRate: 0,
          category: 'property',
          isLiquid: false,
        },
      ],
    });
    const projections = computeYearlyProjections(state);
    expect(projections[0].liquidAssets).toBe(10000);
    expect(projections[0].totalAssets).toBe(510000);
  });
});
