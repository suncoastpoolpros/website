import { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Home, CircleDollarSign, Headset } from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { useQuoteSheet } from '@/components/QuoteSheet';

// Fraction of the page the user must scroll past before the bar appears.
// Tunable: lower = sooner, higher = further down. Page-length-relative, so it
// scales with each page (later on long pages, sooner on short ones).
const SHOW_AFTER_PAGE_FRACTION = 0.2;

/**
 * Mobile-only floating bottom tab bar (app-style): Home / Quote / Support.
 * Quote opens the quote sheet; Home and Support navigate, with the active
 * route's icon highlighted in a filled brand-blue circle.
 *
 * Appears once the user has scrolled past ~20% of the page (page-length-
 * relative, so it scales per page), and hides while the quote sheet is open
 * or once the #quote form / footer is on screen (so it never covers them).
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

    const state = { pastThreshold: false, formVisible: false, footerVisible: false };
    const apply = () =>
      setShow(state.pastThreshold && !state.formVisible && !state.footerVisible);

    // The #quote form and footer still gate via IntersectionObserver (no layout
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

    // %-of-page trigger. All layout reads (scrollY/scrollHeight/innerHeight)
    // happen inside a rAF — which runs after the browser's own layout and with
    // no DOM mutations in between, so it's a clean read, not a forced reflow.
    // Reading scrollHeight per frame (vs caching) keeps the threshold correct
    // as below-fold lazy images load and grow the page.
    let ticking = false;
    const evaluate = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const past = max > 0 && window.scrollY / max >= SHOW_AFTER_PAGE_FRACTION;
      if (past !== state.pastThreshold) {
        state.pastThreshold = past;
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
    // Defer the initial check to rAF too (don't read layout synchronously in the
    // mount effect — that forces a reflow during hydration commit).
    const raf = requestAnimationFrame(evaluate);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Icon sits in a fixed-size circle so active/inactive rows align; only the
  // active route's circle is filled.
  const tab = (active: boolean) => ({
    item: 'flex flex-col items-center gap-1 px-5 py-1.5 active:scale-95 transition-transform',
    icon: `w-11 h-11 rounded-full flex items-center justify-center ${
      active ? 'bg-brand-blue text-white' : 'text-[#3f4650]'
    }`,
    label: 'text-[11px] font-semibold tracking-wide text-[#2f3540]',
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
          className="sm:hidden fixed bottom-0 inset-x-0 z-[90] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div className="flex items-stretch justify-around rounded-2xl bg-white px-2 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <Link to="/" className={home.item}>
              <span className={home.icon}>
                <Home className="w-[22px] h-[22px]" strokeWidth={1.75} />
              </span>
              <span className={home.label}>Home</span>
            </Link>
            <button type="button" onClick={open} className={quote.item}>
              <span className={quote.icon}>
                <CircleDollarSign className="w-[22px] h-[22px]" strokeWidth={1.75} />
              </span>
              <span className={quote.label}>Quote</span>
            </button>
            <Link to="/contact/" className={support.item}>
              <span className={support.icon}>
                <Headset className="w-[22px] h-[22px]" strokeWidth={1.75} />
              </span>
              <span className={support.label}>Support</span>
            </Link>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
