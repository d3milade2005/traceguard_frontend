import { AttributionResult, EvidenceRange } from '../types/api';
import { sentenceCase, StatusText } from './StatusText';
import { InlineText } from './AttributionSummary';
export function AttributionDetail({ attribution, onSelectEvidence, onSelectStep }: { attribution: AttributionResult; onSelectEvidence: (e: EvidenceRange) => void; onSelectStep: (s: number) => void }) {
  return <div className="stage-panel">
    <h2>Attribution</h2>
    <dl className="detail-list attribution-fields">
      <div><dt>Responsible agent</dt><dd>{attribution.responsible_agent ?? 'Not identified'}</dd></div>
      <div><dt>Decisive step</dt><dd>{attribution.decisive_sequence !== null ? <button className="inline-action" onClick={() => onSelectStep(attribution.decisive_sequence!)}>Step {attribution.decisive_sequence} ↗</button> : 'Not identified'}</dd></div>
      <div><dt>Confidence</dt><dd>{sentenceCase(attribution.confidence)}</dd></div>
      <div><dt>Decision</dt><dd><StatusText value={attribution.decision} /></dd></div>
    </dl>
    <h3>Explanation</h3><p className="detail-note"><InlineText text={attribution.explanation} /></p>
    <h3>Evidence</h3>
    <div className="evidence-detail">{attribution.evidence.map(ev => <button className="evidence-detail-link" key={ev.id} onClick={() => onSelectEvidence(ev)}><span className="identifier">Step {ev.start_sequence}{ev.end_sequence !== ev.start_sequence ? '–' + ev.end_sequence : ''} ↗</span><span><InlineText text={ev.rationale_summary} /></span></button>)}</div>
    <details className="disclosure"><summary>View model details</summary><dl className="detail-list">
      <div><dt>Provider</dt><dd>{attribution.provider === 'openai' ? 'OpenAI' : attribution.provider}</dd></div>
      <div><dt>Model</dt><dd className="identifier">{attribution.model}</dd></div>
      <div><dt>Prompt version</dt><dd className="identifier">{attribution.prompt_version}</dd></div>
      <div><dt>Input tokens</dt><dd>{attribution.token_usage.input_tokens.toLocaleString()}</dd></div>
      <div><dt>Output tokens</dt><dd>{attribution.token_usage.output_tokens.toLocaleString()}</dd></div>
      <div><dt>Total tokens</dt><dd>{attribution.token_usage.total_tokens.toLocaleString()}</dd></div>
      <div><dt>Latency</dt><dd>{attribution.latency_ms.toLocaleString()} ms</dd></div>
    </dl></details>
  </div>;
}

