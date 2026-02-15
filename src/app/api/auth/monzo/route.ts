import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  // Generate a random state parameter for CSRF protection
  const state = crypto.randomUUID();

  // Store state in Settings table for validation in callback
  await prisma.settings.upsert({
    where: { key: 'monzo_oauth_state' },
    update: { value: state },
    create: { key: 'monzo_oauth_state', value: state },
  });

  const params = new URLSearchParams({
    client_id: process.env.MONZO_CLIENT_ID!,
    redirect_uri: process.env.MONZO_REDIRECT_URI!,
    response_type: 'code',
    state,
  });

  return NextResponse.redirect(`https://auth.monzo.com/?${params.toString()}`);
}

export async function DELETE() {
  try {
    await prisma.monzoToken.delete({ where: { id: 1 } });
  } catch {
    // Already disconnected — idempotent
  }
  // Clean up related settings keys
  await prisma.settings
    .deleteMany({
      where: { key: { in: ['monzo_oauth_state', 'monzo_last_sync'] } },
    })
    .catch(() => {});

  return NextResponse.json({ success: true });
}
