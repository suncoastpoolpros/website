/**
 * The two options shown on a tiered proposal.
 *
 * The axis is PAYMENT TERM, not scope. The SERVICE is identical on both and now
 * genuinely all-in: chemicals, filter cleans, salt-cell cleans AND the annual
 * filter service (cartridge elements, or a DE split and recharge). That last
 * item used to be sold as an upgrade; folding it into the base rate is what
 * makes "no surprise fees" literally true for every customer, and means never
 * chasing anyone to approve a $120 cartridge. The base rate rises by about
 * $10–12.50/month to absorb it, which the proposal states plainly rather than
 * leaving the customer to discover by comparison.
 *
 * Paying for the year up front then buys a payment-term benefit: one month free
 * and a labour discount.
 *
 * DESIGN RULE — the second option never claws back anything from the first.
 * Annual only ADDS. If a benefit ever moves out of the monthly option to make
 * annual look better, the proposal starts reading as "here's what you DON'T
 * get", and the flat-rate differentiator becomes an upsell.
 *
 * Everything here is a starting point the admin edits per proposal.
 */
import type { Tier } from "@/lib/adminApi";
import {
  essentialsExclusions,
  FILTER_SERVICE,
  ALL_FILTER_LINES,
  ALL_PLAN_FILTER_LINES,
  planFilterBullet,
  ALL_FILTER_TERMS,
  type FilterOption,
  filterServiceLine,
  filterServiceTerms,
  filterServiceValueNote,
  supportsFilterService,
  excludedFilterValueNote,
  ALL_FILTER_VALUE_NOTES,
} from "./filterService";

/**
 * Months charged for a year of service — 11, i.e. one month free (~8.3% off).
 *
 * This was 12 while the annual filter service was the annual-only incentive.
 * That service is now IN THE BASE RATE for everybody (see proposalBenefits.ts),
 * which is what solves the chasing-customers-for-filter-money problem for every
 * customer rather than only the ones who prepay — so annual needs its own
 * incentive again, and a free month is the clearest one to state.
 *
 * What it buys: twelve months of cash on day one, a year of near-zero churn,
 * and no monthly collection. 8.3% is squarely in the normal 5–15% band for
 * annual prepay.
 */
export const ANNUAL_MONTHS_CHARGED = 11;

/**
 * Bump whenever the wording or structure of the presets below changes.
 *
 * Plan cards are STORED, not derived: buildTiers() runs once, when tiers are
 * first switched on, and the result lives in the draft so per-proposal edits
 * survive. That means editing this file does nothing to a draft already in
 * progress — which is how a card sat there showing superseded wording with no
 * hint anything was wrong. The builder compares this against the version
 * stamped on the draft and offers a reset.
 *
 * Deliberately a version rather than a content diff: a content diff can't tell
 * a stale preset from wording the admin edited on purpose, so it would nag
 * forever on any customised proposal.
 */
/* 5: the annual badge became "Save $X" and the four-figure total moved to its
   own billingNote line under the button. A draft started before that has the
   old combined string and no billingNote, so it should be offered the refresh. */
/* 7: plan taglines. The annual one answers the lock-in objection instead of
   restating the saving badge below it; the monthly one loses a redundant word.
   Both old strings are in the LEGACY lists, so drafts pick the new wording up.
   8: "photo report" → "service report" in both the long and short forms.
   "GPS-stamped" is the term used everywhere else, so print and page now say the
   same thing — the customer reads both documents, often side by side. */
/* 9: the plan card's filter bullet now names the filter (Cartridge / DE /
   Sand) instead of a generic "Filter care included", so it can be recognised
   and removed when the answer or the type changes. */
/* 10: the optional three-plan layout (Essentials / Pay Monthly / Pay
   Annually), plus the excluded-filter value note replacing the old
   "genuinely all-in" fallback. Two-plan quotes are unaffected in wording;
   the bump exists so drafts pick up the corrected excluded note. */
export const PRESET_VERSION = 10;

/** Terms specific to prepaying for the year. */
/**
 * The free month sits at the END of the term, which is what makes the refund
 * fair without needing a formula: cancel early and you are refunded the months
 * you have not used at the standard rate, so the free month is earned by
 * completing the year. Mirrors the Cancellation Policy in the service agreement.
 */
export const ANNUAL_FINE_PRINT =
  "Your twelfth month is free and applied at the end of the term. Cancel at any time and we refund every month you have not used, at the standard monthly rate. Repair labour discount applies to our own labour and excludes work performed by subcontractors.";

const BASE_SERVICE_INCLUDES = [
  "Weekly cleaning — brushing, skimming, netting and vacuuming",
  "All standard chemicals included",
  "Filter cleaning, backwashing and salt-cell cleaning",
  "Full equipment check on every visit",
  "A photo service report in your inbox after every visit",
];

/**
 * The weekly service, with this pool's filter-service line inserted right after
 * the routine filter-cleaning bullet — and omitted entirely when nothing is
 * bundled, so a sand pool is never shown a cartridge promise.
 */
export const serviceIncludes = (filter: FilterOption): string[] => {
  const line = filterServiceLine(filter);
  if (!line) return [...BASE_SERVICE_INCLUDES];
  const out = [...BASE_SERVICE_INCLUDES];
  out.splice(3, 0, line);
  return out;
};

/**
 * Swap a stale filter bullet and terms for the current ones after the admin
 * changes the filter type or the inclusion toggle, WITHOUT disturbing anything
 * typed by hand: only lines this module could itself have generated are touched.
 */
export const syncFilterService = (
  tiers: Tier[],
  filter: FilterOption,
): Tier[] => {
  if (tiers.length === 0) return tiers;
  // The PLAN CARD's bullet, not the Difference box's costed sentence: this
  // function edits tiers[0].includes, which IS the card. Inserting the costed
  // sentence here put the same paragraph in two places on one document.
  const line = planFilterBullet(filter);
  const terms = filterServiceTerms(filter);
  return tiers.map((tier) => {
    /*
     * EVERY tier, not just tiers[0].
     *
     * This used to bail on `i !== 0`, written when only the monthly card
     * carried the service list. The annual card now carries the same shared
     * lines (sharedCount) — so flipping the filter answer stripped the promise
     * from the monthly card and left it standing, verbatim, on the annual one.
     * A customer choosing Pay Annually was still being promised replacements
     * the quote had withdrawn.
     *
     * The essentials card is the deliberate exception: excluding filter parts
     * IS that card, so it never receives the bullet whatever the answer.
     */
    const wantsLine = line && !tier.essentials;
    /*
     * Strip BOTH families of filter bullet, then re-insert at most one.
     *
     * ALL_FILTER_LINES is the costed sentence from the Difference box;
     * ALL_PLAN_FILTER_LINES is the plan card's own short bullet, including the
     * legacy generic wording. Recognising only the first was the bug: the card
     * kept a generic promise the filter answer had just withdrawn, and a type
     * change added a second bullet beside the first rather than replacing it.
     */
    const kept = tier.includes.filter(
      (b) =>
        !ALL_FILTER_LINES.includes(b.trim()) &&
        !ALL_PLAN_FILTER_LINES.includes(b.trim()),
    );
    let includes = kept;
    let inserted = false;
    if (wantsLine) {
      // Back where monthlyIncludes puts it: directly after the chemicals line.
      const anchor = kept.findIndex((b) => /all chemicals/i.test(b));
      includes =
        anchor === -1
          ? [...kept, line as string]
          : [
              ...kept.slice(0, anchor + 1),
              line as string,
              ...kept.slice(anchor + 1),
            ];
      inserted = anchor !== -1;
    }
    /*
     * sharedCount must follow the list it indexes.
     *
     * It is the split point between the lines both cards share and this card's
     * own extras. Adding or removing a shared bullet without moving it silently
     * reclassified a line — the annual card's first extra became a shared row,
     * or an annual-only perk got printed as if the monthly plan had it too.
     */
    const removedShared = tier.includes.length - kept.length;
    const sharedCount =
      tier.sharedCount == null
        ? tier.sharedCount
        : Math.max(
            0,
            Math.min(
              includes.length,
              tier.sharedCount - removedShared + (inserted ? 1 : 0),
            ),
          );
    const finePrint =
      ALL_FILTER_TERMS.includes(tier.finePrint.trim()) ||
      tier.finePrint.trim() === ""
        ? terms
        : tier.finePrint;
    /*
     * Retire a value note this module generated for the OTHER answer.
     *
     * Nothing did this before, so "your cartridge filter replacement is built
     * into the monthly cost … a random $120 bill never lands in your inbox"
     * kept rendering after the answer flipped to no. Exact match only: an
     * operator's own wording is never touched. The annual card's note is about
     * prepaying, not filters, so it matches nothing here and survives.
     */
    const generated = ALL_FILTER_VALUE_NOTES.includes(tier.valueNote.trim());
    const valueNote = generated
      ? tier.essentials
        ? excludedFilterValueNote(filter.type)
        : filterServiceValueNote(filter) || excludedFilterValueNote(filter.type)
      : tier.valueNote;
    return { ...tier, includes, sharedCount, finePrint, valueNote };
  });
};

/**
 * What paying annually ADDS — the PDF renders "Everything in Pay Monthly,
 * plus:" above this, so the weekly service is never repeated or implicitly
 * withheld.
 */
/**
 * No "rate locked for 12 months" bullet. It was meant to reassure and did the
 * opposite — a customer reads "locked" as "committed", which is the fear that
 * stops people prepaying at all. Cancel-any-time answers the same question the
 * right way round.
 */
/**
 * What PAYING MONTHLY gets you, so the base card isn't a price floating in
 * whitespace next to a full annual card. Deliberately terms, not a re-listing of
 * the service: the service is described once above the cards, and repeating six
 * bullets here is what made the comparison too tall for the page in the first
 * place. Both cards now describe their payment terms, which is the actual
 * difference between them.
 */
export const monthlyIncludes = (filter: FilterOption): string[] => [
  // The hidden-cost worry, first. Most companies bill chemicals on top, so this
  // is the line a customer can actually price against the quote next to ours.
  "All chemicals included in your set monthly rate",
  // ONLY when this quote actually bundles it. filterServiceIncluded is asked per
  // quote and is often 'no' — printing this on a pool where it wasn't sold
  // promises a bill we'd then be expected to absorb.
  // Names the customer's ACTUAL filter, and is the same string
  // syncFilterService looks for — see planFilterBullet. The old generic
  // "Filter care included" named no filter, so nothing could recognise it as
  // the filter bullet, and switching the answer to "not included" left the
  // promise standing on a pool where it had not been sold.
  ...(planFilterBullet(filter) ? [planFilterBullet(filter) as string] : []),
  // Names the objection nobody says out loud: "fine, but what about August?"
  // Under a usage-billing competitor that is a real, larger bill. "Flat rate"
  // only means something once you say what it protects you from.
  "One flat rate — it doesn’t rise in summer",
  // Proof of visit, which is the whole anxiety for anyone not home when we come.
  "A GPS-stamped service report after every visit",
  // Risk reversal, sitting directly above the Choose button rather than only in
  // the Difference box further up the page. Backed by section 6 of the Service
  // Agreement — see GUARANTEE_BENEFIT in proposalBenefits.ts before editing.
  "Two-week 100% money-back guarantee",
  // Was two bullets ("No long-term contract" and "Cancel any time with 30 days
  // notice") saying one thing twice, in a list where only one line was selling.
  "No contract — cancel any time with 30 days notice",
];

/**
 * What prepaying adds, ON TOP of the service both plans share.
 *
 * Appended AFTER the shared list, so the rows the two cards have in common line
 * up side by side and the difference is what sticks out at the bottom.
 */
export const ANNUAL_EXTRAS = [
  "Your 12th month free — pay for 11, the last one is on us",
  "20% off repair labour on repairs and upgrades",
  "Cancel any time — unused months refunded",
  "One payment for the year — nothing to remember each month",
];

/**
 * Short forms of the plan bullets, for the WEB PAGE only.
 *
 * The long forms earn their length in the PDF, which is read once, carefully,
 * often on paper — there the qualifier after the dash is the part that answers
 * the objection. On the proposal page the same sentences are being scanned, two
 * columns at a time, and the qualifiers turn six quick promises into six
 * paragraphs. The claim is what gets read; the explanation is what makes it
 * slow.
 *
 * EXACT MATCH ONLY, deliberately. A rule like "cut at the em dash" would also
 * cut operator-written bullets, which are the ones most likely to have earned
 * their words. Anything not in this map renders in full.
 *
 * Keyed on the preset strings above — if you reword one of those, reword its
 * key here too, or it simply stops shortening. That failure is visible (a long
 * bullet reappears) rather than silent, which is the right way round.
 */
const SHORT_FORMS: Record<string, string> = {
  "All chemicals included in your set monthly rate": "All chemicals included",
  "Filter care included — never a separate invoice": "Filter care included",
  "One flat rate — it doesn’t rise in summer": "One flat rate, even in summer",
  "A GPS-stamped service report after every visit":
    "GPS-stamped service report after every visit",
  // Superseded wordings of the same bullet. Both already claim the GPS stamp,
  // so this is the "photo report" → "service report" swap catching up with
  // quotes that were sent before it — not a new promise. A quote whose bullet
  // never mentioned GPS is deliberately absent: upgrading that one would add a
  // claim the customer's PDF does not make, which is a different thing entirely.
  "A GPS-stamped photo report after every visit":
    "GPS-stamped service report after every visit",
  "GPS-verified service report after every visit":
    "GPS-stamped service report after every visit",
  "Cartridge replacements included — never a separate invoice":
    "Cartridge replacements included",
  "DE split, clean & recharge included — never a separate invoice":
    "DE split, clean & recharge included",
  "Sand media replacement included — never a separate invoice":
    "Sand media replacement included",
  "No contract — cancel any time with 30 days notice":
    "No contract, cancel any time",
  "Your 12th month free — pay for 11, the last one is on us":
    "Your 12th month free",
  "20% off repair labour on repairs and upgrades": "20% off repair labour",
  "Cancel any time — unused months refunded":
    "Cancel any time, months refunded",
  "One payment for the year — nothing to remember each month":
    "One payment for the year",
};

/**
 * Taglines we have written before, mapped to what they say now — for the WEB
 * PAGE only.
 *
 * A tagline lives in proposal_json, so a quote sent last week carries the
 * wording it was sent with, and the annual card's old line ("The full service,
 * with one month free") restates the badge underneath it instead of answering
 * the objection that actually stops the sale.
 *
 * Upgrading it on the page is safe in a way that backfilling the row is not.
 * Nothing stored moves, no signed record changes, and the two wordings do not
 * contradict: the new line says something the old one left out, and everything
 * it claims is already on the same card in the bullets. Print keeps what was
 * sent — same rule as the short bullets.
 *
 * ONLY strings we know we wrote. An operator who typed their own tagline keeps
 * it, which is the whole reason this is a lookup and not a heuristic.
 */
const TAGLINE_UPGRADES: Record<string, string> = {
  "Everything above, billed month to month.":
    "The full service, month to month.",
  "The full service, billed month to month.":
    "The full service, month to month.",
  "The same service, paid annually.":
    "Nothing locked in — cancel any time, unused months refunded.",
  "Everything above, paid annually.":
    "Nothing locked in — cancel any time, unused months refunded.",
  "The full service, with one month free.":
    "Nothing locked in — cancel any time, unused months refunded.",
};

/** The page's version of a tagline. Anything hand-written passes through. */
export const currentTagline = (tagline: string): string => {
  const t = tagline.trim();
  return TAGLINE_UPGRADES[t] ?? t;
};

/** The page's version of a bullet. Unrecognised text is returned untouched. */
export const shortBullet = (item: string): string => {
  const t = item.trim();
  return SHORT_FORMS[t] ?? t;
};

/**
 * Re-derive everything that embeds the rate after the base rate changes.
 *
 * The base rate is the single place a price is typed; the plan cards' prices,
 * the "billed once" line, and the annual tagline and value note are all just
 * that number restated. They stay in the stored tier objects (so the PDF and
 * email need no special casing) but are rewritten here rather than by hand.
 *
 * Only fields still matching what the preset generated for the OLD rate are
 * replaced, so anything reworded for this customer survives — the same rule
 * syncFilterService follows.
 */
/**
 * Wording earlier presets produced, kept ONLY so it can be recognised.
 *
 * A draft stores its plan cards, so improving a preset does nothing to a
 * proposal already in progress — the only remedy was "Reset to preset", which
 * replaces both plans including anything typed by hand. That is a bad trade for
 * boilerplate nobody touched, so it never got pressed and stale wording went out
 * on real quotes.
 *
 * An EXACT match against one of these proves the line is untouched preset text
 * and can be replaced safely. Anything edited, even by a character, no longer
 * matches and is left exactly as written. This is the check the version flag
 * cannot make on its own: a version says "old", it cannot say "unmodified".
 *
 * ADD A LINE HERE WHENEVER YOU CHANGE PRESET WORDING, or drafts holding the
 * outgoing text stop being recognised and silently keep it.
 */
const LEGACY_MONTHLY_INCLUDES: string[][] = [
  // v2 — claimed a weekly cadence the scope could not guarantee.
  [
    "The full service above, every week",
    "Billed monthly, in advance",
    "No long-term contract",
    "Cancel any time with 30 days notice",
  ],
  // v3 — accurate, but only one line of the five was actually selling.
  [
    "The full service set out in your proposal",
    "All chemicals and routine filter care included",
    "Billed monthly, in advance",
    "No long-term contract",
    "Cancel any time with 30 days notice",
  ],
];

const LEGACY_MONTHLY_TAGLINES = [
  "Everything above, billed month to month.",
  "The full service, billed month to month.",
];
const LEGACY_ANNUAL_TAGLINES = [
  "The same service, paid annually.",
  "Everything above, paid annually.",
  "The full service, with one month free.",
];

const sameList = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Bring a draft's plan cards up to the current preset wording, replacing ONLY
 * the parts still identical to a previous preset. Hand-edited text survives
 * untouched, which is what makes this safe to run automatically.
 *
 * Deliberately limited to the bullets and taglines — the boilerplate. Prices,
 * value notes and fine print are left to syncTierPrices and the filter sync,
 * which already have their own carry-over rules.
 */
export const upgradeTierWording = (
  tiers: Tier[],
  filter: FilterOption,
): Tier[] => {
  if (tiers.length === 0) return tiers;
  const fresh = buildTiers("", filter);
  return tiers.map((tier, i) => {
    const next = fresh[i];
    if (!next) return tier;
    const isMonthly = i === 0;
    const legacyLists = isMonthly ? LEGACY_MONTHLY_INCLUDES : [];
    const legacyTaglines = isMonthly
      ? LEGACY_MONTHLY_TAGLINES
      : LEGACY_ANNUAL_TAGLINES;
    return {
      ...tier,
      includes: legacyLists.some((old) => sameList(tier.includes, old))
        ? next.includes
        : tier.includes,
      tagline: legacyTaglines.includes(tier.tagline.trim())
        ? next.tagline
        : tier.tagline,
    };
  });
};

export const syncTierPrices = (
  tiers: Tier[],
  oldBase: string,
  newBase: string,
  filter: FilterOption,
  sanitization = "",
): Tier[] => {
  if (tiers.length === 0) return tiers;
  /*
   * Rebuild the SAME SHAPE the draft is in.
   *
   * These two arrays are compared to the stored tiers index by index, so a
   * three-plan draft measured against a two-plan preset lines Essentials up
   * with Pay Monthly — and the cheaper card silently inherits the full rate
   * the moment the base price is edited. The shape has to match.
   */
  const hasEssentials = tiers.some((t) => t.essentials);
  const build = (b: string) =>
    hasEssentials
      ? buildTiersWithEssentials(b, filter, sanitization)
      : buildTiers(b, filter);
  const before = build(oldBase);
  const after = build(newBase);
  return tiers.map((tier, i) => {
    const was = before[i];
    const now = after[i];
    if (!was || !now) return tier;
    const carry = (field: "price" | "priceNote" | "tagline" | "valueNote") =>
      tier[field] === was[field] ? now[field] : tier[field];
    return {
      ...tier,
      /*
       * The two all-inclusive prices are always derived from the base rate —
       * there is nothing to type and no way for them to disagree with it.
       *
       * ESSENTIALS IS DIFFERENT. How much comes off is a judgement about THIS
       * pool: a heavy-debris pool burns more phosphate remover and more filter
       * life than a screened one, so the discount is the operator's call, not
       * a formula. The seeded figure follows the base rate only while it is
       * still untouched — the same carry rule the wording fields use. Once it
       * is typed over it is the operator's number and stays put.
       */
      price: tier.essentials
        ? tier.price === was.price
          ? now.price
          : tier.price
        : now.price,
      priceNote: now.priceNote,
      billingNote: now.billingNote,
      tagline: carry("tagline"),
      valueNote: carry("valueNote"),
    };
  });
};

export const buildTiers = (
  basePrice = "",
  filter: FilterOption = { type: "", included: false },
): Tier[] => {
  const base = basePrice.trim();
  const monthly = monthlyAmount(base);
  return [
    {
      name: "Pay Monthly",
      // "/mo" is forced on when the typed rate omits it: a bare "$200" next to
      // "$183/mo" reads as two different units rather than two prices.
      price:
        monthly && !/\/\s*(mo|month)/i.test(base)
          ? `${formatAmount(monthly)}/mo`
          : base,
      // The service list lives ONCE in the "what's included" box above, because
      // both plans carry the identical service — repeating all six bullets
      // inside a 250pt column was both redundant and, with longer wordings like
      // DE's, tall enough to push the whole comparison onto the next page.
      // Neutral and short. Flexibility is this card's only real advantage over
      // the other, so it says that plainly and does not oversell it — which
      // leaves the annual card free to take the advantage away.
      tagline: "The full service, month to month.",
      priceNote: "",
      billingNote: "",
      includes: monthlyIncludes(filter),
      recommended: false,
      // Answers "why is this more than the quote down the road?" before the
      // customer asks it — the honest answer is that parts other companies
      // invoice separately are already in the number.
      /*
       * The excluded branch is no longer a generic "genuinely all-in — no
       * surprise fees on top". That sentence rendered on exactly the quotes
       * where a $120–150 parts bill would later arrive as a fee on top, and it
       * promised salt-cell cleaning on chlorine pools that have no cell.
       * excludedFilterValueNote argues the all-in case for what the rate does
       * cover, then states the parts carve-out — see filterService.ts.
       */
      valueNote:
        filterServiceValueNote(filter) || excludedFilterValueNote(filter.type),
      finePrint: filterServiceTerms(filter),
    },
    {
      name: "Pay Annually",
      // Headline is the EFFECTIVE MONTHLY rate, not the annual total. "$1,958"
      // next to "$178/mo" invites a comparison between two numbers that aren't
      // comparable and reads as the expensive option; "$163/mo" next to
      // "$178/mo" reads as the cheaper one, which it is.
      price: monthly ? `${formatAmount(effectiveMonthly(monthly))}/mo` : "",
      /*
       * THE BADGE SELLS; THE LINE BENEATH DISCLOSES.
       *
       * This used to read "$1,815 billed once — $165 saved", which put a large
       * total right beside a small monthly rate and invited exactly the
       * comparison the headline price was designed to avoid. A four-figure
       * number next to "$151/mo" reads as the expensive option even when it is
       * the cheaper one.
       *
       * So the badge is now the saving alone, and the total moves to a quiet
       * line under the button (billingNote). It is NOT hidden: burying what
       * somebody is actually agreeing to pay would only move the shock to the
       * invoice, where it costs more. It is simply no longer competing with
       * the rate.
       */
      priceNote: monthly ? `Save $${formatAmount(monthly)}` : "",
      billingNote: monthly
        ? `$${formatAmount(monthly * ANNUAL_MONTHS_CHARGED)} billed once — ${ANNUAL_MONTHS_CHARGED} months paid, your ${ANNUAL_MONTHS_CHARGED + 1}th free.`
        : "",
      /*
       * THE OBJECTION AND ITS ANSWER IN THE SAME GLANCE.
       *
       * This read "The full service, with one month free" — which restated the
       * badge directly beneath it and opened with the same three words as the
       * other card, so the highest-attention line on the card was spent twice
       * over on repetition.
       *
       * What actually stops this sale is not the price, it is handing over
       * $1,815 and feeling tied in. The answer to that was the NINTH item on
       * the card, in a bullet, below the fold on a phone — the fear at the top
       * and the antidote 400px away. It is now the first thing read after the
       * plan's name.
       *
       * Deliberately self-contained: no "same service as the monthly plan".
       * On a phone the cards stack with this one FIRST, so a reference to the
       * other card points at something not yet read. The card lists the whole
       * service below it anyway and the badge carries the money; this line does
       * the one job neither of those can.
       */
      tagline: "Nothing locked in — cancel any time, unused months refunded.",
      /*
       * THE FULL LIST, not "everything in Pay Monthly, plus:".
       *
       * That phrasing pointed at the other card, and on a phone the cards stack
       * with this one FIRST — so it referred to something the reader had not
       * reached yet. Rewording it would not have helped: a reader who has not
       * seen the monthly plan still learns nothing about what they are buying.
       *
       * Each card now carries the whole set and stands alone in any order, the
       * way SiteGround's do. It also makes the two directly comparable, since
       * the same line appears in the same place on both — which is the reading
       * a two-column price table is FOR, and which the cross-reference quietly
       * prevented.
       *
       * The SHARED lines come first, so the identical rows sit level across the
       * two cards and the eye can run down them. The four annual-only lines
       * then hang off the bottom of the longer card, under a heading — which is
       * where somebody scanning for the difference looks anyway.
       */
      includes: [...monthlyIncludes(filter), ...ANNUAL_EXTRAS],
      sharedCount: monthlyIncludes(filter).length,
      recommended: true,
      // Answers the objection prepaying actually raises — being tied in.
      valueNote: monthly
        ? `Pay for eleven months and your twelfth is on us, which brings your rate to about $${formatAmount(effectiveMonthly(monthly))} a month. You are not tied in: cancel any time and we refund the months you have not used. Paying up front is a saving, not a commitment.`
        : "Pay for eleven months and your twelfth is on us. You are not tied in: cancel any time and we refund the months you have not used. Paying up front is a saving, not a commitment.",
      finePrint: ANNUAL_FINE_PRINT,
    },
  ];
};

/**
 * The optional THIRD plan: the same weekly service with filter parts left out.
 *
 * WHY IT EXISTS. No other company in this market includes filter elements or
 * the annual DE teardown in a monthly rate — so our all-in number is being
 * compared against quotes that quietly exclude a $120–150/yr item. This card
 * puts the apples-to-apples figure on our own document, immediately beside
 * what the difference actually buys. The customer holding two other quotes
 * gets to make the comparison correctly rather than guessing.
 *
 * WHAT IT DOES NOT CHANGE. buildTiers is untouched: a two-plan proposal is
 * byte-for-byte what it was. This is opt-in per quote.
 *
 * THE LADDER IS HONEST. Essentials → Monthly adds the filter parts; Monthly →
 * Annual adds the free twelfth month. Each step up is one added thing, which
 * is the only arrangement where "recommended" on the middle or right card
 * reads as advice rather than an upsell.
 *
 * CLEANING IS NOT THE CARVE-OUT. Routine cleaning and backwashing stay in
 * every plan — only parts move. essentialsIncludes says so explicitly, because
 * a customer who reads "filter" in an exclusion assumes the whole thing.
 */
const essentialsIncludes = (filter: FilterOption): string[] => [
  /*
   * ROW-ALIGNED WITH monthlyIncludes, deliberately.
   *
   * Both cards carry six bullets in the same order, and exactly two of them
   * differ — rows 1 and 2. A customer scanning left to right hits the
   * difference immediately instead of comparing two lists of different
   * lengths. What is missing lives below, in `excludes`, as muted ✗ rows.
   */
  // Row 1. Names algaecide explicitly: it is the chemical a customer checks
  // for, and it IS included here — only phosphate remover is not.
  "All routine chemicals included — chlorine, acid, shock, stabilizer and algaecide",
  // Row 2, against the other cards' filter-parts bullet. Cleaning is standard
  // service on every plan; saying so as an inclusion stops "filter parts not
  // included" being read as no filter care at all.
  "Filter cleaning and backwashing included",
  "One flat rate — it doesn’t rise in summer",
  "A GPS-stamped service report after every visit",
  "Two-week 100% money-back guarantee",
  "No contract — cancel any time with 30 days notice",
];

/**
 * What the essentials rate should be, given the full rate.
 *
 * The full rate absorbs the filter service, so backing it out is a
 * subtraction, not a guess — FILTER_SERVICE carries the annual value and it is
 * spread over twelve months, rounded to the dollar. Cartridge ($120/yr) lands
 * at $10/mo and DE ($150/yr) at about $13/mo, which is the $10–12 band this
 * was scoped around. Uncosted filter types fall back to $10 so the operator
 * still gets a sane starting number to type over.
 */
export const essentialsMonthly = (base: string, type: string): number | null => {
  const monthly = monthlyAmount(base);
  if (monthly == null) return null;
  const annual = FILTER_SERVICE[type]?.value ?? 120;
  return Math.max(0, Math.round(monthly - annual / 12));
};

/**
 * Seed all THREE plans. Plans 2 and 3 are exactly buildTiers' output, so the
 * two-plan and three-plan proposals can never drift apart in wording.
 */
export const buildTiersWithEssentials = (
  basePrice = "",
  filter: FilterOption = { type: "", included: false },
  sanitization = "",
): Tier[] => {
  const full = buildTiers(basePrice, filter);
  const suggested = essentialsMonthly(basePrice, filter.type);
  const annual = monthlyAmount(full[1].price);
  /*
   * THE NUDGE, and it appears only when it is TRUE.
   *
   * Prepaying works out at 11/12 of the rate, so on most quotes the
   * all-inclusive annual plan costs LESS per month than the stripped one —
   * $151 against $155. That is the whole argument for paying annually, and
   * the place it changes a decision is on the Essentials card, at the moment
   * somebody is tempted by the cheaper number.
   *
   * A larger operator-set discount flips it (a $20 cut puts Essentials at
   * $145, under the annual rate), so it is computed rather than written, and
   * simply absent when it would be false.
   */
  const nudge =
    annual != null && suggested != null && annual <= suggested
      ? ` Worth knowing: our all-inclusive plan paid annually works out to $${formatAmount(
          annual,
        )} a month — less than this, with nothing left out.`
      : "";
  /*
   * ORDER: cheapest and least complete FIRST, best value last.
   *
   * The stripped card is the anchor — the customer reads what other companies
   * quote, sees the ✗ rows against it, and every card to the right is an
   * upgrade from there. Opening on the full service and burying the cheap
   * option at the end would make the document argue downwards.
   *
   * Mobile keeps its own rule: the recommended card is pulled to the top by
   * `order-first` on the page, so a phone leads with Best Value rather than
   * with the plan the layout is arguing against.
   *
   * RENAMED, in three-plan mode only. "Pay Monthly" beside "Essentials" mixes
   * two axes — one names a service level, the other a payment term — leaving
   * the customer to work out that two of the three are the same service.
   * Naming both All-Inclusive says it outright. The two-plan proposal keeps
   * "Pay Monthly" / "Pay Annually", where the payment term IS the only
   * difference between the cards.
   */
  return [
    {
      name: "Essentials",
      essentials: true,
      price: suggested != null ? `${formatAmount(suggested)}/mo` : "",
      // Names the comparison outright. A customer with two other quotes on the
      // table already suspects they are not comparing like with like; saying
      // so is what makes the two cards beside it legible.
      tagline: "The rate other companies quote.",
      priceNote: "",
      billingNote: "",
      includes: essentialsIncludes(filter),
      excludes: essentialsExclusions(filter.type, sanitization),
      recommended: false,
      valueNote: excludedFilterValueNote(filter.type) + nudge,
      finePrint: filterServiceTerms({ type: filter.type, included: false }),
    },
    /*
     * Bullets, price and value note are EXACTLY buildTiers' output — only the
     * name changes. The comparison is carried entirely by the ✗ rows on the
     * card to the left, so these two cards never drift from the two-plan
     * proposal and a customer holding both documents sees the same wording.
     */
    { ...full[0], name: "All-Inclusive Monthly" },
    { ...full[1], name: "All-Inclusive Annual" },
  ];
};


/** Leading number in a monthly price ("165/mo" → 165). null when not numeric. */
const monthlyAmount = (basePrice: string): number | null => {
  const m = /^\$?\s*(\d[\d,]*(?:\.\d+)?)/.exec(basePrice.trim());
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** What a year's prepay works out to per month, rounded to the dollar. */
const effectiveMonthly = (monthly: number): number =>
  Math.round((monthly * ANNUAL_MONTHS_CHARGED) / 12);

const formatAmount = (n: number): string =>
  (Number.isInteger(n) ? n : Number(n.toFixed(2))).toLocaleString("en-US");

/**
 * A year of service, quoted per year with the free month applied
 * ("178/mo" → "1,958/yr" at 11 months charged).
 * The "/yr" matters: tierDelta suppresses its "+$X" callout when the two options
 * are quoted in different periods, which is what stops the comparison claiming
 * annual costs "$1,815 more" than monthly.
 *
 * Returns '' when the base isn't a plain number, so a "Call for pricing" base
 * doesn't produce a nonsense annual figure.
 */
export const annualPrice = (basePrice: string): string => {
  const n = monthlyAmount(basePrice);
  if (n === null) return "";
  return `${formatAmount(n * ANNUAL_MONTHS_CHARGED)}/yr`;
};
