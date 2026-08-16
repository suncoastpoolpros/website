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
 * COSTING NOTE: a 4-cartridge set (e.g. Clean & Clear 320) runs roughly
 * $280–450 and lasts ~2–3 years in Florida. At $12/mo the cartridge benefit
 * alone is close to break-even BEFORE the labour discount, so the two limits in
 * COMPLETE_FINE_PRINT are what make it viable: they stop a customer joining
 * with already-shot cartridges, taking a $400 set, and dropping back to
 * Essential. Raise this toward $19–29 if replacements come up more often than
 * every three years, or price it by filter size.
 */
export const UPGRADE_DELTA = 12;

/** Guard rails that make the cartridge benefit survivable. Editable per proposal. */
export const COMPLETE_FINE_PRINT =
  'Cartridge coverage begins after 6 months of continuous service and covers one cartridge set per 36 months, for cartridge filters only. Labour discount applies to our own repair labour and excludes work performed by subcontractors.';

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
  'Cartridge filter replacement when due — parts and labour covered',
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
        'A replacement cartridge set for a pool this size runs about $380. Complete covers it — so one replacement in three years pays for the plan on its own, before the labour discount.',
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
