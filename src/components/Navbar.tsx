import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { SmartLink as Link } from '@/components/SmartLink';
import { useScrollLock } from '@/lib/useScrollLock';
import {
  X,
  Phone,
  ChevronDown,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { ServiceAreasMenu } from '@/components/ServiceAreasMenu';
import { cities } from '@/lib/cities';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { PHONE_DISPLAY, PHONE_HREF, HOURS_SHORT } from '@/lib/contact';

// Mobile menu nav items. `to` routes; `href` is an in-page anchor (homepage).
// "Home" and the "Service Areas" accordion render separately above these.
type MobileNavItem = { label: string; to?: string; href?: string };
const MOBILE_NAV: MobileNavItem[] = [
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
  const { open: openQuoteSheet, warm: warmQuoteSheet, isOpen: quoteSheetOpen } = useQuoteSheet();
  const { pathname } = useLocation();
  const [areasExpanded, setAreasExpanded] = useState(false);
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
  }, [pathname]);

  // Delay close-on-leave so the user can travel from the trigger
  // down into the panel without it snapping shut.
  const openAreas = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setAreasOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setAreasOpen(false), 120);
  };

  return (
    <>
    <nav
      // Mobile: absolute (not sticky — scrolls away with the page; the menu
      // is reachable from the top, conversion lives in the sticky bottom CTA)
      // and always transparent over the hero — no scroll-triggered change.
      // Desktop: fixed, transparent at top, frosted on scroll (backdrop-blur
      // stays md:-gated; toggling blur on mobile forces iOS to re-rasterize
      // the page). `scrolled` only affects md: styles but the listener is
      // viewport-agnostic — cheap, passive, and shared.
      className={`absolute md:fixed top-0 w-full z-50 bg-transparent transition-all duration-300 ${
        scrolled
          ? 'md:bg-[#0a1628]/85 md:backdrop-blur-[10px] md:border-b md:border-white/10'
          : 'border-b border-transparent'
      }`}
    >
      <Container>
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            aria-label="Suncoast Pool Pros home"
            className="shrink-0"
          >
            <span className="font-display font-bold text-base tracking-wide text-white uppercase">
              Suncoast Pool Pros
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
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
                className="inline-flex items-center gap-1 text-gray-300 hover:text-white px-3 py-2 text-sm font-semibold transition-colors"
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

            <Link
              to="/how-it-works/"
              className="text-gray-300 hover:text-white px-3 py-2 text-sm font-semibold transition-colors"
            >
              How It Works
            </Link>
            <Link
              to="/faq/"
              className="text-gray-300 hover:text-white px-3 py-2 text-sm font-semibold transition-colors"
            >
              FAQ
            </Link>
            <Link
              to="/tools/"
              className="text-gray-300 hover:text-white px-3 py-2 text-sm font-semibold transition-colors"
            >
              Tools
            </Link>
            <Link
              to="/careers/"
              className="text-gray-300 hover:text-white px-3 py-2 text-sm font-semibold transition-colors"
            >
              Careers
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <a
              href={PHONE_HREF}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" />
              {PHONE_DISPLAY}
            </a>
            <button
              type="button"
              onClick={openQuoteSheet}
              className="btn btn-orange"
            >
              Get a Quote
            </button>
          </div>

          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-md text-gray-200 hover:text-white hover:bg-white/5 transition-colors"
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
            className={`nav-drawer md:hidden fixed inset-0 z-[110] ${isOpen ? 'is-open' : ''}`}
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
              <div className="flex items-center justify-between pl-6 pr-3 h-16">
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
              <nav className="flex-1 overflow-y-auto pl-12 pr-6 pt-8">
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
