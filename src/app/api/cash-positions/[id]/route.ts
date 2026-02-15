import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError } from '@/lib/api-utils';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = data;
    const item = await prisma.cashPosition.update({ where: { id }, data: updateData });
    return NextResponse.json(item);
  } catch (error) {
    return handlePrismaError(error, 'Failed to update cash position');
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.cashPosition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handlePrismaError(error, 'Failed to delete cash position');
  }
}
