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
    /** Show the trust block at all. WHICH block is decided by jobKind. */
    includeBenefits: boolean;
    /**
     * What kind of job this is quoting — and therefore which trust block the
     * document carries.
     *
     * Absent on drafts and stored quotes written before this existed, so every
     * reader coerces it (see jobKindOf). Defaulting to 'recurring' is the
     * correct back-compat: that is the document every one of those older quotes
     * was actually built as.
     */
    jobKind?: string;
    /**
     * How often we come, on a recurring quote — 'weekly' | 'biweekly'.
     *
     * Prints under the rate on the plan cards and the PDF, because a monthly
     * price with no cadence is a number with nothing to divide it by. Absent
     * on one-time quotes and on everything stored before this existed; unlike
     * jobKind it is NOT defaulted for old quotes — cadenceOf returns null and
     * the documents print nothing, because "probably weekly" is not a promise
     * we put under a bi-weekly customer's price. See serviceCadence.ts.
     */
    cadence?: string;
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
  /**
   * How many LEADING items of `includes` are the service both plans share.
   * Anything after them is this plan's own extras.
   *
   * Shared-first so the identical rows line up across the two cards side by
   * side — the comparison a two-column price table exists to make. The extras
   * then hang off the bottom of the longer card, which is also where a reader
   * scanning for the difference expects to find it.
   */
  sharedCount?: number;
  /**
   * The same split when it briefly shipped the other way round — extras FIRST.
   * Read, never written. Quotes saved in that window still render correctly.
   */
  extrasCount?: number;
  /** The badge beside the rate, e.g. "Save $165". */
  priceNote: string;
  /** The quiet disclosure under the button, e.g. "$1,815 billed once — 11
   *  months paid, your 12th free." Absent on quotes stored before the note was
   *  split in two; those keep the single combined string in priceNote. */
  billingNote?: string;
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

/**
 * Split a tier's bullet list into the service both plans share and this plan's
 * own extras.
 *
 * ONE FUNCTION, THREE RENDERERS — the approve page, the PDF and the builder
 * preview. They present the split differently on purpose (the page lists
 * everything, print keeps "Everything in <base>, plus:"), but they must not
 * disagree about WHERE it falls.
 *
 * Three stored shapes, because this changed twice in a day:
 *
 *   sharedCount   current. Shared items lead, extras follow.
 *   extrasCount   shipped for about an hour with extras leading instead.
 *   neither       everything before both, when the upgrade card stored ONLY
 *                 its extras and leaned on "Everything in Pay Monthly, plus:"
 *                 to imply the rest. Those get the base plan's list prepended
 *                 so the card no longer understates what is being bought — see
 *                 ApprovePage for why this is composed and not backfilled.
 */
export const splitTierIncludes = (
  tier: Pick<Tier, 'includes' | 'sharedCount' | 'extrasCount'>,
  /** The cheaper plan's list, used only to rebuild the legacy shape. */
  baseIncludes: string[] = [],
): { shared: string[]; extras: string[] } => {
  const own = (tier.includes ?? []).map((x) => x.trim()).filter(Boolean);
  if (tier.sharedCount != null) {
    const n = Math.min(Math.max(tier.sharedCount, 0), own.length);
    return { shared: own.slice(0, n), extras: own.slice(n) };
  }
  if (tier.extrasCount != null) {
    const n = Math.min(Math.max(tier.extrasCount, 0), own.length);
    return { shared: own.slice(n), extras: own.slice(0, n) };
  }
  const base = baseIncludes.map((x) => x.trim()).filter(Boolean);
  if (base.length) {
    // A hand-edited old tier may already repeat one of the base lines.
    return { shared: base.filter((x) => !own.includes(x)), extras: own };
  }
  return { shared: own, extras: [] };
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
    jobKind: 'recurring',
    // Weekly on a FRESH draft is a statement, not a guess: it is what the
    // business sells by default, the chips sit at the top of the form to
    // change it, and the Bi-Weekly scope template moves it too. The
    // no-default rule above is about quotes that predate the field.
    cadence: 'weekly',
    emailNote: '',
    // Single-price stays the default, so nothing about an ordinary proposal
    // changes until the admin explicitly switches to tiers.
    pricingMode: 'single',
    tiers: [],
    presetVersion: 0,
  },
});

// ---------------------------------------------------------------------------
// Commercial proposal
//
// A separate shape from ProposalData rather than a mode on it. The two
// documents share only the idea of "somebody is being quoted": a commercial bid
// has many bodies of water instead of one pool, a statutory classification, a
// price per frequency rather than per plan, and a page of contract terms a
// homeowner never sees. Folding it in would have put an `if commercial` branch
// through every field of a builder that is already long.
// ---------------------------------------------------------------------------

/**
 * One body of water. A property is quoted as a list of these, because that is
 * how the work actually scales and how a board adds or drops the spa from
 * scope without renegotiating the whole bid.
 */
export type WaterBody = {
  /** Stable list key. Never printed. */
  id: string;
  /** "Main pool", "Spa", "Kiddie pool", "Fountain". */
  label: string;
  /** pool | spa | wading | feature — drives nothing but the printed line. */
  kind: string;
  gallons: string;
  /** DOH permit number, where the property holds one. */
  permitNumber: string;
  filterType: string;
  /** Free text make and model. */
  filter: string;
  /** "Two peristaltic feeders, chlorine and acid" — the pad, in one line. */
  feeders: string;
  /** Permitted flow in GPM. Flow outside ~10% of this is a closure condition. */
  permittedGpm: string;
  notes: string;
  /** Monthly rate at each frequency. Blank means "not offered for this body". */
  price2x: string;
  price3x: string;
  price5x: string;
  /** The daily-service comparison, printed beside the audited-log option. */
  price7x: string;
};

export type CommercialProperty = {
  /** The entity being quoted and, later, contracting — not a person. */
  name: string;
  address: string;
  /** Managing agent, where there is one. Often who actually reads this. */
  managementCompany: string;
  /** The human. Kept separate from the entity so the email can greet them. */
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  /** Key from commercialClassification.ts. Decides the compliance section. */
  classification: string;
  unitCount: string;
};

export type CommercialData = {
  property: CommercialProperty;
  bodies: WaterBody[];
  bid: {
    /** Which log model this property is being sold. Both are printed; this is
     *  the one recommended, and the one the total reflects. */
    logModel: string;
    /** Extra scope specific to this property, above the standard scope. */
    scopeNotes: string;
    /** Seeded from COMMERCIAL_EXCLUSIONS, then edited per property. */
    exclusions: string[];
    repairThreshold: string;
    afterHoursMultiplier: string;
    termMonths: string;
    noticeDays: string;
    escalatorPct: string;
    chemicalBandPct: string;
    paymentTerms: string;
    bidValidDays: string;
    /** Email only, never on the PDF — same rule as the residential proposal. */
    emailNote: string;
  };
};

/** Ids only need to be unique within one draft, never across drafts. */
let bodySeq = 0;
export const newWaterBody = (label = ''): WaterBody => ({
  id: `wb${++bodySeq}`,
  label,
  kind: 'pool',
  gallons: '',
  permitNumber: '',
  filterType: '',
  filter: '',
  feeders: '',
  permittedGpm: '',
  notes: '',
  price2x: '',
  price3x: '',
  price5x: '',
  price7x: '',
});

export const emptyCommercial = (): CommercialData => ({
  property: {
    name: '',
    address: '',
    managementCompany: '',
    contactName: '',
    contactTitle: '',
    email: '',
    phone: '',
    classification: '',
    unitCount: '',
  },
  // Every property has at least one, so the builder opens on a row to fill in
  // rather than on an empty state with a button.
  bodies: [newWaterBody('Main pool')],
  bid: {
    logModel: 'audited',
    scopeNotes: '',
    exclusions: [],
    repairThreshold: '',
    afterHoursMultiplier: '',
    termMonths: '',
    noticeDays: '',
    escalatorPct: '',
    chemicalBandPct: '',
    paymentTerms: '',
    bidValidDays: '',
    emailNote: '',
  },
});

/**
 * The facts about US that are identical on every commercial bid.
 *
 * Kept OUT of the draft on purpose. A draft is wiped between customers, and
 * nobody should be retyping their insurance limits per proposal — so this has
 * its own store and its own lifetime, and "Clear" never touches it.
 *
 * Every field is omitted from the document while blank, so an unfilled value
 * can never reach a board as an empty label or, worse, a limit we do not carry.
 * A management company's insurance reviewer checks these against the
 * certificate, and a mismatch loses the bid on the spot.
 */
export type BusinessProfile = {
  /** General liability per occurrence, e.g. '1,000,000'. */
  glPerOccurrence: string;
  glAggregate: string;
  /** '' unanswered | 'carried' | 'exempt' — never implied. */
  workersComp: string;
  /** Florida licence number, if a licensed contractor. */
  licenseNumber: string;
  /** Public Pool Service Technician certification, per 64E-9.018. */
  certificationNumber: string;
};

/** Wrapped in a section so it can share the nested-section draft hook. */
export type BusinessProfileDoc = { business: BusinessProfile };

export const emptyBusinessProfile = (): BusinessProfileDoc => ({
  business: {
    glPerOccurrence: '',
    glAggregate: '',
    workersComp: '',
    licenseNumber: '',
    certificationNumber: '',
  },
});

/**
 * Record a commercial bid.
 *
 * Called on download, because that is when the bid becomes something a property
 * actually holds. Pass the token from a previous save to edit that row instead
 * of leaving a second near-identical one behind.
 *
 * NEVER THROWS. A storage failure must not cost the operator their PDF — the
 * bid is still deliverable, it just is not on the list — so this resolves to
 * null and the caller carries on. That is the same call send-proposal makes,
 * and for the same reason.
 */
export async function saveCommercialBid(
  args: CommercialData & { token?: string | null; proposalNumber?: number | null },
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const res = await fetch('/api/admin/save-commercial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        token: args.token ?? null,
        property: args.property,
        bodies: args.bodies,
        bid: { ...args.bid, property: args.property },
        proposalNumber: args.proposalNumber ?? null,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; token?: string };
    return res.ok && data.ok && data.token ? data.token : null;
  } catch {
    return null;
  }
}

/** Sum of one frequency column across every body priced for it. */
export const commercialTotal = (bodies: WaterBody[], field: keyof WaterBody): number =>
  bodies.reduce((sum, b) => {
    const n = Number(String(b[field]).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? sum + n : sum;
  }, 0);

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
/**
 * Save a quote and get its approve link back, WITHOUT emailing anything.
 *
 * For a lead who texted rather than emailed. Throws on failure, because unlike
 * sending there's no email going out to fall back on — the link is the whole
 * deliverable, so a silent failure would leave you with nothing to paste.
 */
export async function saveQuoteOnly(
  args: ProposalData & { proposalNumber?: number | null; photos?: string[] },
  signal?: AbortSignal,
): Promise<{ token: string; url: string }> {
  const res = await fetch('/api/admin/save-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      customer: args.customer,
      pool: args.pool,
      proposal: args.proposal,
      proposalNumber: args.proposalNumber ?? null,
      photos: args.photos ?? [],
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    token?: string;
    url?: string;
    error?: string;
  };
  if (!res.ok || !data.ok || !data.url || !data.token) {
    throw new Error(data.error || 'save_quote_failed');
  }
  return { token: data.token, url: data.url };
}

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

/**
 * The two lines of the email that aren't a form field anywhere else: the
 * greeting (computed from the customer's name) and the subject (from the
 * proposal number). Set by the review step, and only for the ones the operator
 * actually edited — an absent or blank value means "use the computed default".
 */
export type EmailOverrides = { subject?: string; greeting?: string };

export type SendProposalArgs = ProposalData & {
  /** The number reserved before the PDF was rendered, and printed on it. */
  proposalNumber?: number | null;
  /** Base64 PDF (no data: prefix needed; server strips one if present). */
  pdfBase64: string;
  filename: string;
  /** Downscaled data URLs. Stored so a later re-download matches this PDF. */
  photos?: string[];
  overrides?: EmailOverrides;
};

/** What the review step shows: the email exactly as the sender would compose it. */
export type ProposalPreview = {
  subject: string;
  html: string;
  text: string;
  /** What the composer WOULD greet with, so the field can offer it back. */
  defaultGreeting: string;
};

/**
 * Render the covering email without sending it.
 *
 * Deliberately does NOT send the PDF or the photos: neither appears in the
 * email body, and uploading megabytes to proof a few hundred words would make
 * the review step slower than the send it precedes.
 */
export async function previewProposal(
  args: ProposalData & { proposalNumber?: number | null; overrides?: EmailOverrides },
  signal?: AbortSignal,
): Promise<ProposalPreview> {
  const res = await postDocument<Partial<ProposalPreview>>(
    '/api/admin/preview-proposal',
    {
      customer: args.customer,
      pool: args.pool,
      proposal: args.proposal,
      proposalNumber: args.proposalNumber ?? null,
      overrides: args.overrides ?? {},
    },
    'preview_proposal_failed',
    signal,
  );
  if (!res.html || !res.subject) throw new Error('preview_proposal_failed');
  return {
    subject: res.subject,
    html: res.html,
    text: res.text ?? '',
    defaultGreeting: res.defaultGreeting ?? '',
  };
}

/** POST the proposal + PDF to be emailed. Throws on failure (or AbortError if cancelled). */
/** Result of a send. `stored: false` means it was EMAILED BUT NOT SAVED — the
 *  customer got the PDF, but with no accept link and no row in Sent Quotes. */
export type SendProposalResult = { stored: boolean; url: string | null };

export async function sendProposal(
  args: SendProposalArgs,
  signal?: AbortSignal,
): Promise<SendProposalResult> {
  const res = await postDocument<{ stored?: boolean; url?: string | null }>(
    '/api/admin/send-proposal',
    {
      customer: args.customer,
      pool: args.pool,
      proposal: args.proposal,
      proposalNumber: args.proposalNumber ?? null,
      photos: args.photos ?? [],
      pdfBase64: args.pdfBase64,
      filename: args.filename,
      overrides: args.overrides ?? {},
    },
    'send_proposal_failed',
    signal,
  );
  // Defaults to "stored" only when the field is absent entirely, which means an
  // older worker — never when it is explicitly false.
  return { stored: res.stored !== false, url: res.url ?? null };
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

async function postDocument<T = Record<string, unknown>>(
  url: string,
  body: unknown,
  errorTag: string,
  signal?: AbortSignal,
): Promise<T> {
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
  // The body carries what the send could NOT do — see `stored` on
  // /api/admin/send-proposal. Discarding it hid a silent failure.
  return (await res.json().catch(() => ({}))) as T;
}
