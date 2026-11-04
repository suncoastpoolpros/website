/**
 * New-homeowner leads: recently sold homes with a pool within a set distance
 * of one address you choose, optionally inside a sale-price range. Pure
 * functions over the county sales CSV, run in the browser, so the file never
 * reaches the server.
 *
 * Nothing is guessed. A sale with no coordinates, no readable date, no pool on
 * record or (when a price range is set) no price is EXCLUDED and counted under
 * its reason, never filled in, so the exclusion counts explain every row that
 * didn't become a lead.
 */
import type { CsvRow } from './csv';

export const SALES_COLUMNS = [
  'street_address',
  'city',
  'state',
  'zip',
  'sale_date',
  'has_pool',
  'latitude',
  'longitude',
] as const;

/** Columns that must be present in a file's header row; [] when it has them all. */
export const missingColumns = (rows: CsvRow[], required: readonly string[]): string[] =>
  rows.length ? required.filter((k) => !(k in rows[0])) : [...required];

/** The address the search is measured from. */
export type SearchPoint = { street: string; zip: string; lat: number; lng: number };

export type Lead = {
  parcel_id: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  sale_date: string;
  sale_price: string;
  days_since_sale: number;
  /** Straight-line miles from the search address. */
  straight_line_miles: number;
  priority_score: number;
};

export type LeadResult = {
  leads: Lead[];
  /** Reason → how many sales it removed. */
  excluded: Record<string, number>;
  /** The latest sale on or before the as-of date: how fresh the county data is. */
  newestSale: string | null;
};

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
 * Used to fold repeat sales of one home together, and to leave the search
 * address itself out of its own results.
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

// ── Numbers, coordinates and dates ───────────────────────────────────────────

const num = (v: string | undefined): number | null => {
  if (v === undefined || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

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

/** A generous box around Florida: catches swapped lat/lng and 0,0 rows. */
const inFlorida = (lat: number, lng: number): boolean => lat > 24 && lat < 31.5 && lng > -88 && lng < -79.5;

/** Straight-line (great-circle) miles. Not driving distance. */
export const milesBetween = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** YYYY-MM-DD or M/D/YYYY → YYYY-MM-DD, or null when it isn't a real date. */
export const isoDate = (raw: string): string | null => {
  const s = raw.trim();
  let y: number, m: number, d: number;
  let hit = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (hit) [y, m, d] = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
  else if ((hit = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s))) [m, d, y] = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
  else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
};

const daysBetween = (fromIso: string, toIso: string): number =>
  Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);

/** "Y", "yes", "true", "1", "pool", or a positive count/area all mean a pool. */
const hasPool = (raw: string | undefined): boolean => {
  const s = (raw ?? '').trim();
  if (!s) return false;
  const n = Number(s);
  if (Number.isFinite(n)) return n > 0;
  return /^(y|yes|true|pool)$/i.test(s);
};

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
  asOf,
  lookbackDays,
  radius,
  minPrice = null,
  maxPrice = null,
}: {
  center: SearchPoint;
  sales: CsvRow[];
  asOf: string;
  lookbackDays: number;
  radius: number;
  /** Sale-price range in dollars; null leaves that side open. */
  minPrice?: number | null;
  maxPrice?: number | null;
}): LeadResult => {
  const asOfIso = isoDate(asOf);
  if (!asOfIso) throw new Error('As-of date must be a real date (YYYY-MM-DD).');
  if (!(radius > 0)) throw new Error('Distance must be more than 0 miles.');
  if (!(lookbackDays > 0)) throw new Error('Sold-within must be more than 0 days.');
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    throw new Error('The minimum price is above the maximum.');
  }

  const excluded: Record<string, number> = {};
  const drop = (reason: string) => (excluded[reason] = (excluded[reason] ?? 0) + 1);
  const centerKey = addressKey(center.street, center.zip);

  // One row per home: a house that sold twice in the file is one lead, at its latest sale.
  const latest = new Map<string, { row: CsvRow; date: string }>();
  let newestSale: string | null = null;
  for (const row of sales) {
    const key = addressKey(row.street_address ?? '', row.zip ?? '');
    if (!key) {
      drop('No street address');
      continue;
    }
    const date = isoDate(row.sale_date ?? '');
    if (!date) {
      drop('Unreadable sale date');
      continue;
    }
    if (date <= asOfIso && (!newestSale || date > newestSale)) newestSale = date;
    const prev = latest.get(key);
    if (prev) {
      drop('Older sale of the same home');
      if (date <= prev.date) continue;
    }
    latest.set(key, { row, date });
  }

  const priced = minPrice !== null || maxPrice !== null;
  const leads: Lead[] = [];
  for (const [key, { row, date }] of latest) {
    const days = daysBetween(date, asOfIso);
    if (days < 0) {
      drop('Sold after the as-of date');
      continue;
    }
    if (days > lookbackDays) {
      drop(`Sold more than ${lookbackDays} days before`);
      continue;
    }
    if (!hasPool(row.has_pool)) {
      drop('No pool on record');
      continue;
    }
    if (priced) {
      const price = money(row.sale_price);
      if (price === null) {
        drop('No sale price on record');
        continue;
      }
      if (minPrice !== null && price < minPrice) {
        drop(`Sold under ${shortMoney(minPrice)}`);
        continue;
      }
      if (maxPrice !== null && price > maxPrice) {
        drop(`Sold over ${shortMoney(maxPrice)}`);
        continue;
      }
    }
    if (key === centerKey) {
      drop('The search address itself');
      continue;
    }
    const lat = num(row.latitude);
    const lng = num(row.longitude);
    if (lat === null || lng === null || !inFlorida(lat, lng)) {
      drop('Missing or bad coordinates');
      continue;
    }
    const miles = milesBetween(center.lat, center.lng, lat, lng);
    if (miles > radius) {
      drop(`More than ${radius} mi away`);
      continue;
    }

    leads.push({
      parcel_id: row.parcel_id ?? '',
      street_address: row.street_address,
      city: row.city ?? '',
      state: row.state ?? '',
      zip: row.zip ?? '',
      sale_date: date,
      sale_price: row.sale_price ?? '',
      days_since_sale: days,
      straight_line_miles: Math.round(miles * 100) / 100,
      priority_score: score(days, lookbackDays, miles, radius),
    });
  }

  leads.sort((a, b) => b.priority_score - a.priority_score || b.sale_date.localeCompare(a.sale_date));
  return { leads, excluded, newestSale };
};
