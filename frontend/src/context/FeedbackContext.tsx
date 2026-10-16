'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  FeedbackRecord,
  Department,
  FilterState,
  GovernmentService,
} from '@/types/feedback';
import { MOCK_FEEDBACK_DATA } from '@/data/mockFeedback';
import { INITIAL_DEPARTMENTS } from '@/data/keralaData';
import { analyzeSentiment } from '@/lib/sentimentAnalyzer';

interface FeedbackContextType {
  feedbacks: FeedbackRecord[];
  departments: Department[];
  filters: FilterState;
  filteredFeedbacks: FeedbackRecord[];
  isAdminLoggedIn: boolean;
  addFeedback: (record: Omit<FeedbackRecord, 'id' | 'referenceId' | 'createdAt' | 'sentiment' | 'sentimentScore' | 'keywords'>) => FeedbackRecord;
  deleteFeedback: (id: string) => void;
  resetToDefaultData: () => void;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  addDepartment: (dept: Omit<Department, 'id'>) => void;
  updateDepartment: (dept: Department) => void;
  deleteDepartment: (id: string) => void;
  addServiceToDepartment: (deptId: string, service: Omit<GovernmentService, 'id'>) => void;
  deleteServiceFromDepartment: (deptId: string, serviceId: string) => void;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  district: 'all',
  departmentId: 'all',
  serviceId: 'all',
  sentiment: 'all',
  rating: 'all',
  dateRange: 'all',
  searchQuery: '',
};

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

const STORAGE_KEY_FEEDBACKS = 'civicconnect_feedbacks_v1';
const STORAGE_KEY_DEPARTMENTS = 'civicconnect_departments_v1';
const STORAGE_KEY_AUTH = 'civicconnect_admin_auth_v1';

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>(MOCK_FEEDBACK_DATA);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedFeedbacks = localStorage.getItem(STORAGE_KEY_FEEDBACKS);
        if (savedFeedbacks) {
          const parsed = JSON.parse(savedFeedbacks);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFeedbacks(parsed);
          }
        }

        const savedDepartments = localStorage.getItem(STORAGE_KEY_DEPARTMENTS);
        if (savedDepartments) {
          const parsedDepts = JSON.parse(savedDepartments);
          if (Array.isArray(parsedDepts) && parsedDepts.length > 0) {
            setDepartments(parsedDepts);
          }
        }

        const authStatus = localStorage.getItem(STORAGE_KEY_AUTH);
        if (authStatus === 'true') {
          setIsAdminLoggedIn(true);
        }
      }
    } catch (err) {
      console.error('Error loading civic data from localStorage:', err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save feedbacks to localStorage
  const persistFeedbacks = (updated: FeedbackRecord[]) => {
    setFeedbacks(updated);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_FEEDBACKS, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed saving feedbacks to localStorage:', e);
    }
  };

  // Save departments to localStorage
  const persistDepartments = (updated: Department[]) => {
    setDepartments(updated);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_DEPARTMENTS, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed saving departments to localStorage:', e);
    }
  };

  // Add new feedback
  const addFeedback = (record: Omit<FeedbackRecord, 'id' | 'referenceId' | 'createdAt' | 'sentiment' | 'sentimentScore' | 'keywords'>): FeedbackRecord => {
    const id = `fb-${Date.now()}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceId = `CC-KL-2026-${randomSuffix}`;
    const createdAt = new Date().toISOString();

    const categoryAvg = (
      record.categoryRatings.helpfulness +
      record.categoryRatings.communication +
      record.categoryRatings.professionalism +
      record.categoryRatings.responseTime
    ) / 4;

    const analysis = analyzeSentiment(
      `${record.summaryComment} ${record.detailedDescription}`,
      record.overallRating,
      categoryAvg
    );

    const fullRecord: FeedbackRecord = {
      ...record,
      id,
      referenceId,
      createdAt,
      sentiment: analysis.sentiment,
      sentimentScore: analysis.score,
      keywords: analysis.detectedKeywords,
    };

    const updated = [fullRecord, ...feedbacks];
    persistFeedbacks(updated);
    return fullRecord;
  };

  const deleteFeedback = (id: string) => {
    const updated = feedbacks.filter((f) => f.id !== id);
    persistFeedbacks(updated);
  };

  const resetToDefaultData = () => {
    persistFeedbacks(MOCK_FEEDBACK_DATA);
    persistDepartments(INITIAL_DEPARTMENTS);
    setFilters(DEFAULT_FILTERS);
  };

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // If department changed, reset serviceId unless it's valid
      ...(key === 'departmentId' ? { serviceId: 'all' } : {}),
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Department management
  const addDepartment = (dept: Omit<Department, 'id'>) => {
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}`,
    };
    persistDepartments([...departments, newDept]);
  };

  const updateDepartment = (updatedDept: Department) => {
    persistDepartments(departments.map((d) => (d.id === updatedDept.id ? updatedDept : d)));
  };

  const deleteDepartment = (id: string) => {
    persistDepartments(departments.filter((d) => d.id !== id));
  };

  const addServiceToDepartment = (deptId: string, service: Omit<GovernmentService, 'id'>) => {
    const updated = departments.map((dept) => {
      if (dept.id !== deptId) return dept;
      const newService: GovernmentService = {
        ...service,
        id: `srv-${Date.now()}`,
      };
      return {
        ...dept,
        services: [...dept.services, newService],
      };
    });
    persistDepartments(updated);
  };

  const deleteServiceFromDepartment = (deptId: string, serviceId: string) => {
    const updated = departments.map((dept) => {
      if (dept.id !== deptId) return dept;
      return {
        ...dept,
        services: dept.services.filter((s) => s.id !== serviceId),
      };
    });
    persistDepartments(updated);
  };

  // Admin auth
  const loginAdmin = (password: string): boolean => {
    // Demo prototype login
    if (password === 'DemoAdmin@2026' || password === 'admin' || password === 'demo') {
      setIsAdminLoggedIn(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_AUTH, 'true');
      }
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  };

  // Memoized filtered feedback records
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      // District filter
      if (filters.district !== 'all' && item.location.district !== filters.district) {
        return false;
      }

      // Department filter
      if (filters.departmentId !== 'all' && item.departmentId !== filters.departmentId) {
        return false;
      }

      // Service filter
      if (filters.serviceId !== 'all' && item.serviceId !== filters.serviceId) {
        return false;
      }

      // Sentiment filter
      if (filters.sentiment !== 'all' && item.sentiment !== filters.sentiment) {
        return false;
      }

      // Rating filter
      if (filters.rating !== 'all' && item.overallRating !== Number(filters.rating)) {
        return false;
      }

      // Search Query filter (matches referenceId, summary, description, citizenName, serviceName)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesRef = item.referenceId.toLowerCase().includes(query);
        const matchesSummary = item.summaryComment.toLowerCase().includes(query);
        const matchesDesc = item.detailedDescription.toLowerCase().includes(query);
        const matchesService = item.serviceName.toLowerCase().includes(query);
        const matchesDept = item.departmentName.toLowerCase().includes(query);
        const matchesDistrict = item.location.district.toLowerCase().includes(query);
        const matchesArea = item.location.localArea.toLowerCase().includes(query);
        const matchesCitizen = item.citizenName?.toLowerCase().includes(query) ?? false;

        if (!matchesRef && !matchesSummary && !matchesDesc && !matchesService && !matchesDept && !matchesDistrict && !matchesArea && !matchesCitizen) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const itemDate = new Date(item.createdAt).getTime();
        const now = new Date().getTime();
        const daysDiff = (now - itemDate) / (1000 * 60 * 60 * 24);

        if (filters.dateRange === '7days' && daysDiff > 7) return false;
        if (filters.dateRange === '30days' && daysDiff > 30) return false;
        if (filters.dateRange === '90days' && daysDiff > 90) return false;
      }

      return true;
    });
  }, [feedbacks, filters]);

  return (
    <FeedbackContext.Provider
      value={{
        feedbacks,
        departments,
        filters,
        filteredFeedbacks,
        isAdminLoggedIn,
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
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
