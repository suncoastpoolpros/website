import { webkit, devices } from 'playwright';
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
await page.goto('https://suncoastpoolpros.com/belleair-beach/', { waitUntil:'load', timeout:60000 });
await page.waitForTimeout(1500);
const all = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('a,button').forEach(n => {
    const txt = (n.innerText||'').trim().replace(/\s+/g,' ').slice(0,40);
    if (txt) out.push(`<${n.tagName}> "${txt}" href=${n.getAttribute('href')||''}`);
  });
  return out;
});
console.log(`Total interactive elements: ${all.length}`);
all.slice(0,30).forEach(l=>console.log(' ',l));
await browser.close();
