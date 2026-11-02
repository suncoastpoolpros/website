import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { PhoneReport } from '@/components/landing/PhoneReport';
import { QuoteButton } from '@/components/landing/sectionKit';

/*
 * The Clearwater standard: six weekly steps around the sample report email.
 * Desktop: three steps either side of the phone; below 1000px, the phone
 * first, then the six steps in one list. Styles: .cs-* in index.css.
 *
 * The email scrolls itself on a loop (useReportLoop) once the section is well
 * on screen, and only while it is on screen. The visitor can take over: hover
 * and wheel (or touch) to scroll it, or click a step to jump to that part of
 * the report. Every step stays at full color; nothing dims with the scroll.
 */

type Target = { anchor: Element | null; offset: number; pulse: Element | null };
type Step = { title: string; line: string; find: (body: HTMLElement) => Target };

const titled = (body: HTMLElement, title: string) =>
  [...body.querySelectorAll('.sr-section')].find((el) => el.textContent?.trim() === title) ?? null;
// A section heading at the top of the email, pulsing what's under it.
const section = (title: string, pulse: (heading: Element | null, body: HTMLElement) => Element | null) => (body: HTMLElement) => {
  const heading = titled(body, title);
  return { anchor: heading, offset: 0, pulse: pulse(heading, body) };
};
const tableAfter = (heading: Element | null) => heading?.nextElementSibling?.querySelector('.sr-table') ?? null;

const LEFT: Step[] = [
  {
    title: 'Full water test & balance',
    line: 'Chlorine, pH, alkalinity, stabilizer, salt',
    find: section('Water Chemistry', tableAfter),
  },
  {
    title: 'All standard chemicals',
    line: 'Included in your flat rate, no add-ons',
    find: section('Chemicals Added', tableAfter),
  },
  {
    title: 'Skim, brush & vacuum',
    line: 'Walls, floor, waterline and baskets',
    find: section('Tasks Completed', (_, body) => body.querySelector('.sr-tasks')),
  },
];
const RIGHT: Step[] = [
  {
    title: 'Filter & equipment check',
    line: 'Pump, filter, heater and salt cell',
    find: (body) => {
      const row =
        [...body.querySelectorAll('.sr-trow')].find((r) => r.querySelector('.sr-tlabel')?.textContent === 'Filter Pressure') ??
        null;
      return { anchor: row, offset: 140, pulse: row };
    },
  },
  {
    title: 'Photo of your pool',
    line: 'See it clear, even when you’re away',
    find: section('Photos', (_, body) => body.querySelector('.sr-photo')),
  },
  {
    title: 'Always Blue Guarantee',
    line: 'Drifts under our care? We come back free',
    find: (body) => {
      const lsi = body.querySelector('.sr-lsi');
      return { anchor: lsi, offset: 140, pulse: lsi };
    },
  },
];

// The auto-scroll loop: hold at the top, read down, hold at the bottom, glide
// back up.
const HOLD_MS = 2200;
const DOWN_MS = 16000;
const UP_MS = 500;
const LOOP_MS = HOLD_MS + DOWN_MS + HOLD_MS + UP_MS;
const LEAVE_RESUME_MS = 1200;
const TOUCH_RESUME_MS = 3500;
const CLICK_RESUME_MS = 3500;
const JUMP_MS = 700;
const PULSE_AFTER_MS = 650;

const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// How far down the email (0–1) the loop is at time t.
const loopFraction = (time: number) => {
  let t = time % LOOP_MS;
  if (t < HOLD_MS) return 0;
  t -= HOLD_MS;
  if (t < DOWN_MS) return easeInOutQuad(t / DOWN_MS);
  t -= DOWN_MS;
  if (t < HOLD_MS) return 1;
  return 1 - easeInOutQuad((t - HOLD_MS) / UP_MS);
};
// The point in the loop that's heading down through fraction f: the inverse
// of the downward stretch, so a resume carries on from where the email is.
const loopTimeAt = (f: number) => {
  if (f <= 0) return HOLD_MS;
  if (f >= 1) return HOLD_MS + DOWN_MS;
  const u = f < 0.5 ? Math.sqrt(f / 2) : 1 - Math.sqrt((1 - f) / 2);
  return HOLD_MS + u * DOWN_MS;
};

const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Steps fade up once the stage is 35% on screen (desktop and tablets, motion
// allowed). Progressive: the hidden state only applies once this has run
// (data-armed), so without JS everything is simply visible, and a stage
// already on screen is shown at once.
const useStepReveal = (stageRef: React.RefObject<HTMLDivElement | null>) => {
  useBeforePaint(() => {
    const stage = stageRef.current;
    if (!stage || !('IntersectionObserver' in window)) return;
    if (!window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)').matches) return;
    const r = stage.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    // A stage taller than the screen could never be 35% visible.
    const threshold = Math.min(0.35, (window.innerHeight * 0.9) / Math.max(1, r.height));
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        stage.setAttribute('data-in', '');
        io.disconnect();
      },
      { threshold },
    );
    stage.setAttribute('data-armed', '');
    io.observe(stage);
    return () => io.disconnect();
  }, []);
};

type Controls = { jump: (step: Step) => void };

const useReportLoop = (
  sectionRef: React.RefObject<HTMLElement | null>,
  stageRef: React.RefObject<HTMLDivElement | null>,
  phoneWrapRef: React.RefObject<HTMLDivElement | null>,
  bodyRef: React.RefObject<HTMLDivElement | null>,
  controls: React.RefObject<Controls | null>,
) => {
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const wrap = phoneWrapRef.current;
    const body = bodyRef.current;
    if (!section || !stage || !wrap || !body) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Room for the pulse ring, which is positioned in the email's own space.
    body.style.position = 'relative';

    let started = false;
    let onScreen = false;
    let over = false; // mouse over the phone
    let leaveHold = false; // the pause after the mouse leaves
    let touchHold = false;
    let clickHold = false;
    let loopT = 0;
    let last = 0;
    let raf = 0;
    let glideRaf = 0;
    let leaveTimer = 0;
    let touchTimer = 0;
    let clickTimer = 0;
    let pulseTimer = 0;
    let pulseEl: HTMLElement | null = null;

    const maxScroll = () => Math.max(0, body.scrollHeight - body.clientHeight);
    const paused = () => over || leaveHold || touchHold || clickHold;
    const running = () => !reduced && started && onScreen && !paused();

    // Native scrolling inside the phone while the visitor has it. No
    // overscroll-behavior: contain, which would stop a scroll past either end
    // of the email from reaching the page (the wheel handler below already
    // keeps mid-email wheels inside).
    const setLive = () => {
      body.style.overflowY = over || touchHold ? 'auto' : '';
    };

    const tick = (now: number) => {
      raf = 0;
      if (!running()) return;
      // Capped, so a backgrounded tab doesn't leap ahead.
      if (last) loopT += Math.min(100, now - last);
      last = now;
      body.scrollTop = loopFraction(loopT) * maxScroll();
      raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (raf || !running()) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const resume = () => {
      setLive();
      if (paused()) return;
      const max = maxScroll();
      loopT = loopTimeAt(max ? body.scrollTop / max : 0);
      kick();
    };
    const cancelGlide = () => cancelAnimationFrame(glideRaf);

    // Starts once the stage's top reaches 75% of the way down the screen,
    // then loops for good; time only passes while the section is on screen.
    const startIo = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        started = true;
        startIo.disconnect();
        kick();
      },
      { rootMargin: '0px 0px -25% 0px' },
    );
    const screenIo = new IntersectionObserver(([e]) => {
      onScreen = !!e?.isIntersecting;
      if (onScreen) kick();
    });
    startIo.observe(stage);
    screenIo.observe(section);

    // Hover (mouse only: a tap's emulated mouseenter must not count).
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      over = true;
      leaveHold = false;
      clearTimeout(leaveTimer);
      setLive();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !over) return;
      over = false;
      leaveHold = true;
      setLive();
      leaveTimer = window.setTimeout(() => {
        leaveHold = false;
        resume();
      }, LEAVE_RESUME_MS);
    };
    // The wheel scrolls the email, except past either end, where the page
    // scrolls as normal so nobody gets stuck.
    const onWheel = (e: WheelEvent) => {
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? body.clientHeight : 1);
      const top = body.scrollTop;
      if ((dy < 0 && top <= 0) || (dy > 0 && top >= maxScroll() - 1) || dy === 0) return;
      e.preventDefault();
      cancelGlide();
      body.scrollTop = top + dy;
    };
    const onTouchStart = () => {
      touchHold = true;
      clearTimeout(touchTimer);
      cancelGlide();
      setLive();
    };
    const onTouchEnd = () => {
      clearTimeout(touchTimer);
      touchTimer = window.setTimeout(() => {
        touchHold = false;
        resume();
      }, TOUCH_RESUME_MS);
    };
    wrap.addEventListener('pointerenter', onEnter);
    wrap.addEventListener('pointerleave', onLeave);
    wrap.addEventListener('wheel', onWheel, { passive: false });
    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.addEventListener('touchend', onTouchEnd, { passive: true });
    wrap.addEventListener('touchcancel', onTouchEnd, { passive: true });

    // A one-time ring around the part of the report a step points to. It
    // lives in the email's scroll space, so a table's rounded clip can't cut
    // it off.
    const pulse = (el: Element) => {
      pulseEl?.remove();
      const box = body.getBoundingClientRect();
      const scale = box.height / body.offsetHeight || 1;
      const r = el.getBoundingClientRect();
      const ring = document.createElement('span');
      ring.className = 'cs-pulse';
      ring.style.top = `${(r.top - box.top) / scale + body.scrollTop}px`;
      ring.style.left = `${(r.left - box.left) / scale}px`;
      ring.style.width = `${r.width / scale}px`;
      ring.style.height = `${r.height / scale}px`;
      ring.addEventListener('animationend', () => ring.remove());
      body.appendChild(ring);
      pulseEl = ring;
    };

    controls.current = {
      jump: (step) => {
        const { anchor, offset, pulse: pulseTarget } = step.find(body);
        if (!anchor) return;
        clickHold = true;
        clearTimeout(clickTimer);
        clearTimeout(pulseTimer);
        cancelGlide();
        const box = body.getBoundingClientRect();
        const scale = box.height / body.offsetHeight || 1;
        const y = (anchor.getBoundingClientRect().top - box.top) / scale + body.scrollTop;
        const to = Math.max(0, Math.min(maxScroll(), y - offset));
        if (reduced) {
          body.scrollTop = to;
        } else {
          const from = body.scrollTop;
          const t0 = performance.now();
          const glide = (now: number) => {
            const t = Math.min(1, (now - t0) / JUMP_MS);
            body.scrollTop = from + (to - from) * easeOutCubic(t);
            if (t < 1) glideRaf = requestAnimationFrame(glide);
          };
          glideRaf = requestAnimationFrame(glide);
          if (pulseTarget) pulseTimer = window.setTimeout(() => pulse(pulseTarget), PULSE_AFTER_MS);
        }
        clickTimer = window.setTimeout(() => {
          clickHold = false;
          resume();
        }, CLICK_RESUME_MS);
      },
    };

    return () => {
      controls.current = null;
      startIo.disconnect();
      screenIo.disconnect();
      cancelAnimationFrame(raf);
      cancelGlide();
      [leaveTimer, touchTimer, clickTimer, pulseTimer].forEach((t) => clearTimeout(t));
      pulseEl?.remove();
      wrap.removeEventListener('pointerenter', onEnter);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.removeEventListener('wheel', onWheel);
      wrap.removeEventListener('touchstart', onTouchStart);
      wrap.removeEventListener('touchend', onTouchEnd);
      wrap.removeEventListener('touchcancel', onTouchEnd);
      body.style.position = '';
      body.style.overflowY = '';
    };
  }, [sectionRef, stageRef, phoneWrapRef, bodyRef, controls]);
};

const CheckBadge = () => (
  <span aria-hidden="true" className="check-badge mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full">
    <Check className="h-[11px] w-[11px]" strokeWidth={3.25} />
  </span>
);

const StepList = ({ steps, side, onPick }: { steps: Step[]; side: 'l' | 'r'; onPick: (step: Step) => void }) => (
  <ul className={`cs-col cs-col--${side}`}>
    {steps.map((step) => (
      <li key={step.title} className="cs-step">
        <button
          type="button"
          aria-label={`${step.title}: show in the sample report`}
          onClick={() => onPick(step)}
          className="cs-step-btn"
        >
          <CheckBadge />
          <span>
            <span className="cs-step-title">{step.title}</span>
            <span className="cs-step-line">{step.line}</span>
          </span>
        </button>
      </li>
    ))}
  </ul>
);

export const ClearwaterStandard = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const phoneWrapRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const controls = useRef<Controls | null>(null);
  useStepReveal(stageRef);
  useReportLoop(sectionRef, stageRef, phoneWrapRef, bodyRef, controls);
  const pick = (step: Step) => controls.current?.jump(step);

  return (
    <section ref={sectionRef} aria-labelledby="cw-standard-title" className="cs-section">
      <div className="cs-container">
        <div className="mx-auto max-w-[40rem] text-center">
          <p className="cs-eyebrow">The Clearwater standard</p>
          <h2 id="cw-standard-title" className="cs-h2">
            &ldquo;Clear&rdquo; isn&rsquo;t a vibe.
            <br />
            It&rsquo;s a checklist.
          </h2>
          <p className="cs-lead">
            Six steps every week, beach or mainland. Every one of them lands in your inbox before we leave the driveway.
          </p>
        </div>

        <div ref={stageRef} className="cs-stage">
          <div aria-hidden="true" className="cs-glow" />
          <StepList steps={LEFT} side="l" onPick={pick} />
          <div ref={phoneWrapRef} className="cs-phone">
            <PhoneReport
              interactive
              shadow="light"
              glare
              time="10:14"
              address="Sand Key · Clearwater Beach, FL 33767"
              scrollRef={bodyRef}
            />
          </div>
          <StepList steps={RIGHT} side="r" onPick={pick} />
        </div>

        <div className="cs-footer">
          <QuoteButton />
          <p className="cs-footnote">All six steps, one flat rate.</p>
        </div>
      </div>
    </section>
  );
};
