/**
 * Frontend runtime configuration, read from NEXT_PUBLIC_* environment variables.
 * No secrets belong here — these values are embedded in the client bundle.
 */

export type ApiMode = 'mock' | 'http';

const rawMode = process.env.NEXT_PUBLIC_API_MODE;
const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * `mock` (default) serves the app from an in-browser adapter.
 * `http` talks to the real Django/DRF backend.
 */
export const API_MODE: ApiMode = rawMode === 'http' ? 'http' : 'mock';

/** Base URL of the Django API, without a trailing slash. */
export const API_BASE_URL: string = (rawBaseUrl && rawBaseUrl.trim().length > 0
  ? rawBaseUrl.trim()
  : 'http://localhost:8000/api/v1'
).replace(/\/+$/, '');

export const APP_NAME = 'CivicConnect';
