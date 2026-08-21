/**
 * How the pool is sanitised. Drives one inclusion: a salt pool's generator needs
 * acid washing, which other companies bill for and this service covers.
 *
 * "Unknown" is a real answer, not a placeholder — a first quote is often written
 * before anyone has looked at the equipment pad, and forcing a guess would put a
 * wrong claim on a customer-facing document.
 */
export const SANITIZATION_TYPES = ['Saltwater', 'Chlorine', 'Bromine', 'Unknown'] as const;

/**
 * Matches on "salt" rather than an exact string so drafts saved under the older
 * option wording ("Salt (chlorine generator)") still resolve correctly.
 */
export const isSaltwater = (sanitization: string): boolean => /salt/i.test(sanitization.trim());

/**
 * How the sanitization reads on a CUSTOMER-FACING document.
 *
 * "Chlorine" on its own is ambiguous, because a salt pool makes its own
 * chlorine — so the word describes both options and distinguishes neither.
 * "Liquid Chlorine" names the thing that actually gets carried to the pool and
 * poured in, which is the difference the customer is being told about.
 *
 * A DISPLAY transform, not a stored value. 'Chlorine' stays in the database, so
 * isSaltwater keeps working, no migration is needed, and quotes sent months ago
 * pick up the clearer wording the next time they are rendered.
 *
 * Only an exact "Chlorine" is rewritten: "Saltwater", "Bromine" and "Unknown"
 * are already unambiguous, and anything hand-typed is left as written.
 */
export const sanitizationLabel = (sanitization: string): string => {
  const t = sanitization.trim();
  return /^chlorine$/i.test(t) ? 'Liquid Chlorine' : t;
};
