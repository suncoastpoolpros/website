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
import { acceptQuote, getQuote, isExpired } from '../_quotes';
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
  let body: { token?: string; plan?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  const token = String(body.token ?? '').trim();
  const plan = String(body.plan ?? '').trim();
  if (!token || !plan) return json({ ok: false, error: 'bad_request' }, 400);

  const row = await getQuote(env.DB, token);
  if (!row) return json({ ok: false, error: 'not_found' }, 404);
  if (isExpired(row)) return json({ ok: false, error: 'expired' }, 410);
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

  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const ua = request.headers.get('User-Agent') ?? '';
  const recorded = await acceptQuote(env.DB, token, acceptedPlan ?? plan, ip, ua);
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
    const detail = [
      `Customer: ${row.customer_name}`,
      `Email: ${row.customer_email}`,
      row.customer_phone ? `Phone: ${row.customer_phone}` : '',
      row.customer_address ? `Address: ${row.customer_address}` : '',
      ``,
      `Plan accepted: ${acceptedPlan}${price ? ` — ${price}` : ''}`,
      `Accepted: ${when} (ET)`,
      ip ? `IP: ${ip}` : '',
      ``,
      `Quoted: ${new Date(row.created_at).toLocaleDateString('en-US')}`,
    ]
      .filter(Boolean)
      .join('\n');

    if (owner) {
      await sendViaResend(apiKey, {
        from,
        to: owner,
        replyTo: row.customer_email,
        subject: `ACCEPTED: ${row.customer_name} — ${acceptedPlan}`,
        text: `${detail}\n\nSet them up in the service app.`,
        html: `<pre style="font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;white-space:pre-wrap;margin:0;">${esc(detail)}</pre><p style="font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Set them up in the service app.</p>`,
        tags: [{ name: 'source', value: 'quote_accepted' }],
      }).catch((err) => console.log('[quote/accept] owner_notify_failed:', String(err).slice(0, 200)));
    }

    await sendViaResend(apiKey, {
      from,
      to: row.customer_email,
      replyTo,
      subject: `You're all set — ${BIZ.name}`,
      text: `Hi ${row.customer_name.split(/\s+/)[0] || 'there'},\n\nThanks for accepting the ${acceptedPlan} plan${price ? ` at ${price}` : ''}. We'll be in touch shortly to confirm your first service day.\n\nQuestions? Just reply to this email.\n\n${BIZ.name}\n${BIZ.phoneDisplay} · ${BIZ.websiteDisplay}`,
      html: `<div style="font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111827;max-width:520px;">
        <p>Hi ${esc(row.customer_name.split(/\s+/)[0] || 'there')},</p>
        <p>Thanks for accepting the <strong>${esc(acceptedPlan ?? '')}</strong> plan${price ? ` at <strong>${esc(price)}</strong>` : ''}. We&rsquo;ll be in touch shortly to confirm your first service day.</p>
        <p style="color:#6b7280;">Questions? Just reply to this email.</p>
        <p style="color:#6b7280;">${BIZ.name}<br>${BIZ.phoneDisplay} &middot; ${BIZ.websiteDisplay}</p>
      </div>`,
      tags: [{ name: 'source', value: 'quote_accepted_customer' }],
    }).catch((err) => console.log('[quote/accept] customer_notify_failed:', String(err).slice(0, 200)));
  }

  return json({ ok: true, plan: acceptedPlan, at: when }, 200);
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
