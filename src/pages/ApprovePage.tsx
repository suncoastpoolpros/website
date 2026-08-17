import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, LoaderCircle, AlertCircle, Phone, ArrowRight, ArrowLeft, PenLine } from 'lucide-react';
import { usePageMeta } from '@/lib/usePageMeta';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';

/**
 * /approve/?t=<token> — where an emailed "Review & accept your plan" link lands.
 *
 * Two steps in one route:
 *   1. What we quoted — their details, their pool, the plans. Selecting a plan
 *      selects it; it does not accept anything.
 *   2. Confirm — billing address if different, then the service agreement with
 *      a typed signature.
 *
 * ACCEPTANCE HAPPENS AT THE END OF STEP 2, not on selecting a plan. The service
 * agreement treats submission of the onboarding form as legally binding
 * acceptance, so recording it on a plan tap would claim agreement to terms the
 * customer hadn't yet been shown.
 *
 * The token lives in the QUERY STRING rather than the path so this stays an
 * ordinary prerendered route — a /approve/<token> path would need the SPA
 * catch-all that was removed to stop unknown URLs returning 200. Staying on one
 * URL across both steps also keeps the emailed link valid at any point.
 */
type Tier = {
  name: string;
  price: string;
  /** e.g. "$2,035 billed once — $185 saved". The PDF and email both show this;
   *  it was missing here, on the page where the decision actually happens. */
  priceNote?: string;
  tagline: string;
  includes: string[];
  recommended: boolean;
};
type Pool = {
  gallons?: string;
  length?: string;
  width?: string;
  avgDepth?: string;
  shape?: string;
  sanitization?: string;
  filterType?: string;
  filter?: string;
  filterServiceIncluded?: string | boolean;
  pump?: string;
  heater?: string;
  equipmentNotes?: string;
};
type Quote = {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  createdAt: string;
  expiresAt: string;
  pool: Pool;
  proposal: { tiers?: Tier[]; price?: string; scope?: string };
  acceptedAt: string | null;
  acceptedPlan: string | null;
};

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; quote: Quote }
  | { kind: 'accepted'; plan: string }
  | { kind: 'error'; message: string };

const formatPrice = (raw: string): string => {
  const s = (raw ?? '').trim();
  if (!s) return '';
  return /^[0-9]/.test(s) ? `$${s}` : s;
};

const field =
  'h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none';

const Row = ({ label, value }: { label: string; value?: string | null }) => {
  const v = (value ?? '').trim();
  if (!v) return null;
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-28 shrink-0 text-gray-500">{label}</span>
      <span className="flex-1 text-gray-200">{v}</span>
    </div>
  );
};

export const ApprovePage = () => {
  usePageMeta({
    title: 'Accept Your Pool Service Plan — Suncoast Pool Pros',
    description: '',
    noindex: true,
  });

  const [state, setState] = useState<State>({ kind: 'loading' });
  const [step, setStep] = useState<1 | 2>(1);
  const [plan, setPlan] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const [sameBilling, setSameBilling] = useState(true);
  const [billing, setBilling] = useState({ name: '', email: '', address: '', city: '', state: '', zip: '' });
  const [preferredStart, setPreferredStart] = useState('');
  const [accessNotes, setAccessNotes] = useState('');
  const [agree, setAgree] = useState({ requirements: false, service: false, privacy: false });
  const [signature, setSignature] = useState('');

  const token = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('t') ?? '';

  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', message: 'That link looks incomplete. Please use the button in your email.' });
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
              ? 'This quote has expired. Give us a call and we’ll send a fresh one.'
              : 'We couldn’t find that quote. Please use the button in your email, or give us a call.',
        });
      })
      .catch(() => active && setState({ kind: 'error', message: 'Something went wrong loading your quote.' }));
    return () => {
      active = false;
    };
  }, [token]);

  const quote = state.kind === 'ready' ? state.quote : null;
  const tiers = quote?.proposal.tiers ?? [];
  const chosen = tiers.find((t) => t.name === plan);

  const dims = useMemo(() => {
    const p = quote?.pool ?? {};
    return [p.length && `${p.length} ft L`, p.width && `${p.width} ft W`, p.avgDepth && `${p.avgDepth} ft avg`]
      .filter(Boolean)
      .join(' × ');
  }, [quote]);

  const filterLine = useMemo(() => {
    const p = quote?.pool ?? {};
    return [p.filterType, p.filter].filter((v) => (v ?? '').trim()).join(' — ');
  }, [quote]);

  const canSubmit =
    !!plan && agree.requirements && agree.service && agree.privacy && signature.trim().length >= 2;

  const submit = useCallback(async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setFormError('');
    try {
      const res = await fetch('/api/quote/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          plan,
          onboarding: {
            billingSameAsService: sameBilling,
            billingName: billing.name,
            billingEmail: billing.email,
            billingAddress: billing.address,
            billingCity: billing.city,
            billingState: billing.state,
            billingZip: billing.zip,
            preferredStart,
            accessNotes,
            agreeRequirements: agree.requirements,
            agreeService: agree.service,
            agreePrivacy: agree.privacy,
            signature: signature.trim(),
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; plan?: string };
      if (res.ok && data.ok) setState({ kind: 'accepted', plan: data.plan ?? plan });
      else setFormError('We couldn’t record that. Please try again, or give us a call.');
    } catch {
      setFormError('Something went wrong. Please give us a call.');
    } finally {
      setBusy(false);
    }
  }, [canSubmit, busy, token, plan, sameBilling, billing, preferredStart, accessNotes, agree, signature]);

  return (
    <main className="force-static-motion min-h-dvh bg-[#07111c] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Suncoast Pool Pros</p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
            {state.kind === 'accepted' ? 'You’re all set' : step === 1 ? 'Your proposal' : 'Confirm and sign'}
          </h1>
        </div>

        {state.kind === 'loading' && (
          <div className="flex justify-center py-16">
            <LoaderCircle className="h-8 w-8 animate-spin text-brand-blue-light" />
          </div>
        )}

        {state.kind === 'error' && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-7 w-7 text-red-400" />
            <p className="text-gray-200">{state.message}</p>
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
            <p className="text-lg font-semibold">
              Your <span className="text-brand-blue-light">{state.plan}</span> plan is confirmed.
            </p>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-gray-300">
              You’ll receive your first invoice on your first scheduled service date. We’ll reach out to
              confirm that date, and with any questions we have.
            </p>
            <p className="mt-5 text-sm text-gray-400">A copy is on its way to your inbox.</p>
          </div>
        )}

        {quote && step === 1 && (
          <>
            {/* Borderless and compact. These are reassurance — "yes, that's my
                pool" — not the decision. Two bordered cards pushed the plans
                below the fold on a phone, which is the wrong thing to make
                someone scroll past. */}
            <div className="mb-5 grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              <div>
                <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Your details
                </h2>
                <p className="font-semibold text-white">{quote.customerName}</p>
                <Row label="Service at" value={quote.customerAddress} />
                <Row label="Email" value={quote.customerEmail} />
                <Row label="Phone" value={quote.customerPhone} />
              </div>
              <div>
                <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Your pool
                </h2>
                <Row label="Volume" value={quote.pool.gallons ? `${quote.pool.gallons} gallons` : ''} />
                <Row label="Dimensions" value={dims} />
                <Row label="Shape" value={quote.pool.shape} />
                <Row label="Water" value={quote.pool.sanitization} />
                <Row label="Filter" value={filterLine} />
                <Row label="Pump" value={quote.pool.pump} />
                <Row label="Heater" value={quote.pool.heater} />
              </div>
            </div>
            <p className="mb-8 text-xs text-gray-500">
              Something not right?{' '}
              <a href={PHONE_HREF} className="underline hover:text-white">
                Call us
              </a>{' '}
              before accepting and we’ll put it right.
            </p>

            <p className="mb-4 text-center text-gray-400">Choose the plan you’d like.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {tiers.map((tier, i) => {
                const on = plan === tier.name;
                return (
                  <button
                    key={i}
                    onClick={() => setPlan(tier.name)}
                    aria-pressed={on}
                    className={`flex flex-col rounded-2xl border p-5 text-left transition-colors ${
                      // Recommended leads on a phone: stacked, the upgrade would
                      // otherwise sit below the fold under the option it's meant
                      // to beat. Side by side on desktop, natural order reads
                      // cheaper-then-better.
                      tier.recommended ? 'order-first sm:order-none' : ''
                    } ${
                      on
                        ? 'border-brand-blue-light bg-brand-blue/15 ring-2 ring-brand-blue-light/40'
                        : tier.recommended
                          ? 'border-brand-blue/60 bg-brand-blue/[0.07] hover:border-brand-blue-light'
                          : 'border-white/12 bg-white/[0.03] hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {tier.recommended && (
                          <span className="mb-2 inline-block rounded bg-brand-blue px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                            Recommended
                          </span>
                        )}
                        <h3 className="font-display text-lg font-bold">{tier.name}</h3>
                      </div>
                      <span
                        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          on ? 'border-white bg-white text-brand-blue' : 'border-white/30'
                        }`}
                      >
                        {on && <Check className="h-4 w-4" strokeWidth={3} />}
                      </span>
                    </div>
                    {tier.tagline && <p className="mt-1 text-sm text-gray-400">{tier.tagline}</p>}
                    {tier.price && (
                      <p className="mt-3 text-2xl font-bold text-brand-blue-light">{formatPrice(tier.price)}</p>
                    )}
                    {tier.priceNote?.trim() && (
                      <p className="mt-0.5 text-sm font-semibold text-brand-blue-light/90">
                        {tier.priceNote.trim()}
                      </p>
                    )}
                    <ul className="mt-4 space-y-2">
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
                  </button>
                );
              })}
            </div>

            {plan && (
              <div className="sticky bottom-4 z-10 mt-6">
                <button
                  onClick={() => {
                    setStep(2);
                    window.scrollTo({ top: 0 });
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark py-4 text-lg font-bold shadow-lg shadow-brand-blue/25"
                >
                  Continue with {plan} <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}

        {quote && step === 2 && (
          <>
            <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-brand-blue/40 bg-brand-blue/10 p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">Your plan</p>
                <p className="font-display text-lg font-bold">{plan}</p>
                {chosen?.price && (
                  <p className="text-sm font-semibold text-brand-blue-light">{formatPrice(chosen.price)}</p>
                )}
              </div>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4" /> Change
              </button>
            </div>

            <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-3 font-display text-base font-bold">Billing address</h2>
              <div className="space-y-2">
                {[
                  { v: true, label: 'Same as my service address', sub: quote.customerAddress ?? '' },
                  { v: false, label: 'Use a different billing address', sub: '' },
                ].map((opt) => (
                  <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => setSameBilling(opt.v)}
                    aria-pressed={sameBilling === opt.v}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      sameBilling === opt.v
                        ? 'border-brand-blue-light bg-brand-blue/15'
                        : 'border-white/12 hover:border-white/30'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        sameBilling === opt.v ? 'border-white bg-white text-brand-blue' : 'border-white/30'
                      }`}
                    >
                      {sameBilling === opt.v && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{opt.label}</span>
                      {opt.sub && <span className="block text-xs text-gray-400">{opt.sub}</span>}
                    </span>
                  </button>
                ))}
              </div>

              {!sameBilling && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input className={field} placeholder="Billing name" value={billing.name}
                    onChange={(e) => setBilling({ ...billing, name: e.target.value })} />
                  <input className={field} placeholder="Billing email" type="email" value={billing.email}
                    onChange={(e) => setBilling({ ...billing, email: e.target.value })} />
                  <input className={`${field} sm:col-span-2`} placeholder="Street address" value={billing.address}
                    onChange={(e) => setBilling({ ...billing, address: e.target.value })} />
                  <input className={field} placeholder="City" value={billing.city}
                    onChange={(e) => setBilling({ ...billing, city: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <input className={field} placeholder="State" value={billing.state}
                      onChange={(e) => setBilling({ ...billing, state: e.target.value })} />
                    <input className={field} placeholder="ZIP" inputMode="numeric" value={billing.zip}
                      onChange={(e) => setBilling({ ...billing, zip: e.target.value })} />
                  </div>
                </div>
              )}
            </section>

            <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-3 font-display text-base font-bold">
                Getting started <span className="text-sm font-normal text-gray-500">(optional)</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm text-gray-400">
                  Preferred start date
                  <input className={`${field} mt-1`} type="date" value={preferredStart}
                    onChange={(e) => setPreferredStart(e.target.value)} />
                </label>
                <label className="text-sm text-gray-400">
                  Gate code, pets, anything we should know
                  <input className={`${field} mt-1`} value={accessNotes}
                    onChange={(e) => setAccessNotes(e.target.value)} />
                </label>
              </div>
            </section>

            <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-3 font-display text-base font-bold">Service agreement</h2>
              <div className="space-y-3">
                {[
                  {
                    key: 'requirements' as const,
                    label: 'I’ve read and agree to the service requirements — access to the pool, an operational pump and filter, and a working outside hose.',
                  },
                  {
                    key: 'service' as const,
                    label: (
                      <>
                        I’ve read and agree to the{' '}
                        <a href="/service-agreement/" target="_blank" rel="noreferrer" className="text-brand-blue-light underline">
                          Service Agreement
                        </a>
                        .
                      </>
                    ),
                  },
                  {
                    key: 'privacy' as const,
                    label: (
                      <>
                        I’ve read and agree to the{' '}
                        <a href="/privacy-policy/" target="_blank" rel="noreferrer" className="text-brand-blue-light underline">
                          Privacy Policy
                        </a>
                        .
                      </>
                    ),
                  },
                ].map((item) => (
                  <label key={item.key} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-gray-200">
                    <input
                      type="checkbox"
                      checked={agree[item.key]}
                      onChange={(e) => setAgree({ ...agree, [item.key]: e.target.checked })}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand-blue"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <label className="block text-sm font-semibold text-gray-200">
                  <span className="mb-1 flex items-center gap-2">
                    <PenLine className="h-4 w-4 text-brand-blue-light" /> Type your full name to sign
                  </span>
                  <input
                    className={`${field} font-display text-lg`}
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder={quote.customerName}
                    autoComplete="name"
                  />
                </label>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  Typing your name acts as your electronic signature. We record the date, time and IP address
                  with it as proof of acceptance.
                </p>
              </div>
            </section>

            {formError && (
              <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                {formError}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!canSubmit || busy}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark py-4 text-lg font-bold shadow-lg shadow-brand-blue/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
              {busy ? 'Confirming…' : `Accept and start service`}
            </button>
            {!canSubmit && (
              <p className="mt-2 text-center text-xs text-gray-500">
                Tick all three boxes and type your name to continue.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
};
