import { SentimentType } from '@/types/feedback';
import { HotspotLevel } from '@/domain/analytics';

/**
 * Colour constants for the few places that cannot use Tailwind classes
 * (Recharts SVG fills and Leaflet marker/HTML strings). Keep in sync with
 * the `@theme` tokens in `globals.css`.
 */
export const SENTIMENT_COLORS: Record<SentimentType, string> = {
  positive: '#22c55e',
  neutral: '#f59e0b',
  negative: '#ef4444',
};

export const HOTSPOT_COLORS: Record<HotspotLevel, string> = {
  low: '#22c55e',
  moderate: '#f59e0b',
  high: '#ef4444',
};

export const HOTSPOT_LABELS: Record<HotspotLevel, string> = {
  low: 'Few concerns',
  moderate: 'Mixed experience',
  high: 'Frequent concerns',
};

export const BRAND = {
  sage: '#46664f',
  sageDark: '#38523f',
  ink: '#1f2421',
  line: '#e5e9e6',
  surfaceMuted: '#fafaf8',
} as const;
