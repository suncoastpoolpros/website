import { useMemo, useRef, useState } from 'react';
import {
  Send,
  LoaderCircle,
  CheckCircle,
  AlertCircle,
  Trash2,
  LogOut,
  Calculator,
  FilePlus2,
  ChevronLeft,
  X,
} from 'lucide-react';
import { FieldShell, fieldClass, selectClass, textareaClass } from '@/components/FormField';
import { useInspectionDraft } from '@/lib/useAdminDraft';
import {
  sendInspection,
  logout,
  type InspectionData,
  type Issue,
  type IssueSeverity,
  type RecPriority,
  type Recommendation,
} from '@/lib/adminApi';
import { blobToBase64 } from '@/lib/adminMedia';
import { toTitleCase, formatUsPhone } from '@/lib/textFormat';
import { Section, PreviewBlock, PreviewRow } from './adminUi';
import { PhotoPicker } from './PhotoPicker';
import { SANITIZATION_TYPES } from './sanitization';
import {
  CHEMISTRY_FIELDS,
  ISSUE_PRESETS,
  OVERALL_RATINGS,
  PRIORITY_CHIPS,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  REC_PRESETS,
  SEVERITY_CHIPS,
  SEVERITY_LABELS,
  SEVERITY_ORDER,
  SURFACE_CONDITIONS,
  SURFACE_MATERIALS,
  SURFACE_OBSERVATIONS,
  WORK_TEMPLATES,
} from './inspectionPresets';

// Plain input (no floating label) for the compact finding rows.
const rowInput =
  'h-12 w-full rounded-xl border border-stone-300 bg-stone-100 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50';
const rowSelect = `${rowInput} cursor-pointer appearance-none pr-9 bg-no-repeat bg-[right_0.85rem_center] bg-[length:0.7rem_0.7rem] bg-[image:url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 12 12%27 fill=%27none%27 stroke=%27%23737373%27 stroke-width=%271.75%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27><polyline points=%273 4.5 6 7.5 9 4.5%27/></svg>")]`;

type SendStatus =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// yyyy-mm-dd → "August 13, 2026". Parsed as local parts (NOT new Date(iso),
// which reads a bare date as UTC and can render the previous day.)
const friendlyDate = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date();
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const filenameFor = (data: InspectionData): string => {
  const name = data.customer.name.trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `Suncoast-First-Service-Report${name ? '-' + name : ''}.pdf`;
};

export const InspectionBuilder = ({
  onLogout,
  onBack,
}: {
  onLogout: () => void;
  onBack: () => void;
}) => {
  const { data, setData, update, clearDraft } = useInspectionDraft();
  const [status, setStatus] = useState<SendStatus>({ kind: 'idle' });
  // Abort controller + a cancelled flag so Cancel actually stops the send: the
  // fetch is aborted via the signal, and the flag bails out of the pre-fetch
  // steps (dynamic import / PDF generation) that can't be aborted.
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const dateLabel = friendlyDate(data.visit.date);

  // ----- findings list editing -----
  const addIssue = (label = '', severity: IssueSeverity = 'soon', note = '') =>
    setData((p) => ({
      ...p,
      findings: { ...p.findings, issues: [...p.findings.issues, { label, severity, note }] },
    }));
  const updateIssue = (idx: number, patch: Partial<Issue>) =>
    setData((p) => ({
      ...p,
      findings: {
        ...p.findings,
        issues: p.findings.issues.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
      },
    }));
  const removeIssue = (idx: number) =>
    setData((p) => ({
      ...p,
      findings: { ...p.findings, issues: p.findings.issues.filter((_, i) => i !== idx) },
    }));

  const addRec = (label = '', priority: RecPriority = 'soon', note = '') =>
    setData((p) => ({
      ...p,
      findings: {
        ...p.findings,
        recommendations: [...p.findings.recommendations, { label, priority, note }],
      },
    }));
  const updateRec = (idx: number, patch: Partial<Recommendation>) =>
    setData((p) => ({
      ...p,
      findings: {
        ...p.findings,
        recommendations: p.findings.recommendations.map((it, i) =>
          i === idx ? { ...it, ...patch } : it,
        ),
      },
    }));
  const removeRec = (idx: number) =>
    setData((p) => ({
      ...p,
      findings: {
        ...p.findings,
        recommendations: p.findings.recommendations.filter((_, i) => i !== idx),
      },
    }));

  const toggleObservation = (label: string) =>
    setData((p) => ({
      ...p,
      surface: {
        ...p.surface,
        observations: p.surface.observations.includes(label)
          ? p.surface.observations.filter((o) => o !== label)
          : [...p.surface.observations, label],
      },
    }));

  // Drop a pre-written checklist into "what we did". Appends (with a blank line)
  // when there's already text, so templates combine and nothing typed is lost.
  const insertWorkTemplate = (label: string) => {
    const tpl = WORK_TEMPLATES.find((t) => t.label === label);
    if (!tpl) return;
    const current = data.visit.workPerformed.trim();
    update('visit', 'workPerformed', current ? `${current}\n\n${tpl.text}` : tpl.text);
  };

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
      const [{ pdf }, { InspectionDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./InspectionDocument'),
      ]);
      if (cancelledRef.current) return;
      const blob = await pdf(
        <InspectionDocument data={data} photos={photos} dateLabel={dateLabel} />,
      ).toBlob();
      if (cancelledRef.current) return;
      const pdfBase64 = await blobToBase64(blob);
      if (cancelledRef.current) return;
      await sendInspection({ ...data, pdfBase64, filename: filenameFor(data) }, controller.signal);
      setStatus({ kind: 'sent' });
    } catch (err) {
      // A cancel (flag set, or the fetch aborted) is not an error — stay idle.
      if (cancelledRef.current || (err instanceof DOMException && err.name === 'AbortError')) {
        return;
      }
      setStatus({
        kind: 'error',
        message: 'Could not send the report. Check the connection and try again.',
      });
      console.error('send inspection failed', err);
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
          <h2 className="font-display text-2xl font-bold text-white">Report sent</h2>
          <p className="mt-2 text-gray-300">
            Emailed to <span className="text-white">{data.customer.email}</span> with the PDF attached.
            A copy was BCC&apos;d to your inbox.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark px-5 py-3 font-semibold text-white"
            >
              <FilePlus2 className="h-5 w-5" /> New report
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
          backdrop blocks all interaction) so the report can't be double-sent. */}
      {status.kind === 'sending' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          role="alertdialog"
          aria-busy="true"
          aria-label="Sending report"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-light p-8 text-center">
            <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-brand-blue-light" />
            <h2 className="mt-5 font-display text-lg font-bold text-white">Sending report…</h2>
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
            <h1 className="font-display text-2xl font-bold text-white">First Service &amp; Inspection</h1>
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
              <FieldShell id="i-name" label="Full name">
                <input id="i-name" className={fieldClass} placeholder=" " autoComplete="off" autoCapitalize="words"
                  value={data.customer.name} onChange={(e) => update('customer', 'name', e.target.value)}
                  onBlur={(e) => update('customer', 'name', toTitleCase(e.target.value))} />
              </FieldShell>
              <FieldShell id="i-addr" label="Service address">
                <input id="i-addr" className={fieldClass} placeholder=" " autoComplete="off" autoCapitalize="words"
                  value={data.customer.address} onChange={(e) => update('customer', 'address', e.target.value)}
                  onBlur={(e) => update('customer', 'address', toTitleCase(e.target.value))} />
              </FieldShell>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="i-email" label="Email">
                  <input id="i-email" type="email" className={fieldClass} placeholder=" " autoComplete="off"
                    value={data.customer.email} onChange={(e) => update('customer', 'email', e.target.value)} />
                </FieldShell>
                <FieldShell id="i-phone" label="Phone">
                  <input id="i-phone" type="tel" className={fieldClass} placeholder=" " autoComplete="off"
                    value={data.customer.phone} onChange={(e) => update('customer', 'phone', e.target.value)}
                    onBlur={(e) => update('customer', 'phone', formatUsPhone(e.target.value))} />
                </FieldShell>
              </div>
            </Section>

            <Section title="The Visit">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="i-date" label="Service date" floated>
                  <input id="i-date" type="date" className={selectClass}
                    value={data.visit.date} onChange={(e) => update('visit', 'date', e.target.value)} />
                </FieldShell>
                <FieldShell id="i-tech" label="Technician">
                  <input id="i-tech" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.visit.technician} onChange={(e) => update('visit', 'technician', e.target.value)}
                    onBlur={(e) => update('visit', 'technician', toTitleCase(e.target.value))} />
                </FieldShell>
              </div>
              <FieldShell id="i-overall" label="Overall condition" floated>
                <select id="i-overall" className={selectClass}
                  value={data.visit.overall} onChange={(e) => update('visit', 'overall', e.target.value)}>
                  <option value=""></option>
                  {OVERALL_RATINGS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell id="i-summary" label="Where your pool stands (plain-English summary)" multiline>
                <textarea id="i-summary" rows={5} className={textareaClass} placeholder=" "
                  value={data.visit.summary} onChange={(e) => update('visit', 'summary', e.target.value)} />
              </FieldShell>
            </Section>

            <Section title="Pool — Size & Volume">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="i-gal" label="Volume (gallons)">
                  <input id="i-gal" inputMode="numeric" className={fieldClass} placeholder=" "
                    value={data.pool.gallons} onChange={(e) => update('pool', 'gallons', e.target.value)} />
                </FieldShell>
                <FieldShell id="i-shape" label="Shape" floated>
                  <select id="i-shape" className={selectClass}
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
                <FieldShell id="i-len" label="Length (ft)">
                  <input id="i-len" inputMode="decimal" className={fieldClass} placeholder=" "
                    value={data.pool.length} onChange={(e) => update('pool', 'length', e.target.value)} />
                </FieldShell>
                <FieldShell id="i-wid" label="Width (ft)">
                  <input id="i-wid" inputMode="decimal" className={fieldClass} placeholder=" "
                    value={data.pool.width} onChange={(e) => update('pool', 'width', e.target.value)} />
                </FieldShell>
                <FieldShell id="i-dep" label="Avg depth (ft)">
                  <input id="i-dep" inputMode="decimal" className={fieldClass} placeholder=" "
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
              <FieldShell id="i-san" label="Sanitization" floated>
                <select id="i-san" className={selectClass}
                  value={data.pool.sanitization} onChange={(e) => update('pool', 'sanitization', e.target.value)}>
                  <option value=""></option>
                  {SANITIZATION_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </FieldShell>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="i-pump" label="Pump">
                  <input id="i-pump" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.pool.pump} onChange={(e) => update('pool', 'pump', e.target.value)}
                    onBlur={(e) => update('pool', 'pump', toTitleCase(e.target.value))} />
                </FieldShell>
                <FieldShell id="i-filter" label="Filter type">
                  <input id="i-filter" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.pool.filter} onChange={(e) => update('pool', 'filter', e.target.value)}
                    onBlur={(e) => update('pool', 'filter', toTitleCase(e.target.value))} />
                </FieldShell>
                <FieldShell id="i-heater" label="Heater">
                  <input id="i-heater" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.pool.heater} onChange={(e) => update('pool', 'heater', e.target.value)}
                    onBlur={(e) => update('pool', 'heater', toTitleCase(e.target.value))} />
                </FieldShell>
                <FieldShell id="i-auto" label="Automation">
                  <input id="i-auto" className={fieldClass} placeholder=" " autoCapitalize="words"
                    value={data.pool.automation} onChange={(e) => update('pool', 'automation', e.target.value)}
                    onBlur={(e) => update('pool', 'automation', toTitleCase(e.target.value))} />
                </FieldShell>
              </div>
              <FieldShell id="i-eqnotes" label="Equipment notes" multiline>
                <textarea id="i-eqnotes" rows={2} className={textareaClass} placeholder=" "
                  value={data.pool.equipmentNotes} onChange={(e) => update('pool', 'equipmentNotes', e.target.value)} />
              </FieldShell>
            </Section>

            <Section title="Water Chemistry">
              <p className="-mt-1 text-sm text-gray-400">
                Leave anything you didn&apos;t test blank — blank readings don&apos;t appear on the report
                at all, and if you skip every one the whole section disappears.
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Wrapped in a keyed <div> because this project has no
                    @types/react, so custom components don't accept `key`. */}
                {CHEMISTRY_FIELDS.map((f) => (
                  <div key={f.key}>
                    <FieldShell
                      id={`i-chem-${f.key}`}
                      label={f.unit ? `${f.label} (${f.unit})` : f.label}
                    >
                      <input
                        id={`i-chem-${f.key}`}
                        className={fieldClass}
                        placeholder=" "
                        autoComplete="off"
                        inputMode={f.key === 'waterLevel' ? 'text' : 'decimal'}
                        value={data.chemistry[f.key]}
                        onChange={(e) => update('chemistry', f.key, e.target.value)}
                      />
                    </FieldShell>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="What We Did On This Visit">
              <FieldShell id="i-work-template" label="Insert a checklist" floated>
                <select
                  id="i-work-template"
                  className={selectClass}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) insertWorkTemplate(e.target.value);
                    e.currentTarget.selectedIndex = 0; // reset so the same one can be re-picked
                  }}
                >
                  <option value="">Choose a checklist to add…</option>
                  {WORK_TEMPLATES.map((t) => (
                    <option key={t.label} value={t.label}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell id="i-work" label="Work performed" multiline>
                <textarea id="i-work" rows={8} className={textareaClass} placeholder=" "
                  value={data.visit.workPerformed} onChange={(e) => update('visit', 'workPerformed', e.target.value)} />
              </FieldShell>
            </Section>

            <Section title="Surface & Finish">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldShell id="i-surf-mat" label="Surface material" floated>
                  <select id="i-surf-mat" className={selectClass}
                    value={data.surface.material} onChange={(e) => update('surface', 'material', e.target.value)}>
                    <option value=""></option>
                    {SURFACE_MATERIALS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </FieldShell>
                <FieldShell id="i-surf-cond" label="Condition" floated>
                  <select id="i-surf-cond" className={selectClass}
                    value={data.surface.condition} onChange={(e) => update('surface', 'condition', e.target.value)}>
                    <option value=""></option>
                    {SURFACE_CONDITIONS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </FieldShell>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Wear &amp; staining — tick anything you saw.</p>
                <div className="flex flex-wrap gap-2">
                  {SURFACE_OBSERVATIONS.map((o) => {
                    const on = data.surface.observations.includes(o);
                    return (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleObservation(o)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          on
                            ? 'border-brand-blue-light bg-brand-blue/25 text-white'
                            : 'border-white/15 text-gray-300 hover:border-brand-blue-light hover:text-white'
                        }`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              </div>
              <FieldShell id="i-surf-notes" label="Surface notes" multiline>
                <textarea id="i-surf-notes" rows={3} className={textareaClass} placeholder=" "
                  value={data.surface.notes} onChange={(e) => update('surface', 'notes', e.target.value)} />
              </FieldShell>
            </Section>

            <Section title="What Needs Attention">
              <p className="-mt-1 text-sm text-gray-400">
                Anything broken, worn out or due for replacement. Quick-add a common one, then set how
                urgent it is and add a note.
              </p>
              <div className="flex flex-wrap gap-2">
                {ISSUE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => addIssue(preset.label, preset.severity)}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-brand-blue-light hover:text-white"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
              {data.findings.issues.length > 0 && (
                <div className="space-y-3">
                  {data.findings.issues.map((issue, i) => (
                    <div key={i}>
                      <FindingRow
                        label={issue.label}
                        note={issue.note}
                        kind={issue.severity}
                        options={SEVERITY_ORDER.map((s) => ({ value: s, label: SEVERITY_LABELS[s] }))}
                        labelPlaceholder="What's wrong"
                        onLabel={(v) => updateIssue(i, { label: v })}
                        onNote={(v) => updateIssue(i, { note: v })}
                        onKind={(v) => updateIssue(i, { severity: v as IssueSeverity })}
                        onRemove={() => removeIssue(i)}
                      />
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => addIssue()}
                className="text-sm font-semibold text-brand-blue-light hover:text-white"
              >
                + Custom item
              </button>
            </Section>

            <Section title="Recommendations">
              <p className="-mt-1 text-sm text-gray-400">
                Upgrades and next steps — a salt cell, a robot vacuum, a pump. Advice only, no pricing
                on the report.
              </p>
              <div className="flex flex-wrap gap-2">
                {REC_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => addRec(preset.label, preset.priority, preset.note ?? '')}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-brand-blue-light hover:text-white"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
              {data.findings.recommendations.length > 0 && (
                <div className="space-y-3">
                  {data.findings.recommendations.map((rec, i) => (
                    <div key={i}>
                      <FindingRow
                        label={rec.label}
                        note={rec.note}
                        kind={rec.priority}
                        options={PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
                        labelPlaceholder="What we recommend"
                        onLabel={(v) => updateRec(i, { label: v })}
                        onNote={(v) => updateRec(i, { note: v })}
                        onKind={(v) => updateRec(i, { priority: v as RecPriority })}
                        onRemove={() => removeRec(i)}
                      />
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => addRec()}
                className="text-sm font-semibold text-brand-blue-light hover:text-white"
              >
                + Custom recommendation
              </button>
            </Section>

            <Section title="Photos">
              <PhotoPicker
                photos={photos}
                setPhotos={setPhotos}
                hint="Optional — attach photos from the visit. Great for showing wear, stains or a failed part."
              />
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
              <InspectionPreview data={data} photos={photos} dateLabel={dateLabel} />
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
                  Send report to customer <Send className="h-5 w-5" />
                </>
              )}
            </button>
            {!canSend && (
              <p className="mt-2 shrink-0 text-center text-xs text-gray-500">
                Enter the customer&apos;s name and a valid email to send.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// One editable finding: a label, a severity/priority, and an optional note.
// Shared by the issues list and the recommendations list — they're the same
// shape with different option sets.
const FindingRow = ({
  label,
  note,
  kind,
  options,
  labelPlaceholder,
  onLabel,
  onNote,
  onKind,
  onRemove,
}: {
  label: string;
  note: string;
  kind: string;
  options: Array<{ value: string; label: string }>;
  labelPlaceholder: string;
  onLabel: (v: string) => void;
  onNote: (v: string) => void;
  onKind: (v: string) => void;
  onRemove: () => void;
}) => (
  <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
    <div className="flex items-center gap-2">
      <input
        className={rowInput}
        placeholder={labelPlaceholder}
        value={label}
        onChange={(e) => onLabel(e.target.value)}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        className={`${rowSelect} sm:w-52 sm:shrink-0`}
        value={kind}
        onChange={(e) => onKind(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        className={rowInput}
        placeholder="Note for the customer (optional)"
        value={note}
        onChange={(e) => onNote(e.target.value)}
      />
    </div>
  </div>
);

// ----- Live preview (HTML mirror of the PDF) -----------------------------

const SEVERITY_PILL: Record<IssueSeverity, string> = {
  urgent: 'bg-[#fdecec] text-[#a32020] border-[#f3c4c4]',
  soon: 'bg-[#fdf4e6] text-[#8a5a10] border-[#efd7a6]',
  monitor: 'bg-[#eef2f7] text-[#4b5b70] border-[#d8e0ea]',
};

const PRIORITY_PILL: Record<RecPriority, string> = {
  now: 'bg-[#eaf3fb] text-[#0f4d80] border-[#c8dff2]',
  soon: 'bg-[#eef2f7] text-[#4b5b70] border-[#d8e0ea]',
  optional: 'bg-[#f5f5f4] text-[#6b7280] border-[#e3e3e0]',
};

const InspectionPreview = ({
  data,
  photos,
  dateLabel,
}: {
  data: InspectionData;
  photos: string[];
  dateLabel: string;
}) => {
  const { customer, pool, visit, chemistry, surface, findings } = data;
  const dims = [pool.length && `${pool.length} ft L`, pool.width && `${pool.width} ft W`, pool.avgDepth && `${pool.avgDepth} ft avg`]
    .filter(Boolean)
    .join(' × ');
  const readings = CHEMISTRY_FIELDS.map((f) => ({ ...f, value: chemistry[f.key].trim() })).filter(
    (f) => f.value !== '',
  );
  const workLines = visit.workPerformed.split('\n').map((l) => l.trim()).filter(Boolean);
  const summaryLines = visit.summary.split('\n').map((l) => l.trim()).filter(Boolean);
  const issues = [...findings.issues.filter((i) => i.label.trim())].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
  const recs = [...findings.recommendations.filter((r) => r.label.trim())].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );
  const observations = surface.observations.filter((o) => o.trim());
  const hasSurface =
    surface.material.trim() || surface.condition.trim() || observations.length || surface.notes.trim();

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-800 shadow-xl">
      <div className="flex items-start justify-between gap-4 border-b-4 border-brand-blue bg-navy px-6 py-5 text-white">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Suncoast Pool Pros</div>
          <div className="mt-0.5 text-lg font-bold">First Service &amp; Inspection Report</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[9px] uppercase tracking-wide text-gray-400">Service Date</div>
          <div className="text-sm">{dateLabel}</div>
          {visit.technician.trim() && (
            <>
              <div className="mt-2 text-[9px] uppercase tracking-wide text-gray-400">Technician</div>
              <div className="text-sm">{visit.technician.trim()}</div>
            </>
          )}
        </div>
      </div>
      <div className="space-y-5 px-6 py-5 text-sm">
        <PreviewBlock label="Prepared For">
          <PreviewRow label="Name" value={customer.name} />
          <PreviewRow label="Service Address" value={customer.address} />
          <PreviewRow label="Email" value={customer.email} />
          <PreviewRow label="Phone" value={customer.phone} />
        </PreviewBlock>

        {(pool.gallons || dims || pool.shape || pool.sanitization) && (
          <PreviewBlock label="Your Pool">
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

        {(summaryLines.length > 0 || visit.overall.trim()) && (
          <div className="rounded-lg border border-[#cfe3f2] bg-[#eef6fb] px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-brand-blue-dark">Where Your Pool Stands</div>
              {visit.overall.trim() && (
                <span className="rounded border border-[#cfe3f2] bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-blue-dark">
                  Overall: {visit.overall.trim()}
                </span>
              )}
            </div>
            {summaryLines.map((line, i) => (
              <p key={i} className="mb-1 text-[13px] leading-relaxed text-stone-700">
                {line}
              </p>
            ))}
          </div>
        )}

        {readings.length > 0 && (
          <PreviewBlock label="Water Chemistry — First Visit">
            <div className="flex gap-3 border-b border-stone-200 pb-1 text-[10px] uppercase tracking-wide text-stone-400">
              <span className="flex-1">Reading</span>
              <span className="w-20">Result</span>
              <span className="w-24">Ideal</span>
            </div>
            {readings.map((f) => (
              <div key={f.key} className="flex gap-3 border-b border-stone-100 py-1">
                <span className="flex-1 text-stone-700">{f.label}</span>
                <span className="w-20 font-semibold text-navy">
                  {f.unit ? `${f.value} ${f.unit}` : f.value}
                </span>
                <span className="w-24 text-stone-400">{f.ideal || ''}</span>
              </div>
            ))}
          </PreviewBlock>
        )}

        {workLines.length > 0 && (
          <PreviewBlock label="What We Did On This Visit">
            {workLines.map((line, i) => (
              <p key={i} className="text-[13px] leading-relaxed text-stone-700">
                {line}
              </p>
            ))}
          </PreviewBlock>
        )}

        {hasSurface && (
          <PreviewBlock label="Surface & Finish">
            <PreviewRow label="Surface" value={surface.material} />
            <PreviewRow label="Condition" value={surface.condition} />
            {observations.map((o, i) => (
              <p key={i} className="text-[13px] text-stone-700">
                <span className="text-brand-blue">•</span> {o}
              </p>
            ))}
            {surface.notes.trim() && (
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-stone-700">
                {surface.notes.trim()}
              </p>
            )}
          </PreviewBlock>
        )}

        {issues.length > 0 && (
          <PreviewBlock label="What Needs Attention">
            {issues.map((issue, i) => (
              <div key={i} className="border-b border-stone-100 py-1.5">
                <span
                  className={`mr-2 inline-block rounded border px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wide ${SEVERITY_PILL[issue.severity]}`}
                >
                  {SEVERITY_CHIPS[issue.severity]}
                </span>
                <span className="font-semibold text-navy">{issue.label.trim()}</span>
                {issue.note.trim() && (
                  <p className="mt-0.5 text-[13px] text-stone-600">{issue.note.trim()}</p>
                )}
              </div>
            ))}
          </PreviewBlock>
        )}

        {recs.length > 0 && (
          <PreviewBlock label="Our Recommendations">
            {recs.map((rec, i) => (
              <div key={i} className="border-b border-stone-100 py-1.5">
                <span
                  className={`mr-2 inline-block rounded border px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wide ${PRIORITY_PILL[rec.priority]}`}
                >
                  {PRIORITY_CHIPS[rec.priority]}
                </span>
                <span className="font-semibold text-navy">{rec.label.trim()}</span>
                {rec.note.trim() && (
                  <p className="mt-0.5 text-[13px] text-stone-600">{rec.note.trim()}</p>
                )}
              </div>
            ))}
          </PreviewBlock>
        )}

        <div className="rounded-lg border border-[#bfe7c6] bg-[#eefaf0] px-4 py-3 text-[13px] leading-relaxed text-[#1d7a33]">
          Questions about anything in this report? Just reply to the email it came with.
        </div>

        {photos.length > 0 && (
          <>
            <div className="flex items-center gap-3 pt-1 text-[10px] font-bold uppercase tracking-wide text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              Page 2
              <span className="h-px flex-1 bg-stone-200" />
            </div>
            <PreviewBlock label="Photos From This Visit">
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
