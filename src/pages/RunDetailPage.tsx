import { useState } from 'react';
import { ArrowRight, Check, FileCode2 } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useRunDetail } from '../api/queries';
import { AnalysisContextPanel } from '../components/AnalysisContextPanel';
import { AttributionDetail } from '../components/AttributionDetail';
import { AttributionSummary } from '../components/AttributionSummary';
import { GeneratedPyTestPanel } from '../components/GeneratedPyTestPanel';
import { PipelineStepper } from '../components/PipelineStepper';
import { RegressionSpecPanel } from '../components/RegressionSpecPanel';
import { formatKB, formatUtcTimestamp, StatusText } from '../components/StatusText';
import { TraceStepRow } from '../components/TraceStepRow';
import { CodeBlock, CopyButton, EmptyState } from '../components/UI';
import { ValidationPanel } from '../components/ValidationPanel';
import { EvidenceRange, PipelineStageKey } from '../types/api';

type TraceView = 'canonical' | 'context' | 'raw';
const stageTabs = [{ key: 'attribution', label: 'Attribution' }, { key: 'regression_spec', label: 'Regression spec' }, { key: 'pytest', label: 'Generated test' }, { key: 'validation', label: 'Validation' }] as const;
const stageKeys = ['trace', 'normalized', 'context', ...stageTabs.map(tab => tab.key)];

export function RunDetailPage() {
  const { runId = 'run_9f82a4c1' } = useParams<{ runId: string }>();
  return <RunWorkspace key={runId} runId={runId} />;
}
function RunWorkspace({ runId }: { runId: string }) {
  const { data: run, isLoading, isError, refetch } = useRunDetail(runId);
  const [params, setParams] = useSearchParams();
  const requestedStage = params.get('stage');
  const activeStage = (requestedStage && stageKeys.includes(requestedStage) ? requestedStage : 'validation') as PipelineStageKey;
  const [leftTab, setLeftTab] = useState<TraceView>(activeStage === 'trace' ? 'raw' : activeStage === 'context' ? 'context' : 'canonical');
  const [surface, setSurface] = useState<'trace' | 'details'>('details');
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [showOmitted, setShowOmitted] = useState(false);
  if (isError) return <EmptyState title="Unable to load run" description={runId} retry={() => void refetch()} />;
  if (isLoading || !run) return <EmptyState title="Loading run…" description={runId} />;

  const selectStage = (stage: PipelineStageKey) => {
    setParams(previous => { const next = new URLSearchParams(previous); next.set('stage', stage); return next; }, { replace: true });
    if (stage === 'trace') { setLeftTab('raw'); setSurface('trace'); }
    else if (stage === 'normalized') { setLeftTab('canonical'); setSurface('trace'); }
    else if (stage === 'context') { setLeftTab('context'); setSurface('details'); }
    else setSurface('details');
  };
  const inspectStep = (sequence: number) => {
    setLeftTab('canonical'); setSurface('trace');
    setExpandedSteps(previous => ({ ...previous, [sequence]: true }));
    window.setTimeout(() => {
      const element = document.getElementById(`trace-step-${sequence}`);
      element?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      element?.querySelector('button')?.focus({ preventScroll: true });
    }, 50);
  };
  const inspectEvidence = (evidence: EvidenceRange) => inspectStep(evidence.start_sequence);
  const validation = run.validation_result;
  const failedStage = run.stages.find(stage => stage.status === 'failed');
  const runningStage = run.stages.find(stage => stage.status === 'running');
  const runState = failedStage ? 'failed' : runningStage ? 'running' : validation?.final_verdict ?? 'pending';
  const headerLabel = runState === 'validated' ? 'Valid regression' : undefined;
  return <div className="run-detail-page">
    <header className="run-header">
      <div><h1 className="identifier">{run.run_id}</h1><div className="run-header-meta"><StatusText value={runState} label={headerLabel} badge /><time dateTime={run.created_at}>{formatUtcTimestamp(run.created_at)}</time></div></div>
      <div className="run-actions"><CopyButton value={run.run_id} label="Copy ID" /><details className="run-metadata"><summary>More details</summary><div className="run-metadata-content"><h2>Run details</h2><dl className="detail-list"><div><dt>Created</dt><dd>{formatUtcTimestamp(run.created_at)}</dd></div><div><dt>Completed</dt><dd>{run.completed_at ? formatUtcTimestamp(run.completed_at) : 'Not completed'}</dd></div></dl><h3>Pipeline timings</h3><dl className="detail-list">{run.stages.map(stage => <div key={stage.key}><dt>{stage.label}</dt><dd><StatusText value={stage.status} />{stage.duration_ms !== undefined && <span className="muted"> · {stage.duration_ms} ms</span>}</dd></div>)}</dl></div></details></div>
    </header>
    <PipelineStepper stages={run.stages} activeStage={activeStage} onSelectStage={selectStage} />
    <div className="run-overview">
      <AttributionSummary attribution={run.attribution} onSelectDecisiveStep={inspectStep} onSelectEvidence={inspectEvidence} />
      <section className="regression-overview" aria-labelledby="regression-heading"><div className="summary-label" id="regression-heading">Regression</div>
        <div className="artifact-state"><FileCode2 size={16} /><span>{run.pytest_artifact ? 'Test generated' : failedStage?.key === 'pytest' ? 'Compilation failed' : 'Test not generated'}</span>{run.pytest_artifact && <Check size={14} className="outcome-success" />}</div>
        <p className="detail-note">{validation?.final_verdict === 'validated' ? 'Catches the faulty behavior and passes after correction.' : validation?.faulty_execution.actual_outcome === 'PASS' ? 'The generated test did not catch the faulty behavior.' : validation ? 'Review the validation outcome before using this regression.' : run.pytest_artifact ? 'Validation has not completed.' : 'No executable regression is available yet.'}</p>
        <button className="text-link next-action" onClick={() => selectStage(run.pytest_artifact ? 'validation' : failedStage?.key === 'pytest' ? 'pytest' : 'regression_spec')}>{run.pytest_artifact ? 'Inspect validation' : 'Inspect regression'}<ArrowRight size={14} /></button>
      </section>
    </div>
    <div className="workspace-surface-nav" aria-label="Workspace view"><button aria-pressed={surface === 'details'} onClick={() => setSurface('details')}>Stage details</button><button aria-pressed={surface === 'trace'} onClick={() => setSurface('trace')}>Trace</button></div>
    <div className={`run-workspace showing-${surface}`}>
      <section className="trace-pane" aria-labelledby="trace-heading">
        <div className="trace-heading"><h2 id="trace-heading">Trace</h2><span className="metadata muted">{run.canonical_steps.length} supplied events</span></div>
        <div className="trace-toolbar"><label className="sr-only" htmlFor="trace-view">Trace view</label><select id="trace-view" value={leftTab} onChange={e => { setLeftTab(e.target.value as TraceView); setShowOmitted(false); }}><option value="canonical">Canonical trace</option><option value="context">Analysis context</option><option value="raw">Original trace</option></select><button className="text-link context-shortcut" onClick={() => selectStage('context')}>Context · {formatKB(run.analysis_context.used_utf8_bytes)} of {formatKB(run.analysis_context.budget_utf8_bytes)}</button></div>
        {leftTab === 'context' && <p className="context-inline">{run.analysis_context.omitted_step_count} steps omitted · {run.analysis_context.truncated_step_count} truncated<button className="inline-action" onClick={() => setShowOmitted(!showOmitted)}>{showOmitted ? 'Hide omitted steps' : 'Show omitted steps'}</button></p>}
        {leftTab === 'raw' ? <div className="raw-trace"><CodeBlock label="Original trace" source={JSON.stringify(run.original_trace, null, 2)} /></div> : run.canonical_steps.length ? run.canonical_steps.map(step => {
          if (leftTab === 'context' && step.context_meta.visibility === 'omitted' && !showOmitted) {
            const range = run.analysis_context.omitted_ranges.find(range => step.sequence >= range.start_sequence && step.sequence <= range.end_sequence);
            const firstSupplied = run.canonical_steps.find(item => range && item.sequence >= range.start_sequence && item.sequence <= range.end_sequence);
            if (range && firstSupplied?.sequence !== step.sequence) return null;
            return <div key={step.sequence} className="trace-omission"><span>{range ? `Steps ${range.start_sequence}–${range.end_sequence}` : `Step ${step.sequence}`} omitted from context</span><button className="inline-action" onClick={() => setShowOmitted(true)}>Show</button></div>;
          }
          const evidence = run.attribution.evidence.find(ev => step.sequence >= ev.start_sequence && step.sequence <= ev.end_sequence);
          return <TraceStepRow key={step.sequence} step={step} isDecisive={run.attribution.decisive_sequence === step.sequence} isEvidence={Boolean(evidence)} evidenceLabel={evidence?.label} viewMode={leftTab} isExpanded={Boolean(expandedSteps[step.sequence])} onToggle={() => setExpandedSteps(previous => ({ ...previous, [step.sequence]: !previous[step.sequence] }))} />;
        }) : <EmptyState title="No trace events available" />}
      </section>
      <section className="stage-pane" aria-label="Selected stage details">
        <nav className="stage-tabs" aria-label="Stage detail views">{stageTabs.map(tab => <button key={tab.key} aria-pressed={activeStage === tab.key} onClick={() => selectStage(tab.key)}>{tab.label}</button>)}</nav>
        {activeStage === 'attribution' && <AttributionDetail attribution={run.attribution} onSelectEvidence={inspectEvidence} onSelectStep={inspectStep} />}
        {activeStage === 'regression_spec' && <RegressionSpecPanel spec={run.regression_spec} />}
        {activeStage === 'pytest' && <GeneratedPyTestPanel artifact={run.pytest_artifact} />}
        {activeStage === 'validation' && <ValidationPanel validation={validation} />}
        {activeStage === 'context' && <AnalysisContextPanel run={run} />}
        {(activeStage === 'trace' || activeStage === 'normalized') && <div className="stage-panel"><h2>{activeStage === 'trace' ? 'Original trace' : 'Canonical trace'}</h2><p className="detail-note">{activeStage === 'trace' ? 'The original payload is shown in the trace pane.' : 'Events retain their canonical sequence numbers. Expand any event to inspect its complete supplied payload.'}</p><p className="detail-note context-description">{run.canonical_steps.length} events supplied · Sequence numbers may include gaps.</p><button className="text-link next-action" onClick={() => selectStage('attribution')}>Inspect attribution<ArrowRight size={14} /></button></div>}
      </section>
    </div>
  </div>;
}
