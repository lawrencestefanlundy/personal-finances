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
  monthlyOverrides?: Record<string, number>; // keyed by YYYY-MM
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
  monthlyOverrides?: Record<string, number>; // keyed by YYYY-MM
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
  exitDate?: string; // ISO date
  exitMethod?: string; // write_off, secondary, acquisition, ipo
  status?: 'active' | 'exited' | 'written_off';
  taxScheme?: 'SEIS' | 'EIS';
  platform?: string; // odin, direct, feedforward, vauban, seedlegals
  geography?: string;
  industry?: string;
  ownershipPercent?: number; // ownership % as decimal (e.g. 0.005 = 0.5%)
  irr?: number; // gross IRR as decimal (e.g. 0.2863 = 28.63%)
  emailUpdates?: string; // JSON string of EmailUpdate[]
  // Vehicle-specific fields (vehicle category)
  registration?: string; // e.g. GY17STZ
  mileage?: number; // current odometer reading
  vehicleData?: string; // JSON string of VehicleData
  // Property-specific fields (property category)
  purchasePrice?: number; // original purchase price
  purchaseDate?: string; // YYYY-MM
  propertyAddress?: string; // full address
  propertyRegion?: string; // Land Registry UKHPI region slug e.g. "lewes"
  propertyData?: string; // JSON string of PropertyData
}

// === VEHICLE DATA (from DVLA + market valuation) ===
export interface VehicleData {
  // DVLA fields
  make?: string;
  colour?: string;
  yearOfManufacture?: number;
  engineCapacity?: number;
  fuelType?: string;
  co2Emissions?: number;
  taxStatus?: string;
  taxDueDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
  dateOfLastV5CIssued?: string;
  // Valuation fields
  valuationLow?: number;
  valuationMid?: number;
  valuationHigh?: number;
  valuationSource?: string;
  valuationDate?: string;
  mileageEstimate?: number;
}

// === PROPERTY DATA (from Land Registry UKHPI) ===
export interface PropertyData {
  purchaseHPI?: number; // HPI at purchase date
  currentHPI?: number; // latest available HPI
  hpiDate?: string; // date of latest HPI data point
  hpiRegion?: string; // region used for lookup
  estimatedValue?: number; // purchasePrice * (currentHPI / purchaseHPI)
  averagePrice?: number; // area average price from UKHPI
  annualChange?: number; // YoY % change
  valuationDate?: string; // when this was computed
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
  legalEntity?: string;
  investedAmount: number; // fund's investment in this company (EUR)
  currentValuation: number; // current fair value of holding (EUR)
  ownershipPercent: number; // fund's fully-diluted ownership % (decimal, e.g. 0.15 = 15%)
  status: PortfolioCompanyStatus;
  investmentDate?: string; // MMM-YY e.g. "Apr-20"
  exitDate?: string; // MMM-YY e.g. "Jun-25"
  holdingPeriod?: number; // years
  exitMethod?: string; // secondary, write_off, ipo, acquisition
  geography?: string;
  industry?: string;
  proceeds?: number; // cash proceeds/repayments (EUR)
  cashIncome?: number; // dividends/interest received (EUR)
  irr?: number; // gross IRR as decimal (e.g. 0.2863 = 28.63%)
  notes?: string;
  displayOrder?: number; // manual sort order (0-based)
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
  location?: string; // fund domicile e.g. 'Germany', 'Luxembourg'
  fundCloseYear?: number; // year the fund term ends (e.g. 2035)
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
