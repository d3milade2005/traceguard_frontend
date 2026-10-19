# TraceGuard integration report — 2026-10-19

The existing operational UI now reads the real FastAPI backend. The visual direction
is preserved. GitHub frontend integration remains deferred.

1. **Contracts inspected:** backend AGENTS.md, frontend-contract.md,
   final-backend-pass.md, routers, Pydantic response schemas, run/context services,
   and the frontend API/types/hooks, mocks, pages, components and browser scripts.
   The frontend root has no AGENTS.md. The [pre-change matrix](integration-audit.md)
   records each mismatch before implementation.
2. **Incorrect assumptions:** nested Dashboard metrics; run_id/current_stage fields;
   a composite detail object; page/q/confidence/verdict query parameters; invented
   validation enums, assertion outcomes and context excerpts; System worker readiness;
   and an assumed existing backend development-access bypass.
3. **API client:** centralized VITE_API_BASE_URL, typed responses, AbortSignal,
   cancellation before dispatch, safe error-code/request-ID details, explicit non-2xx
   errors, invalid-response errors, and one retry for transient failures. No SDK added.
4. **Dashboard:** real flat counts, recent_runs and needs_attention_runs; no fake
   statistics or fallback. Existing cards/table/layout retained.
5. **Runs:** real IDs, source, run status, analysis status/stage, nullable agent,
   confidence, validation verdict and creation time. Unknown data stays absent.
6. **Pagination/filters:** actual limit/offset/total metadata; sizes 10/20/50/100;
   supported status, analysis_status, exact responsible_agent, validation_verdict and
   needs_attention parameters. Filters/size reset pagination. Live reads recover from
   disappearing rows and refresh cached pages. Unsupported search/confidence removed.
7. **Run Detail:** separate summary/analysis queries and ID-enabled artifact queries.
   Independent progressive stage loading and retries. Raw stop reasons remain in
   advanced details; important reasons have readable messages. No inference POSTs.
8. **Trace/context:** persisted canonical steps and original JSON through two small
   new backend read routes. Canonical sequence numbers remain unchanged; render more
   events in batches of 100. Context shows real selected/truncated sequences, omitted
   ranges, byte budgets and selected/original sizes, with full/pruned state.
9. **Attribution:** real decision, agent, decisive sequence, category, explanation,
   confidence, evidence/truncation flags and abstention reason; model/effort/prompt,
   token counts, latency, diagnostics, failure code and manifest behind disclosures.
10. **RegressionSpec:** actual disposition, title, agent, failure summary, scenario
    stimulus/precondition references, assertions/citations, snapshot, review reason,
    model metadata and raw specification. needs_review never appears synthesized.
11. **GeneratedTest:** actual source, test name, framework, digest, compiler/harness
    versions, status and failure code. Code viewer/copy/download retained; no execution.
12. **Validation:** actual verdict/outcomes, safe execution summaries, diagnostics,
    durations, exit codes, counts/limits, runtime identity, validator/source metadata.
    Correct faulty/corrected outcome labels and all four verdicts are supported.
13. **System:** actual API health, environment, model, reasoning effort and exposed
    versions. No fabricated worker/runner readiness, provider or context budget.
14. **Mocks:** operational mockData.ts removed. No runtime mock switch or automatic
    fallback. Test-only HTTP fixtures are isolated. Local access placeholder is separate
    from API data and performs no auth/profile/logout backend requests.
15. **Polling:** 5-second visible-page refetch for active summaries/analyses/artifacts,
    capped at 120 successful updates per query; terminal stages stop. Errors stop
    polling; transient failures retry once. No WebSockets or repeated inference POSTs.
16. **States:** loading/empty/error, missing analysis, active analysis, attribution-only,
    abstention, review specification, failed compilation, failed analysis, inconclusive,
    not-reproduced and not-discriminating states verified. Downstream stages stay pending
    when unavailable. A validation request failure leaves attribution usable.
17. **Backend changes:** opt-in DEV_READ_ACCESS, rejected outside development, permitting
    only operational GET/HEAD reads; auth routes and writes remain protected. Added
    /runs/{id}/trace and /runs/{id}/original-trace over existing RunService methods.
    Added focused tests/docs and updated the authoritative frontend contract. No
    persistence, worker, inference, compiler, validation or architecture redesign.
18. **Checks:** typecheck and production build passed; 679 backend unit tests passed;
    changed backend files pass Ruff and formatting. Browser checks passed: 16 workflow
    groups, 40 loading/empty/error checks, 36 responsive visual checks, and four edge
    groups. Fixtures include 12 scenarios and 45 ledger records validated against the
    real Pydantic schemas. git diff --check passed.
19. **Real browser:** desktop 1440px and mobile 390px passed against actual persisted
    data. Dashboard reports 2 runs, 0 active analyses, 0 review-required analyses and
    1 valid regression. Successful calculator run:
    0f15b30d-68d8-4a8a-89a7-2cb3504dbf75. Failed analysis run:
    03f6d89d-4bf0-4f78-8086-ce6ead190d93. Trace, context, attribution, spec, source,
    validation and System were inspected without creating new analyses.
20. **Network/environment:** Docker Desktop was initially stopped; it was started.
    Host API database connections failed; the existing Compose network resolved this.
    StudyLift occupied 5173 and was stopped with explicit user approval. Frontend now
    runs on 5173. Correct API base/parameters, no null/undefined artifact IDs, no auth
    calls, no POSTs, no mock calls, no CORS failures, no terminal polling and one
    completed detail read were verified. Latest live capture: 13 desktop and 17 mobile
    successful reads, all 200, no failures/cancellations. StrictMode remains enabled.
21. **Files changed:** listed below, with backend changes in the separate repository.
22. **Remaining limits:** GitHub intentionally deferred; local bypass is development
    only. Historical truncated excerpt bodies/per-step context sizes were not persisted
    and cannot be displayed. Only two live records exist: multi-page UI behavior uses
    schema-validated HTTP fixtures; real offset/first/last/empty API pages are also
    checked. New LLM work, generated-code execution and final research evaluation were
    not invoked. The validation worker answers ping; its image is needed only for new
    executions. System does not expose worker/runner readiness. No secrets were added
    to frontend configuration.
23. **Exact startup/check commands:** [frontend-integration.md](frontend-integration.md)
    contains copyable PowerShell commands, URLs, environment settings, services,
    migration/startup instructions and all browser checks. API is currently running
    in Compose with the development override; Vite is running on localhost:5173.

## Changed frontend files

- Configuration/documentation: .gitignore, .env.example, README.md, vite.config.ts,
  docs/integration-audit.md, docs/frontend-integration.md, docs/integration-report.md,
  docs/local-backend.compose.yml.
- API/contracts: src/App.tsx, src/api/client.ts, src/api/queries.ts,
  src/api/presentation.ts, src/api/auth.ts, src/types/api.ts;
  removed src/api/mockData.ts.
- Pages: DashboardPage.tsx, RunsPage.tsx, RunDetailPage.tsx, SystemPage.tsx.
  LandingPage.tsx only routes its demo inspection links to the real ledger;
  DocsPage.tsx corrects the raw verdict to valid. Login's visual page is retained.
- Components: AnalysisContextPanel, AppShell, AttributionDetail, AttributionSummary,
  GeneratedPyTestPanel, ModelDetails, PipelineStepper, RegressionSpecPanel, RunRow,
  StatusText, TraceStepRow, UI, ValidationPanel; src/index.css adds small filter,
  pagination, source-label and review-state presentation support.
- Browser checks: scripts/browser_support.py, build_api_fixtures.py,
  integration_check.py, interaction_check.py, state_check.py, visual_check.py,
  edge_check.py, live_check.py; tests/fixtures/api.json.

## Changed backend files

- app/core/config.py
- app/api/dependencies.py
- app/api/v1/runs.py
- tests/unit/test_frontend_integration_access.py
- docs/frontend-contract.md
- docs/frontend-local-integration.md

Ignored evidence: artifacts/integration/results.json, artifacts/states/results.json,
artifacts/integration-visual/visual-results.json, artifacts/live/network.json and
desktop/mobile screenshots. No paid inference or research experiment was required.
