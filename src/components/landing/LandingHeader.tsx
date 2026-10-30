import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ChevronDown, Clock, MessageSquare, Phone, X } from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { ServiceAreasMenu } from '@/components/ServiceAreasMenu';
import { ServicesMenu } from '@/components/ServicesMenu';
import { cities } from '@/lib/cities';
import { HOURS_SHORT, PHONE_DISPLAY, PHONE_HREF, SMS_HREF } from '@/lib/contact';
import { useScrollLock } from '@/lib/useScrollLock';
import { focusQuoteForm } from '@/components/landing/HeroQuoteForm';

/*
 * /landing's header: the site Navbar (src/components/Navbar.tsx), ported to a
 * light page. Same layout, type, menus and mobile takeover, so the two read as
 * one brand; only the colors change (navy ink on white instead of white on a
 * dark bar), and every "Get a Quote" goes to the form on this page rather than
 * the site's quote-sheet popup.
 *
 * Kept as a port rather than a `theme` prop on Navbar: Navbar runs on every
 * other page, and its dark styling is threaded through dozens of classes.
 * When Navbar's structure changes (links, menus), mirror it here.
 */

// Same list and order as Navbar's MOBILE_NAV. "Home" and the Service Areas
// accordion render separately above these.
const MOBILE_NAV = [
  { label: 'Services', to: '/services/' },
  { label: 'How It Works', to: '/how-it-works/' },
  { label: 'FAQ', to: '/faq/' },
  { label: 'Tools', to: '/tools/' },
  { label: 'Pool Care', to: '/pool-care/' },
  { label: 'Careers', to: '/careers/' },
  { label: 'Contact', to: '/contact/' },
];

const INK = 'text-sc-navy';
const linkClass =
  'whitespace-nowrap text-sc-navy/70 hover:text-sc-navy px-2.5 lg:px-3 py-2 text-sm font-semibold transition-colors';

export const LandingHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [areasExpanded, setAreasExpanded] = useState(false);
  // The mobile menu mounts once after hydration, so it's never in the
  // prerendered HTML, then stays mounted: opening is a class toggle.
  const [hydrated, setHydrated] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useScrollLock(isOpen);

  useEffect(() => {
    setHydrated(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Hover menus: a short close delay lets the pointer cross the gap between
  // the trigger and the menu without it snapping shut (same as Navbar).
  const openMenu = (which: 'areas' | 'services') => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setAreasOpen(which === 'areas');
    setServicesOpen(which === 'services');
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setAreasOpen(false);
      setServicesOpen(false);
    }, 120);
  };

  const quoteFromMenu = () => {
    setAreasOpen(false);
    setServicesOpen(false);
    focusQuoteForm();
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Phones: scrolls away with the page, like the site header on mobile.
          md+: sticks to the top and gains a shadow once the page scrolls (the
          site header's frosted-dark-on-scroll, in light). The hairline is a
          shadow, not a border: a border would make the header 65px and push
          the full-screen hero 1px past the fold. */}
      <header
        className={`relative z-50 bg-white transition-shadow duration-300 md:sticky md:top-0 ${
          scrolled
            ? 'shadow-[0_1px_0_0_rgba(36,58,85,0.08)] md:shadow-[0_1px_0_0_rgba(36,58,85,0.08),0_8px_24px_-16px_rgba(36,58,85,0.35)]'
            : 'shadow-[0_1px_0_0_rgba(36,58,85,0.08)]'
        }`}
      >
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" aria-label="Suncoast Pool Pros home" className="flex shrink-0 items-center gap-2">
              {/* Phones: wave mark + stacked wordmark. md+: the single-line
                  wordmark. Same lockups as the site header, in navy. */}
              <img src="/icon-mark.svg" alt="" aria-hidden="true" width={37} height={24} className="h-7 w-auto md:hidden" />
              <span className={`flex flex-col font-display font-bold uppercase md:hidden ${INK}`}>
                <span className="text-[15px] leading-none tracking-[0.02em]">Suncoast</span>
                <span className="mt-[3px] text-[9px] leading-none tracking-[0.405em]">Pool Pros</span>
              </span>
              <span className={`hidden font-display text-base font-bold uppercase tracking-wide md:inline ${INK}`}>
                Suncoast Pool Pros
              </span>
            </Link>

            {/* Inline links: lg+ only, as on the site header (they don't fit
                beside the phone and CTA at tablet width). */}
            <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
              <div className="relative" onMouseEnter={() => openMenu('areas')} onMouseLeave={scheduleClose}>
                <button
                  type="button"
                  onClick={() => (areasOpen ? setAreasOpen(false) : openMenu('areas'))}
                  aria-expanded={areasOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1 ${linkClass}`}
                >
                  Service Areas
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${areasOpen ? 'rotate-180' : ''}`} />
                </button>
                {areasOpen && (
                  <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3">
                    <ServiceAreasMenu tone="light" onQuote={quoteFromMenu} />
                  </div>
                )}
              </div>

              <div className="relative" onMouseEnter={() => openMenu('services')} onMouseLeave={scheduleClose}>
                <button
                  type="button"
                  onClick={() => (servicesOpen ? setServicesOpen(false) : openMenu('services'))}
                  aria-expanded={servicesOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1 ${linkClass}`}
                >
                  Services
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>
                {servicesOpen && (
                  <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3">
                    <ServicesMenu tone="light" onQuote={quoteFromMenu} />
                  </div>
                )}
              </div>

              <Link to="/pool-care/" className={linkClass}>
                Pool Care
              </Link>
              <Link to="/faq/" className={linkClass}>
                FAQ
              </Link>
              <Link to="/tools/" className={linkClass}>
                Tools
              </Link>
            </nav>

            <div className="flex items-center gap-4 md:gap-1.5 lg:gap-2">
              <a href={PHONE_HREF} className={`hidden items-center gap-2 md:inline-flex ${linkClass}`}>
                <Phone className="h-4 w-4 shrink-0" />
                {PHONE_DISPLAY}
              </a>

              {/* Phones: icon button that opens a call/text chooser (a tap on
                  a tel: link can't offer "text" too). */}
              <div className="relative md:hidden">
                <button
                  type="button"
                  onClick={() => setCallOpen((v) => !v)}
                  aria-label={`Call or text ${PHONE_DISPLAY}`}
                  aria-haspopup="true"
                  aria-expanded={callOpen}
                  className={`flex h-10 w-10 items-center justify-center transition-transform active:scale-95 ${INK}`}
                >
                  <Phone className="h-5 w-5 fill-current" strokeWidth={0} />
                </button>
                {callOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close call menu"
                      onClick={() => setCallOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div className="overlay-accordion-in absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-sc-navy/10 bg-white shadow-[0_16px_40px_-16px_rgba(36,58,85,0.35)]">
                      <a
                        href={PHONE_HREF}
                        onClick={() => setCallOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3.5 text-[14px] font-semibold active:bg-sc-navy/[0.04] ${INK}`}
                      >
                        <Phone className="h-[18px] w-[18px] text-sc-blue" strokeWidth={2} />
                        Call {PHONE_DISPLAY}
                      </a>
                      <div className="mx-4 h-px bg-sc-navy/[0.08]" />
                      <a
                        href={SMS_HREF}
                        onClick={() => setCallOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3.5 text-[14px] font-semibold active:bg-sc-navy/[0.04] ${INK}`}
                      >
                        <MessageSquare className="h-[18px] w-[18px] text-sc-blue" strokeWidth={2} />
                        Text us
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* `.btn` (site button shape) sets display after Tailwind's
                  utilities, so the md: show/hide lives on this wrapper. Navy,
                  not the site's orange: on this page the one warm color is the
                  form's amber button, and an orange beside it would compete. */}
              <span className="hidden md:inline-flex">
                <button
                  type="button"
                  onClick={focusQuoteForm}
                  className="btn whitespace-nowrap bg-sc-navy px-4 text-white hover:bg-[#1c2f46] lg:px-6"
                >
                  Get a Quote
                </button>
              </span>

              <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-sc-navy/5 lg:hidden ${INK}`}
              >
                <span className="relative block h-[14px] w-5">
                  <span className="absolute left-0 top-0 block h-0.5 w-5 rounded-full bg-current" />
                  <span className="absolute bottom-0 left-0 block h-0.5 w-5 rounded-full bg-current" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen white menu, as on the site: portaled to <body>, mounted
          after hydration and kept mounted (CSS fade/zoom, `inert` while closed). */}
      {hydrated &&
        createPortal(
          <div className={`nav-drawer fixed inset-0 z-[110] lg:hidden ${isOpen ? 'is-open' : ''}`} inert={!isOpen}>
            <div
              className={`overlay-panel-fade absolute inset-0 flex flex-col bg-white pt-[env(safe-area-inset-top)] ${isOpen ? 'is-open' : ''}`}
            >
              <div className="flex h-16 items-center justify-between pl-6 pr-3 md:pl-8 md:pr-5">
                <Link
                  to="/"
                  onClick={closeMenu}
                  aria-label="Suncoast Pool Pros home"
                  className={`font-display text-base font-bold uppercase tracking-wide ${INK}`}
                >
                  Suncoast Pool Pros
                </Link>
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Close menu"
                  className={`flex h-11 w-11 items-center justify-center ${INK}`}
                >
                  <X className="h-[26px] w-[26px]" strokeWidth={1.5} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto pl-12 pr-6 pt-8 md:mx-auto md:w-full md:max-w-2xl md:px-10 md:pt-14 md:text-[19px]">
                <Link to="/" onClick={closeMenu} className={`block py-3.5 text-[16px] leading-tight ${INK}`}>
                  Home
                </Link>

                <div>
                  <button
                    type="button"
                    onClick={() => setAreasExpanded((v) => !v)}
                    aria-expanded={areasExpanded}
                    className="flex items-center gap-2 py-3.5 text-left"
                  >
                    <span className={`text-[16px] leading-tight ${INK}`}>Service Areas</span>
                    <ChevronDown
                      strokeWidth={1.75}
                      className={`mt-0.5 h-4 w-4 text-sc-navy/45 transition-transform ${areasExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {areasExpanded && (
                    <div className="overlay-accordion-in grid grid-cols-2 gap-x-4 pb-3">
                      {cities.map((city) => {
                        const cls = 'block truncate py-2 text-[15px] text-sc-navy/60 transition-colors hover:text-sc-navy';
                        return city.to ? (
                          <Link key={city.slug} to={city.to} onClick={closeMenu} className={cls}>
                            {city.name}
                          </Link>
                        ) : (
                          <a key={city.slug} href="/#service-areas" onClick={closeMenu} className={cls}>
                            {city.name}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {MOBILE_NAV.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={closeMenu}
                    className={`block py-3.5 text-[16px] leading-tight ${INK}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    // After the scroll lock lets go, or the scroll lands on a pinned body.
                    setTimeout(focusQuoteForm, 0);
                  }}
                  className="btn w-full bg-sc-navy text-white hover:bg-[#1c2f46]"
                >
                  Get a Quote
                  <ArrowRight className="h-[18px] w-[18px]" />
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-sc-navy/50">
                  <Clock className="h-3.5 w-3.5" />
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
