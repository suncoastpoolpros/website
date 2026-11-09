import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  EyeOff,
  Home,
  KeyRound,
  MapPin,
  MessageSquareText,
  Phone,
  Plane,
  Plus,
  XCircle,
} from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { useQuoteFormSubmit } from '@/components/ServiceQuoteForm';
import { QuoteSegment } from '@/components/landing/QuoteSegment';
import {
  Container,
  Eyebrow,
  PhoneButton,
  QuoteButton,
  buttonClass,
  h2,
  lead,
  leadOnDark,
  sectionY,
} from '@/components/landing/sectionKit';
import { treasureIslandFaqs } from '@/pages/treasureIslandFaqs';
import { HOURS_SHORT, PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { REVIEWS } from '@/lib/reviews';

/*
 * Everything below the Treasure Island hero, on the homepage design system
 * (sectionKit, the sc-* tokens, the gold/navy buttons), as Clearwater and
 * Seminole are, with this page's own angle: owners who aren't there. Built for
 * absentee owners (white into mist), the two ways rental pools fail (mist),
 * how it runs (dark), what usually goes wrong (white), service area (mist),
 * FAQ (white), quote (dark), guides (white). Every "Get my price" below the
 * hero opens the quote popup; the hero keeps its address search.
 *
 * Techs alternate, so nothing here promises one permanent person: the fixed
 * things are the day, the route and the documented checklist.
 */

const muted = 'text-sc-muted';
const focusRing = 'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue';
const card = 'rounded-[20px] bg-white shadow-[0_0_0_1px_rgba(36,58,85,0.08)]';

/** Named in the hero bar, the service area and the schema. */
export const NEIGHBORHOODS = ['Sunset Beach', 'Isle of Capri', 'Isle of Palms', 'Paradise Island', 'Sunshine Beach'];
export const ZIPS = ['33706'];

// ── A. Built for absentee owners ──────────────────────────────────────────

const REVIEW = REVIEWS.find((r) => r.name === 'Jack K.') ?? REVIEWS[0];

const ABSENTEE = [
  {
    icon: KeyRound,
    title: 'Familiar faces who know your property',
    body: 'Background-checked techs on a consistent route learn your gate code, your equipment and where the cleaner leaves the key. Every visit runs off a documented checklist, so nothing depends on one person remembering.',
  },
  {
    icon: Camera,
    title: 'Photo proof in your inbox after every visit',
    body: 'A timestamped report: what was done, what your water read, photos of the pool. Forward it to a guest or your property manager, or keep it for your records.',
  },
  {
    icon: Home,
    title: 'Guest-ready between bookings',
    body: 'Weekly visits keep the pool balanced and clear going into your busy days. If a booking lands on the wrong side of the schedule, we can add a paid turnover clean. Just text us the date.',
  },
  {
    icon: Plane,
    title: 'Looked after through the off-season',
    body: "Heading north for the summer? We catch slow algae, salt-cell wear and water-level problems early, so you come back to the pool you left.",
  },
];

const AbsenteeOwners = () => (
  <section aria-labelledby="ti-owners-title" className="bg-[linear-gradient(#fff,#f5f9fd)] pb-20 pt-16 sm:pb-24 lg:pb-28 lg:pt-[88px]">
    <Container>
      <div className="grid items-end gap-10 min-[960px]:grid-cols-[1.1fr_0.9fr] min-[960px]:gap-16">
        <div>
          <Eyebrow>Built for absentee owners</Eyebrow>
          <h2 id="ti-owners-title" className={`${h2} text-sc-navy`}>
            Pool service that works when you&rsquo;re not there.
          </h2>
          <p className={`${lead} max-w-[36rem]`}>
            Most of our Treasure Island customers don&rsquo;t live at the pool we service. Vacation rentals, snowbird
            homes, family beach houses: our weekly service is built around how owning from a distance actually works.
          </p>
        </div>

        <figure className={`${card} p-6 sm:p-7`}>
          <p role="img" aria-label="Rated 5 out of 5" className="text-[14px] leading-none tracking-[0.06em] text-sc-gold">
            ★★★★★
          </p>
          <blockquote className="mt-3 text-[16px] font-medium leading-[1.55] text-sc-navy">“{REVIEW.quote}”</blockquote>
          <figcaption className={`mt-4 flex items-center gap-2.5 text-[13.5px] ${muted}`}>
            <span
              aria-hidden="true"
              className="cw-tile grid h-8 w-8 place-items-center rounded-full text-[14px] font-semibold text-white"
            >
              {REVIEW.name.charAt(0)}
            </span>
            {REVIEW.name} · Google review
          </figcaption>
        </figure>
      </div>

      <ul className="mt-12 grid gap-5 md:grid-cols-2">
        {ABSENTEE.map((p) => (
          <li key={p.title} className={`${card} flex gap-5 p-7`}>
            <span aria-hidden="true" className="cw-tile grid h-11 w-11 shrink-0 place-items-center rounded-[12px] text-white">
              <p.icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h3 className="text-[18px] font-[650] leading-snug tracking-[-0.015em] text-sc-navy">{p.title}</h3>
              <p className={`mt-2 text-[15px] leading-[1.6] ${muted}`}>{p.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

// ── B. The two ways rental pools fail ─────────────────────────────────────

const GAPS = [
  {
    icon: Home,
    when: 'During a booking',
    title: 'The guest gap',
    body: [
      'A pool with six guests in it on a hot afternoon burns through sanitizer in a way an empty pool never does. Sunscreen, sweat and warm Gulf air can drop free chlorine to unsafe levels in a single day, even if the pool looked perfect at check-in.',
      "So we chlorinate against a rental's real traffic, and every weekly visit leaves headroom for the days in between. What your guests step into is sanitary water, not water that only looks clean.",
    ],
    listTitle: 'The “looks fine, isn’t” risk',
    list: ['Hot-tub rash bacteria (Pseudomonas)', 'Recreational water illness exposure', 'Bad reviews tied to “the pool”', 'Refund requests after the stay'],
  },
  {
    icon: EyeOff,
    when: 'Between bookings',
    title: 'The vacant-house gap',
    body: [
      "The opposite failure: a pool quietly drifts while nobody's watching. A salt cell crusts up, a pump seal weeps, stabilizer climbs until chlorine stops working. By the next check-in it's a recovery job instead of a routine week.",
      'Weekly visits mean nothing drifts for more than seven days. We spot the small thing and flag it in your report, before it becomes a guest-facing problem.',
    ],
    listTitle: 'What we catch early',
    list: ['Salt-cell scaling & voltage drop', 'Pump bearing & seal wear', 'Stabilizer (CYA) creep', 'Filter pressure trending up'],
  },
];

const RentalGaps = () => (
  <section aria-labelledby="ti-gaps-title" className={`bg-sc-mist ${sectionY}`}>
    <Container>
      <div className="max-w-[44rem]">
        <Eyebrow>How rental pools quietly fail</Eyebrow>
        <h2 id="ti-gaps-title" className={`${h2} text-sc-navy`}>
          Two problems most absentee owners never see.
        </h2>
        <p className={lead}>
          A pool can be failing two different ways at once: one that bites during a booking, one that bites between
          them. Most weekly services only watch for one. We watch for both.
        </p>
      </div>

      <div className="mt-12 grid gap-5 min-[960px]:grid-cols-2">
        {GAPS.map((g) => (
          <article key={g.title} className={`${card} p-7 sm:p-8`}>
            <div className="flex items-center gap-3.5">
              <span aria-hidden="true" className="cw-tile grid h-11 w-11 shrink-0 place-items-center rounded-[12px] text-white">
                <g.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-sc-blue">{g.when}</p>
                <h3 className="text-[21px] font-[650] leading-tight tracking-[-0.02em] text-sc-navy">{g.title}</h3>
              </div>
            </div>
            {g.body.map((para) => (
              <p key={para.slice(0, 24)} className={`mt-4 text-[15px] leading-[1.65] ${muted}`}>
                {para}
              </p>
            ))}
            <div className="mt-6 rounded-[14px] bg-sc-mist p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sc-navy/60">{g.listTitle}</p>
              <ul className="mt-3 grid gap-2">
                {g.list.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14.5px] leading-snug text-sc-navy/85">
                    <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sc-blue" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </Container>
  </section>
);

// ── C. How it runs ────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: CalendarCheck,
    title: 'A set day, every week',
    body: "Your pool is on a set route with a set day and the same checklist. You don't have to coordinate, remind us or check in. It just happens.",
  },
  {
    icon: Camera,
    title: 'Photo report after every visit',
    body: 'Within the hour you get a report by email: chemistry readings, what was done, condition photos. Forward it to whoever needs it.',
  },
  {
    icon: MessageSquareText,
    title: 'A real person, wherever you are',
    body: 'Need a turnover clean, a heads-up before guests arrive, or us to coordinate with your cleaner? Text or call for a same-day reply.',
  },
];

const darkChip =
  'inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3.5 py-2 text-[13.5px] font-medium text-white ring-1 ring-inset ring-white/14';

const HowItRuns = () => (
  <section aria-labelledby="ti-runs-title" className={`cw-dark relative overflow-hidden ${sectionY}`}>
    <div aria-hidden="true" className="cw-dark-glow absolute inset-0" />
    <Container className="relative">
      <Eyebrow gold>How weekly service runs</Eyebrow>
      <h2 id="ti-runs-title" className={`${h2} text-white`}>
        You don&rsquo;t manage it. We do.
      </h2>
      <p className={`${leadOnDark} max-w-[36rem]`}>
        The whole point of weekly service is one less thing in your inbox. Here&rsquo;s how it runs in the background.
      </p>

      <ol className="mt-12 grid gap-5 min-[960px]:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-[20px] bg-white/[0.06] p-7 ring-1 ring-inset ring-white/10">
            <div className="flex items-center justify-between">
              <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-[linear-gradient(#ffbf2f,#ffa90a)] text-sc-ink">
                <s.icon className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span aria-hidden="true" className="text-[34px] font-[650] leading-none tracking-[-0.04em] text-white/15">
                0{i + 1}
              </span>
            </div>
            <h3 className="mt-5 text-[19px] font-[650] leading-snug text-white">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-[1.6] text-white/[0.72]">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-8">
        <ul className="flex flex-wrap gap-2.5">
          {['Always Blue Guarantee', 'Photo report every visit', 'GPS-verified service'].map((t) => (
            <li key={t} className={darkChip}>
              <Check aria-hidden="true" className="h-4 w-4 text-sc-glacier" strokeWidth={2.5} />
              {t}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <PhoneButton onDark />
          <QuoteButton />
        </div>
      </div>
    </Container>
  </section>
);

// ── D. What usually goes wrong ────────────────────────────────────────────

const PAIRS = [
  {
    failure: "You don't know if anyone came",
    failureDetail:
      "No report, no photo, no proof. You're a thousand miles away, finding out from a guest's review whether the pool was serviced this week.",
    us: 'A documented report in your inbox every visit',
    usDetail: 'Photos and chemistry readings land in your email after every clean. Forward them, or just keep the paper trail.',
  },
  {
    failure: 'Nobody knows your property',
    failureDetail:
      "Whoever shows up doesn't know the gate code, the cleaner's schedule, or that the salt cell needs a closer look. Things get missed.",
    us: 'Familiar faces and a documented checklist',
    usDetail:
      'Background-checked techs on a consistent route who learn your access and equipment, and the same checklist on every visit, so even a fill-in tech starts from your pool’s history.',
  },
  {
    failure: 'Surcharges that show up at month-end',
    failureDetail:
      '“High demand” fees, “extra acid” lines, storm charges you can’t verify because you weren’t there. The bill drifts up and the explanation never lands.',
    us: 'One flat monthly rate, all standard chemicals',
    usDetail:
      'The chemicals your pool goes through week to week are inside the monthly figure. A cleanup beyond weekly care, like after a storm, is priced and approved by you first.',
  },
  {
    failure: 'Missed visits that surface during a booking',
    failureDetail:
      "The pool got skipped two weeks ago, and you find out when a guest texts a green-pool photo on day one of their stay.",
    us: 'GPS-verified weekly visits and a real person to text',
    usDetail: "Every visit is GPS-confirmed at the property. If something's off, we tell you that day, not after the next guest is in the house.",
  },
];

const WhatGoesWrong = () => (
  <section aria-labelledby="ti-wrong-title" className={`bg-white ${sectionY}`}>
    <Container>
      <div className="mx-auto max-w-[44rem] text-center">
        <Eyebrow centered>What goes wrong with most services</Eyebrow>
        <h2 id="ti-wrong-title" className={`${h2} text-sc-navy`}>
          Four ways rental owners get burned.
        </h2>
        <p className={`${lead} mx-auto max-w-[38rem]`}>
          If you&rsquo;ve owned a Treasure Island rental for a while, you&rsquo;ve probably hit one of these. Here&rsquo;s
          how our service is built to stop them.
        </p>
      </div>

      <ul className="mt-12 grid gap-4">
        {PAIRS.map((p) => (
          <li key={p.failure} className={`${card} grid overflow-hidden min-[860px]:grid-cols-2`}>
            <div className="border-b border-sc-navy/[0.08] bg-sc-mist/60 p-6 sm:p-7 min-[860px]:border-b-0 min-[860px]:border-r">
              <p className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-sc-navy/50">
                <XCircle aria-hidden="true" className="h-4 w-4" />
                What usually happens
              </p>
              <h3 className="mt-2.5 text-[17px] font-[650] leading-snug text-sc-navy/80">{p.failure}</h3>
              <p className={`mt-1.5 text-[14.5px] leading-[1.6] ${muted}`}>{p.failureDetail}</p>
            </div>
            <div className="p-6 sm:p-7">
              <p className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-sc-blue">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                How we run it
              </p>
              <h3 className="mt-2.5 text-[17px] font-[650] leading-snug text-sc-navy">{p.us}</h3>
              <p className={`mt-1.5 text-[14.5px] leading-[1.6] ${muted}`}>{p.usDetail}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="cw-dark relative mt-12 grid items-center gap-6 overflow-hidden rounded-[24px] px-6 py-8 sm:px-12 sm:py-11 min-[860px]:grid-cols-[1fr_auto]">
        <div className="relative">
          <Eyebrow gold>Off your plate</Eyebrow>
          <h3 className="mt-3 text-[24px] font-[650] leading-[1.15] tracking-[-0.03em] text-white sm:text-[28px]">
            Guest-ready. Protected. Handled.
          </h3>
          <p className="mt-2.5 max-w-[34rem] text-[16px] text-white/75">
            One flat monthly rate covers the weekly visit, the chemistry and the photo proof. Nothing to sign, nothing
            tacked on.
          </p>
        </div>
        <QuoteButton className="relative justify-self-start min-[860px]:justify-self-end" />
      </div>
    </Container>
  </section>
);

// ── E. Service area ───────────────────────────────────────────────────────

const chip = 'inline-flex rounded-full bg-white px-[13px] py-[7px] text-[14px] font-medium text-sc-navy ring-1 ring-sc-navy/10';
// Padding stretches the tap target to 44px; the negative margin keeps the line.
const areaLink = `-my-3 inline-block py-3 font-semibold text-sc-blue underline decoration-sc-blue/30 decoration-1 underline-offset-[3px] transition hover:decoration-sc-blue ${focusRing}`;

const ServiceArea = () => (
  <section aria-labelledby="ti-area-title" className={`bg-sc-mist ${sectionY}`}>
    <Container className="grid items-start gap-12 min-[960px]:grid-cols-[0.95fr_1.05fr] min-[960px]:gap-16">
      <div>
        <Eyebrow>Across the island</Eyebrow>
        <h2 id="ti-area-title" className={`${h2} text-sc-navy`}>
          Pool service on every corner of Treasure Island.
        </h2>
        <p className={lead}>
          From the beach side to the bayside canals, on a set day every week, whether the house is full of guests or
          sitting empty.
        </p>
        <p className={`mt-6 text-[15px] leading-[1.6] ${muted}`}>
          Our trucks also run{' '}
          <Link to="/st-pete-beach-fl/" className={areaLink}>
            pool service in St. Pete Beach
          </Link>{' '}
          and{' '}
          <Link to="/seminole-fl/" className={areaLink}>
            pool cleaning in Seminole
          </Link>
          , just across the bridges.
        </p>
        <QuoteButton label="Check my address" className="mt-[26px]" />
      </div>

      <div className={`${card} px-[26px] py-6`}>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-sc-blue">Treasure Island neighborhoods</h3>
          <p className={`text-[13px] ${muted}`}>{NEIGHBORHOODS.length} areas</p>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {NEIGHBORHOODS.map((n) => (
            <li key={n} className={`${chip} bg-sc-mist`}>
              {n}
            </li>
          ))}
        </ul>
        <p className={`mt-5 flex items-center gap-2 text-[14px] ${muted}`}>
          <MapPin aria-hidden="true" className="h-4 w-4 text-sc-blue" />
          <span className="font-semibold text-sc-navy">ZIP code:</span> {ZIPS.join(' · ')}
        </p>
        <p className={`mt-4 border-t border-sc-navy/[0.08] pt-4 text-[14px] leading-[1.6] ${muted}`}>
          Don&rsquo;t see your street? If the pool has a Treasure Island address, a truck likely already passes it.
        </p>
      </div>
    </Container>
  </section>
);

// ── F. FAQ ────────────────────────────────────────────────────────────────

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section aria-labelledby="ti-faq-title" className={`bg-white ${sectionY}`}>
      <Container className="grid items-start gap-10 min-[960px]:grid-cols-[0.8fr_1.2fr] min-[960px]:gap-16">
        <div>
          <Eyebrow>Treasure Island pool service</Eyebrow>
          <h2 id="ti-faq-title" className={`${h2} text-sc-navy`}>
            Questions, answered.
          </h2>
          <div className="mt-7 rounded-[18px] bg-sc-mist p-[22px]">
            <p className="text-[16px] font-bold text-sc-navy">Rather talk to a person?</p>
            <p className={`mt-1 text-[14px] ${muted}`}>{HOURS_SHORT}. Same-day reply on texts.</p>
            <a
              href={PHONE_HREF}
              className={`mt-2 inline-flex min-h-11 items-center gap-2 text-[18px] font-semibold text-sc-navy ${focusRing}`}
            >
              <Phone aria-hidden="true" className="h-[18px] w-[18px] text-sc-blue" />
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>

        {/* Every answer ships in the prerendered HTML: closed panels collapse to
            zero height (.faq-answer) rather than unmounting. */}
        <div className="border-t border-sc-navy/10">
          {treasureIslandFaqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.q} className={`faq-item border-b border-sc-navy/10 ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    id={`ti-faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`ti-faq-a-${i}`}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left text-[16.5px] font-semibold text-sc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue"
                  >
                    {faq.q}
                    <span
                      aria-hidden="true"
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sc-mist text-sc-blue transition-transform duration-200 ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  </button>
                </h3>
                <div className="faq-answer">
                  <div className="faq-answer-inner">
                    <p
                      id={`ti-faq-a-${i}`}
                      role="region"
                      aria-labelledby={`ti-faq-q-${i}`}
                      className={`mb-5 max-w-[40rem] text-[15.5px] leading-[1.65] ${muted}`}
                    >
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

// ── G. Quote ──────────────────────────────────────────────────────────────

// Same field names and values as the form this replaced (homeUse,
// guestTurnover); the submit is useQuoteFormSubmit, shared with
// ServiceQuoteForm, so the lead arrives as before.
const USE_OPTIONS = [
  { value: 'own-home', label: 'Our home' },
  { value: 'rental', label: 'Rental' },
  { value: 'seasonal', label: 'Seasonal' },
];
const TURNOVER_OPTIONS = [
  { value: 'weekend', label: 'Fri / Sat' },
  { value: 'midweek', label: 'Midweek' },
  { value: 'varies', label: 'It varies' },
  { value: 'not-rental', label: 'Not a rental' },
];

const fieldLabel = `mb-1.5 mt-4 block text-[12px] font-semibold ${muted}`;
// 16px on phones so iOS doesn't zoom into the field on focus.
const inputClass =
  'h-[46px] w-full rounded-[10px] bg-white px-3.5 text-base text-sc-navy ring-1 ring-inset ring-sc-navy/15 transition outline-none focus:ring-2 focus:ring-sc-blue min-[960px]:text-[15px]';

const QuoteSection = () => {
  const { submitted, setSubmitted, loading, error, turnstile, handleSubmit } =
    useQuoteFormSubmit('treasure-island-quote-form');

  return (
    <section id="quote" aria-labelledby="ti-quote-title" className={`cw-dark scroll-mt-24 ${sectionY}`}>
      <Container className="grid items-center gap-12 min-[960px]:grid-cols-2 min-[960px]:gap-14">
        <div>
          <Eyebrow gold>Your Treasure Island quote</Eyebrow>
          <h2 id="ti-quote-title" className={`${h2} text-white`}>
            Guest-ready pool service, priced before you book.
          </h2>
          <p className={`${leadOnDark} max-w-[36rem]`}>
            Tell us whether it&rsquo;s your home or a rental and when guests usually arrive. We&rsquo;ll set the service
            day around your calendar and send one flat monthly price the same day.
          </p>
          <ul className="mt-6 grid gap-3">
            {[
              'Service day set around check-ins, not the other way round',
              'A photo report after every visit you can forward to your manager',
              'One flat rate, chemicals included, no contract',
            ].map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15.5px] leading-snug text-white/90">
                <Check aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sc-glacier" strokeWidth={2.5} />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[14.5px] leading-[1.6] text-white/70">
            Photos of the pool and equipment pad help. Text them to{' '}
            <a
              href={PHONE_HREF}
              className="-my-3 inline-block whitespace-nowrap py-3 font-bold text-white underline decoration-white/40 underline-offset-[3px] hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {PHONE_DISPLAY}
            </a>
            .
          </p>
        </div>

        <div className="rounded-[22px] bg-white p-6 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.5)] sm:p-[30px]">
          {submitted ? (
            <div className="py-6 text-center">
              <CheckCircle aria-hidden="true" className="mx-auto h-12 w-12 text-[#0e9f57]" />
              <h3 className="mt-4 text-[20px] font-[650] text-sc-navy">Got it — we will be in touch today.</h3>
              <p className={`mt-2 text-[15px] leading-[1.6] ${muted}`}>
                We will come back with your flat weekly rate and a service day that lands ahead of your guests.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className={`mt-6 text-[15px] font-semibold text-sc-blue underline decoration-sc-blue/30 underline-offset-[3px] hover:decoration-sc-blue ${focusRing}`}
              >
                Send another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative">
              {/* Honeypot: off-screen and out of the tab order; bots fill it. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-px w-px"
              />
              <div ref={turnstile.containerRef} aria-hidden="true" className="absolute -left-[9999px] h-px w-px" />
              <input type="hidden" name="service" value="weekly" />

              <h3 className="text-[20px] font-[650] leading-tight text-sc-navy">Get your Treasure Island pool cleaning price</h3>
              <p className={`mt-1 text-[14px] ${muted}`}>Takes about a minute. No obligation.</p>

              <QuoteSegment
                name="homeUse"
                label="How is the property used?"
                options={USE_OPTIONS}
                missingText="Choose how the property is used."
              />
              <QuoteSegment
                name="guestTurnover"
                label="When do guests usually arrive?"
                options={TURNOVER_OPTIONS}
                missingText="Choose when guests usually arrive."
              />

              <div className="grid gap-x-2.5 min-[960px]:grid-cols-2">
                <div>
                  <label htmlFor="quote-name" className={fieldLabel}>
                    Full name
                  </label>
                  <input id="quote-name" type="text" name="name" required autoComplete="name" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="quote-phone" className={fieldLabel}>
                    Phone
                  </label>
                  <input id="quote-phone" type="tel" name="phone" required autoComplete="tel" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="quote-zip" className={fieldLabel}>
                    ZIP code
                  </label>
                  <input
                    id="quote-zip"
                    type="text"
                    name="zip"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    autoComplete="postal-code"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="quote-email" className={fieldLabel}>
                    Email
                  </label>
                  <input id="quote-email" type="email" name="email" autoComplete="email" className={inputClass} />
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-[10px] bg-red-50 px-4 py-3 text-[14px] text-red-700">
                  <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className={`${buttonClass.gold} mt-5 w-full`}>
                {loading ? 'Sending…' : 'Get my price'}
                {!loading && (
                  <ArrowRight
                    className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-[3px]"
                    strokeWidth={2.5}
                  />
                )}
              </button>
              <p className="mt-3 text-[11.5px] leading-relaxed text-[#6b7280]">
                By submitting, you agree to get texts about your request from Suncoast Pool Pros. Msg &amp; data rates
                may apply. Reply STOP to opt out.
              </p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
};

// ── H. Free guides ────────────────────────────────────────────────────────

// Matched to island pools: storms, salt, sun-driven stabilizer, recoveries.
const GUIDES = [
  { to: '/pool-care/hurricane-pool-prep/', title: 'Hurricane pool prep', line: 'What to do before and after a storm.' },
  { to: '/pool-care/salt-water-vs-chlorine/', title: 'Salt water vs. chlorine', line: 'The honest comparison, costs and all.' },
  {
    to: '/pool-care/cyanuric-acid/',
    title: 'Cyanuric acid & your chlorine',
    line: 'Why Gulf sun makes stabilizer climb.',
  },
  { to: '/pool-care/green-pool/', title: 'How to clear a green pool', line: 'From swamp back to swimmable, step by step.' },
];

const Guides = () => (
  <section aria-labelledby="ti-guides-title" className="bg-white py-[72px]">
    <Container>
      <Eyebrow>Free guides</Eyebrow>
      <h2 id="ti-guides-title" className="mt-3 text-[24px] font-[650] leading-tight tracking-[-0.03em] text-sc-navy">
        Clear answers, free to keep.
      </h2>
      <ul className="mt-7 grid gap-4 min-[960px]:grid-cols-4">
        {GUIDES.map((g) => (
          <li key={g.to}>
            <Link
              to={g.to}
              className="block h-full rounded-2xl p-5 shadow-[0_0_0_1px_rgba(36,58,85,0.08)] transition-shadow hover:shadow-[0_0_0_1px_rgba(38,118,182,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue"
            >
              <span className="block text-[15.5px] font-semibold text-sc-navy">{g.title}</span>
              <span className={`mt-1.5 block text-[13.5px] leading-snug ${muted}`}>{g.line}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

const TreasureIslandBelowFold = () => (
  <>
    <AbsenteeOwners />
    <RentalGaps />
    <HowItRuns />
    <WhatGoesWrong />
    <ServiceArea />
    <Faq />
    <QuoteSection />
    <Guides />
  </>
);

export default TreasureIslandBelowFold;
