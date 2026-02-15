import { describe, it, expect } from 'vitest';
import { handlePrismaError } from '../api-utils';
import { Prisma } from '@prisma/client';

describe('handlePrismaError', () => {
  it('returns 409 for unique constraint violation (P2002)', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });
    const response = handlePrismaError(error, 'Test context');
    expect(response.status).toBe(409);
  });

  it('returns 404 for record not found (P2025)', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.0.0',
    });
    const response = handlePrismaError(error, 'Test context');
    expect(response.status).toBe(404);
  });

  it('returns 400 for foreign key constraint (P2003)', () => {
    const error = new Prisma.PrismaClientKnownRequestError('FK constraint failed', {
      code: 'P2003',
      clientVersion: '5.0.0',
    });
    const response = handlePrismaError(error, 'Test context');
    expect(response.status).toBe(400);
  });

  it('returns 500 for unknown Prisma error codes', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unknown', {
      code: 'P9999',
      clientVersion: '5.0.0',
    });
    const response = handlePrismaError(error, 'Test context');
    expect(response.status).toBe(500);
  });

  it('returns 400 for validation errors', () => {
    const error = new Prisma.PrismaClientValidationError('Invalid field', {
      clientVersion: '5.0.0',
    });
    const response = handlePrismaError(error, 'Test context');
    expect(response.status).toBe(400);
  });

  it('returns 500 for generic errors with message', () => {
    const error = new Error('Something broke');
    const response = handlePrismaError(error, 'Test context');
    expect(response.status).toBe(500);
  });

  it('returns 500 for non-Error objects', () => {
    const response = handlePrismaError('string error', 'Test context');
    expect(response.status).toBe(500);
  });
});
