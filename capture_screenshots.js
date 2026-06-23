const puppeteer = require('puppeteer-core');
const path = require('path');

const BASE_URL = 'https://beast-minnesota-parish-monkey.trycloudflare.com';
const OUT_DIR = path.join(__dirname, 'screenshots');

const pages = [
  { name: '01_landing', url: '/', waitFor: 'h1' },
  { name: '02_dashboard', url: '/dashboard', waitFor: '.decision-card, .dashboard-grid, table, [class*="decision"]' },
  { name: '04_verify', url: '/verify', waitFor: 'select, .verify-form, [class*="verify"]' },
  { name: '06_explorer', url: '/explorer', waitFor: '.explorer, table, [class*="explorer"]' },
  { name: '09_stats', url: '/#stats', waitFor: '.stats, [class*="stat"]' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/snap/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080'],
  });

  for (const pg of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      await page.goto(`${BASE_URL}${pg.url}`, { waitUntil: 'networkidle2', timeout: 15000 });

      // Wait for content to render
      try {
        await page.waitForSelector(pg.waitFor, { timeout: 8000 });
      } catch {
        console.log(`Warning: selector "${pg.waitFor}" not found for ${pg.name}, taking screenshot anyway`);
      }

      // Extra wait for animations
      await new Promise(r => setTimeout(r, 1500));

      await page.screenshot({ path: path.join(OUT_DIR, `${pg.name}.png`), fullPage: false });
      console.log(`Captured: ${pg.name}.png`);
    } catch (err) {
      console.error(`Error on ${pg.name}: ${err.message}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('Done.');
})();
