import React, { useEffect, useMemo, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import {
  Calculator,
  Phone,
  MessageSquare,
  Square,
  Circle,
  Egg,
  Droplet,
  Shapes,
  Plus,
  Trash2,
  Link2,
  Check,
  Info,
  Ruler,
  Layers,
  Maximize2,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// ── constants ─────────────────────────────────────────────────────
const GAL_PER_CUFT = 7.48052;
const L_PER_GAL = 3.78541;
const FT_PER_M = 3.28084;

// Top-level calculator mode. Picks which structures we ask about and what
// the result represents.
type CalcMode = 'pool' | 'pool+spa' | 'spa';

type Shape = 'rectangle' | 'round' | 'oval' | 'kidney' | 'freeform';
type LenUnit = 'ft' | 'm';
type VolUnit = 'gal' | 'L';
type DepthMode = 'avg' | 'slope' | 'sections';
type FreeformSectionShape = 'rectangle' | 'round';

interface FreeformSection {
  id: string;
  shape: FreeformSectionShape;
  length: string;
  width: string;
  diameter: string;
  depth: string;
}

const SHAPES: { id: Shape; label: string; icon: typeof Square }[] = [
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'round', label: 'Round', icon: Circle },
  { id: 'oval', label: 'Oval', icon: Egg },
  { id: 'kidney', label: 'Kidney', icon: Droplet },
  { id: 'freeform', label: 'Freeform', icon: Shapes },
];

// HowTo JSON-LD — covers every step a homeowner takes.
const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to calculate your swimming pool volume in gallons',
  description:
    'Estimate how many gallons of water your swimming pool holds using its shape, dimensions, and average depth — including rectangle, round, oval, kidney, and freeform pools.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Pick your pool shape', text: 'Choose rectangle, round, oval, kidney, or freeform.' },
    { '@type': 'HowToStep', position: 2, name: 'Enter the dimensions', text: 'Enter length and width (or diameter) in feet or meters.' },
    { '@type': 'HowToStep', position: 3, name: 'Enter the depth', text: 'Use a single average depth, or enter shallow- and deep-end depths to auto-average.' },
    { '@type': 'HowToStep', position: 4, name: 'Read your volume', text: 'The calculator estimates your pool volume in gallons or liters.' },
  ],
};

// Common-questions content. Used both for the on-page section AND the
// FAQPage JSON-LD below — single source of truth.
const COMMON_QUESTIONS: { q: string; a: string }[] = [
  {
    q: 'How many gallons in a 16 × 32 pool?',
    a: 'A 16-by-32-foot rectangular pool holds roughly 19,150 gallons at an average depth of 5 feet, or about 23,000 gallons at 6 feet of average depth. Depth makes the biggest difference: every extra foot of average depth adds about 16 × 32 × 7.48 = 3,830 gallons.',
  },
  {
    q: "How do I measure my pool's average depth?",
    a: 'If your pool has a sloped bottom, add the shallow-end depth and the deep-end depth, then divide by two. That gives you the average for a uniform slope. For pools with a flat shallow section, a sloped middle, and a flat deep end, the sloped-sections mode in this calculator handles the geometry more precisely — measure each section length and the two depths.',
  },
  {
    q: 'How many gallons is a typical residential pool?',
    a: "Most in-ground residential pools in the US hold between 15,000 and 30,000 gallons. A common 16 × 32 with a 3-foot to 8-foot slope lands around 21,000 gallons. Above-ground pools are smaller: a 24-foot round above-ground pool at 4 feet deep is about 13,500 gallons.",
  },
  {
    q: 'How is a spa or hot tub different from a pool for volume?',
    a: "Spas and hot tubs are much smaller — most residential spas hold 300 to 1,000 gallons. The math is the same (cylinder or rectangular box), but spas often have a seat or step bench that takes up water space. Use the 'Spa has a seat / step bench' option in this calculator to subtract that bench from the footwell volume automatically.",
  },
  {
    q: 'How do I convert gallons to liters?',
    a: 'Multiply gallons by 3.785 to get liters. So a 20,000-gallon pool is about 75,700 liters. This calculator displays both — just toggle "Gallons" or "Liters" at the top.',
  },
];

const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: COMMON_QUESTIONS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

// ── helpers ───────────────────────────────────────────────────────
const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const toFeet = (v: number, unit: LenUnit) => (unit === 'm' ? v * FT_PER_M : v);

// Volume (gallons) for a single shape from raw input strings (in user's unit).
const volumeGallons = (
  shape: Exclude<Shape, 'freeform'> | FreeformSectionShape,
  inputs: { length?: string; width?: string; diameter?: string; depth: string },
  unit: LenUnit,
) => {
  const d = toFeet(num(inputs.depth), unit);
  if (!d) return 0;
  let area = 0;
  if (shape === 'rectangle') {
    area = toFeet(num(inputs.length || ''), unit) * toFeet(num(inputs.width || ''), unit);
  } else if (shape === 'round') {
    const r = toFeet(num(inputs.diameter || ''), unit) / 2;
    area = Math.PI * r * r;
  } else if (shape === 'oval') {
    area =
      Math.PI *
      (toFeet(num(inputs.length || ''), unit) / 2) *
      (toFeet(num(inputs.width || ''), unit) / 2);
  } else if (shape === 'kidney') {
    // Industry formula: 0.45 × (A + B) × L × depth, where A and B are the two
    // bulge widths and L is the overall length. We map length=L, width=A,
    // and the second width is captured separately in inputs.diameter.
    const A = toFeet(num(inputs.width || ''), unit);
    const B = toFeet(num(inputs.diameter || ''), unit);
    const L = toFeet(num(inputs.length || ''), unit);
    return 0.45 * (A + B) * L * d * GAL_PER_CUFT;
  }
  return area > 0 ? area * d * GAL_PER_CUFT : 0;
};

// Section-accurate rectangle volume: a pool modeled as shallow flat + slope
// wedge + deep flat. A wedge averages to the midpoint of its two depths, so
// the total in cubic feet is W × (Ls·Ds + Lslope·(Ds+Dd)/2 + Ld·Dd). All
// inputs in feet. Returns gallons.
const volumeSlopedSections = (
  totalLenFt: number,
  widthFt: number,
  shallowLenFt: number,
  deepLenFt: number,
  shallowDepthFt: number,
  deepDepthFt: number,
) => {
  if (!totalLenFt || !widthFt || !shallowDepthFt || !deepDepthFt) return 0;
  const Ls = Math.max(0, Math.min(shallowLenFt, totalLenFt));
  const Ld = Math.max(0, Math.min(deepLenFt, totalLenFt - Ls));
  const Lslope = Math.max(0, totalLenFt - Ls - Ld);
  const wedgeAvg = (shallowDepthFt + deepDepthFt) / 2;
  const cuft = widthFt * (Ls * shallowDepthFt + Lslope * wedgeAvg + Ld * deepDepthFt);
  return cuft * GAL_PER_CUFT;
};

const formatGallons = (g: number, unit: VolUnit) =>
  Math.round(unit === 'L' ? g * L_PER_GAL : g).toLocaleString('en-US');

const newSection = (): FreeformSection => ({
  id: Math.random().toString(36).slice(2, 8),
  shape: 'rectangle',
  length: '',
  width: '',
  diameter: '',
  depth: '',
});

// Common pool sizes table (always in feet/gallons; we convert on display).
const REFERENCE_SIZES = [
  { shape: 'Rectangle' as const, size: '10 × 20 × 5 ft', gallons: 7480 },
  { shape: 'Rectangle' as const, size: '12 × 24 × 5 ft', gallons: 10771 },
  { shape: 'Rectangle' as const, size: '14 × 28 × 5 ft', gallons: 14661 },
  { shape: 'Rectangle' as const, size: '16 × 32 × 5 ft', gallons: 19149 },
  { shape: 'Rectangle' as const, size: '16 × 32 × 6 ft', gallons: 22979 },
  { shape: 'Rectangle' as const, size: '20 × 40 × 5 ft', gallons: 29922 },
  { shape: 'Round' as const, size: '15 ft Ø × 4 ft', gallons: 5288 },
  { shape: 'Round' as const, size: '18 ft Ø × 4 ft', gallons: 7615 },
  { shape: 'Round' as const, size: '24 ft Ø × 4 ft', gallons: 13540 },
  { shape: 'Round' as const, size: '27 ft Ø × 4 ft', gallons: 17137 },
  { shape: 'Oval' as const, size: '15 × 30 × 4 ft', gallons: 10579 },
  { shape: 'Oval' as const, size: '18 × 33 × 4 ft', gallons: 13961 },
];

// ── styles ────────────────────────────────────────────────────────
const fieldClass =
  'w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white text-[15px] placeholder-gray-500 focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/30 transition';
const labelClass = 'block text-sm font-semibold text-gray-300 mb-1.5';

// ── shape diagrams (inline SVGs) ──────────────────────────────────
const DIAGRAMS: Record<Exclude<Shape, 'freeform'>, React.ReactElement> = {
  rectangle: (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      <rect x="20" y="20" width="160" height="70" rx="6" fill="rgba(255,114,15,0.10)" stroke="#ff720f" strokeWidth="2" />
      <text x="100" y="60" textAnchor="middle" fontSize="11" fill="#9ca3af">Length × Width</text>
      <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#6b7280">L</text>
      <text x="10" y="58" textAnchor="middle" fontSize="10" fill="#6b7280">W</text>
    </svg>
  ),
  round: (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      <circle cx="100" cy="55" r="44" fill="rgba(255,114,15,0.10)" stroke="#ff720f" strokeWidth="2" />
      <line x1="56" y1="55" x2="144" y2="55" stroke="#6b7280" strokeDasharray="3 3" />
      <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#9ca3af">Diameter (Ø)</text>
    </svg>
  ),
  oval: (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      <ellipse cx="100" cy="55" rx="76" ry="34" fill="rgba(255,114,15,0.10)" stroke="#ff720f" strokeWidth="2" />
      <text x="100" y="59" textAnchor="middle" fontSize="11" fill="#9ca3af">Length × Width</text>
    </svg>
  ),
  kidney: (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      <path
        d="M 30 55 Q 30 15, 80 20 Q 110 25, 120 50 Q 130 30, 170 35 Q 195 55, 170 80 Q 130 95, 105 80 Q 80 95, 55 90 Q 30 85, 30 55 Z"
        fill="rgba(255,114,15,0.10)"
        stroke="#ff720f"
        strokeWidth="2"
      />
      <text x="60" y="58" textAnchor="middle" fontSize="9" fill="#9ca3af">A</text>
      <text x="160" y="58" textAnchor="middle" fontSize="9" fill="#9ca3af">B</text>
      <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#9ca3af">Length (L)</text>
    </svg>
  ),
};

// ── Sloped-section side-profile diagram with draggable handles ────
// Renders a side view of the pool (waterline + bottom contour). Two handles
// mark where the shallow flat ends and where the deep flat begins. Drag uses
// pointer events so it works on mouse + touch. All values are in feet.
type SlopeProfileProps = {
  totalLenFt: number;
  shallowLenFt: number;
  deepLenFt: number;
  shallowDepthFt: number;
  deepDepthFt: number;
  unitLabel: string;
  onChange: (shallowLenFt: number, deepLenFt: number) => void;
  /** When true, overlay an animated cursor hint sweeping between the two
      handles to signal that they're draggable. The parent dismisses it on
      first interaction or after a timeout. */
  showHint?: boolean;
  /** Called when the user starts dragging a handle — parent dismisses hint. */
  onInteract?: () => void;
};

const SlopeProfile: React.FC<SlopeProfileProps> = ({
  totalLenFt,
  shallowLenFt,
  deepLenFt,
  shallowDepthFt,
  deepDepthFt,
  unitLabel,
  onChange,
  showHint = false,
  onInteract,
}) => {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const VB_W = 600;
  const VB_H = 260;
  const PAD_X = 40;
  const POOL_TOP = 60;
  const POOL_BOTTOM_MAX = 230;
  const innerW = VB_W - PAD_X * 2;
  const maxDepth = Math.max(shallowDepthFt, deepDepthFt, 1);
  const depthToY = (d: number) => POOL_TOP + (d / maxDepth) * (POOL_BOTTOM_MAX - POOL_TOP);

  // Map ft → SVG x.
  const ftToX = (ft: number) => PAD_X + (totalLenFt > 0 ? (ft / totalLenFt) * innerW : 0);
  const xToFt = (x: number) => (totalLenFt > 0 ? ((x - PAD_X) / innerW) * totalLenFt : 0);

  const shallowEndX = ftToX(shallowLenFt);
  const deepStartX = ftToX(totalLenFt - deepLenFt);
  const yShallow = depthToY(shallowDepthFt);
  const yDeep = depthToY(deepDepthFt);

  const draggingRef = React.useRef<'shallow' | 'deep' | null>(null);

  const onPointerDown = (which: 'shallow' | 'deep') => (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    e.preventDefault();
    // Capture on the SVG itself so subsequent pointermove/pointerup fire on
    // the SVG handlers — capturing on the handle would route them off the SVG.
    svgRef.current.setPointerCapture?.(e.pointerId);
    draggingRef.current = which;
    onInteract?.();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * VB_W;
    const ft = Math.max(0, Math.min(totalLenFt, xToFt(svgX)));
    if (draggingRef.current === 'shallow') {
      // shallow length: can't exceed total - current deep
      const maxLs = Math.max(0, totalLenFt - deepLenFt);
      const ls = Math.min(ft, maxLs);
      onChange(ls, deepLenFt);
    } else {
      // deep start in ft → deep length = total - start
      const ld = Math.max(0, Math.min(totalLenFt - ft, totalLenFt - shallowLenFt));
      onChange(shallowLenFt, ld);
    }
  };
  const onPointerUp = () => {
    draggingRef.current = null;
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label="Pool side profile — drag the handles to set the shallow and deep sections"
      className="w-full h-auto touch-none select-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Water (top to slope contour) */}
      <defs>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1669AE" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1669AE" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Pool outline (background area) */}
      <path
        d={`M ${PAD_X} ${POOL_TOP}
            L ${VB_W - PAD_X} ${POOL_TOP}
            L ${VB_W - PAD_X} ${yDeep}
            L ${deepStartX} ${yDeep}
            L ${shallowEndX} ${yShallow}
            L ${PAD_X} ${yShallow} Z`}
        fill="url(#waterGrad)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />

      {/* Waterline */}
      <line
        x1={PAD_X}
        y1={POOL_TOP}
        x2={VB_W - PAD_X}
        y2={POOL_TOP}
        stroke="#4a93d1"
        strokeWidth="2"
      />

      {/* Section dividers (faint dashed verticals at handle positions) */}
      <line x1={shallowEndX} y1={POOL_TOP} x2={shallowEndX} y2={yShallow} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />
      <line x1={deepStartX} y1={POOL_TOP} x2={deepStartX} y2={yDeep} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />

      {/* Depth labels */}
      <g fontFamily="ui-sans-serif, system-ui" fontSize="13" fill="#e5e7eb">
        <rect x={PAD_X + 12} y={POOL_TOP + (yShallow - POOL_TOP) / 2 - 12} width="46" height="22" rx="4" fill="#1669AE" />
        <text x={PAD_X + 35} y={POOL_TOP + (yShallow - POOL_TOP) / 2 + 4} textAnchor="middle" fontWeight="600">
          {shallowDepthFt.toFixed(1)}'
        </text>
        <rect x={VB_W - PAD_X - 58} y={POOL_TOP + (yDeep - POOL_TOP) / 2 - 12} width="46" height="22" rx="4" fill="#1669AE" />
        <text x={VB_W - PAD_X - 35} y={POOL_TOP + (yDeep - POOL_TOP) / 2 + 4} textAnchor="middle" fontWeight="600">
          {deepDepthFt.toFixed(1)}'
        </text>
      </g>

      {/* Section length labels (below the pool) */}
      <g fontFamily="ui-sans-serif, system-ui" fontSize="11" fill="#9ca3af">
        <text x={(PAD_X + shallowEndX) / 2} y={VB_H - 12} textAnchor="middle">
          Shallow: {shallowLenFt.toFixed(1)} {unitLabel}
        </text>
        <text x={(shallowEndX + deepStartX) / 2} y={VB_H - 12} textAnchor="middle">
          Slope: {Math.max(0, totalLenFt - shallowLenFt - deepLenFt).toFixed(1)} {unitLabel}
        </text>
        <text x={(deepStartX + (VB_W - PAD_X)) / 2} y={VB_H - 12} textAnchor="middle">
          Deep: {deepLenFt.toFixed(1)} {unitLabel}
        </text>
      </g>

      {/* Draggable handles — larger hit target underneath, visible cap on top */}
      <g style={{ cursor: 'ew-resize' }}>
        <circle
          cx={shallowEndX}
          cy={POOL_TOP}
          r="22"
          fill="transparent"
          onPointerDown={onPointerDown('shallow')}
        />
        <circle cx={shallowEndX} cy={POOL_TOP} r="9" fill="#ff720f" stroke="white" strokeWidth="2" pointerEvents="none" />

        <circle
          cx={deepStartX}
          cy={POOL_TOP}
          r="22"
          fill="transparent"
          onPointerDown={onPointerDown('deep')}
        />
        <circle cx={deepStartX} cy={POOL_TOP} r="9" fill="#ff720f" stroke="white" strokeWidth="2" pointerEvents="none" />
      </g>

      {/* Drag-hint cursor — animates ABOVE the handles on a dedicated white
          guide line so it visually says "drag along this axis" without
          competing with the actual handles on the waterline. Parent controls
          visibility via showHint, dismisses on first interaction or timeout. */}
      <AnimatePresence>
        {showHint && (
          <m.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            pointerEvents="none"
            aria-hidden="true"
          >
            {(() => {
              // Hint track sits 28px ABOVE the waterline so it's clearly its
              // own layer, separate from the orange handles below. The cursor
              // sweeps a SHORT range centered on the deep (right) handle —
              // enough motion to suggest "you can drag this" without
              // wandering across the whole pool.
              const HINT_Y = POOL_TOP - 28;
              const HINT_RANGE = 40; // pixels left/right of the handle center
              const HINT_LEFT = deepStartX - HINT_RANGE;
              const HINT_RIGHT = deepStartX + HINT_RANGE;
              return (
                <>
                  {/* Short white guide line, centered on the deep handle's x. */}
                  <line
                    x1={HINT_LEFT}
                    y1={HINT_Y}
                    x2={HINT_RIGHT}
                    y2={HINT_Y}
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="1.5"
                  />
                  {/* The cursor + pulse group sweeps left↔right along the
                      short track. Runs 2 full back-and-forth cycles (initial
                      + 1 repeat) then stops — the parent auto-dismiss
                      timeout is sized to match so the flag persists. */}
                  <m.g
                    animate={{
                      x: [HINT_LEFT, HINT_RIGHT, HINT_LEFT],
                    }}
                    transition={{
                      duration: 2.6,
                      repeat: 1,
                      ease: 'easeInOut',
                      times: [0, 0.5, 1],
                    }}
                  >
                    {/* Soft pulse ring under the cursor — breathing effect. */}
                    <m.circle
                      cx={0}
                      cy={HINT_Y}
                      r={12}
                      fill="white"
                      opacity={0.18}
                      animate={{ scale: [1, 1.6, 1], opacity: [0.25, 0, 0.25] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                      style={{ transformOrigin: `0px ${HINT_Y}px` }}
                    />
                    {/* Cursor pointer icon — classic arrow. Tip anchored on
                        the guide line, body angles down-right. */}
                    <path
                      d="M0 0 L0 16 L4 12 L7 18 L9 17 L6 11 L11 11 Z"
                      transform={`translate(-2 ${HINT_Y - 2})`}
                      fill="white"
                      stroke="rgba(0,0,0,0.4)"
                      strokeWidth="0.8"
                    />
                  </m.g>
                </>
              );
            })()}
          </m.g>
        )}
      </AnimatePresence>
    </svg>
  );
};

// ── Spa cross-section diagram (round or rect spa with a seat/step bench) ─
type SpaCrossSectionProps = {
  topW: number;        // top width or diameter (user unit)
  botW: number;        // bottom width or diameter (user unit)
  aboveD: number;      // above-seat depth (user unit)
  belowD: number;      // below-seat depth (user unit)
  seatW: number;       // seat bench depth (each side) — visual only
  unitLabel: string;
};
const SpaCrossSection: React.FC<SpaCrossSectionProps> = ({ topW, botW, aboveD, belowD, seatW, unitLabel }) => {
  const VB_W = 320;
  const VB_H = 240;
  const PAD_X = 30;
  const TOP_Y = 30;
  const innerW = VB_W - PAD_X * 2;
  const totalD = (aboveD || 0) + (belowD || 0) || 1;
  // Available vertical space for the spa body.
  const BODY_H = 170;
  const aboveH = (aboveD / totalD) * BODY_H;
  const belowH = (belowD / totalD) * BODY_H;

  const maxW = Math.max(topW, botW, 1);
  const topPx = (topW / maxW) * innerW;
  const botPx = (botW / maxW) * innerW;
  const topX = PAD_X + (innerW - topPx) / 2;
  const botX = PAD_X + (innerW - botPx) / 2;
  const seatY = TOP_Y + aboveH;
  const bottomY = TOP_Y + aboveH + belowH;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" role="img" aria-label="Spa side profile with seat bench">
      <defs>
        <linearGradient id="spaWaterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1669AE" stopOpacity="0.40" />
          <stop offset="100%" stopColor="#1669AE" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {/* Spa shell (T-shape: wider top above seat, narrower bottom below) */}
      <path
        d={`M ${topX} ${TOP_Y}
            L ${topX + topPx} ${TOP_Y}
            L ${topX + topPx} ${seatY}
            L ${botX + botPx} ${seatY}
            L ${botX + botPx} ${bottomY}
            L ${botX} ${bottomY}
            L ${botX} ${seatY}
            L ${topX} ${seatY} Z`}
        fill="url(#spaWaterGrad)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />

      {/* Waterline */}
      <line x1={topX} y1={TOP_Y} x2={topX + topPx} y2={TOP_Y} stroke="#4a93d1" strokeWidth="2" />

      {/* Seat shelves — small dashed rectangles on either side at the seat
          line, labeled with the seat width if provided. Purely visual. */}
      {aboveD > 0 && belowD > 0 && seatW > 0 && (
        <>
          {/* Left shelf */}
          <rect
            x={topX}
            y={seatY - 4}
            width={Math.max(0, botX - topX)}
            height="8"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.20)"
            strokeDasharray="2 2"
          />
          {/* Right shelf */}
          <rect
            x={botX + botPx}
            y={seatY - 4}
            width={Math.max(0, (topX + topPx) - (botX + botPx))}
            height="8"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.20)"
            strokeDasharray="2 2"
          />
          {/* Seat width callout on the left shelf */}
          <text
            x={topX + Math.max(0, (botX - topX)) / 2}
            y={seatY - 8}
            textAnchor="middle"
            fontSize="9"
            fill="#9ca3af"
            fontFamily="ui-sans-serif"
          >
            {seatW.toFixed(1)} {unitLabel}
          </text>
        </>
      )}
      {/* Seat label (only meaningful if there's an above section) */}
      {aboveD > 0 && belowD > 0 && (
        <text x={VB_W / 2} y={seatY + 14} textAnchor="middle" fontSize="11" fill="#9ca3af" fontFamily="ui-sans-serif">
          SEAT
        </text>
      )}

      {/* Top width label */}
      <line x1={topX} y1={TOP_Y - 12} x2={topX + topPx} y2={TOP_Y - 12} stroke="rgba(74,147,209,0.6)" strokeDasharray="3 3" />
      <text x={topX + topPx / 2} y={TOP_Y - 16} textAnchor="middle" fontSize="11" fill="#4a93d1" fontWeight="600">
        {topW > 0 ? topW.toFixed(1) : '—'} {unitLabel}
      </text>

      {/* Bottom width label */}
      {botW > 0 && (
        <>
          <line x1={botX} y1={bottomY + 14} x2={botX + botPx} y2={bottomY + 14} stroke="rgba(74,147,209,0.6)" strokeDasharray="3 3" />
          <text x={botX + botPx / 2} y={bottomY + 30} textAnchor="middle" fontSize="11" fill="#4a93d1" fontWeight="600">
            {botW.toFixed(1)} {unitLabel}
          </text>
        </>
      )}

      <text x={VB_W / 2} y={VB_H - 6} textAnchor="middle" fontSize="10" fill="#6b7280">
        Cross-section view
      </text>
    </svg>
  );
};

// ── Simple spa side-view diagram (no seat — uniform width). ─────
type SimpleSpaDiagramProps = {
  topW: number;
  depth: number;
  unitLabel: string;
};
const SimpleSpaDiagram: React.FC<SimpleSpaDiagramProps> = ({ topW, depth, unitLabel }) => {
  const VB_W = 320;
  const VB_H = 180;
  const PAD_X = 50;
  const PAD_Y_TOP = 30;
  const PAD_Y_BOT = 30;
  const innerW = VB_W - PAD_X * 2;
  const innerH = VB_H - PAD_Y_TOP - PAD_Y_BOT;
  // Scale: keep width<=innerW. We don't strictly visualize depth proportional
  // to width — that gets weird at extreme ratios. Use a fixed depth/width
  // visual ratio so the diagram always reads as a "spa side view".
  const w = topW > 0 ? innerW : innerW * 0.7;
  const h = depth > 0 ? Math.min(innerH, innerH * 0.85) : innerH * 0.5;
  const x = PAD_X + (innerW - w) / 2;
  const y = PAD_Y_TOP;
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" role="img" aria-label="Spa side view">
      <defs>
        <linearGradient id="simpleSpaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1669AE" stopOpacity="0.40" />
          <stop offset="100%" stopColor="#1669AE" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill="url(#simpleSpaGrad)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      {/* Waterline */}
      <line x1={x} y1={y} x2={x + w} y2={y} stroke="#4a93d1" strokeWidth="2" />
      {/* Width callout (top) */}
      <line x1={x} y1={y - 12} x2={x + w} y2={y - 12} stroke="rgba(74,147,209,0.6)" strokeDasharray="3 3" />
      <text x={x + w / 2} y={y - 16} textAnchor="middle" fontSize="11" fill="#4a93d1" fontWeight="600">
        {topW > 0 ? topW.toFixed(1) : '—'} {unitLabel}
      </text>
      {/* Depth callout (right side) */}
      <line x1={x + w + 10} y1={y} x2={x + w + 10} y2={y + h} stroke="rgba(74,147,209,0.6)" strokeDasharray="3 3" />
      <text x={x + w + 22} y={y + h / 2 + 4} fontSize="11" fill="#4a93d1" fontWeight="600">
        {depth > 0 ? depth.toFixed(1) : '—'} {unitLabel}
      </text>
      <text x={VB_W / 2} y={VB_H - 6} textAnchor="middle" fontSize="10" fill="#6b7280">
        Side view
      </text>
    </svg>
  );
};

// ── URL serialization ────────────────────────────────────────────
const SHARE_KEYS = ['shape', 'l', 'w', 'd', 's', 'deep', 'shallow', 'u', 'v', 'mode'] as const;

const PoolVolumeCalculatorInner = () => {
  // SEO meta via usePageMeta so title/description/canonical/OG land in the
  // PRERENDERED HTML (runs synchronously during renderToString). Previously
  // these were set in a client effect, which shipped the homepage's defaults
  // (wrong title + canonical → "/") in the static HTML Google indexes.
  // See CLAUDE.md #9. JSON-LD stays in the effect below (the documented
  // exception — usePageMeta doesn't emit JSON-LD).
  usePageMeta({
    title: 'Free Pool Volume Calculator (Gallons + Liters) | Suncoast Pool Pros',
    description:
      'Free pool volume calculator — instantly get gallons or liters for rectangle, round, oval, kidney, freeform pools, plus spas. No email required.',
    canonicalPath: '/tools/pool-volume-calculator/',
    ogImage: '/logo.svg',
  });

  const { open: openQuoteSheet } = useQuoteSheet();
  const [shape, setShape] = useState<Shape>('rectangle');
  const [lengthUnit, setLengthUnit] = useState<LenUnit>('ft');
  const [volumeUnit, setVolumeUnit] = useState<VolUnit>('gal');
  // Default to sloped sections — most real residential pools have a slope, and
  // it gives a more accurate volume than a flat average. (Only valid for
  // rectangle; the URL-hydration effect below downgrades it for other shapes.)
  const [depthMode, setDepthMode] = useState<DepthMode>('sections');

  // Shared single-shape inputs. Prefilled with a typical 16×32 residential
  // pool so the calculator never looks empty on first load. Any URL params
  // override these in the hydration effect below.
  const [length, setLength] = useState('32');
  const [width, setWidth] = useState('16');
  const [diameter, setDiameter] = useState('');
  const [avgDepth, setAvgDepth] = useState('');
  const [shallowDepth, setShallowDepth] = useState('3.5');
  const [deepDepth, setDeepDepth] = useState('5.5');
  // Sloped-section lengths in FEET (internal), set by dragging the diagram
  // handles. Default split = 30% shallow / 40% slope / 30% deep of the pool's
  // length, re-derived on the fly from the current length input.
  const [shallowLenFt, setShallowLenFt] = useState<number | null>(null);
  const [deepLenFt, setDeepLenFt] = useState<number | null>(null);

  // Top-level mode (Pool / Pool + Spa / Spa). Drives which fields render.
  const [calcMode, setCalcMode] = useState<CalcMode>('pool');

  // Spa (most FL spillover spas share water with the pool — for dosing we
  // want a single combined total; the breakdown is shown below the result).
  // Derived from calcMode: spa fields are active in 'pool+spa' and 'spa'.
  const spaEnabled = calcMode !== 'pool';
  const [spaShape, setSpaShape] = useState<'round' | 'rectangle'>('round');
  const [spaDiameter, setSpaDiameter] = useState('');
  const [spaLength, setSpaLength] = useState('');
  const [spaWidth, setSpaWidth] = useState('');
  const [spaDepth, setSpaDepth] = useState('');
  // Spa with a seat/step bench (two stacked sections, top wider than bottom).
  const [spaHasSeat, setSpaHasSeat] = useState(false);
  const [spaTopDiameter, setSpaTopDiameter] = useState('');
  const [spaBottomDiameter, setSpaBottomDiameter] = useState('');
  const [spaTopLength, setSpaTopLength] = useState('');
  const [spaTopWidth, setSpaTopWidth] = useState('');
  const [spaBottomLength, setSpaBottomLength] = useState('');
  const [spaBottomWidth, setSpaBottomWidth] = useState('');
  const [spaAboveSeatDepth, setSpaAboveSeatDepth] = useState('');
  const [spaBelowSeatDepth, setSpaBelowSeatDepth] = useState('');
  // How wide the seat bench is on each side. Doesn't affect volume (water
  // doesn't fill the bench itself) — used to render the cross-section more
  // accurately and to derive a sensible footwell width if the user enters
  // only this and the top diameter.
  const [spaSeatWidth, setSpaSeatWidth] = useState('');

  // Freeform sections.
  const [sections, setSections] = useState<FreeformSection[]>([newSection()]);

  const [copied, setCopied] = useState(false);

  // First-visit drag hint for the sloped-sections diagram. Suppressed if the
  // user has seen it before (localStorage flag) or has reduced-motion enabled.
  const SLOPE_HINT_KEY = 'spp-slope-hint-seen';
  const [showSlopeHint, setShowSlopeHint] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(SLOPE_HINT_KEY) === '1') return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      setShowSlopeHint(true);
    } catch {
      /* localStorage may be unavailable (e.g. SSR or private mode) — fail open
         and just don't show the hint rather than crashing. */
    }
  }, []);
  // Auto-dismiss the hint after the cursor has run its 2 back-and-forth
  // cycles (2 × 2.6s = 5.2s, plus a 400ms buffer). The cursor stops
  // animating on its own; this timeout fades the group out and persists the
  // localStorage flag so the hint doesn't replay on the next visit.
  useEffect(() => {
    if (!showSlopeHint) return;
    const t = window.setTimeout(() => {
      setShowSlopeHint(false);
      try { localStorage.setItem(SLOPE_HINT_KEY, '1'); } catch {}
    }, 5600);
    return () => window.clearTimeout(t);
  }, [showSlopeHint]);
  const dismissSlopeHint = () => {
    if (!showSlopeHint) return;
    setShowSlopeHint(false);
    try { localStorage.setItem(SLOPE_HINT_KEY, '1'); } catch {}
  };

  // Hydrate from share URL (parse once).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('shape') as Shape | null;
    if (s && SHAPES.some((sh) => sh.id === s)) setShape(s);
    const u = params.get('u');
    if (u === 'm' || u === 'ft') setLengthUnit(u);
    const v = params.get('v');
    if (v === 'L' || v === 'gal') setVolumeUnit(v);
    const mode = params.get('mode');
    if (mode === 'slope' || mode === 'avg' || mode === 'sections') setDepthMode(mode);
    const ls = parseFloat(params.get('ls') || '');
    const ld = parseFloat(params.get('ld') || '');
    if (Number.isFinite(ls) && ls >= 0) setShallowLenFt(ls);
    if (Number.isFinite(ld) && ld >= 0) setDeepLenFt(ld);
    // Spa params.
    // New explicit mode param takes precedence. Old ?spa=1 maps to 'pool+spa'
    // for backward compatibility with shared links from earlier versions.
    const calc = params.get('calc');
    if (calc === 'pool' || calc === 'pool+spa' || calc === 'spa') {
      setCalcMode(calc);
    } else if (params.get('spa') === '1') {
      setCalcMode('pool+spa');
    }
    const spaSh = params.get('spaShape');
    if (spaSh === 'round' || spaSh === 'rectangle') setSpaShape(spaSh);
    if (params.get('spad')) setSpaDiameter(params.get('spad')!);
    if (params.get('spal')) setSpaLength(params.get('spal')!);
    if (params.get('spaw')) setSpaWidth(params.get('spaw')!);
    if (params.get('spadep')) setSpaDepth(params.get('spadep')!);
    // Spa with seat params.
    if (params.get('spaSeat') === '1') setSpaHasSeat(true);
    if (params.get('spatd')) setSpaTopDiameter(params.get('spatd')!);
    if (params.get('spabd')) setSpaBottomDiameter(params.get('spabd')!);
    if (params.get('spatl')) setSpaTopLength(params.get('spatl')!);
    if (params.get('spatw')) setSpaTopWidth(params.get('spatw')!);
    if (params.get('spabl')) setSpaBottomLength(params.get('spabl')!);
    if (params.get('spabw')) setSpaBottomWidth(params.get('spabw')!);
    if (params.get('spaad')) setSpaAboveSeatDepth(params.get('spaad')!);
    if (params.get('spabld')) setSpaBelowSeatDepth(params.get('spabld')!);
    if (params.get('spasw')) setSpaSeatWidth(params.get('spasw')!);
    if (params.get('l')) setLength(params.get('l')!);
    if (params.get('w')) setWidth(params.get('w')!);
    if (params.get('d')) setDiameter(params.get('d')!);
    if (params.get('s')) setAvgDepth(params.get('s')!);
    if (params.get('shallow')) setShallowDepth(params.get('shallow')!);
    if (params.get('deep')) setDeepDepth(params.get('deep')!);
  }, []);

  // HowTo + FAQPage JSON-LD (two structured-data signals on one page). Injected
  // client-side — usePageMeta (above) handles title/description/canonical/OG in
  // the prerendered HTML, but doesn't emit JSON-LD, so this slim effect adds it
  // (same pattern as the city pages' usePageSchema). See CLAUDE.md #9.
  useEffect(() => {
    const howToScript = document.createElement('script');
    howToScript.type = 'application/ld+json';
    howToScript.text = JSON.stringify(howToSchema);
    document.head.appendChild(howToScript);

    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.text = JSON.stringify(faqPageSchema);
    document.head.appendChild(faqScript);

    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.text = JSON.stringify(
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Pool Tools', path: '/tools/' },
        { name: 'Pool Volume Calculator', path: '/tools/pool-volume-calculator/' },
      ]),
    );
    document.head.appendChild(breadcrumbScript);

    return () => {
      howToScript.remove();
      faqScript.remove();
      breadcrumbScript.remove();
    };
  }, []);

  // Resolved depth in feet (handles avg vs slope mode).
  const resolvedDepthFt = useMemo(() => {
    if (depthMode === 'avg') return toFeet(num(avgDepth), lengthUnit);
    const s = toFeet(num(shallowDepth), lengthUnit);
    const d = toFeet(num(deepDepth), lengthUnit);
    if (s && d) return (s + d) / 2;
    return 0;
  }, [depthMode, avgDepth, shallowDepth, deepDepth, lengthUnit]);

  // Pack depth back into the inputs object expected by volumeGallons.
  const depthStr = useMemo(() => {
    if (!resolvedDepthFt) return '';
    // Convert resolved ft back to whatever unit volumeGallons expects via `unit`.
    return lengthUnit === 'm' ? String(resolvedDepthFt / FT_PER_M) : String(resolvedDepthFt);
  }, [resolvedDepthFt, lengthUnit]);

  // Gallons for the active shape.
  // Total length in feet (used by the sloped-sections diagram + math).
  const totalLenFt = useMemo(() => toFeet(num(length), lengthUnit), [length, lengthUnit]);
  const widthFt = useMemo(() => toFeet(num(width), lengthUnit), [width, lengthUnit]);
  const shallowDepthFt = useMemo(
    () => toFeet(num(shallowDepth), lengthUnit),
    [shallowDepth, lengthUnit],
  );
  const deepDepthFt = useMemo(
    () => toFeet(num(deepDepth), lengthUnit),
    [deepDepth, lengthUnit],
  );

  // Effective section lengths. Defaults to a 30/40/30 split of total length;
  // overridden by user-set values from the draggable handles.
  const effShallowLenFt = useMemo(() => {
    if (shallowLenFt !== null) return Math.max(0, Math.min(shallowLenFt, totalLenFt));
    return totalLenFt * 0.3;
  }, [shallowLenFt, totalLenFt]);
  const effDeepLenFt = useMemo(() => {
    if (deepLenFt !== null) {
      return Math.max(0, Math.min(deepLenFt, totalLenFt - effShallowLenFt));
    }
    return totalLenFt * 0.3;
  }, [deepLenFt, totalLenFt, effShallowLenFt]);

  const gallons = useMemo(() => {
    // In spa-only mode the pool doesn't contribute to the total.
    if (calcMode === 'spa') return 0;
    if (shape === 'freeform') {
      return sections.reduce(
        (sum, sec) =>
          sum +
          volumeGallons(
            sec.shape,
            {
              length: sec.length,
              width: sec.width,
              diameter: sec.diameter,
              depth: sec.depth,
            },
            lengthUnit,
          ),
        0,
      );
    }
    if (shape === 'rectangle' && depthMode === 'sections') {
      return volumeSlopedSections(
        totalLenFt,
        widthFt,
        effShallowLenFt,
        effDeepLenFt,
        shallowDepthFt,
        deepDepthFt,
      );
    }
    return volumeGallons(shape, { length, width, diameter, depth: depthStr }, lengthUnit);
  }, [
    calcMode,
    shape,
    length,
    width,
    diameter,
    depthStr,
    lengthUnit,
    sections,
    depthMode,
    totalLenFt,
    widthFt,
    effShallowLenFt,
    effDeepLenFt,
    shallowDepthFt,
    deepDepthFt,
  ]);

  // Spa gallons — only counted when the toggle is on. Most spas in Florida
  // are round; we also support a small rectangular spa. When the spa has a
  // seat/step bench, the volume is modeled as two stacked sections (top wider
  // above the seat, bottom narrower below it).
  const spaGallons = useMemo(() => {
    if (!spaEnabled) return 0;
    if (spaHasSeat) {
      // Bottom inputs are OUTER WALL dimensions (what a user can measure from
      // the spa's outside). The actual footwell water cavity is narrower by
      // 2× the seat width — the bench protrudes inward from each side.
      const seat = num(spaSeatWidth);
      if (spaShape === 'round') {
        const footwellD = Math.max(0, num(spaBottomDiameter) - 2 * seat);
        const top = volumeGallons('round', { diameter: spaTopDiameter, depth: spaAboveSeatDepth }, lengthUnit);
        const bot = volumeGallons('round', { diameter: String(footwellD), depth: spaBelowSeatDepth }, lengthUnit);
        return top + bot;
      }
      const footwellL = Math.max(0, num(spaBottomLength) - 2 * seat);
      const footwellW = Math.max(0, num(spaBottomWidth) - 2 * seat);
      const top = volumeGallons('rectangle', { length: spaTopLength, width: spaTopWidth, depth: spaAboveSeatDepth }, lengthUnit);
      const bot = volumeGallons('rectangle', { length: String(footwellL), width: String(footwellW), depth: spaBelowSeatDepth }, lengthUnit);
      return top + bot;
    }
    if (spaShape === 'round') {
      return volumeGallons('round', { diameter: spaDiameter, depth: spaDepth }, lengthUnit);
    }
    return volumeGallons('rectangle', { length: spaLength, width: spaWidth, depth: spaDepth }, lengthUnit);
  }, [
    spaEnabled, spaShape, spaDiameter, spaLength, spaWidth, spaDepth,
    spaHasSeat, spaTopDiameter, spaBottomDiameter, spaSeatWidth,
    spaTopLength, spaTopWidth, spaBottomLength, spaBottomWidth,
    spaAboveSeatDepth, spaBelowSeatDepth, lengthUnit,
  ]);

  const totalGallons = gallons + spaGallons;
  const displayVolume = formatGallons(totalGallons, volumeUnit);
  const volumeUnitLabel = volumeUnit === 'L' ? 'liters' : 'gallons';

  // Build share URL.
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams();
    params.set('shape', shape);
    params.set('u', lengthUnit);
    params.set('v', volumeUnit);
    params.set('mode', depthMode);
    if (length) params.set('l', length);
    if (width) params.set('w', width);
    if (diameter) params.set('d', diameter);
    if (depthMode === 'avg' && avgDepth) params.set('s', avgDepth);
    if (depthMode === 'slope' || depthMode === 'sections') {
      if (shallowDepth) params.set('shallow', shallowDepth);
      if (deepDepth) params.set('deep', deepDepth);
    }
    if (depthMode === 'sections') {
      params.set('ls', effShallowLenFt.toFixed(2));
      params.set('ld', effDeepLenFt.toFixed(2));
    }
    if (calcMode !== 'pool') params.set('calc', calcMode);
    if (spaEnabled) {
      params.set('spaShape', spaShape);
      if (spaHasSeat) {
        params.set('spaSeat', '1');
        if (spaShape === 'round') {
          if (spaTopDiameter) params.set('spatd', spaTopDiameter);
          if (spaBottomDiameter) params.set('spabd', spaBottomDiameter);
        } else {
          if (spaTopLength) params.set('spatl', spaTopLength);
          if (spaTopWidth) params.set('spatw', spaTopWidth);
          if (spaBottomLength) params.set('spabl', spaBottomLength);
          if (spaBottomWidth) params.set('spabw', spaBottomWidth);
        }
        if (spaAboveSeatDepth) params.set('spaad', spaAboveSeatDepth);
        if (spaBelowSeatDepth) params.set('spabld', spaBelowSeatDepth);
        if (spaSeatWidth) params.set('spasw', spaSeatWidth);
      } else {
        if (spaShape === 'round') {
          if (spaDiameter) params.set('spad', spaDiameter);
        } else {
          if (spaLength) params.set('spal', spaLength);
          if (spaWidth) params.set('spaw', spaWidth);
        }
        if (spaDepth) params.set('spadep', spaDepth);
      }
    }
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, [calcMode, shape, lengthUnit, volumeUnit, depthMode, length, width, diameter, avgDepth, shallowDepth, deepDepth, effShallowLenFt, effDeepLenFt, spaEnabled, spaShape, spaDiameter, spaLength, spaWidth, spaDepth, spaHasSeat, spaTopDiameter, spaBottomDiameter, spaTopLength, spaTopWidth, spaBottomLength, spaBottomWidth, spaAboveSeatDepth, spaBelowSeatDepth, spaSeatWidth]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be unavailable on insecure context */
    }
  };

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  // ── formula (human-readable, for the trust panel) ───────────────
  const formula = useMemo(() => {
    const u = lengthUnit === 'm' ? 'm' : 'ft';
    const x = (s: string) => num(s).toString();
    // Section-accurate rectangle formula in sloped-sections mode.
    if (shape === 'rectangle' && depthMode === 'sections') {
      const toUserLen = (ft: number) =>
        (lengthUnit === 'm' ? ft / FT_PER_M : ft).toFixed(1);
      const Ls = toUserLen(effShallowLenFt);
      const Lslope = toUserLen(Math.max(0, totalLenFt - effShallowLenFt - effDeepLenFt));
      const Ld = toUserLen(effDeepLenFt);
      const Ds = x(shallowDepth);
      const Dd = x(deepDepth);
      return `W × (Ls·Ds + Lslope·((Ds+Dd)/2) + Ld·Dd) × 7.48 → ${x(width)} × (${Ls}·${Ds} + ${Lslope}·((${Ds}+${Dd})/2) + ${Ld}·${Dd}) ${u}`;
    }
    const d = depthMode === 'avg'
      ? `${x(avgDepth)} ${u}`
      : `((${x(shallowDepth)} + ${x(deepDepth)}) ÷ 2) = ${(resolvedDepthFt && lengthUnit === 'ft' ? resolvedDepthFt.toFixed(1) : (resolvedDepthFt / FT_PER_M).toFixed(1))} ${u}`;
    if (shape === 'rectangle') return `L × W × Depth × 7.48 → ${x(length)} × ${x(width)} × ${d}`;
    if (shape === 'round') return `π × (Ø ÷ 2)² × Depth × 7.48 → π × (${x(diameter)} ÷ 2)² × ${d}`;
    if (shape === 'oval') return `π × (L÷2) × (W÷2) × Depth × 7.48 → π × (${x(length)}÷2) × (${x(width)}÷2) × ${d}`;
    if (shape === 'kidney') return `0.45 × (A + B) × L × Depth × 7.48 → 0.45 × (${x(width)} + ${x(diameter)}) × ${x(length)} × ${d}`;
    return `Sum of each section's volume (L × W × D or π × r² × D), then × 7.48`;
  }, [shape, length, width, diameter, avgDepth, shallowDepth, deepDepth, depthMode, lengthUnit, resolvedDepthFt, effShallowLenFt, effDeepLenFt, totalLenFt]);

  const addSection = () => setSections((prev) => [...prev, newSection()]);
  const removeSection = (id: string) =>
    setSections((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  const updateSection = (id: string, patch: Partial<FreeformSection>) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const unitL = lengthUnit; // shorthand

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-50 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[460px] pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[500px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <Calculator className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">Free Pool Tool</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
            Pool Volume Calculator
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Find out how many gallons (or liters) your swimming pool holds — for any shape, with
            or without a sloped bottom. Free, instant, no email required.
          </p>

          {/* Trust-signal chips — quick at-a-glance summary of what the tool
              handles. Doubles as visual interest and conversion signal. */}
          <ul className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              'Any shape',
              'Sloped depths',
              'Spas & hot tubs',
              'No email required',
            ].map((label) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3 py-1.5 text-xs font-semibold text-gray-300"
              >
                <Check className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                {label}
              </li>
            ))}
          </ul>
        </section>

        {/* Calculator */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">

            {/* What are you calculating? — top-level mode picker. */}
            <div className="grid grid-cols-3 gap-2 mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {(
                [
                  { id: 'pool', label: 'Pool' },
                  { id: 'pool+spa', label: 'Pool + Spa' },
                  { id: 'spa', label: 'Spa' },
                ] as { id: CalcMode; label: string }[]
              ).map((m) => {
                const active = calcMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCalcMode(m.id)}
                    aria-pressed={active}
                    className={`relative py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Unit toggles */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
                {(['ft', 'm'] as LenUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setLengthUnit(u)}
                    aria-pressed={lengthUnit === u}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      lengthUnit === u ? 'bg-white/[0.08] text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {u === 'ft' ? 'Feet' : 'Meters'}
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
                {(['gal', 'L'] as VolUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setVolumeUnit(u)}
                    aria-pressed={volumeUnit === u}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      volumeUnit === u ? 'bg-white/[0.08] text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {u === 'gal' ? 'Gallons' : 'Liters'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pool fields (hidden in spa-only mode) */}
            {calcMode !== 'spa' && (
              <>
            <p className={labelClass}>Pool shape</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-6">
              {SHAPES.map(({ id, label, icon: Icon }) => {
                const active = shape === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setShape(id);
                      // 'sections' mode only applies to rectangle — downgrade
                      // to 'avg' for other shapes so the picker stays valid.
                      if (id !== 'rectangle' && depthMode === 'sections') {
                        setDepthMode('avg');
                      }
                    }}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-colors ${
                      active
                        ? 'border-brand-orange/60 bg-brand-orange/10 text-white'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white hover:border-white/25'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-brand-orange' : ''}`} />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Shape diagram + inputs (single-shape modes) */}
            {shape !== 'freeform' && (
              <div className="grid sm:grid-cols-[1fr_180px] gap-5 mb-5">
                <div className="order-2 sm:order-1 space-y-4">
                  {/* Dimensions per shape */}
                  {shape === 'rectangle' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="length" className={labelClass}>Length ({unitL})</label>
                        <input id="length" type="number" inputMode="decimal" min="0" value={length}
                          onChange={(e) => setLength(e.target.value)} placeholder="e.g. 32" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="width" className={labelClass}>Width ({unitL})</label>
                        <input id="width" type="number" inputMode="decimal" min="0" value={width}
                          onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 16" className={fieldClass} />
                      </div>
                    </div>
                  )}

                  {shape === 'round' && (
                    <div>
                      <label htmlFor="diameter" className={labelClass}>Diameter ({unitL})</label>
                      <input id="diameter" type="number" inputMode="decimal" min="0" value={diameter}
                        onChange={(e) => setDiameter(e.target.value)} placeholder="e.g. 18" className={fieldClass} />
                    </div>
                  )}

                  {shape === 'oval' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="length" className={labelClass}>Length ({unitL})</label>
                        <input id="length" type="number" inputMode="decimal" min="0" value={length}
                          onChange={(e) => setLength(e.target.value)} placeholder="e.g. 30" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="width" className={labelClass}>Width ({unitL})</label>
                        <input id="width" type="number" inputMode="decimal" min="0" value={width}
                          onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 15" className={fieldClass} />
                      </div>
                    </div>
                  )}

                  {shape === 'kidney' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="length" className={labelClass}>Length L ({unitL})</label>
                        <input id="length" type="number" inputMode="decimal" min="0" value={length}
                          onChange={(e) => setLength(e.target.value)} placeholder="e.g. 28" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="width" className={labelClass}>Width A ({unitL})</label>
                        <input id="width" type="number" inputMode="decimal" min="0" value={width}
                          onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 12" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="diameter" className={labelClass}>Width B ({unitL})</label>
                        <input id="diameter" type="number" inputMode="decimal" min="0" value={diameter}
                          onChange={(e) => setDiameter(e.target.value)} placeholder="e.g. 16" className={fieldClass} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Diagram */}
                <div className="order-1 sm:order-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center justify-center">
                  {DIAGRAMS[shape as Exclude<Shape, 'freeform'>]}
                </div>
              </div>
            )}

            {/* Depth (single shape only) */}
            {shape !== 'freeform' && (
              <div className="mb-2">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className={`${labelClass} !mb-0`}>Depth</p>
                  <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1 flex-wrap">
                    {(
                      shape === 'rectangle'
                        ? (['avg', 'slope', 'sections'] as DepthMode[])
                        : (['avg', 'slope'] as DepthMode[])
                    ).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDepthMode(mode)}
                        aria-pressed={depthMode === mode}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          depthMode === mode ? 'bg-white/[0.08] text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {mode === 'avg' && 'Average'}
                        {mode === 'slope' && 'Shallow + Deep'}
                        {mode === 'sections' && 'Sloped sections'}
                      </button>
                    ))}
                  </div>
                </div>

                {depthMode === 'avg' && (
                  <input id="avgDepth" type="number" inputMode="decimal" min="0" value={avgDepth}
                    onChange={(e) => setAvgDepth(e.target.value)} placeholder={`Average depth in ${unitL} — e.g. 5`} className={fieldClass} />
                )}

                {depthMode === 'slope' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="shallow" className="text-xs text-gray-400 block mb-1">Shallow end ({unitL})</label>
                      <input id="shallow" type="number" inputMode="decimal" min="0" value={shallowDepth}
                        onChange={(e) => setShallowDepth(e.target.value)} placeholder="e.g. 3" className={fieldClass} />
                    </div>
                    <div>
                      <label htmlFor="deep" className="text-xs text-gray-400 block mb-1">Deep end ({unitL})</label>
                      <input id="deep" type="number" inputMode="decimal" min="0" value={deepDepth}
                        onChange={(e) => setDeepDepth(e.target.value)} placeholder="e.g. 8" className={fieldClass} />
                    </div>
                  </div>
                )}

                {/* Sloped sections (rectangle only): the section-accurate model
                    with a draggable side-profile diagram. */}
                {depthMode === 'sections' && shape === 'rectangle' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="shallow" className="text-xs text-gray-400 block mb-1">Shallow depth ({unitL})</label>
                        <input id="shallow" type="number" inputMode="decimal" min="0" value={shallowDepth}
                          onChange={(e) => setShallowDepth(e.target.value)} placeholder="e.g. 3.5" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="deep" className="text-xs text-gray-400 block mb-1">Deep depth ({unitL})</label>
                        <input id="deep" type="number" inputMode="decimal" min="0" value={deepDepth}
                          onChange={(e) => setDeepDepth(e.target.value)} placeholder="e.g. 8" className={fieldClass} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
                      {totalLenFt > 0 && shallowDepthFt > 0 && deepDepthFt > 0 ? (
                        <>
                          <SlopeProfile
                            totalLenFt={totalLenFt}
                            widthFt={widthFt}
                            shallowLenFt={effShallowLenFt}
                            deepLenFt={effDeepLenFt}
                            shallowDepthFt={shallowDepthFt}
                            deepDepthFt={deepDepthFt}
                            unitLabel={unitL === 'ft' ? 'ft' : 'm'}
                            showHint={showSlopeHint}
                            onInteract={dismissSlopeHint}
                            onChange={(newLs, newLd) => {
                              // Convert internal ft back to user's chosen unit
                              // for storage if needed. We keep internal in ft.
                              setShallowLenFt(newLs);
                              setDeepLenFt(newLd);
                            }}
                          />
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Drag the orange handles to set where the slope starts and ends.
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">
                          Enter length, width, and both depths to see the side profile.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Freeform sections */}
            {shape === 'freeform' && (
              <div className="space-y-3 mb-2">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Break your pool into simple rectangle or round sections, enter each, and we'll add
                  them up.
                </p>
                {sections.map((sec, i) => (
                  <div key={sec.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-semibold text-sm">Section {i + 1}</span>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
                          {(['rectangle', 'round'] as FreeformSectionShape[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateSection(sec.id, { shape: s })}
                              aria-pressed={sec.shape === s}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                                sec.shape === s ? 'bg-white/[0.08] text-white' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {s === 'rectangle' ? 'Rect' : 'Round'}
                            </button>
                          ))}
                        </div>
                        {sections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSection(sec.id)}
                            aria-label="Remove section"
                            className="text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {sec.shape === 'rectangle' ? (
                        <>
                          <input type="number" inputMode="decimal" min="0" value={sec.length}
                            onChange={(e) => updateSection(sec.id, { length: e.target.value })}
                            placeholder={`Length (${unitL})`} className={fieldClass} />
                          <input type="number" inputMode="decimal" min="0" value={sec.width}
                            onChange={(e) => updateSection(sec.id, { width: e.target.value })}
                            placeholder={`Width (${unitL})`} className={fieldClass} />
                        </>
                      ) : (
                        <input type="number" inputMode="decimal" min="0" value={sec.diameter}
                          onChange={(e) => updateSection(sec.id, { diameter: e.target.value })}
                          placeholder={`Diameter (${unitL})`} className={`${fieldClass} sm:col-span-2`} />
                      )}
                      <input type="number" inputMode="decimal" min="0" value={sec.depth}
                        onChange={(e) => updateSection(sec.id, { depth: e.target.value })}
                        placeholder={`Depth (${unitL})`} className={fieldClass} />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSection}
                  className="inline-flex items-center gap-1.5 text-brand-orange hover:text-brand-orange-dark font-semibold text-sm"
                >
                  <Plus className="w-4 h-4" /> Add another section
                </button>
              </div>
            )}
              </>
            )}

            {/* Spa card — visible whenever calcMode includes spa. */}
            {spaEnabled && (
              <div className={`${calcMode === 'spa' ? 'mt-0' : 'mt-6'} rounded-2xl border border-white/10 bg-gradient-to-br from-brand-blue/[0.05] to-transparent overflow-hidden`}>
                {/* Spa card header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                      <Droplet className="w-[18px] h-[18px] text-brand-blue-light" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-[15px] leading-tight">
                        {calcMode === 'spa' ? 'Spa / Hot Tub' : 'Spa or Hot Tub'}
                      </p>
                      <p className="text-gray-500 text-xs leading-tight mt-0.5">
                        {calcMode === 'spa' ? 'Standalone calculation' : 'Adds to the pool total'}
                      </p>
                    </div>
                  </div>
                  {spaGallons > 0 && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange px-3 py-1 text-sm font-semibold tabular-nums">
                      +{formatGallons(spaGallons, volumeUnit)} {volumeUnit}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Spa shape</span>
                      <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
                        {(['round', 'rectangle'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSpaShape(s)}
                            aria-pressed={spaShape === s}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                              spaShape === s ? 'bg-white/[0.08] text-white' : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {s === 'round' ? 'Round' : 'Rectangle'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-gray-400 select-none">
                      <input
                        type="checkbox"
                        checked={spaHasSeat}
                        onChange={(e) => setSpaHasSeat(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-white/[0.05] text-brand-orange focus:ring-brand-orange/40"
                      />
                      Spa has a seat / step bench
                    </label>
                  </div>

                  {/* Simple spa (no seat) */}
                  {!spaHasSeat && spaShape === 'round' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="spaDiameter" className="text-xs text-gray-400 block mb-1">Diameter ({unitL})</label>
                          <input id="spaDiameter" type="number" inputMode="decimal" min="0" value={spaDiameter}
                            onChange={(e) => setSpaDiameter(e.target.value)} placeholder="e.g. 7" className={fieldClass} />
                        </div>
                        <div>
                          <label htmlFor="spaDepth" className="text-xs text-gray-400 block mb-1">Avg depth ({unitL})</label>
                          <input id="spaDepth" type="number" inputMode="decimal" min="0" value={spaDepth}
                            onChange={(e) => setSpaDepth(e.target.value)} placeholder="e.g. 3.5" className={fieldClass} />
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <SimpleSpaDiagram topW={num(spaDiameter)} depth={num(spaDepth)} unitLabel={unitL} />
                      </div>
                    </div>
                  )}
                  {!spaHasSeat && spaShape === 'rectangle' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label htmlFor="spaLength" className="text-xs text-gray-400 block mb-1">Length ({unitL})</label>
                          <input id="spaLength" type="number" inputMode="decimal" min="0" value={spaLength}
                            onChange={(e) => setSpaLength(e.target.value)} placeholder="e.g. 7" className={fieldClass} />
                        </div>
                        <div>
                          <label htmlFor="spaWidth" className="text-xs text-gray-400 block mb-1">Width ({unitL})</label>
                          <input id="spaWidth" type="number" inputMode="decimal" min="0" value={spaWidth}
                            onChange={(e) => setSpaWidth(e.target.value)} placeholder="e.g. 7" className={fieldClass} />
                        </div>
                        <div>
                          <label htmlFor="spaDepth" className="text-xs text-gray-400 block mb-1">Avg depth ({unitL})</label>
                          <input id="spaDepth" type="number" inputMode="decimal" min="0" value={spaDepth}
                            onChange={(e) => setSpaDepth(e.target.value)} placeholder="e.g. 3.5" className={fieldClass} />
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <SimpleSpaDiagram topW={Math.max(num(spaLength), num(spaWidth))} depth={num(spaDepth)} unitLabel={unitL} />
                      </div>
                    </div>
                  )}

                  {/* Spa with seat — inputs first, then cross-section diagram
                      below (mirrors the pool sloped-sections layout). */}
                  {spaHasSeat && (
                    <div className="space-y-3">
                      {spaShape === 'round' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="spaTopDiameter" className="text-xs text-gray-400 block mb-1">Top diameter ({unitL})</label>
                            <input id="spaTopDiameter" type="number" inputMode="decimal" min="0" value={spaTopDiameter}
                              onChange={(e) => setSpaTopDiameter(e.target.value)} placeholder="e.g. 7" className={fieldClass} />
                          </div>
                          <div>
                            <label htmlFor="spaBottomDiameter" className="text-xs text-gray-400 block mb-1">Bottom diameter — outer wall ({unitL})</label>
                            <input id="spaBottomDiameter" type="number" inputMode="decimal" min="0" value={spaBottomDiameter}
                              onChange={(e) => setSpaBottomDiameter(e.target.value)} placeholder="e.g. 5" className={fieldClass} />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <p className="text-xs text-gray-400">Top section (above seat)</p>
                            <input type="number" inputMode="decimal" min="0" value={spaTopLength}
                              onChange={(e) => setSpaTopLength(e.target.value)} placeholder={`Length (${unitL})`} className={fieldClass} />
                            <input type="number" inputMode="decimal" min="0" value={spaTopWidth}
                              onChange={(e) => setSpaTopWidth(e.target.value)} placeholder={`Width (${unitL})`} className={fieldClass} />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-gray-400">Bottom — outer wall (below seat)</p>
                            <input type="number" inputMode="decimal" min="0" value={spaBottomLength}
                              onChange={(e) => setSpaBottomLength(e.target.value)} placeholder={`Length (${unitL})`} className={fieldClass} />
                            <input type="number" inputMode="decimal" min="0" value={spaBottomWidth}
                              onChange={(e) => setSpaBottomWidth(e.target.value)} placeholder={`Width (${unitL})`} className={fieldClass} />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="spaAboveSeatDepth" className="text-xs text-gray-400 block mb-1">Above-seat depth ({unitL})</label>
                          <input id="spaAboveSeatDepth" type="number" inputMode="decimal" min="0" value={spaAboveSeatDepth}
                            onChange={(e) => setSpaAboveSeatDepth(e.target.value)} placeholder="e.g. 1.5" className={fieldClass} />
                        </div>
                        <div>
                          <label htmlFor="spaBelowSeatDepth" className="text-xs text-gray-400 block mb-1">Below-seat depth ({unitL})</label>
                          <input id="spaBelowSeatDepth" type="number" inputMode="decimal" min="0" value={spaBelowSeatDepth}
                            onChange={(e) => setSpaBelowSeatDepth(e.target.value)} placeholder="e.g. 2" className={fieldClass} />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="spaSeatWidth" className="text-xs text-gray-400 block mb-1">Seat width per side ({unitL})</label>
                        <input id="spaSeatWidth" type="number" inputMode="decimal" min="0" value={spaSeatWidth}
                          onChange={(e) => setSpaSeatWidth(e.target.value)} placeholder="e.g. 1" className={fieldClass} />
                        <p className="text-[11px] text-gray-500 mt-1">
                          How far the bench protrudes inward from each side. The footwell water width is calculated as bottom diameter − 2 × seat width.
                        </p>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 mt-2">
                        <SpaCrossSection
                          topW={
                            spaShape === 'round'
                              ? num(spaTopDiameter)
                              : Math.max(num(spaTopLength), num(spaTopWidth))
                          }
                          /* The diagram's lower section is the FOOTWELL water
                             cavity = bottom (outer wall) − 2 × seat width. */
                          botW={
                            spaShape === 'round'
                              ? Math.max(0, num(spaBottomDiameter) - 2 * num(spaSeatWidth))
                              : Math.max(
                                  0,
                                  Math.max(num(spaBottomLength), num(spaBottomWidth)) - 2 * num(spaSeatWidth),
                                )
                          }
                          aboveD={num(spaAboveSeatDepth)}
                          belowD={num(spaBelowSeatDepth)}
                          seatW={num(spaSeatWidth)}
                          unitLabel={unitL}
                        />
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            <p className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed mt-4 mb-6">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {calcMode === 'spa'
                ? 'Measure the depth of your water, not the height of the spa wall.'
                : <>Measure the depth of your <em>water</em>, not the height of the wall. For pools with a slope, use Shallow + Deep so we average correctly.</>}
            </p>

            {/* Result */}
            <div className="rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 border border-white/10 p-6 text-center">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400 mb-1">
                {calcMode === 'spa'
                  ? 'Estimated spa volume'
                  : calcMode === 'pool+spa' && spaGallons > 0 && gallons > 0
                    ? 'Combined volume (pool + spa)'
                    : 'Estimated volume'}
              </p>
              <p className="font-display font-bold text-white text-4xl sm:text-5xl tabular-nums">
                {totalGallons > 0 ? displayVolume : '—'}
                {totalGallons > 0 && <span className="text-2xl text-gray-400 font-semibold ml-2">{volumeUnitLabel}</span>}
              </p>
              {totalGallons > 0 && volumeUnit === 'gal' && (
                <p className="text-gray-500 text-sm mt-1 tabular-nums">≈ {formatGallons(totalGallons, 'L')} liters</p>
              )}
              {totalGallons > 0 && volumeUnit === 'L' && (
                <p className="text-gray-500 text-sm mt-1 tabular-nums">≈ {formatGallons(totalGallons, 'gal')} gallons</p>
              )}
              {totalGallons === 0 && (
                <p className="text-gray-500 text-sm mt-1">
                  Enter your {calcMode === 'spa' ? "spa's" : "pool's"} dimensions above.
                </p>
              )}

              {/* Pool + Spa breakdown (only when both contribute) */}
              {spaEnabled && spaGallons > 0 && gallons > 0 && (
                <p className="text-gray-400 text-sm mt-3 tabular-nums">
                  Pool {formatGallons(gallons, volumeUnit)}
                  <span className="text-gray-600 mx-1.5">+</span>
                  Spa {formatGallons(spaGallons, volumeUnit)}
                  <span className="text-gray-600 mx-1.5">=</span>
                  <span className="text-white font-semibold">{displayVolume}</span>
                </p>
              )}

              {totalGallons > 0 && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:text-brand-orange-dark transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  {copied ? 'Link copied' : 'Copy shareable link'}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Formula transparency panel (pool-specific) */}
        {gallons > 0 && shape !== 'freeform' && calcMode !== 'spa' && (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-500 mb-2">How we got that</p>
              <p className="font-mono text-sm text-gray-300 break-words">{formula}</p>
              <p className="text-xs text-gray-500 mt-2">7.48 = U.S. gallons in 1 cubic foot of water.</p>
            </div>
          </section>
        )}

        {/* Measurement tips (pool-specific) — 2×2 icon-card grid matching the
            chemical-care section pattern on the How It Works page. */}
        {calcMode !== 'spa' && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="mb-6">
            <h2 className="font-display font-bold text-white text-xl sm:text-2xl mb-2">
              How to measure your pool accurately
            </h2>
            <p className="text-gray-400 text-sm">
              Four quick tips for getting the right numbers into the fields above.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Ruler,
                title: 'Measure water depth, not wall height',
                text: 'Use a marked pole or weighted tape from the waterline straight down to the floor.',
              },
              {
                icon: Layers,
                title: 'For sloped pools, use Shallow + Deep',
                text: 'Enter both depths in the Depth section and we average them — or use Sloped sections for a section-accurate result.',
              },
              {
                icon: Maximize2,
                title: 'For ovals and kidneys',
                text: 'Measure the widest points across the long axis and the short axis — that\'s what goes into Length and Width.',
              },
              {
                icon: Shapes,
                title: 'Got a freeform pool?',
                text: 'Mentally break it into rectangles and circles. Use Freeform mode and add each section separately — we sum them.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 hover:bg-white/[0.05] transition-colors"
              >
                <span className="w-10 h-10 rounded-xl bg-brand-orange/15 flex items-center justify-center mb-4">
                  <card.icon className="w-[18px] h-[18px] text-brand-orange" />
                </span>
                <h3 className="text-white font-display font-bold text-base mb-1.5 leading-snug">
                  {card.title}
                </h3>
                <p className="text-gray-400 text-[14px] leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Reference chart (pool-specific) */}
        {calcMode !== 'spa' && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="font-display font-bold text-white text-xl sm:text-2xl mb-2">
            Common pool sizes
          </h2>
          <p className="text-gray-400 text-sm mb-5">
            Approximate gallons for standard residential pool dimensions.
          </p>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-3 font-semibold text-gray-300">Shape</th>
                  <th className="py-3 px-3 font-semibold text-gray-300">Dimensions</th>
                  <th className="py-3 px-3 font-semibold text-gray-300 text-right">
                    {volumeUnit === 'L' ? 'Liters' : 'Gallons'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {REFERENCE_SIZES.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                    <td className="py-3 px-3 text-gray-400">{row.shape}</td>
                    <td className="py-3 px-3 text-gray-300 tabular-nums">{row.size}</td>
                    <td className="py-3 px-3 text-white font-semibold tabular-nums text-right">
                      {formatGallons(row.gallons, volumeUnit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {/* Common questions — high-intent search queries. The data is the
            same array that backs the FAQPage JSON-LD in <head>, so the on-page
            content matches the structured data Google reads. */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="font-display font-bold text-white text-xl sm:text-2xl mb-2">
            Common questions
          </h2>
          <p className="text-gray-400 text-sm mb-5">
            Quick answers to the questions homeowners ask about pool volume.
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
            {COMMON_QUESTIONS.map((item) => (
              <details key={item.q} className="group">
                <summary className="list-none cursor-pointer flex items-start justify-between gap-4 px-5 sm:px-6 py-4 text-left">
                  <span className="font-display font-normal text-white text-[15px] sm:text-base leading-snug">
                    {item.q}
                  </span>
                  <span className="shrink-0 mt-0.5 text-gray-400 transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange">
                    <Plus className="w-5 h-5" />
                  </span>
                </summary>
                <p className="px-5 sm:px-6 pb-5 -mt-1 text-gray-400 leading-relaxed text-[15px]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Lead-gen CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl p-7 sm:p-9 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10"
          >
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Rather not do the math every week?
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                We handle the volume, the dosing, and the balancing for you — every week, one flat
                rate, across St. Petersburg and the Tampa Bay area.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="#quote" onClick={handleQuoteClick} className="btn btn-orange w-full sm:w-auto">
                  <MessageSquare className="w-[18px] h-[18px]" />
                  Get a Free Quote
                </a>
                <a href={PHONE_HREF} className="btn btn-glass w-full sm:w-auto">
                  <Phone className="w-[18px] h-[18px]" />
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </m.div>
        </section>

        <Footer />
      </div>

    </div>
  );
};

export const PoolVolumeCalculatorPage = () => (
  <QuoteSheetProvider>
    <PoolVolumeCalculatorInner />
  </QuoteSheetProvider>
);
