import { webkit } from 'playwright';
const PORT = process.argv[2];
const url = `http://localhost:${PORT}/belleair-beach-fl/`;
const b = await webkit.launch();
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:3, isMobile:true, hasTouch:true });
const p = await ctx.newPage();
await p.goto(url,{waitUntil:'load',timeout:60000});
await p.waitForTimeout(800);
const sampleSel = () => p.getByText(/the same technician/i).first();
const opacityOf = async () => p.evaluate(()=>{
  const el=[...document.querySelectorAll('.belleair-page *')].find(e=>/the same technician/i.test(e.textContent||'')&&e.children.length<5);
  return el?{op:getComputedStyle(el).opacity, inlineStyle: el.getAttribute('style')||'(none)'}:{op:'n/a',inlineStyle:'n/a'};
});
console.log('before nav: ', await opacityOf());
// open hamburger (Toggle menu)
await p.locator('button[aria-label="Toggle menu"]').click();
await p.waitForTimeout(500);
const drawerOpen = await p.getByText(/^Menu$/).isVisible().catch(()=>false);
console.log('drawer opened:', drawerOpen);
// close via X (Close menu)
await p.locator('button[aria-label="Close menu"]').click();
await p.waitForTimeout(500);
// scroll down
await p.evaluate(()=>window.scrollTo(0, document.body.scrollHeight*0.5));
await p.waitForTimeout(900);
console.log('after close+scroll:', await opacityOf());
const r = await p.evaluate(()=>{
  const els=[...document.querySelectorAll('.belleair-page *')].filter(e=>/the same technician|Built for salt air|Equipment protected/i.test(e.textContent||'')&&e.children.length<5);
  const hidden = els.filter(e=>parseFloat(getComputedStyle(e).opacity)<0.5);
  return {total:els.length, hidden:hidden.length};
});
console.log(r.hidden===0?'PASS: stays visible after nav cycle':`FAIL: ${r.hidden}/${r.total} hidden`);
await b.close();
