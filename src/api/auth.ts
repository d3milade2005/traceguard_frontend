import { UserSession } from '../types/api';
import { apiFetch, USE_MOCK_API } from './client';
import { MOCK_USER_SESSION } from './mockData';

/**
 * Isolated GitHub OAuth & Session API Module
 *
 * Security Rules:
 * - No OAuth tokens or JWTs are ever stored in localStorage.
 * - Real authentication uses backend-owned HTTP-only session cookies.
 * - In mock development mode, a lightweight in-memory flag simulates sign-in/sign-out.
 */

let mockSignedIn = true;

export function getGitHubSignInUrl(nextPath = '/dashboard'): string {
  // TODO(backend-integration): Verify exact query param name (`next` vs `redirect_to`) in FastAPI auth route
  return `/api/v1/auth/github?next=${encodeURIComponent(nextPath)}`;
}

export function triggerGitHubSignIn(nextPath = '/dashboard'): void {
  if (USE_MOCK_API) {
    mockSignedIn = true;
    window.location.assign(nextPath);
    return;
  }
  window.location.assign(getGitHubSignInUrl(nextPath));
}

export async function fetchCurrentSession(): Promise<UserSession | null> {
  if (USE_MOCK_API) {
    return mockSignedIn ? MOCK_USER_SESSION : null;
  }

  try {
    // TODO(backend-integration): Confirm response fields of GET /api/v1/auth/me
    return await apiFetch<UserSession>('/api/v1/auth/me');
  } catch {
    return null;
  }
}

export async function signOutSession(): Promise<void> {
  if (USE_MOCK_API) {
    mockSignedIn = false;
    return;
  }

  // TODO(backend-integration): Confirm POST /api/v1/auth/logout clears HTTP-only session cookie
  await apiFetch<void>('/api/v1/auth/logout', { method: 'POST' });
}
