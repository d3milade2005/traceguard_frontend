"""Focused frontend integration tests against real-schema HTTP fixtures."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from browser_support import BASE, RUN, setup, assert_no_overflow

def run():
    checks=[]
    output=Path("artifacts/integration"); output.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for theme in ["dark","light"]:
            for width in [1440,390]:
                context=browser.new_context(viewport={"width":width,"height":1000},permissions=["clipboard-read","clipboard-write"])
                context.add_init_script(f"localStorage.setItem('tg_theme','{theme}')")
                requests,_=setup(context)
                page=context.new_page(); errors=[]; page.on("pageerror",lambda e:errors.append(str(e)))
                page.goto(BASE+"/dashboard")
                expect(page.locator(".metric-value").first).to_have_text("45")
                expect(page.get_by_text("No review required",exact=True)).to_be_visible()
                expect(page.locator("tbody tr")).to_have_count(5)
                assert_no_overflow(page)
                page.goto(BASE+"/runs")
                expect(page.locator("tbody tr")).to_have_count(20)
                expect(page.get_by_text("Page 1 of 3 · 45 runs",exact=True)).to_be_visible()
                page.get_by_role("button",name="Next",exact=True).click()
                expect(page.get_by_text("Page 2 of 3 · 45 runs",exact=True)).to_be_visible()
                page.get_by_role("button",name="Next",exact=True).click()
                expect(page.locator("tbody tr")).to_have_count(5)
                expect(page.get_by_role("button",name="Next",exact=True)).to_be_disabled()
                page.get_by_role("button",name="Previous",exact=True).click()
                expect(page.get_by_text("Page 2 of 3 · 45 runs",exact=True)).to_be_visible()
                page.get_by_label("Runs per page").select_option("10")
                expect(page.get_by_text("Page 1 of 5 · 45 runs",exact=True)).to_be_visible()
                page.get_by_label("Exact responsible agent").fill("calculator")
                page.get_by_role("button",name="Apply",exact=True).click()
                expect(page.get_by_text("Page 1 of 3 · 23 runs",exact=True)).to_be_visible()
                page.get_by_label("Filter by result",exact=True).select_option("inconclusive")
                expect(page.get_by_text("No matching runs",exact=True)).to_be_visible()
                assert any(q.get("offset")==["20"] for path,q in requests if path=="/runs")
                assert any(q.get("responsible_agent")==["calculator"] for path,q in requests if path=="/runs")
                assert_no_overflow(page)
                page.goto(BASE+f"/runs/{RUN}")
                expect(page.get_by_role("heading",name="Valid regression",exact=True)).to_be_visible()
                page.get_by_role("button",name="Decisive step 1",exact=False).click()
                expect(page.locator("#trace-step-1 .trace-payload")).to_be_visible()
                expect(page.get_by_label("Step 1 canonical payload")).to_contain_text('"tool_name": "add"')
                page.get_by_role("button",name="Stage details",exact=True).click() if width==390 else None
                nav=page.get_by_role("navigation",name="Stage detail views")
                nav.get_by_role("button",name="Attribution",exact=True).click()
                page.get_by_text("View model details",exact=True).click()
                expect(page.locator(".stage-pane").get_by_text("fixture-model",exact=True)).to_be_visible()
                page.get_by_role("navigation",name="Run pipeline").get_by_role("button",name="Context",exact=False).click()
                page.get_by_text("Context details",exact=True).click()
                expect(page.get_by_text("48,000 B",exact=True)).to_be_visible()
                page.get_by_text("View context manifest",exact=True).click()
                expect(page.get_by_label("Analysis context manifest")).to_contain_text("visible_sequences")
                nav.get_by_role("button",name="Regression spec",exact=True).click()
                expect(page.get_by_role("heading",name="Expected behavior",exact=True)).to_be_visible()
                expect(page.get_by_label("Scenario snapshot")).to_contain_text('"a": 2')
                nav.get_by_role("button",name="Generated test",exact=True).click()
                expect(page.get_by_label("Generated pytest source")).to_contain_text("def test_calculator_addition")
                page.get_by_role("button",name="Copy",exact=True).click()
                expect(page.get_by_role("button",name="Copied",exact=True)).to_be_visible()
                with page.expect_download() as download:
                    page.get_by_role("button",name="Download",exact=True).click()
                assert download.value.suggested_filename=="test_calculator_addition.py"
                nav.get_by_role("button",name="Validation",exact=True).click()
                expect(page.get_by_text("Failed as expected",exact=True)).to_be_visible()
                expect(page.get_by_text("Passed as expected",exact=True)).to_be_visible()
                page.get_by_text("Execution details",exact=True).click()
                expect(page.get_by_label("faulty execution diagnostic")).to_have_text("REGRESSION_ASSERTION_FAILED")
                expect(page.get_by_label("Validation runtime identity")).to_contain_text("bundle_digest")
                page.screenshot(path=str(output/f"complete-{theme}-{width}.png"),full_page=True)
                assert_no_overflow(page)
                page.goto(BASE+"/system")
                expect(page.get_by_text("fixture-model",exact=True)).to_be_visible()
                assert page.get_by_text("Worker",exact=True).count()==0
                assert not errors,errors
                checks.append(f"Dashboard, pagination/filter/reset, trace, context, attribution, spec, source copy/download, valid validation, System: {theme}/{width}")
                context.close()
        expected={"no-analysis":"No analysis has been requested", "processing":"Attribution pending", "attribution-only":"No regression scenario yet","abstain":"Attribution requires review","review":"Replay requires human review.","compile-failed":"Compilation failed.","inconclusive":"Validation was inconclusive","not-reproduced":"Generated test did not reproduce","not-discriminating":"Generated test does not distinguish","failed":"Analysis timed out"}
        for case,text in expected.items():
            context=browser.new_context(viewport={"width":1440,"height":1000})
            requests,selected=setup(context,case)
            page=context.new_page(); errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
            page.goto(BASE+f"/runs/{RUN}")
            expect(page.get_by_text(text,exact=False).first).to_be_visible()
            if case in ["no-analysis","abstain","review","failed"]:
                for key in ["pytest","validation"]:
                    expect(page.locator(f".pipeline-{key}")).to_have_count(0)
                assert not any(path.startswith("/validations/") for path,_ in requests)
                assert not any(path.startswith("/generated-tests/") for path,_ in requests)
                if case=="no-analysis": assert not any(path.endswith("/analysis") for path,_ in requests)
            if case in ["abstain","review"]:
                expect(page.get_by_role("navigation",name="Run pipeline").get_by_role("button",name="Validation",exact=False)).to_contain_text("Pending")
            assert not errors, errors
            assert_no_overflow(page)
            checks.append(case)
            context.close()
        context=browser.new_context(); requests,_=setup(context,fail_stage="validation"); page=context.new_page()
        page.goto(BASE+"/dashboard")
        expect(page.locator(".metric-value").first).to_have_text("45")
        page.evaluate("path => { history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }", f"/runs/{RUN}")
        expect(page.get_by_text("Validation details are unavailable.",exact=True)).to_be_visible(timeout=15000)
        expect(page.get_by_role("heading",name="calculator",exact=True)).to_be_visible()
        assert "internal exception" not in page.locator("body").inner_text()
        checks.append("Artifact failure leaves attribution and run usable")
        context.close()
        context=browser.new_context(); requests,_=setup(context);page=context.new_page()
        finished=[]
        page.on("requestfinished", lambda r: finished.append(r.url))
        page.clock.install()
        page.goto(BASE+f"/runs/{RUN}")
        expect(page.get_by_role("heading",name="Valid regression",exact=True)).to_be_visible()
        before=len(requests);page.clock.run_for(16000)
        assert len(requests)==before, "Terminal artifacts must stop polling"
        assert len([url for url in finished if url.startswith("http://localhost:8000/api/v1/") and url.endswith(f"/runs/{RUN}")])==1
        checks.append("Terminal network requests: no polling, one completed detail read, no auth or null IDs")
        context.close()
        browser.close()
    (output/"results.json").write_text(json.dumps(checks,indent=2))
    print(f"{len(checks)} integration groups passed")
if __name__=="__main__": run()


