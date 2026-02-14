import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = data;
  const item = await prisma.incomeStream.update({ where: { id }, data: updateData });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.incomeStream.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
