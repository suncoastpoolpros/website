import { type ReactNode, useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  type BuildOptions,
  type PlanChoice,
  PAYMENT_LABEL,
  defaultChoice,
  describeChoice,
  money,
  resolvePlan,
} from "@/components/admin/planOptions";
import { ANNUAL_MONTHS_CHARGED } from "@/components/admin/tierPresets";

/**
 * "Build your own plan" — the customer-configurable alternative to the plan
 * cards, shown only when a quote was sent in 'build' pricing mode.
 *
 * WHY A SEPARATE COMPONENT rather than a branch inside the tier grid. The
 * cards on the approve page carry a lot of hard-won geometry — the banner
 * lift, the reserved tagline line, the shared/extras split that keeps rows
 * level across columns. None of it applies to a single configurable plan, and
 * threading a second layout through it would put every stored quote at the
 * mercy of edits meant for this one. The grid is left exactly as it was.
 *
 * THE RUNNING TOTAL IS THE POINT. A configurator that shows options without
 * showing what they do is a form; showing the rate move as they tap is what
 * makes it a price they chose rather than a price they were given.
 */
type Props = {
  /** The standard rate, as typed by the operator ("165/mo"). */
  basePrice: string;
  options: BuildOptions;
  /** e.g. "WEEKLY SERVICE" — printed under the rate, as on the plan cards. */
  cadence: string;
  /** The service both configurations share, shown once beside the options. */
  includes: string[];
  /**
   * The choice already made, when returning from the signature step.
   *
   * Without this the component remounts on "Change plan" and silently resets
   * to the default — a customer who configured $131/mo, continued, then came
   * back to check something found $147/mo waiting and no sign anything had
   * changed. The cards have never had this problem because their selection
   * lives in the page, not in them.
   */
  initial?: PlanChoice | null;
  onContinue: (choice: PlanChoice, summary: string) => void;
};

/** One selectable option. Deliberately a button, not a radio: the whole row is
 *  the target, and a native radio's label/control split invites a miss. */
type OptionProps = {
  on: boolean;
  title: string;
  detail?: string;
  note?: string;
  onClick: () => void;
};

const Option = ({ on, title, detail, note, onClick }: OptionProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={on}
    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
      on
        ? "border-[#1669AE] bg-[#f2f8fd]"
        : "border-[#e2e6eb] bg-white hover:border-[#b9c4d0]"
    }`}
  >
    {/* The mark carries the selection, so the border can stay quiet. A ring
        plus a fill plus a mark is three ways of saying one thing. */}
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
        on ? "border-[#1669AE] bg-[#1669AE]" : "border-[#c3ccd6]"
      }`}
    >
      {on && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-semibold text-[#0a1628]">{title}</span>
        {detail && (
          <span className="text-sm font-semibold tabular-nums text-[#0f4d80]">
            {detail}
          </span>
        )}
      </span>
      {note && (
        <span className="mt-1 block text-sm leading-relaxed text-[#6b7280]">
          {note}
        </span>
      )}
    </span>
  </button>
);

const Group = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div>
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5b6b7c]">
      {label}
    </h3>
    <div className="mt-2 space-y-2">{children}</div>
  </div>
);

export const PlanConfigurator = ({
  basePrice,
  options,
  cadence,
  includes,
  initial,
  onContinue,
}: Props) => {
  const [choice, setChoice] = useState<PlanChoice>(() => initial ?? defaultChoice());

  const resolved = useMemo(
    () => resolvePlan(basePrice, options, choice),
    [basePrice, options, choice],
  );

  /**
   * WHAT EACH OPTION IS WORTH, MEASURED FROM THE STANDARD RATE — never from
   * whatever is currently selected.
   *
   * This started out relative to the current configuration, which was wrong
   * in a way that only showed up on screen: with ACH selected, card and check
   * priced themselves as "+$8/mo". That is a card surcharge, which is the one
   * framing this whole feature is built to avoid — it drags in the card
   * networks' rules and it reads as a penalty rather than a discount missed.
   * The same inversion hit the filter row.
   *
   * So only the options that actually CARRY a discount print a figure, and it
   * is always the discount off the standard rate. Nothing ever prints a "+",
   * and the labels match the PDF's options table line for line.
   */
  const discount = (patch: Partial<PlanChoice>): string | undefined => {
    // Standard = everything included, paid monthly, by cheque. The one
    // configuration with no discount applied to it.
    const standard: PlanChoice = { ...defaultChoice(), payment: "check" };
    const a = resolvePlan(basePrice, options, standard).monthly;
    const b = resolvePlan(basePrice, options, { ...standard, ...patch }).monthly;
    if (a === null || b === null) return undefined;
    const d = Math.round((a - b) * 100) / 100;
    return d > 0 ? `−$${money(d)}/mo` : undefined;
  };

  /**
   * The annual option's headline is the SINGLE CHARGE, not a monthly delta.
   *
   * Shown against the filter choice they have already made, because that part
   * is knowable live — this is the one thing the page can do that the printed
   * table cannot. A monthly delta here read "−$5/mo", which is arithmetically
   * true and tells the customer nothing about the decision in front of them:
   * whether to write one cheque for the year.
   */
  const annualOnce = (): string | undefined => {
    const r = resolvePlan(basePrice, options, { ...choice, term: "annual" });
    return r.billedOnce === null ? undefined : `$${money(r.billedOnce)} once`;
  };

  const summary = describeChoice(options, choice);
  const showPayment = options.offerPayment && choice.term === "monthly";

  return (
    /* THE SERVICE LIST SITS BELOW THE GRID, not inside the options column.
       Stacked on a phone, a column-length list of inclusions pushed the
       running total and its Continue button off the bottom of a very long
       scroll — putting the one thing the configurator exists to show behind
       the one thing that never changes. Below the grid it comes after the
       total on a phone and spans the full width on desktop, where it reads
       better in two columns anyway. */
    <>
      <div className="mt-10 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-[1fr_20rem] lg:gap-8">
        <div className="space-y-6">
          {options.offerFilter && (
            <Group label="Filter parts">
              <Option
                on={choice.filterParts}
                title="Include filter parts"
                note="Replacement elements are built into your rate. When they're due we simply fit them — no quote to approve, no separate invoice."
                onClick={() => setChoice((c) => ({ ...c, filterParts: true }))}
              />
              <Option
                on={!choice.filterParts}
                title="Without filter parts"
                detail={discount({ filterParts: false })}
                note="We still clean and service your filter every visit. You buy the replacement elements when they're due — quoted at cost, approved by you first."
                onClick={() => setChoice((c) => ({ ...c, filterParts: false }))}
              />
            </Group>
          )}

          {options.offerAnnual && (
            <Group label="How you'd like to pay">
              <Option
                on={choice.term === "monthly"}
                title="Month to month"
                note="Billed monthly in advance. Cancel any time."
                onClick={() => setChoice((c) => ({ ...c, term: "monthly" }))}
              />
              <Option
                on={choice.term === "annual"}
                title="Pay for the year"
                detail={annualOnce()}
                note={`Pay for ${ANNUAL_MONTHS_CHARGED} months and your ${ANNUAL_MONTHS_CHARGED + 1}th is on us, applied at the end of the term. Still no contract — cancel any time and we refund every month you haven't used.`}
                onClick={() => setChoice((c) => ({ ...c, term: "annual" }))}
              />
            </Group>
          )}

          {/* PAYMENT METHOD IS MONTHLY-ONLY, and disappears rather than greys
              out when they switch to annual. A disabled group invites the
              question "why can't I pick that?" about a choice that has simply
              stopped existing — an annual plan is one payment. */}
          {showPayment && (
            <Group label="Payment method">
              {/* Written out rather than mapped. Each row argues its own case in
                  its own words, and the three cases are genuinely different:
                  one is a saving, one is a convenience, one is neither. A map
                  would have to reach for a ternary per line to say that. */}
              <Option
                on={choice.payment === "ach"}
                title={PAYMENT_LABEL.ach}
                detail={discount({ payment: "ach" })}
                note="The cheapest way to pay us. Bank transfers cost us nothing to collect and nothing to chase, so we pass that straight back to you."
                onClick={() => setChoice((c) => ({ ...c, payment: "ach" }))}
              />
              <Option
                on={choice.payment === "card"}
                title={PAYMENT_LABEL.card}
                note="Automatic every month, at the standard rate. No card fee added."
                onClick={() => setChoice((c) => ({ ...c, payment: "card" }))}
              />
              <Option
                on={choice.payment === "check"}
                title={PAYMENT_LABEL.check}
                note="Mailed each month at the standard rate. No discount, but nothing extra either."
                onClick={() => setChoice((c) => ({ ...c, payment: "check" }))}
              />
            </Group>
          )}

        </div>

        {/* THE RUNNING TOTAL. Sticky on desktop so it stays beside whichever
            option they are reading; on a phone it sits at the bottom, where the
            thumb already is and where the Continue button belongs anyway. */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-[#d7dee6] bg-white p-5 shadow-sm">
            <h3 className="font-display text-lg font-bold text-[#0a1628]">
              Your plan
            </h3>
            {resolved.monthly === null ? (
              <p className="mt-3 text-sm text-[#6b7280]">
                We'll confirm your rate — give us a call and we'll walk through
                it.
              </p>
            ) : (
              <>
                <p className="mt-3 font-semibold tabular-nums leading-none text-[#0f4d80]">
                  <span className="text-[2.125rem]">${money(resolved.monthly)}</span>
                  <span className="text-lg">/mo</span>
                </p>
                {cadence && (
                  <p className="mt-1.5 text-[13px] font-semibold uppercase tracking-wide text-[#5b6b7c]">
                    {cadence}
                  </p>
                )}
                {/* The adjustments, itemised. A total that just moves is a
                    magic number; naming what moved it is what makes the
                    discount feel earned rather than arbitrary. */}
                {resolved.lines.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t border-[#eef1f4] pt-4">
                    {resolved.lines.map((line, i) => (
                      <li
                        key={i}
                        className="flex justify-between gap-3 text-[13px] text-[#6b7280]"
                      >
                        <span>{line.label}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-[#176a2c]">
                          −${money(Math.abs(line.amount))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {resolved.billedOnce !== null && (
                  <p className="mt-4 border-t border-[#eef1f4] pt-4 text-[13px] text-[#6b7280]">
                    <span className="font-semibold text-[#0a1628]">
                      ${money(resolved.billedOnce)} billed once
                    </span>{" "}
                    — {ANNUAL_MONTHS_CHARGED} months paid, your{" "}
                    {ANNUAL_MONTHS_CHARGED + 1}th free.
                  </p>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => onContinue(choice, summary)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#0a1628] bg-[#0a1628] py-2.5 text-sm font-bold text-white transition-colors hover:border-[#16283f] hover:bg-[#16283f]"
            >
              Continue
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-[#8a94a1]">
              {summary}
            </p>
          </div>
        </aside>
      </div>

      {includes.length > 0 && (
        <div className="mt-6 rounded-xl border border-[#e2e6eb] bg-white p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#5b6b7c]">
            In every version of this plan
          </h3>
          <ul className="mt-3 sm:columns-2 sm:gap-x-6">
            {includes.map((item, i) => (
              <li
                key={i}
                className="mb-2.5 flex break-inside-avoid gap-2 text-sm leading-relaxed text-[#374151]"
              >
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#1d7a33]"
                  strokeWidth={3}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};
