import React, { useEffect } from 'react';
import { m } from 'motion/react';
import { Phone, Star, MapPin, ShieldCheck, Gem } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Glass } from '@/components/Glass';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { PHONE_E164 as PHONE, PHONE_DISPLAY } from '@/lib/contact';
import { snellIsleFaqs } from '@/pages/snellIsleFaqs';
import { CtaBand } from '@/components/CtaBand';
import { SnellIsleHeroPhone } from '@/components/SnellIsleHeroPhone';
import SnellIsleBelowFold from '@/pages/SnellIsleBelowFold';
import { usePageMeta, FONTS, NAV_FONTS } from '@/lib/usePageMeta';

const PAGE_TITLE = 'Snell Isle Pool Service — Estate-Grade, Every Week';
const PAGE_DESC =
  'Weekly pool service for Snell Isle, St. Petersburg, FL — built for estate pools: mature-canopy debris, finish-safe chemistry for pebble and tile, larger custom pools, same dedicated tech, and a photo report after every visit.';
const PAGE_URL = 'https://suncoastpoolpros.com/snell-isle-fl/';

const HeroSection = () => {
  const { open } = useQuoteSheet();
  const handleQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    open();
  };

  return (
    <div className="relative min-h-dvh flex items-center overflow-hidden pt-24 pb-16">
      {/* Background — established, bayfront-estate feel. Reuses the waterfront
          placeholder via the city hero classes; swap to a dedicated Snell Isle
          photo when one is uploaded (see heroPreload + index.css). */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#02060c]" />
        <div
          className="hero-bg-snellisle-desktop absolute -inset-y-[18%] inset-x-0 hidden md:block bg-cover bg-center"
          aria-hidden
        />
        <div
          className="hero-bg-snellisle-mobile absolute inset-0 md:hidden bg-cover bg-center"
          aria-hidden
        />

        <div
          className="hero-snellisle-tint absolute inset-0 pointer-events-none"
          aria-hidden
        />

        {/* Single readability scrim (merged gradients — see index.css). */}
        <div className="hero-snellisle-scrim absolute inset-0 pointer-events-none" aria-hidden />

        {/* Deep-blue ambient glows for the established, premium tone. */}
        <div className="hidden md:block absolute top-[18%] right-[8%] w-[42vw] h-[52vh] bg-brand-blue/14 rounded-full blur-[130px] animate-float" />
        <div className="hidden md:block absolute bottom-[5%] left-[-12%] w-[42vw] h-[42vw] bg-[#0a2540]/35 rounded-full blur-[130px] animate-morph" />

        {/* Bottom blend into the next section (#07111c). */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#07111c] from-25% via-[#07111c]/70 to-transparent pointer-events-none" />
      </div>

      <Container className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <m.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="lg:col-span-7"
          >
            <Glass className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 md:mb-8">
              <MapPin className="w-3.5 h-3.5 text-brand-blue-light" />
              <span className="text-xs font-semibold text-cyan-50 tracking-wider uppercase">
                Snell Isle · St. Petersburg Waterfront
              </span>
            </Glass>

            {/* Visual headline — a div, so the SEO h1 below carries keyword weight */}
            <div className="font-display font-black text-white tracking-tight mb-4 md:mb-6 leading-[1.08]">
              <span className="block text-[2rem] sm:text-5xl md:text-[3.4rem] leading-[1.04]">
                Pristine Water.
              </span>
              <span className="block text-[2rem] sm:text-5xl md:text-[3.4rem] leading-[1.04]">
                Every Single Week.
              </span>
            </div>

            {/* SEO H1 — local keyword for this neighborhood page */}
            <h1 className="text-shadow-city-h1 font-display font-normal text-white/90 text-xl md:text-[1.25rem] leading-snug mb-3 md:mb-5 tracking-tight">
              Weekly pool service in Snell Isle, St. Petersburg, FL.
            </h1>

            {/* Mobile: tighter line, still keyword-complete (Snell Isle + finish-
                safe chemistry + photo report). Full local copy with the landmark
                names stays on desktop (md+) for richer local SEO. */}
            <p className="text-shadow-city-body md:hidden text-[15px] text-gray-200 max-w-[34rem] leading-[1.6] mb-5">
              <span className="text-white">Finish-safe chemistry, thorough equipment care, and a photo report after every visit</span> — built for Snell Isle's larger custom pools.
            </p>
            <p className="text-shadow-city-body hidden md:block text-[15px] sm:text-base text-gray-200 font-normal max-w-[38rem] leading-[1.65] mb-7">
              <span className="text-white">Larger custom pools, premium finishes, and a mature tree canopy</span> —
              Snell Isle pools ask more of a service than a standard backyard does. We deliver
              finish-safe chemistry, thorough debris and equipment care, and a photo report after
              every visit, from Brightwaters Blvd to Coffee Pot Bayou.
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
            <p className="mt-3 text-[13px] text-gray-400">
              Home or away for the season — call or text any time, we keep it covered either way.
            </p>

            {/* Trust strip — estate-specific signal */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-gray-400">
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
                <ShieldCheck className="w-4 h-4 text-brand-blue-light" />
                <span>Always Blue Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-brand-blue-light" />
                <span>Finish-safe chemistry</span>
              </div>
            </div>
          </m.div>

          {/* Right column: phone mockup. DESKTOP ONLY (lg+); on mobile it
              renders in its own section below the hero. */}
          <div className="hidden lg:flex lg:col-span-5 justify-center items-center relative">
            <SnellIsleHeroPhone />
          </div>
        </div>
      </Container>
    </div>
  );
};

const PhoneShowcaseMobile = () => (
  <section className="lg:hidden relative bg-[#07111c] py-12 flex justify-center">
    <SnellIsleHeroPhone />
  </section>
);

// JSON-LD (LocalBusiness + FAQPage) injected client-side. usePageMeta handles
// title/description/canonical/OG in the prerendered HTML; this slim effect adds
// the JSON-LD (the documented exception — CLAUDE.md #9).
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
        areaServed: { '@type': 'Place', name: 'Snell Isle, St. Petersburg, FL' },
        description:
          'Weekly estate pool service for Snell Isle, St. Petersburg — finish-safe chemistry for pebble and tile, mature-canopy debris management, larger custom pools, same dedicated technician, and a photo report after every visit.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: snellIsleFaqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ]);
    document.head.appendChild(ld);
    return () => ld.remove();
  }, []);
};

export const SnellIslePage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/snell-isle-fl/',
    ogImage: '/waterfront-pool-st-petersburg.jpg',
    heroPreload: {
      mobile: '/snell-isle-mobile-sunset.webp',
      desktop: '/waterfront-pool-st-petersburg.webp',
      wide: '/waterfront-pool-st-petersburg-1920.webp',
    },
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
        <PhoneShowcaseMobile />
        <SnellIsleBelowFold />
        <CtaBand />
        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};
