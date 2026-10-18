/**
 * Shared HTTP Client & Mock Toggle
 *
 * Set `VITE_USE_MOCK_API=false` in `.env` when connecting to the live FastAPI backend.
 * Defaults to `true` during initial frontend visual foundation work.
 */

export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Always send HTTP-only session cookies; never read tokens from localStorage
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `API request failed: ${response.status} ${path}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
