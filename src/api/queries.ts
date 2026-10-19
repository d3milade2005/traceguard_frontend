import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnalysisRecord, AttributionResult, CanonicalTrace, DashboardSummary, Json, PyTestArtifact, RegressionRecord, RunPage, RunRecord, RunSummary, SystemStatus, ValidationResult } from '../types/api';
import { fetchCurrentSession, signOutSession } from './auth';
import { apiFetch } from './client';

const active = (status?: string | null) => ['pending', 'queued', 'processing', 'active'].includes(status ?? '');
const POLL_MS = 5000;
const MAX_POLLS = 120;
export function useSession() {
  return useQuery({ queryKey: ['local-access'], queryFn: fetchCurrentSession, staleTime: Infinity });
}
export function useSignOut() {
  const client = useQueryClient();
  return useMutation({ mutationFn: signOutSession, onSuccess: () => client.clear() });
}
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard'], queryFn: ({ signal }) => apiFetch<DashboardSummary>('/dashboard', { signal }),
    refetchInterval: q => !q.state.error && q.state.data?.active_analyses && q.state.dataUpdateCount < MAX_POLLS ? POLL_MS : false,
  });
}
export interface RunsFilterParams {
  limit: number; offset: number; status?: RunSummary['status']; analysis_status?: RunSummary['analysis_status'];
  responsible_agent?: string; validation_verdict?: RunSummary['validation_verdict']; needs_attention?: boolean;
}
export function useRunsList(params: RunsFilterParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') query.set(key, String(value)); });
  return useQuery({
    queryKey: ['runs', 'list', params],
    staleTime: 0,
    queryFn: ({ signal }) => apiFetch<RunPage>(`/runs?${query}`, { signal }),
    refetchInterval: q => !q.state.error && q.state.data?.items.some(r => active(r.status) || r.analysis_status === 'active') && q.state.dataUpdateCount < MAX_POLLS ? POLL_MS : false,
  });
}
function useArtifact<T extends { status: string }>(kind: string, id?: string | null) {
  return useQuery({
    queryKey: [kind, id],
    queryFn: ({ signal }) => apiFetch<T>(`/${kind}/${encodeURIComponent(id!)}`, { signal }),
    enabled: Boolean(id), staleTime: Infinity,
    refetchInterval: q => !q.state.error && active(q.state.data?.status) && q.state.dataUpdateCount < MAX_POLLS ? POLL_MS : false,
  });
}
export function useRunDetail(runId: string) {
  const run = useQuery({
    queryKey: ['runs', 'detail', runId], enabled: Boolean(runId),
    queryFn: ({ signal }) => apiFetch<RunRecord>(`/runs/${encodeURIComponent(runId)}`, { signal }),
    refetchInterval: q => !q.state.error && (active(q.state.data?.status) || q.state.data?.analysis_status === 'active') && q.state.dataUpdateCount < MAX_POLLS ? POLL_MS : false,
  });
  const analysis = useQuery({
    queryKey: ['analysis', runId], enabled: Boolean(run.data?.analysis_id),
    queryFn: ({ signal }) => apiFetch<AnalysisRecord>(`/runs/${encodeURIComponent(runId)}/analysis`, { signal }),
    refetchInterval: q => !q.state.error && q.state.data?.status === 'active' && q.state.dataUpdateCount < MAX_POLLS ? POLL_MS : false,
  });
  const ids = analysis.data ?? run.data;
  const attribution = useArtifact<AttributionResult>('attributions', ids?.attribution_id);
  const regression = useArtifact<RegressionRecord>('regression-specs', ids?.regression_spec_id);
  const generated = useArtifact<PyTestArtifact>('generated-tests', ids?.generated_test_id);
  const validation = useArtifact<ValidationResult>('validations', ids?.validation_id);
  const trace = useQuery({
    queryKey: ['trace', runId], enabled: run.data?.status === 'normalized', staleTime: Infinity,
    queryFn: ({ signal }) => apiFetch<CanonicalTrace>(`/runs/${encodeURIComponent(runId)}/trace`, { signal }),
  });
  const original = useQuery({
    queryKey: ['original-trace', runId], enabled: Boolean(run.data), staleTime: Infinity,
    queryFn: ({ signal }) => apiFetch<Json>(`/runs/${encodeURIComponent(runId)}/original-trace`, { signal }),
  });
  return { run, analysis, attribution, regression, generated, validation, trace, original };
}
export function useSystemStatus() {
  return useQuery({ queryKey: ['system'], queryFn: ({ signal }) => apiFetch<SystemStatus>('/system', { signal }) });
}
