/**
 * TraceGuard Domain & API Contracts
 *
 * Strictly enforces:
 * 1. Categorical confidence ('low' | 'medium' | 'high')
 * 2. Singular decisive_sequence vs. evidence sequence ranges
 * 3. UTF-8 byte context budgeting and truncation metadata
 * 4. Safe, bounded validation diagnostics (no raw stdout/stderr or env vars)
 * 5. No private model chain-of-thought or secret keys
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type PipelineStageKey =
  | 'trace'
  | 'normalized'
  | 'context'
  | 'attribution'
  | 'regression_spec'
  | 'pytest'
  | 'validation';

export type StageStatus = 'completed' | 'running' | 'failed' | 'pending';

export type AttributionDecision = 'attributed' | 'inconclusive' | 'unattributed';

export type ValidationVerdict =
  | 'validated'
  | 'unverified'
  | 'compile_error'
  | 'pending';

export type ContextVisibility = 'included' | 'truncated' | 'omitted';

export interface UserSession {
  id: string;
  username: string;
  avatar_url: string;
}

export interface EvidenceRange {
  id: string;
  start_sequence: number;
  end_sequence: number; // Equal to start_sequence when referencing a single step
  label: string;
  rationale_summary: string;
}

export interface AttributionResult {
  decision: AttributionDecision;
  responsible_agent: string | null;
  decisive_sequence: number | null;
  confidence: ConfidenceLevel;
  explanation: string;
  evidence: EvidenceRange[];
  model: string;
  provider: string;
  prompt_version: string;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  latency_ms: number;
}

export interface CanonicalStep {
  sequence: number;
  agent: string;
  event_type: 'agent_message' | 'tool_call' | 'tool_result' | 'state_mutation' | 'system_error';
  timestamp_offset_ms: number;
  summary: string;
  canonical_payload: Record<string, unknown>;
  context_meta: {
    visibility: ContextVisibility;
    original_utf8_bytes: number;
    included_utf8_bytes: number;
    prepared_excerpt?: string;
    omission_reason?: string;
  };
}

export interface OmittedSequenceRange {
  start_sequence: number;
  end_sequence: number;
  step_count: number;
  omitted_utf8_bytes: number;
  reason: string;
}

export interface AnalysisContextMeta {
  budget_utf8_bytes: number;
  used_utf8_bytes: number;
  omitted_utf8_bytes: number;
  included_step_count: number;
  truncated_step_count: number;
  omitted_step_count: number;
  omitted_ranges: OmittedSequenceRange[];
}

export interface RegressionAssertion {
  id: string;
  assertion_type: 'forbid_argument' | 'require_tool_call' | 'state_invariant' | 'schema_conformance';
  target: string;
  operator: string;
  expected_value: string;
  description: string;
}

export interface RegressionSpec {
  spec_version: string;
  responsible_agent: string;
  decisive_sequence: number;
  scenario: {
    title: string;
    initial_state_summary: string;
    stimulus_sequence: number;
    stimulus_input: Record<string, unknown>;
    mocked_dependencies: string[];
  };
  assertions: RegressionAssertion[];
}

export interface PyTestArtifact {
  compiler_version: string;
  source_digest: string;
  line_count: number;
  pytest_source: string;
}

export interface BoundedExecutionSummary {
  mode: 'faulty' | 'corrected';
  expected_outcome: 'FAIL' | 'PASS';
  actual_outcome: 'FAIL' | 'PASS' | 'ERROR';
  expectation_met: boolean;
  duration_ms: number;
  bounded_diagnostic: string;
  assertion_outcomes: {
    assertion_id: string;
    passed: boolean;
    message: string;
    line_number: number;
  }[];
}

export interface ValidationResult {
  final_verdict: ValidationVerdict;
  validator_version: string;
  validated_at: string;
  summary_note: string;
  faulty_execution: BoundedExecutionSummary;
  corrected_execution: BoundedExecutionSummary;
}

export interface PipelineStageState {
  key: PipelineStageKey;
  label: string;
  status: StageStatus;
  duration_ms?: number;
}

export interface RunSummary {
  run_id: string;
  current_stage: PipelineStageKey;
  stage_status: StageStatus;
  responsible_agent: string | null;
  decisive_sequence: number | null;
  confidence: ConfidenceLevel | null;
  validation_verdict: ValidationVerdict;
  attention_required: boolean;
  attention_reason?: string;
  created_at: string;
}

export interface RunDetail {
  run_id: string;
  created_at: string;
  completed_at: string | null;
  stages: PipelineStageState[];
  attribution: AttributionResult;
  analysis_context: AnalysisContextMeta;
  canonical_steps: CanonicalStep[];
  original_trace: Record<string, unknown>;
  regression_spec: RegressionSpec | null;
  pytest_artifact: PyTestArtifact | null;
  validation_result: ValidationResult | null;
}

export interface DashboardSummary {
  metrics: {
    total_runs: number;
    active_analyses: number;
    review_required: number;
    valid_regressions: number;
  };
  needs_attention: RunSummary[];
  recent_runs: RunSummary[];
}

export interface SystemStatus {
  api_status: 'online' | 'degraded' | 'offline';
  worker_status: 'online' | 'degraded' | 'offline';
  validation_runner_status: 'ready' | 'busy' | 'unavailable';
  environment: 'local' | 'staging' | 'production';
  model_config: {
    provider: string;
    model: string;
    reasoning_effort: 'low' | 'medium' | 'high';
    context_budget_utf8_bytes: number;
  };
  pipeline_versions: {
    normalizer_version: string;
    prompt_version: string;
    compiler_version: string;
    validator_version: string;
  };
}
