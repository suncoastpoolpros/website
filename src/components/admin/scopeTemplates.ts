/**
 * Pre-written scope-of-work blocks for the proposal builder. The admin picks one
 * from a dropdown to drop a detailed, professional description into the scope
 * field, then edits as needed. Add/adjust wording here — it's the single source
 * for the dropdown.
 */
export type ScopeTemplate = { label: string; text: string };

export const SCOPE_TEMPLATES: ScopeTemplate[] = [
  {
    label: 'Weekly Pool Cleaning (recurring)',
    text: `Weekly full-service pool maintenance, performed once per week:

• Test and balance water chemistry — chlorine, pH, total alkalinity, cyanuric acid, and calcium hardness — adjusting as needed for safe, clear water.
• Brush walls, steps, and waterline tile to prevent algae and buildup.
• Skim the surface and empty skimmer and pump baskets.
• Vacuum the pool floor as needed.
• Empty and inspect the filter, backwashing or cleaning per the system type.
• Inspect equipment (pump, filter, heater, and timer) and report any issues.

Includes all routine chemicals. Service continues on a recurring weekly schedule with no long-term contract — cancel anytime.`,
  },
  {
    label: 'Bi-Weekly Pool Cleaning (recurring)',
    text: `Bi-weekly (every other week) full-service pool maintenance:

• Test and balance water chemistry and add the chemicals needed to keep the water safe and clear between visits.
• Brush walls, steps, and waterline tile.
• Skim the surface and empty skimmer and pump baskets.
• Vacuum the pool floor as needed.
• Clean/backwash the filter as required and inspect all equipment.

Includes routine chemicals. Recurring every-other-week schedule, no long-term contract.`,
  },
  {
    label: 'Green Pool Recovery (one-time)',
    text: `One-time green-to-clean pool recovery:

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
    text: `One-time deep clean and chemistry reset:

• Thorough brushing of walls, steps, and waterline tile.
• Full surface skim and complete vacuum of the pool floor.
• Empty and clean skimmer and pump baskets; clean/backwash the filter.
• Test and fully balance water chemistry.
• Inspect equipment and provide a brief report on overall condition.`,
  },
  {
    label: 'Equipment Repair / Installation',
    text: `Equipment repair / installation:

• Diagnose the reported issue and confirm the recommended repair or replacement.
• Supply and install [equipment — e.g. pump, filter, salt cell, heater, automation].
• Remove and dispose of the old equipment.
• Test the system for correct operation, pressure, and flow, and verify no leaks.
• Review operation and any settings with the customer.

Parts and labor as detailed above. Manufacturer warranty applies to new equipment.`,
  },
  {
    label: 'Salt System Service',
    text: `Salt system (chlorine generator) service:

• Inspect the salt cell, control board, and flow switch.
• Test salt level and water chemistry; add salt as needed to reach the target range.
• Clean the salt cell to remove calcium scale and restore output.
• Verify generator output and adjust settings for the pool's size and demand.
• Report on cell condition and expected remaining life.`,
  },
  {
    label: 'Filter Clean / Rebuild',
    text: `Filter cleaning / rebuild:

• Disassemble the filter and inspect internal components.
• Deep-clean cartridges/grids (or media for sand filters) to restore flow.
• Replace worn O-rings, gaskets, or damaged elements as needed.
• Reassemble, restart the system, and confirm correct pressure and flow.`,
  },
  {
    label: 'Commercial / HOA Service',
    text: `Commercial / HOA pool service:

• Scheduled maintenance visits per the agreed frequency, performed to Florida public-pool standards.
• Test and balance water chemistry each visit and maintain documented chemical logs.
• Brush, skim, and vacuum; empty baskets and clean/backwash the filter.
• Inspect pumps, filters, heaters, and safety equipment; report any deficiencies promptly.
• Coordinate with property management on access, scheduling, and any required repairs.`,
  },
];
