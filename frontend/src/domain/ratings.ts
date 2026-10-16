import { SentimentType } from '@/types/feedback';

export const MAX_RATING = 5;

export const RATING_LABELS: Record<number, string> = {
  1: 'Poor / Unsatisfactory',
  2: 'Needs Improvement',
  3: 'Acceptable / Neutral',
  4: 'Good / Satisfactory',
  5: 'Excellent / Exemplary',
};

export const SENTIMENT_LABELS: Record<SentimentType, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
};

export function ratingLabel(value: number): string {
  return RATING_LABELS[value] ?? `${value} / ${MAX_RATING}`;
}

export function clampRating(value: number): number {
  if (Number.isNaN(value)) return 1;
  return Math.min(MAX_RATING, Math.max(1, Math.round(value)));
}
