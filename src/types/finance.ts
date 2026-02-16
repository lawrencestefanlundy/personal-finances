// === CASH POSITIONS ===
export interface CashPosition {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  isLiquid: boolean;
  category: 'cash' | 'savings' | 'isa' | 'crypto';
  provider?: string;
}

// === INCOME STREAMS ===
export type IncomeFrequency = 'monthly' | 'quarterly' | 'annual';

export interface IncomeStream {
  id: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  paymentMonths?: number[]; // which months payment falls (1-12)
  owner: 'lawrence' | 'stephanie' | 'joint';
  taxable: boolean;
  provider?: string;
}

// === EXPENSES ===
export type ExpenseFrequency =
  | 'monthly'
  | 'quarterly'
  | 'termly'
  | 'annual'
  | 'bimonthly'
  | 'one-off';

export type ExpenseCategory =
  | 'debt'
  | 'school'
  | 'holiday'
  | 'groceries'
  | 'bills'
  | 'health'
  | 'car'
  | 'insurance'
  | 'subscriptions'
  | 'extracurricular'
  | 'house'
  | 'tax'
  | 'investment'
  | 'other';

export interface Expense {
  id: string;
  name: string;
  provider?: string;
  amount: number;
  frequency: ExpenseFrequency;
  category: ExpenseCategory;
  activeMonths?: number[]; // 1-12, if only active certain months
  paymentMonths?: number[]; // specific months for quarterly/annual/bimonthly
  startDate?: string; // YYYY-MM
  endDate?: string; // YYYY-MM
  notes?: string;
}

// === EMAIL UPDATES (for angel investments) ===
export interface EmailUpdate {
  subject: string;
  from: string;
  date: string;
  snippet: string;
  has_attachments?: boolean;
}

// === LONG-TERM ASSETS ===
export type AssetCategory =
  | 'savings'
  | 'isa'
  | 'crypto'
  | 'fund'
  | 'angel'
  | 'pension'
  | 'property'
  | 'vehicle'
  | 'children_isa';

export interface Asset {
  id: string;
  name: string;
  currentValue: number;
  annualGrowthRate: number;
  category: AssetCategory;
  isLiquid: boolean;
  unlockYear?: number; // year when growth starts
  endYear?: number; // year when asset is liquidated
  notes?: string;
  provider?: string;
  // Investment-specific fields (angel category)
  costBasis?: number;
  costCurrency?: string; // GBP, USD, EUR, CHF
  costBasisGBP?: number; // cost basis converted to GBP at historical XE rate
  fxRate?: number; // historical XE rate used for conversion (foreign currency → GBP)
  instrument?: string; // safe, equity, options, advance_subscription
  investmentDate?: string; // ISO date
  status?: 'active' | 'exited' | 'written_off';
  taxScheme?: 'SEIS' | 'EIS';
  platform?: string; // odin, direct, feedforward
  emailUpdates?: string; // JSON string of EmailUpdate[]
}

// === LIABILITIES ===
export interface Liability {
  id: string;
  name: string;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  type: 'mortgage' | 'student_loan' | 'credit_card' | 'other';
  endYear?: number;
  provider?: string;
}

// === TRANSACTIONS ===
export interface Transaction {
  id: string;
  date: string; // ISO date string
  description: string;
  amount: number; // negative = debit, positive = credit
  category?: string;
  source: 'monzo' | 'manual';
  linkedEntityId?: string; // link to related cash position / expense / income
  emailId?: string; // for deduplication on reimport
}

// === SCENARIOS ===
export interface Scenario {
  id: string;
  name: string;
  description: string;
  overrides: {
    assetGrowthRates?: Record<string, number>;
    additionalExpenses?: Expense[];
    removedExpenseIds?: string[];
    incomeAdjustments?: Record<string, number>;
    liabilityOverrides?: Record<string, Partial<Liability>>;
  };
}

// === COMPUTED: MONTHLY SNAPSHOT ===
export interface MonthlySnapshot {
  month: string; // YYYY-MM
  incomeBreakdown: Record<string, number>;
  totalIncome: number;
  expenseBreakdown: Record<string, number>;
  totalExpenses: number;
  netCashFlow: number;
  runningBalance: number;
}

// === COMPUTED: YEARLY PROJECTION ===
export interface YearlyProjection {
  year: number;
  age: number;
  assets: Record<string, number>;
  totalAssets: number;
  liabilities: Record<string, number>;
  totalLiabilities: number;
  netWealth: number;
  liquidAssets: number;
}

// === CARRY / FUND CARRY POSITIONS ===
export type PortfolioCompanyStatus = 'active' | 'exited' | 'written_off' | 'marked_up';

export interface PortfolioCompany {
  id: string;
  name: string;
  investedAmount: number; // fund's investment in this company
  currentValuation: number; // current estimated valuation of holding
  ownershipPercent: number; // fund's ownership % (decimal, e.g. 0.15 = 15%)
  status: PortfolioCompanyStatus;
  notes?: string;
}

export interface CarryPosition {
  id: string;
  fundName: string;
  provider: string; // e.g. 'Lunar Ventures'
  fundSize: number; // total fund size
  committedCapital: number; // total capital committed/called
  carryPercent: number; // carry % as decimal (e.g. 0.20 = 20%)
  hurdleRate: number; // hurdle rate as decimal (e.g. 0.08 = 8%)
  personalSharePercent: number; // personal share of GP carry pool (decimal)
  portfolioCompanies: PortfolioCompany[];
  linkedAssetId?: string; // optional link to corresponding Asset entry
  notes?: string;
}

// === ROOT STATE ===
export interface FinanceState {
  cashPositions: CashPosition[];
  incomeStreams: IncomeStream[];
  expenses: Expense[];
  assets: Asset[];
  liabilities: Liability[];
  transactions: Transaction[];
  carryPositions: CarryPosition[];
  scenarios: Scenario[];
  activeScenarioId: string | null;
  settings: {
    startMonth: string; // YYYY-MM
    projectionEndYear: number;
    birthYear: number;
    currency: string;
  };
  lastModified: string;
}
