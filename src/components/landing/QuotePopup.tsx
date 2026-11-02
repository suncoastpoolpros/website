import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import { sendContact } from '@/lib/contactSubmit';
import { trackEvent } from '@/lib/analytics';
import { useTurnstile } from '@/lib/turnstile';
import { HOURS_SHORT, PHONE_DISPLAY, PHONE_E164, PHONE_HREF } from '@/lib/contact';
import { amberButton } from '@/components/landing/HeroQuoteForm';

/*
 * The homepage's quote popup (hosted by LandingQuoteSheet). The first screen
 * asks HOW the visitor wants their price: four one-tap questions, texting two
 * photos, or a call. Contact details come last, never first: someone who has
 * already tapped through a few answers is far more likely to finish.
 *
 * Desktop (≥901px): a two-column window, the current page's hero photo on the
 * left (a live summary of the answers once the questions start). Tablet
 * portrait and phones: one column, with the photo as a header on the first
 * screen only. Short screens (height ≤520px): one column, no photo. The
 * breakpoint rules live in index.css (.qs-*).
 *
 * Leads go through /api/contact like every other form (Turnstile, honeypot,
 * the generate_lead event); the endpoint lists unknown keys as email rows, so
 * Size/Type/Screen/Trees need no backend change.
 */
const LEAD_SOURCE = 'quote-popup';
// After a tap, hold the chosen state this long before moving on, so it reads.
const ADVANCE_MS = 220;
export const QUOTE_POPUP_FALLBACK_PHOTO = '/pool-waterfront-1120.webp';
const SMS_BODY = 'Hi! Here are photos of my pool and equipment, plus my address. Can I get a flat-rate quote?';

type Question = { key: string; label: string; title: string; sub: string; options: [string, string][] };

const QUESTIONS: Question[] = [
  {
    key: 'Size',
    label: 'Pool size',
    title: 'About how big is your pool?',
    sub: 'A rough guess is perfect.',
    options: [
      ['Small', 'About 12 × 24 ft'],
      ['Medium', 'About 15 × 30 ft'],
      ['Large', 'About 20 × 40 ft'],
      ['Not sure', 'We’ll check satellite view'],
    ],
  },
  {
    key: 'Type',
    label: 'Water',
    title: 'Saltwater or chlorine?',
    sub: 'Either is fine. It just changes what we bring.',
    options: [
      ['Saltwater', 'Has a salt cell'],
      ['Chlorine', 'Tabs or liquid'],
      ['Not sure', 'We’ll check on the first visit'],
    ],
  },
  {
    key: 'Screen',
    label: 'Screen',
    title: 'Is it screened in?',
    sub: 'Screen enclosures keep most debris out.',
    options: [
      ['Screened', 'Pool cage or lanai'],
      ['Open', 'Open to the yard'],
    ],
  },
  {
    key: 'Trees',
    label: 'Trees',
    title: 'How many trees are nearby?',
    sub: 'More leaves means a little more time each visit.',
    options: [
      ['Few or none', 'Light debris'],
      ['Some', 'A few trees close by'],
      ['A lot', 'Heavy leaves and debris'],
    ],
  },
];

const CALL_TIMES: [string, string, string][] = [
  // value, option label, how the thank-you reads it ("We'll call you …")
  ['asap', 'As soon as possible', 'as soon as possible'],
  ['morning', 'Morning (8–12)', 'in the morning, between 8 and 12'],
  ['afternoon', 'Afternoon (12–4)', 'in the afternoon, between 12 and 4'],
  ['late', 'Late afternoon (4–6)', 'in the late afternoon, between 4 and 6'],
];

export type QuoteScreen = 'choose' | 'question' | 'contact' | 'text' | 'call' | 'done';
type SendBy = 'text' | 'email';
type Fields = { name: string; phone: string; email: string; address: string };
type Errors = Partial<Record<string, string>>;

/** Mon–Sat, 8 AM–6 PM in St. Petersburg (America/New_York), right now. */
export const isOpenNow = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const day = parts.find((p) => p.type === 'weekday')?.value;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  return day !== 'Sun' && hour >= 8 && hour < 18;
};

/**
 * The page's hero photo, for the popup's left column: an element marked
 * `data-quote-image`, else the largest loaded <img> at least 600px wide in the
 * top 1.5 screens, else the homepage's waterfront pool. Call it BEFORE the
 * scroll lock pins the body, so page positions are still true.
 */
export const findHeroPhoto = (): string => {
  const tagged = document.querySelector<HTMLElement>('[data-quote-image]');
  if (tagged) {
    const attr = tagged.getAttribute('data-quote-image');
    if (attr) return attr;
    if (tagged instanceof HTMLImageElement && (tagged.currentSrc || tagged.src)) return tagged.currentSrc || tagged.src;
    const bg = getComputedStyle(tagged).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    if (bg) return bg[1];
  }
  const limit = window.innerHeight * 1.5;
  let best = '';
  let bestArea = 0;
  for (const img of Array.from(document.images)) {
    if (!img.complete || !img.naturalWidth || img.closest('[data-quote-sheet]')) continue;
    const r = img.getBoundingClientRect();
    // A srcset image reports a naturalWidth scaled to its `sizes` slot, so its
    // drawn width counts too.
    if (Math.max(img.naturalWidth, r.width) < 600 || r.top + window.scrollY > limit) continue;
    const area = r.width * r.height;
    if (area > bestArea) {
      bestArea = area;
      best = img.currentSrc || img.src;
    }
  }
  return best || QUOTE_POPUP_FALLBACK_PHOTO;
};

const smsHref = () => {
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return `sms:${PHONE_E164}${ios ? '&' : '?'}body=${encodeURIComponent(SMS_BODY)}`;
};

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue';
const goldButton = `${amberButton} h-[52px] w-full px-6 text-[16px] ${focusRing}`;
const hairline = 'border border-[rgba(36,58,85,0.12)]';
const inputBase =
  'block w-full rounded-[10px] border bg-white px-[14px] py-3 text-[16px] text-sc-navy placeholder:text-sc-navy/35 outline-none transition-[border-color,box-shadow] min-[761px]:text-[15.5px]';
const inputCls = (bad: boolean) =>
  `${inputBase} ${
    bad
      ? 'border-[#d64545] shadow-[0_0_0_4px_rgba(214,69,69,0.12)]'
      : 'border-[rgba(36,58,85,0.2)] focus:border-sc-blue focus:shadow-[0_0_0_4px_rgba(38,118,182,0.12)]'
  }`;
const labelCls = 'mb-1 flex items-baseline justify-between gap-3 text-[13.5px] font-semibold text-sc-navy';
const h2Cls = 'qs-h2 text-balance text-[26px] font-[650] leading-[1.15] tracking-[-0.028em] text-sc-navy min-[761px]:text-[30px]';
const subCls = 'qs-sub mt-2 text-pretty text-[15px] leading-[1.55] text-sc-muted';

const ButtonArrow = () => (
  <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-[3px]" strokeWidth={2.5} />
);

const Stars = ({ className = '' }: { className?: string }) => (
  <span aria-hidden="true" className={`tracking-[-0.02em] text-sc-gold ${className}`}>
    ★★★★★
  </span>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="flex items-center gap-2.5 text-[12px] font-semibold text-sc-blue before:h-px before:w-4 before:bg-current">{children}</p>
);

export const QuotePopup = ({
  active,
  photo,
  headingId,
  onClose,
  onSubmitted,
  onStep,
}: {
  /** True while the popup is open. */
  active: boolean;
  /** The left column's background (see findHeroPhoto). */
  photo: string;
  /** Every screen's h2 carries this id: the dialog is labelled by it. */
  headingId: string;
  onClose: () => void;
  onSubmitted: () => void;
  /** Where the visitor is, for the quote_popup_close event. */
  onStep: (step: string) => void;
}) => {
  const turnstile = useTurnstile();
  const [screen, setScreen] = useState<QuoteScreen>('choose');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [sendBy, setSendBy] = useState<SendBy>('text');
  const [fields, setFields] = useState<Fields>({ name: '', phone: '', email: '', address: '' });
  const [callback, setCallback] = useState({ name: '', phone: '', when: 'asap' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ kind: 'form' | 'callback'; name: string; sendBy: SendBy; when: string; open: boolean } | null>(null);
  const [openNow, setOpenNow] = useState(true);
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<number | null>(null);

  const step = screen === 'question' ? `q${qIndex + 1}` : screen;
  useEffect(() => onStep(step), [step, onStep]);

  // Office hours are checked each time the popup opens.
  useEffect(() => {
    if (active) setOpenNow(isOpenNow());
  }, [active]);

  useEffect(() => () => void (advanceTimer.current && clearTimeout(advanceTimer.current)), []);

  // Each new screen starts at its top and, on a desktop, puts the cursor in
  // its first field (on a phone that would throw up the keyboard uninvited).
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    if (!active || !window.matchMedia('(min-width: 761px) and (pointer: fine)').matches) return;
    if (screen !== 'contact' && screen !== 'call') return;
    bodyRef.current?.querySelector<HTMLElement>('input:not([tabindex="-1"]), select')?.focus({ preventScroll: true });
  }, [screen, active]);

  const go = (next: QuoteScreen, q = 0) => {
    setPicked(null);
    setErrors({});
    setSubmitError(null);
    setQIndex(q);
    setScreen(next);
  };

  const chooseMethod = (method: 'form' | 'text' | 'call') => {
    trackEvent('quote_method_selected', { method });
    if (method === 'form') go('question', 0);
    else go(method);
  };

  const answer = (q: Question, value: string) => {
    if (picked) return;
    setAnswers((a) => ({ ...a, [q.key]: value }));
    setPicked(value);
    trackEvent('quote_answer', { q: q.key, a: value });
    advanceTimer.current = window.setTimeout(() => {
      if (qIndex < QUESTIONS.length - 1) go('question', qIndex + 1);
      else go('contact');
    }, ADVANCE_MS);
  };

  const back = () => {
    if (screen === 'question' && qIndex > 0) go('question', qIndex - 1);
    else if (screen === 'contact') go('question', QUESTIONS.length - 1);
    else go('choose');
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const digits = (s: string) => s.replace(/\D/g, '').length;
  const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

  /** Errors keyed by field id, in on-screen order; focuses the first. */
  const check = (rules: [string, string | false][]) => {
    const next: Errors = {};
    for (const [id, msg] of rules) if (msg) next[id] = msg;
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) document.getElementById(first)?.focus();
    return !first;
  };

  const honeypot = (form: HTMLFormElement) => String(new FormData(form).get('website') ?? '').trim() !== '';

  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = fields;
    const valid = check([
      ['qp-name', !f.name.trim() && 'Enter your first name.'],
      [
        'qp-phone',
        sendBy === 'text'
          ? digits(f.phone) < 10 && 'Enter a 10-digit mobile number.'
          : !!f.phone.trim() && digits(f.phone) < 10 && 'Enter a 10-digit number, or leave it blank.',
      ],
      ['qp-email', sendBy === 'email' && !emailOk(f.email) && 'Enter a valid email address.'],
      ['qp-address', !f.address.trim() && 'Enter the pool’s address.'],
    ]);
    if (!valid) return;
    if (honeypot(e.currentTarget)) return finish({ kind: 'form', name: f.name, sendBy, when: '', open: openNow });
    await send(
      {
        method: 'form',
        sendBy,
        service: 'weekly',
        ...Object.fromEntries(QUESTIONS.map((q) => [q.key, answers[q.key] ?? ''])),
        name: f.name.trim(),
        phone: f.phone.trim(),
        email: sendBy === 'email' ? f.email.trim() : '',
        address: f.address.trim(),
        source: LEAD_SOURCE,
      },
      { kind: 'form', name: f.name, sendBy, when: '', open: openNow },
    );
  };

  const submitCallback = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const c = callback;
    const valid = check([
      ['qp-cb-name', !c.name.trim() && 'Enter your first name.'],
      ['qp-cb-phone', digits(c.phone) < 10 && 'Enter a 10-digit phone number.'],
    ]);
    if (!valid) return;
    const when = CALL_TIMES.find(([v]) => v === c.when) ?? CALL_TIMES[0];
    const result = { kind: 'callback' as const, name: c.name, sendBy, when: when[2], open: openNow };
    if (honeypot(e.currentTarget)) return finish(result);
    await send(
      { method: 'callback', name: c.name.trim(), phone: c.phone.trim(), when: when[1], source: `${LEAD_SOURCE}-callback` },
      result,
    );
  };

  const send = async (payload: Record<string, unknown>, result: NonNullable<typeof done>) => {
    setSubmitError(null);
    setSubmitting(true);
    const turnstileToken = await turnstile.execute().catch(() => '');
    try {
      await sendContact({ ...payload, turnstileToken, source: String(payload.source), submittedAt: new Date().toISOString() });
      trackEvent('generate_lead', { source: payload.source, service: payload.service ?? 'callback' });
      trackEvent('quote_lead_submitted', {
        method: result.kind,
        ...(result.kind === 'form' ? { send_by: result.sendBy } : {}),
      });
      finish(result);
    } catch (err) {
      setSubmitError(`Something went wrong. Please call or text ${PHONE_DISPLAY}.`);
      console.error('Quote popup submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const finish = (result: NonNullable<typeof done>) => {
    setDone(result);
    onSubmitted();
    go('done');
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(PHONE_DISPLAY);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard blocked: the number is on screen to copy by hand. */
    }
  };

  // ── Pieces (plain functions, not components: a component defined inside
  //    this one would remount on every render and drop focus) ──────────────

  const fieldError = (id: string) =>
    errors[id] ? (
      <p id={`${id}-err`} className="mt-1.5 text-[12.5px] font-medium text-[#c23b3b]">
        {errors[id]}
      </p>
    ) : null;

  const errProps = (id: string) => ({
    'aria-invalid': !!errors[id] || undefined,
    'aria-describedby': errors[id] ? `${id}-err` : undefined,
  });

  const honeypotField = (
    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px" />
  );

  const statusDot = (open: boolean) => (
    <span aria-hidden="true" className={`inline-block h-2 w-2 shrink-0 rounded-full ${open ? 'bg-[#22a35a] shadow-[0_0_0_3px_rgba(34,163,90,0.15)]' : 'bg-[#a3acb8]'}`} />
  );

  const methodRow = (
    method: 'form' | 'text' | 'call',
    Icon: typeof Phone,
    title: React.ReactNode,
    sub: React.ReactNode,
    aside?: React.ReactNode,
  ) => (
    <button
      type="button"
      onClick={() => chooseMethod(method)}
      className={`qs-row group flex w-full items-center gap-4 rounded-[14px] bg-white p-[18px] text-left ${hairline} transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-px hover:border-[rgba(36,58,85,0.2)] hover:shadow-[0_10px_24px_-14px_rgba(36,58,85,0.35)] ${focusRing}`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-sc-mist text-sc-blue transition-colors duration-200 group-hover:bg-sc-navy group-hover:text-white">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-[16px] font-semibold tracking-[-0.01em] text-sc-navy">{title}</span>
        <span className="mt-0.5 flex items-center gap-2 text-[13.5px] leading-snug text-sc-muted">{sub}</span>
      </span>
      {aside}
      <ChevronRight className="h-5 w-5 shrink-0 text-sc-navy/35 transition-transform duration-200 group-hover:translate-x-[3px]" strokeWidth={1.75} />
    </button>
  );

  const progress = (
    <div className="flex flex-1 gap-1.5" role="progressbar" aria-label="Your progress" aria-valuemin={1} aria-valuemax={5} aria-valuenow={screen === 'contact' ? 5 : qIndex + 1}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${i <= (screen === 'contact' ? 4 : qIndex) ? 'bg-sc-blue' : 'bg-sc-navy/[0.1]'}`}
        />
      ))}
    </div>
  );

  // ── Screens ───────────────────────────────────────────────────────────────

  const chooseScreen = (
    <div className="flex min-h-full flex-col pt-5 min-[901px]:justify-center min-[901px]:py-2">
      <Eyebrow>Free flat-rate quote</Eyebrow>
      <h2 id={headingId} className={`mt-3 ${h2Cls}`}>
        How would you like
        <br />
        your{' '}
        <span className="bg-[linear-gradient(90deg,#2676b6,#3f95cc)] box-decoration-clone bg-clip-text text-transparent">price</span>?
      </h2>
      <p className={subCls}>Choose what’s easiest. Most quotes go out the same day.</p>

      <div className="qs-gap mt-6 flex flex-col gap-3">
        {methodRow(
          'form',
          ListChecks,
          'Answer 4 quick questions',
          'Tap through, then tell us where to send it.',
          <span className="qs-time shrink-0 text-[13px] text-sc-muted">~60 sec</span>,
        )}
        {methodRow(
          'text',
          MessageSquare,
          <>
            Text us 2 photos
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sc-gold/70 bg-[#fff8e1] px-2 py-[1px] text-[11px] font-semibold text-[#8a6100]">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-sc-gold" />
              Fastest
            </span>
          </>,
          'Your pool and equipment. We reply with a price.',
        )}
        {methodRow(
          'call',
          Phone,
          'Talk to a real person',
          openNow ? (
            <>
              {statusDot(true)}
              Open now · {PHONE_DISPLAY}
            </>
          ) : (
            <>
              {statusDot(false)}
              Closed now · request a callback
            </>
          ),
        )}
      </div>

      <ul className="qs-gap mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12.5px] text-sc-muted min-[761px]:gap-x-2.5">
        <li className="flex items-center gap-1.5">
          <Stars className="text-[11px]" />
          <span>
            <span className="sr-only">Rated </span>
            <span className="font-semibold text-sc-navy">5.0</span>
            <span className="sr-only"> out of 5</span> on Google
          </span>
        </li>
        <li aria-hidden="true" className="hidden text-sc-navy/25 min-[761px]:block">·</li>
        <li className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-sc-blue" strokeWidth={1.75} />
          Always Blue guarantee
        </li>
        <li aria-hidden="true" className="hidden text-sc-navy/25 min-[761px]:block">·</li>
        <li>Free · no obligation</li>
      </ul>
    </div>
  );

  const q = QUESTIONS[qIndex];
  const questionScreen = (
    <div key={`q${qIndex}`} className="qb-in">
      <Eyebrow>Question {qIndex + 1} of 4</Eyebrow>
      <h2 id={headingId} className={`mt-3 ${h2Cls}`}>
        {q.title}
      </h2>
      <p className={subCls}>{q.sub}</p>
      <div className="qs-cards qs-gap mt-6" role="group" aria-labelledby={headingId}>
        {q.options.map(([title, hint]) => {
          const on = (picked ?? answers[q.key]) === title;
          return (
            <button
              key={title}
              type="button"
              aria-pressed={on}
              onClick={() => answer(q, title)}
              className={`relative flex flex-col rounded-[14px] border p-4 pr-10 text-left transition-[border-color,background-color,box-shadow] duration-150 min-[761px]:p-[18px] min-[761px]:pr-11 ${focusRing} ${
                on ? 'border-sc-blue bg-sc-mist shadow-[0_0_0_1px_#2676b6_inset]' : 'border-[rgba(36,58,85,0.12)] bg-white hover:border-[rgba(36,58,85,0.25)]'
              }`}
            >
              <span className="block text-[15.5px] font-semibold text-sc-navy">{title}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-sc-muted">{hint}</span>
              <span
                aria-hidden="true"
                className={`absolute right-3.5 top-3.5 grid h-[18px] w-[18px] place-items-center rounded-full transition-colors min-[761px]:right-4 min-[761px]:top-4 ${
                  on ? 'bg-sc-blue text-white' : 'border border-[rgba(36,58,85,0.25)] text-transparent'
                }`}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const toggle = (value: SendBy, Icon: typeof Mail, label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={sendBy === value}
      onClick={() => {
        setSendBy(value);
        setErrors({});
      }}
      className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-[9px] text-[14.5px] font-semibold transition ${focusRing} ${
        sendBy === value ? 'bg-white text-sc-navy shadow-[0_1px_2px_rgba(36,58,85,0.12),0_4px_10px_-4px_rgba(36,58,85,0.18)]' : 'text-sc-navy/60 hover:text-sc-navy'
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  );

  const setField = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => setFields((f) => ({ ...f, [k]: e.target.value }));

  const contactScreen = (
    <form noValidate onSubmit={submitForm} className="qb-in relative">
      <Eyebrow>Last step</Eyebrow>
      <h2 id={headingId} className={`mt-3 ${h2Cls}`}>
        Where should we send your price?
      </h2>
      <p className={subCls}>One flat monthly rate, usually the same day (Mon–Sat).</p>

      <div role="radiogroup" aria-label="Send my price by" className="mt-4 flex gap-1 rounded-[12px] bg-sc-mist p-1 ring-1 ring-inset ring-sc-navy/[0.06]">
        {toggle('text', MessageSquare, 'Text me')}
        {toggle('email', Mail, 'Email me')}
      </div>

      <div className="mt-4 grid gap-3.5">
        <div>
          <label htmlFor="qp-name" className={labelCls}>
            First name
          </label>
          <input id="qp-name" type="text" autoComplete="given-name" value={fields.name} onChange={setField('name')} className={inputCls(!!errors['qp-name'])} {...errProps('qp-name')} />
          {fieldError('qp-name')}
        </div>
        <div>
          <label htmlFor="qp-phone" className={labelCls}>
            Mobile phone
            {sendBy === 'email' && <span className="text-[12.5px] font-normal text-sc-muted">Optional</span>}
          </label>
          <input
            id="qp-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={fields.phone}
            onChange={setField('phone')}
            className={inputCls(!!errors['qp-phone'])}
            {...errProps('qp-phone')}
          />
          {fieldError('qp-phone')}
        </div>
        {sendBy === 'email' && (
          <div>
            <label htmlFor="qp-email" className={labelCls}>
              Email
            </label>
            <input id="qp-email" type="email" autoComplete="email" value={fields.email} onChange={setField('email')} className={inputCls(!!errors['qp-email'])} {...errProps('qp-email')} />
            {fieldError('qp-email')}
          </div>
        )}
        <div>
          <label htmlFor="qp-address" className={labelCls}>
            Pool address
            <span className="text-[12.5px] font-normal text-sc-muted">To confirm we service your area</span>
          </label>
          <input
            id="qp-address"
            type="text"
            autoComplete="street-address"
            value={fields.address}
            onChange={setField('address')}
            className={inputCls(!!errors['qp-address'])}
            {...errProps('qp-address')}
          />
          {fieldError('qp-address')}
        </div>
      </div>
      {honeypotField}

      <button type="submit" disabled={submitting} className={`mt-5 ${goldButton}`}>
        {submitting ? 'Sending…' : 'Send my flat-rate price'}
        {!submitting && <ButtonArrow />}
      </button>
      {submitError && (
        <p role="alert" className="mt-3 text-center text-[13.5px] font-medium text-[#c23b3b]">
          {submitError}
        </p>
      )}
      {sendBy === 'text' && (
        <p className="mt-3 text-[11.5px] leading-[1.5] text-sc-muted">
          By submitting, you agree to receive texts about your request from Suncoast Pool Pros. Msg &amp; data rates may apply. Reply STOP to opt out.
        </p>
      )}
    </form>
  );

  const textScreen = (
    <div className="qb-in">
      <Eyebrow>Fastest way to a price</Eyebrow>
      <h2 id={headingId} className={`mt-3 ${h2Cls}`}>
        Text us two photos
      </h2>
      <p className={subCls}>We’ll reply with your flat monthly rate, usually the same day.</p>

      <ol className={`mt-6 divide-y divide-[rgba(36,58,85,0.12)] rounded-[14px] ${hairline}`}>
        {['A photo of your pool', 'A photo of your equipment pad', 'Your home address'].map((item, i) => (
          <li key={item} className="flex items-center gap-3.5 px-4 py-3.5 text-[15px] font-medium text-sc-navy">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sc-blue text-[13px] font-semibold text-white">{i + 1}</span>
            {item}
          </li>
        ))}
      </ol>

      <a
        href={active ? smsHref() : `sms:${PHONE_E164}`}
        onClick={() => trackEvent('quote_text_click')}
        className={`mt-6 ${goldButton}`}
      >
        <MessageSquare className="h-[18px] w-[18px]" strokeWidth={2} />
        Open my messages
      </a>

      <div className="mt-4 hidden items-center gap-4 rounded-[14px] bg-sc-mist px-5 py-4 min-[761px]:flex">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-sc-muted">On a computer? Text this number from your phone</p>
          <p className="mt-0.5 text-[22px] font-[650] tracking-[-0.02em] text-sc-navy tabular-nums">{PHONE_DISPLAY}</p>
        </div>
        <button
          type="button"
          onClick={copyNumber}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] bg-white px-3.5 text-[13.5px] font-semibold text-sc-navy ${hairline} transition hover:border-[rgba(36,58,85,0.25)] ${focusRing}`}
        >
          {copied ? <Check className="h-4 w-4 text-sc-blue" strokeWidth={2.25} /> : null}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <p className="mt-5 text-center">
        <button
          type="button"
          onClick={() => chooseMethod('form')}
          className={`text-[14px] font-medium text-sc-blue underline decoration-sc-blue/30 underline-offset-[3px] transition hover:decoration-sc-blue ${focusRing}`}
        >
          Prefer to answer 4 quick questions instead?
        </button>
      </p>
    </div>
  );

  const callScreen = (
    <div className="qb-in">
      <Eyebrow>Talk to a real person</Eyebrow>
      <h2 id={headingId} className={`mt-3 ${h2Cls}`}>
        Call for your price
      </h2>
      <p className={subCls}>Call our local St. Pete team for your flat monthly rate.</p>

      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-sc-mist px-3 py-1.5 text-[13px] font-medium text-sc-navy ring-1 ring-inset ring-sc-navy/[0.06]">
        {statusDot(openNow)}
        {openNow ? 'Open now · until 6 PM' : `Closed now · ${HOURS_SHORT}`}
      </p>

      <a href={PHONE_HREF} onClick={() => trackEvent('quote_call_click')} className={`mt-5 ${goldButton}`}>
        <Phone className="h-[18px] w-[18px]" strokeWidth={2} />
        Call {PHONE_DISPLAY}
      </a>

      <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sc-muted before:h-px before:flex-1 before:bg-[rgba(36,58,85,0.12)] after:h-px after:flex-1 after:bg-[rgba(36,58,85,0.12)]">
        Or we’ll call you
      </div>

      <form noValidate onSubmit={submitCallback} className="relative grid gap-4">
        <div className="grid gap-4 min-[761px]:grid-cols-2">
          <div>
            <label htmlFor="qp-cb-name" className={labelCls}>
              First name
            </label>
            <input
              id="qp-cb-name"
              type="text"
              autoComplete="given-name"
              value={callback.name}
              onChange={(e) => setCallback((c) => ({ ...c, name: e.target.value }))}
              className={inputCls(!!errors['qp-cb-name'])}
              {...errProps('qp-cb-name')}
            />
            {fieldError('qp-cb-name')}
          </div>
          <div>
            <label htmlFor="qp-cb-phone" className={labelCls}>
              Phone
            </label>
            <input
              id="qp-cb-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={callback.phone}
              onChange={(e) => setCallback((c) => ({ ...c, phone: e.target.value }))}
              className={inputCls(!!errors['qp-cb-phone'])}
              {...errProps('qp-cb-phone')}
            />
            {fieldError('qp-cb-phone')}
          </div>
        </div>
        <div>
          <label htmlFor="qp-cb-when" className={labelCls}>
            Best time to call
          </label>
          <div className="relative">
            <select
              id="qp-cb-when"
              value={callback.when}
              onChange={(e) => setCallback((c) => ({ ...c, when: e.target.value }))}
              className={`${inputCls(false)} appearance-none pr-10`}
            >
              {CALL_TIMES.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sc-navy/50" strokeWidth={1.75} />
          </div>
        </div>
        {honeypotField}
        <button
          type="submit"
          disabled={submitting}
          className={`inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-white text-[15.5px] font-semibold text-sc-navy border border-[rgba(36,58,85,0.2)] shadow-[0_1px_2px_rgba(36,58,85,0.06)] transition hover:border-[rgba(36,58,85,0.35)] disabled:cursor-wait disabled:opacity-70 ${focusRing}`}
        >
          {submitting ? 'Sending…' : 'Request a callback'}
        </button>
        {submitError && (
          <p role="alert" className="text-center text-[13.5px] font-medium text-[#c23b3b]">
            {submitError}
          </p>
        )}
      </form>
    </div>
  );

  const firstName = (done?.name ?? '').trim().split(/\s+/)[0];
  const doneScreen = done && (
    <div className="qb-in flex min-h-full flex-col items-center justify-center py-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-[linear-gradient(135deg,#3f95cc,#2676b6)] text-white shadow-[0_0_0_8px_rgba(38,118,182,0.1),0_12px_28px_-10px_rgba(38,118,182,0.6)]">
        <Check className="h-8 w-8" strokeWidth={2.5} />
      </span>
      <h2 id={headingId} className={`mt-6 ${h2Cls}`}>
        Thanks{firstName ? `, ${firstName}` : ''}
      </h2>
      <p className={`${subCls} max-w-[400px]`}>
        {done.kind === 'form'
          ? `Your flat-rate price is on its way by ${done.sendBy === 'text' ? 'text' : 'email'}. Keep an eye on your ${done.sendBy === 'text' ? 'messages' : 'inbox'}.`
          : !done.open && done.when === CALL_TIMES[0][2]
            ? 'We’re closed right now. We’ll call you first thing when we open.'
            : `We’ll call you ${done.when}.`}
      </p>
      <p className="mt-6 text-[14px] text-sc-muted">
        Need it sooner? Call{' '}
        <a href={PHONE_HREF} className={`font-semibold text-sc-navy underline decoration-sc-navy/30 underline-offset-[3px] hover:decoration-sc-navy ${focusRing}`}>
          {PHONE_DISPLAY}
        </a>
      </p>
    </div>
  );

  // ── Photo column / header ───────────────────────────────────────────────
  // Once the questions start, the left column trades its trust pills for a
  // live summary of the answers.
  const summarizing = screen === 'question' || screen === 'contact' || (screen === 'done' && done?.kind === 'form');
  const photoLayers = (
    <>
      {photo && <div className="qs-photo" style={{ backgroundImage: `url("${photo}")` }} />}
      <div className="qs-photo-fade absolute inset-0" />
    </>
  );
  const pill = 'qs-glass inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] text-white';
  const brand = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-white';
  const closeButton = (cls: string) => (
    <button type="button" onClick={onClose} aria-label="Close" className={`h-9 w-9 shrink-0 place-items-center rounded-full transition ${focusRing} ${cls}`}>
      <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </button>
  );
  const plainClose = `bg-white text-sc-navy/60 ${hairline} hover:border-[rgba(36,58,85,0.25)] hover:text-sc-navy`;

  return (
    <>
      <aside aria-hidden="true" className="qs-aside relative shrink-0 flex-col overflow-hidden bg-[#0b0d10] text-white">
        {photoLayers}
        <div className={`qs-photo-deep absolute inset-0 ${summarizing ? 'is-on' : ''}`} />
        <p className={`relative px-7 pt-7 ${brand}`}>Suncoast Pool Pros</p>
        <div className="relative mt-auto px-7 pb-7">
          {summarizing ? (
            <dl key="summary" className="qb-in divide-y divide-white/[0.12] text-[13.5px]">
              {QUESTIONS.map((x) => (
                <div key={x.key} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-white/60">{x.label}</dt>
                  <dd key={answers[x.key] ?? ''} className={answers[x.key] ? 'qb-in font-semibold' : 'text-white/35'}>
                    {answers[x.key] ?? '—'}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <ul key="pills" className="flex flex-col items-start gap-2">
              <li className={pill}>
                <Stars className="text-[11px]" />
                <span>
                  <span className="font-semibold">5.0</span> on Google
                </span>
              </li>
              <li className={pill}>
                <ShieldCheck className="h-3.5 w-3.5 text-sc-gold" strokeWidth={1.75} />
                Always Blue guarantee
              </li>
              <li className={pill}>
                <Check className="h-3.5 w-3.5 text-sc-gold" strokeWidth={2} />
                Chemicals included, no contracts
              </li>
            </ul>
          )}
        </div>
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {screen === 'choose' ? (
          <>
            {/* Phones and tablet portrait: a photo header, first screen only. */}
            <div className="qs-head relative shrink-0 overflow-hidden bg-[#0b0d10]">
              {photoLayers}
              <div className="qs-head-shade absolute inset-0" />
              <span aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-white/70 min-[761px]:hidden" />
              <p aria-hidden="true" className={`absolute left-5 top-5 min-[761px]:left-10 min-[761px]:top-6 ${brand}`}>
                Suncoast Pool Pros
              </p>
              <p aria-hidden="true" className={`absolute bottom-4 left-5 min-[761px]:bottom-5 min-[761px]:left-10 ${pill}`}>
                <Stars className="text-[11px]" />
                <span>
                  <span className="font-semibold">5.0</span> on Google · Always Blue guarantee
                </span>
              </p>
              {closeButton('qs-glass absolute right-4 top-4 grid text-white hover:bg-black/60')}
            </div>
            {/* Everywhere else, the first screen keeps only the close button. */}
            {closeButton(`qs-nohead absolute right-4 top-4 z-10 ${plainClose}`)}
          </>
        ) : (
          <div className="qs-pad flex h-14 shrink-0 items-center gap-4">
            {screen !== 'done' && (
              <button
                type="button"
                onClick={back}
                className={`-ml-1.5 inline-flex h-9 items-center gap-0.5 rounded-[8px] pl-1 pr-2 text-[14px] font-medium text-sc-navy/70 transition hover:text-sc-navy ${focusRing}`}
              >
                <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
                Back
              </button>
            )}
            {screen === 'question' || screen === 'contact' ? progress : <span className="flex-1" />}
            {closeButton(`grid ${plainClose}`)}
          </div>
        )}

        <div ref={bodyRef} className="qs-pad min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.75rem,env(safe-area-inset-bottom))] min-[761px]:pb-8">
          {screen === 'choose' && chooseScreen}
          {screen === 'question' && questionScreen}
          {screen === 'contact' && contactScreen}
          {screen === 'text' && textScreen}
          {screen === 'call' && callScreen}
          {screen === 'done' && doneScreen}
        </div>
        <div ref={turnstile.containerRef} aria-hidden="true" className="absolute -left-[9999px] h-px w-px" />
      </div>
    </>
  );
};
