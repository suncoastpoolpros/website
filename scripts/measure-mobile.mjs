// Real mobile-profile measurement: iPhone viewport + Slow 4G + 4x CPU throttle.
// Matches the Lighthouse mobile profile referenced in CLAUDE.md.
// Usage: node scripts/measure-mobile.mjs <url> [runs]
import { chromium, devices } from 'playwright';

const url = process.argv[2] || 'https://suncoastpoolpros.com/belleair-beach/';
const runs = Number(process.argv[3] || 3);

// Lighthouse "Slow 4G" preset.
const SLOW_4G = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
  uploadThroughput: (750 * 1024) / 8,           // 750 Kbps
  latency: 150,                                  // 150ms RTT
};

const iPhone = devices['iPhone 13'];

async function once() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  let transferred = 0;
  page.on('response', async (res) => {
    try {
      const h = res.headers();
      const len = Number(h['content-length'] || 0);
      transferred += len;
    } catch {}
  });

  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', SLOW_4G);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // Install observers BEFORE navigation so we catch LCP/longtasks/CLS live.
  await page.addInitScript(() => {
    window.__vitals = { lcp: null, lcpEl: null, cls: 0, tbt: 0, longTaskCount: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        window.__vitals.lcp = e.startTime;
        window.__vitals.lcpEl = e.element
          ? (e.element.tagName + (e.element.currentSrc || e.element.src || e.element.className || ''))
          : (e.url || e.id || 'text');
        window.__vitals.lcpUrl = e.url || null;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) { window.__vitals.tbt += Math.max(0, e.duration - 50); window.__vitals.longTaskCount++; }
    }).observe({ type: 'longtask', buffered: true });
  });

  const start = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  // Let LCP / long tasks settle.
  await page.waitForTimeout(4000);

  const vitals = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paints = performance.getEntriesByType('paint');
    const fcp = (paints.find((p) => p.name === 'first-contentful-paint') || {}).startTime || null;
    const v = window.__vitals || {};
    return {
      ttfb: nav.responseStart || null,
      domContentLoaded: nav.domContentLoadedEventEnd || null,
      load: nav.loadEventEnd || null,
      fcp,
      lcp: v.lcp,
      lcpEl: v.lcpEl,
      lcpUrl: v.lcpUrl,
      cls: v.cls,
      tbtProxy: v.tbt || 0,
      longTaskCount: v.longTaskCount || 0,
    };
  });

  await browser.close();
  return { ...vitals, wallMs: Date.now() - start, transferredKB: Math.round(transferred / 1024) };
}

const fmt = (n) => (n == null ? 'n/a' : `${(n / 1000).toFixed(2)}s`);
const results = [];
for (let i = 0; i < runs; i++) {
  process.stderr.write(`run ${i + 1}/${runs}... `);
  results.push(await once());
  process.stderr.write('done\n');
}

const median = (arr) => {
  const s = arr.filter((x) => x != null).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};

console.log(`\n=== ${url} ===`);
console.log(`profile: iPhone 13 viewport | Slow 4G (1.6Mbps/150ms) | 4x CPU throttle | ${runs} runs (median)\n`);
console.log(`FCP        ${fmt(median(results.map((r) => r.fcp)))}   (target <1.5s)`);
console.log(`LCP        ${fmt(median(results.map((r) => r.lcp)))}   (target <2.5s)`);
console.log(`TBT proxy  ${Math.round(median(results.map((r) => r.tbtProxy)))}ms   (target <200ms)`);
console.log(`DCL        ${fmt(median(results.map((r) => r.domContentLoaded)))}`);
console.log(`Load       ${fmt(median(results.map((r) => r.load)))}`);
console.log(`CLS        ${(median(results.map((r) => r.cls)) || 0).toFixed(3)}   (target <0.1)`);
console.log(`Transfer   ${median(results.map((r) => r.transferredKB))} KB`);
console.log(`LCP elem   ${results[results.length - 1].lcpEl || 'n/a'}`);
console.log(`LCP url    ${results[results.length - 1].lcpUrl || 'n/a'}`);
console.log(`\nper-run:`, results.map((r) => ({ fcp: Math.round(r.fcp), lcp: Math.round(r.lcp || 0), tbt: Math.round(r.tbtProxy), kb: r.transferredKB })));
