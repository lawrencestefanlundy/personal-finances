import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export function handlePrismaError(error: unknown, context: string) {
  console.error(`${context}:`, error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          { error: `A record with that value already exists`, code: error.code },
          { status: 409 },
        );
      case 'P2025':
        return NextResponse.json({ error: 'Record not found', code: error.code }, { status: 404 });
      case 'P2003':
        return NextResponse.json(
          { error: 'Related record not found', code: error.code },
          { status: 400 },
        );
      default:
        return NextResponse.json({ error: `Database error`, code: error.code }, { status: 500 });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return NextResponse.json({ error: message }, { status: 500 });
}
