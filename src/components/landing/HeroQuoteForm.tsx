import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Loader2, Lock, Mail, MapPin, MessageSquare } from 'lucide-react';
import { sendContact } from '@/lib/contactSubmit';
import { trackEvent } from '@/lib/analytics';
import { useTurnstile } from '@/lib/turnstile';
import { PHONE_DISPLAY, SMS_QUOTE_HREF } from '@/lib/contact';
import { AddressAutocomplete } from '@/components/landing/AddressAutocomplete';

const SOURCE = 'landing-page-quote-form';

const POOL_TYPES = ['Chlorine', 'Saltwater', 'Not sure'];

type ContactPreference = 'text' | 'email';

// Header CTA: bring the visitor to the form and put the cursor in it.
export const focusQuoteForm = () => {
  const box = document.getElementById('get-price');
  if (!box) return;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  box.querySelector('input')?.focus({ preventScroll: true });
};

// The logo's sun, as the one warm color on the page: reserved for the action.
// `group` lets the arrow inside nudge right on hover.
export const amberButton =
  'group inline-flex items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#ffbf2f,#ffa90a)] font-semibold text-[#1f3149] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_1px_2px_rgba(180,110,0,0.25),0_6px_14px_-6px_rgba(230,140,0,0.55)] transition hover:brightness-[1.03] active:translate-y-px disabled:cursor-wait disabled:opacity-70';

const ButtonArrow = () => (
  <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-[3px]" strokeWidth={2.5} />
);

const raisedShadow =
  'shadow-[0_0_0_1px_rgba(36,58,85,0.14),0_1px_2px_rgba(16,24,40,0.05),0_12px_32px_-14px_rgba(36,58,85,0.28)]';

const cardClass = `rounded-[14px] bg-white p-6 ${raisedShadow}`;

const fieldLabel = 'mb-1.5 block text-[13.5px] font-semibold text-sc-navy';

const inputClass =
  'h-12 w-full rounded-[10px] bg-white px-4 text-base text-sc-navy ring-1 ring-sc-navy/[0.18] placeholder:text-sc-navy/40 transition focus:outline-none focus:ring-2 focus:ring-sc-blue/50';

// A radio styled as one segment of a segmented control.
const segment =
  'flex w-full items-center justify-center gap-2 rounded-[10px] bg-white text-[15px] font-medium text-sc-navy ring-1 ring-sc-navy/[0.18] transition peer-checked:bg-[#eef5fb] peer-checked:ring-2 peer-checked:ring-sc-blue peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sc-blue/50';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// After a step change, bring the new card on screen if it isn't fully there.
// Its TOP goes just under the header rather than the card being centered: the
// card can be taller than a phone screen, and centering would cut off its top.
const revealCard = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  if (rect.top >= 0 && rect.bottom <= window.innerHeight) return;
  const header = document.querySelector('header')?.getBoundingClientRect().height ?? 72;
  window.scrollTo({
    top: window.scrollY + rect.top - header - 16,
    behavior: reducedMotion() ? 'auto' : 'smooth',
  });
};

/**
 * Two steps on purpose. Step one asks for a single thing (the pool's address)
 * right in the hero, so starting costs one field instead of a whole form;
 * someone who has started is far more likely to finish. Step two then asks
 * where to send the price. Nothing is sent until step two is submitted.
 */
export const HeroQuoteForm = () => {
  const [step, setStep] = useState<'address' | 'details' | 'done'>('address');
  const [address, setAddress] = useState('');
  const [firstName, setFirstName] = useState('');
  const [contactPreference, setContactPreference] = useState<ContactPreference>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstile = useTurnstile();
  const detailsRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 'details' && detailsRef.current) {
      revealCard(detailsRef.current);
      // Desktop only: on a phone, focusing would raise the keyboard over the card.
      if (window.matchMedia('(pointer: fine)').matches) {
        detailsRef.current.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true });
      }
    }
    if (step === 'done' && doneRef.current) revealCard(doneRef.current);
  }, [step]);

  const handleStart = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get('address') ?? '').trim();
    if (!value) return;
    setAddress(value);
    setStep('details');
    trackEvent('quote_start', { source: SOURCE });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(e.currentTarget);
    // Honeypot: humans never see it. Fake success so a bot learns nothing.
    if (String(data.get('website') ?? '').trim()) {
      setStep('done');
      setLoading(false);
      return;
    }

    // contactPreference rides along as a form field; the email input only
    // exists while Email is chosen, so `email` is sent only then.
    const payload: Record<string, unknown> = { address };
    data.forEach((value, key) => {
      if (key === 'website') return;
      const s = String(value).trim();
      if (s) payload[key] = s;
    });

    try {
      const turnstileToken = await turnstile.execute().catch(() => '');
      await sendContact({
        ...payload,
        service: 'weekly',
        source: SOURCE,
        submittedAt: new Date().toISOString(),
        turnstileToken,
      });
      setFirstName(String(payload.name ?? '').split(/\s+/)[0] ?? '');
      setStep('done');
      trackEvent('generate_lead', { source: SOURCE });
    } catch (err) {
      setError(`We couldn't send that. Please try again, or call us at ${PHONE_DISPLAY}.`);
      console.error('Landing quote form submit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      {/* The invisible anti-bot widget mounts here; it must exist on every step. */}
      <div ref={turnstile.containerRef} aria-hidden="true" className="absolute -left-[9999px] h-px w-px" />

      {step === 'address' && (
        <form
          onSubmit={handleStart}
          className={`flex flex-col gap-2 rounded-[14px] bg-white p-2 ${raisedShadow} transition focus-within:ring-2 focus-within:ring-sc-blue/40 sm:flex-row sm:items-center`}
        >
          <AddressAutocomplete name="address" defaultValue={address} />
          <button type="submit" className={`${amberButton} h-12 px-6 text-base`}>
            Get my price
            <ButtonArrow />
          </button>
        </form>
      )}

      {step === 'details' && (
        <form ref={detailsRef} onSubmit={handleSubmit} className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-sc-navy/55">Step 2 of 2</p>
            <span aria-hidden="true" className="flex gap-1">
              <span className="h-1 w-7 rounded-full bg-sc-blue" />
              <span className="h-1 w-7 rounded-full bg-sc-blue" />
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-[10px] bg-[#f5f9fd] px-3.5 py-3 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-sc-navy/50" />
            <span className="min-w-0 flex-1 truncate font-medium text-sc-navy">{address}</span>
            <button
              type="button"
              onClick={() => setStep('address')}
              className="shrink-0 font-semibold text-sc-navy underline decoration-sc-navy/30 decoration-1 underline-offset-[3px] transition hover:decoration-sc-navy"
            >
              Change
            </button>
          </div>

          <p className="mt-6 text-[21px] font-bold tracking-[-0.01em] text-sc-navy">Where should we send your price?</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={fieldLabel}>Your name</span>
              <input name="name" type="text" required autoComplete="name" className={inputClass} />
            </label>
            <label className="block">
              <span className={fieldLabel}>Mobile phone</span>
              <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" className={inputClass} />
            </label>
          </div>

          <fieldset className="mt-4">
            <legend className={fieldLabel}>Send my price by</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 'text', label: 'Text', icon: MessageSquare },
                  { value: 'email', label: 'Email', icon: Mail },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="contactPreference"
                    value={value}
                    checked={contactPreference === value}
                    onChange={() => setContactPreference(value)}
                    className="peer sr-only"
                  />
                  <span className={`${segment} h-11`}>
                    <Icon className="h-4 w-4 text-sc-blue" strokeWidth={2.25} />
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {contactPreference === 'email' && (
            <label className="mt-4 block">
              <span className={fieldLabel}>Email</span>
              <input name="email" type="email" required autoComplete="email" className={inputClass} />
            </label>
          )}

          <fieldset className="mt-4">
            <legend className={fieldLabel}>Pool type (optional)</legend>
            <div className="grid grid-cols-3 gap-2">
              {POOL_TYPES.map((type) => (
                <label key={type} className="cursor-pointer">
                  <input type="radio" name="poolType" value={type} className="peer sr-only" />
                  <span className={`${segment} h-[42px] text-[14px]`}>{type}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-px w-px"
          />

          {error && (
            <p role="alert" className="mt-4 rounded-[10px] bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={`${amberButton} mt-6 h-[52px] w-full text-base`}>
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                Get my price
                <ButtonArrow />
              </>
            )}
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-sc-navy/55">
            By submitting, you agree to get texts about your request from Suncoast Pool Pros. Msg &amp; data
            rates may apply. Reply STOP to opt out.
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-sc-navy/65">
            <Lock className="h-3.5 w-3.5" />
            No spam, no obligation.
          </p>
        </form>
      )}

      {step === 'done' && (
        <div ref={doneRef} className={cardClass}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e7f6ee] text-[#13804b]">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <p className="mt-4 text-[22px] font-bold tracking-[-0.01em] text-sc-navy">
            {firstName ? `Thanks, ${firstName}. Check your phone.` : 'Thanks! Check your phone.'}
          </p>
          <p className="mt-1.5 text-[15.5px] leading-relaxed text-sc-navy/[0.78]">
            We'll text you in about 90 seconds to confirm we got your request.
          </p>

          <div className="mt-5 border-t border-sc-navy/10 pt-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-sc-navy/55">What happens next</p>
            <ol className="mt-3 space-y-3">
              <NextStep marker={<Check className="h-3.5 w-3.5" strokeWidth={3} />} done title="Confirmation text">
                Within about 90 seconds
              </NextStep>
              <NextStep marker="2" title="Your flat-rate price">
                By text or email, usually the same day (Mon–Sat)
              </NextStep>
              <NextStep marker="3" title="We set up your weekly service">
                No contracts
              </NextStep>
            </ol>
          </div>

          <p className="mt-5 text-[14.5px] text-sc-navy/70">
            Want it faster?{' '}
            <a
              href={SMS_QUOTE_HREF}
              className="font-semibold text-sc-navy underline decoration-sc-navy/30 decoration-1 underline-offset-[3px] transition hover:decoration-sc-navy"
            >
              Text us 2 photos
            </a>{' '}
            of your pool and equipment.
          </p>
        </div>
      )}
    </div>
  );
};

const NextStep = ({
  marker,
  done = false,
  title,
  children,
}: {
  marker: React.ReactNode;
  done?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <li className="flex items-start gap-3">
    <span
      className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[12.5px] font-semibold ${
        done ? 'bg-[#e7f6ee] text-[#13804b]' : 'bg-[#f5f9fd] text-sc-navy ring-1 ring-sc-navy/10'
      }`}
    >
      {marker}
    </span>
    <p className="pt-0.5 text-[14.5px] leading-snug text-sc-navy/70">
      <span className="font-semibold text-sc-navy">{title}</span>: {children}
    </p>
  </li>
);
