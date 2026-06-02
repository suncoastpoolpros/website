import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { SmartLink as Link } from '@/components/SmartLink';
import { useScrollLock } from '@/lib/useScrollLock';
import {
  X,
  Phone,
  ChevronDown,
  MapPin,
  Workflow,
  HelpCircle,
  Briefcase,
  Mail,
  ArrowRight,
  Clock,
  Wrench,
} from 'lucide-react';
import { ServiceAreasMenu } from '@/components/ServiceAreasMenu';
import { cities } from '@/lib/cities';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { PHONE_DISPLAY, PHONE_HREF, HOURS_SHORT } from '@/lib/contact';

// Mobile drawer nav items. `to` routes; `href` is an in-page anchor (homepage).
type MobileNavItem = { label: string; icon: React.ComponentType<{ className?: string }>; to?: string; href?: string };
// "Service Areas" is rendered separately as an expandable accordion (see below).
const MOBILE_NAV: MobileNavItem[] = [
  { label: 'How It Works', icon: Workflow, to: '/how-it-works' },
  { label: 'FAQ', icon: HelpCircle, to: '/faq' },
  { label: 'Tools', icon: Wrench, to: '/tools' },
  { label: 'Careers', icon: Briefcase, to: '/careers' },
  { label: 'Contact', icon: Mail, to: '/contact' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const { open: openQuoteSheet } = useQuoteSheet();
  const { pathname } = useLocation();
  const [areasExpanded, setAreasExpanded] = useState(false);
  // The drawer is mounted ONCE, right after hydration (not on tap), then kept
  // in the DOM off-screen. Opening is then just an `is-open` class toggle — no
  // React mount and no animation-frame wait on tap, so it slides immediately
  // (the residual open-delay was the on-tap mount). `hydrated` gates the portal
  // so nothing renders during SSR/first hydration commit.
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

  // While the mobile drawer is open: lock body scroll (iOS-safe, shared hook)
  // and close on Escape.
  useScrollLock(isOpen);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

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
      // backdrop-blur is desktop-only (md:). On mobile, toggling it on scroll
      // and unmounting the drawer's blur together forces iOS Safari to
      // re-rasterize the whole page — a visible blank/repaint flash. A solid
      // bg on mobile reads the same without the GPU re-raster.
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a1628] md:bg-[#0a1628]/85 md:backdrop-blur-[10px] border-b border-white/10'
          : 'bg-transparent border-b border-transparent'
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
              to="/how-it-works"
              className="text-gray-300 hover:text-white px-3 py-2 text-sm font-semibold transition-colors"
            >
              How It Works
            </Link>
            <Link
              to="/faq"
              className="text-gray-300 hover:text-white px-3 py-2 text-sm font-semibold transition-colors"
            >
              FAQ
            </Link>
            <Link
              to="/tools"
              className="text-gray-300 hover:text-white px-3 py-2 text-sm font-semibold transition-colors"
            >
              Tools
            </Link>
            <Link
              to="/careers"
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

    {/* Mobile drawer — rendered as a sibling of <nav>, NOT inside it. The
        scrolled navbar applies backdrop-blur which creates a stacking context;
        any drawer rendered inside the nav gets trapped at z-50 and the sticky
        mobile CTA (z-90) bleeds through. Hoisting the drawer to the top level
        lets its z-[110] work as written. */}
      {/* Drawer is portaled to <body> so it sits above the page's stacking
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
            {/* Backdrop. Solid scrim instead of backdrop-blur: on mobile the
                blur's unmount re-rasterizes the page behind it (blank/repaint
                flash on iOS). Higher opacity keeps the same dimmed look. */}
            <div
              onClick={() => setIsOpen(false)}
              className={`overlay-scrim absolute inset-0 bg-black/75 md:backdrop-blur-[10px] md:bg-black/60 ${isOpen ? 'is-open' : ''}`}
            />

            {/* Panel. overlay-panel-right slides it in from the right via a
                composited transform; will-change is set in CSS so the large
                shadow-2xl rasterizes once and just composites as it slides.
                (Drawer is client-only, so this never affects prerendered HTML.) */}
            <div
              className={`overlay-panel-right absolute right-0 top-0 h-full w-[82%] max-w-sm flex flex-col bg-[#0a1628] border-l border-white/10 shadow-2xl shadow-black/60 ${isOpen ? 'is-open' : ''}`}
            >
              {/* Brand bloom for depth */}
              <div className="absolute top-0 right-0 w-56 h-56 bg-brand-blue/15 rounded-full blur-[100px] pointer-events-none" />

              {/* Header */}
              <div className="relative flex items-center justify-between px-5 h-16 border-b border-white/10">
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  aria-label="Suncoast Pool Pros home"
                  className="flex items-center gap-2.5"
                >
                  <img src="/icon-mark.svg" alt="" aria-hidden="true" width={37} height={24} className="h-6 w-auto" />
                  <span className="font-display font-bold text-sm tracking-wide text-white uppercase">
                    Suncoast Pool Pros
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="relative flex-1 overflow-y-auto px-4 py-5">
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Menu
                </p>
                {/* Items render statically (no per-item entrance stagger). The
                    panel slide + backdrop fade are the open affordance; animating
                    ~6 items at once on top of the slide + mounting this subtree in
                    one frame made the open hesitate on mobile (this drawer is
                    md:hidden, so the stagger only ever ran on phones anyway). */}
                <div className="space-y-1">
                  {/* Service Areas — expandable accordion of cities */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setAreasExpanded((v) => !v)}
                      aria-expanded={areasExpanded}
                      className="group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors hover:bg-white/[0.04]"
                    >
                      <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border bg-white/[0.06] border-white/10 group-hover:bg-brand-blue/15 group-hover:border-brand-blue/30 transition-colors">
                        <MapPin className="w-[18px] h-[18px] text-brand-blue-light" />
                      </span>
                      <span className="flex-1 text-left text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors">
                        Service Areas
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform ${areasExpanded ? 'rotate-180 text-brand-blue-light' : ''}`}
                      />
                    </button>

                    {/* Conditionally render the city list with a simple CSS
                        fade/slide (overlay-accordion-in keyframe, plays on mount)
                        — no height-auto or grid-fr animation (both misbehaved
                        inside the drawer's scroll container). */}
                    {areasExpanded && (
                      <div
                        className="overlay-accordion-in ml-[3.25rem] mr-1 mt-1 mb-2 grid grid-cols-2 gap-1 border-l border-white/10 pl-3"
                      >
                        {cities.map((city) => {
                          const cityCls =
                            'block py-2 px-2 rounded-lg text-[13px] text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors truncate';
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
                    const content = (
                      <>
                        <span
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                            active
                              ? 'bg-brand-blue/20 border-brand-blue/40'
                              : 'bg-white/[0.06] border-white/10 group-hover:bg-brand-blue/15 group-hover:border-brand-blue/30'
                          }`}
                        >
                          <item.icon className="w-[18px] h-[18px] text-brand-blue-light" />
                        </span>
                        <span
                          className={`flex-1 text-[15px] transition-colors ${
                            active
                              ? 'text-white font-semibold'
                              : 'text-gray-200 font-semibold group-hover:text-white'
                          }`}
                        >
                          {item.label}
                        </span>
                        <ArrowRight
                          className={`w-4 h-4 transition-all ${
                            active
                              ? 'text-brand-blue-light'
                              : 'text-gray-600 group-hover:text-brand-blue-light group-hover:translate-x-0.5'
                          }`}
                        />
                      </>
                    );
                    const cls = `group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                      active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                    }`;
                    return (
                      <div key={item.label}>
                        {item.to ? (
                          <Link to={item.to} onClick={() => setIsOpen(false)} className={cls}>
                            {content}
                          </Link>
                        ) : (
                          <a href={item.href} onClick={() => setIsOpen(false)} className={cls}>
                            {content}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </nav>

              {/* Footer: CTA + call + hours */}
              <div className="relative border-t border-white/10 p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openQuoteSheet();
                  }}
                  className="btn btn-orange w-full"
                >
                  Get a Quote
                  <ArrowRight className="w-[18px] h-[18px]" />
                </button>
                <a
                  href={PHONE_HREF}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-white/[0.06] border border-white/10 text-white font-semibold text-[15px] hover:bg-white/10 transition-colors"
                >
                  <Phone className="w-[18px] h-[18px] text-brand-blue-light" />
                  {PHONE_DISPLAY}
                </a>
                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
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
