import { ChevronDown, ChevronRight, CircleAlert } from 'lucide-react';
import { CanonicalStep } from '../types/api';
import { formatBytes, sentenceCase } from './StatusText';
import { CodeBlock } from './UI';

interface TraceStepRowProps { step: CanonicalStep; isDecisive: boolean; isEvidence: boolean; evidenceLabel?: string; isExpanded: boolean; viewMode: 'canonical' | 'context'; onToggle: () => void; }
const eventLabels: Record<CanonicalStep['event_type'], string> = { agent_message: 'Message', tool_call: 'Tool call', tool_result: 'Tool result', state_mutation: 'State change', system_error: 'Error' };
export function TraceStepRow({ step, isDecisive, isEvidence, evidenceLabel, isExpanded, viewMode, onToggle }: TraceStepRowProps) {
  const omitted = viewMode === 'context' && step.context_meta.visibility === 'omitted';
  const truncated = viewMode === 'context' && step.context_meta.visibility === 'truncated';
  const label = isDecisive ? 'Decisive step' : step.event_type === 'system_error' ? 'Failure' : isEvidence ? 'Evidence' : undefined;
  return <div id={`trace-step-${step.sequence}`} className={`trace-row ${isDecisive ? 'trace-decisive' : ''} ${step.event_type === 'system_error' ? 'trace-error' : ''}`}>
    <button className="trace-row-button" onClick={onToggle} aria-expanded={isExpanded} aria-controls={`payload-${step.sequence}`}>
      <span className="trace-chevron">{isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
      <span className="trace-sequence" title={label}><span className={`trace-gutter ${isEvidence ? 'has-evidence' : ''}`} aria-hidden="true" />#{step.sequence}</span>
      <span className="trace-agent">{step.agent}</span>
      <span className="trace-event">{eventLabels[step.event_type]}</span>
      <span className="trace-preview">{step.summary}</span>
      <span className="trace-offset" title="Time since run start">+{step.timestamp_offset_ms.toLocaleString()} ms</span>
      {label && <span className="sr-only">{label}{evidenceLabel ? ': ' + evidenceLabel : ''}</span>}
      {step.event_type === 'system_error' && <CircleAlert size={13} className="trace-error-icon" aria-hidden="true" />}
    </button>
    {isExpanded && <div id={`payload-${step.sequence}`} className="trace-payload">
      <div className="payload-heading"><span>{label ?? eventLabels[step.event_type]}</span><span>+{step.timestamp_offset_ms} ms from start</span></div>
      <p className="detail-note">{step.summary}</p>
      {omitted ? <p className="context-warning">This step was omitted from the model context. Switch to Canonical trace to inspect its payload.</p> : <>{truncated && <p className="context-warning">Excerpt supplied to the model. The complete payload is available in Canonical trace.</p>}<CodeBlock label={`Step ${step.sequence} ${truncated ? 'context excerpt' : 'canonical payload'}`} source={truncated && step.context_meta.prepared_excerpt ? step.context_meta.prepared_excerpt : JSON.stringify(step.canonical_payload, null, 2)} /></>}
      <details className="disclosure"><summary>Step metadata</summary><dl className="detail-list"><div><dt>Event</dt><dd className="identifier">{step.event_type}</dd></div><div><dt>Context visibility</dt><dd>{sentenceCase(step.context_meta.visibility)}</dd></div><div><dt>Original size</dt><dd>{formatBytes(step.context_meta.original_utf8_bytes)}</dd></div><div><dt>Included size</dt><dd>{formatBytes(step.context_meta.included_utf8_bytes)}</dd></div></dl>{step.context_meta.omission_reason && <p className="detail-note">{step.context_meta.omission_reason}</p>}</details>
    </div>}
  </div>;
}

