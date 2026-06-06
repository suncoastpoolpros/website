import React, { useEffect } from 'react';
import { m } from 'motion/react';
import {
  Phone,
  MapPin,
  Star,
  ShieldCheck,
  CalendarCheck,
  Wallet,
  Camera,
  Gauge,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Glass } from '@/components/Glass';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { PHONE_E164 as PHONE, PHONE_DISPLAY } from '@/lib/contact';
import { largoFaqs } from '@/pages/largoFaqs';
import { CtaBand } from '@/components/CtaBand';
import LargoBelowFold from '@/pages/LargoBelowFold';
import { usePageMeta, FONTS, NAV_FONTS } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Title: keyword + city first, then a click hook distinct from the other city
// pages (St. Pete Beach = "Salt-Tested", Seminole = "Pool You Actually Live
// With"). Largo's whole angle is honesty/flat-rate, so the hook is the one
// homeowners scanning results care about most — "No Surprises". 51 chars.
const PAGE_TITLE = 'Largo Pool Service — Flat-Rate Weekly, No Surprises';
// 155 chars. Leads with the local keyword, stacks the click-drivers (flat rate,
// chemicals included, same tech), and names the distinct angle (established homes
// / equipment watched / no upsells) to pre-qualify the click.
const PAGE_DESC =
  'Weekly pool service in Largo, FL — flat rate, chemicals included, same tech weekly. Established-home pools kept clear, aging equipment watched, no upsells.';
const PAGE_URL = 'https://suncoastpoolpros.com/largo-fl/';

// The "Largo at a glance" hero card — the distinct hero element (no phone mockup
// like the beach pages, no horizontal stat tiles like Seminole). A vertical
// spec card that doubles as a trust summary. Desktop only; mobile gets a compact
// inline strip instead (keeps the above-the-fold hero short on phones).
const GLANCE = [
  { icon: CalendarCheck, label: 'Same dedicated tech', sub: 'every week, set day' },
  { icon: Wallet, label: 'One flat rate', sub: 'standard chemicals included' },
  { icon: Gauge, label: 'Equipment checked', sub: 'every single visit' },
  { icon: Camera, label: 'Photo report', sub: 'after every clean' },
  { icon: ShieldCheck, label: 'Always Blue Guarantee', sub: 'we come back if it drifts' },
];

const HeroSection = () => {
  const { open } = useQuoteSheet();
  const handleQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    open();
  };

  return (
    <div className="relative min-h-dvh flex items-center overflow-hidden pt-24 pb-16">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#02060c]" />
        <div className="hero-bg-largo-desktop absolute inset-0 hidden md:block bg-cover bg-center" aria-hidden />
        <div className="hero-bg-largo-mobile absolute inset-0 md:hidden bg-cover bg-center" aria-hidden />
        {/* Single merged readability scrim (class, not inline style — CLAUDE.md #4). */}
        <div className="hero-largo-scrim absolute inset-0 pointer-events-none" aria-hidden />
        {/* Ambient brand glows — desktop only (mobile blur ban). */}
        <div className="hidden md:block absolute top-[14%] left-[-10%] w-[40vw] h-[40vw] bg-brand-orange/[0.10] rounded-full blur-[150px] animate-float" />
        <div className="hidden md:block absolute bottom-[-12%] right-[-8%] w-[40vw] h-[40vw] bg-brand-blue/[0.10] rounded-full blur-[150px] animate-morph" />
        {/* Bottom seam into the next #07111c section. */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07111c] via-[#07111c]/70 to-transparent pointer-events-none" />
      </div>

      <Container className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-7"
          >
            <Glass className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8">
              <MapPin className="w-3.5 h-3.5 text-brand-orange-light" />
              <span className="text-xs font-semibold text-cyan-50 tracking-wider uppercase">
                Largo · Heart of Pinellas
              </span>
            </Glass>

            {/* Visual headline — a div, so the SEO h1 below carries keyword weight. */}
            <div className="text-shadow-city-h1 font-display font-bold md:font-black text-white tracking-tight mb-5 leading-[1.05]">
              <span className="block text-[2.75rem] sm:text-6xl md:text-[3.9rem] leading-[1.02]">
                Straight answers.
              </span>
              <span className="block text-[2.75rem] sm:text-6xl md:text-[3.9rem] leading-[1.02]">
                <span className="text-brand-orange-light">Clear water.</span>
              </span>
            </div>

            {/* SEO H1 — local keyword for this city page. */}
            <h1 className="text-shadow-city-h1 font-display font-normal text-white/85 text-[17px] sm:text-lg md:text-[1.1875rem] leading-snug mb-5 tracking-tight">
              Weekly pool service in Largo, FL.
            </h1>

            <p className="text-shadow-city-body md:hidden text-[15px] text-gray-200 max-w-[34rem] leading-[1.6] mb-7">
              Honest, flat-rate pool care for Largo's established homes —{' '}
              <span className="text-white">same tech weekly, chemicals included, and your equipment actually watched</span>.
            </p>
            <p className="text-shadow-city-body hidden md:block text-[15px] sm:text-base text-gray-200 font-normal max-w-[38rem] leading-[1.65] mb-7">
              Largo's the established heart of Pinellas — older homes, and plenty of
              pools and equipment with some age on them. We give them an honest
              weekly service: <span className="text-white">the same dedicated tech</span>,
              all standard chemicals in one flat rate, your equipment checked every
              visit, and a straight answer when something needs attention.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <a href="#quote" onClick={handleQuote} className="btn btn-blue">
                Get a Free Quote
              </a>
              <Glass
                href={`tel:${PHONE}`}
                className="glass-mobile-blur inline-flex items-center justify-center gap-2 px-6 py-3 text-white/90 hover:text-white rounded-lg font-semibold text-[15px]"
              >
                <Phone className="w-4 h-4 text-brand-blue-light" />
                {PHONE_DISPLAY}
              </Glass>
            </div>

            <p className="mt-4 text-[13px] text-gray-400">
              No contracts · Cancel anytime · No commission-driven upsells.
            </p>

            {/* Mobile-only compact trust strip (the card is desktop-only). */}
            <div className="lg:hidden mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-gray-400">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5 text-brand-orange">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-semibold text-white/90">5.0</span>
                <span className="text-gray-500">on Google</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-orange-light" />
                <span>Always Blue Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-brand-orange-light" />
                <span>Equipment checked weekly</span>
              </div>
            </div>
          </m.div>

          {/* Right column: the "Largo at a glance" spec card. DESKTOP ONLY (lg+). */}
          <m.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
            className="hidden lg:block lg:col-span-5"
          >
            <div className="glass-panel rounded-2xl p-7 relative overflow-hidden">
              <div className="absolute -top-20 -right-16 w-44 h-44 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/10">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-orange-light mb-1">
                      Largo at a glance
                    </p>
                    <p className="text-white font-display font-bold text-lg leading-tight">
                      What weekly service gets you
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex gap-0.5 text-brand-orange justify-end mb-0.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-[12px] text-gray-400">
                      <span className="font-semibold text-white/90">5.0</span> on Google
                    </p>
                  </div>
                </div>

                <ul className="space-y-3.5">
                  {GLANCE.map((g) => (
                    <li key={g.label} className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                        <g.icon className="w-5 h-5 text-brand-orange-light" />
                      </div>
                      <div className="leading-tight">
                        <p className="text-white font-semibold text-[15px]">{g.label}</p>
                        <p className="text-gray-400 text-[13px]">{g.sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 pt-5 border-t border-white/10 text-[13px] text-gray-400 text-center">
                  One flat monthly rate. No contracts, cancel anytime.
                </p>
              </div>
            </div>
          </m.div>
        </div>
      </Container>
    </div>
  );
};

// JSON-LD (LocalBusiness + FAQPage + Breadcrumb) injected client-side. Title,
// description, canonical, and OG come from usePageMeta (SSR'd into the
// prerendered HTML); usePageMeta doesn't do JSON-LD, so this effect adds it.
// See CLAUDE.md #9.
const usePageSchema = () => {
  useEffect(() => {
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': 'https://suncoastpoolpros.com/#business',
        name: 'Suncoast Pool Pros',
        url: PAGE_URL,
        telephone: '+1-727-295-3621',
        priceRange: '$$',
        areaServed: [
          { '@type': 'City', name: 'Largo', addressRegion: 'FL' },
          { '@type': 'Place', name: 'Largo Central, FL' },
          { '@type': 'Place', name: 'Harbor Bluffs, FL' },
          { '@type': 'Place', name: 'East Bay, FL' },
          { '@type': 'Place', name: 'Highland Lakes, FL' },
        ],
        description:
          'Honest, flat-rate weekly pool service for Largo, FL — the established residential heart of Pinellas. Same dedicated technician, aging equipment watched and serviced, chemicals included, photo report after every visit, no commission-driven upsells.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: largoFaqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Largo', path: '/largo-fl/' },
      ]),
    ]);
    document.head.appendChild(ld);
    return () => ld.remove();
  }, []);
};

export const LargoPage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/largo-fl/',
    ogImage: '/pool-service-st-petersburg-hero.jpg',
    // Placeholder photo (shared residential-pool hero) until a dedicated Largo
    // image is uploaded — only the hero-bg-largo-* url()s in index.css and these
    // heroPreload paths need to change when it is.
    heroPreload: {
      mobile: '/pool-service-st-petersburg-hero-mobile.webp',
      desktop: '/pool-service-st-petersburg-hero.webp',
      wide: '/pool-service-st-petersburg-hero-1920.webp',
    },
    // Above-the-fold fonts: nav (Inter 600 + Montserrat 700), hero body (Inter
    // 400), SEO H1 (font-normal display = Montserrat 400). Big headline is
    // font-bold md:font-black — Montserrat 700 on mobile, 900 at md+ — so preload
    // 900 only at md so mobile never fetches it.
    fontPreload: [
      ...NAV_FONTS,
      FONTS.inter400,
      FONTS.montserrat400,
      { href: FONTS.montserrat900, media: '(min-width: 768px)' },
    ],
  });
  usePageSchema();

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <LargoBelowFold />
        <CtaBand />
        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};
