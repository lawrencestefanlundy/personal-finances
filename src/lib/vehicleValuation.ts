/**
 * Vehicle valuation estimation based on UK used-car market data.
 *
 * Uses known market prices (from AutoTrader, Motors, Parkers, CarGurus)
 * combined with age-based depreciation to produce low/mid/high estimates.
 *
 * When the DVLA API key is configured, we also pull live vehicle details
 * (MOT status, tax status, colour, engine) to enrich the data.
 */

import type { VehicleData } from '@/types/finance';
import { lookupDvla } from './dvla';

/** Known market data points for specific vehicles (price in GBP). */
interface MarketDataPoint {
  mileage: number;
  price: number;
  source: string;
  date: string;
}

interface VehicleProfile {
  /** Display name */
  model: string;
  /** Year of manufacture */
  year: number;
  /** New price when sold (GBP) */
  newPrice: number;
  /** Annual depreciation rate (decimal, e.g. 0.12 = 12%) — steeper in early years */
  depreciationCurve: (ageYears: number) => number;
  /** Recent market data points */
  comparables: MarketDataPoint[];
}

/**
 * Known vehicle profiles keyed by registration.
 * Add more vehicles here as needed.
 */
const VEHICLE_PROFILES: Record<string, VehicleProfile> = {
  GY17STZ: {
    model: 'Volkswagen Polo Match Edition 1.2 TSI 90',
    year: 2017,
    newPrice: 16500,
    depreciationCurve: (age: number) => {
      // VW Polo depreciation: ~15% yr1, ~12% yr2-3, ~8% yr4-5, ~5% yr6+
      if (age <= 0) return 0;
      let value = 1.0;
      for (let y = 1; y <= age; y++) {
        if (y === 1) value *= 0.85;
        else if (y <= 3) value *= 0.88;
        else if (y <= 5) value *= 0.92;
        else value *= 0.95;
      }
      return 1 - value;
    },
    comparables: [
      // Real listings from Feb 2026 market research
      { mileage: 18300, price: 13170, source: 'Motors.co.uk', date: '2026-02' },
      { mileage: 25000, price: 10799, source: 'Parkers', date: '2026-02' },
      { mileage: 34097, price: 11000, source: 'Parkers', date: '2026-02' },
      { mileage: 22000, price: 11575, source: 'Motors.co.uk', date: '2026-02' },
      { mileage: 51000, price: 8995, source: 'Motors.co.uk', date: '2026-02' },
      { mileage: 88143, price: 6500, source: 'AutoTrader', date: '2026-02' },
    ],
  },
};

/**
 * Estimate market value for a vehicle based on comparables and mileage.
 * Uses linear regression on price vs mileage from comparable listings.
 */
function estimateFromComparables(
  comparables: MarketDataPoint[],
  estimatedMileage: number,
): { low: number; mid: number; high: number } {
  if (comparables.length < 2) {
    const avg = comparables[0]?.price ?? 0;
    return { low: avg * 0.85, mid: avg, high: avg * 1.15 };
  }

  // Simple linear regression: price = a + b * mileage
  const n = comparables.length;
  const sumX = comparables.reduce((s, c) => s + c.mileage, 0);
  const sumY = comparables.reduce((s, c) => s + c.price, 0);
  const sumXY = comparables.reduce((s, c) => s + c.mileage * c.price, 0);
  const sumX2 = comparables.reduce((s, c) => s + c.mileage * c.mileage, 0);

  const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const a = (sumY - b * sumX) / n;

  const predicted = Math.max(a + b * estimatedMileage, 0);

  // Compute residuals for confidence band
  const residuals = comparables.map((c) => Math.abs(c.price - (a + b * c.mileage)));
  const avgResidual = residuals.reduce((s, r) => s + r, 0) / n;

  return {
    low: Math.round(Math.max(predicted - avgResidual, 0) / 50) * 50,
    mid: Math.round(predicted / 50) * 50,
    high: Math.round((predicted + avgResidual) / 50) * 50,
  };
}

/**
 * Estimate mileage for a UK car based on age.
 * Average UK annual mileage is ~7,400 miles (DfT 2023 data).
 */
function estimateMileage(yearOfManufacture: number): number {
  const age = new Date().getFullYear() - yearOfManufacture;
  return Math.round(age * 7400);
}

/**
 * Look up vehicle data and estimate market value.
 *
 * Returns enriched vehicle data including DVLA details (if API key set)
 * and market valuation based on comparable listings.
 */
export async function getVehicleValuation(
  registration: string,
  actualMileage?: number,
): Promise<VehicleData> {
  const reg = registration.replace(/\s/g, '').toUpperCase();
  const profile = VEHICLE_PROFILES[reg];

  // Try DVLA lookup for live vehicle details
  const dvla = await lookupDvla(reg);

  const year = dvla?.yearOfManufacture ?? profile?.year ?? 0;
  const mileage = actualMileage ?? estimateMileage(year);

  let valuationLow = 0;
  let valuationMid = 0;
  let valuationHigh = 0;
  let valuationSource = 'depreciation-model';

  if (profile?.comparables.length) {
    // Use real comparable market data
    const est = estimateFromComparables(profile.comparables, mileage);
    valuationLow = est.low;
    valuationMid = est.mid;
    valuationHigh = est.high;
    valuationSource = `market-comparables (${profile.comparables.length} listings${actualMileage ? `, ${actualMileage.toLocaleString()} mi actual` : ''})`;
  } else if (profile) {
    // Fall back to depreciation curve
    const age = new Date().getFullYear() - profile.year;
    const depreciation = profile.depreciationCurve(age);
    const estimated = Math.round(profile.newPrice * (1 - depreciation));
    valuationLow = Math.round((estimated * 0.85) / 50) * 50;
    valuationMid = Math.round(estimated / 50) * 50;
    valuationHigh = Math.round((estimated * 1.15) / 50) * 50;
    valuationSource = 'depreciation-model';
  }

  return {
    // DVLA fields (live if key configured, null otherwise)
    make: dvla?.make ?? profile?.model?.split(' ')[0],
    colour: dvla?.colour,
    yearOfManufacture: year,
    engineCapacity: dvla?.engineCapacity,
    fuelType: dvla?.fuelType,
    co2Emissions: dvla?.co2Emissions,
    taxStatus: dvla?.taxStatus,
    taxDueDate: dvla?.taxDueDate,
    motStatus: dvla?.motStatus,
    motExpiryDate: dvla?.motExpiryDate,
    dateOfLastV5CIssued: dvla?.dateOfLastV5CIssued,
    // Valuation
    valuationLow,
    valuationMid,
    valuationHigh,
    valuationSource,
    valuationDate: new Date().toISOString().split('T')[0],
    mileageEstimate: mileage,
  };
}
