/**
 * Wire-format types for the Django/DRF backend.
 *
 * These mirror `docs/api-contract.md` exactly (snake_case, as DRF returns).
 * Only `httpClient` should import these — the rest of the app speaks the
 * domain types in `@/types/feedback`.
 */

export interface PaginatedDto<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ServiceDto {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  average_resolution_days: number | null;
  is_active: boolean;
}

export interface DepartmentDto {
  id: string;
  name: string;
  code: string;
  description: string;
  icon_name: string;
  contact_email: string;
  nodal_officer: string;
  is_active: boolean;
  services: ServiceDto[];
}

export interface LocationDto {
  id: string;
  state: string;
  district: string;
  local_area: string;
  latitude: number | null;
  longitude: number | null;
}

export interface AttachmentDto {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  download_url: string;
}

export interface FeedbackDto {
  id: string;
  reference_id: string;
  created_at: string;
  location: {
    state: string;
    district: string;
    local_area: string;
    latitude: number | null;
    longitude: number | null;
  };
  department: { id: string; name: string; code: string };
  service: { id: string; name: string; code: string };
  overall_rating: number;
  category_ratings: {
    helpfulness: number;
    communication: number;
    professionalism: number;
    response_time: number;
  };
  structured_answers: {
    timely_delivery: 'yes' | 'minor_delay' | 'significant_delay';
    process_clarity: 'very_clear' | 'acceptable' | 'confusing';
    digital_access_used: boolean;
  };
  summary_comment: string;
  detailed_description: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  sentiment_status: 'pending' | 'completed' | 'failed';
  sentiment_method: string;
  keywords: string[];
  is_anonymous: boolean;
  citizen_name: string | null;
  citizen_contact: string | null;
  attachments: AttachmentDto[];
}

export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponseDto {
  token: string;
  user: AdminUserDto;
}

export interface AnalyticsSummaryDto {
  total_feedback: number;
  average_rating: number;
  sentiment: { positive: number; neutral: number; negative: number };
  sentiment_percentages: { positive: number; neutral: number; negative: number };
  volume_over_time: Array<{
    date: string;
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  }>;
  department_comparison: Array<{
    department_id: string;
    code: string;
    name: string;
    average_rating: number;
    count: number;
  }>;
  top_concerns: Array<{ term: string; count: number; negative_count: number }>;
  top_commendations: Array<{ term: string; count: number }>;
  sentiment_method: string;
}

export interface GeographicAggregateDto {
  district: string;
  local_area: string | null;
  latitude: number | null;
  longitude: number | null;
  total: number;
  average_rating: number;
  sentiment: { positive: number; neutral: number; negative: number };
  hotspot_level: 'low' | 'moderate' | 'high';
}

export interface InsightsDto {
  recurring_concerns: Array<{
    term: string;
    count: number;
    negative_count: number;
    departments: string[];
    trend?: string;
  }>;
  department_comparison: AnalyticsSummaryDto['department_comparison'];
  trends: Array<{
    period: string;
    total: number;
    average_rating: number;
    delta_vs_previous: number | null;
  }>;
  method: string;
}

/**
 * `GET /analytics/public-summary/` — public, aggregate-only. Never contains
 * individual records, comments, or identity. Districts below `min_sample` report
 * `sentiment_percentages`/`concern_level` as `null` with `low_sample: true`.
 */
export interface PublicSummaryDto {
  total_feedback: number;
  average_rating: number;
  sentiment: { positive: number; neutral: number; negative: number };
  sentiment_percentages: { positive: number; neutral: number; negative: number };
  districts_represented: number;
  min_sample: number;
  sentiment_method: string;
  concern_level_note: string;
  departments: Array<{
    department_id: string;
    code: string;
    name: string;
    average_rating: number;
    count: number;
  }>;
  districts: Array<{
    district: string;
    count: number;
    average_rating: number;
    sentiment: { positive: number; neutral: number; negative: number };
    sentiment_percentages: { positive: number; neutral: number; negative: number } | null;
    concern_level: 'low' | 'moderate' | 'high' | null;
    low_sample: boolean;
    latitude: number | null;
    longitude: number | null;
  }>;
}
