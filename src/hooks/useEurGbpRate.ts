'use client';

import { useState, useEffect } from 'react';

const FALLBACK_RATE = 0.84;

interface FxState {
  /** EUR→GBP rate (e.g. 0.87 means €1 = £0.87) */
  rate: number;
  /** ECB reference date, e.g. "2026-02-13" */
  date: string | null;
  /** 'ecb' = live, 'ecb-cached' = stale server cache, 'fallback' = hardcoded */
  source: 'ecb' | 'ecb-cached' | 'fallback';
}

export function useEurGbpRate(): FxState {
  const [fx, setFx] = useState<FxState>({
    rate: FALLBACK_RATE,
    date: null,
    source: 'fallback',
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/fx');
        if (!res.ok) throw new Error(`FX API returned ${res.status}`);
        const data = (await res.json()) as FxState;
        if (!cancelled) setFx(data);
      } catch {
        // Keep fallback — already set
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return fx;
}
