export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface CategoryRatings {
  helpfulness: number; // 1-5
  communication: number; // 1-5
  professionalism: number; // 1-5
  responseTime: number; // 1-5
}

export interface StructuredAnswers {
  timelyDelivery: 'yes' | 'minor_delay' | 'significant_delay';
  processClarity: 'very_clear' | 'acceptable' | 'confusing';
  digitalAccessUsed: boolean;
}

export interface FeedbackAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
  isDemo?: boolean;
  /** Present only while the citizen is composing feedback (used for real uploads). */
  file?: File;
}

export interface FeedbackRecord {
  id: string;
  referenceId: string;
  createdAt: string; // ISO string
  location: {
    state: string;
    district: string;
    localArea: string;
    coordinates?: [number, number]; // [lat, lng]
  };
  departmentId: string;
  departmentName: string;
  serviceId: string;
  serviceName: string;
  overallRating: number; // 1-5
  categoryRatings: CategoryRatings;
  structuredAnswers?: StructuredAnswers;
  summaryComment: string;
  detailedDescription: string;
  sentiment: SentimentType;
  sentimentScore: number; // 0 to 100
  keywords: string[];
  isAnonymous: boolean;
  citizenName?: string;
  citizenContact?: string;
  attachments: FeedbackAttachment[];
  adminNotes?: string;
}

export interface GovernmentService {
  id: string;
  name: string;
  code: string;
  description: string;
  averageResolutionDays?: number;
  category: string;
  /** Defaults to true when omitted (seed data omits it). */
  isActive?: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  iconName: string;
  description: string;
  services: GovernmentService[];
  contactEmail: string;
  nodalOfficer: string;
  /** Defaults to true when omitted (seed data omits it). */
  isActive?: boolean;
}

export interface DistrictInfo {
  name: string;
  taluks: string[];
  coordinates: [number, number]; // [latitude, longitude]
}

export interface FilterState {
  district: string;
  localArea: string; // 'all' or an exact local-area/taluk name
  departmentId: string;
  serviceId: string;
  sentiment: string; // 'all' | 'positive' | 'neutral' | 'negative'
  rating: string; // 'all' | '1' | '2' | '3' | '4' | '5'
  dateRange: string; // 'all' | '7days' | '30days' | '90days'
  searchQuery: string;
  anonymousOnly?: boolean;
}

/**
 * The payload a citizen submits. The server resolves department/service names,
 * runs sentiment analysis, and assigns the reference number and timestamps.
 */
export interface NewFeedbackInput {
  location: {
    state: string;
    district: string;
    localArea: string;
    coordinates?: [number, number];
  };
  departmentId: string;
  serviceId: string;
  overallRating: number;
  categoryRatings: CategoryRatings;
  structuredAnswers: StructuredAnswers;
  summaryComment: string;
  detailedDescription: string;
  isAnonymous: boolean;
  citizenName?: string;
  citizenContact?: string;
  attachments: FeedbackAttachment[];
}

/** A location as offered to the citizen selection step. */
export interface LocationInfo {
  state: string;
  district: string;
  localArea: string;
  coordinates?: [number, number];
}
