import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { ArrowRight, Phone } from 'lucide-react';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';

/**
 * Mobile-only sticky bottom CTA bar. Appears after the user scrolls past the
 * hero (so it never competes with the hero's own CTA), and hides while the
 * quote sheet is open or once the footer quote form is reached.
 */
export const StickyMobileCta = () => {
  const { open, isOpen } = useQuoteSheet();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // This bar is sm:hidden (mobile only); skip all work on >=sm viewports.
    const mq = window.matchMedia('(max-width: 639px)');
    if (!mq.matches) return;

    // Use IntersectionObserver instead of reading layout (getBoundingClientRect)
    // on every scroll — the latter forces synchronous reflow (flagged by
    // Lighthouse). IO reports visibility off the main thread with no layout
    // thrash. The bar shows once the hero has scrolled away AND neither the
    // #quote form nor the footer is on screen (so it never covers them).
    const hero = document.querySelector('h1');                 // hero is the first H1
    const quote = document.getElementById('quote');
    const footers = document.querySelectorAll('footer');
    const footer = footers[footers.length - 1] || null;        // page footer (last)

    const state = { heroVisible: true, formVisible: false, footerVisible: false };
    const apply = () => setShow(!state.heroVisible && !state.formVisible && !state.footerVisible);

    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) state.heroVisible = e.isIntersecting;
        else if (e.target === quote) state.formVisible = e.isIntersecting;
        else if (e.target === footer) state.footerVisible = e.isIntersecting;
      }
      apply();
    });
    if (hero) obs.observe(hero);
    if (quote) obs.observe(quote);
    if (footer) obs.observe(footer);
    return () => obs.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {show && !isOpen && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="sm:hidden fixed bottom-0 inset-x-0 z-[90] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-[#07111c] via-[#07111c]/95 to-transparent"
        >
          <div className="flex gap-2.5">
            {/* Compact tap-to-call — matches the chooser's "Call us" icon tile */}
            <a
              href={PHONE_HREF}
              aria-label={`Call ${PHONE_DISPLAY}`}
              className="w-1/4 shrink-0 flex items-center justify-center py-3.5 rounded-xl bg-white/[0.14] border border-white/15 active:scale-[0.96] transition-transform"
            >
              <Phone className="w-5 h-5 text-brand-blue-light" />
            </a>
            {/* Primary quote action */}
            <button
              type="button"
              onClick={open}
              className="btn btn-blue w-3/4 active:scale-[0.98]"
            >
              Get a Quote
              <ArrowRight className="w-[18px] h-[18px]" />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
