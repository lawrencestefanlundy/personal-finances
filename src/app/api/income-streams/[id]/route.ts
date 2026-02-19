import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError } from '@/lib/api-utils';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = data;
    // Serialize monthlyOverrides object to JSON string for Prisma
    if (updateData.monthlyOverrides && typeof updateData.monthlyOverrides === 'object') {
      updateData.monthlyOverrides = JSON.stringify(updateData.monthlyOverrides);
    }
    const item = await prisma.incomeStream.update({ where: { id }, data: updateData });
    return NextResponse.json(item);
  } catch (error) {
    return handlePrismaError(error, 'Failed to update income stream');
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.incomeStream.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handlePrismaError(error, 'Failed to delete income stream');
  }
}
