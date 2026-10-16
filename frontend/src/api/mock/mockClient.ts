import {
  Department,
  FeedbackRecord,
  FilterState,
  GovernmentService,
  LocationInfo,
  NewFeedbackInput,
} from '@/types/feedback';
import {
  ApiClient,
  AdminSession,
  DepartmentDraft,
  ListFeedbackOptions,
  Paginated,
  ServiceDraft,
} from '@/api/client';
import { ApiError } from '@/api/errors';
import {
  CONCERN_METHOD,
  AnalyticsSummary,
  GeoAggregate,
  Insights,
  PublicSummary,
  deriveInsights,
  geographicAggregates,
  publicSummary,
  summarize,
} from '@/domain/analytics';
import { DEFAULT_FILTERS, filterFeedback } from '@/domain/filters';
import { feedbackToCsv } from '@/domain/csv';
import { analyzeSentiment } from '@/domain/sentiment';
import { clampRating } from '@/domain/ratings';
import {
  validateDescription,
  validateRatings,
  validateSelection,
  ValidationErrors,
  hasErrors,
} from '@/domain/validation';
import { getState, resetState, setDepartments, setFeedback } from './store';
import { SEED_LOCATIONS } from './seed';

const STORAGE_KEY_TOKEN = 'civicconnect.admin.token';
const DEMO_EMAIL = 'admin@civicconnect.gov.in';
const DEMO_PASSWORD = 'DemoAdmin@2026';
const DEFAULT_PAGE_SIZE = 10;

let latencyMs = 120;

/** Test hook: set mock latency (0 disables the artificial delay). */
export function setMockLatency(ms: number): void {
  latencyMs = Math.max(0, ms);
}

function delay(): Promise<void> {
  return latencyMs > 0 ? new Promise((resolve) => setTimeout(resolve, latencyMs)) : Promise.resolve();
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  if (!isBrowser()) return;
  try {
    if (token) window.sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
    else window.sessionStorage.removeItem(STORAGE_KEY_TOKEN);
  } catch {
    // ignore storage failures
  }
}

/** Idempotency keys already fulfilled, mapped to the created record id. */
const idempotencyIndex = new Map<string, string>();

function nextReferenceId(existing: FeedbackRecord[]): string {
  const year = new Date().getFullYear();
  let max = 1100;
  for (const f of existing) {
    const match = /CC-KL-(\d{4})-(\d+)/.exec(f.referenceId);
    if (match) max = Math.max(max, Number(match[2]));
  }
  return `CC-KL-${year}-${max + 1}`;
}

function categoryAverage(input: NewFeedbackInput): number {
  const { helpfulness, communication, professionalism, responseTime } = input.categoryRatings;
  return (helpfulness + communication + professionalism + responseTime) / 4;
}

function sortFeedback(items: FeedbackRecord[], ordering: ListFeedbackOptions['ordering']): FeedbackRecord[] {
  const copy = [...items];
  switch (ordering) {
    case 'created_at':
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case 'overall_rating':
      return copy.sort((a, b) => a.overallRating - b.overallRating);
    case '-overall_rating':
      return copy.sort((a, b) => b.overallRating - a.overallRating);
    case '-created_at':
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

function mergeErrors(...groups: ValidationErrors[]): ValidationErrors {
  return groups.reduce<ValidationErrors>((acc, group) => ({ ...acc, ...group }), {});
}

function activeDepartment(departments: Department[], id: string): Department {
  const dept = departments.find((d) => d.id === id);
  if (!dept || dept.isActive === false) {
    throw new ApiError('The selected department is not available.', 400, {
      departmentId: 'Unknown or inactive department.',
    });
  }
  return dept;
}

export const mockClient: ApiClient = {
  mode: 'mock',

  async listFeedback(filters: FilterState = DEFAULT_FILTERS, options: ListFeedbackOptions = {}) {
    await delay();
    const { feedback } = getState();
    const filtered = filterFeedback(feedback, filters);
    const ordered = sortFeedback(filtered, options.ordering ?? '-created_at');

    const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
    const page = Math.max(1, options.page ?? 1);
    const start = (page - 1) * pageSize;
    const results = ordered.slice(start, start + pageSize);

    const paginated: Paginated<FeedbackRecord> = {
      count: ordered.length,
      page,
      pageSize,
      results,
      hasNext: start + pageSize < ordered.length,
      hasPrevious: page > 1,
    };
    return paginated;
  },

  async createFeedback(input: NewFeedbackInput, idempotencyKey: string) {
    await delay();

    const existingId = idempotencyIndex.get(idempotencyKey);
    if (existingId) {
      const existing = getState().feedback.find((f) => f.id === existingId);
      if (existing) return existing;
    }

    const errors = mergeErrors(
      validateSelection({
        district: input.location.district,
        localArea: input.location.localArea,
        departmentId: input.departmentId,
        serviceId: input.serviceId,
      }),
      validateRatings({
        overallRating: input.overallRating,
        summaryComment: input.summaryComment,
        isAnonymous: input.isAnonymous,
        citizenName: input.citizenName,
      }),
      validateDescription({ detailedDescription: input.detailedDescription })
    );
    if (hasErrors(errors)) {
      throw new ApiError('Please correct the highlighted fields.', 400, errors);
    }

    const { departments, feedback } = getState();
    const dept = activeDepartment(departments, input.departmentId);
    const service = dept.services.find((s) => s.id === input.serviceId);
    if (!service) {
      throw new ApiError('The selected service does not belong to the department.', 400, {
        serviceId: 'Invalid service for the chosen department.',
      });
    }

    const analysis = analyzeSentiment(
      `${input.summaryComment} ${input.detailedDescription}`,
      input.overallRating,
      categoryAverage(input)
    );

    const record: FeedbackRecord = {
      id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      referenceId: nextReferenceId(feedback),
      createdAt: new Date().toISOString(),
      location: {
        state: input.location.state,
        district: input.location.district,
        localArea: input.location.localArea,
        coordinates: input.location.coordinates,
      },
      departmentId: dept.id,
      departmentName: dept.name,
      serviceId: service.id,
      serviceName: service.name,
      overallRating: clampRating(input.overallRating),
      categoryRatings: {
        helpfulness: clampRating(input.categoryRatings.helpfulness),
        communication: clampRating(input.categoryRatings.communication),
        professionalism: clampRating(input.categoryRatings.professionalism),
        responseTime: clampRating(input.categoryRatings.responseTime),
      },
      structuredAnswers: input.structuredAnswers,
      summaryComment: input.summaryComment.trim(),
      detailedDescription: input.detailedDescription.trim(),
      sentiment: analysis.sentiment,
      sentimentScore: analysis.score,
      keywords: analysis.detectedKeywords,
      isAnonymous: input.isAnonymous,
      citizenName: input.isAnonymous ? undefined : input.citizenName?.trim(),
      citizenContact: input.isAnonymous ? undefined : input.citizenContact?.trim(),
      attachments: input.attachments.map((a) => ({ ...a, isDemo: true })),
    };

    setFeedback([record, ...feedback]);
    idempotencyIndex.set(idempotencyKey, record.id);
    return record;
  },

  async getFeedback(id: string) {
    await delay();
    const record = getState().feedback.find((f) => f.id === id);
    if (!record) throw new ApiError('Feedback not found.', 404);
    return record;
  },

  async deleteFeedback(id: string) {
    await delay();
    const { feedback } = getState();
    if (!feedback.some((f) => f.id === id)) throw new ApiError('Feedback not found.', 404);
    setFeedback(feedback.filter((f) => f.id !== id));
  },

  async listDepartments(options: { includeInactive?: boolean } = {}) {
    await delay();
    const { departments } = getState();
    return departments
      .filter((d) => options.includeInactive || d.isActive !== false)
      .map((d) => ({
        ...d,
        services: d.services.filter((s) => options.includeInactive || s.isActive !== false),
      }));
  },

  async createDepartment(draft: DepartmentDraft) {
    await delay();
    const { departments } = getState();
    if (departments.some((d) => d.code.toLowerCase() === draft.code.toLowerCase())) {
      throw new ApiError('A department with this code already exists.', 409, {
        code: 'This code is already in use.',
      });
    }
    const created: Department = {
      ...draft,
      id: `dept-${Date.now()}`,
      isActive: draft.isActive ?? true,
      services: draft.services ?? [],
    };
    setDepartments([...departments, created]);
    return created;
  },

  async updateDepartment(id, patch) {
    await delay();
    const { departments } = getState();
    const index = departments.findIndex((d) => d.id === id);
    if (index === -1) throw new ApiError('Department not found.', 404);
    const updated: Department = { ...departments[index], ...patch, id };
    const next = [...departments];
    next[index] = updated;
    setDepartments(next);
    return updated;
  },

  async deleteDepartment(id: string) {
    await delay();
    const { departments, feedback } = getState();
    if (feedback.some((f) => f.departmentId === id)) {
      throw new ApiError(
        'This department has existing feedback and cannot be deleted. Deactivate it instead.',
        409
      );
    }
    setDepartments(departments.filter((d) => d.id !== id));
  },

  async createService(departmentId: string, draft: ServiceDraft) {
    await delay();
    const { departments } = getState();
    const index = departments.findIndex((d) => d.id === departmentId);
    if (index === -1) throw new ApiError('Department not found.', 404);
    const created: GovernmentService = {
      ...draft,
      id: `srv-${Date.now()}`,
      isActive: draft.isActive ?? true,
    };
    const updated: Department = {
      ...departments[index],
      services: [...departments[index].services, created],
    };
    const next = [...departments];
    next[index] = updated;
    setDepartments(next);
    return created;
  },

  async deleteService(departmentId: string, serviceId: string) {
    await delay();
    const { departments, feedback } = getState();
    if (feedback.some((f) => f.serviceId === serviceId)) {
      throw new ApiError(
        'This service has existing feedback and cannot be deleted. Deactivate it instead.',
        409
      );
    }
    const index = departments.findIndex((d) => d.id === departmentId);
    if (index === -1) throw new ApiError('Department not found.', 404);
    const updated: Department = {
      ...departments[index],
      services: departments[index].services.filter((s) => s.id !== serviceId),
    };
    const next = [...departments];
    next[index] = updated;
    setDepartments(next);
  },

  async listLocations(): Promise<LocationInfo[]> {
    await delay();
    return SEED_LOCATIONS.map((l) => ({ ...l }));
  },

  async getAnalyticsSummary(filters: FilterState): Promise<AnalyticsSummary> {
    await delay();
    const { feedback, departments } = getState();
    return summarize(filterFeedback(feedback, filters), departments);
  },

  async getGeographicAggregates(filters: FilterState): Promise<GeoAggregate[]> {
    await delay();
    const { feedback } = getState();
    return geographicAggregates(filterFeedback(feedback, filters), []);
  },

  async getInsights(filters: FilterState): Promise<Insights> {
    await delay();
    const { feedback, departments } = getState();
    const insights = deriveInsights(filterFeedback(feedback, filters), departments);
    return { ...insights, method: CONCERN_METHOD };
  },

  async getPublicSummary(filters: FilterState): Promise<PublicSummary> {
    await delay();
    const { feedback, departments } = getState();
    return publicSummary(filterFeedback(feedback, filters), departments);
  },

  async exportReportCsv(filters: FilterState): Promise<Blob> {
    await delay();
    const { feedback } = getState();
    const csv = feedbackToCsv(filterFeedback(feedback, filters));
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  },

  async login(email: string, password: string): Promise<AdminSession> {
    await delay();
    const normalizedEmail = email.trim().toLowerCase();
    const validCredentials =
      (normalizedEmail === DEMO_EMAIL || normalizedEmail === 'admin') && password === DEMO_PASSWORD;
    if (!validCredentials) {
      throw new ApiError('Unable to log in with the provided credentials.', 401);
    }
    const session: AdminSession = {
      token: 'demo-token',
      user: {
        id: 'admin-1',
        email: DEMO_EMAIL,
        name: 'State Nodal Officer',
        role: 'admin',
      },
    };
    writeToken(session.token);
    return session;
  },

  async logout(): Promise<void> {
    writeToken(null);
  },

  async getCurrentAdmin(): Promise<AdminSession['user'] | null> {
    if (!readToken()) return null;
    return { id: 'admin-1', email: DEMO_EMAIL, name: 'State Nodal Officer', role: 'admin' };
  },

  async resetDemoData(): Promise<void> {
    resetState();
  },
};

export const DEMO_CREDENTIALS = { email: DEMO_EMAIL, password: DEMO_PASSWORD } as const;
