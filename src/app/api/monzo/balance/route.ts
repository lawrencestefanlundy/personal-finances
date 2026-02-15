import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { monzoFetch, type MonzoBalance } from '@/lib/monzo';

export async function GET() {
  try {
    const token = await prisma.monzoToken.findUnique({ where: { id: 1 } });
    if (!token) {
      return NextResponse.json({ error: 'Monzo not connected' }, { status: 401 });
    }

    const data = await monzoFetch<MonzoBalance>(`/balance?account_id=${token.accountId}`);

    return NextResponse.json({
      balance: data.balance / 100,
      totalBalance: data.total_balance / 100,
      currency: data.currency,
      spendToday: data.spend_today / 100,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch balance';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
