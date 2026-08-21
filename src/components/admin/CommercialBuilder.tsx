/**
 * The commercial bid builder.
 *
 * Deliberately NOT a mode on ProposalBuilder. A commercial bid quotes many
 * bodies of water rather than one pool, carries a statutory classification that
 * changes what it may promise, prices by frequency instead of by plan, and
 * needs a page of contract terms a homeowner never sees. Sharing the file would
 * have meant an `if commercial` branch through every field of a builder that is
 * already 1,500 lines.
 *
 * WHAT IT SHARES with the residential builder, on purpose: the customer-facing
 * primitives (Section, FieldShell), the autosaved draft, the proposal number,
 * quote storage, and the review-before-send step. Those are about *sending a
 * document*, which is the same job whoever is reading it.
 *
 * The form order follows the document order, because the operator is usually
 * filling this in from a site survey and reading down their own notes: what the
 * property is, what water is on it, what we will do, what it costs, on what
 * terms.
 */
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  LogOut,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { FieldShell, fieldClass, selectClass, textareaClass } from '@/components/FormField';
import { useCommercialDraft } from '@/lib/useAdminDraft';
import {
  commercialTotal,
  newWaterBody,
  type WaterBody,
} from '@/lib/adminApi';
import { toTitleCase, formatUsPhone } from '@/lib/textFormat';
import { Section } from './adminUi';
import {
  CLASSIFICATIONS,
  CLASSIFICATION_DISCLAIMER,
  classificationFor,
  requiresDailyLog,
} from './commercialClassification';
import {
  COMMERCIAL_EXCLUSIONS,
  COMMERCIAL_SCOPE,
  LOG_MODELS,
} from './commercialScope';
import { TERM_DEFAULTS } from './commercialTerms';

const BODY_KINDS = [
  { value: 'pool', label: 'Swimming pool' },
  { value: 'spa', label: 'Spa / hot tub' },
  { value: 'wading', label: 'Wading / kiddie pool' },
  { value: 'feature', label: 'Water feature / fountain' },
];

const FILTER_TYPES = ['Cartridge', 'DE', 'Sand', 'Regenerative DE', 'Other'];

/** The three columns a commercial bid is priced in. */
const FREQUENCIES = [
  { field: 'price2x' as const, label: '2× / week', short: '2×' },
  { field: 'price3x' as const, label: '3× / week', short: '3×' },
  { field: 'price5x' as const, label: '5× / week', short: '5×' },
];

const priceInput =
  'h-11 w-full rounded-lg border border-stone-300 bg-stone-100 px-3 text-[15px] text-stone-900 placeholder-stone-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/50';

const money = (n: number): string =>
  n > 0 ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—';

export const CommercialBuilder = ({
  onLogout,
  onBack,
}: {
  onLogout: () => void;
  onBack: () => void;
}) => {
  const { data, setData, update, clearDraft } = useCommercialDraft();
  const [confirmClear, setConfirmClear] = useState(false);

  const classification = classificationFor(data.property.classification);
  const dailyLogDue = requiresDailyLog(data.property.classification);

  // ---- water bodies ----
  const patchBody = (id: string, patch: Partial<WaterBody>) =>
    setData((prev) => ({
      ...prev,
      bodies: prev.bodies.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));

  const addBody = () =>
    setData((prev) => ({ ...prev, bodies: [...prev.bodies, newWaterBody()] }));

  const removeBody = (id: string) =>
    setData((prev) => ({
      ...prev,
      // Never drop to zero: a property with no water on it is not a bid, and an
      // empty state here would just be a button that says "add one back".
      bodies: prev.bodies.length > 1 ? prev.bodies.filter((b) => b.id !== id) : prev.bodies,
    }));

  // ---- exclusions ----
  // Seeded from the preset on first use rather than stored in emptyCommercial,
  // so a draft saved before the preset changed still shows the list it was
  // written against instead of silently gaining new lines.
  const exclusions = data.bid.exclusions.length ? data.bid.exclusions : COMMERCIAL_EXCLUSIONS;
  const setExclusions = (next: string[]) => update('bid', 'exclusions', next);

  // ---- totals ----
  const totals = useMemo(
    () => ({
      twice: commercialTotal(data.bodies, 'price2x'),
      thrice: commercialTotal(data.bodies, 'price3x'),
      fivex: commercialTotal(data.bodies, 'price5x'),
      daily: commercialTotal(data.bodies, 'price7x'),
    }),
    [data.bodies],
  );

  const anyPriced = totals.twice + totals.thrice + totals.fivex > 0;

  const doClear = () => {
    clearDraft();
    setConfirmClear(false);
  };

  return (
    <div className="min-h-dvh px-4 py-6 md:px-8 md:py-10">
      {confirmClear && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          role="dialog"
          aria-modal="true"
          aria-label="Clear this bid"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-light p-6">
            <h2 className="font-display text-lg font-bold text-white">Clear this bid?</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">
              Every field, every body of water and all the pricing goes. There&apos;s no undo — and
              a commercial bid is usually half an hour of survey notes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={doClear}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
              >
                Yes, clear it
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5"
              >
                Keep it
              </button>
            </div>
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
            <h1 className="font-display text-2xl font-bold text-white">Commercial Bid</h1>
            <p className="text-sm text-gray-400">Draft saves automatically as you type.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              <Trash2 className="h-4 w-4" /> Clear
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" /> Lock
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* ---------------- Property ---------------- */}
          <Section title="Property">
            <FieldShell id="cp-name" label="Association / company name">
              <input
                id="cp-name"
                className={fieldClass}
                placeholder=" "
                autoComplete="off"
                autoCapitalize="words"
                value={data.property.name}
                onChange={(e) => update('property', 'name', e.target.value)}
              />
            </FieldShell>
            <FieldShell id="cp-addr" label="Property address">
              <input
                id="cp-addr"
                className={fieldClass}
                placeholder=" "
                autoComplete="off"
                autoCapitalize="words"
                value={data.property.address}
                onChange={(e) => update('property', 'address', e.target.value)}
                onBlur={(e) => update('property', 'address', toTitleCase(e.target.value))}
              />
            </FieldShell>
            <FieldShell id="cp-mgmt" label="Management company (optional)">
              <input
                id="cp-mgmt"
                className={fieldClass}
                placeholder=" "
                autoComplete="off"
                value={data.property.managementCompany}
                onChange={(e) => update('property', 'managementCompany', e.target.value)}
              />
            </FieldShell>

            {/* The entity signs; the person reads. Kept apart so the covering
                email can greet a human without addressing the association by
                its first word. */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FieldShell id="cp-contact" label="Contact name">
                <input
                  id="cp-contact"
                  className={fieldClass}
                  placeholder=" "
                  autoComplete="off"
                  autoCapitalize="words"
                  value={data.property.contactName}
                  onChange={(e) => update('property', 'contactName', e.target.value)}
                  onBlur={(e) => update('property', 'contactName', toTitleCase(e.target.value))}
                />
              </FieldShell>
              <FieldShell id="cp-title" label="Their title">
                <input
                  id="cp-title"
                  className={fieldClass}
                  placeholder=" "
                  autoComplete="off"
                  value={data.property.contactTitle}
                  onChange={(e) => update('property', 'contactTitle', e.target.value)}
                />
              </FieldShell>
              <FieldShell id="cp-email" label="Email">
                <input
                  id="cp-email"
                  type="email"
                  className={fieldClass}
                  placeholder=" "
                  autoComplete="off"
                  value={data.property.email}
                  onChange={(e) => update('property', 'email', e.target.value)}
                />
              </FieldShell>
              <FieldShell id="cp-phone" label="Phone">
                <input
                  id="cp-phone"
                  type="tel"
                  className={fieldClass}
                  placeholder=" "
                  autoComplete="off"
                  value={data.property.phone}
                  onChange={(e) => update('property', 'phone', e.target.value)}
                  onBlur={(e) => update('property', 'phone', formatUsPhone(e.target.value))}
                />
              </FieldShell>
            </div>
          </Section>

          {/* ---------------- Classification ---------------- */}
          <Section title="What this property is under Florida law">
            <p className="-mt-2 text-sm leading-relaxed text-gray-400">
              This decides what the bid may promise, so it is printed on the proposal. No competing
              bid tells the board this, and getting it wrong is how a document ends up promising
              compliance a three-visit week cannot deliver.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr,160px]">
              <FieldShell id="cp-class" label="Classification">
                <select
                  id="cp-class"
                  className={selectClass}
                  value={data.property.classification}
                  onChange={(e) => update('property', 'classification', e.target.value)}
                >
                  <option value="">Select…</option>
                  {CLASSIFICATIONS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell id="cp-units" label="Units">
                <input
                  id="cp-units"
                  className={fieldClass}
                  placeholder=" "
                  inputMode="numeric"
                  autoComplete="off"
                  value={data.property.unitCount}
                  onChange={(e) => update('property', 'unitCount', e.target.value)}
                />
              </FieldShell>
            </div>

            {classification && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Qualifying test
                </p>
                <p className="mt-1 text-sm text-gray-300">{classification.test}</p>
                <p className="mt-3 text-sm font-semibold text-white">{classification.status}</p>
                <ul className="mt-2 space-y-1.5">
                  {classification.obligations.map((o) => (
                    <li key={o} className="flex gap-2 text-sm leading-relaxed text-gray-400">
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-600" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  {CLASSIFICATION_DISCLAIMER}
                </p>
              </div>
            )}

            {dailyLogDue && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="text-sm leading-relaxed text-amber-100">
                  <strong className="font-semibold">This pool carries the daily testing duty.</strong>{' '}
                  pH and disinfectant must be tested and logged every 24 hours it is open, and the
                  duty sits with the owner. Two, three or five visits a week does not satisfy it —
                  so the bid must say who covers the other days. Both models print below.
                </div>
              </div>
            )}
          </Section>

          {/* ---------------- Bodies of water ---------------- */}
          <Section title="Bodies of water">
            <p className="-mt-2 text-sm leading-relaxed text-gray-400">
              Each one priced separately, so the board can add or drop the spa without renegotiating
              the whole bid — and so the document proves you surveyed the property.
            </p>

            <div className="space-y-5">
              {data.bodies.map((b, i) => (
                <div key={b.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Body {i + 1}
                    </span>
                    {data.bodies.length > 1 && (
                      <button
                        onClick={() => removeBody(b.id)}
                        aria-label={`Remove ${b.label || `body ${i + 1}`}`}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldShell id={`b-${b.id}-label`} label="Label">
                      <input
                        id={`b-${b.id}-label`}
                        className={fieldClass}
                        placeholder=" "
                        autoComplete="off"
                        value={b.label}
                        onChange={(e) => patchBody(b.id, { label: e.target.value })}
                      />
                    </FieldShell>
                    <FieldShell id={`b-${b.id}-kind`} label="Type">
                      <select
                        id={`b-${b.id}-kind`}
                        className={selectClass}
                        value={b.kind}
                        onChange={(e) => patchBody(b.id, { kind: e.target.value })}
                      >
                        {BODY_KINDS.map((k) => (
                          <option key={k.value} value={k.value}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                    </FieldShell>
                    <FieldShell id={`b-${b.id}-gal`} label="Gallons">
                      <input
                        id={`b-${b.id}-gal`}
                        className={fieldClass}
                        placeholder=" "
                        inputMode="numeric"
                        autoComplete="off"
                        value={b.gallons}
                        onChange={(e) => patchBody(b.id, { gallons: e.target.value })}
                      />
                    </FieldShell>
                    <FieldShell id={`b-${b.id}-permit`} label="DOH permit no.">
                      <input
                        id={`b-${b.id}-permit`}
                        className={fieldClass}
                        placeholder=" "
                        autoComplete="off"
                        value={b.permitNumber}
                        onChange={(e) => patchBody(b.id, { permitNumber: e.target.value })}
                      />
                    </FieldShell>
                    <FieldShell id={`b-${b.id}-ftype`} label="Filter type">
                      <select
                        id={`b-${b.id}-ftype`}
                        className={selectClass}
                        value={b.filterType}
                        onChange={(e) => patchBody(b.id, { filterType: e.target.value })}
                      >
                        <option value="">Select…</option>
                        {FILTER_TYPES.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </FieldShell>
                    <FieldShell id={`b-${b.id}-gpm`} label="Permitted flow (GPM)">
                      <input
                        id={`b-${b.id}-gpm`}
                        className={fieldClass}
                        placeholder=" "
                        inputMode="numeric"
                        autoComplete="off"
                        value={b.permittedGpm}
                        onChange={(e) => patchBody(b.id, { permittedGpm: e.target.value })}
                      />
                    </FieldShell>
                    <FieldShell id={`b-${b.id}-filter`} label="Filter make & model">
                      <input
                        id={`b-${b.id}-filter`}
                        className={fieldClass}
                        placeholder=" "
                        autoComplete="off"
                        value={b.filter}
                        onChange={(e) => patchBody(b.id, { filter: e.target.value })}
                      />
                    </FieldShell>
                    <FieldShell id={`b-${b.id}-feeders`} label="Feeders on the pad">
                      <input
                        id={`b-${b.id}-feeders`}
                        className={fieldClass}
                        placeholder=" "
                        autoComplete="off"
                        value={b.feeders}
                        onChange={(e) => patchBody(b.id, { feeders: e.target.value })}
                      />
                    </FieldShell>
                  </div>

                  <div className="mt-4">
                    <FieldShell id={`b-${b.id}-notes`} label="Notes from the survey" multiline>
                      <textarea
                        id={`b-${b.id}-notes`}
                        rows={2}
                        className={textareaClass}
                        placeholder=" "
                        value={b.notes}
                        onChange={(e) => patchBody(b.id, { notes: e.target.value })}
                      />
                    </FieldShell>
                  </div>

                  {/* Pricing sits with the body it prices, not in a separate
                      grid further down — the operator is deciding this while
                      looking at the equipment they just described. */}
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Monthly rate for this body
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {FREQUENCIES.map((f) => (
                        <label key={f.field} className="block">
                          <span className="mb-1 block text-xs text-gray-400">{f.label}</span>
                          <input
                            className={priceInput}
                            inputMode="decimal"
                            placeholder="—"
                            autoComplete="off"
                            value={b[f.field]}
                            onChange={(e) => patchBody(b.id, { [f.field]: e.target.value })}
                          />
                        </label>
                      ))}
                      <label className="block">
                        <span className="mb-1 block text-xs text-amber-300/80">7× / week</span>
                        <input
                          className={priceInput}
                          inputMode="decimal"
                          placeholder="—"
                          autoComplete="off"
                          value={b.price7x}
                          onChange={(e) => patchBody(b.id, { price7x: e.target.value })}
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      The 7× column is the daily-service comparison. It prints beside the audited-log
                      option so the board can see what daily actually costs.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addBody}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/5"
            >
              <Plus className="h-4 w-4" /> Add another body of water
            </button>

            {anyPriced && (
              <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue-light">
                  Property total, per month
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Total label="2× / week" value={money(totals.twice)} />
                  <Total label="3× / week" value={money(totals.thrice)} />
                  <Total label="5× / week" value={money(totals.fivex)} />
                  <Total label="7× / week" value={money(totals.daily)} muted />
                </div>
              </div>
            )}
          </Section>

          {/* ---------------- Daily log model ---------------- */}
          <Section title="Who covers the days we're not there">
            <p className="-mt-2 text-sm leading-relaxed text-gray-400">
              Both models print on the proposal. Pick the one you&apos;re recommending — the other
              stays visible with its price, so the choice sits with the board and is on the record.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {LOG_MODELS.map((m) => {
                const picked = data.bid.logModel === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => update('bid', 'logModel', m.key)}
                    aria-pressed={picked}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      picked
                        ? 'border-brand-blue bg-brand-blue/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <h3 className="font-display text-sm font-bold text-white">{m.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-400">{m.summary}</p>
                    <dl className="mt-3 space-y-1.5">
                      {m.split.map((s) => (
                        <div key={s.who} className="text-xs leading-relaxed">
                          <dt className="inline font-semibold text-gray-300">{s.who}: </dt>
                          <dd className="inline text-gray-500">{s.does}</dd>
                        </div>
                      ))}
                    </dl>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ---------------- Scope ---------------- */}
          <Section title="Scope of work">
            <p className="-mt-2 text-sm leading-relaxed text-gray-400">
              Standard on every commercial bid and printed in full — the pad section first, because
              that is where these pools actually fail. Add anything specific to this property below.
            </p>
            <div className="space-y-3">
              {COMMERCIAL_SCOPE.map((g) => (
                <details key={g.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-white">
                    {g.title}{' '}
                    <span className="font-normal text-gray-500">({g.items.length} items)</span>
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">{g.rationale}</p>
                  <ul className="mt-3 space-y-2">
                    {g.items.map((it) => (
                      <li key={it} className="flex gap-2 text-sm leading-relaxed text-gray-400">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-600" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
            <FieldShell id="cb-scopenotes" label="Additional scope for this property" multiline>
              <textarea
                id="cb-scopenotes"
                rows={3}
                className={textareaClass}
                placeholder=" "
                value={data.bid.scopeNotes}
                onChange={(e) => update('bid', 'scopeNotes', e.target.value)}
              />
            </FieldShell>
          </Section>

          {/* ---------------- Exclusions ---------------- */}
          <Section title="Exclusions">
            <p className="-mt-2 text-sm leading-relaxed text-gray-400">
              Its own headed section on the proposal, not a footnote. Boards are coached to reject
              vague scope, so the bid that says plainly what it does <em>not</em> cover reads as the
              honest one — this is the page that wins on comparison.
            </p>
            <ul className="space-y-2">
              {exclusions.map((x, i) => (
                <li key={`${i}-${x.slice(0, 24)}`} className="flex items-start gap-2">
                  <input
                    aria-label={`Exclusion ${i + 1}`}
                    className={`${fieldClass} h-auto min-h-[44px] py-2.5`}
                    value={x}
                    onChange={(e) => {
                      const next = [...exclusions];
                      next[i] = e.target.value;
                      setExclusions(next);
                    }}
                  />
                  <button
                    onClick={() => setExclusions(exclusions.filter((_, j) => j !== i))}
                    aria-label={`Remove exclusion ${i + 1}`}
                    className="mt-1.5 rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setExclusions([...exclusions, ''])}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/5"
            >
              <Plus className="h-4 w-4" /> Add an exclusion
            </button>
          </Section>

          {/* ---------------- Terms ---------------- */}
          <Section title="Contract terms">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TermField
                id="ct-repair"
                label="Pre-authorised repair threshold ($)"
                hint="Repairs at or under this are done and reported; above it, quoted first."
                value={data.bid.repairThreshold}
                fallback={TERM_DEFAULTS.repairThreshold}
                onChange={(v) => update('bid', 'repairThreshold', v)}
              />
              <TermField
                id="ct-afterhours"
                label="After-hours multiplier (×)"
                hint="Applied to the standard visit rate for callouts you request."
                value={data.bid.afterHoursMultiplier}
                fallback={TERM_DEFAULTS.afterHoursMultiplier}
                onChange={(v) => update('bid', 'afterHoursMultiplier', v)}
              />
              <TermField
                id="ct-term"
                label="Initial term (months)"
                value={data.bid.termMonths}
                fallback={TERM_DEFAULTS.termMonths}
                onChange={(v) => update('bid', 'termMonths', v)}
              />
              <TermField
                id="ct-notice"
                label="Notice to cancel (days)"
                value={data.bid.noticeDays}
                fallback={TERM_DEFAULTS.noticeDays}
                onChange={(v) => update('bid', 'noticeDays', v)}
              />
              <TermField
                id="ct-escalator"
                label="Annual escalator cap (%)"
                hint="Silence here means absorbing three years of cost."
                value={data.bid.escalatorPct}
                fallback={TERM_DEFAULTS.escalatorPct}
                onChange={(v) => update('bid', 'escalatorPct', v)}
              />
              <TermField
                id="ct-chem"
                label="Chemical adjustment band (%)"
                hint="Chemicals are included; this is the move that lets you revisit."
                value={data.bid.chemicalBandPct}
                fallback={TERM_DEFAULTS.chemicalBandPct}
                onChange={(v) => update('bid', 'chemicalBandPct', v)}
              />
              <TermField
                id="ct-payment"
                label="Payment terms"
                value={data.bid.paymentTerms}
                fallback={TERM_DEFAULTS.paymentTerms}
                onChange={(v) => update('bid', 'paymentTerms', v)}
              />
              <TermField
                id="ct-valid"
                label="Bid valid for (days)"
                value={data.bid.bidValidDays}
                fallback={TERM_DEFAULTS.bidValidDays}
                onChange={(v) => update('bid', 'bidValidDays', v)}
              />
            </div>
            <p className="text-xs leading-relaxed text-gray-500">
              Leave any of these blank to use the value shown in grey.
            </p>
          </Section>

          {/* ---------------- Covering email ---------------- */}
          <Section title="Covering email">
            <FieldShell id="cb-emailnote" label="Personal note — email only, not on the PDF" multiline>
              <textarea
                id="cb-emailnote"
                rows={4}
                className={textareaClass}
                placeholder=" "
                value={data.bid.emailNote}
                onChange={(e) => update('bid', 'emailNote', e.target.value)}
              />
            </FieldShell>
            <p className="-mt-2 text-xs leading-relaxed text-gray-500">
              Written to be forwarded. A commercial covering note lands in front of a board, not one
              person, so keep it to what happens next.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

const Total = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
  <div>
    <div className={`text-xs ${muted ? 'text-gray-500' : 'text-gray-400'}`}>{label}</div>
    <div
      className={`font-display text-lg font-bold tabular-nums ${
        muted ? 'text-gray-400' : 'text-white'
      }`}
    >
      {value}
    </div>
  </div>
);

/** A terms field whose default is its placeholder, so an untouched field keeps
 *  tracking the preset rather than freezing today's value into the draft. */
const TermField = ({
  id,
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  fallback: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <FieldShell id={id} label={label}>
      <input
        id={id}
        className={fieldClass}
        placeholder={fallback}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
    {hint && <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{hint}</p>}
  </div>
);
