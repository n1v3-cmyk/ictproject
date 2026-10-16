import {
  Department,
  FeedbackRecord,
  FilterState,
  GovernmentService,
  LocationInfo,
  NewFeedbackInput,
} from '@/types/feedback';
import { AnalyticsSummary, GeoAggregate, Insights, PublicSummary } from '@/domain/analytics';
import {
  ApiClient,
  AdminSession,
  DepartmentDraft,
  FeedbackOrdering,
  ListFeedbackOptions,
  Paginated,
  ServiceDraft,
} from '@/api/client';
import { ApiError, normalizeApiError } from '@/api/errors';
import { API_BASE_URL } from '@/lib/config';
import {
  AnalyticsSummaryDto,
  DepartmentDto,
  FeedbackDto,
  GeographicAggregateDto,
  InsightsDto,
  LocationDto,
  LoginResponseDto,
  PaginatedDto,
  PublicSummaryDto,
  ServiceDto,
} from '@/api/contract';
import {
  analyticsSummaryFromDto,
  buildFeedbackFormData,
  departmentFromDto,
  feedbackFromDto,
  filtersToQuery,
  geographicAggregateFromDto,
  insightsFromDto,
  locationFromDto,
  publicSummaryFromDto,
  serviceFromDto,
} from '@/api/mappers';

const TOKEN_KEY = 'civicconnect.admin.token';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  if (!isBrowser()) return;
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
}

interface RequestOptions {
  method?: string;
  body?: BodyInit;
  auth?: boolean;
  headers?: Record<string, string>;
  raw?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...options.headers };
  const token = readToken();
  if (options.auth !== false && token) headers.Authorization = `Token ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Please check your connection.', 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (options.raw) {
    if (!response.ok) {
      const body = await safeJson(response);
      throw normalizeApiError(response.status, body, 'Request failed.');
    }
    return (await response.blob()) as unknown as T;
  }

  const body = await safeJson(response);
  if (!response.ok) {
    throw normalizeApiError(response.status, body, 'Request failed.');
  }
  return body as T;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function orderingParam(ordering: FeedbackOrdering): string {
  return ordering;
}

export const httpClient: ApiClient = {
  mode: 'http',

  async listFeedback(
    filters: FilterState,
    options: ListFeedbackOptions = {}
  ): Promise<Paginated<FeedbackRecord>> {
    const query = filtersToQuery(filters, {
      ...(options.page ? { page: options.page } : {}),
      ...(options.pageSize ? { page_size: options.pageSize } : {}),
      ...(options.ordering ? { ordering: orderingParam(options.ordering) } : {}),
    });
    const dto = await request<PaginatedDto<FeedbackDto>>(`/feedback/${query}`, { auth: true });
    return {
      count: dto.count,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? dto.results.length,
      results: dto.results.map(feedbackFromDto),
      hasNext: Boolean(dto.next),
      hasPrevious: Boolean(dto.previous),
    };
  },

  async createFeedback(input: NewFeedbackInput, idempotencyKey: string): Promise<FeedbackRecord> {
    const form = buildFeedbackFormData(input);
    const dto = await request<FeedbackDto>('/feedback/', {
      method: 'POST',
      body: form,
      auth: false,
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return feedbackFromDto(dto);
  },

  async getFeedback(id: string): Promise<FeedbackRecord> {
    const dto = await request<FeedbackDto>(`/feedback/${id}/`, { auth: true });
    return feedbackFromDto(dto);
  },

  async deleteFeedback(id: string): Promise<void> {
    await request<void>(`/feedback/${id}/`, { method: 'DELETE', auth: true });
  },

  async listDepartments(options: { includeInactive?: boolean } = {}): Promise<Department[]> {
    const query = options.includeInactive ? '?include_inactive=true' : '';
    const dto = await request<{ results: DepartmentDto[] } | DepartmentDto[]>(
      `/departments/${query}`,
      // Send the token when one exists: `include_inactive=true` is only honoured for
      // staff, and the backend silently returns active-only for everyone else.
      { auth: true }
    );
    const list = Array.isArray(dto) ? dto : dto.results;
    return list.map(departmentFromDto);
  },

  async createDepartment(draft: DepartmentDraft): Promise<Department> {
    const dto = await request<DepartmentDto>('/departments/', {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: draft.name,
        code: draft.code,
        description: draft.description,
        icon_name: draft.iconName,
        contact_email: draft.contactEmail,
        nodal_officer: draft.nodalOfficer,
      }),
    });
    return departmentFromDto(dto);
  },

  async updateDepartment(
    id: string,
    patch: Partial<DepartmentDraft> & { isActive?: boolean }
  ): Promise<Department> {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.code !== undefined) body.code = patch.code;
    if (patch.description !== undefined) body.description = patch.description;
    if (patch.iconName !== undefined) body.icon_name = patch.iconName;
    if (patch.contactEmail !== undefined) body.contact_email = patch.contactEmail;
    if (patch.nodalOfficer !== undefined) body.nodal_officer = patch.nodalOfficer;
    if (patch.isActive !== undefined) body.is_active = patch.isActive;

    const dto = await request<DepartmentDto>(`/departments/${id}/`, {
      method: 'PATCH',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return departmentFromDto(dto);
  },

  async deleteDepartment(id: string): Promise<void> {
    await request<void>(`/departments/${id}/`, { method: 'DELETE', auth: true });
  },

  async createService(departmentId: string, draft: ServiceDraft): Promise<GovernmentService> {
    const dto = await request<ServiceDto>('/services/', {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department: departmentId,
        name: draft.name,
        code: draft.code,
        description: draft.description,
        category: draft.category,
        average_resolution_days: draft.averageResolutionDays ?? null,
      }),
    });
    return serviceFromDto(dto);
  },

  async deleteService(_departmentId: string, serviceId: string): Promise<void> {
    await request<void>(`/services/${serviceId}/`, { method: 'DELETE', auth: true });
  },

  async listLocations(): Promise<LocationInfo[]> {
    const dto = await request<{ results: LocationDto[] } | LocationDto[]>('/locations/', {
      auth: false,
    });
    const list = Array.isArray(dto) ? dto : dto.results;
    return list.map(locationFromDto);
  },

  async getAnalyticsSummary(filters: FilterState): Promise<AnalyticsSummary> {
    const dto = await request<AnalyticsSummaryDto>(`/analytics/summary/${filtersToQuery(filters)}`, {
      auth: true,
    });
    return analyticsSummaryFromDto(dto);
  },

  async getGeographicAggregates(filters: FilterState): Promise<GeoAggregate[]> {
    const dto = await request<{ results: GeographicAggregateDto[] }>(
      `/analytics/geographic/${filtersToQuery(filters)}`,
      { auth: true }
    );
    return dto.results.map(geographicAggregateFromDto);
  },

  async getInsights(filters: FilterState): Promise<Insights> {
    const dto = await request<InsightsDto>(`/analytics/insights/${filtersToQuery(filters)}`, {
      auth: true,
    });
    return insightsFromDto(dto);
  },

  async getPublicSummary(filters: FilterState): Promise<PublicSummary> {
    const dto = await request<PublicSummaryDto>(
      `/analytics/public-summary/${filtersToQuery(filters)}`,
      { auth: false }
    );
    return publicSummaryFromDto(dto);
  },

  async exportReportCsv(filters: FilterState): Promise<Blob> {
    return request<Blob>(`/reports/export/${filtersToQuery(filters, { format: 'csv' })}`, {
      auth: true,
      raw: true,
    });
  },

  async login(email: string, password: string): Promise<AdminSession> {
    const dto = await request<LoginResponseDto>('/auth/login/', {
      method: 'POST',
      auth: false,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    writeToken(dto.token);
    return { token: dto.token, user: dto.user };
  },

  async logout(): Promise<void> {
    try {
      await request<void>('/auth/logout/', { method: 'POST', auth: true });
    } finally {
      writeToken(null);
    }
  },

  async getCurrentAdmin(): Promise<AdminSession['user'] | null> {
    if (!readToken()) return null;
    try {
      return await request<AdminSession['user']>('/auth/me/', { auth: true });
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        writeToken(null);
        return null;
      }
      throw error;
    }
  },

  async resetDemoData(): Promise<void> {
    // Nothing to reset against a real backend.
  },
};
