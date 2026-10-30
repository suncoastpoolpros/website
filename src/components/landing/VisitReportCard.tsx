import React, { useEffect, useRef } from 'react';
import { Check, Mail } from 'lucide-react';

/*
 * The hero's "Visit complete" card, which plays a visit through once on load:
 * tasks tick off, readings count up, then the visit completes.
 *
 * The sequence is pure CSS (`.report-seq` in index.css), so it runs straight
 * from the prerendered HTML with no hydration wait, and the markup's resting
 * state IS the finished card: reduced-motion (animations off) or a failed
 * script just shows the final report. JS adds only two extras: the count-up,
 * which starts on the readings' own `animationstart` so it stays in step with
 * the CSS, and the hover replay.
 */

const READINGS = [
  { label: 'Chlorine', value: 3.0, decimals: 1 },
  { label: 'pH', value: 7.5, decimals: 1 },
  { label: 'Alkalinity', value: 90, decimals: 0 },
];

const TASKS = ['Skimmed', 'Brushed', 'Vacuumed'];

const COUNT_MS = 700;
// Count up from 85% of the final value, never from 0: a pH that reads 1.3 for
// a moment looks alarming, not impressive.
const COUNT_FROM = 0.85;
const REPLAY_EVERY_MS = 6000;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const VisitReportCard = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const lastPlay = useRef(0);
  const frames = useRef(new Set<number>());

  useEffect(() => {
    lastPlay.current = performance.now();
    const pending = frames.current;
    return () => pending.forEach(cancelAnimationFrame);
  }, []);

  const countUp = (el: HTMLElement) => {
    const to = Number(el.dataset.value);
    const decimals = Number(el.dataset.decimals);
    const from = to * COUNT_FROM;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS);
      el.textContent = (from + (to - from) * easeOut(t)).toFixed(decimals);
      if (t < 1) frames.current.add(requestAnimationFrame(tick));
    };
    el.textContent = from.toFixed(decimals);
    frames.current.add(requestAnimationFrame(tick));
  };

  const handleAnimationStart = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'rs-value-in') countUp(e.target as HTMLElement);
  };

  // Restart the CSS sequence: drop the class, force a reflow, add it back.
  // `is-replay` zeroes the load-time offset that waits out the entrance.
  const replay = () => {
    const card = cardRef.current;
    const now = performance.now();
    if (!card || reducedMotion() || now - lastPlay.current < REPLAY_EVERY_MS) return;
    lastPlay.current = now;
    card.classList.remove('report-seq');
    void card.offsetWidth;
    card.classList.add('report-seq', 'is-replay');
  };

  return (
    <div className="report-enter">
      <div
        ref={cardRef}
        onAnimationStart={handleAnimationStart}
        onMouseEnter={replay}
        className="report-seq overflow-hidden rounded-[14px] bg-white/[0.94] shadow-[0_1px_2px_rgba(16,24,40,0.06),0_24px_48px_-16px_rgba(36,58,85,0.35)] ring-1 ring-sc-navy/[0.06] backdrop-blur-[10px]"
      >
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img src="/circle-icon.svg" alt="" width={28} height={28} className="h-7 w-7" />
              <div>
                <p className="grid text-[13px] font-semibold leading-tight">
                  <span aria-hidden="true" className="rs-progress col-start-1 row-start-1 text-sc-navy/60">
                    Visit in progress…
                  </span>
                  <span className="rs-complete col-start-1 row-start-1 text-sc-navy">Visit complete</span>
                </p>
                <p className="text-[11px] leading-tight text-sc-navy/55">Thursday, 9:42 AM</p>
              </div>
            </div>
            <span className="rs-badge grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-sc-navy/[0.08] rounded-[10px] bg-sc-sky/[0.08] py-2.5">
            {READINGS.map((r) => (
              <div key={r.label} className="rs-reading px-3">
                <p className="text-[10.5px] font-medium text-sc-navy/55">{r.label}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[15px] font-semibold tabular-nums text-sc-navy">
                  <span className="grid">
                    <span aria-hidden="true" className="rs-dash col-start-1 row-start-1">
                      –
                    </span>
                    <span
                      data-value={r.value}
                      data-decimals={r.decimals}
                      className="rs-value col-start-1 row-start-1"
                    >
                      {r.value.toFixed(r.decimals)}
                    </span>
                  </span>
                  <span className="rs-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </p>
              </div>
            ))}
          </div>

          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] font-medium text-sc-navy/70">
            {TASKS.map((t) => (
              <span key={t} className="rs-task inline-flex items-center gap-1">
                <Check className="rs-task-check h-3 w-3 text-sc-blue" strokeWidth={3} />
                {t}
              </span>
            ))}
          </p>
        </div>

        <p className="rs-footer flex items-center gap-2 whitespace-nowrap border-t border-sc-navy/[0.08] bg-[#f7fafd] px-4 py-2.5 text-[12.5px] text-sc-navy/70">
          <Mail className="h-3.5 w-3.5 shrink-0 text-sc-blue" strokeWidth={2.25} />
          Emailed to you after every visit
        </p>
      </div>
    </div>
  );
};
