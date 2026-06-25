const { chromium } = require("playwright");
const path = require("path"); const fs = require("fs");
const BASE = "https://frontend-beige-zeta-86.vercel.app";
const OUT = "/opt/autonomous-ai/hackathons/casper/demo-assets";
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  const shot = n => page.screenshot({ path: path.join(OUT, n) });
  console.log("[1] landing");
  await page.goto(BASE, { waitUntil: "networkidle" }); await wait(2500); await shot("v9_landing.png");
  console.log("[2] /receipt/119");
  await page.goto(BASE + "/receipt/119", { waitUntil: "networkidle" }); await wait(3000); await shot("v9_receipt.png");
  console.log("  body:", (await page.evaluate(() => document.body.innerText.slice(0,160))).replace(/\n/g," "));
  try { const vb = await page.locator('button:has-text("Verify This Receipt"), button:has-text("Verify")').first();
    if (await vb.isVisible({ timeout: 3000 })) { await vb.click();
      await page.waitForSelector("text=VERIFIED", { timeout: 25000 }).catch(()=>{}); await wait(1500);
      await shot("v9_receipt_verified.png"); console.log("  verified shot"); }
    else { await shot("v9_receipt_verified.png"); }
  } catch(e){ console.log("  verify:", e.message.slice(0,60)); await shot("v9_receipt_verified.png"); }
  console.log("[3] /job-flow");
  await page.goto(BASE + "/job-flow", { waitUntil: "networkidle" }); await wait(2500); await shot("v9_job_brief.png");
  try {
    await page.locator('button:has-text("Assign to Agent")').first().click(); await wait(5500);
    await page.locator('button:has-text("Record on Casper")').first().click(); await wait(8000);
    await page.locator('button:has-text("View Receipt")').first().click(); await wait(2500);
    await page.locator('button:has-text("Payer Verifies")').first().click(); await wait(1500);
    await page.locator('button:has-text("Verify This Receipt")').first().click();
    await page.waitForSelector("text=VERIFIED", { timeout: 25000 }).catch(()=>{}); await wait(1500);
    await page.locator('button:has-text("Test Tampering")').first().click(); await wait(2000);
    await shot("v9_tamper_comparison.png"); console.log("  tamper comparison shot");
    await page.locator('span:has-text("Test Claim"), button:has-text("Test Claim")').first().click();
    await page.waitForSelector("text=HASH MISMATCH", { timeout: 20000 }).catch(()=>{}); await wait(1500);
    await shot("v9_tampered.png"); console.log("  tampered shot");
  } catch(e){ console.log("  jobflow:", e.message.slice(0,90)); await shot("v9_jobflow_state.png"); }
  await browser.close();
  for (const f of fs.readdirSync(OUT).filter(f=>f.startsWith("v9_")).sort())
    console.log("  "+f+": "+(fs.statSync(path.join(OUT,f)).size/1024).toFixed(0)+"KB");
})().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
