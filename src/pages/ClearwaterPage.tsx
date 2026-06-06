import React, { useEffect } from 'react';
import { m } from 'motion/react';
import {
  Phone,
  MapPin,
  Star,
  ShieldCheck,
  Waves,
  Home,
  Droplets,
  Sun,
  Camera,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Glass } from '@/components/Glass';
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
const PAGE_TITLE = 'Clearwater Pool Service — Water Worthy of the Name';
// ~157 chars. Leads with the local keyword, names the duality that defines
// Clearwater (barrier-island beach + established mainland) with real place
// names, then stacks the click-drivers (same tech, flat rate, chemicals in,
// clear water).
const PAGE_DESC =
  'Weekly pool service in Clearwater, FL — from Clearwater Beach and Sand Key to Countryside. Same tech weekly, flat rate, chemicals included, water kept clear.';
const PAGE_URL = 'https://suncoastpoolpros.com/clearwater-fl/';

// The signature hero visual: a "two sides of Clearwater, one standard" card.
// Clearwater is uniquely two towns sharing a name — a barrier-island beach world
// and a big established mainland — so the hero element makes that the story
// (NOT Largo's vertical spec list, NOT Seminole's pin map). Doubles as
// above-the-fold local-SEO: it names real neighborhoods in both zones. Desktop
// only; mobile gets a compact inline strip so the hero stays short on phones.
const ZONES = [
  {
    icon: Waves,
    kicker: 'The Beach & Islands',
    places: 'Clearwater Beach · Sand Key · Island Estates',
    note: 'Salt systems, full Gulf sun & blowing sand — handled.',
  },
  {
    icon: Home,
    kicker: 'The Mainland',
    places: 'Countryside · Morningside · Del Oro · Skycrest',
    note: 'Screened cages and big-oak debris — handled.',
  },
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
        <div className="hero-bg-clearwater-desktop absolute inset-0 hidden md:block bg-cover bg-center" aria-hidden />
        <div className="hero-bg-clearwater-mobile absolute inset-0 md:hidden bg-cover bg-center" aria-hidden />
        {/* Single merged readability scrim (class, not inline style — CLAUDE.md #4). */}
        <div className="hero-clearwater-scrim absolute inset-0 pointer-events-none" aria-hidden />
        {/* Ambient brand glows — desktop only (mobile blur ban). Cooler/cyan-led
            mix here than the inland pages, to read "clear water". */}
        <div className="hidden md:block absolute top-[10%] left-[-8%] w-[42vw] h-[42vw] bg-brand-blue/[0.12] rounded-full blur-[150px] animate-float" />
        <div className="hidden md:block absolute bottom-[-12%] right-[-8%] w-[38vw] h-[38vw] bg-cyan-400/[0.07] rounded-full blur-[150px] animate-morph" />
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
                Clearwater · Beach &amp; Mainland
              </span>
            </Glass>

            {/* Visual headline — a div, so the SEO h1 below carries keyword
                weight. The town's name made into the promise. */}
            <div className="text-shadow-city-h1 font-display font-bold md:font-black text-white tracking-tight mb-5 leading-[1.05]">
              <span className="block text-[2.75rem] sm:text-6xl md:text-[3.9rem] leading-[1.02]">
                Clearwater deserves
              </span>
              <span className="block text-[2.75rem] sm:text-6xl md:text-[3.9rem] leading-[1.02]">
                <span className="text-brand-orange-light">clear water.</span>
              </span>
            </div>

            {/* SEO H1 — local keyword for this city page. */}
            <h1 className="text-shadow-city-h1 font-display font-normal text-white/85 text-[17px] sm:text-lg md:text-[1.1875rem] leading-snug mb-5 tracking-tight">
              Weekly pool service in Clearwater, FL.
            </h1>

            <p className="text-shadow-city-body md:hidden text-[15px] text-gray-200 max-w-[34rem] leading-[1.6] mb-7">
              From the beach to the mainland —{' '}
              <span className="text-white">same tech weekly, chemicals included, and water kept genuinely clear</span>, on one flat rate.
            </p>
            <p className="text-shadow-city-body hidden md:block text-[15px] sm:text-base text-gray-200 font-normal max-w-[38rem] leading-[1.65] mb-7">
              Clearwater is really two towns sharing a name — the barrier-island
              beach world and the big established mainland. We keep both kinds of
              pool clear: <span className="text-white">the same dedicated tech every week</span>,
              all standard chemicals in one flat rate, your equipment checked every
              visit, and a photo report when we leave.
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
              No contracts · Cancel anytime · Beach &amp; mainland, one flat rate.
            </p>

            {/* Mobile-only compact trust strip (the dual-zone card is desktop-only). */}
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
                <Waves className="w-4 h-4 text-brand-orange-light" />
                <span>Beach &amp; islands</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-brand-orange-light" />
                <span>Mainland neighborhoods</span>
              </div>
            </div>
          </m.div>

          {/* Right column: the "two sides of Clearwater, one standard" card.
              DESKTOP ONLY (lg+). */}
          <m.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
            className="hidden lg:block lg:col-span-5"
          >
            <div className="glass-panel rounded-2xl p-7 relative overflow-hidden">
              <div className="absolute -top-20 -right-16 w-44 h-44 rounded-full bg-brand-blue/15 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/10">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-orange-light mb-1">
                      Two Clearwaters
                    </p>
                    <p className="text-white font-display font-bold text-lg leading-tight">
                      One clarity standard
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

                {/* The two zones, joined by a vertical "one standard" spine. */}
                <div className="relative space-y-4">
                  <span
                    className="absolute left-[19px] top-10 bottom-10 w-px bg-gradient-to-b from-brand-blue/40 via-white/15 to-brand-orange/40"
                    aria-hidden
                  />
                  {ZONES.map((z) => (
                    <div key={z.kicker} className="relative flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-brand-blue/10 border border-brand-blue/25 flex items-center justify-center shrink-0 relative z-10">
                        <z.icon className="w-5 h-5 text-brand-blue-light" />
                      </div>
                      <div className="leading-tight pt-0.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-1">
                          {z.kicker}
                        </p>
                        <p className="text-white font-semibold text-[14px] mb-1">{z.places}</p>
                        <p className="text-gray-400 text-[13px]">{z.note}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-center">
                  <Droplets className="w-4 h-4 text-brand-orange-light shrink-0" />
                  <p className="text-[13px] text-gray-300">
                    Same clear water, whichever Clearwater you live in.
                  </p>
                </div>
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
          { '@type': 'City', name: 'Clearwater', addressRegion: 'FL' },
          { '@type': 'Place', name: 'Clearwater Beach, FL' },
          { '@type': 'Place', name: 'Sand Key, FL' },
          { '@type': 'Place', name: 'Island Estates, FL' },
          { '@type': 'Place', name: 'Countryside, FL' },
          { '@type': 'Place', name: 'Del Oro, FL' },
        ],
        description:
          'Weekly pool service for all of Clearwater, FL — the barrier-island beach world (Clearwater Beach, Sand Key, Island Estates) and the established mainland (Countryside, Morningside, Del Oro). Same dedicated technician, salt systems and screened cages handled, flat rate with chemicals included, photo report after every visit.',
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
    ogImage: '/pool-service-st-petersburg-hero.jpg',
    // Placeholder photo (shared residential-pool hero) until a dedicated
    // Clearwater image is uploaded — only the hero-bg-clearwater-* url()s in
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
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <ClearwaterBelowFold />
        <CtaBand />
        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};
