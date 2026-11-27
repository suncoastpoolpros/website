import React from 'react';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { buttonClass } from '@/components/landing/sectionKit';

/*
 * The homepage's type and component tokens as the location pages built on the
 * light design use them (Belleair Beach, Gulfport). The homepage keeps its own
 * copies in LandingBelowFold; these are the same values, with the location
 * pages' section rhythm: 56px top and bottom on phones, 72px on upright
 * tablets, 112px from 1024px.
 *
 * Every primary button on these pages scrolls to the page's own quote form
 * (#quote) rather than opening the quote popup.
 */

export const sectionY = 'py-14 md:py-[72px] lg:py-28';
export const h2 = 'text-balance text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[30px]';
const leadBase = 'mt-2.5 max-w-[40rem] text-pretty text-[16px] leading-[1.55] md:text-[17px]';
export const lead = `${leadBase} text-[rgba(36,58,85,0.66)]`;
export const leadDark = `${leadBase} text-white/[0.72]`;
export const h3 = 'text-[18px] font-semibold tracking-[-0.02em] text-[#243a55]';
export const body = 'text-[15.5px] leading-[1.6] text-sc-navy/[0.78]';
export const card =
  'rounded-[12px] border border-[rgba(36,58,85,0.1)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]';
export const listCard =
  'divide-y divide-sc-navy/10 rounded-[12px] bg-white px-5 shadow-[0_0_0_1px_rgba(36,58,85,0.08)] sm:px-6';
// A label INSIDE a card (never above a heading).
export const smallCaps = 'text-[12px] font-semibold uppercase tracking-[0.08em] text-[rgba(36,58,85,0.5)]';
export const inlineLink =
  'font-semibold underline decoration-current/30 decoration-1 underline-offset-[3px] transition hover:decoration-current';

/** The page's quote section. Primary buttons and the header CTA scroll here. */
export const QUOTE_ID = 'quote';

export const scrollToQuote = () => {
  const target = document.getElementById(QUOTE_ID);
  if (!target) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
};

/**
 * The homepage's flat gold button with its arrow, as a link to #quote: it
 * works before hydration (a plain jump) and scrolls smoothly after.
 */
export const QuoteLink = ({
  label = 'Get my free quote',
  className = 'h-12 px-6 text-base',
}: {
  label?: string;
  className?: string;
}) => (
  <a
    href={`#${QUOTE_ID}`}
    onClick={(e) => {
      e.preventDefault();
      scrollToQuote();
    }}
    className={`${buttonClass.flat} ${className}`}
  >
    {label}
    <ArrowRight aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.5} />
  </a>
);

/** The 20px emerald tick badge. */
export const Tick = ({ className = '' }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white ${className}`}
  >
    <Check className="h-3 w-3" strokeWidth={3.25} />
  </span>
);

export const Stars = ({ className = '' }: { className?: string }) => (
  <span aria-hidden="true" className={`tracking-[-0.02em] text-[#e8a100] ${className}`}>
    ★★★★★
  </span>
);

/** "★★★★★ 5.0 on Google", read as "Rated 5.0 out of 5 on Google". */
export const GoogleRating = ({ strongClass = 'font-semibold text-sc-navy' }: { strongClass?: string }) => (
  <>
    <Stars className="text-[0.85em]" />{' '}
    <span>
      <span className="sr-only">Rated </span>
      <span className={strongClass}>5.0</span>
      <span className="sr-only"> out of 5</span> on Google
    </span>
  </>
);

/**
 * The homepage's FAQ accordion: native <details>, all closed, so every answer
 * ships in the prerendered HTML.
 */
export const FaqList = ({ faqs }: { faqs: { q: string; a: string }[] }) => (
  <div className={listCard}>
    {faqs.map(({ q, a }) => (
      <details key={q} className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16.5px] font-semibold text-sc-navy [&::-webkit-details-marker]:hidden">
          <h3 className="tracking-[-0.02em]">{q}</h3>
          <ChevronDown
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-sc-navy/45 transition-transform group-open:rotate-180"
          />
        </summary>
        <p className="-mt-1 pb-5 pr-10 text-[15.5px] leading-[1.6] text-sc-navy/[0.78]">{a}</p>
      </details>
    ))}
  </div>
);
