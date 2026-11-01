import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ChevronDown, Clock, MessageSquare, Phone, X } from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { AreasPanel, ServicesPanel } from '@/components/landing/LandingNavMenus';
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
  'whitespace-nowrap text-[rgba(30,50,80,0.72)] hover:text-[#1e3a5f] px-2.5 lg:px-3 py-2 text-[13.5px] font-medium transition-colors';

// Hide on scroll down, reveal on scroll up. Movements of SCROLL_SLOP px or
// less are ignored (and don't move the reference point), so trackpad jitter
// can't flicker it; near the top it always shows.
const SCROLL_SLOP = 6;
const ALWAYS_SHOW_ABOVE = 80;

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
  const [hiddenByScroll, setHiddenByScroll] = useState(false);
  const lastY = useRef(0);
  const menuOpenRef = useRef(false);

  useScrollLock(isOpen);

  useEffect(() => {
    setHydrated(true);
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // The open menu's scroll lock pins and restores the page, which reads
      // as scrolling; ignore it.
      if (menuOpenRef.current) return;
      // The phone report tour (Report) holds the header away while it's
      // pinned: its progress bars sit where the header would slide in.
      if (document.documentElement.hasAttribute('data-header-hold')) {
        setHiddenByScroll(true);
        lastY.current = y;
        return;
      }
      if (y < ALWAYS_SHOW_ABOVE) {
        setHiddenByScroll(false);
        lastY.current = y;
        return;
      }
      const delta = y - lastY.current;
      if (Math.abs(delta) <= SCROLL_SLOP) return;
      setHiddenByScroll(delta > 0);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track the menu for the scroll handler, and once it closes, take the
  // restored scroll position as the new reference point.
  useEffect(() => {
    menuOpenRef.current = isOpen;
    if (!isOpen) lastY.current = window.scrollY;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Hover menus: a short close delay forgives a pointer that strays off the
  // trigger or the menu for a moment.
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
    }, 160);
  };

  const quoteFromMenu = () => {
    setAreasOpen(false);
    setServicesOpen(false);
    focusQuoteForm();
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Every width: sticks to the top and gains a shadow once the page
          scrolls (the site header's frosted-dark-on-scroll, in light), hides
          while scrolling down and comes back on scroll up. Phones included:
          the site header scrolls away on mobile because its bottom tab bar
          (StickyMobileCta) carries call and quote there, and this page has
          no such bar. Solid white, no blur, and the slide is a transform,
          so it stays cheap on iOS (CLAUDE.md #10). The hide is a
          data-attribute from React state, styled by a class: an inline
          transform would be flattened on phones by the
          `.force-static-motion [style*="transform"]` rule, and a class
          toggled by hand would be reset by re-renders. Reduced motion still hides and
          shows, just without the slide. The hairline is a shadow, not a
          border: a border would make the header 65px and push the
          full-screen hero 1px past the fold. From lg up the hairline stays
          flat even when scrolled, so the dropdowns hang flush from it. */}
      <header
        data-scroll-hidden={hiddenByScroll ? '' : undefined}
        className={`z-50 bg-white data-[scroll-hidden]:[transform:translateY(-100%)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none sticky top-0 ${
          scrolled
            ? 'shadow-[0_1px_0_0_rgba(36,58,85,0.08),0_8px_24px_-16px_rgba(36,58,85,0.35)]'
            : 'shadow-[0_1px_0_0_rgba(36,58,85,0.08)]'
        } lg:shadow-[0_1px_0_0_#e5e7eb]`}
      >
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" aria-label="Suncoast Pool Pros home" className="flex shrink-0 items-center gap-2">
              {/* The logo at every width: wave mark + stacked wordmark (the
                  site header's phone lockup, in navy), a little larger from
                  md up. The two lines' sizes and tracking scale together, so
                  "POOL PROS" stays the width of "SUNCOAST". */}
              <img src="/icon-mark.svg" alt="" aria-hidden="true" width={37} height={24} className="h-7 w-auto md:h-[30px]" />
              <span className={`flex flex-col font-display font-bold uppercase ${INK}`}>
                <span className="text-[15px] leading-none tracking-[0.02em] md:text-[16px]">Suncoast</span>
                <span className="mt-[3px] text-[9px] leading-none tracking-[0.405em] md:mt-[3.25px] md:text-[9.6px]">
                  Pool Pros
                </span>
              </span>
            </Link>

            {/* Inline links: lg+ only, as on the site header (they don't fit
                beside the phone and CTA at tablet width). The nav and the menu
                triggers' wrappers run the header's full height, so each menu
                (LandingNavMenus) hangs from the header's bottom edge and the
                pointer never leaves the wrapper on its way down. */}
            <nav aria-label="Main" className="hidden items-center gap-1 self-stretch lg:flex">
              <div className="relative flex self-stretch" onMouseEnter={() => openMenu('areas')} onMouseLeave={scheduleClose}>
                <button
                  type="button"
                  onClick={() => (areasOpen ? setAreasOpen(false) : openMenu('areas'))}
                  aria-expanded={areasOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1 ${linkClass} ${areasOpen ? 'text-[#1e3a5f]!' : ''}`}
                >
                  Service Areas
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${areasOpen ? 'rotate-180' : ''}`} />
                </button>
                <AreasPanel open={areasOpen} onQuote={quoteFromMenu} />
              </div>

              <div className="relative flex self-stretch" onMouseEnter={() => openMenu('services')} onMouseLeave={scheduleClose}>
                <button
                  type="button"
                  onClick={() => (servicesOpen ? setServicesOpen(false) : openMenu('services'))}
                  aria-expanded={servicesOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1 ${linkClass} ${servicesOpen ? 'text-[#1e3a5f]!' : ''}`}
                >
                  Services
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>
                <ServicesPanel open={servicesOpen} />
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
              <a href={PHONE_HREF} className={`hidden items-center md:inline-flex ${linkClass}`}>
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

              {/* Navy, not the site's orange: on this page the one warm color
                  is the form's amber button, and an orange beside it would
                  compete. */}
              <span className="hidden md:inline-flex">
                <button
                  type="button"
                  onClick={focusQuoteForm}
                  className="inline-flex h-[38px] items-center whitespace-nowrap rounded-[10px] bg-sc-navy px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#1c2f46]"
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
