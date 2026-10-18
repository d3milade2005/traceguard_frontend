"""Use browser-only fixtures to inspect loading, empty, and error presentations."""
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

output = Path('artifacts/states')
output.mkdir(parents=True, exist_ok=True)
checks = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for theme in ['dark', 'light']:
        for width in [1440, 390]:
            for state in ['empty', 'error', 'loading']:
                context = browser.new_context(viewport={'width': width, 'height': 1000})
                context.add_init_script(f"localStorage.setItem('tg_theme', '{theme}')")
                context.route('https://fonts.googleapis.com/**', lambda route: route.abort())
                def queries_fixture(route):
                    response = route.fetch()
                    source = response.text()
                    if state == 'empty':
                        source = source.replace('return MOCK_DASHBOARD_SUMMARY;', 'return { metrics: { total_runs: 0, active_analyses: 0, review_required: 0, valid_regressions: 0 }, needs_attention: [], recent_runs: [] };')
                        source = source.replace('return { items: filtered, total: filtered.length };', 'return { items: [], total: 0 };')
                    elif state == 'error':
                        source = source.replace('return MOCK_DASHBOARD_SUMMARY;', 'throw new Error("Browser-only error fixture");')
                        source = source.replace('return { items: filtered, total: filtered.length };', 'throw new Error("Browser-only error fixture");')
                        source = source.replace('return getMockRunDetail(runId);', 'throw new Error("Browser-only error fixture");')
                        source = source.replace('return MOCK_SYSTEM_STATUS;', 'throw new Error("Browser-only error fixture");')
                    else:
                        for original in ['return MOCK_DASHBOARD_SUMMARY;', 'return { items: filtered, total: filtered.length };', 'return getMockRunDetail(runId);', 'return MOCK_SYSTEM_STATUS;']:
                            source = source.replace(original, 'await new Promise(() => {}); ' + original)
                    route.fulfill(response=response, body=source)
                context.route('**/src/api/queries.ts', queries_fixture)
                page = context.new_page()
                routes = [('dashboard', '/dashboard'), ('runs', '/runs')] if state == 'empty' else [('dashboard', '/dashboard'), ('runs', '/runs'), ('run-detail', '/runs/run_9f82a4c1'), ('system', '/system')]
                for name, url in routes:
                    page.goto('http://127.0.0.1:5173' + url)
                    if state == 'empty':
                        expect(page.get_by_text('No runs yet', exact=True)).to_be_visible()
                        if name == 'dashboard':
                            expect(page.get_by_text('No review required', exact=True)).to_be_visible()
                    elif state == 'error':
                        expect(page.get_by_role('button', name='Retry', exact=True)).to_be_visible(timeout=15000)
                    else:
                        expect(page.get_by_role('status')).to_be_visible()
                    page.screenshot(path=str(output / f'{name}-{state}-{theme}-{width}.png'), full_page=True)
                    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
                    checks.append(f'{name} {state} {theme} {width}')
                context.close()
    browser.close()
(output / 'results.json').write_text(json.dumps(checks, indent=2))
print(f'{len(checks)} loading, empty, and error route checks passed')
