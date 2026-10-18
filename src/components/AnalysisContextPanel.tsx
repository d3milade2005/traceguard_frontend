import { RunDetail } from '../types/api';
import { formatBytes, formatKB } from './StatusText';
import { CodeBlock } from './UI';
export function AnalysisContextPanel({ run }: { run: RunDetail }) {
  const context = run.analysis_context;
  return <div className="stage-panel"><h2>Analysis context</h2>
    <p className="context-total">{formatKB(context.used_utf8_bytes)} <span>of {formatKB(context.budget_utf8_bytes)}</span></p>
    <p className="detail-note">{context.omitted_step_count} steps omitted · {context.truncated_step_count} truncated</p>
    <p className="detail-note context-description">This is the portion of the execution available to the attribution model. The canonical trace keeps all supplied payloads.</p>
    <details className="disclosure"><summary>Context details</summary><dl className="detail-list">
      <div><dt>Budget</dt><dd>{formatBytes(context.budget_utf8_bytes)}</dd></div>
      <div><dt>Used</dt><dd>{formatBytes(context.used_utf8_bytes)}</dd></div>
      <div><dt>Omitted</dt><dd>{formatBytes(context.omitted_utf8_bytes)}</dd></div>
      <div><dt>Included steps</dt><dd>{context.included_step_count}</dd></div>
      <div><dt>Truncated steps</dt><dd>{context.truncated_step_count}</dd></div>
    </dl><h3>Omitted ranges</h3>{context.omitted_ranges.length ? context.omitted_ranges.map(range => <div className="omitted-range" key={range.start_sequence}><p>Steps {range.start_sequence}–{range.end_sequence} · {range.step_count} steps</p><p className="detail-note">{range.reason}</p><span className="metadata muted">{formatBytes(range.omitted_utf8_bytes)} UTF-8</span></div>) : <p className="detail-note">No steps omitted.</p>}</details>
    <details className="disclosure"><summary>View context manifest</summary><CodeBlock label="Analysis context manifest" source={JSON.stringify({ ...context, steps: run.canonical_steps.map(step => ({ sequence: step.sequence, ...step.context_meta })) }, null, 2)} /></details>
  </div>;
}

