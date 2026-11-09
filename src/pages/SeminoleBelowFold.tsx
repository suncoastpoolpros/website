import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle,
  Droplets,
  FileText,
  Leaf,
  MapPin,
  MessageSquareText,
  Phone,
  Plus,
  ShieldCheck,
  Sun,
  Users,
  Wallet,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { useQuoteFormSubmit } from '@/components/ServiceQuoteForm';
import { SeminoleCoverageMap } from '@/components/SeminoleCoverageMap';
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
import { seminoleFaqs } from '@/pages/seminoleFaqs';
import { HOURS_SHORT, PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { REVIEWS } from '@/lib/reviews';

/*
 * Everything below the Seminole hero, on the homepage design system (sectionKit,
 * the sc-* tokens, the gold/navy buttons), as Clearwater is, with Seminole's own
 * content and layouts: full-time homes (white into mist), inland conditions
 * (mist), the flat-rate checklist (white), how it runs (dark), service area
 * (mist), FAQ (white), quote (dark), guides (white). Every "Get my price" below
 * the hero opens the quote popup; the hero keeps its address search.
 *
 * Techs alternate, so nothing here promises one permanent person: the fixed
 * things are the day, the route and the documented checklist.
 */

const muted = 'text-sc-muted';
const focusRing = 'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue';
const card = 'rounded-[20px] bg-white shadow-[0_0_0_1px_rgba(36,58,85,0.08)]';

/** Named in the hero bar, the service area and the schema. */
export const NEIGHBORHOODS = [
  'Bardmoor',
  'Seminole Lake',
  'Oakhurst',
  'Bay Pines',
  'Lake Seminole',
  'Boca Ciega',
  'Pine Hills',
  'Ridgewood',
];
export const ZIPS = ['33772', '33776', '33777', '33778'];

// ── A. Full-time homes ────────────────────────────────────────────────────

const REVIEW = REVIEWS.find((r) => r.name === 'Michelle M.') ?? REVIEWS[0];

const PILLARS = [
  {
    icon: Users,
    title: 'Dosed for real, daily use',
    body: "Kids after school, grandkids on the weekend, your morning laps. A pool somebody's in daily eats chlorine a still one never will, so we set your levels against that traffic and leave enough margin to hold until the next visit.",
  },
  {
    icon: ShieldCheck,
    title: "You're home, and you'll notice",
    body: 'Most of our Seminole customers live at the house we service. A skipped week or a cloudy corner gets noticed the same day, so our service is built to hold up to people who actually look at their pool.',
  },
  {
    icon: Wallet,
    title: 'One flat rate, no nickel-and-diming',
    body: "All standard chemicals are in your monthly rate. No surprise 'extra chlorine' lines, and anything bigger, a repair or a part, is quoted and approved before we touch it.",
  },
];

const FullTimeHomes = () => (
  <section aria-labelledby="sem-homes-title" className="bg-[linear-gradient(#fff,#f5f9fd)] pb-20 pt-16 sm:pb-24 lg:pb-28 lg:pt-[88px]">
    <Container>
      <div className="grid items-end gap-10 min-[960px]:grid-cols-[1.1fr_0.9fr] min-[960px]:gap-16">
        <div>
          <Eyebrow>Built for full-time homes</Eyebrow>
          <h2 id="sem-homes-title" className={`${h2} text-sc-navy`}>
            For the pool you swim in, not the one you visit.
          </h2>
          <p className={`${lead} max-w-[36rem]`}>
            Seminole isn&rsquo;t a beach rental town. It&rsquo;s families and retirees who live here year-round and use
            the pool like part of the house. Our weekly service is built around exactly that.
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

      <ul className="mt-12 grid gap-5 min-[960px]:grid-cols-3">
        {PILLARS.map((p) => (
          <li key={p.title} className={`${card} p-7`}>
            <span aria-hidden="true" className="cw-tile grid h-11 w-11 place-items-center rounded-[12px] text-white">
              <p.icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="mt-5 text-[18px] font-[650] leading-snug tracking-[-0.015em] text-sc-navy">{p.title}</h3>
            <p className={`mt-2 text-[15px] leading-[1.6] ${muted}`}>{p.body}</p>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

// ── B. Inland conditions ──────────────────────────────────────────────────

const FACTORS = [
  {
    icon: Wind,
    title: 'Screen-cage debris',
    body: 'Most Seminole pools are screened, and fine debris still blows through the mesh. We clear the waterline, skimmers and pump basket, and flag a torn panel or sagging door before it becomes a bigger problem.',
  },
  {
    icon: Leaf,
    title: 'Oak pollen & leaf load',
    body: 'Spring pollen and the tree cover around Lake Seminole and Bardmoor drop a steady organic load into the water. Weekly brushing, skimming and the right sanitizer level keep ahead of it.',
  },
  {
    icon: Droplets,
    title: 'Inland chemistry, done right',
    body: 'No salt spray here, but Pinellas fill water runs hard and stabilizer quietly climbs until chlorine stops working. We track hardness and CYA over time and correct the drift early.',
  },
  {
    icon: Waves,
    title: 'Salt cells, maintained',
    body: 'On salt pools we check cell output and clean off scale as part of the visit, the step most services skip until the cell dies years early. Your equipment gets looked at every week, not just your water.',
  },
];

const InlandConditions = () => (
  <section aria-labelledby="sem-inland-title" className={`bg-sc-mist ${sectionY}`}>
    <Container className="grid items-start gap-10 min-[960px]:grid-cols-[0.85fr_1.15fr] min-[960px]:gap-16">
      <div className="min-[960px]:sticky min-[960px]:top-28">
        <Eyebrow>Built for inland Pinellas</Eyebrow>
        <h2 id="sem-inland-title" className={`${h2} text-sc-navy`}>
          Seminole pools have their own problems.
        </h2>
        <p className={lead}>
          A screened, tree-shaded pool doesn&rsquo;t fight salt air the way a beach pool does. It fights pollen, leaf
          load, hard fill water and the slow chemistry drift nobody sees until the water turns.
        </p>
        <p className={`mt-6 inline-flex items-center gap-3 rounded-[14px] bg-white px-4 py-3 text-[14.5px] text-sc-navy ${card}`}>
          <Sun aria-hidden="true" className="h-5 w-5 shrink-0 text-sc-blue" />
          Familiar faces who learn your screen, your trees and your water.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {FACTORS.map((f) => (
          <li key={f.title} className={`${card} p-6`}>
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-[11px] ring-1 ring-inset ring-sc-navy/[0.12]"
            >
              <f.icon className="h-5 w-5 text-sc-blue" />
            </span>
            <h3 className="mt-4 text-[17px] font-[650] leading-snug text-sc-navy">{f.title}</h3>
            <p className={`mt-2 text-[14.5px] leading-[1.6] ${muted}`}>{f.body}</p>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

// ── C. The flat rate ──────────────────────────────────────────────────────

const INCLUDED = [
  'Weekly visit on a set day',
  'All standard chemicals',
  'Brushing, skimming & vacuuming',
  'Full water chemistry balance',
  'Skimmer & pump basket cleaning',
  'Filter & equipment check',
  'Salt-cell check (salt pools)',
  'Photo report after every visit',
];
const NEVER = ['"Extra chlorine" line items', '"High-demand month" surcharges', 'Per-visit chemical add-ons', 'Long-term contracts'];

// The paper quote (white) and its navy "no" beside it: the proposal-card pairing.
const FlatRate = () => (
  <section aria-labelledby="sem-rate-title" className={`bg-white ${sectionY}`}>
    <Container>
      <div className="mx-auto max-w-[44rem] text-center">
        <Eyebrow centered>One flat rate</Eyebrow>
        <h2 id="sem-rate-title" className={`${h2} text-sc-navy`}>
          The price we quote is the price you pay.
        </h2>
        <p className={`${lead} mx-auto max-w-[38rem]`}>
          Plenty of pool companies let the monthly bill creep with chemical add-ons you can&rsquo;t verify. We
          don&rsquo;t. Here&rsquo;s exactly what&rsquo;s in your rate, and what you&rsquo;ll never see tacked on.
        </p>
      </div>

      <div className="mt-12 grid gap-5 min-[960px]:grid-cols-[1.25fr_1fr]">
        <div className={`${card} p-7 sm:p-9`}>
          <h3 className="flex items-center gap-3 text-[20px] font-[650] tracking-[-0.02em] text-sc-navy">
            <span aria-hidden="true" className="cw-tile grid h-10 w-10 place-items-center rounded-[11px] text-white">
              <Wallet className="h-5 w-5" />
            </span>
            In your flat rate
          </h3>
          <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[15px] leading-snug text-sc-navy/[0.85]">
                <Check aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sc-blue" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="cw-dark rounded-[20px] p-7 text-white sm:p-9">
          <h3 className="flex items-center gap-3 text-[20px] font-[650] tracking-[-0.02em]">
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-[11px] bg-white/[0.08] ring-1 ring-inset ring-white/15">
              <X className="h-5 w-5 text-white/70" />
            </span>
            What you&rsquo;ll never see
          </h3>
          <ul className="mt-6 grid gap-3">
            {NEVER.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[15px] leading-snug text-white/70">
                <X aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-white/40" />
                <span className="line-through decoration-white/35">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-white/10 pt-5 text-[14px] leading-[1.6] text-white/65">
            Anything larger than weekly care, a pump, a heater or bringing a green pool back, carries its own number,
            and you sign off on it first.
          </p>
        </div>
      </div>
    </Container>
  </section>
);

// ── D. How it runs ────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: CalendarCheck,
    title: 'Same day, every week',
    body: 'Your pool sits on a set route with a set day and a set list of work. Nothing to remind us about, nothing to chase.',
  },
  {
    icon: FileText,
    title: 'Photo report when we leave',
    body: 'An email lands within the hour: where your numbers sat, the work that got done, and photos to prove it.',
  },
  {
    icon: MessageSquareText,
    title: 'A real person to text',
    body: 'A question, a heads-up, an extra clean before company comes? Text or call us for a same-day reply.',
  },
];

const darkChip =
  'inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3.5 py-2 text-[13.5px] font-medium text-white ring-1 ring-inset ring-white/14';

const HowItRuns = () => (
  <section aria-labelledby="sem-runs-title" className={`cw-dark relative overflow-hidden ${sectionY}`}>
    <div aria-hidden="true" className="cw-dark-glow absolute inset-0" />
    <Container className="relative">
      <Eyebrow gold>How it runs</Eyebrow>
      <h2 id="sem-runs-title" className={`${h2} text-white`}>
        Set it up once, then forget it.
      </h2>
      <p className={`${leadOnDark} max-w-[36rem]`}>
        Weekly service earns its keep by disappearing. A few minutes at the start, and after that your pool stops being
        something you think about.
      </p>

      {/* A thread through the three steps on wide screens. */}
      <ol className="relative mt-14 grid gap-10 min-[960px]:grid-cols-3 min-[960px]:gap-8">
        <span
          aria-hidden="true"
          className="absolute left-[22px] right-[22px] top-[22px] hidden h-px bg-[linear-gradient(90deg,rgba(255,194,38,0.6),rgba(255,194,38,0.15))] min-[960px]:block"
        />
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative">
            <span
              aria-hidden="true"
              className="relative grid h-11 w-11 place-items-center rounded-full bg-[linear-gradient(#ffbf2f,#ffa90a)] text-sc-ink shadow-[0_0_0_6px_#24395a]"
            >
              <s.icon className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-sc-glacier">Step {i + 1}</p>
            <h3 className="mt-1.5 text-[19px] font-[650] leading-snug text-white">{s.title}</h3>
            <p className="mt-2 max-w-[22rem] text-[15px] leading-[1.6] text-white/[0.72]">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-8">
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

const chip = 'inline-flex rounded-full bg-white px-[13px] py-[7px] text-[14px] font-medium text-sc-navy ring-1 ring-sc-navy/10';
// Padding stretches the tap target to 44px; the negative margin keeps the line.
const areaLink = `-my-3 inline-block py-3 font-semibold text-sc-blue underline decoration-sc-blue/30 decoration-1 underline-offset-[3px] transition hover:decoration-sc-blue ${focusRing}`;

const ServiceArea = () => (
  <section aria-labelledby="sem-area-title" className={`bg-sc-mist ${sectionY}`}>
    <Container className="grid items-center gap-12 min-[1024px]:grid-cols-[1.1fr_0.9fr] min-[1024px]:gap-16">
      <div>
        <Eyebrow>Where we run our routes</Eyebrow>
        <h2 id="sem-area-title" className={`${h2} text-sc-navy`}>
          Pool service in every corner of Seminole.
        </h2>
        <p className={lead}>
          Structured weekly routes through mid-Pinellas mean your pool gets a set day every week, not a vague
          &ldquo;sometime this week.&rdquo;
        </p>

        <ul aria-label="Seminole neighborhoods we serve" className="mt-7 flex flex-wrap gap-2">
          {NEIGHBORHOODS.map((n) => (
            <li key={n} className={chip}>
              {n}
            </li>
          ))}
        </ul>
        <p className={`mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] ${muted}`}>
          <MapPin aria-hidden="true" className="h-4 w-4 text-sc-blue" />
          <span className="font-semibold text-sc-navy">ZIP codes:</span> {ZIPS.join(' · ')}
        </p>

        <p className={`mt-6 text-[15px] leading-[1.6] ${muted}`}>
          Don&rsquo;t see your street? If your pool has a Seminole address, a truck likely already passes it. We also
          serve{' '}
          <Link to="/largo-fl/" className={areaLink}>
            Largo
          </Link>{' '}
          and{' '}
          <Link to="/treasure-island-fl/" className={areaLink}>
            Treasure Island
          </Link>
          .
        </p>
        <QuoteButton label="Check my address" className="mt-[26px]" />
      </div>

      {/* The stylized route map: wide screens only, the chips carry it on phones. */}
      <div className="hidden justify-center min-[1024px]:flex">
        <SeminoleCoverageMap />
      </div>
    </Container>
  </section>
);

// ── F. FAQ ────────────────────────────────────────────────────────────────

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section aria-labelledby="sem-faq-title" className={`bg-white ${sectionY}`}>
      <Container className="grid items-start gap-10 min-[960px]:grid-cols-[0.8fr_1.2fr] min-[960px]:gap-16">
        <div>
          <Eyebrow>Seminole pool service</Eyebrow>
          <h2 id="sem-faq-title" className={`${h2} text-sc-navy`}>
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
          {seminoleFaqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.q} className={`faq-item border-b border-sc-navy/10 ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    id={`sem-faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`sem-faq-a-${i}`}
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
                      id={`sem-faq-a-${i}`}
                      role="region"
                      aria-labelledby={`sem-faq-q-${i}`}
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

// Same field names and values as the form this replaced (enclosure, usage);
// the submit is useQuoteFormSubmit, shared with ServiceQuoteForm, so the lead
// arrives as before.
const ENCLOSURE_OPTIONS = [
  { value: 'screened', label: 'Screened' },
  { value: 'open', label: 'Open' },
  { value: 'partial', label: 'Partly' },
];
const USAGE_OPTIONS = [
  { value: 'daily', label: 'Most days' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'occasionally', label: 'Now & then' },
];

const fieldLabel = `mb-1.5 mt-4 block text-[12px] font-semibold ${muted}`;
// 16px on phones so iOS doesn't zoom into the field on focus.
const inputClass =
  'h-[46px] w-full rounded-[10px] bg-white px-3.5 text-base text-sc-navy ring-1 ring-inset ring-sc-navy/15 transition outline-none focus:ring-2 focus:ring-sc-blue min-[960px]:text-[15px]';

/**
 * A three-way choice as buttons. The hidden input carries the value under
 * `name` and stays required: an empty submit stops on it like any other
 * field, with our message in place of the browser bubble.
 */
const Segment = ({
  name,
  label,
  options,
  missingText,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  missingText: string;
}) => {
  const [value, setValue] = useState('');
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const labelId = `quote-${name}-label`;
  return (
    <>
      <p id={labelId} className={fieldLabel}>
        {label}
      </p>
      <div ref={ref} role="group" aria-labelledby={labelId} className="relative grid grid-cols-3 gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setValue(o.value);
                setMissing(false);
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
          name={name}
          value={value}
          onChange={() => {}}
          required
          tabIndex={-1}
          aria-hidden="true"
          onInvalid={(e) => {
            e.preventDefault();
            setMissing(true);
            // Bring focus here only when this is the first field still missing.
            const input = e.currentTarget;
            const first = Array.from(input.form?.elements ?? []).find(
              (el) => !(el as HTMLInputElement).validity?.valid,
            );
            if (first === input) requestAnimationFrame(() => ref.current?.querySelector('button')?.focus());
          }}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
      </div>
      {missing && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-red-700">
          {missingText}
        </p>
      )}
    </>
  );
};

const QuoteSection = () => {
  const { submitted, setSubmitted, loading, error, turnstile, handleSubmit } = useQuoteFormSubmit('seminole-quote-form');

  return (
    <section id="quote" aria-labelledby="sem-quote-title" className={`cw-dark scroll-mt-24 ${sectionY}`}>
      <Container className="grid items-center gap-12 min-[960px]:grid-cols-2 min-[960px]:gap-14">
        <div>
          <Eyebrow gold>Your Seminole quote</Eyebrow>
          <h2 id="sem-quote-title" className={`${h2} text-white`}>
            For the pool you actually swim in.
          </h2>
          <p className={`${leadOnDark} max-w-[36rem]`}>
            A pool used most days needs different care than one that sits. Tell us whether it&rsquo;s screened and how
            often the family&rsquo;s in it, and you&rsquo;ll have one flat monthly price the same day.
          </p>
          <ul className="mt-6 grid gap-3">
            {[
              'Screen-enclosure debris cleared, not just the water',
              'Chemistry kept for daily swimming, not a showroom',
              'The price we quote is the price you pay',
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
            . Text a photo of the pool for a tighter number.
          </p>
        </div>

        <div className="rounded-[22px] bg-white p-6 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.5)] sm:p-[30px]">
          {submitted ? (
            <div className="py-6 text-center">
              <CheckCircle aria-hidden="true" className="mx-auto h-12 w-12 text-[#0e9f57]" />
              <h3 className="mt-4 text-[20px] font-[650] text-sc-navy">Got it — we will be in touch today.</h3>
              <p className={`mt-2 text-[15px] leading-[1.6] ${muted}`}>
                We will come back with your flat weekly rate and the day your pool would be on our Seminole route.
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

              <h3 className="text-[20px] font-[650] leading-tight text-sc-navy">Get your Seminole pool cleaning price</h3>
              <p className={`mt-1 text-[14px] ${muted}`}>Takes about a minute. No obligation.</p>

              <Segment
                name="enclosure"
                label="Is the pool screened in?"
                options={ENCLOSURE_OPTIONS}
                missingText="Choose screened, open or partly."
              />
              <Segment
                name="usage"
                label="How often does it get used?"
                options={USAGE_OPTIONS}
                missingText="Choose how often it gets used."
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

// Matched to inland pools: stabilizer creep, cloudy water, salt, pumps.
const GUIDES = [
  {
    to: '/pool-care/cyanuric-acid/',
    title: 'Cyanuric acid & your chlorine',
    line: 'Why stabilizer climbs, and how to fix it.',
  },
  { to: '/pool-care/cloudy-pool-water/', title: 'Why is my pool cloudy?', line: 'The usual causes, and the fixes.' },
  { to: '/pool-care/salt-water-vs-chlorine/', title: 'Salt water vs. chlorine', line: 'The honest comparison, costs and all.' },
  { to: '/pool-care/variable-speed-pumps/', title: 'Variable-speed pumps', line: 'What a swap does to your electric bill.' },
];

const Guides = () => (
  <section aria-labelledby="sem-guides-title" className="bg-white py-[72px]">
    <Container>
      <Eyebrow>Free guides</Eyebrow>
      <h2 id="sem-guides-title" className="mt-3 text-[24px] font-[650] leading-tight tracking-[-0.03em] text-sc-navy">
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

const SeminoleBelowFold = () => (
  <>
    <FullTimeHomes />
    <InlandConditions />
    <FlatRate />
    <HowItRuns />
    <ServiceArea />
    <Faq />
    <QuoteSection />
    <Guides />
  </>
);

export default SeminoleBelowFold;
