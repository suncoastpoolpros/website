/**
 * Two-tier pricing for the proposal builder.
 *
 * DESIGN RULE — the upgrade never claws back anything from the base plan.
 * The flat-rate promise ("chemicals, filter cleans and salt-cell cleans are all
 * included, no surprise fees" — see proposalBenefits.ts) stays fully intact in
 * the ESSENTIAL tier. COMPLETE only adds things that are honestly outside weekly
 * service: parts, repair labour, priority and protection. If a benefit ever
 * moves out of Essential and into Complete, the proposal starts reading as
 * "here's what you DON'T get", and the differentiator becomes an upsell.
 *
 * Everything here is a starting point the admin edits per proposal — prices,
 * wording and the bullet list are all editable in the builder.
 */
import type { Tier } from '@/lib/adminApi';

/**
 * The upgrade price. Set as a delta the admin adds to the base rate, and kept
 * as a named constant because it's the number most likely to change.
 *
 * COSTING (confirmed by the owner 2026-08-16): cartridges are replaced about
 * ONCE A YEAR and cost around $100 a replacement. So $12/mo = $144/yr revenue
 * against ~$100/yr of parts — roughly $44/yr, ~31% margin, before the labour
 * discount and the waived trip charge. Positive but thin, which is fine if the
 * point is to drive repair volume and retention; $15–19 would be healthier if
 * you'd rather the tier stand on its own.
 *
 * The exposure if someone joins with already-worn cartridges is only ~$100, so
 * the guard rail is a short 90-day wait rather than the 6 months + 36-month cap
 * originally drafted — that cap assumed a 2–3 year replacement cycle and would
 * have meant declining the benefit in years 2 and 3 of an annual cycle.
 *
 * WATCH: this assumes ~$100 per REPLACEMENT (a full set). If a pool takes four
 * cartridges at ~$100 EACH, the cost is ~$400/yr and $12/mo loses money — price
 * that filter size separately.
 */
export const UPGRADE_DELTA = 12;

/** Guard rails that make the cartridge benefit survivable. Editable per proposal. */
export const COMPLETE_FINE_PRINT =
  'Cartridge coverage begins after 90 days of continuous service and covers one cartridge replacement per year, for cartridge filters only. Labour discount applies to our own repair labour and excludes work performed by subcontractors.';

export const ESSENTIAL_INCLUDES = [
  'Weekly cleaning — brushing, skimming, netting and vacuuming',
  'All standard chemicals included',
  'Filter cleaning, backwashing and salt-cell cleaning',
  'Full equipment check on every visit',
  'A photo service report in your inbox after every visit',
];

/**
 * COMPLETE lists ONLY what it adds — the PDF renders "Everything in Essential,
 * plus:" above it, so the base benefits are never repeated or implicitly
 * withheld.
 *
 * The last four cost almost nothing to deliver but carry real perceived value:
 * priority scheduling is only an ordering decision, and the annual inspection is
 * already built (the First Service & Inspection report), which also makes it a
 * warm lead for the repair work the labour discount then discounts.
 */
export const COMPLETE_INCLUDES = [
  'Cartridge filter replacement every year — parts and labour covered',
  '25% off repair labour outside regular service',
  'No trip charge on repair visits',
  'Priority scheduling, including the first pass after a storm',
  'A written equipment inspection once a year',
  'Your rate locked for 24 months',
];

export const buildTiers = (basePrice = ''): Tier[] => {
  const base = basePrice.trim();
  return [
    {
      name: 'Essential',
      price: base,
      tagline: 'Everything your pool needs, every week.',
      includes: [...ESSENTIAL_INCLUDES],
      recommended: false,
      valueNote: '',
      finePrint: '',
    },
    {
      name: 'Complete',
      price: upgradePrice(base),
      tagline: 'Your pool covered — and your equipment too.',
      includes: [...COMPLETE_INCLUDES],
      recommended: true,
      // The most persuasive line on the page: break-even in the customer's own
      // numbers. Edit the cartridge figure to match the pool being quoted.
      valueNote:
        'Cartridges run about $100 a year, and Complete covers them — the parts and the labour to fit them. That is most of the plan back before you count the 25% off repair labour, the waived trip charge, or the rate lock.',
      finePrint: COMPLETE_FINE_PRINT,
    },
  ];
};

/**
 * Base rate + UPGRADE_DELTA, preserving whatever period wording the admin typed
 * ("165/mo" → "177/mo"). Falls back to empty when the base isn't a plain number,
 * so a "Call for pricing" base doesn't produce a nonsense upgrade price.
 */
export const upgradePrice = (basePrice: string): string => {
  const m = /^\$?\s*(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(basePrice.trim());
  if (!m) return '';
  const n = Number(m[1].replace(/,/g, ''));
  if (!Number.isFinite(n)) return '';
  return `${n + UPGRADE_DELTA}${m[2]}`;
};
