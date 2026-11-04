/**
 * /admin → New Homeowner Leads. Recently sold homes with a pool within a set
 * distance of one address, optionally inside a sale-price range.
 *
 * The search address is typed and picked from the site's address lookup,
 * which supplies its map position. The sold homes come from the county sales
 * CSV, read IN THE BROWSER and never uploaded. The leads are ranked here
 * (leads/leadEngine.ts); the only thing sent to the server is a summary of the
 * run (settings and counts, never an address), so the page can say when it
 * last ran and what it found. The leads leave as a CSV for the CRM, where
 * outreach lives; nothing here contacts anyone.
 *
 * Styled on the homepage's kit (adminKit.tsx): white cards on the light
 * section blue, the homepage's fields, and the gold button for the one action.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Download, FileSpreadsheet, History, LoaderCircle, MapPin, Upload } from 'lucide-react';
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
import { parseCSV, toCSV, type CsvRow } from './leads/csv';
import {
  SALES_COLUMNS,
  missingColumns,
  money,
  rankLeads,
  shortMoney,
  type Lead,
  type LeadResult,
  type SearchPoint,
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

type Settings = { asOf: string; lookbackDays: string; radius: string; minPrice: string; maxPrice: string };

/** The search address, with the full line it was picked as. */
type Center = SearchPoint & { label: string };

const SETTINGS_KEY = 'scpp_admin_lead_settings';
const CENTER_KEY = 'scpp_admin_lead_center';

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

/** Today in Florida, as YYYY-MM-DD. */
const todayEt = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

const readSettings = (): Settings => {
  const saved = readStored<Partial<Settings>>(SETTINGS_KEY, {});
  // The as-of date is always today on a fresh visit: a remembered one would
  // quietly re-run last month's window.
  return {
    asOf: todayEt(),
    lookbackDays: saved.lookbackDays ?? '90',
    radius: saved.radius ?? '2',
    minPrice: saved.minPrice ?? '',
    maxPrice: saved.maxPrice ?? '',
  };
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
];

/** "Oct 31": the year is in the run history; this tile only has room for the day. */
const monthDay = (iso: string): string =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** A county price as written ("950000", "$950,000.00") shown as $950,000. */
const showPrice = (raw: string): string => {
  const n = money(raw);
  return n === null ? raw : `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

/** "$400k–$900k", "over $400k", "under $900k" or '' for no range. */
const priceRange = (min: number | null, max: number | null): string =>
  min !== null && max !== null
    ? `${shortMoney(min)}–${shortMoney(max)}`
    : min !== null
      ? `over ${shortMoney(min)}`
      : max !== null
        ? `under ${shortMoney(max)}`
        : '';

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
    <div className={`${tileClass} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-sc-navy">{title}</p>
          {file ? (
            <p className={`mt-1 truncate text-[13.5px] ${bad ? 'font-medium text-red-700' : 'text-sc-navy/65'}`}>
              <FileSpreadsheet className="mr-1 inline h-4 w-4 align-[-3px] text-sc-blue" />
              {file.name} · {file.rows.length.toLocaleString()} rows
            </p>
          ) : (
            <p className="mt-1 text-[13.5px] text-sc-navy/50">No file yet</p>
          )}
        </div>
        <button type="button" onClick={() => ref.current?.click()} className={`${smallButton} shrink-0 bg-white`}>
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
      {file && file.rows.length === 0 && <p className={`mt-3 ${notice.error}`}>This file has no data rows.</p>}
      {file && file.missing.length > 0 && (
        <p className={`mt-3 ${notice.error}`}>Missing columns: {file.missing.join(', ')}</p>
      )}
      <p className="mt-3 text-[12px] leading-relaxed text-sc-navy/50">
        Needs: <span className="font-mono text-sc-navy/70">{columns.join(', ')}</span>
        <br />
        Optional: <span className="font-mono text-sc-navy/70">sale_price, parcel_id</span>
      </p>
    </div>
  );
};

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
        <p className={`mt-2 ${mutedText}`}>Pick it from the list so it can be placed on the map.</p>
      )}
    </div>
  );
};

export const LeadFinder = ({ onLogout, onBack }: { onLogout: () => void; onBack: () => void }) => {
  const [center, setCenter] = useState<Center | null>(() => readStored<Center | null>(CENTER_KEY, null));
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

  // Remembered on this device: the window, distance and price range, and the
  // last search address, so a repeat search is one press.
  useEffect(() => {
    const { lookbackDays, radius, minPrice, maxPrice } = settings;
    store(SETTINGS_KEY, { lookbackDays, radius, minPrice, maxPrice });
  }, [settings]);
  useEffect(() => store(CENTER_KEY, center), [center]);

  const set = (k: keyof Settings) => (e: { target: { value: string } }) =>
    setSettings((s) => ({ ...s, [k]: e.target.value }));

  const minPrice = money(settings.minPrice);
  const maxPrice = money(settings.maxPrice);

  // What the results were computed from. When it no longer matches, the results
  // on screen are for different inputs and say so.
  const signature = [
    center?.label,
    sales?.name,
    sales?.rows.length,
    settings.asOf,
    settings.lookbackDays,
    settings.radius,
    minPrice,
    maxPrice,
  ].join('|');
  const salesReady = !!sales && sales.rows.length > 0 && !sales.missing.length;
  const canRun = !!center && salesReady;

  const run = async () => {
    if (!center || !sales || !salesReady) return;
    setRunError('');
    setLogNote('');
    setShowAll(false);
    let out: LeadResult;
    try {
      out = rankLeads({
        center,
        sales: sales.rows,
        asOf: settings.asOf,
        lookbackDays: Number(settings.lookbackDays),
        radius: Number(settings.radius),
        minPrice,
        maxPrice,
      });
    } catch (e) {
      setResult(null);
      setRunError(e instanceof Error ? e.message : String(e));
      return;
    }
    setResult({ ...out, signature, checked: sales.rows.length });

    setRunning(true);
    try {
      const range = priceRange(minPrice, maxPrice);
      const res = await fetch('/api/admin/lead-runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // Counts and settings only: the search address is not recorded.
        body: JSON.stringify({
          asOf: settings.asOf,
          lookbackDays: Number(settings.lookbackDays),
          radius: Number(settings.radius),
          routeStops: 1,
          salesRows: sales.rows.length,
          leadsFound: out.leads.length,
          newestSale: out.newestSale,
          salesFile: range ? `${sales.name} · ${range}` : sales.name,
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
    <>
      <AdminHeader onLogout={onLogout} />
      <AdminBody>
        <PageHead
          eyebrow="Lead finder"
          title="New homeowner leads"
          lead="Recently sold homes with a pool, within the distance you set of one address."
          onBack={onBack}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-6">
            <Card title="1. Search around">
              <CenterPicker center={center} onChange={setCenter} />
            </Card>

            <Card title="2. Sold homes">
              <p className={`-mt-2 ${mutedText}`}>
                The county sales file. It’s read on this device and never uploaded.
              </p>
              <FilePick
                title="Property sales"
                columns={SALES_COLUMNS}
                file={sales}
                onFile={async (f) => {
                  const rows = parseCSV(await f.text());
                  setSales({ name: f.name, rows, missing: missingColumns(rows, SALES_COLUMNS) });
                }}
              />
            </Card>

            <Card title="3. Narrow it down">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className={fieldLabel}>Within (miles)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0.1}
                    step={0.25}
                    value={settings.radius}
                    onChange={set('radius')}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Sold within (days)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={settings.lookbackDays}
                    onChange={set('lookbackDays')}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabel}>As of</span>
                  <input type="date" value={settings.asOf} onChange={set('asOf')} className={inputClass} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabel}>Sale price from</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={settings.minPrice}
                    onChange={set('minPrice')}
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
                    onChange={set('maxPrice')}
                    placeholder="No maximum"
                    className={inputClass}
                  />
                </label>
              </div>
              <p className={`-mt-2 ${mutedText}`}>
                {minPrice !== null || maxPrice !== null
                  ? `Only homes that sold ${priceRange(minPrice, maxPrice)}. Homes with no price on record are left out.`
                  : 'Leave both blank for any price.'}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button type="button" onClick={run} disabled={!canRun || running} className={`${buttonClass.gold} px-7`}>
                  {running && <LoaderCircle className="h-5 w-5 animate-spin" />}
                  Find leads
                  {!running && <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />}
                </button>
                {!canRun && (
                  <span className={mutedText}>
                    {!center && !salesReady
                      ? 'Pick an address and load the sales file to run.'
                      : !center
                        ? 'Pick an address to search around.'
                        : 'Load the sales file to run.'}
                  </span>
                )}
              </div>
              {runError && <p className={notice.error}>{runError}</p>}
              {logNote && <p className={notice.warn}>{logNote}</p>}
            </Card>

            {result && (
              <Card
                title="4. Leads"
                aside={
                  result.leads.length > 0 && (
                    <button type="button" onClick={download} className={smallButton}>
                      <Download className="h-4 w-4" /> Download CSV
                    </button>
                  )
                }
              >
                {stale && <p className={notice.warn}>The address, file or filters changed since this run. Run it again to update.</p>}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat value={result.leads.length.toLocaleString()} label="Leads" />
                  <Stat value={result.checked.toLocaleString()} label="Homes checked" />
                  <Stat value={excludedTotal.toLocaleString()} label="Excluded" />
                  <Stat value={result.newestSale ? monthDay(result.newestSale) : '—'} label="Newest sale" />
                </div>

                {result.leads.length === 0 ? (
                  <p className={bodyText}>
                    No qualifying leads. The exclusion counts below say why: the distance, the window, the price range or
                    missing data.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {shown.map((r, i) => (
                      <li
                        key={`${r.parcel_id || r.street_address}-${i}`}
                        className="rounded-[12px] p-4 ring-1 ring-inset ring-sc-navy/[0.12]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[16px] font-semibold text-sc-navy">{r.street_address}</p>
                            <p className="text-[14px] text-sc-navy/60">
                              {[r.city, `${r.state} ${r.zip}`.trim()].filter(Boolean).join(', ')}
                            </p>
                          </div>
                          <span
                            className="shrink-0 rounded-full bg-[#e7f6ee] px-2.5 py-1 text-[14px] font-bold tabular-nums text-[#13804b]"
                            title="Priority: 60% how recently it sold, 40% how close it is"
                          >
                            {r.priority_score}
                          </span>
                        </div>
                        <p className="mt-2 text-[14px] text-sc-navy/80">
                          Sold {onDate(`${r.sale_date}T12:00:00Z`)} ({r.days_since_sale} days ago)
                          {r.sale_price ? ` · ${showPrice(r.sale_price)}` : ''}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-[14px] text-sc-navy/80">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-sc-blue" />
                          {r.straight_line_miles} mi away
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {result.leads.length > shown.length && (
                  <button type="button" onClick={() => setShowAll(true)} className={smallButton}>
                    Show all {result.leads.length.toLocaleString()}
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
                    {last.sales_rows.toLocaleString()} homes checked within {last.radius_miles} mi
                    {last.newest_sale ? `. County data through ${onDate(`${last.newest_sale}T12:00:00Z`)}.` : '.'}
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
              Distances are straight-line, not driving. County pool flags can be out of date, so check before reaching
              out. Nothing here contacts anyone: outreach happens in the CRM.
            </p>
          </aside>
        </div>
      </AdminBody>
    </>
  );
};
