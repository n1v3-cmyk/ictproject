'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  Department,
  FeedbackRecord,
  FilterState,
  GovernmentService,
  LocationInfo,
  NewFeedbackInput,
} from '@/types/feedback';
import { ApiClient, DepartmentDraft, ServiceDraft } from '@/api/client';
import { getApiClient } from '@/api';
import { ApiError, toApiError } from '@/api/errors';
import { PublicSummary } from '@/domain/analytics';
import { DEFAULT_FILTERS, filterFeedback } from '@/domain/filters';

/** Load the full dataset into memory for client-side analytics and filtering. */
const LOAD_ALL_PAGE_SIZE = 1000;

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface FeedbackContextType {
  client: ApiClient;
  feedbacks: FeedbackRecord[];
  departments: Department[];
  locations: LocationInfo[];
  /** Public, aggregate-only statistics — available without a login. */
  publicSummary: PublicSummary | null;
  filters: FilterState;
  filteredFeedbacks: FeedbackRecord[];
  isLoading: boolean;
  error: string | null;
  isAdminLoggedIn: boolean;
  adminUser: AdminUser | null;
  refresh: () => Promise<void>;
  addFeedback: (input: NewFeedbackInput, idempotencyKey: string) => Promise<FeedbackRecord>;
  deleteFeedback: (id: string) => Promise<void>;
  resetToDefaultData: () => Promise<void>;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  addDepartment: (draft: DepartmentDraft) => Promise<void>;
  updateDepartment: (dept: Department) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addServiceToDepartment: (deptId: string, service: ServiceDraft) => Promise<void>;
  deleteServiceFromDepartment: (deptId: string, serviceId: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getApiClient(), []);

  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [publicSummary, setPublicSummary] = useState<PublicSummary | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Public data, safe for anyone: the active catalogue, all locations, and the
   * aggregate-only public summary. Needs no token and no private feedback.
   */
  const loadPublicData = useCallback(async () => {
    const [departmentList, locationList, summary] = await Promise.all([
      client.listDepartments(),
      client.listLocations(),
      client.getPublicSummary(DEFAULT_FILTERS),
    ]);
    setDepartments(departmentList);
    setLocations(locationList);
    setPublicSummary(summary);
  }, [client]);

  /**
   * Admin-only data: the full feedback list and departments including inactive
   * ones. `GET /feedback/` is authorized on the server, so an anonymous browser is
   * never sent private submissions.
   */
  const loadAdminData = useCallback(async () => {
    const [departmentList, feedbackPage] = await Promise.all([
      client.listDepartments({ includeInactive: true }),
      client.listFeedback(DEFAULT_FILTERS, { pageSize: LOAD_ALL_PAGE_SIZE }),
    ]);
    setDepartments(departmentList);
    setFeedbacks(feedbackPage.results);
  }, [client]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isAdminLoggedIn) {
        await loadAdminData();
      } else {
        await loadPublicData();
        // The mock adapter has no server-side authorization, so it keeps serving
        // the demo dataset to citizen views exactly as before.
        if (client.mode === 'mock') {
          const feedbackPage = await client.listFeedback(DEFAULT_FILTERS, {
            pageSize: LOAD_ALL_PAGE_SIZE,
          });
          setFeedbacks(feedbackPage.results);
        }
      }
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, [client, isAdminLoggedIn, loadAdminData, loadPublicData]);

  // Initial load + admin session restore.
  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadPublicData();
        let restored = false;
        try {
          const user = await client.getCurrentAdmin();
          if (user) {
            restored = true;
            if (active) {
              setIsAdminLoggedIn(true);
              setAdminUser(user);
            }
          }
        } catch {
          // Session restore is best-effort.
        }
        if (restored) {
          await loadAdminData();
        } else if (client.mode === 'mock') {
          const feedbackPage = await client.listFeedback(DEFAULT_FILTERS, {
            pageSize: LOAD_ALL_PAGE_SIZE,
          });
          if (active) setFeedbacks(feedbackPage.results);
        }
      } catch (err) {
        if (active) setError(toApiError(err).message);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [client, loadAdminData, loadPublicData]);

  const addFeedback = useCallback(
    async (input: NewFeedbackInput, idempotencyKey: string) => {
      const record = await client.createFeedback(input, idempotencyKey);
      setFeedbacks((prev) => [record, ...prev]);
      // Keep the public aggregates fresh for the citizen views (best effort).
      try {
        setPublicSummary(await client.getPublicSummary(DEFAULT_FILTERS));
      } catch {
        // Non-fatal: the submission itself succeeded.
      }
      return record;
    },
    [client]
  );

  const deleteFeedback = useCallback(
    async (id: string) => {
      await client.deleteFeedback(id);
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    },
    [client]
  );

  const resetToDefaultData = useCallback(async () => {
    await client.resetDemoData();
    await refresh();
  }, [client, refresh]);

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // Choosing a district invalidates a local area from another district.
      ...(key === 'district' ? { localArea: 'all' } : {}),
      // Choosing a department invalidates a service from another department.
      ...(key === 'departmentId' ? { serviceId: 'all' } : {}),
    }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const reloadDepartments = useCallback(async () => {
    const list = await client.listDepartments({ includeInactive: true });
    setDepartments(list);
  }, [client]);

  const addDepartment = useCallback(
    async (draft: DepartmentDraft) => {
      await client.createDepartment(draft);
      await reloadDepartments();
    },
    [client, reloadDepartments]
  );

  const updateDepartment = useCallback(
    async (dept: Department) => {
      await client.updateDepartment(dept.id, {
        name: dept.name,
        code: dept.code,
        description: dept.description,
        iconName: dept.iconName,
        contactEmail: dept.contactEmail,
        nodalOfficer: dept.nodalOfficer,
        isActive: dept.isActive,
      });
      await reloadDepartments();
    },
    [client, reloadDepartments]
  );

  const deleteDepartment = useCallback(
    async (id: string) => {
      await client.deleteDepartment(id);
      await reloadDepartments();
    },
    [client, reloadDepartments]
  );

  const addServiceToDepartment = useCallback(
    async (deptId: string, service: ServiceDraft) => {
      await client.createService(deptId, service);
      await reloadDepartments();
    },
    [client, reloadDepartments]
  );

  const deleteServiceFromDepartment = useCallback(
    async (deptId: string, serviceId: string) => {
      await client.deleteService(deptId, serviceId);
      await reloadDepartments();
    },
    [client, reloadDepartments]
  );

  const loginAdmin = useCallback(
    async (email: string, password: string) => {
      try {
        const session = await client.login(email, password);
        setAdminUser(session.user);
        setIsAdminLoggedIn(true);
        // Now authorized: load the full feedback list and inactive departments.
        await loadAdminData();
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.isUnauthorized) return false;
        throw err;
      }
    },
    [client, loadAdminData]
  );

  const logoutAdmin = useCallback(async () => {
    await client.logout();
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    // Drop the admin-only dataset and fall back to the public, active-only view.
    setFeedbacks([]);
    try {
      await loadPublicData();
    } catch {
      // Non-fatal: the citizen views already hold what they need.
    }
  }, [client, loadPublicData]);

  const filteredFeedbacks = useMemo(() => filterFeedback(feedbacks, filters), [feedbacks, filters]);

  const value: FeedbackContextType = {
    client,
    feedbacks,
    departments,
    locations,
    publicSummary,
    filters,
    filteredFeedbacks,
    isLoading,
    error,
    isAdminLoggedIn,
    adminUser,
    refresh,
    addFeedback,
    deleteFeedback,
    resetToDefaultData,
    setFilter,
    resetFilters,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addServiceToDepartment,
    deleteServiceFromDepartment,
    loginAdmin,
    logoutAdmin,
  };

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

/** Convenience for components that only need the data client. */
export function useApiClient(): ApiClient {
  return useFeedback().client;
}

export type { GovernmentService };
