/**
 * Pure mapping helpers between the Django/DRF wire DTOs (`@/api/contract`) and the
 * domain types the UI speaks (`@/types/feedback`).
 *
 * Keeping these pure and side-effect free means the risky part of the backend swap —
 * field renaming and shape changes — is unit-testable without a running server.
 */

import {
  Department,
  FeedbackRecord,
  FilterState,
  GovernmentService,
  LocationInfo,
  NewFeedbackInput,
  SentimentType,
} from '@/types/feedback';
import {
  AnalyticsSummary,
  GeoAggregate,
  HotspotLevel,
  Insights,
  PublicSummary,
} from '@/domain/analytics';
import {
  AnalyticsSummaryDto,
  DepartmentDto,
  FeedbackDto,
  GeographicAggregateDto,
  InsightsDto,
  LocationDto,
  PublicSummaryDto,
  ServiceDto,
} from '@/api/contract';

/** Latitude/longitude pair, or `undefined` when either value is missing. */
export function toCoordinates(
  lat: number | null,
  lng: number | null
): [number, number] | undefined {
  if (lat === null || lng === null) return undefined;
  return [lat, lng];
}

export function locationFromDto(dto: LocationDto): LocationInfo {
  return {
    state: dto.state,
    district: dto.district,
    localArea: dto.local_area,
    coordinates: toCoordinates(dto.latitude, dto.longitude),
  };
}

export function serviceFromDto(dto: ServiceDto): GovernmentService {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    description: dto.description,
    category: dto.category,
    averageResolutionDays: dto.average_resolution_days ?? undefined,
    isActive: dto.is_active,
  };
}

export function departmentFromDto(dto: DepartmentDto): Department {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    iconName: dto.icon_name,
    description: dto.description,
    contactEmail: dto.contact_email,
    nodalOfficer: dto.nodal_officer,
    isActive: dto.is_active,
    services: dto.services.map(serviceFromDto),
  };
}

export function feedbackFromDto(dto: FeedbackDto): FeedbackRecord {
  const anonymous = dto.is_anonymous;
  return {
    id: dto.id,
    referenceId: dto.reference_id,
    createdAt: dto.created_at,
    location: {
      state: dto.location.state,
      district: dto.location.district,
      localArea: dto.location.local_area,
      coordinates: toCoordinates(dto.location.latitude, dto.location.longitude),
    },
    departmentId: dto.department.id,
    departmentName: dto.department.name,
    serviceId: dto.service.id,
    serviceName: dto.service.name,
    overallRating: dto.overall_rating,
    categoryRatings: {
      helpfulness: dto.category_ratings.helpfulness,
      communication: dto.category_ratings.communication,
      professionalism: dto.category_ratings.professionalism,
      responseTime: dto.category_ratings.response_time,
    },
    structuredAnswers: {
      timelyDelivery: dto.structured_answers.timely_delivery,
      processClarity: dto.structured_answers.process_clarity,
      digitalAccessUsed: dto.structured_answers.digital_access_used,
    },
    summaryComment: dto.summary_comment,
    detailedDescription: dto.detailed_description,
    sentiment: dto.sentiment as SentimentType,
    sentimentScore: dto.sentiment_score,
    keywords: dto.keywords,
    isAnonymous: anonymous,
    // Defence in depth: never surface identity for an anonymous record, even if the
    // server were to include it by mistake.
    citizenName: anonymous ? undefined : dto.citizen_name ?? undefined,
    citizenContact: anonymous ? undefined : dto.citizen_contact ?? undefined,
    attachments: dto.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.file_name,
      type: attachment.mime_type,
      size: attachment.size_bytes,
    })),
  };
}

/** Serialise the shared filter state into DRF query parameters. */
export function filtersToQuery(
  filters: FilterState,
  extra: Record<string, string | number> = {}
): string {
  const params = new URLSearchParams();
  if (filters.district !== 'all') params.set('district', filters.district);
  if (filters.localArea !== 'all') params.set('local_area', filters.localArea);
  if (filters.departmentId !== 'all') params.set('department', filters.departmentId);
  if (filters.serviceId !== 'all') params.set('service', filters.serviceId);
  if (filters.sentiment !== 'all') params.set('sentiment', filters.sentiment);
  if (filters.rating !== 'all') params.set('rating', filters.rating);
  if (filters.dateRange !== 'all') params.set('date_range', filters.dateRange);
  if (filters.searchQuery.trim()) params.set('search', filters.searchQuery.trim());
  for (const [key, value] of Object.entries(extra)) params.set(key, String(value));
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Build the multipart payload DRF expects for a new feedback submission. */
export function buildFeedbackFormData(input: NewFeedbackInput): FormData {
  const form = new FormData();
  form.set('department', input.departmentId);
  form.set('service', input.serviceId);
  form.set('district', input.location.district);
  form.set('local_area', input.location.localArea);
  form.set('overall_rating', String(input.overallRating));
  form.set('helpfulness', String(input.categoryRatings.helpfulness));
  form.set('communication', String(input.categoryRatings.communication));
  form.set('professionalism', String(input.categoryRatings.professionalism));
  form.set('response_time', String(input.categoryRatings.responseTime));
  form.set('timely_delivery', input.structuredAnswers.timelyDelivery);
  form.set('process_clarity', input.structuredAnswers.processClarity);
  form.set('digital_access_used', String(input.structuredAnswers.digitalAccessUsed));
  form.set('summary_comment', input.summaryComment);
  form.set('detailed_description', input.detailedDescription);
  form.set('is_anonymous', String(input.isAnonymous));
  if (input.citizenName) form.set('citizen_name', input.citizenName);
  if (input.citizenContact) form.set('citizen_contact', input.citizenContact);
  for (const attachment of input.attachments) {
    if (attachment.file) form.append('attachments', attachment.file);
  }
  return form;
}

export function analyticsSummaryFromDto(dto: AnalyticsSummaryDto): AnalyticsSummary {
  return {
    total: dto.total_feedback,
    averageRating: dto.average_rating,
    sentiment: dto.sentiment,
    sentimentPercentages: dto.sentiment_percentages,
    volumeOverTime: dto.volume_over_time,
    departmentComparison: dto.department_comparison.map((d) => ({
      departmentId: d.department_id,
      code: d.code,
      name: d.name,
      averageRating: d.average_rating,
      count: d.count,
    })),
    topConcerns: dto.top_concerns.map((c) => ({
      term: c.term,
      count: c.count,
      negativeCount: c.negative_count,
      departments: [],
    })),
    topCommendations: dto.top_commendations,
    method: dto.sentiment_method,
  };
}

export function geographicAggregateFromDto(dto: GeographicAggregateDto): GeoAggregate {
  return {
    district: dto.district,
    localArea: dto.local_area,
    // Never fabricate coordinates: the map layer must skip points without them.
    coordinates: toCoordinates(dto.latitude, dto.longitude) ?? null,
    total: dto.total,
    averageRating: dto.average_rating,
    sentiment: dto.sentiment,
    hotspotLevel: dto.hotspot_level as HotspotLevel,
  };
}

export function insightsFromDto(dto: InsightsDto): Insights {
  return {
    recurringConcerns: dto.recurring_concerns.map((c) => ({
      term: c.term,
      count: c.count,
      negativeCount: c.negative_count,
      departments: c.departments,
    })),
    departmentComparison: dto.department_comparison.map((d) => ({
      departmentId: d.department_id,
      code: d.code,
      name: d.name,
      averageRating: d.average_rating,
      count: d.count,
    })),
    trends: dto.trends.map((t) => ({
      period: t.period,
      total: t.total,
      averageRating: t.average_rating,
      deltaVsPrevious: t.delta_vs_previous,
    })),
    method: dto.method,
  };
}

export function publicSummaryFromDto(dto: PublicSummaryDto): PublicSummary {
  return {
    total: dto.total_feedback,
    averageRating: dto.average_rating,
    sentiment: dto.sentiment,
    sentimentPercentages: dto.sentiment_percentages,
    districtsRepresented: dto.districts_represented,
    minSample: dto.min_sample,
    method: dto.sentiment_method,
    concernLevelNote: dto.concern_level_note,
    departments: dto.departments.map((d) => ({
      departmentId: d.department_id,
      code: d.code,
      name: d.name,
      averageRating: d.average_rating,
      count: d.count,
    })),
    districts: dto.districts.map((d) => ({
      district: d.district,
      count: d.count,
      averageRating: d.average_rating,
      sentiment: d.sentiment,
      sentimentPercentages: d.sentiment_percentages,
      concernLevel: d.concern_level as HotspotLevel | null,
      lowSample: d.low_sample,
      // Never fabricate coordinates for the public map.
      coordinates: toCoordinates(d.latitude, d.longitude) ?? null,
    })),
  };
}
