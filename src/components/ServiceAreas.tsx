import React from 'react';
import { m } from 'motion/react';
import { MapPin } from 'lucide-react';
import { Container } from '@/components/Container';

const cities = [
  'St. Petersburg',
  'Gulfport',
  'St. Pete Beach',
  'Treasure Island',
  'Seminole',
  'Largo',
  'Belleair Beach',
  'Clearwater',
  'Safety Harbor',
  'Dunedin',
  'Palm Harbor',
  'Davis Island',
  'South Tampa',
];

export const ServiceAreas = () => {
  return (
    <section id="service-areas" className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
      <Container className="relative z-10">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_1.3fr] gap-10 lg:gap-16 items-center">

          {/* LEFT — open editorial header + CTA */}
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-brand-orange" />
              <span className="text-gray-400 font-semibold tracking-[0.2em] uppercase text-xs">
                Where We Service
              </span>
            </div>
            <h2 className="section-heading text-white leading-[1.1] mb-5">
              All of Pinellas County &amp; West Tampa.
            </h2>
            <p className="section-subtext mb-6 max-w-md">
              One flat-rate team across the bay. If you're in or near Pinellas, we've probably got a tech on your street already.
            </p>
          </m.div>

          {/* RIGHT — city chips flowing freely, no box */}
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.04 }}
            className="flex flex-wrap gap-2.5 lg:justify-end"
          >
            {cities.map((city) => (
              <m.a
                key={city}
                href="#quote"
                aria-label={`Pool cleaning in ${city}`}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/10 px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:border-brand-blue/50 hover:bg-brand-blue/10 transition-colors"
              >
                {city}
              </m.a>
            ))}
          </m.div>
        </div>
      </Container>
    </section>
  );
};
