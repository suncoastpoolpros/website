/**
 * What a website lead sets off beyond the email: a [LEAD] ticket in PoolLogic.
 * (It used to send an instant auto-reply text from the Quo line too; that was
 * removed in October 2026 — leads are answered by hand.)
 *
 * TICKETS ARE LIMITED, so a script posting a thousand fake leads can't fill
 * PoolLogic with a thousand tickets:
 *
 *  - Nothing here runs unless Turnstile verified the submission (contact.ts
 *    decides that; an unverified lead still reaches the inbox).
 *  - Every limit is a counter in D1, so it holds across every visitor and
 *    every Cloudflare location — not a per-browser or per-colo check.
 *  - FAIL CLOSED: if a counter can't be read or written, the ticket is
 *    skipped. The lead email still arrives.
 *
 * Counters live in the lookup_failures table (migration 0004) under a 'lead:'
 * prefix — no migration needed. _quotes.ts's sweep skips that prefix, because
 * its windows are minutes and these are days.
 */

/** US numbers only — anything else is left alone rather than guessed at. */
const toE164 = (raw: string | null | undefined): string | null => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
};

const DAY = 24 * 60 * 60 * 1000;

export const LEAD_LIMITS = {
  /** A double-submitted form makes one ticket, not two. */
  ticketPerContact: { max: 1, windowMs: DAY },
  ticketPerIp: { max: 5, windowMs: DAY },
  ticketPerDay: { max: 100, windowMs: DAY },
} as const;

type Limit = { max: number; windowMs: number };

type D1 = {
  prepare: (sql: string) => {
    bind: (...v: unknown[]) => {
      first: <T>() => Promise<T | null>;
      run: () => Promise<unknown>;
    };
  };
};

const isD1 = (db: unknown): db is D1 => !!db && typeof (db as D1).prepare === 'function';

/**
 * Count one use against `key` and say whether it was within the limit. One
 * statement, so two simultaneous submissions can't both read 0 and both pass.
 * Any failure answers false — see FAIL CLOSED above.
 */
export async function consume(
  db: unknown,
  key: string,
  limit: Limit,
  /** Only for limits whose failure must not lose a lead (the email). */
  failOpen = false,
): Promise<boolean> {
  if (!isD1(db)) return failOpen;
  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() - limit.windowMs).toISOString();
  try {
    const row = await db
      .prepare(
        `INSERT INTO lookup_failures (ip, count, window_start)
         VALUES (?, 1, ?)
         ON CONFLICT(ip) DO UPDATE SET
           count = CASE WHEN lookup_failures.window_start < ? THEN 1 ELSE lookup_failures.count + 1 END,
           window_start = CASE WHEN lookup_failures.window_start < ? THEN ? ELSE lookup_failures.window_start END
         RETURNING count`,
      )
      .bind(`lead:${key}`.slice(0, 200), now, cutoff, cutoff, now)
      .first<{ count?: number }>();
    const n = Number(row?.count);
    return Number.isFinite(n) && n <= limit.max;
  } catch (err) {
    console.log('[leads] limit_failed:', String(err).slice(0, 300));
    return failOpen;
  }
}

/** Clears lead counters past the longest window. Cheap; runs per lead. */
const sweep = async (db: unknown): Promise<void> => {
  if (!isD1(db)) return;
  await db
    .prepare("DELETE FROM lookup_failures WHERE ip LIKE 'lead:%' AND window_start < ?")
    .bind(new Date(Date.now() - 31 * DAY).toISOString())
    .run()
    .catch(() => {});
};

export type Lead = {
  name: string;
  email: string;
  phone: string;
  address: string;
  source: string;
  /** Human service name, e.g. "Weekly Cleaning". */
  service: string;
  /** Every field as "Label: value" lines, as the lead email shows them. */
  details: string;
};

export const handleLead = async (
  env: { DB?: unknown; POOLLOGIC_API_KEY?: string },
  lead: Lead,
  ip: string,
): Promise<void> => {
  const phone = toE164(lead.phone);
  const [first = '', ...rest] = lead.name.trim().split(/\s+/);
  // A signup is a customer whose quote is already signed — they get the
  // welcome text from accept.ts, not "thanks for reaching out".
  const isSignup = lead.source === 'signup-page';

  const ticket = async (): Promise<void> => {
    if (!env.POOLLOGIC_API_KEY) return;
    const who = (lead.email || phone || lead.name).toLowerCase();
    if (!(await consume(env.DB, `ticket:who:${who}`, LEAD_LIMITS.ticketPerContact))) return;
    if (!(await consume(env.DB, `ticket:ip:${ip}`, LEAD_LIMITS.ticketPerIp))) return;
    if (!(await consume(env.DB, `ticket:day`, LEAD_LIMITS.ticketPerDay))) return;
    try {
      const res = await fetch('https://app.poollogic.app/api/webhooks/incoming/lead', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.POOLLOGIC_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          first_name: first,
          last_name: rest.join(' '),
          email: lead.email,
          phone: lead.phone,
          street_address: lead.address,
          subject: isSignup ? 'New customer signup' : lead.service || 'Website request',
          description: lead.details,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) console.log('[leads] ticket_failed:', res.status, (await res.text()).slice(0, 300));
    } catch (err) {
      console.log('[leads] ticket_error:', String(err).slice(0, 300));
    }
  };

  await Promise.all([ticket(), sweep(env.DB)]);
};
