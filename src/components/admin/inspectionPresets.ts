/**
 * Quick-pick content for the first-service & inspection report builder.
 *
 * Everything here is a starting point the admin edits in place — presets exist
 * so a report can be filled out on a phone at the pool without typing prose.
 */
import type { IssueSeverity, RecPriority } from '@/lib/adminApi';

// ----- Chemistry panel ---------------------------------------------------

/**
 * The water-chemistry fields, in the order they appear on the form AND on the
 * report. Mirrors the service-report panel shown on the marketing site so the
 * first report matches what the customer was promised.
 */
export const CHEMISTRY_FIELDS = [
  { key: 'freeChlorine', label: 'Free Chlorine', unit: 'ppm', ideal: '2 – 4 ppm' },
  { key: 'totalChlorine', label: 'Total Chlorine', unit: 'ppm', ideal: '' },
  { key: 'ph', label: 'pH', unit: '', ideal: '7.4 – 7.6' },
  { key: 'alkalinity', label: 'Total Alkalinity', unit: 'ppm', ideal: '80 – 120 ppm' },
  { key: 'cya', label: 'Cyanuric Acid', unit: 'ppm', ideal: '30 – 50 ppm' },
  { key: 'calciumHardness', label: 'Calcium Hardness', unit: 'ppm', ideal: '200 – 400 ppm' },
  { key: 'salt', label: 'Salt', unit: 'ppm', ideal: '2700 – 3400 ppm' },
  { key: 'waterTemp', label: 'Water Temp', unit: '°F', ideal: '' },
  { key: 'filterPressure', label: 'Filter Pressure', unit: 'PSI', ideal: '' },
  { key: 'waterLevel', label: 'Water Level', unit: '', ideal: 'Mid-skimmer' },
] as const;

export type ChemistryFieldKey = (typeof CHEMISTRY_FIELDS)[number]['key'];

// ----- Surface -----------------------------------------------------------

export const SURFACE_MATERIALS = [
  'Plaster / Marcite',
  'Pebble',
  'Quartz',
  'Fiberglass',
  'Vinyl Liner',
  'Tile',
  'Painted',
];

export const SURFACE_CONDITIONS = ['Excellent', 'Good', 'Fair', 'Worn'];

/** Checkbox observations for the surface — wear and staining, the two things
 *  customers ask about most after a first visit. */
export const SURFACE_OBSERVATIONS = [
  'Organic staining (leaf / algae)',
  'Metal staining (rust / copper)',
  'Scale / calcium deposits',
  'Waterline tile line / buildup',
  'Etching / rough to the touch',
  'Chipping or hollow spots',
  'Discoloration / fading',
  'Cracking / spider cracks',
  'Grout missing at tile',
  'Surface in good shape — no wear or staining noted',
];

// ----- Overall call ------------------------------------------------------

export const OVERALL_RATINGS = ['Excellent', 'Good', 'Fair', 'Needs work'];

// ----- Issues (broken / needs replacing) ---------------------------------

/** Descriptive wording — used in the builder's dropdown. */
export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  urgent: 'Needs attention now',
  soon: 'Repair recommended',
  monitor: 'Monitoring',
};

/** Short wording for the chips on the report/email — the descriptive labels
 *  wrap (and hyphen-break) inside a chip. */
export const SEVERITY_CHIPS: Record<IssueSeverity, string> = {
  urgent: 'Needs Attention',
  soon: 'Repair Soon',
  monitor: 'Monitor',
};

export const SEVERITY_ORDER: IssueSeverity[] = ['urgent', 'soon', 'monitor'];

export const ISSUE_PRESETS: Array<{ label: string; severity: IssueSeverity }> = [
  { label: 'Salt cell scaled / low output', severity: 'soon' },
  { label: 'Pump leaking at the seal', severity: 'urgent' },
  { label: 'Pump lid O-ring dry / cracked', severity: 'soon' },
  { label: 'Filter cartridge torn / collapsed', severity: 'soon' },
  { label: 'DE grids torn', severity: 'soon' },
  { label: 'Multiport valve leaking (spider gasket)', severity: 'soon' },
  { label: 'Heater not firing', severity: 'urgent' },
  { label: 'Pool light out', severity: 'soon' },
  { label: 'Skimmer basket cracked', severity: 'soon' },
  { label: 'Skimmer lid cracked / unsafe', severity: 'urgent' },
  { label: 'Return eyeball missing', severity: 'monitor' },
  { label: 'Main drain cover cracked (safety)', severity: 'urgent' },
  { label: 'Timer not holding its schedule', severity: 'soon' },
  { label: 'Handrail / ladder loose', severity: 'urgent' },
  { label: 'Automatic cleaner not moving', severity: 'monitor' },
  { label: 'Water level low', severity: 'monitor' },
];

// ----- Recommendations (upgrades / next steps) ---------------------------

export const PRIORITY_LABELS: Record<RecPriority, string> = {
  now: 'Recommended now',
  soon: 'When convenient',
  optional: 'Optional upgrade',
};

export const PRIORITY_CHIPS: Record<RecPriority, string> = {
  now: 'Recommended',
  soon: 'When Convenient',
  optional: 'Optional',
};

export const PRIORITY_ORDER: RecPriority[] = ['now', 'soon', 'optional'];

export const REC_PRESETS: Array<{ label: string; priority: RecPriority; note?: string }> = [
  {
    label: 'Replace the salt cell',
    priority: 'now',
    note: 'Output is down and the cell is past its usable life — the pool will struggle to hold chlorine without it.',
  },
  {
    label: 'Robotic pool vacuum',
    priority: 'soon',
    note: 'Heavy debris load between visits. A robot keeps the floor clear day to day and takes load off the filter.',
  },
  {
    label: 'Variable-speed pump upgrade',
    priority: 'optional',
    note: 'Runs quieter and typically cuts pool electricity cost substantially versus a single-speed pump.',
  },
  {
    label: 'New filter cartridges',
    priority: 'soon',
    note: 'Current cartridges are near end of life — pressure climbs faster and flow drops.',
  },
  { label: 'Phosphate remover treatment', priority: 'soon', note: 'Phosphates feed algae and make chlorine work harder.' },
  { label: 'Stain treatment / acid wash', priority: 'optional', note: '' },
  { label: 'Tile cleaning (bead blast)', priority: 'optional', note: '' },
  { label: 'Pool light replacement (LED)', priority: 'optional', note: '' },
  { label: 'Automation / smart control upgrade', priority: 'optional', note: '' },
  { label: 'Drain & resurface', priority: 'optional', note: '' },
  { label: 'Weekly service plan', priority: 'now', note: '' },
  { label: 'Adjust pump run time', priority: 'now', note: '' },
];

// ----- Work-performed templates -----------------------------------------

export const WORK_TEMPLATES: Array<{ label: string; text: string }> = [
  {
    label: 'Standard first service',
    text: [
      '• Tested and balanced the water, then added the chemicals listed above',
      '• Brushed the walls, steps and waterline',
      '• Netted the surface and vacuumed the floor',
      '• Emptied the skimmer and pump baskets',
      '• Cleaned the filter and checked system pressure',
      '• Inspected the equipment pad and ran a full system check',
    ].join('\n'),
  },
  {
    label: 'Deep clean / neglected pool',
    text: [
      '• Removed heavy debris from the floor and surface',
      '• Brushed the entire surface, steps and waterline',
      '• Vacuumed to waste and refilled to the correct level',
      '• Shocked the pool and started a clarifier/flocculant cycle',
      '• Cleaned the filter and reset the run schedule',
      '• Note: the water will continue to clear over the next few days',
    ].join('\n'),
  },
  {
    label: 'Salt pool first service',
    text: [
      '• Tested the water including salt level and cell output',
      '• Removed and inspected the salt cell, cleaned scale as needed',
      '• Brushed, netted and vacuumed the pool',
      '• Emptied the baskets and cleaned the filter',
      '• Set the generator output for the current water temperature',
    ].join('\n'),
  },
];
