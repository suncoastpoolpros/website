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
import {
  ALL_FILTER_LINES,
  ALL_FILTER_TERMS,
  type FilterOption,
  filterServiceLine,
  filterServiceTerms,
  filterServiceValueNote,
} from './filterService';

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

/** Terms specific to prepaying for the year. */
/**
 * The free month sits at the END of the term, which is what makes the refund
 * fair without needing a formula: cancel early and you are refunded the months
 * you have not used at the standard rate, so the free month is earned by
 * completing the year. Mirrors the Cancellation Policy in the service agreement.
 */
export const ANNUAL_FINE_PRINT =
  'Your twelfth month is free and applied at the end of the term. Cancel at any time and we refund every month you have not used, at the standard monthly rate. Repair labour discount applies to our own labour and excludes work performed by subcontractors.';

const BASE_SERVICE_INCLUDES = [
  'Weekly cleaning — brushing, skimming, netting and vacuuming',
  'All standard chemicals included',
  'Filter cleaning, backwashing and salt-cell cleaning',
  'Full equipment check on every visit',
  'A photo service report in your inbox after every visit',
];

/**
 * The weekly service, with this pool's filter-service line inserted right after
 * the routine filter-cleaning bullet — and omitted entirely when nothing is
 * bundled, so a sand pool is never shown a cartridge promise.
 */
export const serviceIncludes = (filter: FilterOption): string[] => {
  const line = filterServiceLine(filter);
  if (!line) return [...BASE_SERVICE_INCLUDES];
  const out = [...BASE_SERVICE_INCLUDES];
  out.splice(3, 0, line);
  return out;
};

/**
 * Swap a stale filter bullet and terms for the current ones after the admin
 * changes the filter type or the inclusion toggle, WITHOUT disturbing anything
 * typed by hand: only lines this module could itself have generated are touched.
 */
export const syncFilterService = (tiers: Tier[], filter: FilterOption): Tier[] => {
  if (tiers.length === 0) return tiers;
  const line = filterServiceLine(filter);
  const terms = filterServiceTerms(filter);
  return tiers.map((tier, i) => {
    if (i !== 0) return tier;
    const kept = tier.includes.filter((b) => !ALL_FILTER_LINES.includes(b.trim()));
    let includes = kept;
    if (line) {
      // Put it back where serviceIncludes would have placed it, or at the end if
      // the routine-cleaning bullet has been edited away.
      const anchor = kept.findIndex((b) => /filter cleaning/i.test(b));
      includes = anchor === -1 ? [...kept, line] : [...kept.slice(0, anchor + 1), line, ...kept.slice(anchor + 1)];
    }
    const finePrint = ALL_FILTER_TERMS.includes(tier.finePrint.trim()) || tier.finePrint.trim() === ''
      ? terms
      : tier.finePrint;
    return { ...tier, includes, finePrint };
  });
};

/**
 * What paying annually ADDS — the PDF renders "Everything in Pay Monthly,
 * plus:" above this, so the weekly service is never repeated or implicitly
 * withheld.
 */
/**
 * No "rate locked for 12 months" bullet. It was meant to reassure and did the
 * opposite — a customer reads "locked" as "committed", which is the fear that
 * stops people prepaying at all. Cancel-any-time answers the same question the
 * right way round.
 */
export const ANNUAL_INCLUDES = [
  'Your 12th month free — pay for 11, the last one is on us',
  '20% off repair labour on repairs and upgrades',
  'Cancel any time — unused months refunded',
  'One payment for the year — nothing to remember each month',
];

export const buildTiers = (basePrice = '', filter: FilterOption = { type: '', included: false }): Tier[] => {
  const base = basePrice.trim();
  const monthly = monthlyAmount(base);
  return [
    {
      name: 'Pay Monthly',
      price: base,
      // The service list lives ONCE in the "what's included" box above, because
      // both plans carry the identical service — repeating all six bullets
      // inside a 250pt column was both redundant and, with longer wordings like
      // DE's, tall enough to push the whole comparison onto the next page.
      tagline: 'Everything above, billed month to month.',
      priceNote: '',
      includes: [],
      recommended: false,
      // Answers "why is this more than the quote down the road?" before the
      // customer asks it — the honest answer is that parts other companies
      // invoice separately are already in the number.
      valueNote:
        filterServiceValueNote(filter) ||
        'This rate is genuinely all-in — your chemicals, filter cleans and salt-cell cleaning are all part of it, with no surprise fees on top.',
      finePrint: filterServiceTerms(filter),
    },
    {
      name: 'Pay Annually',
      // Headline is the EFFECTIVE MONTHLY rate, not the annual total. "$1,958"
      // next to "$178/mo" invites a comparison between two numbers that aren't
      // comparable and reads as the expensive option; "$163/mo" next to
      // "$178/mo" reads as the cheaper one, which it is.
      price: monthly ? `${formatAmount(effectiveMonthly(monthly))}/mo` : '',
      priceNote: monthly
        ? `$${formatAmount(monthly * ANNUAL_MONTHS_CHARGED)} billed once — $${formatAmount(monthly)} saved`
        : '',
      tagline: 'The same service, with one month free.',
      includes: [...ANNUAL_INCLUDES],
      recommended: true,
      // Answers the objection prepaying actually raises — being tied in.
      valueNote: monthly
        ? `Pay for eleven months and your twelfth is on us, which brings your rate to about $${formatAmount(effectiveMonthly(monthly))} a month. You are not tied in: cancel any time and we refund the months you have not used. Paying up front is a saving, not a commitment.`
        : 'Pay for eleven months and your twelfth is on us. You are not tied in: cancel any time and we refund the months you have not used. Paying up front is a saving, not a commitment.',
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
