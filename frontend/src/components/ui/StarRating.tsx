'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  showLabel?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor / Unsatisfactory',
  2: 'Needs Improvement',
  3: 'Acceptable / Neutral',
  4: 'Good / Satisfactory',
  5: 'Excellent / Exemplary',
};

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  readOnly = false,
  showLabel = false,
}: StarRatingProps) {
  const [hoverVal, setHoverVal] = useState<number | null>(null);

  const activeValue = hoverVal !== null ? hoverVal : value;

  const starSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex items-center gap-1" role={readOnly ? 'img' : 'radiogroup'} aria-label={`Rating: ${value} of ${max} stars`}>
        {Array.from({ length: max }, (_, i) => {
          const starNum = i + 1;
          const isFilled = starNum <= activeValue;

          return (
            <button
              key={starNum}
              type="button"
              disabled={readOnly}
              onClick={() => onChange && onChange(starNum)}
              onMouseEnter={() => !readOnly && setHoverVal(starNum)}
              onMouseLeave={() => !readOnly && setHoverVal(null)}
              className={`transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 rounded ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-115 active:scale-95'
              }`}
              aria-label={`${starNum} star${starNum > 1 ? 's' : ''}`}
            >
              <Star
                className={`${starSize} transition-colors ${
                  isFilled
                    ? 'fill-star text-star'
                    : 'fill-transparent text-stone-300 stroke-[1.5]'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && activeValue > 0 && (
        <span className="text-xs font-medium text-stone-600 ml-1">
          {RATING_LABELS[activeValue] || `${activeValue} / ${max}`}
        </span>
      )}
    </div>
  );
}
