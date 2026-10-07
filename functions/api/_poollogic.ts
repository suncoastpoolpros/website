/**
 * PoolLogic — the route and billing app. A signed quote becomes a billed
 * customer there through its onboarding webhook (routes/hono/webhooks.ts and
 * _onboardingPayload.ts in the poollogic-web-app repo): name, phones, address,
 * email, monthly rate, billing cycle and start date, created unassigned to a
 * route.
 *
 * Unlike Quo, the result matters to the office — a failure here is a customer
 * who will never be invoiced — so it is returned as a sentence for the owner's
 * ACCEPTED email rather than only logged. It still never fails the acceptance.
 */

const ENDPOINT = 'https://app.poollogic.app/api/webhooks/incoming/onboarding';

export type PoolLogicCustomer = {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  sanitization?: string;
  /** Dollars per month, as PoolLogic bills it: each invoice is this × months covered. */
  monthlyRate: number | null;
  cycle: 'Monthly' | 'Yearly';
  /** YYYY-MM-DD from the signing page; PoolLogic falls back to the 1st of next month. */
  startDate?: string;
  second?: { name: string; phone: string; relationship: string };
  notes: string;
};

/**
 * "4424 19th St N, St. Petersburg, FL 33713" → its parts. PoolLogic geocodes
 * the address, so the split matters; anything that doesn't read cleanly goes
 * over whole as the street rather than being cut in the wrong place.
 */
export const splitAddress = (
  raw: string,
): { street_address: string; city?: string; state?: string; zip_code?: string } => {
  const s = raw.trim().replace(/\s+/g, ' ');
  const m = /^(.+?),\s*([^,]+?),?\s+([A-Za-z]{2})\.?(?:\s+(\d{5})(?:-\d{4})?)?\s*$/.exec(s);
  if (!m) return { street_address: s };
  return {
    street_address: m[1].trim(),
    city: m[2].trim(),
    state: m[3].toUpperCase(),
    ...(m[4] ? { zip_code: m[4] } : {}),
  };
};

export const onboardInPoolLogic = async (apiKey: string, c: PoolLogicCustomer): Promise<string> => {
  if (!c.address?.trim()) return 'PoolLogic: NOT created — the quote has no service address. Add them by hand.';
  if (c.monthlyRate === null) return 'PoolLogic: NOT created — couldn\'t read a monthly rate off the plan. Add them by hand.';

  const pool = /salt/i.test(c.sanitization ?? '') ? 'Saltwater' : /chlorine/i.test(c.sanitization ?? '') ? 'Chlorine' : '';
  // first_name + last_name, as the webhook documents it. A one-word signature
  // can't be split, so it goes as `name`, which the webhook also accepts.
  const [first, ...rest] = c.name.trim().split(/\s+/);
  const body = {
    ...(rest.length ? { first_name: first, last_name: rest.join(' ') } : { name: first }),
    email: c.email,
    ...(c.phone ? { phone: c.phone } : {}),
    ...splitAddress(c.address),
    monthly_rate: c.monthlyRate,
    billing_cycle: c.cycle,
    ...(c.startDate ? { billing_start_date: c.startDate } : {}),
    ...(pool ? { pool_type: pool } : {}),
    ...(c.second?.name ? { secondary_contact_name: c.second.name } : {}),
    ...(c.second?.phone ? { secondary_contact_phone: c.second.phone } : {}),
    notes: c.notes,
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; warnings?: string[] };
    if (res.ok) {
      const warnings = (data.warnings ?? []).filter(Boolean);
      return `PoolLogic: customer created${warnings.length ? ` (note: ${warnings.join('; ')})` : ''}. Assign them a route and day.`;
    }
    // 409 is PoolLogic refusing a second customer with the same email — the
    // safe outcome, but the office should know which record is the real one.
    console.log('[poollogic] onboarding_failed:', res.status, String(data.error ?? '').slice(0, 300));
    return `PoolLogic: NOT created (${res.status}${data.error ? `: ${data.error}` : ''}). Add or update them by hand.`;
  } catch (err) {
    console.log('[poollogic] onboarding_error:', String(err).slice(0, 300));
    return 'PoolLogic: NOT created — PoolLogic didn\'t answer. Add them by hand.';
  }
};
