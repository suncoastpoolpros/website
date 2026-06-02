/**
 * The "what's included" value highlight shown prominently near the top of the
 * proposal (PDF + email). These reflect Suncoast's all-inclusive RECURRING
 * service — chemicals, filter cleans, and salt-cell maintenance are covered in
 * the flat rate. (One-time jobs bill chemicals separately, so the builder lets
 * you toggle this off for those.)
 *
 * Mirrored as plain constants in functions/api/admin/send-proposal.ts (the
 * Pages Function can't import from the client src tree) — keep them in sync.
 */
export const BENEFITS_HEADING = 'Included With Your Service';

export const INCLUDED_BENEFITS = [
  'All standard chemicals & salt — at no extra charge',
  'Filter cleanings included',
  'Salt cell cleaning & system maintenance included',
];

export const BENEFITS_NOTE = "It's all covered in your flat rate — no surprise fees.";
