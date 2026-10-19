import { ContextManifest } from '../types/api';
import { formatBytes, formatKB } from './StatusText';
import { CodeBlock, EmptyState } from './UI';
export function AnalysisContextPanel({ context }: { context: ContextManifest | null }) {
  if (!context) return <EmptyState title="Analysis context is not available yet"/>;
  const stats = context.statistics;
  return <div className="stage-panel"><h2>Analysis context</h2>
    <p className="context-total">{formatKB(stats.estimated_selected_size)} <span>of {formatKB(stats.effective_budget)}</span></p>
    <p className="detail-note">{stats.pruning_occurred ? 'Pruned context' : 'Full trace used'} · {stats.original_step_count - stats.selected_step_count} steps omitted · {context.truncated_sequences.length} truncated</p>
    <p className="detail-note context-description">Persisted selection metadata. Sizes use UTF-8 bytes. Truncated excerpt bodies were not retained by the backend.</p>
    <details className="disclosure"><summary>Context details</summary><dl className="detail-list">
      {Object.entries({ 'Byte budget': formatBytes(stats.budget), 'Reserved headroom': formatBytes(stats.reserved_headroom), 'Effective budget': formatBytes(stats.effective_budget), 'Original size': formatBytes(stats.estimated_original_size), 'Selected size': formatBytes(stats.estimated_selected_size), 'Selected sequences': context.visible_sequences.join(', '), 'Truncated sequences': context.truncated_sequences.join(', ') || 'None' }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
    </dl><h3>Omitted ranges</h3>{context.omitted_ranges.length ? context.omitted_ranges.map(range => <div className="omitted-range" key={range.start}><p>Steps {range.start}–{range.end}</p></div>) : <p className="detail-note">No steps omitted.</p>}</details>
    <details className="disclosure"><summary>View context manifest</summary><CodeBlock label="Analysis context manifest" source={JSON.stringify(context, null, 2)}/></details>
  </div>;
}
