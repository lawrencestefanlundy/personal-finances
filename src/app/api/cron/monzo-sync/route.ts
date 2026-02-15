import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { monzoFetch, type MonzoTransaction } from '@/lib/monzo';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = await prisma.monzoToken.findUnique({ where: { id: 1 } });
    if (!token) {
      return NextResponse.json({ skipped: true, reason: 'No Monzo token' });
    }

    // Last 7 days for nightly sync
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const data = await monzoFetch<{ transactions: MonzoTransaction[] }>(
      `/transactions?account_id=${token.accountId}&expand[]=merchant&since=${since.toISOString()}`,
    );

    const mapped = data.transactions.map((tx) => ({
      id: `monzo-${tx.id}`,
      date: tx.created.split('T')[0],
      description: tx.merchant?.name ?? tx.description,
      amount: tx.amount / 100,
      category: tx.category ?? null,
      source: 'monzo' as const,
      linkedEntityId: null,
      emailId: null,
    }));

    const result = await prisma.transaction.createMany({
      data: mapped,
      skipDuplicates: true,
    });

    await prisma.settings.upsert({
      where: { key: 'monzo_last_sync' },
      update: { value: new Date().toISOString() },
      create: { key: 'monzo_last_sync', value: new Date().toISOString() },
    });

    return NextResponse.json({ synced: result.count, total: mapped.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cron sync failed';
    console.error('Monzo cron sync error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
