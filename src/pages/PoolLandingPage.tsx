import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { House, Phone, ShieldCheck } from 'lucide-react';
import { usePageMeta, FONTS } from '@/lib/usePageMeta';
import { serviceSchema, webSiteSchema } from '@/lib/businessSchema';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';
import { PHONE_DISPLAY, PHONE_HREF, SMS_QUOTE_HREF } from '@/lib/contact';
import { HeroQuoteForm } from '@/components/landing/HeroQuoteForm';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { VisitReportCard } from '@/components/landing/VisitReportCard';
import { LANDING_FAQS, LandingBelowFold } from '@/components/landing/LandingBelowFold';
import { Footer } from '@/components/Footer';
import { LandingQuoteSheetProvider } from '@/components/landing/LandingQuoteSheet';

/*
 * /landing — a standalone page in its own light look (the sc-* logo tokens in
 * index.css), with its own header and the site-wide footer. It will replace
 * the homepage; until then it's noindex.
 *
 * The hero is built on the Hormozi offer framework: call out the audience,
 * promise the dream outcome, make it believable (guarantee + proof of every
 * visit), and make starting effortless (one field).
 *
 * Radius scale: 20px photo · 14px cards, form, menus · 10px buttons, inputs,
 * tags (6px for the tag's inner chip). Spacing on the 8-point grid.
 *
 * Don't add numbers, reviews or claims beyond the ones already here.
 */

const Container = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-8 ${className}`}>{children}</div>
);

const inlineLink =
  'font-semibold text-sc-navy underline decoration-sc-navy/30 decoration-1 underline-offset-[3px] transition hover:decoration-sc-navy';

// Phones: the row wraps, and a wrapped line would start with a stray divider,
// so below sm the dividers go and the ul's gap spaces the items instead.
// Phones: three centred columns split by hairlines (one line can't hold all
// three, and wrapping left "Locally owned" alone on a second line). From sm
// up: one row, each item's divider drawn by its ::before.
const trustItem =
  'relative flex flex-col items-center gap-1 px-1.5 text-center sm:flex-row sm:gap-1.5 sm:px-0 sm:text-left sm:pl-5 sm:first:pl-0 sm:before:absolute sm:before:left-2.5 sm:before:top-1/2 sm:before:h-4 sm:before:w-px sm:before:-translate-y-1/2 sm:before:bg-sc-navy/15 sm:first:before:hidden';

// ── Photo + visit report ────────────────────────────────────────────────────

// A waterfront pool and spa under palms (supplied by the owner). Portrait 4:5
// crop of the full frame height, with the pool in the lower left: the report
// card sits over the lower right, which is open water and deck. To replace
// it, add files under NEW names (immutable image caching).
//
// Phones always get the 800px file: the frame is ~360px wide, so 800 is sharp
// at any phone density (~107 KB) instead of pulling the 1120 on 3x screens.
// Wider screens choose by density from `sizes`: 640 at 1x (75 KB), 1120 at 2x.
// visit-report-extras.js finds the img by data-hero-photo and reuses whichever
// file it loaded for the card's photo thumbnails, so they cost no download.
const PHOTO_SIZES = '(min-width: 1024px) 496px, 560px';

const HeroPhoto = () => (
  <div className="relative mx-auto w-full min-w-0 max-w-[560px] lg:max-w-none">
    <div className="relative aspect-[5/6] overflow-hidden rounded-[20px] bg-sc-sky/20 shadow-[0_40px_80px_-40px_rgba(16,32,52,0.55)] ring-1 ring-sc-navy/10 lg:aspect-auto lg:h-[min(640px,calc(100dvh-128px))]">
      <picture>
        <source media="(max-width: 767px)" type="image/webp" srcSet="/pool-waterfront-800.webp" />
        <source media="(max-width: 767px)" srcSet="/pool-waterfront-800.jpg" />
        <source
          type="image/webp"
          sizes={PHOTO_SIZES}
          srcSet="/pool-waterfront-640.webp 640w, /pool-waterfront-1120.webp 1120w"
        />
        <img
          src="/pool-waterfront-1120.jpg"
          srcSet="/pool-waterfront-640.jpg 640w, /pool-waterfront-1120.jpg 1120w"
          sizes={PHOTO_SIZES}
          alt="A sparkling blue backyard pool and spa on the water, framed by palm trees"
          width={1120}
          height={1400}
          fetchPriority="high"
          decoding="async"
          data-hero-photo=""
          data-quote-image="/pool-waterfront-1120.webp"
          className="absolute inset-0 h-full w-full object-cover [filter:brightness(1.04)_saturate(1.16)]"
        />
      </picture>
      {/* Warm, natural light: a soft-light amber wash, heavier toward the
          bottom. No sepia filter instead: it browns the greens. Sits under
          the bottom gradient and the report card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,225,140,0.08)_0%,rgba(255,215,140,0.12)_30%,rgba(255,210,140,0.30)_60%,rgba(255,210,140,0.22)_100%)] mix-blend-soft-light"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,32,52,0)_55%,rgba(16,32,52,0.28)_100%)]"
      />
    </div>

    {/* Upper-right, over the sky, so the pool stays visible. Outside the
        photo's overflow-hidden frame so that from sm up it can break the
        frame's right edge; phones keep it inside the corner. Scaled from its
        top-right corner so it shrinks into it; a little more under 360px. */}
    <div className="absolute right-3 top-3 w-[300px] origin-top-right scale-[0.8] max-[359px]:scale-[0.7] sm:-right-7 sm:top-[68px] sm:scale-[0.94]">
      <VisitReportCard />
    </div>
  </div>
);

// ── Hero ────────────────────────────────────────────────────────────────────

// On desktop the hero fills the first screen. The headline and photo scale with
// the screen's HEIGHT as well as its width, so shorter laptops still fit.
// Portrait tablets (iPad Pro, 1024 wide and ~1366 tall) don't fill it: centred
// in that much height, the content floated in empty space.
// From 1024 to 1120 the photo column (420→496px) and gap (56→88px) grow with
// the screen, so the text column holds ~475px: the width its chip, address bar
// and trust row each need to stay on one line.
const Hero = () => (
  <section className="relative bg-[#f5f9fd]">
    <Container className="grid items-center gap-12 pb-16 pt-10 sm:pt-14 lg:min-h-[calc(100dvh-64px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,clamp(420px,calc(420px_+_(100vw_-_1024px)_*_0.8),496px))] lg:gap-x-[clamp(56px,calc(56px_+_(100vw_-_1024px)_*_0.34),88px)] lg:py-8 lg:portrait:min-h-0 lg:portrait:py-20">
      {/* Phones and tablets: one centered column, like the city pages. The
          two-column desktop layout keeps it left-aligned beside the photo. */}
      <div className="hero-stagger min-w-0 text-center lg:text-left">
        {/* One line on phones too: slightly smaller type below sm fits it
            from 390px, and under that Palm Harbor drops out (it's still in
            the service-area list). Both parts stay whole: on anything
            narrower still the badge stacks them rather than breaking a
            phrase mid-way. */}
        <p className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-[999px] bg-white py-1 pl-1 pr-3 text-[12px] font-medium text-sc-navy/75 ring-1 ring-sc-navy/10 sm:gap-x-2 sm:pr-3.5 sm:text-[13px]">
          <span className="whitespace-nowrap rounded-full bg-sc-blue/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-[#1f6aa6] sm:text-[12px]">
            One flat rate
          </span>
          <span className="whitespace-nowrap">
            St. Pete · Largo · Clearwater<span className="max-[389px]:hidden"> · Palm Harbor</span>
          </span>
        </p>

        {/* The tagline is sized in em off the headline, so it scales with it. The
            size is set off the screen width on phones, off the text column
            (screen minus photo and gaps, never under the ~480px it holds
            below 1120) on desktop, and off the height so short laptops still
            fit. */}
        <hgroup className="mt-8 text-[clamp(30px,9.4vw,58px)] lg:mt-6 lg:text-[clamp(36px,min(calc(max(100vw_-_648px,480px)/9.4),7.4vh),58px)]">
          <h1 className="text-[1em] font-bold leading-[1.04] tracking-[-0.035em] text-sc-navy">
            <span className="bg-[linear-gradient(90deg,#2676b6,#3f95cc)] box-decoration-clone bg-clip-text text-transparent">
              St. Petersburg
            </span>{' '}
            {/* The space keeps the words apart for crawlers and screen readers,
                which read the <br> as nothing. */}
            <br />
            Pool Cleaning
          </h1>
          <p className="mt-3.5 text-[0.42em] font-semibold lg:mt-4 leading-tight tracking-[-0.01em] text-sc-navy/85">
            Crystal-clear water, every week.
          </p>
        </hgroup>

        <p className="mx-auto mt-4 max-w-[22rem] text-pretty text-[15.5px] leading-[1.65] text-sc-navy/[0.7] sm:max-w-[29.5rem] sm:text-lg lg:mx-0 lg:mt-5 lg:text-sc-navy/[0.74]">
          Weekly pool cleaning service with every chemical included, GPS-verified visits, and no contracts.
        </p>

        {/* Desktop: as wide as the trust row below (473px on one line), the
            column's widest line, so the form ends where the text does. */}
        {/* #quote too: the old homepage's form anchor, which outside links
            (the Business Profile, old texts) may still point at. relative
            z-10: the hero-stagger entrance gives every block in this column
            its own stacking context, so without it the lines below would
            paint over the address suggestions. */}
        <div id="quote" className="relative z-10 mx-auto mt-10 max-w-[34rem] scroll-mt-24 text-left lg:mx-0 lg:mt-10 lg:max-w-[473px]">
          {/* Inside #quote, so the hero-stagger entrance keeps its count. */}
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[12.5px] font-medium sm:gap-[14px] sm:text-[13px] text-[#5b6b80] lg:justify-start">
            {['No commitment', 'No signup', 'No contracts'].map((item) => (
              <li key={item} className="inline-flex items-center gap-[5px]">
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="inline-block shrink-0"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <div id="get-price" className="mt-[10px] scroll-mt-24">
            <HeroQuoteForm fastCta placeholder="Your pool's address" />
          </div>
        </div>

        <p className="mt-8 flex items-start justify-center gap-2 text-[14px] leading-relaxed text-sc-navy/70 sm:text-[14.5px] lg:mt-10 lg:justify-start">
          <Phone className="mt-[3px] hidden h-4 w-4 shrink-0 text-sc-navy/55 lg:block" strokeWidth={2.25} />
          <span>
            Prefer to talk? Call{' '}
            <a href={PHONE_HREF} className={`${inlineLink} whitespace-nowrap`}>
              {PHONE_DISPLAY}
            </a>{' '}
            or{' '}
            <a href={SMS_QUOTE_HREF} className={`${inlineLink} whitespace-nowrap`}>
              text us 2 photos
            </a>
            .
          </span>
        </p>

        {/* One line on desktop; each item's divider sits 10px into its 20px
            left padding, and the first item has neither. */}
        <ul className="mt-9 grid grid-cols-3 divide-x divide-sc-navy/10 text-[12px] leading-snug text-sc-navy/75 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-y-2 lg:justify-start sm:divide-x-0 sm:text-[13.5px] sm:leading-normal">
          <li className={trustItem}>
            {/* Small, tight stars: what keeps all three items on one line at
                ~1126px, where the column is 478px and the row needs ~473. */}
            <span aria-hidden="true" className="flex h-[18px] items-center text-[12.5px] tracking-[-0.02em] text-[#e8a100] sm:h-auto sm:text-[11px]">
              ★★★★★
            </span>
            <span>
              <span className="sr-only">Rated </span>
              <span className="font-semibold text-sc-navy">5.0</span>
              <span className="sr-only"> out of 5</span> on Google
            </span>
          </li>
          <li className={trustItem}>
            <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-sc-blue sm:h-4 sm:w-4" strokeWidth={2.25} />
            Always Blue guarantee
          </li>
          <li className={trustItem}>
            <House className="h-[18px] w-[18px] shrink-0 text-sc-blue sm:h-4 sm:w-4" strokeWidth={2.25} />
            Locally owned
          </li>
        </ul>
      </div>

      <HeroPhoto />
    </Container>
  </section>
);

// ── Structured data ─────────────────────────────────────────────────────────

// Written for this page's future address, the homepage: on top of the
// LocalBusiness entity that ships in index.html on every page, the homepage
// declares the WebSite, its main Service, its FAQ and a one-level breadcrumb.
// Harmless while this page is noindex; correct the day it moves to /.
//
// The Service has no price: this page deliberately shows none (the ~$150
// average only appears elsewhere beside its caveats), and structured data
// must match what's on the page. Every phrase in its description is on it.
// The FAQ is built from the same list the page renders, so they can't drift.
const LANDING_SCHEMA = [
  webSiteSchema(),
  serviceSchema({
    serviceType: 'Weekly Pool Cleaning & Maintenance',
    description:
      'Weekly pool cleaning in St. Petersburg and across Pinellas County for one flat monthly rate: walls and waterline brushed, skimmed and vacuumed, water tested and balanced with every standard chemical included, salt cell care on salt pools, an equipment check, and a GPS-verified visit report with readings, chemicals and photos. No contract.',
    url: '/',
  }),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
  breadcrumbSchema([{ name: 'Home', path: '/' }]),
];

// Layout effect in the browser (runs before paint, so nothing flashes hidden);
// a no-op effect during the prerender, where layout effects don't run.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Scroll reveal for everything marked `data-reveal` below the hero (styles:
 * `[data-reveal-on]` in index.css). Progressive: the hidden start state only
 * applies once this runs, so without JS (or with reduced motion) everything is
 * simply visible. Elements already on screen are marked in before the first
 * paint, so they never flash out. Attributes, not classes, so a React
 * re-render can never wipe them.
 */
const useScrollReveal = (rootRef: React.RefObject<HTMLDivElement | null>) => {
  useBeforePaint(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute('data-in', '');
          io.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    // Measure every element first, then write: interleaving the reads with
    // setAttribute/setProperty forced a fresh layout per element.
    const vh = window.innerHeight;
    const els = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
    const onScreen = els.map((el) => {
      const r = el.getBoundingClientRect();
      return r.top < vh && r.bottom > 0;
    });
    els.forEach((el, i) => {
      if (onScreen[i]) {
        el.setAttribute('data-in', '');
        return;
      }
      if (el.dataset.revealDelay) el.style.setProperty('--rd', `${el.dataset.revealDelay}ms`);
      io.observe(el);
    });
    root.setAttribute('data-reveal-on', '');
    return () => io.disconnect();
  }, []);
};

export const PoolLandingPage = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  useScrollReveal(rootRef);
  usePageMeta({
    title: 'Weekly Pool Service in St. Petersburg, FL | Suncoast Pool Pros',
    description:
      'Weekly pool cleaning in St. Petersburg with every standard chemical included, for one flat monthly price. No contracts, plus a 2-week money-back guarantee.',
    canonicalPath: '/',
    fontPreload: [FONTS.inter, FONTS.montserrat],
    jsonLd: LANDING_SCHEMA,
  });

  // The new version of the quote popup (not the site-wide one), so it can be
  // revised here without touching other pages.
  return (
    <LandingQuoteSheetProvider>
      <div ref={rootRef} className="landing-canvas force-static-motion min-h-screen bg-white font-sans text-sc-navy antialiased">
        <LandingHeader />
        <main>
          <Hero />
          <LandingBelowFold />
        </main>
        <Footer />
      </div>
    </LandingQuoteSheetProvider>
  );
};
