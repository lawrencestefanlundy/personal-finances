import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = data;
  const item = await prisma.scenario.update({
    where: { id },
    data: {
      ...updateData,
      overrides:
        typeof updateData.overrides === 'string'
          ? updateData.overrides
          : JSON.stringify(updateData.overrides),
    },
  });
  return NextResponse.json({ ...item, overrides: JSON.parse(item.overrides) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.scenario.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
