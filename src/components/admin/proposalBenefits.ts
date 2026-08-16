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
export const BENEFITS_HEADING = 'The Suncoast Difference';

export const INCLUDED_BENEFITS = [
  'Vetted, consistent technicians — a familiar face, not a rotating crew',
  'A photo service report in your inbox after every visit',
  'All standard service chemicals included',
  'Filter cleaning, backwashing & salt-cell cleaning — all included',
  'Your annual filter service — replacement cartridge elements, or a DE split & recharge',
];

// Carries the "why the rate may read a little higher" explanation. A flat rate
// that covers parts other companies invoice separately is the whole argument —
// state it plainly rather than letting the customer discover it by comparison.
export const BENEFITS_NOTE =
  "It's all covered in your flat rate — including the filter parts and labour most companies bill separately. That's why the monthly figure may read a little higher than a bare-bones quote, and why you won't get a surprise invoice on top of it.";

// Clarifies exactly what the included filter service covers vs. doesn't, so a
// grid set or a housing part isn't assumed to be included. Worn/broken parts are
// framed as a separately-quoted repair (approved first), not a surprise fee.
export const BENEFITS_FOOTNOTE =
  'The included annual filter service covers replacement cartridge elements, or a DE filter split, disassembly, clean and recharge — parts and labour. It does not include DE grid replacement (including torn grids), filter housing parts, or other repairs; we quote those separately, and always before doing the work.';
