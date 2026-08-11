import { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Home, CircleDollarSign, Headset } from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { useQuoteSheet } from '@/components/QuoteSheet';

/**
 * Mobile-only bottom tab bar (app-style, full-bleed): Home / Quote / Support.
 * Quote opens the quote sheet; Home and Support navigate, with the active
 * route's icon highlighted in a filled brand-blue circle.
 *
 * Visible from page load (no scroll threshold); hides while the quote sheet
 * is open or once the #quote form / footer is on screen (so it never covers
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

    const state = { formVisible: false, footerVisible: false };
    const apply = () => setShow(!state.formVisible && !state.footerVisible);

    // The #quote form and footer gate via IntersectionObserver (no layout
    // thrash) so the bar never covers them. Observer callbacks always fire
    // once on observe() with the initial intersection state, so this also
    // sets the bar's initial visibility without any synchronous layout read.
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === quote) state.formVisible = e.isIntersecting;
        else if (e.target === footer) state.footerVisible = e.isIntersecting;
      }
      apply();
    });
    if (quote) obs.observe(quote);
    if (footer) obs.observe(footer);
    // No observable targets on this page → nothing will ever call apply().
    if (!quote && !footer) apply();

    return () => obs.disconnect();
  }, []);

  // Icon sits in a fixed-size circle so active/inactive rows align; only the
  // active route's circle is filled.
  const tab = (active: boolean) => ({
    item: 'flex flex-col items-center gap-1 px-5 py-1.5 active:scale-95 transition-transform',
    icon: `w-11 h-11 rounded-full flex items-center justify-center ${
      active ? 'bg-brand-blue text-white' : 'text-[#3f4650]'
    }`,
    label: 'text-[13px] font-semibold tracking-wide text-[#2f3540]',
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
          {/* Full-bleed: rounded top corners only, flush to the screen edges;
              the white surface owns the home-indicator safe area. */}
          <div className="flex items-stretch justify-around rounded-t-2xl bg-white px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
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
