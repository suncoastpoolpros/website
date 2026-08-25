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
  // Signature narrowed when the salt row stopped branching on sanitization.
  ['src/components/admin/tierPresets.ts', /excludes: tier\.essentials\s*\n?\s*\? essentialsExclusions\(filter\.type\)/,
   'sync must regenerate the exclusion rows from the current filter type'],
  ['src/pages/ApprovePage.tsx', /const opensOnBreakdown =/,
   'three-plan quotes must open on the plans screen, not the breakdown'],
  ['src/pages/ApprovePage.tsx', /if \(opensOnBreakdown\(q, link\)\) setStep\(0\)/,
   'the landing step must use opensOnBreakdown, not leadsWithBreakdown'],
  ['src/components/admin/tierPresets.ts', /const wrongPoolRow = \(type: string, sanitization: string\): RegExp/,
   'sync must keep the wrong-pool safety net that catches REWORDED rows'],
  ['src/components/admin/tierPresets.ts', /\.filter\(\(b\) => !wrongPool\.test\(b\)\)/,
   'the wrong-pool net must actually be applied to an edited card'],
  // A bare identifier matches its own DECLARATION, so this passed with both
  // call sites deleted. Pin the call sites instead.
  ['src/components/admin/ProposalBuilder.tsx',
   /tiers: collapseIfNoEssentialsBasis\(/g,
   'three plans must collapse when filter service is not bundled (2 call sites)',
   2],
  // The third column, on all three surfaces. Each was verified to fail when
  // the conditional mark was replaced with an unconditional one.
  ['src/components/ProposalBreakdown.tsx', /x\.essentialsCovers \? \(\s*<Check/,
   'approve page must mark the Essentials column per row'],
  ['src/components/admin/ProposalDocument.tsx', /x\.essentialsCovers \? <MarkTick \/> : <MarkCross \/>/,
   'PDF must mark the Essentials column per row'],
  ['src/components/admin/ProposalBuilder.tsx', /x\.essentialsCovers \? "✓" : "✕"/,
   'builder preview must mark the Essentials column per row'],
  // Group membership is the whole point of the split, and nothing pinned it.
  ['src/components/admin/proposalBenefits.ts',
   /\.\.\.\(salty\s*\?\s*\['Salt cell acid washing and your salt — both included'\]/,
   'salt care must sit in the every-plan group, not the Complete group'],
  ['src/components/admin/includedExtras.ts',
   /const NOT_ON_ESSENTIALS = \/\^\(Cartridge filter replacement\|DE filter split\|Sand media\|Phosphate remover\)\//,
   'the value stack must not mark the salt-cell wash as Essentials-excluded'],
  // Conversion changes that a refactor could quietly undo.
  ['src/pages/ApprovePage.tsx', /Pricing held until/,
   'the plans screen must state when the pricing expires'],
  ['src/pages/ApprovePage.tsx', /agreeRequirements: agree\.all/,
   'the single consent box must still record all three agreements'],
  ['src/components/admin/tierPresets.ts', /const RETIRED_EXCLUSIONS = \[/,
   'retired exclusions must be reconciled at render for already-sent quotes'],
  ['src/components/admin/ProposalBuilder.tsx', /p\.proposal\.price,\n\s*value,/,
   'base-price sync must compare against the base rate, not tiers[0]'],
  ['src/components/admin/ProposalBuilder.tsx', /collapseIfNoEssentialsBasis/,
   'the collapse helper must still exist'],
  ['src/components/admin/ProposalBuilder.tsx', /syncFilterService\(\s*\n?\s*p\.proposal\.tiers,\s*\n?\s*\{ type: p\.pool\.filterType, included: answer === "yes" \}/,
   'the filter answer must re-sync the tiers'],
];

let bad = 0;
for (const [file, re, why, count] of CHECKS) {
  const src = read(file);
  if (count != null) {
    // Global regex + an expected count, for patterns whose identifier also
    // appears in its own declaration — a bare-name check passes even when
    // every call site has been deleted.
    const found = (src.match(re) || []).length;
    if (found !== count) {
      console.error(`✗ ${file}: ${why} (found ${found}, expected ${count})`);
      bad++;
    }
    continue;
  }
  if (!re.test(src)) {
    console.error(`✗ ${file}: ${why}`);
    bad++;
  }
}
if (bad) {
  console.error(`\n${bad} shipped fix(es) are no longer wired.`);
  process.exit(1);
}
console.log(`✓ Fix check: all ${CHECKS.length} shipped fixes still wired.`);
