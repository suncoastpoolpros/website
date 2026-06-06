import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import {
  FlaskConical,
  Sprout,
  ShieldCheck,
  Waves,
  Sparkles,
  Zap,
  Gauge,
  Calculator,
  Phone,
  MessageSquare,
  ArrowRight,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

type Guide = {
  to: string;
  icon: LucideIcon;
  tag: string;
  title: string;
  blurb: string;
  points: string[];
};

// Only real, published guides go here. The hub links every pool-care article so
// crawlers reach them one hop from the breadcrumb parent (and readers get a
// proper landing page instead of a bare URL segment).
const GUIDES: Guide[] = [
  {
    to: '/pool-care/green-pool',
    icon: Waves,
    tag: 'Algae & Green Water',
    title: 'Green Pool Rescue',
    blurb:
      'A green pool is an algae bloom that out-ran your chlorine. How to tell which algae you’ve got, and the five-step plan — balance, brush, shock, filter, clarify — that takes it back to blue.',
    points: [
      'Why pools go green, fast — especially in Florida',
      'Green vs. mustard vs. black algae',
      'The green-to-clean treatment plan',
    ],
  },
  {
    to: '/pool-care/nitrates',
    icon: Sprout,
    tag: 'Water Chemistry',
    title: 'Pool Nitrates',
    blurb:
      'The hidden nutrient that feeds algae around the clock and burns through your chlorine — why no chemical removes it, and the dilution plan that actually brings it down.',
    points: [
      'What nitrates are & where Florida pools pick them up',
      'Why your chlorine won’t hold',
      'The partial-drain treatment, step by step',
    ],
  },
  {
    to: '/pool-care/cyanuric-acid',
    icon: ShieldCheck,
    tag: 'Water Chemistry',
    title: 'Cyanuric Acid & Chlorine',
    blurb:
      'CYA shields your chlorine from the Florida sun — but too much locks it up. The free-chlorine-to-CYA ratio that decides whether your pool is actually sanitized, with a live calculator.',
    points: [
      'How CYA protects and binds chlorine',
      'The FC:CYA ratio that runs your pool',
      'Interactive ratio calculator',
    ],
  },
  {
    to: '/pool-care/variable-speed-pumps',
    icon: Zap,
    tag: 'Equipment & Energy',
    title: 'Variable Speed Pumps',
    blurb:
      'Your pool pump is usually the biggest power draw in the house after the AC. A variable-speed pump can cut that bill by around 75% — the physics behind why, with a live savings calculator.',
    points: [
      'Why single-speed pumps waste money',
      'The affinity-law math, in plain English',
      'Interactive annual-savings calculator',
    ],
  },
  {
    to: '/pool-care/salt-water-vs-chlorine',
    icon: Sparkles,
    tag: 'Sanitizer & Water Feel',
    title: 'Salt Water vs. Chlorine',
    blurb:
      'A salt system doesn’t replace chlorine — it makes it continuously, holding a steady level instead of the spike-and-crash of liquid jugs. That stability is what you actually feel in the water.',
    points: [
      'Why steady chlorine beats peaks and valleys',
      'Gentler on skin, eyes, and that “chlorine” smell',
      'How a salt cell makes its own chlorine',
    ],
  },
];

// The "why it matters" trio under the guides — frames chemistry around outcomes
// owners actually care about, not jargon.
const WHY = [
  {
    icon: Zap,
    title: 'Sanitizer that works',
    text: 'Balanced water means the chlorine you add actually kills what it should — instead of being wasted.',
  },
  {
    icon: Sprout,
    title: 'Stay ahead of algae',
    text: 'Most green-pool calls trace back to one number being off. Know which, and you stop chasing it.',
  },
  {
    icon: Gauge,
    title: 'Protect your equipment',
    text: 'The wrong chemistry quietly eats heaters, pumps, and finishes. Right levels make gear last.',
  },
];

const PoolCarePageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();

  usePageMeta({
    title: 'Pool Care Guides — Water Chemistry, Explained',
    description:
      'Plain-English pool water chemistry guides from working St. Petersburg pool techs — nitrates, cyanuric acid and chlorine, and the numbers that keep your pool clear. Free to read.',
    canonicalPath: '/pool-care/',
  });

  // BreadcrumbList + an ItemList of the published guides, injected client-side —
  // usePageMeta handles title/description/canonical in the prerendered HTML but
  // doesn't emit JSON-LD (the documented exception, CLAUDE.md #9).
  useEffect(() => {
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.text = JSON.stringify([
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Pool Care', path: '/pool-care/' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Pool Care Guides',
        itemListElement: GUIDES.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g.title,
          url: `https://suncoastpoolpros.com${g.to}`,
        })),
      },
    ]);
    document.head.appendChild(ld);
    return () => ld.remove();
  }, []);

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-50 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[460px] pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[500px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">
              Pool Water Chemistry
            </span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Pool care, <span className="text-brand-orange">explained</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            Straight-talking guides to the chemistry behind a clear pool — written by the techs who
            balance water across St. Petersburg every week. No jargon, no fluff, free to read.
          </p>
        </section>

        {/* Guides grid */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="sr-only">Pool care guides</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {GUIDES.map((g, i) => (
              <m.div
                key={g.to}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={g.to}
                  className="group relative flex flex-col h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 overflow-hidden hover:bg-white/[0.05] hover:border-white/20 transition-colors"
                >
                  {/* corner bloom on hover */}
                  <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-brand-orange/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative flex items-center gap-3 mb-4">
                    <span className="w-12 h-12 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                      <g.icon className="w-6 h-6 text-brand-orange" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-blue-light">
                      {g.tag}
                    </span>
                  </div>
                  <h3 className="relative text-white font-display font-bold text-xl sm:text-2xl mb-2.5">
                    {g.title}
                  </h3>
                  <p className="relative text-gray-400 text-[15px] leading-relaxed mb-5">
                    {g.blurb}
                  </p>
                  <ul className="relative space-y-2 mb-6">
                    {g.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[14px] text-gray-300">
                        <Check className="w-4 h-4 text-brand-blue-light shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="relative inline-flex items-center gap-1.5 text-brand-orange font-semibold text-sm mt-auto group-hover:gap-2.5 transition-all">
                    Read the guide
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </m.div>
            ))}

            {/* "More guides" placeholder — spans full width below the two cards */}
            <div className="md:col-span-2 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 min-h-[120px]">
              <p className="text-gray-400 font-semibold mb-1">More guides coming soon</p>
              <p className="text-gray-600 text-sm">
                Phosphates, total alkalinity, stains and scale, and more.
              </p>
            </div>
          </div>
        </section>

        {/* Why chemistry matters */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center mb-10">
            <h2 className="section-heading text-white">Why the numbers matter</h2>
            <p className="section-subtext mt-3 max-w-xl mx-auto">
              Get the chemistry right and everything else gets easier.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {WHY.map((w, i) => (
              <m.div
                key={w.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <span className="w-11 h-11 rounded-xl bg-brand-blue/15 flex items-center justify-center mb-4">
                  <w.icon className="w-[22px] h-[22px] text-brand-blue-light" />
                </span>
                <h3 className="text-white font-semibold text-lg mb-2">{w.title}</h3>
                <p className="text-gray-400 text-[15px] leading-relaxed">{w.text}</p>
              </m.div>
            ))}
          </div>
        </section>

        {/* Cross-link to the calculators (complementary to the chemistry guides) */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <Link
            to="/tools"
            className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] hover:border-white/20 transition-colors"
          >
            <span className="w-12 h-12 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6 text-brand-orange" />
            </span>
            <div className="flex-1">
              <h2 className="text-white font-display font-bold text-lg mb-1">
                Free pool calculators
              </h2>
              <p className="text-gray-400 text-[15px] leading-relaxed">
                Work out your pool volume and heating costs — the numbers you need before you dose a
                single chemical.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-brand-orange font-semibold text-sm shrink-0 group-hover:gap-2.5 transition-all">
              Open the tools
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </section>

        {/* Lead-gen CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Rather not think about chemistry?
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                We test, dose, and balance your water every week for one flat rate — across St.
                Petersburg and the Tampa Bay area.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="#quote" onClick={handleQuoteClick} className="btn btn-orange w-full sm:w-auto">
                  <MessageSquare className="w-[18px] h-[18px]" />
                  Get a Free Quote
                </a>
                <a href={PHONE_HREF} className="btn btn-glass w-full sm:w-auto">
                  <Phone className="w-[18px] h-[18px]" />
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export const PoolCarePage = () => (
  <QuoteSheetProvider>
    <PoolCarePageInner />
  </QuoteSheetProvider>
);
