import { AttributionResult, EvidenceRange } from '../types/api';
import { sentenceCase } from './StatusText';

export function InlineText({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/g).map((part, i) => part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part)}</>;
}
interface AttributionSummaryProps {
  attribution: AttributionResult;
  onSelectDecisiveStep: (sequence: number) => void;
  onSelectEvidence: (evidence: EvidenceRange) => void;
}
export function AttributionSummary({ attribution, onSelectDecisiveStep, onSelectEvidence }: AttributionSummaryProps) {
  const attributed = attribution.decision === 'attributed';
  return <section className="failure-summary" aria-labelledby="failure-heading">
    <div className="summary-label" id="failure-heading">Failure attribution</div>
    <h2>{attributed ? attribution.responsible_agent ?? 'Agent not identified' : attribution.decision === 'inconclusive' ? 'Attribution is inconclusive' : 'Agent not identified'}</h2>
    <p className="failure-explanation"><InlineText text={attribution.explanation} /></p>
    <div className="attribution-meta">
      {attribution.decisive_sequence !== null && <button className="inline-action" onClick={() => onSelectDecisiveStep(attribution.decisive_sequence!)}>Decisive step {attribution.decisive_sequence}<span aria-hidden="true"> ↗</span></button>}
      <span>{sentenceCase(attribution.confidence)} confidence</span>
    </div>
    {attribution.evidence.length > 0 && <div className="evidence-summary"><span>Evidence</span><div>{attribution.evidence.slice(0, 2).map(ev => <button key={ev.id} className="evidence-link" onClick={() => onSelectEvidence(ev)} title={ev.rationale_summary}>
      <span className="identifier">Step {ev.start_sequence}{ev.end_sequence !== ev.start_sequence ? '–' + ev.end_sequence : ''}</span><span>{ev.rationale_summary}</span>
    </button>)}</div></div>}
  </section>;
}

