import { webkit, devices } from 'playwright';
const url = process.argv[2] || 'https://suncoastpoolpros.com/belleair-beach/';
const SLOW_4G = { offline: false, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 150 };
const browser = await webkit.launch();           // real WebKit ~ iOS Safari
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
const btn = page.getByRole('link', { name: /get a free quote/i }).first();
await btn.waitFor({ state: 'visible', timeout: 60000 });
const tVisible = Date.now() - t0;
let tInteractive = null;
for (let i = 0; i < 120; i++) {
  try { await btn.click({ timeout: 500 }); } catch {}
  const open = await page.getByText('Tell us about your pool').isVisible().catch(() => false);
  if (open) { tInteractive = Date.now() - t0; break; }
  await page.waitForTimeout(150);
}
console.log(`\nprofile: real WebKit (iOS Safari engine) | iPhone 13 | live site`);
console.log(`Button VISIBLE at:       ${(tVisible / 1000).toFixed(2)}s`);
console.log(`Popup OPENS (clickable): ${tInteractive != null ? (tInteractive / 1000).toFixed(2) + 's' : 'did NOT open within ~18s'}`);
console.log(`DEAD-BUTTON GAP:         ${tInteractive != null ? ((tInteractive - tVisible) / 1000).toFixed(2) + 's' : 'n/a'}`);
await browser.close();
