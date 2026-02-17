'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Asset, VehicleData } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';

interface VehicleValuationCardProps {
  asset: Asset;
}

export default function VehicleValuationCard({ asset }: VehicleValuationCardProps) {
  const { dispatch } = useFinance();
  const [loading, setLoading] = useState(false);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(() => {
    if (asset.vehicleData) {
      try {
        return JSON.parse(asset.vehicleData) as VehicleData;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);

  const registration = asset.registration;

  const fetchValuation = useCallback(async () => {
    if (!registration) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ registration });
      if (asset.mileage) params.set('mileage', String(asset.mileage));
      const res = await fetch(`/api/vehicles/lookup?${params}`);
      if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
      const data = (await res.json()) as VehicleData;
      setVehicleData(data);

      // Persist vehicle data to the asset
      dispatch({
        type: 'UPDATE_ASSET',
        payload: { ...asset, vehicleData: JSON.stringify(data) },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  }, [registration, asset, dispatch]);

  // Auto-fetch on mount if no cached data or data is stale (>24h)
  useEffect(() => {
    if (!registration) return;
    if (vehicleData?.valuationDate) {
      const age = Date.now() - new Date(vehicleData.valuationDate).getTime();
      if (age < 24 * 60 * 60 * 1000) return; // Fresh enough
    }
    fetchValuation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registration]);

  const applyValuation = (value: number) => {
    dispatch({
      type: 'UPDATE_ASSET',
      payload: { ...asset, currentValue: value },
    });
  };

  if (!registration) {
    return (
      <div className="mt-2 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-500">
        Add a registration number to enable real-time valuation
      </div>
    );
  }

  return (
    <div className="mt-2 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-700 text-white text-[10px] font-bold">
            UK
          </span>
          <span className="text-sm font-mono font-semibold text-slate-800 tracking-wider">
            {registration}
          </span>
          {vehicleData?.yearOfManufacture && (
            <span className="text-xs text-slate-500">({vehicleData.yearOfManufacture})</span>
          )}
        </div>
        <button
          onClick={fetchValuation}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Checking...
            </>
          ) : (
            <>
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Check Price
            </>
          )}
        </button>
      </div>

      {error && <div className="px-4 py-2 text-xs text-red-600 bg-red-50">{error}</div>}

      {vehicleData && (
        <div className="px-4 py-3 space-y-3">
          {/* DVLA details row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {vehicleData.colour && (
              <span>
                <span className="text-slate-400">Colour:</span> {vehicleData.colour}
              </span>
            )}
            {vehicleData.fuelType && (
              <span>
                <span className="text-slate-400">Fuel:</span> {vehicleData.fuelType}
              </span>
            )}
            {vehicleData.engineCapacity && (
              <span>
                <span className="text-slate-400">Engine:</span> {vehicleData.engineCapacity}cc
              </span>
            )}
            {vehicleData.motStatus && (
              <span>
                <span className="text-slate-400">MOT:</span>{' '}
                <span
                  className={
                    vehicleData.motStatus === 'Valid'
                      ? 'text-emerald-600 font-medium'
                      : 'text-red-600 font-medium'
                  }
                >
                  {vehicleData.motStatus}
                </span>
                {vehicleData.motExpiryDate && (
                  <span className="text-slate-400"> (exp {vehicleData.motExpiryDate})</span>
                )}
              </span>
            )}
            {vehicleData.taxStatus && (
              <span>
                <span className="text-slate-400">Tax:</span>{' '}
                <span
                  className={
                    vehicleData.taxStatus === 'Taxed'
                      ? 'text-emerald-600 font-medium'
                      : 'text-amber-600 font-medium'
                  }
                >
                  {vehicleData.taxStatus}
                </span>
              </span>
            )}
            {vehicleData.mileageEstimate && (
              <span>
                <span className="text-slate-400">
                  {asset.mileage ? 'Mileage:' : 'Est. mileage:'}
                </span>{' '}
                {vehicleData.mileageEstimate.toLocaleString()} mi
              </span>
            )}
          </div>

          {/* Valuation */}
          {vehicleData.valuationMid != null && vehicleData.valuationMid > 0 && (
            <div className="bg-white rounded-lg border border-slate-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Market Valuation
                </span>
                {vehicleData.valuationDate && (
                  <span className="text-[10px] text-slate-400">{vehicleData.valuationDate}</span>
                )}
              </div>

              {/* Price range bar */}
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-500 w-16 text-right">
                  {formatCurrency(vehicleData.valuationLow ?? 0)}
                </div>
                <div className="flex-1 relative h-6">
                  <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-amber-100 via-emerald-100 to-blue-100 rounded-full" />
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center">
                    <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                      {formatCurrency(vehicleData.valuationMid)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 w-16">
                  {formatCurrency(vehicleData.valuationHigh ?? 0)}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 mt-1.5 text-center">
                {vehicleData.valuationSource}
              </div>

              {/* Difference from current value */}
              {vehicleData.valuationMid !== asset.currentValue && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-600">
                    Current dashboard value:{' '}
                    <span className="font-medium">{formatCurrency(asset.currentValue)}</span>
                    {vehicleData.valuationMid > asset.currentValue ? (
                      <span className="text-emerald-600 ml-1">
                        (+{formatCurrency(vehicleData.valuationMid - asset.currentValue)})
                      </span>
                    ) : (
                      <span className="text-red-600 ml-1">
                        ({formatCurrency(vehicleData.valuationMid - asset.currentValue)})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => applyValuation(vehicleData.valuationMid!)}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors"
                  >
                    Update to {formatCurrency(vehicleData.valuationMid)}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
