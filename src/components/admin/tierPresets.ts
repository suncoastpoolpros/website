/**
 * The two options shown on a tiered proposal.
 *
 * The axis is PAYMENT TERM, not scope. The SERVICE is identical on both and now
 * genuinely all-in: chemicals, filter cleans, salt-cell cleans AND the annual
 * filter service (cartridge elements, or a DE split and recharge). That last
 * item used to be sold as an upgrade; folding it into the base rate is what
 * makes "no surprise fees" literally true for every customer, and means never
 * chasing anyone to approve a $120 cartridge. The base rate rises by about
 * $10–12.50/month to absorb it, which the proposal states plainly rather than
 * leaving the customer to discover by comparison.
 *
 * Paying for the year up front then buys a payment-term benefit: one month free
 * and a labour discount.
 *
 * DESIGN RULE — the second option never claws back anything from the first.
 * Annual only ADDS. If a benefit ever moves out of the monthly option to make
 * annual look better, the proposal starts reading as "here's what you DON'T
 * get", and the flat-rate differentiator becomes an upsell.
 *
 * Everything here is a starting point the admin edits per proposal.
 */
import type { Tier } from '@/lib/adminApi';

/**
 * Months charged for a year of service — 11, i.e. one month free (~8.3% off).
 *
 * This was 12 while the annual filter service was the annual-only incentive.
 * That service is now IN THE BASE RATE for everybody (see proposalBenefits.ts),
 * which is what solves the chasing-customers-for-filter-money problem for every
 * customer rather than only the ones who prepay — so annual needs its own
 * incentive again, and a free month is the clearest one to state.
 *
 * What it buys: twelve months of cash on day one, a year of near-zero churn,
 * and no monthly collection. 8.3% is squarely in the normal 5–15% band for
 * annual prepay.
 */
export const ANNUAL_MONTHS_CHARGED = 11;

/**
 * Qualifies the filter service that is now part of the STANDARD rate, so it sits
 * on the monthly card (the base offer) rather than the annual one.
 *
 * COSTING (owner, 2026-08-16): $120 on a cartridge pool, $150 on a DE pool —
 * about $10–12.50/month, which is what the base rate rises by to absorb it.
 *
 * The exclusions matter and are deliberate: an unqualified "DE split and clean"
 * would arguably oblige a $150–250 grid set on top of the labour. This covers
 * CONSUMABLES AND LABOUR ONLY — cartridge elements, or the split, disassembly,
 * clean and DE recharge. Torn grids and housing parts are quoted separately.
 */
export const SERVICE_FINE_PRINT =
  'The included annual filter service covers replacement cartridge elements, or a DE filter split, disassembly, clean and recharge — parts and labour. It does not include DE grid replacement (including torn grids) or any filter housing parts; those are quoted separately, and always before any work is done.';

/** Terms specific to prepaying for the year. */
export const ANNUAL_FINE_PRINT =
  'One month free applies to a full twelve months of service paid in advance. Repair labour discount applies to our own labour and excludes work performed by subcontractors.';

/** The weekly service itself. Identical on both options — do not edit one without the other. */
export const SERVICE_INCLUDES = [
  'Weekly cleaning — brushing, skimming, netting and vacuuming',
  'All standard chemicals included',
  'Filter cleaning, backwashing and salt-cell cleaning',
  'Your annual filter service — cartridge elements, or a DE split and recharge',
  'Full equipment check on every visit',
  'A photo service report in your inbox after every visit',
];

/**
 * What paying annually ADDS — the PDF renders "Everything in Pay Monthly,
 * plus:" above this, so the weekly service is never repeated or implicitly
 * withheld.
 */
export const ANNUAL_INCLUDES = [
  'One month free — pay for 11, get the full 12',
  '20% off repair labour on repairs and upgrades',
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
      tagline: 'Everything below, billed month to month.',
      includes: [...SERVICE_INCLUDES],
      recommended: false,
      // Answers "why is this more than the quote down the road?" before the
      // customer asks it — the honest answer is that parts other companies
      // invoice separately are already in the number.
      valueNote:
        'This rate is genuinely all-in. Your chemicals, filter cleans, salt-cell cleaning and your annual filter service — cartridge elements, or a full DE split and recharge — are all part of it. When the filter comes due we simply do it: no quote to approve, no separate invoice, no decision to make. That is why the monthly figure reads a little higher than a bare-bones quote, and why nothing lands on top of it.',
      finePrint: SERVICE_FINE_PRINT,
    },
    {
      name: 'Pay Annually',
      price: annualPrice(base),
      tagline: monthly
        ? `The same service, one month free — works out to $${formatAmount(effectiveMonthly(monthly))}/mo.`
        : 'The same service, with one month free.',
      includes: [...ANNUAL_INCLUDES],
      recommended: true,
      // The persuasion line: the saving as a dollar figure, not a percentage.
      valueNote: monthly
        ? `Paying for the year up front means one month on us — that is $${formatAmount(monthly)} back, and it brings your effective rate to about $${formatAmount(effectiveMonthly(monthly))} a month. Repairs and upgrades are 20% off the labour rate for the whole year.`
        : 'Paying for the year up front means one month on us, and repairs and upgrades are 20% off the labour rate for the whole year.',
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

/** What a year's prepay works out to per month, rounded to the dollar. */
const effectiveMonthly = (monthly: number): number =>
  Math.round((monthly * ANNUAL_MONTHS_CHARGED) / 12);

const formatAmount = (n: number): string =>
  (Number.isInteger(n) ? n : Number(n.toFixed(2))).toLocaleString('en-US');

/**
 * A year of service, quoted per year with the free month applied
 * ("178/mo" → "1,958/yr" at 11 months charged).
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
