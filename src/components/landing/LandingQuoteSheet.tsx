import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LandingQuoteChooser } from '@/components/landing/LandingQuoteChooser';
import { useScrollLock } from '@/lib/useScrollLock';
import { useOverlayTransition } from '@/lib/useOverlayTransition';

/**
 * NEW VERSION of the site's quote popup (src/components/QuoteSheet.tsx),
 * hosting the quote builder (LandingQuoteChooser). It lives only on /landing
 * for now and will replace the original; until then, changes here stay here.
 * Anything inside <LandingQuoteSheetProvider> opens it with
 * useLandingQuoteSheet().
 *
 * Phones: a full-height sheet that rises from the bottom. Desktop: a centered
 * two-panel window. Behind it, a plain navy dim instead of the original's
 * blur: no backdrop-filter means nothing for iOS to re-raster (CLAUDE.md
 * #10). Both animate with composited CSS transitions (.qs-* in index.css).
 *
 * Unlike the original, which renders at the app root, this provider lives in
 * a page, so the sheet is portaled to <body>: outside the page's
 * .force-static-motion wrapper and above its stacking contexts.
 */
type Ctx = {
  open: () => void;
  /** Pre-mount the builder (hidden) before it's needed, so opening only runs
   *  the transition instead of mounting a heavy tree mid-animation. */
  warm: () => void;
  close: () => void;
  isOpen: boolean;
};
const LandingQuoteSheetContext = createContext<Ctx | null>(null);

export const useLandingQuoteSheet = () => {
  const ctx = useContext(LandingQuoteSheetContext);
  if (!ctx) throw new Error('useLandingQuoteSheet must be used within <LandingQuoteSheetProvider>');
  return ctx;
};

export const LandingQuoteSheetProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Warmed = mounted early (hidden). Sticky: the sheet then stays in the DOM
  // across open/close, so repeat opens are instant and answers survive a close.
  const [warmed, setWarmed] = useState(false);
  // After a sent request, the next open starts a fresh builder.
  const [submitted, setSubmitted] = useState(false);
  const [session, setSession] = useState(0);
  const sheet = useOverlayTransition(isOpen, 380);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const open = () => {
    if (submitted) {
      setSubmitted(false);
      setSession((n) => n + 1);
    }
    setIsOpen(true);
  };
  const warm = () => setWarmed(true);
  const close = () => setIsOpen(false);

  return (
    <LandingQuoteSheetContext.Provider value={{ open, warm, close, isOpen }}>
      {children}

      {(sheet.mounted || warmed) &&
        createPortal(
          // While warmed-but-closed (or closing), the full-screen shell must
          // not catch taps or focus. Warmed-and-closed is also `invisible`, so
          // the parked sheet is never painted at all (not merely transparent);
          // `mounted` stays true through the close transition, so it still
          // animates out.
          <div
            className={`fixed inset-0 z-[120] flex items-end sm:items-center sm:justify-center sm:p-6 ${sheet.visible ? '' : 'pointer-events-none'} ${sheet.mounted ? '' : 'invisible'}`}
            inert={!sheet.visible}
            data-quote-sheet="landing"
          >
            <div aria-hidden="true" onClick={close} className={`qs-scrim absolute inset-0 bg-[rgba(10,22,40,0.55)] ${sheet.visible ? 'is-open' : ''}`} />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Get your flat-rate price"
              className={`qs-panel relative flex h-[94dvh] w-full overflow-hidden rounded-t-[22px] bg-white font-sans text-sc-navy antialiased shadow-[0_-12px_40px_-12px_rgba(10,22,40,0.35)] sm:h-[min(620px,calc(100dvh-48px))] sm:max-w-[880px] sm:rounded-[22px] sm:shadow-[0_40px_100px_-30px_rgba(10,22,40,0.6)] ${sheet.visible ? 'is-open' : ''}`}
            >
              <React.Fragment key={session}>
                {/* Weekly preset: every trigger is on the weekly-service landing
                    page, so the flow starts at "where should we send it". */}
                <LandingQuoteChooser
                  preset="weekly"
                  active={sheet.visible}
                  onClose={close}
                  onSubmitted={() => setSubmitted(true)}
                />
              </React.Fragment>
            </div>
          </div>,
          document.body,
        )}
    </LandingQuoteSheetContext.Provider>
  );
};
