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

/**
 * WHICH PLAN page one is describing — only on a quote that offers Essentials.
 *
 * The Difference box and the value-stack table are written as flat statements:
 * "All service chemicals included", "Cartridge filter replacement included",
 * "Salt cell acid washing — both included", and a table whose every row reads
 * Included. All of that is true of Complete and NOT of Essentials, so on a
 * three-plan quote page one was promising, in writing, things the plan on page
 * two removes.
 *
 * One sentence fixes it, and it does a second job while it is there: page one
 * now reads as the specification of the plan we actually want chosen, with the
 * cheaper card defined as a subtraction from it. That is the right order —
 * establish the full service, then show what comes off.
 */
export const BENEFITS_PLAN_SCOPE =
  'Everything below is included in Complete. The Essentials plan leaves out the items marked on its card.';

/**
 * The chemicals bullet — named, not summarised.
 *
 * This is the one line on the list a customer can price against another quote,
 * and including them is genuinely not standard: plenty of companies bill
 * chemicals on top, or include chlorine and little else. So it LEADS.
 *
 * Naming them is what makes it checkable. "All standard service chemicals
 * included" reads as a hedge until you say which ones — someone who has bought
 * a bottle of algaecide or a bag of shock knows exactly what those cost, and
 * recognising the list is what turns the claim into arithmetic. It also lines
 * up with the "$35–$400 algaecide & phosphate treatments" row further down the
 * proposal, so the two halves of the page reinforce each other instead of one
 * vaguely gesturing at the other.
 *
 * The list mirrors section 3 of the Service Agreement, which already
 * enumerates exactly these. Nothing new is promised here and no TERMS_VERSION
 * bump is needed — it surfaces a promise that was already made somewhere nobody
 * reads.
 *
 * Salt only on a salt pool, for the same reason as equipmentCareLine: a
 * chlorine owner who reads "salt" in their own inclusions has just been handed
 * a boilerplate list, and everything else on it becomes less believable.
 */
const CHEMICALS_LINE =
  'All service chemicals included — chlorine, muriatic acid, shock, stabilizer, phosphate remover and algaecide';

/**
 * Salt care, on its own line and only for a salt pool.
 *
 * It used to be tacked onto the end of the filter-care bullet
 * ("Filter cleaning, backwashing & salt-cell cleaning"), which buried it. The
 * acid wash is the item competitors most reliably invoice separately — the
 * value stack prices it at $100 a year — so grouping it with routine filter
 * cleaning made the one chargeable thing read like housekeeping.
 *
 * The salt itself moved here from the chemicals list rather than being named in
 * both. Two lines each promising salt is not twice the promise; it just makes a
 * reader wonder which one is the real one.
 */
const saltCareLine = (sanitization: string): string | null =>
  isSaltwater(sanitization) ? 'Salt cell acid washing and your salt — both included' : null;

/**
 * True of every pool, so these are fixed — and they sit BELOW the costed
 * inclusions above them.
 *
 * The photo report comes first of the two: it is a concrete thing that either
 * arrives in your inbox or doesn't. "Vetted, consistent technicians" is real,
 * but it is also what every company on the coast says about itself, so leading
 * the whole list with it (as this used to) opened on the least checkable claim
 * we make.
 */
const BASE_BENEFITS = [
  // GPS-stamped is the part that makes this checkable rather than a nicety.
  // A photo proves work was done somewhere; a location proves it was done at
  // YOUR pool, on the day it says. That is the whole anxiety for anyone who
  // isn't home when the tech comes — which on this coast is a large share of
  // customers — so the line names what it settles rather than the feature.
  'A GPS-stamped photo service report in your inbox after every visit — so you know we were there, even when you weren’t',
  /**
   * Sits with the GPS report because they are the same argument: the work is
   * recorded, and the record is worth something to you.
   *
   * INFERRED FROM CHEMISTRY, and the wording has to stay that way — this is not
   * a sensor and it does not detect leaks, it flags a pattern that often means
   * one. The mechanism is real: evaporation removes pure water and leaves the
   * dissolved solids behind, so it does not move these numbers, but water
   * leaving through a crack carries stabilizer and calcium out with it. Topped
   * up automatically, the level looks fine and only the readings fall.
   *
   * "flags a possible leak" is the honest claim. Anything stronger promises a
   * diagnosis, and section 4 of the Service Agreement excludes leak repair —
   * finding it early is the value here, not fixing it.
   */
  'Chemistry tracked visit to visit — a steady drop in stabilizer or calcium hardness flags a possible leak while the water still looks fine',
  'Vetted, consistent technicians — a familiar face, not a rotating crew',
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
const equipmentCareLine = (filter: FilterOption): string =>
  filter.type === 'DE' || filter.type === 'Sand'
    ? 'Filter cleaning and backwashing — both included'
    : 'Filter cleaning — included';

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
 * The list, ordered by what a competitor is LEAST likely to also be doing.
 *
 * Chemicals, then this pool's filter service, then routine equipment care —
 * the three things that are actually priced into the rate and would appear as
 * separate invoices elsewhere. The general promises follow, and the guarantee
 * stays last (see GUARANTEE_BENEFIT).
 *
 * The filter-service line appears ONLY when this pool's filter type actually
 * has one bundled — a sand-filter customer must never be shown a promise about
 * cartridge elements.
 */
export const includedBenefits = (filter: FilterOption, sanitization = ''): string[] => {
  const filterLine = filterServiceLine(filter);
  const saltLine = saltCareLine(sanitization);
  return [
    CHEMICALS_LINE,
    ...(filterLine ? [filterLine] : []),
    // Directly under the filter service: both are consumables a competitor
    // bills for by name, and this is the pair that carries the most money.
    ...(saltLine ? [saltLine] : []),
    equipmentCareLine(filter),
    ...BASE_BENEFITS,
    GUARANTEE_BENEFIT,
  ];
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
