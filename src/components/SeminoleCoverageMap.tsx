import React from 'react';
import { m } from 'motion/react';
import { MapPin } from 'lucide-react';

// Stylized (NOT geographic) coverage map for the Seminole hero — the one visual
// no other city page has. Reinforces the "we cover your whole town, weekly"
// angle with glowing neighborhood pins + animated route lines. Pure SVG/CSS so
// it ships no map tiles or third-party script. Desktop-only in the hero, so the
// pulse/dash animations are gated off under 768px anyway (mobile motion strip).

type Pin = {
  name: string;
  x: number;
  y: number;
  labelDx: number;
  labelAnchor: 'start' | 'end';
  delay: string;
};

const PINS: Pin[] = [
  { name: 'Oakhurst', x: 86, y: 86, labelDx: 14, labelAnchor: 'start', delay: '0s' },
  { name: 'Bardmoor', x: 270, y: 120, labelDx: -14, labelAnchor: 'end', delay: '0.7s' },
  { name: 'Seminole Lake', x: 176, y: 192, labelDx: 14, labelAnchor: 'start', delay: '1.4s' },
  { name: 'Bay Pines', x: 96, y: 244, labelDx: 14, labelAnchor: 'start', delay: '2.1s' },
];

export const SeminoleCoverageMap = () => (
  <m.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
    className="relative w-[380px] max-w-full"
    // Decorative mockup — keep the sample neighborhood labels out of search
    // snippets so the page's real meta description is used instead.
    data-nosnippet=""
  >
    {/* Ambient glow behind the card (desktop only — blur orbs are hidden <768px). */}
    <div className="absolute -inset-6 bg-gradient-to-br from-brand-orange/15 via-brand-blue/10 to-brand-blue/5 blur-3xl -z-10 rounded-[3rem]" />

    <div className="relative rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#0d1a2b] to-[#0a1320] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
      <style>{`
        @keyframes scpp-pulse { 0%,100%{opacity:.16} 50%{opacity:.42} }
        @keyframes scpp-dash { to { stroke-dashoffset: -20; } }
        .scpp-glow { animation: scpp-pulse 3s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .scpp-route { stroke-dasharray: 4 6; animation: scpp-dash 1.3s linear infinite; }
        @media (max-width:767px){ .scpp-glow{ opacity:.3 } .scpp-glow,.scpp-route{ animation:none } }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-orange-light" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
            Seminole Service Area
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 px-2.5 py-1 text-[10px] font-semibold text-brand-orange-light">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-orange scpp-glow" /> Weekly routes
        </span>
      </div>

      {/* Stylized map */}
      <svg
        viewBox="0 0 360 300"
        className="w-full block"
        role="img"
        aria-label="Map of Seminole, FL neighborhoods served by Suncoast Pool Pros — Oakhurst, Bardmoor, Seminole Lake and Bay Pines"
      >
        {/* Faint street grid */}
        <g stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1">
          <line x1="0" y1="72" x2="360" y2="54" />
          <line x1="0" y1="150" x2="360" y2="168" />
          <line x1="0" y1="232" x2="360" y2="250" />
          <line x1="118" y1="0" x2="142" y2="300" />
          <line x1="232" y1="0" x2="214" y2="300" />
        </g>

        {/* Water hint (Lake Seminole / Boca Ciega) */}
        <ellipse cx="150" cy="232" rx="78" ry="36" fill="#1669AE" fillOpacity="0.12" stroke="#1669AE" strokeOpacity="0.22" strokeWidth="1" />

        {/* Animated service routes between pins */}
        <polyline
          points="86,86 176,192 270,120"
          fill="none"
          stroke="#ff720f"
          strokeOpacity="0.55"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="scpp-route"
        />
        <polyline
          points="176,192 96,244"
          fill="none"
          stroke="#ff720f"
          strokeOpacity="0.55"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="scpp-route"
        />

        {/* Pins */}
        {PINS.map((p) => (
          <g key={p.name}>
            <circle cx={p.x} cy={p.y} r="15" fill="#ff720f" className="scpp-glow" style={{ animationDelay: p.delay }} />
            <circle cx={p.x} cy={p.y} r="5" fill="#ff8a3d" stroke="#ffffff" strokeWidth="1.5" />
            <text
              x={p.x + p.labelDx}
              y={p.y + 4}
              textAnchor={p.labelAnchor}
              fontSize="12.5"
              fontWeight="600"
              fill="#e8eef6"
            >
              {p.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-white/[0.06] flex items-center justify-between gap-3">
        <span className="text-[13px] text-white/85 font-medium">On your street, every week.</span>
        <span className="text-[10px] text-gray-500 tracking-wide tabular-nums shrink-0">
          33772 · 76 · 77 · 78
        </span>
      </div>
    </div>
  </m.div>
);

export default SeminoleCoverageMap;
