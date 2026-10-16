'use client';

import React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-10', className)} role="status">
      <Loader2 className="w-6 h-6 text-sage-600 animate-spin" aria-hidden />
      {label ? <p className="text-xs text-muted">{label}</p> : null}
      <span className="sr-only">{label ?? 'Loading'}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center gap-2 py-12 px-6',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center">
        {icon ?? <Inbox className="w-5 h-5" />}
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="text-xs text-muted max-w-sm">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center gap-2 py-10 px-6',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-neg-surface text-neg-ink flex items-center justify-center">
        <AlertCircle className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-ink">Something went wrong</p>
      <p className="text-xs text-muted max-w-sm">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-sage-600 text-white hover:bg-sage-700 transition-colors"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
