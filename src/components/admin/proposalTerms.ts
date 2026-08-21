/**
 * Pricing terms that are true of every proposal, whatever the pool or the plan.
 *
 * Mirrored in functions/api/admin/send-proposal.ts only if the email ever needs
 * them; today it doesn't — the email is a note and a link, and these reach the
 * customer through the PDF and the approve page.
 */

/**
 * What the price assumes about the pool's condition.
 *
 * TWO SEPARATE RISKS, ONE SENTENCE.
 *
 * A quote can go stale: a proposal sits unaccepted for three weeks in a Florida
 * summer, nobody services the pool in the meantime, and what starts as a
 * routine rate is suddenly a green-to-clean recovery. The flat rate should not
 * silently absorb that.
 *
 * And a quote is often written WITHOUT SEEING THE POOL AT ALL — a texted lead
 * priced from an address is the case this builder exists for. So "the condition
 * we quoted" would be a fiction on exactly the quotes that need this most.
 *
 * Hence "assumes the pool is clean and balanced when service begins" rather
 * than any claim about what we saw. It is true whether we surveyed it, glanced
 * at a photo, or only had the address.
 *
 * Backed by the Service Agreement, which excludes "Green-to-Clean recoveries or
 * heavy debris removal required due to … pool neglect prior to start of
 * service" (§4) and treats anything predating the first visit as pre-existing
 * (§1). This says so where the customer is deciding, rather than leaving it in
 * a document they may not open — and it gives them a real reason to accept
 * promptly, which an invented deadline never does.
 */
export const PRICING_CONDITION_TERM =
  'This pricing assumes the pool is clean and in balanced condition when service begins. If it is not — whether it has slipped while the proposal was open, or was not in that condition when we quoted — bringing it up to standard is quoted separately, and always before any work starts.';

/** The same point, tightened for the PDF, where it sits under the plan terms. */
export const PRICING_CONDITION_TERM_SHORT =
  'Pricing assumes the pool is clean and in balanced condition when service begins; bringing a pool up to that standard is quoted separately, and always before any work starts.';
