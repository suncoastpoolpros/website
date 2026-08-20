import { useMemo, useRef, useState } from 'react';
import { Send, LoaderCircle, CheckCircle, Check, AlertCircle, Trash2, LogOut, Calculator, FilePlus2, ChevronLeft, ChevronDown, X, Link2 } from 'lucide-react';
import { FieldShell, fieldClass, selectClass, textareaClass } from '@/components/FormField';
import { useProposalDraft } from '@/lib/useAdminDraft';
import {
  sendProposal,
  saveQuoteOnly,
  reserveProposalNumber,
  logout,
  formatPrice,
  tierDelta,
  type PricingMode,
  type ProposalData,
  type Tier,
} from '@/lib/adminApi';
import { blobToBase64 } from '@/lib/adminMedia';
import { proposalDateLabel, proposalFilename, renderProposalPdf } from '@/lib/proposalPdf';
import { toTitleCase, formatUsPhone } from '@/lib/textFormat';
import { Section, PreviewBlock, PreviewRow } from './adminUi';
import { PhotoPicker } from './PhotoPicker';
import { SANITIZATION_TYPES } from './sanitization';
import { SCOPE_TEMPLATES } from './scopeTemplates';
import { ADDON_PRESETS } from './addonPresets';
import { BENEFITS_HEADING, includedBenefits } from './proposalBenefits';
import {
  EXTRAS_COL_THEIRS,
  EXTRAS_INTRO,
  EXTRAS_COL_YOURS,
  EXTRAS_HEADING,
  EXTRAS_INCLUDED_LABEL,
  EXTRAS_NOTE,
  includedExtras,
} from './includedExtras';
import { PRESET_VERSION, buildTiers, syncFilterService, syncTierPrices } from './tierPresets';
import { FILTER_TYPES, inclusionQuestion, supportsFilterService } from './filterService';

// Plain input (no floating label) for the add-on rows.
const addonInput =
  'h-12 w-full rounded-xl border border-stone-300 bg-stone-100 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50';

type SendStatus =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'saving' }
  | { kind: 'sent' }
  /** Saved without emailing — the link is the deliverable, so it's shown to copy. */
  | { kind: 'saved'; url: string }
  | { kind: 'error'; message: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;


export const ProposalBuilder = ({
  onLogout,
  onBack,
}: {
  onLogout: () => void;
  onBack: () => void;
}) => {
  const { data, setData, update, clearDraft } = useProposalDraft();
  const [status, setStatus] = useState<SendStatus>({ kind: 'idle' });
  const [copied, setCopied] = useState(false);
  // Abort controller + a cancelled flag so Cancel actually stops the send:
  // the fetch is aborted via the signal, and the flag bails out of the
  // pre-fetch steps (dynamic import / PDF generation) that can't be aborted.
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  // Photos live in component state only (not the localStorage draft) — base64
  // images would quickly exceed the storage quota. They're optional and baked
  // straight into the generated PDF.
  const [photos, setPhotos] = useState<string[]>([]);
  // Which plan's editor is open, if any. Both start collapsed.
  const [editingTier, setEditingTier] = useState<number | null>(null);

  // Drop a pre-written service description into the scope field. Appends (with a
  // blank line) when scope already has text, so templates can be combined and
  // nothing the admin typed gets clobbered.
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
    update('proposal', 'scope', current ? `${current}\n\n${text}` : text);
  };

  // --- Additional-services (add-on) line items ---
  const addAddOn = (label = '', price = '') =>
    setData((p) => ({
      ...p,
      proposal: { ...p.proposal, addOns: [...p.proposal.addOns, { label, price }] },
    }));
  const updateAddOn = (idx: number, field: 'label' | 'price', value: string) =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        addOns: p.proposal.addOns.map((a, i) => (i === idx ? { ...a, [field]: value } : a)),
      },
    }));
  const removeAddOn = (idx: number) =>
    setData((p) => ({
      ...p,
      proposal: { ...p.proposal, addOns: p.proposal.addOns.filter((_, i) => i !== idx) },
    }));

  // --- Filter service ---
  // Changing the filter type (or the inclusion answer) re-tailors the plan
  // wording immediately, so a quote can't go out promising cartridge elements to
  // a DE pool. syncFilterService only rewrites lines it generated itself, so
  // anything typed by hand survives.
  const setFilterType = (type: string) =>
    setData((p) => {
      // A type that can't carry the service (Other/blank) can't have it
      // included, and changing type re-opens the question rather than carrying
      // the previous pool's answer over to a different filter.
      const answer = supportsFilterService(type) ? p.pool.filterServiceIncluded : '';
      const filter = { type, included: answer === 'yes' };
      return {
        ...p,
        pool: { ...p.pool, filterType: type, filterServiceIncluded: answer },
        proposal: { ...p.proposal, tiers: syncFilterService(p.proposal.tiers, filter) },
      };
    });

  const setFilterIncluded = (answer: string) =>
    setData((p) => ({
      ...p,
      pool: { ...p.pool, filterServiceIncluded: answer },
      proposal: {
        ...p.proposal,
        tiers: syncFilterService(p.proposal.tiers, {
          type: p.pool.filterType,
          included: answer === 'yes',
        }),
      },
    }));

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
          mode === 'tiers' && p.proposal.tiers.length === 0
            ? buildTiers(p.proposal.price, {
                type: p.pool.filterType,
                included: p.pool.filterServiceIncluded === 'yes',
              })
            : p.proposal.tiers,
        presetVersion:
          mode === 'tiers' && p.proposal.tiers.length === 0
            ? PRESET_VERSION
            : p.proposal.presetVersion,
      },
    }));

  const updateTier = (idx: number, patch: Partial<Tier>) =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        tiers: p.proposal.tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
      },
    }));

  // Exactly one plan carries the ribbon — two "recommended" plans recommend
  // nothing.
  const setRecommended = (idx: number) =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        tiers: p.proposal.tiers.map((t, i) => ({ ...t, recommended: i === idx })),
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
        tiers: syncTierPrices(p.proposal.tiers, p.proposal.tiers[0]?.price ?? '', value, {
          type: p.pool.filterType,
          included: p.pool.filterServiceIncluded === 'yes',
        }),
      },
    }));

  const resetTiers = () =>
    setData((p) => ({
      ...p,
      proposal: {
        ...p.proposal,
        tiers: buildTiers(p.proposal.price, {
          type: p.pool.filterType,
          included: p.pool.filterServiceIncluded === 'yes',
        }),
        presetVersion: PRESET_VERSION,
      },
    }));

  // An unanswered filter question can't be sent: the quote would silently omit
  // a promise that was meant to be there, and nothing downstream would flag it.
  // Tiers exist but were generated before the current preset revision.
  const presetsOutdated =
    data.proposal.pricingMode === 'tiers' &&
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
    data.pool.filterServiceIncluded === 'yes'
      ? 'yes'
      : data.pool.filterServiceIncluded === 'no'
        ? 'no'
        : '';

  const filterAnswered =
    !supportsFilterService(data.pool.filterType) || filterAnswer !== '';

  const canSend = useMemo(
    () => data.customer.name.trim() !== '' && EMAIL_RE.test(data.customer.email.trim()) && filterAnswered,
    [data.customer.name, data.customer.email, filterAnswered],
  );

  /**
   * Saving a link needs no email address — that's the whole reason it exists.
   * A texted lead often hasn't given one, and demanding it was what made them
   * unquotable.
   */
  const canSaveLink = useMemo(
    () => data.customer.name.trim() !== '' && filterAnswered,
    [data.customer.name, filterAnswered],
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
    if (!canSaveLink || status.kind === 'saving' || status.kind === 'sending') return;
    cancelledRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus({ kind: 'saving' });
    try {
      const proposalNumber = await reserveProposalNumber(controller.signal);
      if (cancelledRef.current) return;
      const { url } = await saveQuoteOnly({ ...data, proposalNumber }, controller.signal);
      setStatus({ kind: 'saved', url });
    } catch (err) {
      if (cancelledRef.current || (err instanceof DOMException && err.name === 'AbortError')) return;
      setStatus({
        kind: 'error',
        message:
          String(err).includes('storage_unavailable')
            ? 'Quote storage isn’t connected, so there’s no link to create. Check the D1 binding.'
            : 'Couldn’t create the link. Please try again.',
      });
    }
  };

  const handleSend = async () => {
    if (!canSend || status.kind === 'sending') return;
    cancelledRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus({ kind: 'sending' });
    try {
      // Reserved BEFORE the PDF is built, because the number is printed on it.
      // Resolves to null if storage is unavailable; the proposal then sends
      // unnumbered rather than not at all.
      const proposalNumber = await reserveProposalNumber(controller.signal);
      if (cancelledRef.current) return;
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
      await sendProposal(
        {
          ...data,
          proposalNumber,
          pdfBase64,
          filename: proposalFilename(data.customer.name, proposalNumber),
        },
        controller.signal,
      );
      setStatus({ kind: 'sent' });
    } catch (err) {
      // A cancel (flag set, or the fetch aborted) is not an error — stay idle.
      if (cancelledRef.current || (err instanceof DOMException && err.name === 'AbortError')) {
        return;
      }
      setStatus({
        kind: 'error',
        message: 'Could not send the proposal. Check the connection and try again.',
      });
      console.error('send proposal failed', err);
    } finally {
      abortRef.current = null;
    }
  };

  const handleCancelSend = () => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    setStatus({ kind: 'idle' });
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const startNew = () => {
    clearDraft();
    setPhotos([]);
    setStatus({ kind: 'idle' });
  };

  if (status.kind === 'saved') {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-brand-blue/40 bg-brand-blue/15">
            <Link2 className="h-8 w-8 text-brand-blue-light" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Link ready</h2>
          <p className="mt-2 text-gray-300">
            Nothing was emailed. Send this to {data.customer.name.trim() || 'them'} however you like — it
            opens with the full breakdown of the service, then the plans.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] p-2 pl-4 text-left">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-300">{status.url}</span>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(status.url);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1800);
                } catch {
                  window.prompt('Copy the link:', status.url);
                }
              }}
              className="shrink-0 rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue-light"
            >
              {copied ? 'Copied' : 'Copy'}
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
              onClick={() => setStatus({ kind: 'idle' })}
              className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-gray-200 hover:bg-white/5"
            >
              Back to this one
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status.kind === 'sent') {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-green-500/30 bg-green-500/15">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Proposal sent</h2>
          <p className="mt-2 text-gray-300">
            Emailed to <span className="text-white">{data.customer.email}</span> with the PDF attached.
            A copy was BCC&apos;d to your inbox.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark px-5 py-3 font-semibold text-white"
            >
              <FilePlus2 className="h-5 w-5" /> New proposal
            </button>
            <button
              onClick={() => setStatus({ kind: 'idle' })}
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
      {/* Sending overlay — a loading wheel that also locks out the form (the
          backdrop blocks all interaction) so the proposal can't be double-sent.
          Cancel aborts the in-flight request and returns to the builder. */}
      {status.kind === 'sending' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          role="alertdialog"
          aria-busy="true"
          aria-label="Sending proposal"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-light p-8 text-center">
            <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-brand-blue-light" />
            <h2 className="mt-5 font-display text-lg font-bold text-white">Sending proposal…</h2>
            <p className="mt-1 text-sm text-gray-400">
              Generating the PDF and emailing it to{' '}
              <span className="text-gray-200">{data.customer.email || 'the customer'}</span>.
            </p>
            <button
              type="button"
              onClick={handleCancelSend}
              className="mt-6 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
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
            <h1 className="font-display text-2xl font-bold text-white">New Proposal</h1>
            <p className="text-sm text-gray-400">Draft saves automatically as you type.</p>
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ---- Form ---- */}
          <div className="space-y-8">
            <Section title="Customer">
              <FieldShell id="c-name" label="Full name">
                <input id="c-name" className={fieldClass} placeholder=" " autoComplete="off" autoCapitalize="words"
                  value={data.customer.name} onChange={(e) => update('customer', 'name', e.target.value)}
                  onBlur={(e) => update('customer', 'name', toTitleCase(e.target.value))} />
              </FieldShell>
              <FieldShell id="c-addr" label="Service address">
                <input id="c-addr" className={fieldClass} placeholder=" " autoComplete="off" autoCapitalize="words"
                  value={data.customer.address} onChange={(e) => update('customer', 'address', e.target.value)}
                  onBlur={(e) => update('customer', 'address', toTitleCase(e.target.value))} />
              </FieldShell>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="c-email" label="Email">
                  <input id="c-email" type="email" className={fieldClass} placeholder=" " autoComplete="off"
                    value={data.customer.email} onChange={(e) => update('customer', 'email', e.target.value)} />
                </FieldShell>
                <FieldShell id="c-phone" label="Phone">
                  <input id="c-phone" type="tel" className={fieldClass} placeholder=" " autoComplete="off"
                    value={data.customer.phone} onChange={(e) => update('customer', 'phone', e.target.value)}
                    onBlur={(e) => update('customer', 'phone', formatUsPhone(e.target.value))} />
                </FieldShell>
              </div>

              {/* Sits with the customer, not down by the document settings: it's
                  the message TO this person, and it's written while they're
                  still in mind — right after typing their name. */}
              <FieldShell id="pr-emailnote" label="Personal note — email only, not on the PDF" multiline>
                <textarea id="pr-emailnote" rows={4} className={textareaClass} placeholder=" "
                  value={data.proposal.emailNote}
                  onChange={(e) => update('proposal', 'emailNote', e.target.value)} />
              </FieldShell>
              <p className="-mt-2 text-xs text-gray-500">
                Appears at the top of the email, under the greeting and above the plan options. The PDF
                is the formal document and stays clean.
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

            <Section title="Pool — Size & Volume">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="p-gal" label="Volume (gallons)">
                  <input id="p-gal" inputMode="numeric" className={fieldClass} placeholder=" "
                    value={data.pool.gallons} onChange={(e) => update('pool', 'gallons', e.target.value)} />
                </FieldShell>
                <FieldShell id="p-shape" label="Shape" floated>
                  <select id="p-shape" className={selectClass}
                    value={data.pool.shape} onChange={(e) => update('pool', 'shape', e.target.value)}>
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
                  <input id="p-len" inputMode="decimal" className={fieldClass} placeholder=" "
                    value={data.pool.length} onChange={(e) => update('pool', 'length', e.target.value)} />
                </FieldShell>
                <FieldShell id="p-wid" label="Width (ft)">
                  <input id="p-wid" inputMode="decimal" className={fieldClass} placeholder=" "
                    value={data.pool.width} onChange={(e) => update('pool', 'width', e.target.value)} />
                </FieldShell>
                <FieldShell id="p-dep" label="Avg depth (ft)">
                  <input id="p-dep" inputMode="decimal" className={fieldClass} placeholder=" "
                    value={data.pool.avgDepth} onChange={(e) => update('pool', 'avgDepth', e.target.value)} />
                </FieldShell>
              </div>
              <a
                href="/tools/pool-volume-calculator/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue-light hover:text-white"
              >
                <Calculator className="h-4 w-4" /> Open the volume calculator (your draft is saved)
              </a>
            </Section>

            <Section title="Pool — Sanitization & Equipment">
              <FieldShell id="p-san" label="Sanitization" floated>
                <select id="p-san" className={selectClass}
                  value={data.pool.sanitization} onChange={(e) => update('pool', 'sanitization', e.target.value)}>
                  <option value=""></option>
                  {SANITIZATION_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </FieldShell>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="p-pump" label="Pump">
                  <input id="p-pump" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.pool.pump} onChange={(e) => update('pool', 'pump', e.target.value)}
                    onBlur={(e) => update('pool', 'pump', toTitleCase(e.target.value))} />
                </FieldShell>
                <FieldShell id="p-heater" label="Heater">
                  <input id="p-heater" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.pool.heater} onChange={(e) => update('pool', 'heater', e.target.value)}
                    onBlur={(e) => update('pool', 'heater', toTitleCase(e.target.value))} />
                </FieldShell>
                {/* Filter type and its make/model sit together — with five fields
                    in a two-column grid the model field previously landed beside
                    Heater, pairing it with the wrong thing. */}
                <FieldShell id="p-filter-type" label="Filter type" floated>
                  <select id="p-filter-type" className={selectClass}
                    value={data.pool.filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value=""></option>
                    {FILTER_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </FieldShell>
                <FieldShell id="p-filter" label="Filter make & model">
                  <input id="p-filter" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.pool.filter} onChange={(e) => update('pool', 'filter', e.target.value)}
                    onBlur={(e) => update('pool', 'filter', toTitleCase(e.target.value))} />
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
                      { value: 'yes', label: 'Yes', hint: 'Included in the monthly cost' },
                      { value: 'no', label: 'No', hint: 'Quoted separately when needed' },
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
                              ? 'border-brand-blue-light bg-brand-blue text-white ring-2 ring-brand-blue-light/40'
                              : 'border-white/15 bg-white/5 text-gray-300 hover:border-brand-blue-light hover:text-white'
                          }`}
                        >
                          {/* A filled tick, not just a tint: the previous 25%
                              wash over a navy panel was easy to mistake for the
                              browser's focus ring. */}
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              on ? 'border-white bg-white text-brand-blue' : 'border-white/30'
                            }`}
                          >
                            {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                          </span>
                          <span>
                            <span className="block text-base font-semibold">{opt.label}</span>
                            <span className={`block text-xs ${on ? 'text-white/80' : 'text-gray-400'}`}>
                              {opt.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {filterAnswer === '' && (
                    <p className="text-xs text-amber-300/90">
                      Pick one — this decides whether the quote promises a filter replacement.
                    </p>
                  )}
                </div>
              )}

              {/* Automation had its own field; it's rare enough on a sales
                  document that it lives here now when it's worth a mention. */}
              <FieldShell id="p-eqnotes" label="Equipment notes — automation, anything unusual" multiline>
                <textarea id="p-eqnotes" rows={2} className={textareaClass} placeholder=" "
                  value={data.pool.equipmentNotes} onChange={(e) => update('pool', 'equipmentNotes', e.target.value)} />
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
              <FieldShell id="pr-template" label="Insert a service template" floated>
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
                  {SCOPE_TEMPLATES.map((t) => (
                    <option key={t.label} value={t.label}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell id="pr-scope" label="Scope of work" multiline>
                <textarea id="pr-scope" rows={8} className={textareaClass} placeholder=" "
                  value={data.proposal.scope} onChange={(e) => update('proposal', 'scope', e.target.value)} />
              </FieldShell>
              <FieldShell
                id="pr-price"
                label={
                  data.proposal.pricingMode === 'tiers'
                    ? 'Base rate — seeds the plans (e.g. 165/mo)'
                    : 'Total price (e.g. $2,400 or $185/mo)'
                }
              >
                <input id="pr-price" className={fieldClass} placeholder=" "
                  value={data.proposal.price} onChange={(e) => setBasePrice(e.target.value)} />
              </FieldShell>

              {/* Single price vs. two plans. */}
              <div className="flex flex-wrap items-center gap-2">
                {([
                  { mode: 'single' as const, label: 'One price' },
                  { mode: 'tiers' as const, label: 'Two plans' },
                ]).map(({ mode, label }) => {
                  const on = data.proposal.pricingMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPricingMode(mode)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                        on
                          ? 'border-brand-blue-light bg-brand-blue/25 text-white'
                          : 'border-white/15 text-gray-300 hover:border-brand-blue-light hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
                {data.proposal.pricingMode === 'tiers' && (
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
                  The plan wording has been updated since this draft was started. Reset to preset to
                  pick it up — that replaces both plans, including any edits you made here.
                </p>
              )}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 ${
                  data.proposal.pricingMode === 'tiers' ? 'opacity-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={data.proposal.includeBenefits}
                  onChange={(e) => update('proposal', 'includeBenefits', e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-blue"
                />
                <span className="text-sm text-gray-200">
                  Highlight &ldquo;what&rsquo;s included&rdquo; — chemicals, filter &amp; salt-cell cleans{' '}
                  <span className="text-gray-400">
                    {data.proposal.pricingMode === 'tiers'
                      ? '(always shown on a tiered proposal — it defines the service both plans include)'
                      : '(recommended for recurring service; turn off for one-time jobs)'}
                  </span>
                </span>
              </label>
            </Section>

            {data.proposal.pricingMode === 'tiers' && (
              <Section title="Plans">
                <p className="-mt-1 text-sm text-gray-400">
                  The second plan shows as &ldquo;Everything in {data.proposal.tiers[0]?.name || 'the first plan'},
                  plus&rdquo; — so it only ever adds. Never move something out of the first plan to make the
                  upgrade look better; that turns the flat-rate promise into an upsell.
                </p>
                {data.proposal.tiers.map((tier, i) => (
                  <div key={i} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
                    {/* Collapsed by default: the presets are right for almost
                        every proposal, so the common case is reading them, not
                        rewriting them. The summary keeps the two things that DO
                        change per customer — which plan is recommended, and the
                        rate — visible without expanding anything. */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Plan {i + 1}
                      </span>
                      <span className="font-semibold text-white">{tier.name.trim() || '—'}</span>
                      {tier.price.trim() && (
                        <span className="text-sm text-brand-blue-light">{formatPrice(tier.price)}</span>
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
                        onClick={() => setEditingTier(editingTier === i ? null : i)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        {editingTier === i ? 'Done' : 'Edit'}
                        <ChevronDown className={`h-4 w-4 transition-transform ${editingTier === i ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {editingTier === i && (
                      <div className="space-y-4">
                    <FieldShell id={`tier-name-${i}`} label="Plan name">
                      <input id={`tier-name-${i}`} className={fieldClass} placeholder=" "
                        value={tier.name} onChange={(e) => updateTier(i, { name: e.target.value })} />
                    </FieldShell>
                    {/* Read-only: both plans price off the base rate above, so
                        there's nothing to type here and no way for the two to
                        disagree. */}
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Price</p>
                      {tier.price.trim() ? (
                        <>
                          <p className="text-lg font-bold text-white">{formatPrice(tier.price)}</p>
                          {tier.priceNote.trim() && (
                            <p className="text-xs font-semibold text-brand-blue-light">{tier.priceNote}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">Set the base rate above.</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">Calculated from the base rate.</p>
                    </div>
                    <FieldShell id={`tier-tagline-${i}`} label="One-line tagline">
                      <input id={`tier-tagline-${i}`} className={fieldClass} placeholder=" "
                        value={tier.tagline} onChange={(e) => updateTier(i, { tagline: e.target.value })} />
                    </FieldShell>
                    <FieldShell id={`tier-includes-${i}`} label={i === 0 ? "What's included — one per line" : 'What it adds — one per line'} multiline>
                      <textarea id={`tier-includes-${i}`} rows={6} className={textareaClass} placeholder=" "
                        value={tier.includes.join('\n')}
                        onChange={(e) => updateTier(i, { includes: e.target.value.split('\n') })} />
                    </FieldShell>
                    {i > 0 && (
                      <FieldShell id={`tier-value-${i}`} label="Value note — the break-even line" multiline>
                        <textarea id={`tier-value-${i}`} rows={3} className={textareaClass} placeholder=" "
                          value={tier.valueNote} onChange={(e) => updateTier(i, { valueNote: e.target.value })} />
                      </FieldShell>
                    )}
                    <FieldShell id={`tier-fine-${i}`} label="Fine print / limits" multiline>
                      <textarea id={`tier-fine-${i}`} rows={3} className={textareaClass} placeholder=" "
                        value={tier.finePrint} onChange={(e) => updateTier(i, { finePrint: e.target.value })} />
                    </FieldShell>
                      </div>
                    )}
                  </div>
                ))}
              </Section>
            )}

            <Section title="Additional Services (optional)">
              <p className="-mt-1 text-sm text-gray-400">
                À-la-carte extras, listed separately on the proposal. Quick-add a common one, then set its price.
              </p>
              <div className="flex flex-wrap gap-2">
                {ADDON_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => addAddOn(preset.label, preset.defaultPrice ?? '')}
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
                        onChange={(e) => updateAddOn(i, 'label', e.target.value)}
                        onBlur={(e) => updateAddOn(i, 'label', toTitleCase(e.target.value))}
                      />
                      <input
                        className={`${addonInput} w-32 shrink-0`}
                        placeholder="Price"
                        value={a.price}
                        onChange={(e) => updateAddOn(i, 'price', e.target.value)}
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
          </div>

          {/* ---- Live preview + send ---- */}
          {/* Sticky column with its OWN scroll: the preview is usually taller than
              the viewport, and before this the only way to see its foot was to
              scroll the entire form past it. Only the preview scrolls — the Send
              button and its validation hint stay pinned below it. */}
          <div className="lg:sticky lg:top-8 lg:self-start lg:flex lg:max-h-[calc(100dvh-4rem)] lg:flex-col">
            <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500">Live preview</p>
            <div className="admin-scroll lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
              <ProposalPreview data={data} photos={photos} dateLabel={proposalDateLabel()} />
            </div>

            {status.kind === 'error' && (
              <div role="alert" className="mt-4 shrink-0 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <span>{status.message}</span>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={!canSend || status.kind === 'sending'}
              className="mt-4 shrink-0 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark py-4 text-lg font-bold text-white shadow-lg shadow-brand-blue/20 transition-all hover:from-brand-blue-light hover:to-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.kind === 'sending' ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" /> Generating &amp; sending…
                </>
              ) : (
                <>
                  Send proposal to customer <Send className="h-5 w-5" />
                </>
              )}
            </button>
            {!canSend && (
              <p className="mt-2 shrink-0 text-center text-xs text-gray-500">
                {!filterAnswered
                  ? `Answer “${inclusionQuestion(data.pool.filterType)}” to send.`
                  : 'Enter the customer\u2019s name and a valid email to send.'}
              </p>
            )}

            {/* The second way out, for a lead who texted rather than emailed.
                Deliberately quieter than Send — it's the exception, and it
                needs no email address, which is the whole reason it exists. */}
            <button
              onClick={handleSaveLink}
              disabled={!canSaveLink || status.kind === 'saving' || status.kind === 'sending'}
              className="mt-3 shrink-0 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.kind === 'saving' ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Creating link…
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" /> Create link only — don&apos;t email
                </>
              )}
            </button>
            {!canSaveLink && (
              <p className="mt-2 shrink-0 text-center text-xs text-gray-500">
                {!filterAnswered
                  ? 'Answer the filter question to create a link.'
                  : 'Enter the customer\u2019s name to create a link.'}
              </p>
            )}
          </div>
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
  const dims = [pool.length && `${pool.length} ft L`, pool.width && `${pool.width} ft W`, pool.avgDepth && `${pool.avgDepth} ft avg`]
    .filter(Boolean)
    .join(' × ');
  const tiered = proposal.pricingMode === 'tiers' && proposal.tiers.length > 0;
  const filterOption = { type: pool.filterType, included: pool.filterServiceIncluded === 'yes' };
  const extras = includedExtras(filterOption, pool.sanitization);
  const tiers = tiered ? proposal.tiers : [];
  const delta = tierDelta(tiers[0], tiers[1]);
  const recommended = tiers.find((t) => t.recommended) ?? tiers[tiers.length - 1];
  const acceptWords = tiers
    .map((t) => t.name.trim().toUpperCase())
    .filter(Boolean)
    .sort((a, b) => (a === recommended?.name.trim().toUpperCase() ? -1 : b === recommended?.name.trim().toUpperCase() ? 1 : 0));
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-800 shadow-xl">
      <div className="flex items-center justify-between border-b-4 border-brand-blue bg-navy px-6 py-5 text-white">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Suncoast Pool Pros</div>
          <div className="mt-0.5 text-lg font-bold">Service Proposal</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wide text-gray-400">Date</div>
          <div className="text-sm">{dateLabel}</div>
        </div>
      </div>
      <div className="space-y-5 px-6 py-5 text-sm">
        <PreviewBlock label="Prepared For">
          <PreviewRow label="Name" value={customer.name} />
          <PreviewRow label="Service Address" value={customer.address} />
          <PreviewRow label="Email" value={customer.email} />
          <PreviewRow label="Phone" value={customer.phone} />
        </PreviewBlock>

        {(proposal.includeBenefits || tiered) && (
          <div className="rounded-lg border border-[#cfe3f2] bg-[#eef6fb] px-4 py-3">
            <div className="mb-2 text-sm font-bold text-brand-blue-dark">{BENEFITS_HEADING}</div>
            <ul className="space-y-1">
              {includedBenefits(filterOption).map((b, i) => (
                <li key={i} className="flex gap-2 py-[3px] text-[13px] font-semibold leading-relaxed text-stone-800">
                  <span className="text-green-600">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(proposal.includeBenefits || tiered) && extras.length > 0 && (
          <PreviewBlock label={EXTRAS_HEADING}>
            <p className="mb-2 text-[12px] leading-relaxed text-stone-700">{EXTRAS_INTRO}</p>
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
                    i < extras.length - 1 ? 'border-b border-stone-100' : ''
                  }`}
                >
                  <span className="flex-1">
                    <span className="block text-[12px] font-semibold text-navy">{x.label}</span>
                    <span className="block text-[9px] text-stone-400">{x.basis}</span>
                  </span>
                  <span className="w-16 text-right text-[12px] text-stone-500 line-through">{x.typical}</span>
                  <span className="w-12 text-right text-[11px] font-bold text-green-700">
                    {EXTRAS_INCLUDED_LABEL}
                  </span>
                </div>
              ))}
              <p className="mt-1.5 text-[10px] italic leading-snug text-stone-400">{EXTRAS_NOTE}</p>
            </div>
          </PreviewBlock>
        )}

        {(pool.gallons || dims || pool.shape || pool.sanitization) && (
          <PreviewBlock label="Pool — Size & Volume">
            <PreviewRow label="Volume" value={pool.gallons ? `${pool.gallons} gallons` : ''} />
            <PreviewRow label="Dimensions" value={dims} />
            <PreviewRow label="Shape" value={pool.shape} />
            <PreviewRow label="Sanitization" value={pool.sanitization} />
          </PreviewBlock>
        )}

        {(pool.pump || pool.filterType || pool.filter || pool.heater || pool.equipmentNotes) && (
          <PreviewBlock label="Equipment">
            <PreviewRow label="Pump" value={pool.pump} />
            <PreviewRow
              label="Filter"
              value={[pool.filterType, pool.filter].filter((v) => v.trim()).join(' — ')}
            />
            <PreviewRow label="Heater" value={pool.heater} />
            <PreviewRow label="Notes" value={pool.equipmentNotes} />
          </PreviewBlock>
        )}

        {proposal.scope.trim() && (
          <PreviewBlock label="Scope of Work">
            <p className="whitespace-pre-line leading-relaxed text-stone-700">{proposal.scope.trim()}</p>
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
                    tier.recommended ? 'border-brand-blue bg-[#f1f7fc]' : 'border-stone-200'
                  }`}
                >
                  {tier.recommended && (
                    <span className="mb-1.5 inline-block rounded bg-brand-blue px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                      Recommended
                    </span>
                  )}
                  <div className="text-[13px] font-bold text-navy">{tier.name.trim()}</div>
                  {tier.tagline.trim() && (
                    <div className="text-[10px] leading-snug text-stone-500">{tier.tagline.trim()}</div>
                  )}
                  {tier.price.trim() && (
                    <div className="mt-1 text-base font-bold text-brand-blue-dark">{formatPrice(tier.price)}</div>
                  )}
                  {tier.priceNote.trim() ? (
                    <div className="text-[10px] font-bold text-brand-blue">{tier.priceNote.trim()}</div>
                  ) : i > 0 && delta ? (
                    <div className="text-[10px] font-bold text-brand-blue">
                      {delta} more than {tiers[i - 1].name.trim()}
                    </div>
                  ) : null}
                  {(tier.includes.some((x) => x.trim()) || i > 0) && (
                    <div className="my-1.5 h-px bg-stone-200" />
                  )}
                  {i > 0 && (
                    <div className="mb-1 text-[10px] font-bold text-navy">
                      Everything in {tiers[i - 1].name.trim()}, plus:
                    </div>
                  )}
                  {tier.includes
                    .map((x) => x.trim())
                    .filter(Boolean)
                    .map((item, j) => (
                      <div key={j} className="flex gap-1.5 text-[10px] leading-snug text-stone-700">
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
                    <p key={i} className="text-[9px] leading-snug text-stone-400">
                      {arr.length > 1 && <span className="font-semibold text-stone-500">{t.name.trim()}: </span>}
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
                      ? 'border-[#f0dcb4] bg-[#fff8ec] text-[#8a5a10]'
                      : 'border-[#d4e6f4] bg-[#f1f7fc] text-brand-blue-dark'
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
            <span className="text-lg font-bold text-brand-blue-dark">{formatPrice(proposal.price)}</span>
          </div>
        ) : null}

        {proposal.addOns.some((a) => a.label.trim() || a.price.trim()) && (
          <PreviewBlock label="Additional Services">
            {proposal.addOns
              .filter((a) => a.label.trim() || a.price.trim())
              .map((a, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <span className="text-stone-700">{a.label.trim() || '—'}</span>
                  <span className="font-medium text-stone-800">{formatPrice(a.price)}</span>
                </div>
              ))}
          </PreviewBlock>
        )}

        <div className="rounded-lg border border-[#bfe7c6] bg-[#eefaf0] px-4 py-3 text-[13px] leading-relaxed text-[#1d7a33]">
          {acceptWords.length > 1 ? (
            <>
              To accept, reply to this email with the plan you&rsquo;d like —{' '}
              <strong>{acceptWords.join(' or ')}</strong>.
            </>
          ) : (
            <>
              To accept, simply reply <strong>&quot;APPROVED&quot;</strong> to the email this is attached to.
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

