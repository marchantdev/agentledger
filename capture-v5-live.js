/**
 * AgentLedger Demo Capture v5 — Live Writable Flow
 *
 * Captures screenshots AND screen recording of the live workbench flow:
 * Navigate → pick scenario → watch agent trace → recording → receipt → tamper
 *
 * Prerequisites:
 * - Backend running with tunnel (BACKEND_URL set in Vercel)
 * - Vercel deployment live with /api/workbench/record returning 200
 * - npm install playwright (in frontend/)
 *
 * Usage: node capture-v5-live.js [--url URL] [--record]
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PROD_URL = 'https://frontend-beige-zeta-86.vercel.app';
const DEV_URL = 'http://localhost:5173';
const BASE = process.argv.includes('--dev') ? DEV_URL : PROD_URL;
const RECORD = process.argv.includes('--record');
const OUT = path.join(__dirname, 'demo-assets');

const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log(`Capturing from: ${BASE}`);
  console.log(`Recording video: ${RECORD}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ...(RECORD ? { recordVideo: { dir: path.join(OUT, 'video-segments'), size: { width: 1920, height: 1080 } } } : {}),
  });
  const page = await context.newPage();

  // ===== SCENE 1: Problem (title card — generated via ffmpeg, not captured here) =====

  // ===== SCENE 2: Landing Page =====
  console.log('\n[Scene 2] Landing page...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(2000);
  await page.screenshot({ path: path.join(OUT, 'v5_02_landing.png') });
  console.log('  ✓ Captured');

  // ===== SCENE 3: Workbench — LIVE RECORDING (key scene) =====
  console.log('\n[Scene 3] Workbench — live recording flow...');
  await page.goto(BASE + '/workbench', { waitUntil: 'networkidle' });
  await wait(1500);

  // 3a: Scenario cards
  await page.screenshot({ path: path.join(OUT, 'v5_03a_workbench_cards.png') });
  console.log('  ✓ Scenario cards');

  // 3b: Click "Vendor Payment" scenario
  try {
    const runBtn = await page.locator('button:has-text("Run")').first();
    await runBtn.click();
    console.log('  → Clicked Run on first scenario');

    // 3c: Wait for policy evaluation steps (each takes ~800ms)
    await wait(1000);
    await page.screenshot({ path: path.join(OUT, 'v5_03b_trace_evaluating.png') });
    console.log('  ✓ Mid-evaluation');

    // Wait for all steps to complete (4 steps × ~800ms + buffers)
    await wait(4000);
    await page.screenshot({ path: path.join(OUT, 'v5_03c_trace_complete.png') });
    console.log('  ✓ Evaluation complete');

    // 3d: Wait for decision display
    await wait(1500);
    await page.screenshot({ path: path.join(OUT, 'v5_03d_decision.png') });
    console.log('  ✓ Agent decision');

    // 3e: Wait for recording phase
    await wait(500);
    try {
      await page.waitForSelector('text=Hashing decision data', { timeout: 5000 });
      await page.screenshot({ path: path.join(OUT, 'v5_03e_recording.png') });
      console.log('  ✓ Recording in progress');
    } catch {
      console.log('  ⚠ Recording text not found (may have completed quickly)');
    }

    // 3f: Wait for "Decision Recorded On-Chain" confirmation
    try {
      await page.waitForSelector('text=Decision Recorded', { timeout: 40000 });
      await wait(1000); // let UI settle
      await page.screenshot({ path: path.join(OUT, 'v5_03f_confirmed.png') });
      console.log('  ✓ On-chain confirmation');

      // Capture the block height and tx hash
      const blockText = await page.textContent('[class*="block"]').catch(() => '');
      console.log(`    Block info: ${blockText.slice(0, 80)}`);
    } catch (e) {
      console.log('  ⚠ Confirmation timeout — may have fallen back to seeded');
      await page.screenshot({ path: path.join(OUT, 'v5_03f_result.png') });
    }

    // 3g: Click "View Receipt"
    try {
      const receiptBtn = await page.locator('text=View Receipt').first();
      if (await receiptBtn.isVisible({ timeout: 3000 })) {
        await receiptBtn.click();
        await wait(3000); // wait for receipt page + verification
        await page.screenshot({ path: path.join(OUT, 'v5_04_receipt_from_workbench.png') });
        console.log('  ✓ Receipt page (from workbench flow)');
      }
    } catch {
      console.log('  ⚠ View Receipt button not found');
    }
  } catch (e) {
    console.log('  ✗ Workbench flow error:', e.message.slice(0, 100));
  }

  // ===== SCENE 4: Receipt with Casper Proof =====
  console.log('\n[Scene 4] Receipt page with proof drawer...');
  await page.goto(BASE + '/receipt/0', { waitUntil: 'networkidle' });
  await wait(3000);

  // Wait for verification badge
  try {
    await page.waitForSelector('text=VERIFIED', { timeout: 15000 });
    await wait(500);
    await page.screenshot({ path: path.join(OUT, 'v5_04_receipt_verified.png') });
    console.log('  ✓ Receipt with VERIFIED badge');

    // Expand proof drawer
    const proofBtn = await page.locator('text=Raw Casper Proof').first();
    if (await proofBtn.isVisible({ timeout: 3000 })) {
      await proofBtn.click();
      await wait(1000);
      await page.evaluate(() => window.scrollBy(0, 400));
      await wait(500);
      await page.screenshot({ path: path.join(OUT, 'v5_04b_proof_drawer.png') });
      console.log('  ✓ Proof drawer expanded');
    }
  } catch {
    console.log('  ⚠ Verification not complete');
    await page.screenshot({ path: path.join(OUT, 'v5_04_receipt_state.png') });
  }

  // ===== SCENE 5: Tamper Detection =====
  console.log('\n[Scene 5] Tamper detection...');
  await page.goto(BASE + '/receipt/0', { waitUntil: 'networkidle' });
  try {
    await page.waitForSelector('text=VERIFIED', { timeout: 15000 });
    await wait(500);

    const tamperBtn = await page.locator('text=Try Tampering').first();
    if (await tamperBtn.isEnabled({ timeout: 5000 })) {
      await tamperBtn.click();
      await wait(3000); // wait for tamper verification
      await page.screenshot({ path: path.join(OUT, 'v5_05_tampered.png') });
      console.log('  ✓ TAMPERED state captured');
    } else {
      console.log('  ⚠ Tamper button disabled');
      await page.screenshot({ path: path.join(OUT, 'v5_05_tamper_disabled.png') });
    }
  } catch (e) {
    console.log('  ✗ Tamper error:', e.message.slice(0, 100));
    await page.screenshot({ path: path.join(OUT, 'v5_05_state.png') });
  }

  // ===== SCENE 6: Dispute Case File =====
  console.log('\n[Scene 6] Dispute case file...');
  await page.goto(BASE + '/dispute', { waitUntil: 'networkidle' });
  await wait(2000);
  await page.screenshot({ path: path.join(OUT, 'v5_06a_dispute_intro.png') });
  console.log('  ✓ Dispute intro');

  // Click through all phases
  for (let i = 0; i < 8; i++) {
    try {
      const btn = await page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Begin"), button:has-text("Verify"), button:has-text("Review"), button:has-text("Resolve")').first();
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click();
        await wait(1500);
      } else break;
    } catch { break; }
  }
  await wait(500);
  await page.screenshot({ path: path.join(OUT, 'v5_06b_dispute_verdict.png') });
  console.log('  ✓ Dispute verdict');

  // ===== Cleanup =====
  if (RECORD) {
    await page.close();
    // Video is saved automatically by Playwright
    console.log('\n  Video saved to demo-assets/video-segments/');
  }

  await context.close();
  await browser.close();

  // List output files
  console.log('\n--- Output Files ---');
  const files = fs.readdirSync(OUT).filter(f => f.startsWith('v5_')).sort();
  for (const f of files) {
    const stat = fs.statSync(path.join(OUT, f));
    console.log(`  ${f}: ${(stat.size / 1024).toFixed(0)}KB`);
  }
  console.log(`\nTotal: ${files.length} screenshots captured`);
})().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
