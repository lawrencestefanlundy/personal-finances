import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const settingsUrl = new URL('/settings', request.url);

  // Handle OAuth errors (user denied, etc.)
  if (error) {
    settingsUrl.searchParams.set('monzo', 'error');
    settingsUrl.searchParams.set('message', error);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !state) {
    settingsUrl.searchParams.set('monzo', 'error');
    settingsUrl.searchParams.set('message', 'Missing code or state');
    return NextResponse.redirect(settingsUrl);
  }

  // Validate state parameter
  const storedState = await prisma.settings.findUnique({
    where: { key: 'monzo_oauth_state' },
  });

  if (!storedState || storedState.value !== state) {
    settingsUrl.searchParams.set('monzo', 'error');
    settingsUrl.searchParams.set('message', 'Invalid state parameter');
    return NextResponse.redirect(settingsUrl);
  }

  // Clean up the state value
  await prisma.settings.delete({ where: { key: 'monzo_oauth_state' } });

  // Exchange code for tokens
  const tokenResponse = await fetch('https://api.monzo.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.MONZO_CLIENT_ID!,
      client_secret: process.env.MONZO_CLIENT_SECRET!,
      redirect_uri: process.env.MONZO_REDIRECT_URI!,
      code,
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    console.error('Monzo token exchange failed:', errorBody);
    settingsUrl.searchParams.set('monzo', 'error');
    settingsUrl.searchParams.set('message', 'Token exchange failed');
    return NextResponse.redirect(settingsUrl);
  }

  const tokenData = await tokenResponse.json();

  // Fetch account info to store the account ID
  let accountId = '';
  const userId: string = tokenData.user_id ?? '';

  const accountsResponse = await fetch('https://api.monzo.com/accounts', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (accountsResponse.ok) {
    const accountsData = await accountsResponse.json();
    // Prefer uk_business account, fallback to first
    const account =
      accountsData.accounts?.find((acc: { type: string }) => acc.type === 'uk_business') ??
      accountsData.accounts?.[0];
    accountId = account?.id ?? '';
  }

  // Store tokens in DB (upsert — always row id=1)
  await prisma.monzoToken.upsert({
    where: { id: 1 },
    update: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      accountId,
      userId,
    },
    create: {
      id: 1,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      accountId,
      userId,
    },
  });

  settingsUrl.searchParams.set('monzo', 'connected');
  return NextResponse.redirect(settingsUrl);
}
