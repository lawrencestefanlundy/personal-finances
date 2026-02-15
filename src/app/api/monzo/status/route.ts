import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const token = await prisma.monzoToken.findUnique({ where: { id: 1 } });
    const lastSync = await prisma.settings.findUnique({
      where: { key: 'monzo_last_sync' },
    });

    if (!token) {
      return NextResponse.json({
        connected: false,
        accountId: null,
        expiresAt: null,
        lastSync: null,
      });
    }

    return NextResponse.json({
      connected: true,
      accountId: token.accountId,
      expiresAt: token.expiresAt.toISOString(),
      lastSync: lastSync?.value ?? null,
    });
  } catch {
    return NextResponse.json({
      connected: false,
      accountId: null,
      expiresAt: null,
      lastSync: null,
    });
  }
}
