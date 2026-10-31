// "Live Activity" visit report — Apple Dynamic-Island style (v2).
// Capsule wakes from a dot -> live status and progress ring ->
// ring completes into a checkmark with a little squish -> capsule springs open
// into the report, and the logo glides from the capsule into the card header
// (shared-element / Framer "layoutId" style). Click the card to replay.
(function () {
  // React-safe: the card stays the node your framework rendered (no clone/replace).
  const card = document.querySelector('.report-enter');
  if (!card || card.classList.contains('rs-v3')) return;   // already initialized
  card.classList.add('rs-v3');
  const face = card.querySelector('.report-seq');
  face.classList.remove('is-replay');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('rs3-style')?.remove();
  const css = document.createElement('style');
  css.id = 'rs3-style';
  css.textContent = `
.rs-v3, .rs-v3 * { animation: none !important; }
.rs-v3 .rs-progress, .rs-v3 .rs-dash { display: none; }
/* box-shadow (not filter: drop-shadow) so the rotated card isn't rasterized into a blurry layer */
.rs-v3 .report-seq { position: relative; box-shadow: 0 1px 2px rgba(15,23,42,.10), 0 18px 36px -12px rgba(15,23,42,.35) !important; }
.rs-v3 { rotate: -1.5deg; cursor: pointer; }
.rs3-ink { position: absolute; inset: 0; background: #0b0b0f; z-index: 5; pointer-events: none; }
.rs3-island { position: absolute; z-index: 6; left: 50%; top: 10px; height: 40px; width: max-content; translate: -50% 0;
  display: flex; align-items: center; gap: 10px; padding: 0 7px; color: #fff; white-space: nowrap; pointer-events: none;
  font: 600 12.5px/1 ui-sans-serif, system-ui, -apple-system, "SF Pro Text", sans-serif; letter-spacing: -.01em; }
.rs3-island img { flex: none; width: 26px; height: 26px; border-radius: 50%; }
.rs3-text { display: grid; min-width: 136px; }
.rs3-step { display: block; }
.rs3-sub { display: flex; align-items: center; gap: 5px; font-weight: 500; font-size: 10.5px; color: rgba(255,255,255,.55); margin-top: 3px; font-variant-numeric: tabular-nums; }
.rs3-live { width: 5px; height: 5px; border-radius: 50%; background: #34d399; }
.rs3-ring { flex: none; width: 26px; height: 26px; margin-left: 6px; overflow: visible; }
.rs3-ring circle { fill: none; stroke-width: 3; }
.rs3-ring .bg { stroke: rgba(255,255,255,.14); }
.rs3-ring .fg { stroke: #34d399; stroke-linecap: round; transform: rotate(-90deg); transform-origin: 50% 50%; }
.rs3-ring .ck { fill: none; stroke: #34d399; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
/* Replay button (frosted glass, sits under the card) */
.rs3-replay { position: absolute; right: 0; top: calc(100% + 12px); z-index: 2; display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 13px 0 11px; border-radius: 999px; border: 1px solid rgba(255,255,255,.45); background: rgba(255,255,255,.55);
  backdrop-filter: blur(14px) saturate(1.6); -webkit-backdrop-filter: blur(14px) saturate(1.6); color: #0f2a44;
  font: 600 12px/1 ui-sans-serif, system-ui, -apple-system, sans-serif; box-shadow: 0 6px 18px -6px rgba(15,23,42,.35); cursor: pointer;
  transition: opacity .35s ease, transform .45s cubic-bezier(.34,1.56,.64,1), background .2s; }
.rs3-replay:hover { background: rgba(255,255,255,.75); transform: translateY(-1px); }
.rs3-replay:active { transform: scale(.95); }
.rs3-replay svg { width: 14px; height: 14px; transition: transform .5s cubic-bezier(.34,1.56,.64,1); }
.rs3-replay:hover svg { transform: rotate(-200deg); }
.rs3-replay[data-hidden] { opacity: 0; transform: translateY(-6px) scale(.9); pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .rs3-ink, .rs3-island, .rs3-replay { display: none; } }`;
  document.head.appendChild(css);

  const ink = Object.assign(document.createElement('div'), { className: 'rs3-ink' });
  const island = document.createElement('div');
  island.className = 'rs3-island';
  island.innerHTML = `
    <img src="/circle-icon.svg" alt="">
    <div class="rs3-text"><span class="rs3-step">Arriving</span>
      <span class="rs3-sub"><i class="rs3-live"></i>Alex · at your pool</span></div>
    <svg class="rs3-ring" viewBox="0 0 26 26">
      <circle class="bg" cx="13" cy="13" r="10"/>
      <circle class="fg" cx="13" cy="13" r="10" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
      <path class="ck" d="M8.6 13.4l3 3 5.8-6.4" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
    </svg>`;
  face.append(ink, island);
  const $ = (s, r = island) => r.querySelector(s);
  const step = $('.rs3-step'), live = $('.rs3-live'), text = $('.rs3-text');
  const ring = $('.rs3-ring'), ringFg = $('.fg'), check = $('.ck'), islandImg = $('img');

  // Real spring -> CSS linear() easing (Framer-style physics)
  function spring({ stiffness = 170, damping = 19, mass = 1 } = {}) {
    let x = 0, v = 0, t = 0; const dt = 1 / 120, pts = [];
    while (t < 3) {
      v += ((-stiffness * (x - 1) - damping * v) / mass) * dt; x += v * dt; t += dt; pts.push(x);
      if (t > 0.3 && Math.abs(x - 1) < 0.0008 && Math.abs(v) < 0.01) break;
    }
    const out = []; for (let i = 0; i <= 48; i++) out.push(pts[Math.round((i / 48) * (pts.length - 1))].toFixed(4));
    return { easing: `linear(${out.join(',')})`, duration: Math.round(t * 1000) };
  }
  const SOFT = spring({ stiffness: 140, damping: 17 });
  const SNAP = spring({ stiffness: 260, damping: 22 });
  const BOUNCY = spring({ stiffness: 320, damping: 14 });
  const OUT = 'cubic-bezier(.16,1,.3,1)';

  const values = [...card.querySelectorAll('.rs-value')];
  const fmt = (n, d) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const body = face.querySelector('.p-4');
  const header = body.children[0], readings = body.children[1];
  const headerImg = header.querySelector('img'), headerText = headerImg.nextElementSibling;
  const badge = card.querySelector('.rs-badge'), lsi = card.querySelector('.rs-lsi');
  const chips = [...card.querySelectorAll('.rs-chip')], footer = card.querySelector('.rs-footer');

  // Pace: PACE stretches the timeline (holds between beats), MOTION slows each individual move.
  const PACE = 1.6, MOTION = 1.3;
  let anims = [], timers = [], rafs = [];
  const A = (el, kf, opt) => {
    const o = { fill: 'both', ...opt };
    if (o.delay) o.delay *= PACE;
    if (o.duration > 1) o.duration *= MOTION;
    const a = el.animate(kf, o); anims.push(a); return a;
  };
  const later = (ms, fn) => timers.push(setTimeout(fn, ms * PACE));
  const blurIn = [{ opacity: 0, filter: 'blur(8px)', transform: 'translateY(8px)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }];
  const easeQuart = (p) => 1 - Math.pow(1 - p, 4);
  const tween = (ms, dur, fn, ease = easeQuart) => later(ms, () => {
    const t0 = performance.now();
    const tick = (now) => { const p = Math.min(1, (now - t0) / (dur * MOTION)); fn(ease(p)); if (p < 1) rafs.push(requestAnimationFrame(tick)); };
    rafs.push(requestAnimationFrame(tick));
  });

  function swapText(txt, at, color) {
    later(at, () => {
      A(step, [{ opacity: 1, filter: 'blur(0)', transform: 'none' }, { opacity: 0, filter: 'blur(4px)', transform: 'translateY(-6px)' }], { duration: 160, easing: 'ease-in' })
        .finished.then(() => {
          step.textContent = txt; step.style.color = color || '';
          A(step, [{ opacity: 0, filter: 'blur(4px)', transform: 'translateY(6px)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], { duration: 320, easing: OUT });
        }).catch(() => {});
    });
  }

  function play() {
    anims.forEach((a) => a.cancel()); timers.forEach(clearTimeout); rafs.forEach(cancelAnimationFrame);
    anims = []; timers = []; rafs = [];
    step.textContent = 'Arriving'; step.style.color = '';
    values.forEach((el) => (el.textContent = fmt(+el.dataset.value, +el.dataset.decimals || 0)));
    if (reduce) return;

    // measure everything before any animation is applied
    const W = face.offsetWidth, H = face.offsetHeight;
    const pw = Math.min(island.offsetWidth + 10, W - 24), side = (W - pw) / 2;
    const ir = islandImg.getBoundingClientRect(), hr = headerImg.getBoundingClientRect();
    const dx = ir.left - hr.left, dy = ir.top - hr.top, sc = ir.width / hr.width;
    const pill = `inset(10px ${side}px ${H - 50}px ${side}px round 20px)`;
    const dot = `inset(10px ${W / 2 - 20}px ${H - 50}px ${W / 2 - 20}px round 20px)`;
    const full = `inset(0px 0px 0px 0px round 14px)`;
    const RING0 = 600, RING_MS = 1900, DONE = RING0 + RING_MS, OPEN = DONE + 650;

    // 1 — wake: dot -> capsule
    A(face, [{ clipPath: dot, opacity: 0 }, { clipPath: dot, opacity: 1, offset: .15 }, { clipPath: pill, opacity: 1 }], { duration: 700, easing: SNAP.easing });
    A(island, [{ opacity: 0, filter: 'blur(6px)', scale: .9 }, { opacity: 1, filter: 'blur(0)', scale: 1 }], { duration: 450, delay: 220, easing: OUT });
    A(live, [{ opacity: 1, scale: 1 }, { opacity: .3, scale: .7 }, { opacity: 1, scale: 1 }], { duration: 1000, iterations: 3, delay: 400, easing: 'ease-in-out' });

    // 2 — live visit: ring fills, status cycles
    A(ringFg, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: RING_MS * PACE / MOTION, delay: RING0, easing: 'cubic-bezier(.5,0,.3,1)' });
    swapText('Testing water', RING0 + 150);
    swapText('Balancing chemicals', RING0 + 800);
    swapText('Brushing & skimming', RING0 + 1450);

    // 3 — done: checkmark draws, capsule does a tiny haptic squish
    A(check, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 320, delay: DONE + 40, easing: OUT });
    A(ring, [{ scale: 1 }, { scale: 1.2 }, { scale: 1 }], { duration: 420, delay: DONE, easing: 'ease-out' });
    A(face, [{ scale: 1 }, { scale: 1.04, offset: .3 }, { scale: 1 }], { duration: 460, delay: DONE, easing: 'ease-out', fill: 'none' });
    swapText('Visit complete', DONE + 20, '#6ee7b7');

    // 4 — open: capsule springs into the card, ink fades black -> white
    A(face, [{ clipPath: pill }, { clipPath: full }], { duration: SOFT.duration, delay: OPEN, easing: SOFT.easing, fill: 'forwards' })
      .finished.then(() => anims.filter((a) => a.effect?.target === face).forEach((a) => a.cancel())).catch(() => {});
    A(text, [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(6px)' }], { duration: 200, delay: OPEN, easing: 'ease-in' });
    A(ring, [{ opacity: 1 }, { opacity: 0, scale: .6 }], { duration: 220, delay: OPEN, easing: 'ease-in' });
    A(ink, [{ opacity: 1 }, { opacity: 0 }], { duration: 520, delay: OPEN + 60, easing: 'cubic-bezier(.4,0,.2,1)' });

    // 4b — shared element: the logo glides from the capsule into the header
    A(headerImg, [{ transform: `translate(${dx}px, ${dy}px) scale(${sc})`, transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }],
      { duration: SOFT.duration, delay: OPEN, easing: SOFT.easing });
    A(islandImg, [{ opacity: 1 }, { opacity: 0 }], { duration: 1, delay: OPEN });
    // capsule stays perfectly level; the card eases into its -1.5deg tilt as part of the open (no bounce)
    A(card, [{ rotate: '0deg' }, { rotate: '-1.5deg' }], { duration: 900, delay: OPEN, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });

    // 5 — report content settles in
    const c0 = OPEN + 200;
    A(headerText, blurIn, { duration: 600, delay: c0, easing: OUT });
    A(readings, blurIn, { duration: 600, delay: c0 + 80, easing: OUT });
    values.forEach((el, i) => {
      const target = +el.dataset.value, dec = +el.dataset.decimals || 0;
      el.textContent = fmt(0, dec);
      tween(c0 + 120 + i * 90, 750, (p) => (el.textContent = fmt(target * p, dec)));
    });
    chips.forEach((ch, i) => A(ch, [{ opacity: 0, transform: 'translateY(8px) scale(.85)' }, { opacity: 1, transform: 'none' }],
      { duration: SNAP.duration, delay: c0 + 300 + i * 70, easing: SNAP.easing }));
    A(lsi, blurIn, { duration: 500, delay: c0 + 520, easing: OUT });
    A(footer, blurIn, { duration: 600, delay: c0 + 620, easing: OUT });
    A(badge, [{ transform: 'scale(0) rotate(-30deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: BOUNCY.duration, delay: c0 + 650, easing: BOUNCY.easing });

    // Crisp text: once everything has landed, drop the held animation states.
    // Lingering filter/transform fills keep elements on GPU layers, which blurs text on the tilted card.
    const mine = anims.slice();
    Promise.all(mine.map((a) => a.finished)).then(() => {
      mine.filter((a) => a.effect && !island.contains(a.effect.target) && a.effect.target !== ink).forEach((a) => a.cancel());
    }).catch(() => {});
  }

  // Replay button: hidden while the animation runs, fades back in when it finishes
  card.parentElement.querySelector('.rs3-replay')?.remove();
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'rs3-replay'; btn.setAttribute('aria-label', 'Replay animation');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>Replay';
  card.parentElement.appendChild(btn);
  let btnTimer;
  const run = () => { card.dispatchEvent(new CustomEvent('rs3:play')); btn.setAttribute('data-hidden', ''); clearTimeout(btnTimer); btnTimer = setTimeout(() => btn.removeAttribute('data-hidden'), 4900 * PACE); play(); };
  btn.addEventListener('click', run);
  card.addEventListener('click', run);
  window.__rs3Play = run;
  let seen = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !seen) { seen = true; run(); }
    if (!e.isIntersecting) seen = false;
  }, { threshold: 0.5 }).observe(card);
})();
