const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, 'demo-assets');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Scene 2: Landing page
  console.log('Capturing landing page...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(2000);
  await page.screenshot({ path: path.join(OUT, 'v4_02_landing.png'), fullPage: false });
  console.log('  OK');

  // Scene 3a: Dashboard
  console.log('Capturing dashboard...');
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
  await wait(2500);
  await page.screenshot({ path: path.join(OUT, 'v4_03_dashboard.png'), fullPage: false });
  console.log('  OK');

  // Scene 3b: Workbench
  console.log('Capturing workbench...');
  await page.goto(BASE + '/workbench', { waitUntil: 'networkidle' });
  await wait(2000);
  await page.screenshot({ path: path.join(OUT, 'v4_04_workbench.png'), fullPage: false });
  console.log('  OK');

  // Scene 4: Receipt page
  console.log('Capturing receipt...');
  await page.goto(BASE + '/receipt/0', { waitUntil: 'networkidle' });
  // Wait for verification to complete (chainVerified)
  await wait(4000);
  await page.screenshot({ path: path.join(OUT, 'v4_05_receipt.png'), fullPage: false });
  console.log('  OK');

  // Scene 4b: Expand proof drawer
  console.log('Expanding proof drawer...');
  try {
    const proofBtn = await page.locator('text=Raw Casper Proof').first();
    if (await proofBtn.isVisible()) {
      await proofBtn.click();
      await wait(1000);
      await page.evaluate(() => window.scrollBy(0, 400));
      await wait(500);
      await page.screenshot({ path: path.join(OUT, 'v4_06_proof_drawer.png'), fullPage: false });
      console.log('  OK');
    } else {
      console.log('  Proof button not visible');
    }
  } catch (e) {
    console.log('  Proof drawer error:', e.message.slice(0, 100));
  }

  // Scene 5: Tamper detection
  console.log('Capturing tamper...');
  await page.goto(BASE + '/receipt/0', { waitUntil: 'networkidle' });
  // Wait for verification to complete so tamper button enables
  console.log('  Waiting for verification...');
  try {
    await page.waitForSelector('text=VERIFIED', { timeout: 15000 });
    console.log('  Verification complete');
    await wait(500);

    // Click tamper button
    const tamperBtn = await page.locator('text=Try Tampering').first();
    if (await tamperBtn.isEnabled({ timeout: 5000 })) {
      await tamperBtn.click();
      await wait(2500); // Wait for tamper verification to complete
      await page.screenshot({ path: path.join(OUT, 'v4_07_tampered.png'), fullPage: false });
      console.log('  OK');
    } else {
      console.log('  Tamper button still disabled');
      await page.screenshot({ path: path.join(OUT, 'v4_07_tampered_disabled.png'), fullPage: false });
    }
  } catch (e) {
    console.log('  Tamper error:', e.message.slice(0, 100));
    // Still capture the page state
    await page.screenshot({ path: path.join(OUT, 'v4_07_receipt_state.png'), fullPage: false });
  }

  // Scene 6: Dispute case file
  console.log('Capturing dispute intro...');
  await page.goto(BASE + '/dispute', { waitUntil: 'networkidle' });
  await wait(2000);
  await page.screenshot({ path: path.join(OUT, 'v4_08_dispute_intro.png'), fullPage: false });
  console.log('  OK');

  // Click through phases
  console.log('Advancing dispute phases...');
  for (let i = 0; i < 6; i++) {
    try {
      // Look for various button text patterns
      const nextBtn = await page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Begin"), button:has-text("Verify"), button:has-text("Review"), button:has-text("Resolve")').first();
      if (await nextBtn.isVisible({ timeout: 2000 })) {
        await nextBtn.click();
        await wait(1500);
      }
    } catch {
      break;
    }
  }
  await wait(500);
  await page.screenshot({ path: path.join(OUT, 'v4_09_dispute_verdict.png'), fullPage: false });
  console.log('  OK');

  await browser.close();
  console.log('\nDone! Screenshots saved to demo-assets/v4_*');

  // List output files
  const fs = require('fs');
  const files = fs.readdirSync(OUT).filter(f => f.startsWith('v4_'));
  for (const f of files) {
    const stat = fs.statSync(path.join(OUT, f));
    console.log(`  ${f}: ${(stat.size / 1024).toFixed(0)}KB`);
  }
})().catch(console.error);
