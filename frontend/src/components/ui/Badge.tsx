import React from 'react';
import { SentimentType } from '@/types/feedback';

export type BadgeVariant = 'default' | 'positive' | 'neutral' | 'negative' | 'sage' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs font-medium' : 'px-3 py-1 text-sm font-medium';

  let variantClasses = 'bg-stone-100 text-stone-700 border border-stone-200';

  if (variant === 'positive') {
    variantClasses = 'bg-pos-surface text-pos-ink border border-pos-border';
  } else if (variant === 'neutral') {
    variantClasses = 'bg-warn-surface text-warn-ink border border-warn-border';
  } else if (variant === 'negative') {
    variantClasses = 'bg-neg-surface text-neg-ink border border-neg-border';
  } else if (variant === 'sage') {
    variantClasses = 'bg-sage-400 text-sage-ink border border-sage-200';
  } else if (variant === 'outline') {
    variantClasses = 'bg-transparent text-stone-600 border border-stone-300';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}

export function SentimentBadge({ sentiment, score }: { sentiment: SentimentType; score?: number }) {
  if (sentiment === 'positive') {
    return (
      <Badge variant="positive">
        <span className="w-1.5 h-1.5 rounded-full bg-pos" />
        Positive {score !== undefined ? `(${score}%)` : ''}
      </Badge>
    );
  }
  if (sentiment === 'negative') {
    return (
      <Badge variant="negative">
        <span className="w-1.5 h-1.5 rounded-full bg-neg" />
        Negative {score !== undefined ? `(${score}%)` : ''}
      </Badge>
    );
  }
  return (
    <Badge variant="neutral">
      <span className="w-1.5 h-1.5 rounded-full bg-warn" />
      Neutral {score !== undefined ? `(${score}%)` : ''}
    </Badge>
  );
}
