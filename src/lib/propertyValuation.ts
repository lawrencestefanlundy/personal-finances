/**
 * Land Registry UK House Price Index (UKHPI) integration.
 *
 * Free, no-auth, official UK government data updated monthly.
 * Uses the Linked Data API to fetch HPI for a region and compute
 * a current property valuation from a known purchase price.
 *
 * Formula: estimatedValue = purchasePrice × (currentHPI / purchaseHPI)
 *
 * API docs: https://landregistry.data.gov.uk/app/ukhpi/doc
 */

import type { PropertyData } from '@/types/finance';

const UKHPI_BASE = 'https://landregistry.data.gov.uk/data/ukhpi/region';

interface UKHPIItem {
  'ukhpi:refPeriodStart': Array<{ '@value': string }>;
  'ukhpi:housePriceIndex': number;
  'ukhpi:averagePrice': number;
  'ukhpi:percentageAnnualChange'?: number;
}

interface UKHPIResponse {
  result: {
    items: UKHPIItem[];
  };
}

/**
 * Parse an HPI item from the Land Registry JSON response.
 */
function parseItem(item: UKHPIItem) {
  const dateArr = item['ukhpi:refPeriodStart'];
  const date = Array.isArray(dateArr) ? dateArr[0]?.['@value'] : undefined;
  return {
    date: date ?? '',
    hpi: item['ukhpi:housePriceIndex'] ?? 0,
    averagePrice: item['ukhpi:averagePrice'] ?? 0,
    annualChange: item['ukhpi:percentageAnnualChange'],
  };
}

/**
 * Fetch UKHPI data for a region from the Land Registry API.
 * Returns sorted array of { date, hpi, averagePrice } newest first.
 */
async function fetchUKHPI(region: string): Promise<ReturnType<typeof parseItem>[]> {
  // Fetch recent data (last ~5 years is plenty for valuation)
  const url = `${UKHPI_BASE}/${encodeURIComponent(region)}.json?_pageSize=200&_view=basic`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 86400 }, // Cache for 24h in Next.js
  });

  if (!res.ok) {
    throw new Error(`UKHPI fetch failed for ${region}: ${res.status}`);
  }

  const data = (await res.json()) as UKHPIResponse;
  const items = (data?.result?.items ?? []).map(parseItem).filter((i) => i.date && i.hpi > 0);

  // Sort newest first
  items.sort((a, b) => b.date.localeCompare(a.date));
  return items;
}

/**
 * Find the HPI value closest to a target month (YYYY-MM).
 */
function findHPIForMonth(
  items: ReturnType<typeof parseItem>[],
  targetMonth: string,
): ReturnType<typeof parseItem> | undefined {
  // Items are sorted newest first; find closest to target
  const target = targetMonth + '-01'; // approximate day
  let best: ReturnType<typeof parseItem> | undefined;
  let bestDiff = Infinity;

  for (const item of items) {
    const diff = Math.abs(new Date(item.date).getTime() - new Date(target).getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      best = item;
    }
  }
  return best;
}

/**
 * Compute property valuation using UKHPI data.
 *
 * @param purchasePrice - what was paid for the property
 * @param purchaseDate - when it was purchased (YYYY-MM)
 * @param region - Land Registry region slug (e.g. "lewes", "greater-london")
 */
export async function getPropertyValuation(
  purchasePrice: number,
  purchaseDate: string,
  region: string,
): Promise<PropertyData> {
  try {
    const items = await fetchUKHPI(region);

    if (items.length === 0) {
      return {
        hpiRegion: region,
        valuationDate: new Date().toISOString().split('T')[0],
      };
    }

    const latest = items[0];
    const purchasePoint = findHPIForMonth(items, purchaseDate);

    if (!purchasePoint || !latest) {
      return {
        hpiRegion: region,
        currentHPI: latest?.hpi,
        hpiDate: latest?.date,
        averagePrice: latest?.averagePrice,
        valuationDate: new Date().toISOString().split('T')[0],
      };
    }

    const estimatedValue = Math.round(purchasePrice * (latest.hpi / purchasePoint.hpi));

    return {
      purchaseHPI: purchasePoint.hpi,
      currentHPI: latest.hpi,
      hpiDate: latest.date,
      hpiRegion: region,
      estimatedValue,
      averagePrice: latest.averagePrice,
      annualChange: latest.annualChange,
      valuationDate: new Date().toISOString().split('T')[0],
    };
  } catch (err) {
    console.error(`Property valuation failed for ${region}:`, err);
    return {
      hpiRegion: region,
      valuationDate: new Date().toISOString().split('T')[0],
    };
  }
}
