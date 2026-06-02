// One-off diagnostic: trace the mobile nav drawer open on a CPU-throttled
// headless Chrome and report where the time goes (Scripting vs Layout vs
// Paint vs Raster) in the window right after the hamburger tap.
import puppeteer from 'puppeteer-core';

const URL = process.argv[2] || 'http://localhost:4176/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const client = await page.target().createCDPSession();
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 }); // ~mid iPhone

await page.goto(URL, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 600)); // let hydration settle

// Find the hamburger (aria-label="Toggle menu")
const btn = await page.$('button[aria-label="Toggle menu"]');
if (!btn) { console.log('hamburger not found'); await browser.close(); process.exit(1); }

await page.tracing.start({ path: '/tmp/drawer-trace.json', categories: ['devtools.timeline'] });
const t0 = Date.now();
await btn.tap();
await new Promise((r) => setTimeout(r, 700)); // capture the full open
await page.tracing.stop();

// Parse the trace: sum durations by event type during capture.
const fs = await import('node:fs');
const trace = JSON.parse(fs.readFileSync('/tmp/drawer-trace.json', 'utf8'));
const events = trace.traceEvents || trace;
const buckets = {};
let firstPaintAfterTap = null;
const names = {
  'FunctionCall':'Scripting','EvaluateScript':'Scripting','TimerFire':'Scripting','RunMicrotasks':'Scripting',
  'Layout':'Layout','UpdateLayoutTree':'Layout','RecalculateStyles':'Layout','ParseAuthorStyleSheet':'Layout',
  'Paint':'Paint','PaintImage':'Paint','UpdateLayerTree':'Paint','CompositeLayers':'Paint',
  'RasterTask':'Raster','GPUTask':'Raster','DecodeImage':'Raster',
};
for (const e of events) {
  if (e.ph !== 'X' || !e.dur) continue;
  const cat = names[e.name];
  if (!cat) continue;
  buckets[cat] = (buckets[cat] || 0) + e.dur / 1000;
  if ((e.name === 'Paint') && firstPaintAfterTap === null) firstPaintAfterTap = e.name;
}
// Long main-thread tasks
const longTasks = events
  .filter((e) => e.ph === 'X' && e.name === 'RunTask' && e.dur > 16000)
  .map((e) => Math.round(e.dur / 1000));

console.log('\n=== Drawer-open cost breakdown (4x CPU throttle, ' + URL + ') ===');
for (const [k, v] of Object.entries(buckets).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(10)} ${v.toFixed(1)} ms total`);
}
console.log('  Long main-thread tasks (>16ms):', longTasks.length ? longTasks.join(', ') + ' ms' : 'none');
await browser.close();
