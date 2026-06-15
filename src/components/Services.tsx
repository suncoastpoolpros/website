import React from 'react';
import { Check, Waves, ClipboardCheck } from 'lucide-react';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import {
  IcWeeklyCleaning,
  IcChemistry,
  IcUpgrade,
  IcFilter,
  IcSaltCare,
  IcGreenRecovery,
} from '@/components/PoolIcons';

const services = [
  {
    icon: IcWeeklyCleaning,
    title: "Weekly Pool Cleaning",
    description: "Dependable scheduled service keeping your pool clean, balanced, and always ready to enjoy."
  },
  {
    icon: IcChemistry,
    title: "Saltwater & Chemistry",
    description: "Expert balancing to protect surfaces, equipment, and swimmer comfort."
  },
  {
    icon: IcUpgrade,
    title: "Equipment Upgrades",
    description: "Modernize with a variable-speed pump, salt system, or smart automation — lower bills, less hassle."
  },
  {
    icon: IcFilter,
    title: "Filter Cleaning & Replacement",
    description: "Improves water clarity, circulation efficiency, and equipment lifespan."
  },
  {
    icon: IcSaltCare,
    title: "Salt & Equipment Care",
    description: "Salt cell service, system tune-ups, and seasonal care that keep everything running efficiently."
  },
  {
    icon: IcGreenRecovery,
    title: "Green Pool Recovery",
    description: "Rapid restoration service to bring neglected or algae-affected pools back to clear condition."
  }
];

// The weekly service, split into two honest halves: the hands-on work done in
// the water, and the monitoring/reporting that means you never have to wonder.
// Grouping (vs. one flat bullet list) makes it scannable and reads as a real
// service spec, not marketing filler. Keyword-dense for local SEO.
const visitGroups = [
  {
    icon: Waves,
    label: 'Hands-on, every visit',
    items: [
      'Skimming, brushing & vacuuming — every single visit',
      'Full water testing & precision chemical balancing',
      'Filter monitored and cleaned for crystal-clear water',
      'Equipment checked so small issues never become big ones',
    ],
  },
  {
    icon: ClipboardCheck,
    label: "You're never in the dark",
    items: [
      'Stabilizer, calcium hardness & more tracked to catch problems early',
      'Conditions like high chlorine or low water flagged on your report',
      'A heads-up the moment anything needs your attention',
      'A photo-backed service report after every single visit',
    ],
  },
];

export const Services = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  return (
    <section id="services" className="py-16 md:py-24 relative">
      <Container>
        {/* What You Can Expect — flat-rate pricing anchor + grouped "what's
            included" checklist. Replaces the old text + stock-photo pattern (the
            layout shared across city pages) with a homepage-only composition that
            makes the flat-rate value prop the hero. */}
        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-12 items-start mb-16 md:mb-24">

          {/* LEFT — narrative + the flat-rate price anchor */}
          <div className="lg:pt-2">
            <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
              Weekly Pool Service
            </span>
            <h2 className="section-heading text-white leading-[1.1] mb-4">
              Everything's handled in your{' '}
              <span className="text-brand-orange">weekly pool service</span>.
            </h2>
            <p className="section-subtext mb-7">
              One dedicated technician does the brushing, skimming, vacuuming, and full
              chemical balancing — with every standard chemical included. No add-ons, no
              surprise invoices, no chasing anyone down.
            </p>

            {/* Price anchor — the differentiator, pulled out of the paragraph so
                it actually lands. Brand-orange gradient frame, no blur (mobile-safe). */}
            <div className="rounded-2xl border border-brand-orange/25 bg-gradient-to-br from-brand-orange/[0.13] via-brand-orange/[0.04] to-transparent p-6 mb-7">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-white text-4xl md:text-5xl leading-none">
                  ~$150
                </span>
                <span className="text-gray-300 font-semibold text-lg">/ month</span>
              </div>
              <p className="text-brand-orange-light font-semibold mt-2">
                One flat rate · all standard chemicals included
              </p>
              <p className="text-sm text-gray-400 leading-relaxed mt-2">
                Typical for an average pool. Your rate is set by pool size, screen
                enclosures, and nearby trees — quoted up front, never a surprise.
              </p>
            </div>

            <button type="button" onClick={openQuoteSheet} className="btn btn-orange">
              Get My Flat-Rate Quote
            </button>
          </div>

          {/* RIGHT — the "what's included" card, two labeled groups */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            {/* faint top-edge highlight for subtle depth (matches FeatureGrid) */}
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {visitGroups.map((group, gi) => (
              <div key={group.label} className={gi === 1 ? 'mt-7 pt-7 border-t border-white/10' : ''}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
                    <group.icon className="w-[18px] h-[18px] text-brand-blue-light" strokeWidth={2} />
                  </div>
                  <h3 className="font-display text-base md:text-lg font-bold text-white">
                    {group.label}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 w-5 h-5 rounded-md bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-brand-orange-light" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] text-gray-300 leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Pool Cleaning & Equipment Repair Services — header + 6 service cards */}
        <div className="max-w-3xl mb-10 md:mb-16">
          <h2 className="section-heading text-white mb-4 md:mb-6">
            Pool Cleaning & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-light to-brand-blue">
              Equipment Repair Services
            </span>
          </h2>
          <p className="section-subtext">
            Residential and commercial pool service and maintenance across St. Petersburg, Clearwater, Seminole, Largo, and the greater Tampa Bay area.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={i}
              className="glass-panel p-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4">
                <service.icon className="w-6 h-6 text-brand-blue-light" />
              </div>
              <h3 className="text-lg md:text-xl font-display font-bold text-white mb-2">{service.title}</h3>
              <p className="text-gray-400 leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
