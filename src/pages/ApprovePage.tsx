import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  LoaderCircle,
  AlertCircle,
  Phone,
  ArrowRight,
  ArrowLeft,
  PenLine,
  ChevronDown,
} from 'lucide-react';
import { usePageMeta } from '@/lib/usePageMeta';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
/**
 * The proposal's own content modules. They live under components/admin because
 * the PDF and the proposal email are their other two consumers, but they hold no
 * admin UI — they're pure data derived from the pool, which is why this public
 * page can use them to render the same service definition the customer already
 * read in their PDF.
 *
 * DERIVED, NOT REPLAYED: these compute from the stored pool rather than from a
 * snapshot taken at send time, so editing the wording here changes what an
 * already-sent quote's page says. Acceptable while the wording only ever gets
 * more accurate; if one of these lines ever changes materially, old quotes would
 * show the new one against a PDF showing the old, and it should be snapshotted
 * into proposal_json at send time instead.
 */
import { BENEFITS_HEADING, benefitsNote, includedBenefits } from '@/components/admin/proposalBenefits';

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
  /** The tailored persuasion line, e.g. why a $120 cartridge bill never lands. */
  valueNote?: string;
  /** Exactly what the included filter service does and doesn't cover. */
  finePrint?: string;
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
  proposal: { tiers?: Tier[]; price?: string; scope?: string; includeBenefits?: boolean };
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

/** Small caps heading for the two confirmation blocks. */
const Eyebrow = ({ children }: { children: string }) => (
  <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">{children}</h2>
);

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

  /**
   * The pool as one flowing line rather than a table of labelled rows.
   *
   * A labelled table needs every row to earn its label, and looked stranded on a
   * quote carrying only two facts ("Water: Saltwater / Filter: Cartridge" as a
   * two-row grid). Joined, the same two facts read as a sentence — and a fully
   * detailed pool wraps to two lines instead of becoming a seven-row block.
   */
  const poolSummary = useMemo(() => {
    const p = quote?.pool ?? {};
    const filter = [p.filterType, p.filter].filter((v) => (v ?? '').trim()).join(' ');
    return [
      p.sanitization,
      filter && `${filter} filter`,
      p.gallons && `${p.gallons} gallons`,
      dims,
      p.shape,
      p.pump,
      p.heater,
    ]
      .map((v) => (v ?? '').trim())
      .filter(Boolean)
      .join(' · ');
  }, [quote, dims]);

  /**
   * This pool's filter, in the shape every content module expects. `=== 'yes'`
   * exactly, matching how the PDF read the same field — anything else means the
   * question wasn't answered, and an unanswered question must not become a
   * promise.
   */
  const filterOption = useMemo(
    () => ({
      type: (quote?.pool.filterType ?? '').trim(),
      included: quote?.pool.filterServiceIncluded === 'yes',
    }),
    [quote],
  );

  /**
   * The service definition both plans share. In tier mode this box IS what the
   * taglines mean by "above" — "Everything above, billed month to month" was
   * pointing at nothing, because this page rendered the plans without ever
   * rendering the service they include.
   */
  const benefits = useMemo(
    () => (quote && (quote.proposal.includeBenefits || tiers.length > 0) ? includedBenefits(filterOption) : []),
    [quote, tiers.length, filterOption],
  );

  /**
   * Today in the browser's own timezone, as the date input's `min`.
   *
   * Built from the local parts rather than toISOString(), which converts to UTC
   * — in Florida that lands on tomorrow's date from 8pm, so the customer would
   * be blocked from picking the very day they're sitting there reading this.
   * Only ever evaluated in step 2, which needs a loaded quote, so it can't be
   * baked into the prerendered HTML.
   */
  const today = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  /** Scope lines, parsed the same way the PDF parses them. */
  const scopeLines = useMemo(
    () =>
      (quote?.proposal.scope ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [quote],
  );

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
      {/* 1024px, not 768px. At 3xl the two plan cards were ~370px each and every
          benefit bullet wrapped to two lines, which is what made the page feel
          cramped. Long PROSE stays narrower — see the max-w-3xl on the note and
          the scope below; a 1024px-wide paragraph is past a comfortable reading
          measure even when the cards beside it are not. */}
      <div className="mx-auto w-full max-w-5xl">
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
            {/* An address block, not a table. "Service at / Email / Phone" labels
                told people what an address, an email and a phone number are —
                and the fixed label column left a dead gutter on a phone. */}
            <div className="mb-5 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
              <div>
                <Eyebrow>Prepared for</Eyebrow>
                <p className="font-semibold text-white">{quote.customerName}</p>
                {quote.customerAddress?.trim() && (
                  <p className="text-sm text-gray-300">{quote.customerAddress.trim()}</p>
                )}
                <p className="mt-0.5 text-sm text-gray-400">
                  {[quote.customerEmail, quote.customerPhone]
                    .map((v) => (v ?? '').trim())
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              {poolSummary && (
                /* A rule between the columns on desktop. Without it a two-fact
                   pool leaves the right half looking like a gap in the layout
                   rather than a short answer. */
                <div className="sm:border-l sm:border-white/10 sm:pl-10">
                  <Eyebrow>Your pool</Eyebrow>
                  <p className="text-sm leading-relaxed text-gray-300">{poolSummary}</p>
                </div>
              )}
            </div>
            <p className="mb-8 text-xs text-gray-500">
              Something not right?{' '}
              <a href={PHONE_HREF} className="underline hover:text-white">
                Call us
              </a>{' '}
              and we’ll put it right before you accept.
            </p>

            {/* The service itself, stated once — both plans include it, which is
                why the plan cards describe billing terms rather than repeating
                all of this twice. Two columns on desktop so five bullets cost
                three rows of height instead of five, keeping the plans up. */}
            {benefits.length > 0 && (
              <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="mb-3 font-display text-base font-bold">{BENEFITS_HEADING}</h2>
                {/* CSS columns, not a grid. A grid aligns rows, so a two-line
                    bullet opposite a one-line bullet left a visible gap under
                    the short one; columns flow top-to-bottom, which is also the
                    order a list should be read in. */}
                <ul className="sm:columns-2 sm:gap-x-8">
                  {benefits.map((b, i) => (
                    <li
                      key={i}
                      // Space BETWEEN bullets only. leading-relaxed is untouched,
                      // so a bullet that wraps stays tight within itself and the
                      // gap reads as separation between points rather than loose
                      // text.
                      className="mb-4 flex break-inside-avoid gap-2 text-sm leading-relaxed text-gray-200"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 max-w-3xl text-xs leading-relaxed text-gray-400">{benefitsNote(filterOption)}</p>
              </section>
            )}

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
                      // cheaper-then-better — which only works as anchoring if
                      // the better one visually dominates, hence the ring below.
                      tier.recommended ? 'order-first sm:order-none' : ''
                    } ${
                      on
                        ? 'border-brand-blue-light bg-brand-blue/15 ring-2 ring-brand-blue-light/40'
                        : tier.recommended
                          ? 'border-brand-blue-light/70 bg-brand-blue/10 shadow-lg shadow-brand-blue/20 ring-1 ring-brand-blue-light/25 hover:border-brand-blue-light'
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
                      /* The recommended price is set a size larger. Two prices at
                         identical weight ask the customer to do the comparison
                         themselves; the point of recommending one is to have
                         already done it. */
                      <p
                        className={`mt-3 font-bold text-brand-blue-light ${
                          tier.recommended ? 'text-3xl' : 'text-2xl'
                        }`}
                      >
                        {formatPrice(tier.price)}
                      </p>
                    )}
                    {tier.priceNote?.trim() && (
                      <p className="mt-1 inline-flex self-start rounded-md bg-green-500/15 px-2 py-1 text-sm font-semibold text-green-300">
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
                    {/* The note and the button are bottom-anchored TOGETHER. The
                        two cards hold different amounts (only one has a price
                        note), so the shorter one has slack to put somewhere;
                        pushing this whole group down turns it into a gap above a
                        divider — a section break — instead of ~150px of dead
                        space trailing the card. */}
                    <div className="mt-auto">
                      {tier.valueNote?.trim() && (
                        <p className="border-t border-white/10 pt-3 text-xs leading-relaxed text-gray-400">
                          {tier.valueNote.trim()}
                        </p>
                      )}
                      {/* An explicit affordance — two faint circles in the
                          corners were not one. */}
                      <span className="block pt-4">
                        <span
                          className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                            on
                              ? 'border-brand-blue-light bg-brand-blue-light/15 text-white'
                              : tier.recommended
                                ? 'border-brand-blue-light/50 text-brand-blue-light'
                                : 'border-white/15 text-gray-300'
                          }`}
                        >
                          {on ? (
                            <>
                              <Check className="h-4 w-4" strokeWidth={3} /> Selected
                            </>
                          ) : (
                            `Choose ${tier.name}`
                          )}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* NOTE: the "What Others Charge Extra For" value stack is
                deliberately NOT on this page. It stays in the PDF and the
                proposal email — see includedExtras.ts — but by the time someone
                is here they've read it once already and come to accept, not to
                be sold to again. */}

            {/* Reference, not persuasion: the full week-by-week scope and each
                plan's terms. Collapsed so it can be complete without pushing the
                decision down the page. */}
            {(scopeLines.length > 0 || tiers.some((t) => t.finePrint?.trim())) && (
              <details className="group mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 open:pb-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-semibold text-gray-300 hover:text-white">
                  Everything in writing — the full scope of work and plan terms
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                {scopeLines.length > 0 && (
                  <div className="max-w-3xl border-t border-white/10 pt-4">
                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Scope of work
                    </h3>
                    {scopeLines.map((line, i) =>
                      /^[•\-]/.test(line) ? (
                        <p key={i} className="mb-1.5 flex gap-2 text-sm leading-relaxed text-gray-300">
                          <span className="text-brand-blue-light">•</span>
                          <span>{line.replace(/^[•-]\s*/, '')}</span>
                        </p>
                      ) : (
                        <p key={i} className="mb-2 text-sm leading-relaxed text-gray-300">
                          {line}
                        </p>
                      ),
                    )}
                  </div>
                )}
                {tiers
                  .filter((t) => t.finePrint?.trim())
                  .map((t, i) => (
                    <div key={i} className="mt-4 max-w-3xl border-t border-white/10 pt-4">
                      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        {t.name} — terms
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-400">{t.finePrint?.trim()}</p>
                    </div>
                  ))}
              </details>
            )}

            {/*
              The confirm bar. Deliberately the LAST element on the step.

              Pinned directly under the cards it was worse than useless: a
              `sticky bottom` element rests at its own position in the flow, and
              that position was exactly the cards' footers — so the bar sat on
              top of "Selected" and "Choose Pay Annually" and hid the control for
              switching plans. Last, it stays pinned across the whole step and
              only settles at the very bottom, and the spacer below guarantees
              every part of the page can be scrolled out from under it.

              It restates the plan and the price rather than being a bare button,
              because this is the click that commits and the customer should see
              what they're committing to without scrolling back up. Opaque
              background, not a blur — blur is banned below 768px (CLAUDE.md #10).
            */}
            {plan && (
              <>
                <div className="sticky bottom-4 z-10 mt-6">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-brand-blue-light/40 bg-[#0e1a29] p-3 pl-5 shadow-2xl shadow-black/60">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        {plan}
                      </p>
                      {chosen?.price && (
                        <p className="font-display text-lg font-bold leading-tight text-white">
                          {formatPrice(chosen.price)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setStep(2);
                        window.scrollTo({ top: 0 });
                      }}
                      className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark px-5 py-3 text-base font-bold shadow-lg shadow-brand-blue/25 sm:px-8"
                    >
                      Continue <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {/* Scroll clearance, so the bar can never permanently cover the
                    last thing on the page. */}
                <div className="h-24" aria-hidden="true" />
              </>
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
                {/* Asked as a question, and about how SOON rather than "preferred
                    start date" — a form label invites a form answer, and this is
                    the field where someone quietly decides whether they're
                    starting this week or thinking about next month. */}
                <label className="text-sm text-gray-400">
                  How soon would you like us to start?
                  <input
                    className={`${field} mt-1`}
                    type="date"
                    value={preferredStart}
                    // A start date in the past isn't a preference, it's a typo.
                    min={today}
                    onChange={(e) => setPreferredStart(e.target.value)}
                  />
                </label>
                <label className="text-sm text-gray-400">
                  Gate code, pets, anything we should know
                  <input className={`${field} mt-1`} value={accessNotes}
                    onChange={(e) => setAccessNotes(e.target.value)} />
                </label>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                We&rsquo;ll confirm your first visit with you — the sooner you start, the sooner your pool
                is on a routine.
              </p>
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
                <p className="mt-2 max-w-3xl text-xs leading-relaxed text-gray-500">
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
