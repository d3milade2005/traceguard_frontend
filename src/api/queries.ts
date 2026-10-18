import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DashboardSummary,
  RunDetail,
  RunSummary,
  SystemStatus,
} from '../types/api';
import { fetchCurrentSession, signOutSession } from './auth';
import { apiFetch, USE_MOCK_API } from './client';
import {
  getMockRunDetail,
  MOCK_DASHBOARD_SUMMARY,
  MOCK_RUN_SUMMARIES,
  MOCK_SYSTEM_STATUS,
} from './mockData';

export function useSession() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOutSession,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
    },
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async (): Promise<DashboardSummary> => {
      if (USE_MOCK_API) {
        return MOCK_DASHBOARD_SUMMARY;
      }
      // TODO(backend-integration): Reconcile with GET /api/v1/dashboard or GET /api/v1/runs aggregation
      return apiFetch<DashboardSummary>('/api/v1/dashboard');
    },
  });
}

export interface RunsFilterParams {
  search?: string;
  confidence?: string;
  verdict?: string;
  page?: number;
}

export function useRunsList(params: RunsFilterParams) {
  return useQuery({
    queryKey: ['runs', 'list', params],
    queryFn: async (): Promise<{ items: RunSummary[]; total: number }> => {
      if (USE_MOCK_API) {
        const filtered = MOCK_RUN_SUMMARIES.filter((run) => {
          if (params.search) {
            const q = params.search.toLowerCase();
            const matchesId = run.run_id.toLowerCase().includes(q);
            const matchesAgent = (run.responsible_agent ?? '').toLowerCase().includes(q);
            if (!matchesId && !matchesAgent) return false;
          }
          if (params.confidence && params.confidence !== 'all') {
            if (run.confidence !== params.confidence) return false;
          }
          if (params.verdict && params.verdict !== 'all') {
            if (run.validation_verdict !== params.verdict) return false;
          }
          return true;
        });

        return { items: filtered, total: filtered.length };
      }

      // TODO(backend-integration): Confirm query parameter names on GET /api/v1/runs
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set('q', params.search);
      if (params.confidence && params.confidence !== 'all') {
        searchParams.set('confidence', params.confidence);
      }
      if (params.verdict && params.verdict !== 'all') {
        searchParams.set('verdict', params.verdict);
      }
      if (params.page) searchParams.set('page', String(params.page));

      return apiFetch<{ items: RunSummary[]; total: number }>(
        `/api/v1/runs?${searchParams.toString()}`
      );
    },
  });
}

export function useRunDetail(runId: string) {
  return useQuery({
    queryKey: ['runs', 'detail', runId],
    queryFn: async (): Promise<RunDetail> => {
      if (USE_MOCK_API) {
        return getMockRunDetail(runId);
      }
      // TODO(backend-integration): Confirm composite GET /api/v1/runs/{run_id} schema
      return apiFetch<RunDetail>(`/api/v1/runs/${encodeURIComponent(runId)}`);
    },
    enabled: Boolean(runId),
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ['system', 'status'],
    queryFn: async (): Promise<SystemStatus> => {
      if (USE_MOCK_API) {
        return MOCK_SYSTEM_STATUS;
      }
      // TODO(backend-integration): Confirm GET /api/v1/system response fields
      return apiFetch<SystemStatus>('/api/v1/system');
    },
  });
}
