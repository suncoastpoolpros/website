import React from 'react';

/**
 * Custom hand-drawn duotone pool-service icons.
 * Shared style: 24x24 grid, 1.75 stroke, rounded caps/joins.
 *  - `stroke` = outline (uses currentColor, set via text color)
 *  - `fill`   = soft accent shape (semi-transparent currentColor)
 * Pool-specific, cohesive set — not generic clip art.
 */
type IconProps = { className?: string };

const base = (className?: string) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
});

const Accent = 'currentColor';
const accentStyle = { fill: Accent, opacity: 0.16, stroke: 'none' as const };

/* ---------- SERVICES ---------- */

// Weekly Cleaning — pool surface with a skimmer net
export const IcWeeklyCleaning = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M3 16c2 1.2 3 1.2 4.5 0s2.5-1.2 4.5 0 3 1.2 4.5 0S19 14.8 21 16" />
    <path d="M3 19.5c2 1.2 3 1.2 4.5 0s2.5-1.2 4.5 0 3 1.2 4.5 0S19 18.3 21 19.5" />
    <ellipse cx="15.5" cy="8.5" rx="4" ry="2.6" style={accentStyle} />
    <ellipse cx="15.5" cy="8.5" rx="4" ry="2.6" />
    <path d="M12.4 6.8 6 3" />
  </svg>
);

// Saltwater & Chemistry — test vial with liquid level + bubble
export const IcChemistry = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M9 3h6" />
    <path d="M10 3v6.5L6.2 17a3 3 0 0 0 2.7 4.3h6.2a3 3 0 0 0 2.7-4.3L14 9.5V3" />
    <path d="M7.4 14.5h9.2l1.2 2.5a3 3 0 0 1-2.7 4.3H8.9a3 3 0 0 1-2.7-4.3z" style={accentStyle} />
    <circle cx="13.5" cy="17.5" r="0.9" />
    <circle cx="10" cy="19" r="0.6" />
  </svg>
);

// Maintenance & Repairs — wrench
export const IcRepairs = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M15.5 3.5a4.5 4.5 0 0 0-5.8 5.6L4 14.8a2 2 0 0 0 0 2.8l2.4 2.4a2 2 0 0 0 2.8 0l5.7-5.7a4.5 4.5 0 0 0 5.6-5.8l-2.7 2.7-2.6-.7-.7-2.6z" style={accentStyle} />
    <path d="M15.5 3.5a4.5 4.5 0 0 0-5.8 5.6L4 14.8a2 2 0 0 0 0 2.8l2.4 2.4a2 2 0 0 0 2.8 0l5.7-5.7a4.5 4.5 0 0 0 5.6-5.8l-2.7 2.7-2.6-.7-.7-2.6z" />
  </svg>
);

// Filter Cleaning — pleated cartridge filter
export const IcFilter = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="7" y="4" width="10" height="16" rx="2" style={accentStyle} />
    <rect x="7" y="4" width="10" height="16" rx="2" />
    <path d="M10 4v16M14 4v16" />
    <path d="M5 8h2M5 12h2M5 16h2M17 8h2M17 12h2M17 16h2" />
  </svg>
);

// Equipment Installation — pump/motor with dial
export const IcEquipment = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <circle cx="9.5" cy="12" r="5.5" style={accentStyle} />
    <circle cx="9.5" cy="12" r="5.5" />
    <circle cx="9.5" cy="12" r="1.6" />
    <path d="M15 9.5h4.5a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5H15" />
    <path d="M9.5 4V6M9.5 18v2" />
  </svg>
);

// Equipment Upgrades — upward arrow in a circle (modernize / improve)
export const IcUpgrade = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" style={accentStyle} />
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16V8.5" />
    <path d="M8.5 12 12 8.5l3.5 3.5" />
  </svg>
);

// Salt & Equipment Care — shield with check (protected / cared for)
export const IcSaltCare = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 3l7 3v5c0 4.5-3 8.4-7 9.5C8 19.4 5 15.5 5 11V6z" style={accentStyle} />
    <path d="M12 3l7 3v5c0 4.5-3 8.4-7 9.5C8 19.4 5 15.5 5 11V6z" />
    <path d="M9 11.5l2 2 4-4.5" />
  </svg>
);

// Green Pool Recovery — water drop with a sparkle (clean restored)
export const IcGreenRecovery = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 3.5C12 3.5 6 9.5 6 14a6 6 0 0 0 12 0c0-4.5-6-10.5-6-10.5z" style={accentStyle} />
    <path d="M12 3.5C12 3.5 6 9.5 6 14a6 6 0 0 0 12 0c0-4.5-6-10.5-6-10.5z" />
    <path d="M9.5 14.5c.6 1.2 1.7 2 3 2" />
    <path d="M18.5 4.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4L16.5 6.5l1.4-.6z" />
  </svg>
);

/* ---------- PROCESS STEPS ---------- */

// Step 1 — Call / Form (phone with chat dot)
export const IcContact = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M5.5 4h3l1.5 4-2 1.2a11 11 0 0 0 4.8 4.8l1.2-2 4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 3.5 6.2 2 2 0 0 1 5.5 4z" style={accentStyle} />
    <path d="M5.5 4h3l1.5 4-2 1.2a11 11 0 0 0 4.8 4.8l1.2-2 4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 3.5 6.2 2 2 0 0 1 5.5 4z" />
  </svg>
);

// Step 2 — Free Quote (document with checkmark)
export const IcQuote = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" style={accentStyle} />
    <path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M13 3v5h5" />
    <path d="M8.5 14.5l2 2 3.5-4" />
  </svg>
);

// Step 3 — Worry-Free (shield with water drop)
export const IcWorryFree = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 3l7 3v5c0 4.5-3 8.4-7 9.5C8 19.4 5 15.5 5 11V6z" style={accentStyle} />
    <path d="M12 3l7 3v5c0 4.5-3 8.4-7 9.5C8 19.4 5 15.5 5 11V6z" />
    <path d="M12 8.5s-2.2 2.4-2.2 4a2.2 2.2 0 0 0 4.4 0c0-1.6-2.2-4-2.2-4z" />
  </svg>
);
