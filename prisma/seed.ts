/**
 * Seed the personal_finance database from either:
 * 1. A JSON export file (pass path as CLI arg): npx tsx prisma/seed.ts ./export.json
 * 2. The default seedData if no file provided
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { seedData } from '../src/data/seedData';

const prisma = new PrismaClient();

interface SeedState {
  cashPositions: Array<Record<string, unknown>>;
  incomeStreams: Array<Record<string, unknown>>;
  expenses: Array<Record<string, unknown>>;
  assets: Array<Record<string, unknown>>;
  liabilities: Array<Record<string, unknown>>;
  transactions: Array<Record<string, unknown>>;
  carryPositions: Array<
    Record<string, unknown> & { portfolioCompanies: Array<Record<string, unknown>> }
  >;
  scenarios: Array<Record<string, unknown> & { overrides: unknown }>;
  settings: Record<string, unknown>;
}

async function main() {
  const jsonPath = process.argv[2];
  let data: SeedState;

  if (jsonPath) {
    console.log(`Loading data from ${jsonPath}...`);
    const raw = readFileSync(jsonPath, 'utf-8');
    data = JSON.parse(raw) as SeedState;
  } else {
    console.log('No JSON file provided, using default seedData...');
    data = seedData as unknown as SeedState;
  }

  // Clear all tables in dependency order
  console.log('Clearing existing data...');
  await prisma.portfolioCompany.deleteMany();
  await prisma.carryPosition.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.scenario.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.cashPosition.deleteMany();
  await prisma.incomeStream.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.liability.deleteMany();

  // Seed cash positions
  if (data.cashPositions?.length) {
    await prisma.cashPosition.createMany({
      data: data.cashPositions.map((cp) => ({
        id: cp.id as string,
        name: cp.name as string,
        balance: cp.balance as number,
        interestRate: cp.interestRate as number,
        isLiquid: cp.isLiquid as boolean,
        category: cp.category as string,
        provider: (cp.provider as string) ?? null,
      })),
    });
    console.log(`  ${data.cashPositions.length} cash positions`);
  }

  // Seed income streams
  if (data.incomeStreams?.length) {
    await prisma.incomeStream.createMany({
      data: data.incomeStreams.map((is) => ({
        id: is.id as string,
        name: is.name as string,
        amount: is.amount as number,
        frequency: is.frequency as string,
        paymentMonths: (is.paymentMonths as number[]) ?? [],
        owner: is.owner as string,
        taxable: is.taxable as boolean,
        provider: (is.provider as string) ?? null,
      })),
    });
    console.log(`  ${data.incomeStreams.length} income streams`);
  }

  // Seed expenses
  if (data.expenses?.length) {
    await prisma.expense.createMany({
      data: data.expenses.map((e) => ({
        id: e.id as string,
        name: e.name as string,
        provider: (e.provider as string) ?? null,
        amount: e.amount as number,
        frequency: e.frequency as string,
        category: e.category as string,
        activeMonths: (e.activeMonths as number[]) ?? [],
        paymentMonths: (e.paymentMonths as number[]) ?? [],
        startDate: (e.startDate as string) ?? null,
        endDate: (e.endDate as string) ?? null,
        notes: (e.notes as string) ?? null,
      })),
    });
    console.log(`  ${data.expenses.length} expenses`);
  }

  // Seed assets
  if (data.assets?.length) {
    await prisma.asset.createMany({
      data: data.assets.map((a) => ({
        id: a.id as string,
        name: a.name as string,
        currentValue: a.currentValue as number,
        annualGrowthRate: a.annualGrowthRate as number,
        category: a.category as string,
        isLiquid: a.isLiquid as boolean,
        unlockYear: (a.unlockYear as number) ?? null,
        endYear: (a.endYear as number) ?? null,
        notes: (a.notes as string) ?? null,
        provider: (a.provider as string) ?? null,
        costBasis: (a.costBasis as number) ?? null,
        costCurrency: (a.costCurrency as string) ?? null,
        costBasisGBP: (a.costBasisGBP as number) ?? null,
        fxRate: (a.fxRate as number) ?? null,
        instrument: (a.instrument as string) ?? null,
        investmentDate: (a.investmentDate as string) ?? null,
        exitDate: (a.exitDate as string) ?? null,
        exitMethod: (a.exitMethod as string) ?? null,
        status: (a.status as string) ?? null,
        taxScheme: (a.taxScheme as string) ?? null,
        platform: (a.platform as string) ?? null,
        geography: (a.geography as string) ?? null,
        industry: (a.industry as string) ?? null,
      })),
    });
    console.log(`  ${data.assets.length} assets`);
  }

  // Seed liabilities
  if (data.liabilities?.length) {
    await prisma.liability.createMany({
      data: data.liabilities.map((l) => ({
        id: l.id as string,
        name: l.name as string,
        currentBalance: l.currentBalance as number,
        interestRate: l.interestRate as number,
        monthlyPayment: l.monthlyPayment as number,
        type: l.type as string,
        endYear: (l.endYear as number) ?? null,
        provider: (l.provider as string) ?? null,
      })),
    });
    console.log(`  ${data.liabilities.length} liabilities`);
  }

  // Seed transactions
  if (data.transactions?.length) {
    await prisma.transaction.createMany({
      data: data.transactions.map((t) => ({
        id: t.id as string,
        date: t.date as string,
        description: t.description as string,
        amount: t.amount as number,
        category: (t.category as string) ?? null,
        source: t.source as string,
        linkedEntityId: (t.linkedEntityId as string) ?? null,
        emailId: (t.emailId as string) ?? null,
      })),
      skipDuplicates: true,
    });
    console.log(`  ${data.transactions.length} transactions`);
  }

  // Seed carry positions + portfolio companies
  if (data.carryPositions?.length) {
    for (const cp of data.carryPositions) {
      const companies = cp.portfolioCompanies ?? [];
      await prisma.carryPosition.create({
        data: {
          id: cp.id as string,
          fundName: cp.fundName as string,
          provider: cp.provider as string,
          fundSize: cp.fundSize as number,
          committedCapital: cp.committedCapital as number,
          carryPercent: cp.carryPercent as number,
          hurdleRate: cp.hurdleRate as number,
          personalSharePercent: cp.personalSharePercent as number,
          linkedAssetId: (cp.linkedAssetId as string) ?? null,
          notes: (cp.notes as string) ?? null,
          portfolioCompanies: {
            create: companies.map((pc) => ({
              id: pc.id as string,
              name: pc.name as string,
              legalEntity: (pc.legalEntity as string) ?? null,
              investedAmount: pc.investedAmount as number,
              currentValuation: pc.currentValuation as number,
              ownershipPercent: pc.ownershipPercent as number,
              status: pc.status as string,
              investmentDate: (pc.investmentDate as string) ?? null,
              exitDate: (pc.exitDate as string) ?? null,
              holdingPeriod: (pc.holdingPeriod as number) ?? null,
              exitMethod: (pc.exitMethod as string) ?? null,
              geography: (pc.geography as string) ?? null,
              industry: (pc.industry as string) ?? null,
              proceeds: (pc.proceeds as number) ?? null,
              cashIncome: (pc.cashIncome as number) ?? null,
              irr: (pc.irr as number) ?? null,
              notes: (pc.notes as string) ?? null,
            })),
          },
        },
      });
    }
    console.log(`  ${data.carryPositions.length} carry positions`);
  }

  // Seed scenarios
  if (data.scenarios?.length) {
    await prisma.scenario.createMany({
      data: data.scenarios.map((s) => ({
        id: s.id as string,
        name: s.name as string,
        description: s.description as string,
        overrides: typeof s.overrides === 'string' ? s.overrides : JSON.stringify(s.overrides),
      })),
    });
    console.log(`  ${data.scenarios.length} scenarios`);
  }

  // Seed settings
  const settings = data.settings as Record<string, unknown>;
  const settingsEntries = Object.entries(settings).filter(([key]) =>
    ['startMonth', 'projectionEndYear', 'birthYear', 'currency'].includes(key),
  );
  for (const [key, value] of settingsEntries) {
    await prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
  console.log(`  ${settingsEntries.length} settings`);

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
