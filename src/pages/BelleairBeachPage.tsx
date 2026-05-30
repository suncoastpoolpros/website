import React, { lazy, Suspense, useEffect } from 'react';
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

// Below-the-fold work is split off so the initial page chunk only carries the
// hero. The phone mockup is split again on top of that — it's the only thing
// pulling ServiceReport, and it's hidden below lg breakpoints, so we don't
// pay for it on mobile/tablet at all.
const BelleairBeachBelowFold = lazy(() => import('@/pages/BelleairBeachBelowFold'));
const CtaBand = lazy(() => import('@/components/CtaBand').then((m) => ({ default: m.CtaBand })));
const BelleairHeroPhone = lazy(() =>
  import('@/components/BelleairHeroPhone').then((m) => ({ default: m.BelleairHeroPhone })),
);

const PAGE_TITLE =
  'Belleair Beach Pool Service | Quiet, Reliable, Flat-Rate';
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
    <div className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
      {/* Background — coastal, calm, premium */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#02060c]" />
        <div
          className="absolute -inset-y-[18%] inset-x-0 hidden md:block bg-cover bg-center"
          style={{
            backgroundImage:
              "image-set(url('/pool-service-st-petersburg-hero.webp') type('image/webp') 1x, url('/pool-service-st-petersburg-hero-1920.webp') type('image/webp') 2x, url('/pool-service-st-petersburg-hero.jpg') type('image/jpeg') 1x)",
            filter: 'saturate(1.3) brightness(0.8) contrast(1.1) hue-rotate(-4deg)',
          }}
          aria-hidden
        />
        <div
          className="absolute top-0 inset-x-0 h-screen md:hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "image-set(url('/pool-service-st-petersburg-hero-mobile.webp') type('image/webp'), url('/pool-service-st-petersburg-hero-mobile.jpg') type('image/jpeg'))",
            filter: 'saturate(1.3) brightness(0.8) contrast(1.1) hue-rotate(-4deg)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 92%)',
            maskImage: 'linear-gradient(to bottom, black 55%, transparent 92%)',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: '#0f4d80', mixBlendMode: 'overlay', opacity: 0.45 }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02060c]/40 via-[#04090f]/55 to-[#07111c] md:via-[#04090f]/70" />
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#02060c]/85 via-[#02060c]/35 to-transparent pointer-events-none" />
        <div className="absolute top-[12%] left-[-8%] w-[45vw] h-[55vh] bg-brand-blue/15 rounded-full blur-[130px] animate-float" />
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
            <h1
              className="font-display font-normal text-white/90 text-[17px] sm:text-lg md:text-[1.1875rem] leading-snug mb-5 tracking-tight"
              style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
            >
              Discreet weekly pool service for Belleair Beach homes.
            </h1>

            <p
              className="text-[15px] sm:text-base text-gray-200 font-normal max-w-[38rem] leading-[1.65] mb-7"
              style={{ textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}
            >
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
            <Suspense fallback={<div className="w-[300px] h-[648px] scale-90" aria-hidden />}>
              <BelleairHeroPhone />
            </Suspense>
          </div>
        </div>
      </Container>
    </div>
  );
};

const usePageSeo = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = PAGE_TITLE;

    // Meta + OG tags — created if missing, restored on unmount.
    const ensureMeta = (selector: string, attrs: Record<string, string>) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      const created = !el;
      if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
      }
      const prev: Record<string, string | null> = {};
      Object.entries(attrs).forEach(([k, v]) => {
        prev[k] = el!.getAttribute(k);
        el!.setAttribute(k, v);
      });
      return () => {
        if (created) el!.remove();
        else Object.entries(prev).forEach(([k, v]) => (v === null ? el!.removeAttribute(k) : el!.setAttribute(k, v)));
      };
    };

    const cleanups = [
      ensureMeta('meta[name="description"]', { name: 'description', content: PAGE_DESC }),
      ensureMeta('meta[property="og:title"]', { property: 'og:title', content: PAGE_TITLE }),
      ensureMeta('meta[property="og:description"]', { property: 'og:description', content: PAGE_DESC }),
      ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' }),
      ensureMeta('meta[property="og:url"]', { property: 'og:url', content: PAGE_URL }),
      ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' }),
    ];

    // Override the homepage canonical baked into index.html so Google indexes
    // this URL on its own, not as a duplicate of /.
    const canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevCanon = canon?.getAttribute('href') ?? null;
    canon?.setAttribute('href', PAGE_URL);
    cleanups.push(() => {
      if (prevCanon !== null) canon?.setAttribute('href', prevCanon);
    });

    // JSON-LD: LocalBusiness scoped to Belleair Beach + FAQPage.
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

    return () => {
      document.title = prevTitle;
      cleanups.forEach((fn) => fn());
      ld.remove();
    };
  }, []);
};

export const BelleairBeachPage = () => {
  usePageSeo();

  return (
    <div className="min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#1669AE] selection:text-white">
      <div className="fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        {/* Everything below the hero loads as a separate JS chunk so the
            initial page weight stays tiny and TTI / LCP win for the hero. */}
        <Suspense fallback={null}>
          <BelleairBeachBelowFold />
          <CtaBand />
        </Suspense>
        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};
