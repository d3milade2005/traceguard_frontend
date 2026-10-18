import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Github } from 'lucide-react';
import { triggerGitHubSignIn } from '../api/auth';
import { useSession } from '../api/queries';
import { Brand, ThemeControl } from '../components/UI';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';
  const { data: session } = useSession();
  if (session) return <Navigate to={nextPath} replace />;
  return <div className="login-page"><div className="login-theme"><ThemeControl /></div><main id="main-content" className="login-content"><Brand /><h1>Sign in to TraceGuard</h1><p>Sign in to inspect failed multi-agent runs.</p><button className="button button-primary" onClick={() => triggerGitHubSignIn(nextPath)}><Github size={16} />Continue with GitHub</button><Link to="/docs/introduction" className="text-link">Documentation</Link></main></div>;
}

