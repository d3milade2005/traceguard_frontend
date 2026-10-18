import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useRunsList } from '../api/queries';
import { RunTable } from '../components/RunRow';
import { EmptyState } from '../components/UI';

export function RunsPage() {
  const [search, setSearch] = useState('');
  const [confidence, setConfidence] = useState('all');
  const [verdict, setVerdict] = useState('all');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useRunsList({ search, confidence, verdict, page });
  return <div className="page">
    <header className="page-heading"><div><h1>Runs</h1><p>Inspect executions, follow the evidence, and verify regressions.</p></div><span className="muted metadata" aria-live="polite">{data ? `${data.total} runs` : ''}</span></header>
    <div className="runs-toolbar">
      <div className="search-field"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search runs by ID or agent" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search runs by ID or agent…" /></div>
      <select value={verdict} onChange={e => { setVerdict(e.target.value); setPage(1); }} aria-label="Filter by result"><option value="all">Result: All</option><option value="validated">Valid</option><option value="unverified">Needs review</option><option value="compile_error">Compilation failed</option><option value="pending">Pending</option></select>
      <select value={confidence} onChange={e => { setConfidence(e.target.value); setPage(1); }} aria-label="Filter by attribution confidence"><option value="all">Confidence: All</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
    </div>
    {isError ? <EmptyState title="Unable to load runs" retry={() => void refetch()} /> : isLoading ? <EmptyState title="Loading runs…" /> : data?.items.length ? <RunTable runs={data.items} view="ledger" label="Runs" /> : <EmptyState title={search || confidence !== 'all' || verdict !== 'all' ? 'No matching runs' : 'No runs yet'} description={search || confidence !== 'all' || verdict !== 'all' ? 'Try a different search or clear your filters.' : 'TraceGuard will list failed executions here once they are ingested.'} />}
    {Boolean(data?.items.length) && <footer className="pagination"><span>Page {page} of 1</span><div><button className="button button-quiet" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft size={14} />Previous</button><button className="button button-quiet" disabled><span>Next</span><ChevronRight size={14} /></button></div></footer>}
  </div>;
}

