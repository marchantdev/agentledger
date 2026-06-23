const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const OUT_DIR = path.join(__dirname, 'demo-assets');

fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  async function shot(page, name, delay = 1500) {
    await new Promise(r => setTimeout(r, delay));
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false });
    console.log(`  ✓ ${name}.png`);
  }

  // Scene 2: Landing page
  console.log('Scene 2: Landing');
  const landing = await context.newPage();
  await landing.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
  await shot(landing, '02_landing');
  await landing.close();

  // Scene 3: Dashboard
  console.log('Scene 3: Dashboard');
  const dash = await context.newPage();
  await dash.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 });
  await shot(dash, '03_dashboard');
  await dash.close();

  // Scene 4: Receipt page (decision 0 — treasury vendor payment)
  console.log('Scene 4: Receipt');
  const receipt = await context.newPage();
  await receipt.goto(`${BASE_URL}/receipt/0`, { waitUntil: 'networkidle', timeout: 15000 });
  await shot(receipt, '04_receipt', 2000);

  // Scene 5: Tamper detection on receipt page
  console.log('Scene 5: Tamper detection');
  // Click the "Try Tampering" button
  const tamperBtn = await receipt.$('button:has-text("Try Tamper"), button:has-text("tamper"), button:has-text("Tamper")');
  if (tamperBtn) {
    await tamperBtn.click();
    await new Promise(r => setTimeout(r, 3000));
    await shot(receipt, '05_receipt_tampered');
  } else {
    console.log('  ! Tamper button not found, taking screenshot anyway');
    await shot(receipt, '05_receipt_tampered');
  }
  await receipt.close();

  // Scene 6: Workbench
  console.log('Scene 6: Workbench');
  const workbench = await context.newPage();
  await workbench.goto(`${BASE_URL}/workbench`, { waitUntil: 'networkidle', timeout: 15000 });
  await shot(workbench, '06_workbench');
  await workbench.close();

  // Scene 7: Audit export (receipt page with export buttons visible)
  console.log('Scene 7: Audit export');
  const auditPage = await context.newPage();
  await auditPage.goto(`${BASE_URL}/receipt/0`, { waitUntil: 'networkidle', timeout: 15000 });
  // Scroll down to see export buttons
  await auditPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(auditPage, '08_audit_export', 2000);
  await auditPage.close();

  // Scene 9: Landing stats (scroll down)
  console.log('Scene 9: Close');
  const closePage = await context.newPage();
  await closePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
  await closePage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(closePage, '09_close');
  await closePage.close();

  await browser.close();
  console.log('\nDone! Screenshots saved to demo-assets/');
})();
