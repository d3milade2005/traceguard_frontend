# Frontend integration

Frontend: http://localhost:5173  
Backend: http://localhost:8000  
API base: http://localhost:8000/api/v1

`VITE_API_BASE_URL` selects the public API base. Copy `.env.example` to `.env.local`
if overriding the default. No frontend secrets or operational demo mode exist.
HTTP fixtures live exclusively in browser tests; failures never fall back to them.

## Start locally (PowerShell)

The existing backend `.env` must already contain its database/broker configuration.
GitHub authentication is intentionally deferred. The included Compose override opts
the API into `APP_ENV=development` and `DEV_READ_ACCESS=true`. This setting defaults
false, is rejected outside development, and permits only operational GET/HEAD reads.
Auth endpoints and all writes retain the backend's existing authentication checks.

```powershell
cd C:\Users\Administrator\traceguard
docker compose -f docker-compose.yml -f ..\traceguard_frontend\docs\local-backend.compose.yml --profile validation up --build -d postgres rabbitmq backend worker validation-worker
docker compose exec -T backend alembic current
```

Migration `0008` is already applied locally. For a new database, run the existing
backend migration workflow before using the UI (`docker compose exec -T backend
alembic upgrade head`). PostgreSQL and RabbitMQ are required for readiness. The
ordinary and validation workers process new operations; browsing persisted artifacts
does not enqueue work or call an LLM. The approved validation image is needed only
for new isolated executions; follow the backend's existing image build instructions.

```powershell
cd C:\Users\Administrator\traceguard_frontend
npm.cmd ci
npm.cmd run dev -- --host localhost --port 5173 --strictPort
```

Use `localhost` consistently. Stop any other service using 5173 first. To run the API
on the host when Docker's database port forwarding works, use a separate terminal:

```powershell
cd C:\Users\Administrator\traceguard
$env:DEBUG='false'
$env:DEV_READ_ACCESS='true'
$env:CORS_ALLOWED_ORIGINS='["http://localhost:5173"]'
.\.venv\Scripts\python.exe -m uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
```

Use either the Compose API or the host API. Local verification used Compose after
host database connectivity failed. No database connection logic was changed.

## Data behavior

- Dashboard uses the flat aggregate response and both backend-provided run lists.
- Runs uses server `limit`/`offset`, totals, status, analysis status, exact responsible
  agent, validation verdict and needs-attention filters. There is no free-text or
  confidence filter. Changing filters/page size resets the page; shrinking datasets
  return the ledger to the last available page.
- Run Detail reads the summary and analysis, then only artifacts with existing IDs.
  Each artifact has independent loading/error/retry behavior. No POSTs are issued.
- Canonical/original traces use two minimal backend read routes added over existing
  RunService methods. Canonical sequences are never renumbered. Rendering is bounded
  to 100 events at a time, with more events available on demand.
- Context uses the historical Attribution manifest. Budgets and sizes are UTF-8
  bytes. Omitted/truncated sequences are identified. Historical excerpt bodies and
  per-step byte sizes were not persisted; the UI does not reconstruct them.
- Review, abstention, failed compilation, failed analysis, and all validation verdicts
  preserve raw backend values. Later stages remain pending when analysis stops early.
- System exposes only API health, environment, model/effort and provided versions.
  It does not claim worker or runner readiness.
- Active summaries/analyses/artifacts poll every 5 seconds while visible, capped at
  120 successful updates per query. Terminal stages stop polling. Polling stops on
  errors; transient requests retry once, and users can retry failed reads manually.
- StrictMode remains enabled. Cancelled probe mounts/navigation may appear as
  `net::ERR_ABORTED`; successful detail reads are checked for duplication. The client
  checks cancellation before dispatch and passes AbortSignal through fetch.

The local session placeholder permits operational page access independently of API
data. It makes no GitHub, profile, cookie-session, or logout backend requests. Login's
visual page remains; its existing local navigation behavior is retained.

## Checks

```powershell
npm.cmd run typecheck
npm.cmd run build
python scripts\interaction_check.py
python scripts\state_check.py
python scripts\visual_check.py --phase integration-visual
python scripts\edge_check.py
python scripts\live_check.py
```

Browser checks use the existing Python Playwright installation and Chromium. To
regenerate fixtures after a deliberate backend contract change, run:

```powershell
..\traceguard\.venv\Scripts\python.exe scripts\build_api_fixtures.py
```

The generator validates 12 stage scenarios and 45 ledger records against the actual
backend Pydantic schemas. `live_check.py` uses real HTTP and persisted records, requires
one valid and one partial/failed/review run, performs no mutations, and writes network
evidence to ignored `artifacts/live/network.json`. Multi-page behavior is checked with
schema-validated HTTP fixtures because the local database currently has only two runs.
