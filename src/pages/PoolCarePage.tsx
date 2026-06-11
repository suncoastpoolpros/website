import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import {
  BookOpen,
  Sprout,
  ShieldCheck,
  Droplets,
  Wind,
  Scale,
  Waves,
  Sparkles,
  Zap,
  Gauge,
  Calculator,
  Phone,
  MessageSquare,
  ArrowRight,
  ArrowDownToLine,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
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
    to: '/pool-care/cloudy-pool-water',
    icon: Droplets,
    tag: 'Cloudy & Hazy Water',
    title: 'Cloudy Pool Water',
    blurb:
      'Cloudy water comes down to five causes — filtration, balance, sanitizer, particles too fine to filter, or sheer overload. How to tell which one you’ve got, the fix in order, and whether to reach for a clarifier or a flocculant.',
    points: [
      'Why it’s cloudy even when “the chemicals are fine”',
      'The five real causes, fastest to rule out first',
      'Clarifier vs. flocculant — which to use',
    ],
  },
  {
    to: '/pool-care/pool-smells-like-chlorine',
    icon: Wind,
    tag: 'Smell & Irritation',
    title: 'Pool Smells Like Chlorine',
    blurb:
      'The strong “chlorine” smell is the one thing in pool care almost everyone gets backwards. It isn’t too much chlorine — it’s chloramines, a sign you have too little. What you’re really smelling, and how to clear it for good.',
    points: [
      'Why the smell means too little chlorine, not too much',
      'What turns chlorine into smelly chloramines',
      'The breakpoint shock that actually clears it',
    ],
  },
  {
    to: '/pool-care/pool-service-vs-diy',
    icon: Scale,
    tag: 'DIY vs. Pro',
    title: 'Pool Service vs. DIY',
    blurb:
      'Doing your own pool is doable — so the real question is what it costs you in time, gear, and the odd green-pool weekend. The honest math both ways, with real Florida numbers and where DIY actually trips people up.',
    points: [
      'What DIY really costs once you add it all up',
      'Is a pool service worth it? The honest answer',
      'The hidden cost a test kit can’t catch',
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
  {
    to: '/pool-care/how-to-drain-a-pool',
    icon: ArrowDownToLine,
    tag: 'Draining & Water Level',
    title: 'How to Drain a Pool',
    blurb:
      'Lowering your pool with a garden hose is just a gravity siphon — once you shut the skimmer valves and pull only off the main drain. How to set it up, how low is safe, and where the water can legally go.',
    points: [
      'The pump-off, main-drain-only valve setup',
      'Priming and starting a garden-hose siphon',
      'How low to go without floating the pool',
    ],
  },
];

// The guide that headlines the page as the "Most read" spotlight. Pulled out of
// the category grid below so it isn't shown twice.
const FEATURED_SLUG = '/pool-care/green-pool';

// Guides are grouped into a small library taxonomy so the hub reads like a
// structured index, not a flat tile wall. Slugs reference GUIDES (single source
// of truth — also drives the ItemList schema). The featured guide is excluded.
const CATEGORY_GROUPS: { label: string; slugs: string[] }[] = [
  {
    label: 'Common pool problems',
    slugs: ['/pool-care/cloudy-pool-water', '/pool-care/pool-smells-like-chlorine'],
  },
  {
    label: 'Water chemistry',
    slugs: ['/pool-care/nitrates', '/pool-care/cyanuric-acid'],
  },
  {
    label: 'Equipment, cost & choices',
    slugs: [
      '/pool-care/variable-speed-pumps',
      '/pool-care/salt-water-vs-chlorine',
      '/pool-care/pool-service-vs-diy',
    ],
  },
  {
    label: 'Maintenance & draining',
    slugs: ['/pool-care/how-to-drain-a-pool'],
  },
];

const bySlug = (slug: string) => GUIDES.find((g) => g.to === slug)!;
const featured = bySlug(FEATURED_SLUG);

// The "why it matters" trio — framed around outcomes owners care about, not
// jargon. Rendered on the light band that the guide pages use, to tie the hub to
// its guides (and break from the all-dark utility look of /tools).
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

// Compact guide card used inside the category grids.
const GuideCard: React.FC<{ g: Guide; i: number }> = ({ g, i }) => (
  <m.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: i * 0.06 }}
    className="h-full"
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
      <p className="relative text-gray-400 text-[15px] leading-relaxed mb-5">{g.blurb}</p>
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
);

const PoolCarePageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();

  usePageMeta({
    title: 'Pool Care Guides — Water Chemistry, Explained',
    description:
      'Plain-English pool care guides from St. Petersburg techs — green and cloudy water, the chlorine smell, water chemistry, and DIY vs. a pro. Free to read.',
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

      {/* Pool Care hero — cool, deep-water glow (distinct from the orange-led Tools hero) */}
      <div className="absolute top-0 inset-x-0 h-[480px] bg-gradient-to-b from-brand-blue/[0.10] to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[480px] pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="absolute left-1/2 -translate-x-1/2 -top-32 w-[900px] h-[520px] rounded-full bg-brand-blue/20 blur-[150px]" />
        <div className="absolute left-[18%] top-8 w-[360px] h-[360px] rounded-full bg-brand-blue/15 blur-[130px]" />
        <div className="absolute right-[16%] -top-10 w-[320px] h-[320px] rounded-full bg-brand-orange/[0.08] blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero — framed as a library, not a single utility page */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <BookOpen className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">The Pool Care Library</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Pool care, <span className="text-brand-orange">explained</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            Straight-talking guides to everything that keeps a pool clear — green water, cloudy water,
            the chemistry, the equipment — written by the techs who balance pools across St.
            Petersburg every week.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <span className="text-gray-300 font-semibold">{GUIDES.length} in-depth guides</span>
            <span className="text-gray-700">•</span>
            <span>Written by working techs</span>
            <span className="text-gray-700">•</span>
            <span>Free to read</span>
          </div>
        </section>

        {/* Featured "Most read" spotlight — wide editorial card */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-orange shrink-0">
              Most read
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link
              to={featured.to}
              className="group relative grid sm:grid-cols-[1.05fr_1.45fr] rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-white/20 transition-colors"
            >
              {/* visual panel */}
              <div className="relative min-h-[180px] p-8 flex flex-col justify-between bg-gradient-to-br from-brand-blue/25 via-brand-blue/10 to-brand-orange/15 overflow-hidden">
                <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-brand-orange/15 blur-3xl pointer-events-none" />
                <span className="relative w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                  <featured.icon className="w-7 h-7 text-white" />
                </span>
                <span className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80 mt-6">
                  {featured.tag}
                </span>
              </div>
              {/* content */}
              <div className="relative p-7 sm:p-8 flex flex-col">
                <h2 className="text-white font-display font-bold text-2xl sm:text-3xl mb-3">
                  {featured.title}
                </h2>
                <p className="text-gray-400 text-[15px] leading-relaxed mb-5">{featured.blurb}</p>
                <ul className="space-y-2 mb-6">
                  {featured.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[14px] text-gray-300">
                      <Check className="w-4 h-4 text-brand-blue-light shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <span className="inline-flex items-center gap-1.5 text-brand-orange font-semibold text-sm mt-auto group-hover:gap-2.5 transition-all">
                  Read the guide
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </m.div>
        </section>

        {/* Browse all — guides grouped into a small library taxonomy */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {CATEGORY_GROUPS.map((group) => (
            <div key={group.label} className="mb-12 last:mb-0">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-display font-bold text-white text-xl sm:text-2xl shrink-0">
                  {group.label}
                </h2>
                <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {group.slugs.map((slug, i) => (
                  <GuideCard key={slug} g={bySlug(slug)} i={i} />
                ))}
              </div>
            </div>
          ))}

          {/* "More guides" teaser */}
          <div className="mt-10 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 min-h-[120px]">
            <p className="text-gray-400 font-semibold mb-1">More guides coming soon</p>
            <p className="text-gray-600 text-sm">
              Phosphates, total alkalinity, stains and scale, and more.
            </p>
          </div>
        </section>

        {/* Why chemistry matters — on the guides' signature light band */}
        <section className="py-16 sm:py-20 mt-8 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Why It Matters
              </span>
              <h2 className="font-display font-bold text-[#0a1628] text-3xl sm:text-4xl leading-tight mb-3">
                Why the numbers matter
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Get the chemistry right and everything else gets easier — clearer water, fewer
                problems, gear that lasts.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3 max-w-5xl mx-auto">
              {WHY.map((w, i) => (
                <m.div
                  key={w.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-white border border-black/5 shadow-sm shadow-black/5 p-6"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-4">
                    <w.icon className="w-[22px] h-[22px] text-brand-blue" />
                  </span>
                  <h3 className="text-[#0a1628] font-display font-bold text-lg mb-2">{w.title}</h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed">{w.text}</p>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Cross-link to the calculators (complementary to the chemistry guides) */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-16">
          <Link
            to="/tools"
            className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] hover:border-white/20 transition-colors"
          >
            <span className="w-12 h-12 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6 text-brand-orange" />
            </span>
            <div className="flex-1">
              <h2 className="text-white font-display font-bold text-lg mb-1">Free pool calculators</h2>
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
