import { Check } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroQuoteForm } from '@/components/landing/HeroQuoteForm';
import { Footer } from '@/components/Footer';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { LandingQuoteSheetProvider, useLandingQuoteSheet } from '@/components/landing/LandingQuoteSheet';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { seminoleFaqs } from '@/pages/seminoleFaqs';
import SeminoleBelowFold, { NEIGHBORHOODS, ZIPS } from '@/pages/SeminoleBelowFold';
import { usePageMeta, FONTS } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Keyword + city first, the brand after the pipe (the homepage's pattern).
const PAGE_TITLE = 'Pool Cleaning in Seminole, FL | Suncoast Pool Pros';
const PAGE_DESC =
  'Weekly pool cleaning in Seminole, FL, from Bardmoor to Bay Pines. Familiar faces on a set day, one flat rate with chemicals included, photo report every visit.';
const PAGE_URL = 'https://suncoastpoolpros.com/seminole-fl/';

// The hero photo: a real screened, tree-shaded Seminole pool (location data
// stripped from the files). heroPreload reads these too, so the preloads
// always match the file each screen paints.
const HERO_IMG = {
  mobile: '/seminole-fl-screened-pool-mobile.webp',
  desktop: '/seminole-fl-screened-pool.webp',
  wide: '/seminole-fl-screened-pool-1920.webp',
  fallback: '/seminole-fl-screened-pool.jpg',
};

const shadowSoft = '[text-shadow:0_1px_8px_rgba(8,16,28,0.5)]';
const focusRing = 'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

// "Dark photo, centered", as on Clearwater: the homepage's type and address
// bar over the photo, the neighborhoods along the bottom edge (md+).
const SeminoleHero = () => (
  // No overflow-hidden on the section: the address suggestions must be able
  // to hang past its bottom edge. The photo layer clips itself instead.
  <section className="relative flex min-h-[calc(100svh-64px)] items-center justify-center bg-[#1D304A] text-center">
    <div className="absolute inset-0 overflow-hidden">
      <picture>
        <source media="(max-width: 767px)" srcSet={HERO_IMG.mobile} type="image/webp" />
        <source srcSet={`${HERO_IMG.desktop} 1x, ${HERO_IMG.wide} 2x`} type="image/webp" />
        <img
          src={HERO_IMG.fallback}
          alt="Screened-in backyard pool in Seminole, FL, with clear water"
          width={1280}
          height={853}
          fetchPriority="high"
          data-quote-image={HERO_IMG.mobile}
          className="cw-hero-zoom absolute inset-0 h-full w-full object-cover object-[50%_55%] md:object-[50%_22%]"
        />
      </picture>
      <div aria-hidden="true" className="cw-hero-tint absolute inset-0" />
    </div>

    {/* z-20: above the neighborhood bar (z-10), so open suggestions paint over it. */}
    <div className="relative z-20 mx-auto w-full max-w-[50rem] px-5 pb-14 pt-10 sm:px-8 md:pb-[110px]">
      {/* The page's one h1, set as a label; the big line below is a <p>. */}
      <h1
        className={`flex items-center justify-center gap-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#FFC94D] sm:text-[13px] sm:tracking-[0.16em] ${shadowSoft}`}
      >
        <span aria-hidden="true" className="hidden h-px w-7 shrink-0 bg-[rgba(255,194,38,0.6)] sm:block" />
        Pool Cleaning &amp; Weekly Service in Seminole, FL
        <span aria-hidden="true" className="hidden h-px w-7 shrink-0 bg-[rgba(255,194,38,0.6)] sm:block" />
      </h1>

      <p className="mt-[18px] text-[40px] font-bold leading-[1.03] tracking-[-0.04em] text-white [text-shadow:0_2px_30px_rgba(8,16,28,0.35)] sm:text-[54px] lg:text-[66px]">
        Swim-ready every day, <br />
        <span className="text-[#9AD0F0]">not just service day.</span>
      </p>

      <p className="mx-auto mt-[18px] max-w-[34rem] text-pretty text-[16.5px] leading-[1.55] text-white [text-shadow:0_1px_12px_rgba(8,16,28,0.55)] sm:text-[19px]">
        Weekly pool cleaning for full-time Seminole homes, from Bardmoor to Bay Pines. One flat rate, every chemical
        included, no contracts.
      </p>

      {/* relative z-10: the address suggestions must paint over the lines below. */}
      <div id="get-price" className="relative z-10 mx-auto mt-8 max-w-[34rem] scroll-mt-24 text-left">
        <HeroQuoteForm
          variant="onDark"
          placeholder="Your pool's address"
          source="seminole-hero-quote-form"
          near="seminole"
        />
      </div>

      <p className={`mt-3 text-[13.5px] text-white/85 ${shadowSoft}`}>
        Free quote, same-day reply. Prefer to talk?{' '}
        <a
          href={PHONE_HREF}
          className={`-my-3 inline-block whitespace-nowrap py-3 font-semibold text-white underline decoration-white/60 underline-offset-[3px] hover:decoration-white ${focusRing}`}
        >
          {PHONE_DISPLAY}
        </a>
      </p>

      <ul
        className={`mt-7 flex flex-col items-center gap-2.5 text-[14px] font-medium text-white sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-[26px] ${shadowSoft}`}
      >
        <li className="inline-flex items-center gap-2 rounded-full bg-white/12 py-1.5 pl-2 pr-3 ring-1 ring-inset ring-white/18">
          <span
            aria-hidden="true"
            className="grid h-5 w-5 place-items-center rounded-full bg-white text-[12px] font-bold text-sc-blue [text-shadow:none]"
          >
            G
          </span>
          <span aria-hidden="true" className="text-[12px] tracking-[-0.02em] text-[#FFC226]">
            ★★★★★
          </span>
          <span>
            <span className="sr-only">Rated </span>5.0<span className="sr-only"> out of 5</span> on Google
          </span>
        </li>
        {/* Techs alternate, so the promise sits on the day, not the person. */}
        {['Familiar faces, locked-in day', 'Photo report every visit'].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-[#9AD0F0]" strokeWidth={2.5} />
            {t}
          </li>
        ))}
      </ul>
    </div>

    <div className="absolute inset-x-0 bottom-0 z-10 hidden border-t border-white/14 bg-[rgba(15,26,42,0.35)] px-8 py-[18px] backdrop-blur-[6px] md:block">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FFC226]">Serving</p>
        <ul aria-label="Seminole neighborhoods we serve" className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[13px] text-white/72">
          {NEIGHBORHOODS.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
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
      { '@type': 'City', name: 'Seminole', addressRegion: 'FL' },
      ...NEIGHBORHOODS.map((n) => ({ '@type': 'Place', name: `${n}, FL` })),
      ...ZIPS.map((z) => ({
        '@type': 'PostalCodeSpecification' as const,
        postalCode: z,
        addressCountry: 'US',
      })),
    ],
    description:
      'Reliable weekly pool service for full-time Seminole, FL homes — families and year-round residents. Vetted techs on a set day, screen-enclosure debris handled, all standard chemicals inside one flat monthly rate, and photo-documented proof each week.',
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
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Pool cleaning',
    name: 'Weekly pool cleaning in Seminole, FL',
    url: PAGE_URL,
    provider: { '@id': 'https://suncoastpoolpros.com/#business' },
    areaServed: { '@type': 'City', name: 'Seminole', addressRegion: 'FL' },
    description:
      'Weekly pool cleaning and chemical service on a set day: brushing, skimming, vacuuming, baskets, full water balance, filter and equipment check, and a photo report after every visit, at one flat monthly rate.',
  },
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Seminole', path: '/seminole-fl/' },
  ]),
];

// The phone bar's Quote opens the same popup (it needs the provider above it).
const PopupStickyCta = () => <StickyMobileCta quote={useLandingQuoteSheet()} />;

export const SeminolePage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/seminole-fl/',
    heroPreload: {
      mobile: HERO_IMG.mobile,
      desktop: HERO_IMG.desktop,
      wide: HERO_IMG.wide,
    },
    // Inter for the page, Montserrat for the header's wordmark (the homepage's set).
    fontPreload: [FONTS.inter, FONTS.montserrat],
    jsonLd: PAGE_SCHEMA,
    // Its own share card, so a texted or shared link shows the Seminole page.
    ogImage: 'https://suncoastpoolpros.com/og-seminole-v1.jpg',
    ogImageAlt: 'Pool cleaning in Seminole, FL: a screened backyard pool, by Suncoast Pool Pros',
  });

  // overflow-x-clip, not -hidden: hidden makes the wrapper a scroll
  // container, and the sticky header would stop sticking.
  return (
    <LandingQuoteSheetProvider>
      <div className="landing-canvas force-static-motion relative min-h-screen overflow-x-clip bg-white font-sans text-sc-navy antialiased">
        <LandingHeader />
        <SeminoleHero />
        <SeminoleBelowFold />
        <Footer />
        <PopupStickyCta />
      </div>
    </LandingQuoteSheetProvider>
  );
};
