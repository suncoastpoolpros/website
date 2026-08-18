import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  LoaderCircle,
  AlertCircle,
  Phone,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Download,
} from 'lucide-react';
import { usePageMeta } from '@/lib/usePageMeta';
import {
  downloadBlob,
  proposalDataFromQuote,
  proposalDateLabel,
  proposalFilename,
  renderProposalPdf,
} from '@/lib/proposalPdf';
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
  /** Proposal number. Null on quotes sent before numbering existed. */
  number?: number | null;
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
  'h-12 w-full rounded-xl border border-[#cbd5e1] bg-white px-4 text-[#0a1628] placeholder-[#9aa4b2] focus:border-[#1669AE] focus:outline-none';

/** Small caps heading for the two confirmation blocks. */
const Eyebrow = ({ children }: { children: string }) => (
  <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">{children}</h2>
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
  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'error'>('idle');

  const [preferredStart, setPreferredStart] = useState('');
  const [accessNotes, setAccessNotes] = useState('');
  const [agree, setAgree] = useState({ requirements: false, service: false, privacy: false });
  const [signature, setSignature] = useState('');

  const token = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('t') ?? '';

  /**
   * This is the one light page on a dark site, and `html, body { background:
   * #07111c }` is global (it exists so the iOS safe area isn't white — see
   * CLAUDE.md). Left alone, rubber-band overscroll on a phone reveals a band of
   * near-black above and below a white document, which reads as broken.
   *
   * Set while this page is mounted and restored on unmount, so in-app
   * navigation away from here puts the dark site back exactly as it was.
   */
  useEffect(() => {
    const { style } = document.documentElement;
    const body = document.body.style;
    const prevHtml = style.background;
    const prevBody = body.background;
    style.background = '#eef2f7';
    body.background = '#eef2f7';
    return () => {
      style.background = prevHtml;
      body.background = prevBody;
    };
  }, []);

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
  /**
   * Whether the step-1 header row is carrying the desktop contact block. Only
   * then does the masthead pill stand down on desktop — on step 2, and on the
   * loading / accepted / error screens, that row isn't rendered and the pill is
   * the only way to reach a person.
   */
  const contactInHeaderRow = !!quote;
  const tiers = quote?.proposal.tiers ?? [];
  const chosen = tiers.find((t) => t.name === plan);

  /**
   * Today in the browser's own timezone, as the date input's `min`.
   *
   * Built from the local parts rather than toISOString(), which converts to UTC
   * — in Florida that lands on tomorrow's date from 8pm, so the customer would
   * be blocked from picking the very day they're sitting there reading this.
   */
  const today = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  /**
   * Rebuild the proposal PDF in the browser and hand it over as a download.
   *
   * Same renderProposalPdf the admin builder calls when it emails the
   * attachment, and the date comes from the quote's createdAt — so a download
   * taken weeks later still carries the date the proposal was actually sent
   * rather than today's.
   *
   * The engine is ~1.4MB and only fetched on this click, so it costs nothing to
   * anyone who doesn't press it.
   */
  const downloadPdf = useCallback(async () => {
    if (!quote || pdfState === 'working') return;
    setPdfState('working');
    try {
      const blob = await renderProposalPdf({
        data: proposalDataFromQuote(quote),
        dateLabel: proposalDateLabel(quote.createdAt),
        // Same number as the emailed copy, or the download would be a different
        // document from the one on record.
        proposalNumber: quote.number,
      });
      downloadBlob(blob, proposalFilename(quote.customerName, quote.number));
      setPdfState('idle');
    } catch {
      // The PDF is attached to their email too, so this is a convenience
      // failing, not a dead end — the message below says so.
      setPdfState('error');
    }
  }, [quote, pdfState]);

  /** Move to the signing step. Used by the chosen card's button and the bar. */
  const goToConfirm = useCallback(() => {
    setStep(2);
    window.scrollTo({ top: 0 });
  }, []);

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
            // No billing fields: this page no longer asks. The endpoint records
            // "not collected" rather than defaulting to "same as service".
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
  }, [canSubmit, busy, token, plan, preferredStart, accessNotes, agree, signature]);

  /**
   * The right-hand side of the header row: the document, then a person.
   * Defined once because BOTH steps use it — step 1 beside "Prepared for",
   * step 2 beside "Your plan" — and two copies would drift.
   */
  const headerActions = (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        onClick={downloadPdf}
        disabled={pdfState === 'working'}
        className="inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-[#0f4d80] transition-colors hover:text-[#1669AE] hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:no-underline sm:py-1"
      >
        {pdfState === 'working' ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {pdfState === 'working' ? 'Preparing your PDF…' : 'Download full proposal'}
      </button>
      <a
        href={PHONE_HREF}
        className="inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-[#0f4d80] transition-colors hover:text-[#1669AE] hover:underline sm:py-1"
      >
        <Phone className="h-4 w-4 shrink-0" />
        {/* "Questions?" is the first thing to go when width is tight — the
            number is the part that has to survive. */}
        <span className="hidden sm:inline">Questions?</span> {PHONE_DISPLAY}
      </a>
      {pdfState === 'error' && (
        <p className="max-w-[16rem] text-xs text-[#c0392b] sm:text-right">
          Couldn’t build the PDF — it’s also attached to the email we sent you.
        </p>
      )}
    </div>
  );

  return (
    <main className="force-static-motion min-h-dvh bg-[#eef2f7] px-4 py-10 text-[#0a1628] sm:px-6">
      {/* 1024px, not 768px. At 3xl the two plan cards were ~370px each and every
          benefit bullet wrapped to two lines, which is what made the page feel
          cramped. Long PROSE stays narrower — see the max-w-3xl on the note and
          the scope below; a 1024px-wide paragraph is past a comfortable reading
          measure even when the cards beside it are not. */}
      <div className="mx-auto w-full max-w-5xl">
        <div className="relative mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#6b7280]">Suncoast Pool Pros</p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
            {state.kind === 'accepted' ? 'You’re all set' : step === 1 ? 'Your proposal' : 'Confirm and sign'}
          </h1>
          {/* The same number that's on the PDF and in the email subject, so all
              three surfaces are obviously one document. Absent on quotes sent
              before numbering, rather than invented after the fact. */}
          {quote?.number && (
            <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#9aa4b2]">
              Proposal #{quote.number}
            </p>
          )}
          {/*
            A reachable human. Every other word on this page argues for buying;
            without this the only route to a question was "Call us" in 12px
            gray-500 under the address — the faintest thing on a page asking
            someone to commit to a year of service.

            BELOW md ONLY. On desktop the header row below carries a fuller
            version of this in the space beside the pool, and stacking two phone
            CTAs in the same corner is exactly the duplication that got the old
            "Something not right? Call us" line deleted.

            In normal flow under the title, centred, with a 46px tap target —
            the phone is where it actually gets pressed.

            Hidden on the error state only, which already leads with a
            full-size phone button; two would just look like a mistake.
          */}
          {state.kind !== 'error' && (
            <a
              href={PHONE_HREF}
              className={`mt-4 items-center gap-2 rounded-full border border-[#dce7f2] bg-white px-4 py-3 text-sm font-semibold text-[#0a1628] transition-colors hover:border-[#1669AE] hover:bg-[#f3f6fb] ${
                // The header row carries the phone on every width now, so the
                // pill only appears on the screens that have no header row:
                // step 2, loading, accepted, error.
                contactInHeaderRow ? 'hidden' : 'inline-flex md:absolute md:right-0 md:top-0 md:mt-0 md:py-2'
              }`}
            >
              <Phone className="h-4 w-4 shrink-0 text-[#1669AE]" />
              {!contactInHeaderRow && <span className="hidden lg:inline">Questions?</span>}
              {PHONE_DISPLAY}
            </a>
          )}
        </div>

        {state.kind === 'loading' && (
          <div className="flex justify-center py-16">
            <LoaderCircle className="h-8 w-8 animate-spin text-[#1669AE]" />
          </div>
        )}

        {state.kind === 'error' && (
          <div className="rounded-2xl border border-[#f0c8c8] bg-[#fdf1f0] p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-7 w-7 text-[#c0392b]" />
            <p className="text-[#1f2937]">{state.message}</p>
            <a
              href={PHONE_HREF}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#dce7f2] bg-white px-5 py-3 font-semibold text-[#0a1628] hover:bg-[#f3f6fb]"
            >
              <Phone className="h-4 w-4 text-[#1669AE]" /> {PHONE_DISPLAY}
            </a>
          </div>
        )}

        {state.kind === 'accepted' && (
          <div className="rounded-2xl border border-[#bfe7c6] bg-[#eefaf0] p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#bfe7c6] bg-white">
              <Check className="h-7 w-7 text-[#1d7a33]" strokeWidth={3} />
            </div>
            <p className="text-lg font-semibold">
              Your <span className="text-[#0f4d80]">{state.plan}</span> plan is confirmed.
            </p>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-[#374151]">
              You’ll receive your first invoice on your first scheduled service date. We’ll reach out to
              confirm that date, and with any questions we have.
            </p>
            <p className="mt-5 text-sm text-[#6b7280]">A copy is on its way to your inbox.</p>
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
            {/*
              Details left, actions right — one row, both edges anchored.

              This took a few goes. Two columns of content left ~260px of slack
              that moved around but never went away; one left-aligned block left
              the whole right half empty instead. The fix is to stop trying to
              fill the row with CONTENT and let the actions hold the right edge:
              the row is now as wide as the plan cards below it, with nothing
              stranded in between.

              The actions are text links, not boxes. On a light page a white box
              reads as a small card, and these were competing with the plan
              cards for the same "press me" — they're utilities beside the real
              decision.
            */}
            <div className="mb-8 flex items-start justify-between gap-4 sm:gap-8">
              <div className="min-w-0">
                <Eyebrow>Prepared for</Eyebrow>
                <p className="font-semibold text-[#0a1628]">{quote.customerName}</p>
                {quote.customerAddress?.trim() && (
                  <p className="text-sm text-[#374151]">{quote.customerAddress.trim()}</p>
                )}
                {/* Email and phone as separate elements, not one joined string.
                    Joined, a wrap left the " · " stranded at the end of the
                    first line — which is what it did on narrower phones. They
                    stack on mobile with no separator at all, and only sit on one
                    line with the dot once there's room for both. */}
                <p className="mt-0.5 text-sm text-[#6b7280]">
                  {quote.customerEmail?.trim() && (
                    // break-words so a long address wraps instead of pushing the
                    // page sideways — an email is one unbreakable token.
                    <span className="block break-words sm:inline">{quote.customerEmail.trim()}</span>
                  )}
                  {quote.customerPhone?.trim() && (
                    // The separator lives INSIDE the phone's span, so it can
                    // never be left stranded at the end of a wrapped line — it
                    // travels with the number or isn't shown at all.
                    <span className="block whitespace-nowrap sm:inline">
                      {quote.customerEmail?.trim() && (
                        <span className="hidden text-[#c3cedb] sm:inline">· </span>
                      )}
                      {quote.customerPhone.trim()}
                    </span>
                  )}
                </p>
              </div>

              {headerActions}
            </div>
            {/* A "Something not right? Call us" line lived here. Removed once
                the header carried a phone number — two call-to-action phone
                links a few hundred pixels apart read as clutter, not as help.
                The spacing it provided now sits on the grid above. */}

            {/* The Suncoast Difference box lived here. Removed: the customer has
                already read it twice by the time they reach this page — once in
                the email, once in the attached PDF — and this page's job is the
                decision, not the pitch. The download below keeps the full
                document one click away. */}

            <p className="mb-4 text-center text-[#6b7280]">Choose the plan that works best for you.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {tiers.map((tier, i) => {
                const on = plan === tier.name;
                /**
                 * The recommendation is only styled while nothing is chosen.
                 * Once someone picks the other plan, a still-highlighted
                 * "recommended" card argues with the choice they just made —
                 * two cards competing for the same "this one" reading. The
                 * RECOMMENDED badge stays either way: that's information about
                 * the plan, not a claim about what's selected.
                 */
                const promote = tier.recommended && !plan;
                return (
                  <div
                    key={i}
                    className={`relative flex flex-col rounded-2xl border p-5 text-left transition-colors ${
                      // Recommended leads on a phone: stacked, the upgrade would
                      // otherwise sit below the fold under the option it's meant
                      // to beat. Side by side on desktop, natural order reads
                      // cheaper-then-better — which only works as anchoring if
                      // the better one visually dominates, hence the ring below.
                      tier.recommended ? 'order-first sm:order-none' : ''
                    } ${
                      on
                        ? 'border-[#1669AE] bg-white ring-2 ring-[#1669AE]/30'
                        : promote
                          ? 'border-[#1669AE] bg-white shadow-lg shadow-[#1669AE]/15 ring-1 ring-[#1669AE]/20 hover:border-[#0f4d80]'
                          : 'border-[#e3e8ef] bg-white hover:border-[#9fb3c8]'
                    }`}
                  >
                    {/* Selection covers the whole card, as a stretched button
                        rather than the card BEING one — the footer below is a
                        real button now, and a button inside a button is invalid
                        HTML. Everything non-interactive sits under this; the
                        footer sits above it on z-10. */}
                    <button
                      onClick={() => setPlan(tier.name)}
                      aria-pressed={on}
                      className="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1669AE]"
                    >
                      <span className="sr-only">Choose {tier.name}</span>
                    </button>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {tier.recommended && (
                          <span className="mb-2 inline-block rounded bg-[#1669AE] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                            Recommended
                          </span>
                        )}
                        <h3 className="font-display text-lg font-bold">{tier.name}</h3>
                      </div>
                      <span
                        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          on ? 'border-[#1669AE] bg-[#1669AE] text-white' : 'border-[#c3cedb]'
                        }`}
                      >
                        {on && <Check className="h-4 w-4" strokeWidth={3} />}
                      </span>
                    </div>
                    {tier.tagline && <p className="mt-1 text-sm text-[#6b7280]">{tier.tagline}</p>}
                    {tier.price && (
                      /* The recommended price is set a size larger. Two prices at
                         identical weight ask the customer to do the comparison
                         themselves; the point of recommending one is to have
                         already done it. */
                      <p
                        className={`mt-3 font-bold text-[#0f4d80] ${
                          tier.recommended ? 'text-3xl' : 'text-2xl'
                        }`}
                      >
                        {formatPrice(tier.price)}
                      </p>
                    )}
                    {tier.priceNote?.trim() && (
                      <p className="mt-1 inline-flex self-start rounded-md bg-[#e3f5e8] px-2 py-1 text-sm font-semibold text-[#176a2c]">
                        {tier.priceNote.trim()}
                      </p>
                    )}
                    <ul className="mt-4 space-y-2">
                      {tier.includes
                        .map((x) => x.trim())
                        .filter(Boolean)
                        .map((item, j) => (
                          <li key={j} className="flex gap-2 text-sm leading-relaxed text-[#374151]">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1d7a33]" />
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
                        <p className="border-t border-[#e3e8ef] pt-3 text-xs leading-relaxed text-[#6b7280]">
                          {tier.valueNote.trim()}
                        </p>
                      )}
                      {/* One button, two jobs, and the label always says which:
                          "Choose X" while unselected, "Continue with X" once it
                          is. Putting the next step in the card means the
                          decision and the action are in the same place — no
                          hunting for a separate control after choosing. */}
                      <span className="relative z-10 block pt-4">
                        <button
                          onClick={() => (on ? goToConfirm() : setPlan(tier.name))}
                          className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                            on
                              ? 'border-[#1669AE] bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white shadow-md shadow-[#1669AE]/25'
                              : promote
                                ? 'border-[#1669AE]/60 text-[#0f4d80] hover:bg-[#f3f9fd]'
                                : 'border-[#dce7f2] text-[#374151] hover:bg-[#f7f9fc]'
                          }`}
                        >
                          {on ? (
                            <>
                              Continue with {tier.name} <ArrowRight className="h-4 w-4" />
                            </>
                          ) : (
                            `Choose ${tier.name}`
                          )}
                        </button>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* NOTE: the "What Others Charge Extra For" value stack is
                deliberately NOT on this page. It stays in the PDF and the
                proposal email — see includedExtras.ts — but by the time someone
                is here they've read it once already and come to accept, not to
                be sold to again. */}

            {/* The "Everything in writing" disclosure lived here. Removed: it
                was the third copy of the scope (the email and the PDF both
                carry it), and the PDF is now one click away at the top of this
                page. Its terms have moved to step 2, next to the signature —
                see below. On step 1 they sat on a screen nobody signs anything
                on, which is the wrong place for fine print to earn its keep. */}

            {/* A sticky confirm bar lived here, restating the plan and price
                with its own Continue. Removed once the chosen card grew a
                "Continue with <plan>" button: two Continues on screen at the
                same time is the duplication this page keeps shedding, and the
                card's version is the better one — it names the plan and sits
                where the decision was made. */}
          </>
        )}

        {quote && step === 2 && (
          <>
            {/* Same header row as step 1 — eyebrow and details on the left,
                the same two action links on the right — so moving between the
                steps doesn't feel like moving between two designs. The plan was
                in a bordered card here, which made it the only card above the
                fold and read as another thing to act on. */}
            <div className="mb-8 flex items-start justify-between gap-4 sm:gap-8">
              <div className="min-w-0">
                {/* Above the block, not between the label and the value: it's a
                    back link for the step, and "YOUR PLAN → Pay Annually" is a
                    label/value pair that shouldn't have a control inside it. */}
                <button
                  onClick={() => setStep(1)}
                  className="-mt-1 mb-1 inline-flex items-center gap-1.5 py-2.5 text-sm font-semibold text-[#0f4d80] transition-colors hover:text-[#1669AE] hover:underline sm:py-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Change plan
                </button>
                {/* One line, no "Your plan" label above it. After "Confirm and
                    sign", with a Change plan link right there, a label saying
                    this is the plan is stating the obvious in three lines.

                    The NAME is left exactly as quoted — it's the admin's own
                    tier name and it's what the PDF, the email and the signed
                    record all say. Shortening it to "Annual plan" here would
                    make the page disagree with the document. */}
                <p className="font-display text-lg font-bold text-[#0a1628]">
                  {plan}
                  {chosen?.price && (
                    <>
                      <span className="font-normal text-[#9aa4b2]"> · </span>
                      <span className="text-[#0f4d80]">{formatPrice(chosen.price)}</span>
                    </>
                  )}
                </p>
              </div>
              {headerActions}
            </div>

            {/* A "Billing address" section lived here — same-as-service vs a
                different address, with the full address form behind it.
                Removed: nothing about scheduling or acceptance needs it, and
                billing details are collected when invoicing is set up. Asking
                for an address twice is friction on the one screen that should
                have none. */}

            <section className="mb-5 rounded-2xl border border-[#e3e8ef] bg-white p-5">
              <h2 className="mb-3 font-display text-base font-bold">
                Getting started <span className="text-sm font-normal text-[#6b7280]">(optional)</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Asked as a question, and about how SOON rather than "preferred
                    start date" — a form label invites a form answer, and this is
                    the field where someone quietly decides whether they're
                    starting this week or thinking about next month. */}
                <label className="text-sm text-[#6b7280]">
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
                <label className="text-sm text-[#6b7280]">
                  Gate code, pets, anything we should know
                  <input className={`${field} mt-1`} value={accessNotes}
                    onChange={(e) => setAccessNotes(e.target.value)} />
                </label>
              </div>
              <p className="mt-3 text-xs text-[#6b7280]">
                We&rsquo;ll confirm your first visit with you — the sooner you start, the sooner your pool
                is on a routine.
              </p>
            </section>

            <section className="mb-5 rounded-2xl border border-[#e3e8ef] bg-white p-5">
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
                        <a href="/service-agreement/" target="_blank" rel="noreferrer" className="text-[#0f4d80] underline">
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
                        <a href="/privacy-policy/" target="_blank" rel="noreferrer" className="text-[#0f4d80] underline">
                          Privacy Policy
                        </a>
                        .
                      </>
                    ),
                  },
                ].map((item) => (
                  <label key={item.key} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-[#1f2937]">
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

              {/* The chosen plan's own terms, on the screen where the signature
                  happens. They used to sit in a collapsed block on step 1 — a
                  screen nobody signs anything on — which is the wrong place for
                  fine print to earn its keep. Here they're in front of someone
                  at the moment they tick "I've read and agree". */}
              {chosen?.finePrint?.trim() && (
                <div className="mt-4 rounded-xl border border-[#e3e8ef] bg-[#f7f9fc] p-4">
                  <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                    {plan} — terms
                  </h3>
                  <p className="text-sm leading-relaxed text-[#374151]">{chosen.finePrint.trim()}</p>
                  <p className="mt-2 text-xs text-[#6b7280]">
                    The full scope of work is in your proposal.
                  </p>
                </div>
              )}

              {/*
                A ruled signature line, not another boxed form field.

                Every signed document does it this way — the name sits ON a
                rule, with "Signature" and the date captioned beneath — and it
                makes "your typed name IS the signature" legible without a
                caption explaining the concept. The previous version was a
                labelled input with a pen icon next to it, which read as a form
                asking for your name rather than a document being signed.

                Caveat is the site's script face (already used on the homepage)
                and is declared globally, so it swaps in when step 2 renders
                rather than being preloaded for a page that may never reach it.
              */}
              <div className="mt-6 border-t border-[#e3e8ef] pt-6">
                <label htmlFor="signature" className="block text-sm font-semibold text-[#1f2937]">
                  Sign to accept
                </label>
                <div className="mt-4 border-b-2 border-[#9fb3c8] transition-colors focus-within:border-[#1669AE]">
                  <input
                    id="signature"
                    className="w-full bg-transparent pb-1 text-3xl text-[#0a1628] placeholder-[#c3cedb] focus:outline-none"
                    style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder={quote.customerName}
                    autoComplete="name"
                  />
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                    Signature
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[#9aa4b2]">
                    {proposalDateLabel()}
                  </span>
                </div>
                <p className="mt-4 max-w-3xl text-xs leading-relaxed text-[#6b7280]">
                  Typing your name is your electronic signature. We record it with the date, time and IP
                  address as proof of acceptance.
                </p>
              </div>
            </section>

            {formError && (
              <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-[#f0c8c8] bg-[#fdf1f0] px-4 py-3 text-sm text-[#8c2f22]">
                <AlertCircle className="h-5 w-5 shrink-0 text-[#c0392b]" />
                {formError}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!canSubmit || busy}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark py-4 text-lg font-bold text-white shadow-lg shadow-brand-blue/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
              {busy ? 'Confirming…' : `Accept and start service`}
            </button>
            {!canSubmit && (
              <p className="mt-2 text-center text-xs text-[#6b7280]">
                Tick all three boxes and type your name to continue.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
};
