import { useSystemStatus } from '../api/queries';
import { sentenceCase, StatusText } from '../components/StatusText';
import { EmptyState, QueryError } from '../components/UI';
export function SystemPage() {
  const query = useSystemStatus();
  const { data: system, isLoading, isError } = query;
  if (isError) return <QueryError title="Unable to load system status." query={query}/>;
  if (isLoading || !system) return <EmptyState title="Loading system…"/>;
  return <div className="page system-page">
    <header className="page-heading"><div><h1>System</h1><p>Runtime health and the configuration behind your analyses.</p></div><span className="metadata muted">Read only</span></header>
    <div className="system-sections-grid">
      <section className="settings-section settings-card"><div><h2>Runtime</h2><p>API process configuration. Worker readiness is not reported by this endpoint.</p></div><dl className="settings-list"><div><dt>API</dt><dd><StatusText value={system.api_health}/></dd></div><div><dt>Environment</dt><dd className="system-env-pill">{sentenceCase(system.environment)}</dd></div></dl></section>
      <section className="settings-section settings-card"><div><h2>AI configuration</h2><p>Model used for analysis.</p></div><dl className="settings-list"><div><dt>Model</dt><dd className="identifier">{system.model}</dd></div><div><dt>Reasoning</dt><dd>{sentenceCase(system.reasoning_effort)}</dd></div></dl></section>
      <section className="settings-section settings-card"><div><h2>Pipeline versions</h2><p>Components used by the pipeline.</p></div><dl className="settings-list">{Object.entries({ 'Attribution prompt': system.attribution_prompt_version, 'Context policy': system.context_policy_version, 'Regression specification': system.regression_spec_version, 'Regression prompt': system.regression_prompt_version, Compiler: system.compiler_version, Validator: system.validator_version }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd className="identifier">{value}</dd></div>)}</dl></section>
    </div>
  </div>;
}
