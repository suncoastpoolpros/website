/**
 * Commercial contract terms — the clauses a board expects and a homeowner never sees.
 *
 * The residential proposal can be a flat monthly rate and a guarantee, because
 * one person is deciding to spend their own money and can change their mind next
 * month. A commercial bid is read as a contract in draft: it goes into a board
 * packet, gets compared clause by clause against two others, and whatever it
 * fails to say is a cost somebody absorbs for a year.
 *
 * TWO KINDS OF VALUE LIVE IN THIS FILE.
 *
 * The BUSINESS CONSTANTS below are the same on every bid — limits, licence
 * numbers, response windows. They belong here rather than in the autosaved
 * draft, because a draft is cleared between customers and nobody should be
 * retyping their insurance limits per proposal.
 *
 * The PER-BID FIGURES — repair threshold, escalator, term — are fields on the
 * builder, because they are genuinely negotiated. The helpers at the bottom
 * turn them into the sentences that get printed.
 */

// ---------------------------------------------------------------------------
// BUSINESS CONSTANTS — fill these in once.
//
// Every one of them is omitted from the document while it is blank, so an
// unfilled value never reaches a customer as a false claim or an empty label.
// Anything asserting a limit or a licence must be true: a board's insurance
// reviewer checks these against the certificate, and a mismatch loses the bid
// on the spot.
// ---------------------------------------------------------------------------

export const BUSINESS = {
  /** General liability, per occurrence. e.g. '1,000,000' */
  glPerOccurrence: '',
  /** General liability, aggregate. e.g. '2,000,000' */
  glAggregate: '',
  /** Workers' compensation — leave blank if exempt rather than implying cover. */
  workersComp: '',
  /** Florida licence number, if a licensed contractor. */
  licenseNumber: '',
  /** Public Pool Service Technician certification reference, per 64E-9.018. */
  certificationNumber: '',
} as const;

/**
 * Insurance is often the first thing a management company checks, and a bid
 * without it can be set aside before the scope is read. Offered as a
 * deliverable rather than a boast: naming the association as an additional
 * insured is the thing they actually want, because it puts our carrier in front
 * of theirs on a claim arising from our work.
 */
export const INSURANCE_OFFER =
  'A certificate of insurance naming the association as an additional insured is provided on award, before the first visit.';

/** Response commitments. Kept modest and therefore keepable. */
export const RESPONSE_TERMS = [
  'A named point of contact for the board or manager, reachable directly rather than through a call centre.',
  'Same-business-day response to any message about the pool.',
  'Attendance within 24 hours for anything that has closed the pool or is about to.',
  'Written notice to the manager the same day if we find a condition that requires closure, with what it will take to reopen.',
];

/**
 * Why this bid differs, compressed. The residential value stack — "what others
 * charge extra for" — is deliberately NOT carried over: it reads as retail to a
 * board, and the job it does is done better by the scope and exclusions
 * sections. What is left is the four things a route operator cannot match.
 */
export const COMMERCIAL_DIFFERENCE = [
  'Readings are recorded on site and trended, so the monthly log is generated from data rather than filled in from memory.',
  'Every visit is time and GPS stamped with photographs of the pad — a service record that answers "nobody came on the 14th" in one line.',
  'Our service technician certification stays posted in your equipment room, as the code requires of whoever services the pool.',
  'A capped route, so the feeders stay fed and the filters stay open — which is where these pools actually fail.',
];

// ---------------------------------------------------------------------------
// Per-bid sentences
// ---------------------------------------------------------------------------

/** Sensible starting values for the builder's terms fields. */
export const TERM_DEFAULTS = {
  repairThreshold: '250',
  afterHoursMultiplier: '1.5',
  termMonths: '12',
  noticeDays: '30',
  escalatorPct: '4',
  chemicalBandPct: '15',
  paymentTerms: 'Net 30',
  bidValidDays: '30',
};

const money = (v: string): string => {
  const n = v.replace(/[^0-9.]/g, '');
  return n ? `$${n}` : '';
};

/**
 * The pre-authorised repair threshold.
 *
 * The most popular clause in a commercial bid, and worth understanding why: it
 * stops a $90 part needing a board vote, which is the failure mode every
 * manager has lived through. It also protects us — without it a technician
 * stands at a dead feeder with no authority to fix the thing that will close
 * the pool tomorrow.
 */
export const repairThresholdTerm = (threshold: string): string => {
  const t = money(threshold);
  if (!t) return '';
  return `Repairs costing ${t} or less are carried out on the visit and reported, so a small part never waits on a board meeting. Anything above ${t} is quoted for your approval before work begins.`;
};

/** After-hours and emergency attendance. */
export const afterHoursTerm = (multiplier: string): string => {
  const m = multiplier.trim();
  if (!m) return '';
  return `Attendance outside scheduled visits, at your request, is billed at ${m}× the standard visit rate. Return visits to correct our own work are never charged.`;
};

/**
 * Chemicals included, with a band.
 *
 * Boards dislike variable invoices, so include chemicals — but commercial
 * chemistry runs several times residential per visit, and absorbing an
 * uncapped commodity move for a year is how a good contract becomes a bad one.
 */
export const chemicalTerm = (bandPct: string): string => {
  const b = bandPct.replace(/[^0-9.]/g, '');
  const base = 'All chemicals required for routine treatment are included in the monthly rate.';
  if (!b) return base;
  return `${base} Should wholesale chemical costs move more than ${b}% during the term, we may propose an adjustment in writing, with 30 days’ notice and your right to decline and terminate.`;
};

/** Term, renewal and notice, as one sentence. */
export const termAndRenewalTerm = (months: string, noticeDays: string, escalatorPct: string): string => {
  const m = months.replace(/[^0-9]/g, '') || TERM_DEFAULTS.termMonths;
  const n = noticeDays.replace(/[^0-9]/g, '') || TERM_DEFAULTS.noticeDays;
  const e = escalatorPct.replace(/[^0-9.]/g, '');
  const esc = e
    ? ` At renewal the rate may increase by up to ${e}%, and you will be notified in writing at least ${n} days beforehand.`
    : '';
  return `An initial term of ${m} months, continuing month to month afterwards. Either party may end the agreement on ${n} days’ written notice, for any reason.${esc}`;
};

/** How the bid itself is bounded in time. */
export const bidValidityTerm = (days: string): string => {
  const d = days.replace(/[^0-9]/g, '') || TERM_DEFAULTS.bidValidDays;
  return `This proposal is valid for ${d} days from the date above. Pricing assumes each body of water is in clean, balanced and operational condition at the start of service; bringing a pool up to that standard is surveyed and quoted separately, always before any work begins.`;
};

/** Invoicing. Commercial does not pay by card on file. */
export const paymentTerm = (terms: string): string => {
  const t = terms.trim() || TERM_DEFAULTS.paymentTerms;
  return `Invoiced monthly in arrears, ${t}. Purchase order or work order numbers are carried on the invoice where your accounts payable requires them.`;
};
