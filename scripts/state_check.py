"""Loading, empty, and safe error presentations using real-schema HTTP fixtures."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from browser_support import BASE, RUN, setup, assert_no_overflow

def run():
    output=Path("artifacts/states"); output.mkdir(parents=True,exist_ok=True)
    checks=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for theme in ["dark","light"]:
            for width in [1440,390]:
                for state in ["empty","error","loading"]:
                    context=browser.new_context(viewport={"width":width,"height":1000})
                    context.add_init_script(f"localStorage.setItem('tg_theme','{theme}')")
                    setup(context,state=state)
                    page=context.new_page();errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
                    routes=[("dashboard","/dashboard"),("runs","/runs")] if state=="empty" else [("dashboard","/dashboard"),("runs","/runs"),("detail",f"/runs/{RUN}"),("system","/system")]
                    for name,url in routes:
                        page.goto(BASE+url)
                        if state=="empty":
                            expect(page.get_by_text("No runs yet",exact=True)).to_be_visible()
                        elif state=="error":
                            expect(page.get_by_role("button",name="Retry",exact=True)).to_be_visible(timeout=15000)
                            assert "password=" not in page.locator("body").inner_text()
                            page.get_by_text("Error details",exact=True).click()
                            expect(page.get_by_text("DEPENDENCY_UNAVAILABLE",exact=False)).to_be_visible()
                        else:
                            expect(page.get_by_role("status").filter(has_text="Loading")).to_be_visible()
                        assert_no_overflow(page)
                        assert not errors, errors
                        page.screenshot(path=str(output/f"{name}-{state}-{theme}-{width}.png"),full_page=True)
                        checks.append(f"{name}/{state}/{theme}/{width}")
                        if state=="loading":
                            for route in context.pending_api_routes:
                                route.abort()
                            context.pending_api_routes.clear()
                    context.close()
        browser.close()
    (output/"results.json").write_text(json.dumps(checks,indent=2))
    print(f"{len(checks)} loading/empty/error route checks passed")
if __name__=="__main__": run()
