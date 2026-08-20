/**
 * The "what's included" value highlight shown prominently near the top of the
 * proposal (PDF + email). These reflect Suncoast's all-inclusive RECURRING
 * service — chemicals, filter cleans, salt-cell maintenance AND the annual
 * filter service are covered in the flat rate. (One-time jobs bill chemicals
 * separately, so the builder lets you toggle this off for those.)
 *
 * The annual filter service moved INTO the standard rate rather than being sold
 * as an upgrade: it's the last thing that produced a separate invoice, so
 * including it completes the "no surprise fees" promise for every customer, not
 * just the ones who prepay — and it means never chasing a customer to approve a
 * $120 cartridge.
 *
 * Mirrored as plain constants in functions/api/admin/send-proposal.ts (the
 * Pages Function can't import from the client src tree) — keep them in sync.
 */
import { type FilterOption, filterServiceLine, filterServiceTerms } from './filterService';
import { isSaltwater } from './sanitization';

export const BENEFITS_HEADING = 'The Suncoast Difference';

/** True of every pool, so these are fixed. */
const BASE_BENEFITS = [
  'Vetted, consistent technicians — a familiar face, not a rotating crew',
  'A photo service report in your inbox after every visit',
  'All standard service chemicals included',
];

/**
 * The equipment-care bullet, built from what THIS pool actually has.
 *
 * It used to be fixed: "Filter cleaning, backwashing & salt-cell cleaning — all
 * included", printed on every proposal. On a cartridge + chlorine pool two of
 * those three are equipment the customer doesn't own — a cartridge element is
 * rinsed and swapped, never backwashed, and a chlorine pool has no cell to
 * clean. Promising care for equipment someone can see they don't have is the
 * fastest way to make the rest of a costed page read as boilerplate.
 *
 * Backwashing needs a multiport valve, which DE and sand have and cartridge
 * doesn't. An unknown or 'Other' filter is left out rather than guessed at, on
 * the same principle as the rest of this file: no claim we can't stand behind.
 */
const equipmentCareLine = (filter: FilterOption, sanitization: string): string => {
  const items = ['Filter cleaning'];
  if (filter.type === 'DE' || filter.type === 'Sand') items.push('backwashing');
  if (isSaltwater(sanitization)) items.push('salt-cell cleaning');
  if (items.length === 1) return 'Filter cleaning — included';
  const list = `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`;
  return `${list} — all included`;
};

/**
 * A refund promise, not a feature — so it has to be honoured by section 6 of the
 * Service Agreement, which otherwise requires 30 days' notice and keeps billing
 * running through it. Changing this line means changing that clause AND bumping
 * LAST_UPDATED / TERMS_VERSION, or a customer's signed record names a version
 * whose terms no longer say this.
 *
 * Last in the list on purpose: it's the one that answers "what if you're no
 * good?", which is the last objection standing once everything above is read.
 */
export const GUARANTEE_BENEFIT =
  'A two-week money-back guarantee — not happy in your first two weeks and we refund every penny';

/**
 * The list, with the equipment-care line built for this pool and the
 * filter-service line appended ONLY when this pool's filter type actually has
 * one bundled. A sand-filter customer must never be shown a promise about
 * cartridge elements.
 */
export const includedBenefits = (filter: FilterOption, sanitization = ''): string[] => {
  const line = filterServiceLine(filter);
  const base = [...BASE_BENEFITS, equipmentCareLine(filter, sanitization)];
  return line ? [...base, line, GUARANTEE_BENEFIT] : [...base, GUARANTEE_BENEFIT];
};

// A summary line ("It's all covered in your flat rate — …") used to close this
// box on every surface. Removed: every bullet above it already ends in
// "included", so the line restated the list it sat under, and in the email and
// the PDF it also re-argued the point the "What Others Charge Extra For" intro
// makes properly a few centimetres later.

// Clarifies exactly what the included filter service covers vs. doesn't, so a
// grid set or a housing part isn't assumed to be included. Worn/broken parts are
// framed as a separately-quoted repair (approved first), not a surprise fee.
/** Exactly what the included service covers for THIS filter — see filterService.ts. */
export const benefitsFootnote = (filter: FilterOption): string => filterServiceTerms(filter);
