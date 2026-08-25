import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  LoaderCircle,
  AlertCircle,
  Phone,
  ArrowRight,
  ArrowLeft,
  Download,
  X,
} from "lucide-react";
import { usePageMeta } from "@/lib/usePageMeta";
import { type ParsedQuoteLink, parseQuoteLink } from "@/lib/quoteLinks";
import { PRICING_CONDITION_TERM } from "@/components/admin/proposalTerms";
import { jobKindOf, showsConditionTerm } from "@/components/admin/jobKinds";
import { cadenceLabel } from "@/components/admin/serviceCadence";
import { splitTierIncludes } from "@/lib/adminApi";
import {
  EXTRAS_ALSO_INCLUDED_HEADING,
  EXTRAS_NOT_INCLUDED_HEADING,
} from "@/components/admin/includedExtras";
import { ALL_COMPLETE_DIFFERENTIATORS } from "@/components/admin/filterService";
import {
  currentExcludes,
  currentTagline,
  currentValueNote,
  shortBillingNote,
  shortBullet,
} from "@/components/admin/tierPresets";
import {
  DECLINE_REASONS,
  declineReply,
  type DeclineReasonKey,
} from "@/components/admin/declineReasons";

/** Matches MAX_PHOTOS in the builder's PhotoPicker — the ceiling on how far
 *  the fetch loop below will walk before giving up. */
const MAX_PROPOSAL_PHOTOS = 8;
import {
  downloadBlob,
  proposalDataFromQuote,
  proposalDateLabel,
  proposalFilename,
  renderProposalPdf,
} from "@/lib/proposalPdf";
import { EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF, SMS_HREF } from "@/lib/contact";
import { ProposalBreakdown } from "@/components/ProposalBreakdown";

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
  /** The quiet disclosure under the button. */
  billingNote?: string;
  /** Leading `includes` that are the shared service; the rest are extras. */
  sharedCount?: number;
  /** Legacy: the same split when extras led instead. Read, never written. */
  extrasCount?: number;
  tagline: string;
  includes: string[];
  /** The Essentials comparison plan — never set on a two-plan quote. */
  essentials?: boolean;
  /** What that plan leaves out, shown as muted ✗ rows under the inclusions. */
  excludes?: string[];
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
    /** 'weekly' | 'biweekly'. Absent before the field existed — cadenceOf
     *  returns null there and the cards print no cadence, deliberately. */
    cadence?: string;
    /** 'link' when the quote was never emailed — see the breakdown step. */
    deliveredBy?: string;
  };
  acceptedAt: string | null;
  acceptedPlan: string | null;
};

type State =
  | { kind: "loading" }
  | { kind: "ready"; quote: Quote }
  | { kind: "accepted"; plan: string }
  | { kind: "error"; message: string };

const formatPrice = (raw: string): string => {
  const s = (raw ?? "").trim();
  if (!s) return "";
  return /^[0-9]/.test(s) ? `$${s}` : s;
};

const field =
  "h-12 w-full rounded-xl border border-[#cbd5e1] bg-white px-4 text-[#0a1628] placeholder-[#9aa4b2] focus:border-[#1669AE] focus:outline-none";

/** Small caps heading for the two confirmation blocks. */
const Eyebrow = ({ children }: { children: string }) => (
  <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
    {children}
  </h2>
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
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("full") === "1"
  )
    return true;
  if (link?.lead === "breakdown") return true;
  if (link?.lead === "plans") return false;
  return quote.proposal?.deliveredBy === "link";
};

/**
 * Whether to OPEN on the breakdown — a narrower question than whether the
 * breakdown is reachable at all.
 *
 * A three-plan quote never opens there. That screen exists to argue one thing
 * — everything is in your rate, nobody invoices you later — and it is the one
 * argument a three-plan quote deliberately complicates, because the card on
 * the left is the plan that does bill you later. Making the customer read the
 * all-inclusive case before showing them a plan that opts out of it sells
 * against the page that follows.
 *
 * It is also no longer needed there. The comparison the breakdown used to
 * carry now lives on the cards themselves — ✓ against ✗, row for row — so the
 * plans screen makes the argument and takes the decision in one place.
 *
 * ?full=1 still wins, and the breakdown stays REACHABLE for anyone who would
 * otherwise have landed on it: see showsBreakdown, which is what keeps the
 * value stack one click away for a texted lead who has no PDF.
 */
const opensOnBreakdown = (
  quote: { proposal?: { deliveredBy?: string; tiers?: unknown[] } },
  link: ParsedQuoteLink | null,
): boolean => {
  if (!leadsWithBreakdown(quote, link)) return false;
  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("full") === "1"
  )
    return true;
  const tiers = quote.proposal?.tiers;
  return !(Array.isArray(tiers) && tiers.length >= 3);
};

/** Links in the footer lines: colour and weight, with the underline held back
 *  for hover. Four underlined links in two sentences read as clutter. */
const quietLink =
  "font-semibold text-brand-blue hover:text-brand-blue-dark hover:underline underline-offset-4";

export const ApprovePage = () => {
  usePageMeta({
    title: "Your Pool Service Proposal — Suncoast Pool Pros",
    description:
      "Your quote from Suncoast Pool Pros — what’s included, what it costs, and how to accept.",
    // Points at itself rather than the homepage. Every quote URL rewrites here,
    // so this is the honest canonical for all of them; it stays noindex, so
    // naming it costs nothing and claiming "/" was simply wrong.
    canonicalPath: "/approve/",
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
    ogImage: "https://suncoastpoolpros.com/og-quote-v1.jpg",
    ogImageAlt: "Your pool service proposal from Suncoast Pool Pros",
    noindex: true,
  });

  const [state, setState] = useState<State>({ kind: "loading" });
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
  const [declineReason, setDeclineReason] = useState<DeclineReasonKey | null>(
    null,
  );
  const [declineNote, setDeclineNote] = useState("");
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
      await fetch("/api/quote/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          reason: declineReason,
          note: declineNote.trim(),
        }),
      });
    } catch {
      /* their answer is worth more than our record of it */
    } finally {
      setDeclined(declineReason);
      setDeclineOpen(false);
      setDecliningBusy(false);
    }
  };
  const [plan, setPlan] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [pdfState, setPdfState] = useState<"idle" | "working" | "error">(
    "idle",
  );

  const [preferredStart, setPreferredStart] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  /** One box, covering all three documents named in its label. */
  const [agree, setAgree] = useState({ all: false });
  const [signature, setSignature] = useState("");
  /** Only asked for when the quote carries no address — i.e. it was texted. */
  const [contactEmail, setContactEmail] = useState("");

  /**
   * The link the customer arrived on. Three shapes are honoured — see
   * parseQuoteLink — and the word in the path decides which screen opens first:
   * /quote-… leads with the breakdown, /approve-… and legacy ?t= links lead with
   * the plans.
   */
  const link =
    typeof window === "undefined"
      ? null
      : parseQuoteLink(window.location.pathname, window.location.search);
  const token = link?.token ?? "";

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
    style.background = "#eef2f7";
    body.background = "#eef2f7";
    return () => {
      style.background = prevHtml;
      body.background = prevBody;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setState({
        kind: "error",
        message:
          "That link looks incomplete. Please use the button in your email.",
      });
      return;
    }
    let active = true;
    fetch(`/api/quote/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          quote?: Quote;
          error?: string;
        };
        if (!active) return;
        if (res.ok && data.ok && data.quote) {
          const q = data.quote;
          if (q.acceptedAt && q.acceptedPlan)
            setState({ kind: "accepted", plan: q.acceptedPlan });
          else {
            setState({ kind: "ready", quote: q });
            // Set here rather than in the initial useState: whether this quote
            // was emailed isn't known until it has loaded.
            if (opensOnBreakdown(q, link)) setStep(0);
          }
          return;
        }
        setState({
          kind: "error",
          message:
            data.error === "expired"
              ? "This quote has expired. Give us a call and we’ll send a fresh one."
              : "We couldn’t find that quote. Please use the button in your email, or give us a call.",
        });
      })
      .catch(
        () =>
          active &&
          setState({
            kind: "error",
            message: "Something went wrong loading your quote.",
          }),
      );
    return () => {
      active = false;
    };
  }, [token]);

  const quote = state.kind === "ready" ? state.quote : null;
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
  /** The Essentials layout — the only shape with labelled comparison blocks. */
  const threePlan = tiers.some((t) => t.essentials);
  /*
   * Both block labels share these metrics so the rows beneath them start at
   * the same height on every card. "Not included" and "Also included" are
   * twins: label one block and its rows drop a line below the rows they pair
   * with, which is the alignment the whole comparison rests on.
   */
  const blockLabelClass =
    "mt-5 text-[10px] font-semibold uppercase tracking-wider text-[#a3acb8]";
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
    const pad = (n: number) => String(n).padStart(2, "0");
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
        const res = await fetch(
          `/api/quote/photo?t=${encodeURIComponent(t)}&i=${i}`,
        );
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
    if (!quote || pdfState === "working") return;
    setPdfState("working");
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
      setPdfState("idle");
    } catch {
      // The PDF is attached to their email too, so this is a convenience
      // failing, not a dead end — the message below says so.
      setPdfState("error");
    }
  }, [quote, pdfState, token, fetchPhotos]);

  /** Move to the signing step. Used by the chosen card's button and the bar. */
  const goToConfirm = useCallback(() => {
    setStep(2);
    window.scrollTo({ top: 0 });
  }, []);

  /**
   * Picking a plan is ONE action, not two.
   *
   * It used to select the card — ring, badge swap, button relabelled to
   * "Continue" — and wait for a second press. That is a step the customer never
   * asked for: they had already decided by the time they reached for the
   * button, and the interface answered by admiring the decision instead of
   * acting on it. The selected styling stays for the one case where it is
   * genuinely useful — coming BACK from the signature step, where it says which
   * plan you are partway through.
   */
  const selectPlan = useCallback(
    (name: string) => {
      setPlan(name);
      goToConfirm();
    },
    [goToConfirm],
  );

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
    agree.all &&
    signature.trim().length >= 2 &&
    (!needsEmail || emailOk);

  const submit = useCallback(async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setFormError("");
    try {
      const res = await fetch("/api/quote/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          plan,
          onboarding: {
            // No billing fields: this page no longer asks. The endpoint records
            // "not collected" rather than defaulting to "same as service".
            // The email is only sent when it was asked for; the endpoint fills a
            // blank address and never overwrites one a proposal was sent to.
            ...(needsEmail && emailOk
              ? { customerEmail: contactEmail.trim() }
              : {}),
            preferredStart,
            accessNotes,
            // One box in the UI, three on the record — the label names all
            // three documents, and accept.ts still demands each one.
            agreeRequirements: agree.all,
            agreeService: agree.all,
            agreePrivacy: agree.all,
            signature: signature.trim(),
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        plan?: string;
      };
      if (res.ok && data.ok)
        setState({ kind: "accepted", plan: data.plan ?? plan });
      else
        setFormError(
          "We couldn’t record that. Please try again, or give us a call.",
        );
    } catch {
      setFormError("Something went wrong. Please give us a call.");
    } finally {
      setBusy(false);
    }
  }, [
    canSubmit,
    busy,
    token,
    plan,
    preferredStart,
    accessNotes,
    agree,
    signature,
    needsEmail,
    emailOk,
    contactEmail,
  ]);

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
      <Eyebrow>
        {quote.number ? `Proposal #${quote.number}` : "Prepared for"}
      </Eyebrow>
      {/* A quote can be saved with no name — a pool is quoted from
        its address. When there isn't one the address is promoted to
        the strong line rather than leaving an empty row above it. */}
      {quote.customerName.trim() ? (
        <>
          <p className="font-semibold text-[#0a1628]">
            {quote.customerName.trim()}
          </p>
          {quote.customerAddress?.trim() && (
            <p className="text-sm text-[#374151]">
              {quote.customerAddress.trim()}
            </p>
          )}
        </>
      ) : (
        quote.customerAddress?.trim() && (
          <p className="font-semibold text-[#0a1628]">
            {quote.customerAddress.trim()}
          </p>
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
          <span className="block break-words sm:inline">
            {quote.customerEmail.trim()}
          </span>
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
        disabled={pdfState === "working"}
        className="inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-[#0f4d80] transition-colors hover:text-[#1669AE] hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:no-underline sm:py-1"
      >
        {pdfState === "working" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {pdfState === "working"
          ? "Preparing your PDF…"
          : "Download full proposal"}
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
      {pdfState === "error" && (
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
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#6b7280]">
            Suncoast Pool Pros
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
            {state.kind === "accepted"
              ? "You’re all set"
              : step === 2
                ? "Confirm and sign"
                : "Your proposal"}
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
          {state.kind !== "error" && (
            <a
              href={PHONE_HREF}
              className={`mt-4 items-center gap-2 rounded-full border border-[#dce7f2] bg-white px-4 py-3 text-sm font-semibold text-[#0a1628] transition-colors hover:border-[#1669AE] hover:bg-[#f3f6fb] ${
                // The header row carries the phone on every width now, so the
                // pill only appears on the screens that have no header row:
                // step 2, loading, accepted, error.
                contactInHeaderRow
                  ? "hidden"
                  : "inline-flex md:absolute md:right-0 md:top-0 md:mt-0 md:py-2"
              }`}
            >
              <Phone className="h-4 w-4 shrink-0 text-[#1669AE]" />
              {!contactInHeaderRow && (
                <span className="hidden lg:inline">Questions?</span>
              )}
              {PHONE_DISPLAY}
            </a>
          )}
        </div>

        {state.kind === "loading" && (
          <div className="flex justify-center py-16">
            <LoaderCircle className="h-8 w-8 animate-spin text-[#1669AE]" />
          </div>
        )}

        {state.kind === "error" && (
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

        {state.kind === "accepted" && (
          <div className="rounded-2xl border border-[#bfe7c6] bg-[#eefaf0] p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#bfe7c6] bg-white">
              <Check className="h-7 w-7 text-[#1d7a33]" strokeWidth={3} />
            </div>
            <p className="text-lg font-semibold">
              Your <span className="text-[#0f4d80]">{state.plan}</span> plan is
              confirmed.
            </p>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-[#374151]">
              You’ll receive your first invoice on your first scheduled service
              date. We’ll reach out to confirm that date, and with any questions
              we have.
            </p>
            <p className="mt-5 text-sm text-[#6b7280]">
              A copy is on its way to your inbox.
            </p>
          </div>
        )}

        {quote && step === 0 && (
          <>
            <div className="mb-8 flex items-start justify-between gap-4 sm:gap-8">
              {customerIdentity}
              {headerActions}
            </div>

            <ProposalBreakdown
              hasEssentials={tiers.some((t) => t.essentials)}
              jobKind={quote.proposal?.jobKind}
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

            {/* THE ONE FACT THIS PAGE WAS MISSING: that the number has a
                shelf life.
                Until now the page answered "do I have to decide today?" with
                silence, and silence means later — which is where quotes die.
                The date is already on every quote (expires_at, 30 days) and
                already enforced server-side; it was simply never shown.

                "Held", not "good until". The LINK does not expire — after the
                window the page still loads and asks them to call, and it says
                so in its own words a few hundred pixels below. Held is also
                the truer verb for what the business does: it reads as a
                reservation being kept for them rather than a deadline being
                enforced on them, and it is the one we would actually honour a
                day or two past.

                Hidden once the window has passed, where the amber stale-price
                notice takes over and a second date would only confuse. */}
            {!pricingStale && quote.expiresAt && (
              <p className="mb-4 text-center text-sm text-[#6b7280] sm:mb-0">
                Pricing held until{" "}
                <span className="font-semibold text-[#0a1628]">
                  {proposalDateLabel(quote.expiresAt)}
                </span>
                .
              </p>
            )}

            {/* sm:mt-24 is the lift's clearance, which used to live on the
                "choose the plan" line above. That line is gone — two priced
                cards with Select buttons do not need to be told they are a
                choice — but the lifted card still has to buy its 40px from
                somewhere, and now it is the customer block above. The visible
                gap is this margin MINUS the lift: 96 - 40 = 56px above the
                banner, and 96px above the plain card.

                items-start, so each card ends where its own content ends
                rather than being stretched to the taller one. Both cards used
                to carry the same six lines and stretching filled the shorter
                one harmlessly; now the annual card lists ten, so stretching the
                monthly card to match opens a hole above its fine print with
                nothing to put in it.

                This does NOT affect the Select buttons. They line up because
                the featured card is lifted by exactly its banner's height, so
                both card bodies begin on the same line — a relationship that
                has nothing to do with how the cards END.

                Wider gutter side by side than stacked. At gap-4 the two cards
                read as one block with a seam down it, and the lifted card's
                shadow ran straight into its neighbour. Doubling it lets each
                card be its own object — which is the point, since the customer
                is being asked to tell them apart. Vertical spacing on a phone
                stays as it was: stacked, they are already unmistakably two
                things. */}
            {/* Two columns for the standard proposal, three when the
                Essentials comparison plan is attached. The two-plan geometry
                below (banner height, both lifts, the compensating padding) is
                unchanged — three cards simply share the row, with a tighter
                gutter because the same gap across three columns squeezed the
                cards themselves. */}
            <div
              className={`grid grid-cols-1 items-start gap-4 ${
                tiers.length >= 3
                  ? "lg:mt-24 lg:grid-cols-3 lg:gap-5"
                  : "sm:mt-24 sm:grid-cols-2 sm:gap-8"
              }`}
            >
              {tiers.map((tier, i) => {
                /**
                 * NOTHING ON THIS SCREEN IS "SELECTED".
                 *
                 * Select takes the customer straight to the signature, so a
                 * selected state would exist for a few milliseconds on the way
                 * out and never be seen. Everything that served it is gone: the
                 * radio circle, the ring, the border swap, the button changing
                 * colour. What is left describes the PLANS — recommended or
                 * not — rather than the state of a choice being made.
                 */
                return (
                  <div
                    key={i}
                    className={`relative flex flex-col overflow-hidden rounded-2xl border text-left ${
                      // Recommended leads on a phone: stacked, the upgrade would
                      // otherwise sit below the fold under the option it's meant
                      // to beat. Side by side on desktop, natural order reads
                      // cheaper-then-better — which only works as anchoring if
                      // the better one visually dominates, hence the ring below.
                      /* Lifted by EXACTLY the banner's height (h-12 / -mt-12).
                         That is what makes the two cards line up, rather than
                         compensating paddings that break the moment a tagline
                         wraps: the banner occupies the space the lift creates,
                         so both bodies begin on the same line and the buttons
                         follow for free. The card stands proud of the row and
                         nothing below it is knocked out of true.

                         THE TWO VALUES MUST STAY EQUAL — change the banner
                         height and change this with it.

                         Desktop only: stacked on a phone there is no row to
                         rise above. */
                      /* And the PLAIN card rises HALF the banner (-mt-5), so
                         its top edge cuts the blue bar through the middle
                         instead of stopping at its lower edge. Two card tops
                         and a banner edge on three different lines read as
                         drift; landing one of them mid-banner reads as a
                         deliberate stagger.

                         The 24px is given straight back as top padding on the
                         body below (sm:pt-11 against a p-5 base), so the box
                         grows upward and the heading does not move. That is the
                         whole trick — the bodies still begin on the same line,
                         so the buttons still line up, and the rule above holds
                         unchanged. Half of h-12 is mt-6, and p-5 + 24px is
                         pt-11: all four move together or not at all. */
                      /* The breakpoint MUST match the grid's above: three
                         cards stay stacked until lg, and a negative margin in
                         a stacked column pulls each card onto the one before
                         it. Written out in full rather than composed from a
                         variable — Tailwind only sees literal class names. */
                      tiers.length >= 3
                        ? tier.recommended
                          ? "order-first lg:order-none lg:-mt-12"
                          : "lg:-mt-6"
                        : tier.recommended
                          ? "order-first sm:order-none sm:-mt-12"
                          : "sm:-mt-6"
                    } ${
                      tier.recommended
                        ? "border-[#1669AE] bg-white shadow-lg shadow-[#1669AE]/15 ring-1 ring-[#1669AE]/20 hover:border-[#0f4d80]"
                        : "border-[#e3e8ef] bg-white hover:border-[#9fb3c8]"
                    }`}
                  >
                    {/* The card is NOT a click target. A stretched button
                        used to cover it, so the whole panel selected the plan —
                        which meant a stray tap while reading the features, or a
                        thumb steadying a phone, sent you to a signature page
                        you had not asked for. One deliberate control per card:
                        the button. */}
                    {/* A banner on the card's top EDGE, not a pill inside it.
                        The pill pushed the plan name down and spent interior
                        space saying one word; flush to the edge it is more
                        visible and costs nothing. overflow-hidden on the card
                        is what clips it to the rounded corners.

                        It stays on the card whatever is selected — that is
                        information about the plan, not a claim about the
                        current choice — but it MUTES once the other plan is
                        chosen, so a solid blue bar never sits on a card the
                        customer has just decided against. */}
                    {tier.recommended && (
                      <div className="flex h-12 items-center justify-center bg-[#1669AE] text-[12.5px] font-bold uppercase tracking-wider text-white">
                        Best value
                      </div>
                    )}
                    <div
                      className={`flex flex-1 flex-col p-5 ${
                        tier.recommended
                          ? ""
                          : tiers.length >= 3
                            ? "lg:pt-11"
                            : "sm:pt-11"
                      }`}
                    >
                      <h3 className="font-display text-lg font-bold">
                        {tier.name}
                      </h3>
                      {tier.tagline && (
                        /* Two lines RESERVED in the three-column layout.
                           Narrower cards wrap the annual card's tagline to two
                           lines while the other two fit on one, which pushed
                           its Select button 20px below the others — the exact
                           misalignment the banner/lift chain exists to
                           prevent. Reserving the second line costs nothing on
                           the cards that don't need it. Two-plan cards are
                           wide enough that all taglines sit on one line, so
                           they keep their natural height. */
                        <p
                          className={`mt-1 text-sm text-[#6b7280] ${
                            tiers.length >= 3 ? "lg:min-h-[2.5rem]" : ""
                          }`}
                        >
                          {currentTagline(tier.tagline)}
                        </p>
                      )}
                      {/* Price and saving on ONE line, so the rate and the
                          reason to take it are read as a single fact rather
                          than as a number followed by a footnote.

                          flex-wrap, not a fixed row: the note is operator-typed
                          and runs to about thirty characters ("$1,815 billed
                          once — $165 saved"), which fits beside a price on a
                          desktop card and does not on a phone. Wrapping puts it
                          underneath exactly when it has to be, instead of
                          squeezing both.

                          items-baseline so the pill sits on the price's
                          baseline; centred, a small pill floats oddly against a
                          30px number. */}
                      {(tier.price || tier.priceNote?.trim()) && (
                        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2 sm:min-h-[2.75rem] lg:min-h-[2.75rem]">
                          {tier.price && (
                            /* The recommended price is set a size larger. Two
                               prices at identical weight ask the customer to do
                               the comparison themselves; the point of
                               recommending one is to have already done it. */
                            /* SEMIBOLD, not bold, and a size up to pay for it.
                               At 700 the rate read as a heavy block — the
                               thing the eye bounced off rather than the thing
                               it read. Inter is variable here, so 600 keeps
                               the presence while opening the counters up.
                               tabular-nums puts the digits on a fixed grid so
                               "$155" and "$151" line up character for
                               character across the cards, which is exactly the
                               comparison the row is for. */
                            <p
                              className={`font-semibold tabular-nums text-[#0f4d80] ${
                                tier.recommended
                                  ? "text-[2.125rem] leading-none"
                                  : "text-[1.75rem] leading-none"
                              }`}
                            >
                              {formatPrice(tier.price)}
                            </p>
                          )}
                          {tier.priceNote?.trim() && (
                            <p className="rounded-md bg-[#e3f5e8] px-2 py-1 text-sm font-semibold text-[#176a2c]">
                              {tier.priceNote.trim()}
                            </p>
                          )}
                        </div>
                      )}
                      {/* What the monthly rate BUYS, directly under the rate.
                          Ten bullets on this card and none of them said how
                          often we come — the one fact a customer holding a
                          competitor's bi-weekly quote divides the price by.
                          Same line on both cards (it is the same service), so
                          the button row stays level; on quotes stored before
                          the field existed cadenceLabel is empty on both and
                          nothing renders — "probably weekly" is not printed
                          under anyone's price. */}
                      {cadenceLabel(quote.proposal.cadence) && (
                        <p className="mt-0.5 text-[13px] font-semibold uppercase tracking-wide text-[#5b6b7c]">
                          {cadenceLabel(quote.proposal.cadence)}
                        </p>
                      )}
                      <span className="block pt-5">
                        <button
                          onClick={() => selectPlan(tier.name)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#0a1628] bg-[#0a1628] py-2.5 text-sm font-bold text-white transition-colors hover:border-[#16283f] hover:bg-[#16283f]"
                        >
                          Select
                          <span className="sr-only"> {tier.name}</span>
                        </button>
                      </span>
                      {/* What they are actually agreeing to pay, under the
                          button and above the rule.

                          Deliberately NOT in the badge beside the rate: a
                          four-figure total there reads as the expensive option
                          even when it is the cheaper one. Equally deliberately
                          NOT omitted — burying the figure would only move the
                          surprise to the invoice, where it costs far more than
                          a moment's pause here. */}
                      {/* A RESERVED STRIP, not a conditional line.
                          Only the annual card has a billing note, so rendering
                          it only there pushed that card's whole bullet list
                          down — six rows that are identical across the cards
                          stopped lining up, which is the one thing the layout
                          is for. The slot is now the same height on every
                          card and empty where there is nothing to say. */}
                      <p
                        className={`mt-2 text-center text-xs leading-relaxed text-[#6b7280] ${
                          tiers.length > 1 ? "sm:min-h-[1.125rem]" : ""
                        }`}
                      >
                        {shortBillingNote(tier.billingNote ?? "")}
                      </p>
                      {/* A rule under the button, not a bare gap. Above it the
                        card is making an offer; below it the card is
                        justifying one, and the line is what tells you the
                        difference at a glance. */}
                      <div className="mt-5 border-t border-[#e9eef4]" />
                      {/* The extras are LABELLED and come first; the shared
                          service follows under a rule.

                          This replaced "Everything in Pay Monthly, plus:",
                          which pointed at the other card — and on a phone the
                          cards stack with this one FIRST, so it named something
                          the reader had not reached. Rewording it would not
                          have helped: a reader who has not seen the monthly
                          plan learns nothing from being told this one includes
                          it. Each card carries the whole list now and stands
                          alone in any order. */}
                      {(() => {
                        /* Shared rows first so the two cards line up line for
                           line; this plan's own extras hang off the bottom
                           under a heading, which is where a reader scanning for
                           the difference looks anyway.

                           splitTierIncludes also rebuilds the legacy shape,
                           where the upgrade card stored ONLY its extras and
                           leaned on "Everything in Pay Monthly, plus:" to imply
                           the rest. That sentence is gone from this page, so
                           without it an older quote's annual card would
                           silently understate what is being bought. Composed
                           here rather than backfilled: the stored row is the
                           record of what was sent, some of them signed. */
                        /*
                         * The legacy-shape rebuild compares against the card
                         * to the left, which only works when the two lists
                         * differ by a SUFFIX. In the three-plan layout Pay
                         * Monthly differs from Essentials by one bullet in the
                         * middle — a filter line swapped, not appended — so
                         * the rebuild put Essentials' "filter cleaning" line
                         * into Pay Monthly's shared section, showing a bullet
                         * that is not in that card's own list. Three-plan
                         * tiers are all current-shape (they carry sharedCount
                         * where it applies), so they never need the rebuild.
                         */
                        const { shared, extras } = splitTierIncludes(
                          tier,
                          i > 0 && !tier.essentials && !tiers[i - 1]?.essentials
                            ? (tiers[i - 1]?.includes ?? [])
                            : [],
                        );
                        /* Short forms here and NOWHERE else. The PDF keeps
                           the long ones: it is read once and carefully, often
                           on paper, and there the qualifier after the dash is
                           the part that answers the objection. This page is
                           scanned two columns at a time, where the same
                           qualifiers turn six quick promises into six
                           paragraphs. */
                        const row = (item: string, j: number) => (
                          <li
                            key={j}
                            className="flex gap-2 text-sm leading-relaxed text-[#374151]"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1d7a33]" />
                            {shortBullet(item)}
                          </li>
                        );
                        return (
                          <>
                            {/* THE SHARED BLOCK, SPLIT AT THE DIFFERENTIATORS.
                                On a three-plan quote the last rows of a
                                Complete card are the three items Essentials
                                marks ✗. Labelling them "Also included" —
                                opposite "Not included" at the same height on
                                the card alongside — turns the grouping into
                                the comparison instead of leaving nine rows in
                                one undifferentiated list. Two-plan quotes have
                                no such block and are untouched. */}
                            {shared.length > 0 &&
                              (() => {
                                const at = threePlan
                                  ? shared.findIndex((b) =>
                                      ALL_COMPLETE_DIFFERENTIATORS.includes(
                                        b.trim(),
                                      ),
                                    )
                                  : -1;
                                if (at < 0)
                                  return (
                                    <ul className="mt-4 space-y-2">
                                      {shared.map(row)}
                                    </ul>
                                  );
                                return (
                                  <>
                                    <ul className="mt-4 space-y-2">
                                      {shared.slice(0, at).map(row)}
                                    </ul>
                                    <p className={blockLabelClass}>
                                      {EXTRAS_ALSO_INCLUDED_HEADING}
                                    </p>
                                    <ul className="mt-2 space-y-2">
                                      {shared
                                        .slice(at)
                                        .map((b, j) => row(b, at + j))}
                                    </ul>
                                  </>
                                );
                              })()}
                            {extras.length > 0 && (
                              <>
                                {/* A rule, not a heading. "Additional benefits"
                                    labelled something the items already say for
                                    themselves — nobody reads "Your 12th month
                                    free" and wonders which plan it belongs to.
                                    The line does the same work without words,
                                    and the shared rows above it stay level with
                                    the other card, which was the point.

                                    Only on the card that HAS extras, so the
                                    asymmetry is the signal: one plan runs on
                                    past where the other stops. */}
                                {shared.length > 0 && (
                                  <div className="mt-5 border-t border-[#e9eef4]" />
                                )}
                                <ul
                                  className={
                                    shared.length
                                      ? "mt-5 space-y-2"
                                      : "mt-4 space-y-2"
                                  }
                                >
                                  {extras.map((item, j) =>
                                    row(item, shared.length + j),
                                  )}
                                </ul>
                              </>
                            )}
                            {/* WHAT THIS PLAN LEAVES OUT.
                                Only the Essentials card carries these, and it
                                carries them on purpose: a cheaper plan whose
                                document is merely silent about its exclusions
                                is indefensible the first time a parts invoice
                                lands. Muted, with a ✗ and no green — the eye
                                reads the column as "six things yes, two
                                things no" without having to compare lists.
                                Every other tier has no `excludes`, so no
                                existing quote renders one of these. */}
                            {currentExcludes(tier.excludes).length > 0 && (
                              <>
                                {/* Labelled, and its twin sits at the SAME
                                    position on the Complete cards — see
                                    blockLabel above. Both or neither: a label
                                    on one card only would push these rows a
                                    line below the ✓ rows they pair with. */}
                                <p className={blockLabelClass}>
                                  {EXTRAS_NOT_INCLUDED_HEADING}
                                </p>
                                <ul className="mt-2 space-y-2">
                                  {currentExcludes(tier.excludes).map((item, j) => (
                                    <li
                                      key={j}
                                      className="flex gap-2 text-sm leading-relaxed text-[#8a94a1]"
                                    >
                                      {/* Red, at the operator's call: a grey ✗
                                          beside a green ✓ reads as "quieter",
                                          not as "no". The LABEL stays muted so
                                          the row is still clearly the
                                          secondary column — only the mark
                                          carries the verdict. */}
                                      <X
                                        className="mt-0.5 h-4 w-4 shrink-0 text-[#c0392b]"
                                        strokeWidth={2.5}
                                      />
                                      {shortBullet(item)}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </>
                        );
                      })()}
                      {/* The note stays bottom-anchored so it lines up across
                        both cards however much each has to say. The BUTTON no
                        longer lives here — it sits under the price now.

                        pt-6, not pt-3: at 12px the note sat barely further from
                        the last bullet than the bullets sit from each other, so
                        it read as a seventh item in smaller type rather than as
                        a note ABOUT the list. Fine print earns its quietness
                        from the space around it. */}
                      <div className="mt-auto">
                        {/* The nudge inside this note claims the annual plan
                            costs less per month than this card. It was baked in
                            from the SUGGESTED Essentials price; the operator
                            then types their own. currentValueNote drops the
                            claim when the two prices on this page disprove it. */}
                        {(() => {
                          const note = currentValueNote(
                            tier.valueNote ?? "",
                            tier.price,
                            tiers.find((t) => t.recommended)?.price ??
                              tiers[tiers.length - 1]?.price ??
                              "",
                          ).trim();
                          return note ? (
                            <p className="pt-6 text-xs leading-relaxed text-[#6b7280]">
                              {note}
                            </p>
                          ) : null;
                        })()}
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
                      </div>
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
            {/*
              A LINE, not a box.

              This was a panel, and every version of a panel was wrong: filled
              lighter than the page it looked washed out, filled darker it
              looked disabled, and filled white it looked like a third plan.
              The problem was never the colour — it was that a container of any
              kind asks to be compared with the two containers above it, and
              this must not be compared with them. Without one there is nothing
              to weigh against a plan card, and the exit stops competing with
              the decision while staying perfectly findable by anyone who has
              already made it.

              Kept at the point of decision rather than in a footer, because
              somebody who has just read the price and decided against it is the
              one person whose answer is worth having, and they are about to
              close the tab.
            */}
            {/*
              Help BEFORE the exit, deliberately in that order: someone
              wavering on the price should meet "call us" before they meet
              "tell us why you're not buying". At the FOOT of the plans because
              hesitation happens after reading a price, not before it.

              KEPT DELIBERATELY PLAIN. The first version underlined four links
              inside two sentences of prose and the result was link-soup — the
              decoration was doing the shouting rather than the words. Colour
              and weight are enough to read as a link here; the underline
              arrives on hover, where it confirms rather than competes. The
              editorial tails ("a real person answers", "genuinely helps a
              small business like ours") went for the same reason: on a page
              this quiet they added bulk and a second wrapped line without
              adding information.

              The two lines carry different weight on purpose. Asking for help
              is the one we want taken; the decline is genuinely secondary and
              now looks it.
            */}
            <p className="mx-auto mt-10 max-w-lg text-center text-sm leading-relaxed text-[#6b7280]">
              Questions?{" "}
              <a href={PHONE_HREF} className={quietLink}>
                Call
              </a>{" "}
              or{" "}
              <a href={SMS_HREF} className={quietLink}>
                text
              </a>{" "}
              {PHONE_DISPLAY}, or{" "}
              <a href={EMAIL_HREF} className={quietLink}>
                email us
              </a>
              .
            </p>

            {/* SAYS THE WORD. "Going a different route?" was polite to the
                point of being easy to miss — somebody who has decided against
                us is skimming for the exit, and a soft phrase does not read as
                one. "Decline this proposal" is the sentence they are looking
                for, and the line under it carries the ask.

                An exit this visible costs some conversions; that trade is made
                on purpose. A lost quote nobody explains teaches nothing, and
                four of the next ten saying "price" is worth more than the
                handful of soft maybes a quieter prompt would have preserved.

                Outlined, not filled: unmistakably a button, but never
                competing with Select, which stays the only solid dark thing on
                the page. */}
            {!declined && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setDeclineOpen(true)}
                  className="w-full max-w-sm rounded-xl border border-[#c8d4e0] bg-white px-5 py-3.5 text-center transition-colors hover:border-[#9fb3c8] hover:bg-[#f7f9fc]"
                >
                  <span className="block text-sm font-bold text-[#0a1628]">
                    Decline this proposal
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[#6b7280]">
                    Tell us why &mdash; it takes one tap and genuinely helps
                  </span>
                </button>
              </div>
            )}

            {/* The acknowledgement matches: a line, not a panel. Still tinted
                green, because something DID happen and the reply is written per
                reason — two of them are recoverable, and a screen that only says
                "thanks" wastes the last moment anyone is paying attention. */}
            {declined && (
              <p className="mx-auto mt-2 max-w-lg text-center text-[13px] leading-relaxed text-[#176a2c]">
                <span className="font-semibold">
                  Thank you &mdash; that helps.
                </span>{" "}
                {declineReply(declined)}
              </p>
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
                {quote.number ? (
                  <Eyebrow>{`Proposal #${quote.number}`}</Eyebrow>
                ) : null}
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
                      <span className="text-[#0f4d80]">
                        {formatPrice(chosen.price)}
                      </span>
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
                Getting started{" "}
                <span className="text-sm font-normal text-[#6b7280]">
                  (optional)
                </span>
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
                  <input
                    className={`${field} mt-1`}
                    value={accessNotes}
                    onChange={(e) => setAccessNotes(e.target.value)}
                  />
                </label>
              </div>
              <p className="mt-3 text-xs text-[#6b7280]">
                We&rsquo;ll confirm your first visit with you — the sooner you
                start, the sooner your pool is on a routine.
              </p>
            </section>

            <section className="mb-5 rounded-2xl border border-[#e3e8ef] bg-white p-5">
              <h2 className="mb-3 font-display text-base font-bold">
                Service agreement
              </h2>
              {/* ONE box, three consents on the record.
                  Three separate ticks put four micro-decisions between a
                  customer who has already chosen a plan and the signature —
                  and every one is a place to stall at the highest-intent
                  moment on the whole page. A single consent that NAMES each
                  document is the standard pattern and is no weaker for it:
                  what makes consent informed is that the terms were
                  identified and reachable, not the number of boxes.

                  The stored record is unchanged. accept.ts still requires
                  agreeRequirements, agreeService and agreePrivacy
                  independently, and submit() still sends all three — so the
                  audit trail says exactly what it said before. */}
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-[#1f2937]">
                <input
                  type="checkbox"
                  checked={agree.all}
                  onChange={(e) => setAgree({ all: e.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand-blue"
                />
                <span>
                  I&rsquo;ve read and agree to the service requirements
                  &mdash; access to the pool, an operational pump and filter,
                  and a working outside hose &mdash; and to the{" "}
                  <a
                    href="/service-agreement/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0f4d80] underline"
                  >
                    Service Agreement
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy-policy/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0f4d80] underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

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
              {/* A RULED BLOCK, not a tinted panel.
                  This card already IS the container. Boxing the terms inside
                  it made a panel within a panel, and boxing the email field
                  below made a second one in a different tint — two nested
                  containers of equal weight, one of which only informs while
                  the other asks for input. The reader gets no rule for telling
                  them apart, so the section reads as three competing surfaces
                  rather than one form.
                  Fine print earns its quietness from space and a hairline, not
                  from a fill. */}
              <div className="mt-5 border-t border-[#eef1f5] pt-4">
                <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                  {plan ? `${plan} — terms` : "Terms"}
                </h3>
                {chosen?.finePrint?.trim() && (
                  <p className="text-sm leading-relaxed text-[#374151]">
                    {chosen.finePrint.trim()}
                  </p>
                )}
                {showsConditionTerm(jobKindOf(quote.proposal?.jobKind)) && (
                  <p
                    className={`text-sm leading-relaxed text-[#374151] ${chosen?.finePrint?.trim() ? "mt-2" : ""}`}
                  >
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
              {/* An ordinary labelled field, styled like the two in "Getting
                  started" above — same label weight, same helper line, same
                  input. It is a question the form is asking, so it should look
                  like the other questions the form asks; the tinted box made it
                  look like a notice. */}
              {needsEmail && (
                <div className="mt-5 border-t border-[#eef1f5] pt-4">
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-semibold text-[#1f2937]"
                  >
                    Where should we send your signed copy?
                  </label>
                  <p className="mt-1 text-xs leading-relaxed text-[#6b7280]">
                    We don&rsquo;t have an email address for you yet. Your
                    confirmation and every service report after a visit go here.
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
                  {contactEmail.trim() !== "" && !emailOk && (
                    <p className="mt-1.5 text-xs text-[#c0392b]">
                      That doesn&rsquo;t look like an email address.
                    </p>
                  )}
                </div>
              )}

              {/* The heavier rule: everything above is the agreement being
                  read, everything below is it being signed. The hairlines
                  inside the block separate items; this one separates acts. */}
              <div className="mt-7 border-t border-[#e3e8ef] pt-6">
                <label
                  htmlFor="signature"
                  className="block text-sm font-semibold text-[#1f2937]"
                >
                  Sign to accept
                </label>
                <div className="mt-4 border-b-2 border-[#9fb3c8] transition-colors focus-within:border-[#1669AE]">
                  <input
                    id="signature"
                    className="w-full bg-transparent pb-1 text-3xl text-[#0a1628] placeholder-[#c3cedb] focus:outline-none"
                    style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder={quote.customerName.trim() || "Your full name"}
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
                  Typing your name is your electronic signature. We record it
                  with the date, time and IP address as proof of acceptance.
                </p>
              </div>
            </section>

            {formError && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-3 rounded-xl border border-[#f0c8c8] bg-[#fdf1f0] px-4 py-3 text-sm text-[#8c2f22]"
              >
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
                  Give us a call and we&rsquo;ll confirm it still stands, or
                  send you a fresh quote — it only takes a minute.
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
                {busy ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : null}
                {busy ? "Confirming…" : `Accept and start service`}
              </button>
            )}
            {!pricingStale && !canSubmit && (
              <p className="mt-2 text-center text-xs text-[#6b7280]">
                {needsEmail && !emailOk
                  ? "Add your email, tick all three boxes and type your name to continue."
                  : "Tick all three boxes and type your name to continue."}
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
                <h2 className="text-lg font-bold text-[#0a1628]">
                  What made the difference?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#6b7280]">
                  One tap is plenty. Nothing here commits you to anything, and
                  your quote stays live either way.
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
                      ? "border-brand-blue bg-[#eef6fb] font-semibold text-[#0a1628]"
                      : "border-[#e3e8ef] text-[#374151] hover:border-[#c8d4e0] hover:bg-[#f7f9fc]"
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
              {decliningBusy ? "Sending…" : "Send feedback"}
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
