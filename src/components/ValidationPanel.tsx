import { Check, CircleAlert } from 'lucide-react';
import { BoundedExecutionSummary, ValidationResult } from '../types/api';
import { formatUtcTimestamp, STATUS } from './StatusText';
import { CodeBlock, EmptyState } from './UI';

export function validationMessage(validation: ValidationResult | null) {
  if (!validation) return 'Validation has not completed.';
  if (validation.final_verdict === 'validated') return 'The generated test catches the faulty behavior and passes after correction.';
  if (validation.final_verdict === 'compile_error') return 'The generated test could not compile. Inspect the source and diagnostics.';
  if (validation.final_verdict === 'pending') return 'The generated test is waiting for validation.';
  if (validation.faulty_execution.actual_outcome === 'PASS') return 'The generated test did not catch the faulty behavior. Review the assertions.';
  if (!validation.corrected_execution.expectation_met) return 'The test did not pass after correction. Review the execution details.';
  return 'The regression needs review. Inspect both execution outcomes.';
}
function outcomeLabel(summary: BoundedExecutionSummary) {
  if (summary.actual_outcome === 'ERROR') return 'Execution error';
  if (summary.mode === 'faulty') return summary.expectation_met ? 'Failed as expected' : 'Passed unexpectedly';
  return summary.expectation_met ? 'Passed as expected' : 'Failed unexpectedly';
}
export function ValidationComparison({ validation }: { validation: ValidationResult }) {
  return <div className="validation-comparison">{[validation.faulty_execution, validation.corrected_execution].map(summary => <div key={summary.mode}><span>{summary.mode === 'faulty' ? 'Faulty implementation' : 'Corrected implementation'}</span><span className={summary.expectation_met ? 'outcome-success' : 'outcome-warning'}>{summary.expectation_met ? <Check size={14} /> : <CircleAlert size={14} />}{outcomeLabel(summary)}</span></div>)}</div>;
}
function ExecutionDetails({ summary }: { summary: BoundedExecutionSummary }) {
  return <section className="execution-details"><h3>{summary.mode === 'faulty' ? 'Faulty implementation' : 'Corrected implementation'}</h3><dl className="detail-list"><div><dt>Duration</dt><dd>{summary.duration_ms} ms</dd></div><div><dt>Actual outcome</dt><dd className="identifier">{summary.actual_outcome}</dd></div><div><dt>Expected outcome</dt><dd className="identifier">{summary.expected_outcome}</dd></div></dl>
    <CodeBlock label={`${summary.mode} execution diagnostic`} source={summary.bounded_diagnostic} />
    <h3>Assertion outcomes</h3><ul className="assertion-outcomes">{summary.assertion_outcomes.map(item => <li key={item.assertion_id}><span className={item.passed ? 'outcome-success' : 'outcome-warning'}>{item.assertion_id} · {item.passed ? 'Passed' : /skipped/i.test(item.message) ? 'Skipped' : 'Failed'}</span><span>{item.message}</span><span className="muted metadata">Line {item.line_number}</span></li>)}</ul>
  </section>;
}
export function ValidationPanel({ validation }: { validation: ValidationResult | null }) {
  if (!validation) return <EmptyState title="Validation pending" description="Outcomes will appear when the generated test has been checked." />;
  return <div className="stage-panel"><div className={`validation-title ${validation.final_verdict === 'validated' ? 'outcome-success' : 'outcome-warning'}`}>{validation.final_verdict === 'validated' ? <Check size={19} /> : <CircleAlert size={19} />}<h2>{validation.final_verdict === 'validated' ? 'Valid regression' : STATUS[validation.final_verdict].label}</h2></div>
    <p className="detail-note">{validationMessage(validation)}</p><ValidationComparison validation={validation} />
    <details className="disclosure"><summary>Execution details</summary><p className="detail-note">{validation.summary_note}</p><dl className="detail-list"><div><dt>Verdict</dt><dd className="identifier">{validation.final_verdict}</dd></div><div><dt>Validator</dt><dd className="identifier">{validation.validator_version}</dd></div><div><dt>Validated</dt><dd>{formatUtcTimestamp(validation.validated_at)}</dd></div></dl>
      <ExecutionDetails summary={validation.faulty_execution} /><ExecutionDetails summary={validation.corrected_execution} />
    </details>
  </div>;
}

