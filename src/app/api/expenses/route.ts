import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const items = await prisma.expense.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const data = await request.json();
  const item = await prisma.expense.create({ data });
  return NextResponse.json(item, { status: 201 });
}
