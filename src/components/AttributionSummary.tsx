import { AttributionResult, EvidenceRange } from '../types/api';
import { sentenceCase, StatusText } from './StatusText';
export function InlineText({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/g).map((part, i) => part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part)}</>;
}
interface AttributionSummaryProps {
  attribution: AttributionResult;
  onSelectDecisiveStep: (sequence: number) => void;
  onSelectEvidence: (evidence: EvidenceRange) => void;
}
export function AttributionSummary({ attribution, onSelectDecisiveStep, onSelectEvidence }: AttributionSummaryProps) {
  return <section className="failure-summary" aria-labelledby="failure-heading">
    <div className="summary-label" id="failure-heading">Failure attribution</div>
    <h2>{attribution.decision === 'attributed' ? attribution.responsible_agent : attribution.decision === 'abstain' ? 'Attribution requires review' : attribution.status === 'failed' ? 'Attribution failed' : 'Attribution pending'}</h2>
    <p className="failure-explanation"><InlineText text={attribution.explanation ?? attribution.abstention_reason ?? 'The diagnosis is not available yet.'}/></p>
    <div className="attribution-meta">
      {attribution.decisive_sequence !== null && <button className="inline-action" onClick={() => onSelectDecisiveStep(attribution.decisive_sequence!)}>Decisive step {attribution.decisive_sequence} ↗</button>}
      {attribution.confidence ? <span>{sentenceCase(attribution.confidence)} confidence</span> : <StatusText value={attribution.status}/>}
    </div>
    {attribution.evidence.length > 0 && <div className="evidence-summary"><span>Evidence</span><div>{attribution.evidence.slice(0, 2).map(ev => <button key={ev.start_sequence} className="evidence-link" onClick={() => onSelectEvidence(ev)} title={ev.reason}><span className="identifier">Step {ev.start_sequence}{ev.end_sequence !== ev.start_sequence ? '–' + ev.end_sequence : ''}</span><span>{ev.reason}</span></button>)}</div></div>}
  </section>;
}
