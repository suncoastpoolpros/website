import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useQuoteSheet } from '@/components/QuoteSheet';

/**
 * Tampa Bay service-area mega-menu.
 * Left side: city list with hover highlight.
 * Right side: live Google Maps embed of the Tampa Bay region (free, no API key).
 */

export type City = { slug: string; name: string; blurb: string; to?: string };

export const cities: City[] = [
  { slug: 'st-petersburg',   name: 'St. Petersburg',  blurb: 'Our home base' },
  { slug: 'gulfport',        name: 'Gulfport',        blurb: 'Coastal St. Pete' },
  { slug: 'st-pete-beach',   name: 'St. Pete Beach',  blurb: 'Beach community' },
  { slug: 'treasure-island', name: 'Treasure Island', blurb: 'Gulf beaches' },
  { slug: 'seminole',        name: 'Seminole',        blurb: 'Mid-Pinellas' },
  { slug: 'largo',           name: 'Largo',           blurb: 'Central Pinellas' },
  { slug: 'belleair-beach',  name: 'Belleair Beach',  blurb: 'Gulf barrier island', to: '/belleair-beach-fl' },
  { slug: 'clearwater',      name: 'Clearwater',      blurb: 'Beach & mainland' },
  { slug: 'safety-harbor',   name: 'Safety Harbor',   blurb: 'East shore' },
  { slug: 'dunedin',         name: 'Dunedin',         blurb: 'Gulf-side' },
  { slug: 'palm-harbor',     name: 'Palm Harbor',     blurb: 'Northern Pinellas' },
  { slug: 'davis-island',    name: 'Davis Island',    blurb: 'South Tampa island' },
  { slug: 'south-tampa',     name: 'South Tampa',     blurb: 'Hyde Park & Bayshore' },
];

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
                      className={`text-sm font-medium leading-tight transition-colors ${
                        hoveredSlug === city.slug ? 'text-[#0a1628]' : 'text-gray-700'
                      }`}
                    >
                      {city.name}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{city.blurb}</p>
                  </div>
                </>
              );
              return city.to ? (
                <Link key={city.slug} to={city.to} className={cls} {...handlers}>
                  {inner}
                </Link>
              ) : (
                <a key={city.slug} href="#service-areas" className={cls} {...handlers}>
                  {inner}
                </a>
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
