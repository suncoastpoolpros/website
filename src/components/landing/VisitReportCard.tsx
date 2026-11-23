import React, { memo, useEffect, useRef } from 'react';
import { Check, Mail } from 'lucide-react';
// The visit animation: two finished vanilla-JS files (src/visit-report/), run
// as-is. Bundled as text and run as inline scripts on each mount, so they run
// again if the visitor leaves /landing and comes back (an ES-module import
// would only ever run once per page session).
import islandScript from '@/visit-report/visit-report-island.js?raw';
import extrasScript from '@/visit-report/visit-report-extras.js?raw';

/*
 * The hero's service report card: a SUMMARY of the real email report
 * customers get after every visit (src/components/ServiceReport.tsx is the
 * full one): the key readings, the water balance and one chemical added.
 * The photo behind it is the hero, and a full report covered it. Readings
 * are the same sample values as that full report.
 *
 * The markup's resting state IS the finished card. visit-report-island.js
 * animates it (a Dynamic-Island capsule that springs open into the card) and
 * visit-report-extras.js adds the typed-address replay and the photo chip.
 * Both query this markup, so keep its rs-* classes, the .rs-body structure
 * (header first, then the readings block) and the readings'
 * data-value/data-decimals as they are.
 *
 * The scripts add elements inside the card and rewrite the readings' text,
 * so React must never re-render it after mount: it has no state or props,
 * and it's memoized against a parent re-render.
 *
 * "Serviced by Alex" mirrors the real report, which names whoever did that
 * visit. It's one visit's record, not a promise of a permanent tech: techs
 * alternate, so don't build copy around a named person.
 */

const READINGS = [
  { label: 'Chlorine', value: 3.5, decimals: 1 },
  { label: 'pH', value: 7.4, decimals: 1 },
  { label: 'Alkalinity', value: 98, decimals: 0 },
  { label: 'Salt', value: 2950, decimals: 0 },
];

const format = (n: number, decimals: number) =>
  decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString('en-US');

const runScript = (source: string) => {
  const el = document.createElement('script');
  el.textContent = source;
  document.body.appendChild(el); // an inline script runs as soon as it's inserted
  el.remove();
};

export const VisitReportCard = memo(() => {
  const holdRef = useRef<HTMLDivElement>(null);
  // StrictMode runs mount effects twice in development; the extras script has
  // no run-once guard of its own, so this one keeps it to a single run.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // The card is held hidden until the animation's first frame, so the
    // finished card never flashes before collapsing into the capsule.
    // `rs3:play` fires right before the first frame is set up, in the same
    // task, so nothing paints in between. .rs-hold (in the prerendered HTML)
    // gives up after a few seconds in case the scripts never run; once they
    // have, .rs-wait holds with no time limit, because on phones the card
    // starts below the fold and only plays when it's scrolled into view.
    const hold = holdRef.current;
    const release = () => hold?.classList.remove('rs-hold', 'rs-wait');
    hold?.querySelector('.report-enter')?.addEventListener('rs3:play', release, { once: true });
    runScript(islandScript); // island first: extras needs the .rs-v3 it adds
    runScript(extrasScript);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) release();
    else hold?.classList.replace('rs-hold', 'rs-wait');
  }, []);

  return (
    <div ref={holdRef} className="rs-hold">
      <div className="report-enter">
        {/* Frosted glass over the photo. Under 768px the global blur ban
            (CLAUDE.md #10) removes the blur, so phones get a near-solid white
            instead of 78%. */}
        <div className="report-seq overflow-hidden rounded-[14px] bg-white/90 shadow-[0_0_0_1px_rgba(16,24,40,0.05),0_2px_4px_rgba(16,24,40,0.05),0_12px_24px_-6px_rgba(16,24,40,0.14),0_32px_60px_-16px_rgba(16,24,40,0.30)] backdrop-blur-[22px] backdrop-saturate-[1.6] md:bg-white/[0.78]">
          <div className="rs-body px-4 pb-[13px] pt-[15px]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img src="/circle-icon.svg" alt="" width={30} height={30} className="h-[30px] w-[30px]" />
                <div>
                  <p className="grid text-[14px] font-semibold leading-tight tracking-[-0.01em]">
                    <span aria-hidden="true" className="rs-progress col-start-1 row-start-1 text-sc-navy/60">
                      Visit in progress…
                    </span>
                    <span className="rs-complete col-start-1 row-start-1 text-[#1c2f47]">Visit complete</span>
                  </p>
                  <p className="mt-px text-[11.5px] leading-tight text-[rgba(36,58,85,0.55)]">Thu, 9:42 AM · Serviced by Alex</p>
                </div>
              </div>
              <span className="rs-badge grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                <Check className="h-3 w-3" strokeWidth={3.25} />
              </span>
            </div>

            {/* One block for the animation (visit-report-island.js fades in
                the header's second sibling): readings, status, what was added. */}
            <div>
              <div className="mt-[13px] grid grid-cols-4 border-t border-[rgba(36,58,85,0.09)]">
                {READINGS.map((r) => (
                  <div key={r.label} className="min-w-0 py-[11px]">
                    <p className="truncate text-[10.5px] font-medium leading-tight text-[rgba(36,58,85,0.52)]">{r.label}</p>
                    <p className="mt-[3px] grid text-[17px] font-semibold leading-[1.1] tracking-[-0.02em] tabular-nums text-[#1c2f47]">
                      <span aria-hidden="true" className="rs-dash col-start-1 row-start-1">
                        –
                      </span>
                      <span data-value={r.value} data-decimals={r.decimals} className="rs-value col-start-1 row-start-1">
                        {format(r.value, r.decimals)}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
              <p className="rs-lsi border-t border-[rgba(36,58,85,0.09)] pt-2.5 text-[11.5px] leading-tight text-[rgba(36,58,85,0.6)]">
                <span className="font-semibold text-emerald-500">Water balanced</span>
                <span className="tabular-nums"> · LSI −0.03</span>
              </p>
              <div className="rs-added mt-[7px] flex items-center justify-between gap-2 text-[11.5px] leading-tight">
                <p className="min-w-0 truncate font-medium">
                  <span className="text-[rgba(36,58,85,0.52)]">Added</span>{' '}
                  <span className="text-[#1c2f47]">½ scoop sodium bicarbonate</span>
                </p>
                <span className="shrink-0 rounded-full bg-[rgba(42,120,184,0.1)] px-[7px] py-px text-[10.5px] font-semibold text-[#2a78b8]">
                  Included
                </span>
              </div>
            </div>
          </div>

          <p className="rs-footer flex items-center gap-2 whitespace-nowrap border-t border-[rgba(36,58,85,0.09)] bg-white/35 px-4 py-[9px] text-[11.5px] text-[rgba(36,58,85,0.6)]">
            <Mail className="h-3.5 w-3.5 shrink-0 text-sc-blue" strokeWidth={2.25} />
            Sent to you before we leave your driveway
          </p>
        </div>
      </div>
    </div>
  );
});
VisitReportCard.displayName = 'VisitReportCard';
