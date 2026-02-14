import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const rows = await prisma.settings.findMany();
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return NextResponse.json({
    startMonth: settings['startMonth'] ?? '2026-02',
    projectionEndYear: Number(settings['projectionEndYear'] ?? 2053),
    birthYear: Number(settings['birthYear'] ?? 1986),
    currency: settings['currency'] ?? 'GBP',
    activeScenarioId: settings['activeScenarioId'] ?? null,
  });
}

export async function PUT(request: Request) {
  const data = await request.json();
  const entries = Object.entries(data).filter(([, v]) => v !== undefined) as [string, unknown][];
  for (const [key, value] of entries) {
    await prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
  return NextResponse.json({ success: true });
}
