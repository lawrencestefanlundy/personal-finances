'use client';

import { useMemo } from 'react';
import { Asset } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  angelAssets: Asset[];
}

interface ReliefRow {
  id: string;
  name: string;
  investment: number;
  scheme: 'SEIS' | 'EIS' | null;
  rate: number;
  expectedRelief: number;
  certificateStatus: 'missing' | 'received';
  claimed: boolean;
  claimedAmount: number;
  taxYear: string;
  status: string;
}

// Known claims from tax documents
const KNOWN_CLAIMS: Record<string, { amount: number; taxYear: string }> = {
  // 2022/2023: SEIS income tax relief on £7,973 at 50% = £3,986.50
  // This was a bulk claim - we know Bonnet was SEIS, so attribute proportionally
  'asset-angel-bonnet': { amount: 1951.24, taxYear: '2022/2023' },
  // 2023/2024: Roleshare share loss relief £2,100 (EIS/SEIS attributable)
  'asset-angel-roleshare': { amount: 630, taxYear: '2023/2024' },
};

export default function AngelReliefTracker({ angelAssets }: Props) {
  const rows = useMemo<ReliefRow[]>(() => {
    return angelAssets.map((asset) => {
      const scheme = asset.taxScheme ?? null;
      const rate = scheme === 'SEIS' ? 0.5 : scheme === 'EIS' ? 0.3 : 0;
      const investment = asset.costBasis ?? 0;
      const expectedRelief = investment * rate;
      const claim = KNOWN_CLAIMS[asset.id];

      return {
        id: asset.id,
        name: asset.name,
        investment,
        scheme,
        rate,
        expectedRelief,
        certificateStatus: 'missing' as const,
        claimed: !!claim,
        claimedAmount: claim?.amount ?? 0,
        taxYear: claim?.taxYear ?? (scheme ? 'Unclaimed' : '—'),
        status: asset.status ?? 'active',
      };
    });
  }, [angelAssets]);

  const eligible = rows.filter((r) => r.scheme !== null);
  const totalEligibleInvestment = eligible.reduce((sum, r) => sum + r.investment, 0);
  const totalExpectedRelief = eligible.reduce((sum, r) => sum + r.expectedRelief, 0);
  const totalClaimed = rows.reduce((sum, r) => sum + r.claimedAmount, 0);
  const totalOutstanding = totalExpectedRelief - totalClaimed;
  const missingCerts = eligible.filter((r) => r.certificateStatus === 'missing');
  const unclaimedEligible = eligible.filter((r) => !r.claimed && r.status === 'active');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">EIS/SEIS Tax Relief Tracker</h2>
      <p className="text-sm text-slate-500 mb-4">
        Cross-referenced with 2022/2023 and 2023/2024 tax returns
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-500">Eligible Investment</div>
          <div className="text-lg font-bold text-slate-900">
            {formatCurrency(totalEligibleInvestment)}
          </div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="text-xs text-emerald-600">Expected Relief</div>
          <div className="text-lg font-bold text-emerald-700">
            {formatCurrency(totalExpectedRelief)}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600">Claimed</div>
          <div className="text-lg font-bold text-blue-700">{formatCurrency(totalClaimed)}</div>
        </div>
        <div className={`rounded-lg p-3 ${totalOutstanding > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
          <div className={`text-xs ${totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
            Outstanding
          </div>
          <div
            className={`text-lg font-bold ${totalOutstanding > 0 ? 'text-amber-700' : 'text-slate-900'}`}
          >
            {formatCurrency(totalOutstanding)}
          </div>
        </div>
      </div>

      {/* Relief table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 font-semibold text-slate-600">Company</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-600">Investment</th>
              <th className="text-center py-2 px-3 font-semibold text-slate-600">Scheme</th>
              <th className="text-center py-2 px-3 font-semibold text-slate-600">Rate</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-600">Expected Relief</th>
              <th className="text-center py-2 px-3 font-semibold text-slate-600">Certificate</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-600">Claimed</th>
              <th className="text-center py-2 px-3 font-semibold text-slate-600">Tax Year</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2 px-3 font-medium text-slate-900">{row.name}</td>
                <td className="py-2 px-3 text-right text-slate-600">
                  {row.investment > 0 ? formatCurrency(row.investment) : '—'}
                </td>
                <td className="py-2 px-3 text-center">
                  {row.scheme ? (
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.scheme === 'SEIS'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-violet-50 text-violet-700'
                      }`}
                    >
                      {row.scheme}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center text-xs text-slate-500">
                  {row.rate > 0 ? `${(row.rate * 100).toFixed(0)}%` : '—'}
                </td>
                <td className="py-2 px-3 text-right text-slate-600">
                  {row.expectedRelief > 0 ? formatCurrency(row.expectedRelief) : '—'}
                </td>
                <td className="py-2 px-3 text-center">
                  {row.scheme ? (
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.certificateStatus === 'received'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {row.certificateStatus === 'received' ? 'Received' : 'Missing'}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-right">
                  {row.claimed ? (
                    <span className="text-emerald-600 font-medium">
                      {formatCurrency(row.claimedAmount)}
                    </span>
                  ) : row.scheme ? (
                    <span className="text-amber-600 text-xs">Not claimed</span>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center text-xs text-slate-500">{row.taxYear}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warnings */}
      {(missingCerts.length > 0 || unclaimedEligible.length > 0) && (
        <div className="mt-4 space-y-2">
          {missingCerts.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="text-amber-500 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </span>
              <div className="text-xs text-amber-800">
                <span className="font-semibold">Missing EIS3/SEIS3 certificates: </span>
                {missingCerts.map((r) => r.name).join(', ')}. No compliance certificates were found
                in the tax folder. Request these from each company to claim tax relief.
              </div>
            </div>
          )}
          {unclaimedEligible.length > 0 && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="text-red-500 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <div className="text-xs text-red-800">
                <span className="font-semibold">Potentially unclaimed relief: </span>
                {unclaimedEligible.map((r) => r.name).join(', ')}. These investments have a tax
                scheme assigned but no relief has been claimed. Check with your accountant.
              </div>
            </div>
          )}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-blue-500 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div className="text-xs text-blue-800">
              <span className="font-semibold">Investments without tax scheme data: </span>
              {rows
                .filter((r) => !r.scheme && r.status === 'active')
                .map((r) => r.name)
                .join(', ') || 'None'}
              . Check whether these qualify for EIS/SEIS. Some (e.g. SAFE notes, foreign companies)
              may not qualify.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
