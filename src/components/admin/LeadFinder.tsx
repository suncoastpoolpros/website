/**
 * /admin → New Homeowner Leads. Recently sold homes with a pool, near a stop
 * we already drive to.
 *
 * Two CSVs go in (route stops, property sales) and are read IN THE BROWSER:
 * neither file is uploaded. Single homes can also be added by hand, with the
 * address placed by the site's Mapbox lookup, and each one gets its own answer.
 * The route file and the hand-added homes are remembered on this device only,
 * so a quick check is: type an address, press Run. Press Run and the leads are ranked here
 * (leads/leadEngine.ts); the only thing sent to the server is a summary of the
 * run (settings and counts, never an address), so the page can say when it last
 * ran and what it found. The leads leave as a CSV for the CRM, where outreach
 * lives; nothing here contacts anyone.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  Download,
  FileSpreadsheet,
  History,
  LoaderCircle,
  LogOut,
  MapPin,
  Play,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import { AddressAutocomplete, type Suggestion } from '@/components/landing/AddressAutocomplete';
import { CollapsibleSection, Section } from './adminUi';
import { ago, onDate, onDateTime } from './quoteFormat';
import { parseCSV, toCSV, type CsvRow } from './leads/csv';
import {
  ROUTE_COLUMNS,
  SALES_COLUMNS,
  auditRoutes,
  missingColumns,
  rankLeads,
  type Lead,
  type LeadResult,
} from './leads/leadEngine';

type LoadedFile = { name: string; rows: CsvRow[]; missing: string[] };

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

type Settings = { asOf: string; lookbackDays: string; radius: string };

const SETTINGS_KEY = 'scpp_admin_lead_settings';
const ROUTES_KEY = 'scpp_admin_lead_routes';
const HAND_KEY = 'scpp_admin_lead_hand';

/** A home typed in rather than read from the sales file. */
type HandHome = {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  saleDate: string;
  salePrice: string;
  hasPool: boolean;
};

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

/** "St. Petersburg, FL 33701" → its parts. */
const splitPlace = (line2: string): { city: string; state: string; zip: string } => {
  const m = /^(.*?),\s*([A-Z]{2})(?:\s+(\d{5}))?\s*$/.exec(line2.trim());
  return m ? { city: m[1], state: m[2], zip: m[3] ?? '' } : { city: line2.trim(), state: '', zip: '' };
};

const handRow = (h: HandHome): CsvRow => ({
  street_address: h.street,
  city: h.city,
  state: h.state,
  zip: h.zip,
  sale_date: h.saleDate,
  sale_price: h.salePrice,
  has_pool: h.hasPool ? 'Y' : 'N',
  latitude: String(h.lat),
  longitude: String(h.lng),
  source: 'hand',
});

/** Today in Florida, as YYYY-MM-DD. */
const todayEt = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

const readSettings = (): Settings => {
  const base = { asOf: todayEt(), lookbackDays: '90', radius: '5' };
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>;
    // The as-of date is always today on a fresh visit: a remembered one would
    // quietly re-run last month's window.
    return { ...base, lookbackDays: saved.lookbackDays ?? base.lookbackDays, radius: saved.radius ?? base.radius };
  } catch {
    return base;
  }
};

/** A week without a run is worth flagging: new owners pick a company early. */
const STALE_DAYS = 7;

const LEAD_COLUMNS: Array<keyof Lead> = [
  'priority_score',
  'street_address',
  'city',
  'state',
  'zip',
  'parcel_id',
  'sale_date',
  'sale_price',
  'days_since_sale',
  'straight_line_miles',
  'stops_within_1_mile',
  'nearest_route_stop_id',
  'nearest_technician',
  'nearest_service_day',
  'source',
];

const input =
  'h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-white placeholder-gray-500 focus:border-brand-blue-light focus:outline-none';
const label = 'mb-1.5 block text-sm font-medium text-gray-300';
const ghostButton =
  'inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5';

const FilePick = ({
  title,
  columns,
  file,
  onFile,
}: {
  title: string;
  columns: readonly string[];
  file: LoadedFile | null;
  onFile: (f: File) => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const bad = file && (file.missing.length > 0 || file.rows.length === 0);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-white">{title}</p>
          {file ? (
            <p className={`mt-1 truncate text-sm ${bad ? 'text-red-300' : 'text-gray-400'}`}>
              <FileSpreadsheet className="mr-1 inline h-4 w-4 align-[-3px]" />
              {file.name} · {file.rows.length.toLocaleString()} rows
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">No file yet</p>
          )}
        </div>
        <button type="button" onClick={() => ref.current?.click()} className={`${ghostButton} shrink-0`}>
          <Upload className="h-4 w-4" /> {file ? 'Replace' : 'Choose CSV'}
        </button>
        <input
          ref={ref}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = '';
          }}
        />
      </div>
      {file && file.rows.length === 0 && <p className="mt-2 text-sm text-red-300">This file has no data rows.</p>}
      {file && file.missing.length > 0 && (
        <p className="mt-2 text-sm text-red-300">Missing columns: {file.missing.join(', ')}</p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        Needs: <span className="font-mono text-gray-400">{columns.join(', ')}</span>
      </p>
    </div>
  );
};

/**
 * One home at a time. The address has to be PICKED from the suggestions: that
 * is where its map position comes from, and a typed address with no position
 * can't be measured against a stop.
 */
const HandEntry = ({ onAdd }: { onAdd: (h: HandHome) => void }) => {
  const [picked, setPicked] = useState<Suggestion | null>(null);
  const [saleDate, setSaleDate] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [hasPool, setHasPool] = useState(true);
  // Remounts the address field empty after each add.
  const [fieldKey, setFieldKey] = useState(0);

  const placed = picked && typeof picked.lat === 'number' && typeof picked.lng === 'number';
  const ready = !!placed && !!saleDate;

  const add = () => {
    if (!ready || !picked) return;
    onAdd({
      id: `${picked.id}-${Date.now()}`,
      street: picked.line1,
      ...splitPlace(picked.line2),
      lat: picked.lat as number,
      lng: picked.lng as number,
      saleDate,
      salePrice: salePrice.trim(),
      hasPool,
    });
    setPicked(null);
    setSaleDate('');
    setSalePrice('');
    setHasPool(true);
    setFieldKey((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      <div>
        <span className={label}>Address</span>
        <div key={fieldKey} className="flex rounded-lg bg-white">
          <AddressAutocomplete name="lead-address" placeholder="Start typing an address" onPick={setPicked} />
        </div>
        {picked && !placed && (
          <p className="mt-1.5 text-sm text-red-300">That address came back without a map position. Try another match.</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label>
          <span className={label}>Sold on</span>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className={`${input} [color-scheme:dark]`}
          />
        </label>
        <label>
          <span className={label}>Sale price (optional)</span>
          <input
            type="text"
            inputMode="numeric"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="$540,000"
            className={input}
          />
        </label>
        <label className="flex h-11 items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={hasPool}
            onChange={(e) => setHasPool(e.target.checked)}
            className="h-4 w-4 accent-[#4a93d1]"
          />
          Has a pool
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={add} disabled={!ready} className={`${ghostButton} disabled:cursor-not-allowed disabled:opacity-50`}>
          <Plus className="h-4 w-4" /> Add home
        </button>
        {!ready && (
          <span className="text-sm text-gray-500">
            {placed ? 'Add the sale date.' : 'Pick an address from the list, then add the sale date.'}
          </span>
        )}
      </div>
    </div>
  );
};

export const LeadFinder = ({ onLogout, onBack }: { onLogout: () => void; onBack: () => void }) => {
  const [routes, setRoutes] = useState<LoadedFile | null>(() => readStored<LoadedFile | null>(ROUTES_KEY, null));
  const [hand, setHand] = useState<HandHome[]>(() => readStored<HandHome[]>(HAND_KEY, []));
  const [sales, setSales] = useState<LoadedFile | null>(null);
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [result, setResult] = useState<(LeadResult & { signature: string; checked: number }) | null>(null);
  const [runError, setRunError] = useState('');
  const [logNote, setLogNote] = useState('');
  const [history, setHistory] = useState<RunHistory>({ kind: 'loading' });
  const [showAll, setShowAll] = useState(false);
  const [running, setRunning] = useState(false);

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
    try {
      window.localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ lookbackDays: settings.lookbackDays, radius: settings.radius }),
      );
    } catch {
      /* storage disabled: the defaults come back next visit, nothing else lost */
    }
  }, [settings.lookbackDays, settings.radius]);

  // Remembered on this device so the next visit can skip straight to an address.
  useEffect(() => store(ROUTES_KEY, routes), [routes]);
  useEffect(() => store(HAND_KEY, hand.length ? hand : null), [hand]);

  const readFile = async (f: File, columns: readonly string[]): Promise<LoadedFile> => {
    const rows = parseCSV(await f.text());
    return { name: f.name, rows, missing: missingColumns(rows, columns) };
  };

  const audit = useMemo(() => (routes ? auditRoutes(routes.rows) : null), [routes]);

  // What the results were computed from. When it no longer matches, the results
  // on screen are for different inputs and say so.
  const signature = [
    routes?.name,
    routes?.rows.length,
    sales?.name,
    sales?.rows.length,
    hand.map((h) => h.id).join(','),
    settings.asOf,
    settings.lookbackDays,
    settings.radius,
  ].join('|');
  const routesReady = !!routes && routes.rows.length > 0 && !routes.missing.length;
  const salesReady = !!sales && sales.rows.length > 0 && !sales.missing.length;
  // Routes are always needed (there is nothing to measure from without them);
  // the homes can come from the file, from hand, or both.
  const canRun = routesReady && (salesReady || hand.length > 0);

  const run = async () => {
    if (!canRun || !audit || !routes) return;
    const fileRows = salesReady && sales ? sales.rows : [];
    const allSales = [...fileRows, ...hand.map(handRow)];
    const salesLabel = [salesReady && sales ? sales.name : '', hand.length ? `${hand.length} by hand` : '']
      .filter(Boolean)
      .join(' + ');
    setRunError('');
    setLogNote('');
    setShowAll(false);
    let out: LeadResult;
    try {
      out = rankLeads({
        stops: audit.stops,
        sales: allSales,
        asOf: settings.asOf,
        lookbackDays: Number(settings.lookbackDays),
        radius: Number(settings.radius),
      });
    } catch (e) {
      setResult(null);
      setRunError(e instanceof Error ? e.message : String(e));
      return;
    }
    setResult({ ...out, signature, checked: allSales.length });

    setRunning(true);
    try {
      const res = await fetch('/api/admin/lead-runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          asOf: settings.asOf,
          lookbackDays: Number(settings.lookbackDays),
          radius: Number(settings.radius),
          routeStops: audit.scheduledStops,
          salesRows: allSales.length,
          leadsFound: out.leads.length,
          newestSale: out.newestSale,
          routesFile: routes.name,
          salesFile: salesLabel,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; storage?: boolean };
      if (res.status === 401) return onLogout();
      if (!res.ok || !data.ok) setLogNote('This run worked, but it couldn’t be added to the run history.');
      else if (data.storage === false) setLogNote('This run worked. Run history isn’t set up yet, so it wasn’t recorded.');
      await fetchHistory();
    } catch {
      setLogNote('This run worked, but it couldn’t be added to the run history.');
    } finally {
      setRunning(false);
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([toCSV(LEAD_COLUMNS, result.leads)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `new-homeowner-leads-${settings.asOf}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const last = history.kind === 'ready' ? history.runs[0] : undefined;
  const lastDays = last ? (Date.now() - new Date(last.ran_at).getTime()) / 86_400_000 : null;
  const stale = result && result.signature !== signature;
  const shown = result ? (showAll ? result.leads : result.leads.slice(0, 50)) : [];
  // Most-common reason first.
  const exclusions = Object.entries<number>(result?.excluded ?? {}).sort((a, b) => b[1] - a[1]);
  const excludedTotal = exclusions.reduce((n, [, v]) => n + v, 0);

  return (
    <div className="min-h-dvh px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <button onClick={onBack} className="mb-1 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
              <ChevronLeft className="h-4 w-4" /> All documents
            </button>
            <h1 className="font-display text-2xl font-bold text-white">New Homeowner Leads</h1>
            <p className="text-sm text-gray-400">Recently sold homes with a pool, near a stop we already drive to.</p>
          </div>
          <button onClick={onLogout} className={ghostButton}>
            <LogOut className="h-4 w-4" /> Lock
          </button>
        </div>

        {/* The running tally: when it last ran, and how fresh that data was. */}
        <section
          className={`mb-6 rounded-2xl border p-5 ${
            lastDays !== null && lastDays > STALE_DAYS
              ? 'border-amber-400/30 bg-amber-400/10'
              : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          {history.kind === 'loading' && (
            <p className="flex items-center gap-2 text-sm text-gray-400">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Loading run history…
            </p>
          )}
          {history.kind === 'error' && (
            <p className="flex items-center gap-2 text-sm text-red-300">
              <AlertCircle className="h-4 w-4" /> Couldn’t load the run history.
            </p>
          )}
          {history.kind === 'ready' && !history.storage && (
            <p className="text-sm leading-relaxed text-amber-100">
              <span className="font-semibold">Run history isn’t set up yet.</span> Leads still work. Apply{' '}
              <span className="font-mono text-amber-200">migrations/0009_lead_runs.sql</span> in the D1 console to
              start keeping a tally.
            </p>
          )}
          {history.kind === 'ready' && history.storage && !last && (
            <p className="text-sm text-gray-300">
              <History className="mr-1.5 inline h-4 w-4 align-[-3px] text-gray-500" />
              Never run yet. Your first run will show here.
            </p>
          )}
          {history.kind === 'ready' && history.storage && last && (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Last run</p>
                  <p className="mt-1 text-xl font-bold text-white">
                    {ago(last.ran_at)}
                    {lastDays !== null && lastDays > STALE_DAYS && (
                      <span className="ml-2 text-sm font-semibold text-amber-200">Due for a run</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-400">{onDateTime(last.ran_at)}</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-2xl font-bold text-white">{last.leads_found.toLocaleString()}</p>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Leads found</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{history.total.toLocaleString()}</p>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Runs total</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                {last.sales_rows.toLocaleString()} sales checked against {last.route_stops.toLocaleString()} stops
                {last.newest_sale ? ` · county data through ${onDate(`${last.newest_sale}T12:00:00Z`)}` : ''}
              </p>
              {history.runs.length > 1 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-blue-light">
                    Recent runs
                  </summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="text-xs uppercase tracking-wider text-gray-500">
                        <tr>
                          <th className="py-2 pr-4 font-medium">Ran</th>
                          <th className="py-2 pr-4 font-medium">Leads</th>
                          <th className="py-2 pr-4 font-medium">Sales</th>
                          <th className="py-2 pr-4 font-medium">Window</th>
                          <th className="py-2 font-medium">Data through</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        {history.runs.map((r) => (
                          <tr key={r.id} className="border-t border-white/5">
                            <td className="py-2 pr-4">{onDateTime(r.ran_at)}</td>
                            <td className="py-2 pr-4 font-semibold text-white">{r.leads_found}</td>
                            <td className="py-2 pr-4">{r.sales_rows.toLocaleString()}</td>
                            <td className="py-2 pr-4">
                              {r.lookback_days} days · {r.radius_miles} mi
                            </td>
                            <td className="py-2">{r.newest_sale ? onDate(`${r.newest_sale}T12:00:00Z`) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </>
          )}
        </section>

        <div className="space-y-6">
          <Section title="1. Load the files">
            <p className="-mt-2 text-sm leading-relaxed text-gray-400">
              Both files are read on this device and never uploaded. The route file is remembered here, so next
              time you can skip straight to adding a home.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <FilePick
                title="Route stops"
                columns={[...ROUTE_COLUMNS, 'latitude', 'longitude']}
                file={routes}
                onFile={async (f) => setRoutes(await readFile(f, ROUTE_COLUMNS))}
              />
              <FilePick
                title="Property sales"
                columns={SALES_COLUMNS}
                file={sales}
                onFile={async (f) => setSales(await readFile(f, SALES_COLUMNS))}
              />
            </div>
            <p className="text-xs leading-relaxed text-gray-500">
              Optional route columns: technician, service_day. Optional sales columns: parcel_id, sale_price. Route
              stops without latitude/longitude can’t be measured from.
            </p>
            {routes && (
              <button
                type="button"
                onClick={() => setRoutes(null)}
                className="text-xs font-semibold text-gray-400 hover:text-white"
              >
                Forget the route file on this device
              </button>
            )}
          </Section>

          <Section title="2. Add homes by hand">
            <p className="-mt-2 text-sm leading-relaxed text-gray-400">
              Optional. For a single home you’ve heard about, with or without a sales file. Each one gets its own
              answer when you run.
            </p>
            <HandEntry onAdd={(h) => setHand((list) => [...list, h])} />
            {hand.length > 0 && (
              <ul className="space-y-2">
                {hand.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate text-gray-200">
                      <span className="font-semibold text-white">{h.street}</span>
                      {h.city ? `, ${h.city}` : ''} · sold {onDate(`${h.saleDate}T12:00:00Z`)}
                      {h.salePrice ? ` · ${h.salePrice}` : ''}
                      {h.hasPool ? '' : ' · no pool'}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${h.street}`}
                      onClick={() => setHand((list) => list.filter((x) => x.id !== h.id))}
                      className="shrink-0 rounded p-1 text-gray-400 hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="3. Settings">
            <div className="grid gap-4 sm:grid-cols-3">
              <label>
                <span className={label}>As of</span>
                <input
                  type="date"
                  value={settings.asOf}
                  onChange={(e) => setSettings((s) => ({ ...s, asOf: e.target.value }))}
                  className={`${input} [color-scheme:dark]`}
                />
              </label>
              <label>
                <span className={label}>Sold within (days)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={settings.lookbackDays}
                  onChange={(e) => setSettings((s) => ({ ...s, lookbackDays: e.target.value }))}
                  className={input}
                />
              </label>
              <label>
                <span className={label}>Max miles from a stop</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0.1}
                  step={0.5}
                  value={settings.radius}
                  onChange={(e) => setSettings((s) => ({ ...s, radius: e.target.value }))}
                  className={input}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={run}
                disabled={!canRun || running}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run
              </button>
              {!canRun && (
                <span className="text-sm text-gray-500">
                  {routesReady ? 'Load a sales file or add a home to run.' : 'Load the route stops file to run.'}
                </span>
              )}
              {runError && <span className="text-sm text-red-300">{runError}</span>}
            </div>
            {logNote && <p className="text-sm text-amber-200">{logNote}</p>}
          </Section>

          {audit && (
            <CollapsibleSection
              title="Route audit"
              hint={`${audit.geocodedStops} of ${audit.scheduledStops} stops geocoded · ${audit.issues.length} issue${audit.issues.length === 1 ? '' : 's'}`}
            >
              <p className="text-sm text-gray-400">
                {audit.scheduledStops.toLocaleString()} stops · {audit.distinctProperties.toLocaleString()} distinct
                addresses · {audit.geocodedStops.toLocaleString()} geocoded
              </p>
              {audit.issues.length === 0 ? (
                <p className="text-sm text-emerald-300">No problems found.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {audit.issues.slice(0, 50).map((x, i) => (
                    <li key={i} className="text-gray-300">
                      <span className="font-semibold text-white">{x.issue}</span> · stop {x.stopId}: {x.detail}
                    </li>
                  ))}
                  {audit.issues.length > 50 && (
                    <li className="text-gray-500">…and {audit.issues.length - 50} more.</li>
                  )}
                </ul>
              )}
            </CollapsibleSection>
          )}

          {result && (
            <section className="glass-panel rounded-2xl p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base font-bold text-white">4. Leads</h2>
                {result.leads.length > 0 && (
                  <button type="button" onClick={download} className={ghostButton}>
                    <Download className="h-4 w-4" /> Download CSV
                  </button>
                )}
              </div>

              {stale && (
                <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                  The files or settings changed since this run. Press Run again to update.
                </p>
              )}
              {result.needsRouteCoordinates && (
                <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                  None of the route stops have coordinates, so no distances could be measured. Add latitude and
                  longitude to the route file.
                </p>
              )}

              {result.handChecks.length > 0 && (
                <div className="mb-5 rounded-xl border border-brand-blue-light/30 bg-brand-blue/10 p-4">
                  <h3 className="text-sm font-semibold text-white">Homes you added</h3>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {result.handChecks.map((c, i) => (
                      <li key={i} className="text-gray-300">
                        <span className="font-semibold text-white">{c.street_address}</span>
                        {c.lead ? (
                          <span className="text-emerald-300">
                            {' '}
                            · lead, score {c.lead.priority_score} · {c.lead.straight_line_miles} mi from stop{' '}
                            {c.lead.nearest_route_stop_id}
                          </span>
                        ) : (
                          <span className="text-amber-200">
                            {' '}
                            · not a lead: {c.reason}
                            {c.detail ? ` (${c.detail})` : ''}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    ['Leads', result.leads.length],
                    ['Homes checked', result.checked],
                    ['Excluded', excludedTotal],
                    ['Newest sale', result.newestSale ? onDate(`${result.newestSale}T12:00:00Z`) : '—'],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <span className="block text-2xl font-bold text-white">
                      {typeof v === 'number' ? v.toLocaleString() : v}
                    </span>
                    <span className="block text-xs uppercase tracking-wider text-gray-400">{k}</span>
                  </div>
                ))}
              </div>

              {result.leads.length === 0 ? (
                <p className="text-sm leading-relaxed text-gray-400">
                  No qualifying leads. Check the exclusion counts below: sale dates, coordinates, the window and the
                  radius.
                </p>
              ) : (
                <ul className="space-y-3">
                  {shown.map((r, i) => (
                    <li
                      key={`${r.parcel_id || r.street_address}-${i}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">
                            {r.street_address}
                            {r.source === 'hand' && (
                              <span className="ml-2 rounded bg-brand-blue/25 px-1.5 py-0.5 align-[2px] text-[11px] font-semibold text-brand-blue-light">
                                Added by hand
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-400">
                            {[r.city, `${r.state} ${r.zip}`.trim()].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-lg bg-emerald-400/15 px-2.5 py-1 text-sm font-bold text-emerald-300"
                          title="Priority: 60% how recently it sold, 40% how close to a stop"
                        >
                          {r.priority_score}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-300">
                        Sold {onDate(`${r.sale_date}T12:00:00Z`)} ({r.days_since_sale} days ago)
                        {r.sale_price ? ` · ${r.sale_price}` : ''}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-300">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                        {r.straight_line_miles} mi from stop {r.nearest_route_stop_id}
                        {r.nearest_technician ? ` · ${r.nearest_technician}` : ''}
                        {r.nearest_service_day ? ` · ${r.nearest_service_day}` : ''}
                        {r.stops_within_1_mile > 1 ? ` · ${r.stops_within_1_mile} stops within a mile` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {result.leads.length > shown.length && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-4 text-sm font-semibold text-brand-blue-light hover:text-white"
                >
                  Show all {result.leads.length.toLocaleString()}
                </button>
              )}

              {excludedTotal > 0 && (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <h3 className="text-sm font-semibold text-white">Excluded</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-400">
                    {exclusions.map(([k, v]) => (
                      <li key={k} className="flex justify-between gap-4 sm:max-w-md">
                        <span>{k}</span>
                        <span className="tabular-nums text-gray-300">{v.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <p className="text-xs leading-relaxed text-gray-500">
            Distances are straight-line, not driving. County pool flags can be out of date, so check before reaching
            out. Nothing here contacts anyone: outreach happens in the CRM.
          </p>
        </div>
      </div>
    </div>
  );
};

