import { Download } from 'lucide-react';
import { PyTestArtifact } from '../types/api';
import { CodeBlock, CopyButton, EmptyState } from './UI';
export function GeneratedPyTestPanel({ artifact }: { artifact: PyTestArtifact | null }) {
  if (!artifact) return <EmptyState title="No generated test yet" description="The source will appear once compilation completes." />;
  const name = artifact.pytest_source.match(/def (test_[a-zA-Z0-9_]+)\(/)?.[1] ?? 'regression_test';
  const download = () => {
    const url = URL.createObjectURL(new Blob([artifact.pytest_source], { type: 'text/x-python;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name + '.py'; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="stage-panel generated-panel"><div className="generated-heading"><h2>Generated test</h2><div><CopyButton value={artifact.pytest_source} /><button className="button button-quiet" onClick={download}><Download size={14} />Download</button></div></div>
    <p className="test-name identifier">{name}</p>
    <CodeBlock label="Generated pytest source" source={artifact.pytest_source} numbered />
    <details className="disclosure"><summary>Test metadata</summary><dl className="detail-list"><div><dt>SHA-256</dt><dd className="identifier">{artifact.source_digest}</dd></div><div><dt>Compiler</dt><dd className="identifier">{artifact.compiler_version}</dd></div><div><dt>Reported line count</dt><dd>{artifact.line_count}</dd></div></dl></details>
  </div>;
}

