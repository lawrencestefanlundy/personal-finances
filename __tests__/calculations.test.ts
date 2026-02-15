import { describe, it, expect } from 'vitest';
import {
  computeMonthlySnapshots,
  computeAverageMonthlyBurn,
  computeMonthsOfRunway,
  getUpcomingLargeExpenses,
  aggregateToQuarters,
} from '@/lib/calculations';
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
      startMonth: '2026-01',
      projectionEndYear: 2030,
      birthYear: 1988,
      currency: 'GBP',
    },
    ...overrides,
  };
}

describe('computeMonthlySnapshots', () => {
  it('returns correct number of months', () => {
    const state = makeState();
    const snapshots = computeMonthlySnapshots(state, 12);
    expect(snapshots).toHaveLength(12);
    expect(snapshots[0].month).toBe('2026-01');
    expect(snapshots[11].month).toBe('2026-12');
  });

  it('computes monthly income correctly', () => {
    const state = makeState({
      incomeStreams: [
        {
          id: 'inc-1',
          name: 'Salary',
          amount: 5000,
          frequency: 'monthly',
          owner: 'lawrence',
          taxable: true,
        },
      ],
    });
    const snapshots = computeMonthlySnapshots(state, 3);
    expect(snapshots[0].totalIncome).toBe(5000);
    expect(snapshots[1].totalIncome).toBe(5000);
    expect(snapshots[2].totalIncome).toBe(5000);
  });

  it('computes quarterly income on payment months only', () => {
    const state = makeState({
      incomeStreams: [
        {
          id: 'inc-1',
          name: 'Dividends',
          amount: 10000,
          frequency: 'quarterly',
          paymentMonths: [3, 6, 9, 12],
          owner: 'lawrence',
          taxable: true,
        },
      ],
    });
    const snapshots = computeMonthlySnapshots(state, 6);
    // Jan = 0, Feb = 0, Mar = 10000, Apr = 0, May = 0, Jun = 10000
    expect(snapshots[0].totalIncome).toBe(0);
    expect(snapshots[1].totalIncome).toBe(0);
    expect(snapshots[2].totalIncome).toBe(10000);
    expect(snapshots[3].totalIncome).toBe(0);
    expect(snapshots[4].totalIncome).toBe(0);
    expect(snapshots[5].totalIncome).toBe(10000);
  });

  it('computes monthly expenses correctly', () => {
    const state = makeState({
      expenses: [
        {
          id: 'exp-1',
          name: 'Groceries',
          amount: 2000,
          frequency: 'monthly',
          category: 'groceries',
        },
      ],
    });
    const snapshots = computeMonthlySnapshots(state, 3);
    expect(snapshots[0].totalExpenses).toBe(2000);
    expect(snapshots[1].totalExpenses).toBe(2000);
  });

  it('respects expense start and end dates', () => {
    const state = makeState({
      expenses: [
        {
          id: 'exp-1',
          name: 'One-off',
          amount: 500,
          frequency: 'one-off',
          category: 'other',
          startDate: '2026-03',
        },
      ],
    });
    const snapshots = computeMonthlySnapshots(state, 6);
    expect(snapshots[0].totalExpenses).toBe(0); // Jan
    expect(snapshots[1].totalExpenses).toBe(0); // Feb
    expect(snapshots[2].totalExpenses).toBe(500); // Mar — one-off fires
    expect(snapshots[3].totalExpenses).toBe(0); // Apr
  });

  it('respects active months for expenses', () => {
    const state = makeState({
      expenses: [
        {
          id: 'exp-1',
          name: 'Council Tax',
          amount: 460,
          frequency: 'monthly',
          category: 'bills',
          activeMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        },
      ],
    });
    const snapshots = computeMonthlySnapshots(state, 4);
    expect(snapshots[0].totalExpenses).toBe(0); // Jan — not active
    expect(snapshots[1].totalExpenses).toBe(0); // Feb — not active
    expect(snapshots[2].totalExpenses).toBe(460); // Mar — active
    expect(snapshots[3].totalExpenses).toBe(460); // Apr — active
  });

  it('tracks running balance from cash positions', () => {
    const state = makeState({
      cashPositions: [
        {
          id: 'cash-1',
          name: 'Bank',
          balance: 10000,
          interestRate: 0,
          isLiquid: true,
          category: 'cash',
        },
      ],
      incomeStreams: [
        {
          id: 'inc-1',
          name: 'Salary',
          amount: 5000,
          frequency: 'monthly',
          owner: 'lawrence',
          taxable: true,
        },
      ],
      expenses: [
        {
          id: 'exp-1',
          name: 'Bills',
          amount: 3000,
          frequency: 'monthly',
          category: 'bills',
        },
      ],
    });
    const snapshots = computeMonthlySnapshots(state, 3);
    // Start: 10000, month 1: +5000-3000 = 12000, month 2: 14000, month 3: 16000
    expect(snapshots[0].runningBalance).toBe(12000);
    expect(snapshots[1].runningBalance).toBe(14000);
    expect(snapshots[2].runningBalance).toBe(16000);
  });

  it('computes termly expenses on payment months', () => {
    const state = makeState({
      expenses: [
        {
          id: 'exp-1',
          name: 'School Fees',
          amount: 7000,
          frequency: 'termly',
          category: 'school',
          paymentMonths: [2, 5, 9],
        },
      ],
    });
    const snapshots = computeMonthlySnapshots(state, 12);
    expect(snapshots[0].totalExpenses).toBe(0); // Jan
    expect(snapshots[1].totalExpenses).toBe(7000); // Feb
    expect(snapshots[2].totalExpenses).toBe(0); // Mar
    expect(snapshots[3].totalExpenses).toBe(0); // Apr
    expect(snapshots[4].totalExpenses).toBe(7000); // May
    expect(snapshots[8].totalExpenses).toBe(7000); // Sep
  });
});

describe('computeAverageMonthlyBurn', () => {
  it('returns 0 for empty snapshots', () => {
    expect(computeAverageMonthlyBurn([])).toBe(0);
  });

  it('averages total expenses across snapshots', () => {
    const snapshots = [
      {
        month: '2026-01',
        totalIncome: 0,
        totalExpenses: 1000,
        netCashFlow: -1000,
        runningBalance: 9000,
        incomeBreakdown: {},
        expenseBreakdown: {},
      },
      {
        month: '2026-02',
        totalIncome: 0,
        totalExpenses: 2000,
        netCashFlow: -2000,
        runningBalance: 7000,
        incomeBreakdown: {},
        expenseBreakdown: {},
      },
      {
        month: '2026-03',
        totalIncome: 0,
        totalExpenses: 3000,
        netCashFlow: -3000,
        runningBalance: 4000,
        incomeBreakdown: {},
        expenseBreakdown: {},
      },
    ];
    expect(computeAverageMonthlyBurn(snapshots)).toBe(2000);
  });
});

describe('computeMonthsOfRunway', () => {
  it('returns Infinity when net cash flow is positive', () => {
    const snapshots = [
      {
        month: '2026-01',
        totalIncome: 5000,
        totalExpenses: 3000,
        netCashFlow: 2000,
        runningBalance: 12000,
        incomeBreakdown: {},
        expenseBreakdown: {},
      },
    ];
    expect(computeMonthsOfRunway(10000, snapshots)).toBe(Infinity);
  });

  it('calculates months of runway for negative burn', () => {
    const snapshots = [
      {
        month: '2026-01',
        totalIncome: 0,
        totalExpenses: 5000,
        netCashFlow: -5000,
        runningBalance: 5000,
        incomeBreakdown: {},
        expenseBreakdown: {},
      },
    ];
    expect(computeMonthsOfRunway(10000, snapshots)).toBe(2);
  });
});

describe('getUpcomingLargeExpenses', () => {
  it('returns expenses >= 1000 in the next N months', () => {
    const state = makeState({
      expenses: [
        {
          id: 'exp-1',
          name: 'School Fees',
          amount: 7000,
          frequency: 'termly',
          category: 'school',
          paymentMonths: [2, 5, 9],
        },
        {
          id: 'exp-2',
          name: 'Groceries',
          amount: 200,
          frequency: 'monthly',
          category: 'groceries',
        },
      ],
    });
    const upcoming = getUpcomingLargeExpenses(state, 3);
    // Jan: school 0, groceries 200. Feb: school 7000, groceries 200. Mar: school 0, groceries 200
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].name).toBe('School Fees');
    expect(upcoming[0].amount).toBe(7000);
    expect(upcoming[0].month).toBe('2026-02');
  });
});

describe('aggregateToQuarters', () => {
  it('groups monthly snapshots into quarterly summaries', () => {
    const state = makeState({
      incomeStreams: [
        {
          id: 'inc-1',
          name: 'Salary',
          amount: 5000,
          frequency: 'monthly',
          owner: 'lawrence',
          taxable: true,
        },
      ],
      expenses: [
        {
          id: 'exp-1',
          name: 'Bills',
          amount: 3000,
          frequency: 'monthly',
          category: 'bills',
        },
      ],
    });
    const snapshots = computeMonthlySnapshots(state, 6);
    const quarters = aggregateToQuarters(snapshots);

    expect(quarters).toHaveLength(2);
    expect(quarters[0].quarter).toBe('Q1 2026');
    expect(quarters[0].totalIncome).toBe(15000); // 3 months * 5000
    expect(quarters[0].totalExpenses).toBe(9000); // 3 months * 3000
    expect(quarters[1].quarter).toBe('Q2 2026');
  });
});
