import { Check } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { QuoteButton } from '@/components/landing/sectionKit';
import { Footer } from '@/components/Footer';
import { SmartLink as Link } from '@/components/SmartLink';
import { StickyQuoteBar } from '@/components/landing/StickyQuoteBar';
import { LandingQuoteSheetProvider } from '@/components/landing/LandingQuoteSheet';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { palmHarborFaqs } from '@/pages/palmHarborFaqs';
import PalmHarborBelowFold, { GULF_AREAS, LAKE_AREAS } from '@/pages/PalmHarborBelowFold';
import { usePageMeta, FONTS } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Built from the Clearwater page (ClearwaterPage.tsx): same hero, sections
// and form, with Palm Harbor's copy, a different section order, no section
// eyebrows, and the homepage's sticky Call / Get my price bar on phones.
const PAGE_TITLE = 'Pool Service in Palm Harbor, FL | Suncoast Pool Pros';
const PAGE_DESC =
  'Weekly pool service in Palm Harbor, FL, from Ozona and Crystal Beach to Lansbrook and East Lake. Flat monthly rate, every chemical included, photo report every visit, no contract.';
const PAGE_URL = 'https://suncoastpoolpros.com/palm-harbor-fl/';

// The hero photo: Treasure Island's, as a placeholder until a Palm Harbor one
// is shot. To swap it, change these paths; heroPreload reads them too, so the
// preloads always match the file each screen paints (phones the portrait
// crop, tablets the 1536, desktops 1536 or 1920 by pixel density).
const HERO_IMG = {
  mobile: '/treasure-island-hero-mobile-v2.webp',
  tablet: '/treasure-island-hero-1536.webp',
  desktop: '/treasure-island-hero-1536.webp',
  wide: '/treasure-island-hero-1920.webp',
  fallback: '/treasure-island-hero.jpg',
  // The landscape Treasure Island files carry dark bars baked into their top
  // and bottom (~8% of the height each). On tablets and up the image box then
  // runs 9.25% past the hero's top and bottom, so the bars fall outside it.
  // Set false for a clean photo.
  letterboxed: true,
};

// The hero's "Serving" bar (md+). None has a page of its own yet; give one a
// `to` when it does and it becomes a link here.
const NEIGHBORHOODS: { name: string; to?: string }[] = [
  { name: 'Ozona' },
  { name: 'Crystal Beach' },
  { name: 'Downtown Palm Harbor' },
  { name: 'Lansbrook' },
  { name: 'Ridgemoor' },
  { name: 'Highland Lakes' },
  { name: 'Tarpon Woods' },
  { name: 'East Lake' },
];

const shadowSoft = '[text-shadow:0_1px_8px_rgba(8,16,28,0.5)]';
const focusRing = 'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

// "Dark photo, centered": the homepage's type and address bar, set over the
// photo. Layers: photo (a slow settle-in zoom, desktop only), a tint darkest
// behind the text (.cw-hero-tint), the content, and the neighborhood bar on
// the bottom edge (md+; the content's bottom padding leaves it room).
const PalmHarborHero = () => {
  const hasLinks = NEIGHBORHOODS.some((n) => n.to);
  const Bar = hasLinks ? 'nav' : 'div';
  // The photo layer clips itself (overflow-hidden), not the section.
  return (
    <section className="relative flex min-h-[calc(100svh-64px)] items-center justify-center bg-[#1D304A] text-center">
      <div className="absolute inset-0 overflow-hidden">
        <picture>
          <source media="(max-width: 767px)" srcSet={HERO_IMG.mobile} type="image/webp" />
          <source media="(max-width: 1023px)" srcSet={HERO_IMG.tablet} type="image/webp" />
          <source srcSet={`${HERO_IMG.desktop} 1x, ${HERO_IMG.wide} 2x`} type="image/webp" />
          <img
            src={HERO_IMG.fallback}
            alt="Waterfront pool in the Palm Harbor area"
            width={1500}
            height={1000}
            fetchPriority="high"
            // The quote popup's photo column: the clean, portrait phone file
            // (the landscape ones carry dark bars).
            data-quote-image={HERO_IMG.mobile}
            className={`cw-hero-zoom absolute inset-0 h-full w-full object-cover object-[50%_70%]${
              HERO_IMG.letterboxed ? ' md:top-[-9.25%] md:h-[118.5%]' : ''
            }`}
          />
        </picture>
        <div aria-hidden="true" className="cw-hero-tint absolute inset-0" />
      </div>

      {/* z-20: above the neighborhood bar (z-10), so open suggestions paint
          over it. */}
      <div className="page-container relative z-20 mx-auto w-full max-w-[50rem] px-5 pb-14 pt-10 sm:px-8 md:pb-[110px]">
        {/* The page's one h1, set as a label; the big line below is a <p>. */}
        <h1
          className={`flex items-center justify-center gap-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#FFC94D] sm:text-[13px] sm:tracking-[0.16em] ${shadowSoft}`}
        >
          <span aria-hidden="true" className="hidden h-px w-7 shrink-0 bg-[rgba(255,194,38,0.6)] sm:block" />
          Pool service in Palm Harbor, FL
          <span aria-hidden="true" className="hidden h-px w-7 shrink-0 bg-[rgba(255,194,38,0.6)] sm:block" />
        </h1>

        <p className="mt-[18px] text-[40px] max-[389px]:text-[36px] font-bold leading-[1.03] tracking-[-0.04em] text-white [text-shadow:0_2px_30px_rgba(8,16,28,0.35)] sm:text-[54px] lg:text-[66px]">
          Palm Harbor pools,{' '}
          <br />
          <span className="text-[#9AD0F0]">properly cared for.</span>
        </p>

        <p className="mx-auto mt-[18px] max-w-[34rem] text-pretty text-[16.5px] leading-[1.55] text-white [text-shadow:0_1px_12px_rgba(8,16,28,0.55)] sm:text-[19px]">
          Weekly pool service from Crystal Beach to Lake Tarpon. One flat rate, every chemical included, no contracts.
        </p>

        {/* Opens the 3-option quote popup: no address to type first. */}
        <div id="get-price" className="relative z-10 mx-auto mt-8 max-w-[26rem] scroll-mt-24 text-center">
          <QuoteButton />
        </div>

        <p className={`mt-3 text-[13.5px] text-white/85 ${shadowSoft}`}>
          Free quote, same-day reply. Prefer to talk?{' '}
          {/* Padding stretches the tap target to 44px; the negative margin
              keeps the line height unchanged. */}
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
          {['Familiar faces, locked-in day', 'Always Blue guarantee'].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-[#9AD0F0]" strokeWidth={2.5} />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <Bar
        aria-label={hasLinks ? 'Palm Harbor neighborhoods we serve' : undefined}
        className="absolute inset-x-0 bottom-0 z-10 hidden border-t border-white/14 bg-[rgba(15,26,42,0.35)] px-8 py-[18px] backdrop-blur-[6px] md:block"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FFC226]">Serving</p>
          <ul
            aria-label={hasLinks ? undefined : 'Palm Harbor neighborhoods we serve'}
            className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[13px] text-white/72"
          >
            {NEIGHBORHOODS.map((n) => (
              <li key={n.name}>
                {n.to ? (
                  <Link to={n.to} className={`transition-colors hover:text-white ${focusRing}`}>
                    {n.name}
                  </Link>
                ) : (
                  n.name
                )}
              </li>
            ))}
          </ul>
        </div>
      </Bar>
    </section>
  );
};

// Page JSON-LD, through usePageMeta so it lands in the PRERENDERED head.
// areaServed mirrors the Coverage section's two lists: schema and visible
// content must agree.
const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://suncoastpoolpros.com/#business',
    name: 'Suncoast Pool Pros',
    url: PAGE_URL,
    telephone: '+1-727-295-3621',
    priceRange: '$$',
    areaServed: [
      { '@type': 'City', name: 'Palm Harbor', addressRegion: 'FL' },
      ...[...GULF_AREAS, ...LAKE_AREAS].map((a) => ({ '@type': 'Place', name: `${a.name}, FL` })),
    ],
    description:
      'Weekly pool service for all of Palm Harbor, FL, on both sides of US-19: the Gulf side (Ozona, Crystal Beach, downtown Palm Harbor) and the lake side (Lansbrook, Ridgemoor, Highland Lakes, East Lake). Spas, heaters and salt systems checked every visit, flat rate with chemicals included, photo report after every visit.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: palmHarborFaqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Palm Harbor', path: '/palm-harbor-fl/' },
  ]),
];

export const PalmHarborPage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/palm-harbor-fl/',
    heroPreload: {
      mobile: HERO_IMG.mobile,
      tablet: HERO_IMG.tablet,
      desktop: HERO_IMG.desktop,
      wide: HERO_IMG.wide,
    },
    // Geist for the hero, Montserrat for the header's wordmark (the homepage's set).
    fontPreload: [FONTS.geist, FONTS.montserrat],
    jsonLd: PAGE_SCHEMA,
  });

  // overflow-x-clip, not -hidden: hidden makes the wrapper a scroll
  // container, and the sticky header would stop sticking. Phones balance every
  // h1 and h2 so none ends on a single word.
  return (
    <LandingQuoteSheetProvider>
      <div className="landing-canvas force-static-motion relative min-h-screen overflow-x-clip bg-white font-sans text-sc-navy antialiased max-md:[&_h1]:text-balance max-md:[&_h2]:text-balance">
        <LandingHeader />
        <PalmHarborHero />
        <PalmHarborBelowFold />
        <Footer />
        <StickyQuoteBar label="Get my price" formId="quote-form" />
      </div>
    </LandingQuoteSheetProvider>
  );
};
