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
    { id: 'asset-lunar1', name: 'Lunar I', currentValue: 417271, annualGrowthRate: 0.06, category: 'fund', isLiquid: false, unlockYear: 2030, provider: 'Lunar Ventures', notes: 'Berlin Innovation Ventures 1 GmbH & Co. KG. Carry 3.763%, 100% vested. Vintage 2019. €38.4M fund. Gross IRR 33.2%, 2.16x TVPI. Value at 2.5x return (post-tax).' },
    { id: 'asset-lunar2', name: 'Lunar II', currentValue: 284196, annualGrowthRate: 0.06, category: 'fund', isLiquid: false, unlockYear: 2034, provider: 'Lunar Ventures', notes: 'Lunar Ventures 2 SCSp. Carry 2.0%, 31% vested. Vintage 2023. €49.3M fund. Gross IRR 13.0%, 1.10x TVPI. Value at 2.5x return (post-tax).' },
    { id: 'asset-cloudberry1', name: 'Cloudberry I', currentValue: 1514316, annualGrowthRate: 0.06, category: 'fund', isLiquid: false, unlockYear: 2035, notes: 'Appears in 2035', provider: 'Cloudberry' },
    { id: 'asset-insigai', name: 'Insig AI (Options)', currentValue: 0, annualGrowthRate: 0, category: 'angel', isLiquid: false, notes: 'Personal Share Option Agreement dated 30 Sep 2025. 1,500,000 options over ordinary shares (1p nominal) at 50p exercise price. Vesting: 1,000,000 on 1 Apr 2026, 500,000 on 1 Apr 2027. Exercise deadline: 1 Oct 2028. Must sell via company broker with 28 days notice. Broker-assisted sell-to-cover permitted. Company indemnifies tax on grant. INSG.L share price: 17.50p (11 Feb 2026) — 65% out of the money (need 50p to break even). 52-week range: 13.50p–40.00p. Market cap: £21.9M.', provider: 'Insig AI', instrument: 'options', status: 'active', platform: 'direct', investmentDate: '2025-09-30' },
    { id: 'asset-car', name: 'Polo', currentValue: 7000, annualGrowthRate: -0.03, category: 'vehicle', isLiquid: false, provider: 'Volkswagen' },
    { id: 'asset-house', name: 'House', currentValue: 1419840, annualGrowthRate: 0.02, category: 'property', isLiquid: false },
    // Angel Investments — data from SotF seed-investments.ts
    { id: 'asset-angel-peek', name: 'Peek (fka Bluejay)', currentValue: 15800, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 20000, costCurrency: 'USD', instrument: 'safe', investmentDate: '2022-04-19', status: 'active', platform: 'direct', notes: 'Originally Bluejay Technologies Pte Ltd. SAFE rolled over to Peek (Sep 2025). $30M post-money valuation cap.' },
    { id: 'asset-angel-catapult', name: 'Catapult Labs', currentValue: 11850, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 15000, costCurrency: 'USD', instrument: 'safe', investmentDate: '2022-05-17', status: 'active', platform: 'direct', notes: 'YC-style SAFE modified for English law. Catapult Labs Ltd (England). $30M post-money valuation cap.' },
    { id: 'asset-angel-charm', name: 'Charm Therapeutics', currentValue: 45, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 20000, costCurrency: 'USD', instrument: 'equity', investmentDate: '2022-04-13', status: 'active', platform: 'odin', notes: 'Via Dhyan Charm SPV I LLP. Series B down round at $45M (May 2025). SPV owns 0.63%. Pay-to-play: pro-rata of $638k.' },
    { id: 'asset-angel-rain', name: 'Rain Neuromorphics', currentValue: 0, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 20000, costCurrency: 'USD', instrument: 'equity', investmentDate: '2022-03-04', status: 'active', platform: 'feedforward', notes: 'Via FeedForward VC. CFIUS forced Rain to remove non-US investors. Position likely impaired or forced exit.' },
    { id: 'asset-angel-callosum', name: 'Callosum Technologies', currentValue: 9999, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 9999.58, costCurrency: 'GBP', instrument: 'equity', investmentDate: '2026-01-15', status: 'active', platform: 'direct', notes: '7,364 Ordinary Shares at £1.3579. Heterogeneous compute for multi-agent AI. ARIA non-dilutive funding secured.' },
    { id: 'asset-angel-nevermined', name: 'Nevermined', currentValue: 21000, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 21000, costCurrency: 'GBP', instrument: 'equity', investmentDate: '2022-05-01', status: 'active', platform: 'direct', notes: 'Nevermined AG, Zug. Q4 2025: Signed Term Sheet with Visa. Three-way pilot with Visa, Nevermined, Cloudflare for AI agent commerce.' },
    { id: 'asset-angel-elemendar', name: 'Elemendar', currentValue: 2, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 2.33, costCurrency: 'GBP', instrument: 'options', investmentDate: '2021-08-05', status: 'active', platform: 'direct', notes: 'Advisor option grant. 233 B Ordinary (Non-Voting) Shares at £0.01 exercise price.' },
    { id: 'asset-angel-telesqope', name: 'Telesqope', currentValue: 2990, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 2989.62, costCurrency: 'GBP', instrument: 'equity', investmentDate: '2022-08-18', status: 'active', taxScheme: 'SEIS', platform: 'odin', notes: 'SEIS-qualifying ordinary shares. 60 shares at £49.827.' },
    { id: 'asset-angel-uhubs', name: 'Uhubs (Upskillhubs)', currentValue: 3002, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 3001.66, costCurrency: 'GBP', instrument: 'equity', investmentDate: '2021-11-26', status: 'active', taxScheme: 'EIS', platform: 'odin', notes: 'EIS-qualifying ordinary shares. £4M pre-money at entry. Dec 2025: £59k MRR, 6% monthly growth, profitable.' },
    { id: 'asset-angel-upside', name: 'Upside Money', currentValue: 2500, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 2500, costCurrency: 'GBP', instrument: 'advance_subscription', investmentDate: '2021-09-21', status: 'active', platform: 'direct', notes: 'Advance Subscription Agreement. 20% discount to next round. AIM listing process underway (Aug 2025).' },
    { id: 'asset-angel-bonnet', name: 'Bonnet', currentValue: 0, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 3902.48, costCurrency: 'GBP', instrument: 'equity', investmentDate: '2021-11-01', status: 'exited', platform: 'odin', notes: 'Exited via liquidation (Oct 2023). Near-total loss. Proceeds: £0.18.' },
    { id: 'asset-angel-roleshare', name: 'Roleshare', currentValue: 0, annualGrowthRate: 0, category: 'angel', isLiquid: false, costBasis: 3000, costCurrency: 'GBP', instrument: 'equity', investmentDate: '2021-10-11', status: 'exited', platform: 'odin', notes: 'Exited via liquidation (Apr 2024). Total loss.' },
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
