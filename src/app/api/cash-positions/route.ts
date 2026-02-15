import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError } from '@/lib/api-utils';

export async function GET() {
  try {
    const items = await prisma.cashPosition.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(items);
  } catch (error) {
    return handlePrismaError(error, 'Failed to fetch cash positions');
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const item = await prisma.cashPosition.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handlePrismaError(error, 'Failed to create cash position');
  }
}
