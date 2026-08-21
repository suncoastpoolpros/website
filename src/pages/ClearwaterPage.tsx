import React, { useEffect } from 'react';
import { m } from 'motion/react';
import { Phone, Star, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { HomeHeroPhoneSection } from '@/components/Hero';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { PHONE_E164 as PHONE, PHONE_DISPLAY } from '@/lib/contact';
import { clearwaterFaqs } from '@/pages/clearwaterFaqs';
import { CtaBand } from '@/components/CtaBand';
import ClearwaterBelowFold from '@/pages/ClearwaterBelowFold';
import { usePageMeta, FONTS, NAV_FONTS } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Title: keyword + city first, then a hook distinct from every other city page
// (Largo = "No Surprises", Seminole = "Pool You Actually Live With", St. Pete
// Beach = "Salt-Tested"). Clearwater's whole angle is the name itself — the town
// named for clear water, held to it — so the hook leans on that wordplay:
// "Water Worthy of the Name." 50 chars.
const PAGE_TITLE = 'Clearwater Pool Service — Flat-Rate, Always Clear';
// ~153 chars. Leads with the local keyword, names the duality that defines
// Clearwater (barrier-island beach + established mainland) with real place
// names, then stacks the click-drivers (consistent techs, flat rate, chemicals
// in, clear water).
const PAGE_DESC =
  'Weekly pool service in Clearwater, FL — Clearwater Beach & Sand Key to Countryside. Consistent techs, flat rate, chemicals included, crystal-clear water.';
const PAGE_URL = 'https://suncoastpoolpros.com/clearwater-fl/';

const HeroSection = () => {
  const { open } = useQuoteSheet();
  const handleQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    open();
  };

  return (
    <section className="relative min-h-dvh flex items-center overflow-hidden pt-28 pb-20 md:pb-28">
      {/* Bright "clear water" photo, scrim darkening the left + top for the
          oversized type and the transparent navbar, fading into the navy band
          below. Base navy shows only behind any photo gaps. */}
      <div className="absolute inset-0 z-0 bg-[#0a1628]">
        <div className="cw-hero-photo absolute inset-0 hidden md:block bg-cover bg-center" aria-hidden />
        <div className="cw-hero-photo-mobile absolute inset-0 md:hidden bg-cover bg-center" aria-hidden />
        <div className="cw-hero-scrim absolute inset-0 pointer-events-none" aria-hidden />
      </div>

      <Container className="relative z-10 w-full">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Centered-poster composition — the homepage hero is left-anchored;
              Clearwater's is symmetric over the open water. Eyebrow keeps its
              hard orange rules (this page's mark), now flanking both sides. */}
          <span className="flex items-center justify-center gap-3 mb-6">
            <span className="w-6 sm:w-8 h-[3px] bg-brand-orange shrink-0" aria-hidden />
            {/* Phones show just the city (the full label wrapped and stranded
                the rules); "Beach & Mainland" returns at sm and lives in the
                copy below regardless. */}
            <span className="whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.2em] text-white">
              Clearwater, FL
              <span className="hidden sm:inline"> — Beach &amp; Mainland</span>
            </span>
            <span className="w-6 sm:w-8 h-[3px] bg-brand-orange shrink-0" aria-hidden />
          </span>

          {/* Oversized headline — a div, so the SEO h1 below carries keyword
              weight. The town's name made into the promise. Width-matched
              3-line lockup (the homepage hero/logo technique): each line's
              size is "Clearwater"×k so all three span the SAME width. Ratios
              measured per weight — the block is font-bold below md (the
              preloaded Montserrat 700; black is preloaded md+ only) and
              font-black from md. */}
          <div className="text-shadow-city-h1 font-display font-bold md:font-black text-white tracking-[-0.02em] leading-[0.95] mb-6">
            <span className="block text-[2.75rem] sm:text-6xl md:text-[4.5rem] lg:text-[5.25rem]">
              Clearwater
            </span>
            <span className="block text-[3.358rem] sm:text-[4.58rem] md:text-[5.476rem] lg:text-[6.389rem]">
              deserves
            </span>
            <span className="block text-[2.588rem] sm:text-[3.53rem] md:text-[4.196rem] lg:text-[4.896rem] text-brand-orange">
              clear water.
            </span>
          </div>

          {/* SEO H1 — local keyword for this city page. */}
          <h1 className="text-shadow-city-h1 font-display font-normal text-white/90 text-lg md:text-xl leading-snug mb-5 tracking-tight">
            Weekly pool service in Clearwater, FL.
          </h1>

          {/* Mobile shows NO body paragraph (homepage pattern) — the lockup +
              the H1 keyword line carry the message. Full value prop md+. */}
          <p className="text-shadow-city-body hidden md:block text-base text-white/85 max-w-[36rem] mx-auto leading-[1.65] mb-8">
            Clearwater is really two towns sharing a name — the barrier-island beach world and the big
            established mainland. We keep both kinds of pool clear:{' '}
            <span className="text-white font-medium">familiar faces on a locked-in day</span>, all
            standard chemicals in one flat rate, your equipment checked every visit, and a photo
            report when we leave.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
            {/* Orange = the site's action color. A specific label ("flat-rate")
                outpulls a generic "free quote." */}
            <a
              href="#quote"
              onClick={handleQuote}
              className="btn btn-orange text-base px-7 py-3.5 font-bold shadow-xl shadow-black/30"
            >
              Get a Flat-Rate Quote
              <ArrowRight className="w-5 h-5" />
            </a>
            {/* Solid white pill — high-contrast over the photo, no blur
                (mobile blur ban). sm+ only: on phones the header's phone icon
                owns the call action (homepage pattern). */}
            <a
              href={`tel:${PHONE}`}
              className="hidden sm:inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-white text-[#0a1628] hover:bg-white/90 font-bold text-base transition-colors"
            >
              <Phone className="w-5 h-5 text-brand-blue" />
              {PHONE_DISPLAY}
            </a>
          </div>
        </m.div>
      </Container>
    </section>
  );
};

// Bold trust marquee — a full-width navy band right under the hero. High-contrast
// uppercase proof tokens separated by orange diamonds; doubles as the dark-to-
// content handoff. Wraps (not scrolls) so it never overflows on mobile.
const TRUST_TOKENS = ['One flat rate', 'No contracts', 'Chemicals included', 'Consistent techs'];
const TrustMarquee = () => (
  <div className="bg-[#0a1628] border-b border-white/10">
    <Container className="py-4 md:py-5">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:gap-x-8">
        <span className="flex items-center gap-2 text-white font-bold uppercase tracking-[0.14em] text-[12px] md:text-[13px]">
          <span className="flex gap-0.5 text-brand-orange">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </span>
          5.0 on Google
        </span>
        {TRUST_TOKENS.map((t) => (
          <span
            key={t}
            className="flex items-center gap-5 md:gap-8 text-white font-bold uppercase tracking-[0.14em] text-[12px] md:text-[13px]"
          >
            <span className="w-1.5 h-1.5 rotate-45 bg-brand-orange shrink-0" aria-hidden />
            {t}
          </span>
        ))}
      </div>
    </Container>
  </div>
);

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
        // Mirrors the neighborhoods the page itself names (Coverage section) —
        // schema and visible content must agree.
        areaServed: [
          { '@type': 'City', name: 'Clearwater', addressRegion: 'FL' },
          { '@type': 'Place', name: 'Clearwater Beach, FL' },
          { '@type': 'Place', name: 'Sand Key, FL' },
          { '@type': 'Place', name: 'Island Estates, FL' },
          { '@type': 'Place', name: 'Countryside, FL' },
          { '@type': 'Place', name: 'Morningside, FL' },
          { '@type': 'Place', name: 'Del Oro, FL' },
          { '@type': 'Place', name: 'Skycrest, FL' },
          { '@type': 'Place', name: 'Harbor Oaks, FL' },
          { '@type': 'Place', name: 'Coachman, FL' },
          { '@type': 'Place', name: 'Sunset Point, FL' },
          { '@type': 'Place', name: 'Eastwood, FL' },
          { '@type': 'Place', name: 'Feather Sound, FL' },
        ],
        description:
          'Weekly pool service for all of Clearwater, FL — the barrier-island beach world (Clearwater Beach, Sand Key, Island Estates) and the established mainland (Countryside, Morningside, Del Oro). Consistent vetted technicians, salt systems and screened cages handled, flat rate with chemicals included, photo report after every visit.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: clearwaterFaqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Clearwater', path: '/clearwater-fl/' },
      ]),
    ]);
    document.head.appendChild(ld);
    return () => ld.remove();
  }, []);
};

export const ClearwaterPage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/clearwater-fl/',
    // Placeholder photo (shared residential-pool hero) until a dedicated
    // Clearwater image is uploaded — only the cw-hero-photo* url()s in
    // index.css and these heroPreload paths need to change when it is.
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
    <div className="force-static-motion min-h-screen bg-white relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <Navbar />
      <HeroSection />
      <TrustMarquee />
      {/* Mobile/tablet-only interactive report showcase (lg:hidden) — the
          "Sent after every visit" phone + side scroll wheel, ported from the
          homepage. Proof right after the marquee's claims. */}
      <HomeHeroPhoneSection />
      <ClearwaterBelowFold />
      <CtaBand />
      <Footer />
      <StickyMobileCta />
    </div>
  );
};
