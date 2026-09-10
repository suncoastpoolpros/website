/**
 * The customer-configurable quote: which options a "build" proposal offers,
 * and what each one does to the rate.
 *
 * ONE MODULE, FOUR READERS — the builder's option fields, the customer's
 * configurator, the PDF's options table and the acceptance record. They
 * present the same three choices very differently, but they must never
 * disagree about what one costs.
 *
 * WHY THIS IS A THIRD PRICING MODE rather than a rework of tiers.
 *
 * Two of these three axes already exist as tier shapes: "filter parts
 * included?" is the Essentials/Complete split, "pay annually?" is the
 * two-plan split. Folding them into one configurator would mean changing how
 * every stored quote resolves its price — and quotes sit in inboxes for
 * months, read long after they were sent. They have to keep rendering through
 * the code they went out with. So 'build' sits ALONGSIDE 'single' and
 * 'tiers', every stored quote still reads one of those two, and nothing that
 * resolves either of them is touched.
 */
import { ANNUAL_MONTHS_CHARGED } from "./tierPresets";

/**
 * Re-exported so this module is the ONE place the configurable quote's
 * arithmetic is read from — including by scripts/check-mirrors.mjs, which
 * compares it against the copy hand-written into functions/api/quote/accept.ts.
 */
export { ANNUAL_MONTHS_CHARGED };

/**
 * The leading number in a typed price, e.g. "$155/mo" -> 155.
 *
 * Local rather than adminApi's parsePrice, which is otherwise identical: this
 * module is imported BY the data model, and reaching back into it for one
 * regex would make the two files a runtime import cycle. tierPresets keeps
 * its own monthlyAmount for the same reason.
 */
const amount = (raw: string): number | null => {
  const m = /-?\d[\d,]*(\.\d+)?/.exec((raw ?? "").replace(/\s/g, ""));
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

/**
 * How the customer pays a MONTHLY plan. Annual is a single prepayment, so it
 * has no payment-method axis at all — see resolvePlan.
 */
export type PaymentMethod = "ach" | "card" | "check";

export type BillingTerm = "monthly" | "annual";

/** What a build-mode proposal lets the customer choose, and by how much. */
export type BuildOptions = {
  /**
   * Offer the filter-parts choice. Requires a filter service that HAS parts
   * to decline — the same precondition the three-plan Essentials card has, so
   * the builder gates this on supportsFilterService for the same reason.
   */
  offerFilter: boolean;
  /**
   * What comes off the monthly rate when the customer declines filter parts,
   * as a bare amount ("12").
   *
   * TYPED, NOT COMPUTED, and seeded rather than fixed. tierPresets already
   * settled this question for the Essentials card: how much comes off is a
   * judgement about THIS pool — a heavy-debris pool burns more filter life
   * than a screened one — so it is the operator's number, not a formula's.
   */
  filterDelta: string;
  /** Offer the annual prepayment. */
  offerAnnual: boolean;
  /** Offer the auto-pay choice. Monthly-only; see PaymentMethod. */
  offerPayment: boolean;
  /**
   * What comes off the monthly rate for ACH auto-pay, as a bare amount ("8").
   *
   * A DISCOUNT OFF THE STANDARD RATE, never a surcharge added for cards.
   * The money is identical either way, but a card surcharge drags in the card
   * networks' surcharge rules — written disclosure, a cap at our own discount
   * rate, and a flat prohibition on surcharging debit. A discount for paying
   * by bank transfer carries none of that. It also reads better: something
   * you earn rather than something you are charged.
   */
  achDelta: string;
};

/** One customer's answers. */
export type PlanChoice = {
  /** true = filter parts included in the rate (the standard, all-in plan). */
  filterParts: boolean;
  term: BillingTerm;
  /** Meaningless when term is 'annual'. Kept so switching back restores it. */
  payment: PaymentMethod;
};

/** Nothing offered, nothing discounted — a build proposal starts empty. */
export const emptyBuildOptions = (): BuildOptions => ({
  offerFilter: false,
  filterDelta: "",
  offerAnnual: true,
  offerPayment: true,
  achDelta: "",
});

/**
 * What a fresh configurator starts on: the full service, monthly, on auto-pay.
 *
 * DELIBERATELY NOT THE CHEAPEST configuration. The default is the plan we
 * actually want them on — everything included — and every option from there
 * takes something away or asks for money up front. Starting at the floor and
 * charging upward turns the first interaction with the price into a series of
 * increases.
 */
export const defaultChoice = (): PlanChoice => ({
  filterParts: true,
  term: "monthly",
  payment: "ach",
});

/** A typed delta as a positive number of dollars. '' and junk read as zero. */
const delta = (raw: string): number => {
  const n = amount(raw);
  return n === null || !Number.isFinite(n) ? 0 : Math.abs(n);
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Money for display: whole dollars stay whole, cents survive, commas added. */
export const money = (n: number): string =>
  (Number.isInteger(n) ? n : round2(n)).toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });

/** One line of the running total: what it is, and what it did to the rate. */
export type PriceLine = { label: string; amount: number };

export type ResolvedPlan = {
  /** The standard rate before any option moved it. */
  standard: number | null;
  /**
   * What they pay each month. On an annual plan this is the EFFECTIVE monthly
   * rate — the prepayment spread back over twelve months — because that is
   * the only number comparable to the monthly option beside it.
   */
  monthly: number | null;
  /** The single charge on an annual plan. Null on monthly. */
  billedOnce: number | null;
  /** The adjustments applied, in the order they were applied. */
  lines: PriceLine[];
};

/**
 * The whole price calculation, in one place.
 *
 * ORDER MATTERS AND IS FIXED: filter parts first, then the ACH discount. Both
 * are flat amounts so the arithmetic commutes, but the running total on the
 * customer's summary panel reads down in this order and the PDF's table
 * prints in this order — they have to agree line for line.
 *
 * Returns nulls when the base rate isn't a number ("Call for pricing"), so a
 * quote with no parseable rate renders its options without inventing a total.
 */
export const resolvePlan = (
  basePrice: string,
  options: BuildOptions,
  choice: PlanChoice,
): ResolvedPlan => {
  const standard = amount(basePrice);
  if (standard === null) return { standard: null, monthly: null, billedOnce: null, lines: [] };

  const lines: PriceLine[] = [];
  let rate = standard;

  if (options.offerFilter && !choice.filterParts) {
    const d = delta(options.filterDelta);
    if (d) {
      rate -= d;
      lines.push({ label: "Without filter parts", amount: -d });
    }
  }

  /*
   * THE ACH DISCOUNT IS MONTHLY-ONLY.
   *
   * An annual plan is one prepayment — there is no month-to-month collection
   * to save, so there is nothing to discount for automating. It already
   * carries the larger saving of the free twelfth month, and stacking a
   * second discount on top would be paying twice for the same convenience.
   */
  if (choice.term === "monthly" && options.offerPayment && choice.payment === "ach") {
    const d = delta(options.achDelta);
    if (d) {
      rate -= d;
      lines.push({ label: "ACH auto-pay discount", amount: -d });
    }
  }

  if (choice.term === "annual") {
    const billedOnce = round2(rate * ANNUAL_MONTHS_CHARGED);
    /*
     * NAMED AS THE FREE MONTH, not as "11 months charged".
     *
     * This line sits in a column of monthly adjustments — "Without filter
     * parts −$12" — so labelling it by the billing arrangement put a $143
     * figure beside a $12 one with no way to read them as the same kind of
     * thing. The amount IS one month's rate, so saying that is both plainer
     * and the actual saving: the twelfth month, free.
     */
    lines.push({
      label: `Your ${ANNUAL_MONTHS_CHARGED + 1}th month free`,
      amount: -round2(rate),
    });
    return {
      standard,
      // Spread over twelve, not eleven: they get twelve months of service.
      monthly: Math.round((rate * ANNUAL_MONTHS_CHARGED) / 12),
      billedOnce,
      lines,
    };
  }

  return { standard, monthly: round2(rate), billedOnce: null, lines };
};

/** What the customer's chosen payment method is called, on screen and in the
 *  record. Card and check share a rate; they are still recorded separately
 *  because the office needs to know which one to expect. */
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  ach: "Bank transfer (ACH) on auto-pay",
  card: "Credit or debit card on auto-pay",
  check: "Check",
};

/** The short form, for the running total and the plan line on the signature
 *  step, where the full label is longer than the row it sits in. */
export const PAYMENT_SHORT: Record<PaymentMethod, string> = {
  ach: "ACH auto-pay",
  card: "Card auto-pay",
  check: "Check",
};

/**
 * The chosen configuration as one line of prose, for the acceptance record,
 * the handoff email and the admin's quote detail.
 *
 * Spells out every axis the quote OFFERED, including the ones left on their
 * default. A record that only names what was changed cannot be read back as
 * what was agreed — "annual" alone doesn't say whether filter parts were in
 * it, and that is the difference between a $120 part being ours or theirs.
 */
export const describeChoice = (options: BuildOptions, choice: PlanChoice): string => {
  const parts: string[] = [
    options.offerFilter
      ? choice.filterParts
        ? "Filter parts included"
        : "Without filter parts"
      : "",
    choice.term === "annual" ? "Paid annually" : "Billed monthly",
    choice.term === "monthly" && options.offerPayment ? PAYMENT_SHORT[choice.payment] : "",
  ];
  return parts.filter(Boolean).join(" · ");
};

/** Does this proposal actually offer a choice? A build-mode quote with every
 *  option switched off is a single-price quote wearing a configurator, and the
 *  page should not print a chooser with one row in it. */
export const offersAnyChoice = (options?: BuildOptions): boolean =>
  // Tolerates undefined: this renders inside the customer's PDF, and a draft
  // or stored quote written before the field existed must not throw there.
  !!options && (options.offerFilter || options.offerAnnual || options.offerPayment);

/** One printed row of the PDF's options table. */
export type OptionRow = { label: string; amount: string };

/**
 * The options table the PDF prints: every choice the quote offers and what it
 * does to the rate.
 *
 * PRICED AT THE STANDARD RATE — parts included, no ACH discount — because a
 * printed table cannot recompute itself as the reader imagines different
 * combinations. Each row therefore states an effect ("$12/mo off") rather
 * than a finished price, which stays true whichever other options are taken,
 * and the one row that cannot be expressed that way (annual, a proportion
 * rather than an amount) says plainly which rate it is shown at.
 *
 * "$12/mo off", NOT "−$12/mo". These strings are typeset in the PDF, and
 * standard Helvetica has no glyph for U+2212 MINUS SIGN — it renders as
 * nothing at all, turning a $12 discount into a row that reads as if the
 * option COSTS $12 more. Verified by rendering. The same trap the drawn
 * ✓/✗ marks in ProposalDocument.tsx exist to avoid; the word carries no
 * glyph risk and is plainer besides.
 */
export const buildOptionRows = (
  basePrice: string,
  options?: BuildOptions,
): OptionRow[] => {
  const standard = amount(basePrice);
  if (standard === null || !options) return [];
  const rows: OptionRow[] = [];

  if (options.offerFilter) {
    const d = delta(options.filterDelta);
    rows.push({ label: "Filter parts included in your rate", amount: "Standard rate" });
    rows.push({
      label: "Without filter parts — you buy elements when due",
      amount: d ? `$${money(d)}/mo off` : "Standard rate",
    });
  }

  if (options.offerPayment) {
    const d = delta(options.achDelta);
    rows.push({
      label: "Bank transfer (ACH) on auto-pay",
      amount: d ? `$${money(d)}/mo off` : "Standard rate",
    });
    rows.push({ label: "Card on auto-pay, or check", amount: "Standard rate" });
  }

  if (options.offerAnnual) {
    rows.push({
      label: `Paid annually — ${ANNUAL_MONTHS_CHARGED} months charged, your ${ANNUAL_MONTHS_CHARGED + 1}th free`,
      amount: `$${money(round2(standard * ANNUAL_MONTHS_CHARGED))} once, at the standard rate`,
    });
  }

  return rows;
};
