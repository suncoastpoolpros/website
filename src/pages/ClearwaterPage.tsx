import { Phone } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { QuoteButton } from '@/components/landing/sectionKit';
import { Footer } from '@/components/Footer';
import { SmartLink as Link } from '@/components/SmartLink';
import { StickyQuoteBar } from '@/components/landing/StickyQuoteBar';
import { LandingQuoteSheetProvider } from '@/components/landing/LandingQuoteSheet';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { clearwaterFaqs } from '@/pages/clearwaterFaqs';
import ClearwaterBelowFold from '@/pages/ClearwaterBelowFold';
import { usePageMeta, FONTS } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Keyword + city first, the brand after the pipe (the homepage's pattern).
const PAGE_TITLE = 'Pool Service in Clearwater, FL | Suncoast Pool Pros';
// Leads with the local keyword, spans the beach and the mainland with real
// place names, then the click-drivers.
const PAGE_DESC =
  'Weekly pool service in Clearwater, FL, from Clearwater Beach to Countryside. Flat monthly rate, chemicals included, no contract. Free same-day quote.';

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

// The hero's "Serving" bar (md+). None has a page of its own yet; give one a
// `to` when it does and it becomes a link here.
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
          Pool service in Clearwater, FL
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

        {/* Opens the 3-option quote popup: no address to type first. The phone
            link sits beside it from 768px, centered under it on phones. */}
        <div
          id="get-price"
          className="relative z-10 mx-auto mt-8 flex scroll-mt-24 flex-col items-center gap-2 md:flex-row md:justify-center md:gap-6"
        >
          <QuoteButton />
          {/* Padding stretches the tap target to 44px. */}
          <a
            href={PHONE_HREF}
            className={`inline-flex items-center gap-2 whitespace-nowrap py-3 text-[15px] font-medium text-white underline decoration-white/60 underline-offset-[3px] hover:decoration-white ${shadowSoft} ${focusRing}`}
          >
            <Phone aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            or call {PHONE_DISPLAY}
          </a>
        </div>

        <ul className={`mt-5 flex justify-center text-[14px] font-medium text-white md:mt-7 ${shadowSoft}`}>
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

// Page JSON-LD, through usePageMeta so it lands in the PRERENDERED head.
// No LocalBusiness node of its own: the site-wide one in index.html (same
// @id, full NAP, Clearwater in its areaServed) is the page's one business
// entity. A second node with that @id but a different url and areaServed
// read as two conflicting businesses.
const PAGE_SCHEMA = [
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
    fontPreload: [FONTS.geist, FONTS.montserrat],
    jsonLd: PAGE_SCHEMA,
  });

  // overflow-x-clip, not -hidden: hidden makes the wrapper a scroll
  // container, and the sticky header would stop sticking.
  // The homepage's quote popup: every "Get my price" button on the page opens
  // it, except the phone bar's, which scrolls to the form.
  return (
    <LandingQuoteSheetProvider>
      {/* Phones: h1 and h2 lines balanced. */}
      <div className="landing-canvas force-static-motion relative min-h-screen overflow-x-clip bg-white font-sans text-sc-navy antialiased max-md:[&_h1]:text-balance max-md:[&_h2]:text-balance">
        <LandingHeader />
        <ClearwaterHero />
        <ClearwaterBelowFold />
        <Footer />
        {/* Phones only: Call + Get my price, to the form below. */}
        <StickyQuoteBar label="Get my price" formId="quote-form" hideFrom="md" />
      </div>
    </LandingQuoteSheetProvider>
  );
};
