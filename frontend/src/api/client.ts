import {
  Department,
  FeedbackRecord,
  FilterState,
  GovernmentService,
  LocationInfo,
  NewFeedbackInput,
} from '@/types/feedback';
import { AnalyticsSummary, GeoAggregate, Insights, PublicSummary } from '@/domain/analytics';

export interface AdminSession {
  token: string;
  user: { id: string; email: string; name: string; role: string };
}

export interface Paginated<T> {
  count: number;
  page: number;
  pageSize: number;
  results: T[];
  hasNext: boolean;
  hasPrevious: boolean;
}

export type FeedbackOrdering =
  | 'created_at'
  | '-created_at'
  | 'overall_rating'
  | '-overall_rating';

export interface ListFeedbackOptions {
  page?: number;
  pageSize?: number;
  ordering?: FeedbackOrdering;
}

export type DepartmentDraft = Omit<Department, 'id' | 'services'> & {
  services?: GovernmentService[];
};

export type ServiceDraft = Omit<GovernmentService, 'id'>;

/**
 * The single data-access surface used by the application.
 *
 * `mockClient` (in-browser demo) and `httpClient` (Django/DRF) both implement it,
 * so the UI is identical against either backend. See `docs/api-contract.md`.
 */
export interface ApiClient {
  readonly mode: 'mock' | 'http';

  // Feedback
  listFeedback(filters: FilterState, options?: ListFeedbackOptions): Promise<Paginated<FeedbackRecord>>;
  createFeedback(input: NewFeedbackInput, idempotencyKey: string): Promise<FeedbackRecord>;
  getFeedback(id: string): Promise<FeedbackRecord>;
  deleteFeedback(id: string): Promise<void>;

  // Catalogue
  listDepartments(options?: { includeInactive?: boolean }): Promise<Department[]>;
  createDepartment(draft: DepartmentDraft): Promise<Department>;
  updateDepartment(id: string, patch: Partial<DepartmentDraft> & { isActive?: boolean }): Promise<Department>;
  deleteDepartment(id: string): Promise<void>;

  createService(departmentId: string, draft: ServiceDraft): Promise<GovernmentService>;
  deleteService(departmentId: string, serviceId: string): Promise<void>;

  listLocations(): Promise<LocationInfo[]>;

  // Analytics (server-computed in `http` mode; the mock delegates to `@/domain/analytics`)
  getAnalyticsSummary(filters: FilterState): Promise<AnalyticsSummary>;
  getGeographicAggregates(filters: FilterState): Promise<GeoAggregate[]>;
  getInsights(filters: FilterState): Promise<Insights>;
  /**
   * Public, aggregate-only statistics (no login required). Safe to call before the
   * user has authenticated — used by the citizen-facing insights view.
   */
  getPublicSummary(filters: FilterState): Promise<PublicSummary>;
  exportReportCsv(filters: FilterState): Promise<Blob>;

  // Auth
  login(email: string, password: string): Promise<AdminSession>;
  logout(): Promise<void>;
  getCurrentAdmin(): Promise<AdminSession['user'] | null>;

  // Demo helper
  resetDemoData(): Promise<void>;
}
