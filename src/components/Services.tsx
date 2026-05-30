import React from 'react';
import { m } from 'motion/react';
import { Container } from '@/components/Container';
import {
  IcWeeklyCleaning,
  IcChemistry,
  IcUpgrade,
  IcFilter,
  IcSaltCare,
  IcGreenRecovery,
} from '@/components/PoolIcons';

// Local image asset for the "Weekly Cleaning" visual block. Swap this constant
// to change the image — saving a file at the same path means zero code change.
// Reusing the hero asset for now (already preloaded → no extra network cost).
const SERVICES_IMAGE_WEBP = '/pool-service-st-petersburg-hero.webp';
const SERVICES_IMAGE_JPG = '/pool-service-st-petersburg-hero.jpg';

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

const weeklyIncludes = [
  "Your service report flags conditions like high chlorine or low water, so you always know your pool's status",
  "We track stabilizer, calcium hardness, and more to catch issues like water loss early — before they cost you",
  "Full water testing and precision chemical balancing",
  "Thorough skimming, brushing, and vacuuming every visit",
  "Equipment checked so small issues never become big ones",
  "Filter monitored and cleaned to keep water crystal-clear",
  "A heads-up the moment anything needs your attention",
  "A photo-backed service report after every single visit"
];

export const Services = () => {
  return (
    <section id="services" className="py-24 relative">
      <Container>
        {/* What You Can Expect — weekly service detail + pool image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <m.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section-heading text-white mb-4">
              What You Can Expect From Our <span className="text-brand-orange">Weekly Pool Service</span>
            </h2>
            <p className="section-subtext mb-8">
              Most St. Petersburg pools run <span className="text-white font-semibold">$140–$200 a month</span> for weekly service. For one flat rate, we handle the brushing, skimming, vacuuming, and chemical balancing — and all standard chemicals are included.
            </p>
            <ul className="space-y-3">
              {weeklyIncludes.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-orange mt-2 shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </m.div>

          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-light to-brand-blue rounded-[2.5rem] rotate-3 opacity-20 blur-2xl" />
            <div className="glass-panel p-2 rounded-[2.5rem] relative overflow-hidden">
              <picture>
                <source type="image/webp" srcSet={SERVICES_IMAGE_WEBP} />
                <img
                  src={SERVICES_IMAGE_JPG}
                  alt="Sparkling blue pool water serviced by Suncoast Pool Pros in St. Petersburg, FL"
                  className="w-full h-full object-cover rounded-[2rem]"
                  loading="lazy"
                  decoding="async"
                  width={1280}
                  height={720}
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent opacity-40" />
            </div>
          </m.div>
        </div>

        {/* Pool Cleaning & Equipment Repair Services — header + 6 service cards */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mb-16"
        >
          <h2 className="section-heading text-white mb-6">
            Pool Cleaning & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-light to-brand-blue">
              Equipment Repair Services
            </span>
          </h2>
          <p className="section-subtext">
            Residential and commercial pool service across St. Petersburg, Clearwater, Seminole, Largo, and the greater Tampa Bay area.
          </p>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel p-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4">
                <service.icon className="w-6 h-6 text-brand-blue-light" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
              <p className="text-gray-400 leading-relaxed">{service.description}</p>
            </m.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
