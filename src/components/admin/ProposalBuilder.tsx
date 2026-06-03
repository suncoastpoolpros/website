import React, { useMemo, useRef, useState } from 'react';
import { Send, LoaderCircle, CheckCircle, AlertCircle, Trash2, LogOut, Calculator, FilePlus2, ImagePlus, X } from 'lucide-react';
import { FieldShell, fieldClass, selectClass, textareaClass } from '@/components/FormField';
import { useProposalDraft } from '@/lib/useProposalDraft';
import { sendProposal, logout, formatPrice, type ProposalData } from '@/lib/adminApi';
import { toTitleCase, formatUsPhone } from '@/lib/textFormat';
import { SCOPE_TEMPLATES } from './scopeTemplates';
import { ADDON_PRESETS } from './addonPresets';
import { BENEFITS_HEADING, INCLUDED_BENEFITS, BENEFITS_NOTE } from './proposalBenefits';

// Plain input (no floating label) for the add-on rows.
const addonInput =
  'h-12 w-full rounded-xl border border-stone-300 bg-stone-100 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50';

type SendStatus =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const todayLabel = () =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Read a Blob as a base64 string with the `data:...;base64,` prefix stripped.
const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const filenameFor = (data: ProposalData): string => {
  const name = data.customer.name.trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `Suncoast-Proposal${name ? '-' + name : ''}.pdf`;
};

const MAX_PHOTOS = 8;

// Shrink a phone photo to a sane size before it goes into the PDF — full-res
// images would blow past the email attachment limit. Draws to a canvas capped
// at 1400px on the long edge and re-encodes as JPEG.
const downscaleImage = (file: File, maxDim = 1400, quality = 0.72): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width >= height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > width && height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('no_canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image_load_failed'));
    };
    img.src = url;
  });

export const ProposalBuilder = ({ onLogout }: { onLogout: () => void }) => {
  const { data, setData, update, clearDraft } = useProposalDraft();
  const [status, setStatus] = useState<SendStatus>({ kind: 'idle' });
  // Abort controller + a cancelled flag so Cancel actually stops the send:
  // the fetch is aborted via the signal, and the flag bails out of the
  // pre-fetch steps (dynamic import / PDF generation) that can't be aborted.
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  // Photos live in component state only (not the localStorage draft) — base64
  // images would quickly exceed the storage quota. They're optional and baked
  // straight into the generated PDF.
  const [photos, setPhotos] = useState<string[]>([]);

  const addPhotos = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return;
    const picked = Array.from(list).slice(0, room);
    const results = await Promise.all(picked.map((f) => downscaleImage(f).catch(() => null)));
    setPhotos((prev) => [...prev, ...results.filter((r): r is string => r !== null)].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  // Drop a pre-written service description into the scope field. Appends (with a
  // blank line) when scope already has text, so templates can be combined and
  // nothing the admin typed gets clobbered.
  const insertScopeTemplate = (label: string) => {
    const tpl = SCOPE_TEMPLATES.find((t) => t.label === label);
    if (!tpl) return;
    const current = data.proposal.scope.trim();
    update('proposal', 'scope', current ? `${current}\n\n${tpl.text}` : tpl.text);
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

  const canSend = useMemo(
    () => data.customer.name.trim() !== '' && EMAIL_RE.test(data.customer.email.trim()),
    [data.customer.name, data.customer.email],
  );

  const handleSend = async () => {
    if (!canSend || status.kind === 'sending') return;
    cancelledRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus({ kind: 'sending' });
    try {
      // Load the PDF engine + document only now, so @react-pdf is a lazy chunk
      // fetched on first send — never part of the marketing or initial /admin JS.
      const [{ pdf }, { ProposalDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ProposalDocument'),
      ]);
      if (cancelledRef.current) return;
      const blob = await pdf(
        <ProposalDocument data={data} photos={photos} dateLabel={todayLabel()} />,
      ).toBlob();
      if (cancelledRef.current) return;
      const pdfBase64 = await blobToBase64(blob);
      if (cancelledRef.current) return;
      await sendProposal({ ...data, pdfBase64, filename: filenameFor(data) }, controller.signal);
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
        <div className="mb-8 flex items-center justify-between">
          <div>
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
                href="/tools/pool-volume-calculator"
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
                  <option>Chlorine</option>
                  <option>Salt (chlorine generator)</option>
                  <option>Other</option>
                </select>
              </FieldShell>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="p-pump" label="Pump">
                  <input id="p-pump" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.pool.pump} onChange={(e) => update('pool', 'pump', e.target.value)}
                    onBlur={(e) => update('pool', 'pump', toTitleCase(e.target.value))} />
                </FieldShell>
                <FieldShell id="p-filter" label="Filter type">
                  <input id="p-filter" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.pool.filter} onChange={(e) => update('pool', 'filter', e.target.value)}
                    onBlur={(e) => update('pool', 'filter', toTitleCase(e.target.value))} />
                </FieldShell>
                <FieldShell id="p-heater" label="Heater">
                  <input id="p-heater" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.pool.heater} onChange={(e) => update('pool', 'heater', e.target.value)}
                    onBlur={(e) => update('pool', 'heater', toTitleCase(e.target.value))} />
                </FieldShell>
                <FieldShell id="p-auto" label="Automation">
                  <input id="p-auto" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.pool.automation} onChange={(e) => update('pool', 'automation', e.target.value)}
                    onBlur={(e) => update('pool', 'automation', toTitleCase(e.target.value))} />
                </FieldShell>
              </div>
              <FieldShell id="p-eqnotes" label="Equipment notes" multiline>
                <textarea id="p-eqnotes" rows={2} className={textareaClass} placeholder=" "
                  value={data.pool.equipmentNotes} onChange={(e) => update('pool', 'equipmentNotes', e.target.value)} />
              </FieldShell>
            </Section>

            <Section title="Photos">
              <p className="-mt-1 text-sm text-gray-400">
                Optional — attach pool or property photos to include in the proposal.
              </p>
              <div className="flex flex-wrap gap-3">
                {photos.map((src, i) => (
                  <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-white/15">
                    <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      aria-label="Remove photo"
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/25 text-gray-400 transition-colors hover:border-brand-blue-light hover:text-white">
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[11px]">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        addPhotos(e.target.files);
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              {photos.length > 0 && (
                <p className="text-xs text-gray-500">
                  {photos.length} of {MAX_PHOTOS} added. Photos aren&apos;t saved in the draft — re-add them if you leave this page.
                </p>
              )}
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
              <FieldShell id="pr-price" label="Total price (e.g. $2,400 or $185/mo)">
                <input id="pr-price" className={fieldClass} placeholder=" "
                  value={data.proposal.price} onChange={(e) => update('proposal', 'price', e.target.value)} />
              </FieldShell>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <input
                  type="checkbox"
                  checked={data.proposal.includeBenefits}
                  onChange={(e) => update('proposal', 'includeBenefits', e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-blue"
                />
                <span className="text-sm text-gray-200">
                  Highlight &ldquo;what&rsquo;s included&rdquo; — chemicals, filter &amp; salt-cell cleans{' '}
                  <span className="text-gray-400">(recommended for recurring service; turn off for one-time jobs)</span>
                </span>
              </label>
            </Section>

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
          <div className="lg:sticky lg:top-8 lg:self-start">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Live preview</p>
            <ProposalPreview data={data} photos={photos} dateLabel={todayLabel()} />

            {status.kind === 'error' && (
              <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <span>{status.message}</span>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={!canSend || status.kind === 'sending'}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark py-4 text-lg font-bold text-white shadow-lg shadow-brand-blue/20 transition-all hover:from-brand-blue-light hover:to-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
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
              <p className="mt-2 text-center text-xs text-gray-500">
                Enter the customer&apos;s name and a valid email to send.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="glass-panel rounded-2xl p-5 sm:p-6">
    <h2 className="mb-5 font-display text-base font-bold text-white">{title}</h2>
    <div className="space-y-5">{children}</div>
  </section>
);

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

        {proposal.includeBenefits && (
          <div className="rounded-lg border border-[#cfe3f2] bg-[#eef6fb] px-4 py-3">
            <div className="mb-2 text-sm font-bold text-brand-blue-dark">{BENEFITS_HEADING}</div>
            <ul className="space-y-1">
              {INCLUDED_BENEFITS.map((b, i) => (
                <li key={i} className="flex gap-2 text-[13px] font-semibold text-stone-800">
                  <span className="text-green-600">✓</span>
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] italic text-stone-500">{BENEFITS_NOTE}</p>
          </div>
        )}

        {(pool.gallons || dims || pool.shape || pool.sanitization) && (
          <PreviewBlock label="Pool — Size & Volume">
            <PreviewRow label="Volume" value={pool.gallons ? `${pool.gallons} gallons` : ''} />
            <PreviewRow label="Dimensions" value={dims} />
            <PreviewRow label="Shape" value={pool.shape} />
            <PreviewRow label="Sanitization" value={pool.sanitization} />
          </PreviewBlock>
        )}

        {(pool.pump || pool.filter || pool.heater || pool.automation || pool.equipmentNotes) && (
          <PreviewBlock label="Equipment">
            <PreviewRow label="Pump" value={pool.pump} />
            <PreviewRow label="Filter" value={pool.filter} />
            <PreviewRow label="Heater" value={pool.heater} />
            <PreviewRow label="Automation" value={pool.automation} />
            <PreviewRow label="Notes" value={pool.equipmentNotes} />
          </PreviewBlock>
        )}

        {photos.length > 0 && (
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
        )}

        {proposal.scope.trim() && (
          <PreviewBlock label="Scope of Work">
            <p className="whitespace-pre-line leading-relaxed text-stone-700">{proposal.scope.trim()}</p>
          </PreviewBlock>
        )}

        {proposal.price.trim() && (
          <div className="flex items-center justify-between rounded-lg border border-[#d6e6f3] bg-[#f1f6fb] px-4 py-3">
            <span className="text-stone-500">Total</span>
            <span className="text-lg font-bold text-brand-blue-dark">{formatPrice(proposal.price)}</span>
          </div>
        )}

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
          To accept, simply reply <strong>&quot;APPROVED&quot;</strong> to the email this is attached to.
        </div>
      </div>
    </div>
  );
};

const PreviewBlock = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brand-blue-dark">{label}</div>
    <div className="space-y-1">{children}</div>
  </div>
);

const PreviewRow = ({ label, value }: { label: string; value?: string }) => {
  const v = (value ?? '').trim();
  if (!v) return null;
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 text-stone-500">{label}</span>
      <span className="flex-1 text-stone-800">{v}</span>
    </div>
  );
};
