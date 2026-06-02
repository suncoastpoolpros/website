/**
 * Quick-pick optional / add-on services for the proposal builder. Picking one
 * adds a line (label + price) to the proposal's "Additional Services" list,
 * which the admin can edit or remove. Prices are intentionally blank — set them
 * per proposal, or fill in standard defaults here once they're decided.
 *
 * These are à-la-carte extras listed separately from the main scope/price; they
 * are NOT summed into the headline total (recurring vs. one-time pricing mixes).
 */
export type AddonPreset = { label: string; defaultPrice?: string };

// NOTE: Filter cleaning and salt-cell cleaning are deliberately NOT here — they
// are included in recurring service (see proposalBenefits.ts), so listing them
// as paid add-ons would undercut that benefit.
export const ADDON_PRESETS: AddonPreset[] = [
  { label: 'Green-to-Clean Recovery' },
  { label: 'One-Time Deep Clean' },
  { label: 'Equipment Diagnostic / Service Call' },
  { label: 'Equipment Repair / Installation' },
  { label: 'Leak Detection / Pressure Test' },
  { label: 'Acid Wash / Stain Treatment' },
];
