import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError } from '@/lib/api-utils';

export async function GET() {
  try {
    const items = await prisma.incomeStream.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(items);
  } catch (error) {
    return handlePrismaError(error, 'Failed to fetch income streams');
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (data.monthlyOverrides && typeof data.monthlyOverrides === 'object') {
      data.monthlyOverrides = JSON.stringify(data.monthlyOverrides);
    }
    const item = await prisma.incomeStream.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handlePrismaError(error, 'Failed to create income stream');
  }
}
