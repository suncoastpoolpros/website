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
    // This bar is sm:hidden (mobile only). Don't run the scroll listener or any
    // layout reads on >=sm viewports — on desktop the bar never renders, so the
    // getBoundingClientRect/querySelectorAll work was pure waste and showed up
    // as a forced reflow in Lighthouse. Bail unless we're on a phone.
    const mq = window.matchMedia('(max-width: 639px)');
    if (!mq.matches) return;

    // The scroll handler reads layout (getBoundingClientRect / querySelectorAll),
    // which is expensive to run on every scroll event and can thrash layout on a
    // phone. Throttle to one read per animation frame via rAF so we never do
    // more layout work than the screen can paint.
    let ticking = false;
    const measure = () => {
      ticking = false;
      // Show once we've scrolled roughly past the hero (~70% of viewport).
      const pastHero = window.scrollY > window.innerHeight * 0.7;

      // Hide when the footer quote form is in view so we don't cover it.
      const quote = document.getElementById('quote');
      let nearForm = false;
      if (quote) {
        const rect = quote.getBoundingClientRect();
        nearForm = rect.top < window.innerHeight && rect.bottom > 0;
      }

      // Hide once the page footer enters the viewport. Use the last <footer>
      // since the service-report mockup also renders one earlier in the DOM.
      const footers = document.querySelectorAll('footer');
      const footer = footers[footers.length - 1];
      let nearFooter = false;
      if (footer) {
        const rect = footer.getBoundingClientRect();
        nearFooter = rect.top < window.innerHeight;
      }

      setShow(pastHero && !nearForm && !nearFooter);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
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
