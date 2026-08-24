/**
 * How often we come — the fact the pricing card was missing.
 *
 * THE PROBLEM. The plan cards said "$165/mo" and, across ten bullets, never
 * once said what a month buys. Not in the tier name, not in the tagline, not in
 * a bullet. "All chemicals included" and "One flat rate, even in summer" both
 * imply something recurring without ever pinning the cadence down, and the
 * scope page that does say it is one click behind.
 *
 * That is the single most price-relevant fact on the screen. A customer holding
 * a competitor's $140/mo every-other-week quote cannot tell whether ours is
 * dearer or half the price, and a card screenshotted and forwarded to a spouse
 * carries a number with nothing to divide it by.
 *
 * WHY A FIELD RATHER THAN A GUESS. The cadence was already implied by which
 * scope template the operator inserted, and reading it back out of the scope
 * prose would be a regex against text the operator is free to edit. So it is
 * stored: set explicitly on the builder, and set for you when a recurring
 * template is inserted, which is the operator saying the same thing a
 * different way.
 *
 * NOT DEFAULTED FOR OLD QUOTES. cadenceOf returns null for anything sent
 * before this existed, and the card then prints nothing. Nearly all of those
 * were weekly — but "nearly all" is how a bi-weekly customer ends up reading a
 * weekly promise on their own proposal, and this is the one file where a
 * plausible guess is the whole risk.
 */

export type ServiceCadence = "weekly" | "biweekly";

/**
 * The customer-facing wording avoids "bi-weekly" on purpose. It is genuinely
 * ambiguous in American usage — twice a week, or every other week — and this is
 * the number the customer divides the rate by. The scope template spells it out
 * the same way ("every other week") for the same reason.
 */
export const CADENCES: Array<{
  key: ServiceCadence;
  /** The chip in the builder. */
  label: string;
  /** What prints on the proposal, beneath the rate. */
  customerLabel: string;
}> = [
  { key: "weekly", label: "Weekly", customerLabel: "Weekly service" },
  {
    key: "biweekly",
    label: "Every other week",
    customerLabel: "Every other week",
  },
];

/**
 * Coerce whatever is on a draft or a stored quote into a cadence.
 *
 * Returns null rather than a default — see the note at the top of the file.
 */
export const cadenceOf = (v: unknown): ServiceCadence | null =>
  v === "weekly" || v === "biweekly" ? v : null;

/** What the customer reads under the rate. Empty when we do not know. */
export const cadenceLabel = (v: unknown): string => {
  const c = cadenceOf(v);
  return c ? (CADENCES.find((x) => x.key === c)?.customerLabel ?? "") : "";
};
