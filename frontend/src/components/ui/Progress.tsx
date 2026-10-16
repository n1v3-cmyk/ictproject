import React from 'react';
import { cn } from '@/lib/cn';

/**
 * A thin, accessible progress bar. `value` is a percentage (0–100).
 */
export function Progress({
  value,
  label,
  className,
  barClassName,
}: {
  value: number;
  label?: string;
  className?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn('w-full bg-sage-100 h-2 rounded-full overflow-hidden', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('bg-sage-600 h-full transition-all duration-300', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
