import { useEffect, useState } from 'react';
import { ArrowRight, MessageSquare, Phone } from 'lucide-react';
import { PHONE_HREF, SMS_HREF } from '@/lib/contact';
import { QUOTE_ID, scrollToQuote } from '@/components/landing/locationKit';

/*
 * The location pages' bottom bar (Belleair Beach, Gulfport), below 1024px:
 * Call, Text and a gold "Get my free quote" that scrolls to the page's quote
 * section. It stays down while the hero's primary button (#get-price) is on
 * screen or above the fold, and steps aside again while the quote section is
 * on screen. 250ms transform in and out.
 *
 * Phones: Call and Text are small, icon over label, the quote button takes the
 * rest. Upright tablets: centred, Call and Text 120px wide with the icon
 * beside the label, the quote button 300px.
 *
 * Room for it at the foot of the page: the Footer's bottom bar already pads
 * 110px below 1024px, more than the bar's height.
 *
 * Its blur, like every blur, is off under 768px (CLAUDE.md #10); the 96% white
 * reads the same without it.
 */

const small =
  'flex h-[52px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[10px] bg-white text-[12.5px] font-semibold text-[#243a55] shadow-[0_0_0_1px_rgba(36,58,85,0.18)] w-[68px] md:w-[120px] md:flex-row md:gap-2 md:text-[16px]';

export const LocationStickyBar = ({ textLabel = 'Text' }: { textLabel?: string }) => {
  const [pastHero, setPastHero] = useState(false);
  const [quoteOnScreen, setQuoteOnScreen] = useState(false);
  const shown = pastHero && !quoteOnScreen;

  useEffect(() => {
    const target = document.getElementById('get-price');
    if (!target || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(target);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const quote = document.getElementById(QUOTE_ID);
    if (!quote || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setQuoteOnScreen(e.isIntersecting));
    io.observe(quote);
    return () => io.disconnect();
  }, []);

  return (
    <div
      data-cta="sticky bar"
      inert={!shown}
      aria-hidden={!shown || undefined}
      className={`fixed inset-x-0 bottom-0 z-[90] border-t border-[rgba(36,58,85,0.1)] bg-white/[0.96] px-[14px] pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_24px_-12px_rgba(16,24,40,0.18)] transition-transform duration-[250ms] ease-out md:backdrop-blur-[10px] lg:hidden ${
        shown ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex gap-2 md:justify-center md:gap-2.5">
        <a href={PHONE_HREF} className={small}>
          <Phone aria-hidden="true" className="h-[18px] w-[18px] text-[#2a78b8]" strokeWidth={2.25} />
          Call
        </a>
        <a href={SMS_HREF} className={small}>
          <MessageSquare aria-hidden="true" className="h-[18px] w-[18px] text-[#2a78b8]" strokeWidth={2.25} />
          {textLabel}
        </a>
        <button
          type="button"
          onClick={scrollToQuote}
          className="inline-flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#f7b500] text-[16px] font-semibold text-[#1c2f47] shadow-[0_1px_2px_rgba(16,24,40,0.14)] md:w-[300px] md:flex-none"
        >
          Get my free quote
          <ArrowRight aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
