/**
 * Client-side calls to the /api/admin/* Pages Functions.
 *
 * Mirrors the thin-wrapper style of src/lib/contactSubmit.ts. The session lives
 * in an HttpOnly cookie the browser sends automatically, so these calls carry no
 * token in JS — auth state is whatever the server says.
 */

// One shared shape for the whole proposal, used by the builder, the PDF
// document, and the send call so they can't drift apart.
export type ProposalData = {
  customer: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
  pool: {
    gallons: string;
    length: string;
    width: string;
    avgDepth: string;
    shape: string;
    sanitization: string;
    pump: string;
    filter: string;
    heater: string;
    automation: string;
    equipmentNotes: string;
  };
  proposal: {
    scope: string;
    price: string;
    /** Optional à-la-carte services listed separately (not summed into price). */
    addOns: AddOn[];
    /** Append the condensed standard terms to the PDF. */
    includeTerms: boolean;
    /** Show the "what's included" all-inclusive highlight (recurring service). */
    includeBenefits: boolean;
  };
};

export type AddOn = { label: string; price: string };

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
    filter: '',
    heater: '',
    automation: '',
    equipmentNotes: '',
  },
  proposal: { scope: '', price: '', addOns: [], includeTerms: true, includeBenefits: true },
});

/** True when a valid admin session cookie is present. */
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
  /** Base64 PDF (no data: prefix needed; server strips one if present). */
  pdfBase64: string;
  filename: string;
};

/** POST the proposal + PDF to be emailed. Throws on failure (or AbortError if cancelled). */
export async function sendProposal(args: SendProposalArgs, signal?: AbortSignal): Promise<void> {
  const res = await fetch('/api/admin/send-proposal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      customer: args.customer,
      pool: args.pool,
      proposal: args.proposal,
      pdfBase64: args.pdfBase64,
      filename: args.filename,
    }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`send_proposal_failed (${res.status}): ${detail.slice(0, 200)}`);
  }
}
