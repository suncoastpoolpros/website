import React, { useEffect } from 'react';
import { m } from 'motion/react';
import { Phone, Star, MapPin, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Glass } from '@/components/Glass';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { PHONE_E164 as PHONE, PHONE_DISPLAY } from '@/lib/contact';
import { belleairBeachFaqs } from '@/pages/belleairBeachFaqs';
import { CtaBand } from '@/components/CtaBand';
import { BelleairHeroPhone } from '@/components/BelleairHeroPhone';
import BelleairBeachBelowFold from '@/pages/BelleairBeachBelowFold';
import { usePageMeta, FONTS, NAV_FONTS } from '@/lib/usePageMeta';

const PAGE_TITLE =
  'Belleair Beach Pool Service — Never a Missed Visit';
const PAGE_DESC =
  'Pool service for Belleair Beach homes that runs in the background. Same technician every week, photo report in your inbox, one flat rate.';
const PAGE_URL = 'https://suncoastpoolpros.com/belleair-beach-fl/';

const HeroSection = () => {
  const { open } = useQuoteSheet();
  const handleQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    open();
  };

  return (
    <div className="relative min-h-dvh flex items-center overflow-hidden pt-24 pb-16">
      {/* Background — coastal, calm, premium */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#02060c]" />
        <div
          className="hero-bg-belleair-desktop absolute -inset-y-[18%] inset-x-0 hidden md:block bg-cover bg-center"
          aria-hidden
        />
        <div
          className="hero-bg-belleair-mobile absolute top-0 inset-x-0 h-screen md:hidden bg-cover bg-center"
          aria-hidden
        />
        <div
          className="hero-belleair-tint absolute inset-0 pointer-events-none"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02060c]/40 via-[#04090f]/55 to-[#07111c] md:via-[#04090f]/70" />
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#02060c]/85 via-[#02060c]/35 to-transparent pointer-events-none" />
        <div className="hidden md:block absolute top-[12%] left-[-8%] w-[45vw] h-[55vh] bg-brand-blue/15 rounded-full blur-[130px] animate-float" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#07111c] from-25% to-transparent pointer-events-none" />
      </div>

      <Container className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <m.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="lg:col-span-7"
          >
            <Glass className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8">
              <MapPin className="w-3.5 h-3.5 text-brand-blue-light" />
              <span className="text-xs font-semibold text-cyan-50 tracking-wider uppercase">
                Belleair Beach · Gulf Barrier Island
              </span>
            </Glass>

            {/* Visual headline — a div, so the SEO h1 below carries keyword weight */}
            <div className="font-display font-black text-white tracking-tight mb-6 leading-[1.08]">
              <span className="block text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.04]">
                Off Your Mind.
              </span>
              <span className="block text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.04]">
                On Our Calendar.
              </span>
            </div>

            {/* SEO H1 — local keyword for this city page */}
            <h1 className="text-shadow-city-h1 font-display font-normal text-white/90 text-[17px] sm:text-lg md:text-[1.1875rem] leading-snug mb-5 tracking-tight">
              Discreet weekly pool service for Belleair Beach homes.
            </h1>

            <p className="text-shadow-city-body text-[15px] sm:text-base text-gray-200 font-normal max-w-[38rem] leading-[1.65] mb-7">
              <span className="text-white">One dedicated technician, on the same day every week</span> —
              full pool cleaning, chemistry balancing, and equipment care for Belleair Beach's
              waterfront and Gulf-front homes. Clear, balanced, and guest-ready year-round.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <a href="#quote" onClick={handleQuote} className="btn btn-blue">
                Get a Free Quote
              </a>
              <Glass
                href={`tel:${PHONE}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white/90 hover:text-white rounded-lg font-semibold text-[15px]"
              >
                <Phone className="w-4 h-4 text-brand-blue-light" />
                {PHONE_DISPLAY}
              </Glass>
            </div>
            <p className="mt-3 text-[13px] text-gray-400">
              Prefer to talk it through? Call us directly — a real person, same day.
            </p>

            {/* Trust strip */}
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
            </div>
          </m.div>

          {/* Right column: the real service-report phone mockup. Lazy-loaded
              and hidden below `lg` so mobile/tablet visitors never download
              this chunk on first paint. A fixed-size placeholder reserves
              layout space so swapping the phone in doesn't shift the hero. */}
          <div className="lg:col-span-5 hidden lg:flex justify-center items-center relative">
            <BelleairHeroPhone />
          </div>
        </div>
      </Container>
    </div>
  );
};

// JSON-LD (LocalBusiness + FAQPage) injected client-side. Title, description,
// canonical, and OG are handled by usePageMeta (which runs during SSR so they
// land in the prerendered HTML); usePageMeta doesn't do JSON-LD, so this effect
// adds it.
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
        areaServed: { '@type': 'City', name: 'Belleair Beach', addressRegion: 'FL' },
        description:
          'Discreet, reliable weekly pool cleaning and maintenance for Belleair Beach waterfront and seasonal homes.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: belleairBeachFaqs.map((f) => ({
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

export const BelleairBeachPage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/belleair-beach-fl/',
    ogImage: '/pool-service-st-petersburg-hero.jpg',
    // Belleair reuses the St. Pete hero image (see hero-bg-belleair-* in
    // index.css), so preload those — they're what this page actually paints.
    heroPreload: {
      mobile: '/pool-service-st-petersburg-hero-mobile.webp',
      desktop: '/pool-service-st-petersburg-hero.webp',
      wide: '/pool-service-st-petersburg-hero-1920.webp',
    },
    // Above-the-fold: nav (Inter 600 + Montserrat 700), hero body (Inter 400),
    // hero headline (Montserrat 900), hero H1 (font-display font-normal =
    // Montserrat 400).
    fontPreload: [...NAV_FONTS, FONTS.inter400, FONTS.montserrat400, FONTS.montserrat900],
  });
  usePageSchema();

  // Mobile JS-motion stripping is handled globally by the app-level MotionConfig
  // in App.tsx (+ the force-visible mobile CSS in index.css).
  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#1669AE] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <BelleairBeachBelowFold />
        <CtaBand />
        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};
