/**
 * POST /api/quote/accept — a customer accepts one of the quoted plans.
 *
 * Records WHICH plan, when, and from where, then emails the business the
 * handoff and the customer their confirmation. That record is the point: today
 * acceptance is an email saying "APPROVED", which doesn't say which plan and
 * carries no timestamp beyond the mail header.
 *
 * Live customers live in the technicians' service app — this endpoint's job
 * ends at notifying that a plan was accepted.
 */
import {
  TERMS_VERSION,
  acceptQuote,
  getQuote,
  isPricingStale,
  isThrottled,
  recordLookupFailure,
} from '../_quotes';
import { sendViaResend } from '../admin/_shared';

type Ctx = {
  request: Request;
  env: {
    DB?: unknown;
    RESEND_API_KEY?: string;
    PROPOSAL_FROM_EMAIL?: string;
    PROPOSAL_REPLY_TO?: string;
    CONTACT_TO_EMAIL?: string;
  };
  /** Pages keeps the worker alive for this after the response is sent. */
  waitUntil?: (p: Promise<unknown>) => void;
};

const BIZ = {
  name: 'Suncoast Pool Pros',
  phoneDisplay: '(727) 295-3621',
  websiteDisplay: 'suncoastpoolpros.com',
};

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));

export const onRequestPost = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx;
  type Onboarding = {
    billingSameAsService?: boolean;
    billingName?: string;
    billingEmail?: string;
    billingAddress?: string;
    billingCity?: string;
    billingState?: string;
    billingZip?: string;
    preferredStart?: string;
    accessNotes?: string;
    /** Typed full name — the signature. */
    signature?: string;
    /** Supplied at signing when the quote was texted and carries no address. */
    customerEmail?: string;
    agreeRequirements?: boolean;
    agreeService?: boolean;
    agreePrivacy?: boolean;
  };
  let body: { token?: string; plan?: string; onboarding?: Onboarding };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  const token = String(body.token ?? '').trim();
  const plan = String(body.plan ?? '').trim();
  if (!token || !plan) return json({ ok: false, error: 'bad_request' }, 400);

  // All three consents are required. The service agreement treats submission of
  // the onboarding form as legally binding acceptance, so a record without them
  // would claim agreement that was never given.
  const ob = body.onboarding ?? {};
  if (!(ob.agreeRequirements === true && ob.agreeService === true && ob.agreePrivacy === true)) {
    return json({ ok: false, error: 'consent_required' }, 400);
  }
  // A typed name is the signature. Required, and validated server-side too —
  // client-side validation is a convenience, not evidence.
  const signature = String(ob.signature ?? '').trim();
  if (signature.length < 2) return json({ ok: false, error: 'signature_required' }, 400);

  /**
   * Throttled for the SAME reason as GET /api/quote/:token, and this is the
   * more important of the two: it tells an attacker just as clearly whether a
   * token exists (404 vs 410 vs 200), so leaving it open would have made the
   * limit on the GET decorative — you would simply guess here instead.
   *
   * Checked after the body validation above so a malformed request costs an
   * attacker a round trip without buying them a lookup, and counted only when
   * the TOKEN misses. A real customer with a valid link never touches it.
   */
  // Also recorded as acceptance evidence further down — read once, used twice.
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  if (await isThrottled(env.DB, ip)) return json({ ok: false, error: 'not_found' }, 429);

  const row = await getQuote(env.DB, token);
  if (!row) {
    ctx.waitUntil?.(recordLookupFailure(env.DB, ip));
    return json({ ok: false, error: 'not_found' }, 404);
  }
  // Reading a stale proposal is fine; ACCEPTING one is not. This is the point
  // the price would otherwise be locked in at a figure that may no longer hold.
  if (isPricingStale(row)) return json({ ok: false, error: 'expired' }, 410);
  // Already accepted: report the ORIGINAL decision rather than recording a new
  // one. The first acceptance is the agreement; a later click is just a click.
  if (row.accepted_at) {
    return json({ ok: true, alreadyAccepted: true, plan: row.accepted_plan, at: row.accepted_at }, 200);
  }

  // The plan must be one this quote actually offered — otherwise a crafted
  // request could record acceptance of a plan or price never sent.
  let proposal: { tiers?: Array<{ name?: string; price?: string }>; price?: string } = {};
  try {
    proposal = JSON.parse(row.proposal_json);
  } catch {
    return json({ ok: false, error: 'unreadable' }, 500);
  }
  const offered = (proposal.tiers ?? []).map((t) => String(t?.name ?? '').trim()).filter(Boolean);
  const match = offered.find((n) => n.toLowerCase() === plan.toLowerCase());
  const acceptedPlan = offered.length ? match : plan || 'Proposal';
  if (offered.length && !match) return json({ ok: false, error: 'unknown_plan' }, 400);

  /**
   * An address given at signing, for a texted quote that has none on record.
   *
   * Validated but NOT required: the page asks for it, and that's the right
   * place to insist. Rejecting a signed acceptance here because a contact field
   * was malformed would throw away the one thing that matters — they agreed —
   * over something that can be chased by phone.
   */
  const suppliedEmail = String(ob.customerEmail ?? '').trim().slice(0, 160);
  const usableEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(suppliedEmail) ? suppliedEmail : '';

  const ua = request.headers.get('User-Agent') ?? '';
  const clean = (v: unknown, max = 200): string => String(v ?? '').trim().slice(0, max);
  // NULL means the customer was never asked — the approve page stopped
  // collecting billing, since it's gathered when invoicing is set up. Defaulting
  // to true would record "billing is the service address" as though they had
  // confirmed it, which is a claim about a fact nobody established.
  const billingAsked = ob.billingSameAsService !== undefined;
  const onboarding = {
    billingSameAsService: billingAsked ? ob.billingSameAsService !== false : null,
    billingName: clean(ob.billingName, 120),
    billingEmail: clean(ob.billingEmail, 160),
    billingAddress: clean(ob.billingAddress),
    billingCity: clean(ob.billingCity, 80),
    billingState: clean(ob.billingState, 40),
    billingZip: clean(ob.billingZip, 20),
    preferredStart: clean(ob.preferredStart, 40),
    accessNotes: clean(ob.accessNotes, 1000),
    // The signature and the moment it was given. accepted_at / accepted_ip on
    // the row carry the same facts; duplicated here so the onboarding payload
    // is self-contained if it's ever exported on its own.
    signature: clean(signature, 120),
    signedAt: new Date().toISOString(),
    signedIp: clean(request.headers.get('CF-Connecting-IP') ?? '', 60),
    // Stored as given: consent is evidence, not a preference to normalise.
    agreeRequirements: true,
    agreeService: true,
    agreePrivacy: true,
    termsVersion: TERMS_VERSION,
  };

  const recorded = await acceptQuote(
    env.DB,
    token,
    acceptedPlan ?? plan,
    ip,
    ua,
    onboarding,
    usableEmail,
    // Fills the name when the quote was saved without one — see acceptQuote.
    signature,
  );
  if (!recorded) return json({ ok: false, error: 'accept_failed' }, 500);

  const price =
    (proposal.tiers ?? []).find((t) => String(t?.name ?? '').trim() === acceptedPlan)?.price ??
    proposal.price ??
    '';
  const when = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  // Notify, but never fail the acceptance because an email bounced — the
  // decision is already recorded, and telling the customer it failed would
  // invite a second click that changes nothing.
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.PROPOSAL_FROM_EMAIL || 'service@suncoastpoolpros.com';
  const from = fromEmail.includes('<') ? fromEmail : `${BIZ.name} <${fromEmail}>`;
  const replyTo = env.PROPOSAL_REPLY_TO || 'service@suncoastpoolpros.com';
  const owner = env.CONTACT_TO_EMAIL;

  if (apiKey) {
    const billing = !billingAsked
      ? ''
      : onboarding.billingSameAsService
      ? 'Same as service address'
      : [
          onboarding.billingName,
          onboarding.billingAddress,
          [onboarding.billingCity, onboarding.billingState, onboarding.billingZip]
            .filter(Boolean)
            .join(', '),
          onboarding.billingEmail,
        ]
          .filter(Boolean)
          .join(' · ') || 'Not provided';

    const detail = [
      `Customer: ${row.customer_name}`,
      row.customer_email.trim()
        ? `Email: ${row.customer_email}`
        : usableEmail
          ? `Email: ${usableEmail} (given at signing)`
          : 'Email: none — quote was sent as a link',
      row.customer_phone ? `Phone: ${row.customer_phone}` : '',
      row.customer_address ? `Service address: ${row.customer_address}` : '',
      ``,
      `Plan accepted: ${acceptedPlan}${price ? ` — ${price}` : ''}`,
      `Accepted: ${when} (ET)`,
      ip ? `IP: ${ip}` : '',
      ``,
      `SIGNED: "${onboarding.signature}" (typed)`,
      `Agreement version: ${TERMS_VERSION}`,
      `Consents: service requirements, service agreement, privacy policy`,
      ``,
      billing ? `Billing: ${billing}` : '',
      onboarding.preferredStart ? `Preferred start: ${onboarding.preferredStart}` : '',
      onboarding.accessNotes ? `Access notes: ${onboarding.accessNotes}` : '',
      ``,
      `Quoted: ${new Date(row.created_at).toLocaleDateString('en-US')}`,
    ]
      .filter(Boolean)
      .join('\n');

    if (owner) {
      await sendViaResend(apiKey, {
        from,
        to: owner,
        replyTo: row.customer_email.trim() || usableEmail || undefined,
        subject: `ACCEPTED: ${row.customer_name} — ${acceptedPlan}`,
        text: `${detail}\n\nSet them up in the service app.`,
        html: `<pre style="font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;white-space:pre-wrap;margin:0;">${esc(detail)}</pre><p style="font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Set them up in the service app.</p>`,
        tags: [{ name: 'source', value: 'quote_accepted' }],
      }).catch((err) => console.log('[quote/accept] owner_notify_failed:', String(err).slice(0, 200)));
    }

    // A link-only quote can have no address at all — it was texted, not
    // emailed. Calling Resend with an empty `to` is a guaranteed 4xx: harmless,
    // because the catch below keeps it away from the acceptance, but it's a
    // failed request and a logged error on every one of those acceptances.
    // The owner handoff above still goes out either way, which is the one that
    // has to.
    // The row was read BEFORE the accept wrote this address in, so prefer the
    // one just supplied.
    const customerEmail = row.customer_email.trim() || usableEmail;
    if (customerEmail) {
    await sendViaResend(apiKey, {
      from,
      to: customerEmail,
      replyTo,
      subject: `You're all set — ${BIZ.name}`,
      text: `Hi ${row.customer_name.split(/\s+/)[0] || 'there'},\n\nThanks for accepting the ${acceptedPlan} plan${price ? ` at ${price}` : ''}.\n\nYou'll receive your first invoice on your first scheduled service date. We'll reach out to confirm that date, and with any questions we have.\n\nQuestions in the meantime? Just reply to this email.\n\n${BIZ.name}\n${BIZ.phoneDisplay} · ${BIZ.websiteDisplay}`,
      html: `<div style="font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111827;max-width:520px;">
        <p>Hi ${esc(row.customer_name.split(/\s+/)[0] || 'there')},</p>
        <p>Thanks for accepting the <strong>${esc(acceptedPlan ?? '')}</strong> plan${price ? ` at <strong>${esc(price)}</strong>` : ''}.</p>
        <p>You&rsquo;ll receive your first invoice on your first scheduled service date. We&rsquo;ll reach out to confirm that date, and with any questions we have.</p>
        <p style="color:#6b7280;">Questions? Just reply to this email.</p>
        <p style="color:#6b7280;">${BIZ.name}<br>${BIZ.phoneDisplay} &middot; ${BIZ.websiteDisplay}</p>
      </div>`,
      tags: [{ name: 'source', value: 'quote_accepted_customer' }],
    }).catch((err) => console.log('[quote/accept] customer_notify_failed:', String(err).slice(0, 200)));
    }
  }

  return json({ ok: true, plan: acceptedPlan, at: when }, 200);
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
