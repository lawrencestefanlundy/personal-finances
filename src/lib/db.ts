import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Neon serverless Postgres suspends after inactivity.
    // A generous connect timeout lets the first request wait
    // for the compute to wake (~3-5 s) instead of failing.
    transactionOptions: {
      maxWait: 10_000, // ms to wait for a connection from pool
      timeout: 15_000, // ms for the whole transaction to complete
    },
  });

globalForPrisma.prisma = prisma;

export default prisma;
