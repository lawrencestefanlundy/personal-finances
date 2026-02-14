import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const items = await prisma.carryPosition.findMany({
    include: { portfolioCompanies: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const data = await request.json();
  const { portfolioCompanies, ...rest } = data;
  const item = await prisma.carryPosition.create({
    data: {
      ...rest,
      portfolioCompanies: portfolioCompanies?.length ? { create: portfolioCompanies } : undefined,
    },
    include: { portfolioCompanies: true },
  });
  return NextResponse.json(item, { status: 201 });
}
