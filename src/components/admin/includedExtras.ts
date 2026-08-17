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

export const EXTRAS_NOTE =
  'The figures above are what you would typically be quoted for these elsewhere. Routine treatments are included; major remediation such as a green-to-clean recovery is quoted separately.';

/** Column headings, so "$120" can't be mistaken for something being charged. */
export const EXTRAS_COL_THEIRS = 'Others charge';
export const EXTRAS_COL_YOURS = 'Your cost';
export const EXTRAS_INCLUDED_LABEL = 'Included';

const BASE_EXTRAS: IncludedExtra[] = [
  {
    label: 'Algaecide & phosphate treatments',
    typical: '$35–$400',
    basis: 'depending on severity and pool size',
  },
];

/**
 * The list with this pool's filter service appended, priced from the same map
 * the rest of the proposal uses. Sand is skipped: its media replacement isn't
 * costed, and a row with no number defeats the point of the section.
 */
export const includedExtras = (filter: FilterOption, sanitization = ''): IncludedExtra[] => {
  const rows = [...BASE_EXTRAS];
  if (isSaltwater(sanitization)) {
    rows.push({
      label: 'Salt cell acid wash',
      // Annual figure, like every other row, with the derivation shown so the
      // customer can check it: $25 a wash x 4 = $100. "Based on quarterly wash
      // intervals" alone read as $100 PER wash, i.e. $400 a year.
      typical: '$100',
      basis: '$25 a wash, typically washed quarterly',
    });
  }
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
    if (filter.included && filter.type === 'DE') {
      rows.push({
        label: 'DE powder after every backwash',
        typical: '$50–$100',
        basis: 'a year in DE, recharged every 4–8 weeks',
      });
    }
  }
  return rows;
};
