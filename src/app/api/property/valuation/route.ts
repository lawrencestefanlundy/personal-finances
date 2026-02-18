import { NextResponse } from 'next/server';
import { getPropertyValuation } from '@/lib/propertyValuation';

// In-memory cache: keyed by region+price+date, 24-hour TTL
const cache = new Map<string, { data: unknown; fetchedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const purchasePrice = searchParams.get('purchasePrice');
  const purchaseDate = searchParams.get('purchaseDate');
  const region = searchParams.get('region');

  if (!purchasePrice || !purchaseDate || !region) {
    return NextResponse.json(
      { error: 'purchasePrice, purchaseDate, and region query parameters are required' },
      { status: 400 },
    );
  }

  const price = parseFloat(purchasePrice);
  if (isNaN(price) || price <= 0) {
    return NextResponse.json({ error: 'purchasePrice must be a positive number' }, { status: 400 });
  }

  const cacheKey = `${region}:${price}:${purchaseDate}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  }

  try {
    const data = await getPropertyValuation(price, purchaseDate, region);
    cache.set(cacheKey, { data, fetchedAt: Date.now() });

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (err) {
    console.error(`Property valuation failed for ${region}:`, err);
    return NextResponse.json({ error: 'Property valuation failed' }, { status: 500 });
  }
}
