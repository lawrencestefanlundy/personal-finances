import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError, withRetry } from '@/lib/api-utils';

export async function GET() {
  try {
    const items = await withRetry(() =>
      prisma.carryPosition.findMany({
        include: { portfolioCompanies: true },
        orderBy: { createdAt: 'asc' },
      }),
    );
    return NextResponse.json(items);
  } catch (error) {
    return handlePrismaError(error, 'Failed to fetch carry positions');
  }
}

export async function POST(request: Request) {
  try {
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
  } catch (error) {
    return handlePrismaError(error, 'Failed to create carry position');
  }
}
