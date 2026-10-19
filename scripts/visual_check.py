"""Responsive visual regression checks with real-schema HTTP fixtures."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import BASE, RUN, setup, assert_no_overflow

parser=argparse.ArgumentParser()
parser.add_argument("--phase",default="integration")
args=parser.parse_args()
output=Path("artifacts")/args.phase;output.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for theme in ["dark","light"]:
        for width in [1440,1100,390]:
            context=browser.new_context(viewport={"width":width,"height":1000})
            context.add_init_script(f"localStorage.setItem('tg_theme','{theme}')")
            setup(context)
            page=context.new_page();errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
            for name,path in {"landing":"/","dashboard":"/dashboard","runs":"/runs","detail":f"/runs/{RUN}","system":"/system","docs":"/docs/introduction"}.items():
                page.goto(BASE+path)
                page.wait_for_timeout(200)
                assert_no_overflow(page)
                assert not errors,errors
                page.screenshot(path=str(output/f"{name}-{theme}-{width}.png"),full_page=True)
                results.append(f"{name}/{theme}/{width}")
            context.close()
    browser.close()
(output/"visual-results.json").write_text(json.dumps(results,indent=2))
print(f"{len(results)} responsive visual checks passed")
