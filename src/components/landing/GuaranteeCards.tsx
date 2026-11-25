import { Handshake, RotateCcw, ShieldCheck } from 'lucide-react';

/*
 * The three written promises ("Our promises, in writing."), shared by the
 * homepage and the city pages that repeat them (Clearwater). Terms restated
 * from the Service Agreement: if a term changes there, change it here. The
 * fine print is part of the promise: stating a guarantee without its limits
 * is how trust gets lost.
 *
 * Three equal tiles; the Always Blue Guarantee is the featured one. The fine
 * print sits at the foot of each tile, so the three line up. Each page sets
 * the columns (`className` on the <ul>).
 */

const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: 'Always Blue Guarantee',
    body: 'Your water stays clear and balanced all week, not just on visit day. If it drifts under our regular care, we come back and make it right at no charge.',
    fine: "As long as we're the only ones adding chemicals. Excludes chemical loss from leaks, and problems from failing equipment until it's repaired.",
  },
  {
    icon: RotateCcw,
    title: '2-week money-back guarantee',
    body: "Not happy in your first two weeks? Tell us before your third weekly visit and we'll refund everything you've paid, in full.",
    fine: 'For new customers on our Service Agreement.',
  },
  {
    icon: Handshake,
    title: 'Month-to-month. No contract.',
    body: "We'd rather earn your business every week than lock you in. Stop any time with 30 days' notice and no cancellation penalty.",
    fine: 'Billed monthly, by bank transfer (free) or card.',
  },
];

export const GuaranteeCards = ({ className = '' }: { className?: string }) => (
  <ul className={`grid gap-3 ${className}`}>
    {GUARANTEES.map(({ icon: Icon, title, body, fine }, i) => (
      <li
        key={title}
        className={`flex flex-col rounded-[12px] px-[26px] pb-6 pt-7 ${
          i === 0
            ? 'border border-[#1f7fdb] bg-[rgba(31,127,219,0.045)] shadow-[0_0_0_1px_#1f7fdb,0_1px_2px_rgba(16,24,40,0.04)]'
            : 'border border-[rgba(36,58,85,0.1)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]'
        }`}
      >
        <Icon aria-hidden="true" className="h-6 w-6 text-[#1f7fdb]" strokeWidth={1.75} />
        <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-[#243a55]">{title}</h3>
        <p className="mt-2 text-[15px] leading-[1.6] text-[rgba(36,58,85,0.74)]">{body}</p>
        <p className="mt-auto pt-5">
          <span className="block border-t border-[rgba(36,58,85,0.1)] pt-4 text-[13px] leading-[1.5] text-[rgba(36,58,85,0.56)]">
            {fine}
          </span>
        </p>
      </li>
    ))}
  </ul>
);
