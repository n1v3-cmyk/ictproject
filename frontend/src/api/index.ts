import { ApiClient } from '@/api/client';
import { API_MODE } from '@/lib/config';
import { httpClient } from '@/api/httpClient';
import { mockClient } from '@/api/mock/mockClient';

let instance: ApiClient | null = null;

/**
 * The application's data-access client.
 *
 * Selected once via `NEXT_PUBLIC_API_MODE`:
 *   - `mock` (default): in-browser demo adapter
 *   - `http`: the real Django/DRF backend
 *
 * Because both implement `ApiClient`, no UI code changes when switching.
 */
export function getApiClient(): ApiClient {
  if (!instance) {
    instance = API_MODE === 'http' ? httpClient : mockClient;
  }
  return instance;
}

export { mockClient, httpClient };
export { DEMO_CREDENTIALS } from '@/api/mock/mockClient';
export type { ApiClient };
