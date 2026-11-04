/**
 * GET  /api/admin/lead-runs — the lead finder's run history (newest 25, plus
 *      the all-time count). { storage:false } when D1 or the table is missing.
 * POST /api/admin/lead-runs — record one run: settings and counts only, never
 *      an address (see migrations/0009_lead_runs.sql).
 *
 * Behind the same PIN session as the rest of /api/admin. Degrades like the
 * quotes store: a missing table is "no history yet", never a broken page.
 */
import { type AdminContext, json, isAllowedOrigin, readBoundedText, requireSession } from './_shared';

type D1 = {
  prepare: (sql: string) => {
    bind: (...values: unknown[]) => { first: <T>() => Promise<T | null> };
    all: <T>() => Promise<{ results?: T[] }>;
    first: <T>() => Promise<T | null>;
  };
};

const dbOf = (env: unknown): D1 | null => {
  const db = (env as { DB?: unknown }).DB;
  return db && typeof (db as D1).prepare === 'function' ? (db as D1) : null;
};

const noTable = (err: unknown) => /no such table/i.test(String(err));

const COLUMNS =
  'id, ran_at, as_of, lookback_days, radius_miles, route_stops, sales_rows, leads_found, newest_sale, routes_file, sales_file';

export const onRequestGet = async (ctx: AdminContext): Promise<Response> => {
  const { request, env } = ctx;
  try {
    if (!isAllowedOrigin(request, env)) return json({ ok: false, error: 'forbidden' }, 403);
    const denied = await requireSession(request, env);
    if (denied) return denied;

    const db = dbOf(env);
    if (!db) return json({ ok: true, storage: false, runs: [], total: 0 }, 200);
    try {
      const { results } = await db.prepare(`SELECT ${COLUMNS} FROM lead_runs ORDER BY id DESC LIMIT 25`).all();
      const count = await db.prepare('SELECT COUNT(*) AS n FROM lead_runs').first<{ n: number }>();
      return json({ ok: true, storage: true, runs: results ?? [], total: Number(count?.n ?? 0) }, 200, {
        'cache-control': 'no-store',
      });
    } catch (err) {
      if (noTable(err)) return json({ ok: true, storage: false, runs: [], total: 0 }, 200);
      throw err;
    }
  } catch (err) {
    console.log('[admin/lead-runs] server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

const int = (v: unknown): number | null => (Number.isInteger(v) && (v as number) >= 0 ? (v as number) : null);
const text = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
const isoDay = (v: unknown): string | null => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export const onRequestPost = async (ctx: AdminContext): Promise<Response> => {
  const { request, env } = ctx;
  try {
    if (!isAllowedOrigin(request, env)) return json({ ok: false, error: 'forbidden' }, 403);
    const denied = await requireSession(request, env);
    if (denied) return denied;

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(await readBoundedText(request, 4096)) as Record<string, unknown>;
    } catch {
      return json({ ok: false, error: 'bad_request' }, 400);
    }
    const asOf = isoDay(body.asOf);
    const lookback = int(body.lookbackDays);
    const radius = typeof body.radius === 'number' && body.radius > 0 && body.radius <= 100 ? body.radius : null;
    const stops = int(body.routeStops);
    const sales = int(body.salesRows);
    const leads = int(body.leadsFound);
    if (!asOf || lookback === null || radius === null || stops === null || sales === null || leads === null) {
      return json({ ok: false, error: 'bad_request' }, 400);
    }

    const db = dbOf(env);
    if (!db) return json({ ok: true, storage: false }, 200);
    try {
      const run = await db
        .prepare(
          `INSERT INTO lead_runs (ran_at, as_of, lookback_days, radius_miles, route_stops, sales_rows, leads_found, newest_sale, routes_file, sales_file)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ${COLUMNS}`,
        )
        .bind(
          new Date().toISOString(),
          asOf,
          lookback,
          radius,
          stops,
          sales,
          leads,
          isoDay(body.newestSale),
          text(body.routesFile, 120),
          text(body.salesFile, 120),
        )
        .first();
      return json({ ok: true, storage: true, run }, 200, { 'cache-control': 'no-store' });
    } catch (err) {
      if (noTable(err)) return json({ ok: true, storage: false }, 200);
      throw err;
    }
  } catch (err) {
    console.log('[admin/lead-runs] server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
