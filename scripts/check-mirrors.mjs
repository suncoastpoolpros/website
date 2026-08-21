/**
 * Fails the build when a value that HAS to exist in two places stops agreeing.
 *
 * WHY THIS EXISTS
 * Cloudflare Pages Functions can't import from the client `src/` tree, so a few
 * things are hand-copied into functions/. Every copy is a chance for the two to
 * drift silently: both compile, both run, and only a customer sees the
 * difference.
 *
 * WHAT IT USED TO CHECK, AND WHY IT NO LONGER DOES
 * The bulk of this script compared the proposal EMAIL against the PDF across
 * forty filter/sanitization combinations, because the email rendered the whole
 * proposal — the Suncoast Difference, the value stack, the plan cards — from
 * its own duplicated copies of every promise and every price. It earned its
 * keep repeatedly: a straight apostrophe against a typographic one, rows in a
 * different order, a label that was a substring of another line.
 *
 * The email no longer renders the proposal. It carries a note and a link, and
 * the duplicated constants behind it were deleted with it, so there is nothing
 * left to compare. That is the better fix: the check existed to survive the
 * duplication, and the duplication is gone.
 *
 * WHAT REMAINS DUPLICATED, AND IS CHECKED HERE
 *   - the quote-link builders, in src/lib/quoteLinks.ts and functions/api/_quotes.ts
 *   - the token alphabet and length, in the same two files
 *   - the business NAP, in src/lib/contact.ts and the two send-* workers
 *
 * Run: `npm run check:mirrors` (also runs as part of `npm run build`).

 */
import { readFile, mkdir, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * esbuild is loaded defensively. This check runs as the first step of the build,
 * so anything that stops it from RUNNING would otherwise block every deploy —
 * which is worse than the drift it prevents. A tooling failure warns and lets
 * the build through; drift it actually detected still fails hard.
 *
 * (This is not hypothetical: esbuild was undeclared and only resolved locally
 * via hoisting out of vite, so the check crashed on Cloudflare and silently
 * blocked three deploys. It's a declared devDependency now — this is the belt
 * to that braces.)
 */
let build;
try {
  ({ build } = await import('esbuild'));
} catch (err) {
  console.warn(`⚠ Mirror check SKIPPED — could not load esbuild (${err.code ?? err.message}).`);
  console.warn('  The PDF/email duplicates are unverified for this build.');
  process.exit(0);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Output must live INSIDE the project or Node can't resolve the external
// packages the bundles import. node_modules/.cache is already ignored.
const OUT = path.join(ROOT, 'node_modules', '.cache', 'mirror-check');

const bundle = async (entry, outfile) => {
  await build({
    entryPoints: [path.join(ROOT, entry)],
    outfile: path.join(OUT, outfile),
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    alias: { '@': path.join(ROOT, 'src') },
    logLevel: 'silent',
  });
  return import(pathToFileURL(path.join(OUT, outfile)).href);
};

const failures = [];
const check = (ok, label) => {
  if (!ok) failures.push(label);
};

await mkdir(OUT, { recursive: true });


// 5. Quote-link builders. The admin copies these URLs and the worker emails
// them; if the two ever disagree, one of them sends customers to a 404 — and it
// would be the emailed one, which is the copy you can't correct after the fact.
// The parser is only checked for round-tripping, since it lives in src/ alone.
const linksMod = await bundle('src/lib/quoteLinks.ts', 'links.mjs');
const quotesMod = await bundle('functions/api/_quotes.ts', 'quotes.mjs');
const ORIGIN = 'https://suncoastpoolpros.com';
for (const [token, number] of [
  ['k7m2p9x', 1001],
  ['k7m2p9x', null],
  ['0123456', 9],
  ['kQ7-vZ2x9AbCdEfGhIjKlMnOpQrStUvWxYz0123456', 1000], // a legacy token
]) {
  const where = `${token.slice(0, 10)}/${number}`;
  for (const fn of ['quoteUrl', 'approveUrl']) {
    const client = linksMod[fn](ORIGIN, token, number);
    const worker = quotesMod[fn](ORIGIN, token, number);
    check(client === worker, `${fn} differs [${where}]: client "${client}" vs worker "${worker}"`);
    // …and the page must be able to read back what either one produced.
    const url = new URL(client);
    const parsed = linksMod.parseQuoteLink(url.pathname, url.search);
    check(
      parsed?.token === token,
      `${fn} does not round-trip [${where}]: "${client}" parsed to "${parsed?.token}"`,
    );
    check(
      parsed?.lead === (fn === 'quoteUrl' ? 'breakdown' : 'plans'),
      `${fn} lost its lead [${where}]: got "${parsed?.lead}"`,
    );
  }
}
// Legacy ?t= links are in customers' inboxes and can never be reissued.
const legacy = linksMod.parseQuoteLink('/approve/', '?t=kQ7-vZ2x9AbCdEf');
check(legacy?.token === 'kQ7-vZ2x9AbCdEf', 'legacy ?t= link no longer parses');
check(legacy?.lead === 'unspecified', 'legacy ?t= link should carry no lead opinion');

// 5b. The token alphabet and length, compared straight from source. These are
// duplicated because the generator must run in the worker and the parser in the
// browser. Drift here is silent and total: widen the alphabet in one copy and
// the page stops recognising tokens the worker issues, so every new link 404s
// with nothing in the logs to explain it.
const tokenConsts = (file) => {
  const src = readFileSync(path.join(ROOT, file), 'utf8');
  return {
    alphabet: (/TOKEN_ALPHABET = '([^']*)'/.exec(src) || [])[1],
    length: (/TOKEN_LENGTH = (\d+)/.exec(src) || [])[1],
  };
};
const clientTok = tokenConsts('src/lib/quoteLinks.ts');
const workerTok = tokenConsts('functions/api/_quotes.ts');
check(!!clientTok.alphabet && !!clientTok.length, 'token constants not found in src/lib/quoteLinks.ts');
check(!!workerTok.alphabet && !!workerTok.length, 'token constants not found in functions/api/_quotes.ts');
check(
  clientTok.alphabet === workerTok.alphabet,
  `TOKEN_ALPHABET differs: client "${clientTok.alphabet}" vs worker "${workerTok.alphabet}"`,
);
check(
  clientTok.length === workerTok.length,
  `TOKEN_LENGTH differs: client ${clientTok.length} vs worker ${workerTok.length}`,
);
// A duplicate character would silently bias the generator toward it.
check(
  new Set(clientTok.alphabet ?? '').size === (clientTok.alphabet ?? '').length,
  'TOKEN_ALPHABET contains a duplicate character',
);
// 256 % alphabet.length must be 0, or `byte % length` in newQuoteToken is
// biased toward the first (256 % length) characters and the token is weaker
// than its length suggests.
check(
  256 % (clientTok.alphabet ?? ' ').length === 0,
  `TOKEN_ALPHABET length ${clientTok.alphabet?.length} does not divide 256 — the modulo in newQuoteToken would be biased`,
);

// 6. Literal NAP constants, compared straight from source.
const contact = await readFile(path.join(ROOT, 'src/lib/contact.ts'), 'utf8');
const literal = (src, name) => (new RegExp(`${name}\\s*=\\s*'([^']*)'`).exec(src) || [])[1];
const nap = {
  phone: literal(contact, 'PHONE_DISPLAY'),
  email: literal(contact, 'EMAIL'),
  address: literal(contact, 'ADDRESS_LINE'),
};
for (const worker of ['functions/api/admin/send-proposal.ts', 'functions/api/admin/send-inspection.ts']) {
  const src = await readFile(path.join(ROOT, worker), 'utf8');
  for (const [key, value] of Object.entries(nap)) {
    if (!value) continue;
    check(src.includes(value), `${path.basename(worker)} is out of sync with contact.ts ${key}: "${value}"`);
  }
}

await rm(OUT, { recursive: true, force: true });

if (failures.length) {
  console.error(`\n✗ Duplicated values have drifted apart (${failures.length} problem(s)):\n`);
  for (const f of failures) console.error(`   - ${f}`);
  console.error(
    '\n  These are duplicated by necessity: Pages Functions cannot import from src/.',
  );
  console.error('  Update the copy in functions/api/admin/send-proposal.ts to match.\n');
  process.exit(1);
}

console.log('✓ Mirror check: quote links, token constants and NAP agree across src/ and functions/.');
