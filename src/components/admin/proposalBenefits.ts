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
 * The list, with the filter-service line appended ONLY when this pool's filter
 * type actually has one bundled. A sand-filter customer must never be shown a
 * promise about cartridge elements.
 */
export const includedBenefits = (filter: FilterOption): string[] => {
  const line = filterServiceLine(filter);
  return line
    ? [...BASE_BENEFITS, line, GUARANTEE_BENEFIT]
    : [...BASE_BENEFITS, GUARANTEE_BENEFIT];
};

// States what the flat rate covers, and lets "most companies bill separately" do
// the comparing.
//
// It used to end "that's why the monthly figure may read a little higher than a
// bare-bones quote". Cut deliberately: this string also renders on the approve
// page, where the customer has already decided and is about to sign — naming a
// competitor's advantage at the moment of commitment plants a doubt rather than
// defusing one. It also conceded the wrong axis. A bare-bones quote plus a $120
// cartridge, a $100 salt-cell wash and $35–$400 of algaecide is not cheaper, so
// "higher" surrendered a comparison that the total cost wins.
/** What the flat rate covers — only claims the extras when something IS bundled. */
export const benefitsNote = (filter: FilterOption): string =>
  filterServiceLine(filter)
    ? "It's all covered in your flat rate — including the filter parts and labour most companies bill separately. One number every month, and no surprise invoice on top of it."
    : "It's all covered in your flat rate — no surprise fees.";

// Clarifies exactly what the included filter service covers vs. doesn't, so a
// grid set or a housing part isn't assumed to be included. Worn/broken parts are
// framed as a separately-quoted repair (approved first), not a surprise fee.
/** Exactly what the included service covers for THIS filter — see filterService.ts. */
export const benefitsFootnote = (filter: FilterOption): string => filterServiceTerms(filter);
