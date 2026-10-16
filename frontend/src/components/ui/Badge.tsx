import React from 'react';
import { SentimentType } from '@/types/feedback';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'positive' | 'neutral' | 'negative' | 'sage' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs font-medium' : 'px-3 py-1 text-sm font-medium';

  let variantClasses = 'bg-stone-100 text-stone-700 border border-stone-200';

  if (variant === 'positive') {
    variantClasses = 'bg-[#EBF7EE] text-[#1E6B35] border border-[#C6E8CD]';
  } else if (variant === 'neutral') {
    variantClasses = 'bg-[#FEF8EB] text-[#B45309] border border-[#FDE68A]';
  } else if (variant === 'negative') {
    variantClasses = 'bg-[#FDF2F2] text-[#B91C1C] border border-[#FECACA]';
  } else if (variant === 'sage') {
    variantClasses = 'bg-[#EDF3EF] text-[#36513D] border border-[#CADACF]';
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
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
        Positive {score !== undefined ? `(${score}%)` : ''}
      </Badge>
    );
  }
  if (sentiment === 'negative') {
    return (
      <Badge variant="negative">
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
        Negative {score !== undefined ? `(${score}%)` : ''}
      </Badge>
    );
  }
  return (
    <Badge variant="neutral">
      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
      Neutral {score !== undefined ? `(${score}%)` : ''}
    </Badge>
  );
}
