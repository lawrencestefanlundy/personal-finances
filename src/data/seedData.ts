import { FinanceState } from '@/types/finance';

export const seedData: FinanceState = {
  cashPositions: [
    { id: 'cash-bank', name: 'Bank Account', balance: 639, interestRate: 0, isLiquid: true, category: 'cash', provider: 'Monzo' },
    { id: 'cash-instant', name: 'Instant Savings', balance: 42818, interestRate: 0.035, isLiquid: true, category: 'savings', provider: 'Chase' },
    { id: 'cash-isa', name: 'LLB ISA', balance: 20917, interestRate: 0.06, isLiquid: true, category: 'isa', provider: 'Lloyds Bank' },
    { id: 'cash-crypto', name: 'Crypto', balance: 6508, interestRate: 0, isLiquid: true, category: 'crypto', provider: 'Coinbase' },
  ],

  incomeStreams: [
    {
      id: 'inc-lawrence-salary',
      name: 'Lawrence Salary',
      amount: 3144,
      frequency: 'quarterly',
      paymentMonths: [3, 6, 9, 12],
      owner: 'lawrence',
      taxable: true,
      provider: 'State of the Future',
    },
    {
      id: 'inc-lawrence-dividends',
      name: 'Lawrence Dividends',
      amount: 9426,
      frequency: 'quarterly',
      paymentMonths: [3, 6, 9, 12],
      owner: 'lawrence',
      taxable: true,
      provider: 'State of the Future',
    },
    {
      id: 'inc-stephanie-dividends',
      name: 'Stephanie Dividends',
      amount: 9426,
      frequency: 'quarterly',
      paymentMonths: [3, 6, 9, 12],
      owner: 'stephanie',
      taxable: true,
      provider: 'State of the Future',
    },
    {
      id: 'inc-stephanie-salary',
      name: 'Stephanie Salary',
      amount: 1180,
      frequency: 'monthly',
      owner: 'stephanie',
      taxable: true,
      provider: 'Insig AI',
    },
  ],

  expenses: [
    // Debt
    { id: 'exp-cc-lloyds', name: 'Credit Card', provider: 'Lloyds Bank', amount: 1014, frequency: 'one-off', category: 'debt', startDate: '2026-03' },
    { id: 'exp-cc-amex', name: 'Credit Card', provider: 'Amex', amount: 858, frequency: 'one-off', category: 'debt', startDate: '2026-02' },

    // Investments
    { id: 'exp-investments', name: 'Investments', amount: 10000, frequency: 'one-off', category: 'investment', startDate: '2026-03' },

    // School Fees
    { id: 'exp-school-tmp', name: 'School Fees', provider: 'TMP', amount: 7038, frequency: 'termly', category: 'school', paymentMonths: [2, 5, 9], notes: 'First payment Feb is 13154' },

    // Holidays
    { id: 'exp-holidays', name: 'Holidays', amount: 3000, frequency: 'quarterly', category: 'holiday', paymentMonths: [4, 7, 11], notes: 'Varies: Apr £3k, Jul £6k, Nov £8k' },

    // Groceries
    { id: 'exp-groceries', name: 'Groceries', amount: 2300, frequency: 'monthly', category: 'groceries' },

    // Bills
    { id: 'exp-mortgage', name: 'Mortgage', provider: 'Aldermore', amount: 911, frequency: 'monthly', category: 'bills', notes: 'Starts Mar 2026' },
    { id: 'exp-council-tax', name: 'Council Tax', provider: 'Lewes District', amount: 460, frequency: 'monthly', category: 'bills', activeMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { id: 'exp-gas-electric', name: 'Gas & Electric', provider: 'Octopus Energy', amount: 257, frequency: 'monthly', category: 'bills' },
    { id: 'exp-water', name: 'Water', provider: 'Southern Water', amount: 77, frequency: 'monthly', category: 'bills' },
    { id: 'exp-broadband', name: 'Broadband', provider: 'Virgin Media', amount: 66, frequency: 'monthly', category: 'bills' },

    // Health
    { id: 'exp-bupa', name: 'Health Insurance', provider: 'Bupa', amount: 131, frequency: 'monthly', category: 'health' },
    { id: 'exp-peloton', name: 'Peloton', provider: 'Peloton', amount: 45, frequency: 'monthly', category: 'health' },

    // Car
    { id: 'exp-petrol', name: 'Petrol', amount: 100, frequency: 'monthly', category: 'car' },
    { id: 'exp-dvla', name: 'Car Tax', provider: 'DVLA', amount: 190, frequency: 'annual', category: 'car', paymentMonths: [12] },

    // Insurance
    { id: 'exp-home-insurance', name: 'Home Insurance', provider: 'Policy Expert', amount: 226, frequency: 'annual', category: 'insurance', paymentMonths: [7] },
    { id: 'exp-travel-insurance', name: 'Travel Insurance', provider: 'Monzo', amount: 22, frequency: 'monthly', category: 'insurance' },
    { id: 'exp-pet-insurance', name: 'Pet Insurance', provider: 'Purely Pets', amount: 23, frequency: 'monthly', category: 'insurance' },
    { id: 'exp-pet-health', name: 'Pet Health Club', provider: 'Pet Health Club', amount: 23, frequency: 'monthly', category: 'insurance' },
    { id: 'exp-car-insurance', name: 'Car Insurance', provider: 'Hastings', amount: 554, frequency: 'annual', category: 'insurance', paymentMonths: [12] },

    // Subscriptions
    { id: 'exp-tv-license', name: 'TV Licensing', provider: 'TV License', amount: 14, frequency: 'monthly', category: 'subscriptions' },
    { id: 'exp-smarty', name: 'Mobile', provider: 'Smarty', amount: 20, frequency: 'monthly', category: 'subscriptions' },
    { id: 'exp-spotify', name: 'Spotify', provider: 'Spotify', amount: 17, frequency: 'monthly', category: 'subscriptions' },
    { id: 'exp-amazon', name: 'Amazon Prime', provider: 'Amazon', amount: 9, frequency: 'monthly', category: 'subscriptions' },

    // Extracurricular
    { id: 'exp-music', name: 'Music Lessons', provider: 'TBC', amount: 110, frequency: 'bimonthly', category: 'extracurricular', paymentMonths: [3, 5, 7, 9, 11] },
    { id: 'exp-swimming', name: 'Swimming', provider: 'Isenhurst', amount: 56, frequency: 'monthly', category: 'extracurricular' },
    { id: 'exp-tennis', name: 'Tennis', provider: 'Greg', amount: 96, frequency: 'bimonthly', category: 'extracurricular', paymentMonths: [2, 4, 6, 8, 10, 12] },

    // House
    { id: 'exp-cleaner', name: 'Cleaner', amount: 120, frequency: 'monthly', category: 'house' },

    // Tax
    { id: 'exp-tax-lawrence', name: 'Tax (Lawrence)', amount: 3999, frequency: 'annual', category: 'tax', paymentMonths: [12], notes: 'Jul 2026 = £7,424 (first year)' },
    { id: 'exp-tax-stephanie', name: 'Tax (Stephanie)', amount: 3999, frequency: 'annual', category: 'tax', paymentMonths: [12] },
  ],

  assets: [
    { id: 'asset-instant', name: 'Instant Savings', currentValue: 43000, annualGrowthRate: 0.035, category: 'savings', isLiquid: true, provider: 'Chase' },
    { id: 'asset-isa', name: 'ISA', currentValue: 20984, annualGrowthRate: 0.06, category: 'isa', isLiquid: true, provider: 'Lloyds Bank' },
    { id: 'asset-crypto', name: 'Crypto', currentValue: 8119, annualGrowthRate: 0, category: 'crypto', isLiquid: true, provider: 'Coinbase' },
    { id: 'asset-lunar1', name: 'Lunar I', currentValue: 417271, annualGrowthRate: 0.06, category: 'fund', isLiquid: false, unlockYear: 2030, provider: 'Lunar Ventures' },
    { id: 'asset-lunar2', name: 'Lunar II', currentValue: 284196, annualGrowthRate: 0.06, category: 'fund', isLiquid: false, unlockYear: 2034, provider: 'Lunar Ventures' },
    { id: 'asset-cloudberry1', name: 'Cloudberry I', currentValue: 1514316, annualGrowthRate: 0.06, category: 'fund', isLiquid: false, unlockYear: 2035, notes: 'Appears in 2035', provider: 'Cloudberry' },
    { id: 'asset-insigai', name: 'Insig AI (Options)', currentValue: 0, annualGrowthRate: 0, category: 'angel', isLiquid: false, notes: '1.5M options at 50p exercise. Vesting: 1M Apr 2026, 500K Apr 2027. Currently out of the money (~28p share price Nov 2025)', provider: 'Insig AI' },
    { id: 'asset-car', name: 'Polo', currentValue: 7000, annualGrowthRate: -0.03, category: 'vehicle', isLiquid: false, provider: 'Volkswagen' },
    { id: 'asset-house', name: 'House', currentValue: 1419840, annualGrowthRate: 0.02, category: 'property', isLiquid: false },
    { id: 'asset-angel', name: 'Angel Investments', currentValue: 68000, annualGrowthRate: 0, category: 'angel', isLiquid: false },
    { id: 'asset-sb-pension', name: 'SB Pension', currentValue: 15000, annualGrowthRate: 0.06, category: 'pension', isLiquid: false, provider: 'Vanguard' },
    { id: 'asset-llb-pension', name: 'LLB Pension', currentValue: 20117, annualGrowthRate: 0.06, category: 'pension', isLiquid: false, provider: 'Vanguard' },
    { id: 'asset-kit-isa', name: 'Kit ISA', currentValue: 13027, annualGrowthRate: 0.06, category: 'children_isa', isLiquid: false, endYear: 2039, provider: 'Vanguard' },
    { id: 'asset-finn-isa', name: 'Finn ISA', currentValue: 13027, annualGrowthRate: 0.06, category: 'children_isa', isLiquid: false, endYear: 2037, provider: 'Vanguard' },
  ],

  liabilities: [
    { id: 'liab-mortgage', name: 'Mortgage', currentBalance: 156870, interestRate: 0.0559, monthlyPayment: 911, type: 'mortgage', provider: 'Aldermore' },
    { id: 'liab-sl-plan2', name: 'Steph Student Loan (Plan 2)', currentBalance: 26610, interestRate: 0.0625, monthlyPayment: 0, type: 'student_loan', endYear: 2040, provider: 'SLC' },
    { id: 'liab-sl-postgrad', name: 'Steph Student Loan (Postgrad)', currentBalance: 18503, interestRate: 0.075, monthlyPayment: 0, type: 'student_loan', endYear: 2040, provider: 'SLC' },
  ],

  transactions: [],

  scenarios: [],
  activeScenarioId: null,

  settings: {
    startMonth: '2026-02',
    projectionEndYear: 2053,
    birthYear: 1986,
    currency: 'GBP',
  },

  lastModified: new Date().toISOString(),
};
