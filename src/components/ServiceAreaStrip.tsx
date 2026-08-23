import React from 'react';
import { MapPin } from 'lucide-react';
import { Container } from '@/components/Container';
import { SmartLink } from '@/components/SmartLink';
import { cities } from '@/lib/cities';

/**
 * Named service areas for the /services/ pages.
 *
 * Why real city names instead of "the beaches and the rest of the county":
 * nobody searches for a county. They search "pool cleanup clearwater". A page
 * that never writes the word Clearwater has no text to match, however obviously
 * Clearwater is inside Pinellas. This puts all fourteen city names in crawlable
 * text high up the page, and links the seven that have their own page — which
 * also pushes internal link equity from the service pages toward the city pages.
 *
 * Reads from lib/cities, so adding a city (or giving one a page) updates every
 * service page at once. Cities without a page render as plain text, not as
 * links to nowhere.
 */
/**
 * St. Petersburg has no `to` in lib/cities because it never got a dedicated
 * city page — the HOMEPAGE is the St. Pete page (its title is "Pool Service
 * St. Petersburg, FL"). Without this it renders as dimmed plain text, which
 * makes our own home base look like the one place we don't cover. Handled here
 * rather than in the registry so the footer and Service Areas menu, which
 * deliberately show it as a context label, keep their current behaviour.
 */
const href = (slug: string, to?: string) => to ?? (slug === 'st-petersburg' ? '/' : undefined);

export const ServiceAreaStrip = ({ intro }: { intro: string }) => (
  <section className="pb-14 relative" aria-label="Service areas">
    <Container>
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <MapPin className="w-3.5 h-3.5 text-brand-blue-light" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue-light">
            Where We Work
          </span>
        </div>
        <p className="text-gray-400 text-[15px] leading-relaxed mb-5">{intro}</p>

        <ul className="flex flex-wrap justify-center gap-2">
          {cities.map((city) => {
            const to = href(city.slug, city.to);
            return (
            <li key={city.slug}>
              {to ? (
                <SmartLink
                  to={to}
                  className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/10 px-3.5 py-1.5 text-[13px] font-semibold text-gray-200 transition-colors hover:border-white/25 hover:text-white"
                >
                  {city.name}
                </SmartLink>
              ) : (
                <span className="inline-flex items-center rounded-full bg-white/[0.02] border border-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-gray-400">
                  {city.name}
                </span>
              )}
            </li>
            );
          })}
        </ul>
      </div>
    </Container>
  </section>
);
