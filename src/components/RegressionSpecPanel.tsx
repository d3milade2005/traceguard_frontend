import { RegressionSpec } from '../types/api';
import { InlineText } from './AttributionSummary';
import { CodeBlock, EmptyState } from './UI';

export function RegressionSpecPanel({ spec }: { spec: RegressionSpec | null }) {
  if (!spec) return <EmptyState title="No regression scenario yet" description="The scenario will appear once regression synthesis completes." />;
  return <div className="stage-panel"><h2>Regression scenario</h2><p className="scenario-title">{spec.scenario.title}</p><p className="detail-note"><InlineText text={spec.scenario.initial_state_summary} /></p>
    <h3>Input</h3><dl className="scenario-input">{Object.entries(spec.scenario.stimulus_input).map(([key, value]) => <div key={key}><dt><code>{key}</code></dt><dd>{typeof value === 'object' ? <code>{JSON.stringify(value)}</code> : String(value)}</dd></div>)}</dl>
    <h3>Expected behavior</h3><ol className="assertion-list">{spec.assertions.map(assertion => <li key={assertion.id}><p><InlineText text={assertion.description} /></p><span className="assertion-condition"><code>{assertion.target}</code><span>{assertion.operator.replaceAll('_', ' ')}</span><code>{assertion.expected_value}</code></span></li>)}</ol>
    <h3>Evidence</h3><p className="detail-note">Decisive step {spec.decisive_sequence} · Input from step {spec.scenario.stimulus_sequence}</p>
    <details className="disclosure"><summary>View raw specification</summary><CodeBlock label="Raw RegressionSpec" source={JSON.stringify(spec, null, 2)} /></details>
  </div>;
}

