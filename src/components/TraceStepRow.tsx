import { ChevronDown, ChevronRight } from 'lucide-react';
import { CanonicalStep } from '../types/api';
import { sentenceCase } from './StatusText';
import { CodeBlock } from './UI';
interface Props { step: CanonicalStep; isDecisive: boolean; isEvidence: boolean; visibility?: string; isExpanded: boolean; onToggle: () => void }
export function TraceStepRow({ step, isDecisive, isEvidence, visibility, isExpanded, onToggle }: Props) {
  const preview = typeof step.output === 'string' ? step.output : typeof step.input === 'string' ? step.input : step.tool_name ?? step.status ?? '';
  return <div id={`trace-step-${step.sequence}`} className={`trace-row ${isDecisive ? 'trace-decisive' : ''} ${['failed', 'error'].includes(step.status ?? '') ? 'trace-error' : ''}`}>
    <button className="trace-row-button" onClick={onToggle} aria-expanded={isExpanded} aria-controls={`payload-${step.sequence}`}>
      <span className="trace-chevron">{isExpanded ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}</span>
      <span className="trace-sequence"><span className={`trace-gutter ${isEvidence ? 'has-evidence' : ''}`} aria-hidden="true"/>#{step.sequence}</span>
      <span className="trace-agent">{step.agent_id ?? '—'}</span><span className="trace-event">{sentenceCase(step.event_type)}</span><span className="trace-preview">{preview}</span>
      <span className="trace-offset" title={step.occurred_at ?? 'Timestamp unavailable'}>{step.occurred_at ? new Date(step.occurred_at).toISOString().slice(11, 23) : '—'}</span>
    </button>
    {isExpanded && <div id={`payload-${step.sequence}`} className="trace-payload">
      <div className="payload-heading"><span>{isDecisive ? 'Decisive step' : isEvidence ? 'Evidence' : sentenceCase(step.event_type)}</span><span>{step.status ?? '—'}</span></div>
      {visibility && <p className={visibility === 'included' ? 'detail-note' : 'context-warning'}>{visibility === 'truncated' ? 'This step was truncated for the model. The complete canonical payload is shown below; the historical excerpt body is unavailable.' : visibility === 'omitted' ? 'This step was omitted from model context. The canonical payload is shown below.' : 'Complete step selected for model context.'}</p>}
      {step.output !== null && <><h3>Output produced</h3><CodeBlock label={`Step ${step.sequence} output`} source={typeof step.output === 'string' ? step.output : JSON.stringify(step.output, null, 2)}/></>}
      {step.input !== null && <details className="disclosure"><summary>Inputs received</summary><CodeBlock label={`Step ${step.sequence} input`} source={typeof step.input === 'string' ? step.input : JSON.stringify(step.input, null, 2)}/></details>}
      <details className="disclosure"><summary>Complete canonical payload</summary><CodeBlock label={`Step ${step.sequence} canonical payload`} source={JSON.stringify(step, null, 2)}/></details>
    </div>}
  </div>;
}
