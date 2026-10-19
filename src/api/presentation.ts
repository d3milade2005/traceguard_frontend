import { AnalysisRecord, AttributionResult, PipelineStageKey, PipelineStageState, PyTestArtifact, RegressionRecord, RunRecord, StageStatus, ValidationResult } from '../types/api';

const reasons: Record<string, string> = {
  attribution_abstained: 'Attribution requires review',
  regression_needs_review: 'Regression specification requires review',
  not_reproduced: 'Generated test did not reproduce the failure',
  not_discriminating: 'Generated test does not distinguish faulty and corrected behavior',
  inconclusive: 'Validation was inconclusive',
  ANALYSIS_DEADLINE_EXCEEDED: 'Analysis timed out',
  REPLAY_CONTRACT_INCOMPATIBLE: 'The recorded scenario is incompatible with the replay harness',
};
export function stopMessage(reason?: string | null) { return reason ? reasons[reason] ?? 'Analysis stopped. Inspect the stage details.' : null; }
export function pipeline(run: RunRecord, analysis?: AnalysisRecord, attribution?: AttributionResult, regression?: RegressionRecord, generated?: PyTestArtifact, validation?: ValidationResult): PipelineStageState[] {
  const states: Record<PipelineStageKey, StageStatus> = {
    trace: 'completed', normalized: run.status === 'normalized' ? 'completed' : run.status,
    context: attribution?.context_manifest ? 'completed' : 'pending',
    attribution: attribution?.decision === 'abstain' ? 'review_required' : attribution?.status ?? 'pending',
    regression_spec: regression?.disposition === 'needs_review' ? 'review_required' : regression?.status ?? 'pending',
    pytest: generated?.status ?? 'pending',
    validation: validation?.status ?? 'pending',
  };
  const stage = analysis?.stage ?? run.analysis_stage;
  const status = analysis?.status ?? run.analysis_status;
  const key = stage === 'compilation' ? 'pytest' : stage;
  if (key) {
    if (status === 'failed') states[key] = 'failed';
    else if (status === 'review_required' && states[key] !== 'failed') states[key] = 'review_required';
    else if (status === 'active' && states[key] === 'pending') states[key] = 'processing';
  }
  // Only durable artifacts establish completion; downstream stages stay pending.
  return (Object.keys(states) as PipelineStageKey[]).map(key => ({ key, label: key, status: states[key] }));
}
