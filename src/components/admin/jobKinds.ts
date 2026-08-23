/**
 * What KIND of job a proposal is quoting, and the trust block that belongs to it.
 *
 * THE PROBLEM THIS SOLVES. Every proposal carried "The Suncoast Difference" —
 * chemicals included, a photo report after every visit, vetted technicians, a
 * two-week money-back guarantee. All of it is true and persuasive for weekly
 * service, and on a one-time green-to-clean it is somewhere between irrelevant
 * and wrong: there is no "every visit" on a job with three of them, and a
 * two-week guarantee on work that finishes in four days reads as boilerplate
 * that nobody adjusted. A customer who can tell the document did not notice
 * what they asked for assumes the price did not either.
 *
 * WHY NOT JUST HIDE IT. There was already a checkbox for that, and turning it
 * off left a hole — scope, then price, with nothing in between. A one-time
 * buyer is not less anxious than a recurring one, they are anxious about
 * DIFFERENT things, and every one of those things is sharper:
 *
 *   Is this number going to move once you see the pool?
 *   Will it actually clear, or will I end up paying to drain it?
 *   What am I on the hook for afterwards?
 *
 * Those are better objections to answer than "are your technicians vetted",
 * because they are the ones actually stopping the sale. So the block is
 * replaced rather than removed.
 *
 * The kind is set by the scope template rather than by remembering a toggle —
 * picking "Green Pool Recovery" is already the operator saying what this is.
 */

export type JobKind = 'recurring' | 'recovery' | 'repair';

/** Shown on the segmented control in the builder. */
export const JOB_KINDS: Array<{ key: JobKind; label: string; hint: string }> = [
  {
    key: 'recurring',
    label: 'Recurring service',
    hint: 'Weekly or bi-weekly. Shows the Suncoast Difference and what others bill extra for.',
  },
  {
    key: 'recovery',
    label: 'One-time cleanup',
    hint: 'Green-to-clean, storm debris, deep clean. Answers what a one-off buyer actually asks.',
  },
  {
    key: 'repair',
    label: 'Repair or install',
    hint: 'Equipment, filter or salt-cell work. Leads on the flat price and the warranty.',
  },
];

/**
 * Coerce whatever is on a draft or a stored quote into a JobKind.
 *
 * Quotes saved before this existed have no jobKind at all, and they were built
 * as recurring documents — so that is the honest default, not a guess.
 */
export const jobKindOf = (v: unknown): JobKind =>
  v === 'recovery' || v === 'repair' ? v : 'recurring';

export const jobKindLabel = (k: JobKind): string =>
  JOB_KINDS.find((j) => j.key === k)?.label ?? 'Recurring service';

/**
 * The heading above the trust block.
 *
 * Deliberately NOT "The Suncoast Difference" on a one-time job. That heading
 * promises a comparison between companies, which is the recurring-service
 * argument; a one-off buyer is not choosing a long-term provider, they are
 * deciding whether this specific number is trustworthy. "How this quote works"
 * says what the block is actually about, which is also why it does not read as
 * marketing.
 */
export const trustHeading = (kind: JobKind): string =>
  kind === 'recurring' ? 'The Suncoast Difference' : 'How This Quote Works';

/**
 * A one-time cleanup: green-to-clean, storm debris, deep clean.
 *
 * FIVE SHORT LINES, not six long ones. Length is itself a signal here: a wall
 * of promises on a one-off quote reads as the same boilerplate the customer is
 * already suspicious of, and it pushed the scope and the price onto a second
 * page that was two thirds empty. A one-time quote that fits on one page looks
 * considered; the same quote spilling over looks padded.
 *
 * Ordered by what actually stops the sale. The flat-price line is first and by
 * some distance the most important — recovery quotes have a deserved
 * reputation for moving once the truck arrives, and saying plainly that the
 * risk is ours is the single most differentiating sentence available on this
 * kind of job.
 *
 * The draining line exists because it is the fear nobody says out loud. A
 * customer who has been told by somebody that their pool "might need to be
 * drained" is bracing for a much larger bill, and committing to explain the
 * reasoning BEFORE rather than presenting it as a fait accompli costs nothing
 * and defuses it.
 */
const RECOVERY_ASSURANCES: string[] = [
  'One price for the job, not an hourly rate — if it takes more visits than we planned, that is on us',
  'Every chemical it needs is included — shock, algaecide, clarifier and balancers, with no bill at the end',
  'Filter cleaning as often as it takes; a recovery blinds a filter repeatedly, and that is part of the work',
  'If it cannot be brought back chemically you hear the reasoning first — draining is never a surprise',
  'Photos as it goes, and no ongoing commitment: one job, one price',
];

/**
 * Equipment, filter or salt-cell work.
 *
 * A different buyer again: less worried about the water, more worried about
 * being sold a part they did not need and about who carries it if the repair
 * does not hold. Diagnosis-before-parts is first for that reason.
 */
const REPAIR_ASSURANCES: string[] = [
  'A flat price covering parts and labour — you approve the figure below before anything is ordered',
  'We diagnose before we replace; if a repair will do, we say so rather than quote you a new unit',
  'Anything we find that is not part of this job gets reported, not quietly added to the bill',
  'Manufacturer warranty registered in your name, with our own workmanship covered on top',
  'Photos of the work and of the old part, and no ongoing commitment',
];

/**
 * The trust bullets for a job of this kind.
 *
 * Recurring returns [] because it has its own builder — includedBenefits() in
 * proposalBenefits.ts — which is filter and sanitizer aware. Keeping the two
 * apart means a change to the weekly-service promises can never silently
 * rewrite what a one-time customer was told, and vice versa.
 */
export const jobAssurances = (kind: JobKind): string[] => {
  if (kind === 'recovery') return RECOVERY_ASSURANCES;
  if (kind === 'repair') return REPAIR_ASSURANCES;
  return [];
};

/**
 * Whether the "what others charge extra for" table belongs on this document.
 *
 * It does not, on anything one-time. Every row of it is priced per month or per
 * visit against a recurring rate — the comparison is meaningless beside a
 * single job, and a table of monthly figures on a one-off quote is exactly the
 * "generic template" tell this whole file exists to remove.
 */
export const showsExtrasTable = (kind: JobKind): boolean => kind === 'recurring';

/**
 * Whether the condition-and-staleness pricing term belongs on this document.
 *
 * "Pricing assumes the pool is clean and in balanced condition when service
 * begins" is true of a recurring rate and absurd on a green-to-clean, where the
 * pool being filthy IS the job. Printing it there would read as either a
 * copy-paste error or a trapdoor to raise the price.
 */
export const showsConditionTerm = (kind: JobKind): boolean => kind === 'recurring';
