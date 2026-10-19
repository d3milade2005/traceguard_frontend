/** Wire contracts from backend Pydantic response schemas. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
export type OperationStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
export type ValidationVerdict = 'valid' | 'not_reproduced' | 'not_discriminating' | 'inconclusive';
export type AnalysisStage = 'attribution' | 'regression_spec' | 'compilation' | 'validation';
export type AnalysisStatus = 'active' | 'completed' | 'review_required' | 'failed';
export type RunStatus = 'pending' | 'queued' | 'processing' | 'normalized' | 'failed';
export type PipelineStageKey = 'trace' | 'normalized' | 'context' | 'attribution' | 'regression_spec' | 'pytest' | 'validation';
export type StageStatus = OperationStatus | 'review_required';
export interface PipelineStageState { key: PipelineStageKey; label: string; status: StageStatus }
export interface UserSession { id: string; username: string; avatar_url: string }
export interface RunSummary {
  id: string; source: string; status: RunStatus; created_at: string;
  analysis_id: string | null; analysis_status: AnalysisStatus | null; analysis_stage: AnalysisStage | null;
  analysis_stop_reason: string | null; attribution_id: string | null; attribution_status: string | null;
  responsible_agent: string | null; decisive_sequence: number | null; confidence: ConfidenceLevel | null;
  regression_spec_id: string | null; regression_disposition: 'synthesizable' | 'needs_review' | null;
  generated_test_id: string | null; validation_id: string | null; validation_verdict: ValidationVerdict | null;
  needs_attention: boolean;
}
export interface RunRecord extends RunSummary {
  updated_at: string; failure_code: string | null; failed_at: string | null; normalized_step_count: number;
}
export interface RunPage { items: RunSummary[]; total: number; limit: number; offset: number }
export interface DashboardSummary {
  total_runs: number; active_analyses: number; review_required_analyses: number; valid_regressions: number;
  recent_runs: RunSummary[]; needs_attention_runs: RunSummary[];
}
export interface AnalysisRecord {
  id: string; run_id: string; status: AnalysisStatus; stage: AnalysisStage; model: string; reasoning_effort: ReasoningEffort;
  attribution_id: string | null; regression_spec_id: string | null; generated_test_id: string | null; validation_id: string | null;
  stop_reason: string | null; deadline_at: string; finished_at: string | null; created_at: string; updated_at: string;
}
export interface EvidenceRange { start_sequence: number; end_sequence: number; reason: string; contains_truncated: boolean }
export interface ContextManifest {
  visible_sequences: number[]; truncated_sequences: number[]; omitted_ranges: { start: number; end: number }[];
  statistics: {
    size_unit: string; budget: number; reserved_headroom: number; effective_budget: number;
    original_step_count: number; selected_step_count: number; estimated_original_size: number;
    estimated_selected_size: number; pruning_occurred: boolean;
  };
}
export interface ModelMetadata {
  provider: string; model: string; reasoning_effort: ReasoningEffort; prompt_version: string;
  response_id: string | null; response_model: string | null; input_tokens: number | null;
  output_tokens: number | null; reasoning_tokens: number | null; latency_ms: number | null;
  input_sha256: string | null; output_diagnostics: Json; failure_code: string | null;
  failed_at: string | null; completed_at: string | null; created_at: string; updated_at: string;
}
export interface AttributionResult extends ModelMetadata {
  id: string; run_id: string; status: OperationStatus; decision: 'attributed' | 'abstain' | null;
  responsible_agent: string | null; decisive_sequence: number | null; failure_category: string | null;
  explanation: string | null; confidence: ConfidenceLevel | null; abstention_reason: string | null;
  evidence: EvidenceRange[]; context_manifest: ContextManifest | null;
}
export interface CanonicalStep {
  sequence: number; agent_id: string | null; event_type: string; input: Json; output: Json;
  tool_name: string | null; tool_arguments: Json; tool_result: Json; status: string | null;
  occurred_at: string | null; step_metadata: Record<string, Json>;
}
export interface CanonicalTrace { source: string; task: string; steps: CanonicalStep[] }
export interface SourceReference { sequence: number; field: 'input' | 'output' | 'tool_arguments' | 'tool_result' | 'status'; path: (string | number)[] }
export interface Citation { sequence: number; field: 'task' | SourceReference['field']; quote: string }
export interface RegressionAssertion {
  kind: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  observable: 'output' | 'tool_result' | 'status'; path: (string | number)[]; expected: string | boolean | number | null; evidence: Citation[];
}
export interface RegressionSpec {
  version: 'regression-spec-v1'; disposition: 'synthesizable' | 'needs_review'; test_name: string; title: string;
  target_agent: string | null; failure_summary: string; scenario: { stimulus: SourceReference; preconditions: SourceReference[] } | null;
  assertions: RegressionAssertion[]; evidence: Citation[]; review_reason: string | null;
}
export interface RegressionRecord extends ModelMetadata {
  id: string; attribution_id: string; status: OperationStatus; disposition: RegressionSpec['disposition'] | null;
  version: string | null; title: string | null; target_agent: string | null; review_reason: string | null;
  spec: RegressionSpec | null; scenario_snapshot: { stimulus: Json; preconditions: Json[] } | null;
}
export interface PyTestArtifact {
  id: string; regression_spec_id: string; version: 'generated-test-v1'; status: 'completed' | 'failed'; framework: 'pytest';
  test_name: string | null; compiler_version: string; harness_identifier: string; harness_version: string;
  source_code: string | null; source_digest: string | null; failure_code: string | null;
  failed_at: string | null; completed_at: string | null; created_at: string; updated_at: string;
}
export type Outcome = 'passed' | 'assertion_failed' | 'execution_error' | 'timeout' | 'resource_limit';
export interface BoundedExecutionSummary {
  variant: 'faulty' | 'corrected'; outcome: Outcome; exit_code: number | null; duration_ms: number;
  passed: number; failed: number; errors: number; timed_out: boolean; resource_limited: boolean;
  output_truncated: boolean; diagnostic: 'PASS' | 'REGRESSION_ASSERTION_FAILED' | 'EXECUTION_ERROR' | 'TIMEOUT' | 'RESOURCE_LIMIT' | 'OUTPUT_LIMIT' | 'RESULT_INVALID'; container_id: string;
}
export interface RuntimeIdentity {
  image_reference: string; image_id: string; repository_digest: string | null; runtime_version: 'regression-sandbox-v1';
  bundle_digest: string; python_version: '3.12.12'; pytest_version: '9.1.1'; harness_implementation: 'controlled-calculator-v1';
  limits: { timeout_seconds: number; command_timeout_seconds: number; memory_mb: number; cpus: number; pids: number; tmp_mb: number; output_bytes: number; result_bytes: number; source_bytes: number };
}
export interface ValidationResult {
  id: string; generated_test_id: string; status: OperationStatus; validator_version: string; source_digest: string;
  compiler_version: string; harness_identifier: string; harness_version: string; image_reference: string;
  runtime_identity: RuntimeIdentity | null; verdict: ValidationVerdict | null; faulty_outcome: Outcome | null;
  corrected_outcome: Outcome | null; faulty_execution: BoundedExecutionSummary | null; corrected_execution: BoundedExecutionSummary | null;
  failure_code: string | null; completed_at: string | null; failed_at: string | null; created_at: string; updated_at: string;
}
export interface SystemStatus {
  api_health: 'ok'; environment: 'development' | 'test' | 'production'; model: string; reasoning_effort: ReasoningEffort;
  attribution_prompt_version: string; context_policy_version: string; regression_spec_version: string;
  regression_prompt_version: string; compiler_version: string; validator_version: string;
}
