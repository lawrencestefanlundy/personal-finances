import { FinanceState, MonthlySnapshot, Expense, IncomeStream } from '@/types/finance';
import { addMonths, parseMonth } from './formatters';

function getIncomeForMonth(stream: IncomeStream, monthNum: number): number {
  switch (stream.frequency) {
    case 'monthly':
      return stream.amount;
    case 'quarterly':
      if (stream.paymentMonths && stream.paymentMonths.includes(monthNum)) {
        return stream.amount;
      }
      return 0;
    case 'annual':
      if (stream.paymentMonths && stream.paymentMonths.includes(monthNum)) {
        return stream.amount;
      }
      return monthNum === 1 ? stream.amount : 0;
    default:
      return 0;
  }
}

function getExpenseForMonth(expense: Expense, month: string, monthNum: number): number {
  // Check start/end dates
  if (expense.startDate && month < expense.startDate) return 0;
  if (expense.endDate && month > expense.endDate) return 0;

  // Check active months
  if (expense.activeMonths && !expense.activeMonths.includes(monthNum)) return 0;

  switch (expense.frequency) {
    case 'monthly':
      return expense.amount;
    case 'quarterly':
      if (expense.paymentMonths) {
        return expense.paymentMonths.includes(monthNum) ? expense.amount : 0;
      }
      return [3, 6, 9, 12].includes(monthNum) ? expense.amount : 0;
    case 'termly':
      if (expense.paymentMonths) {
        return expense.paymentMonths.includes(monthNum) ? expense.amount : 0;
      }
      return [1, 5, 9].includes(monthNum) ? expense.amount : 0;
    case 'annual':
      if (expense.paymentMonths) {
        return expense.paymentMonths.includes(monthNum) ? expense.amount : 0;
      }
      return monthNum === 1 ? expense.amount : 0;
    case 'bimonthly':
      if (expense.paymentMonths) {
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
  numMonths: number = 50
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
  numMonths: number = 3
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
