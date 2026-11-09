import { Check } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroQuoteForm } from '@/components/landing/HeroQuoteForm';
import { Footer } from '@/components/Footer';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { LandingQuoteSheetProvider, useLandingQuoteSheet } from '@/components/landing/LandingQuoteSheet';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { treasureIslandFaqs } from '@/pages/treasureIslandFaqs';
import TreasureIslandBelowFold, { NEIGHBORHOODS, ZIPS } from '@/pages/TreasureIslandBelowFold';
import { usePageMeta, FONTS } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Keyword + city first, the brand after the pipe (the homepage's pattern).
const PAGE_TITLE = 'Pool Cleaning in Treasure Island, FL | Suncoast Pool Pros';
const PAGE_DESC =
  'Weekly pool cleaning for Treasure Island rentals, Airbnbs and second homes. Familiar faces on a set day, a photo report every visit, one flat rate.';
const PAGE_URL = 'https://suncoastpoolpros.com/treasure-island-fl/';

// The hero photo: a real canal-front pool in Treasure Island (location data
// stripped from the files), graded brighter for an overcast day. Phones always
// get the 800px file; wider screens pick 640 or 1120 by density.
const PHOTO_SIZES = '(min-width: 1024px) 496px, 560px';

const HeroPhoto = () => (
  <div className="relative mx-auto w-full min-w-0 max-w-[560px] lg:max-w-none">
    <div className="relative aspect-[5/6] overflow-hidden rounded-[20px] bg-sc-sky/20 shadow-[0_40px_80px_-40px_rgba(16,32,52,0.55)] ring-1 ring-sc-navy/10 lg:aspect-auto lg:h-[min(640px,calc(100dvh-128px))]">
      <picture>
        <source media="(max-width: 767px)" type="image/webp" srcSet="/treasure-island-fl-waterfront-pool-800.webp" />
        <source media="(max-width: 767px)" srcSet="/treasure-island-fl-waterfront-pool-800.jpg" />
        <source
          type="image/webp"
          sizes={PHOTO_SIZES}
          srcSet="/treasure-island-fl-waterfront-pool-640.webp 640w, /treasure-island-fl-waterfront-pool-1120.webp 1120w"
        />
        <img
          src="/treasure-island-fl-waterfront-pool-1120.jpg"
          srcSet="/treasure-island-fl-waterfront-pool-640.jpg 640w, /treasure-island-fl-waterfront-pool-1120.jpg 1120w"
          sizes={PHOTO_SIZES}
          alt="Backyard pool beside a canal lined with boat docks and palm trees in Treasure Island, FL"
          width={1120}
          height={1344}
          fetchPriority="high"
          decoding="async"
          data-quote-image="/treasure-island-fl-waterfront-pool-1120.webp"
          className="absolute inset-0 h-full w-full object-cover object-[50%_62%]"
        />
      </picture>
    </div>
  </div>
);

const inlineLink =
  'font-semibold text-sc-navy underline decoration-sc-navy/30 decoration-1 underline-offset-[3px] transition hover:decoration-sc-navy';

// The homepage's light hero: text on the light section blue, the photo in a
// framed card beside it (below it on phones and tablets, where the text column
// is centered). Brighter than a dark-photo hero, which suited the overcast
// photo badly.
const TreasureIslandHero = () => (
  <section className="relative bg-[#f5f9fd]">
    <div className="mx-auto grid w-full max-w-[1200px] items-center gap-12 px-4 pb-16 pt-10 sm:px-8 sm:pt-14 lg:min-h-[calc(100dvh-64px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,clamp(420px,calc(420px_+_(100vw_-_1024px)_*_0.8),496px))] lg:gap-x-[clamp(56px,calc(56px_+_(100vw_-_1024px)_*_0.34),88px)] lg:py-8">
      <div className="min-w-0 text-center lg:text-left">
        <p className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-[999px] bg-white py-1 pl-1 pr-3 text-[12px] font-medium text-sc-navy/75 ring-1 ring-sc-navy/10 sm:gap-x-2 sm:pr-3.5 sm:text-[13px]">
          <span className="whitespace-nowrap rounded-full bg-sc-blue/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-[#1f6aa6] sm:text-[12px]">
            Rentals &amp; second homes
          </span>
          <span className="whitespace-nowrap">Sunset Beach · Isle of Capri</span>
        </p>

        <hgroup className="mt-8 text-[clamp(30px,9.4vw,56px)] lg:mt-6">
          {/* The page's one h1: the keyword, set as the headline's first line. */}
          <h1 className="text-[1em] font-bold leading-[1.04] tracking-[-0.035em] text-sc-navy">
            <span className="bg-[linear-gradient(90deg,#2676b6,#3f95cc)] box-decoration-clone bg-clip-text text-transparent">
              Treasure Island
            </span>{' '}
            <br />
            Pool Cleaning
          </h1>
          <p className="mt-3.5 text-[0.42em] font-semibold leading-tight tracking-[-0.01em] text-sc-navy/85 lg:mt-4">
            Guest-ready. Year-round.
          </p>
        </hgroup>

        <p className="mx-auto mt-4 max-w-[22rem] text-pretty text-[15.5px] leading-[1.65] text-sc-navy/[0.7] sm:max-w-[29.5rem] sm:text-lg lg:mx-0 lg:mt-5">
          Weekly pool cleaning for Treasure Island vacation rentals, Airbnbs and second homes, with a photo report after every visit,
          wherever you are.
        </p>

        <div id="get-price" className="relative z-10 mx-auto mt-10 max-w-[34rem] scroll-mt-24 text-left lg:mx-0 lg:max-w-[473px]">
          <HeroQuoteForm placeholder="Your pool's address" source="treasure-island-hero-quote-form" near="treasure-island" />
        </div>

        <p className="mt-8 text-[14px] leading-relaxed text-sc-navy/70 sm:text-[14.5px] lg:mt-10">
          Out of town? Call or text{' '}
          <a href={PHONE_HREF} className={`${inlineLink} whitespace-nowrap`}>
            {PHONE_DISPLAY}
          </a>{' '}
          any time.
        </p>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-sc-navy/75 sm:text-[13.5px] lg:justify-start">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="text-[11px] tracking-[-0.02em] text-[#e8a100]">
              ★★★★★
            </span>
            <span>
              <span className="sr-only">Rated </span>
              <span className="font-semibold text-sc-navy">5.0</span>
              <span className="sr-only"> out of 5</span> on Google
            </span>
          </li>
          {['Photo report every visit', 'Trusted by local property managers'].map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-sc-blue" strokeWidth={2.5} />
              {t}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-[12.5px] text-sc-navy/55">
          <span className="font-semibold uppercase tracking-[0.12em] text-sc-blue">Serving</span>{' '}
          <span className="sr-only">Treasure Island neighborhoods: </span>
          {NEIGHBORHOODS.join(' · ')}
        </p>
      </div>

      <HeroPhoto />
    </div>
  </section>
);

// Page JSON-LD. Passed through the page-meta hook so it lands in the
// PRERENDERED head — an effect never runs during renderToString, so the HTML
// a crawler reads on first fetch would otherwise carry none of these nodes.
const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://suncoastpoolpros.com/#business',
    name: 'Suncoast Pool Pros',
    url: PAGE_URL,
    telephone: '+1-727-295-3621',
    priceRange: '$$',
    // Mirrors what the page names (hero bar and service area): the schema and
    // the visible content must agree.
    areaServed: [
      { '@type': 'City', name: 'Treasure Island', addressRegion: 'FL' },
      ...NEIGHBORHOODS.map((n) => ({ '@type': 'Place', name: `${n}, Treasure Island, FL` })),
      ...ZIPS.map((z) => ({ '@type': 'PostalCodeSpecification' as const, postalCode: z, addressCountry: 'US' })),
    ],
    description:
      'Reliable weekly pool cleaning for Treasure Island, FL vacation rentals, Airbnbs and second homes: vetted techs on a set day, one flat rate with chemicals included, and a photo report after every visit.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Pool cleaning',
    name: 'Weekly pool cleaning in Treasure Island, FL',
    url: PAGE_URL,
    provider: { '@id': 'https://suncoastpoolpros.com/#business' },
    areaServed: { '@type': 'City', name: 'Treasure Island', addressRegion: 'FL' },
    description:
      'Weekly pool cleaning and chemical service on a set day for rentals and second homes: brushing, skimming, vacuuming, baskets, full water balance, filter and equipment check, and a photo report after every visit, at one flat monthly rate.',
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
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Treasure Island', path: '/treasure-island-fl/' },
  ]),
];

// The phone bar's Quote opens the same popup (it needs the provider above it).
const PopupStickyCta = () => <StickyMobileCta quote={useLandingQuoteSheet()} />;

export const TreasureIslandPage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/treasure-island-fl/',
    // Inter for the page, Montserrat for the header's wordmark (the homepage's set).
    fontPreload: [FONTS.inter, FONTS.montserrat],
    jsonLd: PAGE_SCHEMA,
    // Its own share card, so a texted or shared link shows this page.
    ogImage: 'https://suncoastpoolpros.com/og-treasure-island-v1.jpg',
    ogImageAlt: 'Pool cleaning in Treasure Island, FL: a canal-front backyard pool, by Suncoast Pool Pros',
  });

  // overflow-x-clip, not -hidden: hidden makes the wrapper a scroll
  // container, and the sticky header would stop sticking.
  return (
    <LandingQuoteSheetProvider>
      <div className="landing-canvas force-static-motion relative min-h-screen overflow-x-clip bg-white font-sans text-sc-navy antialiased">
        <LandingHeader />
        <TreasureIslandHero />
        <TreasureIslandBelowFold />
        <Footer />
        <PopupStickyCta />
      </div>
    </LandingQuoteSheetProvider>
  );
};
