import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { SmartLink as Link } from '@/components/SmartLink';
import { useScrollLock } from '@/lib/useScrollLock';
import {
  X,
  Phone,
  MessageSquare,
  ChevronDown,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { ServiceAreasMenu } from '@/components/ServiceAreasMenu';
import { cities } from '@/lib/cities';
import { ServicesMenu } from '@/components/ServicesMenu';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { PHONE_DISPLAY, PHONE_HREF, SMS_HREF, HOURS_SHORT } from '@/lib/contact';

// Mobile menu nav items. `to` routes; `href` is an in-page anchor (homepage).
// "Home" and the "Service Areas" accordion render separately above these.
type MobileNavItem = { label: string; to?: string; href?: string };
const MOBILE_NAV: MobileNavItem[] = [
  { label: 'Services', to: '/services/' },
  { label: 'How It Works', to: '/how-it-works/' },
  { label: 'FAQ', to: '/faq/' },
  { label: 'Tools', to: '/tools/' },
  { label: 'Pool Care', to: '/pool-care/' },
  { label: 'Careers', to: '/careers/' },
  { label: 'Contact', to: '/contact/' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesCloseTimer = useRef<number | null>(null);
  const { open: openQuoteSheet, warm: warmQuoteSheet, isOpen: quoteSheetOpen } = useQuoteSheet();
  const { pathname } = useLocation();
  const [areasExpanded, setAreasExpanded] = useState(false);
  // Mobile header call/text chooser — the OS action sheet (Call/Message) only
  // appears on long-press of a tel: link, so a tap opens this tiny menu with
  // both options instead.
  const [callOpen, setCallOpen] = useState(false);
  // The menu is mounted ONCE, right after hydration (not on tap), then kept
  // in the DOM hidden (visibility gated by .nav-drawer). Opening is then just
  // an `is-open` class toggle — no React mount and no animation-frame wait on
  // tap, so it opens immediately (the residual open-delay was the on-tap
  // mount). `hydrated` gates the portal so nothing renders during SSR/first
  // hydration commit.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    // Defer the initial read to the next frame instead of calling onScroll()
    // synchronously here. Reading window.scrollY right after React commits the
    // hydrated DOM forces the browser to flush layout (a "forced reflow"). The
    // page loads at the top (scrollY 0 → scrolled:false, the initial state), so
    // a one-frame-late first check is only meaningful for loads that start
    // mid-page (hash/refresh) — and it no longer blocks the hydration commit.
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // While the mobile menu is open: lock body scroll (iOS-safe, shared hook)
  // and close on Escape. The Escape listener detaches while the quote sheet is
  // layered on top: Escape must close only the sheet (its own handler), and
  // closing both in one keydown can release the two nested scroll locks out of
  // order, leaving the body stuck pinned.
  useScrollLock(isOpen);
  useEffect(() => {
    if (!isOpen || quoteSheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, quoteSheetOpen]);

  // Pre-mount ("warm") the quote sheet shortly AFTER the menu opens, while
  // the user is reading it — so tapping Get a Quote does zero mount work.
  // Warming used to run on the CTA's own pointerdown, but iOS Safari refuses
  // to synthesize the click when the DOM mutates under the finger between
  // touchstart and touchend — the heavy QuoteChooser mount mid-gesture meant
  // the first tap swallowed its own click and the popup needed two taps
  // (Chrome synthesizes the click regardless, so tests never caught it).
  // 450ms clears the menu's 250ms open fade first; a faster tap falls back to
  // the cold-open path (useOverlayTransition mounts, then flips `.is-open`
  // post-commit, so the slide still animates).
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(warmQuoteSheet, 450);
    return () => window.clearTimeout(t);
  }, [isOpen, warmQuoteSheet]);

  // Close the mobile drawer + service-areas accordion on any route change.
  // Otherwise tapping a nav link leaves the drawer covering the new page
  // until the lazy chunk finishes — which on a real iPhone over LTE can take
  // a couple seconds and feels like the menu is frozen.
  useEffect(() => {
    setIsOpen(false);
    setAreasOpen(false);
    setAreasExpanded(false);
    setCallOpen(false);
  }, [pathname]);

  // Delay close-on-leave so the user can travel from the trigger
  // down into the panel without it snapping shut.
  const openAreas = () => {
    setServicesOpen(false);
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setAreasOpen(true);
  };
  const openServices = () => {
    if (servicesCloseTimer.current) {
      window.clearTimeout(servicesCloseTimer.current);
      servicesCloseTimer.current = null;
    }
    setServicesOpen(true);
    setAreasOpen(false);
  };

  const scheduleServicesClose = () => {
    if (servicesCloseTimer.current) window.clearTimeout(servicesCloseTimer.current);
    servicesCloseTimer.current = window.setTimeout(() => setServicesOpen(false), 120);
  };

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setAreasOpen(false), 120);
  };

  return (
    <>
    <nav
      // Mobile: absolute (not sticky — scrolls away with the page; the menu
      // is reachable from the top, conversion lives in the bottom tab bar)
      // with a solid WHITE surface + hairline bottom edge — no scroll-
      // triggered change. Desktop: fixed, transparent at top, frosted on
      // scroll (backdrop-blur stays md:-gated; toggling blur on mobile forces
      // iOS to re-rasterize the page). The scrolled ternary owns ALL md:
      // border/bg colors so the two md: color utilities never coexist.
      // `scrolled` only affects md: styles but the listener is viewport-
      // agnostic — cheap, passive, and shared.
      className={`absolute md:fixed top-0 w-full z-50 bg-white border-b border-black/[0.06] transition-all duration-300 ${
        scrolled
          ? 'md:bg-[#0a1628]/85 md:backdrop-blur-[10px] md:border-white/10'
          : 'md:bg-transparent md:border-transparent'
      }`}
    >
      <Container>
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            aria-label="Suncoast Pool Pros home"
            className="shrink-0 flex items-center gap-2"
          >
            {/* MOBILE (<md): full brand lockup — wave mark + STACKED wordmark
                (SUNCOAST bold over POOL PROS, letter-spaced so both lines span
                the same width). Explicit img width/height reserves the box
                pre-load (CLS).
                DESKTOP/TABLET (md+): the original single-line wordmark in one
                color. CSS visibility split only — the DOM is identical at
                every viewport (no content-hiding penalty, no hydration risk).
                All lines are Montserrat 700 — the one display weight
                NAV_FONTS preloads on every page. */}
            <img
              src="/icon-mark.svg"
              alt=""
              aria-hidden="true"
              width={37}
              height={24}
              className="h-7 w-auto md:hidden"
            />
            <span className="flex md:hidden flex-col text-[#0a1628] uppercase font-display font-bold">
              <span className="text-[15px] leading-none tracking-[0.02em]">
                Suncoast
              </span>
              <span className="mt-[3px] text-[9px] leading-none tracking-[0.405em]">
                Pool Pros
              </span>
            </span>
            <span className="hidden md:inline font-display font-bold text-base tracking-wide text-white uppercase">
              Suncoast Pool Pros
            </span>
          </Link>

          {/* Inline nav links are DESKTOP-ONLY (lg+). At tablet widths the row
              (logo + 5 links + number + CTA) measured ~795px of content in a
              ~704px box, which pushed "Get a Quote" off the right edge. Tablet
              keeps the sticky dark bar + visible CTA and moves these links into
              the same white takeover menu mobile uses (it already carries all
              of them, plus Pool Care and Contact). */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Service Areas — opens mega-menu on hover */}
            <div
              className="relative"
              onMouseEnter={openAreas}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                onClick={() => setAreasOpen((v) => !v)}
                aria-expanded={areasOpen}
                aria-haspopup="true"
                className="inline-flex items-center gap-1 whitespace-nowrap text-gray-300 hover:text-white px-2.5 lg:px-3 py-2 text-sm font-semibold transition-colors"
              >
                Service Areas
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${areasOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {areasOpen && (
                <div
                  className="absolute left-1/2 top-full -translate-x-1/2 pt-3 z-50"
                  onMouseEnter={openAreas}
                  onMouseLeave={scheduleClose}
                >
                  <ServiceAreasMenu />
                </div>
              )}
            </div>

            {/* Services — the slot How It Works used to hold. How It Works
                moves INSIDE this menu rather than off the site: it handles
                billing and chemical-cost objections, which is real mid-funnel
                work, it just does not need one of five header slots. */}
            <div
              className="relative"
              onMouseEnter={openServices}
              onMouseLeave={scheduleServicesClose}
            >
              <button
                type="button"
                onClick={() => setServicesOpen((v) => !v)}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                className="inline-flex items-center gap-1 whitespace-nowrap text-gray-300 hover:text-white px-2.5 lg:px-3 py-2 text-sm font-semibold transition-colors"
              >
                Services
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {servicesOpen && (
                <div
                  className="absolute left-1/2 top-full -translate-x-1/2 pt-3 z-50"
                  onMouseEnter={openServices}
                  onMouseLeave={scheduleServicesClose}
                >
                  <ServicesMenu />
                </div>
              )}
            </div>

            {/* Pool Care was in the mobile drawer but had NO desktop entry at
                all — nine guides with no way to reach them from a desktop
                header. The slot freed by Careers pays for it. */}
            <Link
              to="/pool-care/"
              className="whitespace-nowrap text-gray-300 hover:text-white px-2.5 lg:px-3 py-2 text-sm font-semibold transition-colors"
            >
              Pool Care
            </Link>
            <Link
              to="/faq/"
              className="whitespace-nowrap text-gray-300 hover:text-white px-2.5 lg:px-3 py-2 text-sm font-semibold transition-colors"
            >
              FAQ
            </Link>
            <Link
              to="/tools/"
              className="whitespace-nowrap text-gray-300 hover:text-white px-2.5 lg:px-3 py-2 text-sm font-semibold transition-colors"
            >
              Tools
            </Link>
          </div>

          {/* ONE right-side cluster at every width, so the row is always
              [logo] … [actions] — with the inline links hidden at tablet, two
              separate right-side groups in a justify-between row would have
              left the CTA floating mid-row.
              Mobile keeps gap-4: the phone and menu are both 40px hit areas and
              the wider gutter prevents fat-finger cross-taps. */}
          <div className="flex items-center gap-4 md:gap-1.5 lg:gap-2">
            {/* Phone: full number on the dark bar at md+ */}
            <a
              href={PHONE_HREF}
              className="hidden md:inline-flex items-center gap-2 whitespace-nowrap px-2.5 lg:px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4 shrink-0" />
              {PHONE_DISPLAY}
            </a>

            {/* Icon-only phone button: tap opens OUR call/text chooser (the
                OS only shows its Call/Message sheet on long-press of a tel:
                link — the web can't trigger it from a tap). Phones only —
                md+ uses the plain number link above. */}
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setCallOpen((v) => !v)}
                aria-label={`Call or text ${PHONE_DISPLAY}`}
                aria-haspopup="true"
                aria-expanded={callOpen}
                className="w-10 h-10 flex items-center justify-center text-[#0a1628] active:scale-95 transition-transform"
              >
                {/* Filled handset: fill-current + zero stroke turns the lucide
                    outline into a solid glyph matching the wordmark's ink. */}
                <Phone className="w-5 h-5 fill-current" strokeWidth={0} />
              </button>

              {callOpen && (
                <>
                  {/* Invisible backdrop: outside tap closes the chooser. */}
                  <button
                    type="button"
                    aria-label="Close call menu"
                    onClick={() => setCallOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="overlay-accordion-in absolute right-0 top-12 z-50 w-56 rounded-2xl bg-white border border-black/10 shadow-xl shadow-black/20 overflow-hidden">
                    <a
                      href={PHONE_HREF}
                      onClick={() => setCallOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 text-[14px] font-semibold text-[#0a1628] active:bg-black/[0.04]"
                    >
                      <Phone className="w-[18px] h-[18px] text-brand-blue" strokeWidth={2} />
                      Call {PHONE_DISPLAY}
                    </a>
                    <div className="h-px bg-black/[0.06] mx-4" />
                    <a
                      href={SMS_HREF}
                      onClick={() => setCallOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 text-[14px] font-semibold text-[#0a1628] active:bg-black/[0.04]"
                    >
                      <MessageSquare className="w-[18px] h-[18px] text-brand-blue" strokeWidth={2} />
                      Text us
                    </a>
                  </div>
                </>
              )}
            </div>
            {/* Get a Quote — md+ only (mobile's CTA is the sticky tab bar).
                The show/hide MUST live on this wrapper, not on the button:
                `.btn` is declared in @layer utilities AFTER Tailwind's own
                utilities, so its `display:inline-flex` beats a `hidden` class
                on the same element (equal specificity → source order wins) and
                the button stayed visible on phones.
                Sits before the hamburger so the menu is the rightmost control
                at every width. */}
            <span className="hidden md:inline-flex">
              <button
                type="button"
                onClick={openQuoteSheet}
                className="btn btn-orange whitespace-nowrap px-4 lg:px-6"
              >
                Get a Quote
              </button>
            </span>

            {/* Hamburger — below lg (phones AND tablet). Dark ink on the white
                mobile bar, white ink on the dark tablet bar. */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
              className="relative lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-[#0a1628] hover:bg-black/5 md:text-white md:hover:bg-white/10 transition-colors"
            >
              <span className="relative block w-5 h-[14px]">
                <span
                  className={`absolute left-0 top-0 block h-0.5 w-5 rounded-full bg-current transition-transform duration-[250ms] ${
                    isOpen ? 'translate-y-[6px] rotate-45' : ''
                  }`}
                />
                <span
                  className={`absolute left-0 bottom-0 block h-0.5 w-5 rounded-full bg-current transition-transform duration-[250ms] ${
                    isOpen ? '-translate-y-[6px] -rotate-45' : ''
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </Container>
    </nav>

    {/* Mobile menu — portaled to <body> so it sits above the page's stacking
        contexts (the z-[110] works as written). It mounts ONCE after hydration
        and stays in the DOM: `is-open` toggles a composited CSS transform
        (.overlay-* in index.css) so opening is instant — no React mount, no
        frame wait — and the slide runs on the compositor thread. When closed
        the shell is pointer-events:none + inert, so the off-screen panel can't
        be tapped or focused. Nothing ships in the prerendered HTML (hydrated
        flips true only after the client mounts). */}
      {hydrated && createPortal(
          <div
            className={`nav-drawer lg:hidden fixed inset-0 z-[110] ${isOpen ? 'is-open' : ''}`}
            inert={!isOpen}
          >
            {/* Full-screen white panel. Covers the viewport edge to edge, so
                there's no scrim behind it. Opens with a composited fade + subtle
                zoom (overlay-panel-fade in index.css). Safe-area top padding
                keeps the header row clear of the notch (viewport-fit=cover
                extends the panel under the status bar). */}
            <div
              className={`overlay-panel-fade absolute inset-0 flex flex-col bg-white pt-[env(safe-area-inset-top)] ${isOpen ? 'is-open' : ''}`}
            >
              {/* Header: plain text wordmark (same treatment as the site
                  navbar, dark instead of white — no colorful mark) + bare
                  close. */}
              <div className="flex items-center justify-between pl-6 pr-3 md:pl-8 md:pr-5 h-16">
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  aria-label="Suncoast Pool Pros home"
                  className="font-display font-bold text-base tracking-wide text-[#0a1628] uppercase"
                >
                  Suncoast Pool Pros
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  className="w-11 h-11 flex items-center justify-center text-[#0a1628]"
                >
                  <X className="w-[26px] h-[26px]" strokeWidth={1.5} />
                </button>
              </div>

              {/* Nav links: plain editorial type — no icon tiles, dividers, or
                  arrows. Items render statically (no per-item entrance stagger;
                  the panel slide is the open affordance — see CLAUDE.md #12). */}
              {/* md+ (tablet, where this menu now also serves): the links
                  hugging the left of an 820px panel read as sparse, so the list
                  gets a capped, centered column and larger type. */}
              <nav className="flex-1 overflow-y-auto pl-12 pr-6 pt-8 md:px-10 md:pt-14 md:max-w-2xl md:mx-auto md:w-full md:text-[19px]">
                {/* Home first — it replaced the header logo as the way back */}
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className={`block py-3.5 text-[16px] leading-tight text-[#0a1628] ${
                    pathname === '/' ? 'font-semibold' : ''
                  }`}
                >
                  Home
                </Link>

                {/* Service Areas — expandable accordion of cities */}
                <div>
                  <button
                    type="button"
                    onClick={() => setAreasExpanded((v) => !v)}
                    aria-expanded={areasExpanded}
                    className="flex items-center gap-2 py-3.5 text-left"
                  >
                    <span className="text-[16px] leading-tight text-[#0a1628]">
                      Service Areas
                    </span>
                    <ChevronDown
                      strokeWidth={1.75}
                      className={`w-4 h-4 mt-0.5 text-[#0a1628]/45 transition-transform ${areasExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Conditionally render the city list with a simple CSS
                      fade/slide (overlay-accordion-in keyframe, plays on mount)
                      — no height-auto or grid-fr animation (both misbehaved
                      inside the menu's scroll container). */}
                  {areasExpanded && (
                    <div className="overlay-accordion-in grid grid-cols-2 gap-x-4 pb-3">
                      {cities.map((city) => {
                        const cityCls =
                          'block py-2 text-[15px] text-[#0a1628]/60 hover:text-[#0a1628] transition-colors truncate';
                        return city.to ? (
                          <Link
                            key={city.slug}
                            to={city.to}
                            onClick={() => setIsOpen(false)}
                            className={cityCls}
                          >
                            {city.name}
                          </Link>
                        ) : (
                          <a
                            key={city.slug}
                            href="#service-areas"
                            onClick={() => setIsOpen(false)}
                            className={cityCls}
                          >
                            {city.name}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {MOBILE_NAV.map((item) => {
                  const active = !!item.to && pathname === item.to;
                  const cls = `block py-3.5 text-[16px] leading-tight text-[#0a1628] ${
                    active ? 'font-semibold' : ''
                  }`;
                  return item.to ? (
                    <Link key={item.label} to={item.to} onClick={() => setIsOpen(false)} className={cls}>
                      {item.label}
                    </Link>
                  ) : (
                    <a key={item.label} href={item.href} onClick={() => setIsOpen(false)} className={cls}>
                      {item.label}
                    </a>
                  );
                })}
              </nav>

              {/* Footer: CTA + hours (call action lives in the header) */}
              <div className="px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                {/* Menu stays open: the sheet (z-[120]) layers over it, its
                    scrim frosting the menu; closing the sheet returns here.
                    NO pointerdown work on this button — the sheet is warmed
                    when the menu opens (see the effect above); mutating the
                    DOM mid-tap made iOS swallow the first click. */}
                <button
                  type="button"
                  onClick={openQuoteSheet}
                  className="btn btn-blue w-full"
                >
                  Get a Quote
                  <ArrowRight className="w-[18px] h-[18px]" />
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#0a1628]/50">
                  <Clock className="w-3.5 h-3.5" />
                  Open {HOURS_SHORT}
                </p>
              </div>
            </div>
          </div>,
      document.body,
      )}
    </>
  );
};
