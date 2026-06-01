import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { ArrowRight, Phone } from 'lucide-react';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';

// Fraction of the page the user must scroll past before the CTA appears.
// Tunable: lower = sooner, higher = further down. Page-length-relative, so it
// scales with each page (later on long pages, sooner on short ones).
const SHOW_AFTER_PAGE_FRACTION = 0.2;

/**
 * Mobile-only sticky bottom CTA bar. Appears once the user has scrolled past
 * ~20% of the page (page-length-relative, so it scales per page), and hides
 * while the quote sheet is open or once the #quote form / footer is on screen
 * (so it never covers them).
 */
export const StickyMobileCta = () => {
  const { open, isOpen } = useQuoteSheet();
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

  return (
    <AnimatePresence>
      {show && !isOpen && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="sm:hidden fixed bottom-0 inset-x-0 z-[90] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 bg-[#07111c] border-t border-white/10"
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
