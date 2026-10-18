import { useSystemStatus } from '../api/queries';
import { formatKB, sentenceCase, StatusText } from '../components/StatusText';
import { EmptyState } from '../components/UI';

export function SystemPage() {
  const { data: system, isLoading, isError, refetch } = useSystemStatus();
  if (isError) return <EmptyState title="Unable to load system status" retry={() => void refetch()} />;
  if (isLoading || !system) return <EmptyState title="Loading system…" />;
  return <div className="page system-page">
    <header className="page-heading"><div><h1>System</h1><p>Runtime health and the configuration behind your analyses.</p></div><span className="metadata muted">Read only</span></header>
    <div className="system-sections-grid">
      <section className="settings-section settings-card">
        <div>
          <h2>Runtime</h2>
          <p>Services that process and verify runs.</p>
        </div>
        <dl className="settings-list">
          <div><dt>API</dt><dd><StatusText value={system.api_status} /></dd></div>
          <div><dt>Worker</dt><dd><StatusText value={system.worker_status} /></dd></div>
          <div><dt>Validation runner</dt><dd><StatusText value={system.validation_runner_status} /></dd></div>
          <div><dt>Environment</dt><dd className="system-env-pill">{sentenceCase(system.environment)}</dd></div>
        </dl>
      </section>
      <section className="settings-section settings-card">
        <div>
          <h2>AI configuration</h2>
          <p>Model and analysis context.</p>
        </div>
        <dl className="settings-list">
          <div><dt>Provider</dt><dd>{system.model_config.provider.toLowerCase() === 'openai' ? 'OpenAI' : system.model_config.provider}</dd></div>
          <div><dt>Model</dt><dd className="identifier">{system.model_config.model}</dd></div>
          <div><dt>Reasoning</dt><dd>{sentenceCase(system.model_config.reasoning_effort)}</dd></div>
          <div><dt>Context budget</dt><dd title={`${system.model_config.context_budget_utf8_bytes} UTF-8 bytes`}>{formatKB(system.model_config.context_budget_utf8_bytes)}</dd></div>
        </dl>
      </section>
      <section className="settings-section settings-card">
        <div>
          <h2>Pipeline versions</h2>
          <p>Components used by the pipeline.</p>
        </div>
        <dl className="settings-list">
          <div><dt>Normalizer</dt><dd className="identifier">{system.pipeline_versions.normalizer_version}</dd></div>
          <div><dt>Attribution prompt</dt><dd className="identifier">{system.pipeline_versions.prompt_version}</dd></div>
          <div><dt>Compiler</dt><dd className="identifier">{system.pipeline_versions.compiler_version}</dd></div>
          <div><dt>Validator</dt><dd className="identifier">{system.pipeline_versions.validator_version}</dd></div>
        </dl>
      </section>
    </div>
  </div>;
}

