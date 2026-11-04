/**
 * Recent sales from the Pinellas County Property Appraiser's public map
 * server, for the admin lead finder.
 *
 * Two public layers, joined on the 18-digit parcel number (STRAP):
 *   1. The appraiser's sales layers (one per year: SalesCurrentYear and the
 *      four before it): sale date, price, property-use code, the qualified-sale
 *      flag, living area and the parcel's map point. The county does the radius
 *      search itself.
 *   2. The county's parcel layer: site address, city, ZIP, the owner on record
 *      with their mailing address, and the lot's outline (for the pool check
 *      on the aerial photo). Its own sale fields are empty, which is why the
 *      sales come from (1).
 *
 * What neither layer has is POOLS. The appraiser lists a pool under "Extra
 * Features" on each property's page only, and that site refuses automated
 * reads, so the lead finder looks for water inside the lot outline on the
 * county's aerial photo instead (see aerial.ts and leads/poolCheck.ts).
 *
 * Kept light on the county's servers: one radius query per year layer (paged
 * past 2,000 rows), then the address lookups in batches. Timeouts throughout,
 * because a slow county server must fail the search, not hang it.
 */

const SALES_BASE = 'https://egis.pinellas.gov/pcpagis/rest/services/Pcpao_gov';
const PARCELS = 'https://egis.pinellas.gov/gis/rest/services/PublicWebGIS/Parcels/MapServer/1/query';

/** Year layers, newest first: index = how many years back. */
const YEAR_LAYERS = [
  'SalesCurrentYear',
  'SalesYearMinusOne',
  'SalesYearMinusTwo',
  'SalesYearMinusThree',
  'SalesYearMinusFour',
];

const PAGE = 2000;
/** Hard stop on rows per search: a 10-mile, 4-year search shouldn't page forever. */
export const MAX_ROWS = 8000;
const ADDRESS_BATCH = 100;

export type CountySale = {
  strap: string;
  saleDate: string;
  price: number | null;
  useCode: string;
  qualified: string;
  livingSqft: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  zip: string;
  owner: string;
  mailing: string;
  /** The lot's outer boundary as [lng, lat] points, or null if the parcel had none. */
  ring: Array<[number, number]> | null;
};

/** Outline points kept per lot: plenty for a residential lot, bounded for odd ones. */
const MAX_RING_POINTS = 80;

export type CountyResult = { sales: CountySale[]; truncated: boolean; loadedAt: string | null };

type Feature = {
  attributes: Record<string, unknown>;
  /** A point (sales layer) or a polygon's rings (parcel layer). */
  geometry?: { x?: number; y?: number; rings?: Array<Array<[number, number]>> };
};
type QueryResponse = { features?: Feature[]; exceededTransferLimit?: boolean; error?: { message?: string } };

const post = async (url: string, params: Record<string, string | number>): Promise<QueryResponse> => {
  const body = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), f: 'json' });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`county_${res.status}`);
  const data = (await res.json()) as QueryResponse;
  if (data.error) throw new Error(`county_error: ${String(data.error.message ?? '').slice(0, 120)}`);
  return data;
};

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : v === null || v === undefined ? '' : String(v));

/** The county stores dates as epoch milliseconds at midnight UTC. */
const dayOf = (v: unknown): string | null =>
  typeof v === 'number' && Number.isFinite(v) ? new Date(v).toISOString().slice(0, 10) : null;

export const fetchCountySales = async ({
  lat,
  lng,
  radius,
  from,
  thisYear,
}: {
  lat: number;
  lng: number;
  radius: number;
  /** YYYY-MM-DD: the earliest sale date wanted. */
  from: string;
  /** The current year in Florida, which SalesCurrentYear covers. */
  thisYear: number;
}): Promise<CountyResult> => {
  const firstYear = Number(from.slice(0, 4));
  const layers = YEAR_LAYERS.slice(0, Math.min(YEAR_LAYERS.length, thisYear - firstYear + 1));

  const raw: Feature[] = [];
  let truncated = false;
  let loadedAt: string | null = null;

  for (const layer of layers) {
    for (let offset = 0; ; offset += PAGE) {
      const data = await post(`${SALES_BASE}/${layer}/MapServer/0/query`, {
        where: `DOS >= DATE '${from}'`,
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: 4326,
        spatialRel: 'esriSpatialRelIntersects',
        distance: radius,
        units: 'esriSRUnit_StatuteMile',
        outFields: 'STRAP,SALE_PRICE,DOS,USE_CD,QUALIFIED_FLG,TOTAL_LIVING_SQFT_DISPLAY,LOAD_DATE',
        outSR: 4326,
        orderByFields: 'DOS DESC',
        resultOffset: offset,
        resultRecordCount: PAGE,
      });
      const features = data.features ?? [];
      raw.push(...features);
      if (!loadedAt) loadedAt = dayOf(features[0]?.attributes.LOAD_DATE);
      if (raw.length >= MAX_ROWS) {
        truncated = true;
        break;
      }
      if (!data.exceededTransferLimit || features.length === 0) break;
    }
    if (truncated) break;
  }

  // Addresses and owners, by parcel. STRAPs are checked to be 18 digits before
  // they go into the query text.
  const straps = [...new Set(raw.map((f) => str(f.attributes.STRAP)).filter((s) => /^\d{18}$/.test(s)))];
  const parcels = new Map<string, Record<string, unknown>>();
  const rings = new Map<string, Array<[number, number]>>();
  const batches: string[][] = [];
  for (let i = 0; i < straps.length; i += ADDRESS_BATCH) batches.push(straps.slice(i, i + ADDRESS_BATCH));
  // A few at a time: fast enough, and polite to the county's server.
  for (let i = 0; i < batches.length; i += 4) {
    const results = await Promise.all(
      batches.slice(i, i + 4).map((batch) =>
        post(PARCELS, {
          where: `STRAP IN (${batch.map((s) => `'${s}'`).join(',')})`,
          outFields: 'STRAP,SITE_ADDRESS,SITE_CITY,SITE_ZIP,OWNER1,OWNADD_1,OWNCITY,OWNSTATE,OWNZIP',
          returnGeometry: 'true',
          outSR: 4326,
          geometryPrecision: 6,
        }),
      ),
    );
    for (const r of results) {
      for (const f of r.features ?? []) {
        const strap = str(f.attributes.STRAP);
        parcels.set(strap, f.attributes);
        const ring = f.geometry?.rings?.[0];
        if (ring && ring.length >= 3) {
          const step = Math.ceil(ring.length / MAX_RING_POINTS);
          rings.set(strap, ring.filter((_, i) => i % step === 0));
        }
      }
    }
  }

  const sales: CountySale[] = [];
  for (const f of raw) {
    const a = f.attributes;
    const strap = str(a.STRAP);
    const saleDate = dayOf(a.DOS);
    const y = f.geometry?.y;
    const x = f.geometry?.x;
    if (!saleDate || typeof y !== 'number' || typeof x !== 'number') continue;
    const p = parcels.get(strap) ?? {};
    const mailing = [str(p.OWNADD_1), [str(p.OWNCITY), str(p.OWNSTATE)].filter(Boolean).join(', '), str(p.OWNZIP)]
      .filter(Boolean)
      .join(' ');
    const price = typeof a.SALE_PRICE === 'number' && a.SALE_PRICE > 0 ? a.SALE_PRICE : null;
    sales.push({
      strap,
      saleDate,
      price,
      useCode: str(a.USE_CD),
      qualified: str(a.QUALIFIED_FLG),
      livingSqft: str(a.TOTAL_LIVING_SQFT_DISPLAY),
      lat: y,
      lng: x,
      address: str(p.SITE_ADDRESS),
      city: str(p.SITE_CITY),
      zip: str(p.SITE_ZIP).slice(0, 5),
      owner: str(p.OWNER1),
      mailing,
      ring: rings.get(strap) ?? null,
    });
  }
  return { sales, truncated, loadedAt };
};
