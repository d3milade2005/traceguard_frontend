import { ModelMetadata } from '../types/api';
import { CodeBlock } from './UI';
export function ModelDetails({ record }: { record: ModelMetadata }) {
  return <details className="disclosure"><summary>View model details</summary><dl className="detail-list">
    {Object.entries({ Provider: record.provider, Model: record.model, 'Reasoning effort': record.reasoning_effort, 'Prompt version': record.prompt_version, 'Input tokens': record.input_tokens, 'Output tokens': record.output_tokens, 'Reasoning tokens': record.reasoning_tokens, 'Latency (ms)': record.latency_ms, 'Failure code': record.failure_code, 'Response ID': record.response_id, 'Input SHA-256': record.input_sha256 }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd className="identifier">{value ?? '—'}</dd></div>)}
  </dl>{record.output_diagnostics && <CodeBlock label="Safe output diagnostics" source={JSON.stringify(record.output_diagnostics, null, 2)}/>}</details>;
}
