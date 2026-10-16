import { Department, FeedbackRecord, GovernmentService, SentimentType } from '@/types/feedback';

let counter = 0;

export function makeFeedback(overrides: Partial<FeedbackRecord> = {}): FeedbackRecord {
  counter += 1;
  const base: FeedbackRecord = {
    id: `fb-${counter}`,
    referenceId: `CC-KL-2026-${1000 + counter}`,
    createdAt: '2026-10-01T10:00:00.000Z',
    location: {
      state: 'Kerala',
      district: 'Ernakulam',
      localArea: 'Kanayannur (Kochi)',
      coordinates: [9.97, 76.28],
    },
    departmentId: 'dept-mvd',
    departmentName: 'Motor Vehicles Department (MVD)',
    serviceId: 'srv-1',
    serviceName: 'Driving License Renewal',
    overallRating: 3,
    categoryRatings: {
      helpfulness: 3,
      communication: 3,
      professionalism: 3,
      responseTime: 3,
    },
    structuredAnswers: {
      timelyDelivery: 'yes',
      processClarity: 'acceptable',
      digitalAccessUsed: true,
    },
    summaryComment: 'Average experience overall at the office.',
    detailedDescription: 'The process took a while but was completed.',
    sentiment: 'neutral' as SentimentType,
    sentimentScore: 50,
    keywords: [],
    isAnonymous: true,
    attachments: [],
  };
  return { ...base, ...overrides };
}

export function makeDepartment(overrides: Partial<Department> = {}): Department {
  const service: GovernmentService = {
    id: 'srv-1',
    name: 'Driving License Renewal',
    code: 'MVD-01',
    description: 'Renew a driving licence.',
    category: 'Transport',
    averageResolutionDays: 3,
    isActive: true,
  };
  return {
    id: 'dept-mvd',
    name: 'Motor Vehicles Department (MVD)',
    code: 'MVD',
    iconName: 'Car',
    description: 'Transport services',
    contactEmail: 'mvd@kerala.gov.in',
    nodalOfficer: 'Officer',
    isActive: true,
    services: [service],
    ...overrides,
  };
}
