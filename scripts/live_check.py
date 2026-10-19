"""Read-only smoke against actual persisted backend artifacts, with network assertions."""
import json
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect
BASE="http://localhost:5173"
API="http://localhost:8000/api/v1"
output=Path("artifacts/live");output.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    request=p.request.new_context()
    ready=request.get("http://localhost:8000/ready");assert ready.status==200,ready.text()
    dashboard=request.get(API+"/dashboard");assert dashboard.status==200,dashboard.text()
    data=dashboard.json()
    runs=request.get(API+"/runs?limit=100&offset=0").json()
    first=request.get(API+"/runs?limit=1&offset=0").json()
    last=request.get(API+f"/runs?limit=1&offset={max(0,runs['total']-1)}").json()
    empty=request.get(API+f"/runs?limit=1&offset={runs['total']}").json()
    assert first["limit"]==1 and first["offset"]==0 and len(first["items"])==1
    assert last["offset"]==runs["total"]-1 and len(last["items"])==1
    assert empty["items"]==[] and empty["total"]==runs["total"]
    complete=next(r for r in runs["items"] if r["validation_verdict"]=="valid")
    partial=next(r for r in runs["items"] if r["analysis_status"] in ["failed","review_required"] or r["analysis_id"] is None)
    browser=p.chromium.launch(headless=True)
    results=[]
    for width in [1440,390]:
        context=browser.new_context(viewport={"width":width,"height":1000})
        context.route("https://fonts.googleapis.com/**",lambda route:route.abort())
        page=context.new_page();errors=[];responses=[];network_failures=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.on("response",lambda r:responses.append({"url":r.url,"status":r.status,"method":r.request.method}) if r.url.startswith(API) else None)
        page.on("requestfailed",lambda r:network_failures.append({"url":r.url,"failure":r.failure}) if r.url.startswith(API) else None)
        page.goto(BASE+"/dashboard")
        expect(page.locator(".metric-value").nth(0)).to_have_text(str(data["total_runs"]))
        expect(page.locator(".metric-value").nth(3)).to_have_text(str(data["valid_regressions"]))
        expect(page.get_by_role("link",name=complete["id"],exact=True).first).to_be_visible()
        page.screenshot(path=str(output/f"dashboard-{width}.png"),full_page=True)
        page.goto(BASE+"/runs")
        expect(page.locator("tbody tr")).to_have_count(min(20,runs["total"]))
        page.get_by_role("link",name=complete["id"],exact=True).click()
        expect(page.get_by_role("heading",name="Valid regression",exact=True)).to_be_visible()
        detail_requests=Counter(r["url"] for r in responses if "/runs/"+complete["id"] in r["url"])
        assert all(n==1 for n in detail_requests.values()),detail_requests
        nav=page.get_by_role("navigation",name="Stage detail views")
        nav.get_by_role("button",name="Attribution",exact=True).click()
        expect(page.get_by_role("heading",name="Attribution",exact=True)).to_be_visible()
        page.get_by_text("View model details",exact=True).click()
        expect(page.get_by_text("Prompt version",exact=True)).to_be_visible()
        page.get_by_role("button",name="Decisive step",exact=False).first.click()
        expect(page.locator(".trace-payload").first).to_be_visible()
        if width==390:page.get_by_role("button",name="Stage details",exact=True).click()
        page.get_by_role("navigation",name="Run pipeline").get_by_role("button",name="Context",exact=False).click()
        page.get_by_text("View context manifest",exact=True).click()
        expect(page.get_by_label("Analysis context manifest")).to_contain_text("visible_sequences")
        nav.get_by_role("button",name="Regression spec",exact=True).click()
        expect(page.get_by_role("heading",name="Expected behavior",exact=True)).to_be_visible()
        nav.get_by_role("button",name="Generated test",exact=True).click()
        expect(page.get_by_label("Generated pytest source")).to_contain_text("def test_")
        nav.get_by_role("button",name="Validation",exact=True).click()
        expect(page.get_by_text("Failed as expected",exact=True)).to_be_visible()
        expect(page.get_by_text("Passed as expected",exact=True)).to_be_visible()
        page.get_by_text("Execution details",exact=True).click()
        expect(page.get_by_label("Validation runtime identity")).to_contain_text("image_id")
        page.screenshot(path=str(output/f"complete-{width}.png"),full_page=True)
        page.goto(BASE+"/runs/"+partial["id"])
        expect(page.locator(".run-header h1")).to_have_text(partial["id"])
        expect(page.locator(".run-header-meta .status")).to_contain_text("Failed")
        expect(page.get_by_role("navigation",name="Run pipeline").get_by_role("button",name="Validation",exact=False)).to_contain_text("Pending")
        page.screenshot(path=str(output/f"failed-{width}.png"),full_page=True)
        page.goto(BASE+"/system")
        expect(page.get_by_role("heading",name="System",exact=True)).to_be_visible()
        expect(page.get_by_text("Online",exact=True)).to_be_visible()
        assert not page.evaluate("document.documentElement.scrollWidth > innerWidth")
        assert not errors,errors
        assert all(item["failure"]=="net::ERR_ABORTED" for item in network_failures),network_failures
        assert all(r["status"]==200 and r["method"]=="GET" for r in responses),responses
        assert not any("/auth/" in r["url"] or "/null" in r["url"] or "/undefined" in r["url"] for r in responses)
        results.append({"width":width,"complete_run":complete["id"],"partial_run":partial["id"],"requests":responses,"development_mount_cancellations":network_failures})
        context.close()
    browser.close()
(output/"network.json").write_text(json.dumps(results,indent=2))
print(f"Real browser smoke passed: {data['total_runs']} persisted runs; valid and failed run; desktop/mobile; all API reads 200.")

