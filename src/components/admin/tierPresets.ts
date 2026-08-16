/**
 * The two options shown on a tiered proposal.
 *
 * The axis is PAYMENT TERM, not scope. Both options are the identical weekly
 * service at the identical rate — all chemicals included, exactly what was
 * offered before tiers existed. Paying for the year up front adds the annual
 * filter service — replacement cartridge elements, or a DE split and recharge.
 *
 * DESIGN RULE — the second option never claws back anything from the first.
 * The flat-rate promise ("chemicals, filter cleans and salt-cell cleans all
 * included, no surprise fees" — see proposalBenefits.ts) is fully intact when
 * paying monthly. Annual only ADDS. If a benefit ever moves out of the monthly
 * option to make annual look better, the proposal starts reading as "here's what
 * you DON'T get", and the flat-rate differentiator becomes an upsell.
 *
 * Everything here is a starting point the admin edits per proposal.
 */
import type { Tier } from '@/lib/adminApi';

/**
 * Months charged for a year of service. Deliberately 12 — NO price discount.
 *
 * A free month (11) was considered and rejected: it gives away ~$165 of pure
 * margin for nothing in return, where the filter service costs $120–150 and
 * solves a real operational problem. The owner's actual motivation for the
 * benefit is not the customer incentive — it's that prepaid filters can just be
 * FITTED WHEN DUE, with no quote to approve and no invoice to chase. A free
 * month buys none of that.
 */
export const ANNUAL_MONTHS_CHARGED = 12;

/**
 * COSTING (owner, 2026-08-16): the annual filter service is worth $120 on a
 * cartridge pool and $150 on a DE pool. Against a $1,980 annual prepay that's
 * 6–8% of revenue — comfortably sustainable, and the two are close enough that
 * they don't need separate pricing.
 *
 * The exclusions below are what keep it bounded, and they matter: an unqualified
 * "DE split and clean" would arguably oblige a $150–250 grid set on top. This
 * covers CONSUMABLES AND LABOUR ONLY — cartridge elements, or the split,
 * disassembly, clean and DE recharge. Torn grids and housing parts are quoted
 * separately (at the 25% labour discount).
 */
export const ANNUAL_FINE_PRINT =
  'Includes one filter service per year for the pool at the service address above: replacement cartridge elements, or a DE filter split, disassembly, clean and recharge. It does not include DE grid replacement (including torn grids) or any filter housing parts — those are quoted separately. Repair labour discount applies to our own labour and excludes work performed by subcontractors.';

/** The weekly service itself. Identical on both options — do not edit one without the other. */
export const SERVICE_INCLUDES = [
  'Weekly cleaning — brushing, skimming, netting and vacuuming',
  'All standard chemicals included',
  'Filter cleaning, backwashing and salt-cell cleaning',
  'Full equipment check on every visit',
  'A photo service report in your inbox after every visit',
];

/**
 * What paying annually ADDS — the PDF renders "Everything in Pay Monthly,
 * plus:" above this, so the weekly service is never repeated or implicitly
 * withheld.
 */
export const ANNUAL_INCLUDES = [
  'Annual filter service included — cartridge elements ($120 value), or a DE split and recharge ($150 value)',
  '25% off repair labour outside regular service',
  'Your rate locked for the full 12 months',
  'One payment for the year — nothing to remember each month',
];

export const buildTiers = (basePrice = ''): Tier[] => {
  const base = basePrice.trim();
  const monthly = monthlyAmount(base);
  return [
    {
      name: 'Pay Monthly',
      price: base,
      tagline: 'Weekly service, billed month to month.',
      includes: [...SERVICE_INCLUDES],
      recommended: false,
      valueNote: '',
      finePrint: '',
    },
    {
      name: 'Pay Annually',
      price: annualPrice(base),
      tagline: monthly
        ? `The same weekly service at the same rate — $${formatAmount(monthly)}/mo, paid once for the year.`
        : 'The same weekly service at the same rate, paid once for the year.',
      includes: [...ANNUAL_INCLUDES],
      recommended: true,
      // The persuasion line: what the prepay actually buys, in real terms.
      valueNote:
        'Paying for the year up front includes your annual filter service — replacement cartridge elements, a $120 value, or a full DE split, clean and recharge, a $150 value. When it comes due we simply do it: no quote to approve, no separate invoice, no decision to make. Same weekly service, same rate.',
      finePrint: ANNUAL_FINE_PRINT,
    },
  ];
};

/** Leading number in a monthly price ("165/mo" → 165). null when not numeric. */
const monthlyAmount = (basePrice: string): number | null => {
  const m = /^\$?\s*(\d[\d,]*(?:\.\d+)?)/.exec(basePrice.trim());
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

const formatAmount = (n: number): string =>
  (Number.isInteger(n) ? n : Number(n.toFixed(2))).toLocaleString('en-US');

/**
 * A year of service at the monthly rate, quoted per year ("165/mo" → "1,980/yr").
 * The "/yr" matters: tierDelta suppresses its "+$X" callout when the two options
 * are quoted in different periods, which is what stops the comparison claiming
 * annual costs "$1,815 more" than monthly.
 *
 * Returns '' when the base isn't a plain number, so a "Call for pricing" base
 * doesn't produce a nonsense annual figure.
 */
export const annualPrice = (basePrice: string): string => {
  const n = monthlyAmount(basePrice);
  if (n === null) return '';
  return `${formatAmount(n * ANNUAL_MONTHS_CHARGED)}/yr`;
};
