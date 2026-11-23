import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, ListChecks, Mail, MessageSquare, Phone, Tag, X } from 'lucide-react';
import { sendContact } from '@/lib/contactSubmit';
import { trackEvent } from '@/lib/analytics';
import { useTurnstile } from '@/lib/turnstile';
import { HOURS_SHORT, PHONE_DISPLAY, PHONE_E164, PHONE_HREF } from '@/lib/contact';

/*
 * The quote popup (hosted by LandingQuoteSheet), opened by every quote button
 * on the site. The first screen asks HOW the visitor wants their quote:
 * texting two photos, a call, or five quick questions. Contact details come
 * last, never first: someone who has already tapped through a few answers is
 * far more likely to finish.
 *
 * From 761px wide: a fixed 520 × 560 window; below it, the same design as a
 * bottom sheet min(600px, 100dvh − 24px) tall (index.css, .qs-panel). Every
 * screen is the same size, so nothing jumps between steps: a heading, its
 * content centred in the space left, and a grey footer strip.
 *
 * The questions start with the kind of pool. A home pool gets four more
 * (size, sanitizer, screen, trees); anything else (commercial, HOA,
 * recreation, medical) gets six facility questions instead.
 *
 * Leads go through /api/contact like every other form (Turnstile, honeypot,
 * the generate_lead event); the endpoint lists unknown keys as email rows and
 * in the PoolLogic lead's details, so the answers need no backend change.
 */
const LEAD_SOURCE = 'quote-popup';
// After a tap, hold the chosen state this long before moving on, so it reads.
const ADVANCE_MS = 220;
const SMS_BODY = 'Hi! Here are photos of my pool and equipment, plus my address. Can I get a flat-rate quote?';
// The popup writes the number without parentheses: 727 295-3621.
const PHONE_SHORT = PHONE_DISPLAY.replace(/^\((\d{3})\)\s*/, '$1 ');

/** An answer: its title and an optional one-line description. */
type Option = [string, string?];
type Question = { key: string; title: string; sub: string; options: Option[] };

const RESIDENTIAL = 'Residential';
const POOL_TYPE: Question = {
  key: 'poolType',
  title: 'What kind of pool is it?',
  sub: 'So we can point you to the right quote.',
  options: [[RESIDENTIAL], ['Commercial'], ['Community / HOA'], ['Recreation or aquatic center'], ['Medical or therapy facility']],
};

const SANITIZER_SUB = 'Either is fine. It just changes what we bring.';

const HOME_QUESTIONS: Question[] = [
  {
    key: 'poolSize',
    title: 'About how big is your pool?',
    sub: 'A rough guess is perfect.',
    options: [['Small'], ['Medium'], ['Large'], ['Not sure']],
  },
  {
    key: 'sanitizer',
    title: 'What type of sanitizer?',
    sub: SANITIZER_SUB,
    options: [
      ['Saltwater', 'Has a salt cell'],
      ['Chlorine', 'Tabs or liquid'],
      ['Not sure', 'We’ll check on the first visit'],
    ],
  },
  {
    key: 'screen',
    title: 'Is it screened in?',
    sub: 'Screen enclosures keep most debris out.',
    options: [
      ['Screened', 'Pool cage or lanai'],
      ['Open', 'Open to the yard'],
    ],
  },
  {
    key: 'trees',
    title: 'How many trees are nearby?',
    sub: 'More leaves means a little more time each visit.',
    options: [
      ['Few or none', 'Light debris'],
      ['Some', 'A few trees close by'],
      ['A lot', 'Heavy leaves and debris'],
    ],
  },
];

const FACILITY_QUESTIONS: Question[] = [
  {
    key: 'poolCount',
    title: 'How many pools and spas?',
    sub: 'Count every body of water on site.',
    options: [['One'], ['Two'], ['Three or more']],
  },
  {
    key: 'poolVolume',
    title: 'About how big is the main pool?',
    sub: 'A rough estimate is fine.',
    options: [['Under 25,000 gallons'], ['25,000 to 75,000 gallons'], ['Over 75,000 gallons'], ['Not sure']],
  },
  {
    key: 'setting',
    title: 'Indoor or outdoor?',
    sub: 'Indoor pools need a different approach.',
    options: [['Outdoor'], ['Indoor'], ['Both']],
  },
  {
    key: 'sanitizer',
    title: 'What type of sanitizer?',
    sub: SANITIZER_SUB,
    options: [
      ['Saltwater', 'Has a salt cell'],
      ['Chlorine', 'Tabs or liquid'],
      ['Bromine', 'Tablets or feeder'],
      ['Not sure', 'We’ll check on the first visit'],
    ],
  },
  {
    key: 'chemicalFeed',
    title: 'How are chemicals fed?',
    sub: 'So we know what equipment we’re working with.',
    options: [['Automated controller'], ['Feeder or pump'], ['Added by hand'], ['Not sure']],
  },
  {
    key: 'frequency',
    title: 'How often do you need service?',
    sub: 'We’ll confirm what your facility requires.',
    options: [['3 visits a week'], ['5 visits a week'], ['Daily'], ['Not sure']],
  },
];

const isHome = (poolType?: string) => !poolType || poolType === RESIDENTIAL;
/** Every question on a pool type's path, the pool type first. Until it's
 *  answered, the shorter home path. */
const stepsFor = (poolType?: string) => [POOL_TYPE, ...(isHome(poolType) ? HOME_QUESTIONS : FACILITY_QUESTIONS)];

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

const smsHref = () => {
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return `sms:${PHONE_E164}${ios ? '&' : '?'}body=${encodeURIComponent(SMS_BODY)}`;
};

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7fdb]';
// Flat gold: no gradient or glow.
const goldButton = `inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#f7b500] px-6 font-semibold text-[#1c2f47] shadow-[0_1px_2px_rgba(16,24,40,0.14)] transition-colors hover:bg-[#ffc01f] disabled:cursor-wait disabled:opacity-70 ${focusRing}`;
const rowBorder = 'border border-[rgba(36,58,85,0.12)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]';
// The highlighted card: the "Text us 2 photos" row, the number cards, a chosen answer.
const featuredCard =
  'rounded-[12px] border border-[#1f7fdb] bg-[rgba(31,127,219,0.045)] shadow-[0_0_0_1px_#1f7fdb,0_1px_2px_rgba(16,24,40,0.04)]';
const greyPanel = 'rounded-[12px] border border-[rgba(36,58,85,0.08)] bg-[#f7f9fc]';
const panelLabel = 'text-[13px] font-semibold text-[rgba(36,58,85,0.58)]';
const numberCls = 'text-[24px] font-semibold tracking-[-0.015em] tabular-nums text-[#1c2f47]';
const smallButton = `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-[rgba(36,58,85,0.16)] bg-white px-[14px] text-[13.5px] font-semibold text-[#243a55] transition-colors hover:border-[rgba(36,58,85,0.3)] ${focusRing}`;
const inputBase =
  'block w-full rounded-[10px] border bg-white px-[14px] text-[16px] text-sc-navy placeholder:text-sc-navy/40 outline-none transition-[border-color,box-shadow] min-[761px]:text-[15.5px]';
const inputCls = (bad: boolean) =>
  `${inputBase} ${
    bad
      ? 'border-[#d64545] shadow-[0_0_0_4px_rgba(214,69,69,0.12)]'
      : 'border-[rgba(36,58,85,0.2)] focus:border-[#1f7fdb] focus:shadow-[0_0_0_4px_rgba(31,127,219,0.12)]'
  }`;
const labelCls = 'mb-1 flex items-baseline justify-between gap-3 text-[13.5px] font-semibold text-sc-navy';
// Inner screens' heading: one line from 761px up.
const h2Cls =
  'text-balance text-[25px] font-semibold leading-[1.15] tracking-[-0.025em] text-[#243a55] min-[761px]:whitespace-nowrap min-[761px]:text-[28px]';
const subCls = 'mt-2 text-pretty text-[15px] leading-[1.5] text-sc-muted';
// A screen's body: heading at the top, the content centred in what's left
// (equal flexible gaps above and below it, never under 12px: the tightest
// screen, the contact form with "Email me", needs that much).
const screenCls = 'qb-in flex min-h-full flex-col';
const Spacer = ({ className = '' }: { className?: string }) => <div aria-hidden="true" className={`min-h-3 flex-1 ${className}`} />;

const Stars = ({ className = '' }: { className?: string }) => (
  <span aria-hidden="true" className={`tracking-[-0.02em] text-sc-gold ${className}`}>
    ★★★★★
  </span>
);

export const QuotePopup = ({
  active,
  headingId,
  onClose,
  onSubmitted,
  onStep,
}: {
  /** True while the popup is open. */
  active: boolean;
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

  const steps = stepsFor(answers.poolType);
  const home = isHome(answers.poolType);

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
    if (screen !== 'contact') return;
    bodyRef.current?.querySelector<HTMLElement>('input:not([tabindex="-1"]), select')?.focus({ preventScroll: true });
  }, [screen, qIndex, active]);

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
    const poolType = q.key === POOL_TYPE.key ? value : answers.poolType;
    setAnswers((a) => {
      // Switching between a home and a facility drops the other path's answers.
      if (q.key === POOL_TYPE.key && a.poolType && isHome(a.poolType) !== isHome(value)) return { poolType: value };
      return { ...a, [q.key]: value };
    });
    setPicked(value);
    trackEvent('quote_answer', { q: q.key, a: value });
    const last = stepsFor(poolType).length - 1;
    advanceTimer.current = window.setTimeout(() => {
      if (qIndex < last) go('question', qIndex + 1);
      else go('contact');
    }, ADVANCE_MS);
  };

  const back = () => {
    if (screen === 'question' && qIndex > 0) go('question', qIndex - 1);
    else if (screen === 'contact') go('question', steps.length - 1);
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
        // A facility's lead files under the backend's "Commercial / HOA".
        service: home ? 'weekly' : 'commercial',
        // The pool type and every answer on its path, in the order asked.
        ...Object.fromEntries(steps.map((q) => [q.key, answers[q.key] ?? ''])),
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
      setSubmitError(`Something went wrong. Please call or text ${PHONE_SHORT}.`);
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
      await navigator.clipboard.writeText(PHONE_SHORT);
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

  const aside = 'shrink-0 text-[13px] tabular-nums text-[rgba(36,58,85,0.55)]';

  const methodRow = (method: 'form' | 'text' | 'call', Icon: typeof Phone, title: string, right: React.ReactNode, featured = false) => (
    <button
      type="button"
      onClick={() => chooseMethod(method)}
      className={`flex min-h-[84px] w-full items-center gap-4 rounded-[12px] px-[18px] text-left transition-[border-color] min-[761px]:px-6 ${focusRing} ${
        featured ? featuredCard : `${rowBorder} hover:border-[rgba(36,58,85,0.24)]`
      }`}
    >
      <Icon className="h-6 w-6 shrink-0 text-[#1f7fdb]" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 text-[17px] font-semibold tracking-[-0.01em] text-[#243a55]">{title}</span>
      {right}
      <ChevronRight className="-mr-1 h-5 w-5 shrink-0 text-[rgba(36,58,85,0.28)]" strokeWidth={1.75} />
    </button>
  );

  // One segment per question on this path, plus the contact form.
  const segments = steps.length + 1;
  const at = screen === 'contact' ? steps.length : qIndex;
  const progress = (
    <div className="flex flex-1 gap-1.5" role="progressbar" aria-label="Your progress" aria-valuemin={1} aria-valuemax={segments} aria-valuenow={at + 1}>
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${i <= at ? 'bg-[#1f7fdb]' : 'bg-sc-navy/[0.1]'}`} />
      ))}
    </div>
  );

  // ── Screens ───────────────────────────────────────────────────────────────

  // In the markup in the order they're shown, so keyboard and screen-reader
  // order match.
  const chooseScreen = (
    <div className="flex min-h-full flex-col pt-[54px]">
      <h2 id={headingId} className="text-balance text-[30px] font-semibold leading-[1.12] tracking-[-0.025em] text-[#243a55] min-[761px]:text-[34px]">
        Get your free quote
      </h2>
      <p className={subCls}>Choose what’s easiest. Most quotes go out the same day.</p>
      <Spacer />
      <div className="flex flex-col gap-3">
        {methodRow(
          'text',
          MessageSquare,
          'Text us 2 photos',
          <span className="shrink-0 rounded-full bg-[rgba(42,120,184,0.1)] px-2 py-[2px] text-[11.5px] font-semibold text-[#2a78b8]">Fastest</span>,
          true,
        )}
        {methodRow('call', Phone, 'Talk to a real person', <span className={`${aside} max-[760px]:hidden`}>{PHONE_SHORT}</span>)}
        {/* Under 420px the time would push the title onto two lines. */}
        {methodRow('form', ListChecks, 'Answer 5 quick questions', <span className={`${aside} max-[419px]:hidden`}>~60 sec</span>)}
      </div>
      <Spacer />
    </div>
  );

  const q = steps[qIndex];
  const many = q.options.length >= 5;
  const questionScreen = (
    <div key={`q${qIndex}-${q.key}`} className={screenCls}>
      <h2 id={headingId} className={`pt-2 ${h2Cls}`}>
        {q.title}
      </h2>
      <p className={subCls}>{q.sub}</p>
      <Spacer />
      <div className={`flex flex-col ${many ? 'gap-2.5' : 'gap-3'}`} role="group" aria-labelledby={headingId}>
        {q.options.map(([title, hint]) => {
          const on = (picked ?? answers[q.key]) === title;
          return (
            <button
              key={title}
              type="button"
              aria-pressed={on}
              onClick={() => answer(q, title)}
              className={`relative flex flex-col justify-center rounded-[12px] py-[13px] pl-[22px] pr-12 text-left transition-[border-color,background-color,box-shadow] duration-150 ${
                many ? 'min-h-[54px]' : 'min-h-[60px]'
              } ${focusRing} ${on ? featuredCard : `${rowBorder} hover:border-[rgba(36,58,85,0.24)]`}`}
            >
              <span className="block text-[16.5px] font-semibold leading-tight text-[#243a55]">{title}</span>
              {hint && <span className="mt-0.5 block text-[13px] leading-snug text-[rgba(36,58,85,0.66)]">{hint}</span>}
              {on && (
                <span aria-hidden="true" className="absolute right-[18px] top-1/2 grid h-[18px] w-[18px] -translate-y-1/2 place-items-center rounded-full bg-[#1f7fdb] text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Spacer />
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
      className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-[9px] text-[14.5px] font-semibold transition ${focusRing} ${
        sendBy === value ? 'bg-white text-sc-navy shadow-[0_1px_2px_rgba(36,58,85,0.12),0_4px_10px_-4px_rgba(36,58,85,0.18)]' : 'text-sc-navy/60 hover:text-sc-navy'
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  );

  const setField = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => setFields((f) => ({ ...f, [k]: e.target.value }));
  const contactInput = (bad: boolean) => `${inputCls(bad)} h-[42px]`;

  const contactScreen = (
    <form id="qp-contact" noValidate onSubmit={submitForm} className={`relative ${screenCls}`}>
      <h2 id={headingId} className={`pt-2 ${h2Cls}`}>
        Where should we send your quote?
      </h2>
      <p className={subCls}>One flat monthly rate, usually the same day (Mon–Sat).</p>
      <Spacer />

      <div>
        <div role="radiogroup" aria-label="Send my quote by" className="flex gap-1 rounded-[12px] bg-sc-mist p-1 ring-1 ring-inset ring-sc-navy/[0.06]">
          {toggle('text', MessageSquare, 'Text me')}
          {toggle('email', Mail, 'Email me')}
        </div>

        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="qp-name" className={labelCls}>
                First name
              </label>
              <input id="qp-name" type="text" autoComplete="given-name" value={fields.name} onChange={setField('name')} className={contactInput(!!errors['qp-name'])} {...errProps('qp-name')} />
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
                className={contactInput(!!errors['qp-phone'])}
                {...errProps('qp-phone')}
              />
              {fieldError('qp-phone')}
            </div>
          </div>
          {sendBy === 'email' && (
            <div>
              <label htmlFor="qp-email" className={labelCls}>
                Email
              </label>
              <input id="qp-email" type="email" autoComplete="email" value={fields.email} onChange={setField('email')} className={contactInput(!!errors['qp-email'])} {...errProps('qp-email')} />
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
              className={contactInput(!!errors['qp-address'])}
              {...errProps('qp-address')}
            />
            {fieldError('qp-address')}
          </div>
        </div>
        {honeypotField}

        <button type="submit" disabled={submitting} className={`mt-4 h-[50px] text-[16px] ${goldButton}`}>
          {submitting ? 'Sending…' : 'Send my free quote'}
        </button>
        {submitError && (
          <p role="alert" className="mt-3 text-center text-[13.5px] font-medium text-[#c23b3b]">
            {submitError}
          </p>
        )}
      </div>
      <Spacer />
    </form>
  );

  const textScreen = (
    <div className={screenCls}>
      <h2 id={headingId} className={`pt-2 ${h2Cls}`}>
        The fastest way to a free quote
      </h2>
      <Spacer />
      <div className={`${greyPanel} px-[22px] pb-[22px] pt-5`}>
        <p className={panelLabel}>What to text us</p>
        <ol className="mt-4 grid gap-4">
          {['A photo of your pool', 'A photo of your equipment pad', 'Your home address'].map((item, i) => (
            <li key={item} className="flex items-center gap-5 text-[17px] font-medium text-[#1c2f47]">
              <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1c2f47] text-[12.5px] font-semibold text-white">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </div>
      <Spacer className="max-[760px]:hidden" />

      {/* Phones: right under the list, one tap opens Messages with the text
          written. */}
      <a
        href={active ? smsHref() : `sms:${PHONE_E164}`}
        onClick={() => trackEvent('quote_text_click')}
        className={`mt-4 h-[52px] text-[16px] min-[761px]:hidden ${goldButton}`}
      >
        <MessageSquare className="h-[18px] w-[18px]" strokeWidth={2} />
        Open my messages
      </a>

      {/* A computer: the number to text from a phone, and a link for Macs
          with Messages. */}
      <div className="hidden min-[761px]:block">
        <div className={`flex h-16 items-center justify-between gap-4 pl-[22px] pr-[14px] ${featuredCard}`}>
          <p className={numberCls}>
            <span className="sr-only">Text </span>
            {PHONE_SHORT}
          </p>
          <button type="button" onClick={copyNumber} className={smallButton}>
            {copied ? <Check className="h-4 w-4 text-[#1f7fdb]" strokeWidth={2.25} /> : null}
            <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <p className="mt-4 text-center">
          <a
            href={active ? smsHref() : `sms:${PHONE_E164}`}
            onClick={() => trackEvent('quote_text_click')}
            className={`inline-flex items-center gap-1.5 rounded-[6px] text-[14.5px] font-semibold text-[#1f7fdb] underline-offset-[3px] hover:underline ${focusRing}`}
          >
            <MessageSquare className="h-4 w-4" strokeWidth={2} />
            Open my messages
          </a>
        </p>
      </div>
      <Spacer />
    </div>
  );

  const callScreen = (
    <div className={screenCls}>
      <h2 id={headingId} className={`pt-2 ${h2Cls}`}>
        Talk to a real person
      </h2>
      <p className={subCls}>Call our local St. Pete team for your flat monthly rate.</p>
      <Spacer />

      <a
        href={PHONE_HREF}
        onClick={() => trackEvent('quote_call_click')}
        aria-label={`Call ${PHONE_SHORT}`}
        className={`flex h-16 shrink-0 items-center gap-3 pl-[22px] pr-[14px] ${featuredCard} ${focusRing}`}
      >
        <Phone className="h-5 w-5 shrink-0 text-[#1f7fdb]" strokeWidth={1.75} />
        <span className={`min-w-0 flex-1 ${numberCls}`}>{PHONE_SHORT}</span>
        <span aria-hidden="true" className={smallButton}>
          Call
        </span>
      </a>
      <Spacer />

      <form noValidate onSubmit={submitCallback} className={`relative grid gap-3 px-[18px] pb-[18px] pt-[14px] min-[761px]:px-[22px] min-[761px]:pb-5 min-[761px]:pt-4 ${greyPanel}`}>
        <p className={panelLabel}>Or we’ll call you</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="qp-cb-name" className="sr-only">
              First name
            </label>
            <input
              id="qp-cb-name"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              value={callback.name}
              onChange={(e) => setCallback((c) => ({ ...c, name: e.target.value }))}
              className={`${inputCls(!!errors['qp-cb-name'])} h-11`}
              {...errProps('qp-cb-name')}
            />
            {fieldError('qp-cb-name')}
          </div>
          <div>
            <label htmlFor="qp-cb-phone" className="sr-only">
              Phone
            </label>
            <input
              id="qp-cb-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Phone"
              value={callback.phone}
              onChange={(e) => setCallback((c) => ({ ...c, phone: e.target.value }))}
              className={`${inputCls(!!errors['qp-cb-phone'])} h-11`}
              {...errProps('qp-cb-phone')}
            />
            {fieldError('qp-cb-phone')}
          </div>
        </div>
        <div className="grid gap-1.5 min-[761px]:flex min-[761px]:items-center min-[761px]:gap-4">
          <label htmlFor="qp-cb-when" className="shrink-0 text-[14px] font-medium text-[#243a55]">
            Best time to call
          </label>
          <div className="relative min-w-0 flex-1">
            <select
              id="qp-cb-when"
              value={callback.when}
              onChange={(e) => setCallback((c) => ({ ...c, when: e.target.value }))}
              className={`${inputCls(false)} h-11 appearance-none pr-10`}
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
        <button type="submit" disabled={submitting} className={`h-[46px] text-[15.5px] ${goldButton}`}>
          {submitting ? 'Sending…' : 'Request a callback'}
        </button>
        {submitError && (
          <p role="alert" className="text-center text-[13.5px] font-medium text-[#c23b3b]">
            {submitError}
          </p>
        )}
      </form>
      <Spacer />
    </div>
  );

  const firstName = (done?.name ?? '').trim().split(/\s+/)[0];
  const doneScreen = done && (
    <div className="qb-in flex min-h-full flex-col items-center justify-center py-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-[#1f7fdb] text-white shadow-[0_0_0_8px_rgba(31,127,219,0.1)]">
        <Check className="h-8 w-8" strokeWidth={2.5} />
      </span>
      <h2 id={headingId} className={`mt-6 ${h2Cls}`}>
        Thanks{firstName ? `, ${firstName}` : ''}
      </h2>
      <p className={`${subCls} max-w-[400px]`}>
        {done.kind === 'form'
          ? `Your free quote is on its way by ${done.sendBy === 'text' ? 'text' : 'email'}. Keep an eye on your ${done.sendBy === 'text' ? 'messages' : 'inbox'}.`
          : !done.open && done.when === CALL_TIMES[0][2]
            ? 'We’re closed right now. We’ll call you first thing when we open.'
            : `We’ll call you ${done.when}.`}
      </p>
      <p className="mt-6 text-[14px] text-sc-muted">
        Need it sooner? Call{' '}
        <a href={PHONE_HREF} className={`font-semibold text-sc-navy underline decoration-sc-navy/30 underline-offset-[3px] hover:decoration-sc-navy ${focusRing}`}>
          {PHONE_SHORT}
        </a>
      </p>
    </div>
  );

  // ── Footer strip ────────────────────────────────────────────────────────
  const footer: React.ReactNode =
    screen === 'choose' ? (
      <span className="inline-flex items-center justify-center gap-x-1.5 whitespace-nowrap text-[12px] min-[761px]:gap-x-2 min-[761px]:text-[13.5px]">
        <span className="inline-flex items-center gap-1.5">
          <Stars className="text-[11px]" />
          <span>
            <span className="sr-only">Rated </span>
            <span className="font-semibold text-[#243a55]">5.0</span>
            <span className="sr-only"> out of 5</span> on Google
          </span>
        </span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-[#1f7fdb]" strokeWidth={2} />
          Flat-rate pricing
        </span>
        <span aria-hidden="true">·</span>
        <span>Free quote</span>
      </span>
    ) : screen === 'text' ? (
      'Most quotes are sent within the hour.'
    ) : screen === 'call' ? (
      <span className="inline-flex items-center gap-2">
        {statusDot(openNow)}
        {openNow ? 'Open now · until 6 PM' : `Closed now · ${HOURS_SHORT}`}
      </span>
    ) : screen === 'question' ? (
      home ? 'Takes about 60 seconds.' : 'Takes about 90 seconds.'
    ) : screen === 'contact' ? (
      <span className="block text-[11.5px] font-normal leading-[1.5]">
        By submitting, you agree to receive texts about your request from Suncoast Pool Pros. Msg &amp; data rates may apply. Reply STOP to opt out.
      </span>
    ) : null;

  const closeButton = (cls: string) => (
    <button type="button" onClick={onClose} aria-label="Close" className={`h-[34px] w-[34px] shrink-0 place-items-center rounded-full transition-colors ${focusRing} ${cls}`}>
      <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </button>
  );
  const plainClose = 'bg-[rgba(36,58,85,0.06)] text-sc-navy/70 hover:bg-[rgba(36,58,85,0.1)] hover:text-sc-navy';

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      {screen === 'choose' ? (
        closeButton(`absolute right-4 top-4 z-10 grid ${plainClose}`)
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

      <div ref={bodyRef} className="qs-pad min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {screen === 'choose' && chooseScreen}
        {screen === 'question' && questionScreen}
        {screen === 'contact' && contactScreen}
        {screen === 'text' && textScreen}
        {screen === 'call' && callScreen}
        {screen === 'done' && doneScreen}
      </div>

      {footer && (
        <div className="shrink-0 border-t border-[rgba(36,58,85,0.09)] bg-[#f7f9fc] px-4 pb-[max(15px,env(safe-area-inset-bottom))] pt-[15px] text-center text-[13.5px] font-medium text-[rgba(36,58,85,0.7)] min-[761px]:px-8 min-[761px]:pb-[15px]">
          {footer}
        </div>
      )}
      <div ref={turnstile.containerRef} aria-hidden="true" className="absolute -left-[9999px] h-px w-px" />
    </div>
  );
};
