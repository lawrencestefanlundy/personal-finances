import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError } from '@/lib/api-utils';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.carryPosition.findUnique({
      where: { id },
      include: { portfolioCompanies: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return handlePrismaError(error, 'Failed to fetch carry position');
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { portfolioCompanies, id: _id, createdAt: _ca, updatedAt: _ua, ...updateData } = data;

    // Replace all portfolio companies
    await prisma.portfolioCompany.deleteMany({ where: { carryPositionId: id } });

    const item = await prisma.carryPosition.update({
      where: { id },
      data: {
        ...updateData,
        portfolioCompanies: portfolioCompanies?.length
          ? {
              create: portfolioCompanies.map(
                ({
                  id: pcId,
                  createdAt: _ca,
                  updatedAt: _ua,
                  carryPositionId: _cpId,
                  ...pc
                }: Record<string, unknown>) => ({
                  id: pcId,
                  ...pc,
                }),
              ),
            }
          : undefined,
      },
      include: { portfolioCompanies: { orderBy: { displayOrder: 'asc' } } },
    });
    return NextResponse.json(item);
  } catch (error) {
    return handlePrismaError(error, 'Failed to update carry position');
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.carryPosition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handlePrismaError(error, 'Failed to delete carry position');
  }
}
