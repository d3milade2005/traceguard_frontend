import { ReactNode, useState } from 'react';
import { ArrowRight, Check, FileCode2 } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useRunDetail } from '../api/queries';
import { pipeline, stopMessage } from '../api/presentation';
import { AnalysisContextPanel } from '../components/AnalysisContextPanel';
import { AttributionDetail } from '../components/AttributionDetail';
import { AttributionSummary } from '../components/AttributionSummary';
import { GeneratedPyTestPanel } from '../components/GeneratedPyTestPanel';
import { PipelineStepper } from '../components/PipelineStepper';
import { RegressionSpecPanel } from '../components/RegressionSpecPanel';
import { formatKB, formatUtcTimestamp, StatusText, stageLabels } from '../components/StatusText';
import { TraceStepRow } from '../components/TraceStepRow';
import { CodeBlock, CopyButton, EmptyState, QueryError } from '../components/UI';
import { ValidationPanel, validationMessage } from '../components/ValidationPanel';
import { EvidenceRange, PipelineStageKey } from '../types/api';

type TraceView = 'canonical' | 'context' | 'raw';
const stageTabs = [{ key: 'attribution', label: 'Attribution' }, { key: 'regression_spec', label: 'Regression spec' }, { key: 'pytest', label: 'Generated test' }, { key: 'validation', label: 'Validation' }] as const;
const stageKeys = ['trace', 'normalized', 'context', ...stageTabs.map(tab => tab.key)];
type QueryState = { isError: boolean; isLoading: boolean; error: unknown; refetch: () => unknown };
function StageSurface({ query, title, children }: { query: QueryState; title: string; children: ReactNode }) {
  if (query.isError) return <QueryError title={title + ' details are unavailable.'} query={query}/>;
  if (query.isLoading) return <EmptyState title={'Loading ' + title.toLowerCase() + '…'}/>;
  return <>{children}</>;
}
export function RunDetailPage() {
  const { runId = '' } = useParams<{ runId: string }>();
  return <RunWorkspace key={runId} runId={runId}/>;
}
function RunWorkspace({ runId }: { runId: string }) {
  const queries = useRunDetail(runId);
  const { run: runQuery, analysis, attribution, regression, generated, validation, trace, original } = queries;
  const run = runQuery.data;
  const [params, setParams] = useSearchParams();
  const current = analysis.data?.stage ?? run?.analysis_stage;
  const requested = params.get('stage');
  const activeStage = (requested && stageKeys.includes(requested) ? requested : current === 'compilation' ? 'pytest' : current ?? 'attribution') as PipelineStageKey;
  const [leftTab, setLeftTab] = useState<TraceView>(requested === 'trace' ? 'raw' : requested === 'context' ? 'context' : 'canonical');
  const [surface, setSurface] = useState<'trace' | 'details'>('details');
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [showOmitted, setShowOmitted] = useState(false);
  const [traceLimit, setTraceLimit] = useState(100);
  if (runQuery.isError) return <QueryError title="Unable to load run." query={runQuery}/>;
  if (!run) return <EmptyState title="Loading run…" description={runId}/>;
  const selectStage = (stage: PipelineStageKey) => {
    setParams(previous => { const next = new URLSearchParams(previous); next.set('stage', stage); return next; }, { replace: true });
    if (stage === 'trace') { setLeftTab('raw'); setSurface('trace'); }
    else if (stage === 'normalized') { setLeftTab('canonical'); setSurface('trace'); }
    else if (stage === 'context') { setLeftTab('context'); setSurface('details'); }
    else setSurface('details');
  };
  const steps = trace.data?.steps ?? [];
  const context = attribution.data?.context_manifest ?? null;
  const inspectStep = (sequence: number) => {
    setLeftTab('canonical'); setSurface('trace');
    const index = steps.findIndex(step => step.sequence === sequence);
    if (index >= traceLimit) setTraceLimit(index + 100);
    setExpandedSteps(previous => ({ ...previous, [sequence]: true }));
    window.setTimeout(() => {
      const element = document.getElementById(`trace-step-${sequence}`);
      element?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      element?.querySelector('button')?.focus({ preventScroll: true });
    }, 50);
  };
  const inspectEvidence = (evidence: EvidenceRange) => inspectStep(evidence.start_sequence);
  const stages = pipeline(run, analysis.data, attribution.data, regression.data, generated.data, validation.data);
  const reason = analysis.data?.stop_reason ?? run.analysis_stop_reason ?? run.failure_code;
  const state = analysis.data?.status ?? run.analysis_status ?? run.status;
  const testReady = generated.data?.status === 'completed';
  const visible = leftTab === 'context' && context && !showOmitted ? steps.filter(step => context.visible_sequences.includes(step.sequence)) : steps;
  return <div className="run-detail-page">
    <header className="run-header">
      <div><h1 className="identifier">{run.id}</h1><div className="run-header-meta"><StatusText value={state} badge/><time dateTime={run.created_at}>{formatUtcTimestamp(run.created_at)}</time><span className="metadata muted">{run.source}</span></div></div>
      <div className="run-actions"><CopyButton value={run.id} label="Copy ID"/><details className="run-metadata"><summary>More details</summary><div className="run-metadata-content"><h2>Run details</h2><dl className="detail-list">
        {Object.entries({ Created: formatUtcTimestamp(run.created_at), Updated: formatUtcTimestamp(run.updated_at), Finished: analysis.data?.finished_at ? formatUtcTimestamp(analysis.data.finished_at) : '—', Model: analysis.data?.model ?? '—', 'Reasoning effort': analysis.data?.reasoning_effort ?? '—', 'Stop reason': reason ?? '—', 'Failure code': run.failure_code ?? '—' }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
      </dl><h3>Pipeline states</h3><dl className="detail-list">{stages.map(stage => <div key={stage.key}><dt>{stageLabels[stage.key]}</dt><dd><StatusText value={stage.status}/></dd></div>)}</dl></div></details></div>
    </header>
    {reason && state !== 'completed' && <p className="context-warning" role="status">{stopMessage(reason)}</p>}
    {analysis.isError && <QueryError title="Unable to load this analysis." query={analysis}/>}
    {!run.analysis_id && <p className="detail-note">No analysis has been requested for this run.</p>}
    <PipelineStepper stages={stages} activeStage={activeStage} onSelectStage={selectStage}/>
    <div className="run-overview">
      {attribution.data ? <AttributionSummary attribution={attribution.data} onSelectDecisiveStep={inspectStep} onSelectEvidence={inspectEvidence}/> : <section className="failure-summary"><StageSurface query={attribution} title="Attribution"><EmptyState title="Attribution pending"/></StageSurface></section>}
      <section className="regression-overview" aria-labelledby="regression-heading"><div className="summary-label" id="regression-heading">Regression</div>
        <div className="artifact-state"><FileCode2 size={16}/><span>{testReady ? 'Test generated' : generated.data?.status === 'failed' ? 'Compilation failed' : 'Test not generated'}</span>{testReady && <Check size={14} className="outcome-success"/>}</div>
        <p className="detail-note">{validationMessage(validation.data ?? null)}</p><button className="text-link next-action" onClick={() => selectStage(testReady ? 'validation' : generated.data?.status === 'failed' ? 'pytest' : 'regression_spec')}>Inspect regression<ArrowRight size={14}/></button>
      </section>
    </div>
    <div className="workspace-surface-nav" aria-label="Workspace view"><button aria-pressed={surface === 'details'} onClick={() => setSurface('details')}>Stage details</button><button aria-pressed={surface === 'trace'} onClick={() => setSurface('trace')}>Trace</button></div>
    <div className={`run-workspace showing-${surface}`}>
      <section className="trace-pane" aria-labelledby="trace-heading">
        <div className="trace-heading"><h2 id="trace-heading">Trace</h2><span className="metadata muted">{run.normalized_step_count} canonical events</span></div>
        <div className="trace-toolbar"><label className="sr-only" htmlFor="trace-view">Trace view</label><select id="trace-view" value={leftTab} onChange={e => { setLeftTab(e.target.value as TraceView); setShowOmitted(false); }}><option value="canonical">Canonical trace</option><option value="context">Analysis context</option><option value="raw">Original trace</option></select>{context && <button className="text-link context-shortcut" onClick={() => selectStage('context')}>Context · {formatKB(context.statistics.estimated_selected_size)} of {formatKB(context.statistics.effective_budget)}</button>}</div>
        {leftTab === 'context' && context && <p className="context-inline">{context.statistics.original_step_count - context.statistics.selected_step_count} steps omitted · {context.truncated_sequences.length} truncated<button className="inline-action" onClick={() => setShowOmitted(!showOmitted)}>{showOmitted ? 'Hide omitted steps' : 'Show omitted steps'}</button></p>}
        {leftTab === 'raw' ? <StageSurface query={original} title="Original trace">{original.data !== undefined && <div className="raw-trace"><CodeBlock label="Original trace" source={JSON.stringify(original.data, null, 2)}/></div>}</StageSurface> : leftTab === 'context' && !context ? <StageSurface query={attribution} title="Context"><EmptyState title="Analysis context is not available yet"/></StageSurface> : <StageSurface query={trace} title="Trace">
          {visible.length ? visible.slice(0, traceLimit).map(step => <TraceStepRow key={step.sequence} step={step} isDecisive={attribution.data?.decisive_sequence === step.sequence} isEvidence={Boolean(attribution.data?.evidence.some(ev => step.sequence >= ev.start_sequence && step.sequence <= ev.end_sequence))} visibility={leftTab === 'context' && context ? context.truncated_sequences.includes(step.sequence) ? 'truncated' : context.visible_sequences.includes(step.sequence) ? 'included' : 'omitted' : undefined} isExpanded={Boolean(expandedSteps[step.sequence])} onToggle={() => setExpandedSteps(previous => ({ ...previous, [step.sequence]: !previous[step.sequence] }))}/>) : <EmptyState title="No canonical trace available yet"/>}
          {visible.length > traceLimit && <button className="button button-quiet" onClick={() => setTraceLimit(n => n + 100)}>Show more events ({visible.length - traceLimit} remaining)</button>}
        </StageSurface>}
      </section>
      <section className="stage-pane" aria-label="Selected stage details">
        <nav className="stage-tabs" aria-label="Stage detail views">{stageTabs.map(tab => <button key={tab.key} aria-pressed={activeStage === tab.key} onClick={() => selectStage(tab.key)}>{tab.label}</button>)}</nav>
        {activeStage === 'attribution' && <StageSurface query={attribution} title="Attribution">{attribution.data ? <AttributionDetail attribution={attribution.data} onSelectEvidence={inspectEvidence} onSelectStep={inspectStep}/> : <EmptyState title="Attribution pending"/>}</StageSurface>}
        {activeStage === 'regression_spec' && <StageSurface query={regression} title="Regression specification"><RegressionSpecPanel spec={regression.data ?? null}/></StageSurface>}
        {activeStage === 'pytest' && <StageSurface query={generated} title="Generated test"><GeneratedPyTestPanel artifact={generated.data ?? null}/></StageSurface>}
        {activeStage === 'validation' && <StageSurface query={validation} title="Validation"><ValidationPanel validation={validation.data ?? null}/></StageSurface>}
        {activeStage === 'context' && <StageSurface query={attribution} title="Context"><AnalysisContextPanel context={context}/></StageSurface>}
        {(activeStage === 'trace' || activeStage === 'normalized') && <div className="stage-panel"><h2>{activeStage === 'trace' ? 'Original trace' : 'Canonical trace'}</h2><p className="detail-note">Persisted trace evidence appears in the trace pane. Canonical sequence numbers are preserved.</p><button className="text-link next-action" onClick={() => selectStage('attribution')}>Inspect attribution<ArrowRight size={14}/></button></div>}
      </section>
    </div>
  </div>;
}
