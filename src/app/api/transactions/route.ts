import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Number(searchParams.get('limit') ?? 100);
  const offset = Number(searchParams.get('offset') ?? 0);
  const source = searchParams.get('source');

  const where = source ? { source } : {};
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}

export async function POST(request: Request) {
  const data = await request.json();
  // Support bulk insert (array) or single
  const transactions = Array.isArray(data) ? data : [data];
  const result = await prisma.transaction.createMany({
    data: transactions.map((t: Record<string, unknown>) => ({
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
  return NextResponse.json({ count: result.count }, { status: 201 });
}
