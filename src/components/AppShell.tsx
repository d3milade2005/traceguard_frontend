import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Cpu, LayoutDashboard, ListTree, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useSession, useSignOut } from '../api/queries';
import { Brand, EmptyState, ThemeControl } from './UI';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isLoading } = useSession();
  const signOut = useSignOut();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (mobileMenuOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [mobileMenuOpen]);
  useEffect(() => setMobileMenuOpen(false), [location.pathname]);
  if (isLoading) return <EmptyState title="Loading workspace…" />;
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  const handleSignOut = async () => { await signOut.mutateAsync(); navigate('/'); };
  const runPage = location.pathname.startsWith('/runs/');
  const title = location.pathname.startsWith('/runs') ? 'Runs' : location.pathname.startsWith('/system') ? 'System' : 'Dashboard';
  const navigation = (compact: boolean) => <>
    <div className="sidebar-brand">
      {compact ? <Link to="/dashboard" aria-label="TraceGuard dashboard" className="brand-symbol">TG</Link> : <Brand to="/dashboard" />}
    </div>
    {!compact && (
      <div className="sidebar-workspace">
        <span className="workspace-badge" aria-hidden="true">TG</span>
        <div className="workspace-meta">
          <span className="workspace-name">Multi-Agent Prod</span>
          <span className="workspace-scope">Production</span>
        </div>
      </div>
    )}
    <nav className="sidebar-nav" aria-label="Main navigation">
      <NavLink to="/dashboard" title="Dashboard"><LayoutDashboard size={16} />{!compact && <span>Dashboard</span>}</NavLink>
      <NavLink to="/runs" title="Runs"><ListTree size={16} />{!compact && <span>Runs</span>}</NavLink>
      {!compact && <div className="nav-group">Resources</div>}
      <NavLink to="/docs/introduction" title="Documentation"><BookOpen size={16} />{!compact && <span>Documentation</span>}</NavLink>
      <NavLink to="/system" title="System"><Cpu size={16} />{!compact && <span>System</span>}</NavLink>
    </nav>
    <div className="account">
      <span className="avatar" aria-hidden="true">{session.username.slice(0, 1).toUpperCase()}</span>
      {!compact && (
        <div className="account-details">
          <span className="account-name">{session.username}</span>
          <span className="account-role">Engineer</span>
        </div>
      )}
      <button type="button" className="icon-button" aria-label="Sign out" title="Sign out" onClick={handleSignOut} disabled={signOut.isPending}><LogOut size={15} /></button>
    </div>
  </>;
  return <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="sidebar">{navigation(collapsed)}</aside>
    <dialog ref={dialog} className="mobile-drawer" onCancel={() => setMobileMenuOpen(false)} onClick={e => { if (e.target === dialog.current) setMobileMenuOpen(false); }}>
      <button className="icon-button drawer-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><X size={18} /></button>
      {navigation(false)}
    </dialog>
    <div className="app-body">
      <header className="topbar">
        <div className="topbar-start">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Toggle menu" aria-expanded={mobileMenuOpen}><Menu size={18} /></button>
          <button className="icon-button sidebar-toggle" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <nav aria-label="Breadcrumb" className="breadcrumb">{runPage ? <><Link to="/runs">Runs</Link><span aria-hidden="true">/</span><span>Run details</span></> : <span>{title}</span>}</nav>
        </div>
        <div className="topbar-end">
          <div className="topbar-telemetry" title="Automated verification pipeline is listening">
            <span className="telemetry-dot" aria-hidden="true" />
            <span className="telemetry-label">Pipeline active</span>
          </div>
          <ThemeControl />
        </div>
      </header>
      <main id="main-content" className="app-main" tabIndex={-1}><Outlet /></main>
    </div>
  </div>;
}

