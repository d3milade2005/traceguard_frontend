import { UserSession } from '../types/api';
// Local access placeholder, independent of operational API data. GitHub is deferred.
const localSession: UserSession = { id: 'development', username: 'Local developer', avatar_url: '' };
let localSignedIn = true;
export function triggerGitHubSignIn(nextPath = '/dashboard'): void {
  localSignedIn = true;
  window.location.assign(nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/dashboard');
}
export async function fetchCurrentSession(): Promise<UserSession | null> { return localSignedIn ? localSession : null; }
export async function signOutSession(): Promise<void> { localSignedIn = false; }
