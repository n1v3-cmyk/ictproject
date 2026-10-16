import { FeedbackRecord, FilterState } from '@/types/feedback';

export const DEFAULT_FILTERS: FilterState = {
  district: 'all',
  localArea: 'all',
  departmentId: 'all',
  serviceId: 'all',
  sentiment: 'all',
  rating: 'all',
  dateRange: 'all',
  searchQuery: '',
};

const DATE_WINDOW_DAYS: Record<string, number> = {
  '7days': 7,
  '30days': 30,
  '90days': 90,
};

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.district !== 'all' ||
    filters.localArea !== 'all' ||
    filters.departmentId !== 'all' ||
    filters.serviceId !== 'all' ||
    filters.sentiment !== 'all' ||
    filters.rating !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.searchQuery.trim().length > 0
  );
}

interface SearchableFields {
  referenceId: string;
  summaryComment: string;
  detailedDescription: string;
  serviceName: string;
  departmentName: string;
  district: string;
  localArea: string;
  citizenName?: string;
}

function matchesSearch(item: FeedbackRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fields: SearchableFields = {
    referenceId: item.referenceId,
    summaryComment: item.summaryComment,
    detailedDescription: item.detailedDescription,
    serviceName: item.serviceName,
    departmentName: item.departmentName,
    district: item.location.district,
    localArea: item.location.localArea,
    citizenName: item.citizenName,
  };

  return Object.values(fields).some((value) =>
    typeof value === 'string' ? value.toLowerCase().includes(q) : false
  );
}

/**
 * Pure, framework-free filter predicate shared by the Explorer, Analytics,
 * and Geographic views so counts always agree.
 */
export function filterFeedback(
  feedbacks: FeedbackRecord[],
  filters: FilterState,
  now?: number
): FeedbackRecord[] {
  const windowDays = DATE_WINDOW_DAYS[filters.dateRange];
  // Only resolve the current time when a relative window is actually in use, so
  // rendering with the default filters never reads an unstable value during prerender.
  const referenceNow = windowDays !== undefined ? now ?? Date.now() : 0;

  return feedbacks.filter((item) => {
    if (filters.district !== 'all' && item.location.district !== filters.district) return false;
    if (filters.localArea !== 'all' && item.location.localArea !== filters.localArea) return false;
    if (filters.departmentId !== 'all' && item.departmentId !== filters.departmentId) return false;
    if (filters.serviceId !== 'all' && item.serviceId !== filters.serviceId) return false;
    if (filters.sentiment !== 'all' && item.sentiment !== filters.sentiment) return false;
    if (filters.rating !== 'all' && item.overallRating !== Number(filters.rating)) return false;

    if (windowDays !== undefined) {
      const ageDays =
        (referenceNow - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > windowDays) return false;
    }

    if (!matchesSearch(item, filters.searchQuery)) return false;

    return true;
  });
}
