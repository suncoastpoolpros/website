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

const PAGE_TITLE =
  'Treasure Island Pool Service | One Flat Rate, All Year';
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
    <div className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
      {/* Immersive Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* Near-black base with a hint of cool undertone */}
        <div className="absolute inset-0 bg-[#02060c]" />

        {/* Pool background — desktop (landscape crop) */}
        <div
          className="absolute -inset-y-[18%] inset-x-0 hidden md:block bg-cover bg-center"
          style={{
            backgroundImage:
              "image-set(url('/treasure-island-hero.webp') type('image/webp') 1x, url('/treasure-island-hero-1920.webp') type('image/webp') 2x, url('/treasure-island-hero.jpg') type('image/jpeg') 1x)",
            filter: 'saturate(1.45) brightness(0.85) contrast(1.12) hue-rotate(-6deg)',
          }}
          aria-hidden
        />

        {/* Pool background — mobile. Covers the full section (not just viewport)
            so the photo extends past the fold and the pool stays visible behind
            the CTAs / rating strip instead of cutting to solid dark mid-section. */}
        <div
          className="absolute inset-0 md:hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "image-set(url('/treasure-island-hero-mobile.webp') type('image/webp'), url('/treasure-island-hero-mobile.jpg') type('image/jpeg'))",
            filter: 'saturate(1.45) brightness(0.85) contrast(1.12) hue-rotate(-6deg)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
          }}
          aria-hidden
        />

        {/* Blue tint pass — 'overlay' blend deepens the blue in the sky, clouds,
            and water without darkening the warm house lights. Hidden on mobile. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: '#1669AE', mixBlendMode: 'overlay', opacity: 0.4 }}
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
        <div className="absolute top-[35%] right-[12%] w-[45vw] h-[55vh] bg-brand-orange/14 rounded-full blur-[130px] animate-float" />

        {/* Deep-blue ambient — moved to lower-left for asymmetric balance */}
        <div className="absolute bottom-[5%] left-[-15%] w-[45vw] h-[45vw] bg-[#0a2540]/35 rounded-full blur-[130px] animate-morph" />

        {/* Softer vignette — wider transparent core, less aggressive edge falloff */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_75%_at_center,transparent_0%,transparent_65%,rgba(5,11,20,0.45)_100%)] pointer-events-none" />

        {/* Bottom blend: solid on the left (under the text column) so the seam
            into the next section stays invisible there; fades out toward the
            right so the pool in the lower-right stays visible. */}
        <div
          className="absolute inset-x-0 bottom-0 h-80 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, #07111c 25%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, black 0%, black 45%, rgba(0,0,0,0.35) 75%, transparent 100%)',
            maskImage:
              'linear-gradient(to right, black 0%, black 45%, rgba(0,0,0,0.35) 75%, transparent 100%)',
          }}
        />

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
            <div className="font-display font-black text-white tracking-tight mb-6 leading-[1.08]">
              <span className="block text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.04]">
                Guest-Ready.
              </span>
              <span className="block text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.04]">
                Year-Round.
              </span>
            </div>

            {/* SEO H1 — local keyword for this city page */}
            <h1
              className="font-display font-normal text-white/90 text-[17px] sm:text-lg md:text-[1.1875rem] leading-snug mb-5 tracking-tight"
              style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
            >
              Weekly pool service in Treasure Island, FL.
            </h1>

            <p
              className="text-[15px] sm:text-base text-gray-200 font-normal max-w-[38rem] leading-[1.65] mb-7"
              style={{ textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}
            >
              Vacation rentals, Airbnbs, and snowbird homes from{' '}
              <span className="text-white">Sunset Beach to Isle of Capri</span> —
              maintained on a structured weekly schedule with a photo report after every
              visit. Guest-ready between bookings, protected when the house is empty.
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

          {/* Right column: the phone mockup. Lazy-loaded. On mobile it renders
              below the text column (centered) so the hero still feels complete;
              on lg+ it sits to the right in the 5-col slot. */}
          <div className="lg:col-span-5 flex justify-center items-center relative mt-8 lg:mt-0">
            <TreasureIslandHeroPhone />
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

    return () => {
      document.title = prevTitle;
      cleanups.forEach((fn) => fn());
      ld.remove();
    };
  }, []);
};

export const TreasureIslandPage = () => {
  usePageSeo();

  return (
    <div className="min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <TreasureIslandBelowFold />
        <CtaBand />
        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};
