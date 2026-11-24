import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  Flame,
  Gauge,
  Leaf,
  Phone,
  Plane,
  Plus,
  Repeat,
  Sun,
  UserRound,
  Users,
  Wind,
  Wrench,
} from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { useQuoteFormSubmit } from '@/components/ServiceQuoteForm';
import { ClearwaterStandard } from '@/pages/ClearwaterStandard';
import {
  Container,
  PhoneButton,
  QuoteButton,
  buttonClass,
  h2,
  lead,
  leadOnDark,
  sectionY,
} from '@/components/landing/sectionKit';
import { palmHarborFaqs } from '@/pages/palmHarborFaqs';
import { HOURS_SHORT, PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { REVIEWS } from '@/lib/reviews';

/*
 * Everything below the Palm Harbor hero. Built from the Clearwater page
 * (ClearwaterBelowFold): the same sectionKit pieces, cw-* styles, cards and
 * form, with Palm Harbor's own copy and order: trust band, the weekly standard
 * (ClearwaterStandard, shared), Gulf side / lake side, services, getting
 * started, coverage, FAQ, quote, guides. No section eyebrows on this page; the
 * hero's label is its h1.
 *
 * Copy follows the Service Agreement, the FAQ and the homepage guarantees.
 * Techs alternate, so nothing here promises one permanent person: the fixed
 * things are the day, the route and the documented checklist.
 */

const muted = 'text-sc-muted';
const focusRing = 'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue';

// ── A. Trust band ─────────────────────────────────────────────────────────

const REVIEW = REVIEWS.find((r) => r.name === 'Praxitelis') ?? REVIEWS[0];

const TRUST_POINTS = [
  { icon: UserRound, title: 'Familiar faces, locked-in day', line: 'A familiar face who knows your pool.' },
  { icon: Camera, title: 'Photo report every visit', line: "Proof it's done, even when you're away." },
  { icon: Repeat, title: 'We handle the switch', line: 'Usually starting within days.' },
];

const TrustBand = () => (
  <section aria-label="Why Palm Harbor pool owners switch to us" className="bg-white pb-2 pt-14">
    <Container>
      <div className="grid items-center gap-8 rounded-[20px] bg-sc-mist px-6 py-7 shadow-[0_0_0_1px_rgba(36,58,85,0.06)] sm:px-9 sm:py-8 min-[960px]:grid-cols-[1.25fr_1fr_auto] min-[960px]:gap-10">
        <figure className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="cw-tile grid h-11 w-11 shrink-0 place-items-center rounded-full text-[17px] font-semibold text-white"
          >
            {REVIEW.name.charAt(0)}
          </span>
          <div>
            <p role="img" aria-label="Rated 5 out of 5" className="text-[14px] leading-none tracking-[0.06em] text-sc-gold">
              ★★★★★
            </p>
            <blockquote className="mt-2.5 text-[17px] font-medium leading-[1.5] text-sc-navy">“{REVIEW.quote}”</blockquote>
            <figcaption className={`mt-3 flex items-center gap-2 text-[13.5px] ${muted}`}>
              <span
                aria-hidden="true"
                className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-bold text-sc-blue shadow-[0_0_0_1px_rgba(36,58,85,0.1)]"
              >
                G
              </span>
              {REVIEW.name} · Google review
            </figcaption>
          </div>
        </figure>

        <ul className="grid gap-3.5 border-t border-sc-navy/10 pt-5 min-[960px]:border-l min-[960px]:border-t-0 min-[960px]:pl-10 min-[960px]:pt-0">
          {TRUST_POINTS.map(({ icon: Icon, title, line }) => (
            <li key={title} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-white shadow-[0_0_0_1px_rgba(36,58,85,0.08)]"
              >
                <Icon className="h-4 w-4 text-sc-blue" strokeWidth={2.25} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold leading-snug text-sc-navy">{title}</span>
                <span className={`block text-[13px] leading-snug ${muted}`}>{line}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-center gap-2">
          <QuoteButton variant="navy" className="h-[46px] w-full min-[960px]:w-auto" />
          <p className={`text-[12.5px] ${muted}`}>Free quote · same-day reply</p>
        </div>
      </div>
    </Container>
  </section>
);

// ── B. Gulf side, lake side ───────────────────────────────────────────────

type SidePoint = { icon: typeof Sun; title: string; body: string };

// One row per group; `label` is the small heading over each pair on phones.
const SIDE_ROWS: { label: string; gulf: SidePoint; lake: SidePoint }[] = [
  {
    label: 'Sun & debris',
    gulf: {
      icon: Sun,
      title: 'Tuned for open sun',
      body: 'Little shade near the water. UV burns off chlorine and pushes stabilizer up, so we tune your chemistry for the sun load.',
    },
    lake: {
      icon: Leaf,
      title: 'Oak and pine debris, handled',
      body: 'Leaf litter, pine needles and spring pollen. We skim, empty baskets and keep the filter breathing.',
    },
  },
  {
    label: 'Equipment & spas',
    gulf: {
      icon: Wind,
      title: 'Salt air on equipment, checked weekly',
      body: 'Coastal air is hard on pumps, heaters and fittings. We look for corrosion early, before it becomes a replacement.',
    },
    lake: {
      icon: Flame,
      title: 'Spas and heaters, checked every visit',
      body: 'Your spillover spa and heater are checked along with the pool, so the spa is ready the evening you want it.',
    },
  },
  {
    label: 'Age & automation',
    gulf: {
      icon: Wrench,
      title: 'Established pools, honest advice',
      body: 'Many Gulf-side pools have 20 years on them. Repair or replace, told straight, with no commission behind it.',
    },
    lake: {
      icon: Gauge,
      title: 'Salt cells and automation, watched weekly',
      body: 'Salt cell, control panel and variable-speed pump checked every visit. We catch scaling before it costs you a new cell.',
    },
  },
  {
    label: 'Who swims',
    gulf: {
      icon: Plane,
      title: 'Away for the season, still cared for',
      body: 'Up north for the summer? A photo report after every visit lets you see your pool from anywhere.',
    },
    lake: {
      icon: Users,
      title: 'Ready when the grandkids are',
      body: 'Balanced, safe water any day of the week, for morning laps or a full house at the holidays.',
    },
  },
];

// Desktop: the Gulf side's text is right-aligned with its icon on the right,
// mirroring the lake side across the US-19 line.
const SideItem = ({ point, gulf }: { point: SidePoint; gulf?: boolean }) => (
  <div className={`flex items-start gap-4 ${gulf ? 'min-[860px]:flex-row-reverse min-[860px]:text-right' : ''}`}>
    <span aria-hidden="true" className="cw-tile grid h-11 w-11 shrink-0 place-items-center rounded-[12px] text-white">
      <point.icon className="h-5 w-5" strokeWidth={2} />
    </span>
    <div>
      <h3 className="text-[17px] font-[650] leading-snug text-sc-navy">{point.title}</h3>
      <p className={`mt-1 text-[15px] leading-[1.55] ${muted}`}>{point.body}</p>
    </div>
  </div>
);

const ColumnHead = ({ label, title, line, right }: { label: string; title: string; line: string; right?: boolean }) => (
  <div className={right ? 'text-right' : ''}>
    <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-sc-blue">{label}</p>
    <p className="mt-2 text-[24px] font-[650] leading-tight tracking-[-0.02em] text-sc-navy">{title}</p>
    <p className={`mt-1 text-[14px] ${muted}`}>{line}</p>
  </div>
);

const GulfAndLake = () => (
  <section
    aria-labelledby="ph-sides-title"
    className="bg-[linear-gradient(#fff,#f5f9fd)] pb-16 pt-16 lg:pb-28 lg:pt-[88px]"
  >
    <Container>
      <div className="mx-auto max-w-[44rem] text-center">
        <h2 id="ph-sides-title" className={`${h2} text-sc-navy`}>
          A Gulf-side pool and a Lake Tarpon pool aren&rsquo;t the same job.
        </h2>
        <p className={`${lead} mx-auto max-w-[36rem]`}>
          Palm Harbor runs from the Gulf to Lake Tarpon, and the pools change along the way. We built our weekly
          service to handle both, held to the same standard.
        </p>
      </div>

      <div className="mt-12 min-[860px]:mt-16">
        {/* Column heads, the US-19 line and its dots: wide screens only. */}
        <div className="hidden grid-cols-[1fr_150px_1fr] pb-7 min-[860px]:grid">
          <ColumnHead right label="The Gulf side" title="Ozona · Crystal Beach" line="Coastal pools in salt air and open sun" />
          <span />
          <ColumnHead label="The lake side" title="Lansbrook · Ridgemoor" line="Larger screened pools with spas and heaters" />
        </div>

        <div className="relative">
          <span aria-hidden="true" className="cw-river absolute bottom-0 left-1/2 top-[-62px] hidden w-0.5 -translate-x-1/2 min-[860px]:block" />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[-62px] hidden -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em] text-sc-blue ring-1 ring-[rgba(38,118,182,0.18)] min-[860px]:block"
          >
            US-19
          </span>

          {SIDE_ROWS.map((row) => (
            <div
              key={row.label}
              className="border-t border-sc-navy/[0.08] py-[26px] min-[860px]:grid min-[860px]:grid-cols-[1fr_150px_1fr] min-[860px]:items-center"
            >
              <p className="mb-4 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-sc-blue min-[860px]:hidden">
                {row.label}
              </p>
              <SideItem gulf point={row.gulf} />
              <span
                aria-hidden="true"
                className="relative mx-auto hidden h-3 w-3 rounded-full bg-white ring-[3px] ring-sc-blue min-[860px]:block"
              />
              <div className="mt-5 min-[860px]:mt-0">
                <SideItem point={row.lake} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cw-dark relative mt-14 grid items-center gap-6 overflow-hidden rounded-[24px] px-6 py-8 sm:px-12 sm:py-11 min-[860px]:grid-cols-[1fr_auto]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[0.3em] right-[-0.04em] select-none text-[180px] font-extrabold leading-none tracking-[-0.06em] text-white/5"
        >
          blue
        </span>
        <div className="relative">
          <h3 className="text-[24px] font-[650] leading-[1.15] tracking-[-0.03em] text-white sm:text-[28px]">
            Two very different pools. One standard.
          </h3>
          <p className="mt-2.5 text-[16px] text-white/75">You&rsquo;ve invested in your pool. We keep it looking that way.</p>
        </div>
        <QuoteButton label="Get my price" className="relative justify-self-start min-[860px]:justify-self-end" />
      </div>
    </Container>
  </section>
);

// ── C. Services ───────────────────────────────────────────────────────────

const SERVICES = [
  {
    title: 'Weekly pool service',
    line: 'Cleaning, testing and every standard chemical, on a set day.',
    to: '/services/weekly-pool-service/',
  },
  {
    title: 'Saltwater pool maintenance',
    line: 'Salt cell checks and chemistry tuned for salt systems.',
    to: '/services/saltwater-pool-service/',
  },
  {
    title: 'Pool repair',
    line: 'Pumps, filters, heaters and automation, quoted before any work.',
    to: '/services/pool-repair/',
  },
  {
    title: 'Green pool cleanup',
    line: 'From green back to swimmable, with an up-front price.',
    to: '/services/green-pool-cleanup/',
  },
];

const Services = () => (
  <section aria-labelledby="ph-services-title" className={`bg-white ${sectionY}`}>
    <Container>
      <div className="mx-auto max-w-[44rem] text-center">
        <h2 id="ph-services-title" className={`${h2} text-sc-navy`}>
          More than weekly cleaning.
        </h2>
        <p className={`${lead} mx-auto max-w-[36rem]`}>
          One local team for the weekly visit and for everything your pool needs between visits.
        </p>
      </div>
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-12 lg:grid-cols-4">
        {SERVICES.map((svc) => (
          <li key={svc.to} className="flex">
            <Link
              to={svc.to}
              className="group flex w-full flex-col rounded-[14px] border border-[rgba(36,58,85,0.14)] bg-white p-4 transition-colors hover:border-sc-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue sm:p-6"
            >
              <span className="block text-[15.5px] font-[650] leading-snug text-sc-navy sm:text-[17px]">{svc.title}</span>
              <span className={`mt-1.5 block flex-1 text-[13.5px] leading-[1.5] sm:text-[14.5px] ${muted}`}>{svc.line}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-sc-blue">
                Learn more
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-[3px]"
                  strokeWidth={2.25}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

// ── D. Getting started ────────────────────────────────────────────────────

const STEPS = [
  {
    title: 'Tell us about your pool',
    body: 'Call, text or use the form. Tell us which side of US-19 you’re on and what your pool runs (spa, heater, salt), and you’ll have a firm monthly price, usually the same day.',
  },
  {
    title: 'You land on a route',
    body: 'A familiar tech and a locked-in day of the week. Leaving another company? We coordinate the handoff so your pool never misses a visit.',
  },
  {
    title: 'The water stays clear',
    body: 'Your tech, your day, and a photo report in your inbox when the gate closes behind us. Every week backed by the Always Blue Guarantee.',
  },
];

const darkChip =
  'inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3.5 py-2 text-[13.5px] font-medium text-white ring-1 ring-inset ring-white/14';

const GettingStarted = () => (
  <section aria-labelledby="ph-start-title" className={`cw-dark relative overflow-hidden ${sectionY}`}>
    <div aria-hidden="true" className="cw-dark-glow absolute inset-0" />
    <Container className="relative">
      <h2 id="ph-start-title" className={`${h2} text-white`}>
        Switching takes one conversation.
      </h2>
      <p className={`${leadOnDark} max-w-[36rem]`}>
        Leaving a big-name pool company, new to the house, or done doing it yourself? From first call to first visit is
        usually under a week.
      </p>

      <ol className="mt-12 grid gap-5 min-[960px]:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="rounded-[20px] bg-white/[0.06] p-7 ring-1 ring-inset ring-white/10">
            <span
              aria-hidden="true"
              className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[linear-gradient(#ffbf2f,#ffa90a)] text-[16px] font-bold text-sc-ink"
            >
              {i + 1}
            </span>
            <h3 className="mt-[18px] text-[19px] font-[650] leading-snug text-white">{step.title}</h3>
            <p className="mt-2 text-[15px] leading-[1.6] text-white/[0.72]">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-5">
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

// ── E. Service area ───────────────────────────────────────────────────────

// Named on this page and in its schema. None has a page of its own yet; give
// one a `to` and its chip becomes a link.
type Area = { name: string; to?: string };
export const GULF_AREAS: Area[] = [{ name: 'Ozona' }, { name: 'Crystal Beach' }, { name: 'Downtown Palm Harbor' }];
export const LAKE_AREAS: Area[] = [
  { name: 'Lansbrook' },
  { name: 'Highland Lakes' },
  { name: 'Ridgemoor' },
  { name: 'East Lake' },
  { name: 'Tarpon Woods' },
  { name: 'Lake St. George' },
  { name: 'Innisbrook area' },
  { name: 'Westlake Village' },
  { name: 'Boot Ranch' },
];
const ZIPS = ['34683', '34684', '34685'];

const chip = 'inline-flex rounded-full bg-sc-mist px-[13px] py-[7px] text-[14px] font-medium text-sc-navy ring-1 ring-sc-navy/10';

const AreaCard = ({ title, areas, children }: { title: string; areas: Area[]; children?: React.ReactNode }) => (
  <div className="rounded-[20px] bg-white px-[26px] py-6 shadow-[0_0_0_1px_rgba(36,58,85,0.08)]">
    <div className="flex items-baseline justify-between gap-4">
      <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-sc-blue">{title}</h3>
      <p className={`text-[13px] ${muted}`}>{areas.length} areas</p>
    </div>
    <ul className="mt-4 flex flex-wrap gap-2">
      {areas.map((a) => (
        <li key={a.name}>
          {a.to ? (
            <Link to={a.to} className={`${chip} transition hover:ring-sc-blue/40 ${focusRing}`}>
              {a.name}
            </Link>
          ) : (
            <span className={chip}>{a.name}</span>
          )}
        </li>
      ))}
    </ul>
    {children}
  </div>
);

// Padding stretches the tap target to 44px; the negative margin keeps the line.
const areaLink = `-my-3 inline-block py-3 font-semibold text-sc-blue underline decoration-sc-blue/30 decoration-1 underline-offset-[3px] transition hover:decoration-sc-blue ${focusRing}`;

const ServiceArea = () => (
  <section aria-labelledby="ph-area-title" className={`bg-sc-mist ${sectionY}`}>
    <Container className="grid items-start gap-12 min-[960px]:grid-cols-[0.9fr_1.1fr] min-[960px]:gap-16">
      <div>
        <h2 id="ph-area-title" className={`${h2} text-sc-navy`}>
          From the Gulf to Lake Tarpon, on a set day.
        </h2>
        <p className={lead}>
          Our routes run both sides of US-19 every week, from Alt 19 out to East Lake Road and Tampa Road up to
          Klosterman.
        </p>
        <p className={`mt-[22px] text-[15px] leading-[1.6] ${muted}`}>
          Don&rsquo;t see your neighborhood? If your pool has a Palm Harbor address, a truck likely already passes your
          street. We also serve{' '}
          <Link to="/clearwater-fl/" className={areaLink}>
            Clearwater
          </Link>
          ,{' '}
          <Link to="/largo-fl/" className={areaLink}>
            Largo
          </Link>{' '}
          and{' '}
          <Link to="/belleair-beach-fl/" className={areaLink}>
            Belleair Beach
          </Link>
          , and offer{' '}
          <Link to="/seminole-fl/" className={areaLink}>
            pool cleaning in Seminole
          </Link>
          .
        </p>
        <QuoteButton label="Check my address" className="mt-[26px]" />
      </div>

      <div className="grid gap-4">
        <AreaCard title="The Gulf side" areas={GULF_AREAS} />
        <AreaCard title="The lake side" areas={LAKE_AREAS}>
          <p className={`mt-4 text-[13.5px] leading-[1.6] ${muted}`}>
            <span className="font-semibold text-sc-navy">ZIP codes:</span> {ZIPS.join(' · ')}
          </p>
        </AreaCard>
      </div>
    </Container>
  </section>
);

// ── F. FAQ ────────────────────────────────────────────────────────────────

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section aria-labelledby="ph-faq-title" className={`bg-white ${sectionY}`}>
      <Container className="grid items-start gap-10 min-[960px]:grid-cols-[0.8fr_1.2fr] min-[960px]:gap-16">
        <div>
          <h2 id="ph-faq-title" className={`${h2} text-sc-navy`}>
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
          {palmHarborFaqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.q} className={`faq-item border-b border-sc-navy/10 ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    id={`ph-faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`ph-faq-a-${i}`}
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
                      id={`ph-faq-a-${i}`}
                      role="region"
                      aria-labelledby={`ph-faq-q-${i}`}
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

// Same fields, names and values as the form this replaced; the submit is
// useQuoteFormSubmit, shared with ServiceQuoteForm, so the lead arrives as
// before.
const AREA_OPTIONS = [
  { value: 'ozona', label: 'Ozona' },
  { value: 'crystal-beach', label: 'Crystal Beach' },
  { value: 'downtown', label: 'Downtown Palm Harbor' },
  { value: 'highland-lakes', label: 'Highland Lakes' },
  { value: 'lansbrook', label: 'Lansbrook' },
];
const SANITIZER_OPTIONS = [
  { value: 'salt', label: 'Salt system' },
  { value: 'chlorine', label: 'Chlorine' },
  { value: 'unsure', label: 'Not sure' },
];

const fieldLabel = `mb-1.5 mt-4 block text-[12px] font-semibold ${muted}`;
// 16px on phones so iOS doesn't zoom into the field on focus.
const inputClass =
  'h-[46px] w-full rounded-[10px] bg-white px-3.5 text-base text-sc-navy ring-1 ring-inset ring-sc-navy/15 transition outline-none focus:ring-2 focus:ring-sc-blue min-[960px]:text-[15px]';

const QuoteSection = () => {
  const { submitted, setSubmitted, loading, error, turnstile, handleSubmit } =
    useQuoteFormSubmit('palm-harbor-quote-form');
  const [sanitizer, setSanitizer] = useState('');
  const [sanitizerMissing, setSanitizerMissing] = useState(false);
  const segmentRef = useRef<HTMLDivElement>(null);

  return (
    <section id="quote" aria-labelledby="ph-quote-title" className={`cw-dark scroll-mt-24 ${sectionY}`}>
      <Container className="grid items-center gap-12 min-[960px]:grid-cols-2 min-[960px]:gap-14">
        <div>
          <h2 id="ph-quote-title" className={`${h2} text-white`}>
            From the Gulf to Lake Tarpon, one flat rate.
          </h2>
          <p className={`${leadOnDark} max-w-[36rem]`}>
            Tell us where your pool is and what it runs on. We&rsquo;ll send one flat monthly price the same day.
          </p>
          <ul className="mt-6 grid gap-3">
            {[
              'A set service day on a route through your part of town',
              'Chemistry matched to your pool, spa and equipment',
              'Chemicals included, no contract, photo report every visit',
            ].map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15.5px] leading-snug text-white/90">
                <Check aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sc-glacier" strokeWidth={2.5} />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[14.5px] leading-[1.6] text-white/70">
            Prefer to talk? Call or text{' '}
            <a
              href={PHONE_HREF}
              className="-my-3 inline-block whitespace-nowrap py-3 font-bold text-white underline decoration-white/40 underline-offset-[3px] hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {PHONE_DISPLAY}
            </a>
            . Text a photo of your pool and equipment for a tighter number.
          </p>
        </div>

        {/* #quote-form: the sticky bar scrolls here, and hides while it's on screen. */}
        <div
          id="quote-form"
          className="scroll-mt-24 rounded-[22px] bg-white p-6 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.5)] sm:p-[30px]"
        >
          {submitted ? (
            <div className="py-6 text-center">
              <CheckCircle aria-hidden="true" className="mx-auto h-12 w-12 text-[#0e9f57]" />
              <h3 className="mt-4 text-[20px] font-[650] text-sc-navy">Got it — we will be in touch today.</h3>
              <p className={`mt-2 text-[15px] leading-[1.6] ${muted}`}>
                We will come back with your flat weekly rate and the day you would be on our Palm Harbor route.
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

              <h3 className="text-[20px] font-[650] leading-tight text-sc-navy">Get my Palm Harbor price</h3>
              <p className={`mt-1 text-[14px] ${muted}`}>Takes about a minute. No obligation.</p>

              <label htmlFor="quote-area" className={fieldLabel}>
                Which part of Palm Harbor?
              </label>
              <div className="relative">
                <select id="quote-area" name="area" required defaultValue="" className={`${inputClass} appearance-none pr-10`}>
                  <option value="" disabled>
                    Choose one
                  </option>
                  {AREA_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sc-navy/50"
                />
              </div>

              <p id="quote-sanitizer-label" className={fieldLabel}>
                Salt or chlorine?
              </p>
              {/* Buttons write the same `sanitizer` value the old select did.
                  The input below carries it and keeps it required: an empty
                  submit stops on it like any other field, with our message in
                  place of the browser bubble. */}
              <div ref={segmentRef} role="group" aria-labelledby="quote-sanitizer-label" className="relative grid grid-cols-3 gap-2">
                {SANITIZER_OPTIONS.map((o) => {
                  const on = sanitizer === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setSanitizer(o.value);
                        setSanitizerMissing(false);
                      }}
                      className={`min-h-11 rounded-[10px] px-1 py-[11px] text-[14px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue ${
                        on ? 'bg-sc-navy text-white' : 'text-sc-navy ring-1 ring-inset ring-sc-navy/15 hover:ring-sc-navy/30'
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
                <input
                  name="sanitizer"
                  value={sanitizer}
                  onChange={() => {}}
                  required
                  tabIndex={-1}
                  aria-hidden="true"
                  onInvalid={(e) => {
                    e.preventDefault();
                    setSanitizerMissing(true);
                    // Bring focus to the choice unless an earlier field is the problem.
                    const area = e.currentTarget.form?.elements.namedItem('area') as HTMLSelectElement | null;
                    if (area?.validity.valid) {
                      requestAnimationFrame(() => segmentRef.current?.querySelector('button')?.focus());
                    }
                  }}
                  className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
                />
              </div>
              {sanitizerMissing && (
                <p role="alert" className="mt-2 text-[13px] font-medium text-red-700">
                  Choose salt, chlorine or not sure.
                </p>
              )}

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
              {/* #6b7280, not the mockup's #8a9099: that is 3.2:1 on white. */}
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

const GUIDES = [
  { to: '/pool-care/salt-water-vs-chlorine/', title: 'Salt water vs. chlorine', line: 'The honest comparison, costs and all.' },
  {
    to: '/pool-care/cyanuric-acid/',
    title: 'Cyanuric acid & your chlorine',
    line: 'Why Gulf sun makes stabilizer climb, and how to fix it.',
  },
  { to: '/pool-care/variable-speed-pumps/', title: 'Variable-speed pumps', line: 'What a swap does to your electric bill.' },
  { to: '/pool-care/green-pool/', title: 'How to clear a green pool', line: 'From swamp back to swimmable, step by step.' },
];

const Guides = () => (
  <section aria-labelledby="ph-guides-title" className="bg-white py-[72px]">
    <Container>
      <h2 id="ph-guides-title" className="text-[24px] font-[650] leading-tight tracking-[-0.03em] text-sc-navy">
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

const PalmHarborBelowFold = () => (
  <>
    <TrustBand />
    <ClearwaterStandard
      title={
        <>
          More pool, more to check.
          <br />
          We check all of it.
        </>
      }
      lead="Six steps every week, Gulf side or lake side. Every one of them lands in your inbox before we leave the driveway."
      address="Lansbrook · Palm Harbor, FL 34685"
      titleId="ph-standard-title"
    />
    <GulfAndLake />
    <Services />
    <GettingStarted />
    <ServiceArea />
    <Faq />
    <QuoteSection />
    <Guides />
  </>
);

export default PalmHarborBelowFold;
