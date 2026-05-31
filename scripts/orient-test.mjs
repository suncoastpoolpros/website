import { webkit } from 'playwright';

const url = process.argv[2] || 'https://suncoastpoolpros.com/belleair-beach-fl/';

// iPhone 13 logical sizes: portrait 390x844, landscape 844x390.
const cases = [
  { name: 'PORTRAIT  (390x844)', vp: { width: 390, height: 844 } },
  { name: 'LANDSCAPE (844x390)', vp: { width: 844, height: 390 } },
];

const browser = await webkit.launch();
for (const c of cases) {
  const ctx = await browser.newContext({
    viewport: c.vp,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3500);
  const m = await page.evaluate(() => {
    const paints = performance.getEntriesByType('paint');
    const fcp = (paints.find((p) => p.name === 'first-contentful-paint') || {}).startTime || null;
    // Which hero bg branch is active & does it carry a mask/filter?
    const heroM = document.querySelector('.hero-bg-belleair-mobile');
    const heroD = document.querySelector('.hero-bg-belleair-desktop');
    const vis = (el) => el && getComputedStyle(el).display !== 'none' && el.offsetParent !== null;
    const cs = (el) => el ? getComputedStyle(el) : null;
    const mCS = cs(heroM), dCS = cs(heroD);
    return {
      fcp,
      mobileHeroVisible: vis(heroM),
      desktopHeroVisible: vis(heroD),
      mobileHasMask: mCS ? (mCS.webkitMaskImage !== 'none' || mCS.maskImage !== 'none') : null,
      mobileFilter: mCS ? mCS.filter : null,
      desktopFilter: dCS ? dCS.filter : null,
    };
  });
  console.log(`\n=== ${c.name} ===`);
  console.log(`FCP: ${m.fcp != null ? (m.fcp / 1000).toFixed(2) + 's' : 'n/a'}   | wall to load: ${((Date.now() - t0) / 1000).toFixed(2)}s`);
  console.log(`active hero -> mobile:${m.mobileHeroVisible}  desktop:${m.desktopHeroVisible}`);
  console.log(`mobile hero mask-image active: ${m.mobileHasMask}`);
  console.log(`mobile hero filter:  ${m.mobileFilter}`);
  await ctx.close();
}
await browser.close();
