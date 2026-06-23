
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  const BASE = process.env.DEPLOY_URL;
  const OUT = process.env.OUTPUT_DIR;
  
  // Wait helper
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  
  // 1. Landing page
  console.log("Capturing landing page...");
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(2000);
  await page.screenshot({ path: `${OUT}/02_landing.png`, fullPage: false });
  
  // 2. Dashboard
  console.log("Capturing dashboard...");
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(3000);
  await page.screenshot({ path: `${OUT}/03_dashboard.png`, fullPage: false });
  
  // 3. Receipt page (decision 0)
  console.log("Capturing receipt page...");
  await page.goto(`${BASE}/receipt/0`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(3000);
  await page.screenshot({ path: `${OUT}/04_receipt.png`, fullPage: false });
  
  // 4. Tamper demo - click "Try Tampering" if it exists
  console.log("Capturing tamper demo...");
  try {
    const tamperBtn = await page.locator('button:has-text("Try Tamper"), button:has-text("Tamper")').first();
    if (await tamperBtn.isVisible({ timeout: 3000 })) {
      await tamperBtn.click();
      await wait(2000);
      await page.screenshot({ path: `${OUT}/05_receipt_tampered.png`, fullPage: false });
    } else {
      console.log("  No tamper button found, taking receipt page as-is");
      await page.screenshot({ path: `${OUT}/05_receipt_tampered.png`, fullPage: false });
    }
  } catch (e) {
    console.log("  Tamper button error:", e.message);
    await page.screenshot({ path: `${OUT}/05_receipt_tampered.png`, fullPage: false });
  }
  
  // 5. Workbench page
  console.log("Capturing workbench...");
  await page.goto(`${BASE}/workbench`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(3000);
  await page.screenshot({ path: `${OUT}/06_workbench.png`, fullPage: false });

  // 6. Job Flow page (V4)
  console.log("Capturing job flow...");
  await page.goto(`${BASE}/job-flow`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(3000);
  await page.screenshot({ path: `${OUT}/06_jobflow.png`, fullPage: false });

  // 7. About / Docs page (has Why Casper section - V6)
  console.log("Capturing about/docs page...");
  await page.goto(`${BASE}/about`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(2000);
  await page.screenshot({ path: `${OUT}/07_about.png`, fullPage: false });

  // Scroll to Why Casper section if exists
  try {
    const whyCasper = await page.locator('text=Why Casper').first();
    if (await whyCasper.isVisible({ timeout: 3000 })) {
      await whyCasper.scrollIntoViewIfNeeded();
      await wait(1000);
      await page.screenshot({ path: `${OUT}/08_why_casper.png`, fullPage: false });
    }
  } catch (e) {
    console.log("  Why Casper section not found:", e.message);
  }

  // 8. Dispute case file (if it exists)
  console.log("Capturing dispute page...");
  try {
    await page.goto(`${BASE}/dispute`, { waitUntil: 'networkidle', timeout: 15000 });
    await wait(2000);
    await page.screenshot({ path: `${OUT}/09_dispute.png`, fullPage: false });
  } catch (e) {
    console.log("  Dispute page not accessible:", e.message);
  }
  
  await browser.close();
  console.log("Done! Screenshots in:", OUT);
})();
