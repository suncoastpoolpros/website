import { webkit } from 'playwright';
const url = process.argv[2] || 'https://suncoastpoolpros.com/belleair-beach-fl/';
const cases = [
  { name:'PORTRAIT  390x844', vp:{width:390,height:844} },
  { name:'LANDSCAPE 844x390', vp:{width:844,height:390} },
];
const b = await webkit.launch();
for (const c of cases){
  const ctx = await b.newContext({ viewport:c.vp, deviceScaleFactor:3, isMobile:true, hasTouch:true });
  const p = await ctx.newPage();
  await p.goto(url,{waitUntil:'load',timeout:60000});
  await p.waitForTimeout(800);
  const r = await p.evaluate(()=>{
    const vis = el => { if(!el) return false; const s=getComputedStyle(el); return s.display!=='none' && s.visibility!=='hidden' && el.getClientRects().length>0; };
    const hamburger = [...document.querySelectorAll('button[aria-label="Toggle menu"]')][0];
    // desktop inline link cluster
    const inline = [...document.querySelectorAll('a')].find(a=>/How It Works/i.test(a.textContent||''));
    return {
      innerWidth: window.innerWidth,
      hamburgerVisible: vis(hamburger),
      inlineDesktopVisible: vis(inline),
    };
  });
  console.log(`\n=== ${c.name} ===`);
  console.log(`  window.innerWidth: ${r.innerWidth}px`);
  console.log(`  hamburger visible: ${r.hamburgerVisible}`);
  console.log(`  inline desktop menu visible: ${r.inlineDesktopVisible}`);
  await ctx.close();
}
await b.close();
