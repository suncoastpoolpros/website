import React from 'react';
import { MapPin, ShieldCheck } from 'lucide-react';
import { usePageMeta, FONTS } from '@/lib/usePageMeta';
import { HOME_AREA_SERVED, serviceSchema, webSiteSchema } from '@/lib/businessSchema';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';
import { PHONE_DISPLAY, PHONE_HREF, SMS_QUOTE_HREF } from '@/lib/contact';
import { QuoteButton } from '@/components/landing/sectionKit';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { VisitReportCard } from '@/components/landing/VisitReportCard';
import { LANDING_FAQS, LandingBelowFold } from '@/components/landing/LandingBelowFold';
import { Footer } from '@/components/Footer';
import { LandingQuoteSheetProvider } from '@/components/landing/LandingQuoteSheet';
import { StickyQuoteBar } from '@/components/landing/StickyQuoteBar';

/*
 * The homepage (served at /). Its own light look (the sc-* logo tokens in
 * index.css), its own header and the site-wide footer.
 *
 * The hero calls out the audience, promises the outcome, makes it believable
 * (guarantee + proof of every visit) and makes starting effortless: one
 * button, which opens the 3-option quote popup. No address field first.
 *
 * Radius scale: 12px photo and cards · 14px the report card · 10px buttons,
 * tiles. Spacing on the 8-point grid.
 *
 * Don't add numbers, reviews or claims beyond the ones already here.
 */

const Container = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-8 ${className}`}>{children}</div>
);

// Phones and tablets: three centred columns split by hairlines. Desktop: one
// row, each item's divider drawn by its ::before, 10px into its 20px padding.
const trustItem =
  'relative flex flex-col items-center gap-1 px-1.5 text-center lg:flex-row lg:gap-1.5 lg:whitespace-nowrap lg:px-0 lg:pl-5 lg:text-left lg:first:pl-0 lg:before:absolute lg:before:left-2.5 lg:before:top-1/2 lg:before:h-4 lg:before:w-px lg:before:-translate-y-1/2 lg:before:bg-sc-navy/15 lg:first:before:hidden';

// No underline at rest, one on hover.
const quietLink = 'underline-offset-[3px] hover:underline';

// ── Photo + visit report ────────────────────────────────────────────────────

// A waterfront pool and spa under palms (supplied by the owner). To replace
// it, add files under NEW names (immutable image caching).
//
// Phones always get the 800px file: the frame is ~360px wide, so 800 is sharp
// at any phone density (~107 KB) instead of pulling the 1120 on 3x screens.
// Wider screens choose by density from `sizes`: 640 at 1x (75 KB), 1120 at 2x.
// visit-report-extras.js finds the img by data-hero-photo.
const PHOTO_SIZES = '(min-width: 1024px) 496px, 560px';

const HeroPhoto = () => (
  <div className="relative mx-auto h-[450px] w-full min-w-0 max-w-[560px] overflow-hidden rounded-[12px] bg-sc-sky/20 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_16px_40px_-16px_rgba(16,24,40,0.22)] lg:h-[520px] lg:max-w-none">
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
        bottom. No sepia filter instead: it browns the greens. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,225,140,0.08)_0%,rgba(255,215,140,0.12)_30%,rgba(255,210,140,0.30)_60%,rgba(255,210,140,0.22)_100%)] mix-blend-soft-light"
    />
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,32,52,0)_55%,rgba(16,32,52,0.28)_100%)]"
    />

    {/* Inside the photo: across the top on phones and tablets, the upper
        right corner on desktop. */}
    <div className="absolute left-3 right-3 top-3 lg:left-auto lg:right-4 lg:top-4 lg:w-[292px]">
      <VisitReportCard />
    </div>
  </div>
);

// ── Hero ────────────────────────────────────────────────────────────────────

// On desktop the hero fills the first screen. From 1024 to 1120 the photo
// column (420→496px) and gap (56→88px) grow with the screen. Portrait tablets
// (iPad Pro, 1024 wide and ~1366 tall) don't fill it: centred in that much
// height, the content floated in empty space.
const Hero = () => (
  <section className="relative bg-[#f5f9fd]">
    <Container className="grid items-center gap-12 pb-16 pt-10 sm:pt-14 lg:min-h-[calc(100dvh-64px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,clamp(420px,calc(420px_+_(100vw_-_1024px)_*_0.8),496px))] lg:gap-x-[clamp(56px,calc(56px_+_(100vw_-_1024px)_*_0.34),88px)] lg:py-8 lg:portrait:min-h-0 lg:portrait:py-20">
      <div className="min-w-0">
        {/* The spaces keep the words apart for crawlers and screen readers,
            which read a <br> as nothing. The breaks are desktop's: on a
            phone "pool service, one" doesn't fit a line at 40px. */}
        <h1 className="text-[40px] font-semibold leading-[1.06] tracking-[-0.03em] text-[#243a55] lg:text-[48px] lg:leading-[1.07]">
          St. Petersburg <br className="max-lg:hidden" />
          pool service, one <br className="max-lg:hidden" />
          flat monthly rate.
        </h1>

        <p className="mt-4 text-pretty text-[17px] leading-[1.6] text-[rgba(36,58,85,0.78)] lg:mt-5 lg:max-w-[27rem] lg:text-[18px]">
          Weekly pool cleaning and maintenance in St.{' '}Petersburg, FL, with every standard chemical included, GPS-verified
          visits, and no contracts.
        </p>

        {/* #quote: the old homepage's form anchor, which outside links (the
            Business Profile, old texts) may still point at. #get-price: the
            button the phone's sticky bar waits to see scroll away. */}
        <div id="quote" className="mt-[26px] scroll-mt-24 lg:mt-8 lg:flex lg:items-center lg:gap-6">
          <div id="get-price" className="scroll-mt-24">
            <QuoteButton
              variant="flat"
              label="Get my free quote"
              className="h-[54px] w-full px-[22px] text-[17px] lg:h-12 lg:w-auto lg:text-base"
            />
          </div>
          <div className="hidden lg:block">
            <p className="text-[13px] leading-snug text-[rgba(36,58,85,0.62)]">
              or{' '}
              <a href={PHONE_HREF} className={quietLink}>
                call
              </a>{' '}
              or{' '}
              <a href={SMS_QUOTE_HREF} className={quietLink}>
                text
              </a>
            </p>
            <a
              href={PHONE_HREF}
              className={`block text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[#243a55] ${quietLink}`}
            >
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>

        <ul className="mt-7 grid grid-cols-3 divide-x divide-sc-navy/10 text-[12px] leading-snug text-sc-navy/75 lg:mt-10 lg:flex lg:items-center lg:divide-x-0 lg:border-t lg:border-[rgba(36,58,85,0.12)] lg:pt-5 lg:text-[13.5px] lg:leading-normal">
          <li className={trustItem}>
            <span aria-hidden="true" className="flex h-[18px] items-center text-[12.5px] tracking-[-0.02em] text-[#e8a100] lg:h-auto lg:text-[11px]">
              ★★★★★
            </span>
            <span>
              <span className="sr-only">Rated </span>
              <span className="font-semibold text-sc-navy">5.0</span>
              <span className="sr-only"> out of 5</span> on Google
            </span>
          </li>
          <li className={trustItem}>
            <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-sc-blue lg:h-4 lg:w-4" strokeWidth={2.25} />
            Always Blue guarantee
          </li>
          <li className={trustItem}>
            <MapPin className="h-[18px] w-[18px] shrink-0 text-sc-blue lg:h-4 lg:w-4" strokeWidth={2.25} />
            Based in St. Pete
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
    areaServed: HOME_AREA_SERVED,
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

export const PoolLandingPage = () => {
  usePageMeta({
    title: 'Pool Service & Cleaning in St. Petersburg, FL | Suncoast Pool Pros',
    description:
      'Weekly pool service and cleaning in St. Petersburg, FL. Every standard chemical included, GPS-verified visit reports, no contract. Get a flat-rate quote today.',
    canonicalPath: '/',
    fontPreload: [FONTS.geist, FONTS.montserrat],
    jsonLd: LANDING_SCHEMA,
  });

  // The new version of the quote popup (not the site-wide one), so it can be
  // revised here without touching other pages.
  return (
    <LandingQuoteSheetProvider>
      <div className="landing-canvas force-static-motion min-h-screen bg-white font-sans text-sc-navy antialiased">
        <LandingHeader quoteLabel="Get my free quote" strongPhone />
        <main>
          <Hero />
          <LandingBelowFold />
        </main>
        <Footer />
        <StickyQuoteBar />
      </div>
    </LandingQuoteSheetProvider>
  );
};
