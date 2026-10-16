import { MAX_RATING } from '@/domain/ratings';

/** Attachment constraints — mirrored on the server, which remains authoritative. */
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_ATTACHMENTS = 5;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'video/mp4',
] as const;

export const SUMMARY_MIN = 10;
export const SUMMARY_MAX = 300;
export const DESCRIPTION_MAX = 5000;

export type ValidationErrors = Record<string, string>;

export interface LocationSelection {
  district: string;
  localArea: string;
  departmentId: string;
  serviceId: string;
}

export interface RatingInput {
  overallRating: number;
  summaryComment: string;
  isAnonymous: boolean;
  citizenName?: string;
}

export interface DescriptionInput {
  detailedDescription?: string;
}

function isRating(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MAX_RATING;
}

export function validateSelection(input: LocationSelection): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.district || input.district === 'all') errors.district = 'Please select a district.';
  if (!input.localArea) errors.localArea = 'Please select a local area or taluk.';
  if (!input.departmentId || input.departmentId === 'all') {
    errors.departmentId = 'Please select a government department.';
  }
  if (!input.serviceId || input.serviceId === 'all') {
    errors.serviceId = 'Please select a specific service.';
  }
  return errors;
}

export function validateRatings(input: RatingInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!isRating(input.overallRating)) {
    errors.overallRating = 'Please provide an overall rating between 1 and 5.';
  }
  const comment = input.summaryComment.trim();
  if (!comment) {
    errors.summaryComment = 'Please provide a short summary comment.';
  } else if (comment.length < SUMMARY_MIN) {
    errors.summaryComment = `Summary comment should be at least ${SUMMARY_MIN} characters.`;
  } else if (comment.length > SUMMARY_MAX) {
    errors.summaryComment = `Summary comment should be at most ${SUMMARY_MAX} characters.`;
  }
  if (!input.isAnonymous && !(input.citizenName ?? '').trim()) {
    errors.citizenName = 'Please enter your name for an identified submission.';
  }
  return errors;
}

export function validateDescription(input: DescriptionInput): ValidationErrors {
  const errors: ValidationErrors = {};
  const description = (input.detailedDescription ?? '').trim();
  if (description.length > DESCRIPTION_MAX) {
    errors.detailedDescription = `Description should be at most ${DESCRIPTION_MAX} characters.`;
  }
  return errors;
}

/** Returns an error message for an unacceptable file, or null when it is fine. */
export function validateAttachment(file: { name: string; type: string; size: number }): string | null {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `"${file.name}" exceeds the ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB limit.`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return `"${file.name}" is an unsupported format. Use JPG, PNG, WebP, PDF, or MP4.`;
  }
  return null;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
