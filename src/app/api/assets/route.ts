import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError } from '@/lib/api-utils';

export async function GET() {
  try {
    const items = await prisma.asset.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(items);
  } catch (error) {
    return handlePrismaError(error, 'Failed to fetch assets');
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const item = await prisma.asset.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handlePrismaError(error, 'Failed to create asset');
  }
}
