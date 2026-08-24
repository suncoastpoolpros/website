/**
 * Turn eyeballed dimensions into a defensible volume RANGE.
 *
 * WHY A RANGE AND NEVER A NUMBER. The dimensions are paced off or remembered,
 * the depth is an average of a sloping floor, and the shape factor is a
 * convention — so "8,437 gallons" on a proposal is false precision wearing a
 * confident face. A customer holding builder documents can catch a number;
 * nobody catches "8,000–9,000", because it is the truth of what we actually
 * know. The document is supposed to say "we sized your chemistry to this
 * pool", not "we measured your pool to four digits".
 *
 * The point estimate uses the same constant as the public calculator on
 * /tools/pool-volume-calculator (GAL_PER_CUFT = 7.48052), so the two tools
 * can never disagree about the same rectangle. The shape factors are the
 * industry shorthand for the single-width case — the public tool asks for
 * more measurements (two kidney widths, freeform sections) than the quote
 * form has, so its formulas are mapped down to one width here:
 *
 *   Rectangle      1.0    L × W × D exactly, as the calculator does.
 *   Round          0.785  π/4 — length and width both carry the diameter.
 *   Oval/Freeform  0.85   between a true ellipse (0.785) and the bulging
 *                         shapes builders actually pour; the range absorbs
 *                         the difference.
 *   Kidney         0.75   the 0.45 × (A + B) kidney formula collapses to
 *                         ~0.9 × W when both widths are near W; kept lower
 *                         because a single measured width is usually the
 *                         WIDE end.
 *   L-shape        0.85   a rectangle minus the notch that makes it an L.
 *   Other/blank    0.85   most Pinellas pools are freeform; still an
 *                         estimate, still a range.
 */

const GAL_PER_CUFT = 7.48052;

const SHAPE_FACTORS: Record<string, number> = {
  Rectangle: 1.0,
  Round: 0.785,
  'Oval / Freeform': 0.85,
  Kidney: 0.75,
  'L-shape': 0.85,
  Other: 0.85,
};

const num = (v: string): number => {
  const n = parseFloat(v.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * The suggestion for the builder, or null while any dimension is missing.
 *
 * The bracket is the two round numbers around the estimate — floor and
 * ceiling on a step — because that is how a person who knows pools talks:
 * "eight to nine thousand". Steps of 500 under 5,000 gallons so a spa never
 * gets a range as wide as itself.
 */
export const suggestGallonsRange = (pool: {
  length: string;
  width: string;
  avgDepth: string;
  shape: string;
}): string | null => {
  const l = num(pool.length);
  const w = num(pool.width);
  const d = num(pool.avgDepth);
  if (!l || !w || !d) return null;
  const factor = SHAPE_FACTORS[pool.shape.trim()] ?? SHAPE_FACTORS.Other;
  const v = l * w * d * GAL_PER_CUFT * factor;
  if (!Number.isFinite(v) || v <= 0) return null;
  const step = v < 5000 ? 500 : 1000;
  const low = Math.floor(v / step) * step;
  const high = low + step;
  // A pool under one step rounds to "0–500", which is a spa reading as a
  // typo. Below a step, just say "under 500".
  if (low === 0) return `under ${high.toLocaleString('en-US')}`;
  return `${low.toLocaleString('en-US')}–${high.toLocaleString('en-US')}`;
};
