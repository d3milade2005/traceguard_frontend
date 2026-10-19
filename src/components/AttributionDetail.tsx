import { AttributionResult, EvidenceRange } from '../types/api';
import { sentenceCase, StatusText } from './StatusText';
import { InlineText } from './AttributionSummary';
import { ModelDetails } from './ModelDetails';
import { CodeBlock } from './UI';
export function AttributionDetail({ attribution, onSelectEvidence, onSelectStep }: { attribution: AttributionResult; onSelectEvidence: (e: EvidenceRange) => void; onSelectStep: (s: number) => void }) {
  return <div className="stage-panel"><h2>Attribution</h2>
    <dl className="detail-list attribution-fields">
      <div><dt>Status</dt><dd><StatusText value={attribution.status}/></dd></div>
      <div><dt>Responsible agent</dt><dd>{attribution.responsible_agent ?? '—'}</dd></div>
      <div><dt>Decisive step</dt><dd>{attribution.decisive_sequence !== null ? <button className="inline-action" onClick={() => onSelectStep(attribution.decisive_sequence!)}>Step {attribution.decisive_sequence} ↗</button> : '—'}</dd></div>
      <div><dt>Confidence</dt><dd>{attribution.confidence ? sentenceCase(attribution.confidence) : '—'}</dd></div>
      <div><dt>Decision</dt><dd>{attribution.decision ? <StatusText value={attribution.decision}/> : '—'}</dd></div>
      <div><dt>Failure category</dt><dd>{attribution.failure_category ?? '—'}</dd></div>
    </dl>
    <h3>Explanation</h3><p className="detail-note"><InlineText text={attribution.explanation ?? 'No explanation available.'}/></p>
    {attribution.abstention_reason && <p className="context-warning">{attribution.abstention_reason}</p>}
    <h3>Evidence</h3><div className="evidence-detail">{attribution.evidence.map(ev => <button className="evidence-detail-link" key={ev.start_sequence} onClick={() => onSelectEvidence(ev)}><span className="identifier">Step {ev.start_sequence}{ev.end_sequence !== ev.start_sequence ? '–' + ev.end_sequence : ''} ↗</span><span>{ev.reason}{ev.contains_truncated ? ' (includes truncated evidence)' : ''}</span></button>)}</div>
    <ModelDetails record={attribution}/>
    {attribution.context_manifest && <details className="disclosure"><summary>View context manifest</summary><CodeBlock label="Attribution context manifest" source={JSON.stringify(attribution.context_manifest, null, 2)}/></details>}
  </div>;
}
