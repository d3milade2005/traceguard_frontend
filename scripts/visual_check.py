"""Local browser verification. Uses the existing Python Playwright installation."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--phase', default='after')
args = parser.parse_args()
output = Path('artifacts') / args.phase
output.mkdir(parents=True, exist_ok=True)
routes = {
    'landing': '/', 'dashboard': '/dashboard', 'runs': '/runs',
    'run-detail': '/runs/run_9f82a4c1', 'system': '/system',
    'docs-introduction': '/docs/introduction', 'docs-quick-start': '/docs/quick-start',
    'docs-unavailable': '/docs/attribution',
}
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for theme in ['dark', 'light']:
        for width in [1440, 1100, 390]:
            context = browser.new_context(viewport={'width': width, 'height': 1000}, device_scale_factor=1)
            context.add_init_script(f"localStorage.setItem('tg_theme', '{theme}')")
            context.route('https://fonts.googleapis.com/**', lambda route: route.abort())
            context.route('https://avatars.githubusercontent.com/**', lambda route: route.abort())
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            for name, route in routes.items():
                page.goto('http://127.0.0.1:5173' + route, wait_until='domcontentloaded')
                page.wait_for_timeout(300)
                page.screenshot(path=str(output / f'{name}-{theme}-{width}.png'), full_page=True)
                if name in ['dashboard', 'runs', 'run-detail', 'system']:
                    page.locator('.app-main').evaluate('element => element.scrollTop = element.scrollHeight')
                    page.screenshot(path=str(output / f'{name}-{theme}-{width}-bottom.png'), full_page=True)
                results.append({'route': route, 'theme': theme, 'width': width,
                    'overflow': page.evaluate('document.documentElement.scrollWidth > innerWidth'),
                    'h1': page.locator('h1').all_text_contents(), 'errors': errors.copy()})
            # Exercise the real sign-out mutation to view login without modifying auth.
            page.goto('http://127.0.0.1:5173/dashboard')
            if width < 768:
                page.get_by_role('button', name='Toggle menu', exact=False).click()
            page.get_by_role('button', name='Sign out', exact=True).click()
            page.wait_for_url('http://127.0.0.1:5173/')
            page.evaluate("history.pushState({}, '', '/login'); window.dispatchEvent(new PopStateEvent('popstate'))")
            page.wait_for_timeout(250)
            page.screenshot(path=str(output / f'login-{theme}-{width}.png'), full_page=True)
            results.append({'route': '/login (after sign out)', 'theme': theme, 'width': width,
                'overflow': page.evaluate('document.documentElement.scrollWidth > innerWidth'),
                'errors': errors.copy()})
            context.close()
    browser.close()
(output / 'results.json').write_text(json.dumps(results, indent=2))
print(json.dumps({'screenshots': len(results), 'overflow': [r for r in results if r['overflow']],
    'errors': [r for r in results if r['errors']]}, indent=2))
