export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(public status: number, public code: string, public requestId?: string) {
    super('The backend request could not be completed.');
    this.name = 'ApiError';
  }
}
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Allow a cancelled observer (including StrictMode's probe mount) to detach
  // before dispatching a request. Cancellation never becomes an API error.
  await Promise.resolve();
  init?.signal?.throwIfAborted();
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (init?.body) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new ApiError(0, 'BACKEND_UNAVAILABLE');
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const envelope = body && typeof body === 'object' && 'error' in body ? body.error : null;
    const code = envelope && typeof envelope === 'object' && 'code' in envelope && typeof envelope.code === 'string' && /^[A-Z][A-Z0-9_]{0,99}$/.test(envelope.code) ? envelope.code : `HTTP_${response.status}`;
    throw new ApiError(response.status, code, response.headers.get('X-Request-ID') ?? undefined);
  }
  if (response.status === 204) return undefined as T;
  try { return await response.json() as T; }
  catch { throw new ApiError(response.status, 'INVALID_RESPONSE'); }
}
