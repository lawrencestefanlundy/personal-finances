import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError } from '@/lib/api-utils';
import { monzoFetch, type MonzoTransaction } from '@/lib/monzo';

export async function POST() {
  try {
    const token = await prisma.monzoToken.findUnique({ where: { id: 1 } });
    if (!token) {
      return NextResponse.json({ error: 'Monzo not connected' }, { status: 401 });
    }

    // Fetch transactions from the last 90 days (Monzo limits historical access)
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const data = await monzoFetch<{ transactions: MonzoTransaction[] }>(
      `/transactions?account_id=${token.accountId}&expand[]=merchant&since=${since.toISOString()}`,
    );

    // Map Monzo transactions to our Transaction format
    const mapped = data.transactions.map((tx) => ({
      id: `monzo-${tx.id}`,
      date: tx.created.split('T')[0], // YYYY-MM-DD
      description: tx.merchant?.name ?? tx.description,
      amount: tx.amount / 100, // Monzo uses minor units (pence)
      category: tx.category ?? null,
      source: 'monzo' as const,
      linkedEntityId: null,
      emailId: null,
    }));

    // Upsert transactions using createMany with skipDuplicates
    const result = await prisma.transaction.createMany({
      data: mapped,
      skipDuplicates: true,
    });

    // Update last sync timestamp
    await prisma.settings.upsert({
      where: { key: 'monzo_last_sync' },
      update: { value: new Date().toISOString() },
      create: { key: 'monzo_last_sync', value: new Date().toISOString() },
    });

    return NextResponse.json({ synced: result.count, total: mapped.length });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Monzo')) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return handlePrismaError(error, 'Failed to sync Monzo transactions');
  }
}
