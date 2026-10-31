import React, { memo, useEffect, useRef } from 'react';
import { Camera, Check, FlaskConical, ListChecks, Mail, MapPin } from 'lucide-react';
// The visit animation: two finished vanilla-JS files (src/visit-report/), run
// as-is. Bundled as text and run as inline scripts on each mount, so they run
// again if the visitor leaves /landing and comes back (an ES-module import
// would only ever run once per page session).
import islandScript from '@/visit-report/visit-report-island.js?raw';
import extrasScript from '@/visit-report/visit-report-extras.js?raw';

/*
 * The hero's service report card: a SUMMARY of the real email report
 * customers get after every visit (src/components/ServiceReport.tsx is the
 * full one). It shows the key readings and then names what else is inside
 * (tasks, chemicals, photos, GPS) as tags, rather than listing every line:
 * the photo behind it is the hero, and a full report covered it.
 * Readings are the same sample values as that full report.
 *
 * The markup's resting state IS the finished card. visit-report-island.js
 * animates it (a Dynamic-Island capsule that springs open into the card) and
 * visit-report-extras.js adds the typed-address replay and the photo chip.
 * Both query this markup, so keep its rs-* classes, the .p-4 header
 * structure and the readings' data-value/data-decimals as they are.
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

// What the full report also contains, named rather than listed.
const CONTENTS = [
  { icon: ListChecks, label: '6 tasks done' },
  { icon: FlaskConical, label: 'Chemicals added' },
  { icon: Camera, label: '2 photos' },
  { icon: MapPin, label: 'GPS verified' },
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
        <div
          className="report-seq overflow-hidden rounded-[14px] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_24px_48px_-16px_rgba(36,58,85,0.35)] ring-1 ring-sc-navy/[0.06]"
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
                  <p className="text-[11px] leading-tight text-sc-navy/55">Thu, 9:42 AM · Serviced by Alex</p>
                </div>
              </div>
              <span className="rs-badge grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            </div>

            <div className="mt-3.5 rounded-[10px] bg-sc-sky/[0.08]">
              <div className="grid grid-cols-4 divide-x divide-sc-navy/[0.07] py-2.5">
                {READINGS.map((r) => (
                  <div key={r.label} className="min-w-0 px-2.5">
                    <p className="truncate text-[10px] font-medium leading-tight text-sc-navy/55">{r.label}</p>
                    <p className="mt-0.5 grid text-[14px] font-semibold leading-tight tabular-nums text-sc-navy">
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
              <p className="rs-lsi flex items-center gap-1.5 border-t border-sc-navy/[0.07] px-2.5 py-1.5 text-[10.5px] text-sc-navy/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-700">Water balanced</span>
                <span className="tabular-nums">· LSI −0.03</span>
              </p>
            </div>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {CONTENTS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="rs-chip inline-flex items-center gap-1 rounded-full bg-white px-2 py-[3px] text-[10.5px] font-medium text-sc-navy/75 ring-1 ring-sc-navy/[0.1]"
                >
                  <Icon className="h-3 w-3 text-sc-blue" strokeWidth={2.25} />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <p className="rs-footer flex items-center gap-2 whitespace-nowrap border-t border-sc-navy/[0.08] bg-white px-4 py-2.5 text-[12px] text-sc-navy/70">
            <Mail className="h-3.5 w-3.5 shrink-0 text-sc-blue" strokeWidth={2.25} />
            Sent to you before we leave your driveway
          </p>
        </div>
      </div>
    </div>
  );
});
VisitReportCard.displayName = 'VisitReportCard';
