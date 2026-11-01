import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { cities } from '@/lib/cities';
import { pagedServices } from '@/lib/services';

/*
 * The homepage header's two dropdowns (LandingHeader, lg+). Each hangs flush
 * from the header's bottom edge: a white card squared off on top, a navy
 * footer strip, and a shadow clipped at the top so it never smudges the
 * header (.nav-panel in index.css). Always mounted, so the open/close is a
 * CSS fade and the links are in the prerendered HTML; `inert` while closed.
 */

// Cities by region, in the order they read on the map. Names and pages come
// from lib/cities, so a city that gets a page links here on its own.
const AREA_GROUPS: [string, string[]][] = [
  ['St. Pete', ['st-petersburg', 'snell-isle', 'gulfport']],
  ['Gulf Beaches', ['st-pete-beach', 'treasure-island', 'belleair-beach']],
  ['North Pinellas', ['seminole', 'largo', 'clearwater', 'safety-harbor', 'dunedin', 'palm-harbor']],
  ['Tampa', ['davis-island', 'south-tampa']],
];

const itemClass =
  'group/item flex items-center justify-between gap-2 whitespace-nowrap rounded-lg text-[14px] font-medium leading-[1.3] text-[#1e3a5f] transition-colors duration-[120ms]';
const linkItemClass = `${itemClass} hover:bg-[#f3f8fc] hover:text-[#1d6fb8]`;
const footLinkClass = 'font-semibold text-white transition-opacity duration-[120ms] hover:opacity-80';

const Arrow = () => (
  <ChevronRight
    strokeWidth={2.5}
    className="h-[13px] w-[13px] shrink-0 -translate-x-[3px] text-[#1d6fb8] opacity-0 transition-all duration-[120ms] group-hover/item:translate-x-0 group-hover/item:opacity-100"
  />
);

const Panel = ({ open, className, children }: { open: boolean; className: string; children: ReactNode }) => (
  <div inert={!open} className={`nav-panel absolute left-0 top-full z-50 ${open ? 'is-open' : ''}`}>
    <div className={`nav-panel-card ${className}`}>{children}</div>
  </div>
);

export const AreasPanel = ({ open, onQuote }: { open: boolean; onQuote: () => void }) => (
  <Panel open={open} className="w-[640px]">
    <div className="grid grid-cols-4 gap-1.5 border-x border-[#e5e7eb] p-3.5">
      {AREA_GROUPS.map(([region, slugs]) => (
        <div key={region}>
          <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#94a3b8]">{region}</p>
          {slugs.map((slug) => {
            const city = cities.find((c) => c.slug === slug);
            if (!city) return null;
            return city.to ? (
              <Link key={slug} to={city.to} className={`${linkItemClass} px-2.5 py-[7px]`}>
                {city.name}
                <Arrow />
              </Link>
            ) : (
              <div key={slug} className={`${itemClass} cursor-default px-2.5 py-[7px]`}>
                {city.name}
              </div>
            );
          })}
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between gap-3 bg-[#1e3a5f] px-6 py-[11px] text-[13px] text-white/70">
      <span>Serving all of Pinellas County &amp; West Tampa</span>
      <button type="button" onClick={onQuote} className={footLinkClass}>
        Get a free quote →
      </button>
    </div>
  </Panel>
);

export const ServicesPanel = ({ open }: { open: boolean }) => (
  <Panel open={open} className="w-[280px]">
    <div className="border-x border-[#e5e7eb] p-2">
      {pagedServices.map((s) => (
        <Link key={s.slug} to={s.to as string} className={`${linkItemClass} px-3 py-2`}>
          {s.title}
          <Arrow />
        </Link>
      ))}
    </div>
    <div className="flex items-center justify-between gap-3 bg-[#1e3a5f] px-[18px] py-[11px] text-[13px]">
      <Link to="/services/" className={footLinkClass}>
        All services →
      </Link>
      <Link to="/how-it-works/" className={footLinkClass}>
        How it works
      </Link>
    </div>
  </Panel>
);
