/**
 * New-homeowner leads: recent Pinellas sales within a set distance of one
 * address, narrowed by property type, sale type and price, ranked by how
 * recently they sold and how close they are.
 *
 * The sales come from the county (functions/api/_countySales.ts), already cut
 * to the radius and date window there. Everything else is decided here, in the
 * browser, so every row that didn't become a lead is counted under its reason.
 * Nothing is guessed: a sale with no address or price (when a range is set) is
 * excluded, never filled in.
 *
 * POOLS are not in the county's map data. Each lead links to its property
 * page, where a pool is listed under Extra Features.
 */
import type { CountySale } from '../../../../functions/api/_countySales';

export type { CountySale };

/** The address the search is measured from. */
export type SearchPoint = { street: string; zip: string; lat: number; lng: number };

export type Lead = {
  priority_score: number;
  street_address: string;
  city: string;
  zip: string;
  sale_date: string;
  sale_price: number | null;
  days_since_sale: number;
  /** Straight-line miles from the search address. */
  straight_line_miles: number;
  property_type: string;
  living_sqft: string;
  owner_on_record: string;
  owner_mailing_address: string;
  parcel_id: string;
  /** The appraiser's page for this parcel: where a pool would be listed. */
  county_page: string;
};

export type LeadResult = {
  leads: Lead[];
  /** Reason → how many sales it removed. */
  excluded: Record<string, number>;
  /** The latest sale in what the county returned. */
  newestSale: string | null;
};

export type LeadFilters = {
  lookbackDays: number;
  radius: number;
  /** Sale-price range in dollars; null leaves that side open. */
  minPrice: number | null;
  maxPrice: number | null;
  /** Only Florida use code 01xx (single-family). Off: any home (01, 02, 04, 08). */
  singleFamilyOnly: boolean;
  /** Only the county's "Q" (qualified) sales: leaves out bundled multi-parcel sales and the like. */
  qualifiedOnly: boolean;
};

export const countyPage = (strap: string): string => `https://www.pcpao.gov/property-details?s=${strap}`;

/**
 * Florida's property-use codes by their first two digits (the Department of
 * Revenue's statewide classes; Pinellas adds two more digits for detail).
 */
const USE_CLASS: Record<string, string> = {
  '00': 'Vacant land',
  '01': 'Single-family',
  '02': 'Mobile home',
  '04': 'Condo',
  '08': 'Multi-family (2–9 units)',
};
const HOME_CLASSES = new Set(['01', '02', '04', '08']);

export const propertyType = (useCode: string): string => USE_CLASS[useCode.slice(0, 2)] ?? `Other (${useCode || 'no code'})`;

// ── Addresses ────────────────────────────────────────────────────────────────

const STREET_WORDS: Record<string, string> = {
  STREET: 'ST', AVENUE: 'AVE', BOULEVARD: 'BLVD', DRIVE: 'DR', ROAD: 'RD', LANE: 'LN',
  COURT: 'CT', CIRCLE: 'CIR', PLACE: 'PL', TERRACE: 'TER', PARKWAY: 'PKWY', HIGHWAY: 'HWY',
  NORTH: 'N', SOUTH: 'S', EAST: 'E', WEST: 'W',
  NORTHEAST: 'NE', NORTHWEST: 'NW', SOUTHEAST: 'SE', SOUTHWEST: 'SW',
};

/**
 * "4424 19th Street North" and "4424 19TH ST N" are the same house. Street +
 * 5-digit ZIP, upper-cased, punctuation dropped, common words abbreviated.
 * Used to leave the search address itself out of its own results.
 */
export const addressKey = (street: string, zip: string): string => {
  const s = street
    .toUpperCase()
    .replace(/[.,#]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => STREET_WORDS[w] ?? w)
    .join(' ');
  return s ? `${s}|${zip.trim().slice(0, 5)}` : '';
};

const KEEP_UPPER = new Set(['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW', 'US', 'FL']);

/** "3643 20TH ST N" → "3643 20th St N"; "ST PETERSBURG" → "St Petersburg". */
export const titleCase = (s: string): string =>
  s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (KEEP_UPPER.has(w.toUpperCase()) ? w.toUpperCase() : /^\d/.test(w) ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');

// ── Numbers and distance ─────────────────────────────────────────────────────

/** "$612,000", "612000", "612,000.00" → 612000; null when there's no number. */
export const money = (v: string | undefined): number | null => {
  const s = (v ?? '').replace(/[$,\s]/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** $612,000 → "$612k", $1,250,000 → "$1.25M": for labels, not the data. */
export const shortMoney = (n: number): string =>
  n >= 1_000_000 ? `$${+(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}k`;

/** Straight-line (great-circle) miles. Not driving distance. */
export const milesBetween = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
};

const daysBetween = (fromIso: string, toIso: string): number =>
  Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);

// ── Ranking ──────────────────────────────────────────────────────────────────

/**
 * Score 0–100: 60% how recently it sold (a new owner picks a pool company in
 * the first weeks), 40% how close it is to the search address. Both scale
 * linearly across the chosen window and radius.
 */
const score = (days: number, lookbackDays: number, miles: number, radius: number): number =>
  Math.round(100 * (0.6 * (1 - days / lookbackDays) + 0.4 * (1 - miles / radius)));

export const rankLeads = ({
  center,
  sales,
  today,
  filters,
}: {
  center: SearchPoint;
  sales: CountySale[];
  /** YYYY-MM-DD in Florida, as the server measured the window. */
  today: string;
  filters: LeadFilters;
}): LeadResult => {
  const { lookbackDays, radius, minPrice, maxPrice, singleFamilyOnly, qualifiedOnly } = filters;
  if (!(radius > 0)) throw new Error('Distance must be more than 0 miles.');
  if (!(lookbackDays > 0)) throw new Error('Sold-within must be more than 0 days.');
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    throw new Error('The minimum price is above the maximum.');
  }

  const excluded: Record<string, number> = {};
  const drop = (reason: string) => (excluded[reason] = (excluded[reason] ?? 0) + 1);
  const centerKey = addressKey(center.street, center.zip);

  // One row per parcel: a home that sold twice in the window is one lead, at its latest sale.
  const latest = new Map<string, CountySale>();
  let newestSale: string | null = null;
  for (const s of sales) {
    if (!newestSale || s.saleDate > newestSale) newestSale = s.saleDate;
    const prev = latest.get(s.strap);
    if (prev) {
      drop('Older sale of the same home');
      if (s.saleDate <= prev.saleDate) continue;
    }
    latest.set(s.strap, s);
  }

  const priced = minPrice !== null || maxPrice !== null;
  const leads: Lead[] = [];
  for (const s of latest.values()) {
    const days = daysBetween(s.saleDate, today);
    if (days > lookbackDays) {
      drop(`Sold more than ${lookbackDays} days ago`);
      continue;
    }
    const useClass = s.useCode.slice(0, 2);
    if (useClass === '00') {
      drop('Vacant land');
      continue;
    }
    if (singleFamilyOnly ? useClass !== '01' : !HOME_CLASSES.has(useClass)) {
      drop(singleFamilyOnly ? 'Not a single-family home' : 'Not a home');
      continue;
    }
    if (qualifiedOnly && s.qualified !== 'Q') {
      drop('Not a qualified sale');
      continue;
    }
    if (priced) {
      if (s.price === null) {
        drop('No sale price on record');
        continue;
      }
      if (minPrice !== null && s.price < minPrice) {
        drop(`Sold under ${shortMoney(minPrice)}`);
        continue;
      }
      if (maxPrice !== null && s.price > maxPrice) {
        drop(`Sold over ${shortMoney(maxPrice)}`);
        continue;
      }
    }
    if (!s.address) {
      drop('No street address on record');
      continue;
    }
    if (addressKey(s.address, s.zip) === centerKey) {
      drop('The search address itself');
      continue;
    }
    // The county measured to the parcel's point too; re-measured here so the
    // distance shown is the one the filter used.
    const miles = milesBetween(center.lat, center.lng, s.lat, s.lng);
    if (miles > radius) {
      drop(`More than ${radius} mi away`);
      continue;
    }

    leads.push({
      priority_score: score(days, lookbackDays, miles, radius),
      street_address: titleCase(s.address),
      city: titleCase(s.city),
      zip: s.zip,
      sale_date: s.saleDate,
      sale_price: s.price,
      days_since_sale: days,
      straight_line_miles: Math.round(miles * 100) / 100,
      property_type: propertyType(s.useCode),
      living_sqft: s.livingSqft,
      owner_on_record: s.owner,
      owner_mailing_address: s.mailing,
      parcel_id: s.strap,
      county_page: countyPage(s.strap),
    });
  }

  leads.sort((a, b) => b.priority_score - a.priority_score || b.sale_date.localeCompare(a.sale_date));
  return { leads, excluded, newestSale };
};
