#!/usr/bin/env python3
"""Register on console.cspr.build to get CSPR.cloud API key."""
import asyncio
import os
import requests
import time
from patchright.async_api import async_playwright

CAPSOLVER_KEY = os.environ.get('CAPSOLVER_API_KEY', '')
SITEKEY = '6Le50ogpAAAAABgcTwIJ4HIQ591lqKiNrESfD1rn'
PAGE_URL = 'https://console.cspr.build/sign-up'


def solve_recaptcha():
    """Solve reCAPTCHA v2 via CapSolver (sync)."""
    resp = requests.post('https://api.capsolver.com/createTask', json={
        'clientKey': CAPSOLVER_KEY,
        'task': {
            'type': 'ReCaptchaV2TaskProxyLess',
            'websiteURL': PAGE_URL,
            'websiteKey': SITEKEY,
        }
    }, timeout=30)
    data = resp.json()
    if data.get('errorId', 0) != 0:
        print(f'CapSolver create error: {data}')
        return None
    task_id = data['taskId']
    print(f'Task: {task_id}')

    for i in range(60):
        time.sleep(5)
        resp = requests.post('https://api.capsolver.com/getTaskResult', json={
            'clientKey': CAPSOLVER_KEY,
            'taskId': task_id,
        }, timeout=30)
        result = resp.json()
        status = result.get('status', 'unknown')
        if status == 'ready':
            token = result['solution']['gRecaptchaResponse']
            print(f'Solved! Token length: {len(token)}')
            return token
        if i % 3 == 0:
            print(f'  Waiting... ({status})')
    return None


async def register(captcha_token):
    """Fill and submit registration form."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto(PAGE_URL, timeout=15000)
            await page.wait_for_load_state('networkidle', timeout=10000)

            await page.click('button:has-text("Individual account")')
            await asyncio.sleep(0.5)

            inputs = await page.query_selector_all('input')
            for inp in inputs:
                if not await inp.is_visible():
                    continue
                itype = await inp.get_attribute('type') or 'text'
                if itype == 'email':
                    await inp.fill('smarchant2026@gmail.com')
                elif itype == 'password':
                    await inp.fill('CsprBuild2026!Sec')
                elif itype in ('text', ''):
                    val = await inp.input_value()
                    if not val:
                        await inp.fill('Sam Marchant')

            ack = await page.query_selector('text=acknowledge')
            if ack:
                await ack.click()
            await asyncio.sleep(0.3)

            await page.evaluate('''(token) => {
                let els = document.querySelectorAll('textarea[name="g-recaptcha-response"]');
                els.forEach(el => { el.value = token; el.innerHTML = token; });
                let el2 = document.getElementById("g-recaptcha-response");
                if (el2) { el2.value = token; el2.innerHTML = token; }
            }''', captcha_token)
            await asyncio.sleep(1)

            await page.click('button:has-text("Create account")')
            print('Submitted registration')
            await asyncio.sleep(5)

            body = await page.query_selector('body')
            text = await body.inner_text()
            url = page.url
            print(f'URL: {url}')
            print('---RESULT---')
            print(text[:800])

        except Exception as e:
            print(f'Error: {e}')
        finally:
            await browser.close()


def main():
    print('Step 1: Solving reCAPTCHA...')
    token = solve_recaptcha()
    if not token:
        print('FAILED: Could not solve CAPTCHA')
        return
    print('Step 2: Registering...')
    asyncio.run(register(token))


if __name__ == '__main__':
    main()
