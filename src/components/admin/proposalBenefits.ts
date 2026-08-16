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

export const BENEFITS_HEADING = 'The Suncoast Difference';

const BASE_BENEFITS = [
  'Vetted, consistent technicians — a familiar face, not a rotating crew',
  'A photo service report in your inbox after every visit',
  'All standard service chemicals included',
  'Filter cleaning, backwashing & salt-cell cleaning — all included',
];

/**
 * The list, with the filter-service line appended ONLY when this pool's filter
 * type actually has one bundled. A sand-filter customer must never be shown a
 * promise about cartridge elements.
 */
export const includedBenefits = (filter: FilterOption): string[] => {
  const line = filterServiceLine(filter);
  return line ? [...BASE_BENEFITS, line] : [...BASE_BENEFITS];
};

// Carries the "why the rate may read a little higher" explanation. A flat rate
// that covers parts other companies invoice separately is the whole argument —
// state it plainly rather than letting the customer discover it by comparison.
/** The "why it may read higher" line — only true when something IS bundled. */
export const benefitsNote = (filter: FilterOption): string =>
  filterServiceLine(filter)
    ? "It's all covered in your flat rate — including the filter parts and labour most companies bill separately. That's why the monthly figure may read a little higher than a bare-bones quote, and why you won't get a surprise invoice on top of it."
    : "It's all covered in your flat rate — no surprise fees.";

// Clarifies exactly what the included filter service covers vs. doesn't, so a
// grid set or a housing part isn't assumed to be included. Worn/broken parts are
// framed as a separately-quoted repair (approved first), not a surprise fee.
/** Exactly what the included service covers for THIS filter — see filterService.ts. */
export const benefitsFootnote = (filter: FilterOption): string => filterServiceTerms(filter);
