/**
 * The included annual filter service, tailored to the pool's actual filter.
 *
 * A cartridge pool, a DE pool and a sand pool need three different sentences,
 * and the exclusions differ too — an unqualified "DE split and clean" would
 * arguably oblige a $150–250 grid set, and a sand pool has no cartridge to
 * replace at all. Quoting the wrong one is a promise you can't keep, so the
 * builder asks for the filter type and whether the service is included, and
 * every surface (proposal PDF, email, plan cards) derives its wording from here.
 *
 * Mirrored as plain constants in functions/api/admin/send-proposal.ts (the Pages
 * Function can't import from the client src tree) — keep them in sync.
 */

import { isSaltwater } from './sanitization';

export const FILTER_TYPES = ['Cartridge', 'DE', 'Sand', 'Other'] as const;

/**
 * What the service is worth, and WHY — the basis is quoted alongside the figure
 * so "$120 value" reads as a costed number rather than a marketing round-up. A
 * customer who knows a cartridge set lasts about a year can check the maths, and
 * that is the point.
 *
 * Sand is deliberately absent: media replacement hasn't been costed and runs on
 * a 5–7 year cycle, not annual, so no figure is quoted for it rather than an
 * invented one. Add an entry here and it appears automatically everywhere.
 */
export const FILTER_SERVICE: Record<string, { value: number; basis: string }> = {
  // 8–18 months is the real spread; 12 is only the middle of it. Quoting the
  // range rather than the midpoint is what makes the $120 checkable — a customer
  // whose elements lasted 18 months would otherwise catch the claim out.
  Cartridge: { value: 120, basis: 'based on an 8–18 month element life' },
  // Annual is the mainstream cadence and what Florida-specific guidance
  // recommends (full teardown yearly, backwash + DE replenishment every 4–6
  // weeks). Twice yearly is also common nationally and quarterly is the
  // aggressive end, so the TERMS cap what's included at one a year — otherwise a
  // heavy-use pool wanting quarterly teardowns is $600/yr against a $150
  // assumption. The real trigger is pressure (clean at 20–25% over clean psi).
  DE: { value: 150, basis: 'based on an annual split cadence' },
};

/** "— a $120 value, based on an 8–18 month element life", or '' when uncosted. */
const valueClause = (type: string): string => {
  const v = FILTER_SERVICE[type];
  return v ? ` — a $${v.value} value, ${v.basis}` : '';
};

export type FilterOption = {
  /** One of FILTER_TYPES, or '' when not yet chosen. */
  type: string;
  included: boolean;
};

/** Filter types where an annual service can meaningfully be bundled. */
export const supportsFilterService = (type: string): boolean =>
  type === 'Cartridge' || type === 'DE' || type === 'Sand';

/** The question the builder asks once a filter type is chosen. */
export const inclusionQuestion = (type: string): string => {
  switch (type) {
    case 'Cartridge':
      return 'Cartridge replacements included in the monthly cost?';
    case 'DE':
      return 'DE split & recharge included in the monthly cost?';
    case 'Sand':
      return 'Sand media replacement included in the monthly cost?';
    default:
      return 'Filter service included in the monthly cost?';
  }
};

/**
 * The service bullet, or null when nothing is bundled — in which case no line is
 * printed at all rather than a line saying what the customer doesn't get.
 */
export const filterServiceLine = ({ type, included }: FilterOption): string | null => {
  if (!included || !supportsFilterService(type)) return null;
  switch (type) {
    case 'Cartridge':
      return `Cartridge filter replacement included in your monthly cost${valueClause(type)}`;
    case 'DE':
      return `DE filter split, clean and recharge included in your monthly cost${valueClause(type)}`;
    case 'Sand':
      return `Sand media replacement included in your monthly cost${valueClause(type)}`;
    default:
      return null;
  }
};

/**
 * The PLAN CARD's filter bullet — short, and specific to this pool's filter.
 *
 * Separate from filterServiceLine because the two appear on the same page: that
 * one is the costed sentence in the Suncoast Difference box ("a $120 value,
 * based on an 8–18 month element life"), this one is a bullet in a column
 * beside a price. Printing the costed sentence in both places says the same
 * thing twice in one document.
 *
 * SPECIFIC, not generic. The card used to say "Filter care included — never a
 * separate invoice" for every filter type, which was true but vague, and vague
 * is what let it go stale: because the string named no filter, nothing could
 * recognise it as the filter bullet, so switching the answer to "not included"
 * left it standing and the card kept promising a service that had not been
 * sold. Naming the filter is what makes the line findable — see
 * ALL_PLAN_FILTER_LINES.
 *
 * Returns null when nothing is bundled, so no line is printed at all rather
 * than a line telling the customer what they do not get.
 */
export const planFilterBullet = ({ type, included }: FilterOption): string | null => {
  if (!included || !supportsFilterService(type)) return null;
  switch (type) {
    case 'Cartridge':
      return 'Cartridge replacements included — never a separate invoice';
    case 'DE':
      return 'DE split, clean & recharge included — never a separate invoice';
    case 'Sand':
      return 'Sand media replacement included — never a separate invoice';
    default:
      return null;
  }
};

/**
 * Every plan-card filter bullet that has ever existed, so a stale one can be
 * found and removed when the filter type or the answer changes.
 *
 * The legacy generic string is listed LAST and deliberately: a draft written
 * before the bullet named the filter still carries it, and without this entry
 * that draft can never lose the promise.
 */
export const ALL_PLAN_FILTER_LINES: string[] = [
  ...FILTER_TYPES.map((type) => planFilterBullet({ type, included: true })).filter(
    (l): l is string => l !== null,
  ),
  'Filter care included — never a separate invoice',
];

/**
 * Every line filterServiceLine can ever produce. The builder uses this to find
 * and replace a stale filter bullet when the filter type changes, without
 * touching anything the admin typed by hand.
 */
export const ALL_FILTER_LINES: string[] = FILTER_TYPES.map((type) =>
  filterServiceLine({ type, included: true }),
).filter((l): l is string => l !== null);

/**
 * The terms for whichever service is (or isn't) included. Always returns
 * something: when nothing is bundled it still says replacements are quoted
 * separately, so "filter cleaning is included" can't be misread as "replacement
 * elements are included".
 */
export const filterServiceTerms = ({ type, included }: FilterOption): string => {
  if (!included || !supportsFilterService(type)) {
    /*
     * DE NEEDS ITS OWN SENTENCE. The generic wording excludes "elements, grids
     * or media" — and DE powder IS media, so on a DE pool it withdrew the very
     * consumable routine backwashing depends on. The powder is a few dollars a
     * recharge every 4–8 weeks, has no trigger event to quote against, and our
     * own included-service terms already promise "routine backwashing and DE
     * replenishment throughout the year". It is included; only the annual
     * teardown and the grids are not.
     */
    if (type === 'DE') {
      return 'Routine backwashing is included in your service, along with the DE powder it consumes through the year. The annual split, disassembly and clean, DE grid replacement and filter housing parts are quoted separately, and always before any work is done.';
    }
    return 'Routine filter cleaning and backwashing are included in your service. Replacement filter elements, grids or media are quoted separately, and always before any work is done.';
  }
  switch (type) {
    case 'Cartridge':
      return 'The included filter service covers replacement cartridge elements when they are due — parts and labour. Element life varies with use and typically runs 8 to 18 months. It does not include filter housing parts or other repairs; those are quoted separately, and always before any work is done.';
    case 'DE':
      return 'The included filter service covers one full DE split, disassembly, clean and recharge each year — parts and labour — plus routine backwashing and DE replenishment throughout the year. If your pool needs an additional teardown in the same year we quote it separately. It does not include DE grid replacement (including torn grids) or filter housing parts; those are quoted separately, and always before any work is done.';
    case 'Sand':
      return 'The included sand media replacement covers the media and the labour to change it when due. It does not include laterals, filter housing parts or other repairs; those are quoted separately, and always before any work is done.';
    default:
      return '';
  }
};

/**
 * The tailored explainer for this specific pool. Names the customer's actual
 * filter and the actual bill they won't receive — a cartridge customer should
 * read a sentence about cartridges, not a generic one covering every filter type
 * they don't own.
 */
export const filterServiceValueNote = ({ type, included }: FilterOption): string => {
  if (!included || !supportsFilterService(type)) return '';
  const priced = FILTER_SERVICE[type];
  const bill = priced ? `a random $${priced.value} bill` : 'a surprise bill';
  switch (type) {
    case 'Cartridge':
      return `Your cartridge filter replacement is built into the monthly cost. When the elements are due we simply fit them — no quote to approve, no separate invoice, and ${bill} never lands in your inbox.`;
    case 'DE':
      return `Your DE filter split, clean and recharge is built into the monthly cost. When it's due we simply do it — no quote to approve, no separate invoice, and ${bill} never lands in your inbox.`;
    case 'Sand':
      return `Your sand media replacement is built into the monthly cost. When the media is due we simply change it — no quote to approve and no separate invoice.`;
    default:
      return '';
  }
};

/**
 * Superseded terms, kept ONLY so syncFilterService can still recognise a draft
 * holding them as untouched machine text. Same rule as the tier wording: an
 * exact match proves nobody edited it, so it is safe to replace.
 */
const LEGACY_FILTER_TERMS: string[] = [
  'Routine filter cleaning and backwashing are included in your service. Replacement filter elements, grids or media are quoted separately, and always before any work is done.',
];

export const ALL_FILTER_TERMS: string[] = [
  // Every EXCLUDED variant, not just the generic one — DE now has its own.
  ...FILTER_TYPES.map((type) => filterServiceTerms({ type, included: false })),
  filterServiceTerms({ type: '', included: false }),
  ...FILTER_TYPES.map((type) => filterServiceTerms({ type, included: true })),
  ...LEGACY_FILTER_TERMS,
].filter(Boolean);

/**
 * What the Essentials plan leaves out, as card rows.
 *
 * TWO ITEMS, NOT THREE. Algaecide stays INCLUDED on every plan: the Pinellas
 * market treats it as part of a flat rate, so excluding it would put
 * Essentials BELOW the going rate rather than level with it — the opposite of
 * what the card is for. Phosphate remover is the specialty treatment
 * competitors here genuinely bill separately, and filter parts is the item
 * even the "all chemicals included" companies carve out.
 *
 * Each line says what happens when the thing is needed, not merely that it is
 * absent: "quoted at cost, approved first" is the difference between a
 * cheaper plan and a bait-and-switch.
 */
/**
 * The ✓ rows on Complete that pair, one for one and in the same order, with
 * the ✗ rows on Essentials.
 *
 * The conversion mechanic is the MATCHED PAIR: a green check and a grey cross
 * on the same line of two adjacent cards. Listing the items only as absences
 * on the cheap card makes it look shorter; listing them as presences only on
 * the expensive card makes it look longer. Showing both, level, is what makes
 * the $10 legible as three specific things rather than a number.
 *
 * Kept in lockstep with essentialsExclusions below — same conditions, same
 * order. Change one, change the other.
 */
export const completeDifferentiators = (
  type: string,
  sanitization = '',
): string[] => {
  const out: string[] = [];
  // The filter bullet is planFilterBullet's string verbatim, so the short
  // forms and the sync machinery already recognise it.
  const parts = planFilterBullet({ type, included: true });
  if (parts) out.push(parts);
  if (isSaltwater(sanitization)) {
    out.push('Salt-cell acid cleaning included — never a separate invoice');
  }
  out.push('Phosphate remover and specialty treatments included when needed');
  return out;
};

export const essentialsExclusions = (
  type: string,
  sanitization = '',
): string[] => {
  const priced = FILTER_SERVICE[type];
  const cost = priced ? ` (about $${priced.value})` : '';
  const parts =
    type === 'DE'
      ? `The annual DE split, clean & recharge${cost} — quoted when due, approved first`
      : type === 'Sand'
        ? 'Sand media replacement — quoted at cost when due, approved first'
        : type === 'Cartridge'
          ? `Replacement cartridge elements${cost} — quoted at cost when due, approved first`
          : 'Replacement filter elements or media — quoted at cost when due, approved first';
  const out = [
    parts,
    'Phosphate remover and specialty treatments — quoted only if your pool needs them',
  ];
  /*
   * SALT POOLS ONLY. A chlorine pool has no cell, so listing a cell wash as
   * "not included" would be excluding something the customer could never have
   * needed — which reads as padding the exclusions to make the other cards
   * look better.
   *
   * $25 is the same figure the value-stack table already quotes ("$25 a wash,
   * typically washed quarterly"), so the two sections of the same document
   * cannot disagree about the price of the same job.
   */
  if (isSaltwater(sanitization)) {
    out.splice(
      1,
      0,
      'Salt-cell acid cleaning — $25 each time the cell needs it',
    );
  }
  return out;
};

/**
 * The monthly card's explainer when filter service is NOT bundled.
 *
 * The old behaviour fell through to a "genuinely all-in — no surprise fees on
 * top" line — on precisely the quote where a $120–150 parts bill will later
 * arrive as a separate invoice. This is its replacement: it still argues the
 * all-in case for what the rate DOES cover, then states the parts carve-out
 * affirmatively. Quoted-first-and-approved is the load-bearing clause — it is
 * what stops the lower rate reading as bait-and-switch when the first element
 * comes due.
 *
 * Also the ESSENTIALS plan's explainer in the three-plan layout: that card and
 * an excluded-filter monthly card are making the identical promise.
 */
export const excludedFilterValueNote = (type: string): string => {
  const priced = FILTER_SERVICE[type];
  const cost = priced ? ` — typically $${priced.value}, ${priced.basis} —` : '';
  const parts =
    type === 'DE'
      ? `when your DE split, clean and recharge is due${cost} we quote it first`
      : type === 'Sand'
        ? 'when your sand media is due we quote it at cost first'
        : type === 'Cartridge'
          ? `when your cartridge elements are due${cost} we quote them at cost first`
          : 'anything the filter needs beyond routine cleaning is quoted at cost first';
  /*
   * Algaecide is named as INCLUDED on purpose. It is the chemical a customer
   * comparing quotes checks for, and leaving it unsaid beside "specialty
   * treatments are extra" invites them to assume it went out with the rest —
   * which would read as below-market when the rate is meant to read as level
   * with the market.
   */
  // Naming the powder matters most on DE: it is the one consumable a customer
  // could reasonably assume went out with the annual teardown.
  const cleaning =
    type === 'DE'
      ? 'routine backwashing and the DE powder it uses stay included'
      : 'routine filter cleaning stays included';
  return `Your weekly service, chemicals and algaecide are all in this rate, and ${cleaning}. Two things are kept out to hold the price down: ${parts}, and phosphate remover is used only if your pool actually needs it. Nothing is added without your approval.`;
};

/**
 * Every value note this module has ever generated, so syncFilterService can
 * recognise a note as untouched machine text and retire it when the answer
 * changes. The audit found the gap this closes: flipping included → no swapped
 * the bullet and the fine print but left "a random $120 bill never lands in
 * your inbox" rendering on a quote that had just started sending that bill.
 * Same exact-match rule as everywhere else: an edited note is hand-written and
 * survives.
 */
export const ALL_FILTER_VALUE_NOTES: string[] = [
  ...FILTER_TYPES.map((type) => filterServiceValueNote({ type, included: true })),
  ...FILTER_TYPES.map((type) => excludedFilterValueNote(type)),
  excludedFilterValueNote(''),
].filter(Boolean);

/**
 * How the filter type reads on a CUSTOMER-FACING document.
 *
 * "Cartridge" is the name of a part; "Cartridge Filter" is the name of a thing
 * they own and can point at. Same for DE and Sand, both of which are just
 * materials until the noun is attached.
 *
 * Stored casing is preserved, so DE stays capitalised. Anything outside the
 * three known types — including 'Other' and hand-typed values — is left alone
 * rather than having a noun bolted onto something that may not be one.
 */
export const filterTypeLabel = (type: string): string => {
  const t = type.trim();
  return /^(de|cartridge|sand)$/i.test(t) ? `${t} Filter` : t;
};
