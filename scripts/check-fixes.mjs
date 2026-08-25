/**
 * Asserts that fixes we have SHIPPED are still WIRED — not merely imported.
 *
 * Written after a real miss: a multi-file patch asserted on an import that had
 * already changed, so the body edits were never written while the import was.
 * Lint passed (an unused import is not an error here), the commit message said
 * the fix had landed, and the job-kind gate on the customer breakdown was
 * silently absent for two days.
 *
 * Grep-level and deliberately dumb — it checks the wiring exists, and the test
 * suites check that the wiring behaves. Run by `npm run lint:fixes`.
 */
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const CHECKS = [
  // The one that was actually lost.
  ['src/components/ProposalBreakdown.tsx', /const kind = jobKindOf\(jobKind\)/,
   'breakdown must derive job kind, not just import jobKindOf'],
  ['src/components/ProposalBreakdown.tsx', /showsExtrasTable\(kind\)/,
   'breakdown must suppress the value stack on one-time jobs'],
  ['src/components/ProposalBreakdown.tsx', /: jobAssurances\(kind\)/,
   'breakdown must swap in one-time assurances'],
  ['src/pages/ApprovePage.tsx', /jobKind=\{quote\.proposal\?\.jobKind\}/,
   'approve page must pass jobKind to the breakdown'],
  // Other audit fixes worth pinning.
  ['src/lib/proposalPdf.tsx', /jobKind: str\(p\.jobKind\)/,
   're-downloaded PDF must keep jobKind'],
  ['src/lib/proposalPdf.tsx', /t\?\.essentials === true \? \{ essentials: true \}/,
   're-downloaded PDF must keep the essentials marker'],
  ['src/lib/proposalPdf.tsx', /Array\.isArray\(t\?\.excludes\)/,
   're-downloaded PDF must keep the exclusion rows'],
  ['src/components/admin/ProposalDocument.tsx', /pool\.filterServiceIncluded as unknown\) === true/,
   'PDF must accept the legacy boolean filter answer'],
  ['src/components/admin/tierPresets.ts', /const threePlan = tiers\.some\(\(t\) => t\.essentials\)/,
   'sync must detect the three-plan shape'],
  ['src/components/admin/tierPresets.ts', /essentialsExclusions\(filter\.type, sanitization\)/,
   'sync must regenerate the exclusion rows from the current pool'],
  ['src/components/admin/ProposalBuilder.tsx', /collapseIfNoEssentialsBasis/,
   'three plans must collapse when filter service is not bundled'],
  ['src/components/admin/ProposalBuilder.tsx', /syncFilterService\(\s*\n?\s*p\.proposal\.tiers,\s*\n?\s*\{ type: p\.pool\.filterType, included: answer === "yes" \}/,
   'the filter answer must re-sync the tiers'],
];

let bad = 0;
for (const [file, re, why] of CHECKS) {
  if (!re.test(read(file))) {
    console.error(`✗ ${file}: ${why}`);
    bad++;
  }
}
if (bad) {
  console.error(`\n${bad} shipped fix(es) are no longer wired.`);
  process.exit(1);
}
console.log(`✓ Fix check: all ${CHECKS.length} shipped fixes still wired.`);
