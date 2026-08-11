import { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Home, CircleDollarSign, Headset } from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { useQuoteSheet } from '@/components/QuoteSheet';

// Show the bar once the user has scrolled this fraction of one VIEWPORT
// height (not page length — consistent across long and short pages). 0.7 so
// the bar slides in slightly before the non-sticky header (with its quote
// pill) has fully scrolled away: there's never a CTA-less scroll position.
const SHOW_AFTER_VIEWPORT_FRACTION = 0.7;

/**
 * Mobile-only bottom tab bar (app-style, full-bleed): Home / Quote / Support.
 * Quote opens the quote sheet; Home and Support navigate, with the active
 * route's icon highlighted in a filled brand-blue circle.
 *
 * Hidden above the fold (the hero + the header's quote pill own that zone);
 * appears past ~0.7 viewport of scroll, and hides while the quote sheet is
 * open or once the #quote form / footer is on screen (so it never covers
 * them).
 */
export const StickyMobileCta = () => {
  const { open, isOpen } = useQuoteSheet();
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // This bar is sm:hidden (mobile only); skip all work on >=sm viewports.
    const mq = window.matchMedia('(max-width: 639px)');
    if (!mq.matches) return;

    const quote = document.getElementById('quote');
    const footers = document.querySelectorAll('footer');
    const footer = footers[footers.length - 1] || null;        // page footer (last)

    const state = { pastFold: false, formVisible: false, footerVisible: false };
    const apply = () =>
      setShow(state.pastFold && !state.formVisible && !state.footerVisible);

    // The #quote form and footer gate via IntersectionObserver (no layout
    // thrash) so the bar never covers them.
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === quote) state.formVisible = e.isIntersecting;
        else if (e.target === footer) state.footerVisible = e.isIntersecting;
      }
      apply();
    });
    if (quote) obs.observe(quote);
    if (footer) obs.observe(footer);

    // Viewport-fraction trigger. Layout reads happen inside a rAF — after the
    // browser's own layout, no mutations in between — so it's a clean read,
    // not a forced reflow.
    let ticking = false;
    const evaluate = () => {
      const past = window.scrollY >= window.innerHeight * SHOW_AFTER_VIEWPORT_FRACTION;
      if (past !== state.pastFold) {
        state.pastFold = past;
        apply();
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        evaluate();
      });
    };
    // Defer the initial check to rAF too (don't read layout synchronously in
    // the mount effect — that forces a reflow during hydration commit).
    const raf = requestAnimationFrame(evaluate);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Icon sits in a fixed-size circle so active/inactive rows align; the
  // active route gets the filled circle AND a brand-blue label, inactive
  // items sit quieter in gray — the state reads at a glance.
  const tab = (active: boolean) => ({
    item: 'flex-1 flex flex-col items-center gap-0.5 py-0.5 active:scale-95 transition-transform',
    icon: `w-9 h-9 rounded-full flex items-center justify-center ${
      active
        ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/35'
        : 'text-[#5b6472]'
    }`,
    label: `text-[13px] font-semibold tracking-wide ${
      active ? 'text-brand-blue' : 'text-[#4a5361]'
    }`,
  });

  const home = tab(pathname === '/');
  const quote = tab(false); // never shown active: the bar hides while the sheet is open
  const support = tab(pathname === '/contact/');

  return (
    <AnimatePresence>
      {show && !isOpen && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="sm:hidden fixed bottom-0 inset-x-0 z-[90]"
        >
          {/* Full-bleed: rounded top corners only (rounded-t-3xl, matching the
              quote sheet's radius), flush to the screen edges; the white
              surface owns the home-indicator safe area. Soft wide shadow
              instead of a hard edge so the bar floats off the dark page. */}
          <div className="flex items-stretch rounded-t-3xl bg-white px-3 pt-2 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-12px_44px_rgba(2,8,20,0.38)]">
            <Link to="/" className={home.item}>
              <span className={home.icon}>
                <Home className="w-5 h-5" strokeWidth={1.75} />
              </span>
              <span className={home.label}>Home</span>
            </Link>
            <button type="button" onClick={open} className={quote.item}>
              <span className={quote.icon}>
                <CircleDollarSign className="w-5 h-5" strokeWidth={1.75} />
              </span>
              <span className={quote.label}>Quote</span>
            </button>
            <Link to="/contact/" className={support.item}>
              <span className={support.icon}>
                <Headset className="w-5 h-5" strokeWidth={1.75} />
              </span>
              <span className={support.label}>Support</span>
            </Link>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
