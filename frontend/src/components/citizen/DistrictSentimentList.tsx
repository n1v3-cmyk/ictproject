'use client';

import React from 'react';
import { PublicDistrictSummary } from '@/domain/analytics';

/**
 * Public district-wise sentiment breakdown. Renders aggregates only — never an
 * individual record or comment. Districts below the small-sample threshold are
 * shown without percentages and labelled "Insufficient data".
 */

const CONCERN_LEVEL_STYLE: Record<string, { label: string; className: string }> = {
  low: { label: 'Stable', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  moderate: { label: 'Mixed', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { label: 'Concentration flag', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

function Bar({
  percentages,
}: {
  percentages: { positive: number; neutral: number; negative: number };
}) {
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
      <div className="bg-emerald-500" style={{ width: `${percentages.positive}%` }} />
      <div className="bg-amber-400" style={{ width: `${percentages.neutral}%` }} />
      <div className="bg-rose-500" style={{ width: `${percentages.negative}%` }} />
    </div>
  );
}

export function SentimentLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-4 text-xs text-stone-500 ${className}`}>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Positive
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Neutral
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Negative
      </span>
    </div>
  );
}

export function DistrictSentimentList({
  districts,
  limit,
  className = '',
}: {
  districts: PublicDistrictSummary[];
  /** Optional cap (the full list is used on the insights page). */
  limit?: number;
  className?: string;
}) {
  const rows = typeof limit === 'number' ? districts.slice(0, limit) : districts;

  if (rows.length === 0) {
    return (
      <p className={`text-sm text-stone-500 ${className}`}>
        No public sentiment data is available yet.
      </p>
    );
  }

  return (
    <ul className={`divide-y divide-line-soft ${className}`}>
      {rows.map((district) => {
        const level = district.concernLevel ? CONCERN_LEVEL_STYLE[district.concernLevel] : null;
        return (
          <li key={district.district} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium text-stone-900 text-sm">{district.district}</p>
              <span className="shrink-0 text-xs text-stone-500">
                {district.count} {district.count === 1 ? 'response' : 'responses'} ·{' '}
                <span className="font-medium text-stone-800">
                  ★ {district.averageRating.toFixed(1)}
                </span>
              </span>
            </div>

            <div className="mt-2.5">
              {district.sentimentPercentages ? (
                <Bar percentages={district.sentimentPercentages} />
              ) : (
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div className="bg-stone-200" style={{ width: '100%' }} />
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              {district.sentimentPercentages ? (
                <span className="text-xs text-stone-500">
                  {district.sentimentPercentages.positive}% positive ·{' '}
                  {district.sentimentPercentages.neutral}% neutral ·{' '}
                  {district.sentimentPercentages.negative}% negative
                </span>
              ) : (
                <span className="text-xs text-stone-400">
                  Insufficient data to show a percentage breakdown (small sample)
                </span>
              )}

              {level ? (
                <span
                  className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${level.className}`}
                >
                  {level.label}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full border border-stone-200 bg-stone-50 text-[11px] font-medium text-stone-500">
                  Insufficient data
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
