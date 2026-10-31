// Visit report extras — load AFTER visit-report-island.js
//  1. Personalized report: typing an address in the hero field replays the
//     animation with the visitor's street on the card and in the capsule.
//  2. "2 photos" chip: two thumbnails pop up from the chip, hold, then tuck
//     back into it as a tiny photo stack. Hovering the chip shows them again.
(function () {
  const card = document.querySelector('.report-enter.rs-v3');
  if (!card) return;
  const PHOTO = '/pool-waterfront-1120.webp';   // swap for real visit photos when you have them
  const PACE = 1.6;                               // keep in sync with visit-report-island.js
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPRING = 'linear(0,0.0927,0.3006,0.5394,0.7468,0.8954,0.9851,1.0278,1.0396,1.0352,1.0249,1.0141,1.0057,1.0003,0.9977,0.9969,0.9972,0.998,0.9987,0.9993,0.9997,1)';

  document.getElementById('rs4-style')?.remove();
  const css = document.createElement('style');
  css.id = 'rs4-style';
  css.textContent = `
.rs4-chip { position: relative; cursor: default; }
.rs4-stack { display: none; align-items: center; margin-right: 1px; }
.rs4-chip.has-stack .rs4-stack { display: inline-flex; }
.rs4-chip.has-stack > svg { display: none; }
.rs4-stack i { width: 14px; height: 14px; border-radius: 4px; border: 1.5px solid #fff; box-shadow: 0 0 0 .5px rgba(15,42,68,.18);
  background: url(${PHOTO}) center / cover; }
.rs4-stack i + i { margin-left: -6px; }
.rs4-tray { position: absolute; left: -4px; bottom: calc(100% + 8px); display: flex; gap: 6px; z-index: 7; pointer-events: none; }
.rs4-thumb { width: 66px; height: 66px; border-radius: 11px; border: 2px solid #fff; opacity: 0;
  box-shadow: 0 10px 24px -8px rgba(15,23,42,.45), 0 1px 3px rgba(15,23,42,.2); background: url(${PHOTO}) no-repeat; }
.rs4-thumb.a { background-size: 330%; background-position: 18% 92%; }                 /* close-up of the water */
.rs4-thumb.b { background-size: 260%; background-position: 78% 74%; transform: scaleX(-1); } /* deck + loungers, mirrored */
.rs4-chip:hover .rs4-thumb { opacity: 1 !important; scale: 1 !important; translate: 0 0 !important; transition: opacity .2s, scale .35s cubic-bezier(.34,1.56,.64,1); }
.rs4-addr { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 190px; }`;
  document.head.appendChild(css);

  // ---------- 2. photo chip ----------
  const chip = [...card.querySelectorAll('.rs-chip')].find((c) => /photo/i.test(c.textContent));
  let tray, thumbs = [], stack;
  if (chip && !chip.querySelector('.rs4-tray')) {
    chip.classList.add('rs4-chip');
    stack = document.createElement('span'); stack.className = 'rs4-stack'; stack.innerHTML = '<i></i><i style="background-position:80% 75%"></i>';
    chip.prepend(stack);
    tray = document.createElement('span'); tray.className = 'rs4-tray';
    tray.innerHTML = '<span class="rs4-thumb a"></span><span class="rs4-thumb b"></span>';
    chip.appendChild(tray);
    thumbs = [...tray.children];
  }
  let anims = [], timers = [];
  function photoBeat() {
    if (!chip) return;
    anims.forEach((a) => a.cancel()); timers.forEach(clearTimeout); anims = []; timers = [];
    chip.classList.remove('has-stack');
    if (reduce) { chip.classList.add('has-stack'); return; }
    const SHOW = 3950 * PACE, HOLD = 1700;   // just after the chip itself pops in
    thumbs.forEach((t, i) => {
      const rot = i ? '5deg' : '-6deg';
      anims.push(t.animate([
        { opacity: 0, scale: .3, translate: `${i ? -18 : 18}px 26px`, rotate: '0deg' },
        { opacity: 1, scale: 1, translate: '0 0', rotate: rot }
      ], { duration: 650, delay: SHOW + i * 90, easing: SPRING, fill: 'both' }));
      anims.push(t.animate([
        { opacity: 1, scale: 1, translate: '0 0', rotate: rot },
        { opacity: 0, scale: .2, translate: `${i ? -26 : -40}px 44px`, rotate: '0deg' }
      ], { duration: 420, delay: SHOW + HOLD + i * 60, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
    });
    timers.push(setTimeout(() => {
      chip.classList.add('has-stack');
      anims.push(stack.animate([{ scale: 0, opacity: 0 }, { scale: 1, opacity: 1 }], { duration: 500, easing: SPRING }));
      anims.push(chip.animate([{ scale: 1 }, { scale: 1.08 }, { scale: 1 }], { duration: 380, easing: 'ease-out' }));
    }, SHOW + HOLD + 330));
  }

  // ---------- 1. personalized address ----------
  const timeLine = card.querySelector('.report-seq .p-4 img + div p:last-child');
  const sub = card.querySelector('.rs3-sub');
  const defaults = { time: timeLine?.textContent, sub: sub?.lastChild?.textContent };
  function setAddress(street) {
    if (timeLine) {
      if (street) { timeLine.innerHTML = ''; const s = document.createElement('span'); s.className = 'rs4-addr'; s.textContent = street; timeLine.append(s); timeLine.style.display = 'flex'; timeLine.append(' · Thu, 9:42 AM'); }
      else { timeLine.textContent = defaults.time; timeLine.style.display = ''; }
    }
    if (sub?.lastChild) sub.lastChild.textContent = street ? 'Alex · at ' + street : defaults.sub;
  }
  const input = document.querySelector('input[placeholder="Enter your pool\'s address"]') || document.querySelector('input[name="address"]');
  let typingTimer, lastStreet = '';
  const tidy = (v) => v.split(',')[0].replace(/\s+/g, ' ').trim().replace(/\b\w/g, (m) => m.toUpperCase()).slice(0, 40);
  function onAddress() {
    const street = tidy(input.value);
    if (street === lastStreet) return;
    if (street && !(/\d/.test(street) && /[a-z]{3,}/i.test(street))) return; // wait for "number + street name"
    lastStreet = street;
    setAddress(street);
    window.__rs3Play?.();
  }
  if (input) {
    input.addEventListener('input', () => { clearTimeout(typingTimer); typingTimer = setTimeout(onAddress, 1100); });
    input.addEventListener('change', onAddress);
  }

  // run the photo beat every time the main animation plays
  card.addEventListener('rs3:play', photoBeat);
  photoBeat();
})();
