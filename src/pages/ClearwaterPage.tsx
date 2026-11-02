import { Check } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroQuoteForm } from '@/components/landing/HeroQuoteForm';
import { Footer } from '@/components/Footer';
import { SmartLink as Link } from '@/components/SmartLink';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { LandingQuoteSheetProvider, useLandingQuoteSheet } from '@/components/landing/LandingQuoteSheet';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { clearwaterFaqs } from '@/pages/clearwaterFaqs';
import ClearwaterBelowFold from '@/pages/ClearwaterBelowFold';
import { usePageMeta, FONTS } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Keyword + city first, the brand after the pipe (the homepage's pattern).
const PAGE_TITLE = 'Pool Cleaning in Clearwater, FL | Suncoast Pool Pros';
// ~153 chars. Leads with the local keyword, names the duality that defines
// Clearwater (barrier-island beach + established mainland) with real place
// names, then stacks the click-drivers (consistent techs, flat rate, chemicals
// in, clear water).
const PAGE_DESC =
  'Weekly pool service in Clearwater, FL — Clearwater Beach & Sand Key to Countryside. Consistent techs, flat rate, chemicals included, crystal-clear water.';
const PAGE_URL = 'https://suncoastpoolpros.com/clearwater-fl/';

// The hero photo: Treasure Island's, as a placeholder until a Clearwater one
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

// Named in the Coverage section below and in the schema. None has a page of
// its own yet; give one a `to` when it does and it becomes a link here.
const NEIGHBORHOODS: { name: string; to?: string }[] = [
  { name: 'Clearwater Beach' },
  { name: 'Sand Key' },
  { name: 'Island Estates' },
  { name: 'Countryside' },
  { name: 'Del Oro' },
  { name: 'Morningside' },
  { name: 'Harbor Oaks' },
  { name: 'Skycrest' },
];

const shadowSoft = '[text-shadow:0_1px_8px_rgba(8,16,28,0.5)]';
const focusRing = 'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

// "Dark photo, centered": the homepage's type and address bar, set over the
// photo. Layers: photo (a slow settle-in zoom, desktop only), a tint darkest
// behind the text (.cw-hero-tint), the content, and the neighborhood bar on
// the bottom edge (md+; the content's bottom padding leaves it room).
const ClearwaterHero = () => {
  const hasLinks = NEIGHBORHOODS.some((n) => n.to);
  const Bar = hasLinks ? 'nav' : 'div';
  // No overflow-hidden on the section: the address suggestions must be able
  // to hang past its bottom edge. The photo layer clips itself instead.
  return (
    <section className="relative flex min-h-[calc(100svh-64px)] items-center justify-center bg-[#1D304A] text-center">
      <div className="absolute inset-0 overflow-hidden">
        <picture>
          <source media="(max-width: 767px)" srcSet={HERO_IMG.mobile} type="image/webp" />
          <source media="(max-width: 1023px)" srcSet={HERO_IMG.tablet} type="image/webp" />
          <source srcSet={`${HERO_IMG.desktop} 1x, ${HERO_IMG.wide} 2x`} type="image/webp" />
          <img
            src={HERO_IMG.fallback}
            alt="Waterfront pool in the Clearwater area"
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
      <div className="relative z-20 mx-auto w-full max-w-[50rem] px-5 pb-14 pt-10 sm:px-8 md:pb-[110px]">
        {/* The page's one h1, set as a label; the big line below is a <p>. */}
        <h1
          className={`flex items-center justify-center gap-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#FFC94D] sm:text-[13px] sm:tracking-[0.16em] ${shadowSoft}`}
        >
          <span aria-hidden="true" className="hidden h-px w-7 shrink-0 bg-[rgba(255,194,38,0.6)] sm:block" />
          Pool Cleaning in Clearwater, FL
          <span aria-hidden="true" className="hidden h-px w-7 shrink-0 bg-[rgba(255,194,38,0.6)] sm:block" />
        </h1>

        <p className="mt-[18px] text-[40px] font-bold leading-[1.03] tracking-[-0.04em] text-white [text-shadow:0_2px_30px_rgba(8,16,28,0.35)] sm:text-[54px] lg:text-[66px]">
          Clearwater deserves{' '}
          <br />
          <span className="text-[#9AD0F0]">clear water.</span>
        </p>

        <p className="mx-auto mt-[18px] max-w-[34rem] text-pretty text-[16.5px] leading-[1.55] text-white [text-shadow:0_1px_12px_rgba(8,16,28,0.55)] sm:text-[19px]">
          Weekly pool service from Sand Key to Countryside. One flat rate, every chemical included, no contracts.
        </p>

        {/* relative z-10: the address suggestions must paint over the lines
            below. text-left: the form's own text and its step-two card. */}
        <div id="get-price" className="relative z-10 mx-auto mt-8 max-w-[34rem] scroll-mt-24 text-left">
          <HeroQuoteForm
            variant="onDark"
            placeholder="Your pool's address"
            source="clearwater-hero-quote-form"
            near="clearwater"
          />
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
        aria-label={hasLinks ? 'Clearwater neighborhoods we serve' : undefined}
        className="absolute inset-x-0 bottom-0 z-10 hidden border-t border-white/14 bg-[rgba(15,26,42,0.35)] px-8 py-[18px] backdrop-blur-[6px] md:block"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FFC226]">Serving</p>
          <ul
            aria-label={hasLinks ? undefined : 'Clearwater neighborhoods we serve'}
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

// JSON-LD (LocalBusiness + FAQPage + Breadcrumb) injected client-side. Title,
// description, canonical, and OG come from usePageMeta (SSR'd into the
// prerendered HTML); usePageMeta doesn't do JSON-LD, so this effect adds it.
// See CLAUDE.md #9.
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
    ];

// The phone bar's Quote opens the same popup (it needs the provider above it).
const PopupStickyCta = () => <StickyMobileCta quote={useLandingQuoteSheet()} />;

export const ClearwaterPage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/clearwater-fl/',
    heroPreload: {
      mobile: HERO_IMG.mobile,
      tablet: HERO_IMG.tablet,
      desktop: HERO_IMG.desktop,
      wide: HERO_IMG.wide,
    },
    // Inter for the hero, Montserrat for the header's wordmark (the homepage's set).
    fontPreload: [FONTS.inter, FONTS.montserrat],
    jsonLd: PAGE_SCHEMA,
  });

  // overflow-x-clip, not -hidden: hidden makes the wrapper a scroll
  // container, and the sticky header would stop sticking.
  // The homepage's quote popup: every "Get my price" below the hero (and the
  // phone bar's Quote) opens it; the hero keeps its address search.
  return (
    <LandingQuoteSheetProvider>
      <div className="landing-canvas force-static-motion relative min-h-screen overflow-x-clip bg-white font-sans text-sc-navy antialiased">
        <LandingHeader />
        <ClearwaterHero />
        <ClearwaterBelowFold />
        <Footer />
        <PopupStickyCta />
      </div>
    </LandingQuoteSheetProvider>
  );
};
