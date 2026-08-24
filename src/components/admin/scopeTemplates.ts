/**
 * Pre-written scope-of-work blocks for the proposal builder. The admin picks one
 * from a dropdown to drop a detailed, professional description into the scope
 * field, then edits as needed. Add/adjust wording here — it's the single source
 * for the dropdown.
 *
 * Templates BUILD from the pool rather than being fixed text. A static list
 * promised a salt-cell check on chlorine pools and "backwashing" on cartridge
 * filters, which aren't backwashed at all — you pull and rinse the elements.
 * Wrong detail in a scope of work is worse than no detail: it tells the
 * customer the quote wasn't written for their pool.
 *
 * The same rule applies to FREQUENCY, not just to equipment — see filterLine.
 * A recurring template lists what happens on a visit, so anything in it is a
 * promise about every visit.
 */
import { isSaltwater } from './sanitization';

export type ScopeContext = {
  /** pool.sanitization — Saltwater | Chlorine | Bromine | Unknown */
  sanitization: string;
  /** pool.filterType — Cartridge | DE | Sand | Other */
  filterType: string;
};

import type { JobKind } from './jobKinds';
import type { ServiceCadence } from './serviceCadence';

export type ScopeTemplate = {
  label: string;
  /**
   * What kind of job this template describes.
   *
   * Picking a template is already the operator saying what this is, so the
   * document's trust block follows from it rather than from remembering a
   * separate toggle — which is how every one-time quote ended up carrying the
   * weekly-service promises. See jobKinds.ts.
   */
  kind: JobKind;
  /**
   * How often we come, on the two templates that say so in their prose.
   *
   * Same argument as `kind`, applied to the other thing a template already
   * decides: inserting "Bi-Weekly Pool Cleaning" is the operator stating the
   * cadence, and the pricing card should not need them to state it twice. The
   * alternative — reading the cadence back out of the scope text — is a regex
   * against prose the operator is free to rewrite.
   *
   * Absent on the one-time templates: a green-to-clean has no cadence, and
   * giving it one would put "Weekly service" under a single-job price.
   */
  cadence?: ServiceCadence;
  build: (ctx: ScopeContext) => string;
};

/**
 * How the filter is actually serviced on this pool.
 *
 * SPLIT INTO WHAT HAPPENS EVERY VISIT AND WHAT HAPPENS WHEN IT IS DUE. Both of
 * these templates describe a recurring visit, so listing "pull and rinse the
 * cartridge elements" as a bullet promised that on every single visit — and
 * that is not the job. The pressure reading is checked every time; the filter
 * is opened when that reading says it needs opening.
 *
 * It was wrong for all four types, not just cartridge: a DE filter is
 * backwashed and recharged every four to eight weeks (the value stack prices it
 * that way), and sand is the same. Promising any of them weekly is a service
 * nobody performs and a customer could reasonably expect to see.
 */
const filterLine = ({ filterType }: ScopeContext, detailed: boolean): string => {
  const service = (() => {
    switch (filterType) {
      case 'Cartridge':
        return 'pull, rinse and inspect the cartridge elements for tears or collapse';
      case 'DE':
        return 'backwash it and recharge with fresh DE';
      case 'Sand':
        return 'backwash it and check the media';
      default:
        return 'open, clean and inspect it to suit the system';
    }
  })();
  /**
   * The cartridge trigger is a REAL NUMBER because we have one: 8–12 psi over
   * clean is when the elements come out. Naming it does the same work as
   * quoting "$120, based on an 8–18 month element life" in the value stack — a
   * customer who knows their own gauge can check it, and a threshold they can
   * check is the difference between a schedule and a claim.
   *
   * NOT applied to DE or sand. No threshold has been given for those, and
   * inventing a plausible one is exactly the error this file exists to prevent.
   */
  const trigger =
    filterType === 'Cartridge'
      ? 'when pressure climbs 8–12 psi over that baseline'
      : 'when that reading says it is due';
  const why = detailed ? ', so a rising reading is caught before flow drops off' : '';
  return `• Check filter pressure against its clean baseline every visit${why}, and ${service} ${trigger}.`;
};

/** Only on a salt pool — a chlorine pool has no cell to check. */
const saltLine = ({ sanitization }: ScopeContext): string[] =>
  isSaltwater(sanitization)
    ? ['• Check the salt cell and chlorine generator output, cleaning the cell as needed.']
    : [];

export const SCOPE_TEMPLATES: ScopeTemplate[] = [
  {
    label: 'Weekly Pool Cleaning',
    kind: 'recurring',
    cadence: 'weekly',
    build: (ctx) =>
      [
        'Weekly full-service pool maintenance, performed once per week:',
        '',
        '• Test and balance water chemistry — chlorine, pH, total alkalinity, cyanuric acid and calcium hardness — keeping the water safe to swim in and correctly balanced, so it is neither acidic enough to etch plaster and corrode metal nor hard enough to leave scale on tile and inside the heater.',
        '• Brush walls, steps and the waterline tile, both to stop algae getting a foothold and to keep the surface finish clean and even.',
        '• Skim the surface and empty the skimmer, pump and cleaner baskets.',
        '• Vacuum the pool floor as needed.',
        filterLine(ctx, true),
        ...saltLine(ctx),
        '• Check the water level and report anything that looks like a leak.',
        '• Inspect the equipment — pump, filter, heater and timer — and report any issues.',
        '• Send a photo service report to your inbox after every visit.',
        '',
        'Includes all routine chemicals. Service continues on a recurring weekly schedule with no long-term contract — cancel anytime.',
      ].join('\n'),
  },
  {
    label: 'Bi-Weekly Pool Cleaning',
    kind: 'recurring',
    cadence: 'biweekly',
    build: (ctx) =>
      [
        'Bi-weekly (every other week) full-service pool maintenance:',
        '',
        '• Test and balance water chemistry and add the chemicals needed to keep the water safe, clear and correctly balanced between visits.',
        '• Brush walls, steps and the waterline tile to stop algae getting a foothold and protect the surface finish.',
        '• Skim the surface and empty the skimmer, pump and cleaner baskets.',
        '• Vacuum the pool floor as needed.',
        filterLine(ctx, false),
        ...saltLine(ctx),
        '• Inspect the equipment and report any issues.',
        '• Send a photo service report to your inbox after every visit.',
        '',
        'Includes routine chemicals. Recurring every-other-week schedule, no long-term contract.',
      ].join('\n'),
  },
  {
    label: 'Green Pool Recovery',
    kind: 'recovery',
    build: () => `One-time green-to-clean pool recovery:

• On-site assessment of water condition, circulation, and filtration.
• Test water and apply an initial shock/sanitizer treatment to kill algae.
• Add specialty chemicals (algaecide, clarifier/flocculant) as needed and rebalance water chemistry.
• Brush all surfaces and run the system through extended filtration cycles.
• Vacuum settled debris, clean/backwash the filter repeatedly, and remove debris as the water clears.
• Multiple visits over several days may be required depending on severity.

Goal: return the pool to clear, swimmable, properly balanced water. We recommend starting recurring service afterward to keep it that way.`,
  },
  {
    label: 'One-Time Deep Clean',
    kind: 'recovery',
    build: () => `One-time deep clean and chemistry reset:

• Thorough brushing of walls, steps, and waterline tile.
• Full surface skim and complete vacuum of the pool floor.
• Empty and clean skimmer and pump baskets; clean/backwash the filter.
• Test and fully balance water chemistry.
• Inspect equipment and provide a brief report on overall condition.`,
  },
  {
    label: 'Equipment Repair / Installation',
    kind: 'repair',
    build: () => `Equipment repair / installation:

• Diagnose the reported issue and confirm the recommended repair or replacement.
• Supply and install [equipment — e.g. pump, filter, salt cell, heater, automation].
• Remove and dispose of the old equipment.
• Test the system for correct operation, pressure, and flow, and verify no leaks.
• Review operation and any settings with the customer.

Parts and labor as detailed above. Manufacturer warranty applies to new equipment.`,
  },
  {
    label: 'Salt System Service',
    kind: 'repair',
    build: () => `Salt system (chlorine generator) service:

• Inspect the salt cell, control board, and flow switch.
• Test salt level and water chemistry; add salt as needed to reach the target range.
• Clean the salt cell to remove calcium scale and restore output.
• Verify generator output and adjust settings for the pool's size and demand.
• Report on cell condition and expected remaining life.`,
  },
  {
    label: 'Filter Clean / Rebuild',
    kind: 'repair',
    build: () => `Filter cleaning / rebuild:

• Disassemble the filter and inspect internal components.
• Deep-clean cartridges/grids (or media for sand filters) to restore flow.
• Replace worn O-rings, gaskets, or damaged elements as needed.
• Reassemble, restart the system, and confirm correct pressure and flow.`,
  },
  {
    label: 'Commercial / HOA Service',
    kind: 'recurring',
    build: () => `Commercial / HOA pool service:

• Scheduled maintenance visits per the agreed frequency, performed to Florida public-pool standards.
• Test and balance water chemistry each visit and maintain documented chemical logs.
• Brush, skim, and vacuum; empty baskets and clean/backwash the filter.
• Inspect pumps, filters, heaters, and safety equipment; report any deficiencies promptly.
• Coordinate with property management on access, scheduling, and any required repairs.`,
  },
];
