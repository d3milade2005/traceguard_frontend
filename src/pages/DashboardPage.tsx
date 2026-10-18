import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useDashboardSummary } from '../api/queries';
import { RunTable } from '../components/RunRow';
import { EmptyState } from '../components/UI';

export function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDashboardSummary();
  if (isError) return <EmptyState title="Unable to load dashboard" retry={() => void refetch()} />;
  if (isLoading || !data) return <EmptyState title="Loading dashboard…" />;
  const { metrics, needs_attention, recent_runs } = data;
  return <div className="page dashboard-page">
    <header className="page-heading"><div><h1>Dashboard</h1><p>A clear view of your multi-agent executions.</p></div><button className="button button-quiet" onClick={() => void refetch()} disabled={isFetching}><RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />Refresh</button></header>
    <div className="dashboard-metrics-grid" role="region" aria-label="Operational summary">
      <div className="metric-card">
        <div className="metric-header"><span className="metric-label">Total runs</span></div>
        <div className="metric-value">{metrics.total_runs}</div>
        <div className="metric-subtext">Ingested multi-agent traces</div>
      </div>
      <div className="metric-card">
        <div className="metric-header"><span className="metric-label">Active analyses</span><span className="metric-indicator-active" aria-hidden="true" /></div>
        <div className="metric-value">{metrics.active_analyses}</div>
        <div className="metric-subtext">Running attribution pipeline</div>
      </div>
      <div className="metric-card metric-card-warning">
        <div className="metric-header"><span className="metric-label">Needs review</span></div>
        <div className="metric-value text-amber">{metrics.review_required}</div>
        <div className="metric-subtext">Anomalies or unverified regressions</div>
      </div>
      <div className="metric-card metric-card-success">
        <div className="metric-header"><span className="metric-label">Valid regressions</span></div>
        <div className="metric-value text-green">{metrics.valid_regressions}</div>
        <div className="metric-subtext">Verified pytest suites</div>
      </div>
    </div>
    <section className="attention-section" aria-labelledby="attention-heading">
      <div className="section-heading">
        <div>
          <h2 id="attention-heading">Needs attention <span className="count">{needs_attention.length}</span></h2>
          <p>Prioritized failures and regressions requiring engineer review.</p>
        </div>
      </div>
      <div className="attention-surface">
        {needs_attention.length ? <RunTable runs={needs_attention} view="attention" label="Runs needing attention" /> : <EmptyState title="No review required" description="All analyzed runs are currently resolved." />}
      </div>
    </section>
    <section className="recent-section" aria-labelledby="recent-heading">
      <div className="section-heading">
        <div>
          <h2 id="recent-heading">Recent activity</h2>
          <p>Latest execution pipeline runs.</p>
        </div>
        <Link className="text-link" to="/runs">View all runs<ArrowRight size={14} /></Link>
      </div>
      <div className="recent-surface">
        {recent_runs.length ? <RunTable runs={recent_runs} view="recent" label="Recent runs" /> : <EmptyState title="No runs yet" description="TraceGuard will list failed executions here once they are ingested." />}
      </div>
    </section>
  </div>;
}

