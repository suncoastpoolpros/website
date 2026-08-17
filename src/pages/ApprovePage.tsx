import { useCallback, useEffect, useState } from 'react';
import { Check, LoaderCircle, AlertCircle, Phone } from 'lucide-react';
import { usePageMeta } from '@/lib/usePageMeta';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';

/**
 * /approve/?t=<token> — where an emailed "Review & accept your plan" link lands.
 *
 * The token lives in the QUERY STRING rather than the path so this stays an
 * ordinary prerendered route. A path like /approve/<token> would need either a
 * dynamic HTML function or the SPA catch-all that was removed to stop every
 * unknown URL returning 200.
 *
 * Deliberately noindex: it's a per-customer document reachable only by link.
 */
type Tier = { name: string; price: string; tagline: string; includes: string[]; recommended: boolean };
type Quote = {
  customerName: string;
  createdAt: string;
  expiresAt: string;
  proposal: { tiers?: Tier[]; price?: string; scope?: string; pricingMode?: string };
  acceptedAt: string | null;
  acceptedPlan: string | null;
};

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; quote: Quote }
  | { kind: 'accepting'; quote: Quote; plan: string }
  | { kind: 'accepted'; plan: string }
  | { kind: 'error'; message: string };

const formatPrice = (raw: string): string => {
  const s = (raw ?? '').trim();
  if (!s) return '';
  return /^[0-9]/.test(s) ? `$${s}` : s;
};

export const ApprovePage = () => {
  usePageMeta({
    title: 'Accept Your Pool Service Plan — Suncoast Pool Pros',
    description: '',
    noindex: true,
  });

  const [state, setState] = useState<State>({ kind: 'loading' });
  const token = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('t') ?? '';

  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', message: "That link doesn't look complete. Please use the button in your email." });
      return;
    }
    let active = true;
    fetch(`/api/quote/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; quote?: Quote; error?: string };
        if (!active) return;
        if (res.ok && data.ok && data.quote) {
          const q = data.quote;
          if (q.acceptedAt && q.acceptedPlan) setState({ kind: 'accepted', plan: q.acceptedPlan });
          else setState({ kind: 'ready', quote: q });
          return;
        }
        setState({
          kind: 'error',
          message:
            data.error === 'expired'
              ? 'This quote has expired. Give us a call and we&rsquo;ll send a fresh one.'
              : "We couldn't find that quote. Please use the button in your email, or give us a call.",
        });
      })
      .catch(() => active && setState({ kind: 'error', message: 'Something went wrong loading your quote.' }));
    return () => {
      active = false;
    };
  }, [token]);

  const accept = useCallback(
    async (quote: Quote, plan: string) => {
      setState({ kind: 'accepting', quote, plan });
      try {
        const res = await fetch('/api/quote/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, plan }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; plan?: string };
        if (res.ok && data.ok) setState({ kind: 'accepted', plan: data.plan ?? plan });
        else setState({ kind: 'error', message: "We couldn't record that. Please give us a call and we'll sort it." });
      } catch {
        setState({ kind: 'error', message: 'Something went wrong. Please give us a call.' });
      }
    },
    [token],
  );

  return (
    <main className="force-static-motion min-h-dvh bg-[#07111c] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Suncoast Pool Pros</p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Accept your plan</h1>
        </div>

        {state.kind === 'loading' && (
          <div className="flex justify-center py-16">
            <LoaderCircle className="h-8 w-8 animate-spin text-brand-blue-light" />
          </div>
        )}

        {state.kind === 'error' && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-7 w-7 text-red-400" />
            <p className="text-gray-200" dangerouslySetInnerHTML={{ __html: state.message }} />
            <a
              href={PHONE_HREF}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/5"
            >
              <Phone className="h-4 w-4 text-brand-blue-light" /> {PHONE_DISPLAY}
            </a>
          </div>
        )}

        {state.kind === 'accepted' && (
          <div className="rounded-2xl border border-green-500/25 bg-green-500/10 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-green-500/30 bg-green-500/15">
              <Check className="h-7 w-7 text-green-400" strokeWidth={3} />
            </div>
            <h2 className="font-display text-xl font-bold">You&rsquo;re all set</h2>
            <p className="mx-auto mt-2 max-w-md text-gray-300">
              We&rsquo;ve got your <span className="font-semibold text-white">{state.plan}</span> plan. We&rsquo;ll be
              in touch shortly to confirm your first service day — and a confirmation is on its way to your
              inbox.
            </p>
          </div>
        )}

        {(state.kind === 'ready' || state.kind === 'accepting') && (
          <>
            <p className="mb-6 text-center text-gray-400">
              Hi {state.quote.customerName.split(/\s+/)[0] || 'there'} — choose the plan you&rsquo;d like and
              we&rsquo;ll get you on the schedule.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(state.quote.proposal.tiers ?? []).map((tier, i) => {
                const busy = state.kind === 'accepting';
                const thisOne = state.kind === 'accepting' && state.plan === tier.name;
                return (
                  <div
                    key={i}
                    className={`flex flex-col rounded-2xl border p-5 ${
                      tier.recommended ? 'border-brand-blue bg-brand-blue/10' : 'border-white/12 bg-white/[0.03]'
                    }`}
                  >
                    {tier.recommended && (
                      <span className="mb-3 inline-block self-start rounded bg-brand-blue px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                        Recommended
                      </span>
                    )}
                    <h2 className="font-display text-lg font-bold">{tier.name}</h2>
                    {tier.tagline && <p className="mt-1 text-sm text-gray-400">{tier.tagline}</p>}
                    {tier.price && (
                      <p className="mt-3 text-2xl font-bold text-brand-blue-light">{formatPrice(tier.price)}</p>
                    )}
                    <ul className="mt-4 flex-1 space-y-2">
                      {tier.includes
                        .map((x) => x.trim())
                        .filter(Boolean)
                        .map((item, j) => (
                          <li key={j} className="flex gap-2 text-sm leading-relaxed text-gray-300">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                            {item}
                          </li>
                        ))}
                    </ul>
                    <button
                      onClick={() => accept(state.quote, tier.name)}
                      disabled={busy}
                      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                        tier.recommended
                          ? 'bg-gradient-to-r from-brand-blue to-brand-blue-dark hover:from-brand-blue-light'
                          : 'border border-white/20 hover:bg-white/5'
                      }`}
                    >
                      {thisOne ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
                      {thisOne ? 'Confirming…' : `Choose ${tier.name}`}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-center text-xs leading-relaxed text-gray-500">
              Accepting confirms the plan and rate above. Our{' '}
              <a href="/service-agreement/" className="text-gray-400 underline hover:text-white">
                service agreement
              </a>{' '}
              applies. Questions first? Call{' '}
              <a href={PHONE_HREF} className="text-gray-400 underline hover:text-white">
                {PHONE_DISPLAY}
              </a>
              .
            </p>
          </>
        )}
      </div>
    </main>
  );
};
