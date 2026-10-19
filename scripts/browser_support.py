"""HTTP browser fixtures, generated and validated by build_api_fixtures.py."""
import copy
import json
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import expect

BASE = "http://localhost:5173"
API = "http://localhost:8000/api/v1"
DATA = json.loads((Path(__file__).resolve().parents[1] / "tests/fixtures/api.json").read_text())
RUN = DATA["cases"]["complete"]["run"]["id"]

def setup(context, case="complete", state="normal", fail_stage=None):
    requests = []
    context.pending_api_routes=[]
    selected = copy.deepcopy(DATA["cases"][case])
    context.route("https://fonts.googleapis.com/**", lambda route: route.abort())
    def handler(route):
        url = urlparse(route.request.url)
        path = url.path.removeprefix("/api/v1")
        query = parse_qs(url.query)
        requests.append((path, query))
        assert "null" not in path and "undefined" not in path
        assert not path.startswith("/auth"), "GitHub integration is deferred"
        def respond(body, status=200):
            route.fulfill(status=status, content_type="application/json", headers={"Access-Control-Allow-Origin": BASE}, body=json.dumps(body))
        if state == "error":
            respond({"error":{"code":"DEPENDENCY_UNAVAILABLE","message":"password=must-not-render","request_id":"fixture-request"}}, 503)
            return
        if state == "loading":
            # Long-lived request without fabricating a successful result.
            context.pending_api_routes.append(route)
            return
        if state == "offline":
            route.abort("connectionrefused")
            return
        if path == "/dashboard":
            items = [] if state == "empty" else DATA["ledger"][:5]
            attention = [selected["run"]] if selected["run"]["needs_attention"] and state != "empty" else []
            respond(dict(total_runs=0 if state=="empty" else 45,active_analyses=int(selected["run"]["analysis_status"]=="active"),review_required_analyses=int(selected["run"]["analysis_status"]=="review_required"),valid_regressions=0 if state=="empty" else 45,recent_runs=items,needs_attention_runs=attention))
        elif path == "/runs":
            assert set(query) <= {"limit","offset","status","analysis_status","responsible_agent","validation_verdict","needs_attention"}
            items=[] if state=="empty" else selected.get("_ledger", DATA["ledger"])
            for key in ["status","analysis_status","responsible_agent","validation_verdict","needs_attention"]:
                if key in query:
                    items=[item for item in items if str(item[key]).lower()==query[key][0].lower()]
            limit=int(query.get("limit",["20"])[0]); offset=int(query.get("offset",["0"])[0])
            respond(dict(items=items[offset:offset+limit],total=len(items),limit=limit,offset=offset))
        elif path == "/system":
            respond(selected["system"])
        elif path == f"/runs/{RUN}":
            respond(selected["run"])
        elif path == f"/runs/{RUN}/analysis":
            assert selected["run"]["analysis_id"]
            respond(selected["analysis"])
        elif path == f"/runs/{RUN}/trace":
            respond(selected["trace"])
        elif path == f"/runs/{RUN}/original-trace":
            respond(selected["original"])
        else:
            mapping={"attributions":"attribution","regression-specs":"regression","generated-tests":"generated","validations":"validation"}
            parts=path.strip("/").split("/")
            assert len(parts)==2 and parts[0] in mapping, f"Unexpected API call: {path}"
            key=mapping[parts[0]]
            record=selected[key]
            assert record is not None, f"Requested missing artifact: {path}"
            assert parts[1]==record["id"]
            if key==fail_stage:
                respond({"error":{"code":"ARTIFACT_UNAVAILABLE","message":"internal exception"}},503)
            else:
                respond(record)
    context.route(API+"/**",handler)
    return requests, selected

def assert_no_overflow(page):
    assert not page.evaluate("document.documentElement.scrollWidth > innerWidth"), "Document overflow"

