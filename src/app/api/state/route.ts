import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { FinanceState } from '@/types/finance';

export async function GET() {
  const [
    cashPositions,
    incomeStreams,
    expenses,
    assets,
    liabilities,
    transactions,
    carryPositions,
    scenarios,
    settingsRows,
  ] = await Promise.all([
    prisma.cashPosition.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.incomeStream.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.expense.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.asset.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.liability.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.transaction.findMany({ orderBy: { date: 'desc' } }),
    prisma.carryPosition.findMany({
      include: { portfolioCompanies: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.scenario.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.settings.findMany(),
  ]);

  // Build settings object from key-value rows
  const settingsMap: Record<string, string> = {};
  for (const row of settingsRows) {
    settingsMap[row.key] = row.value;
  }

  // Strip Prisma timestamps from responses
  const strip = <T extends Record<string, unknown>>(items: T[]) =>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    items.map(({ createdAt, updatedAt, ...rest }) => rest);

  const state: FinanceState = {
    cashPositions: strip(cashPositions) as FinanceState['cashPositions'],
    incomeStreams: strip(incomeStreams) as FinanceState['incomeStreams'],
    expenses: strip(expenses) as FinanceState['expenses'],
    assets: strip(assets) as FinanceState['assets'],
    liabilities: strip(liabilities) as FinanceState['liabilities'],
    transactions: strip(transactions) as FinanceState['transactions'],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    carryPositions: carryPositions.map(({ createdAt, updatedAt, portfolioCompanies, ...rest }) => ({
      ...rest,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      portfolioCompanies: portfolioCompanies.map(
        ({ createdAt, updatedAt, carryPositionId, ...pc }) => pc,
      ),
    })) as FinanceState['carryPositions'],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    scenarios: scenarios.map(({ createdAt, updatedAt, overrides, ...rest }) => ({
      ...rest,
      overrides: JSON.parse(overrides),
    })) as FinanceState['scenarios'],
    activeScenarioId: settingsMap['activeScenarioId'] ?? null,
    settings: {
      startMonth: settingsMap['startMonth'] ?? '2026-02',
      projectionEndYear: Number(settingsMap['projectionEndYear'] ?? 2053),
      birthYear: Number(settingsMap['birthYear'] ?? 1986),
      currency: settingsMap['currency'] ?? 'GBP',
    },
    lastModified: new Date().toISOString(),
  };

  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const data = (await request.json()) as FinanceState;

  // Clear all tables in dependency order
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

  // Re-insert all data
  if (data.cashPositions?.length) {
    await prisma.cashPosition.createMany({
      data: data.cashPositions.map((cp) => ({
        id: cp.id,
        name: cp.name,
        balance: cp.balance,
        interestRate: cp.interestRate,
        isLiquid: cp.isLiquid,
        category: cp.category,
        provider: cp.provider ?? null,
      })),
    });
  }

  if (data.incomeStreams?.length) {
    await prisma.incomeStream.createMany({
      data: data.incomeStreams.map((is) => ({
        id: is.id,
        name: is.name,
        amount: is.amount,
        frequency: is.frequency,
        paymentMonths: is.paymentMonths ?? [],
        owner: is.owner,
        taxable: is.taxable,
        provider: is.provider ?? null,
      })),
    });
  }

  if (data.expenses?.length) {
    await prisma.expense.createMany({
      data: data.expenses.map((e) => ({
        id: e.id,
        name: e.name,
        provider: e.provider ?? null,
        amount: e.amount,
        frequency: e.frequency,
        category: e.category,
        activeMonths: e.activeMonths ?? [],
        paymentMonths: e.paymentMonths ?? [],
        startDate: e.startDate ?? null,
        endDate: e.endDate ?? null,
        notes: e.notes ?? null,
      })),
    });
  }

  if (data.assets?.length) {
    await prisma.asset.createMany({
      data: data.assets.map((a) => ({
        id: a.id,
        name: a.name,
        currentValue: a.currentValue,
        annualGrowthRate: a.annualGrowthRate,
        category: a.category,
        isLiquid: a.isLiquid,
        unlockYear: a.unlockYear ?? null,
        endYear: a.endYear ?? null,
        notes: a.notes ?? null,
        provider: a.provider ?? null,
        costBasis: a.costBasis ?? null,
        costCurrency: a.costCurrency ?? null,
        instrument: a.instrument ?? null,
        investmentDate: a.investmentDate ?? null,
        status: a.status ?? null,
        taxScheme: a.taxScheme ?? null,
        platform: a.platform ?? null,
      })),
    });
  }

  if (data.liabilities?.length) {
    await prisma.liability.createMany({
      data: data.liabilities.map((l) => ({
        id: l.id,
        name: l.name,
        currentBalance: l.currentBalance,
        interestRate: l.interestRate,
        monthlyPayment: l.monthlyPayment,
        type: l.type,
        endYear: l.endYear ?? null,
        provider: l.provider ?? null,
      })),
    });
  }

  if (data.transactions?.length) {
    await prisma.transaction.createMany({
      data: data.transactions.map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category ?? null,
        source: t.source,
        linkedEntityId: t.linkedEntityId ?? null,
        emailId: t.emailId ?? null,
      })),
      skipDuplicates: true,
    });
  }

  if (data.carryPositions?.length) {
    for (const cp of data.carryPositions) {
      await prisma.carryPosition.create({
        data: {
          id: cp.id,
          fundName: cp.fundName,
          provider: cp.provider,
          fundSize: cp.fundSize,
          committedCapital: cp.committedCapital,
          carryPercent: cp.carryPercent,
          hurdleRate: cp.hurdleRate,
          personalSharePercent: cp.personalSharePercent,
          linkedAssetId: cp.linkedAssetId ?? null,
          notes: cp.notes ?? null,
          portfolioCompanies: {
            create: (cp.portfolioCompanies ?? []).map((pc) => ({
              id: pc.id,
              name: pc.name,
              investedAmount: pc.investedAmount,
              currentValuation: pc.currentValuation,
              ownershipPercent: pc.ownershipPercent,
              status: pc.status,
              notes: pc.notes ?? null,
            })),
          },
        },
      });
    }
  }

  if (data.scenarios?.length) {
    await prisma.scenario.createMany({
      data: data.scenarios.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        overrides: typeof s.overrides === 'string' ? s.overrides : JSON.stringify(s.overrides),
      })),
    });
  }

  // Settings
  const settingsEntries: [string, string][] = [
    ['startMonth', data.settings.startMonth],
    ['projectionEndYear', String(data.settings.projectionEndYear)],
    ['birthYear', String(data.settings.birthYear)],
    ['currency', data.settings.currency],
  ];
  if (data.activeScenarioId) {
    settingsEntries.push(['activeScenarioId', data.activeScenarioId]);
  }
  for (const [key, value] of settingsEntries) {
    await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return NextResponse.json({ success: true });
}
