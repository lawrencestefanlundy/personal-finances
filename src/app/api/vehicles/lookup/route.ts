import { NextResponse } from 'next/server';
import { getVehicleValuation } from '@/lib/vehicleValuation';

// In-memory cache: one lookup per registration per hour
const cache = new Map<string, { data: unknown; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reg = searchParams.get('registration')?.replace(/\s/g, '').toUpperCase();

  if (!reg) {
    return NextResponse.json(
      { error: 'registration query parameter is required' },
      { status: 400 },
    );
  }

  // Check cache
  const cached = cache.get(reg);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }

  try {
    const data = await getVehicleValuation(reg);
    cache.set(reg, { data, fetchedAt: Date.now() });

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) {
    console.error(`Vehicle lookup failed for ${reg}:`, err);
    return NextResponse.json({ error: 'Vehicle lookup failed' }, { status: 500 });
  }
}
