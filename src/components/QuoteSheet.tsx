import React, { createContext, useContext, useEffect, useState } from 'react';
import { X, Handshake } from 'lucide-react';
import { QuoteChooser } from '@/components/QuoteChooser';
import { PHONE_HREF } from '@/lib/contact';
import { useScrollLock } from '@/lib/useScrollLock';
import { useOverlayTransition } from '@/lib/useOverlayTransition';

/**
 * Slide-up bottom sheet (mobile) that hosts the QuoteChooser.
 * Any component can open it via the useQuoteSheet() hook.
 */
type Ctx = {
  open: () => void;
  /** Pre-mount the sheet (hidden, parked off-screen) on the trigger's
      pointerdown. The QuoteChooser mount is heavy enough to drop the first
      frames of the open transition when it happens on tap — the slide then
      starts mid-flight and reads as "it just appears". Warming on finger-down
      buys ~100ms so the entrance animates from an already-painted panel. */
  warm: () => void;
  close: () => void;
  isOpen: boolean;
};
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
  // Warmed = mounted early (hidden) so opening never mounts on tap. Sticky
  // after first use: the sheet then stays in the DOM across open/close, which
  // also makes repeat opens instant.
  const [warmed, setWarmed] = useState(false);
  // Mount/visible timing for the CSS-driven slide (see useOverlayTransition).
  const sheet = useOverlayTransition(isOpen);

  // Lock body scroll while the sheet is open (iOS-safe, shared hook).
  useScrollLock(isOpen);

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
  const warm = () => setWarmed(true);
  const close = () => setIsOpen(false);

  return (
    <QuoteSheetContext.Provider value={{ open, warm, close, isOpen }}>
      {children}

      {(sheet.mounted || warmed) && (
          // z-[120]: above the mobile nav menu (z-[110]) — the menu's CTA opens
          // this sheet OVER the still-open menu, scrim dimming it.
          // pointer-events/inert gate: while warmed-but-closed (or exiting) the
          // full-screen shell must not intercept taps or focus.
          <div
            className={`quote-sheet fixed inset-0 z-[120] flex items-end sm:items-center sm:justify-center sm:p-6 ${sheet.visible ? '' : 'pointer-events-none'}`}
            inert={!sheet.visible}
          >
            {/* Backdrop: pure animated frost, no dim — scrim-blur ramps
                0 → 6px on open, back to 0 BEFORE unmount (the animate-to-zero
                is what sidesteps the iOS unmount blank-flash that originally
                banned mobile blur here, CLAUDE.md #10). Same treatment over
                the nav menu, page content, and the desktop modal. */}
            <div
              className={`overlay-scrim allow-blur scrim-blur absolute inset-0 ${sheet.visible ? 'is-open' : ''}`}
              onClick={close}
            />

            {/* Panel — bottom sheet on mobile, centered modal on desktop. The
                slide-up is a composited CSS transform (overlay-panel-bottom),
                off the main thread, replacing the old Framer spring that
                recomputed physics every frame while the chooser form mounted. */}
            <div
              className={`overlay-panel-bottom relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-t sm:border border-black/[0.08] rounded-t-3xl sm:rounded-3xl px-5 pt-3 pb-8 sm:p-8 sm:shadow-2xl sm:shadow-black/60 ${sheet.visible ? 'is-open' : ''}`}
            >
              {/* Grab handle (mobile only) */}
              <div className="sm:hidden mx-auto mb-5 h-1.5 w-12 rounded-full bg-black/15" />

              <div className="flex items-start justify-between mb-5 pb-5 border-b border-black/[0.08]">
                <div>
                  <h2 className="text-[22px] sm:text-2xl font-display font-bold text-[#0a1628] leading-tight tracking-tight">
                    {submitted ? 'Thank you!' : 'Tell us about your pool.'}
                  </h2>
                  <p className="text-gray-600 text-[14px] mt-1.5 leading-snug">
                    {submitted
                      ? "We've received your details and will be in touch soon."
                      : 'Three ways to start. Pick whichever fits.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full bg-black/[0.04] border border-black/10 flex items-center justify-center text-gray-500 hover:text-[#0a1628] hover:bg-black/[0.07] hover:border-black/20 shrink-0 transition-colors"
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
              <div className="mt-6 pt-5 border-t border-black/[0.08] flex items-center justify-center gap-2">
                <Handshake className="w-4 h-4 text-gray-500 shrink-0" />
                <p className="text-[13px] text-gray-500">
                  Often the best quotes come from seeing the pool ourselves.{' '}
                  <a
                    href={PHONE_HREF}
                    className="text-gray-800 hover:text-[#0a1628] underline underline-offset-2 decoration-black/25 hover:decoration-black/50 transition-colors"
                  >
                    Give us a call to schedule.
                  </a>
                </p>
              </div>
              )}
            </div>
          </div>
        )}
    </QuoteSheetContext.Provider>
  );
};
