/**
 * The county writes owners last-name-first in capitals: "RICH, RUSTY A".
 * Shown as a person would write it: "Rusty A Rich". Company and trust words
 * (LLC, INC, TRE, III…) stay in capitals, and a trailing suffix stays at the
 * end: "SMITH, JOHN TRE" → "John Smith TRE".
 */

const KEEP_UPPER = new Set(['LLC', 'INC', 'TRE', 'TR', 'LP', 'LLP', 'LLLP', 'PA', 'PLLC', 'II', 'III', 'IV', 'USA', 'HOA']);
const SUFFIXES = new Set(['TRE', 'TR', 'JR', 'SR', 'II', 'III', 'IV', 'EST']);
/** Words that mark a business or trust, whose name is already in reading order. */
const ORG = /\b(LLC|INC|CORP|TRUST|LP|LLP|BANK|ASSN|ASSOCIATION|HOLDINGS|PROPERTIES|COMPANY)\b/;

const capWord = (w: string): string =>
  KEEP_UPPER.has(w) ? w : w.toLowerCase().replace(/(^|[-'])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());

export const ownerName = (raw: string): string => {
  const s = raw.trim().replace(/\s+/g, ' ').toUpperCase();
  if (!s) return '';
  const comma = s.indexOf(',');
  let words: string[];
  if (comma > 0 && !ORG.test(s)) {
    const last = s.slice(0, comma).trim().split(' ');
    const rest = s.slice(comma + 1).trim().split(' ').filter(Boolean);
    const suffix: string[] = [];
    while (rest.length && SUFFIXES.has(rest[rest.length - 1])) suffix.unshift(rest.pop() as string);
    words = [...rest, ...last, ...suffix];
  } else {
    words = s.replace(/,/g, ' ').split(' ').filter(Boolean);
  }
  return words.map(capWord).join(' ');
};
