import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

/**
 * Retry a database operation with exponential back-off.
 * Designed for Neon cold-start: the first request after idle may fail
 * because the compute is still waking up (~3-5 s). Retrying once or
 * twice transparently hides this from the user.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, baseDelayMs = 1_000 } = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isRetryable =
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientRustPanicError ||
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P1001') ||
        (error instanceof Error &&
          /connect|timed out|connection|ECONNREFUSED|socket/i.test(error.message));

      if (!isRetryable || attempt === retries) break;

      const delayMs = baseDelayMs * 2 ** attempt;
      console.warn(`DB connection attempt ${attempt + 1} failed, retrying in ${delayMs}ms…`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

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
