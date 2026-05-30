import React from 'react';
import { m } from 'motion/react';
import { UserRound, ScanSearch, Wallet, Zap } from 'lucide-react';
import { Container } from '@/components/Container';

/**
 * "Why Suncoast Pool Pros" — four equal, calm cards.
 * Neutral surfaces; orange used sparingly as a single quiet accent.
 */
const items = [
  {
    icon: UserRound,
    title: 'The Same Tech Every Week',
    body: 'No rotating crews, ever. One dedicated technician learns your pool, your equipment, and your gate code by heart.',
  },
  {
    icon: ScanSearch,
    title: 'Every Visit Is Audited',
    body: 'We review every visit report and auto-flag anything out of range, so small problems get caught long before you notice.',
  },
  {
    icon: Wallet,
    title: 'No Surprise Chemical Bills',
    body: 'One flat rate, all year long. We absorb every chlorine spike and seasonal swing, so your monthly bill never moves.',
  },
  {
    icon: Zap,
    title: 'Effortless From Day One',
    body: 'Autopay, recurring visits, zero paperwork. We streamline it all so there are no follow-ups and nothing for you to manage.',
  },
];

export const FeatureGrid = () => {
  return (
    <section
      id="features"
      className="pt-12 pb-16 md:pt-20 md:pb-24 relative overflow-hidden bg-[#07111c]"
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07111c] to-transparent pointer-events-none" />

      <Container className="relative z-10">
        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-10 md:mb-12"
        >
          <h2 className="section-heading text-white leading-[1.1] mb-4">
            Why St. Pete homeowners choose Suncoast.
          </h2>
          <p className="section-subtext">
            Four reasons people switch from a rotating-crew, surprise-bill outfit to us.
          </p>
        </m.div>

        {/* Four equal cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {items.map((item, i) => (
            <m.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)] hover:bg-white/[0.06] hover:border-white/15 transition-colors"
            >
              {/* faint top-edge highlight for subtle depth */}
              <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              {/* Mobile: tile background. Desktop: bare icon, no tile/border. */}
              <div className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4 md:w-auto md:h-auto md:rounded-none md:bg-transparent md:border-0 md:justify-start md:mb-4">
                <item.icon className="w-5 h-5 md:w-7 md:h-7 text-brand-blue-light" strokeWidth={1.9} />
              </div>

              <h3 className="font-display text-base font-bold text-white leading-snug mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.body}</p>
            </m.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
