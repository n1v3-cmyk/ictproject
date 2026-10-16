import { describe, expect, it } from 'vitest';
import {
  MAX_ATTACHMENT_BYTES,
  hasErrors,
  validateAttachment,
  validateDescription,
  validateRatings,
  validateSelection,
} from '@/domain/validation';

describe('validateSelection', () => {
  it('accepts a complete, valid selection', () => {
    const errors = validateSelection({
      district: 'Ernakulam',
      localArea: 'Kanayannur (Kochi)',
      departmentId: 'dept-mvd',
      serviceId: 'srv-1',
    });
    expect(hasErrors(errors)).toBe(false);
  });

  it('requires district, area, department and service', () => {
    const errors = validateSelection({
      district: '',
      localArea: '',
      departmentId: 'all',
      serviceId: 'all',
    });
    expect(errors.district).toBeDefined();
    expect(errors.localArea).toBeDefined();
    expect(errors.departmentId).toBeDefined();
    expect(errors.serviceId).toBeDefined();
  });
});

describe('validateRatings', () => {
  it('rejects an out-of-range overall rating', () => {
    expect(
      validateRatings({ overallRating: 0, summaryComment: 'A valid long comment', isAnonymous: true }).overallRating
    ).toBeDefined();
    expect(
      validateRatings({ overallRating: 6, summaryComment: 'A valid long comment', isAnonymous: true }).overallRating
    ).toBeDefined();
  });

  it('enforces summary comment length bounds', () => {
    expect(
      validateRatings({ overallRating: 4, summaryComment: 'short', isAnonymous: true }).summaryComment
    ).toBeDefined();
    expect(
      validateRatings({ overallRating: 4, summaryComment: 'x'.repeat(400), isAnonymous: true }).summaryComment
    ).toBeDefined();
    expect(
      validateRatings({ overallRating: 4, summaryComment: 'This is a reasonable summary.', isAnonymous: true })
        .summaryComment
    ).toBeUndefined();
  });

  it('requires a name for identified submissions only', () => {
    expect(
      validateRatings({ overallRating: 4, summaryComment: 'A valid long comment', isAnonymous: false })
        .citizenName
    ).toBeDefined();
    expect(
      validateRatings({
        overallRating: 4,
        summaryComment: 'A valid long comment',
        isAnonymous: false,
        citizenName: 'Anita',
      }).citizenName
    ).toBeUndefined();
    expect(
      validateRatings({ overallRating: 4, summaryComment: 'A valid long comment', isAnonymous: true }).citizenName
    ).toBeUndefined();
  });
});

describe('validateDescription', () => {
  it('allows an empty description but caps length', () => {
    expect(hasErrors(validateDescription({ detailedDescription: '' }))).toBe(false);
    expect(hasErrors(validateDescription({ detailedDescription: 'x'.repeat(6000) }))).toBe(true);
  });
});

describe('validateAttachment', () => {
  it('accepts supported types within the size limit', () => {
    expect(
      validateAttachment({ name: 'a.png', type: 'image/png', size: 1024 })
    ).toBeNull();
  });

  it('rejects oversized files', () => {
    expect(
      validateAttachment({ name: 'big.pdf', type: 'application/pdf', size: MAX_ATTACHMENT_BYTES + 1 })
    ).toContain('limit');
  });

  it('rejects unsupported formats', () => {
    expect(
      validateAttachment({ name: 'script.exe', type: 'application/x-msdownload', size: 100 })
    ).toContain('unsupported');
  });
});
