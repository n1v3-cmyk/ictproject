import { describe, expect, it } from 'vitest';
import { ApiError, normalizeApiError, toApiError } from '@/api/errors';

describe('normalizeApiError', () => {
  it('maps a DRF detail error', () => {
    const error = normalizeApiError(401, { detail: 'Authentication credentials were not provided.' }, 'fallback');
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.isUnauthorized).toBe(true);
    expect(error.message).toContain('Authentication');
  });

  it('maps DRF field validation errors', () => {
    const error = normalizeApiError(
      400,
      { overall_rating: ['Ensure this value is between 1 and 5.'], summary_comment: ['This field may not be blank.'] },
      'fallback'
    );
    expect(error.status).toBe(400);
    expect(error.isValidation).toBe(true);
    expect(error.fieldErrors?.overall_rating).toContain('between 1 and 5');
    expect(error.fieldErrors?.summary_comment).toContain('blank');
  });

  it('falls back for an unknown body shape', () => {
    const error = normalizeApiError(500, null, 'Server exploded');
    expect(error.message).toBe('Server exploded');
    expect(error.status).toBe(500);
  });

  it('unwraps nested array messages', () => {
    const error = normalizeApiError(400, { field: [['deep message']] }, 'fallback');
    expect(error.fieldErrors?.field).toBe('deep message');
  });
});

describe('toApiError', () => {
  it('passes ApiError through unchanged', () => {
    const original = new ApiError('nope', 403);
    expect(toApiError(original)).toBe(original);
  });

  it('wraps a generic Error with status 0', () => {
    const wrapped = toApiError(new Error('network down'));
    expect(wrapped.status).toBe(0);
    expect(wrapped.message).toBe('network down');
  });

  it('uses the fallback for non-errors', () => {
    expect(toApiError('weird', 'fallback message').message).toBe('fallback message');
  });
});
