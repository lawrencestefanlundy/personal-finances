import { prisma } from '@/lib/db';

const MONZO_API_BASE = 'https://api.monzo.com';
const TOKEN_BUFFER_SECONDS = 300; // refresh 5 minutes before actual expiry

// --- Monzo API response types ---

export interface MonzoTransaction {
  id: string;
  created: string;
  amount: number; // minor units (pence), negative = debit
  currency: string;
  description: string;
  merchant: {
    name: string;
    category: string;
  } | null;
  notes: string;
  category: string;
  settled: string;
}

export interface MonzoBalance {
  balance: number;
  total_balance: number;
  currency: string;
  spend_today: number;
}

export interface MonzoAccount {
  id: string;
  description: string;
  type: string;
  closed: boolean;
}

// --- Token management ---

export async function getValidToken(): Promise<string> {
  const token = await prisma.monzoToken.findUnique({ where: { id: 1 } });

  if (!token) {
    throw new Error('No Monzo token found. Please connect Monzo in Settings.');
  }

  const now = new Date();
  const bufferExpiry = new Date(token.expiresAt.getTime() - TOKEN_BUFFER_SECONDS * 1000);

  if (now < bufferExpiry) {
    return token.accessToken;
  }

  // Token expired or about to expire — refresh it
  const response = await fetch(`${MONZO_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.MONZO_CLIENT_ID!,
      client_secret: process.env.MONZO_CLIENT_SECRET!,
      refresh_token: token.refreshToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // If refresh fails with auth error, token is revoked — delete it
    if (response.status === 401 || response.status === 403) {
      await prisma.monzoToken.delete({ where: { id: 1 } }).catch(() => {});
      throw new Error('Monzo refresh token expired. Please reconnect in Settings.');
    }
    throw new Error(`Monzo token refresh failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();

  // Monzo refresh tokens are single-use — save the new one
  const updated = await prisma.monzoToken.update({
    where: { id: 1 },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return updated.accessToken;
}

// --- API wrapper ---

export async function monzoFetch<T>(path: string): Promise<T> {
  const accessToken = await getValidToken();

  const response = await fetch(`${MONZO_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Monzo API error: ${response.status} ${errorBody}`);
  }

  return response.json() as Promise<T>;
}
