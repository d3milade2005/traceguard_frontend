import { Link, useNavigate } from 'react-router-dom';
import { RunSummary } from '../types/api';
import { attentionIssue, formatTime, formatUtcTimestamp, sentenceCase, StatusText } from './StatusText';

export type RunTableView = 'attention' | 'recent' | 'ledger';
export function RunRow({ run, view = 'ledger' }: { run: RunSummary; view?: RunTableView }) {
  const navigate = useNavigate();
  const targetStage = run.analysis_stage === 'compilation' ? 'pytest' : run.analysis_stage ?? 'attribution';
  const href = `/runs/${encodeURIComponent(run.id)}${view === 'attention' ? '?stage=' + targetStage : ''}`;
  return <tr className="run-row" onClick={event => {
    if ((event.target as HTMLElement).closest('a')) return;
    if (event.ctrlKey || event.metaKey) window.open(href, '_blank', 'noopener');
    else navigate(href);
  }}>
    <td className="run-cell"><Link to={href} className="run-link">{run.id}</Link><span className="mobile-run-note run-source">{run.source}</span></td>
    {view === 'attention' ? <td className="issue-cell">{attentionIssue(run)}</td> : <td className="stage-cell"><StatusText value={run.status}/>{run.analysis_status && <div><StatusText value={run.analysis_status}/><span className="muted metadata"> · {run.analysis_stage?.replaceAll('_', ' ')}</span></div>}</td>}
    <td className="agent-cell">{run.responsible_agent ?? <span className="muted">—</span>}</td>
    {view === 'ledger' && <td className="confidence-cell muted">{run.confidence ? sentenceCase(run.confidence) : '—'}</td>}
    <td className="result-cell">{view === 'attention' ? <StatusText value={run.analysis_status ?? run.status}/> : run.validation_verdict ? <StatusText value={run.validation_verdict}/> : <span className="muted">—</span>}</td>
    <td className="time-cell"><time dateTime={run.created_at} title={formatUtcTimestamp(run.created_at)}>{formatTime(run.created_at)}</time></td>
  </tr>;
}
export function RunTable({ runs, view, label }: { runs: RunSummary[]; view: RunTableView; label: string }) {
  return <div className="table-scroll"><table className={`run-table table-${view}`}>
    <caption className="sr-only">{label}. Times in UTC.</caption>
    <thead><tr>{['Run / source', view === 'attention' ? 'Issue' : 'Status / analysis', 'Agent', ...(view === 'ledger' ? ['Confidence'] : []), view === 'attention' ? 'Status' : 'Result', 'Time'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{runs.map(run => <RunRow key={run.id} run={run} view={view}/>)}</tbody>
  </table></div>;
}
