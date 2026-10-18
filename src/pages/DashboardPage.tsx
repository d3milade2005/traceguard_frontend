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
    <dl className="metric-strip">
      {[['Total runs', metrics.total_runs], ['Active', metrics.active_analyses], ['Needs review', metrics.review_required], ['Valid regressions', metrics.valid_regressions]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    <section className="attention-section" aria-labelledby="attention-heading">
      <div className="section-heading"><div><h2 id="attention-heading">Needs attention <span className="count">{needs_attention.length}</span></h2><p>Start here. These runs need a closer look.</p></div></div>
      {needs_attention.length ? <RunTable runs={needs_attention} view="attention" label="Runs needing attention" /> : <EmptyState title="No review required" description="All analyzed runs are currently resolved." />}
    </section>
    <section className="recent-section" aria-labelledby="recent-heading">
      <div className="section-heading"><h2 id="recent-heading">Recent runs</h2><Link className="text-link" to="/runs">View all runs<ArrowRight size={14} /></Link></div>
      {recent_runs.length ? <RunTable runs={recent_runs} view="recent" label="Recent runs" /> : <EmptyState title="No runs yet" description="TraceGuard will list failed executions here once they are ingested." />}
    </section>
  </div>;
}

