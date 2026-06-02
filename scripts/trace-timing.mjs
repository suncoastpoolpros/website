// Re-parse the captured drawer trace for TIMING (not totals): when does the
// big gtag scripting task run relative to the tap, and when does the drawer
// first paint? What matters for smoothness is whether the ~first 350ms (the
// drawer mount + slide window) is free of a long main-thread task.
import fs from 'node:fs';
const trace = JSON.parse(fs.readFileSync(process.argv[2] || '/tmp/drawer-trace.json', 'utf8'));
const events = (trace.traceEvents || trace).filter((e) => e.ph === 'X' && e.dur);
const t0 = Math.min(...events.map((e) => e.ts)); // ~ tracing start ≈ tap
const off = (e) => (e.ts - t0) / 1000; // ms since tap

const SCRIPT = new Set(['FunctionCall', 'EvaluateScript', 'TimerFire', 'RunMicrotasks', 'v8.compile']);
const scripts = events.filter((e) => SCRIPT.has(e.name)).map((e) => ({ start: off(e), dur: e.dur / 1000, name: e.name }));

// Scripting time inside the drawer's open window (0–350ms) vs after it.
const inWindow = scripts.filter((s) => s.start < 350).reduce((a, s) => a + Math.min(s.dur, 350 - s.start), 0);
const afterWindow = scripts.filter((s) => s.start + s.dur > 350).reduce((a, s) => a + Math.max(0, s.start + s.dur - 350), 0);

const biggest = scripts.sort((a, b) => b.dur - a.dur).slice(0, 3);
const firstPaint = events.filter((e) => e.name === 'Paint' && off(e) > 5).sort((a, b) => a.ts - b.ts)[0];

console.log('\n=== Drawer-open TIMING (relative to tap) ===');
console.log(`  Scripting during open window (0–350ms): ${inWindow.toFixed(1)} ms  ← must be low for a smooth open`);
console.log(`  Scripting after  open window (350ms+):   ${afterWindow.toFixed(1)} ms  ← gtag should land here now`);
console.log(`  First Paint after tap: ${firstPaint ? off(firstPaint).toFixed(0) + ' ms' : 'n/a'}`);
console.log('  Biggest script tasks (start → dur):');
for (const b of biggest) console.log(`    ${b.start.toFixed(0).padStart(4)}ms → ${b.dur.toFixed(0)}ms  (${b.name})`);
