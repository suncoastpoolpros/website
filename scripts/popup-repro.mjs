import { webkit } from 'playwright';
const PORT = process.argv[2];
const url = `http://localhost:${PORT}/belleair-beach-fl/`;
const b = await webkit.launch();
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:3, isMobile:true, hasTouch:true });
const p = await ctx.newPage();
await p.goto(url,{waitUntil:'load',timeout:60000});
await p.waitForTimeout(800);
const sample = 'same technician'; // below-fold copy
const visBefore = await p.getByText(/the same technician/i).first().isVisible().catch(()=>false);
// open popup
await p.getByRole('button',{name:/get a quote/i}).first().click().catch(async()=>{ await p.getByText(/get a free quote/i).first().click(); });
await p.waitForTimeout(600);
const sheetOpen = await p.getByText(/tell us about your pool/i).isVisible().catch(()=>false);
// close (Escape)
await p.keyboard.press('Escape');
await p.waitForTimeout(500);
// scroll down
await p.evaluate(()=>window.scrollTo(0, document.body.scrollHeight*0.5));
await p.waitForTimeout(800);
// check below-fold visibility + computed opacity
const r = await p.evaluate(()=>{
  const els=[...document.querySelectorAll('.belleair-page *')].filter(e=>/the same technician|Built for salt air|Equipment protected/i.test(e.textContent||'')&&e.children.length<5);
  const hidden = els.filter(e=>{const s=getComputedStyle(e); return parseFloat(s.opacity)<0.5;});
  return { totalMatch: els.length, hiddenCount: hidden.length, sampleOpacity: els[0]?getComputedStyle(els[0]).opacity:'n/a' };
});
console.log(`visible before popup: ${visBefore}`);
console.log(`sheet opened: ${sheetOpen}`);
console.log(`after close+scroll -> matched els: ${r.totalMatch}, still-hidden(<0.5 opacity): ${r.hiddenCount}, sample opacity: ${r.sampleOpacity}`);
console.log(r.hiddenCount===0 ? 'PASS: below-fold stays visible after popup cycle' : 'FAIL: content hidden after popup');
await b.close();
