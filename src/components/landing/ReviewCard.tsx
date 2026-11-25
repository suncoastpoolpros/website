import type { Review } from '@/lib/reviews';

/*
 * The homepage's Google review card, shared with the city pages that show the
 * same reviews (Clearwater). The attribution sits at the foot of each card, so
 * the names line up across a row. A render function returning a keyed <li>:
 * map REVIEWS through it inside a <ul>.
 */

export const Stars = ({ className = '' }: { className?: string }) => (
  <span aria-hidden="true" className={`tracking-[0.06em] text-[#e8a100] ${className}`}>
    ★★★★★
  </span>
);

export const reviewCard = (review: Review) => (
  <li key={review.name} className="flex flex-col rounded-[12px] border border-[rgba(36,58,85,0.1)] bg-white px-[26px] pb-6 pt-[26px] shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
    <Stars className="text-[12px]" />
    <span className="sr-only">Rated 5 out of 5.</span>
    <blockquote className="mt-3 text-[15.5px] leading-[1.6] text-[rgba(36,58,85,0.86)]">“{review.quote}”</blockquote>
    <p className="mt-auto pt-5 text-[13.5px]">
      <span className="font-semibold text-sc-navy">{review.name}</span>
      <span className="text-sc-navy/[0.66]"> · Google review</span>
    </p>
  </li>
);
