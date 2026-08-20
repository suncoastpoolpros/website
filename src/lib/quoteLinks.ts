/**
 * Quote links: the two URLs a customer can arrive on, and how to read one back.
 *
 *   /quote-1001-k7m2p9x    texted  — opens with the full breakdown, then pricing
 *   /approve-1001-k7m2p9x  emailed — opens straight on the plans
 *
 * Both carry the SAME secret. The leading word is a routing instruction, not a
 * credential — it only decides which screen the customer lands on first. They
 * differ by a word rather than by length or a marker character because two URLs
 * that differ by one character look identical at a glance, and pasting the wrong
 * one fails silently: the customer just lands on the wrong screen.
 *
 * Mirrored in functions/api/_quotes.ts (Pages Functions can't import from src/)
 * — the builders are checked against each other by scripts/check-mirrors.mjs.
 * The PARSER lives here only; nothing server-side reads a path.
 */

/** Crockford base32, lowercase — no i/l/o/u, so no 0/O or 1/l ambiguity. */
const TOKEN_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';
export const TOKEN_LENGTH = 7;

/** Whether a string is one of our short tokens (vs. a legacy 43-char one). */
export const isShortToken = (s: string): boolean =>
  s.length === TOKEN_LENGTH && [...s].every((c) => TOKEN_ALPHABET.includes(c));

/**
 * THE NUMBER IS ONLY ATTACHED TO A SHORT TOKEN. A legacy 43-character base64url
 * token can itself contain dashes and begin with digits, so "1000-kQ7-vZ2x…"
 * would be genuinely ambiguous — the parser could not tell the proposal number
 * from the start of the token, and would hand back a token that doesn't exist.
 * Legacy links simply carry no number, which costs nothing: they are a handful
 * of quotes that predate numbering, and the link still works.
 *
 * Together with the parser's rule (strip a leading number ONLY when exactly a
 * valid short token follows), this makes every shape unambiguous.
 */
const build = (origin: string, word: string, token: string, number?: number | null): string => {
  const n = Number(number);
  const prefix = Number.isInteger(n) && n > 0 && isShortToken(token) ? `${n}-` : '';
  return `${origin.replace(/\/$/, '')}/${word}-${prefix}${encodeURIComponent(token)}`;
};

/** The texting link: leads with the breakdown, for a lead who has read nothing. */
export const quoteUrl = (origin: string, token: string, number?: number | null): string =>
  build(origin, 'quote', token, number);

/** The emailed link: leads with the plans, alongside the PDF that explains them. */
export const approveUrl = (origin: string, token: string, number?: number | null): string =>
  build(origin, 'approve', token, number);

/**
 * Which screen a link asks for first.
 *
 * 'unspecified' is the legacy ?t= form, which predates the distinction and
 * carries no opinion — the page falls back to how the quote was delivered. The
 * two new shapes are explicit and WIN over that, so a link says what it does.
 */
export type LinkLead = 'breakdown' | 'plans' | 'unspecified';

export type ParsedQuoteLink = { token: string; lead: LinkLead };

/**
 * Read a quote link back out of a URL.
 *
 * Handles all three shapes:
 *   /quote-1001-k7m2p9x     → breakdown
 *   /approve-1001-k7m2p9x   → plans
 *   /approve/?t=<token>     → unspecified (legacy, and permanent — these are
 *                             sitting in inboxes and cannot be reissued)
 *
 * THE NUMBER IS ONLY STRIPPED WHEN WHAT FOLLOWS IS A VALID SHORT TOKEN. A legacy
 * base64url token can itself begin with digits and a dash ("123-aBc…"), and
 * blindly treating a leading number as the proposal number would silently
 * truncate it into a token that doesn't exist. Checking the shape of the
 * remainder disambiguates the two without guessing: a legacy token is 43
 * characters, so it can never be mistaken for the 7-character kind.
 */
export const parseQuoteLink = (pathname: string, search: string): ParsedQuoteLink | null => {
  const legacy = new URLSearchParams(search).get('t');
  if (legacy) return { token: legacy, lead: 'unspecified' };

  const m = /^\/(quote|approve)-(.+?)\/?$/.exec(pathname);
  if (!m) return null;
  const lead: LinkLead = m[1] === 'quote' ? 'breakdown' : 'plans';

  /**
   * decodeURIComponent throws URIError on a malformed escape ("/quote-%"), and
   * this function is called DURING RENDER — in App.tsx's catch-all and again in
   * ApprovePage. An uncaught throw there blanks the page completely, which any
   * passer-by could trigger by mangling a URL. A malformed escape is not a token
   * we would ever issue, so falling back to the raw text simply lands on the
   * honest "we couldn't find that quote" screen.
   */
  let rest: string;
  try {
    rest = decodeURIComponent(m[2]);
  } catch {
    rest = m[2];
  }
  const numbered = /^(\d+)-(.+)$/.exec(rest);
  if (numbered && isShortToken(numbered[2].toLowerCase())) rest = numbered[2];

  // Lowercased only when it IS a short token, so a link that came back
  // capitalised still resolves while a case-sensitive legacy token is untouched.
  const token = isShortToken(rest.toLowerCase()) ? rest.toLowerCase() : rest;
  return token ? { token, lead } : null;
};
