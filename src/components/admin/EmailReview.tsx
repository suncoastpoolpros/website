/**
 * The last screen before a proposal is emailed: the covering message exactly as
 * the customer will receive it, with a way to fix the two lines that aren't a
 * field anywhere else.
 *
 * WHY A STEP AT ALL, when everything here was already visible in the builder:
 * because the email is the one artefact the builder never showed. The live
 * preview on the right is the PDF. Pressing Send meant posting a message you
 * had not read to someone you were trying to win, and the parts most likely to
 * be wrong — the greeting, the subject — were exactly the parts that no field
 * on the form controlled.
 *
 * THE HTML IS RENDERED BY THE SENDER, not rebuilt here. A preview assembled
 * from the client's own copy of the template is a preview of an email nobody
 * receives; the moment the two drift, this screen starts lying in the most
 * expensive possible way. So it comes back from /api/admin/preview-proposal,
 * which calls the same composer the send does.
 *
 * Edits re-render through that endpoint too, rather than being patched into the
 * returned HTML here — same reason.
 */
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, LoaderCircle, RotateCcw, Send, X } from 'lucide-react';
import type { EmailOverrides, ProposalPreview } from '@/lib/adminApi';

/** Long enough that ordinary typing doesn't fire a request per keystroke,
 *  short enough that the rendered email keeps up with a correction. */
const RERENDER_DEBOUNCE_MS = 450;

/**
 * The email's own table is 600px wide and does not reflow — it's built for mail
 * clients, not for a phone-sized iframe — so a narrow frame simply cuts the
 * right-hand side off, and the first casualty is the button. The frame is
 * therefore laid out at a fixed size and scaled down to whatever room it has,
 * which shows the whole email at every width instead of a readable fragment of
 * it. Above ~640px the scale is 1 and nothing happens.
 */
const FRAME_W = 640;
const FRAME_H = 560;

const inputClass =
  'h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-[15px] text-white placeholder-gray-600 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/50';

export type EmailReviewProps = {
  preview: ProposalPreview;
  /** Live values of the two editable lines. Blank = fall back to the default. */
  overrides: EmailOverrides;
  onOverridesChange: (next: EmailOverrides) => void;
  /** True while a re-render is in flight, so the frame can say it's catching up. */
  refreshing: boolean;
  /** Fired after the debounce, with the values to re-render from. */
  onRequestRerender: (next: EmailOverrides) => void;
  toEmail: string;
  attachmentName: string;
  sending: boolean;
  error: string;
  onSend: () => void;
  onCancel: () => void;
};

export const EmailReview = ({
  preview,
  overrides,
  onOverridesChange,
  refreshing,
  onRequestRerender,
  toEmail,
  attachmentName,
  sending,
  error,
  onSend,
  onCancel,
}: EmailReviewProps) => {
  const [showText, setShowText] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const frameWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = frameWrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / FRAME_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Escape closes, but never mid-send: the request is already out and the
  // screen behind this one has no way to show what happened to it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, sending]);

  // Move focus into the dialog so the keyboard isn't left on the page behind it.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const rerenderTimer = useRef<number | undefined>(undefined);
  const edit = (field: keyof EmailOverrides, value: string) => {
    const next = { ...overrides, [field]: value };
    onOverridesChange(next);
    window.clearTimeout(rerenderTimer.current);
    rerenderTimer.current = window.setTimeout(() => onRequestRerender(next), RERENDER_DEBOUNCE_MS);
  };
  useEffect(() => () => window.clearTimeout(rerenderTimer.current), []);

  // "Use the default" is only offered once there's something to undo, and it
  // clears the override rather than typing the default back in — so a later
  // change to the customer's name still flows through to the greeting.
  const reset = (field: keyof EmailOverrides) => {
    const next = { ...overrides, [field]: '' };
    onOverridesChange(next);
    window.clearTimeout(rerenderTimer.current);
    onRequestRerender(next);
  };

  const subjectValue = overrides.subject ?? '';
  const greetingValue = overrides.greeting ?? '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Review the email before sending"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sending) onCancel();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0d1826] shadow-2xl outline-none sm:rounded-2xl"
      >
        {/* ---- header ---- */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Review the email</h2>
            <p className="mt-0.5 text-sm text-gray-400">
              This is what lands in their inbox. Nothing has been sent yet.
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={sending}
            aria-label="Back to editing"
            className="-mr-1 -mt-1 rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ---- scrolling body ---- */}
        <div className="admin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <dl className="mb-4 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-gray-500">To</dt>
            <dd className="truncate text-gray-200">{toEmail}</dd>
            <dt className="text-gray-500">Attached</dt>
            <dd className="truncate text-gray-200">{attachmentName}</dd>
          </dl>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6">
            <Field
              id="er-subject"
              label="Subject"
              value={subjectValue}
              placeholder={preview.subject}
              onChange={(v) => edit('subject', v)}
              onReset={() => reset('subject')}
            />
            <Field
              id="er-greeting"
              label="Greeting"
              value={greetingValue}
              placeholder={preview.defaultGreeting}
              onChange={(v) => edit('greeting', v)}
              onReset={() => reset('greeting')}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Leave either blank to use the wording shown in grey. To change the note or the
            prices, go back — they&apos;re fields on the form.
          </p>

          {/* The email itself. sandbox="" with no allow-* tokens: no scripts, no
              forms, and — the one that matters here — no navigation, so the
              accept button in a preview can't be followed to a link that
              doesn't exist yet. */}
          <div
            ref={frameWrapRef}
            className="relative mx-auto mt-4 max-w-[640px] overflow-hidden rounded-xl border border-white/10 bg-[#f2f4f7]"
            style={{ height: FRAME_H * scale }}
          >
            <iframe
              title="Proposal email preview"
              srcDoc={preview.html}
              sandbox=""
              style={{
                width: FRAME_W,
                height: FRAME_H,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            />
            {refreshing && (
              <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Updating
              </div>
            )}
          </div>

          <button
            onClick={() => setShowText((v) => !v)}
            className="mt-3 text-xs font-semibold text-gray-400 underline underline-offset-4 hover:text-gray-200"
          >
            {showText ? 'Hide' : 'Show'} the plain-text version
          </button>
          {showText && (
            <pre className="admin-scroll mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-gray-300">
              {preview.text}
            </pre>
          )}
        </div>

        {/* ---- footer ---- */}
        <div className="shrink-0 border-t border-white/10 px-5 py-4">
          {error && (
            <div
              role="alert"
              className="mb-3 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {/* Deliberately NOT disabled while sending: the PDF upload is the
                slow part and on a phone it can be megabytes, so there has to be
                a way out. It's the only way out during a send, though — the
                backdrop, Escape and the X are all locked, because losing an
                in-flight send to a stray tap is the worse mistake. */}
            <button
              onClick={onCancel}
              className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-white/5 sm:py-2.5"
            >
              {sending ? 'Cancel sending' : 'Back to editing'}
            </button>
            <button
              onClick={onSend}
              disabled={sending}
              className="flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-blue-dark px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-blue/20 transition-all hover:from-brand-blue-light hover:to-brand-blue disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5"
            >
              {sending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Building the PDF &amp; sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send it
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** One editable line, with the computed wording as its placeholder. The default
 *  is shown rather than pre-filled so an untouched field keeps tracking the
 *  form: type a name into Customer and the greeting follows it. */
const Field = ({
  id,
  label,
  value,
  placeholder,
  onChange,
  onReset,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onReset: () => void;
}) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      {value.trim() ? (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white"
        >
          <RotateCcw className="h-3 w-3" /> Use the default
        </button>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
          <Check className="h-3 w-3" /> Default
        </span>
      )}
    </div>
    <input
      id={id}
      className={inputClass}
      value={value}
      placeholder={placeholder}
      autoComplete="off"
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
