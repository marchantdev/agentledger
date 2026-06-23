const { chromium } = require('playwright');
const path = require('path');

const BASE = 'https://beast-minnesota-parish-monkey.trycloudflare.com';
const OUT = path.join(__dirname, 'screenshots');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // 1. Landing page
  console.log('Capturing landing page...');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '02_landing.png'), fullPage: false });

  // 2. Dashboard
  console.log('Capturing dashboard...');
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '03_dashboard.png'), fullPage: false });

  // 3. Dashboard - click first decision to expand
  console.log('Expanding first decision...');
  const firstDecision = page.locator('button, [role="button"], tr, .cursor-pointer').first();
  try {
    await firstDecision.click({ timeout: 3000 });
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log('No clickable decision found, continuing...');
  }
  await page.screenshot({ path: path.join(OUT, '04_dashboard_expanded.png'), fullPage: false });

  // 4. Verify page - initial state with guided demo button
  console.log('Capturing verify page...');
  await page.goto(BASE + '/verify', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '05_verify_start.png'), fullPage: false });

  // 5. Click the guided demo button and capture verification pass
  console.log('Running guided demo...');
  const demoBtn = page.locator('text=Try the Guided Demo').first();
  try {
    await demoBtn.click({ timeout: 5000 });
    // Wait for step 1 verification to complete (show_verified state)
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(OUT, '06_verify_pass.png'), fullPage: false });

    // Wait for tampering step
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(OUT, '07_verify_tampered.png'), fullPage: false });

    // Wait for tamper detection result
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(OUT, '08_verify_fail.png'), fullPage: false });
  } catch (e) {
    console.log('Guided demo button not found, trying manual verify...');
    // Fallback: select a decision and verify manually
    const select = page.locator('select').first();
    if (await select.count() > 0) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUT, '06_verify_pass.png'), fullPage: false });
    }
  }

  // 6. Explore page
  console.log('Capturing explore page...');
  await page.goto(BASE + '/explore', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '09_explore.png'), fullPage: false });

  // 7. Landing page bottom (stats)
  console.log('Capturing landing stats...');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, '10_close.png'), fullPage: false });

  console.log('All screenshots captured!');
  await browser.close();
})();
