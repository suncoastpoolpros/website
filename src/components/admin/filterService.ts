/**
 * The included annual filter service, tailored to the pool's actual filter.
 *
 * A cartridge pool, a DE pool and a sand pool need three different sentences,
 * and the exclusions differ too — an unqualified "DE split and clean" would
 * arguably oblige a $150–250 grid set, and a sand pool has no cartridge to
 * replace at all. Quoting the wrong one is a promise you can't keep, so the
 * builder asks for the filter type and whether the service is included, and
 * every surface (proposal PDF, email, plan cards) derives its wording from here.
 *
 * Mirrored as plain constants in functions/api/admin/send-proposal.ts (the Pages
 * Function can't import from the client src tree) — keep them in sync.
 */

export const FILTER_TYPES = ['Cartridge', 'DE', 'Sand', 'Other'] as const;

/**
 * What the service is worth, and WHY — the basis is quoted alongside the figure
 * so "$120 value" reads as a costed number rather than a marketing round-up. A
 * customer who knows a cartridge set lasts about a year can check the maths, and
 * that is the point.
 *
 * Sand is deliberately absent: media replacement hasn't been costed and runs on
 * a 5–7 year cycle, not annual, so no figure is quoted for it rather than an
 * invented one. Add an entry here and it appears automatically everywhere.
 */
export const FILTER_SERVICE: Record<string, { value: number; basis: string }> = {
  Cartridge: { value: 120, basis: 'based on a 12-month element life' },
  DE: { value: 150, basis: 'based on a 12-month split cadence' },
};

/** "— a $120 value, based on a 12-month element life", or '' when uncosted. */
const valueClause = (type: string): string => {
  const v = FILTER_SERVICE[type];
  return v ? ` — a $${v.value} value, ${v.basis}` : '';
};

export type FilterOption = {
  /** One of FILTER_TYPES, or '' when not yet chosen. */
  type: string;
  included: boolean;
};

/** Filter types where an annual service can meaningfully be bundled. */
export const supportsFilterService = (type: string): boolean =>
  type === 'Cartridge' || type === 'DE' || type === 'Sand';

/** The question the builder asks once a filter type is chosen. */
export const inclusionQuestion = (type: string): string => {
  switch (type) {
    case 'Cartridge':
      return 'Cartridge replacements included in the monthly cost?';
    case 'DE':
      return 'DE split & recharge included in the monthly cost?';
    case 'Sand':
      return 'Sand media replacement included in the monthly cost?';
    default:
      return 'Filter service included in the monthly cost?';
  }
};

/**
 * The service bullet, or null when nothing is bundled — in which case no line is
 * printed at all rather than a line saying what the customer doesn't get.
 */
export const filterServiceLine = ({ type, included }: FilterOption): string | null => {
  if (!included || !supportsFilterService(type)) return null;
  switch (type) {
    case 'Cartridge':
      return `Cartridge filter replacement included in your monthly cost${valueClause(type)}`;
    case 'DE':
      return `DE filter split, clean and recharge included in your monthly cost${valueClause(type)}`;
    case 'Sand':
      return `Sand media replacement included in your monthly cost${valueClause(type)}`;
    default:
      return null;
  }
};

/**
 * Every line filterServiceLine can ever produce. The builder uses this to find
 * and replace a stale filter bullet when the filter type changes, without
 * touching anything the admin typed by hand.
 */
export const ALL_FILTER_LINES: string[] = FILTER_TYPES.map((type) =>
  filterServiceLine({ type, included: true }),
).filter((l): l is string => l !== null);

/**
 * The terms for whichever service is (or isn't) included. Always returns
 * something: when nothing is bundled it still says replacements are quoted
 * separately, so "filter cleaning is included" can't be misread as "replacement
 * elements are included".
 */
export const filterServiceTerms = ({ type, included }: FilterOption): string => {
  if (!included || !supportsFilterService(type)) {
    return 'Routine filter cleaning and backwashing are included in your service. Replacement filter elements, grids or media are quoted separately, and always before any work is done.';
  }
  switch (type) {
    case 'Cartridge':
      return 'The included annual filter service covers replacement cartridge elements — parts and labour. It does not include filter housing parts or other repairs; those are quoted separately, and always before any work is done.';
    case 'DE':
      return 'The included annual filter service covers a DE filter split, disassembly, clean and recharge — parts and labour. It does not include DE grid replacement (including torn grids) or filter housing parts; those are quoted separately, and always before any work is done.';
    case 'Sand':
      return 'The included sand media replacement covers the media and the labour to change it when due. It does not include laterals, filter housing parts or other repairs; those are quoted separately, and always before any work is done.';
    default:
      return '';
  }
};

/**
 * The tailored explainer for this specific pool. Names the customer's actual
 * filter and the actual bill they won't receive — a cartridge customer should
 * read a sentence about cartridges, not a generic one covering every filter type
 * they don't own.
 */
export const filterServiceValueNote = ({ type, included }: FilterOption): string => {
  if (!included || !supportsFilterService(type)) return '';
  const priced = FILTER_SERVICE[type];
  const bill = priced ? `a random $${priced.value} bill` : 'a surprise bill';
  switch (type) {
    case 'Cartridge':
      return `Your cartridge filter replacement is built into the monthly cost. When the elements are due we simply fit them — no quote to approve, no separate invoice, and ${bill} never lands in your inbox.`;
    case 'DE':
      return `Your DE filter split, clean and recharge is built into the monthly cost. When it's due we simply do it — no quote to approve, no separate invoice, and ${bill} never lands in your inbox.`;
    case 'Sand':
      return `Your sand media replacement is built into the monthly cost. When the media is due we simply change it — no quote to approve and no separate invoice.`;
    default:
      return '';
  }
};

export const ALL_FILTER_TERMS: string[] = [
  filterServiceTerms({ type: '', included: false }),
  ...FILTER_TYPES.map((type) => filterServiceTerms({ type, included: true })),
].filter(Boolean);
