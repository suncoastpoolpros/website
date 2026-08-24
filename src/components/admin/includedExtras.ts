/**
 * The value stack: work that routinely arrives as a separate invoice elsewhere
 * and is simply covered here.
 *
 * This is deliberately NOT another feature list — every row carries the price
 * the customer would otherwise be quoted, struck through. A feature list says
 * "we're thorough"; a struck-through $400 says what being thorough is worth, and
 * that is the difference between a proposal that reads as marketing and one that
 * reads as arithmetic.
 *
 * Only put a row here when the figure is real. An invented range is worse than
 * no row: the whole section works because a customer who has been quoted for an
 * algae treatment before recognises the number.
 *
 * Mirrored in functions/api/admin/send-proposal.ts (Pages Functions can't import
 * from the client src tree) — keep them in sync.
 */
import { FILTER_SERVICE, type FilterOption, supportsFilterService } from './filterService';
import { isSaltwater } from './sanitization';

export type IncludedExtra = {
  label: string;
  /** What it typically costs when billed separately, e.g. "$35–$400". */
  typical: string;
  /** What the figure depends on, set small after the price. */
  basis: string;
};

export const EXTRAS_HEADING = 'What Others Charge Extra For';

/**
 * The reasoning, stated before the table. The rows prove the claim; this says
 * why the business is built that way — which is the part a customer comparing
 * three quotes has no other way to learn.
 */
export const EXTRAS_INTRO =
  'We build our service to be all-inclusive on purpose. When something is a known maintenance item — a filter element, a treatment your pool needs every year — we price it into your monthly cost rather than invoicing it separately. Splitting those out only makes a monthly rate look cheaper than it really is, and it costs you time approving work your pool was always going to need.';

/**
 * The intro the customer actually reads, chosen by the filter answer.
 *
 * EXTRAS_INTRO promises, in writing, that "a filter element … we price it into
 * your monthly cost" — and it rendered UNCONDITIONALLY, including on quotes
 * where filter service was deliberately excluded. On those quotes it claimed
 * the exact thing the rate leaves out, on the document the customer keeps.
 *
 * The excluded variant makes the same all-inclusive argument for what IS in
 * the rate (chemicals, routine treatments) and then states the filter-parts
 * carve-out affirmatively — quoted at cost, approved first — because the
 * cheaper rate is only defensible if the customer was told what makes it
 * cheaper BEFORE the first element invoice, not after.
 */
export const extrasIntroFor = (filterIncluded: boolean): string =>
  filterIncluded
    ? EXTRAS_INTRO
    : 'We build our service to be all-inclusive where it counts: chemicals and routine treatments are priced into your monthly cost rather than invoiced separately, because splitting those out only makes a rate look cheaper than it really is. Filter parts are the one thing this quote keeps separate — when an element or media change comes due, we quote it at cost first, and nothing is replaced without your approval.';

/**
 * The carve-out. Names storm and construction clean-up explicitly rather than
 * leaving "major remediation" to be interpreted after a hurricane, which is the
 * worst possible moment to be establishing what was included.
 *
 * Adds no exclusion: section 4 of the Service Agreement already excludes "heavy
 * debris removal required due to storms, Acts of God, construction runoff, or
 * pool neglect prior to start of service". This states it where the customer is
 * reading about what IS included, so the two documents agree in plain sight.
 * No TERMS_VERSION bump for the same reason — nothing new is being excluded.
 */
/**
 * Appended to the note when the quote offers an Essentials plan.
 *
 * Every "Included" in the table above is true of the all-inclusive plans and
 * NOT of Essentials — the table is quote-level, the plans are not. Without
 * this line a customer choosing Essentials has read a table telling them
 * filter parts and phosphate treatments are included. One sentence, rather
 * than a second table, because the ✗ rows on the card already carry the
 * detail; this only stops the table contradicting them.
 */
export const EXTRAS_PLAN_QUALIFIER =
  'These are included on the All-Inclusive plans. The Essentials plan leaves out the items marked on its card, which is what makes it cheaper.';

export const EXTRAS_NOTE =
  'The figures above are what you would typically be quoted for these elsewhere. Routine treatments are included. Heavy clean-ups outside routine service are quoted separately — a green-to-clean recovery, or debris left by a storm or nearby construction.';

/** Column headings, so "$120" can't be mistaken for something being charged. */
export const EXTRAS_COL_THEIRS = 'Others charge';
export const EXTRAS_COL_YOURS = 'Your cost';
export const EXTRAS_INCLUDED_LABEL = 'Included';

/**
 * Universal rows — true of any pool, so they read as generic and sit LAST.
 * See the ordering note on includedExtras().
 */
const BASE_EXTRAS: IncludedExtra[] = [
  {
    label: 'Algaecide & phosphate treatments',
    typical: '$35–$400',
    basis: 'depending on severity and pool size',
  },
];

/**
 * The list with this pool's filter service and sanitization rows in front,
 * priced from the same map the rest of the proposal uses. Sand is skipped: its
 * media replacement isn't costed, and a row with no number defeats the point of
 * the section.
 *
 * ORDER IS BY HOW SPECIFIC THE ROW IS TO THIS POOL, most specific first.
 *
 * The filter rows lead because they're the biggest numbers here and the ones a
 * customer has most likely been invoiced for by name — a DE teardown or a
 * cartridge replacement is a bill you remember. Salt follows, because a salt
 * owner knows their cell is a consumable but a chlorine owner would read the
 * row as padding. Algaecide anchors the bottom: every pool needs it, so it's
 * the row that proves the least about THIS quote.
 *
 * The DE powder row sits directly under the DE split rather than at the end, so
 * the two filter costs read as one story — the annual teardown plus the powder
 * it burns through in between — instead of looking like the same charge twice.
 */
export const includedExtras = (filter: FilterOption, sanitization = ''): IncludedExtra[] => {
  const rows: IncludedExtra[] = [];
  if (filter.included && supportsFilterService(filter.type)) {
    const priced = FILTER_SERVICE[filter.type];
    if (priced) {
      rows.push({
        label:
          filter.type === 'DE'
            ? 'DE filter split, clean & recharge'
            : 'Cartridge filter replacement',
        typical: `$${priced.value}`,
        // Short form: the full basis already appears on this pool's line in the
        // what's-included box a few centimetres above, and repeating the whole
        // sentence reads as padding.
        basis: filter.type === 'DE' ? 'a year' : 'per replacement, every 8–18 months',
      });
    }
    /**
     * DE only, and separate from the annual split above: a DE filter loses its
     * powder every time it's backwashed and has to be recharged with fresh DE,
     * roughly every 4–8 weeks. That's a consumable the annual teardown doesn't
     * cover, and one our own terms confirm is included — filterServiceTerms
     * promises "routine backwashing and DE replenishment throughout the year".
     *
     * The figure is the POWDER, not the labour. Backwashing itself turned out
     * not to be a reliable line item — plenty of companies fold it into the base
     * rate — so pricing it would have been inventing a charge. The powder is
     * real, recurring and DE-specific, and two independent sources agree on the
     * range:
     *   · Florida's Best Pool Service puts DE powder at $500–$1,000 over ten
     *     years, i.e. $50–$100 a year.
     *   · From retail: a 25 lb box runs about $35, a recharge takes 5–6 lb, and
     *     at every 4–8 weeks that's 30–78 lb a year — $40–$105.
     * $50–$100 is the overlap, so it's the range a customer who has bought DE
     * themselves will recognise.
     */
    if (filter.type === 'DE') {
      rows.push({
        label: 'DE powder after every backwash',
        typical: '$50–$100',
        basis: 'a year in DE, recharged every 4–8 weeks',
      });
    }
  }
  if (isSaltwater(sanitization)) {
    rows.push({
      label: 'Salt cell acid wash',
      // Annual figure, like every other row, with the derivation shown so the
      // customer can check it: $25 a wash x 4 = $100. "Based on quarterly wash
      // intervals" alone read as $100 PER wash, i.e. $400 a year.
      typical: '$100',
      basis: '$25 a wash, typically washed quarterly',
    });
    /**
     * The salt ITSELF, which is not the cell wash above and not a chemical most
     * companies fold into a rate. Salt doesn't degrade — it leaves with the
     * water, through backwashing, splash-out and the rain overflow a Florida
     * summer guarantees — so it is topped up, not consumed.
     *
     * Priced from retail (a 40 lb bag runs $7–$10, a few bags a season), which
     * UNDERSTATES what a company billing it would charge. Understating is the
     * safe direction here: every figure in this table is one a customer can
     * check, and the section only works while all of them survive checking.
     */
    rows.push({
      label: 'Replacement salt',
      typical: '$20–$60',
      basis: 'a year, topped up after backwashing and heavy rain',
    });
  }
  /**
   * EVERY pool needs stabilizer added, and that is a consequence of how this
   * service runs. Liquid chlorine and a salt cell both add none of their own,
   * so cyanuric acid has to be replaced as it dilutes out. A tab-fed pool is
   * the opposite case — stabilised tabs push CYA UP every week, which is why
   * those pools end up needing dilution rather than dosing.
   *
   * The basis states the FREQUENCY and nothing else. Earlier versions explained
   * why stabilizer is needed, then quoted the container size to make the range
   * add up; both were dropped as the row was tightened. What is left is the
   * shape every other row here has — a figure and how often.
   *
   * "Topped up" rather than "replaced", matching the salt row above, because
   * that is what actually happens: stabilizer is not consumed, it dilutes out
   * with the water and gets brought back to range. "Typically" is doing real
   * work too — a pool that gets drained or takes a wet summer needs more.
   *
   * The $20–$40 is retail-anchored (a 4 lb container is roughly what a 15,000
   * gallon pool takes to move CYA about 30 ppm, and retails near $20), so it
   * understates what a company billing this as a "specialty chemical" would
   * charge. That reasoning stays here now that the row no longer shows it.
   */
  rows.push({
    label: 'Stabilizer (cyanuric acid)',
    typical: '$20–$40',
    basis: 'typically topped up once or twice a year',
  });
  rows.push(...BASE_EXTRAS);
  return rows;
};
