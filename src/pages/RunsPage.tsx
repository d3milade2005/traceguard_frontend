import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { RunsFilterParams, useRunsList } from '../api/queries';
import { RunTable } from '../components/RunRow';
import { EmptyState, QueryError } from '../components/UI';

export function RunsPage() {
  const [url] = useSearchParams();
  const [agent, setAgent] = useState('');
  const [appliedAgent, setAppliedAgent] = useState('');
  const [status, setStatus] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [verdict, setVerdict] = useState('');
  const [attention, setAttention] = useState(url.get('needs_attention') === 'true');
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const query = useRunsList({
    limit, offset: (page - 1) * limit,
    status: status as RunsFilterParams['status'] || undefined,
    analysis_status: analysis as RunsFilterParams['analysis_status'] || undefined,
    responsible_agent: appliedAgent || undefined,
    validation_verdict: verdict as RunsFilterParams['validation_verdict'] || undefined,
    needs_attention: attention || undefined,
  });
  const { data, isLoading, isError, refetch, isFetching } = query;
  useEffect(() => {
    // Offset reads are live: rows can disappear while the user is on a later page.
    if (data && data.offset >= data.total && page > 1) setPage(Math.max(1, Math.ceil(data.total / data.limit)));
  }, [data, page]);
  const filtered = Boolean(appliedAgent || status || analysis || verdict || attention);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  return <div className="page runs-page">
    <header className="page-heading"><div><h1>Runs</h1><p>Execution ledger, attribution confidence, and verified regressions.</p></div><span className="muted metadata" aria-live="polite">{data ? `${data.total} runs` : ''}</span></header>
    <div className="ledger-card">
      <div className="runs-toolbar">
        <form className="search-field" onSubmit={e => { e.preventDefault(); setAppliedAgent(agent.trim()); setPage(1); }}>
          <Search size={15} aria-hidden="true" /><input type="search" maxLength={200} aria-label="Exact responsible agent" value={agent} onChange={e => { setAgent(e.target.value); if (!e.target.value) { setAppliedAgent(''); setPage(1); } }} placeholder="Exact agent identity…"/><button className="text-link" type="submit">Apply</button>
        </form>
        <div className="toolbar-filters">
          <div className="select-wrapper"><select aria-label="Filter by run status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Status: All</option>{['pending', 'queued', 'processing', 'normalized', 'failed'].map(value => <option key={value} value={value}>{value}</option>)}</select></div>
          <div className="select-wrapper"><select aria-label="Filter by analysis" value={analysis} onChange={e => { setAnalysis(e.target.value); setPage(1); }}><option value="">Analysis: All</option>{['active', 'completed', 'review_required', 'failed'].map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></div>
          <div className="select-wrapper"><select aria-label="Filter by result" value={verdict} onChange={e => { setVerdict(e.target.value); setPage(1); }}><option value="">Result: All</option><option value="valid">Valid</option><option value="not_reproduced">Not reproduced</option><option value="not_discriminating">Not discriminating</option><option value="inconclusive">Inconclusive</option></select></div>
          <label><input type="checkbox" checked={attention} onChange={e => { setAttention(e.target.checked); setPage(1); }}/> Needs attention</label>
        </div>
      </div>
      {isError ? <QueryError title="Unable to load runs." query={query}/> : isLoading ? <EmptyState title="Loading runs…"/> : data?.items.length ? <RunTable runs={data.items} view="ledger" label="Runs"/> : <EmptyState title={filtered ? 'No matching runs' : data?.total === 0 ? 'No runs yet' : 'No runs on this page'} description="Adjust the filters or return to the previous page."/>}
      <footer className="pagination"><span>{data ? `Page ${Math.floor(data.offset / data.limit) + 1} of ${pages} · ${data.total} runs` : ''}</span><div>
        <select aria-label="Runs per page" value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>{[10, 20, 50, 100].map(size => <option key={size} value={size}>{size} per page</option>)}</select>
        <button className="button button-quiet" disabled={page <= 1 || isFetching} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14}/>Previous</button>
        <button className="button button-quiet" disabled={!data || data.offset + data.limit >= data.total || isFetching || page * limit > 100000} onClick={() => setPage(p => p + 1)}>Next<ChevronRight size={14}/></button>
        {!isFetching && <button className="text-link" onClick={() => void refetch()}>Refresh</button>}
      </div></footer>
    </div>
  </div>;
}
