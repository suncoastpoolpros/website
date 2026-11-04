/**
 * /admin → New Homeowner Leads. Recent Pinellas sales within a set distance of
 * one address, narrowed by property type, sale type and price.
 *
 * The search address is typed and picked from the site's address lookup,
 * which supplies its map position. Find leads asks /api/admin/county-sales for
 * every sale in the radius and window (straight from the Property Appraiser's
 * public map server), then ranks and filters them here (leads/leadEngine.ts),
 * so each filter's toll shows in the exclusion counts. The only thing stored is
 * a summary of the run (settings and counts, never an address), so the page
 * can say when it last ran and what it found. The leads leave as a CSV for the
 * CRM, where outreach lives; nothing here contacts anyone.
 *
 * Pools aren't in the county's map data, and the appraiser's site refuses
 * automated reads, so each lead's lot is checked for pool water on the county's
 * aerial photo right after the search (leads/poolCheck.ts), with the photo on
 * the card and a link to the property page to confirm.
 *
 * Styled on the homepage's kit (adminKit.tsx): white cards on the light
 * section blue, the homepage's fields, and the gold button for the one action.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Download, ExternalLink, History, LoaderCircle, MapPin } from 'lucide-react';
import { AddressAutocomplete, type Suggestion } from '@/components/landing/AddressAutocomplete';
import {
  AdminBody,
  AdminHeader,
  Card,
  PageHead,
  Stat,
  bodyText,
  buttonClass,
  cardClass,
  fieldLabel,
  inputClass,
  mutedText,
  notice,
  smallButton,
  tileClass,
} from './adminKit';
import { ago, onDate, onDateTime } from './quoteFormat';
import { toCSV } from './leads/csv';
import { checkPool, type PoolCheck } from './leads/poolCheck';
import {
  money,
  rankLeads,
  shortMoney,
  type CountySale,
  type Lead,
  type LeadResult,
  type SearchPoint,
} from './leads/leadEngine';

type Run = {
  id: number;
  ran_at: string;
  as_of: string;
  lookback_days: number;
  radius_miles: number;
  route_stops: number;
  sales_rows: number;
  leads_found: number;
  newest_sale: string | null;
  routes_file: string | null;
  sales_file: string | null;
};

type RunHistory =
  | { kind: 'loading' }
  | { kind: 'ready'; storage: boolean; runs: Run[]; total: number }
  | { kind: 'error' };

type Settings = {
  lookbackDays: string;
  radius: string;
  minPrice: string;
  maxPrice: string;
  singleFamilyOnly: boolean;
  qualifiedOnly: boolean;
};

/** The search address, with the full line it was picked as. */
type Center = SearchPoint & { label: string };

type CountyResponse = {
  ok?: boolean;
  error?: string;
  today?: string;
  sales?: CountySale[];
  truncated?: boolean;
  loadedAt?: string | null;
};

const SETTINGS_KEY = 'scpp_admin_lead_settings';
const CENTER_KEY = 'scpp_admin_lead_center';
/** The county endpoint's own limits. */
const MAX_RADIUS = 10;
const MAX_DAYS = 1460;

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const store = (key: string, value: unknown) => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage disabled or full: it just won't be remembered next visit */
  }
};

const readSettings = (): Settings => {
  const saved = readStored<Partial<Settings>>(SETTINGS_KEY, {});
  return {
    lookbackDays: saved.lookbackDays ?? '90',
    radius: saved.radius ?? '1',
    minPrice: saved.minPrice ?? '',
    maxPrice: saved.maxPrice ?? '',
    singleFamilyOnly: saved.singleFamilyOnly ?? true,
    qualifiedOnly: saved.qualifiedOnly ?? true,
  };
};

/** A week without a run is worth flagging: new owners pick a company early. */
const STALE_DAYS = 7;

const LEAD_COLUMNS = [
  'pool_on_aerial',
  'pool_water_m2',
  'street_address',
  'city',
  'zip',
  'sale_date',
  'sale_price',
  'days_since_sale',
  'straight_line_miles',
  'property_type',
  'living_sqft',
  'owner_on_record',
  'owner_mailing_address',
  'parcel_id',
  'county_page',
];

type SortKey = 'newest' | 'closest' | 'price' | 'pool';

/** More leads than this and the rest are checked as you open them, not all at once. */
const POOL_CHECK_LIMIT = 250;
/** Aerial photos fetched at a time: quick, and light on the county's image server. */
const POOL_CHECK_CONCURRENCY = 4;

const POOL_RANK: Record<string, number> = { seen: 0, possible: 1, none: 2, error: 3 };

const POOL_LABEL: Record<string, { text: string; cls: string }> = {
  seen: { text: 'Pool seen', cls: 'bg-[#e7f6ee] text-[#13804b]' },
  possible: { text: 'Possible pool', cls: 'bg-[#fff8e1] text-[#8a6100]' },
  none: { text: 'No pool seen', cls: 'bg-sc-mist text-sc-navy/60' },
  error: { text: 'Photo unavailable', cls: 'bg-sc-mist text-sc-navy/60' },
};

const poolCsv = (c: PoolCheck | undefined): string =>
  !c ? 'not checked' : c.status === 'seen' ? 'seen' : c.status === 'possible' ? 'possible' : c.status === 'none' ? 'none seen' : 'photo unavailable';

/** "Oct 31": the year is in the run history; this tile only has room for the day. */
const monthDay = (iso: string): string =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const dollars = (n: number): string => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

/** "$400k–$900k", "over $400k", "under $900k" or '' for no range. */
const priceRange = (min: number | null, max: number | null): string =>
  min !== null && max !== null
    ? `${shortMoney(min)}–${shortMoney(max)}`
    : min !== null
      ? `over ${shortMoney(min)}`
      : max !== null
        ? `under ${shortMoney(max)}`
        : '';

/**
 * The search address. It has to be PICKED from the suggestions: that is where
 * its map position comes from, and a typed address with no position can't be
 * measured from.
 */
const CenterPicker = ({ center, onChange }: { center: Center | null; onChange: (c: Center | null) => void }) => {
  const [noPosition, setNoPosition] = useState(false);

  if (center) {
    return (
      <div className={`${tileClass} flex items-center gap-3 px-4 py-3`}>
        <MapPin className="h-5 w-5 shrink-0 text-sc-blue" />
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-sc-navy">{center.label}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 text-[14px] font-semibold text-sc-navy underline decoration-sc-navy/30 underline-offset-[3px] transition hover:decoration-sc-navy"
        >
          Change
        </button>
      </div>
    );
  }

  const pick = (s: Suggestion | null) => {
    if (!s) return setNoPosition(false);
    if (typeof s.lat !== 'number' || typeof s.lng !== 'number') return setNoPosition(true);
    const zip = /\b(\d{5})\b/.exec(s.line2)?.[1] ?? '';
    onChange({ label: s.full, street: s.line1, zip, lat: s.lat, lng: s.lng });
  };

  return (
    <div>
      <span className={fieldLabel}>Address</span>
      <div className="flex rounded-[10px] bg-white ring-1 ring-sc-navy/[0.18] focus-within:ring-2 focus-within:ring-sc-blue/50">
        <AddressAutocomplete name="lead-center" placeholder="Start typing an address" onPick={pick} />
      </div>
      {noPosition ? (
        <p className={`mt-2 ${notice.error}`}>That address came back without a map position. Try another match.</p>
      ) : (
        <p className={`mt-2 ${mutedText}`}>Any Pinellas address. Pick it from the list so it can be placed on the map.</p>
      )}
    </div>
  );
};

const Toggle = ({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) => (
  <label className="flex cursor-pointer items-start gap-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 h-4 w-4 shrink-0 accent-[#2676b6]"
    />
    <span>
      <span className="block text-[15px] font-semibold text-sc-navy">{label}</span>
      <span className={`block ${mutedText}`}>{hint}</span>
    </span>
  </label>
);

export const LeadFinder = ({ onLogout, onBack }: { onLogout: () => void; onBack: () => void }) => {
  const [center, setCenter] = useState<Center | null>(() => readStored<Center | null>(CENTER_KEY, null));
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [result, setResult] = useState<
    (LeadResult & { signature: string; checked: number; truncated: boolean; loadedAt: string | null }) | null
  >(null);
  const [runError, setRunError] = useState('');
  const [logNote, setLogNote] = useState('');
  const [history, setHistory] = useState<RunHistory>({ kind: 'loading' });
  const [showAll, setShowAll] = useState(false);
  const [running, setRunning] = useState(false);
  // Pool checks by parcel, filled in as the aerials come back.
  const [pools, setPools] = useState<Record<string, PoolCheck>>({});
  const [sort, setSort] = useState<SortKey>('newest');
  const [poolsOnly, setPoolsOnly] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/lead-runs');
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        storage?: boolean;
        runs?: Run[];
        total?: number;
      };
      if (res.status === 401) return onLogout();
      if (res.ok && data.ok) {
        setHistory({ kind: 'ready', storage: data.storage !== false, runs: data.runs ?? [], total: data.total ?? 0 });
      } else setHistory({ kind: 'error' });
    } catch {
      setHistory({ kind: 'error' });
    }
  }, [onLogout]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Remembered on this device: the filters and the last search address, so a
  // repeat search is one press.
  useEffect(() => store(SETTINGS_KEY, settings), [settings]);
  useEffect(() => store(CENTER_KEY, center), [center]);

  // After each search, check every lead's lot on the aerial photo, a few at a
  // time. A new search abandons the old queue.
  useEffect(() => {
    if (!result) return;
    setPools({});
    const ctrl = new AbortController();
    const queue = result.leads.filter((l) => l.ring).slice(0, POOL_CHECK_LIMIT);
    let next = 0;
    const worker = async () => {
      while (next < queue.length && !ctrl.signal.aborted) {
        const lead = queue[next++];
        let check: PoolCheck;
        try {
          check = await checkPool(lead.ring as Array<[number, number]>, ctrl.signal);
        } catch {
          if (ctrl.signal.aborted) return;
          check = { status: 'error', thumb: null };
        }
        if (!ctrl.signal.aborted) setPools((p) => ({ ...p, [lead.parcel_id]: check }));
      }
    };
    for (let i = 0; i < POOL_CHECK_CONCURRENCY; i++) worker();
    return () => ctrl.abort();
  }, [result]);

  const setText = (k: 'lookbackDays' | 'radius' | 'minPrice' | 'maxPrice') => (e: { target: { value: string } }) =>
    setSettings((s) => ({ ...s, [k]: e.target.value }));

  const minPrice = money(settings.minPrice);
  const maxPrice = money(settings.maxPrice);
  const radius = Number(settings.radius);
  const lookbackDays = Number(settings.lookbackDays);

  // What the results were computed from. When it no longer matches, the results
  // on screen are for different inputs and say so.
  const signature = [
    center?.label,
    settings.lookbackDays,
    settings.radius,
    minPrice,
    maxPrice,
    settings.singleFamilyOnly,
    settings.qualifiedOnly,
  ].join('|');

  const inputProblem = !center
    ? 'Pick an address to search around.'
    : !(radius > 0 && radius <= MAX_RADIUS)
      ? `Distance must be between 0 and ${MAX_RADIUS} miles.`
      : !(Number.isInteger(lookbackDays) && lookbackDays >= 1 && lookbackDays <= MAX_DAYS)
        ? `Sold within must be a whole number of days, up to ${MAX_DAYS} (4 years).`
        : '';

  const run = async () => {
    if (!center || inputProblem) return;
    setRunError('');
    setLogNote('');
    setShowAll(false);
    setRunning(true);
    const sig = signature;
    try {
      const res = await fetch('/api/admin/county-sales', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lat: center.lat, lng: center.lng, radius, days: lookbackDays }),
      });
      if (res.status === 401) return onLogout();
      const data = (await res.json().catch(() => ({}))) as CountyResponse;
      if (!res.ok || !data.ok || !data.sales || !data.today) {
        setResult(null);
        setRunError(
          data.error === 'county_unavailable'
            ? 'The county’s property server didn’t answer. Try again in a minute.'
            : data.error === 'bad_request'
              ? 'That search couldn’t be run. Check the address is in Pinellas and the numbers are in range.'
              : 'Something went wrong getting the county sales. Try again.',
        );
        return;
      }

      let out: LeadResult;
      try {
        out = rankLeads({
          center,
          sales: data.sales,
          today: data.today,
          filters: {
            lookbackDays,
            radius,
            minPrice,
            maxPrice,
            singleFamilyOnly: settings.singleFamilyOnly,
            qualifiedOnly: settings.qualifiedOnly,
          },
        });
      } catch (e) {
        setResult(null);
        setRunError(e instanceof Error ? e.message : String(e));
        return;
      }
      setResult({
        ...out,
        signature: sig,
        checked: data.sales.length,
        truncated: !!data.truncated,
        loadedAt: data.loadedAt ?? null,
      });

      const range = priceRange(minPrice, maxPrice);
      const logged = await fetch('/api/admin/lead-runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // Counts and settings only: the search address is not recorded.
        body: JSON.stringify({
          asOf: data.today,
          lookbackDays,
          radius,
          routeStops: 1,
          salesRows: data.sales.length,
          leadsFound: out.leads.length,
          newestSale: out.newestSale,
          salesFile: ['Pinellas County', settings.singleFamilyOnly ? 'single-family' : 'any home', range]
            .filter(Boolean)
            .join(' · '),
        }),
      });
      const log = (await logged.json().catch(() => ({}))) as { ok?: boolean; storage?: boolean };
      if (!logged.ok || !log.ok) setLogNote('This run worked, but it couldn’t be added to the run history.');
      else if (log.storage === false) setLogNote('This run worked. Run history isn’t set up yet, so it wasn’t recorded.');
      await fetchHistory();
    } catch {
      setRunError('Couldn’t reach the server. Check the connection and try again.');
    } finally {
      setRunning(false);
    }
  };

  const download = () => {
    if (!result) return;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
    const rows = visible.map((l) => {
      const c = pools[l.parcel_id];
      return { ...l, pool_on_aerial: poolCsv(c), pool_water_m2: c && c.status !== 'error' ? c.waterM2 : '' };
    });
    const blob = new Blob([toCSV(LEAD_COLUMNS, rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `new-homeowner-leads-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const last = history.kind === 'ready' ? history.runs[0] : undefined;
  const lastDays = last ? (Date.now() - new Date(last.ran_at).getTime()) / 86_400_000 : null;
  const stale = result && result.signature !== signature;
  const checkable = result ? Math.min(POOL_CHECK_LIMIT, result.leads.filter((l) => l.ring).length) : 0;
  const checked = Object.keys(pools).length;
  const poolCounts = useMemo(() => {
    const c = { seen: 0, possible: 0 };
    for (const v of Object.values<PoolCheck>(pools)) if (v.status === 'seen' || v.status === 'possible') c[v.status]++;
    return c;
  }, [pools]);
  const visible = useMemo(() => {
    if (!result) return [] as Lead[];
    const list = poolsOnly
      ? result.leads.filter((l) => ['seen', 'possible'].includes(pools[l.parcel_id]?.status ?? ''))
      : [...result.leads];
    const rank = (l: Lead) => POOL_RANK[pools[l.parcel_id]?.status ?? 'error'] ?? 4;
    return list.sort((a, b) =>
      sort === 'closest'
        ? a.straight_line_miles - b.straight_line_miles
        : sort === 'price'
          ? (b.sale_price ?? 0) - (a.sale_price ?? 0)
          : sort === 'pool'
            ? rank(a) - rank(b) || b.sale_date.localeCompare(a.sale_date)
            : b.sale_date.localeCompare(a.sale_date),
    );
  }, [result, pools, poolsOnly, sort]);
  const shown = showAll ? visible : visible.slice(0, 50);
  // Most-common reason first.
  const exclusions = Object.entries<number>(result?.excluded ?? {}).sort((a, b) => b[1] - a[1]);
  const excludedTotal = exclusions.reduce((n, [, v]) => n + v, 0);

  return (
    <>
      <AdminHeader onLogout={onLogout} />
      <AdminBody>
        <PageHead
          eyebrow="Lead finder"
          title="New homeowner leads"
          lead="Recent Pinellas home sales near one address, straight from the county’s property records."
          onBack={onBack}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-6">
            <Card title="1. Search around">
              <CenterPicker center={center} onChange={setCenter} />
            </Card>

            <Card title="2. Narrow it down">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabel}>Within (miles)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0.1}
                    max={MAX_RADIUS}
                    step={0.25}
                    value={settings.radius}
                    onChange={setText('radius')}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Sold within (days)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_DAYS}
                    value={settings.lookbackDays}
                    onChange={setText('lookbackDays')}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Sale price from</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={settings.minPrice}
                    onChange={setText('minPrice')}
                    placeholder="No minimum"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Sale price up to</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={settings.maxPrice}
                    onChange={setText('maxPrice')}
                    placeholder="No maximum"
                    className={inputClass}
                  />
                </label>
              </div>
              {(minPrice !== null || maxPrice !== null) && (
                <p className={`-mt-2 ${mutedText}`}>
                  Only homes that sold {priceRange(minPrice, maxPrice)}. Sales with no price on record are left out.
                </p>
              )}
              <div className="space-y-3 border-t border-sc-navy/[0.08] pt-5">
                <Toggle
                  checked={settings.singleFamilyOnly}
                  onChange={(v) => setSettings((s) => ({ ...s, singleFamilyOnly: v }))}
                  label="Single-family homes only"
                  hint="Off includes condos, mobile homes and small multi-family. Vacant land is always left out."
                />
                <Toggle
                  checked={settings.qualifiedOnly}
                  onChange={(v) => setSettings((s) => ({ ...s, qualifiedOnly: v }))}
                  label="Qualified sales only"
                  hint="The county’s mark for a normal sale. Leaves out sales that bundled several parcels under one price."
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={run}
                  disabled={!!inputProblem || running}
                  className={`${buttonClass.gold} px-7`}
                >
                  {running && <LoaderCircle className="h-5 w-5 animate-spin" />}
                  {running ? 'Searching the county…' : 'Find leads'}
                  {!running && <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />}
                </button>
                {inputProblem && <span className={mutedText}>{inputProblem}</span>}
              </div>
              {runError && <p className={notice.error}>{runError}</p>}
              {logNote && <p className={notice.warn}>{logNote}</p>}
            </Card>

            {result && (
              <Card
                title="3. Leads"
                aside={
                  result.leads.length > 0 && (
                    <button type="button" onClick={download} className={smallButton}>
                      <Download className="h-4 w-4" /> Download CSV
                    </button>
                  )
                }
              >
                {stale && <p className={notice.warn}>The address or filters changed since this search. Run it again to update.</p>}
                {result.truncated && (
                  <p className={notice.warn}>
                    This search hit the county limit, so the oldest sales were cut off. Narrow the distance or the window
                    for a complete list.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat value={result.leads.length.toLocaleString()} label="Leads" />
                  <Stat value={result.checked.toLocaleString()} label="Sales checked" />
                  <Stat value={excludedTotal.toLocaleString()} label="Excluded" />
                  <Stat value={result.newestSale ? monthDay(result.newestSale) : '—'} label="Newest sale" />
                </div>
                {result.loadedAt && (
                  <p className={`-mt-2 ${mutedText}`}>
                    County records as of {onDate(`${result.loadedAt}T12:00:00Z`)}. Recent sales take a few weeks to be
                    recorded.
                  </p>
                )}

                {result.leads.length > 0 && (
                  <div className={`${tileClass} space-y-3 px-4 py-3`}>
                    <p className="text-[14px] text-sc-navy/80">
                      {checked < checkable ? (
                        <span className="inline-flex items-center gap-2">
                          <LoaderCircle className="h-4 w-4 animate-spin text-sc-blue" /> Checking aerial photos for pools…{' '}
                          {checked} of {checkable}
                        </span>
                      ) : (
                        <>
                          <span className="font-semibold text-sc-navy">{poolCounts.seen} with a pool seen</span>
                          {poolCounts.possible ? `, ${poolCounts.possible} possible` : ''} on the 2026 aerial photos.
                        </>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <label className="flex items-center gap-2 text-[14px] font-semibold text-sc-navy">
                        Sort
                        <select
                          value={sort}
                          onChange={(e) => setSort(e.target.value as SortKey)}
                          className="h-10 rounded-[10px] bg-white px-3 text-[14px] font-medium text-sc-navy ring-1 ring-sc-navy/[0.18] focus:outline-none focus:ring-2 focus:ring-sc-blue/50"
                        >
                          <option value="newest">Newest sale</option>
                          <option value="pool">Pools first</option>
                          <option value="closest">Closest</option>
                          <option value="price">Highest price</option>
                        </select>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-[14px] font-semibold text-sc-navy">
                        <input
                          type="checkbox"
                          checked={poolsOnly}
                          onChange={(e) => setPoolsOnly(e.target.checked)}
                          className="h-4 w-4 accent-[#2676b6]"
                        />
                        Only homes with a pool seen or possible
                      </label>
                    </div>
                  </div>
                )}

                {result.leads.length === 0 ? (
                  <p className={bodyText}>
                    No qualifying leads. The exclusion counts below say why: the distance, the window, the price range or
                    the property type.
                  </p>
                ) : visible.length === 0 ? (
                  <p className={bodyText}>
                    {checked < checkable ? 'No pools found yet. Still checking…' : 'No pools seen on these lots’ photos.'}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {shown.map((r) => {
                      const pool = pools[r.parcel_id];
                      const label = pool ? POOL_LABEL[pool.status] : null;
                      return (
                        <li
                          key={r.parcel_id}
                          className="flex gap-4 rounded-[12px] p-3 ring-1 ring-inset ring-sc-navy/[0.12] sm:p-4"
                        >
                          <a
                            href={r.county_page}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${r.street_address} on the county property page`}
                            className="block h-24 w-24 shrink-0 overflow-hidden rounded-[10px] bg-sc-mist sm:h-32 sm:w-32"
                          >
                            {pool?.thumb ? (
                              <img src={pool.thumb} alt="" className="h-full w-full object-cover" />
                            ) : r.ring && pool?.status !== 'error' ? (
                              <span className="flex h-full w-full items-center justify-center">
                                <LoaderCircle className="h-5 w-5 animate-spin text-sc-navy/30" />
                              </span>
                            ) : null}
                          </a>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                              <p className="text-[16px] font-semibold text-sc-navy">{r.street_address}</p>
                              {label && (
                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${label.cls}`}
                                  title={
                                    pool && pool.status !== 'error'
                                      ? `About ${pool.waterM2} m² of open water inside the lot on the 2026 aerial`
                                      : undefined
                                  }
                                >
                                  {label.text}
                                </span>
                              )}
                            </div>
                            <p className="text-[14px] text-sc-navy/60">
                              {[r.city, `FL ${r.zip}`.trim()].filter(Boolean).join(', ')} · {r.property_type}
                              {r.living_sqft && r.living_sqft !== '0 sf' ? ` · ${r.living_sqft}` : ''}
                            </p>
                            <p className="mt-1.5 text-[14px] text-sc-navy/80">
                              Sold {onDate(`${r.sale_date}T12:00:00Z`)} ({r.days_since_sale} days ago)
                              {r.sale_price !== null ? ` · ${dollars(r.sale_price)}` : ''} · {r.straight_line_miles} mi
                              away
                            </p>
                            {r.owner_on_record && (
                              <p className="mt-1 text-[13.5px] text-sc-navy/60">Owner on record: {r.owner_on_record}</p>
                            )}
                            <a
                              href={r.county_page}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-sc-blue hover:text-sc-navy"
                            >
                              County property page <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {visible.length > shown.length && (
                  <button type="button" onClick={() => setShowAll(true)} className={smallButton}>
                    Show all {visible.length.toLocaleString()}
                  </button>
                )}

                {excludedTotal > 0 && (
                  <div className="border-t border-sc-navy/[0.08] pt-5">
                    <h3 className="text-[15px] font-semibold text-sc-navy">Excluded</h3>
                    <ul className="mt-2 space-y-1 text-[14px] text-sc-navy/70">
                      {exclusions.map(([k, v]) => (
                        <li key={k} className="flex justify-between gap-4 sm:max-w-md">
                          <span>{k}</span>
                          <span className="font-semibold tabular-nums text-sc-navy">{v.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* The running tally, beside the work on desktop. */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <section
              className={`${cardClass} p-5 sm:p-6 ${
                lastDays !== null && lastDays > STALE_DAYS ? 'ring-2 ring-inset ring-[#f0d27a]' : ''
              }`}
            >
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-sc-blue">Last run</p>
              {history.kind === 'loading' && (
                <p className={`mt-3 flex items-center gap-2 ${mutedText}`}>
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Loading run history…
                </p>
              )}
              {history.kind === 'error' && (
                <p className={`mt-3 flex items-center gap-2 ${notice.error}`}>
                  <AlertCircle className="h-4 w-4 shrink-0" /> Couldn’t load the run history.
                </p>
              )}
              {history.kind === 'ready' && !history.storage && (
                <p className={`mt-3 ${notice.warn}`}>
                  <span className="font-semibold">Run history isn’t set up yet.</span> Leads still work. Apply{' '}
                  <span className="font-mono">migrations/0009_lead_runs.sql</span> in the D1 console to start keeping a
                  tally.
                </p>
              )}
              {history.kind === 'ready' && history.storage && !last && (
                <p className={`mt-3 flex items-center gap-2 ${bodyText}`}>
                  <History className="h-4 w-4 text-sc-navy/45" /> Never run yet. Your first run will show here.
                </p>
              )}
              {history.kind === 'ready' && history.storage && last && (
                <>
                  <p className="mt-2 text-[26px] font-[650] leading-tight tracking-[-0.03em] text-sc-navy">
                    {ago(last.ran_at)}
                  </p>
                  <p className={mutedText}>{onDateTime(last.ran_at)}</p>
                  {lastDays !== null && lastDays > STALE_DAYS && (
                    <p className={`mt-3 ${notice.warn}`}>Due for a run: new owners pick a pool company early.</p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Stat value={last.leads_found.toLocaleString()} label="Leads found" />
                    <Stat value={history.total.toLocaleString()} label="Runs total" />
                  </div>
                  <p className={`mt-3 ${mutedText}`}>
                    {last.sales_rows.toLocaleString()} sales checked within {last.radius_miles} mi
                    {last.newest_sale ? `. Newest sale ${onDate(`${last.newest_sale}T12:00:00Z`)}.` : '.'}
                  </p>
                  {history.runs.length > 1 && (
                    <details className="mt-4 border-t border-sc-navy/[0.08] pt-4">
                      <summary className="cursor-pointer text-[14px] font-semibold text-sc-blue">Recent runs</summary>
                      <ul className="mt-3 space-y-2">
                        {history.runs.map((r) => (
                          <li key={r.id} className="flex items-baseline justify-between gap-3 text-[13.5px]">
                            <span className="text-sc-navy/70">
                              {onDate(r.ran_at)}
                              <span className="text-sc-navy/45">
                                {' '}
                                · {r.radius_miles} mi · {r.lookback_days}d
                              </span>
                            </span>
                            <span className="font-semibold tabular-nums text-sc-navy">
                              {r.leads_found} lead{r.leads_found === 1 ? '' : 's'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </section>

            <p className={mutedText}>
              Sales come from the Pinellas County Property Appraiser’s public records. Pools aren’t in that data, so each
              lot is checked for pool water on the county’s 2026 aerial photo. A pool under a screen cage or heavy shade
              can read as none seen, so glance at the photo. Distances are straight-line, not driving. Nothing here
              contacts anyone: outreach happens in the CRM.
            </p>
          </aside>
        </div>
      </AdminBody>
    </>
  );
};
