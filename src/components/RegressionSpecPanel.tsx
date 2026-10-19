import { RegressionRecord } from '../types/api';
import { ModelDetails } from './ModelDetails';
import { StatusText } from './StatusText';
import { CodeBlock, EmptyState } from './UI';
export function RegressionSpecPanel({ spec: record }: { spec: RegressionRecord | null }) {
  if (!record) return <EmptyState title="No regression scenario yet" description="A persisted specification will appear when available."/>;
  const spec = record.spec;
  return <div className="stage-panel"><h2>Regression scenario</h2><StatusText value={record.disposition ?? record.status}/>
    <p className="scenario-title">{record.title ?? 'Specification pending'}</p>
    {record.disposition === 'needs_review' && <p className="context-warning">{record.review_reason}</p>}
    {spec && <><p className="detail-note">{spec.failure_summary}</p><dl className="detail-list"><div><dt>Target agent</dt><dd>{spec.target_agent ?? '—'}</dd></div><div><dt>Test name</dt><dd className="identifier">{spec.test_name}</dd></div></dl>
      {spec.scenario && <><h3>Input</h3><CodeBlock label="Scenario references" source={JSON.stringify(spec.scenario, null, 2)}/></>}
      {record.scenario_snapshot && <><h3>Scenario snapshot</h3><CodeBlock label="Scenario snapshot" source={JSON.stringify(record.scenario_snapshot, null, 2)}/></>}
      {spec.assertions.length > 0 && <><h3>Expected behavior</h3><ol className="assertion-list">{spec.assertions.map((assertion, i) => <li key={i}><span className="assertion-condition"><code>{assertion.observable}{assertion.path.length ? '.' + assertion.path.join('.') : ''}</code><span>{assertion.kind.replaceAll('_', ' ')}</span><code>{JSON.stringify(assertion.expected)}</code></span><CodeBlock label={`Assertion ${i + 1} evidence`} source={JSON.stringify(assertion.evidence, null, 2)}/></li>)}</ol></>}
      <h3>Evidence</h3><CodeBlock label="Specification evidence" source={JSON.stringify(spec.evidence, null, 2)}/>
    </>}
    {record.failure_code && <p className="context-warning">{record.failure_code}</p>}
    <details className="disclosure"><summary>View raw specification</summary><CodeBlock label="Raw RegressionSpec" source={JSON.stringify(spec, null, 2)}/></details><ModelDetails record={record}/>
  </div>;
}
