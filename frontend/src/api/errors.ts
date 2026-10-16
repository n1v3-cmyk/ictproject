/**
 * Normalised API error used by the whole application, regardless of which
 * adapter (mock or http) produced it.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isValidation(): boolean {
    return this.status === 400 || this.status === 422;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return firstMessage(value[0]);
  return undefined;
}

/**
 * Turn a DRF error body into an `ApiError`.
 *
 * DRF returns either `{ "detail": "…" }` for non-field errors or
 * `{ "field": ["message", …], … }` for validation errors.
 */
export function normalizeApiError(status: number, body: unknown, fallback: string): ApiError {
  if (isRecord(body)) {
    const detail = firstMessage(body.detail);
    if (detail) return new ApiError(detail, status);

    const fieldErrors: Record<string, string> = {};
    let first = '';
    for (const [key, value] of Object.entries(body)) {
      const message = firstMessage(value);
      if (message) {
        fieldErrors[key] = message;
        if (!first) first = message;
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return new ApiError(first || fallback, status, fieldErrors);
    }
  }
  return new ApiError(fallback, status);
}

/** Wrap an unexpected failure (network, JSON parse) as an `ApiError`. */
export function toApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error && error.message) return new ApiError(error.message, 0);
  return new ApiError(fallback, 0);
}
