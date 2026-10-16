import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, filterFeedback, hasActiveFilters } from '@/domain/filters';
import { makeFeedback } from './fixtures';

const NOW = new Date('2026-10-15T00:00:00.000Z').getTime();

const dataset = [
  makeFeedback({
    id: 'a',
    referenceId: 'CC-KL-2026-1001',
    location: { state: 'Kerala', district: 'Ernakulam', localArea: 'Kanayannur (Kochi)' },
    departmentId: 'dept-mvd',
    serviceId: 'srv-1',
    sentiment: 'negative',
    overallRating: 1,
    summaryComment: 'Long delay at the counter',
    createdAt: '2026-10-14T10:00:00.000Z',
  }),
  makeFeedback({
    id: 'b',
    location: { state: 'Kerala', district: 'Wayanad', localArea: 'Mananthavady' },
    departmentId: 'dept-hfw',
    serviceId: 'srv-2',
    sentiment: 'positive',
    overallRating: 5,
    summaryComment: 'Very efficient and helpful staff',
    createdAt: '2026-10-12T10:00:00.000Z',
  }),
  makeFeedback({
    id: 'c',
    location: { state: 'Kerala', district: 'Ernakulam', localArea: 'Kanayannur (Kochi)' },
    departmentId: 'dept-hfw',
    serviceId: 'srv-2',
    sentiment: 'neutral',
    overallRating: 3,
    summaryComment: 'Average',
    createdAt: '2026-08-01T10:00:00.000Z',
  }),
];

describe('filterFeedback', () => {
  it('returns everything with default filters', () => {
    expect(filterFeedback(dataset, DEFAULT_FILTERS, NOW)).toHaveLength(3);
  });

  it('filters by district', () => {
    const result = filterFeedback(dataset, { ...DEFAULT_FILTERS, district: 'Wayanad' }, NOW);
    expect(result.map((f) => f.id)).toEqual(['b']);
  });

  it('filters by department', () => {
    const result = filterFeedback(dataset, { ...DEFAULT_FILTERS, departmentId: 'dept-hfw' }, NOW);
    expect(result.map((f) => f.id).sort()).toEqual(['b', 'c']);
  });

  it('filters by sentiment', () => {
    const result = filterFeedback(dataset, { ...DEFAULT_FILTERS, sentiment: 'negative' }, NOW);
    expect(result.map((f) => f.id)).toEqual(['a']);
  });

  it('filters by rating', () => {
    const result = filterFeedback(dataset, { ...DEFAULT_FILTERS, rating: '5' }, NOW);
    expect(result.map((f) => f.id)).toEqual(['b']);
  });

  it('applies the 30-day date window relative to now', () => {
    const result = filterFeedback(dataset, { ...DEFAULT_FILTERS, dateRange: '30days' }, NOW);
    // 'c' is from August, older than 30 days from 15 Oct.
    expect(result.map((f) => f.id).sort()).toEqual(['a', 'b']);
  });

  it('searches reference ids and comments case-insensitively', () => {
    expect(filterFeedback(dataset, { ...DEFAULT_FILTERS, searchQuery: '1001' }, NOW)).toHaveLength(1);
    expect(filterFeedback(dataset, { ...DEFAULT_FILTERS, searchQuery: 'DELAY' }, NOW)).toHaveLength(1);
    expect(filterFeedback(dataset, { ...DEFAULT_FILTERS, searchQuery: 'helpful' }, NOW)).toHaveLength(1);
  });

  it('combines filters conjunctively', () => {
    const result = filterFeedback(
      dataset,
      { ...DEFAULT_FILTERS, district: 'Ernakulam', departmentId: 'dept-hfw' },
      NOW
    );
    expect(result.map((f) => f.id)).toEqual(['c']);
  });
});

describe('hasActiveFilters', () => {
  it('is false for defaults', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
  });

  it('is true when any filter is set', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, district: 'Wayanad' })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, searchQuery: 'x' })).toBe(true);
  });
});
