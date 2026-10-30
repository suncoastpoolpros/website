/**
 * Single source of truth for the cities we serve.
 *
 * Pulled out of ServiceAreasMenu so consumers (Footer, Navbar, ServiceAreasMenu
 * itself) can import just the data without dragging the menu component's React
 * tree, react-router-dom, lucide-react, etc. into their chunks. Footer is the
 * primary beneficiary — it only needs the list, not the dropdown UI.
 */

export type City = { slug: string; name: string; blurb: string; to?: string };

export const cities: City[] = [
  { slug: 'st-petersburg',   name: 'St. Petersburg',  blurb: 'Our home base' },
  { slug: 'snell-isle',      name: 'Snell Isle',      blurb: 'St. Pete waterfront', to: '/snell-isle-fl/' },
  { slug: 'gulfport',        name: 'Gulfport',        blurb: 'Coastal St. Pete' },
  { slug: 'st-pete-beach',   name: 'St. Pete Beach',  blurb: 'Beach community', to: '/st-pete-beach-fl/' },
  { slug: 'treasure-island', name: 'Treasure Island', blurb: 'Gulf beaches', to: '/treasure-island-fl/' },
  { slug: 'seminole',        name: 'Seminole',        blurb: 'Mid-Pinellas', to: '/seminole-fl/' },
  { slug: 'largo',           name: 'Largo',           blurb: 'Central Pinellas', to: '/largo-fl/' },
  { slug: 'belleair-beach',  name: 'Belleair Beach',  blurb: 'Gulf barrier island', to: '/belleair-beach-fl/' },
  { slug: 'clearwater',      name: 'Clearwater',      blurb: 'Beach & mainland', to: '/clearwater-fl/' },
  { slug: 'safety-harbor',   name: 'Safety Harbor',   blurb: 'East shore' },
  { slug: 'dunedin',         name: 'Dunedin',         blurb: 'Gulf-side' },
  { slug: 'palm-harbor',     name: 'Palm Harbor',     blurb: 'Northern Pinellas' },
  { slug: 'davis-island',    name: 'Davis Island',    blurb: 'South Tampa island' },
  { slug: 'south-tampa',     name: 'South Tampa',     blurb: 'Hyde Park & Bayshore' },
];

const normalizePlace = (s: string) =>
  s.toLowerCase().replace(/\./g, '').replace(/^saint\b/, 'st').replace(/\s+/g, ' ').trim();

/**
 * True only when `place` (a city name from the address lookup, e.g. Mapbox's
 * "St. Petersburg") is one of the cities above. This drives the quote form's
 * "we service your area" check, which must only show when it's certain, so
 * there's no fuzzy matching: a neighborhood entry like Snell Isle or South
 * Tampa simply never matches, and an address there gets no check (its city,
 * St. Petersburg, still does). To give a city the check, add it to the list.
 */
export const isServedCity = (place: string | undefined): boolean => {
  if (!place) return false;
  const n = normalizePlace(place);
  return cities.some((c) => normalizePlace(c.name) === n);
};
