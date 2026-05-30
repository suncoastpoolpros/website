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
  { slug: 'gulfport',        name: 'Gulfport',        blurb: 'Coastal St. Pete' },
  { slug: 'st-pete-beach',   name: 'St. Pete Beach',  blurb: 'Beach community' },
  { slug: 'treasure-island', name: 'Treasure Island', blurb: 'Gulf beaches', to: '/treasure-island-fl' },
  { slug: 'seminole',        name: 'Seminole',        blurb: 'Mid-Pinellas' },
  { slug: 'largo',           name: 'Largo',           blurb: 'Central Pinellas' },
  { slug: 'belleair-beach',  name: 'Belleair Beach',  blurb: 'Gulf barrier island', to: '/belleair-beach-fl' },
  { slug: 'clearwater',      name: 'Clearwater',      blurb: 'Beach & mainland' },
  { slug: 'safety-harbor',   name: 'Safety Harbor',   blurb: 'East shore' },
  { slug: 'dunedin',         name: 'Dunedin',         blurb: 'Gulf-side' },
  { slug: 'palm-harbor',     name: 'Palm Harbor',     blurb: 'Northern Pinellas' },
  { slug: 'davis-island',    name: 'Davis Island',    blurb: 'South Tampa island' },
  { slug: 'south-tampa',     name: 'South Tampa',     blurb: 'Hyde Park & Bayshore' },
];
