const { chromium } = require("playwright"); const path = require("path");
const BASE="https://frontend-beige-zeta-86.vercel.app", OUT="/opt/autonomous-ai/hackathons/casper/demo-assets";
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{ const b=await chromium.launch({headless:true});
  const p=await (await b.newContext({viewport:{width:1920,height:1080}})).newPage();
  await p.goto(BASE+"/receipt/119",{waitUntil:"networkidle"}); await wait(3500);
  await p.screenshot({path:path.join(OUT,"v9_receipt.png")});
  console.log("  body:",(await p.evaluate(()=>document.body.innerText.slice(0,220))).replace(/\n/g," "));
  try{ const vb=await p.locator('button:has-text("Verify This Receipt"), button:has-text("Verify")').first();
    if(await vb.isVisible({timeout:3000})){ await vb.click();
      await p.waitForSelector("text=VERIFIED",{timeout:25000}).catch(()=>{}); await wait(1500);} }catch(e){}
  await p.screenshot({path:path.join(OUT,"v9_receipt_verified.png")});
  await b.close(); console.log("  receipt re-captured");
})().catch(e=>{console.error("Fatal:",e.message);process.exit(1);});
