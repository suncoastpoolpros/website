import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Mail, MessageSquare, Phone, X } from 'lucide-react';
import { sendContact } from '@/lib/contactSubmit';
import { trackEvent } from '@/lib/analytics';
import { useTurnstile } from '@/lib/turnstile';
import { clearDraft, readDraft, writeDraft } from '@/lib/quoteDraft';
import { HOURS_SHORT, PHONE_DISPLAY, PHONE_HREF, SMS_QUOTE_HREF } from '@/lib/contact';

/*
 * NEW VERSION of the site's quote popup (src/components/QuoteChooser.tsx),
 * redesigned from its functions up as a quote BUILDER: one question per
 * screen, answers advance on tap (or keys 1–9), and on desktop a navy side
 * panel fills in "Your quote" live, with texting and calling always one tap
 * away. It lives only on /landing for now and will replace the original.
 *
 * WHAT IT MUST KEEP DOING (it does):
 *  - Three ways in: text photos, call, or the form. Phones put texting first.
 *  - The form's service-specific questions, and the exact payload field names
 *    and values the original sends to /api/contact (plus its own source).
 *  - Draft save/restore through src/lib/quoteDraft.ts, in the original's
 *    shape (step1 = contact + service, step2 = answers), so a half-filled
 *    request carries between the two popups.
 *  - Honeypot, Turnstile, and the generate_lead event.
 *
 * Contact details are asked LAST, after the pool questions: someone who has
 * answered a few taps is far more likely to finish than someone met with a
 * contact form first.
 */
const LEAD_SOURCE = 'landing-quote-chooser';

type Service = 'weekly' | 'green' | 'repair' | 'commercial' | 'other';

type Question = {
  key: string;
  title: string;
  /** The label in the side panel's summary. */
  summary: string;
  /** 'size' is a choice shown as the visual size picker. */
  kind: 'choice' | 'size' | 'text';
  options?: [string, string][];
  optional?: boolean;
  placeholder?: string;
};

const SERVICES: [Service, string, string][] = [
  ['weekly', 'Weekly pool cleaning', 'Cleaning, chemicals and a report, every week'],
  ['green', 'Green pool recovery', 'Bring a green or cloudy pool back'],
  ['repair', 'Equipment issue', 'Pump, filter, heater, lights and more'],
  ['commercial', 'Commercial or HOA pool', 'Condos, HOAs, hotels and clubs'],
  ['other', 'Something else', 'Tell us what you need'],
];

// Pool size, asked the way people can actually answer: by picturing it, not
// in gallons. Values are the original popup's (small/medium/large/unsure). The
// rough dimensions were checked against typical depths so each lands in its
// gallon range: 12×24 ft ≈ 9,700 gal, 15×30 ≈ 16,800, 20×40 ≈ 33,000.
const SIZE: [string, string][] = [
  ['small', 'Small'],
  ['medium', 'Medium'],
  ['large', 'Large'],
  ['unsure', 'Not sure'],
];
// Drawn at one scale (2 units per foot) so the three compare honestly. `cars`
// puts length in terms people can picture: a car is about 15–16 ft long.
const SIZE_DIMS: Record<string, { ft: string; cars: string; w: number; h: number }> = {
  small: { ft: '12 × 24 ft', cars: '1½ car lengths', w: 48, h: 24 },
  medium: { ft: '15 × 30 ft', cars: '2 car lengths', w: 60, h: 30 },
  large: { ft: '20 × 40 ft', cars: '2½ car lengths', w: 80, h: 40 },
};

// Field names and values match the original popup's, so leads read the same.
const QUESTIONS: Record<Service, Question[]> = {
  weekly: [
    { key: 'poolSize', title: 'About how big is your pool?', summary: 'Size', kind: 'size', options: SIZE },
    {
      key: 'poolType',
      title: 'Saltwater or chlorine?',
      summary: 'Type',
      kind: 'choice',
      options: [
        ['salt', 'Saltwater'],
        ['chlorine', 'Traditional chlorine'],
        ['unsure', 'Not sure'],
      ],
    },
    {
      key: 'screenEnclosure',
      title: 'Is it screened in?',
      summary: 'Screen',
      kind: 'choice',
      options: [
        ['yes', 'Yes, screened'],
        ['no', 'No, open'],
      ],
    },
    {
      key: 'debrisLoad',
      title: 'How many trees are around it?',
      summary: 'Trees',
      kind: 'choice',
      options: [
        ['low', 'Little to none'],
        ['medium', 'Some trees nearby'],
        ['high', 'Lots, heavy debris'],
      ],
    },
  ],
  green: [
    {
      key: 'greenSeverity',
      title: 'How green is it?',
      summary: 'Condition',
      kind: 'choice',
      options: [
        ['tint', 'Slight tint, mostly clear'],
        ['cloudy', 'Cloudy green'],
        ['opaque', 'Can’t see the bottom'],
        ['debris', 'Algae and debris, full neglect'],
      ],
    },
    { key: 'greenSize', title: 'About how big is the pool?', summary: 'Size', kind: 'size', options: SIZE },
    {
      key: 'greenNotes',
      title: 'Anything else we should know?',
      summary: 'Notes',
      kind: 'text',
      optional: true,
      placeholder: 'Is the equipment running? When was it last serviced?',
    },
  ],
  repair: [
    {
      key: 'repairEquipment',
      title: 'What needs attention?',
      summary: 'Equipment',
      kind: 'choice',
      options: [
        ['pump', 'Pump'],
        ['filter', 'Filter'],
        ['salt-cell', 'Salt cell'],
        ['heater', 'Heater'],
        ['lights', 'Lights'],
        ['automation', 'Automation or controls'],
        ['multiple', 'Multiple items'],
        ['unsure', 'Not sure, help me diagnose'],
      ],
    },
    {
      key: 'repairIssue',
      title: 'What’s it doing?',
      summary: 'Issue',
      kind: 'text',
      placeholder: 'Sounds, leaks, error codes, when it started…',
    },
  ],
  commercial: [
    {
      key: 'commercialPropertyType',
      title: 'What kind of property?',
      summary: 'Property',
      kind: 'choice',
      options: [
        ['hoa', 'HOA'],
        ['condo', 'Condo or apartment'],
        ['hotel', 'Hotel or resort'],
        ['club', 'Club or gym'],
        ['other', 'Other commercial'],
      ],
    },
    {
      key: 'commercialPoolCount',
      title: 'How many pools?',
      summary: 'Pools',
      kind: 'choice',
      options: [
        ['1', 'One'],
        ['2-3', 'Two or three'],
        ['4+', 'Four or more'],
      ],
    },
    {
      key: 'commercialRole',
      title: 'What’s your role?',
      summary: 'Role',
      kind: 'choice',
      options: [
        ['owner', 'Owner'],
        ['property-manager', 'Property manager'],
        ['board', 'Board member'],
        ['maintenance', 'Maintenance lead'],
        ['other', 'Other'],
      ],
    },
  ],
  other: [
    {
      key: 'otherDetails',
      title: 'What do you need?',
      summary: 'Request',
      kind: 'text',
      placeholder: 'The more detail, the more accurate the quote.',
    },
  ],
};

const ALL_STEP2_KEYS = Object.values(QUESTIONS).flatMap((qs) => qs.map((q) => q.key));

/** How they want the price: sent as `contactPreference` (as the hero form does). */
type Delivery = 'text' | 'email';
type Contact = { name: string; email: string; phone: string; address: string; delivery: Delivery };
const EMPTY_CONTACT: Contact = { name: '', email: '', phone: '', address: '', delivery: 'text' };

type Screen = { kind: 'service' } | { kind: 'question'; q: Question } | { kind: 'contact' } | { kind: 'followup' };

// After a tap, hold the chosen state this long before moving on, so it reads.
const ADVANCE_MS = 180;

const INPUT_CLS =
  'h-12 w-full rounded-[10px] bg-white px-3.5 text-[16px] text-sc-navy ring-1 ring-sc-navy/[0.15] placeholder:text-sc-navy/35 transition focus:outline-none focus:ring-2 focus:ring-sc-blue/60';

const linkCls = 'font-semibold text-sc-navy underline decoration-sc-navy/30 underline-offset-[3px] transition hover:decoration-sc-navy';

export const LandingQuoteChooser = ({
  active,
  onClose,
  onSubmitted,
  preset,
}: {
  /** True while the sheet is open: keyboard shortcuts listen only then. */
  active: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  /**
   * The service, when the page already knows it (/landing: weekly). Switches
   * to the CONTACT-FIRST flow, which matches the hero form: address, name and
   * how to send the price come first and save the lead; the pool questions
   * follow as an optional extra, sent as a second message. Without a preset
   * it's the pick-a-service flow, with contact details last.
   */
  preset?: Service;
}) => {
  const contactFirst = !!preset;
  const turnstile = useTurnstile();
  const [service, setService] = useState<Service | ''>(preset ?? '');
  // Contact-first: the lead has been saved; what follows is optional detail.
  const [leadSent, setLeadSent] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [index, setIndex] = useState(0);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  // The just-tapped answer, shown as chosen until the screen advances.
  const [picked, setPicked] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const questions = useMemo(() => (service ? QUESTIONS[service] : []), [service]);
  const screens: Screen[] = useMemo(() => {
    const qs = questions.map((q) => ({ kind: 'question' as const, q }));
    return contactFirst
      ? [{ kind: 'contact' }, { kind: 'followup' }, ...qs]
      : [{ kind: 'service' }, ...qs, { kind: 'contact' }];
  }, [questions, contactFirst]);
  const screen = screens[Math.min(index, screens.length - 1)];
  // Before a service is picked the flow's length is unknown; assume a typical one.
  const total = service ? screens.length : 5;
  // Question numbering: contact-first puts two screens before question 1.
  const questionNumber = contactFirst ? index - 1 : index;
  const progress = sent ? 1 : (index + 1) / total;

  // Restore a saved draft after mount (never during render: localStorage
  // doesn't exist in the prerender). Resume at the first unanswered screen.
  useEffect(() => {
    const draft = readDraft();
    if (!draft?.service || !(draft.service in QUESTIONS)) return;
    const s = draft.service as Service;
    const a = draft.step2 ?? {};
    const c = draft.step1 ?? {};
    setService(s);
    setAnswers(a);
    setContact({
      name: c.name ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
      delivery: c.contactPreference === 'email' ? 'email' : 'text',
    });
    if (contactFirst) {
      // Answers come after the lead now, so only the contact details carry over.
      if (!c.name && !c.address && !c.phone && !c.email) return;
      setService(preset);
      setAnswers({});
      setIndex(0);
      setRestored(true);
      return;
    }
    const firstGap = QUESTIONS[s].findIndex((q) => !q.optional && !a[q.key]);
    setIndex(firstGap === -1 ? QUESTIONS[s].length + 1 : firstGap + 1);
    setRestored(true);
    // Mount-only: `preset` and `contactFirst` are fixed for the builder's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on every change, in the original popup's draft shape.
  const save = (next: { service?: Service; answers?: Record<string, string>; contact?: Contact; atContact?: boolean }) => {
    const s = next.service ?? service;
    if (!s || leadSent) return;
    writeDraft({
      step: next.atContact ? 1 : 2,
      service: s,
      step1: (({ delivery, ...rest }) => ({ ...rest, contactPreference: delivery, service: s }))(next.contact ?? contact),
      step2: next.answers ?? answers,
    });
  };

  const go = (i: number) => {
    setPicked(null);
    setError(null);
    setIndex(Math.max(0, i));
  };

  const chooseService = (s: Service) => {
    setPicked(s);
    // A different service asks different questions: drop the old answers.
    const nextAnswers = s === service ? answers : {};
    setService(s);
    setAnswers(nextAnswers);
    save({ service: s, answers: nextAnswers });
    trackEvent('quote_start', { source: LEAD_SOURCE, service: s });
    window.setTimeout(() => go(1), ADVANCE_MS);
  };

  const answer = (key: string, value: string, advance: boolean) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    save({ answers: next });
    if (!advance) return;
    setPicked(value);
    // Contact-first, last question: send the details instead of advancing.
    if (contactFirst && index === screens.length - 1) {
      window.setTimeout(() => void sendDetails(next), ADVANCE_MS);
      return;
    }
    window.setTimeout(() => go(index + 1), ADVANCE_MS);
  };

  // Contact-first follow-up: the pool answers as a second message, tied to the
  // lead by the same name and contact details. Server-side, PoolLogic makes one
  // ticket per contact per day, so this adds to the inbox, not a second ticket.
  const sendDetails = async (finalAnswers: Record<string, string>) => {
    setError(null);
    setSubmitting(true);
    const turnstileToken = await turnstile.execute().catch(() => '');
    try {
      await sendContact({
        turnstileToken,
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        address: contact.address.trim(),
        contactPreference: contact.delivery,
        service,
        ...Object.fromEntries(ALL_STEP2_KEYS.map((k) => [k, (finalAnswers[k] ?? '').trim()])),
        poolDetailsFor: 'The quote request this person just sent',
        source: `${LEAD_SOURCE}-details`,
        submittedAt: new Date().toISOString(),
      });
      setSent(true);
      trackEvent('quote_details', { source: LEAD_SOURCE, service });
    } catch (err) {
      setPicked(null);
      setError(`We couldn’t send those answers. Tap one to try again, or call ${PHONE_DISPLAY}.`);
      console.error('Quote builder details failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    clearDraft();
    setService(preset ?? '');
    setAnswers({});
    setContact(EMPTY_CONTACT);
    setRestored(false);
    go(0);
  };

  // Keyboard: 1–9 pick an answer on choice screens (there are no text fields
  // on those screens to type into). Only while the sheet is open.
  useEffect(() => {
    if (!active || sent || picked || submitting) return;
    const opts =
      screen.kind === 'service'
        ? SERVICES.map(([v]) => v)
        : screen.kind === 'question' && screen.q.kind !== 'text'
          ? screen.q.options!.map(([v]) => v)
          : null;
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > opts.length) return;
      e.preventDefault();
      if (screen.kind === 'service') chooseService(opts[n - 1] as Service);
      else if (screen.kind === 'question') answer(screen.q.key, opts[n - 1], true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // A new screen starts at its top and, with a mouse, puts the cursor in its
  // first field (on a phone that would throw up the keyboard uninvited).
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    if (!active || !window.matchMedia('(pointer: fine)').matches) return;
    bodyRef.current
      ?.querySelector<HTMLElement>('textarea, input:not([tabindex="-1"])')
      ?.focus({ preventScroll: true });
  }, [index, active]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    // Honeypot: humans never see `website`. Fake success so bots learn nothing.
    if (String(data.get('website') ?? '').trim()) {
      setSent(true);
      return;
    }
    setError(null);
    setSubmitting(true);
    const turnstileToken = await turnstile.execute().catch(() => '');
    try {
      await sendContact({
        turnstileToken,
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        address: contact.address.trim(),
        contactPreference: contact.delivery,
        service,
        // Every step-2 field, as the original sends them; unused ones are ''
        // and stripped server-side.
        ...Object.fromEntries(ALL_STEP2_KEYS.map((k) => [k, (answers[k] ?? '').trim()])),
        source: LEAD_SOURCE,
        submittedAt: new Date().toISOString(),
      });
      clearDraft();
      onSubmitted?.();
      trackEvent('generate_lead', { source: LEAD_SOURCE, service });
      if (contactFirst) {
        setLeadSent(true);
        go(1);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(`Something went wrong. Please call or text ${PHONE_DISPLAY}.`);
      console.error('Quote builder submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = contact.name.trim().split(/\s+/)[0];

  // ── Pieces (plain functions, not components: a component defined inside
  //    this one would remount on every render and drop focus) ────────────────

  const option = (value: string, label: string, n: number, onPick: () => void, chosen: boolean, hint?: string) => (
    <button
      key={value}
      type="button"
      onClick={onPick}
      aria-pressed={chosen}
      className={`flex w-full items-center gap-3.5 rounded-[12px] px-4 py-3.5 text-left ring-1 transition-[background-color,box-shadow,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue active:scale-[0.99] ${
        chosen ? 'bg-[#eef5fb] ring-2 ring-sc-blue' : 'bg-white ring-sc-navy/[0.12] hover:bg-[#f7fafd] hover:ring-sc-navy/25'
      }`}
    >
      {/* Its keyboard shortcut, shown where there's a keyboard. */}
      <span
        className={`hidden h-6 w-6 shrink-0 place-items-center rounded-[6px] text-[12px] font-semibold tabular-nums ring-1 sm:grid ${
          chosen ? 'bg-sc-blue text-white ring-sc-blue' : 'bg-white text-sc-navy/45 ring-sc-navy/15'
        }`}
      >
        {n}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-semibold text-sc-navy">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] text-sc-navy/55">{hint}</span>}
      </span>
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full transition ${
          chosen ? 'bg-sc-blue text-white' : 'text-transparent ring-1 ring-sc-navy/20'
        }`}
      >
        <Check className="h-3 w-3" strokeWidth={3.5} />
      </span>
    </button>
  );

  // A pool from above, drawn to scale inside the same frame for all three
  // sizes: a stone deck, the water, entry steps in one corner, a soft ripple.
  const poolDrawing = (v: 'small' | 'medium' | 'large', on: boolean) => {
    const d = SIZE_DIMS[v];
    const deck = 5;
    const x = (100 - d.w) / 2;
    const y = (60 - d.h) / 2;
    const id = `water-${v}-${on ? 'on' : 'off'}`;
    return (
      <svg viewBox="0 0 100 60" aria-hidden="true" className="aspect-[100/60] w-full max-w-[100px]">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={on ? '#7cc3e6' : '#a9d7ef'} />
            <stop offset="1" stopColor={on ? '#2f8fcd' : '#5eaedb'} />
          </linearGradient>
        </defs>
        {/* Deck */}
        <rect x={x - deck} y={y - deck} width={d.w + deck * 2} height={d.h + deck * 2} rx={4} fill="#efe9de" />
        {/* Water */}
        <rect x={x} y={y} width={d.w} height={d.h} rx={2} fill={`url(#${id})`} />
        {/* Entry steps, top-left corner */}
        <path d={`M${x} ${y + 7} A7 7 0 0 0 ${x + 7} ${y}`} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1" />
        <path d={`M${x} ${y + 4} A4 4 0 0 0 ${x + 4} ${y}`} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1" />
        {/* Ripple */}
        <path
          d={`M${x + d.w * 0.35} ${y + d.h * 0.55} q3 -2.2 6 0 t6 0 t6 0`}
          fill="none"
          stroke="#fff"
          strokeOpacity="0.55"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const sizePicker = (q: Question) => {
    const chosen = (v: string) => picked === v || (!picked && answers[q.key] === v);
    return (
      <>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {(['small', 'medium', 'large'] as const).map((v) => {
            const d = SIZE_DIMS[v];
            const on = chosen(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => answer(q.key, v, true)}
                aria-label={`${q.options!.find(([o]) => o === v)![1]} pool, about ${d.ft.replace(' × ', ' by ').replace(' ft', ' feet')}`}
                aria-pressed={on}
                className={`relative flex flex-col items-center rounded-[14px] px-2 pb-4 pt-9 text-center ring-1 transition-[background-color,box-shadow,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue active:scale-[0.98] max-[359px]:px-1 ${
                  on ? 'bg-[#eef5fb] ring-2 ring-sc-blue' : 'bg-white ring-sc-navy/[0.12] hover:bg-[#f7fafd] hover:ring-sc-navy/25'
                }`}
              >
                <span
                  className={`absolute right-2.5 top-2.5 grid h-[18px] w-[18px] place-items-center rounded-full transition ${
                    on ? 'bg-sc-blue text-white' : 'text-transparent ring-1 ring-sc-navy/20'
                  }`}
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                </span>
                {poolDrawing(v, on)}
                <span className="mt-3 text-[15.5px] font-semibold text-sc-navy">{q.options!.find(([o]) => o === v)![1]}</span>
                <span className="mt-0.5 whitespace-nowrap text-[12.5px] font-medium tabular-nums text-sc-navy/70 max-[359px]:text-[11px]">
                  {d.ft}
                </span>
                <span className="mt-1 text-[11.5px] leading-tight text-sc-navy/45">≈ {d.cars}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => answer(q.key, 'unsure', true)}
          aria-pressed={chosen('unsure')}
          className={`mt-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-[12px] px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue ${
            chosen('unsure') ? 'bg-[#eef5fb] ring-2 ring-sc-blue' : 'hover:bg-[#f7fafd]'
          }`}
        >
          <span className="text-[14.5px] text-sc-navy/70">
            <span className="font-semibold text-sc-navy">Not sure?</span> That’s fine, we’ll work it out.
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-sc-navy/40" />
        </button>
        <p className="mt-3 text-[13px] text-sc-navy/50">
          A rough guess is fine: the water’s length and width, not the deck.
          <span className="hidden sm:inline"> Press 1–4 to choose.</span>
        </p>
      </>
    );
  };

  const heading = (eyebrow: string, title: string) => (
    <div className="mb-6">
      <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-sc-blue">{eyebrow}</p>
      <h2 className="mt-2 text-balance text-[24px] font-bold leading-[1.15] tracking-[-0.02em] text-sc-navy sm:text-[28px]">
        {title}
      </h2>
    </div>
  );

  // Text and call, for phones: the desktop side panel's navy, one panel with
  // two rows, texting first.
  const altPaths = () => (
    <div className="divide-y divide-white/10 overflow-hidden rounded-[14px] bg-[#1c2e45] shadow-[0_12px_28px_-16px_rgba(10,22,40,0.6)]">
      <a href={SMS_QUOTE_HREF} className="flex items-center gap-3.5 px-4 py-3.5 transition active:bg-white/[0.06]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(160deg,#ffd75a_0%,#ffa203_100%)] text-[#1c2e45] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_14px_-6px_rgba(255,162,3,0.7)]">
          <MessageSquare className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-[15.5px] font-semibold text-white">Text 2 photos</span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#e9b44c]">Fastest</span>
          </span>
          <span className="block text-[13px] text-white/55">One of the pool, one of the equipment</span>
        </span>
      </a>
      <a href={PHONE_HREF} className="flex items-center gap-3.5 px-4 py-3.5 transition active:bg-white/[0.06]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(160deg,#53a5d3_0%,#2676b6_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_-6px_rgba(38,118,182,0.8)]">
          <Phone className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15.5px] font-semibold text-white">Call {PHONE_DISPLAY}</span>
          <span className="block text-[13px] text-white/55">A real person, {HOURS_SHORT}</span>
        </span>
      </a>
    </div>
  );

  // ── Screens ───────────────────────────────────────────────────────────────

  let body: React.ReactNode;
  if (sent) {
    body = (
      <div>
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[#e7f6ee] text-[#13804b]">
          <Check className="h-7 w-7" strokeWidth={3} />
        </span>
        <h2 className="mt-6 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-sc-navy">
          {firstName ? `You’re all set, ${firstName}.` : 'You’re all set.'}
        </h2>
        <p className="mt-2 max-w-md text-[16px] leading-relaxed text-sc-navy/70">
          Your flat-rate price is on its way, usually the same day (Mon–Sat). Questions before then? Call{' '}
          <a href={PHONE_HREF} className={`${linkCls} whitespace-nowrap`}>
            {PHONE_DISPLAY}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 inline-flex h-12 items-center rounded-[10px] bg-sc-navy px-6 text-[15px] font-semibold text-white transition hover:bg-[#1c2f46]"
        >
          Done
        </button>
      </div>
    );
  } else if (screen.kind === 'service') {
    body = (
      <>
        {/* Phones: texting is the easiest way in on a phone, so it leads. */}
        <div className="mb-7 sm:hidden">
          {altPaths()}
          <p className="mt-6 flex items-center gap-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-sc-navy/40">
            <span className="h-px flex-1 bg-sc-navy/10" />
            Or answer a few quick taps
            <span className="h-px flex-1 bg-sc-navy/10" />
          </p>
        </div>
        {heading('Get your flat-rate price', 'What can we help with?')}
        <div className="space-y-2">
          {SERVICES.map(([v, l, hint], i) =>
            option(v, l, i + 1, () => chooseService(v), picked === v || (!picked && service === v), hint),
          )}
        </div>
      </>
    );
  } else if (screen.kind === 'followup') {
    // Contact-first, after the lead is saved: the pool questions, optional.
    body = (
      <div>
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e7f6ee] text-[#13804b]">
          <Check className="h-6 w-6" strokeWidth={3} />
        </span>
        <h2 className="mt-5 text-balance text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-sc-navy sm:text-[28px]">
          {firstName ? `Got it, ${firstName}. Your price is on its way.` : 'Got it. Your price is on its way.'}
        </h2>
        <p className="mt-2 text-[15.5px] leading-relaxed text-sc-navy/70">
          By {contact.delivery === 'text' ? 'text' : 'email'}, usually the same day (Mon–Sat).
        </p>
        <div className="mt-7 rounded-[14px] bg-[#f5f9fd] p-5 ring-1 ring-sc-navy/[0.06]">
          <p className="text-[16px] font-semibold text-sc-navy">Want an exact price, faster?</p>
          <p className="mt-1 text-[14.5px] leading-relaxed text-sc-navy/65">
            {questions.length} quick taps about your pool, and we can price it right the first time. Optional.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={() => go(2)}
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-sc-navy px-5 text-[15px] font-semibold text-white transition hover:bg-[#1c2f46]"
            >
              Answer {questions.length} quick questions
              <ArrowRight className="h-[18px] w-[18px]" />
            </button>
            <button type="button" onClick={() => setSent(true)} className="text-[14.5px] font-medium text-sc-navy/60 hover:text-sc-navy">
              No thanks, I’m done
            </button>
          </div>
        </div>
      </div>
    );
  } else if (screen.kind === 'question') {
    const q = screen.q;
    body = (
      <>
        {heading(`Question ${questionNumber} of ${questions.length}${contactFirst ? ' · Optional' : ''}`, q.title)}
        {error && (
          <p role="alert" className="mb-4 rounded-[10px] bg-red-50 px-3.5 py-2.5 text-[13.5px] font-medium text-red-700">
            {error}
          </p>
        )}
        {submitting && (
          <p role="status" className="mb-4 text-[13.5px] font-medium text-sc-navy/60">
            Sending your answers…
          </p>
        )}
        {q.kind === 'size' ? (
          sizePicker(q)
        ) : q.kind === 'choice' ? (
          <div className={`grid gap-2 ${q.options!.length > 5 ? 'sm:grid-cols-2' : ''}`}>
            {q.options!.map(([v, l], i) =>
              option(v, l, i + 1, () => answer(q.key, v, true), picked === v || (!picked && answers[q.key] === v)),
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              go(index + 1);
            }}
          >
            <textarea
              rows={4}
              required={!q.optional}
              value={answers[q.key] ?? ''}
              onChange={(e) => answer(q.key, e.target.value, false)}
              placeholder={q.placeholder}
              className={`${INPUT_CLS} h-auto resize-none py-3 leading-relaxed`}
            />
            <div className="mt-4 flex items-center gap-4">
              <button
                type="submit"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-sc-navy px-6 text-[15px] font-semibold text-white transition hover:bg-[#1c2f46]"
              >
                Continue
                <ArrowRight className="h-[18px] w-[18px]" />
              </button>
              {q.optional && !answers[q.key] && (
                <button type="button" onClick={() => go(index + 1)} className="text-[14px] font-medium text-sc-navy/55 hover:text-sc-navy">
                  Skip
                </button>
              )}
            </div>
          </form>
        )}
      </>
    );
  } else {
    const set = (k: 'name' | 'email' | 'phone' | 'address') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...contact, [k]: e.target.value };
      setContact(next);
      save({ contact: next, atContact: true });
    };
    const setDelivery = (d: Delivery) => {
      const next = { ...contact, delivery: d };
      setContact(next);
      save({ contact: next, atContact: true });
    };
    const byText = contact.delivery === 'text';
    const label = (text: string, optional: boolean) => (
      <span className="mb-1.5 flex justify-between text-[13px] font-semibold text-sc-navy">
        {text}
        {optional && <span className="font-normal text-sc-navy/45">Optional</span>}
      </span>
    );
    // The channel they choose is required; the other one is optional.
    const phoneField = (
      <label key="phone" className="block">
        {label('Mobile phone', !byText)}
        <input required={byText} name="phone" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" value={contact.phone} onChange={set('phone')} className={INPUT_CLS} />
      </label>
    );
    const emailField = (
      <label key="email" className="block">
        {label('Email', byText)}
        <input required={!byText} name="email" type="email" autoComplete="email" enterKeyHint="next" value={contact.email} onChange={set('email')} className={INPUT_CLS} />
      </label>
    );
    body = (
      <>
        {contactFirst && (
          // Phones: texting is the easiest way in on a phone, so it leads.
          <div className="mb-7 sm:hidden">
            {altPaths()}
            <p className="mt-6 flex items-center gap-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-sc-navy/40">
              <span className="h-px flex-1 bg-sc-navy/10" />
              Or send it here
              <span className="h-px flex-1 bg-sc-navy/10" />
            </p>
          </div>
        )}
        {heading(contactFirst ? 'Get your flat-rate price' : 'Last step', 'Where should we send your price?')}
        <form onSubmit={submit} className="space-y-4">
          {/* Honeypot: hidden from humans, filled by bots; any value drops the request. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px" />
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-sc-navy">Send my price by</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['text', 'Text message', MessageSquare],
                  ['email', 'Email', Mail],
                ] as const
              ).map(([v, l, Icon]) => (
                <label key={v} className="cursor-pointer">
                  <input type="radio" name="contactPreference" value={v} checked={contact.delivery === v} onChange={() => setDelivery(v)} className="peer sr-only" />
                  <span className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-white text-[15px] font-semibold text-sc-navy/80 ring-1 ring-sc-navy/[0.15] transition hover:ring-sc-navy/30 peer-checked:bg-[#eef5fb] peer-checked:text-sc-navy peer-checked:ring-2 peer-checked:ring-sc-blue peer-checked:hover:ring-sc-blue peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sc-blue/60">
                    <Icon className="h-[18px] w-[18px] text-sc-blue" strokeWidth={2} />
                    {l}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {/* Two columns on desktop so the step fits without scrolling: name
              beside the channel they chose, address beside the optional one.
              Phones stack them in that same order. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              {label('Full name', false)}
              <input required name="name" autoComplete="name" autoCapitalize="words" enterKeyHint="next" value={contact.name} onChange={set('name')} className={INPUT_CLS} />
            </label>
            {byText ? phoneField : emailField}
            <label className="block">
              {label('Pool address', false)}
              <input
                required
                name="address"
                autoComplete="street-address"
                autoCapitalize="words"
                enterKeyHint="next"
                value={contact.address}
                onChange={set('address')}
                placeholder="Street, city"
                className={INPUT_CLS}
              />
            </label>
            {byText ? emailField : phoneField}
          </div>
          {error && (
            <p role="alert" className="rounded-[10px] bg-red-50 px-3.5 py-2.5 text-[13.5px] font-medium text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#ffbf2f,#ffa90a)] text-[16px] font-semibold text-[#1f3149] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_14px_-6px_rgba(230,140,0,0.55)] transition hover:brightness-[1.03] disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? 'Sending…' : 'Get my flat-rate price'}
            {!submitting && <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />}
          </button>
          <p className="text-[11.5px] leading-relaxed text-sc-navy/45">
            By submitting, you agree to get texts about your request from Suncoast Pool Pros. Msg &amp; data rates may
            apply. Reply STOP to opt out.
          </p>
        </form>
      </>
    );
  }

  // The side panel's summary: every line the quote will have, filled in as
  // it's answered ("—" until then), like a spec sheet rather than an empty box.
  const pending = '—';
  const questionRows = questions.map((q): [string, string] => {
    const v = answers[q.key];
    if (!v) return [q.summary, pending];
    if (q.kind === 'size' && SIZE_DIMS[v]) return [q.summary, `${q.options!.find(([o]) => o === v)![1]}, ~${SIZE_DIMS[v].ft}`];
    return [q.summary, q.kind === 'choice' || q.kind === 'size' ? (q.options!.find(([o]) => o === v)?.[1] ?? v) : 'Added'];
  });
  const summary: [string, string][] = contactFirst
    ? [
        ['Service', SERVICES.find(([v]) => v === service)![1]],
        ['Address', contact.address.trim() || pending],
        ['Send price by', contact.delivery === 'text' ? 'Text message' : 'Email'],
        ...questionRows,
      ]
    : service
    ? [
        ['Service', SERVICES.find(([v]) => v === service)![1]],
        ...questions.map((q): [string, string] => {
          const v = answers[q.key];
          if (!v) return [q.summary, pending];
          if (q.kind === 'size' && SIZE_DIMS[v]) return [q.summary, `${q.options!.find(([o]) => o === v)![1]}, ~${SIZE_DIMS[v].ft}`];
          return [q.summary, q.kind === 'choice' || q.kind === 'size' ? (q.options!.find(([o]) => o === v)?.[1] ?? v) : 'Added'];
        }),
        ['Send price by', screen.kind === 'contact' || sent ? (contact.delivery === 'text' ? 'Text message' : 'Email') : pending],
      ]
    : [
        ['Service', pending],
        ['Pool details', pending],
        ['Contact', pending],
      ];

  return (
    <div className="flex h-full min-h-0 w-full flex-col text-left sm:grid sm:grid-cols-[300px_minmax(0,1fr)]">
      {/* Turnstile: invisible, mounted for the builder's whole life. */}
      <div ref={turnstile.containerRef} aria-hidden="true" className="absolute -left-[9999px] h-px w-px" />

      {/* ── Side panel (desktop): the quote taking shape, and the other ways in */}
      <aside className="hidden flex-col overflow-y-auto overflow-x-hidden bg-[#1c2e45] px-7 pb-6 pt-7 text-white sm:flex">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Suncoast Pool Pros</p>
        <p className="mt-5 border-b border-white/15 pb-3 text-[17px] font-semibold tracking-[-0.01em]">Quote request</p>
        <dl className="text-[13px]">
          {summary.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 border-b border-white/[0.07] py-2">
              <dt className="shrink-0 text-white/50">{k}</dt>
              <dd className={`text-right tabular-nums ${v === pending ? 'text-white/25' : 'qb-in font-medium text-white'}`}>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 flex items-center gap-2 text-[12.5px] text-white/55">
          <Check className="h-3.5 w-3.5 text-white/55" strokeWidth={2.5} />
          Flat monthly rate, chemicals included
        </p>

        <div className="mt-auto pt-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">Other ways to reach us</p>
          <a href={SMS_QUOTE_HREF} className="group flex items-center gap-3 border-b border-white/[0.07] py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] ring-1 ring-white/15">
              <MessageSquare className="h-4 w-4 text-white/80" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2 text-[13.5px] font-medium text-white group-hover:underline group-hover:underline-offset-[3px]">
                Text 2 photos
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#e9b44c]">Fastest</span>
              </span>
              <span className="block text-[12px] text-white/45">Pool and equipment photos</span>
            </span>
          </a>
          <a href={PHONE_HREF} className="group flex items-center gap-3 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] ring-1 ring-white/15">
              <Phone className="h-4 w-4 text-white/80" strokeWidth={2} />
            </span>
            <span>
              <span className="block text-[13.5px] font-medium text-white group-hover:underline group-hover:underline-offset-[3px]">
                Call {PHONE_DISPLAY}
              </span>
              <span className="block text-[12px] text-white/45">A real person, Mon–Sat</span>
            </span>
          </a>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-3 px-4 pb-2 pt-4 sm:px-8 sm:pt-6">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0 || sent || submitting || (leadSent && index <= 1)}
            aria-label="Back"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] text-sc-navy/60 transition hover:bg-sc-navy/[0.06] hover:text-sc-navy disabled:invisible"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <div
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-sc-navy/[0.08]"
          >
            {/* scaleX, not width: a transform animates on the compositor. */}
            <div
              className="h-full origin-left rounded-full bg-sc-blue transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] text-sc-navy/60 transition hover:bg-sc-navy/[0.06] hover:text-sc-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-12 sm:pb-10 sm:pt-8">
          {restored && !sent && (
            <p className="mb-6 flex items-center justify-between gap-3 rounded-[10px] bg-[#f5f9fd] px-3.5 py-2.5 text-[13px] text-sc-navy/70">
              <span>
                <span className="font-semibold text-sc-navy">Welcome back.</span> We saved your answers.
              </span>
              <button type="button" onClick={startOver} className={`${linkCls} shrink-0`}>
                Start over
              </button>
            </p>
          )}
          {/* Re-keyed per screen, so each one eases in. */}
          <div key={sent ? 'sent' : index} className="qb-in">
            {body}
          </div>
          {!sent && screen.kind !== 'service' && (
            <p className="mt-8 text-[13px] text-sc-navy/50 sm:hidden">
              Rather not type?{' '}
              <a href={SMS_QUOTE_HREF} className={linkCls}>
                Text 2 photos
              </a>{' '}
              or{' '}
              <a href={PHONE_HREF} className={linkCls}>
                call us
              </a>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
