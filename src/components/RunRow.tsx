import { Link, useNavigate } from 'react-router-dom';
import { RunSummary } from '../types/api';
import { attentionIssue, formatTime, formatUtcTimestamp, sentenceCase, stageLabels, StatusText } from './StatusText';

export type RunTableView = 'attention' | 'recent' | 'ledger';
export function RunRow({ run, view = 'ledger' }: { run: RunSummary; view?: RunTableView }) {
  const navigate = useNavigate();
  const targetStage = run.validation_verdict === 'compile_error' ? 'pytest' : run.validation_verdict === 'unverified' ? 'validation' : 'attribution';
  const href = `/runs/${encodeURIComponent(run.run_id)}${view === 'attention' ? '?stage=' + targetStage : ''}`;
  return <tr className="run-row" onClick={event => {
    if ((event.target as HTMLElement).closest('a')) return;
    if (event.ctrlKey || event.metaKey) window.open(href, '_blank', 'noopener');
    else navigate(href);
  }}>
    <td className="run-cell"><Link to={href} className="run-link">{run.run_id}</Link><span className="mobile-run-note">{view === 'attention' ? attentionIssue(run) : run.responsible_agent ?? 'Agent pending'}</span></td>
    {view === 'attention' ? <td className="issue-cell">{attentionIssue(run)}</td> : <td className="stage-cell">{view === 'recent' ? stageLabels[run.current_stage] : <StatusText value={run.stage_status} />}</td>}
    <td className="agent-cell">{run.responsible_agent ?? <span className="muted">Pending</span>}</td>
    {view === 'ledger' && <td className="confidence-cell muted">{run.confidence ? sentenceCase(run.confidence) : '-'}</td>}
    <td className="result-cell"><StatusText value={view === 'attention' ? run.stage_status === 'failed' ? 'failed' : 'review_required' : run.validation_verdict} /></td>
    <td className="time-cell"><time dateTime={run.created_at} title={formatUtcTimestamp(run.created_at)}>{formatTime(run.created_at)}</time></td>
  </tr>;
}
export function RunTable({ runs, view, label }: { runs: RunSummary[]; view: RunTableView; label: string }) {
  return <div className="table-scroll"><table className={`run-table table-${view}`}>
    <caption className="sr-only">{label}. Times in UTC.</caption>
    <thead><tr>{['Run', view === 'attention' ? 'Issue' : view === 'recent' ? 'Stage' : 'Status', 'Agent', ...(view === 'ledger' ? ['Confidence'] : []), view === 'attention' ? 'Status' : 'Result', 'Time'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{runs.map(run => <RunRow key={run.run_id} run={run} view={view} />)}</tbody>
  </table></div>;
}

