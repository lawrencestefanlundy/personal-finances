'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Asset, PropertyData } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';

interface PropertyValuationCardProps {
  asset: Asset;
}

export default function PropertyValuationCard({ asset }: PropertyValuationCardProps) {
  const { dispatch } = useFinance();
  const [loading, setLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(() => {
    if (asset.propertyData) {
      try {
        return JSON.parse(asset.propertyData) as PropertyData;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);

  const { purchasePrice, purchaseDate, propertyRegion } = asset;

  const fetchValuation = useCallback(async () => {
    if (!purchasePrice || !purchaseDate || !propertyRegion) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        purchasePrice: String(purchasePrice),
        purchaseDate,
        region: propertyRegion,
      });
      const res = await fetch(`/api/property/valuation?${params}`);
      if (!res.ok) throw new Error(`Valuation failed (${res.status})`);
      const data = (await res.json()) as PropertyData;
      setPropertyData(data);

      // Persist property data to the asset
      dispatch({
        type: 'UPDATE_ASSET',
        payload: { ...asset, propertyData: JSON.stringify(data) },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Valuation failed');
    } finally {
      setLoading(false);
    }
  }, [purchasePrice, purchaseDate, propertyRegion, asset, dispatch]);

  // Auto-fetch on mount if no cached data or data is stale (>24h)
  useEffect(() => {
    if (!purchasePrice || !purchaseDate || !propertyRegion) return;
    if (propertyData?.valuationDate) {
      const age = Date.now() - new Date(propertyData.valuationDate).getTime();
      if (age < 24 * 60 * 60 * 1000) return; // Fresh enough
    }
    fetchValuation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchasePrice, purchaseDate, propertyRegion]);

  const applyValuation = (value: number) => {
    dispatch({
      type: 'UPDATE_ASSET',
      payload: { ...asset, currentValue: value },
    });
  };

  if (!purchasePrice || !purchaseDate || !propertyRegion) {
    return (
      <div className="mt-2 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-500">
        Add purchase price, date, and region to enable HPI valuation
      </div>
    );
  }

  return (
    <div className="mt-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-700 text-white text-[10px] font-bold">
            HPI
          </span>
          <span className="text-sm font-medium text-slate-800">
            Land Registry UK House Price Index
          </span>
          <span className="text-xs text-slate-500">({propertyRegion})</span>
        </div>
        <button
          onClick={fetchValuation}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100 disabled:opacity-50 transition-colors"
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
              Check HPI
            </>
          )}
        </button>
      </div>

      {error && <div className="px-4 py-2 text-xs text-red-600 bg-red-50">{error}</div>}

      {propertyData && (
        <div className="px-4 py-3 space-y-3">
          {/* HPI details row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <span>
              <span className="text-slate-400">Purchase price:</span>{' '}
              {formatCurrency(purchasePrice)}
            </span>
            <span>
              <span className="text-slate-400">Purchase date:</span> {purchaseDate}
            </span>
            {propertyData.purchaseHPI != null && (
              <span>
                <span className="text-slate-400">Purchase HPI:</span>{' '}
                {propertyData.purchaseHPI.toFixed(1)}
              </span>
            )}
            {propertyData.currentHPI != null && (
              <span>
                <span className="text-slate-400">Current HPI:</span>{' '}
                {propertyData.currentHPI.toFixed(1)}
              </span>
            )}
            {propertyData.hpiDate && (
              <span>
                <span className="text-slate-400">HPI date:</span> {propertyData.hpiDate}
              </span>
            )}
            {propertyData.annualChange != null && (
              <span>
                <span className="text-slate-400">YoY change:</span>{' '}
                <span
                  className={
                    propertyData.annualChange >= 0
                      ? 'text-emerald-600 font-medium'
                      : 'text-red-600 font-medium'
                  }
                >
                  {propertyData.annualChange >= 0 ? '+' : ''}
                  {propertyData.annualChange.toFixed(1)}%
                </span>
              </span>
            )}
            {propertyData.averagePrice != null && (
              <span>
                <span className="text-slate-400">Area avg:</span>{' '}
                {formatCurrency(propertyData.averagePrice)}
              </span>
            )}
          </div>

          {/* Valuation */}
          {propertyData.estimatedValue != null && propertyData.estimatedValue > 0 && (
            <div className="bg-white rounded-lg border border-emerald-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  HPI-Based Valuation
                </span>
                {propertyData.valuationDate && (
                  <span className="text-[10px] text-slate-400">{propertyData.valuationDate}</span>
                )}
              </div>

              <div className="flex items-center justify-center">
                <span className="bg-emerald-600 text-white text-sm font-bold px-4 py-1 rounded-full shadow-sm">
                  {formatCurrency(propertyData.estimatedValue)}
                </span>
              </div>

              {propertyData.purchaseHPI != null && propertyData.currentHPI != null && (
                <div className="text-[10px] text-slate-400 mt-1.5 text-center">
                  {formatCurrency(purchasePrice)} x ({propertyData.currentHPI.toFixed(1)} /{' '}
                  {propertyData.purchaseHPI.toFixed(1)})
                </div>
              )}

              {/* Difference from current value */}
              {propertyData.estimatedValue !== asset.currentValue && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-emerald-100">
                  <div className="text-xs text-slate-600">
                    Current dashboard value:{' '}
                    <span className="font-medium">{formatCurrency(asset.currentValue)}</span>
                    {propertyData.estimatedValue > asset.currentValue ? (
                      <span className="text-emerald-600 ml-1">
                        (+
                        {formatCurrency(propertyData.estimatedValue - asset.currentValue)})
                      </span>
                    ) : (
                      <span className="text-red-600 ml-1">
                        ({formatCurrency(propertyData.estimatedValue - asset.currentValue)})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => applyValuation(propertyData.estimatedValue!)}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors"
                  >
                    Update to {formatCurrency(propertyData.estimatedValue)}
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
