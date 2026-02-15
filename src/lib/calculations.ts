import { FinanceState, MonthlySnapshot, Expense, IncomeStream } from '@/types/finance';
import { addMonths, parseMonth } from './formatters';

function getIncomeForMonth(stream: IncomeStream, monthNum: number): number {
  switch (stream.frequency) {
    case 'monthly':
      return stream.amount;
    case 'quarterly':
      if (hasItems(stream.paymentMonths)) {
        return stream.paymentMonths.includes(monthNum) ? stream.amount : 0;
      }
      return [3, 6, 9, 12].includes(monthNum) ? stream.amount : 0;
    case 'annual':
      if (hasItems(stream.paymentMonths)) {
        return stream.paymentMonths.includes(monthNum) ? stream.amount : 0;
      }
      return monthNum === 1 ? stream.amount : 0;
    default:
      return 0;
  }
}

function hasItems(arr: unknown[] | undefined | null): arr is unknown[] & { length: number } {
  return Array.isArray(arr) && arr.length > 0;
}

function getExpenseForMonth(expense: Expense, month: string, monthNum: number): number {
  // Check start/end dates
  if (expense.startDate && month < expense.startDate) return 0;
  if (expense.endDate && month > expense.endDate) return 0;

  // Check active months (only filter if array has entries; empty array = all months)
  if (hasItems(expense.activeMonths) && !expense.activeMonths.includes(monthNum)) return 0;

  switch (expense.frequency) {
    case 'monthly':
      return expense.amount;
    case 'quarterly':
      if (hasItems(expense.paymentMonths)) {
        return expense.paymentMonths.includes(monthNum) ? expense.amount : 0;
      }
      return [3, 6, 9, 12].includes(monthNum) ? expense.amount : 0;
    case 'termly':
      if (hasItems(expense.paymentMonths)) {
        return expense.paymentMonths.includes(monthNum) ? expense.amount : 0;
      }
      return [1, 5, 9].includes(monthNum) ? expense.amount : 0;
    case 'annual':
      if (hasItems(expense.paymentMonths)) {
        return expense.paymentMonths.includes(monthNum) ? expense.amount : 0;
      }
      return monthNum === 1 ? expense.amount : 0;
    case 'bimonthly':
      if (hasItems(expense.paymentMonths)) {
        return expense.paymentMonths.includes(monthNum) ? expense.amount : 0;
      }
      return monthNum % 2 === 0 ? expense.amount : 0;
    case 'one-off':
      return month === expense.startDate ? expense.amount : 0;
    default:
      return 0;
  }
}

export function computeMonthlySnapshots(
  state: FinanceState,
  numMonths: number = 50,
): MonthlySnapshot[] {
  const snapshots: MonthlySnapshot[] = [];
  let runningBalance = state.cashPositions.reduce((sum, cp) => sum + cp.balance, 0);

  for (let i = 0; i < numMonths; i++) {
    const month = addMonths(state.settings.startMonth, i);
    const { month: monthNum } = parseMonth(month);

    // Calculate income
    const incomeBreakdown: Record<string, number> = {};
    let totalIncome = 0;
    for (const stream of state.incomeStreams) {
      const amount = getIncomeForMonth(stream, monthNum);
      if (amount > 0) {
        incomeBreakdown[stream.id] = amount;
        totalIncome += amount;
      }
    }

    // Calculate expenses
    const expenseBreakdown: Record<string, number> = {};
    let totalExpenses = 0;
    for (const expense of state.expenses) {
      const amount = getExpenseForMonth(expense, month, monthNum);
      if (amount > 0) {
        expenseBreakdown[expense.id] = amount;
        totalExpenses += amount;
      }
    }

    const netCashFlow = totalIncome - totalExpenses;
    runningBalance += netCashFlow;

    snapshots.push({
      month,
      incomeBreakdown,
      totalIncome,
      expenseBreakdown,
      totalExpenses,
      netCashFlow,
      runningBalance,
    });
  }

  return snapshots;
}

export function getUpcomingLargeExpenses(
  state: FinanceState,
  numMonths: number = 3,
): { name: string; amount: number; month: string }[] {
  const upcoming: { name: string; amount: number; month: string }[] = [];

  for (let i = 0; i < numMonths; i++) {
    const month = addMonths(state.settings.startMonth, i);
    const { month: monthNum } = parseMonth(month);

    for (const expense of state.expenses) {
      const amount = getExpenseForMonth(expense, month, monthNum);
      if (amount >= 1000) {
        upcoming.push({ name: expense.name, amount, month });
      }
    }
  }

  return upcoming.sort((a, b) => a.month.localeCompare(b.month));
}

export function computeAverageMonthlyBurn(snapshots: MonthlySnapshot[]): number {
  if (snapshots.length === 0) return 0;
  const total = snapshots.reduce((sum, s) => sum + s.totalExpenses, 0);
  return total / snapshots.length;
}

export function computeMonthsOfRunway(liquidCash: number, snapshots: MonthlySnapshot[]): number {
  if (snapshots.length === 0) return 0;
  const avgNetBurn = snapshots.reduce((sum, s) => sum + s.netCashFlow, 0) / snapshots.length;
  if (avgNetBurn >= 0) return Infinity;
  return Math.abs(liquidCash / avgNetBurn);
}

export interface QuarterlySummary {
  quarter: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  endBalance: number;
}

function getQuarterLabel(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const monthNum = parseInt(monthStr);
  const quarter = Math.ceil(monthNum / 3);
  return `Q${quarter} ${yearStr}`;
}

export function aggregateToQuarters(snapshots: MonthlySnapshot[]): QuarterlySummary[] {
  const quarterMap = new Map<string, QuarterlySummary>();

  for (const s of snapshots) {
    const label = getQuarterLabel(s.month);
    const existing = quarterMap.get(label);
    if (existing) {
      existing.totalIncome += s.totalIncome;
      existing.totalExpenses += s.totalExpenses;
      existing.netCashFlow += s.netCashFlow;
      existing.endBalance = s.runningBalance;
    } else {
      quarterMap.set(label, {
        quarter: label,
        totalIncome: s.totalIncome,
        totalExpenses: s.totalExpenses,
        netCashFlow: s.netCashFlow,
        endBalance: s.runningBalance,
      });
    }
  }

  return Array.from(quarterMap.values());
}
