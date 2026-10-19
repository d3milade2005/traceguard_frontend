import { PipelineStageKey, RunSummary } from '../types/api';
import { stopMessage } from '../api/presentation';
type Tone = 'neutral' | 'success' | 'warning' | 'danger';
export const STATUS: Record<string, { label: string; tone: Tone }> = {
  valid: { label: 'Valid', tone: 'success' }, review_required: { label: 'Needs review', tone: 'warning' },
  needs_review: { label: 'Needs review', tone: 'warning' }, failed: { label: 'Failed', tone: 'danger' },
  processing: { label: 'Processing', tone: 'warning' }, active: { label: 'Active', tone: 'warning' },
  queued: { label: 'Queued', tone: 'neutral' }, completed: { label: 'Complete', tone: 'neutral' },
  normalized: { label: 'Normalized', tone: 'neutral' }, pending: { label: 'Pending', tone: 'neutral' },
  inconclusive: { label: 'Inconclusive', tone: 'warning' }, abstain: { label: 'Needs review', tone: 'warning' },
  attributed: { label: 'Attributed', tone: 'neutral' }, ok: { label: 'Online', tone: 'success' },
  not_reproduced: { label: 'Failure not reproduced', tone: 'warning' },
  not_discriminating: { label: 'Test does not distinguish the fix', tone: 'warning' },
  execution_error: { label: 'Execution error', tone: 'danger' }, timeout: { label: 'Timed out', tone: 'warning' },
  resource_limit: { label: 'Resource limit', tone: 'warning' },
};
export const stageLabels: Record<PipelineStageKey, string> = {
  trace: 'Trace', normalized: 'Normalize', context: 'Context', attribution: 'Attribution',
  regression_spec: 'Regression', pytest: 'Test', validation: 'Validation',
};
export const sentenceCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ');
export function StatusText({ value, label, badge = false }: { value: string; label?: string; badge?: boolean }) {
  const item = STATUS[value] ?? { label: sentenceCase(value), tone: 'neutral' };
  return <span className={`status status-${item.tone}${badge ? ' status-badge' : ''}`} title={value}><span className="status-dot" aria-hidden="true"/>{label ?? item.label}</span>;
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
  if (run.analysis_stop_reason) return stopMessage(run.analysis_stop_reason);
  if (run.status === 'failed' || run.attribution_status === 'failed') return 'Processing failed';
  if (run.regression_disposition === 'needs_review') return 'Regression specification requires review';
  return 'Run requires attention';
}
