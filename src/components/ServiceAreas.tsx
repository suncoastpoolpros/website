import React from 'react';
import { MapPin } from 'lucide-react';
import { Container } from '@/components/Container';
import { SmartLink } from '@/components/SmartLink';
import { cities } from '@/lib/cities';

export const ServiceAreas = () => {
  return (
    <section id="service-areas" className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
      <Container className="relative z-10">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_1.3fr] gap-10 lg:gap-16 items-center">

          {/* LEFT — open editorial header + CTA */}
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-brand-orange" />
              <span className="text-gray-400 font-semibold tracking-[0.2em] uppercase text-xs">
                Where We Service
              </span>
            </div>
            {/* Leads with the target phrase ("weekly pool service") + the money
                city — the original heading was pure geography with no service
                keyword at all, so the one section whose job is local relevance
                carried none of that signal.
                Deliberately NO Tampa here: this is the page's strongest
                service-area ranking signal and Tampa proper isn't a market we're
                pursuing. Tampa coverage is still stated — South Tampa and Davis Island
                remain in the chips below and in schema areaServed — it just isn't
                targeted. */}
            <h2 className="section-heading text-white leading-[1.1] mb-5">
              Weekly pool service in St. Petersburg &amp; across Pinellas County.
            </h2>
            <p className="section-subtext mb-6 max-w-md">
              One flat-rate team across the bay. If you're in or near Pinellas, we've probably got a tech on your street already.
            </p>
          </div>

          {/* RIGHT — city chips flowing freely, no box. Cities with their own
              page link to it (the homepage's only in-content city links — an
              internal-link signal, styled to stay quiet, not compete as CTAs);
              the rest remain plain labels. */}
          <div className="flex flex-wrap gap-2.5 lg:justify-end">
            {cities.map((city) =>
              city.to ? (
                <SmartLink
                  key={city.slug}
                  to={city.to}
                  className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/10 px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:border-white/25 hover:text-white"
                >
                  {city.name}
                </SmartLink>
              ) : (
                <span
                  key={city.slug}
                  className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/10 px-4 py-2 text-sm font-semibold text-gray-200"
                >
                  {city.name}
                </span>
              ),
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};
