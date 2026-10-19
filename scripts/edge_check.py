"""Partial context, live pagination changes, progressive stages, and polling transitions."""
import copy
from playwright.sync_api import sync_playwright, expect
from browser_support import BASE, RUN, DATA, setup

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context();requests,case=setup(context)
    page=context.new_page()
    page.goto(BASE+"/runs")
    expect(page.locator("tbody tr")).to_have_count(20)
    page.get_by_role("button",name="Next",exact=True).click()
    expect(page.get_by_text("Page 2 of 3 · 45 runs",exact=True)).to_be_visible()
    page.get_by_role("button",name="Next",exact=True).click()
    expect(page.locator("tbody tr")).to_have_count(5)
    case["_ledger"]=DATA["ledger"][:11]
    page.get_by_role("button",name="Refresh",exact=True).click()
    expect(page.get_by_text("Page 1 of 1 · 11 runs",exact=True)).to_be_visible()
    expect(page.locator("tbody tr")).to_have_count(11)
    context.close()

    context=browser.new_context();requests,case=setup(context,"pruned");page=context.new_page()
    page.goto(BASE+f"/runs/{RUN}?stage=context")
    expect(page.get_by_text("Pruned context",exact=False)).to_be_visible()
    expect(page.locator("#trace-step-2")).to_have_count(0)
    page.get_by_text("Show omitted steps",exact=True).click()
    expect(page.locator("#trace-step-2")).to_be_visible()
    page.locator("#trace-step-0 button").first.click()
    expect(page.locator("#trace-step-0 .context-warning")).to_contain_text("historical excerpt body is unavailable")
    page.locator("#trace-step-2 button").first.click()
    expect(page.locator("#trace-step-2 .context-warning")).to_contain_text("omitted from model context")
    context.close()

    context=browser.new_context();requests,case=setup(context,"processing");page=context.new_page()
    page.clock.install()
    page.goto(BASE+f"/runs/{RUN}")
    expect(page.get_by_text("Attribution pending",exact=True).first).to_be_visible()
    assert not any(path.startswith("/attributions/") for path,_ in requests)
    case.update(copy.deepcopy(DATA["cases"]["complete"]))
    page.clock.run_for(5100)
    expect(page.get_by_role("heading",name="Valid regression",exact=True)).to_be_visible()
    page.wait_for_timeout(100)
    before=len(requests)
    page.clock.run_for(16000)
    assert len(requests)==before,requests
    context.close()

    context=browser.new_context();setup(context,state="offline");page=context.new_page()
    page.goto(BASE+"/dashboard")
    expect(page.get_by_text("Unable to load dashboard.",exact=True)).to_be_visible(timeout=15000)
    assert page.locator("tbody tr").count()==0
    page.get_by_text("Error details",exact=True).click()
    expect(page.get_by_text("BACKEND_UNAVAILABLE",exact=False)).to_be_visible()
    context.close()
    browser.close()
print("4 edge groups passed: shrinking/empty page recovery, pruned UTF-8 context, active-to-terminal polling, backend offline.")

