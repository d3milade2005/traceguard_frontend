import { Download } from 'lucide-react';
import { PyTestArtifact } from '../types/api';
import { StatusText } from './StatusText';
import { CodeBlock, CopyButton, EmptyState } from './UI';
export function GeneratedPyTestPanel({ artifact }: { artifact: PyTestArtifact | null }) {
  if (!artifact) return <EmptyState title="No generated test yet" description="The source will appear once compilation completes."/>;
  const source = artifact.source_code;
  const download = () => {
    if (!source) return;
    const url = URL.createObjectURL(new Blob([source], { type: 'text/x-python;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = (artifact.test_name ?? 'regression_test') + '.py'; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="stage-panel generated-panel"><div className="generated-heading"><h2>Generated test</h2>{source && <div><CopyButton value={source}/><button className="button button-quiet" onClick={download}><Download size={14}/>Download</button></div>}</div>
    <StatusText value={artifact.status}/><p className="test-name identifier">{artifact.test_name ?? '—'}</p>
    {source ? <CodeBlock label="Generated pytest source" source={source} numbered/> : <p className="context-warning">Compilation failed. {artifact.failure_code}</p>}
    <details className="disclosure"><summary>Test metadata</summary><dl className="detail-list">
      {Object.entries({ Framework: artifact.framework, 'SHA-256': artifact.source_digest, Compiler: artifact.compiler_version, Harness: artifact.harness_identifier, 'Harness version': artifact.harness_version, 'Failure code': artifact.failure_code }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd className="identifier">{value ?? '—'}</dd></div>)}
    </dl></details>
  </div>;
}
