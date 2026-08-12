import React from 'react';
import { UserRound, ScanSearch, Wallet, Zap } from 'lucide-react';
import { Container } from '@/components/Container';

/**
 * "Why Suncoast Pool Pros" — four equal, calm cards.
 * Neutral surfaces; orange used sparingly as a single quiet accent.
 */
const items = [
  {
    icon: UserRound,
    title: 'Vetted Techs, Familiar Faces',
    body: 'Every technician is vetted, friendly, and knowledgeable — and we keep routes consistent, so the face at your gate is one you recognize.',
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
      {/* (Removed the redundant top fade: the hero scrim already lands on solid
          #07111c at its bottom, so re-fading #07111c→transparent here stacked a
          second darken over the seam and read as a visible line. Both sections
          are the same #07111c, so a flat join is seamless.) */}

      <Container className="relative z-10">
        {/* Header */}
        <div className="max-w-2xl mb-10 md:mb-12">
          <h2 className="section-heading text-white leading-[1.1] mb-4">
            Why St. Pete homeowners choose Suncoast.
          </h2>
          <p className="section-subtext">
            Four reasons people switch from a rotating-crew, surprise-bill outfit to us.
          </p>
        </div>

        {/* Four equal cards. Mobile: compact icon-left ROWS (four stacked
            vertical cards was ~900px of scrolling for one message); desktop:
            the original block cards, 4-across. Layout-only split — headings
            and body text are identical in the DOM at every viewport, so
            there's no content-hiding for mobile-first indexing to devalue. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {items.map((item) => (
            <div
              key={item.title}
              className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 md:p-6 flex items-start gap-3.5 md:block shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)] hover:bg-white/[0.06] hover:border-white/15 transition-colors"
            >
              {/* faint top-edge highlight for subtle depth */}
              <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              {/* Mobile: tile background, row-leading. Desktop: bare icon. */}
              <div className="w-11 h-11 shrink-0 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center md:w-auto md:h-auto md:rounded-none md:bg-transparent md:border-0 md:justify-start md:mb-4">
                <item.icon className="w-5 h-5 md:w-7 md:h-7 text-brand-blue-light" strokeWidth={1.9} />
              </div>

              <div className="min-w-0">
                <h3 className="font-display text-[15px] md:text-base font-bold text-white leading-snug mb-1 md:mb-2">
                  {item.title}
                </h3>
                <p className="text-[13px] md:text-sm text-gray-400 leading-snug md:leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
