import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError } from '@/lib/api-utils';

export async function GET() {
  try {
    const items = await prisma.scenario.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(items.map((s) => ({ ...s, overrides: JSON.parse(s.overrides) })));
  } catch (error) {
    return handlePrismaError(error, 'Failed to fetch scenarios');
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const item = await prisma.scenario.create({
      data: {
        ...data,
        overrides:
          typeof data.overrides === 'string' ? data.overrides : JSON.stringify(data.overrides),
      },
    });
    return NextResponse.json({ ...item, overrides: JSON.parse(item.overrides) }, { status: 201 });
  } catch (error) {
    return handlePrismaError(error, 'Failed to create scenario');
  }
}
