import { PipelineStageKey, RunSummary } from '../types/api';

type Tone = 'neutral' | 'success' | 'warning' | 'danger';
export const STATUS: Record<string, { label: string; tone: Tone }> = {
  validated: { label: 'Valid', tone: 'success' }, valid: { label: 'Valid', tone: 'success' },
  unverified: { label: 'Needs review', tone: 'warning' }, review_required: { label: 'Needs review', tone: 'warning' },
  compile_error: { label: 'Compilation failed', tone: 'danger' }, failed: { label: 'Failed', tone: 'danger' },
  processing: { label: 'Running', tone: 'warning' }, running: { label: 'Running', tone: 'warning' },
  completed: { label: 'Complete', tone: 'neutral' }, pending: { label: 'Pending', tone: 'neutral' },
  inconclusive: { label: 'Inconclusive', tone: 'warning' }, unattributed: { label: 'Unattributed', tone: 'neutral' },
  attributed: { label: 'Attributed', tone: 'neutral' },
  online: { label: 'Online', tone: 'success' }, ready: { label: 'Ready', tone: 'success' },
  degraded: { label: 'Degraded', tone: 'warning' }, busy: { label: 'Busy', tone: 'warning' },
  offline: { label: 'Offline', tone: 'danger' }, unavailable: { label: 'Unavailable', tone: 'danger' },
};
export const stageLabels: Record<PipelineStageKey, string> = {
  trace: 'Trace', normalized: 'Normalize', context: 'Context', attribution: 'Attribution',
  regression_spec: 'Regression', pytest: 'Test', validation: 'Validation',
};
export const sentenceCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ');

export function StatusText({ value, label, badge = false }: { value: string; label?: string; badge?: boolean }) {
  const item = STATUS[value] ?? { label: sentenceCase(value), tone: 'neutral' };
  return <span className={`status status-${item.tone}${badge ? ' status-badge' : ''}`} title={value}>
    <span className="status-dot" aria-hidden="true" />{label ?? item.label}
  </span>;
}
export function formatUtcTimestamp(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(iso)) + ' UTC';
}
export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(iso));
}
export function formatBytes(bytes: number) { return `${bytes.toLocaleString()} B`; }
export function formatKB(bytes: number) { return `${(bytes / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB`; }
export function attentionIssue(run: RunSummary) {
  if (run.validation_verdict === 'compile_error') return 'Compilation failed';
  if (run.validation_verdict === 'unverified') return 'Generated test did not reproduce failure';
  if (run.confidence === 'low') return 'Low-confidence attribution';
  if (run.confidence === 'medium') return 'Attribution requires review';
  return run.attention_reason ?? 'Regression requires review';
}
