import { Department, FeedbackRecord } from '@/types/feedback';
import { NEGATIVE_KEYWORDS, POSITIVE_KEYWORDS } from '@/domain/sentiment';

export interface SentimentCounts {
  positive: number;
  neutral: number;
  negative: number;
}

export interface VolumePoint {
  date: string; // YYYY-MM-DD
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export interface DepartmentComparison {
  departmentId: string;
  code: string;
  name: string;
  averageRating: number;
  count: number;
}

export interface TermCount {
  term: string;
  count: number;
}

export interface ConcernTerm {
  term: string;
  count: number;
  negativeCount: number;
  departments: string[];
}

export interface AnalyticsSummary {
  total: number;
  averageRating: number;
  sentiment: SentimentCounts;
  sentimentPercentages: SentimentCounts;
  volumeOverTime: VolumePoint[];
  departmentComparison: DepartmentComparison[];
  topConcerns: ConcernTerm[];
  topCommendations: TermCount[];
  method: string;
}

export type HotspotLevel = 'low' | 'moderate' | 'high';

export interface GeoAggregate {
  district: string;
  localArea: string | null;
  coordinates: [number, number] | null;
  total: number;
  averageRating: number;
  sentiment: SentimentCounts;
  hotspotLevel: HotspotLevel;
}

export interface InsightTrend {
  period: string; // YYYY-MM
  total: number;
  averageRating: number;
  deltaVsPrevious: number | null;
}

export interface Insights {
  recurringConcerns: ConcernTerm[];
  departmentComparison: DepartmentComparison[];
  trends: InsightTrend[];
  method: string;
}

/**
 * Public, aggregate-only analytics — the safe subset that can be shown without a
 * login. Mirrors the backend `GET /analytics/public-summary/` response exactly.
 */
export interface PublicDistrictSummary {
  district: string;
  count: number;
  averageRating: number;
  sentiment: SentimentCounts;
  /** `null` when the district is below `minSample` (small-sample protection). */
  sentimentPercentages: SentimentCounts | null;
  /** `null` when the district is below `minSample` (small-sample protection). */
  concernLevel: HotspotLevel | null;
  lowSample: boolean;
  coordinates: [number, number] | null;
}

export interface PublicSummary {
  total: number;
  averageRating: number;
  sentiment: SentimentCounts;
  sentimentPercentages: SentimentCounts;
  districtsRepresented: number;
  minSample: number;
  method: string;
  concernLevelNote: string;
  departments: DepartmentComparison[];
  districts: PublicDistrictSummary[];
}

/**
 * Documented recurring-concern method:
 * frequency of curated concern terms within negatively-classified feedback,
 * associated with the departments where they appear. This is a transparent
 * heuristic — NOT a machine-learning model.
 */
export const CONCERN_METHOD =
  'Frequency of curated concern terms within negative feedback, grouped by department over the active date window (heuristic, not a trained model).';

const round1 = (n: number): number => Math.round(n * 10) / 10;
const round2 = (n: number): number => Math.round(n * 100) / 100;

export function countSentiment(feedbacks: FeedbackRecord[]): SentimentCounts {
  const counts: SentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  for (const f of feedbacks) counts[f.sentiment] += 1;
  return counts;
}

export function averageRating(feedbacks: FeedbackRecord[]): number {
  if (feedbacks.length === 0) return 0;
  const sum = feedbacks.reduce((acc, f) => acc + f.overallRating, 0);
  return round2(sum / feedbacks.length);
}

function toPercentage(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function sentimentPercentages(feedbacks: FeedbackRecord[]): SentimentCounts {
  const counts = countSentiment(feedbacks);
  const total = feedbacks.length;
  return {
    positive: toPercentage(counts.positive, total),
    neutral: toPercentage(counts.neutral, total),
    negative: toPercentage(counts.negative, total),
  };
}

export function volumeOverTime(feedbacks: FeedbackRecord[]): VolumePoint[] {
  const byDate: Record<string, VolumePoint> = {};
  for (const f of feedbacks) {
    const date = new Date(f.createdAt).toISOString().slice(0, 10);
    if (!byDate[date]) byDate[date] = { date, positive: 0, neutral: 0, negative: 0, total: 0 };
    byDate[date][f.sentiment] += 1;
    byDate[date].total += 1;
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

export function departmentComparison(
  feedbacks: FeedbackRecord[],
  departments: Department[]
): DepartmentComparison[] {
  return departments
    .map((dept) => {
      const items = feedbacks.filter((f) => f.departmentId === dept.id);
      return {
        departmentId: dept.id,
        code: dept.code,
        name: dept.name,
        averageRating: averageRating(items),
        count: items.length,
      };
    })
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);
}

const NEGATIVE_SET = new Set(NEGATIVE_KEYWORDS);
const POSITIVE_SET = new Set(POSITIVE_KEYWORDS);

function termCounts(
  feedbacks: FeedbackRecord[],
  allowed: Set<string>,
  limit: number
): TermCount[] {
  const counts: Record<string, number> = {};
  for (const f of feedbacks) {
    for (const kw of f.keywords) {
      if (allowed.has(kw)) counts[kw] = (counts[kw] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, limit);
}

export function topConcerns(feedbacks: FeedbackRecord[], limit = 6): ConcernTerm[] {
  const negative = feedbacks.filter((f) => f.sentiment === 'negative');
  const byTerm: Record<string, ConcernTerm> = {};

  for (const f of negative) {
    for (const kw of f.keywords) {
      if (!NEGATIVE_SET.has(kw)) continue;
      if (!byTerm[kw]) byTerm[kw] = { term: kw, count: 0, negativeCount: 0, departments: [] };
      byTerm[kw].count += 1;
      byTerm[kw].negativeCount += 1;
      if (!byTerm[kw].departments.includes(f.departmentName)) {
        byTerm[kw].departments.push(f.departmentName);
      }
    }
  }

  return Object.values(byTerm)
    .sort((a, b) => b.negativeCount - a.negativeCount || a.term.localeCompare(b.term))
    .slice(0, limit);
}

export function topCommendations(feedbacks: FeedbackRecord[], limit = 6): TermCount[] {
  const positive = feedbacks.filter((f) => f.sentiment === 'positive');
  return termCounts(positive, POSITIVE_SET, limit);
}

export function summarize(feedbacks: FeedbackRecord[], departments: Department[]): AnalyticsSummary {
  return {
    total: feedbacks.length,
    averageRating: averageRating(feedbacks),
    sentiment: countSentiment(feedbacks),
    sentimentPercentages: sentimentPercentages(feedbacks),
    volumeOverTime: volumeOverTime(feedbacks),
    departmentComparison: departmentComparison(feedbacks, departments),
    topConcerns: topConcerns(feedbacks),
    topCommendations: topCommendations(feedbacks),
    method: 'heuristic-v1',
  };
}

function hotspotLevel(avg: number, negativeRatio: number): HotspotLevel {
  if (avg < 2.8 || negativeRatio >= 0.4) return 'high';
  if (avg < 3.8 || negativeRatio > 0) return 'moderate';
  return 'low';
}

/**
 * Aggregate feedback geographically. Records whose location has no coordinates are
 * returned with `coordinates: null` — never fabricated — so the UI can list them
 * separately instead of plotting them.
 */
export function geographicAggregates(
  feedbacks: FeedbackRecord[],
  departments: Department[]
): GeoAggregate[] {
  void departments;
  const byDistrict: Record<string, GeoAggregate> = {};

  for (const f of feedbacks) {
    const district = f.location.district;
    if (!byDistrict[district]) {
      byDistrict[district] = {
        district,
        localArea: null,
        coordinates: f.location.coordinates ?? null,
        total: 0,
        averageRating: 0,
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        hotspotLevel: 'low',
      };
    }
    const agg = byDistrict[district];
    agg.total += 1;
    agg.sentiment[f.sentiment] += 1;
    // Keep the first known coordinate set; never invent one.
    if (!agg.coordinates && f.location.coordinates) {
      agg.coordinates = f.location.coordinates;
    }
  }

  return Object.values(byDistrict)
    .map((agg) => {
      const ratingSum = feedbacks
        .filter((f) => f.location.district === agg.district)
        .reduce((acc, f) => acc + f.overallRating, 0);
      const avg = agg.total > 0 ? round1(ratingSum / agg.total) : 0;
      return {
        ...agg,
        averageRating: avg,
        hotspotLevel: hotspotLevel(avg, agg.sentiment.negative / agg.total),
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function deriveInsights(
  feedbacks: FeedbackRecord[],
  departments: Department[]
): Insights {
  const byMonth: Record<string, FeedbackRecord[]> = {};
  for (const f of feedbacks) {
    const period = new Date(f.createdAt).toISOString().slice(0, 7);
    (byMonth[period] ??= []).push(f);
  }

  const periods = Object.keys(byMonth).sort();
  const trends: InsightTrend[] = periods.map((period, index) => {
    const items = byMonth[period];
    const avg = averageRating(items);
    const previous = index > 0 ? averageRating(byMonth[periods[index - 1]]) : null;
    return {
      period,
      total: items.length,
      averageRating: avg,
      deltaVsPrevious: previous === null ? null : round2(avg - previous),
    };
  });

  return {
    recurringConcerns: topConcerns(feedbacks, 10),
    departmentComparison: departmentComparison(feedbacks, departments),
    trends,
    method: CONCERN_METHOD,
  };
}

/** Districts below this many submissions are shown without percentages/level. */
export const PUBLIC_MIN_SAMPLE = 5;

/** Public framing for the concentration indicator — a signal, not a verdict. */
export const CONCERN_LEVEL_NOTE =
  'Concern level is a concentration indicator derived from ratings and sentiment within the selected window. It is a heuristic signal, not proof that a district receives poor service.';

/**
 * Public, aggregate-only summary — the safe subset shown without a login. Mirrors
 * the backend `GET /analytics/public-summary/` exactly: never individual records,
 * comments, or identity; never finer than district granularity; small districts
 * are masked (percentages/level `null`, `lowSample: true`).
 */
export function publicSummary(
  feedbacks: FeedbackRecord[],
  departments: Department[],
  minSample = PUBLIC_MIN_SAMPLE
): PublicSummary {
  const districts: PublicDistrictSummary[] = geographicAggregates(feedbacks, departments).map(
    (agg) => {
      const lowSample = agg.total < minSample;
      return {
        district: agg.district,
        count: agg.total,
        averageRating: agg.averageRating,
        sentiment: agg.sentiment,
        sentimentPercentages: lowSample
          ? null
          : {
              positive: toPercentage(agg.sentiment.positive, agg.total),
              neutral: toPercentage(agg.sentiment.neutral, agg.total),
              negative: toPercentage(agg.sentiment.negative, agg.total),
            },
        concernLevel: lowSample ? null : agg.hotspotLevel,
        lowSample,
        coordinates: agg.coordinates,
      };
    }
  );

  return {
    total: feedbacks.length,
    averageRating: averageRating(feedbacks),
    sentiment: countSentiment(feedbacks),
    sentimentPercentages: sentimentPercentages(feedbacks),
    districtsRepresented: districts.length,
    minSample,
    method: 'heuristic-v1',
    concernLevelNote: CONCERN_LEVEL_NOTE,
    departments: departmentComparison(feedbacks, departments),
    districts,
  };
}
