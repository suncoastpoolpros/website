import React, { useState } from 'react';
import { AlertCircle, Check, CheckCircle, Send, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/Container';
import { FieldShell, fieldClass, selectClass } from '@/components/FormField';
import { sendContact } from '@/lib/contactSubmit';
import { trackEvent } from '@/lib/analytics';
import { useTurnstile } from '@/lib/turnstile';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';

/**
 * The on-page quote form for a /services/ page.
 *
 * WHY THIS EXISTS (the SEO reason, not just the UX one):
 * every conversion path on the service pages used to live inside the QuoteSheet
 * popup, which is mount-on-open — so the prerendered HTML a crawler reads
 * contained zero <form>, <input> or <select>. Those pages therefore looked like
 * articles about a service rather than landing pages FOR a service. This
 * component ships a real, static, server-rendered form into the markup so the
 * transactional intent is visible without executing any JS.
 *
 * It is deliberately prop-driven rather than a fixed block. Google discounts
 * near-duplicate boilerplate repeated across a site, and a visitor who lands on
 * two service pages should not see the same paragraph twice — so every page
 * supplies its own eyebrow, heading, copy, proof points, layout, accent and
 * (most importantly) its own QUALIFYING FIELDS. The green page asks how long
 * the pool has been green; the storm page asks what is in the water. Those
 * differences are what make each section genuinely page-specific instead of a
 * copy-paste.
 *
 * Constraints this file respects (see CLAUDE.md):
 *  - No Framer Motion. This is on a prerendered path, and an entrance animation
 *    would bake `style="opacity:0;transform:..."` into the static HTML, then
 *    re-serialize differently on the client → React #418 → full re-render. The
 *    homepage QuoteForm has to pass `initial={false}` for exactly this reason;
 *    here we skip the dependency entirely.
 *  - No inline style COLORS. The only inline styles are the off-screen
 *    positioning on the honeypot + Turnstile mount (no colors, so nothing for
 *    the browser to re-serialize).
 *  - Accent classes are looked up from a literal map, never interpolated —
 *    Tailwind's JIT scanner can only see class names that appear verbatim.
 */

/** A page-specific qualifying question rendered above the contact fields. */
export type QuoteFormField = {
  /** Field name — also the key in the lead email, so use camelCase. */
  id: string;
  label: string;
  type: 'select' | 'text';
  /** Required for `type: 'select'`. */
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
};

export type ServiceQuoteFormProps = {
  /** Anchor id. Defaults to `quote` so existing `#quote` links land here. */
  id?: string;
  eyebrow: string;
  heading: React.ReactNode;
  intro: React.ReactNode;
  /** Short proof points listed under the intro. */
  points?: string[];
  /**
   * `form-right` mirrors the homepage (copy left, form right). `form-left`
   * flips it. `centered` stacks a centered header over a wide two-column card.
   * Varying this stops three service pages from rendering the same silhouette.
   */
  layout?: 'form-right' | 'form-left' | 'centered';
  accent?: 'blue' | 'orange';
  /**
   * Locks the form to one service. The page IS the service, so the visitor
   * should not have to restate it — it ships as a hidden input plus a small
   * confirmation chip. Omit on the hub, where choosing is the actual question.
   */
  service?: { value: string; label: string };
  /** Options for the service <select> when `service` is not locked. */
  serviceOptions?: Array<{ value: string; label: string }>;
  /** Label above the service <select>. */
  serviceLabel?: string;
  /** Page-specific qualifying questions, rendered above Name. */
  extraFields?: QuoteFormField[];
  /** Tags the lead email and the `generate_lead` analytics event. */
  source: string;
  submitLabel: string;
  successTitle: string;
  successBody: string;
  /** Small print under the submit button. */
  footnote?: React.ReactNode;
};

// Full literal class strings — see the Tailwind note in the header comment.
const ACCENT = {
  blue: {
    eyebrow: 'text-brand-blue-light',
    glow: 'bg-brand-blue/20',
    tick: 'text-brand-blue-light',
    chip: 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue-light',
    link: 'text-brand-blue-light hover:text-white',
    button:
      'bg-gradient-to-r from-brand-blue to-brand-blue-dark hover:from-brand-blue-light hover:to-brand-blue shadow-lg shadow-brand-blue/20',
  },
  orange: {
    eyebrow: 'text-brand-orange',
    glow: 'bg-brand-orange/20',
    tick: 'text-brand-orange',
    chip: 'border-brand-orange/30 bg-brand-orange/10 text-brand-orange-light',
    link: 'text-brand-orange hover:text-white',
    button:
      'bg-gradient-to-r from-brand-orange to-brand-orange-dark hover:from-brand-orange-light hover:to-brand-orange shadow-lg shadow-brand-orange/20',
  },
} as const;

// Shared off-screen positioning for the honeypot and the Turnstile mount.
// Position/size only — no colors, so SSR and client serialize identically.
const OFFSCREEN: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  width: 1,
  height: 1,
};

export const ServiceQuoteForm = ({
  id = 'quote',
  eyebrow,
  heading,
  intro,
  points,
  layout = 'form-right',
  accent = 'blue',
  service,
  serviceOptions,
  serviceLabel = 'What do you need?',
  extraFields = [],
  source,
  submitLabel,
  successTitle,
  successBody,
  footnote,
}: ServiceQuoteFormProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstile = useTurnstile();
  const a = ACCENT[accent];
  const isCentered = layout === 'centered';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(e.currentTarget);
    // Honeypot — invisible to humans, irresistible to bot field-fillers.
    // Fake success so the bot learns nothing from an error.
    if (String(data.get('website') ?? '').trim()) {
      setSubmitted(true);
      setLoading(false);
      return;
    }

    // Collect every field generically so a page can add a qualifying question
    // without this component (or functions/api/contact.ts, which renders
    // unknown keys as extra email rows) needing to know about it.
    const payload: Record<string, unknown> = {};
    data.forEach((value, key) => {
      if (key === 'website') return;
      const s = String(value).trim();
      if (s) payload[key] = s;
    });

    try {
      // Run Turnstile right before submit so the token is fresh. Resolves to
      // '' when unconfigured (local dev); the Function accepts that.
      const turnstileToken = await turnstile.execute().catch(() => '');
      await sendContact({
        ...payload,
        source,
        submittedAt: new Date().toISOString(),
        turnstileToken,
      });
      setSubmitted(true);
      trackEvent('generate_lead', { source });
    } catch (err) {
      setError(
        `We couldn't submit your request. Please try again, or call us at ${PHONE_DISPLAY}.`
      );
      console.error('Service quote form submit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section id={id} className="relative py-16 md:py-24 scroll-mt-24">
        <Container className="max-w-3xl">
          <div className="glass-panel p-8 md:p-12 text-center rounded-[2.5rem]">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
              {successTitle}
            </h2>
            <p className="text-gray-300 text-base md:text-lg">{successBody}</p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className={`mt-8 font-semibold transition-colors ${a.link}`}
            >
              Send another request
            </button>
          </div>
        </Container>
      </section>
    );
  }

  // ── Field cells ──────────────────────────────────────────────
  // One list, two layouts. `full` decides whether a cell spans both grid
  // columns, and it differs by layout: the split layouts sit in a narrower
  // column so only phone/zip pair up, while the wider centered card pairs all
  // four contact fields (name+phone, zip+email) under the full-width questions.
  type Cell = { key: string; node: React.ReactNode; splitFull: boolean; centerFull: boolean };
  const cells: Cell[] = [];

  if (!service) {
    cells.push({
      key: 'service',
      splitFull: true,
      centerFull: true,
      node: (
        <FieldShell id={`${id}-service`} label={serviceLabel} floated>
          <select
            id={`${id}-service`}
            name="service"
            required
            defaultValue=""
            className={selectClass}
          >
            <option value="" disabled></option>
            {(serviceOptions ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldShell>
      ),
    });
  }

  for (const f of extraFields) {
    cells.push({
      // Qualifying questions span the full width in BOTH layouts. Their labels
      // are full sentences ("How much of the bottom can you see?") which crowd
      // a half-column, and keeping them full also leaves exactly four contact
      // fields below — two clean pairs, with no field left dangling alone on a
      // final row.
      key: f.id,
      splitFull: true,
      centerFull: true,
      node:
        f.type === 'select' ? (
          <FieldShell id={`${id}-${f.id}`} label={f.label} floated>
            <select
              id={`${id}-${f.id}`}
              name={f.id}
              required={f.required}
              defaultValue=""
              className={selectClass}
            >
              <option value="" disabled></option>
              {(f.options ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldShell>
        ) : (
          <FieldShell id={`${id}-${f.id}`} label={f.label}>
            <input
              type="text"
              id={`${id}-${f.id}`}
              name={f.id}
              required={f.required}
              className={fieldClass}
              placeholder=" "
            />
          </FieldShell>
        ),
    });
  }

  cells.push(
    {
      key: 'name',
      splitFull: true,
      centerFull: false,
      node: (
        <FieldShell id={`${id}-name`} label="Full Name">
          <input
            type="text"
            id={`${id}-name`}
            name="name"
            required
            autoComplete="name"
            className={fieldClass}
            placeholder=" "
          />
        </FieldShell>
      ),
    },
    {
      key: 'phone',
      splitFull: false,
      centerFull: false,
      node: (
        <FieldShell id={`${id}-phone`} label="Phone">
          <input
            type="tel"
            id={`${id}-phone`}
            name="phone"
            required
            autoComplete="tel"
            className={fieldClass}
            placeholder=" "
          />
        </FieldShell>
      ),
    },
    {
      key: 'zip',
      splitFull: false,
      centerFull: false,
      node: (
        <FieldShell id={`${id}-zip`} label="Zip Code">
          <input
            type="text"
            id={`${id}-zip`}
            name="zip"
            required
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            autoComplete="postal-code"
            className={fieldClass}
            placeholder=" "
          />
        </FieldShell>
      ),
    },
    {
      key: 'email',
      splitFull: true,
      centerFull: false,
      node: (
        <FieldShell id={`${id}-email`} label="Email">
          <input
            type="email"
            id={`${id}-email`}
            name="email"
            autoComplete="email"
            className={fieldClass}
            placeholder=" "
          />
        </FieldShell>
      ),
    }
  );

  const copyBlock = (
    <div>
      <span
        className={`block mb-3 text-xs font-bold uppercase tracking-[0.2em] ${a.eyebrow}`}
      >
        {eyebrow}
      </span>
      <h2 className="section-heading text-white leading-tight mb-5">{heading}</h2>
      <div className="section-subtext mb-6">{intro}</div>

      {points && points.length > 0 && (
        <ul
          className={`space-y-2.5 mb-7 ${isCentered ? 'inline-block text-left' : ''}`}
        >
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-gray-300 text-[15px]">
              <Check className={`w-[18px] h-[18px] mt-0.5 shrink-0 ${a.tick}`} strokeWidth={2.4} />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-gray-400">
        Prefer to talk?{' '}
        <a href={PHONE_HREF} className={`font-semibold transition-colors ${a.link}`}>
          Call or text {PHONE_DISPLAY}
        </a>
        .
      </p>
    </div>
  );

  const card = (
    <div className="glass-panel p-6 sm:p-8 lg:p-10 rounded-3xl relative">
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none ${a.glow}`}
      />

      <form onSubmit={handleSubmit} className="relative z-10">
        {/* Honeypot — hidden from humans (off-screen + aria-hidden + tabIndex),
            but bot field-fillers populate it. Values here are dropped. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={OFFSCREEN}
        />
        {/* Invisible Turnstile widget. Mounted off-screen so its iframe never
            occupies layout; the script only loads on first submit. */}
        <div ref={turnstile.containerRef} aria-hidden="true" style={OFFSCREEN} />

        {/* Locked service — the page already declared it, so it travels as a
            hidden value and is merely confirmed on screen. */}
        {service && (
          <>
            <input type="hidden" name="service" value={service.value} />
            <p
              className={`mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${a.chip}`}
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
              {service.label}
            </p>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {cells.map((c) => {
            const full = isCentered ? c.centerFull : c.splitFull;
            return (
              <div key={c.key} className={full ? 'sm:col-span-2' : ''}>
                {c.node}
              </div>
            );
          })}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`mt-6 w-full py-5 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group ${a.button}`}
        >
          {loading ? (
            <span className="animate-pulse">Sending&hellip;</span>
          ) : (
            <>
              {submitLabel}{' '}
              <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          {footnote ?? 'We respond promptly. No spam. No obligation.'}
        </p>
      </form>
    </div>
  );

  return (
    <section id={id} className="relative py-16 md:py-24 lg:py-28 scroll-mt-24">
      <Container>
        {isCentered ? (
          <>
            <div className="max-w-2xl mx-auto text-center mb-10 md:mb-12">{copyBlock}</div>
            <div className="max-w-3xl mx-auto">{card}</div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className={layout === 'form-left' ? 'lg:order-2' : ''}>{copyBlock}</div>
            <div className={layout === 'form-left' ? 'lg:order-1' : ''}>{card}</div>
          </div>
        )}
      </Container>
    </section>
  );
};
