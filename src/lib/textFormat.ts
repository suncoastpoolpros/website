/**
 * Small, pure text formatters for form fields. Used on the proposal builder so
 * the value that lands in the live preview and the emailed PDF is tidy — applied
 * on blur (not per keystroke) so they never fight the caret while typing.
 */

/**
 * Capitalize the first letter of every word, leaving the rest of each word
 * exactly as typed. Only ever *upper*-cases — it never lower-cases the rest of a
 * word, so intentional capitals are preserved (e.g. "McDonald", "IntelliFlo",
 * "LLC", "123 main st" → "McDonald", "IntelliFlo", "LLC", "123 Main St").
 * Word boundaries are the start of the string and any whitespace.
 */
export const toTitleCase = (input: string): string =>
  input.replace(/(^|\s)(\S)/g, (_, lead: string, ch: string) => lead + ch.toUpperCase());

/**
 * Format a US 10-digit phone number as "(843)331-0329". A leading "1" country
 * code on an 11-digit number is dropped first. Anything that isn't a clean
 * 10-digit number (partial entry, international, etc.) is returned untouched, so
 * blurring a half-typed field never mangles it.
 */
export const formatUsPhone = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (local.length !== 10) return input;
  return `(${local.slice(0, 3)})${local.slice(3, 6)}-${local.slice(6)}`;
};
