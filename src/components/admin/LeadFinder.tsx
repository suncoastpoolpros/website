/**
 * /admin → Lead Finder. Recent Pinellas sales within a set distance of one
 * address, narrowed by property type, sale type and price.
 *
 * The search address is typed and picked from the site's address lookup,
 * which supplies its map position. Find leads asks /api/admin/county-sales for
 * every sale in the radius and window (straight from the Property Appraiser's
 * public map server), then ranks and filters them here (leads/leadEngine.ts),
 * so each filter's toll shows in the exclusion counts. The only thing stored is
 * a summary of the run (settings and counts, never an address), so the page
 * can say when it last ran. The leads leave as a CSV for the CRM, where
 * outreach lives; nothing here contacts anyone.
 *
 * Pools aren't in the county's map data, and the appraiser's site refuses
 * automated reads, so each lead's lot is checked for pool water on the county's
 * aerial photo right after the search (leads/poolCheck.ts), with the photo in
 * the row and a link to the property page to confirm.
 *
 * Laid out as an app, not a page: a fixed sidebar, top bar and filter bar,
 * with only the content area scrolling. Its own compact type and greys, on the
 * brand tokens (sc-ink, sc-blue, sc-sky, sc-gold).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Home,
  LayoutGrid,
  LoaderCircle,
  Lock,
  MapPin,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { AddressAutocomplete, type Suggestion } from '@/components/landing/AddressAutocomplete';
import { ago, onDate } from './quoteFormat';
import { toCSV } from './leads/csv';
import { ownerName } from './leads/ownerName';
import { checkPool, POOL_POSSIBLE_M2, POOL_SEEN_M2, type PoolCheck } from './leads/poolCheck';
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

/** More leads than this and the rest aren't checked: a wide search shouldn't fetch hundreds of photos. */
const POOL_CHECK_LIMIT = 250;
/** Aerial photos fetched at a time: quick, and light on the county's image server. */
const POOL_CHECK_CONCURRENCY = 4;
/** Rows drawn before "Show all": the thumbnails are images, and a 600-row table is slow to paint. */
const PAGE_ROWS = 100;

type View = 'all' | 'seen' | 'possible' | 'none';
const VIEW_LABEL: Record<View, string> = {
  all: 'All leads',
  seen: 'Pool seen',
  possible: 'Possible pool',
  none: 'No pool seen',
};

type SortCol = 'property' | 'pool' | 'sold' | 'price' | 'size' | 'distance';
type Sort = { col: SortCol; dir: 'asc' | 'desc' };
/** The direction a column sorts in first: biggest and newest first, A–Z and nearest first. */
const FIRST_DIR: Record<SortCol, 'asc' | 'desc'> = {
  property: 'asc',
  pool: 'asc',
  sold: 'desc',
  price: 'desc',
  size: 'desc',
  distance: 'asc',
};

const POOL_RANK: Record<string, number> = { seen: 0, possible: 1, none: 2, error: 3 };

const POOL_BADGE: Record<string, { text: string; cls: string; dot: string }> = {
  seen: { text: 'Pool seen', cls: 'border-[#bfdff2] bg-[#eef7fd] text-[#1c5f92]', dot: 'bg-sc-sky' },
  possible: { text: 'Possible', cls: 'border-[#f3da8c] bg-[#fff9e6] text-[#8a6100]', dot: 'bg-sc-gold' },
  none: { text: 'None seen', cls: 'border-[#e4e9f0] bg-[#f6f8fb] text-[#6b7a8d]', dot: 'bg-[#98a4b3]' },
  error: { text: 'No photo', cls: 'border-[#e4e9f0] bg-[#f6f8fb] text-[#98a4b3]', dot: 'bg-[#c9d1dc]' },
};

const poolCsv = (c: PoolCheck | undefined): string =>
  !c ? 'not checked' : c.status === 'seen' ? 'seen' : c.status === 'possible' ? 'possible' : c.status === 'none' ? 'none seen' : 'photo unavailable';

const poolDetail = (c: PoolCheck | undefined): string =>
  !c
    ? 'Not checked on the aerial photo.'
    : c.status === 'error'
      ? 'The aerial photo for this lot couldn’t be loaded.'
      : `About ${c.waterM2} m² of open water inside the lot on the 2026 aerial. ${POOL_SEEN_M2} m² or more reads as a pool; ${POOL_POSSIBLE_M2}–${POOL_SEEN_M2} m² as possible.`;

/** "Oct 31". */
const monthDay = (iso: string): string =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const daysAgo = (d: number): string => (d <= 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`);

/** "Nov 4, 12:49 PM ET". */
const stamp = (iso: string): string =>
  `${new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })} ET`;

const dollars = (n: number): string => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

/** "2,145 sf" → 2145; 0 when the county has no figure. */
const sqftOf = (s: string): number => Number(s.replace(/[^\d]/g, '')) || 0;

/** "$400k–$900k", "over $400k", "under $900k" or '' for no range. */
const priceRange = (min: number | null, max: number | null): string =>
  min !== null && max !== null
    ? `${shortMoney(min)}–${shortMoney(max)}`
    : min !== null
      ? `over ${shortMoney(min)}`
      : max !== null
        ? `under ${shortMoney(max)}`
        : '';

// ── Shared bits of the shell ─────────────────────────────────────────────────

const focusRing =
  'focus-visible:outline-none focus-visible:border-sc-sky focus-visible:shadow-[0_0_0_3px_rgba(83,165,211,.18)]';
const secondaryBtn = `inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] border border-[#e4e9f0] bg-white px-2.5 text-[13px] font-medium text-sc-ink shadow-[0_1px_2px_rgba(16,24,40,.04)] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 ${focusRing}`;
const iconBtn = `inline-flex h-7 w-7 items-center justify-center rounded-[6px] border border-transparent text-[#6b7a8d] transition hover:bg-[#f1f4f8] hover:text-sc-ink disabled:pointer-events-none disabled:opacity-40 ${focusRing}`;
const chip = `relative inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[6px] border border-[#e4e9f0] bg-white px-2.5 text-[12.5px] text-[#6b7a8d] transition hover:border-[#d3dbe6] focus-within:border-sc-sky focus-within:shadow-[0_0_0_3px_rgba(83,165,211,.18)] ${focusRing}`;
const kbd =
  'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-[#e4e9f0] bg-white px-1 font-sans text-[10.5px] font-medium text-[#6b7a8d]';

/** A hover tooltip, for the explanations that used to sit under each control. */
const Tip = ({ text, children, align = 'left' }: { text: React.ReactNode; children: React.ReactNode; align?: 'left' | 'right' }) => (
  <span className="group/tip relative inline-flex">
    {children}
    <span
      role="tooltip"
      className={`pointer-events-none absolute top-[calc(100%+6px)] z-30 w-64 rounded-[7px] bg-sc-ink px-2.5 py-2 text-[12px] font-normal leading-[1.45] text-white opacity-0 shadow-[0_8px_24px_-6px_rgba(16,24,40,.35)] transition-opacity group-hover/tip:opacity-100 group-hover/tip:delay-300 ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      {text}
    </span>
  </span>
);

const PoolBadge = ({ check, pending }: { check: PoolCheck | undefined; pending: boolean }) => {
  if (!check) {
    return (
      <span className="inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full border border-[#e4e9f0] bg-white px-2 text-[12px] text-[#98a4b3]">
        {pending ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-[#c9d1dc]" />}
        {pending ? 'Checking' : 'Not checked'}
      </span>
    );
  }
  const b = POOL_BADGE[check.status];
  return (
    <span
      title={poolDetail(check)}
      className={`inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-[12px] font-medium ${b.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${b.dot}`} />
      {b.text}
    </span>
  );
};

/** A number typed straight into its chip: borderless, as wide as its value. */
const ChipInput = ({
  value,
  onChange,
  onEnter,
  placeholder,
  label,
  mode = 'decimal',
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  placeholder?: string;
  label: string;
  mode?: 'decimal' | 'numeric';
}) => (
  <input
    type="text"
    inputMode={mode}
    aria-label={label}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && onEnter()}
    style={{ width: `${Math.max(2, (value || placeholder || '').length) + 0.5}ch` }}
    className="min-w-0 bg-transparent p-0 text-[12.5px] font-semibold text-sc-ink outline-none placeholder:font-medium placeholder:text-[#98a4b3]"
  />
);

const ToggleChip = ({
  checked,
  onChange,
  label,
  tip,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  tip: string;
}) => (
  <Tip text={tip}>
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={chip}>
      <span className={`relative inline-block h-3.5 w-6 shrink-0 rounded-full transition-colors ${checked ? 'bg-sc-blue' : 'bg-[#d3dbe6]'}`}>
        <span
          className={`absolute left-0 top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,.2)] transition-transform ${
            checked ? 'translate-x-3' : 'translate-x-0.5'
          }`}
        />
      </span>
      <span className={checked ? 'font-medium text-sc-ink' : ''}>{label}</span>
    </button>
  </Tip>
);

/**
 * The search address, as a chip that opens the address lookup. It has to be
 * PICKED from the suggestions: that is where its map position comes from, and
 * a typed address with no position can't be measured from.
 */
const AddressChip = ({ center, onChange }: { center: Center | null; onChange: (c: Center) => void }) => {
  const [open, setOpen] = useState(false);
  const [noPosition, setNoPosition] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  const pick = (s: Suggestion | null) => {
    if (!s) return setNoPosition(false);
    if (typeof s.lat !== 'number' || typeof s.lng !== 'number') return setNoPosition(true);
    const zip = /\b(\d{5})\b/.exec(s.line2)?.[1] ?? '';
    onChange({ label: s.full, street: s.line1, zip, lat: s.lat, lng: s.lng });
    setNoPosition(false);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`${chip} max-w-[min(340px,100%)] ${center ? '' : 'border-sc-sky/60 bg-[#f3f9fd]'}`}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-sc-blue" />
        <span className="truncate font-semibold text-sc-ink">{center ? center.label : 'Choose an address'}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#98a4b3]" />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-[min(420px,calc(100vw-32px))] rounded-[10px] border border-[#e4e9f0] bg-white p-3 shadow-[0_16px_40px_-12px_rgba(31,49,73,.3)]">
          <p className="mb-2 text-[12px] font-medium text-[#6b7a8d]">Search around</p>
          <div className="flex rounded-[7px] border border-[#e4e9f0] focus-within:border-sc-sky focus-within:shadow-[0_0_0_3px_rgba(83,165,211,.18)]">
            <AddressAutocomplete name="lead-center" placeholder="Start typing a Pinellas address" onPick={pick} />
          </div>
          <p className={`mt-2 text-[12px] ${noPosition ? 'font-medium text-red-700' : 'text-[#98a4b3]'}`}>
            {noPosition
              ? 'That address came back without a map position. Try another match.'
              : 'Any Pinellas address. Pick it from the list so it can be placed on the map.'}
          </p>
        </div>
      )}
    </div>
  );
};

const NavItem = ({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number | null;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`flex h-8 w-full items-center gap-2.5 rounded-[6px] px-2.5 text-left text-[13px] transition focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(83,165,211,.6)] ${
      active ? 'bg-white/10 font-medium text-white' : 'hover:bg-white/[0.06] hover:text-white'
    }`}
  >
    <span className="flex w-4 shrink-0 items-center justify-center">{icon}</span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && count !== null && <span className="text-[12px] text-[#8da1b8]">{count}</span>}
  </button>
);

const Dot = ({ cls }: { cls: string }) => <span className={`h-2 w-2 rounded-full ${cls}`} />;

const SummaryCell = ({
  label,
  value,
  suffix,
  dot,
  className = '',
  children,
}: {
  label: string;
  value: React.ReactNode;
  suffix?: React.ReactNode;
  dot?: string;
  className?: string;
  children?: React.ReactNode;
}) => (
  <div className={`relative min-w-0 border-[#eef1f5] px-4 py-3.5 ${className}`}>
    <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#6b7a8d]">
      {dot && <Dot cls={dot} />}
      {label}
    </p>
    <p className="mt-1 flex min-w-0 items-baseline gap-1.5">
      <span className="text-[21px] font-semibold tracking-[-0.02em] text-sc-ink">{value}</span>
      {suffix && <span className="min-w-0 truncate text-[12px] text-[#98a4b3]">{suffix}</span>}
    </p>
    {children}
  </div>
);

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <span className="shrink-0 text-[12.5px] text-[#6b7a8d]">{label}</span>
    <span className="min-w-0 text-right text-[13px] font-medium text-sc-ink">{children}</span>
  </div>
);

// ── The page ─────────────────────────────────────────────────────────────────

export const LeadFinder = ({ onLogout, onBack }: { onLogout: () => void; onBack: () => void }) => {
  const [center, setCenter] = useState<Center | null>(() => readStored<Center | null>(CENTER_KEY, null));
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [result, setResult] = useState<
    | (LeadResult & { signature: string; checked: number; truncated: boolean; loadedAt: string | null; ranAt: string })
    | null
  >(null);
  const [runError, setRunError] = useState('');
  const [logNote, setLogNote] = useState('');
  const [history, setHistory] = useState<RunHistory>({ kind: 'loading' });
  const [showAll, setShowAll] = useState(false);
  const [running, setRunning] = useState(false);
  // Pool checks by parcel, filled in as the aerials come back.
  const [pools, setPools] = useState<Record<string, PoolCheck>>({});
  const [view, setView] = useState<View>('all');
  const [sort, setSort] = useState<Sort>({ col: 'sold', dir: 'desc' });
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [preview, setPreview] = useState<{ lead: Lead; thumb: string; left: number; top: number; flip: boolean } | null>(
    null,
  );
  // Re-renders the "Updated 5 min ago" line now and then.
  const [, setTick] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

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

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

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

  const setText = (k: 'lookbackDays' | 'radius' | 'minPrice' | 'maxPrice') => (v: string) =>
    setSettings((s) => ({ ...s, [k]: v }));

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
        ? `Days must be a whole number up to ${MAX_DAYS} (4 years).`
        : '';

  const run = async () => {
    if (!center || inputProblem || running) return;
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
        ranAt: new Date().toISOString(),
      });
      setSelectedId(null);
      setDrawerOpen(false);

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

  // ── Derived ────────────────────────────────────────────────────────────────

  const last = history.kind === 'ready' ? history.runs[0] : undefined;
  const lastAt = last?.ran_at ?? result?.ranAt ?? null;
  const lastDays = lastAt ? (Date.now() - new Date(lastAt).getTime()) / 86_400_000 : null;
  const stale = !!result && result.signature !== signature;
  const checkable = result ? Math.min(POOL_CHECK_LIMIT, result.leads.filter((l) => l.ring).length) : 0;
  const checkedPools = Object.keys(pools).length;
  const checking = !!result && checkedPools < checkable;
  const pendingIds = useMemo(
    () => new Set((result?.leads ?? []).filter((l) => l.ring).slice(0, POOL_CHECK_LIMIT).map((l) => l.parcel_id)),
    [result],
  );

  const counts = useMemo(() => {
    const c = { all: result?.leads.length ?? 0, seen: 0, possible: 0, none: 0 };
    for (const v of Object.values<PoolCheck>(pools)) if (v.status !== 'error') c[v.status]++;
    return c;
  }, [result, pools]);

  const visible = useMemo(() => {
    if (!result) return [] as Lead[];
    const q = query.trim().toLowerCase();
    const list = result.leads.filter((l) => {
      if (view !== 'all' && pools[l.parcel_id]?.status !== view) return false;
      if (!q) return true;
      return [l.street_address, l.city, l.zip, l.owner_on_record, ownerName(l.owner_on_record)]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    const rank = (l: Lead) => POOL_RANK[pools[l.parcel_id]?.status ?? ''] ?? 4;
    const by = (a: Lead, b: Lead): number => {
      switch (sort.col) {
        case 'property':
          return a.street_address.localeCompare(b.street_address, 'en', { numeric: true });
        case 'pool':
          return rank(a) - rank(b);
        case 'price':
          return (a.sale_price ?? 0) - (b.sale_price ?? 0);
        case 'size':
          return sqftOf(a.living_sqft) - sqftOf(b.living_sqft);
        case 'distance':
          return a.straight_line_miles - b.straight_line_miles;
        default:
          return a.sale_date.localeCompare(b.sale_date);
      }
    };
    const dir = sort.dir === 'asc' ? 1 : -1;
    // Ties fall back to the newest sale, so equal pools or prices still read in order.
    return list.sort((a, b) => dir * by(a, b) || b.sale_date.localeCompare(a.sale_date));
  }, [result, pools, view, query, sort]);

  const shown = showAll ? visible : visible.slice(0, PAGE_ROWS);
  const selectedIndex = selectedId ? visible.findIndex((l) => l.parcel_id === selectedId) : -1;
  const drawerLead = selectedIndex >= 0 ? visible[selectedIndex] : null;

  // Most-common reason first.
  const exclusions = Object.entries<number>(result?.excluded ?? {}).sort((a, b) => b[1] - a[1]);
  const excludedTotal = exclusions.reduce((n, [, v]) => n + v, 0);
  const priced = (result?.leads ?? []).filter((l) => l.sale_price !== null);
  const avgPrice = priced.length ? priced.reduce((n, l) => n + (l.sale_price as number), 0) / priced.length : null;
  const newestLead = result?.leads.reduce<string | null>((m, l) => (!m || l.sale_date > m ? l.sale_date : m), null);

  // A lead that leaves the list (a filter or a new search) closes the drawer.
  useEffect(() => {
    if (drawerOpen && !drawerLead) setDrawerOpen(false);
  }, [drawerOpen, drawerLead]);

  useEffect(() => {
    if (selectedId) rowRefs.current.get(selectedId)?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  const toggleSort = (col: SortCol) =>
    setSort((s) => (s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: FIRST_DIR[col] }));

  const move = useCallback(
    (delta: number) => {
      if (!visible.length) return;
      const i = selectedId ? visible.findIndex((l) => l.parcel_id === selectedId) : -1;
      const n = i < 0 ? 0 : Math.max(0, Math.min(visible.length - 1, i + delta));
      if (n >= PAGE_ROWS) setShowAll(true);
      setSelectedId(visible[n].parcel_id);
    },
    [visible, selectedId],
  );

  const openLead = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
    setPreview(null);
  };

  const focusSearch = () => {
    searchRef.current?.focus();
    searchRef.current?.select();
  };

  // J/K or arrows move, Enter opens, Esc closes, "/" or ⌘K searches.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusSearch();
        return;
      }
      if (e.key === 'Escape') {
        if (t && t === searchRef.current) t.blur();
        else if (drawerOpen) setDrawerOpen(false);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        focusSearch();
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        move(-1);
      } else if (e.key === 'Enter' && selectedId && t?.tagName !== 'BUTTON' && t?.tagName !== 'A') {
        e.preventDefault();
        setDrawerOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, drawerOpen, selectedId]);

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

  const showPreview = (lead: Lead, el: HTMLElement) => {
    const thumb = pools[lead.parcel_id]?.thumb;
    if (!thumb) return;
    const r = el.getBoundingClientRect();
    const W = 380;
    const H = 270;
    const flip = r.right + 12 + W > window.innerWidth - 8;
    setPreview({
      lead,
      thumb,
      flip,
      left: flip ? Math.max(8, r.left - 12 - W) : r.right + 12,
      top: Math.max(8, Math.min(window.innerHeight - H - 8, r.top + r.height / 2 - H / 2)),
    });
  };

  const updatedLine =
    history.kind === 'loading' && !result
      ? 'Loading run history…'
      : lastAt
        ? `Updated ${ago(lastAt)} · ${stamp(lastAt)}`
        : history.kind === 'ready' && !history.storage
          ? 'Run history isn’t set up'
          : history.kind === 'error'
            ? 'Couldn’t load run history'
            : 'Never run';
  const updatedTitle =
    history.kind === 'ready' && !history.storage
      ? 'Apply migrations/0009_lead_runs.sql in the D1 console to keep a tally of runs.'
      : last
        ? `${history.kind === 'ready' ? history.total : 0} runs total. Last run found ${last.leads_found} leads from ${last.sales_rows} sales within ${last.radius_miles} mi.`
        : undefined;
  const overdue = lastDays !== null && lastDays > STALE_DAYS;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f6f8fb] font-sans text-[13px] tracking-[-0.006em] text-sc-ink tabular-nums antialiased">
      {/* Sidebar */}
      <aside className="hidden w-[224px] shrink-0 flex-col bg-sc-ink text-[#c9d6e4] min-[860px]:flex">
        <div className="flex h-[52px] items-center gap-2.5 px-4">
          <img src="/icon-mark.svg" alt="" aria-hidden="true" width={37} height={24} className="h-[22px] w-auto" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-semibold text-white">Suncoast Pool Pros</span>
            <span className="block text-[11.5px] text-[#8da1b8]">Lead Finder</span>
          </span>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 pt-3">
          <div>
            <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#7d92aa]">Leads</p>
            <NavItem
              active={view === 'all'}
              onClick={() => setView('all')}
              icon={<Home className="h-4 w-4" />}
              label="All leads"
              count={result ? counts.all : null}
            />
            <NavItem
              active={view === 'seen'}
              onClick={() => setView('seen')}
              icon={<Dot cls="bg-sc-sky" />}
              label="Pool seen"
              count={result ? counts.seen : null}
            />
            <NavItem
              active={view === 'possible'}
              onClick={() => setView('possible')}
              icon={<Dot cls="bg-sc-gold" />}
              label="Possible pool"
              count={result ? counts.possible : null}
            />
            <NavItem
              active={view === 'none'}
              onClick={() => setView('none')}
              icon={<Dot cls="bg-[#98a4b3]" />}
              label="No pool seen"
              count={result ? counts.none : null}
            />
          </div>
          <div>
            <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#7d92aa]">Admin</p>
            <NavItem onClick={onBack} icon={<LayoutGrid className="h-4 w-4" />} label="All tools" />
          </div>
        </nav>
        <div className="border-t border-white/10 p-2.5">
          <NavItem onClick={onLogout} icon={<Lock className="h-4 w-4" />} label="Lock admin" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[#e4e9f0] bg-white px-4 sm:gap-3 sm:px-5">
          <button type="button" onClick={onBack} aria-label="All tools" className={`${iconBtn} -ml-1 min-[860px]:hidden`}>
            <img src="/icon-mark.svg" alt="" aria-hidden="true" width={37} height={24} className="h-4 w-auto" />
          </button>
          <p className="min-w-0 flex-1 truncate text-[13px]">
            <span className="text-[#6b7a8d]">Lead Finder</span>
            <span className="mx-1.5 text-[#c9d1dc]">/</span>
            <span className="font-semibold text-sc-ink">{VIEW_LABEL[view]}</span>
          </p>
          <span
            title={updatedTitle}
            className={`hidden truncate text-[12px] lg:inline ${overdue ? 'font-medium text-[#b7791f]' : 'text-[#98a4b3]'}`}
          >
            {updatedLine}
            {overdue ? ' · due for a run' : ''}
          </span>
          <button type="button" onClick={download} disabled={!result || !visible.length} className={secondaryBtn}>
            <Download className="h-3.5 w-3.5" />
            <span className="max-sm:sr-only">Export CSV</span>
          </button>
          <button
            type="button"
            onClick={run}
            disabled={!!inputProblem || running}
            title={inputProblem || undefined}
            className={`gold-btn inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] px-3 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:px-3.5 ${focusRing}`}
          >
            {running ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {running ? 'Searching…' : 'Find leads'}
          </button>
          <button type="button" onClick={onLogout} aria-label="Lock admin" className={`${iconBtn} min-[860px]:hidden`}>
            <Lock className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Filter bar */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#e4e9f0] bg-white px-4 py-2.5 sm:px-5">
          <AddressChip center={center} onChange={setCenter} />
          <label className={chip}>
            Within
            <ChipInput label="Miles" value={settings.radius} onChange={setText('radius')} onEnter={run} />
            mi
          </label>
          <label className={chip}>
            Sold in last
            <ChipInput
              label="Days"
              mode="numeric"
              value={settings.lookbackDays}
              onChange={setText('lookbackDays')}
              onEnter={run}
            />
            days
          </label>
          <Tip text="Sales with no price on record are left out whenever a price is set.">
            <label className={chip}>
              Price
              <ChipInput
                label="Minimum price"
                mode="numeric"
                placeholder="Min"
                value={settings.minPrice}
                onChange={setText('minPrice')}
                onEnter={run}
              />
              <span className="text-[#98a4b3]">–</span>
              <ChipInput
                label="Maximum price"
                mode="numeric"
                placeholder="Any"
                value={settings.maxPrice}
                onChange={setText('maxPrice')}
                onEnter={run}
              />
            </label>
          </Tip>
          <ToggleChip
            checked={settings.singleFamilyOnly}
            onChange={(v) => setSettings((s) => ({ ...s, singleFamilyOnly: v }))}
            label="Single-family"
            tip="Single-family homes only. Off includes condos, mobile homes and small multi-family. Vacant land is always left out."
          />
          <ToggleChip
            checked={settings.qualifiedOnly}
            onChange={(v) => setSettings((s) => ({ ...s, qualifiedOnly: v }))}
            label="Qualified sales"
            tip="The county’s mark for a normal sale. Leaves out sales that bundled several parcels under one price."
          />
          {inputProblem && center ? (
            <span className="text-[12px] font-medium text-red-700">{inputProblem}</span>
          ) : stale ? (
            <span className="text-[12px] font-medium text-[#b7791f]">Filters changed · press Find leads</span>
          ) : null}
        </div>

        {/* Content: the only part that scrolls */}
        <div className="min-h-0 flex-1 overflow-y-auto" onScroll={() => setPreview((p) => (p ? null : p))}>
          <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 sm:px-5">
            {/* Summary strip */}
            <div className="grid grid-cols-2 rounded-[10px] border border-[#e4e9f0] bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)] sm:grid-cols-4">
              <SummaryCell
                label="New leads"
                value={result ? result.leads.length.toLocaleString() : '—'}
                suffix={result ? `from ${result.checked.toLocaleString()} sales` : undefined}
              />
              <SummaryCell
                label="Pool seen"
                dot="bg-sc-sky"
                className="border-l"
                value={result ? counts.seen : '—'}
                suffix={result ? (checking ? `+${counts.possible} possible · checking` : `+${counts.possible} possible`) : undefined}
              />
              <SummaryCell
                label="Avg. sale price"
                className="border-t sm:border-l sm:border-t-0"
                value={avgPrice !== null ? shortMoney(avgPrice) : '—'}
                suffix={newestLead ? `newest ${monthDay(newestLead)}` : undefined}
              />
              <div className="group/ex relative border-l border-t border-[#eef1f5] sm:border-t-0">
                <SummaryCell
                  label="Excluded"
                  value={result ? excludedTotal.toLocaleString() : '—'}
                  suffix={exclusions[0]?.[0]}
                />
                {exclusions.length > 0 && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute right-2 top-[calc(100%+6px)] z-30 w-72 rounded-[8px] bg-sc-ink p-3 text-[12px] text-white opacity-0 shadow-[0_12px_32px_-8px_rgba(16,24,40,.4)] transition-opacity group-hover/ex:opacity-100 group-hover/ex:delay-150"
                  >
                    <p className="mb-1.5 font-medium text-[#c9d6e4]">Why sales were left out</p>
                    <ul className="space-y-1">
                      {exclusions.map(([k, v]) => (
                        <li key={k} className="flex justify-between gap-4">
                          <span className="text-[#dde6f0]">{k}</span>
                          <span className="font-semibold">{v.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Notices */}
            {(runError || logNote || result?.truncated) && (
              <div className="mt-3 space-y-2">
                {runError && (
                  <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700">
                    {runError}
                  </p>
                )}
                {result?.truncated && (
                  <p className="rounded-[8px] border border-[#f3da8c] bg-[#fff9e6] px-3 py-2 text-[12.5px] text-[#8a6100]">
                    This search hit the county limit, so the oldest sales were cut off. Narrow the distance or the window
                    for a complete list.
                  </p>
                )}
                {logNote && (
                  <p className="rounded-[8px] border border-[#f3da8c] bg-[#fff9e6] px-3 py-2 text-[12.5px] text-[#8a6100]">
                    {logNote}
                  </p>
                )}
              </div>
            )}

            {/* List header */}
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-sc-ink">{VIEW_LABEL[view]}</h2>
              <span className="text-[12.5px] text-[#98a4b3]">
                {visible.length.toLocaleString()} lead{visible.length === 1 ? '' : 's'}
              </span>
              {checking && (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7a8d]">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-sc-sky" />
                  Checking aerials {checkedPools} of {checkable}
                </span>
              )}
              <select
                value={view}
                onChange={(e) => setView(e.target.value as View)}
                aria-label="Pool filter"
                className={`h-7 rounded-[6px] border border-[#e4e9f0] bg-white px-2 text-[12.5px] text-sc-ink min-[860px]:hidden ${focusRing}`}
              >
                {(Object.keys(VIEW_LABEL) as View[]).map((v) => (
                  <option key={v} value={v}>
                    {VIEW_LABEL[v]}
                    {result ? ` (${counts[v]})` : ''}
                  </option>
                ))}
              </select>
              <label className="relative w-full sm:ml-auto sm:w-[260px]">
                <span className="sr-only">Search leads</span>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98a4b3]" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search address, city or owner"
                  className="h-8 w-full rounded-[7px] border border-[#e4e9f0] bg-white pl-8 pr-8 text-[13px] text-sc-ink placeholder:text-[#98a4b3] focus:border-sc-sky focus:shadow-[0_0_0_3px_rgba(83,165,211,.18)] focus:outline-none"
                />
                <span className={`${kbd} pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 max-sm:hidden`}>/</span>
              </label>
            </div>

            {/* Leads table */}
            <div className="mt-3 rounded-[10px] border border-[#e4e9f0] bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)] max-lg:overflow-x-auto lg:overflow-clip">
              {!result ? (
                <div className="flex flex-col items-center px-6 py-16 text-center">
                  {running ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin text-sc-sky" />
                      <p className="mt-3 text-[13.5px] font-medium text-sc-ink">Searching the county’s records…</p>
                    </>
                  ) : (
                    <>
                      <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#eef6fc] text-sc-blue">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <p className="mt-3 text-[13.5px] font-medium text-sc-ink">No search yet</p>
                      <p className="mt-1 max-w-sm text-[12.5px] text-[#6b7a8d]">
                        Choose an address, set the filters above, then press Find leads.
                      </p>
                    </>
                  )}
                </div>
              ) : visible.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-[13.5px] font-medium text-sc-ink">
                    {result.leads.length === 0
                      ? 'No qualifying leads'
                      : query
                        ? 'Nothing matches that search'
                        : checking
                          ? 'None yet. Still checking the aerials…'
                          : `No leads in ${VIEW_LABEL[view]}`}
                  </p>
                  {result.leads.length === 0 && (
                    <p className="mt-1 text-[12.5px] text-[#6b7a8d]">
                      Hover Excluded above to see why: the distance, the window, the price range or the property type.
                    </p>
                  )}
                </div>
              ) : (
                <table className="w-full min-w-[660px] border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="text-[12px] text-[#6b7a8d]">
                      {(
                        [
                          ['aerial', 'Aerial', 'w-[124px]'],
                          ['property', 'Property', ''],
                          ['pool', 'Pool', 'w-[118px]'],
                          ['sold', 'Sold', 'w-[112px]'],
                          ['price', 'Price', 'w-[108px] text-right'],
                          ['size', 'Size', 'w-[100px] text-right max-[1180px]:hidden'],
                          ['distance', 'Distance', 'w-[92px] text-right max-[1180px]:hidden'],
                          ['link', '', 'w-[48px]'],
                        ] as Array<[string, string, string]>
                      ).map(([col, label, cls]) => {
                        const sortable = col !== 'aerial' && col !== 'link';
                        const active = sort.col === col;
                        return (
                          <th
                            key={col}
                            scope="col"
                            aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                            className={`sticky top-0 z-10 h-9 border-b border-[#e4e9f0] bg-[#fafbfd] px-3 font-medium first:rounded-tl-[10px] last:rounded-tr-[10px] ${cls}`}
                          >
                            {sortable ? (
                              <button
                                type="button"
                                onClick={() => toggleSort(col as SortCol)}
                                className={`inline-flex items-center gap-1 rounded-[4px] transition hover:text-sc-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(83,165,211,.5)] ${
                                  cls.includes('text-right') ? 'flex-row-reverse' : ''
                                } ${active ? 'text-sc-ink' : ''}`}
                              >
                                {label}
                                {active &&
                                  (sort.dir === 'asc' ? (
                                    <ArrowUp className="h-3 w-3 text-sc-blue" strokeWidth={2.5} />
                                  ) : (
                                    <ArrowDown className="h-3 w-3 text-sc-blue" strokeWidth={2.5} />
                                  ))}
                              </button>
                            ) : (
                              <span className={col === 'link' ? 'sr-only' : ''}>{label || 'County page'}</span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => {
                      const pool = pools[r.parcel_id];
                      const selected = r.parcel_id === selectedId;
                      const owner = ownerName(r.owner_on_record);
                      const sqft = sqftOf(r.living_sqft);
                      const cell = `border-b border-[#eef1f5] px-3 group-last:border-b-0 ${selected ? 'bg-[#eef6fc]' : 'group-hover:bg-[#f8fafc]'}`;
                      return (
                        <tr
                          key={r.parcel_id}
                          ref={(el) => {
                            if (el) rowRefs.current.set(r.parcel_id, el);
                            else rowRefs.current.delete(r.parcel_id);
                          }}
                          onClick={() => openLead(r.parcel_id)}
                          aria-selected={selected}
                          className="group scroll-mt-9 cursor-pointer"
                        >
                          <td className={`${cell} relative py-[7px]`}>
                            {selected && <span className="absolute inset-y-0 left-0 w-[2px] bg-sc-blue" />}
                            <span
                              onPointerEnter={(e) => e.pointerType === 'mouse' && showPreview(r, e.currentTarget)}
                              onPointerLeave={() => setPreview(null)}
                              className="flex h-[70px] w-[100px] cursor-zoom-in items-center justify-center overflow-hidden rounded-[8px] bg-[#eef1f5]"
                            >
                              {pool?.thumb ? (
                                <img src={pool.thumb} alt="" className="h-full w-full object-cover" />
                              ) : pendingIds.has(r.parcel_id) && !pool ? (
                                <LoaderCircle className="h-4 w-4 animate-spin text-[#c9d1dc]" />
                              ) : (
                                <span className="text-[11px] text-[#98a4b3]">No photo</span>
                              )}
                            </span>
                          </td>
                          <td className={`${cell} py-2`}>
                            <p className="truncate text-[13.5px] font-semibold text-sc-ink">{r.street_address}</p>
                            <p className="truncate text-[12.5px] text-[#6b7a8d]">
                              {[r.city, `FL ${r.zip}`.trim()].filter(Boolean).join(', ')}
                            </p>
                            {owner && <p className="truncate text-[12.5px] text-[#98a4b3]">{owner}</p>}
                          </td>
                          <td className={cell}>
                            <PoolBadge check={pool} pending={pendingIds.has(r.parcel_id)} />
                          </td>
                          <td className={cell}>
                            <p className="font-medium text-sc-ink">{monthDay(r.sale_date)}</p>
                            <p className="text-[12px] text-[#98a4b3]">{daysAgo(r.days_since_sale)}</p>
                          </td>
                          <td className={`${cell} text-right font-semibold text-sc-ink`}>
                            {r.sale_price !== null ? dollars(r.sale_price) : '—'}
                          </td>
                          <td className={`${cell} text-right text-[#6b7a8d] max-[1180px]:hidden`}>
                            {sqft ? `${sqft.toLocaleString()} sq ft` : '—'}
                          </td>
                          <td className={`${cell} text-right text-[#6b7a8d] max-[1180px]:hidden`}>
                            {r.straight_line_miles} mi
                          </td>
                          <td className={`${cell} text-center`}>
                            <a
                              href={r.county_page}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`${r.street_address} on the county property page`}
                              title="County property page"
                              className={`${iconBtn} text-[#98a4b3] hover:text-sc-blue`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {visible.length > shown.length && (
                <div className="border-t border-[#eef1f5] px-3 py-2.5 text-center">
                  <button type="button" onClick={() => setShowAll(true)} className={secondaryBtn}>
                    Show all {visible.length.toLocaleString()}
                  </button>
                </div>
              )}
            </div>

            {result && visible.length > 0 && (
              <p className="mt-2.5 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11.5px] text-[#98a4b3] max-sm:hidden">
                <span className="inline-flex items-center gap-1">
                  <span className={kbd}>J</span>
                  <span className={kbd}>K</span> move
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={kbd}>Enter</span> open
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={kbd}>Esc</span> close
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={kbd}>/</span> search
                </span>
              </p>
            )}

            <p className="mt-8 max-w-3xl text-[11.5px] leading-[1.6] text-[#98a4b3]">
              Sales come from the Pinellas County Property Appraiser’s public records
              {result?.loadedAt ? `, as of ${onDate(`${result.loadedAt}T12:00:00Z`)}` : ''}; recent sales take a few
              weeks to be recorded. Pools aren’t in that data, so each lot is checked for pool water on the county’s
              2026 aerial photo. Distances are straight-line, not driving. Nothing here contacts anyone: outreach
              happens in the CRM.
            </p>
          </div>
        </div>
      </div>

      {/* Aerial hover preview */}
      {preview && (
        <div
          className={`lf-pop pointer-events-none fixed z-[60] h-[270px] w-[380px] overflow-hidden rounded-[12px] bg-[#eef1f5] shadow-[0_24px_60px_-12px_rgba(16,24,40,.45),0_0_0_1px_rgba(16,24,40,.06)] ${
            preview.flip ? 'origin-right' : 'origin-left'
          }`}
          style={{ left: preview.left, top: preview.top }}
        >
          <img src={preview.thumb} alt="" className="h-full w-full object-cover" />
          <span className="absolute bottom-2 left-2 max-w-[calc(100%-16px)] truncate rounded-[6px] bg-sc-ink/85 px-2 py-1 text-[11.5px] font-medium text-white">
            {preview.lead.street_address} · 2026 aerial
          </span>
        </div>
      )}

      {/* Detail drawer: kept mounted so it slides both ways */}
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-sc-navy/20 transition-opacity duration-200 ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={drawerLead ? drawerLead.street_address : 'Lead details'}
        inert={!drawerOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-[440px] max-w-full flex-col border-l border-[#e4e9f0] bg-white shadow-[-24px_0_48px_-24px_rgba(16,24,40,.25)] transition-transform duration-200 ease-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {drawerLead && (
          <>
            <div className="flex h-[52px] shrink-0 items-center gap-1 border-b border-[#e4e9f0] px-3">
              <button type="button" onClick={() => move(-1)} disabled={selectedIndex <= 0} aria-label="Previous lead" className={iconBtn}>
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                disabled={selectedIndex >= visible.length - 1}
                aria-label="Next lead"
                className={iconBtn}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <span className="ml-1 text-[12.5px] text-[#6b7a8d]">
                {selectedIndex + 1} of {visible.length}
              </span>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close" className={`${iconBtn} ml-auto`}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="flex h-[260px] items-center justify-center overflow-hidden rounded-[10px] bg-[#eef1f5]">
                {pools[drawerLead.parcel_id]?.thumb ? (
                  <img src={pools[drawerLead.parcel_id]?.thumb as string} alt={`${drawerLead.street_address} on the 2026 aerial`} className="h-full w-full object-cover" />
                ) : pendingIds.has(drawerLead.parcel_id) && !pools[drawerLead.parcel_id] ? (
                  <LoaderCircle className="h-5 w-5 animate-spin text-[#c9d1dc]" />
                ) : (
                  <span className="text-[12px] text-[#98a4b3]">No aerial photo</span>
                )}
              </div>
              <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.015em] text-sc-ink">{drawerLead.street_address}</h3>
              <p className="text-[13px] text-[#6b7a8d]">
                {[drawerLead.city, `FL ${drawerLead.zip}`.trim()].filter(Boolean).join(', ')}
              </p>

              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#98a4b3]">Sale</p>
              <div className="mt-1 divide-y divide-[#eef1f5] border-y border-[#eef1f5]">
                <DetailRow label="Sold">
                  {onDate(`${drawerLead.sale_date}T12:00:00Z`)} · {daysAgo(drawerLead.days_since_sale)}
                </DetailRow>
                <DetailRow label="Price">{drawerLead.sale_price !== null ? dollars(drawerLead.sale_price) : '—'}</DetailRow>
                <DetailRow label="Owner on record">{ownerName(drawerLead.owner_on_record) || '—'}</DetailRow>
              </div>

              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#98a4b3]">Property</p>
              <div className="mt-1 divide-y divide-[#eef1f5] border-y border-[#eef1f5]">
                <DetailRow label="Pool">
                  <PoolBadge check={pools[drawerLead.parcel_id]} pending={pendingIds.has(drawerLead.parcel_id)} />
                </DetailRow>
                <DetailRow label="Home">
                  {drawerLead.property_type}
                  {sqftOf(drawerLead.living_sqft) ? ` · ${sqftOf(drawerLead.living_sqft).toLocaleString()} sq ft` : ''}
                </DetailRow>
                <DetailRow label="Distance">{drawerLead.straight_line_miles} mi straight-line</DetailRow>
              </div>

              <a
                href={drawerLead.county_page}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-5 flex h-9 w-full items-center justify-center gap-1.5 rounded-[7px] bg-sc-ink text-[13px] font-medium text-white transition hover:bg-sc-navy ${focusRing}`}
              >
                Open county property page <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <p className="mt-4 text-[12px] leading-[1.55] text-[#98a4b3]">{poolDetail(pools[drawerLead.parcel_id])}</p>
              <p className="mt-1.5 text-[12px] leading-[1.55] text-[#98a4b3]">
                A pool under a screen cage or heavy shade can read as none seen, so check the photo.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};
