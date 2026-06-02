import React, { useEffect } from 'react';
import { m } from 'motion/react';
import { Phone, Star, MapPin, ShieldCheck, KeyRound } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Glass } from '@/components/Glass';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { PHONE_E164 as PHONE, PHONE_DISPLAY } from '@/lib/contact';
import { treasureIslandFaqs } from '@/pages/treasureIslandFaqs';
import { CtaBand } from '@/components/CtaBand';
import { TreasureIslandHeroPhone } from '@/components/TreasureIslandHeroPhone';
import TreasureIslandBelowFold from '@/pages/TreasureIslandBelowFold';
import { usePageMeta, FONTS, NAV_FONTS } from '@/lib/usePageMeta';

const PAGE_TITLE =
  'Treasure Island Pool Service — Always Guest-Ready';
const PAGE_DESC =
  'Weekly pool care across Treasure Island — Sunset Beach to Isle of Capri. Whether you live here, rent it out, or come down each winter, you get the same tech, the same flat rate, and a photo report after every visit.';
const PAGE_URL = 'https://suncoastpoolpros.com/treasure-island-fl/';

const HeroSection = () => {
  const { open } = useQuoteSheet();
  const handleQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    open();
  };

  return (
    <div className="relative min-h-dvh flex items-center overflow-hidden pt-24 pb-16">
      {/* Immersive Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* Near-black base with a hint of cool undertone */}
        <div className="absolute inset-0 bg-[#02060c]" />

        {/* Pool background — desktop (landscape crop) */}
        <div
          className="hero-bg-treasure-desktop absolute -inset-y-[18%] inset-x-0 hidden md:block bg-cover bg-center"
          aria-hidden
        />

        {/* Pool background — mobile. Covers the full section (not just viewport)
            so the photo extends past the fold and the pool stays visible behind
            the CTAs / rating strip instead of cutting to solid dark mid-section. */}
        <div
          className="hero-bg-treasure-mobile absolute inset-0 md:hidden bg-cover bg-center"
          aria-hidden
        />

        {/* Blue tint pass — 'overlay' blend deepens the blue in the sky, clouds,
            and water without darkening the warm house lights. Hidden on mobile. */}
        <div
          className="hero-treasure-tint absolute inset-0 pointer-events-none"
          aria-hidden
        />

        {/* Gradient overlay — stronger mid-section darkening on mobile so the
            stacked body copy stays readable over the bright water/sky area.
            Desktop keeps the lighter pass since the left scrim does the heavy
            lifting there. */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02060c]/35 via-[#04090f]/50 to-[#07111c] md:from-[#02060c]/20 md:via-[#04090f]/55" />

        {/* Mobile readability scrim — top-down wash sitting only over the upper
            half of the section. Lifts contrast on headline + paragraph while
            leaving the lower half open so the pool stays visible behind the CTAs. */}
        <div className="md:hidden absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-[#02060c]/45 via-[#02060c]/30 to-transparent pointer-events-none" />

        {/* Left scrim — DESKTOP ONLY. On mobile the layout is centered/stacked,
            so a left scrim would just crush the whole image. */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#02060c]/70 via-[#02060c]/20 to-transparent pointer-events-none" />

        {/* Spotlight glow behind the phone — lower and pulled in toward center */}
        <div className="hidden md:block absolute top-[35%] right-[12%] w-[45vw] h-[55vh] bg-brand-orange/14 rounded-full blur-[130px] animate-float" />

        {/* Deep-blue ambient — moved to lower-left for asymmetric balance */}
        <div className="hidden md:block absolute bottom-[5%] left-[-15%] w-[45vw] h-[45vw] bg-[#0a2540]/35 rounded-full blur-[130px] animate-morph" />

        {/* Softer vignette — wider transparent core, less aggressive edge falloff */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_75%_at_center,transparent_0%,transparent_65%,rgba(5,11,20,0.45)_100%)] pointer-events-none" />

        {/* Bottom blend: solid on the left (under the text column) so the seam
            into the next section stays invisible there; fades out toward the
            right so the pool in the lower-right stays visible. */}
        <div className="hero-treasure-bottom-blend absolute inset-x-0 bottom-0 h-80 pointer-events-none" />

        {/* Tiny solid sliver at the very bottom edge so the section still seams
            cleanly into the next #07111c block on the right side. */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#07111c] to-transparent pointer-events-none" />
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
              <MapPin className="w-3.5 h-3.5 text-brand-orange-light" />
              <span className="text-xs font-semibold text-cyan-50 tracking-wider uppercase">
                Treasure Island · Gulf Beach Community
              </span>
            </Glass>

            {/* Visual headline — a div, so the SEO h1 below carries keyword weight */}
            <div className="font-display font-bold md:font-black text-white tracking-tight mb-6 leading-[1.08]">
              <span className="block text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.04]">
                Guest-Ready.
              </span>
              <span className="block text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.04]">
                Year-Round.
              </span>
            </div>

            {/* SEO H1 — local keyword for this city page */}
            <h1 className="text-shadow-city-h1 font-display font-normal text-white/90 text-[17px] sm:text-lg md:text-[1.1875rem] leading-snug mb-5 tracking-tight">
              Weekly pool service in Treasure Island, FL.
            </h1>

            <p className="text-shadow-city-body text-[15px] sm:text-base text-gray-200 font-normal max-w-[38rem] leading-[1.65] mb-7">
              Vacation rentals, Airbnbs, and snowbird homes from{' '}
              <span className="text-white">Sunset Beach to Isle of Capri</span> —
              weekly service with a photo report after every visit. Guest-ready
              between bookings, protected when empty.
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
              Out of town? Text or call any time — we work with absentee owners every day.
            </p>

            {/* Trust strip — adds a rental-specific signal */}
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
                <ShieldCheck className="w-4 h-4 text-brand-orange-light" />
                <span>Always Blue Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-orange-light" />
                <span>Trusted by local property managers</span>
              </div>
            </div>
          </m.div>

          {/* Right column: the phone mockup. DESKTOP ONLY (lg+) — it sits in the
              5-col slot beside the text. On mobile it's pulled out of the hero
              into its own section below (see TreasureIslandHeroSection's sibling)
              so the hero is a clean 100vh of text/CTAs and the phone never sits
              above the fold competing for paint. */}
          <div className="hidden lg:flex lg:col-span-5 justify-center items-center relative">
            <TreasureIslandHeroPhone />
          </div>
        </div>
      </Container>
    </div>
  );
};

// Mobile-only phone-mockup section, rendered immediately after the hero. Keeps
// the heavy phone out of the above-the-fold 100vh hero on phones; on lg+ the
// phone lives inside the hero grid instead (this section is hidden there).
const PhoneShowcaseMobile = () => (
  <section className="lg:hidden relative bg-[#07111c] py-12 flex justify-center">
    <TreasureIslandHeroPhone />
  </section>
);

// JSON-LD (LocalBusiness + FAQPage) injected client-side. Title, description,
// canonical, and OG tags are handled by usePageMeta (which runs during SSR so
// they land in the prerendered HTML); usePageMeta doesn't do JSON-LD, so this
// effect adds it.
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
        areaServed: { '@type': 'City', name: 'Treasure Island', addressRegion: 'FL' },
        description:
          'Reliable weekly pool service for Treasure Island vacation rentals, Airbnbs, and second homes — same dedicated technician, photo report after every visit.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: treasureIslandFaqs.map((f) => ({
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

export const TreasureIslandPage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/treasure-island-fl/',
    ogImage: '/waterfront-pool-st-petersburg.jpg',
    heroPreload: {
      mobile: '/treasure-island-mobile-sunset.webp',
      desktop: '/waterfront-pool-st-petersburg.webp',
      wide: '/waterfront-pool-st-petersburg-1920.webp',
    },
    // Above-the-fold: nav (Inter 600 + Montserrat 700), hero body (Inter 400),
    // H1 (Montserrat 400). The big headline is font-bold md:font-black — i.e.
    // Montserrat 700 on mobile, 900 on desktop — so preload 900 only at md+;
    // mobile never fetches it.
    fontPreload: [
      ...NAV_FONTS,
      FONTS.inter400,
      FONTS.montserrat400,
      { href: FONTS.montserrat900, media: '(min-width: 768px)' },
    ],
  });
  usePageSchema();

  // Mobile JS-motion stripping is handled globally by the app-level MotionConfig
  // in App.tsx (+ the force-visible mobile CSS in index.css).
  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <PhoneShowcaseMobile />
        <TreasureIslandBelowFold />
        <CtaBand />
        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};
