import { Department, FeedbackRecord, LocationInfo } from '@/types/feedback';
import { INITIAL_DEPARTMENTS, KERALA_DISTRICTS } from '@/data/keralaData';
import { MOCK_FEEDBACK_DATA } from '@/data/mockFeedback';

/**
 * Seed/demonstration data for the mock adapter only.
 * Production data access never imports from here.
 */

function cloneDepartments(): Department[] {
  return INITIAL_DEPARTMENTS.map((dept) => ({
    ...dept,
    isActive: dept.isActive ?? true,
    services: dept.services.map((s) => ({ ...s, isActive: s.isActive ?? true })),
  }));
}

function cloneFeedback(): FeedbackRecord[] {
  return MOCK_FEEDBACK_DATA.map((f) => ({
    ...f,
    attachments: f.attachments.map((a) => ({ ...a })),
  }));
}

export function buildSeedLocations(): LocationInfo[] {
  const locations: LocationInfo[] = [];
  for (const district of Object.values(KERALA_DISTRICTS)) {
    for (const taluk of district.taluks) {
      locations.push({
        state: 'Kerala',
        district: district.name,
        localArea: taluk,
        coordinates: district.coordinates,
      });
    }
  }
  return locations;
}

export const SEED_DEPARTMENTS: Department[] = cloneDepartments();
export const SEED_FEEDBACK: FeedbackRecord[] = cloneFeedback();
export const SEED_LOCATIONS: LocationInfo[] = buildSeedLocations();
