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
  supportsFilterService,
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

/**
 * Bump whenever the wording or structure of the presets below changes.
 *
 * Plan cards are STORED, not derived: buildTiers() runs once, when tiers are
 * first switched on, and the result lives in the draft so per-proposal edits
 * survive. That means editing this file does nothing to a draft already in
 * progress — which is how a card sat there showing superseded wording with no
 * hint anything was wrong. The builder compares this against the version
 * stamped on the draft and offers a reset.
 *
 * Deliberately a version rather than a content diff: a content diff can't tell
 * a stale preset from wording the admin edited on purpose, so it would nag
 * forever on any customised proposal.
 */
export const PRESET_VERSION = 4;

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
/**
 * What PAYING MONTHLY gets you, so the base card isn't a price floating in
 * whitespace next to a full annual card. Deliberately terms, not a re-listing of
 * the service: the service is described once above the cards, and repeating six
 * bullets here is what made the comparison too tall for the page in the first
 * place. Both cards now describe their payment terms, which is the actual
 * difference between them.
 */
export const monthlyIncludes = (filter: FilterOption): string[] => [
  // The hidden-cost worry, first. Most companies bill chemicals on top, so this
  // is the line a customer can actually price against the quote next to ours.
  'All chemicals included in your set monthly rate',
  // ONLY when this quote actually bundles it. filterServiceIncluded is asked per
  // quote and is often 'no' — printing this on a pool where it wasn't sold
  // promises a bill we'd then be expected to absorb.
  ...(filter.included && supportsFilterService(filter.type)
    ? ['Filter care included — never a separate invoice']
    : []),
  // Names the objection nobody says out loud: "fine, but what about August?"
  // Under a usage-billing competitor that is a real, larger bill. "Flat rate"
  // only means something once you say what it protects you from.
  'One flat rate — it doesn’t rise in summer',
  // Proof of visit, which is the whole anxiety for anyone not home when we come.
  'A GPS-stamped photo report after every visit',
  // Risk reversal, sitting directly above the Choose button rather than only in
  // the Difference box further up the page. Backed by section 6 of the Service
  // Agreement — see GUARANTEE_BENEFIT in proposalBenefits.ts before editing.
  'Two-week 100% money-back guarantee',
  // Was two bullets ("No long-term contract" and "Cancel any time with 30 days
  // notice") saying one thing twice, in a list where only one line was selling.
  'No contract — cancel any time with 30 days notice',
];

export const ANNUAL_INCLUDES = [
  'Your 12th month free — pay for 11, the last one is on us',
  '20% off repair labour on repairs and upgrades',
  'Cancel any time — unused months refunded',
  'One payment for the year — nothing to remember each month',
];

/**
 * Re-derive everything that embeds the rate after the base rate changes.
 *
 * The base rate is the single place a price is typed; the plan cards' prices,
 * the "billed once" line, and the annual tagline and value note are all just
 * that number restated. They stay in the stored tier objects (so the PDF and
 * email need no special casing) but are rewritten here rather than by hand.
 *
 * Only fields still matching what the preset generated for the OLD rate are
 * replaced, so anything reworded for this customer survives — the same rule
 * syncFilterService follows.
 */
export const syncTierPrices = (
  tiers: Tier[],
  oldBase: string,
  newBase: string,
  filter: FilterOption,
): Tier[] => {
  if (tiers.length === 0) return tiers;
  const before = buildTiers(oldBase, filter);
  const after = buildTiers(newBase, filter);
  return tiers.map((tier, i) => {
    const was = before[i];
    const now = after[i];
    if (!was || !now) return tier;
    const carry = (field: 'price' | 'priceNote' | 'tagline' | 'valueNote') =>
      tier[field] === was[field] ? now[field] : tier[field];
    return {
      ...tier,
      // Price and its sub-line are always derived — they aren't editable.
      price: now.price,
      priceNote: now.priceNote,
      tagline: carry('tagline'),
      valueNote: carry('valueNote'),
    };
  });
};

export const buildTiers = (basePrice = '', filter: FilterOption = { type: '', included: false }): Tier[] => {
  const base = basePrice.trim();
  const monthly = monthlyAmount(base);
  return [
    {
      name: 'Pay Monthly',
      // "/mo" is forced on when the typed rate omits it: a bare "$200" next to
      // "$183/mo" reads as two different units rather than two prices.
      price: monthly && !/\/\s*(mo|month)/i.test(base) ? `${formatAmount(monthly)}/mo` : base,
      // The service list lives ONCE in the "what's included" box above, because
      // both plans carry the identical service — repeating all six bullets
      // inside a 250pt column was both redundant and, with longer wordings like
      // DE's, tall enough to push the whole comparison onto the next page.
      tagline: 'The full service, billed month to month.',
      priceNote: '',
      includes: monthlyIncludes(filter),
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
      tagline: 'The full service, with one month free.',
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
