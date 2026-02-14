import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.carryPosition.findUnique({
    where: { id },
    include: { portfolioCompanies: true },
  });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    include: { portfolioCompanies: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.carryPosition.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
