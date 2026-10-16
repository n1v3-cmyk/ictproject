import { describe, expect, it } from 'vitest';
import {
  analyticsSummaryFromDto,
  buildFeedbackFormData,
  departmentFromDto,
  feedbackFromDto,
  filtersToQuery,
  geographicAggregateFromDto,
  insightsFromDto,
  locationFromDto,
  serviceFromDto,
  toCoordinates,
} from '@/api/mappers';
import { DEFAULT_FILTERS } from '@/domain/filters';
import {
  AnalyticsSummaryDto,
  DepartmentDto,
  FeedbackDto,
  GeographicAggregateDto,
  InsightsDto,
} from '@/api/contract';
import { NewFeedbackInput } from '@/types/feedback';

const feedbackDto: FeedbackDto = {
  id: 'fb-1',
  reference_id: 'CC-KL-2026-1',
  created_at: '2026-10-01T10:00:00Z',
  location: {
    state: 'Kerala',
    district: 'Ernakulam',
    local_area: 'Kanayannur (Kochi)',
    latitude: 9.97,
    longitude: 76.28,
  },
  department: { id: 'dept-mvd', name: 'Motor Vehicles Department (MVD)', code: 'MVD' },
  service: { id: 'srv-1', name: 'Driving License Renewal', code: 'MVD-01' },
  overall_rating: 2,
  category_ratings: { helpfulness: 2, communication: 3, professionalism: 4, response_time: 1 },
  structured_answers: {
    timely_delivery: 'significant_delay',
    process_clarity: 'confusing',
    digital_access_used: true,
  },
  summary_comment: 'Long delay at the counter.',
  detailed_description: 'Waited several hours.',
  sentiment: 'negative',
  sentiment_score: 12,
  sentiment_status: 'completed',
  sentiment_method: 'heuristic-v1',
  keywords: ['delay'],
  is_anonymous: true,
  citizen_name: 'Should Not Leak',
  citizen_contact: '9999999999',
  attachments: [
    { id: 'a1', file_name: 'photo.png', mime_type: 'image/png', size_bytes: 2048, download_url: '/x' },
  ],
};

describe('toCoordinates', () => {
  it('returns a pair when both are present', () => {
    expect(toCoordinates(9.97, 76.28)).toEqual([9.97, 76.28]);
  });

  it('returns undefined when either side is null (never fabricates)', () => {
    expect(toCoordinates(null, 76.28)).toBeUndefined();
    expect(toCoordinates(9.97, null)).toBeUndefined();
    expect(toCoordinates(null, null)).toBeUndefined();
  });
});

describe('feedbackFromDto', () => {
  it('maps snake_case wire fields onto camelCase domain fields', () => {
    const record = feedbackFromDto(feedbackDto);
    expect(record.referenceId).toBe('CC-KL-2026-1');
    expect(record.createdAt).toBe('2026-10-01T10:00:00Z');
    expect(record.departmentName).toBe('Motor Vehicles Department (MVD)');
    expect(record.categoryRatings.responseTime).toBe(1);
    expect(record.structuredAnswers?.timelyDelivery).toBe('significant_delay');
    expect(record.location.localArea).toBe('Kanayannur (Kochi)');
    expect(record.location.coordinates).toEqual([9.97, 76.28]);
    expect(record.attachments[0]).toMatchObject({ name: 'photo.png', type: 'image/png', size: 2048 });
  });

  it('never surfaces identity for an anonymous record, even if the server sends it', () => {
    const record = feedbackFromDto(feedbackDto);
    expect(record.citizenName).toBeUndefined();
    expect(record.citizenContact).toBeUndefined();
  });

  it('keeps identity for an identified submission', () => {
    const record = feedbackFromDto({
      ...feedbackDto,
      is_anonymous: false,
      citizen_name: 'Anita',
      citizen_contact: '9876543210',
    });
    expect(record.citizenName).toBe('Anita');
    expect(record.citizenContact).toBe('9876543210');
  });

  it('drops coordinates when the location has none', () => {
    const record = feedbackFromDto({
      ...feedbackDto,
      location: { ...feedbackDto.location, latitude: null, longitude: null },
    });
    expect(record.location.coordinates).toBeUndefined();
  });
});

describe('departmentFromDto / serviceFromDto / locationFromDto', () => {
  it('maps a department and its nested services', () => {
    const dto: DepartmentDto = {
      id: 'dept-mvd',
      name: 'Motor Vehicles Department (MVD)',
      code: 'MVD',
      description: 'Transport',
      icon_name: 'Car',
      contact_email: 'mvd@kerala.gov.in',
      nodal_officer: 'Officer',
      is_active: true,
      services: [
        {
          id: 'srv-1',
          name: 'Driving License Renewal',
          code: 'MVD-01',
          description: 'Renew',
          category: 'Transport',
          average_resolution_days: null,
          is_active: false,
        },
      ],
    };
    const department = departmentFromDto(dto);
    expect(department.iconName).toBe('Car');
    expect(department.contactEmail).toBe('mvd@kerala.gov.in');
    expect(department.services).toHaveLength(1);
    expect(department.services[0].averageResolutionDays).toBeUndefined();
    expect(department.services[0].isActive).toBe(false);
  });

  it('maps a location, allowing for missing coordinates', () => {
    const location = locationFromDto({
      id: 'loc-1',
      state: 'Kerala',
      district: 'Wayanad',
      local_area: 'Mananthavady',
      latitude: null,
      longitude: null,
    });
    expect(location.district).toBe('Wayanad');
    expect(location.coordinates).toBeUndefined();
  });

  it('translates service fields', () => {
    const service = serviceFromDto({
      id: 'srv-1',
      name: 'Renewal',
      code: 'MVD-01',
      description: 'Renew',
      category: 'Transport',
      average_resolution_days: 3,
      is_active: true,
    });
    expect(service.averageResolutionDays).toBe(3);
    expect(service.isActive).toBe(true);
  });
});

describe('filtersToQuery', () => {
  it('omits parameters that are still at their default', () => {
    expect(filtersToQuery(DEFAULT_FILTERS)).toBe('');
  });

  it('serialises only the active filters with DRF names', () => {
    const query = filtersToQuery({
      ...DEFAULT_FILTERS,
      district: 'Ernakulam',
      departmentId: 'dept-mvd',
      sentiment: 'negative',
      dateRange: '30days',
      searchQuery: '  delay  ',
    });
    const params = new URLSearchParams(query);
    expect(params.get('district')).toBe('Ernakulam');
    expect(params.get('department')).toBe('dept-mvd');
    expect(params.get('sentiment')).toBe('negative');
    expect(params.get('date_range')).toBe('30days');
    expect(params.get('search')).toBe('delay');
  });

  it('appends pagination/ordering extras', () => {
    const query = filtersToQuery(DEFAULT_FILTERS, { page: 2, page_size: 25, ordering: '-created_at' });
    const params = new URLSearchParams(query);
    expect(params.get('page')).toBe('2');
    expect(params.get('page_size')).toBe('25');
    expect(params.get('ordering')).toBe('-created_at');
  });
});

describe('buildFeedbackFormData', () => {
  const input: NewFeedbackInput = {
    location: { state: 'Kerala', district: 'Ernakulam', localArea: 'Kanayannur (Kochi)', coordinates: [9.97, 76.28] },
    departmentId: 'dept-mvd',
    serviceId: 'srv-1',
    overallRating: 2,
    categoryRatings: { helpfulness: 2, communication: 3, professionalism: 4, responseTime: 1 },
    structuredAnswers: { timelyDelivery: 'significant_delay', processClarity: 'confusing', digitalAccessUsed: true },
    summaryComment: 'Long delay at the counter.',
    detailedDescription: 'Waited several hours.',
    isAnonymous: false,
    citizenName: 'Anita',
    citizenContact: '9876543210',
    attachments: [],
  };

  it('sets every required multipart field as a string', () => {
    const form = buildFeedbackFormData(input);
    expect(form.get('department')).toBe('dept-mvd');
    expect(form.get('service')).toBe('srv-1');
    expect(form.get('district')).toBe('Ernakulam');
    expect(form.get('local_area')).toBe('Kanayannur (Kochi)');
    expect(form.get('overall_rating')).toBe('2');
    expect(form.get('response_time')).toBe('1');
    expect(form.get('digital_access_used')).toBe('true');
    expect(form.get('is_anonymous')).toBe('false');
    expect(form.get('citizen_name')).toBe('Anita');
  });

  it('does not send coordinates - the server resolves them (contract 3.2)', () => {
    const form = buildFeedbackFormData(input);
    expect(form.get('latitude')).toBeNull();
    expect(form.get('longitude')).toBeNull();
  });

  it('omits identity fields for anonymous submissions', () => {
    const form = buildFeedbackFormData({
      ...input,
      isAnonymous: true,
      citizenName: undefined,
      citizenContact: undefined,
    });
    expect(form.get('citizen_name')).toBeNull();
    expect(form.get('citizen_contact')).toBeNull();
  });
});

describe('analytics DTO mappers', () => {
  it('maps an analytics summary', () => {
    const dto: AnalyticsSummaryDto = {
      total_feedback: 4,
      average_rating: 2.75,
      sentiment: { positive: 1, neutral: 1, negative: 2 },
      sentiment_percentages: { positive: 25, neutral: 25, negative: 50 },
      volume_over_time: [{ date: '2026-10-01', positive: 1, neutral: 0, negative: 1, total: 2 }],
      department_comparison: [
        { department_id: 'dept-mvd', code: 'MVD', name: 'MVD', average_rating: 1.5, count: 2 },
      ],
      top_concerns: [{ term: 'delay', count: 2, negative_count: 2 }],
      top_commendations: [{ term: 'helpful', count: 1 }],
      sentiment_method: 'heuristic-v1',
    };
    const summary = analyticsSummaryFromDto(dto);
    expect(summary.total).toBe(4);
    const counts = summary.sentiment;
    expect(counts.positive + counts.neutral + counts.negative).toBe(summary.total);
    expect(summary.departmentComparison[0].departmentId).toBe('dept-mvd');
    expect(summary.topConcerns[0].negativeCount).toBe(2);
    expect(summary.method).toBe('heuristic-v1');
  });

  it('maps a geographic aggregate and preserves null coordinates', () => {
    const withCoords: GeographicAggregateDto = {
      district: 'Ernakulam',
      local_area: null,
      latitude: 9.98,
      longitude: 76.3,
      total: 3,
      average_rating: 2.1,
      sentiment: { positive: 0, neutral: 1, negative: 2 },
      hotspot_level: 'high',
    };
    expect(geographicAggregateFromDto(withCoords).coordinates).toEqual([9.98, 76.3]);
    expect(geographicAggregateFromDto(withCoords).hotspotLevel).toBe('high');

    const noCoords = geographicAggregateFromDto({ ...withCoords, latitude: null, longitude: null });
    expect(noCoords.coordinates).toBeNull();
  });

  it('maps insights including trends and deltas', () => {
    const dto: InsightsDto = {
      recurring_concerns: [{ term: 'delay', count: 3, negative_count: 2, departments: ['MVD'], trend: 'up' }],
      department_comparison: [
        { department_id: 'dept-mvd', code: 'MVD', name: 'MVD', average_rating: 1.5, count: 2 },
      ],
      trends: [
        { period: '2026-09', total: 1, average_rating: 3, delta_vs_previous: null },
        { period: '2026-10', total: 3, average_rating: 2, delta_vs_previous: -1 },
      ],
      method: 'heuristic-v1',
    };
    const insights = insightsFromDto(dto);
    expect(insights.recurringConcerns[0].departments).toEqual(['MVD']);
    expect(insights.trends[0].deltaVsPrevious).toBeNull();
    expect(insights.trends[1].deltaVsPrevious).toBe(-1);
  });
});
