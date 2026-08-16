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
import { build } from 'esbuild';
import { readFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
  for (const row of extrasMod.includedExtras({ type, included }, sanitization)) {
    check(html.includes(esc(row.label)), `extras label missing [${where}]: "${row.label}"`);
    check(html.includes(esc(row.typical)), `extras price missing [${where}]: "${row.typical}"`);
    check(html.includes(esc(row.basis)), `extras basis missing [${where}]: "${row.basis}"`);
  }

  // 4. The "what's included" list.
  for (const b of benefitsMod.includedBenefits({ type, included })) {
    check(html.includes(esc(b)), `benefit missing from email [${where}]: "${b}"`);
  }
}

// 5. Literal NAP constants, compared straight from source.
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
