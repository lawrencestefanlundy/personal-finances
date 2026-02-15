import { NextResponse } from 'next/server';

const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=GBP';
const FALLBACK_RATE = 0.84;

// In-memory cache: one fetch per day is plenty (ECB updates once daily ~16:00 CET)
let cached: { rate: number; date: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function GET() {
  const now = Date.now();

  // Return cached if fresh
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(
      { rate: cached.rate, date: cached.date, source: 'ecb' },
      { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200' } },
    );
  }

  try {
    const res = await fetch(FRANKFURTER_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Frankfurter returned ${res.status}`);

    const data = (await res.json()) as { date: string; rates: { GBP: number } };
    const rate = data.rates.GBP;

    cached = { rate, date: data.date, fetchedAt: now };

    return NextResponse.json(
      { rate, date: data.date, source: 'ecb' },
      { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200' } },
    );
  } catch (err) {
    console.error('Failed to fetch EUR/GBP rate:', err);

    // Return cached even if stale, or fallback
    if (cached) {
      return NextResponse.json({
        rate: cached.rate,
        date: cached.date,
        source: 'ecb-cached',
      });
    }

    return NextResponse.json({
      rate: FALLBACK_RATE,
      date: null,
      source: 'fallback',
    });
  }
}
