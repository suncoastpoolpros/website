import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QuotePopup } from '@/components/landing/QuotePopup';
import { trackEvent } from '@/lib/analytics';
import { useScrollLock } from '@/lib/useScrollLock';
import { useOverlayTransition } from '@/lib/useOverlayTransition';

/**
 * The homepage's quote popup (QuotePopup), separate from the site-wide one
 * (src/components/QuoteSheet.tsx). Anything inside <LandingQuoteSheetProvider>
 * opens it with useLandingQuoteSheet().
 *
 * Phones (≤760px): a bottom sheet min(600px, 100dvh − 24px) tall that rises
 * from the bottom. Wider: a centered 520 × 560 window that fades and rises in
 * (.qs-panel). Both animate with composited CSS
 * transitions (.qs-* in index.css). The desktop backdrop's blur animates back
 * to 0 before unmount (the CLAUDE.md #10 contract); phones get no blur.
 *
 * Unlike the original, which renders at the app root, this provider lives in
 * a page, so the sheet is portaled to <body>: outside the page's
 * .force-static-motion wrapper and above its stacking contexts.
 */
type Ctx = {
  open: () => void;
  /** Pre-mount the popup (hidden) before it's needed, so opening only runs
   *  the transition instead of mounting a tree mid-animation. */
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

/** The same, or null outside a provider (a page that only scrolls to its form). */
export const useOptionalLandingQuoteSheet = () => useContext(LandingQuoteSheetContext);

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])';

export const LandingQuoteSheetProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Warmed = mounted early (hidden). Sticky: the popup then stays in the DOM
  // across open/close, so repeat opens are instant and answers survive a close.
  const [warmed, setWarmed] = useState(false);
  // After a sent request, the next open starts fresh.
  const [submitted, setSubmitted] = useState(false);
  const [session, setSession] = useState(0);
  const step = useRef('choose');
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const sheet = useOverlayTransition(isOpen, 380);

  useScrollLock(isOpen);

  const open = () => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    if (submitted) {
      setSubmitted(false);
      setSession((n) => n + 1);
    }
    trackEvent('quote_popup_open');
    setIsOpen(true);
  };
  const warm = () => setWarmed(true);
  const openRef = useRef(false);
  openRef.current = isOpen;
  const close = useCallback(() => {
    if (!openRef.current) return;
    trackEvent('quote_popup_close', { at_step: step.current });
    setIsOpen(false);
  }, []);
  const onStep = useCallback((s: string) => void (step.current = s), []);

  // Escape closes; Tab stays inside the popup.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close();
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = (Array.from(panelRef.current.querySelectorAll(FOCUSABLE)) as HTMLElement[]).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = panelRef.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  // Focus moves into the dialog on open and back to the trigger on close.
  useEffect(() => {
    if (sheet.visible) panelRef.current?.focus({ preventScroll: true });
    else if (!isOpen && returnFocus.current) {
      returnFocus.current.focus({ preventScroll: true });
      returnFocus.current = null;
    }
  }, [sheet.visible, isOpen]);

  return (
    <LandingQuoteSheetContext.Provider value={{ open, warm, close, isOpen }}>
      {children}

      {(sheet.mounted || warmed) &&
        createPortal(
          // While warmed-but-closed (or closing), the full-screen shell must
          // not catch taps or focus. Warmed-and-closed is also `invisible`, so
          // the parked popup is never painted at all (not merely transparent);
          // `mounted` stays true through the close transition, so it still
          // animates out.
          <div
            className={`qs-host fixed inset-0 z-[120] flex justify-center ${sheet.visible ? '' : 'pointer-events-none'} ${sheet.mounted ? '' : 'invisible'}`}
            inert={!sheet.visible}
            data-quote-sheet="landing"
          >
            <div aria-hidden="true" onClick={close} className={`qs-scrim absolute inset-0 ${sheet.visible ? 'is-open' : ''}`} />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={headingId}
              tabIndex={-1}
              className={`qs-panel relative flex overflow-hidden bg-white font-sans text-sc-navy antialiased shadow-[0_-12px_40px_-12px_rgba(20,33,52,0.35)] outline-none min-[761px]:shadow-[0_0_0_1px_rgba(16,24,40,0.06),0_24px_48px_-12px_rgba(16,24,40,0.28),0_48px_100px_-24px_rgba(16,24,40,0.35)] ${sheet.visible ? 'is-open' : ''}`}
            >
              <React.Fragment key={session}>
                <QuotePopup
                  active={sheet.visible}
                  headingId={headingId}
                  onClose={close}
                  onSubmitted={() => setSubmitted(true)}
                  onStep={onStep}
                />
              </React.Fragment>
            </div>
          </div>,
          document.body,
        )}
    </LandingQuoteSheetContext.Provider>
  );
};
