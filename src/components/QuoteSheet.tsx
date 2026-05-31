import React, { createContext, useContext, useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { X, Handshake } from 'lucide-react';
import { QuoteChooser } from '@/components/QuoteChooser';
import { PHONE_HREF } from '@/lib/contact';

/**
 * Slide-up bottom sheet (mobile) that hosts the QuoteChooser.
 * Any component can open it via the useQuoteSheet() hook.
 */
type Ctx = { open: () => void; close: () => void; isOpen: boolean };
const QuoteSheetContext = createContext<Ctx | null>(null);

export const useQuoteSheet = () => {
  const ctx = useContext(QuoteSheetContext);
  if (!ctx) throw new Error('useQuoteSheet must be used within <QuoteSheetProvider>');
  return ctx;
};

export const QuoteSheetProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Tracks whether the form inside the chooser was successfully submitted, so
  // the sheet header can swap to a confirmation. Reset whenever the sheet is
  // (re)opened so a fresh visit always starts on the question, not the thanks.
  const [submitted, setSubmitted] = useState(false);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const open = () => {
    setSubmitted(false);
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  return (
    <QuoteSheetContext.Provider value={{ open, close, isOpen }}>
      {children}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center sm:p-6">
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              // Solid scrim on mobile (md:backdrop-blur only): the blur's
              // unmount otherwise re-rasterizes the page behind it on iOS,
              // causing a blank/repaint flash when the sheet closes.
              className="absolute inset-0 bg-black/80 md:bg-black/70 md:backdrop-blur-[10px]"
              onClick={close}
            />

            {/* Panel — bottom sheet on mobile, centered modal on desktop */}
            <m.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0b1726] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl px-5 pt-3 pb-8 sm:p-8 shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.7)] sm:shadow-2xl sm:shadow-black/60"
            >
              {/* Grab handle (mobile only) */}
              <div className="sm:hidden mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />

              <div className="flex items-start justify-between mb-5 pb-5 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-[22px] sm:text-2xl font-display font-bold text-white leading-tight tracking-tight">
                    {submitted ? 'Thank you!' : 'Tell us about your pool.'}
                  </h2>
                  <p className="text-gray-400 text-[14px] mt-1.5 leading-snug">
                    {submitted
                      ? "We've received your details and will be in touch soon."
                      : 'Three ways to start. Pick whichever fits.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 shrink-0 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <QuoteChooser onSubmitted={() => setSubmitted(true)} />

              {/* Quiet escalation line — signals in-person visits are available
                  without making them a fourth visible option. Premium buyers who
                  want this will ask; everyone else picks one of the three above.
                  Hidden after a successful submit so the confirmation reads clean. */}
              {!submitted && (
              <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-2">
                <Handshake className="w-4 h-4 text-gray-500 shrink-0" />
                <p className="text-[13px] text-gray-500">
                  Often the best quotes come from seeing the pool ourselves.{' '}
                  <a
                    href={PHONE_HREF}
                    className="text-gray-200 hover:text-white underline underline-offset-2 decoration-white/20 hover:decoration-white/50 transition-colors"
                  >
                    Give us a call to schedule.
                  </a>
                </p>
              </div>
              )}
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </QuoteSheetContext.Provider>
  );
};
