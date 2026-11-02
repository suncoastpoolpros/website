import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  Cog,
  Droplet,
  Grid3x3,
  KeyRound,
  Leaf,
  Phone,
  Plus,
  Repeat,
  Sun,
  UserRound,
  WavesLadder,
  Wind,
} from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { useQuoteFormSubmit } from '@/components/ServiceQuoteForm';
import { ClearwaterStandard } from '@/pages/ClearwaterStandard';
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
import { clearwaterFaqs } from '@/pages/clearwaterFaqs';
import { HOURS_SHORT, PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { REVIEWS } from '@/lib/reviews';

/*
 * Everything below the Clearwater hero, on the homepage design system: the
 * shared section pieces (sectionKit), the sc-* tokens, and the homepage's
 * gold/navy buttons. Light and dark sections alternate: trust band, Two Towns
 * (white), Standard (white into mist), Getting started (dark), Service area (mist), FAQ
 * (white), Quote (dark), Guides (white). Every "Get my price" below the hero
 * opens the quote popup (QuotePopup); the hero keeps its address search.
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
  <section aria-label="Why Clearwater pool owners switch to us" className="bg-white pb-2 pt-14">
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

// ── B. Two Towns ──────────────────────────────────────────────────────────

type TownPoint = { icon: typeof Sun; title: string; body: string };

const TOWN_ROWS: { label: string; beach: TownPoint; mainland: TownPoint }[] = [
  {
    label: 'Sun & leaves',
    beach: {
      icon: Sun,
      title: 'Built for full Gulf sun',
      body: 'No shade out here. UV burns off chlorine and pushes stabilizer up, so we tune your chemistry for the sun load.',
    },
    mainland: {
      icon: Leaf,
      title: 'Oak debris, handled',
      body: 'Leaf litter, spring pollen and debris through torn screens. We skim, empty baskets and keep the filter breathing.',
    },
  },
  {
    label: 'Systems & cages',
    beach: {
      icon: Droplet,
      title: 'Salt systems, watched weekly',
      body: 'Most island pools run salt. We check the cell and catch scaling before it costs you a new one.',
    },
    mainland: {
      icon: Grid3x3,
      title: 'Screened cages, our everyday',
      body: 'We work around your cage every week and flag tears or drainage issues before a season of debris gets in.',
    },
  },
  {
    label: 'Grit & equipment',
    beach: {
      icon: Wind,
      title: 'Sand & wind, rinsed out',
      body: 'Blowing sand turns beach pools cloudy. We brush, vacuum and keep the filter clear so the water stays glass.',
    },
    mainland: {
      icon: Cog,
      title: 'Established equipment, real eyes',
      body: 'Pump, filter and heater checked every visit. Repair or replace, told straight, with no commission behind it.',
    },
  },
  {
    label: 'Who swims',
    beach: {
      icon: KeyRound,
      title: 'Rentals & condos, guest-ready',
      body: "A dependable weekly day and a photo report every visit, so it's ready for the next check-in.",
    },
    mainland: {
      icon: WavesLadder,
      title: 'Full-time pools, kept swimmable',
      body: 'Families and retirees swim year-round. We keep the water balanced and safe any day of the week.',
    },
  },
];

// Desktop: the beach side's text is right-aligned with its icon on the
// right, mirroring the mainland side across the Intracoastal line.
const TownItem = ({ point, beach }: { point: TownPoint; beach?: boolean }) => (
  <div className={`flex items-start gap-4 ${beach ? 'min-[860px]:flex-row-reverse min-[860px]:text-right' : ''}`}>
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

const TwoTowns = () => (
  <section
    aria-labelledby="cw-towns-title"
    className="bg-[linear-gradient(#fff,#f5f9fd)] pb-16 pt-16 lg:pb-28 lg:pt-[88px]"
  >
    <Container>
      <div className="mx-auto max-w-[44rem] text-center">
        <Eyebrow centered>Two towns, one name</Eyebrow>
        <h2 id="cw-towns-title" className={`${h2} text-sc-navy`}>
          A beach pool and a mainland pool aren&rsquo;t the same job.
        </h2>
        <p className={`${lead} mx-auto max-w-[36rem]`}>
          Clearwater is split right down the Intracoastal. Each side has its own challenges, and we built our weekly
          service to handle both, held to the same clear-water standard.
        </p>
      </div>

      <div className="mt-12 min-[860px]:mt-16">
        {/* Column heads, the Intracoastal line and its dots: wide screens only. */}
        <div className="hidden grid-cols-[1fr_150px_1fr] pb-7 min-[860px]:grid">
          <ColumnHead
            right
            label="The beach & islands"
            title="Clearwater Beach · Sand Key"
            line="Barrier-island pools in full Gulf sun"
          />
          <span />
          <ColumnHead label="The mainland" title="Countryside · Del Oro" line="Established neighborhoods under the oaks" />
        </div>

        <div className="relative">
          <span aria-hidden="true" className="cw-river absolute bottom-0 left-1/2 top-[-62px] hidden w-0.5 -translate-x-1/2 min-[860px]:block" />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[-62px] hidden -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em] text-sc-blue ring-1 ring-[rgba(38,118,182,0.18)] min-[860px]:block"
          >
            Intracoastal
          </span>

          {TOWN_ROWS.map((row) => (
            <div
              key={row.label}
              className="border-t border-sc-navy/[0.08] py-[26px] min-[860px]:grid min-[860px]:grid-cols-[1fr_150px_1fr] min-[860px]:items-center"
            >
              <p className="mb-4 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-sc-blue min-[860px]:hidden">
                {row.label}
              </p>
              <TownItem beach point={row.beach} />
              <span
                aria-hidden="true"
                className="relative mx-auto hidden h-3 w-3 rounded-full bg-white ring-[3px] ring-sc-blue min-[860px]:block"
              />
              <div className="mt-5 min-[860px]:mt-0">
                <TownItem point={row.mainland} />
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
          clear
        </span>
        <div className="relative">
          <Eyebrow gold>The Clearwater standard</Eyebrow>
          <h3 className="mt-3 text-[24px] font-[650] leading-[1.15] tracking-[-0.03em] text-white sm:text-[28px]">
            Two very different pools. One clear-water standard.
          </h3>
          <p className="mt-2.5 text-[16px] text-white/75">The town is named for clear water. We just keep the promise.</p>
        </div>
        <QuoteButton className="relative justify-self-start min-[860px]:justify-self-end" />
      </div>
    </Container>
  </section>
);

// ── C. The Clearwater standard: ClearwaterStandard.tsx

// ── D. Getting started ────────────────────────────────────────────────────

const STEPS = [
  {
    title: 'Tell us about your pool',
    body: "Call, text or use the form. Tell us which side of the Intracoastal you're on and what your equipment runs, and you'll have a firm monthly price, usually the same day.",
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
  <section aria-labelledby="cw-start-title" className={`cw-dark relative overflow-hidden ${sectionY}`}>
    <div aria-hidden="true" className="cw-dark-glow absolute inset-0" />
    <Container className="relative">
      <Eyebrow gold>Getting started</Eyebrow>
      <h2 id="cw-start-title" className={`${h2} text-white`}>
        Switching takes one conversation.
      </h2>
      <p className={`${leadOnDark} max-w-[36rem]`}>
        Buying on the island, settling into the mainland, or done doing it yourself? From first call to first visit is
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
const BEACH_AREAS: Area[] = [{ name: 'Clearwater Beach' }, { name: 'Sand Key' }, { name: 'Island Estates' }];
const MAINLAND_AREAS: Area[] = [
  { name: 'Countryside' },
  { name: 'Morningside' },
  { name: 'Del Oro' },
  { name: 'Skycrest' },
  { name: 'Harbor Oaks' },
  { name: 'Coachman' },
  { name: 'Sunset Point' },
  { name: 'Eastwood' },
  { name: 'Feather Sound' },
];
const ZIPS = ['33755', '33756', '33759', '33761', '33762', '33763', '33764', '33765', '33767'];

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
  <section aria-labelledby="cw-area-title" className={`bg-sc-mist ${sectionY}`}>
    <Container className="grid items-start gap-12 min-[960px]:grid-cols-[0.9fr_1.1fr] min-[960px]:gap-16">
      <div>
        <Eyebrow>Across all of Clearwater</Eyebrow>
        <h2 id="cw-area-title" className={`${h2} text-sc-navy`}>
          From the sand to the suburbs, on a set day.
        </h2>
        <p className={lead}>
          Our trucks cross the Memorial Causeway and work the mainland every week, from Belcher out to the beach and
          Sunset Point down to Belleair Road.
        </p>
        <p className={`mt-[22px] text-[15px] leading-[1.6] ${muted}`}>
          Don&rsquo;t see your neighborhood? If your pool has a Clearwater address, a truck likely already passes your
          street. We also serve{' '}
          <Link to="/largo-fl/" className={areaLink}>
            Largo
          </Link>{' '}
          and{' '}
          <Link to="/belleair-beach-fl/" className={areaLink}>
            Belleair Beach
          </Link>
          .
        </p>
        <QuoteButton label="Check my address" className="mt-[26px]" />
      </div>

      <div className="grid gap-4">
        <AreaCard title="The beach & islands" areas={BEACH_AREAS} />
        <AreaCard title="The mainland" areas={MAINLAND_AREAS}>
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
    <section aria-labelledby="cw-faq-title" className={`bg-white ${sectionY}`}>
      <Container className="grid items-start gap-10 min-[960px]:grid-cols-[0.8fr_1.2fr] min-[960px]:gap-16">
        <div>
          <Eyebrow>Clearwater pool service</Eyebrow>
          <h2 id="cw-faq-title" className={`${h2} text-sc-navy`}>
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
          {clearwaterFaqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.q} className={`faq-item border-b border-sc-navy/10 ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    id={`cw-faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`cw-faq-a-${i}`}
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
                      id={`cw-faq-a-${i}`}
                      role="region"
                      aria-labelledby={`cw-faq-q-${i}`}
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
  { value: 'beach', label: 'Clearwater Beach' },
  { value: 'sand-key', label: 'Sand Key' },
  { value: 'island-estates', label: 'Island Estates' },
  { value: 'mainland', label: 'Mainland Clearwater' },
  { value: 'countryside', label: 'Countryside' },
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
    useQuoteFormSubmit('clearwater-quote-form');
  const [sanitizer, setSanitizer] = useState('');
  const [sanitizerMissing, setSanitizerMissing] = useState(false);
  const segmentRef = useRef<HTMLDivElement>(null);

  return (
    <section id="quote" aria-labelledby="cw-quote-title" className={`cw-dark scroll-mt-24 ${sectionY}`}>
      <Container className="grid items-center gap-12 min-[960px]:grid-cols-2 min-[960px]:gap-14">
        <div>
          <Eyebrow gold>Your Clearwater quote</Eyebrow>
          <h2 id="cw-quote-title" className={`${h2} text-white`}>
            From the sand to the suburbs, one flat rate.
          </h2>
          <p className={`${leadOnDark} max-w-[36rem]`}>
            Tell us where your pool is and what it runs on. We&rsquo;ll send one flat monthly price the same day.
          </p>
          <ul className="mt-6 grid gap-3">
            {[
              'A set service day on a route through your part of town',
              'Chemistry matched to beach or mainland conditions',
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

        <div className="rounded-[22px] bg-white p-6 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.5)] sm:p-[30px]">
          {submitted ? (
            <div className="py-6 text-center">
              <CheckCircle aria-hidden="true" className="mx-auto h-12 w-12 text-[#0e9f57]" />
              <h3 className="mt-4 text-[20px] font-[650] text-sc-navy">Got it — we will be in touch today.</h3>
              <p className={`mt-2 text-[15px] leading-[1.6] ${muted}`}>
                We will come back with your flat weekly rate and the day you would be on our Clearwater route.
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

              <h3 className="text-[20px] font-[650] leading-tight text-sc-navy">Get my Clearwater price</h3>
              <p className={`mt-1 text-[14px] ${muted}`}>Takes about a minute. No obligation.</p>

              <label htmlFor="quote-area" className={fieldLabel}>
                Which part of Clearwater?
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
  <section aria-labelledby="cw-guides-title" className="bg-white py-[72px]">
    <Container>
      <Eyebrow>Free guides</Eyebrow>
      <h2 id="cw-guides-title" className="mt-3 text-[24px] font-[650] leading-tight tracking-[-0.03em] text-sc-navy">
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

const ClearwaterBelowFold = () => (
  <>
    <TrustBand />
    <TwoTowns />
    <ClearwaterStandard />
    <GettingStarted />
    <ServiceArea />
    <Faq />
    <QuoteSection />
    <Guides />
  </>
);

export default ClearwaterBelowFold;
