import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { PHONE_HREF } from '@/lib/contact';
import { useLandingQuoteSheet } from '@/components/landing/LandingQuoteSheet';

// Phones and tablets: Call + a quote button, pinned to the bottom once the
// hero's button (#get-price) has scrolled up out of view. Needs a
// LandingQuoteSheetProvider above it; the Footer's bottom bar leaves room for
// it below 1024px, so it never covers the footer. Below the nav drawer (z-110) and
// the quote popup (z-120). Its blur, like every blur, is off under 768px
// (CLAUDE.md #10); the 94% white reads the same without it.
//
// By default the quote button opens the quote popup (the homepage). With
// `formId` it scrolls to that on-page form instead, and the bar steps aside
// while the form is on screen (Palm Harbor).
export const StickyQuoteBar = ({
  label = 'Get my free quote',
  formId,
}: {
  label?: string;
  /** The on-page quote form to scroll to, instead of opening the popup. */
  formId?: string;
} = {}) => {
  const { open, warm } = useLandingQuoteSheet();
  const [pastHero, setPastHero] = useState(false);
  const [formOnScreen, setFormOnScreen] = useState(false);
  const shown = pastHero && !formOnScreen;

  useEffect(() => {
    const target = document.getElementById('get-price');
    if (!target || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(target);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const form = formId ? document.getElementById(formId) : null;
    if (!form || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setFormOnScreen(e.isIntersecting));
    io.observe(form);
    return () => io.disconnect();
  }, [formId]);

  useEffect(() => {
    if (shown && !formId) warm();
  }, [shown, warm, formId]);

  const onQuote = () => {
    if (!formId) return open();
    const form = document.getElementById(formId);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    form?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div
      inert={!shown}
      className={`fixed inset-x-0 bottom-0 z-[90] flex gap-2.5 border-t border-[rgba(36,58,85,0.1)] bg-white/[0.94] px-[14px] pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_24px_-12px_rgba(16,24,40,0.18)] backdrop-blur-[14px] transition-transform duration-[220ms] ease-out lg:hidden ${
        shown ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <a
        href={PHONE_HREF}
        className="flex h-[50px] w-[34%] shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[rgba(36,58,85,0.18)] bg-white text-[16px] font-semibold text-[#243a55]"
      >
        <Phone className="h-[18px] w-[18px] text-[#2a78b8]" strokeWidth={2.25} />
        Call
      </a>
      <button
        type="button"
        onClick={onQuote}
        className="h-[50px] min-w-0 flex-1 rounded-[10px] bg-[#f7b500] text-[16px] font-semibold text-[#1c2f47]"
      >
        {label}
      </button>
    </div>
  );
};
