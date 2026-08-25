import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  LoaderCircle,
  CheckCircle,
  Check,
  AlertCircle,
  Trash2,
  LogOut,
  Calculator,
  FilePlus2,
  ChevronLeft,
  ChevronDown,
  X,
  Link2,
  Building2,
  ArrowRight,
  Repeat,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  FieldShell,
  fieldClass,
  selectClass,
  textareaClass,
} from "@/components/FormField";
import { useProposalDraft } from "@/lib/useAdminDraft";
import {
  sendProposal,
  saveQuoteOnly,
  previewProposal,
  reserveProposalNumber,
  logout,
  formatPrice,
  tierDelta,
  type EmailOverrides,
  composeCustomerName,
  type CustomerInfo,
  type PricingMode,
  splitTierIncludes,
  type ProposalData,
  type ProposalPreview,
  type Tier,
} from "@/lib/adminApi";
import { blobToBase64 } from "@/lib/adminMedia";
import {
  proposalDateLabel,
  proposalFilename,
  renderProposalPdf,
} from "@/lib/proposalPdf";
import { toTitleCase, formatUsPhone } from "@/lib/textFormat";
import { Section, PreviewBlock, PreviewRow, CollapsibleSection} from "./adminUi";
import { PhotoPicker } from "./PhotoPicker";
import { EmailReview } from "./EmailReview";
import { SANITIZATION_TYPES } from "./sanitization";
import { SCOPE_TEMPLATES } from "./scopeTemplates";
import { CADENCES, cadenceOf } from "./serviceCadence";
import { suggestGallonsRange } from "./poolVolume";
import {
  JOB_KINDS,
  jobAssurances,
  jobKindOf,
  showsExtrasTable,
  trustHeading,
  type JobKind,
} from "./jobKinds";
import { ADDON_PRESETS } from "./addonPresets";
import {
  benefitsFootnote,
  BENEFITS_COMPLETE_HEADING,
  BENEFITS_EVERY_HEADING,
  BENEFITS_HEADING,
  BENEFITS_PLAN_SCOPE,
  splitBenefits,
  includedBenefits,
} from "./proposalBenefits";
import {
  EXTRAS_COL_THEIRS,
  extrasIntroFor,
  EXTRAS_COL_YOURS,
  EXTRAS_HEADING,
  EXTRAS_INCLUDED_LABEL,
  EXTRAS_NOTE,
  EXTRAS_PLAN_QUALIFIER,
  includedExtras,
} from "./includedExtras";
import {
  PRESET_VERSION,
  buildTiers,
  buildTiersWithEssentials,
  syncFilterService,
  syncTierPrices,
  upgradeTierWording,
} from "./tierPresets";
import {
  FILTER_TYPES,
  inclusionQuestion,
  supportsFilterService,
} from "./filterService";

// Plain input (no floating label) for the add-on rows.
const addonInput =
  "h-12 w-full rounded-xl border border-stone-300 bg-stone-100 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50";

type SendStatus =
  | { kind: "idle" }
  /** Reserving the number and rendering the email for the review step. */
  | { kind: "preparing" }
  /** The review step is open. Nothing has been sent; nothing is saved. */
  | { kind: "review" }
  | { kind: "sending" }
  | { kind: "saving" }
  /** `stored: false` = emailed, but the quote was NOT saved. See the sent screen. */
  | { kind: "sent"; stored: boolean }
  /** Saved without emailing — the link is the deliverable, so it's shown to copy. */
  | { kind: "saved"; url: string }
  | { kind: "error"; message: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const ProposalBuilder = ({
  onLogout,
  onBack,
  onCommercial,
}: {
  onLogout: () => void;
  onBack: () => void;
  /** Hand this quote to the commercial builder, carrying the customer over. */
  onCommercial: (customer: CustomerInfo) => void;
}) => {
  const { data, setData, update, clearDraft } = useProposalDraft();

  /**
   * Edit a structured name field and recompose customer.name IN THE SAME
   * update. `name` is what everything downstream reads (PDF, email, D1,
   * filename), so it must never be a render behind the fields it is built
   * from.
   */
  const setNameParts = (patch: Partial<CustomerInfo>) =>
    setData((p) => {
      const customer = { ...p.customer, ...patch };
      return { ...p, customer: { ...customer, name: composeCustomerName(customer) } };
    });

  /**
   * A draft saved before the name was structured has only the composed string.
   * Seed the fields from it once — first word into first name, the rest into
   * last — so nothing typed disappears when this UI replaces the single input.
   * The operator is looking at the result and can fix an odd split; person
   * mode is the right guess because the old single field was labelled "Full
   * name". Runs once: emptyProposal seeds nameMode, so a fresh draft skips it.
   */
  const nameSeededRef = useRef(false);
  useEffect(() => {
    if (nameSeededRef.current) return;
    nameSeededRef.current = true;
    setData((p) => {
      if (p.customer.nameMode !== undefined) return p;
      const t = p.customer.name.trim();
      const first = t ? t.split(/\s+/)[0] : "";
      const last = t ? t.split(/\s+/).slice(1).join(" ") : "";
      return {
        ...p,
        customer: {
          ...p.customer,
          nameMode: "person",
          firstName: first,
          lastName: last,
          company: "",
        },
      };
    });
  }, [setData]);

  /**
   * Bring untouched preset wording up to date, once, when a draft is restored.
   *
   * A draft stores its plan cards, so improving a preset did nothing to a
   * proposal already in progress. The only remedy was "Reset to preset", which
   * replaces BOTH plans including anything typed by hand — too destructive to
   * press casually, so it wasn't, and superseded wording went out on real
   * quotes.
   *
   * upgradeTierWording only replaces text that still matches a previous preset
   * EXACTLY, so a hand-edited line is never touched. That makes it safe to run
   * without asking. The amber "reset" prompt stays for drafts that were edited
   * and therefore can't be upgraded automatically.
   *
   * Runs on mount only: afterwards the admin is editing, and re-running would
   * fight them.
   */
  const upgradedRef = useRef(false);
  useEffect(() => {
    if (upgradedRef.current) return;
    upgradedRef.current = true;
    setData((p) => {
      if (p.proposal.pricingMode !== "tiers" || p.proposal.tiers.length === 0)
        return p;
      const tiers = upgradeTierWording(p.proposal.tiers, {
        type: p.pool.filterType,
        included: p.pool.filterServiceIncluded === "yes",
      });
      // Reference-equal when nothing matched a legacy preset — skip the write so
      // an untouched draft isn't marked dirty just by being opened.
      const changed = tiers.some((t, i) => t !== p.proposal.tiers[i]);
      if (!changed) return p;
      /*
       * DO NOT stamp presetVersion here.
       *
       * upgradeTierWording only repairs lines that exactly match a previous
       * preset; it cannot touch anything edited, and it knows nothing about
       * the preset revisions it did not implement. Stamping the current
       * version because it fixed a tagline told the form the whole draft was
       * up to date, which permanently suppressed the amber "reset to preset"
       * prompt — so genuinely superseded wording it could NOT repair went out
       * unchallenged. The prompt is the safety net; leave it armed.
       */
      return { ...p, proposal: { ...p.proposal, tiers } };
    });
  }, [setData]);
  const [status, setStatus] = useState<SendStatus>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  // Abort controller + a cancelled flag so Cancel actually stops the send:
  // the fetch is aborted via the signal, and the flag bails out of the
  // pre-fetch steps (dynamic import / PDF generation) that can't be aborted.
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  /**
   * The review step's state. The email as the sender composes it, the two lines
   * the operator may have reworded, and a flag for the re-render behind an edit.
   */
  const [preview, setPreview] = useState<ProposalPreview | null>(null);
  const [overrides, setOverrides] = useState<EmailOverrides>({});
  const [refreshing, setRefreshing] = useState(false);
  /** A failed send, shown inside the review dialog where the retry button is. */
  const [sendError, setSendError] = useState("");
  /**
   * The number reserved when the review opened, HELD across a cancel.
   *
   * Reserving is a counter bump with no undo, so re-reading the email twice
   * before sending would otherwise burn a number per look and leave gaps in a
   * sequence whose whole job is to be a reliable reference. Reserved here
   * rather than at send time because the review shows the subject line, and
   * "#1042" is most of what that line says.
   */
  const reservedNumberRef = useRef<number | null>(null);
  /** The in-flight re-render, so the next edit can abandon it. */
  const refreshAbortRef = useRef<AbortController | null>(null);
  // Photos live in component state only (not the localStorage draft) — base64
  // images would quickly exceed the storage quota. They're optional and baked
  // straight into the generated PDF.
  const [photos, setPhotos] = useState<string[]>([]);
  // Which plan's editor is open, if any. Both start collapsed.
  const [editingTier, setEditingTier] = useState<number | null>(null);

  // Drop a pre-written service description into the scope field. Appends (with a
  // blank line) when scope already has text, so templates can be combined and
  // nothing the admin typed gets clobbered.
  const jobKind: JobKind = jobKindOf(data.proposal.jobKind);
  const cadence = cadenceOf(data.proposal.cadence);
  /**
   * Whether "What are you quoting?" has actually been ANSWERED — from the raw
   * draft value, because jobKindOf coerces an unset draft to 'recurring',
   * which is the correct reading of an old stored quote and the wrong reading
   * of a form nobody has touched yet.
   *
   * Nothing below the chooser renders until this is true (and recurring also
   * needs its cadence picked). A fresh draft starts with nothing selected: a
   * default that is right 80% of the time is a default that ships wrong
   * documents the other 20%, silently — a salesperson, or sun on the screen,
   * never notices the answer they didn't give. Requiring the tap costs two
   * seconds; unwinding a proposal built on the wrong template does not.
   */
  const rawKind = data.proposal.jobKind;
  const kindChosen =
    rawKind === "recurring" || rawKind === "recovery" || rawKind === "repair";
  const chooserComplete =
    kindChosen && (rawKind !== "recurring" || cadence !== null);

  /**
   * The pool has moved on since a scope template was inserted. Null when no
   * template was inserted, or when the stamp still matches — a hand-written
   * scope is never nagged about.
   */
  const scopeStale = useMemo(() => {
    const stamp = data.proposal.scopePool;
    if (!stamp || !data.proposal.scope.trim()) return null;
    const [filterType = "", sanitization = ""] = stamp.split("|");
    const same =
      filterType === data.pool.filterType &&
      sanitization === data.pool.sanitization;
    return same ? null : { filterType, sanitization };
  }, [
    data.proposal.scopePool,
    data.proposal.scope,
    data.pool.filterType,
    data.pool.sanitization,
  ]);

  /** Bracket placeholders the templates ship, still unedited. */
  const scopePlaceholders = useMemo(
    () => data.proposal.scope.match(/\[[^\]\n]{3,80}\]/g) ?? [],
    [data.proposal.scope],
  );

  const insertScopeTemplate = (label: string) => {
    const tpl = SCOPE_TEMPLATES.find((t) => t.label === label);
    if (!tpl) return;
    // Built from THIS pool: a chlorine pool gets no salt-cell line, and the
    // filter step describes what actually happens to that filter.
    const text = tpl.build({
      sanitization: data.pool.sanitization,
      filterType: data.pool.filterType,
    });
    const current = data.proposal.scope.trim();
    update("proposal", "scope", current ? `${current}\n\n${text}` : text);
    /*
     * Remember which pool this text was built FROM.
     *
     * The scope is free text after insertion, so nothing re-tailors it when
     * the pool is corrected later — an inserted weekly scope keeps the old
     * filter's language and the salt-cell bullet forever, while the Difference
     * block beside it rebuilds. Stamping the pool lets the form say so
     * instead of letting the two halves of one page disagree in silence.
     */
    update(
      "proposal",
      "scopePool",
      `${data.pool.filterType}|${data.pool.sanitization}`,
    );
    // Picking a template IS the operator saying what this job is, so it moves
    // the answer at the top of the form with it. Without this the two could
    // disagree — a green-recovery scope under the weekly-service promises,
    // which is the exact mismatch the question exists to prevent. Only on the
    // FIRST template: once scope has text the operator is combining templates,
    // and the second one should not silently reclassify the document.
    if (!current) update("proposal", "jobKind", tpl.kind);
    // And the cadence with it, for the same reason and under the same
    // first-template rule. Only the two recurring templates carry one, so
    // inserting a green-to-clean never puts a frequency on a one-off job.
    if (!current && tpl.cadence) update("proposal", "cadence", tpl.cadence);
  };

  // --- Additional-services (add-on) line items ---
  const addAddOn = (label = "", price = "") =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        addOns: [...p.proposal.addOns, { label, price }],
      },
    }));
  const updateAddOn = (idx: number, field: "label" | "price", value: string) =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        addOns: p.proposal.addOns.map((a, i) =>
          i === idx ? { ...a, [field]: value } : a,
        ),
      },
    }));
  const removeAddOn = (idx: number) =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        addOns: p.proposal.addOns.filter((_, i) => i !== idx),
      },
    }));

  // --- Filter service ---
  // Changing the filter type (or the inclusion answer) re-tailors the plan
  // wording immediately, so a quote can't go out promising cartridge elements to
  // a DE pool. syncFilterService only rewrites lines it generated itself, so
  // anything typed by hand survives.
  /**
   * An Essentials plan only exists in contrast to bundled filter parts — the
   * whole card is "the same service without them". When the answer stops
   * being yes, the three-plan layout is incoherent: the Complete cards'
   * differentiator row promises parts the quote no longer includes, and the
   * audit caught exactly that going out. So the layout COLLAPSES to the
   * two-plan preset in the same state change, and the operator is told
   * afterwards rather than interrupted with a confirm mid-answer — the
   * checkbox in Plans re-adds the third card in one click if the answer was
   * a slip.
   */
  const collapseIfNoEssentialsBasis = (
    p: ProposalData,
    tiers: Tier[],
    included: boolean,
  ): Tier[] =>
    !included && tiers.some((t) => t.essentials)
      ? buildTiers(p.proposal.price, {
          type: p.pool.filterType,
          included: false,
        })
      : tiers;

  const setFilterType = (type: string) =>
    setData((p) => {
      // A type that can't carry the service (Other/blank) can't have it
      // included, and changing type re-opens the question rather than carrying
      // the previous pool's answer over to a different filter.
      const answer = supportsFilterService(type)
        ? p.pool.filterServiceIncluded
        : "";
      const filter = { type, included: answer === "yes" };
      const next = { ...p, pool: { ...p.pool, filterType: type, filterServiceIncluded: answer } };
      return {
        ...next,
        proposal: {
          ...p.proposal,
          tiers: collapseIfNoEssentialsBasis(
            next,
            syncFilterService(p.proposal.tiers, filter, p.pool.sanitization),
            filter.included,
          ),
        },
      };
    });

  const setFilterIncluded = (answer: string) =>
    setData((p) => {
      const next = { ...p, pool: { ...p.pool, filterServiceIncluded: answer } };
      return {
        ...next,
        proposal: {
          ...p.proposal,
          tiers: collapseIfNoEssentialsBasis(
            next,
            syncFilterService(
              p.proposal.tiers,
              { type: p.pool.filterType, included: answer === "yes" },
              p.pool.sanitization,
            ),
            answer === "yes",
          ),
        },
      };
    });

  // --- Pricing tiers ---
  // Switching to tiers seeds both plans from the preset, using whatever base
  // rate is already typed. Switching back leaves `tiers` untouched, so toggling
  // to compare and back never loses edited wording.
  const setPricingMode = (mode: PricingMode) =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        pricingMode: mode,
        tiers:
          mode === "tiers" && p.proposal.tiers.length === 0
            ? buildTiers(p.proposal.price, {
                type: p.pool.filterType,
                included: p.pool.filterServiceIncluded === "yes",
              })
            : p.proposal.tiers,
        presetVersion:
          mode === "tiers" && p.proposal.tiers.length === 0
            ? PRESET_VERSION
            : p.proposal.presetVersion,
      },
    }));

  /**
   * The pricing shape as ONE value, because the operator thinks in one.
   *
   * Underneath it is still pricingMode ('single' | 'tiers') plus whether a
   * tier carries `essentials` — two independent flags that were surfaced as
   * two separate controls in two different places. The chips read and write
   * this instead.
   */
  const planShape: "single" | "two" | "three" =
    data.proposal.pricingMode !== "tiers"
      ? "single"
      : data.proposal.tiers.some((t) => t.essentials)
        ? "three"
        : "two";

  /** Three plans need a filter service to leave out — see setEssentialsPlan. */
  const canOfferEssentials =
    data.pool.filterServiceIncluded === "yes" &&
    supportsFilterService(data.pool.filterType);

  const setPlanShape = (next: "single" | "two" | "three") => {
    if (next === planShape) return;
    if (next === "single") {
      setPricingMode("single");
      return;
    }
    // Rebuilding replaces every card, so warn once there is something to lose.
    const rebuilds = data.proposal.tiers.length > 0 && planShape !== "single";
    if (
      rebuilds &&
      !window.confirm(
        next === "three"
          ? "Add the Essentials plan? All three plans are rebuilt from the preset, so any wording you edited is lost."
          : "Remove the Essentials plan? The remaining two plans are rebuilt from the preset, so any wording you edited is lost.",
      )
    )
      return;
    setPricingMode("tiers");
    if (data.proposal.tiers.length === 0 && next === "two") return;
    setEssentialsPlan(next === "three");
  };

  const updateTier = (idx: number, patch: Partial<Tier>) =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        tiers: p.proposal.tiers.map((t, i) =>
          i === idx ? { ...t, ...patch } : t,
        ),
      },
    }));

  // Exactly one plan carries the ribbon — two "recommended" plans recommend
  // nothing.
  const setRecommended = (idx: number) =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        tiers: p.proposal.tiers.map((t, i) => ({
          ...t,
          recommended: i === idx,
        })),
      },
    }));

  /**
   * The base rate is the only place a price is typed. Editing it re-derives both
   * plans, so the cards can never sit showing a rate the proposal no longer
   * quotes — which is exactly what happened when they were independent fields.
   */
  const setBasePrice = (value: string) =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        price: value,
        tiers: syncTierPrices(
          p.proposal.tiers,
          p.proposal.tiers[0]?.price ?? "",
          value,
          {
            type: p.pool.filterType,
            included: p.pool.filterServiceIncluded === "yes",
          },
          p.pool.sanitization,
        ),
      },
    }));

  const resetTiers = () =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        // Rebuild the shape the proposal is already in — resetting wording
        // should not silently drop the comparison plan.
        tiers: p.proposal.tiers.some((t) => t.essentials)
          ? buildTiersWithEssentials(
              p.proposal.price,
              {
                type: p.pool.filterType,
                included: p.pool.filterServiceIncluded === "yes",
              },
              p.pool.sanitization,
            )
          : buildTiers(p.proposal.price, {
              type: p.pool.filterType,
              included: p.pool.filterServiceIncluded === "yes",
            }),
        presetVersion: PRESET_VERSION,
      },
    }));

  /**
   * Add or remove the Essentials comparison plan.
   *
   * Rebuilds from the preset rather than splicing, so the three cards are
   * always the seeded set — the ladder (Essentials → parts → free month) only
   * reads correctly if the middle card's tagline names the upgrade, and that
   * tagline is generated. Any per-customer wording on the OTHER two cards is
   * therefore lost, which is why the control warns before it fires.
   */
  const setEssentialsPlan = (on: boolean) =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        tiers: on
          ? buildTiersWithEssentials(
              p.proposal.price,
              {
                type: p.pool.filterType,
                included: p.pool.filterServiceIncluded === "yes",
              },
              p.pool.sanitization,
            )
          : buildTiers(p.proposal.price, {
              type: p.pool.filterType,
              included: p.pool.filterServiceIncluded === "yes",
            }),
        presetVersion: PRESET_VERSION,
      },
    }));


  // An unanswered filter question can't be sent: the quote would silently omit
  // a promise that was meant to be there, and nothing downstream would flag it.
  // Tiers exist but were generated before the current preset revision.
  const presetsOutdated =
    data.proposal.pricingMode === "tiers" &&
    data.proposal.tiers.length > 0 &&
    data.proposal.presetVersion < PRESET_VERSION;

  /**
   * Drafts saved before this was a tri-state hold a boolean. `false === 'no'` is
   * false, so such a draft rendered with neither button lit AND no prompt — a
   * silent dead state. Anything that isn't 'yes'/'no' is treated as unanswered,
   * which also forces a re-answer on a draft whose `true` was a default nobody
   * actually chose.
   */
  const filterAnswer =
    data.pool.filterServiceIncluded === "yes"
      ? "yes"
      : data.pool.filterServiceIncluded === "no"
        ? "no"
        : "";

  const filterAnswered =
    !supportsFilterService(data.pool.filterType) || filterAnswer !== "";

  /**
   * A NAME IS NOT REQUIRED. A pool is quoted from its address, and the common
   * case is a text message from a number you have never spoken to — insisting
   * on a name there is what made those leads unquotable, which is the whole
   * problem this builder was meant to solve.
   *
   * Every quote still needs ONE way to identify it: an email address to send
   * to, or a service address to save against. Neither path can produce a row
   * that is blank in the list.
   */
  const canSend = useMemo(
    () => EMAIL_RE.test(data.customer.email.trim()) && filterAnswered,
    [data.customer.email, filterAnswered],
  );

  /**
   * Saving a link needs no email address — that's the whole reason it exists.
   * A texted lead often hasn't given one, and demanding it was what made them
   * unquotable.
   */
  const canSaveLink = useMemo(
    () => data.customer.address.trim() !== "" && filterAnswered,
    [data.customer.address, filterAnswered],
  );

  /**
   * Record the quote and hand back its link, without emailing anyone.
   *
   * Reserves a number the same way sending does, so a texted quote is numbered
   * like any other and its downloadable PDF carries the same number as the
   * record. No PDF is rendered here — the approve page regenerates it on
   * demand, so there's nothing to attach.
   */
  const handleSaveLink = async () => {
    if (!canSaveLink || status.kind === "saving" || status.kind === "sending")
      return;
    cancelledRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus({ kind: "saving" });
    try {
      const proposalNumber = await reserveProposalNumber(controller.signal);
      if (cancelledRef.current) return;
      const { url } = await saveQuoteOnly(
        { ...data, proposalNumber, photos },
        controller.signal,
      );
      setStatus({ kind: "saved", url });
    } catch (err) {
      if (
        cancelledRef.current ||
        (err instanceof DOMException && err.name === "AbortError")
      )
        return;
      /**
       * Name the reason. saveQuoteOnly throws the server's error code, and
       * every branch here is a different action for the operator — remove a
       * photo, type an address, check a binding. "Please try again" told them
       * none of that, and retrying an oversized payload just fails again.
       */
      const reason = String(err);
      setStatus({
        kind: "error",
        message: reason.includes("storage_unavailable")
          ? "Quote storage isn’t connected, so there’s no link to create. Check the D1 binding."
          : reason.includes("payload_too_large")
            ? "Those photos are too large to save. Remove one or two and try again."
            : reason.includes("customer_address_required")
              ? "Add the service address — a quote needs it to be saved without a name."
              : "Couldn’t create the link. Please try again.",
      });
    }
  };

  /**
   * Step one of sending: show the operator the email.
   *
   * The builder's live preview is the PDF, so until this existed the covering
   * message was the one thing you posted to a customer without having read it —
   * and its two most wrong-able lines, the greeting and the subject, were the
   * two with no field on the form.
   *
   * NOTHING IS COMMITTED HERE. No quote row, no PDF, no email; the PDF is built
   * after the operator says yes, because it's the slow part and rendering it to
   * proofread a paragraph would make every send wait on work that a reword
   * throws away. The one thing this does take is the proposal number, and it
   * keeps it (see reservedNumberRef).
   */
  const openReview = async (nextOverrides: EmailOverrides = overrides) => {
    if (!canSend || status.kind === "sending" || status.kind === "preparing")
      return;
    cancelledRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    setSendError("");
    setStatus({ kind: "preparing" });
    try {
      if (reservedNumberRef.current == null) {
        reservedNumberRef.current = await reserveProposalNumber(
          controller.signal,
        );
        if (cancelledRef.current) return;
      }
      const next = await previewProposal(
        {
          ...data,
          proposalNumber: reservedNumberRef.current,
          overrides: nextOverrides,
        },
        controller.signal,
      );
      if (cancelledRef.current) return;
      setPreview(next);
      setStatus({ kind: "review" });
    } catch (err) {
      if (
        cancelledRef.current ||
        (err instanceof DOMException && err.name === "AbortError")
      )
        return;
      setStatus({
        kind: "error",
        message:
          "Could not render the email to review. Check the connection and try again.",
      });
      console.error("preview proposal failed", err);
    } finally {
      abortRef.current = null;
    }
  };

  /**
   * Re-render the open review after an edit.
   *
   * Separate from openReview because it must NOT drop the operator back out of
   * the dialog while it works: it leaves `status` on 'review' and shows a small
   * "Updating" badge instead. A failed re-render leaves the last good email on
   * screen rather than an empty frame — the wording shown is then stale, but
   * the fields it came from are right there to compare against.
   */
  const refreshPreview = async (nextOverrides: EmailOverrides) => {
    // Its OWN controller, and the previous one is abandoned first: two edits in
    // quick succession would otherwise race, and a slow first response landing
    // after a fast second would put the wording you just replaced back on
    // screen. Also kept off abortRef, which belongs to the send.
    refreshAbortRef.current?.abort();
    const controller = new AbortController();
    refreshAbortRef.current = controller;
    setRefreshing(true);
    try {
      const next = await previewProposal(
        {
          ...data,
          proposalNumber: reservedNumberRef.current,
          overrides: nextOverrides,
        },
        controller.signal,
      );
      setPreview(next);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        console.error("refresh preview failed", err);
      }
    } finally {
      // Only the newest request owns the spinner — an aborted one clearing it
      // would say "up to date" while a re-render is still in flight.
      if (refreshAbortRef.current === controller) {
        refreshAbortRef.current = null;
        setRefreshing(false);
      }
    }
  };

  /**
   * Step two: the operator has read it. Build the PDF and send.
   *
   * Uses the number reserved for the review rather than reserving another —
   * that number is already printed in the subject line they just approved.
   */
  const handleSend = async () => {
    if (!canSend || status.kind === "sending") return;
    cancelledRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    setSendError("");
    setStatus({ kind: "sending" });
    try {
      const proposalNumber = reservedNumberRef.current;
      // renderProposalPdf keeps the engine a lazy chunk fetched on first send,
      // and is the same call the customer's approve page makes to build their
      // download — so the two copies can't drift.
      const blob = await renderProposalPdf({
        data,
        photos,
        dateLabel: proposalDateLabel(),
        proposalNumber,
      });
      if (cancelledRef.current) return;
      const pdfBase64 = await blobToBase64(blob);
      if (cancelledRef.current) return;
      const result = await sendProposal(
        {
          ...data,
          proposalNumber,
          pdfBase64,
          // Stored alongside the quote so the customer's own re-download is the
          // same document, not a version with the photographs missing.
          photos,
          filename: proposalFilename(data.customer.name, proposalNumber),
          // The same two lines the operator just approved. Without these the
          // review would be a preview of an email that then goes out reworded.
          overrides,
        },
        controller.signal,
      );
      reservedNumberRef.current = null;
      setPreview(null);
      setOverrides({});
      setStatus({ kind: "sent", stored: result.stored });
    } catch (err) {
      // A cancel (flag set, or the fetch aborted) is not an error — stay idle.
      if (
        cancelledRef.current ||
        (err instanceof DOMException && err.name === "AbortError")
      ) {
        return;
      }
      // Back to the review, not out to the form: the email is still correct and
      // still approved, so the recovery is one more press of Send it.
      setStatus({ kind: "review" });
      setSendError(
        "Could not send the proposal. Check the connection and try again.",
      );
      console.error("send proposal failed", err);
    } finally {
      abortRef.current = null;
    }
  };

  /** Close the review without sending. The email, the overrides and the
   *  reserved number all survive, so re-opening is instant and costs nothing. */
  const closeReview = () => {
    if (status.kind === "sending") return;
    setSendError("");
    setStatus({ kind: "idle" });
  };

  /** Abort an in-flight send. Back to the review rather than the form: the
   *  email was already approved, so the operator is one press from retrying. */
  const handleCancelSend = () => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    setSendError("");
    setStatus(preview ? { kind: "review" } : { kind: "idle" });
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const startNew = () => {
    clearDraft();
    setPhotos([]);
    // A new proposal gets a new number and a freshly composed email — carrying
    // the last one's reworded greeting into the next customer's inbox is
    // exactly the mistake the review step exists to prevent.
    reservedNumberRef.current = null;
    setPreview(null);
    setOverrides({});
    setSendError("");
    setStatus({ kind: "idle" });
  };

  if (status.kind === "saved") {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-brand-blue/40 bg-brand-blue/15">
            <Link2 className="h-8 w-8 text-brand-blue-light" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            Link ready
          </h2>
          <p className="mt-2 text-gray-300">
            Nothing was emailed. Send this to{" "}
            {data.customer.name.trim() || "them"} however you like — it opens
            with the full breakdown of the service, then the plans.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] p-2 pl-4 text-left">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-300">
              {status.url}
            </span>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(status.url);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1800);
                } catch {
                  window.prompt("Copy the link:", status.url);
                }
              }}
              className="shrink-0 rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue-light"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark px-5 py-3 font-semibold text-white"
            >
              <FilePlus2 className="h-5 w-5" /> New proposal
            </button>
            <button
              onClick={() => setStatus({ kind: "idle" })}
              className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-gray-200 hover:bg-white/5"
            >
              Back to this one
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status.kind === "sent") {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-green-500/30 bg-green-500/15">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            Proposal sent
          </h2>
          <p className="mt-2 text-gray-300">
            Emailed to <span className="text-white">{data.customer.email}</span>{" "}
            with the PDF attached. A copy was BCC&apos;d to your inbox.
          </p>
          {/*
            The send succeeded and the quote did NOT save. Deliberately loud:
            the customer has a proposal you can't see, their email has no accept
            link, and nothing in Sent Quotes will ever show it. Before this the
            screen said "Proposal sent" and stopped, so the only failure worth
            acting on was the only one that looked identical to success.
          */}
          {!status.stored && (
            <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-left">
              <p className="font-semibold text-amber-200">
                Sent, but not saved.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-100/90">
                Storage was unavailable, so this proposal went out{" "}
                <strong>without an accept link</strong> and it will not appear
                in Sent Quotes. The customer has the PDF and can still reply.
                Check the D1 binding, then send again to give them a link they
                can accept from.
              </p>
            </div>
          )}
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark px-5 py-3 font-semibold text-white"
            >
              <FilePlus2 className="h-5 w-5" /> New proposal
            </button>
            <button
              onClick={() => setStatus({ kind: "idle" })}
              className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-gray-200 hover:bg-white/5"
            >
              Back to this one
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 py-6 md:px-8 md:py-10">
      {/* The email, before it goes anywhere. Stays mounted through the send so
          the spinner and the Cancel sit where the operator is already looking,
          rather than under a second overlay that hides what they just read. */}
      {preview && (status.kind === "review" || status.kind === "sending") && (
        <EmailReview
          preview={preview}
          overrides={overrides}
          onOverridesChange={setOverrides}
          refreshing={refreshing}
          onRequestRerender={refreshPreview}
          toEmail={data.customer.email || "the customer"}
          attachmentName={proposalFilename(
            data.customer.name,
            reservedNumberRef.current,
          )}
          sending={status.kind === "sending"}
          error={sendError}
          onSend={handleSend}
          onCancel={status.kind === "sending" ? handleCancelSend : closeReview}
        />
      )}

      <div className="mx-auto max-w-6xl">
        {/* Top bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              onClick={onBack}
              className="mb-1 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" /> All documents
            </button>
            <h1 className="font-display text-2xl font-bold text-white">
              New Proposal
            </h1>
            <p className="text-sm text-gray-400">
              Draft saves automatically as you type.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              <Trash2 className="h-4 w-4" /> Clear
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" /> Lock
            </button>
          </div>
        </div>

        {/* One column until the chooser is answered: the preview is gated on
            the same condition, and a half-width question beside a blank half
            reads as a broken page rather than a first step. The grid splits
            at the exact moment the preview exists to fill the other side. */}
        <div
          className={`grid grid-cols-1 gap-8 ${
            chooserComplete
              ? "lg:grid-cols-2"
              : /* Centered in the leftover viewport as well as full width: a
                   lone question hugging the top of an empty screen reads as
                   the page having failed to load the rest. The calc leaves
                   room for the header block above; desktop only, because a
                   phone has no leftover height to centre in. */
                "lg:min-h-[calc(100dvh-12rem)] lg:content-center"
          }`}
        >
          {/* ---- Form ---- */}
          <div className="space-y-8">
            {/* FIRST, above the customer, because it decides what the whole
                document says — not a preference buried near the pricing. The
                operator answers it once and every downstream section follows.
                Three rather than two: a repair and a green-to-clean are both
                "one-time", but they are sold against completely different
                worries — a price that moves versus a part you did not need. */}
            <Section title="What are you quoting?">
              <div
                role="radiogroup"
                aria-label="What are you quoting?"
                className="grid grid-cols-1 gap-3 sm:grid-cols-3"
              >
                {/* TITLE-ONLY. The three labels explain themselves, and the
                    explanatory sentences made a three-way tap read like a
                    form to study — this is the one control an operator hits
                    on every quote, often on a phone in the sun. The hints
                    stay in JOB_KINDS (they document the kinds) but are not
                    rendered here. The icon carries the selected state as
                    strongly as the border, so the answer reads at a glance
                    from across a truck cab. */}
                {JOB_KINDS.map((k) => {
                  const picked = rawKind === k.key;
                  const Icon =
                    k.key === "recurring"
                      ? Repeat
                      : k.key === "recovery"
                        ? Sparkles
                        : Wrench;
                  return (
                    <button
                      key={k.key}
                      role="radio"
                      aria-checked={picked}
                      onClick={() => update("proposal", "jobKind", k.key)}
                      className={`group flex flex-col items-center gap-2.5 rounded-xl border px-4 py-5 transition-all ${
                        /* Taller while the chooser has the whole screen: at
                           full width the same padding reads squat. Returns to
                           py-5 when the form opens and the cards share a
                           column with everything else. */
                        chooserComplete ? "" : "lg:gap-3.5 lg:py-10"
                      } ${
                        picked
                          ? "border-brand-blue bg-brand-blue/15 shadow-lg shadow-brand-blue/10"
                          : "border-white/10 bg-white/5 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]"
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                          picked
                            ? "bg-brand-blue text-white"
                            : "bg-white/10 text-gray-400 group-hover:text-gray-200"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-center font-display text-sm font-bold text-white">
                        {k.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* The cadence, asked ONLY once the answer is "recurring" — a
                  green-to-clean has no frequency, so showing the chips there
                  would be a question with no correct answer. It prints under
                  the rate on the plan cards and the PDF, because "$165/mo"
                  with nothing to divide it by was the most price-relevant
                  fact missing from the proposal. Inserting a Weekly or
                  Bi-Weekly scope template sets this for you. */}
              {rawKind === "recurring" && (
                <div
                  role="radiogroup"
                  aria-label="How often"
                  className="flex items-center gap-2"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    How often
                  </span>
                  {CADENCES.map((c) => {
                    const picked = cadence === c.key;
                    return (
                      <button
                        key={c.key}
                        role="radio"
                        aria-checked={picked}
                        onClick={() => update("proposal", "cadence", c.key)}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                          picked
                            ? "border-brand-blue bg-brand-blue/10 font-semibold text-white"
                            : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {(rawKind === "recovery" || rawKind === "repair") && (
                <p className="text-xs leading-relaxed text-gray-500">
                  The proposal drops the weekly-service promises and the monthly
                  comparison table, and answers what a one-off buyer actually
                  asks instead. Inserting a scope template moves this for you.
                </p>
              )}

              {/* The fourth answer, deliberately NOT a fourth chip. The three
                  above change which paragraphs print on this document; this one
                  changes which document you are filling in — many bodies of
                  water, a statutory classification, contract terms. Presenting
                  it as a peer of the other three would imply it is the same
                  kind of choice, and the form cannot honour that. */}
              <button
                onClick={() => onCommercial(data.customer)}
                className="group flex w-full items-start gap-3 rounded-xl border border-dashed border-white/15 px-4 py-3 text-left transition-colors hover:border-brand-blue/50 hover:bg-white/5"
              >
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-gray-500 group-hover:text-brand-blue-light" />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-gray-200">
                    An HOA, condo association or commercial pool?
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                    That needs the Commercial Bid — every body of water priced
                    by frequency, the compliance scope and the contract terms a
                    board reads. Anything typed here comes with you.
                  </span>
                </span>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-blue-light" />
              </button>
              {/* The rest of the form waits for the answer — see
                  chooserComplete above. The hint names the missing step so an
                  untouched form never reads as broken. */}
              {!chooserComplete && (
                <p className="text-sm text-gray-500">
                  {kindChosen
                    ? "Pick how often we'll come and the rest of the form opens."
                    : "Pick one and the rest of the form opens."}
                </p>
              )}
            </Section>

            {chooserComplete && (
              <>
            <Section title="Customer">
              {/* WHO this is addressed to. A rental or HOA pool is often
                  managed by a company, and the document should carry the
                  company's name — while the email greeting must NOT then
                  open "Hello Blue," at Blue Horizon. The toggle states the
                  fact; the fields compose customer.name so everything
                  downstream (PDF, email, approve page) is unchanged. */}
              <div
                role="radiogroup"
                aria-label="Prepared for"
                className="flex items-center gap-2"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Prepared for
                </span>
                {(
                  [
                    { key: "person", label: "Person" },
                    { key: "company", label: "Company" },
                  ] as const
                ).map((m) => {
                  const picked = (data.customer.nameMode ?? "person") === m.key;
                  return (
                    <button
                      key={m.key}
                      role="radio"
                      aria-checked={picked}
                      onClick={() => setNameParts({ nameMode: m.key })}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        picked
                          ? "border-brand-blue bg-brand-blue/10 font-semibold text-white"
                          : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
              {(data.customer.nameMode ?? "person") === "company" ? (
                <FieldShell id="c-company" label="Company name">
                  {/* No title-case blur here — "ABC Property Management LLC"
                      must not become "Llc". Companies are typed as they are. */}
                  <input
                    id="c-company"
                    className={fieldClass}
                    placeholder=" "
                    autoComplete="off"
                    value={data.customer.company ?? ""}
                    onChange={(e) => setNameParts({ company: e.target.value })}
                  />
                </FieldShell>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FieldShell id="c-first" label="First name">
                    <input
                      id="c-first"
                      className={fieldClass}
                      placeholder=" "
                      autoComplete="off"
                      autoCapitalize="words"
                      value={data.customer.firstName ?? ""}
                      onChange={(e) =>
                        setNameParts({ firstName: e.target.value })
                      }
                      onBlur={(e) =>
                        setNameParts({ firstName: toTitleCase(e.target.value) })
                      }
                    />
                  </FieldShell>
                  <FieldShell id="c-last" label="Last name">
                    <input
                      id="c-last"
                      className={fieldClass}
                      placeholder=" "
                      autoComplete="off"
                      autoCapitalize="words"
                      value={data.customer.lastName ?? ""}
                      onChange={(e) =>
                        setNameParts({ lastName: e.target.value })
                      }
                      onBlur={(e) =>
                        setNameParts({ lastName: toTitleCase(e.target.value) })
                      }
                    />
                  </FieldShell>
                </div>
              )}
              <FieldShell id="c-addr" label="Service address">
                <input
                  id="c-addr"
                  className={fieldClass}
                  placeholder=" "
                  autoComplete="off"
                  autoCapitalize="words"
                  value={data.customer.address}
                  onChange={(e) =>
                    update("customer", "address", e.target.value)
                  }
                  onBlur={(e) =>
                    update("customer", "address", toTitleCase(e.target.value))
                  }
                />
              </FieldShell>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="c-email" label="Email">
                  <input
                    id="c-email"
                    type="email"
                    className={fieldClass}
                    placeholder=" "
                    autoComplete="off"
                    value={data.customer.email}
                    onChange={(e) =>
                      update("customer", "email", e.target.value)
                    }
                  />
                </FieldShell>
                <FieldShell id="c-phone" label="Phone">
                  <input
                    id="c-phone"
                    type="tel"
                    className={fieldClass}
                    placeholder=" "
                    autoComplete="off"
                    value={data.customer.phone}
                    onChange={(e) =>
                      update("customer", "phone", e.target.value)
                    }
                    onBlur={(e) =>
                      update("customer", "phone", formatUsPhone(e.target.value))
                    }
                  />
                </FieldShell>
              </div>

              {/* Sits with the customer, not down by the document settings: it's
                  the message TO this person, and it's written while they're
                  still in mind — right after typing their name. */}
              <FieldShell
                id="pr-emailnote"
                label="Personal note — email only, not on the PDF"
                multiline
              >
                <textarea
                  id="pr-emailnote"
                  rows={4}
                  className={textareaClass}
                  placeholder=" "
                  value={data.proposal.emailNote}
                  onChange={(e) =>
                    update("proposal", "emailNote", e.target.value)
                  }
                />
              </FieldShell>
              <p className="-mt-2 text-xs text-gray-500">
                Appears at the top of the email, under the greeting and above
                the plan options. The PDF is the formal document and stays
                clean.
              </p>
              {data.proposal.emailNote.trim() && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    In the email
                  </p>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-200">
                    {data.proposal.emailNote.trim()}
                  </p>
                </div>
              )}
            </Section>

            {/* Shut by default: quotes are mostly written off site, without
                the dimensions. Opens itself when a restored draft already has
                any of them, so collapsing never hides typed data. */}
            <CollapsibleSection
              title="Pool — Size & Volume"
              hint="Optional"
              defaultOpen={Boolean(
                data.pool.gallons.trim() ||
                  data.pool.shape.trim() ||
                  data.pool.length.trim() ||
                  data.pool.width.trim() ||
                  data.pool.avgDepth.trim(),
              )}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="p-gal" label="Volume (gallons)">
                  <input
                    id="p-gal"
                    inputMode="numeric"
                    className={fieldClass}
                    placeholder=" "
                    value={data.pool.gallons}
                    onChange={(e) => update("pool", "gallons", e.target.value)}
                  />
                </FieldShell>
                <FieldShell id="p-shape" label="Shape" floated>
                  <select
                    id="p-shape"
                    className={selectClass}
                    value={data.pool.shape}
                    onChange={(e) => update("pool", "shape", e.target.value)}
                  >
                    <option value=""></option>
                    <option>Rectangle</option>
                    <option>Oval / Freeform</option>
                    <option>Round</option>
                    <option>Kidney</option>
                    <option>L-shape</option>
                    <option>Other</option>
                  </select>
                </FieldShell>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FieldShell id="p-len" label="Length (ft)">
                  <input
                    id="p-len"
                    inputMode="decimal"
                    className={fieldClass}
                    placeholder=" "
                    value={data.pool.length}
                    onChange={(e) => update("pool", "length", e.target.value)}
                  />
                </FieldShell>
                <FieldShell id="p-wid" label="Width (ft)">
                  <input
                    id="p-wid"
                    inputMode="decimal"
                    className={fieldClass}
                    placeholder=" "
                    value={data.pool.width}
                    onChange={(e) => update("pool", "width", e.target.value)}
                  />
                </FieldShell>
                <FieldShell id="p-dep" label="Avg depth (ft)">
                  <input
                    id="p-dep"
                    inputMode="decimal"
                    className={fieldClass}
                    placeholder=" "
                    value={data.pool.avgDepth}
                    onChange={(e) => update("pool", "avgDepth", e.target.value)}
                  />
                </FieldShell>
              </div>
              {/* The dimensions above already say what the volume is — so say
                  it, as a RANGE, and let one tap put it in the field. Never a
                  bare number: see poolVolume.ts. Never auto-filled either —
                  the operator stays the author of what the document claims. */}
              {(() => {
                const range = suggestGallonsRange(data.pool);
                if (!range) return null;
                const label = `${range} gallons`;
                const applied = data.pool.gallons.trim() === label;
                return (
                  <p className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                    <span>
                      These dimensions work out to about{" "}
                      <span className="font-semibold text-gray-200">
                        {label}
                      </span>
                      .
                    </span>
                    {applied ? (
                      <span className="text-xs text-gray-500">
                        In the volume field.
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => update("pool", "gallons", label)}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-200 transition-colors hover:border-brand-blue/50 hover:bg-white/10"
                      >
                        {data.pool.gallons.trim() ? "Replace volume" : "Use it"}
                      </button>
                    )}
                  </p>
                );
              })()}
              <a
                href="/tools/pool-volume-calculator/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue-light hover:text-white"
              >
                <Calculator className="h-4 w-4" /> Open the volume calculator
                (your draft is saved)
              </a>
            </CollapsibleSection>

            <Section title="Pool — Sanitization & Equipment">
              <FieldShell id="p-san" label="Sanitization" floated>
                <select
                  id="p-san"
                  className={selectClass}
                  value={data.pool.sanitization}
                  /* Re-syncs the tiers in the SAME update. The salt-cell rows
                     on the three-plan cards are derived from this field, and a
                     plain update() left them stored as built — switch a salt
                     pool to chlorine and "Salt-cell acid cleaning included"
                     stayed on the Complete cards. Same one-state-change rule
                     as the filter controls; sync only touches machine text, so
                     an edited card is still safe. */
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      pool: { ...p.pool, sanitization: e.target.value },
                      proposal: {
                        ...p.proposal,
                        tiers: syncFilterService(
                          p.proposal.tiers,
                          {
                            type: p.pool.filterType,
                            included: p.pool.filterServiceIncluded === "yes",
                          },
                          e.target.value,
                        ),
                      },
                    }))
                  }
                >
                  <option value=""></option>
                  {SANITIZATION_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </FieldShell>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="p-pump" label="Pump">
                  <input
                    id="p-pump"
                    className={fieldClass}
                    placeholder=" "
                    autoCapitalize="words"
                    value={data.pool.pump}
                    onChange={(e) => update("pool", "pump", e.target.value)}
                    onBlur={(e) =>
                      update("pool", "pump", toTitleCase(e.target.value))
                    }
                  />
                </FieldShell>
                <FieldShell id="p-heater" label="Heater">
                  <input
                    id="p-heater"
                    className={fieldClass}
                    placeholder=" "
                    autoCapitalize="words"
                    value={data.pool.heater}
                    onChange={(e) => update("pool", "heater", e.target.value)}
                    onBlur={(e) =>
                      update("pool", "heater", toTitleCase(e.target.value))
                    }
                  />
                </FieldShell>
                {/* Filter type and its make/model sit together — with five fields
                    in a two-column grid the model field previously landed beside
                    Heater, pairing it with the wrong thing. */}
                <FieldShell id="p-filter-type" label="Filter type" floated>
                  <select
                    id="p-filter-type"
                    className={selectClass}
                    value={data.pool.filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value=""></option>
                    {FILTER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FieldShell>
                <FieldShell id="p-filter" label="Filter make & model">
                  <input
                    id="p-filter"
                    className={fieldClass}
                    placeholder=" "
                    autoCapitalize="words"
                    value={data.pool.filter}
                    onChange={(e) => update("pool", "filter", e.target.value)}
                    onBlur={(e) =>
                      update("pool", "filter", toTitleCase(e.target.value))
                    }
                  />
                </FieldShell>
              </div>
              {/* A required choice, not a dropdown with a default. This field
                  decides whether the quote promises a filter replacement, so it
                  must be answered deliberately — and two full-width buttons beat
                  a select on a phone: bigger targets, no truncated option text,
                  and "unanswered" is visible at a glance. */}
              {supportsFilterService(data.pool.filterType) && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-200">
                    {inclusionQuestion(data.pool.filterType)}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      {
                        value: "yes",
                        label: "Yes",
                        hint: "Included in the monthly cost",
                      },
                      {
                        value: "no",
                        label: "No",
                        hint: "Quoted separately when needed",
                      },
                    ].map((opt) => {
                      const on = filterAnswer === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setFilterIncluded(opt.value)}
                          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                            on
                              ? "border-brand-blue-light bg-brand-blue text-white ring-2 ring-brand-blue-light/40"
                              : "border-white/15 bg-white/5 text-gray-300 hover:border-brand-blue-light hover:text-white"
                          }`}
                        >
                          {/* A filled tick, not just a tint: the previous 25%
                              wash over a navy panel was easy to mistake for the
                              browser's focus ring. */}
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              on
                                ? "border-white bg-white text-brand-blue"
                                : "border-white/30"
                            }`}
                          >
                            {on && (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            )}
                          </span>
                          <span>
                            <span className="block text-base font-semibold">
                              {opt.label}
                            </span>
                            <span
                              className={`block text-xs ${on ? "text-white/80" : "text-gray-400"}`}
                            >
                              {opt.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {filterAnswer === "" && (
                    <p className="text-xs text-amber-300/90">
                      Pick one — this decides whether the quote promises a
                      filter replacement.
                    </p>
                  )}
                </div>
              )}

              {/* Automation had its own field; it's rare enough on a sales
                  document that it lives here now when it's worth a mention. */}
              <FieldShell
                id="p-eqnotes"
                label="Equipment notes — automation, anything unusual"
                multiline
              >
                <textarea
                  id="p-eqnotes"
                  rows={2}
                  className={textareaClass}
                  placeholder=" "
                  value={data.pool.equipmentNotes}
                  onChange={(e) =>
                    update("pool", "equipmentNotes", e.target.value)
                  }
                />
              </FieldShell>
            </Section>

            <Section title="Photos">
              <PhotoPicker
                photos={photos}
                setPhotos={setPhotos}
                hint="Optional — attach pool or property photos to include in the proposal."
              />
            </Section>

            <Section title="Proposal">
              <FieldShell
                id="pr-template"
                label="Insert a service template"
                floated
              >
                <select
                  id="pr-template"
                  className={selectClass}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) insertScopeTemplate(e.target.value);
                    e.currentTarget.selectedIndex = 0; // reset so the same one can be re-picked
                  }}
                >
                  <option value="">Choose a service to add details…</option>
                  {/* GROUPED by job kind, under the same words as the chips at
                      the top — the menu teaches the classification instead of
                      hiding behind suffixes. Deliberately NOT filtered by the
                      current answer: a fresh draft defaults to recurring, so a
                      filtered menu would hide Green Pool Recovery until the
                      chips were flipped — yet picking the template is supposed
                      to BE how the chips get flipped. And templates combine
                      across kinds (recover it, then keep it weekly), which a
                      filtered list would forbid. */}
                  {JOB_KINDS.map((k) => {
                    const group = SCOPE_TEMPLATES.filter(
                      (t) => t.kind === k.key,
                    );
                    return group.length ? (
                      <optgroup key={k.key} label={k.label}>
                        {group.map((t) => (
                          <option key={t.label} value={t.label}>
                            {t.label}
                          </option>
                        ))}
                      </optgroup>
                    ) : null;
                  })}
                </select>
              </FieldShell>
              <FieldShell id="pr-scope" label="Scope of work" multiline>
                <textarea
                  id="pr-scope"
                  rows={8}
                  className={textareaClass}
                  placeholder=" "
                  value={data.proposal.scope}
                  onChange={(e) => update("proposal", "scope", e.target.value)}
                />
              </FieldShell>
              {/* TWO THINGS THE SCOPE CANNOT FIX ITSELF.
                  It is free text after insertion, so nothing re-tailors it
                  when the pool changes, and nothing notices a bracket
                  placeholder that was never filled in. Both reach the customer
                  verbatim. Warnings rather than blocks: the operator may have
                  rewritten the scope deliberately, and a hard gate on free
                  text would fire on false positives forever. */}
              {scopeStale && (
                <p className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    The pool changed after this scope was inserted — it still
                    describes a{" "}
                    {scopeStale.filterType || "filter type not yet set"} filter
                    {scopeStale.sanitization
                      ? ` on a ${scopeStale.sanitization} pool`
                      : ""}
                    . Re-insert the template, or edit the text to match.
                  </span>
                </p>
              )}
              {scopePlaceholders.length > 0 && (
                <p className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Unfilled placeholder{scopePlaceholders.length > 1 ? "s" : ""}{" "}
                    still in the scope: {scopePlaceholders.join(", ")}. The
                    customer sees these exactly as written.
                  </span>
                </p>
              )}
              <FieldShell
                id="pr-price"
                label={
                  data.proposal.pricingMode === "tiers"
                    ? "Base rate — seeds the plans (e.g. 165/mo)"
                    : "Total price (e.g. $2,400 or $185/mo)"
                }
              >
                <input
                  id="pr-price"
                  className={fieldClass}
                  placeholder=" "
                  value={data.proposal.price}
                  onChange={(e) => setBasePrice(e.target.value)}
                />
              </FieldShell>

              {/* THREE SHAPES, ONE ROW.
                  The comparison plan used to live in a checkbox inside the
                  Plans section below — invisible until you had already picked
                  "Two plans", and invisible even then unless the filter
                  question said yes. An option nobody can see is an option
                  nobody uses. It is a peer chip now, and when it is not
                  available it still SHOWS, disabled, saying what it needs:
                  a missing option reads as "we don't do that", a disabled one
                  reads as "not yet". */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { key: "single", label: "One price" },
                    { key: "two", label: "Two plans" },
                    { key: "three", label: "Three plans" },
                  ] as const
                ).map(({ key, label }) => {
                  const on = planShape === key;
                  const blocked = key === "three" && !canOfferEssentials;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={on}
                      disabled={blocked}
                      title={
                        blocked
                          ? "Adds an Essentials plan without filter parts — needs the filter service included in the monthly price."
                          : undefined
                      }
                      onClick={() => setPlanShape(key)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                        blocked
                          ? "cursor-not-allowed border-white/10 text-gray-600"
                          : on
                            ? "border-brand-blue-light bg-brand-blue/25 text-white"
                            : "border-white/15 text-gray-300 hover:border-brand-blue-light hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
                {data.proposal.pricingMode === "tiers" && (
                  <button
                    type="button"
                    onClick={resetTiers}
                    className="ml-auto text-sm font-semibold text-brand-blue-light hover:text-white"
                  >
                    Reset to preset
                  </button>
                )}
              </div>
              {/* Plan cards are stored in the draft, so editing the presets does
                  nothing to a proposal already in progress. This is the only
                  signal that the saved wording has been superseded. */}
              {presetsOutdated && (
                <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                  The plan wording has been updated since this draft was
                  started. Reset to preset to pick it up — that replaces both
                  plans, including any edits you made here.
                </p>
              )}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 ${
                  data.proposal.pricingMode === "tiers" ? "opacity-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={data.proposal.includeBenefits}
                  onChange={(e) =>
                    update("proposal", "includeBenefits", e.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 accent-brand-blue"
                />
                <span className="text-sm text-gray-200">
                  Show the &ldquo;{trustHeading(jobKind)}&rdquo; panel{" "}
                  <span className="text-gray-400">
                    {data.proposal.pricingMode === "tiers"
                      ? "(always shown on a tiered proposal — it defines the service both plans include)"
                      : jobKind === "recurring"
                        ? "(chemicals, filter and salt-cell cleans — recommended)"
                        : "(the flat price, what’s included and what you’re not committing to — recommended)"}
                  </span>
                </span>
              </label>
            </Section>

            {data.proposal.pricingMode === "tiers" && (
              <Section title="Plans">
                <p className="text-xs leading-relaxed text-gray-500">
                  The PDF shows the upgrade as &ldquo;Everything in{" "}
                  {data.proposal.tiers[0]?.name || "the first plan"},
                  plus&rdquo; its own extras, because both cards sit side by
                  side there. The web page lists everything in each card instead
                  &mdash; a phone stacks them with the recommended one first,
                  where a backward reference would point at something not yet
                  read.
                </p>
                {data.proposal.tiers.map((tier, i) => (
                  <div
                    key={i}
                    className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    {/* Collapsed by default: the presets are right for almost
                        every proposal, so the common case is reading them, not
                        rewriting them. The summary keeps the two things that DO
                        change per customer — which plan is recommended, and the
                        rate — visible without expanding anything. */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Plan {i + 1}
                      </span>
                      <span className="font-semibold text-white">
                        {tier.name.trim() || "—"}
                      </span>
                      {tier.price.trim() && (
                        <span className="text-sm text-brand-blue-light">
                          {formatPrice(tier.price)}
                        </span>
                      )}
                      <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-gray-200">
                        <input
                          type="radio"
                          name="recommended-tier"
                          checked={tier.recommended}
                          onChange={() => setRecommended(i)}
                          className="h-4 w-4 accent-brand-blue"
                        />
                        Recommended
                      </label>
                      <button
                        type="button"
                        aria-expanded={editingTier === i}
                        onClick={() =>
                          setEditingTier(editingTier === i ? null : i)
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        {editingTier === i ? "Done" : "Edit"}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${editingTier === i ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                    {editingTier === i && (
                      <div className="space-y-4">
                        <FieldShell id={`tier-name-${i}`} label="Plan name">
                          <input
                            id={`tier-name-${i}`}
                            className={fieldClass}
                            placeholder=" "
                            value={tier.name}
                            onChange={(e) =>
                              updateTier(i, { name: e.target.value })
                            }
                          />
                        </FieldShell>
                        {/* The Essentials rate is the one price that is NOT
                            derived. How much comes off depends on this pool —
                            a heavy-debris pool burns more phosphate remover
                            and more filter life than a screened one — so it is
                            a judgement, not a formula. Seeded from the base
                            rate and left alone once typed over. */}
                        {tier.essentials ? (
                          <FieldShell
                            id={`tier-price-${i}`}
                            label="Essentials rate (e.g. 155/mo)"
                          >
                            <input
                              id={`tier-price-${i}`}
                              className={fieldClass}
                              placeholder=" "
                              value={tier.price}
                              onChange={(e) =>
                                updateTier(i, { price: e.target.value })
                              }
                            />
                          </FieldShell>
                        ) : (
                        /* Read-only: both all-inclusive plans price off the
                        base rate above, so there's nothing to type here and no
                        way for the two to disagree. */
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Price
                          </p>
                          {tier.price.trim() ? (
                            <>
                              <p className="text-lg font-bold text-white">
                                {formatPrice(tier.price)}
                              </p>
                              {tier.priceNote.trim() && (
                                <p className="text-xs font-semibold text-brand-blue-light">
                                  {tier.priceNote}
                                </p>
                              )}
                              {tier.billingNote?.trim() && (
                                <p className="text-xs text-gray-400">
                                  {tier.billingNote}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-gray-400">
                              Set the base rate above.
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Calculated from the base rate.
                          </p>
                        </div>
                        )}
                        <FieldShell
                          id={`tier-tagline-${i}`}
                          label="One-line tagline"
                        >
                          <input
                            id={`tier-tagline-${i}`}
                            className={fieldClass}
                            placeholder=" "
                            value={tier.tagline}
                            onChange={(e) =>
                              updateTier(i, { tagline: e.target.value })
                            }
                          />
                        </FieldShell>
                        <FieldShell
                          id={`tier-includes-${i}`}
                          label={
                            i === 0
                              ? "What's included — one per line"
                              : "What it adds — one per line"
                          }
                          multiline
                        >
                          <textarea
                            id={`tier-includes-${i}`}
                            rows={6}
                            className={textareaClass}
                            placeholder=" "
                            value={tier.includes.join("\n")}
                            onChange={(e) =>
                              updateTier(i, {
                                includes: e.target.value.split("\n"),
                              })
                            }
                          />
                        </FieldShell>
                        {i > 0 && (
                          <FieldShell
                            id={`tier-value-${i}`}
                            label="Value note — the break-even line"
                            multiline
                          >
                            <textarea
                              id={`tier-value-${i}`}
                              rows={3}
                              className={textareaClass}
                              placeholder=" "
                              value={tier.valueNote}
                              onChange={(e) =>
                                updateTier(i, { valueNote: e.target.value })
                              }
                            />
                          </FieldShell>
                        )}
                        <FieldShell
                          id={`tier-fine-${i}`}
                          label="Fine print / limits"
                          multiline
                        >
                          <textarea
                            id={`tier-fine-${i}`}
                            rows={3}
                            className={textareaClass}
                            placeholder=" "
                            value={tier.finePrint}
                            onChange={(e) =>
                              updateTier(i, { finePrint: e.target.value })
                            }
                          />
                        </FieldShell>
                      </div>
                    )}
                  </div>
                ))}
              </Section>
            )}

            <Section title="Additional Services (optional)">
              <p className="-mt-1 text-sm text-gray-400">
                À-la-carte extras, listed separately on the proposal. Quick-add
                a common one, then set its price.
              </p>
              <div className="flex flex-wrap gap-2">
                {ADDON_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      addAddOn(preset.label, preset.defaultPrice ?? "")
                    }
                    className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-brand-blue-light hover:text-white"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
              {data.proposal.addOns.length > 0 && (
                <div className="space-y-2">
                  {data.proposal.addOns.map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        className={addonInput}
                        placeholder="Service"
                        autoCapitalize="words"
                        value={a.label}
                        onChange={(e) =>
                          updateAddOn(i, "label", e.target.value)
                        }
                        onBlur={(e) =>
                          updateAddOn(i, "label", toTitleCase(e.target.value))
                        }
                      />
                      <input
                        className={`${addonInput} w-32 shrink-0`}
                        placeholder="Price"
                        value={a.price}
                        onChange={(e) =>
                          updateAddOn(i, "price", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeAddOn(i)}
                        aria-label="Remove service"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => addAddOn()}
                className="text-sm font-semibold text-brand-blue-light hover:text-white"
              >
                + Custom line
              </button>
            </Section>
              </>
            )}
          </div>

          {/* ---- Live preview + send ---- */}
          {/* Sticky column with its OWN scroll: the preview is usually taller than
              the viewport, and before this the only way to see its foot was to
              scroll the entire form past it. Only the preview scrolls — the Send
              button and its validation hint stay pinned below it. */}
          {chooserComplete && (
          <div className="lg:sticky lg:top-8 lg:self-start lg:flex lg:max-h-[calc(100dvh-4rem)] lg:flex-col">
            <div className="admin-scroll lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
              <ProposalPreview
                data={data}
                photos={photos}
                dateLabel={proposalDateLabel()}
              />
            </div>

            {status.kind === "error" && (
              <div
                role="alert"
                className="mt-4 shrink-0 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <span>{status.message}</span>
              </div>
            )}

            <button
              onClick={() => openReview()}
              disabled={
                !canSend ||
                status.kind === "preparing" ||
                status.kind === "sending"
              }
              className="mt-4 shrink-0 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark py-4 text-lg font-bold text-white shadow-lg shadow-brand-blue/20 transition-all hover:from-brand-blue-light hover:to-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.kind === "preparing" ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" /> Preparing
                  the email…
                </>
              ) : (
                <>
                  Review &amp; send <Send className="h-5 w-5" />
                </>
              )}
            </button>
            {!canSend && (
              <p className="mt-2 shrink-0 text-center text-xs text-gray-500">
                {!filterAnswered
                  ? `Answer “${inclusionQuestion(data.pool.filterType)}” to send.`
                  : "Enter a valid email address to send."}
              </p>
            )}

            {/* The second way out, for a lead who texted rather than emailed.
                Deliberately quieter than Send — it's the exception, and it
                needs no email address, which is the whole reason it exists. */}
            <button
              onClick={handleSaveLink}
              disabled={
                !canSaveLink ||
                status.kind === "saving" ||
                status.kind === "preparing" ||
                status.kind === "sending"
              }
              className="mt-3 shrink-0 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.kind === "saving" ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Creating
                  link…
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" /> Create link only — don&apos;t
                  email
                </>
              )}
            </button>
            {!canSaveLink && (
              <p className="mt-2 shrink-0 text-center text-xs text-gray-500">
                {!filterAnswered
                  ? "Answer the filter question to create a link."
                  : "Enter the service address to create a link."}
              </p>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

// HTML mirror of the PDF, kept visually close so the preview is trustworthy.
const ProposalPreview = ({
  data,
  photos,
  dateLabel,
}: {
  data: ProposalData;
  photos: string[];
  dateLabel: string;
}) => {
  const { customer, pool, proposal } = data;
  const dims = [
    pool.length && `${pool.length} ft L`,
    pool.width && `${pool.width} ft W`,
    pool.avgDepth && `${pool.avgDepth} ft avg`,
  ]
    .filter(Boolean)
    .join(" × ");
  const tiered = proposal.pricingMode === "tiers" && proposal.tiers.length > 0;
  const previewKind = jobKindOf(proposal.jobKind);
  const filterOption = {
    type: pool.filterType,
    included: pool.filterServiceIncluded === "yes",
  };
  const extras = includedExtras(
    filterOption,
    pool.sanitization,
    data.proposal.tiers.some((t) => t.essentials),
  );
  const tiers = tiered ? proposal.tiers : [];
  const delta = tierDelta(tiers[0], tiers[1]);
  const recommended =
    tiers.find((t) => t.recommended) ?? tiers[tiers.length - 1];
  const acceptWords = tiers
    .map((t) => t.name.trim().toUpperCase())
    .filter(Boolean)
    .sort((a, b) =>
      a === recommended?.name.trim().toUpperCase()
        ? -1
        : b === recommended?.name.trim().toUpperCase()
          ? 1
          : 0,
    );
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-800 shadow-xl">
      <div className="flex items-center justify-between border-b-4 border-brand-blue bg-navy px-6 py-5 text-white">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400">
            Suncoast Pool Pros
          </div>
          <div className="mt-0.5 text-lg font-bold">Service Proposal</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wide text-gray-400">
            Date
          </div>
          <div className="text-sm">{dateLabel}</div>
        </div>
      </div>
      <div className="space-y-5 px-6 py-5 text-sm">
        {/* The heading goes with its rows: a quote raised from an address
            alone printed "PREPARED FOR" over nothing at all. */}
        {[customer.name, customer.address, customer.email, customer.phone].some(
          (v) => v.trim(),
        ) && (
          <PreviewBlock label="Prepared For">
            <PreviewRow label="Name" value={customer.name} />
            <PreviewRow label="Service Address" value={customer.address} />
            <PreviewRow label="Email" value={customer.email} />
            <PreviewRow label="Phone" value={customer.phone} />
          </PreviewBlock>
        )}

        {/* Mirrors ProposalDocument exactly. A preview that shows the weekly
            promises while the PDF carries the one-time ones is worse than no
            preview — it is the operator approving a document they did not see. */}
        {(proposal.includeBenefits || tiered) && (
          <div className="rounded-lg border border-[#cfe3f2] bg-[#eef6fb] px-4 py-3">
            <div className="mb-2 text-sm font-bold text-brand-blue-dark">
              {previewKind === "recurring"
                ? BENEFITS_HEADING
                : trustHeading(previewKind)}
            </div>
            {previewKind === "recurring" &&
              data.proposal.tiers.some((t) => t.essentials) && (
                <p className="mb-2 text-[12px] font-semibold leading-relaxed text-brand-blue-dark">
                  {BENEFITS_PLAN_SCOPE}
                </p>
              )}
            {/* Same two-group split the PDF and the approve page use, so the
                operator previews exactly what the customer will read. */}
            {(() => {
              const list = (items: string[], k = "") => (
                <ul className="space-y-1">
                  {items.map((b, i) => (
                    <li
                      key={k + i}
                      className="flex gap-2 py-[3px] text-[13px] font-semibold leading-relaxed text-stone-800"
                    >
                      <span className="text-green-600">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              );
              const groups =
                previewKind === "recurring" &&
                data.proposal.tiers.some((t) => t.essentials) &&
                filterOption.included
                  ? splitBenefits(filterOption, pool.sanitization)
                  : null;
              if (!groups)
                return list(
                  previewKind === "recurring"
                    ? includedBenefits(filterOption, pool.sanitization)
                    : jobAssurances(previewKind),
                );
              const label =
                "mb-1 mt-2 text-[10px] font-bold uppercase tracking-wider text-stone-500";
              return (
                <>
                  <p className={label}>{BENEFITS_EVERY_HEADING}</p>
                  {list(groups.every, "e")}
                  <p className={label}>{BENEFITS_COMPLETE_HEADING}</p>
                  {list(groups.complete, "c")}
                </>
              );
            })()}
            {/* Mirrors the PDF's excluded-filter disclosure so the operator
                previews exactly what the customer will read. */}
            {previewKind === "recurring" && !filterOption.included && (
              <p className="mt-3 border-t border-stone-200 pt-2 text-[11px] leading-relaxed text-stone-500">
                {benefitsFootnote(filterOption)}
              </p>
            )}
          </div>
        )}

        {showsExtrasTable(previewKind) &&
          (proposal.includeBenefits || tiered) &&
          extras.length > 0 && (
            <PreviewBlock label={EXTRAS_HEADING}>
              <p className="mb-2 text-[12px] leading-relaxed text-stone-700">
                {extrasIntroFor(filterOption.included, data.proposal.tiers.some((t) => t.essentials))}
              </p>
              <div>
                <div className="flex gap-2 border-b border-stone-200 pb-1 text-[8px] uppercase tracking-wide text-stone-400">
                  <span className="flex-1" />
                  <span className="w-16 text-right">{EXTRAS_COL_THEIRS}</span>
                  <span className="w-12 text-right">{EXTRAS_COL_YOURS}</span>
                </div>
                {extras.map((x, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 py-1 ${
                      i < extras.length - 1 ? "border-b border-stone-100" : ""
                    }`}
                  >
                    <span className="flex-1">
                      <span className="block text-[12px] font-semibold text-navy">
                        {x.label}
                      </span>
                      <span className="block text-[9px] text-stone-400">
                        {x.basis}
                      </span>
                    </span>
                    <span className="w-16 text-right text-[12px] text-stone-500 line-through">
                      {x.typical}
                    </span>
                    <span className="w-12 text-right text-[11px] font-bold text-green-700">
                      {EXTRAS_INCLUDED_LABEL}
                    </span>
                  </div>
                ))}
                <p className="mt-1.5 text-[10px] italic leading-snug text-stone-400">
                  {EXTRAS_NOTE}
                  {data.proposal.tiers.some((t) => t.essentials)
                    ? ` ${EXTRAS_PLAN_QUALIFIER}`
                    : ""}
                </p>
              </div>
            </PreviewBlock>
          )}

        {(pool.gallons || dims || pool.shape || pool.sanitization) && (
          <PreviewBlock label="Pool — Size & Volume">
            <PreviewRow
              label="Volume"
              value={pool.gallons ? `${pool.gallons} gallons` : ""}
            />
            <PreviewRow label="Dimensions" value={dims} />
            <PreviewRow label="Shape" value={pool.shape} />
            <PreviewRow label="Sanitization" value={pool.sanitization} />
          </PreviewBlock>
        )}

        {(pool.pump ||
          pool.filterType ||
          pool.filter ||
          pool.heater ||
          pool.equipmentNotes) && (
          <PreviewBlock label="Equipment">
            <PreviewRow label="Pump" value={pool.pump} />
            <PreviewRow
              label="Filter"
              value={[pool.filterType, pool.filter]
                .filter((v) => v.trim())
                .join(" — ")}
            />
            <PreviewRow label="Heater" value={pool.heater} />
            <PreviewRow label="Notes" value={pool.equipmentNotes} />
          </PreviewBlock>
        )}

        {proposal.scope.trim() && (
          <PreviewBlock label="Scope of Work">
            <p className="whitespace-pre-line leading-relaxed text-stone-700">
              {proposal.scope.trim()}
            </p>
          </PreviewBlock>
        )}

        {tiered ? (
          <PreviewBlock label="Choose Your Plan">
            {/* Stacked on a phone — two 130px columns are unreadable, and the
                preview is checked on a phone at the poolside more than anywhere
                else. The PDF keeps its two columns; it has 520pt to play with. */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {tiers.map((tier, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-2.5 ${
                    tier.recommended
                      ? "border-brand-blue bg-[#f1f7fc]"
                      : "border-stone-200"
                  }`}
                >
                  {tier.recommended && (
                    <span className="mb-1.5 inline-block rounded bg-brand-blue px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                      Recommended
                    </span>
                  )}
                  <div className="text-[13px] font-bold text-navy">
                    {tier.name.trim()}
                  </div>
                  {tier.tagline.trim() && (
                    <div className="text-[10px] leading-snug text-stone-500">
                      {tier.tagline.trim()}
                    </div>
                  )}
                  {tier.price.trim() && (
                    <div className="mt-1 text-base font-bold text-brand-blue-dark">
                      {formatPrice(tier.price)}
                    </div>
                  )}
                  {tier.priceNote.trim() ? (
                    <div className="text-[10px] font-bold text-brand-blue">
                      {tier.priceNote.trim()}
                    </div>
                  ) : null}
                  {tier.billingNote?.trim() ? (
                    <div className="text-[10px] text-stone-500">
                      {tier.billingNote.trim()}
                    </div>
                  ) : i > 0 && delta ? (
                    <div className="text-[10px] font-bold text-brand-blue">
                      {delta} more than {tiers[i - 1].name.trim()}
                    </div>
                  ) : null}
                  {(tier.includes.some((x) => x.trim()) || i > 0) && (
                    <div className="my-1.5 h-px bg-stone-200" />
                  )}
                  {/* Mirrors the PDF, which is what this preview IS: the
                      cross-reference and only this plan's own extras. The
                      customer-facing web page lists everything in both cards
                      instead — see ProposalDocument for why the two differ. */}
                  {i > 0 && tiers[i - 1]?.name?.trim() && (
                    <div className="mb-1 text-[10px] font-bold text-navy">
                      Everything in {tiers[i - 1].name.trim()}, plus:
                    </div>
                  )}
                  {(() => {
                    const sp = splitTierIncludes(
                      tier,
                      i > 0 ? (tiers[i - 1]?.includes ?? []) : [],
                    );
                    return sp.extras.length ? sp.extras : sp.shared;
                  })().map((item, j) => (
                    <div
                      key={j}
                      className="flex gap-1.5 text-[10px] leading-snug text-stone-700"
                    >
                      <span className="text-green-600">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {tiers.some((t) => t.finePrint.trim()) && (
              <div className="mt-2 space-y-0.5">
                {tiers
                  .filter((t) => t.finePrint.trim())
                  .map((t, i, arr) => (
                    <p
                      key={i}
                      className="text-[9px] leading-snug text-stone-400"
                    >
                      {arr.length > 1 && (
                        <span className="font-semibold text-stone-500">
                          {t.name.trim()}:{" "}
                        </span>
                      )}
                      {t.finePrint.trim()}
                    </p>
                  ))}
              </div>
            )}
            {tiers.map((tier, i) =>
              tier.valueNote.trim() ? (
                <div
                  key={i}
                  className={`mt-2 rounded-lg border px-3 py-2 text-[11px] leading-relaxed ${
                    tier.recommended
                      ? "border-[#f0dcb4] bg-[#fff8ec] text-[#8a5a10]"
                      : "border-[#d4e6f4] bg-[#f1f7fc] text-brand-blue-dark"
                  }`}
                >
                  {tier.valueNote.trim()}
                </div>
              ) : null,
            )}
          </PreviewBlock>
        ) : proposal.price.trim() ? (
          <div className="flex items-center justify-between rounded-lg border border-[#d6e6f3] bg-[#f1f6fb] px-4 py-3">
            <span className="text-stone-500">Total</span>
            <span className="text-lg font-bold text-brand-blue-dark">
              {formatPrice(proposal.price)}
            </span>
          </div>
        ) : null}

        {proposal.addOns.some((a) => a.label.trim() || a.price.trim()) && (
          <PreviewBlock label="Additional Services">
            {proposal.addOns
              .filter((a) => a.label.trim() || a.price.trim())
              .map((a, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <span className="text-stone-700">
                    {a.label.trim() || "—"}
                  </span>
                  <span className="font-medium text-stone-800">
                    {formatPrice(a.price)}
                  </span>
                </div>
              ))}
          </PreviewBlock>
        )}

        <div className="rounded-lg border border-[#bfe7c6] bg-[#eefaf0] px-4 py-3 text-[13px] leading-relaxed text-[#1d7a33]">
          {acceptWords.length > 1 ? (
            <>
              To accept, reply to this email with the plan you&rsquo;d like —{" "}
              <strong>{acceptWords.join(" or ")}</strong>.
            </>
          ) : (
            <>
              To accept, simply reply <strong>&quot;APPROVED&quot;</strong> to
              the email this is attached to.
            </>
          )}
        </div>

        {photos.length > 0 && (
          <>
            <div className="flex items-center gap-3 pt-1 text-[10px] font-bold uppercase tracking-wide text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              Page 2
              <span className="h-px flex-1 bg-stone-200" />
            </div>
            <PreviewBlock label="Photos">
              <div className="flex flex-wrap gap-2">
                {photos.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Photo ${i + 1}`}
                    className="h-20 w-28 rounded border border-stone-200 object-cover"
                  />
                ))}
              </div>
            </PreviewBlock>
          </>
        )}
      </div>
    </div>
  );
};
