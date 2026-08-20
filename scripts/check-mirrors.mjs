/**
 * Fails the build when the proposal PDF and the proposal EMAIL stop agreeing.
 *
 * WHY THIS EXISTS
 * Cloudflare Pages Functions can't import from the client `src/` tree, so
 * `functions/api/admin/send-proposal.ts` carries hand-copied duplicates of the
 * business NAP, the "what's included" benefits, the filter-service wording and
 * its prices, and the value-stack rows. Every one of those is a number or a
 * promise the customer reads TWICE — once in the attached PDF and once in the
 * email covering it.
 *
 * Change $120 in one copy and not the other and the two documents in a single
 * message quote different figures. That destroys exactly the credibility the
 * proposal is built on ("$120, based on an 8–18 month element life" only works
 * if a customer can check it), and nothing else would catch it: both files
 * compile, both render, and the drift is only visible to the customer.
 *
 * HOW
 * Bundles the client modules and the worker with esbuild, then renders the real
 * email for every filter/sanitization combination and asserts the client's
 * generated strings appear in it verbatim. Literal constants (phone, address)
 * are compared straight from source.
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

const filterMod = await bundle('src/components/admin/filterService.ts', 'filter.mjs');
const extrasMod = await bundle('src/components/admin/includedExtras.ts', 'extras.mjs');
const benefitsMod = await bundle('src/components/admin/proposalBenefits.ts', 'benefits.mjs');
const emailMod = await bundle('functions/api/admin/send-proposal.ts', 'email.mjs');

const payload = (filterType, included, sanitization) => ({
  customer: { name: 'Check', email: 'check@example.com' },
  pool: { filterType, filterServiceIncluded: included ? 'yes' : 'no', sanitization },
  proposal: {
    scope: 'Weekly service.',
    price: '200',
    pricingMode: 'single',
    tiers: [],
    addOns: [],
    includeBenefits: true,
    emailNote: '',
  },
});

// The email escapes for HTML; compare on the same footing.
const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const COMBOS = [];
for (const type of ['Cartridge', 'DE', 'Sand', 'Other', '']) {
  for (const included of [true, false]) {
    for (const sanitization of ['Saltwater', 'Chlorine', 'Bromine', 'Unknown']) {
      COMBOS.push({ type, included, sanitization });
    }
  }
}

for (const { type, included, sanitization } of COMBOS) {
  const where = `${type || '(blank)'}/${included ? 'incl' : 'excl'}/${sanitization}`;
  const { html } = emailMod.composeProposalEmail(payload(type, included, sanitization), {});

  // 1. The filter-service line the PDF prints must be in the email verbatim.
  const line = filterMod.filterServiceLine({ type, included });
  if (line) check(html.includes(esc(line)), `filter line missing from email [${where}]: "${line}"`);

  // 2. …and no OTHER filter type's wording may appear.
  for (const other of ['Cartridge', 'DE', 'Sand']) {
    if (other === type) continue;
    const otherLine = filterMod.filterServiceLine({ type: other, included: true });
    if (otherLine && (!line || otherLine !== line)) {
      check(!html.includes(esc(otherLine)), `wrong filter type quoted [${where}]: "${otherLine}"`);
    }
  }

  // 3. Value-stack rows: label, price and basis all have to match.
  const extras = extrasMod.includedExtras({ type, included }, sanitization);
  for (const row of extras) {
    check(html.includes(esc(row.label)), `extras label missing [${where}]: "${row.label}"`);
    check(html.includes(esc(row.typical)), `extras price missing [${where}]: "${row.typical}"`);
    check(html.includes(esc(row.basis)), `extras basis missing [${where}]: "${row.basis}"`);
  }

  // 3b. …and in the SAME ORDER. The rows run most-specific-to-this-pool first
  // (filter, then salt, then universal), which is a sales decision, not an
  // accident — a customer reading the PDF and the email should meet their
  // biggest saving first in both. Presence alone can't catch the two lists
  // drifting out of sequence, and that drift is silent and easy to introduce.
  const at = extras.map((row) => html.indexOf(esc(row.label)));
  for (let i = 1; i < at.length; i += 1) {
    check(
      at[i - 1] < at[i],
      `extras out of order in email [${where}]: "${extras[i].label}" ` +
        `should follow "${extras[i - 1].label}"`,
    );
  }

  // 4. The "what's included" list.
  const benefits = benefitsMod.includedBenefits({ type, included }, sanitization);
  for (const b of benefits) {
    check(html.includes(esc(b)), `benefit missing from email [${where}]: "${b}"`);
  }

  // 4b. …in the SAME ORDER. The list runs most-differentiating first — the
  // chemicals line leads because it is the one a customer can price against a
  // rival quote — and the guarantee is deliberately last. That is a sales
  // decision, and presence alone cannot catch the PDF and the email drifting
  // out of sequence.
  // Missing lines are already reported precisely above; including their -1 here
  // would add a confusing "out of order" for the same single fault.
  const bAt = benefits.map((b) => html.indexOf(esc(b))).filter((i) => i >= 0);
  for (let i = 1; i < bAt.length; i += 1) {
    check(
      bAt[i - 1] < bAt[i],
      `benefits out of order in email [${where}]: "${benefits[i]}" should follow "${benefits[i - 1]}"`,
    );
  }
}

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
  console.error(`\n✗ PDF and email have drifted apart (${failures.length} problem(s)):\n`);
  for (const f of failures) console.error(`   - ${f}`);
  console.error(
    '\n  These are duplicated by necessity: Pages Functions cannot import from src/.',
  );
  console.error('  Update the copy in functions/api/admin/send-proposal.ts to match.\n');
  process.exit(1);
}

console.log(`✓ Mirror check: PDF and email agree across ${COMBOS.length} filter/sanitization combinations.`);
