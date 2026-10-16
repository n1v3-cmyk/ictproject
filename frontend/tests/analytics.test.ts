import { describe, expect, it } from 'vitest';
import {
  averageRating,
  countSentiment,
  departmentComparison,
  deriveInsights,
  geographicAggregates,
  sentimentPercentages,
  summarize,
  topConcerns,
  volumeOverTime,
} from '@/domain/analytics';
import { filterFeedback, DEFAULT_FILTERS } from '@/domain/filters';
import { makeDepartment, makeFeedback } from './fixtures';

const departments = [
  makeDepartment({ id: 'dept-mvd', code: 'MVD', name: 'Motor Vehicles Department (MVD)' }),
  makeDepartment({ id: 'dept-hfw', code: 'HFW', name: 'Health & Family Welfare' }),
];

const dataset = [
  makeFeedback({
    id: '1',
    departmentId: 'dept-mvd',
    departmentName: 'Motor Vehicles Department (MVD)',
    sentiment: 'negative',
    overallRating: 1,
    keywords: ['delay', 'rude'],
    createdAt: '2026-10-02T10:00:00.000Z',
    location: { state: 'Kerala', district: 'Ernakulam', localArea: 'Kanayannur (Kochi)', coordinates: [9.97, 76.28] },
  }),
  makeFeedback({
    id: '2',
    departmentId: 'dept-mvd',
    departmentName: 'Motor Vehicles Department (MVD)',
    sentiment: 'negative',
    overallRating: 2,
    keywords: ['delay'],
    createdAt: '2026-10-03T10:00:00.000Z',
    location: { state: 'Kerala', district: 'Ernakulam', localArea: 'Kanayannur (Kochi)', coordinates: [9.97, 76.28] },
  }),
  makeFeedback({
    id: '3',
    departmentId: 'dept-hfw',
    departmentName: 'Health & Family Welfare',
    sentiment: 'positive',
    overallRating: 5,
    keywords: ['helpful', 'fast'],
    createdAt: '2026-10-04T10:00:00.000Z',
    location: { state: 'Kerala', district: 'Wayanad', localArea: 'Mananthavady', coordinates: [11.68, 76.13] },
  }),
  makeFeedback({
    id: '4',
    departmentId: 'dept-hfw',
    departmentName: 'Health & Family Welfare',
    sentiment: 'neutral',
    overallRating: 3,
    keywords: [],
    createdAt: '2026-09-04T10:00:00.000Z',
    location: { state: 'Kerala', district: 'Wayanad', localArea: 'Mananthavady' }, // no coordinates
  }),
];

describe('aggregation invariants', () => {
  it('sentiment counts sum to the total (FR-3.6)', () => {
    const counts = countSentiment(dataset);
    expect(counts.positive + counts.neutral + counts.negative).toBe(dataset.length);
  });

  it('percentages are rounded and derived from the same counts', () => {
    const pct = sentimentPercentages(dataset);
    const counts = countSentiment(dataset);
    expect(pct.negative).toBe(Math.round((counts.negative / dataset.length) * 100));
    expect(pct.positive).toBe(Math.round((counts.positive / dataset.length) * 100));
  });

  it('average rating is computed over all records', () => {
    // (1 + 2 + 5 + 3) / 4 = 2.75
    expect(averageRating(dataset)).toBe(2.75);
  });

  it('dashboard summary total equals the dataset length', () => {
    const summary = summarize(dataset, departments);
    expect(summary.total).toBe(dataset.length);
    expect(summary.sentiment.positive + summary.sentiment.neutral + summary.sentiment.negative).toBe(
      summary.total
    );
  });

  it('filtered summary total equals the filtered record count', () => {
    const filters = { ...DEFAULT_FILTERS, district: 'Wayanad' };
    const filtered = filterFeedback(dataset, filters);
    const summary = summarize(filtered, departments);
    expect(summary.total).toBe(filtered.length);
    expect(summary.total).toBe(2);
  });
});

describe('departmentComparison', () => {
  it('only includes departments that have feedback and reports counts', () => {
    const comparison = departmentComparison(dataset, departments);
    const mvd = comparison.find((d) => d.code === 'MVD');
    expect(mvd?.count).toBe(2);
    expect(mvd?.averageRating).toBe(1.5);
  });
});

describe('volumeOverTime', () => {
  it('groups by day and counts each sentiment', () => {
    const points = volumeOverTime(dataset);
    expect(points[0].date).toBe('2026-09-04');
    const oct2 = points.find((p) => p.date === '2026-10-02');
    expect(oct2?.negative).toBe(1);
    expect(oct2?.total).toBe(1);
  });
});

describe('geo aggregation', () => {
  it('aggregates by district and never fabricates coordinates', () => {
    const geo = geographicAggregates(dataset, departments);
    const wayanad = geo.find((g) => g.district === 'Wayanad');
    // Wayanad has one record with coordinates and one without, so coordinates stay present.
    expect(wayanad?.coordinates).toEqual([11.68, 76.13]);
    expect(wayanad?.total).toBe(2);
  });

  it('reports null coordinates when no record in the group has them', () => {
    const noCoords = [makeFeedback({ location: { state: 'Kerala', district: 'Idukki', localArea: 'Devikulam' } })];
    const geo = geographicAggregates(noCoords, departments);
    expect(geo[0].coordinates).toBeNull();
  });

  it('flags a hotspot for low ratings + high negative share', () => {
    const geo = geographicAggregates(dataset, departments);
    const ernakulam = geo.find((g) => g.district === 'Ernakulam');
    expect(ernakulam?.hotspotLevel).toBe('high');
  });
});

describe('insights', () => {
  it('ranks recurring concerns by negative frequency', () => {
    const concerns = topConcerns(dataset);
    expect(concerns[0].term).toBe('delay');
    expect(concerns[0].negativeCount).toBe(2);
    expect(concerns[0].departments).toContain('Motor Vehicles Department (MVD)');
  });

  it('produces month trends with deltas', () => {
    const insights = deriveInsights(dataset, departments);
    expect(insights.trends.map((t) => t.period)).toEqual(['2026-09', '2026-10']);
    expect(insights.trends[0].deltaVsPrevious).toBeNull();
    expect(insights.trends[1].deltaVsPrevious).not.toBeNull();
  });

  it('states its method honestly', () => {
    const insights = deriveInsights(dataset, departments);
    expect(insights.method.toLowerCase()).toContain('heuristic');
  });
});
