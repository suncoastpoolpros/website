import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { cities } from '@/lib/cities';
// Re-export so existing consumers `from '@/components/ServiceAreasMenu'` keep
// compiling. New code should import from '@/lib/cities' directly.
export { cities, type City } from '@/lib/cities';

/**
 * Tampa Bay service-area mega-menu.
 * Left side: city list with hover highlight.
 * Right side: live Google Maps embed of the Tampa Bay region (free, no API key).
 */

export const ServiceAreasMenu = () => {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const { open: openQuoteSheet } = useQuoteSheet();

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="w-[880px] bg-gradient-to-r from-[#e4e9f0] to-white border border-black/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
      <div className="grid grid-cols-[minmax(290px,1fr)_auto]">
        {/* LEFT: header + city list */}
        <div className="p-7 pr-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-blue font-bold mb-2">
            Our Service Area
          </p>
          <h3 className="font-display font-bold text-[#0a1628] text-2xl leading-tight mb-1">
            All of Pinellas County <br />
            &amp; West Tampa.
          </h3>
          <p className="text-xs text-gray-600 mb-5">11 cities. One flat rate.</p>

          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mb-5">
            {cities.map((city) => {
              const cls = `group flex items-start gap-2 px-2 py-1.5 rounded-md transition-colors ${
                hoveredSlug === city.slug ? 'bg-black/[0.05]' : ''
              }`;
              const handlers = {
                onMouseEnter: () => setHoveredSlug(city.slug),
                onMouseLeave: () => setHoveredSlug(null),
              };
              const inner = (
                <>
                  <MapPin
                    className={`w-3.5 h-3.5 mt-[3px] shrink-0 transition-colors ${
                      hoveredSlug === city.slug ? 'text-brand-orange' : 'text-brand-blue'
                    }`}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold leading-tight transition-colors ${
                        hoveredSlug === city.slug ? 'text-[#0a1628]' : 'text-gray-700'
                      }`}
                    >
                      {city.name}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{city.blurb}</p>
                  </div>
                </>
              );
              // Cities with a dedicated page link to it; the rest render as
              // non-interactive labels for now (no page yet — a dead link or a
              // jump-to-anchor was worse than doing nothing).
              return city.to ? (
                <Link key={city.slug} to={city.to} className={cls} {...handlers}>
                  {inner}
                </Link>
              ) : (
                <div key={city.slug} className={cls} {...handlers}>
                  {inner}
                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT: live Google Maps embed of Tampa Bay */}
        <div className="p-3 border-l border-black/10 relative flex flex-col">
          <div className="rounded-xl overflow-hidden w-[500px] h-[440px] border border-white/5">
            <iframe
              title="Suncoast Pool Pros service area — Pinellas County & West Tampa, FL"
              src="https://maps.google.com/maps?q=St.+Petersburg,+FL&t=&z=10&ie=UTF8&iwloc=&output=embed"
              width="500"
              height="440"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="flex-1 flex items-center justify-center text-center px-4">
            <p className="text-sm text-gray-600">
              Serving your neighborhood?{' '}
              <a href="#quote" onClick={handleQuoteClick} className="font-semibold text-brand-orange hover:text-brand-orange-dark transition-colors">
                Get a free quote
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
