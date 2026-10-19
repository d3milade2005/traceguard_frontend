import { Check, CircleAlert } from 'lucide-react';
import { BoundedExecutionSummary, ValidationResult } from '../types/api';
import { formatUtcTimestamp, STATUS, StatusText } from './StatusText';
import { stopMessage } from '../api/presentation';
import { CodeBlock, EmptyState } from './UI';
export function validationMessage(validation: ValidationResult | null) {
  if (!validation) return 'Validation has not completed.';
  if (validation.verdict === 'valid') return 'The generated test catches the faulty behavior and passes after correction.';
  return stopMessage(validation.verdict) ?? (validation.status === 'failed' ? 'Validation failed.' : 'Validation has not completed.');
}
function expected(summary: BoundedExecutionSummary) {
  return summary.variant === 'faulty' ? summary.outcome === 'assertion_failed' : summary.outcome === 'passed';
}
function outcomeLabel(summary: BoundedExecutionSummary) {
  if (summary.outcome === 'passed') return summary.variant === 'corrected' ? 'Passed as expected' : 'Passed unexpectedly';
  if (summary.outcome === 'assertion_failed') return summary.variant === 'faulty' ? 'Failed as expected' : 'Failed unexpectedly';
  return STATUS[summary.outcome]?.label ?? summary.outcome.replaceAll('_', ' ');
}
export function ValidationComparison({ validation }: { validation: ValidationResult }) {
  return <div className="validation-comparison">{[validation.faulty_execution, validation.corrected_execution].map((summary, index) => <div key={index}><span>{index === 0 ? 'Faulty implementation' : 'Corrected implementation'}</span><span className={summary && expected(summary) ? 'outcome-success' : 'outcome-warning'}>{summary && expected(summary) ? <Check size={14}/> : <CircleAlert size={14}/>} {summary ? outcomeLabel(summary) : 'Pending'}</span></div>)}</div>;
}
function ExecutionDetails({ summary }: { summary: BoundedExecutionSummary }) {
  return <section className="execution-details"><h3>{summary.variant === 'faulty' ? 'Faulty implementation' : 'Corrected implementation'}</h3><dl className="detail-list">
    {Object.entries({ Duration: summary.duration_ms + ' ms', Outcome: summary.outcome, 'Exit code': summary.exit_code, Passed: summary.passed, Failed: summary.failed, Errors: summary.errors, 'Timed out': String(summary.timed_out), 'Resource limited': String(summary.resource_limited), 'Output truncated': String(summary.output_truncated) }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value ?? '—'}</dd></div>)}
    </dl><CodeBlock label={`${summary.variant} execution diagnostic`} source={summary.diagnostic}/></section>;
}
export function ValidationPanel({ validation }: { validation: ValidationResult | null }) {
  if (!validation) return <EmptyState title="Validation pending" description="Outcomes will appear when a persisted validation is available."/>;
  return <div className="stage-panel"><div className={`validation-title ${validation.verdict === 'valid' ? 'outcome-success' : 'outcome-warning'}`}>{validation.verdict === 'valid' ? <Check size={19}/> : <CircleAlert size={19}/>}<h2>{validation.verdict === 'valid' ? 'Valid regression' : validation.verdict ? STATUS[validation.verdict]?.label : 'Validation ' + validation.status}</h2></div>
    <StatusText value={validation.status}/><p className="detail-note">{validationMessage(validation)}</p><ValidationComparison validation={validation}/>
    <details className="disclosure"><summary>Execution details</summary><dl className="detail-list">
      {Object.entries({ Verdict: validation.verdict, Validator: validation.validator_version, 'Source digest': validation.source_digest, 'Failure code': validation.failure_code, Completed: validation.completed_at ? formatUtcTimestamp(validation.completed_at) : null }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd className="identifier">{value ?? '—'}</dd></div>)}
    </dl>{validation.faulty_execution && <ExecutionDetails summary={validation.faulty_execution}/>} {validation.corrected_execution && <ExecutionDetails summary={validation.corrected_execution}/>}
      <h3>Runtime identity</h3><CodeBlock label="Validation runtime identity" source={JSON.stringify(validation.runtime_identity, null, 2)}/>
    </details>
  </div>;
}
