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
