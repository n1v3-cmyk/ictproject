import { Department, FeedbackRecord } from '@/types/feedback';
import { SEED_DEPARTMENTS, SEED_FEEDBACK } from './seed';

/**
 * localStorage-backed persistence for the mock adapter.
 * This is the ONLY place in the frontend that reads or writes localStorage for
 * application data; swapping to the real API removes the need for it entirely.
 */

const KEY_FEEDBACK = 'civicconnect.feedback.v2';
const KEY_DEPARTMENTS = 'civicconnect.departments.v2';

interface MockState {
  feedback: FeedbackRecord[];
  departments: Department[];
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or blocked; the in-memory copy still works for this session.
  }
}

let memory: MockState | null = null;

function load(): MockState {
  if (memory) return memory;

  const storedFeedback = readJson<FeedbackRecord[]>(KEY_FEEDBACK);
  const storedDepartments = readJson<Department[]>(KEY_DEPARTMENTS);

  memory = {
    feedback: Array.isArray(storedFeedback) ? storedFeedback : SEED_FEEDBACK.map((f) => ({ ...f })),
    departments: Array.isArray(storedDepartments)
      ? storedDepartments
      : SEED_DEPARTMENTS.map((d) => ({ ...d, services: d.services.map((s) => ({ ...s })) })),
  };
  return memory;
}

export function getState(): MockState {
  return load();
}

export function setFeedback(feedback: FeedbackRecord[]): void {
  const state = load();
  state.feedback = feedback;
  writeJson(KEY_FEEDBACK, feedback);
}

export function setDepartments(departments: Department[]): void {
  const state = load();
  state.departments = departments;
  writeJson(KEY_DEPARTMENTS, departments);
}

export function resetState(): void {
  memory = {
    feedback: SEED_FEEDBACK.map((f) => ({ ...f })),
    departments: SEED_DEPARTMENTS.map((d) => ({ ...d, services: d.services.map((s) => ({ ...s })) })),
  };
  writeJson(KEY_FEEDBACK, memory.feedback);
  writeJson(KEY_DEPARTMENTS, memory.departments);
}

/** Browser-only helper: clear persisted state so the next load starts from the seed. */
export function clearPersistedState(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEY_FEEDBACK);
  window.localStorage.removeItem(KEY_DEPARTMENTS);
  memory = null;
}
