/**
 * New-homeowner leads: recently sold homes with a pool, near a stop we already
 * drive to. Pure functions over two CSVs (route stops, property sales), run in
 * the browser, so neither file ever reaches the server.
 *
 * Nothing is guessed. A sale with no coordinates, no readable date or no pool
 * on record is EXCLUDED and counted under its reason, never filled in, so the
 * exclusion counts explain every row that didn't become a lead.
 */
import type { CsvRow } from './csv';

export const ROUTE_COLUMNS = ['stop_id', 'street_address', 'city', 'state', 'zip'] as const;
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

export type RouteStop = {
  stopId: string;
  street: string;
  city: string;
  zip: string;
  key: string;
  lat: number | null;
  lng: number | null;
  technician: string;
  serviceDay: string;
};

export type RouteIssue = { issue: string; stopId: string; detail: string };

export type RouteAudit = {
  stops: RouteStop[];
  scheduledStops: number;
  distinctProperties: number;
  geocodedStops: number;
  issues: RouteIssue[];
};

export type Lead = {
  parcel_id: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  sale_date: string;
  sale_price: string;
  days_since_sale: number;
  straight_line_miles: number;
  nearest_route_stop_id: string;
  nearest_technician: string;
  nearest_service_day: string;
  /** How many of our stops are within a mile: a street we're already on. */
  stops_within_1_mile: number;
  priority_score: number;
  /** 'file' (the sales CSV) or 'hand' (typed into the page). */
  source: string;
};

/** What happened to one home added by hand: a lead, or the reason it isn't. */
export type HandCheck = { street_address: string; lead: Lead | null; reason: string | null; detail: string };

export type LeadResult = {
  leads: Lead[];
  /** Reason → how many sales it removed. */
  excluded: Record<string, number>;
  needsRouteCoordinates: boolean;
  /** The latest sale on or before the as-of date: how fresh the county data is. */
  newestSale: string | null;
  /** One entry per home added by hand, in the order added. */
  handChecks: HandCheck[];
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
 * Used to spot a sale that is already one of our stops.
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

// ── Coordinates and dates ────────────────────────────────────────────────────

const num = (v: string | undefined): number | null => {
  if (v === undefined || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

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

// ── Routes ───────────────────────────────────────────────────────────────────

export const auditRoutes = (rows: CsvRow[]): RouteAudit => {
  const issues: RouteIssue[] = [];
  const seenIds = new Set<string>();
  const keys = new Set<string>();
  const stops: RouteStop[] = [];

  rows.forEach((r, i) => {
    const stopId = r.stop_id || `row ${i + 2}`;
    const street = r.street_address ?? '';
    const zip = r.zip ?? '';
    if (r.stop_id && seenIds.has(r.stop_id)) issues.push({ issue: 'Duplicate stop ID', stopId, detail: 'appears more than once' });
    seenIds.add(r.stop_id);

    const key = addressKey(street, zip);
    if (!key) issues.push({ issue: 'Missing address', stopId, detail: 'no street address' });
    else keys.add(key);

    let lat = num(r.latitude);
    let lng = num(r.longitude);
    if (lat === null || lng === null) {
      issues.push({ issue: 'Missing coordinates', stopId, detail: street || 'no address' });
      lat = lng = null;
    } else if (!inFlorida(lat, lng)) {
      issues.push({ issue: 'Coordinates outside Florida', stopId, detail: `${lat}, ${lng}: swapped or wrong` });
      lat = lng = null;
    }

    stops.push({
      stopId,
      street,
      city: r.city ?? '',
      zip,
      key,
      lat,
      lng,
      technician: r.technician ?? '',
      serviceDay: r.service_day ?? r.day ?? '',
    });
  });

  return {
    stops,
    scheduledStops: rows.length,
    distinctProperties: keys.size,
    geocodedStops: stops.filter((s) => s.lat !== null).length,
    issues,
  };
};

// ── Ranking ──────────────────────────────────────────────────────────────────

/**
 * Score 0–100: 60% how recently it sold (a new owner picks a pool company in
 * the first weeks), 40% how close it is to a stop (close means it slots into a
 * route we already drive). Both scale linearly across the chosen window and
 * radius.
 */
const score = (days: number, lookbackDays: number, miles: number, radius: number): number =>
  Math.round(100 * (0.6 * (1 - days / lookbackDays) + 0.4 * (1 - miles / radius)));

export const rankLeads = ({
  stops,
  sales,
  asOf,
  lookbackDays,
  radius,
}: {
  stops: RouteStop[];
  sales: CsvRow[];
  asOf: string;
  lookbackDays: number;
  radius: number;
}): LeadResult => {
  const asOfIso = isoDate(asOf);
  if (!asOfIso) throw new Error('As-of date must be a real date (YYYY-MM-DD).');
  if (!(radius > 0)) throw new Error('Radius must be more than 0 miles.');
  if (!(lookbackDays > 0)) throw new Error('Sold-within must be more than 0 days.');

  const excluded: Record<string, number> = {};
  const handChecks: HandCheck[] = [];
  // A home added by hand is one you're asking about on purpose, so it always
  // gets an answer: its own reason here, not only a line in the counts.
  const drop = (reason: string, row?: CsvRow, detail = '') => {
    excluded[reason] = (excluded[reason] ?? 0) + 1;
    if (row?.source === 'hand') handChecks.push({ street_address: row.street_address, lead: null, reason, detail });
  };

  const geocoded = stops.filter((s): s is RouteStop & { lat: number; lng: number } => s.lat !== null && s.lng !== null);
  const customerKeys = new Set(stops.map((s) => s.key).filter(Boolean));

  // One row per home: a house that sold twice in the file is one lead, at its latest sale.
  const latest = new Map<string, { row: CsvRow; date: string }>();
  let newestSale: string | null = null;
  for (const row of sales) {
    const key = addressKey(row.street_address ?? '', row.zip ?? '');
    if (!key) {
      drop('No street address', row);
      continue;
    }
    const date = isoDate(row.sale_date ?? '');
    if (!date) {
      drop('Unreadable sale date', row);
      continue;
    }
    if (date <= asOfIso && (!newestSale || date > newestSale)) newestSale = date;
    const prev = latest.get(key);
    if (prev) {
      if (date <= prev.date) {
        drop('Older sale of the same home', row);
        continue;
      }
      drop('Older sale of the same home', prev.row);
    }
    latest.set(key, { row, date });
  }

  const leads: Lead[] = [];
  for (const [key, { row, date }] of latest) {
    const days = daysBetween(date, asOfIso);
    if (days < 0) {
      drop('Sold after the as-of date', row);
      continue;
    }
    if (days > lookbackDays) {
      drop(`Sold more than ${lookbackDays} days before`, row);
      continue;
    }
    if (!hasPool(row.has_pool)) {
      drop('No pool on record', row);
      continue;
    }
    if (customerKeys.has(key)) {
      drop('Already one of our stops', row);
      continue;
    }
    const lat = num(row.latitude);
    const lng = num(row.longitude);
    if (lat === null || lng === null || !inFlorida(lat, lng)) {
      drop('Missing or bad coordinates', row);
      continue;
    }
    if (!geocoded.length) {
      drop('No geocoded route stops to measure from', row);
      continue;
    }

    let nearest = geocoded[0];
    let best = Infinity;
    let within1 = 0;
    for (const s of geocoded) {
      const d = milesBetween(lat, lng, s.lat, s.lng);
      if (d < best) {
        best = d;
        nearest = s;
      }
      if (d <= 1) within1++;
    }
    if (best > radius) {
      drop(`More than ${radius} mi from a stop`, row, `${best.toFixed(2)} mi from stop ${nearest.stopId}`);
      continue;
    }

    const lead: Lead = {
      parcel_id: row.parcel_id ?? '',
      street_address: row.street_address,
      city: row.city ?? '',
      state: row.state ?? '',
      zip: row.zip ?? '',
      sale_date: date,
      sale_price: row.sale_price ?? '',
      days_since_sale: days,
      straight_line_miles: Math.round(best * 100) / 100,
      nearest_route_stop_id: nearest.stopId,
      nearest_technician: nearest.technician,
      nearest_service_day: nearest.serviceDay,
      stops_within_1_mile: within1,
      priority_score: score(days, lookbackDays, best, radius),
      source: row.source === 'hand' ? 'hand' : 'file',
    };
    leads.push(lead);
    if (row.source === 'hand') handChecks.push({ street_address: lead.street_address, lead, reason: null, detail: '' });
  }

  leads.sort((a, b) => b.priority_score - a.priority_score || b.sale_date.localeCompare(a.sale_date));
  return { leads, excluded, needsRouteCoordinates: sales.length > 0 && geocoded.length === 0, newestSale, handChecks };
};
