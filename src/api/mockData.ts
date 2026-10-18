import {
  DashboardSummary,
  RunDetail,
  RunSummary,
  SystemStatus,
  UserSession,
} from '../types/api';

/**
 * Isolated Mock Data Layer
 *
 * All demo data lives strictly in this module so UI components remain pure
 * and ready for live FastAPI integration.
 */

export const MOCK_USER_SESSION: UserSession = {
  id: 'usr_gh_90412',
  username: 'alex-systems',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
};

export const MOCK_SYSTEM_STATUS: SystemStatus = {
  api_status: 'online',
  worker_status: 'online',
  validation_runner_status: 'ready',
  environment: 'staging',
  model_config: {
    provider: 'openai',
    model: 'gpt-4.1-2025-04-14',
    reasoning_effort: 'medium',
    context_budget_utf8_bytes: 32768,
  },
  pipeline_versions: {
    normalizer_version: 'norm-v1.4.0',
    prompt_version: 'attr-prompt-v2.3.1',
    compiler_version: 'pytest-synth-v1.2.0',
    validator_version: 'sandbox-val-v1.1.4',
  },
};

export const MOCK_RUN_SUMMARIES: RunSummary[] = [
  {
    run_id: 'run_9f82a4c1',
    current_stage: 'validation',
    stage_status: 'completed',
    responsible_agent: 'PlannerAgent',
    decisive_sequence: 14,
    confidence: 'high',
    validation_verdict: 'validated',
    attention_required: false,
    created_at: '2026-10-17T09:14:22Z',
  },
  {
    run_id: 'run_8a41f9c2',
    current_stage: 'validation',
    stage_status: 'completed',
    responsible_agent: 'PlannerAgent',
    decisive_sequence: 11,
    confidence: 'low',
    validation_verdict: 'unverified',
    attention_required: true,
    attention_reason: 'False negative on faulty run',
    created_at: '2026-10-17T08:52:10Z',
  },
  {
    run_id: 'run_3c90e1b4',
    current_stage: 'attribution',
    stage_status: 'completed',
    responsible_agent: 'SchemaRetriever',
    decisive_sequence: 8,
    confidence: 'medium',
    validation_verdict: 'pending',
    attention_required: true,
    attention_reason: 'Medium attribution confidence',
    created_at: '2026-10-17T08:31:04Z',
  },
  {
    run_id: 'run_7d12a0f8',
    current_stage: 'pytest',
    stage_status: 'failed',
    responsible_agent: 'SQLSynthesizer',
    decisive_sequence: 19,
    confidence: 'high',
    validation_verdict: 'compile_error',
    attention_required: true,
    attention_reason: 'PyTest compilation failed',
    created_at: '2026-10-17T07:45:19Z',
  },
  {
    run_id: 'run_6b55d2e9',
    current_stage: 'context',
    stage_status: 'running',
    responsible_agent: null,
    decisive_sequence: null,
    confidence: null,
    validation_verdict: 'pending',
    attention_required: false,
    created_at: '2026-10-17T07:40:00Z',
  },
  {
    run_id: 'run_4e01c8a7',
    current_stage: 'validation',
    stage_status: 'completed',
    responsible_agent: 'ToolRouter',
    decisive_sequence: 6,
    confidence: 'high',
    validation_verdict: 'validated',
    attention_required: false,
    created_at: '2026-10-17T06:18:51Z',
  },
  {
    run_id: 'run_1a77b3d0',
    current_stage: 'validation',
    stage_status: 'completed',
    responsible_agent: 'VerificationAgent',
    decisive_sequence: 22,
    confidence: 'high',
    validation_verdict: 'validated',
    attention_required: false,
    created_at: '2026-10-16T22:09:12Z',
  },
];

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  metrics: {
    total_runs: 142,
    active_analyses: 2,
    review_required: 3,
    valid_regressions: 118,
  },
  needs_attention: MOCK_RUN_SUMMARIES.filter((r) => r.attention_required),
  recent_runs: MOCK_RUN_SUMMARIES.slice(0, 6),
};

const PRIMARY_RUN_DETAIL: RunDetail = {
  run_id: 'run_9f82a4c1',
  created_at: '2026-10-17T09:14:22Z',
  completed_at: '2026-10-17T09:14:26Z',
  stages: [
    { key: 'trace', label: 'Trace', status: 'completed', duration_ms: 18 },
    { key: 'normalized', label: 'Normalized', status: 'completed', duration_ms: 42 },
    { key: 'context', label: 'Context', status: 'completed', duration_ms: 35 },
    { key: 'attribution', label: 'Attribution', status: 'completed', duration_ms: 1840 },
    { key: 'regression_spec', label: 'RegressionSpec', status: 'completed', duration_ms: 910 },
    { key: 'pytest', label: 'PyTest', status: 'completed', duration_ms: 115 },
    { key: 'validation', label: 'Validation', status: 'completed', duration_ms: 1420 },
  ],
  attribution: {
    decision: 'attributed',
    responsible_agent: 'PlannerAgent',
    decisive_sequence: 14,
    confidence: 'high',
    explanation:
      'PlannerAgent disregarded the schema mismatch error returned by SchemaRetriever at Seq #11–#12 and emitted an unverified column reference (`billing_tier_v2`) in the downstream SQL tool invocation at Seq #14.',
    evidence: [
      {
        id: 'ev_1',
        start_sequence: 11,
        end_sequence: 13,
        label: 'Evidence #11–#13',
        rationale_summary:
          'SchemaRetriever returned explicit missing-column diagnostics and updated shared state with valid table metadata.',
      },
      {
        id: 'ev_2',
        start_sequence: 14,
        end_sequence: 14,
        label: 'Evidence #14',
        rationale_summary:
          'PlannerAgent dispatched `execute_readonly_sql` containing forbidden identifier `billing_tier_v2`.',
      },
    ],
    model: 'gpt-4.1-2025-04-14',
    provider: 'openai',
    prompt_version: 'attr-prompt-v2.3.1',
    token_usage: {
      input_tokens: 6840,
      output_tokens: 612,
      total_tokens: 7452,
    },
    latency_ms: 1840,
  },
  analysis_context: {
    budget_utf8_bytes: 32768,
    used_utf8_bytes: 24912,
    omitted_utf8_bytes: 18420,
    included_step_count: 9,
    truncated_step_count: 1,
    omitted_step_count: 6,
    omitted_ranges: [
      {
        start_sequence: 3,
        end_sequence: 8,
        step_count: 6,
        omitted_utf8_bytes: 18420,
        reason: 'Routine health-check and read-only catalog prefetch steps outside error dependency path.',
      },
    ],
  },
  canonical_steps: [
    {
      sequence: 1,
      agent: 'Orchestrator',
      event_type: 'agent_message',
      timestamp_offset_ms: 0,
      summary: 'Initialized task: generate quarterly churn cohort breakdown for enterprise accounts.',
      canonical_payload: {
        task_id: 'tsk_4091',
        objective: 'Compute Q3 enterprise churn by subscription tier',
        target_schema: 'analytics_prod.subscriptions',
      },
      context_meta: {
        visibility: 'included',
        original_utf8_bytes: 1420,
        included_utf8_bytes: 1420,
      },
    },
    {
      sequence: 2,
      agent: 'PlannerAgent',
      event_type: 'tool_call',
      timestamp_offset_ms: 185,
      summary: 'Requested table schema inspection from SchemaRetriever (`analytics_prod.subscriptions`).',
      canonical_payload: {
        tool: 'inspect_table_schema',
        arguments: { table: 'analytics_prod.subscriptions', include_indexes: true },
      },
      context_meta: {
        visibility: 'included',
        original_utf8_bytes: 980,
        included_utf8_bytes: 980,
      },
    },
    {
      sequence: 3,
      agent: 'CatalogPrefetcher',
      event_type: 'tool_call',
      timestamp_offset_ms: 240,
      summary: 'Prefetched partition manifest for `analytics_prod` shards 01..06.',
      canonical_payload: {
        tool: 'list_partitions',
        shards: ['01', '02', '03', '04', '05', '06'],
      },
      context_meta: {
        visibility: 'omitted',
        original_utf8_bytes: 18420,
        included_utf8_bytes: 0,
        omission_reason: 'Omitted range #03–#08 (18,420 UTF-8 bytes) due to context window budget.',
      },
    },
    {
      sequence: 9,
      agent: 'SchemaRetriever',
      event_type: 'tool_result',
      timestamp_offset_ms: 610,
      summary: 'Returned full DDL catalog dump for `analytics_prod.subscriptions`.',
      canonical_payload: {
        table: 'analytics_prod.subscriptions',
        columns: ['account_id', 'plan_tier', 'mrr_cents', 'churned_at', 'region'],
        raw_ddl_bytes: 9410,
      },
      context_meta: {
        visibility: 'truncated',
        original_utf8_bytes: 9410,
        included_utf8_bytes: 2048,
        prepared_excerpt:
          '{"table":"analytics_prod.subscriptions","columns":["account_id","plan_tier","mrr_cents","churned_at","region"],"_truncated_utf8_bytes":7362}',
      },
    },
    {
      sequence: 10,
      agent: 'PlannerAgent',
      event_type: 'tool_call',
      timestamp_offset_ms: 890,
      summary: 'Validated draft query referencing legacy column `billing_tier_v2`.',
      canonical_payload: {
        tool: 'validate_sql_ast',
        candidate_sql:
          'SELECT billing_tier_v2, COUNT(*) FROM analytics_prod.subscriptions WHERE churned_at IS NOT NULL GROUP BY 1',
      },
      context_meta: {
        visibility: 'included',
        original_utf8_bytes: 2140,
        included_utf8_bytes: 2140,
      },
    },
    {
      sequence: 11,
      agent: 'SchemaRetriever',
      event_type: 'tool_result',
      timestamp_offset_ms: 1020,
      summary: 'Validation error: column `billing_tier_v2` does not exist; suggested `plan_tier`.',
      canonical_payload: {
        valid: false,
        error_code: 'ERR_UNKNOWN_COLUMN',
        invalid_identifier: 'billing_tier_v2',
        valid_alternatives: ['plan_tier'],
      },
      context_meta: {
        visibility: 'included',
        original_utf8_bytes: 3120,
        included_utf8_bytes: 3120,
      },
    },
    {
      sequence: 12,
      agent: 'SchemaRetriever',
      event_type: 'state_mutation',
      timestamp_offset_ms: 1095,
      summary: 'Committed schema constraint `forbid:billing_tier_v2` to shared agent blackboard.',
      canonical_payload: {
        state_key: 'verified_columns.subscriptions',
        allowed: ['account_id', 'plan_tier', 'mrr_cents', 'churned_at', 'region'],
        rejected: ['billing_tier_v2'],
      },
      context_meta: {
        visibility: 'included',
        original_utf8_bytes: 2890,
        included_utf8_bytes: 2890,
      },
    },
    {
      sequence: 13,
      agent: 'PlannerAgent',
      event_type: 'agent_message',
      timestamp_offset_ms: 1410,
      summary: 'Acknowledged validator response and prepared final execution step.',
      canonical_payload: {
        recipient: 'SQLExecutor',
        intent: 'Run final aggregation query for Q3 enterprise churn report',
      },
      context_meta: {
        visibility: 'included',
        original_utf8_bytes: 2450,
        included_utf8_bytes: 2450,
      },
    },
    {
      sequence: 14,
      agent: 'PlannerAgent',
      event_type: 'tool_call',
      timestamp_offset_ms: 1680,
      summary: 'Dispatched `execute_readonly_sql` still referencing forbidden column `billing_tier_v2`.',
      canonical_payload: {
        tool: 'execute_readonly_sql',
        arguments: {
          query:
            'SELECT billing_tier_v2 AS tier, COUNT(account_id) FROM analytics_prod.subscriptions WHERE churned_at IS NOT NULL GROUP BY billing_tier_v2',
          timeout_ms: 5000,
        },
      },
      context_meta: {
        visibility: 'included',
        original_utf8_bytes: 4912,
        included_utf8_bytes: 4912,
      },
    },
    {
      sequence: 15,
      agent: 'SQLExecutor',
      event_type: 'system_error',
      timestamp_offset_ms: 1790,
      summary: 'Execution aborted: DatabaseError (column "billing_tier_v2" does not exist).',
      canonical_payload: {
        status: 'failed',
        sql_state: '42703',
        message: 'column "billing_tier_v2" does not exist in relation "subscriptions"',
      },
      context_meta: {
        visibility: 'included',
        original_utf8_bytes: 4962,
        included_utf8_bytes: 4962,
      },
    },
  ],
  original_trace: {
    schema_version: 'traceguard.raw.v1',
    run_id: 'run_9f82a4c1',
    framework: 'langgraph-0.2',
    captured_at: '2026-10-17T09:14:22Z',
    raw_event_count: 15,
    root_error: {
      agent: 'SQLExecutor',
      code: '42703',
      detail: 'column "billing_tier_v2" does not exist',
    },
  },
  regression_spec: {
    spec_version: 'regspec.v1',
    responsible_agent: 'PlannerAgent',
    decisive_sequence: 14,
    scenario: {
      title: 'Reject unverified column identifier after explicit schema mismatch',
      initial_state_summary:
        'Blackboard state hydrated at Seq #13 with `verified_columns.subscriptions` excluding `billing_tier_v2`.',
      stimulus_sequence: 13,
      stimulus_input: {
        blackboard_verified_columns: ['account_id', 'plan_tier', 'mrr_cents', 'churned_at', 'region'],
        rejected_columns: ['billing_tier_v2'],
        pending_objective: 'Dispatch final SQL aggregation for enterprise churn by tier',
      },
      mocked_dependencies: ['SchemaRetriever.inspect_table_schema', 'SQLExecutor.execute_readonly_sql'],
    },
    assertions: [
      {
        id: 'A1',
        assertion_type: 'require_tool_call',
        target: 'output.tool_call.name',
        operator: 'equals',
        expected_value: 'execute_readonly_sql',
        description: 'PlannerAgent must still emit a read-only SQL tool invocation.',
      },
      {
        id: 'A2',
        assertion_type: 'forbid_argument',
        target: 'output.tool_call.arguments.query',
        operator: 'not_contains_identifier',
        expected_value: 'billing_tier_v2',
        description: 'Generated SQL query must not reference rejected column `billing_tier_v2`.',
      },
      {
        id: 'A3',
        assertion_type: 'schema_conformance',
        target: 'output.tool_call.arguments.query',
        operator: 'contains_identifier',
        expected_value: 'plan_tier',
        description: 'Generated SQL query must group by verified column `plan_tier`.',
      },
    ],
  },
  pytest_artifact: {
    compiler_version: 'pytest-synth-v1.2.0',
    source_digest: 'sha256:8f3a9c41e07b29d152a809c441e820f9b11a7c45e08d311092a17f5c6b0e4d21',
    line_count: 39,
    pytest_source: `import pytest
from traceguard_runtime.harness import replay_agent_step, sql_identifiers

# Synthesized by TraceGuard (compiler: pytest-synth-v1.2.0)
# Run ID: run_9f82a4c1 | Responsible Agent: PlannerAgent | Decisive Step: #14

@pytest.fixture
def stimulus_context():
    return {
        "sequence": 13,
        "agent": "PlannerAgent",
        "blackboard": {
            "verified_columns.subscriptions": [
                "account_id",
                "plan_tier",
                "mrr_cents",
                "churned_at",
                "region",
            ],
            "rejected_columns": ["billing_tier_v2"],
        },
    }

def test_planner_agent_seq_14_regression(stimulus_context, agent_under_test):
    result = replay_agent_step(
        agent=agent_under_test,
        context=stimulus_context,
        decisive_sequence=14,
    )

    # [A1] PlannerAgent must emit execute_readonly_sql tool call
    assert result.tool_call is not None, "Expected a tool call at sequence #14"
    assert result.tool_call.name == "execute_readonly_sql"

    query = result.tool_call.arguments.get("query", "")
    referenced_cols = sql_identifiers(query)

    # [A2] Forbidden column billing_tier_v2 must not appear in query AST
    assert "billing_tier_v2" not in referenced_cols, (
        f"Forbidden column 'billing_tier_v2' referenced in SQL: {query}"
    )

    # [A3] Verified column plan_tier must be used for tier aggregation
    assert "plan_tier" in referenced_cols, (
        f"Expected verified column 'plan_tier' in SQL identifiers: {referenced_cols}"
    )`,
  },
  validation_result: {
    final_verdict: 'validated',
    validator_version: 'sandbox-val-v1.1.4',
    validated_at: '2026-10-17T09:14:26Z',
    summary_note:
      'Regression verified in isolated container sandbox: faulty replay deterministically failed on assertion A2 (`billing_tier_v2`), and corrected replay passed all 3 assertions.',
    faulty_execution: {
      mode: 'faulty',
      expected_outcome: 'FAIL',
      actual_outcome: 'FAIL',
      expectation_met: true,
      duration_ms: 740,
      bounded_diagnostic:
        "AssertionError at line 38 [A2]: Forbidden column 'billing_tier_v2' referenced in SQL: SELECT billing_tier_v2 AS tier, COUNT(account_id)...",
      assertion_outcomes: [
        {
          assertion_id: 'A1',
          passed: true,
          message: 'tool_call.name == "execute_readonly_sql"',
          line_number: 32,
        },
        {
          assertion_id: 'A2',
          passed: false,
          message: "Forbidden column 'billing_tier_v2' referenced in SQL AST",
          line_number: 38,
        },
        {
          assertion_id: 'A3',
          passed: false,
          message: 'Skipped after A2 failure in same test function',
          line_number: 43,
        },
      ],
    },
    corrected_execution: {
      mode: 'corrected',
      expected_outcome: 'PASS',
      actual_outcome: 'PASS',
      expectation_met: true,
      duration_ms: 680,
      bounded_diagnostic:
        'All 3 assertions passed against corrected state replay (0 warnings, exit code 0).',
      assertion_outcomes: [
        {
          assertion_id: 'A1',
          passed: true,
          message: 'tool_call.name == "execute_readonly_sql"',
          line_number: 32,
        },
        {
          assertion_id: 'A2',
          passed: true,
          message: "'billing_tier_v2' absent from SQL AST identifiers",
          line_number: 38,
        },
        {
          assertion_id: 'A3',
          passed: true,
          message: "'plan_tier' present in SQL AST identifiers",
          line_number: 43,
        },
      ],
    },
  },
};

export function getMockRunDetail(runId: string): RunDetail {
  if (runId === PRIMARY_RUN_DETAIL.run_id) {
    return PRIMARY_RUN_DETAIL;
  }

  const summary = MOCK_RUN_SUMMARIES.find((r) => r.run_id === runId);
  if (!summary) {
    return {
      ...PRIMARY_RUN_DETAIL,
      run_id: runId,
    };
  }

  return {
    ...PRIMARY_RUN_DETAIL,
    run_id: summary.run_id,
    created_at: summary.created_at,
    attribution: {
      ...PRIMARY_RUN_DETAIL.attribution,
      responsible_agent: summary.responsible_agent ?? 'PlannerAgent',
      decisive_sequence: summary.decisive_sequence ?? 14,
      confidence: summary.confidence ?? 'low',
    },
    validation_result:
      summary.validation_verdict === 'unverified'
        ? {
            ...PRIMARY_RUN_DETAIL.validation_result!,
            final_verdict: 'unverified',
            summary_note:
              'Validation unverified: faulty execution unexpectedly passed all assertions (false negative). Review assertion specificity.',
            faulty_execution: {
              ...PRIMARY_RUN_DETAIL.validation_result!.faulty_execution,
              actual_outcome: 'PASS',
              expectation_met: false,
              bounded_diagnostic:
                'False negative: Faulty execution exited with PASS despite expected FAIL.',
            },
          }
        : PRIMARY_RUN_DETAIL.validation_result,
  };
}
