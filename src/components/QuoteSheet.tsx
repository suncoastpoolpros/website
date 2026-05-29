import React, { createContext, useContext, useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { QuoteChooser } from '@/components/QuoteChooser';

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

  const open = () => setIsOpen(true);
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
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={close}
            />

            {/* Panel — bottom sheet on mobile, centered modal on desktop */}
            <m.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#0b1726] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl px-5 pt-3 pb-8 sm:p-7 shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.7)] sm:shadow-2xl sm:shadow-black/60"
            >
              {/* Grab handle (mobile only) */}
              <div className="sm:hidden mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />

              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl font-display font-bold text-white leading-tight">
                    Get your flat-rate quote
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Pick how you'd like to reach us.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <QuoteChooser />
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </QuoteSheetContext.Provider>
  );
};
