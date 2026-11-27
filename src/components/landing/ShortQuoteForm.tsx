import React from 'react';
import { AlertCircle, Check, Send } from 'lucide-react';
import { useQuoteFormSubmit } from '@/components/ServiceQuoteForm';

/*
 * The location pages' two-field quote form (Belleair Beach, Gulfport): name
 * and phone, nothing else. It submits exactly as every on-page form does
 * (useQuoteFormSubmit): the `website` honeypot, a fresh Turnstile token, the
 * hidden `service`, and `source`, which tags the lead email and the
 * generate_lead event with the page it came from. functions/api/contact.ts
 * requires no field beyond those, so name + phone is a complete lead.
 *
 * Only the form: the page draws the white card around it and its heading.
 * 16px text in the fields, so iOS doesn't zoom on focus.
 */

// Off-screen, position and size only (no colours, so SSR and the client
// serialize it identically; CLAUDE.md #4).
const OFFSCREEN: React.CSSProperties = { position: 'absolute', left: '-9999px', width: 1, height: 1 };

const labelClass = 'mb-1.5 block text-[13px] font-semibold text-sc-navy/[0.78]';
const fieldBase =
  'block w-full rounded-[10px] border border-[rgba(36,58,85,0.22)] bg-white px-4 text-[16px] text-sc-navy transition placeholder:text-sc-navy/40 focus:border-[#1f7fdb] focus:outline-none focus:ring-[3px] focus:ring-[#1f7fdb]/20';

export const ShortQuoteForm = ({
  idPrefix,
  source,
  submitLabel,
  nameLabel = 'Full Name',
  fieldHeight = 'h-14',
  buttonHeight = 'h-14',
  footnote,
  successTitle,
  successBody,
}: {
  idPrefix: string;
  /** Tags the lead email and the analytics event, e.g. "gulfport-quote-form". */
  source: string;
  submitLabel: string;
  nameLabel?: string;
  /** Height classes for the two fields and the button. */
  fieldHeight?: string;
  buttonHeight?: string;
  footnote?: React.ReactNode;
  successTitle: string;
  successBody: string;
}) => {
  const { submitted, setSubmitted, loading, error, turnstile, handleSubmit } = useQuoteFormSubmit(source, {
    location: 'quote section',
  });

  if (submitted) {
    return (
      <div role="status" className="py-2 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white">
          <Check aria-hidden="true" className="h-6 w-6" strokeWidth={3} />
        </span>
        <p className="mt-4 text-[19px] font-semibold tracking-[-0.02em] text-sc-navy">{successTitle}</p>
        <p className="mt-2 text-[15.5px] leading-[1.6] text-sc-navy/[0.78]">{successBody}</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-5 text-[14px] font-semibold text-sc-blue underline decoration-current/30 underline-offset-[3px] hover:decoration-current"
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={OFFSCREEN} />
      <div ref={turnstile.containerRef} aria-hidden="true" style={OFFSCREEN} />
      <input type="hidden" name="service" value="weekly" />

      <label htmlFor={`${idPrefix}-name`} className={labelClass}>
        {nameLabel}
      </label>
      <input
        id={`${idPrefix}-name`}
        name="name"
        type="text"
        required
        autoComplete="name"
        className={`${fieldBase} ${fieldHeight}`}
      />

      <label htmlFor={`${idPrefix}-phone`} className={`${labelClass} mt-4`}>
        Phone
      </label>
      <input
        id={`${idPrefix}-phone`}
        name="phone"
        type="tel"
        required
        autoComplete="tel"
        inputMode="tel"
        className={`${fieldBase} ${fieldHeight}`}
      />

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-[14px] leading-[1.5] text-red-700">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#f7b500] text-[16px] font-semibold text-[#1c2f47] shadow-[0_1px_2px_rgba(16,24,40,0.14)] transition-colors hover:bg-[#ffc01f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 ${buttonHeight}`}
      >
        {loading ? (
          'Sending…'
        ) : (
          <>
            {submitLabel}
            <Send aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </>
        )}
      </button>

      {footnote && <p className="mt-4 text-center text-[13px] leading-[1.5] text-sc-navy/60">{footnote}</p>}
      <p className="mt-2 text-center text-[11.5px] leading-[1.5] text-sc-navy/55">
        By submitting, you agree to get texts about your request from Suncoast Pool Pros. Msg &amp; data rates may
        apply. Reply STOP to opt out.
      </p>
    </form>
  );
};
