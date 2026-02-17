import { NextResponse } from 'next/server';
import { getVehicleValuation } from '@/lib/vehicleValuation';

// In-memory cache: keyed by reg+mileage, one hour TTL
const cache = new Map<string, { data: unknown; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reg = searchParams.get('registration')?.replace(/\s/g, '').toUpperCase();
  const mileageParam = searchParams.get('mileage');
  const mileage = mileageParam ? parseInt(mileageParam, 10) : undefined;

  if (!reg) {
    return NextResponse.json(
      { error: 'registration query parameter is required' },
      { status: 400 },
    );
  }

  const cacheKey = `${reg}:${mileage ?? 'est'}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }

  try {
    const data = await getVehicleValuation(reg, mileage);
    cache.set(cacheKey, { data, fetchedAt: Date.now() });

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) {
    console.error(`Vehicle lookup failed for ${reg}:`, err);
    return NextResponse.json({ error: 'Vehicle lookup failed' }, { status: 500 });
  }
}
