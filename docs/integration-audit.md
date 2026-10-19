# Contract audit (before implementation)

Inspected backend `docs/frontend-contract.md`, `docs/final-backend-pass.md`,
`app/api/v1/*`, `app/api/dependencies.py`, all response schemas, run/context services;
frontend API/types/hooks/mocks, operational pages, stage components and browser scripts.
No frontend-root AGENTS.md exists; backend AGENTS.md was read.

| Requirement | Actual endpoint | Response | Existing frontend assumption | Mismatch / adaptation |
| --- | --- | --- | --- | --- |
| Dashboard | GET /dashboard | DashboardSummary | nested metrics, needs_attention | flat counts; needs_attention_runs |
| Ledger | GET /runs | RunPage | run_id, current_stage, stage_status | id, source, status, analysis_status/stage; nullable artifacts |
| Pagination | GET /runs | items,total,limit,offset | page, simulated single page | limit 1–100, offset 0–100000 |
| Filters | GET /runs | RunListQuery | q, confidence, verdict | only status, analysis_status, responsible_agent (exact), validation_verdict, needs_attention |
| Detail | GET /runs/{id} | RunSummary | composite RunDetail | summary only, then artifact reads |
| Analysis | GET /runs/{id}/analysis | AnalysisRecord | hardcoded pipeline | active/completed/review_required/failed, stage, stop_reason, linked IDs |
| Attribution | GET /attributions/{id} | AttributionRecord | always complete, nested usage, fabricated evidence IDs | nullable decision; attributed/abstain; reason, contains_truncated; flat usage; persisted context_manifest |
| Context | AttributionRecord.context_manifest | visible_sequences,truncated_sequences,omitted_ranges,statistics | per-step excerpt and byte sizes | persisted manifest only; sizes are UTF-8 bytes; no retained excerpt body |
| Canonical trace | **No HTTP route** | service canonical_trace returns CanonicalTrace | included in detail | backend gap; never reconstruct from attribution/mock |
| Original trace | **No HTTP route** | service get returns internal RunRecord | included in detail | backend gap; do not expose internal RunRecord wholesale |
| Regression | GET /regression-specs/{id} | RegressionRecord with spec, scenario_snapshot | invented scenario/assertion shape | use disposition, scenario references, structured assertions/citations; review may have no scenario |
| Test | GET /generated-tests/{id} | GeneratedTestRecord | pytest_source, line_count | source_code, test_name, harness versions; failed artifact has no source |
| Validation | GET /validations/{id} | ValidationRecord | validated/unverified; assertion outcomes | valid/not_reproduced/not_discriminating/inconclusive; nullable execution records; no per-assertion details |
| System | GET /system | SystemInfo | worker/runner readiness, provider, budget | only API health, environment, model/effort and versions exposed |
| Access | router dependency require_user | session required | mock auth coupled to mock data | no existing backend bypass; frontend local session stays independent of real data |

Paths are relative to /api/v1. Unknown ledger query parameters return 422.
No request failure may fall back to demo data. No inference POST is needed to inspect persisted runs.

Local infrastructure audit: Docker Desktop Linux engine was unavailable, including
outside the sandbox. Backend changes, if approved/required, must remain small and
separately documented. GitHub integration is deferred.
