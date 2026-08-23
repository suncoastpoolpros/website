import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  LoaderCircle,
  AlertCircle,
  Phone,
  ArrowRight,
  ArrowLeft,
  Download,
  X,
} from 'lucide-react';
import { usePageMeta } from '@/lib/usePageMeta';
import { type ParsedQuoteLink, parseQuoteLink } from '@/lib/quoteLinks';
import { PRICING_CONDITION_TERM } from '@/components/admin/proposalTerms';
import { jobKindOf, showsConditionTerm } from '@/components/admin/jobKinds';
import {
  DECLINE_REASONS,
  declineReply,
  type DeclineReasonKey,
} from '@/components/admin/declineReasons';

/** Matches MAX_PHOTOS in the builder's PhotoPicker — the ceiling on how far
 *  the fetch loop below will walk before giving up. */
const MAX_PROPOSAL_PHOTOS = 8;
import {
  downloadBlob,
  proposalDataFromQuote,
  proposalDateLabel,
  proposalFilename,
  renderProposalPdf,
} from '@/lib/proposalPdf';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { ProposalBreakdown } from '@/components/ProposalBreakdown';

/**
 * Where a quote link lands. Three URL shapes, one page — see @/lib/quoteLinks:
 *
 *   /quote-1042-k7m2p9x     texted  — opens on the breakdown (step 0)
 *   /approve-1042-k7m2p9x   emailed — opens on the plans
 *   /approve/?t=<token>     legacy, and permanent: these are sitting in
 *                           customers' inboxes and cannot be reissued
 *
 * The last two are prerendered routes; the first two reach here via a rewrite in
 * public/_redirects plus the catch-all in App.tsx, because there can be no
 * static route per quote.
 *
 * Three steps in one route:
 *   0. The breakdown — what the service actually is. Only shown to someone who
 *      never got the PDF; see leadsWithBreakdown below.
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
  /** The PRICE has passed its validity window. The link itself never dies. */
  pricingStale?: boolean;
  pool: Pool;
  proposal: {
    tiers?: Tier[];
    price?: string;
    scope?: string;
    includeBenefits?: boolean;
    /** 'recurring' | 'recovery' | 'repair'. Absent on quotes stored before job
     *  kinds existed — jobKindOf coerces those to recurring, which is what they
     *  were built as. */
    jobKind?: string;
    /** 'link' when the quote was never emailed — see the breakdown step. */
    deliveredBy?: string;
  };
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

/**
 * Whether this customer should meet the breakdown before the pricing.
 *
 * Order matters. ?full=1 is the manual override and wins outright — it exists so
 * the breakdown can be checked without creating a link-only quote. Otherwise an
 * explicit link wins: /quote-… and /approve-… say which screen they open, and a
 * link that says what it does should not be second-guessed by a stored field.
 * Only the legacy ?t= form, which predates the distinction, falls back to how
 * the quote was delivered.
 */
const leadsWithBreakdown = (
  quote: { proposal?: { deliveredBy?: string } },
  link: ParsedQuoteLink | null,
): boolean => {
  if (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('full') === '1'
  )
    return true;
  if (link?.lead === 'breakdown') return true;
  if (link?.lead === 'plans') return false;
  return quote.proposal?.deliveredBy === 'link';
};

export const ApprovePage = () => {
  usePageMeta({
    title: 'Your Pool Service Proposal — Suncoast Pool Pros',
    description: 'Your quote from Suncoast Pool Pros — what’s included, what it costs, and how to accept.',
    // Points at itself rather than the homepage. Every quote URL rewrites here,
    // so this is the honest canonical for all of them; it stays noindex, so
    // naming it costs nothing and claiming "/" was simply wrong.
    canonicalPath: '/approve/',
    /**
     * Its own share card, not the sitewide marketing banner.
     *
     * This link is TEXTED to one person who has just asked for a price, and the
     * preview is the entire first impression — it arrives before they read a
     * word. A generic "Flat-Rate Weekly Pool Service" banner is an advert; this
     * says the thing waiting for them is their proposal.
     *
     * Versioned filename (-v1): /public is served immutable, so a changed card
     * MUST get a new name or the edge keeps serving the old one. Never request
     * a new image URL before it is deployed — a 404 gets cached too.
     */
    ogImage: 'https://suncoastpoolpros.com/og-quote-v1.jpg',
    ogImageAlt: 'Your pool service proposal from Suncoast Pool Pros',
    noindex: true,
  });

  const [state, setState] = useState<State>({ kind: 'loading' });
  /**
   * Step 0 is the breakdown — what the service is and what it covers — and only
   * exists for a customer who was sent a LINK rather than an email. They never
   * got the PDF or the email, so without it the page opens on two priced cards
   * explaining nothing. Someone who was emailed has read all of it twice and
   * starts at the plans.
   *
   * ?full=1 forces it on for any quote, so the breakdown can be checked without
   * creating a link-only one.
   */
  const [step, setStep] = useState<0 | 1 | 2>(1);
  /** Which reason they gave, once given. Drives the acknowledgement copy. */
  const [declined, setDeclined] = useState<DeclineReasonKey | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState<DeclineReasonKey | null>(null);
  const [declineNote, setDeclineNote] = useState('');
  const [decliningBusy, setDecliningBusy] = useState(false);

  /**
   * Send it, and close regardless of what the server says.
   *
   * A failure is logged but NOT shown. They answered the question we asked;
   * telling them it did not save would be asking them to do it a second time
   * for our benefit, and the likeliest outcome is that they simply leave.
   */
  const submitDecline = async () => {
    if (!declineReason || decliningBusy) return;
    setDecliningBusy(true);
    try {
      await fetch('/api/quote/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason: declineReason, note: declineNote.trim() }),
      });
    } catch {
      /* their answer is worth more than our record of it */
    } finally {
      setDeclined(declineReason);
      setDeclineOpen(false);
      setDecliningBusy(false);
    }
  };
  const [plan, setPlan] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [pdfState, setPdfState] = useState<'idle' | 'working' | 'error'>('idle');

  const [preferredStart, setPreferredStart] = useState('');
  const [accessNotes, setAccessNotes] = useState('');
  const [agree, setAgree] = useState({ requirements: false, service: false, privacy: false });
  const [signature, setSignature] = useState('');
  /** Only asked for when the quote carries no address — i.e. it was texted. */
  const [contactEmail, setContactEmail] = useState('');

  /**
   * The link the customer arrived on. Three shapes are honoured — see
   * parseQuoteLink — and the word in the path decides which screen opens first:
   * /quote-… leads with the breakdown, /approve-… and legacy ?t= links lead with
   * the plans.
   */
  const link =
    typeof window === 'undefined'
      ? null
      : parseQuoteLink(window.location.pathname, window.location.search);
  const token = link?.token ?? '';

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
          else {
            setState({ kind: 'ready', quote: q });
            // Set here rather than in the initial useState: whether this quote
            // was emailed isn't known until it has loaded.
            if (leadsWithBreakdown(q, link)) setStep(0);
          }
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
  const showsBreakdown = !!quote && leadsWithBreakdown(quote, link);
  /**
   * Old pricing: readable, not signable. The proposal still renders in full —
   * they were sent it and may have saved or forwarded the link — but accepting
   * would lock in a figure that may no longer hold, so the last step routes to
   * a phone call instead of a signature.
   */
  const pricingStale = !!quote?.pricingStale;
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
  /**
   * The photos that were attached to this proposal, fetched only now.
   *
   * Walks indexes from 0 and stops at the first empty answer, so nothing has to
   * be told how many there are and page load pays nothing — these are 2–3 MB
   * for a full set, and the approve page is the one thing a customer must load
   * to accept. One request per photo keeps each response small; eight of them
   * in a single body risks D1's result limit and stalls on a phone.
   *
   * Any failure returns what it has. The emailed PDF is the copy of record and
   * still has every photo; a download missing one is worth far less than a
   * download that refuses to happen.
   */
  const fetchPhotos = useCallback(async (t: string): Promise<string[]> => {
    const out: string[] = [];
    for (let i = 0; i < MAX_PROPOSAL_PHOTOS; i += 1) {
      try {
        const res = await fetch(`/api/quote/photo?t=${encodeURIComponent(t)}&i=${i}`);
        if (!res.ok) break;
        const data = (await res.json()) as { dataUrl?: string | null };
        if (!data.dataUrl) break;
        out.push(data.dataUrl);
      } catch {
        break;
      }
    }
    return out;
  }, []);

  const downloadPdf = useCallback(async () => {
    if (!quote || pdfState === 'working') return;
    setPdfState('working');
    try {
      const blob = await renderProposalPdf({
        data: proposalDataFromQuote(quote),
        dateLabel: proposalDateLabel(quote.createdAt),
        // Without these the customer's download was the emailed proposal with
        // the photographs silently missing — the same document by number and
        // by wording, quietly not the same document.
        photos: await fetchPhotos(token),
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
  }, [quote, pdfState, token, fetchPhotos]);

  /** Move to the signing step. Used by the chosen card's button and the bar. */
  const goToConfirm = useCallback(() => {
    setStep(2);
    window.scrollTo({ top: 0 });
  }, []);

  /**
   * A texted quote has no email on record, so the confirmation would have
   * nowhere to go and there'd be no address to invoice from. Asked for here —
   * one field, at the moment they're already committing — rather than up front,
   * where demanding it is what made these leads unquotable in the first place.
   */
  const needsEmail = !!quote && !quote.customerEmail?.trim();
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail.trim());

  const canSubmit =
    !!plan &&
    agree.requirements &&
    agree.service &&
    agree.privacy &&
    signature.trim().length >= 2 &&
    (!needsEmail || emailOk);

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
            // The email is only sent when it was asked for; the endpoint fills a
            // blank address and never overwrites one a proposal was sent to.
            ...(needsEmail && emailOk ? { customerEmail: contactEmail.trim() } : {}),
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
  }, [canSubmit, busy, token, plan, preferredStart, accessNotes, agree, signature, needsEmail, emailOk, contactEmail]);

  /**
   * Who the proposal is for: the number, the name or address, and how to reach
   * them.
   *
   * Defined once because BOTH steps render it and the two copies HAD ALREADY
   * DRIFTED — step 1 showed the customer's email and phone, step 0 showed only
   * the name and address, so the same header said different things depending
   * which screen you were on. That is exactly the failure headerActions below
   * was written to avoid.
   *
   * Every part is conditional: a texted quote may have no name, no email, or
   * neither, and nothing here may render an empty row.
   */
  const customerIdentity = quote ? (
    <div className="min-w-0">
    {/* Only offered to customers who actually started on the
        breakdown — for anyone else it would point at a step they
        have never seen. And only FROM step 1: on step 0 this is the
        page you are already on, so it would point at itself. */}
    {showsBreakdown && step === 1 && (
      <button
        onClick={() => {
          setStep(0);
          window.scrollTo({ top: 0 });
        }}
        className="-mt-1 mb-1 inline-flex items-center gap-1.5 py-2.5 text-sm font-semibold text-[#0f4d80] transition-colors hover:text-[#1669AE] hover:underline sm:py-1"
      >
        <ArrowLeft className="h-4 w-4" /> What&apos;s included
      </button>
    )}
    {/* The number takes this slot when there is one. It's the same
        number on the PDF and in the email subject, so it identifies
        the document; "Prepared for" only labelled a name that needs
        no label. Falls back for quotes sent before numbering. */}
    <Eyebrow>{quote.number ? `Proposal #${quote.number}` : 'Prepared for'}</Eyebrow>
    {/* A quote can be saved with no name — a pool is quoted from
        its address. When there isn't one the address is promoted to
        the strong line rather than leaving an empty row above it. */}
    {quote.customerName.trim() ? (
      <>
        <p className="font-semibold text-[#0a1628]">{quote.customerName.trim()}</p>
        {quote.customerAddress?.trim() && (
          <p className="text-sm text-[#374151]">{quote.customerAddress.trim()}</p>
        )}
      </>
    ) : (
      quote.customerAddress?.trim() && (
        <p className="font-semibold text-[#0a1628]">{quote.customerAddress.trim()}</p>
      )
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
  ) : null;

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
            {state.kind === 'accepted'
              ? 'You’re all set'
              : step === 2
                ? 'Confirm and sign'
                : 'Your proposal'}
          </h1>
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

        {quote && step === 0 && (
          <>
            <div className="mb-8 flex items-start justify-between gap-4 sm:gap-8">
              {customerIdentity}
              {headerActions}
            </div>

            <ProposalBreakdown
              pool={quote.pool}
              scope={quote.proposal.scope}
              includeBenefits={quote.proposal.includeBenefits !== false}
            />

            <button
              onClick={() => {
                setStep(1);
                window.scrollTo({ top: 0 });
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark py-4 text-lg font-bold text-white shadow-lg shadow-brand-blue/25"
            >
              See your pricing <ArrowRight className="h-5 w-5" />
            </button>
          </>
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
              {customerIdentity}

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
                    {/* "Everything in <base>, plus:" — the PDF and the email
                        both print this, and without it the upgrade card reads
                        as though those few bullets are ALL you get, with no
                        mention of the pool service itself. Names the plan
                        rather than a position, so it still reads correctly on a
                        phone where this card is shown first. */}
                    {i > 0 && tiers[i - 1]?.name?.trim() && (
                      <p className="mt-4 text-sm font-bold text-[#0a1628]">
                        Everything in {tiers[i - 1].name.trim()}, plus:
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
                    {/* The note and the button are bottom-anchored TOGETHER, so
                        they line up across both cards however much each one has
                        to say — side by side the shorter card's slack lands
                        above its note rather than under the button.

                        There used to be a rule above the note to "close" that
                        slack. Removed: the notes align across the cards anyway,
                        and on mobile the cards stack and size to their own
                        content, so the gap is zero and the rule was pure
                        furniture. */}
                    <div className="mt-auto">
                      {tier.valueNote?.trim() && (
                        <p className="pt-3 text-xs leading-relaxed text-[#6b7280]">
                          {tier.valueNote.trim()}
                        </p>
                      )}
                      {/* One button, two jobs: "Choose" while unselected,
                          "Continue" once it is. Putting the next step in the
                          card means the decision and the action are in the same
                          place — no hunting for a separate control after
                          choosing.

                          The plan name is SR-ONLY, not dropped. It read
                          "Choose Pay Annually", which is a lot of words for a
                          button sitting directly under a heading that already
                          says Pay Annually. But a screen-reader user listing
                          the buttons on this page would otherwise hear "Choose"
                          twice with nothing to tell them apart, so the name is
                          still in the accessible name even though it is no
                          longer on screen. */}
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
                              Continue
                              <span className="sr-only"> with {tier.name}</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Choose
                              <span className="sr-only"> {tier.name}</span>
                            </>
                          )}
                        </button>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/*
              The third box, under the two plans.

              PLACED HERE ON PURPOSE, at the point of decision rather than
              tucked in a footer. The reasoning is that somebody who has read
              the price and decided against it is the one person whose answer is
              worth having, and they are about to close the tab — a link three
              screens away never reaches them.

              The trade is real and worth naming: an exit beside a decision
              costs some conversions, because a "no" that would otherwise have
              been a "not yet" can now be given in one tap. It is mitigated by
              WEIGHT rather than by hiding it. This is deliberately not a third
              plan card — no price, no border of its own, muted type, and it
              sits BELOW the grid rather than inside it, so it reads as "none of
              these?" rather than as a third option with equal standing.

              The wording carries no guilt and asks for nothing but a tap. A
              customer doing us the favour of explaining should not have to read
              a sentence that sounds like an accusation.
            */}
            {!declined && (
              <div className="mt-6 rounded-2xl border border-[#e3e8ef] bg-[#f7f9fc] px-5 py-4 text-center">
                <p className="text-[15px] font-semibold text-[#1f2937]">Going a different route?</p>
                <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-[#6b7280]">
                  We&rsquo;d still like to hear from you. Whether you&rsquo;ve chosen another company
                  or simply decided the timing isn&rsquo;t right, telling us why takes one tap
                  &mdash; and it&rsquo;s genuinely the most useful thing anyone can do for a small
                  business like ours.
                </p>
                <button
                  onClick={() => setDeclineOpen(true)}
                  className="mt-3 text-sm font-semibold text-brand-blue underline underline-offset-4 hover:text-brand-blue-dark"
                >
                  Share your feedback
                </button>
              </div>
            )}

            {/* Once they have told us, the box becomes the acknowledgement —
                the reply is written per reason, because two of them are
                recoverable and a screen that just says "thanks" wastes the last
                moment anyone is paying attention. The plans stay on screen and
                the link keeps working: declining is not a door closing. */}
            {declined && (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-center">
                <p className="text-[15px] font-semibold text-green-900">Thank you — that helps.</p>
                <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-green-800">
                  {declineReply(declined)}
                </p>
              </div>
            )}

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
                {/* Same eyebrow slot as step 1, so the number stays visible on
                    the screen where they sign. */}
                {quote.number ? <Eyebrow>{`Proposal #${quote.number}`}</Eyebrow> : null}
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
              {/* Always "(optional)" now. The email field that used to sit in
                  here was the one REQUIRED thing in an optional section; it has
                  moved next to the signature. */}
              <h2 className="mb-3 font-display text-base font-bold">
                Getting started{' '}
                <span className="text-sm font-normal text-[#6b7280]">(optional)</span>
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
              {/* The condition the PRICE assumes — on RECURRING work only, and
                  this is the more important of the two places it is gated.
                  "Pricing assumes the pool is clean and in balanced condition
                  when service begins" is the LAST thing read before a
                  signature, and on a green-to-clean — where the pool being
                  filthy is the entire job — it reads as a trapdoor to raise the
                  price on arrival. Removing it from the PDF while leaving it
                  here would have fixed the copy nobody signs and kept it on the
                  one they do. */}
              <div className="mt-4 rounded-xl border border-[#e3e8ef] bg-[#f7f9fc] p-4">
                <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                  {plan ? `${plan} — terms` : 'Terms'}
                </h3>
                {chosen?.finePrint?.trim() && (
                  <p className="text-sm leading-relaxed text-[#374151]">{chosen.finePrint.trim()}</p>
                )}
                {showsConditionTerm(jobKindOf(quote.proposal?.jobKind)) && (
                  <p className={`text-sm leading-relaxed text-[#374151] ${chosen?.finePrint?.trim() ? 'mt-2' : ''}`}>
                    {PRICING_CONDITION_TERM}
                  </p>
                )}
                <p className="mt-2 text-xs text-[#6b7280]">
                The full scope of work is in your proposal.
                </p>
              </div>

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
              {/*
                Shown only when the quote carries no email — a texted lead who
                never gave one. It sits HERE, directly above the signature,
                rather than up in "Getting started" where it used to live.

                Two reasons. It is REQUIRED to submit, and that section is
                headed "(optional)" — a required field inside an optional
                section is a trap: you fill in what looks like it matters, press
                the button and get bounced back up the page with no idea why.
                And an address handed over at the moment of signing reads as
                part of completing the document, which is what it is, rather
                than as one more thing being collected.
              */}
              {needsEmail && (
                <div className="mt-6 rounded-xl border border-[#dbe6f3] bg-[#f5f9fd] p-4">
                  <label htmlFor="contact-email" className="block text-sm font-semibold text-[#1f2937]">
                    Where should we send your signed copy?
                  </label>
                  <p className="mt-1 text-xs leading-relaxed text-[#6b7280]">
                    We don&rsquo;t have an email address for you yet. Your confirmation and every
                    service report after a visit go here.
                  </p>
                  <input
                    id="contact-email"
                    className={`${field} mt-2`}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                  {contactEmail.trim() !== '' && !emailOk && (
                    <p className="mt-1.5 text-xs text-[#c0392b]">
                      That doesn&rsquo;t look like an email address.
                    </p>
                  )}
                </div>
              )}

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
                    placeholder={quote.customerName.trim() || 'Your full name'}
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

            {pricingStale ? (
              <div className="rounded-xl border border-[#e0c9a0] bg-[#fdf6e9] p-5 text-center">
                <p className="font-semibold text-[#0a1628]">
                  This pricing is from {proposalDateLabel(quote.createdAt)}.
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#6b5836]">
                  Give us a call and we&rsquo;ll confirm it still stands, or send you a fresh quote
                  — it only takes a minute.
                </p>
                <a
                  href={PHONE_HREF}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark px-6 py-3.5 text-lg font-bold text-white shadow-lg shadow-brand-blue/25"
                >
                  <Phone className="h-5 w-5" /> {PHONE_DISPLAY}
                </a>
              </div>
            ) : (
              <button
                onClick={submit}
                disabled={!canSubmit || busy}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark py-4 text-lg font-bold text-white shadow-lg shadow-brand-blue/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
                {busy ? 'Confirming…' : `Accept and start service`}
              </button>
            )}
            {!pricingStale && !canSubmit && (
              <p className="mt-2 text-center text-xs text-[#6b7280]">
                {needsEmail && !emailOk
                  ? 'Add your email, tick all three boxes and type your name to continue.'
                  : 'Tick all three boxes and type your name to continue.'}
              </p>
            )}
          </>
        )}
      </div>

      {/* The reason sheet.
          One question, six taps, and an optional note nobody is obliged to
          fill in. Every extra field here is a reason to close the tab instead,
          so there is no email box, no signature and no confirmation step: they
          have already decided, and this is a favour they are doing us. */}
      {declineOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Tell us why"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeclineOpen(false);
          }}
        >
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0a1628]">What made the difference?</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#6b7280]">
                  One tap is plenty. Nothing here commits you to anything, and your quote stays
                  live either way.
                </p>
              </div>
              <button
                onClick={() => setDeclineOpen(false)}
                aria-label="Close"
                className="-mr-1 -mt-1 rounded-lg p-2 text-[#9aa3b0] hover:bg-[#f1f5f9] hover:text-[#0a1628]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {DECLINE_REASONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setDeclineReason(r.key)}
                  aria-pressed={declineReason === r.key}
                  className={`rounded-xl border px-4 py-3 text-left text-[15px] transition-colors ${
                    declineReason === r.key
                      ? 'border-brand-blue bg-[#eef6fb] font-semibold text-[#0a1628]'
                      : 'border-[#e3e8ef] text-[#374151] hover:border-[#c8d4e0] hover:bg-[#f7f9fc]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                Anything else? (optional)
              </span>
              <textarea
                rows={3}
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e3e8ef] p-3 text-[15px] text-[#0a1628] focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
              />
            </label>

            <button
              onClick={submitDecline}
              disabled={!declineReason || decliningBusy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3.5 text-[15px] font-bold text-white hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {decliningBusy ? 'Sending…' : 'Send feedback'}
            </button>
            <p className="mt-2 text-center text-xs text-[#9aa3b0]">
              This doesn&rsquo;t cancel anything — you can still accept later.
            </p>
          </div>
        </div>
      )}
    </main>
  );
};
