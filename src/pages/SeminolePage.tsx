import React, { useEffect } from 'react';
import { m } from 'motion/react';
import { Phone, MapPin, Star, Camera, CalendarCheck, Wallet } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Glass } from '@/components/Glass';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { PHONE_E164 as PHONE, PHONE_DISPLAY } from '@/lib/contact';
import { seminoleFaqs } from '@/pages/seminoleFaqs';
import { CtaBand } from '@/components/CtaBand';
import SeminoleBelowFold from '@/pages/SeminoleBelowFold';
import { SeminoleCoverageMap } from '@/components/SeminoleCoverageMap';
import { usePageMeta, FONTS, NAV_FONTS } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

const PAGE_TITLE = 'Seminole Pool Service — The Pool You Actually Live With';
const PAGE_DESC =
  'Weekly pool service in Seminole, FL — Bardmoor, Seminole Lake, Oakhurst & Bay Pines. Built for full-time homes that actually use the pool: same dedicated tech, screen-enclosure debris handled, flat rate with chemicals included, photo report every visit.';
const PAGE_URL = 'https://suncoastpoolpros.com/seminole-fl/';

// Hero stat tiles — replaces the beach pages' inline star/trust strip with a
// distinct tiled row, framed for full-time residents (not absentee owners).
const HERO_STATS = [
  { icon: CalendarCheck, label: 'Same tech', sub: 'every week' },
  { icon: Camera, label: 'Photo report', sub: 'every visit' },
  { icon: Wallet, label: 'Flat rate', sub: 'chemicals included' },
  { icon: MapPin, label: '33772–33778', sub: 'all of Seminole' },
];

// Distinct hero: a single left-aligned column (no phone mockup, no 7/5 grid that
// the four beach pages share) capped by a horizontal stat-tile strip. Keeps the
// brand palette + Glass/Container components, different composition.
const HeroSection = () => {
  const { open } = useQuoteSheet();
  const handleQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    open();
  };

  return (
    <div className="relative min-h-dvh flex items-center overflow-hidden pt-24 pb-14">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#02060c]" />
        <div className="hero-bg-seminole-desktop absolute inset-0 hidden md:block bg-cover bg-center" aria-hidden />
        <div className="hero-bg-seminole-mobile absolute inset-0 md:hidden bg-cover bg-center" aria-hidden />
        {/* Single merged readability scrim (class, not inline style — see CLAUDE.md #4). */}
        <div className="hero-seminole-scrim absolute inset-0 pointer-events-none" aria-hidden />
        {/* Ambient brand glows — desktop only (mobile blur ban). */}
        <div className="hidden md:block absolute top-[12%] left-[-10%] w-[40vw] h-[40vw] bg-brand-blue/[0.10] rounded-full blur-[150px] animate-float" />
        <div className="hidden md:block absolute bottom-[-10%] right-[-8%] w-[38vw] h-[38vw] bg-brand-orange/[0.08] rounded-full blur-[150px] animate-morph" />
        {/* Bottom seam into the next #07111c section. */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07111c] via-[#07111c]/70 to-transparent pointer-events-none" />
      </div>

      <Container className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="lg:col-span-7"
        >
          {/* Top row — locale badge + a light social-proof rating, side by side. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-7">
            <Glass className="inline-flex items-center gap-2 px-4 py-2 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-brand-orange-light" />
              <span className="text-xs font-semibold text-cyan-50 tracking-wider uppercase">
                Seminole · Mid-Pinellas
              </span>
            </Glass>
            <div className="inline-flex items-center gap-2">
              <div className="flex gap-0.5 text-brand-orange">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-[13px]">
                <span className="font-semibold text-white/90">5.0</span>{' '}
                <span className="text-gray-400">on Google</span>
              </span>
            </div>
          </div>

          {/* Visual headline — a div, so the SEO h1 below carries keyword weight. */}
          <div className="text-shadow-city-h1 font-display font-bold md:font-black text-white tracking-tight mb-5 leading-[1.05]">
            <span className="block text-[2.75rem] sm:text-6xl md:text-[4rem] lg:text-[3.5rem] xl:text-[3.9rem] leading-[1.02]">
              The pool you
            </span>
            <span className="block text-[2.75rem] sm:text-6xl md:text-[4rem] lg:text-[3.5rem] xl:text-[3.9rem] leading-[1.02]">
              actually <span className="text-brand-orange-light">live with.</span>
            </span>
          </div>

          {/* SEO H1 — local keyword for this city page. */}
          <h1 className="text-shadow-city-h1 font-display font-normal text-white/85 text-[17px] sm:text-lg md:text-[1.1875rem] leading-snug mb-5 tracking-tight">
            Weekly pool service in Seminole, FL.
          </h1>

          <p className="text-shadow-city-body md:hidden text-[15px] text-gray-200 max-w-[34rem] leading-[1.6] mb-7">
            For full-time Seminole homes — <span className="text-white">families and retirees who use the pool year-round</span>. Same tech weekly, flat rate, chemicals included.
          </p>
          <p className="text-shadow-city-body hidden md:block text-[15px] sm:text-base text-gray-200 font-normal max-w-[38rem] leading-[1.65] mb-7">
            Not a beach rental, not a second home you visit twice a year — the pool
            the kids and grandkids actually swim in. From{' '}
            <span className="text-white">Bardmoor to Seminole Lake to Oakhurst</span>,
            you get the same dedicated technician every week, all standard chemicals
            included in one flat rate, and a photo report after every visit.
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
            No contracts · Cancel anytime · A local, Pinellas-based crew.
          </p>

          {/* Trust stats — borderless icon+text so they read as facts, not
              buttons. The call CTA is the only glass pill in the hero, so these
              can't be mistaken for it. Anchored by a hairline above. */}
          <div className="mt-8 pt-7 border-t border-white/10 grid grid-cols-2 gap-x-6 gap-y-5 max-w-md">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                  <s.icon className="w-[18px] h-[18px] text-brand-orange-light" />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-white font-semibold text-sm whitespace-nowrap">{s.label}</div>
                  <div className="text-gray-400 text-[12px]">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </m.div>

        {/* Coverage map — the Seminole-only hero visual. Desktop/lg+ only; the
            mobile hero is already content-rich and stays single-column. */}
        <div className="hidden lg:flex lg:col-span-5 justify-center items-center relative">
          <SeminoleCoverageMap />
        </div>
        </div>
      </Container>
    </div>
  );
};

// JSON-LD (LocalBusiness + FAQPage + Breadcrumb) injected client-side. Title,
// description, canonical, and OG are handled by usePageMeta (which runs during
// SSR so they land in the prerendered HTML); usePageMeta doesn't do JSON-LD, so
// this effect adds it. See CLAUDE.md #9.
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
          { '@type': 'City', name: 'Seminole', addressRegion: 'FL' },
          { '@type': 'Place', name: 'Bardmoor, FL' },
          { '@type': 'Place', name: 'Bay Pines, FL' },
          { '@type': 'Place', name: 'Seminole Lake, FL' },
        ],
        description:
          'Reliable weekly pool service for full-time Seminole, FL homes — families and year-round residents. Same dedicated technician, screen-enclosure debris handled, flat rate with chemicals included, photo report after every visit.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: seminoleFaqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Seminole', path: '/seminole-fl/' },
      ]),
    ]);
    document.head.appendChild(ld);
    return () => ld.remove();
  }, []);
};

export const SeminolePage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/seminole-fl/',
    ogImage: '/pool-service-st-petersburg-hero.jpg',
    // Placeholder photo (shared residential-pool hero) until a dedicated Seminole
    // image is uploaded — only the hero-bg-seminole-* url()s in index.css and
    // these heroPreload paths need to change when it is.
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
        <SeminoleBelowFold />
        <CtaBand />
        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};
