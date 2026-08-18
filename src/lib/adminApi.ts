/**
 * Client-side calls to the /api/admin/* Pages Functions.
 *
 * Mirrors the thin-wrapper style of src/lib/contactSubmit.ts. The session lives
 * in an HttpOnly cookie the browser sends automatically, so these calls carry no
 * token in JS — auth state is whatever the server says.
 */

// Customer + pool are shared by both admin documents (proposal and inspection
// report) so the two builders describe a pool the same way. Each document then
// adds its own section on top.
export type CustomerInfo = {
  name: string;
  address: string;
  email: string;
  phone: string;
};

export type PoolInfo = {
  gallons: string;
  length: string;
  width: string;
  avgDepth: string;
  shape: string;
  sanitization: string;
  pump: string;
  /** Cartridge | DE | Sand | Other — drives the included filter-service wording. */
  filterType: string;
  /**
   * Whether the filter service is bundled into the rate: '' | 'yes' | 'no'.
   *
   * NOT a boolean. A boolean has no "not answered yet" state, so the control
   * always displayed an answer nobody had given — and this field decides
   * whether the quote promises a filter replacement, which is the last thing
   * that should default silently.
   */
  filterServiceIncluded: string;
  /** Free text make & model, e.g. "Pentair Clean & Clear 320". */
  filter: string;
  heater: string;
  automation: string;
  equipmentNotes: string;
};

// One shared shape for the whole proposal, used by the builder, the PDF
// document, and the send call so they can't drift apart.
export type ProposalData = {
  customer: CustomerInfo;
  pool: PoolInfo;
  proposal: {
    scope: string;
    price: string;
    /** Optional à-la-carte services listed separately (not summed into price). */
    addOns: AddOn[];
    /** Show the "what's included" all-inclusive highlight (recurring service). */
    includeBenefits: boolean;
    /**
     * A personal note that appears in the EMAIL ONLY, never in the PDF. The PDF
     * is the formal document and gets filed or forwarded; this is the covering
     * message — "great meeting you Tuesday", "here's the pricing we discussed".
     */
    emailNote: string;
    /**
     * 'single' = one headline price (the original behaviour, still the default).
     * 'tiers'  = a two-option comparison; `price` is then ignored in favour of
     * each tier's own price.
     */
    pricingMode: PricingMode;
    /**
     * Ordered cheapest → dearest. The second tier renders as "Everything in
     * <first>, plus:" — the upgrade must never claw back anything from the base
     * plan, or it undercuts the flat-rate "everything included" promise.
     */
    tiers: Tier[];
    /**
     * PRESET_VERSION the stored `tiers` were generated from. 0 means they
     * predate versioning. Lets the builder spot a draft built before a preset
     * revision and offer a reset, without nagging about deliberate edits.
     */
    presetVersion: number;
  };
};

export type AddOn = { label: string; price: string };

export type PricingMode = 'single' | 'tiers';

export type Tier = {
  name: string;
  /** Free text like "150" or "$150/mo" — formatPrice adds the $ when bare. */
  price: string;
  /** One line under the name, e.g. "Everything your pool needs, every week." */
  tagline: string;
  /**
   * The small line under the price. Set explicitly when the headline figure
   * needs context the prices can't express — e.g. an annual plan shown at its
   * effective MONTHLY rate needs "$1,958 billed once". Left blank, the card
   * falls back to the computed "+$12/mo more than X" delta.
   */
  priceNote: string;
  includes: string[];
  /** Draws the ribbon + brand border. Exactly one tier should have it. */
  recommended: boolean;
  /** The persuasion line: break-even maths in the customer's own numbers. */
  valueNote: string;
  /** Eligibility limits, set small under the card. */
  finePrint: string;
};

/** Leading number in a price string ("$169/mo" → 169). null when not numeric. */
export const parsePrice = (raw: string): number | null => {
  const m = /-?\d[\d,]*(\.\d+)?/.exec(raw.replace(/\s/g, ''));
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

/** The billing period a price is quoted in, or '' when it doesn't say. */
export const pricePeriod = (raw: string): string => {
  if (/\/\s*(mo|month)/i.test(raw)) return '/mo';
  if (/\/\s*(yr|year|annually)/i.test(raw)) return '/yr';
  return '';
};

/**
 * The upgrade cost as a headline ("+$12/mo"). Selling the DELTA rather than the
 * total is the single biggest lever on take-rate — "+$12" reads as trivial where
 * "$162" reads as a price rise.
 *
 * Returns '' when the callout would mislead:
 * - either price isn't a number ("Call for pricing")
 * - the upgrade isn't dearer
 * - the two prices are quoted in DIFFERENT PERIODS. Subtracting $165/mo from
 *   $1,980/yr yields "+$1,815", which is not a real number in any sense — this
 *   is exactly the case when the second option is an annual prepay rather than a
 *   bigger monthly plan.
 */
export const tierDelta = (base: Tier | undefined, upgrade: Tier | undefined): string => {
  if (!base || !upgrade) return '';
  const period = pricePeriod(upgrade.price);
  if (period !== pricePeriod(base.price)) return '';
  const a = parsePrice(base.price);
  const b = parsePrice(upgrade.price);
  if (a === null || b === null || b <= a) return '';
  const diff = b - a;
  const amount = Number.isInteger(diff) ? String(diff) : diff.toFixed(2);
  return `+$${amount}${period}`;
};

// ----- First service & inspection report ---------------------------------

/** How urgent a found problem is. Drives the colour of the chip on the report. */
export type IssueSeverity = 'urgent' | 'soon' | 'monitor';
/** How strongly we're suggesting an upgrade/add-on. No pricing — advice only. */
export type RecPriority = 'now' | 'soon' | 'optional';

export type Issue = { label: string; severity: IssueSeverity; note: string };
export type Recommendation = { label: string; priority: RecPriority; note: string };

/** Water-chemistry panel taken on the first visit. All free-text so "N/A" works. */
export type Chemistry = {
  freeChlorine: string;
  totalChlorine: string;
  ph: string;
  alkalinity: string;
  cya: string;
  calciumHardness: string;
  salt: string;
  waterTemp: string;
  filterPressure: string;
  waterLevel: string;
};

export type SurfaceCondition = {
  material: string;
  /** Excellent | Good | Fair | Worn */
  condition: string;
  /** Checked observations — stains, etching, chipping, etc. */
  observations: string[];
  notes: string;
};

export type InspectionData = {
  customer: CustomerInfo;
  pool: PoolInfo;
  visit: {
    /** ISO yyyy-mm-dd. Rendered as a friendly date on the report. */
    date: string;
    technician: string;
    /** Plain-English overview of the pool and how the first visit went. */
    summary: string;
    /** What was actually done on the first service (multiline / bulleted). */
    workPerformed: string;
    /** Overall condition call: Excellent | Good | Fair | Needs work */
    overall: string;
  };
  chemistry: Chemistry;
  surface: SurfaceCondition;
  findings: {
    issues: Issue[];
    recommendations: Recommendation[];
  };
};

// Prefix a bare number with "$" (425 → $425, 185/mo → $185/mo) while leaving
// values that already start with a symbol/word untouched ($425, "Call for price").
// Mirrors formatPrice in functions/api/admin/send-proposal.ts.
export const formatPrice = (raw: string): string => {
  const s = raw.trim();
  if (!s) return '';
  return /^[0-9]/.test(s) ? `$${s}` : s;
};

export const emptyProposal = (): ProposalData => ({
  customer: { name: '', address: '', email: '', phone: '' },
  pool: {
    gallons: '',
    length: '',
    width: '',
    avgDepth: '',
    shape: '',
    sanitization: '',
    pump: '',
    filterType: '',
    filterServiceIncluded: '',
    filter: '',
    heater: '',
    automation: '',
    equipmentNotes: '',
  },
  proposal: {
    scope: '',
    price: '',
    addOns: [],
    includeBenefits: true,
    emailNote: '',
    // Single-price stays the default, so nothing about an ordinary proposal
    // changes until the admin explicitly switches to tiers.
    pricingMode: 'single',
    tiers: [],
    presetVersion: 0,
  },
});

/** Local yyyy-mm-dd (NOT toISOString, which shifts to UTC and can go back a day). */
export const todayIso = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const emptyInspection = (): InspectionData => ({
  customer: { name: '', address: '', email: '', phone: '' },
  pool: {
    gallons: '',
    length: '',
    width: '',
    avgDepth: '',
    shape: '',
    sanitization: '',
    pump: '',
    filterType: '',
    filterServiceIncluded: '',
    filter: '',
    heater: '',
    automation: '',
    equipmentNotes: '',
  },
  visit: { date: todayIso(), technician: '', summary: '', workPerformed: '', overall: '' },
  chemistry: {
    freeChlorine: '',
    totalChlorine: '',
    ph: '',
    alkalinity: '',
    cya: '',
    calciumHardness: '',
    salt: '',
    waterTemp: '',
    filterPressure: '',
    waterLevel: '',
  },
  surface: { material: '', condition: '', observations: [], notes: '' },
  findings: { issues: [], recommendations: [] },
});

/** True when a valid admin session cookie is present. */
/**
 * Reserve the next proposal number, immediately before rendering the PDF.
 *
 * Never throws and never blocks a send: any failure resolves to null and the
 * proposal goes out unnumbered, exactly as it did before numbering existed.
 */
export async function reserveProposalNumber(signal?: AbortSignal): Promise<number | null> {
  try {
    const res = await fetch('/api/admin/proposal-number', { method: 'POST', signal });
    const data = (await res.json().catch(() => ({}))) as { number?: number | null };
    const n = Number(data?.number);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export async function checkSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/session', { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export type LoginResult = { ok: boolean; error?: string };

/** Exchange the PIN for a session cookie. `token` is the (optional) Turnstile token. */
export async function login(pin: string, token?: string): Promise<LoginResult> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, turnstileToken: token ?? '' }),
    });
    if (res.ok) return { ok: true };
    let error = `http_${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) error = data.error;
    } catch {
      /* ignore */
    }
    return { ok: false, error };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/admin/session', { method: 'DELETE' });
  } catch {
    /* ignore */
  }
}

export type SendProposalArgs = ProposalData & {
  /** The number reserved before the PDF was rendered, and printed on it. */
  proposalNumber?: number | null;
  /** Base64 PDF (no data: prefix needed; server strips one if present). */
  pdfBase64: string;
  filename: string;
};

/** POST the proposal + PDF to be emailed. Throws on failure (or AbortError if cancelled). */
export async function sendProposal(args: SendProposalArgs, signal?: AbortSignal): Promise<void> {
  await postDocument(
    '/api/admin/send-proposal',
    {
      customer: args.customer,
      pool: args.pool,
      proposal: args.proposal,
      proposalNumber: args.proposalNumber ?? null,
      pdfBase64: args.pdfBase64,
      filename: args.filename,
    },
    'send_proposal_failed',
    signal,
  );
}

export type SendInspectionArgs = InspectionData & {
  /** Base64 PDF (no data: prefix needed; server strips one if present). */
  pdfBase64: string;
  filename: string;
};

/** POST the first-service report + PDF to be emailed. Throws on failure. */
export async function sendInspection(args: SendInspectionArgs, signal?: AbortSignal): Promise<void> {
  await postDocument(
    '/api/admin/send-inspection',
    {
      customer: args.customer,
      pool: args.pool,
      visit: args.visit,
      chemistry: args.chemistry,
      surface: args.surface,
      findings: args.findings,
      pdfBase64: args.pdfBase64,
      filename: args.filename,
    },
    'send_inspection_failed',
    signal,
  );
}

async function postDocument(
  url: string,
  body: unknown,
  errorTag: string,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`${errorTag} (${res.status}): ${detail.slice(0, 200)}`);
  }
}
