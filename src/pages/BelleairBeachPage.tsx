import { MessageSquare, Phone } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Container } from '@/components/landing/sectionKit';
import {
  FaqList,
  GoogleRating,
  QUOTE_ID,
  QuoteLink,
  Tick,
  body,
  card,
  h2,
  h3,
  inlineLink,
  lead,
  leadDark,
  scrollToQuote,
  sectionY,
} from '@/components/landing/locationKit';
import { LocationStickyBar } from '@/components/landing/LocationStickyBar';
import { ShortQuoteForm } from '@/components/landing/ShortQuoteForm';
import { Footer } from '@/components/Footer';
import { PHONE_DISPLAY, PHONE_HREF, SMS_HREF } from '@/lib/contact';
import { belleairBeachFaqs } from '@/pages/belleairBeachFaqs';
import { usePageMeta, FONTS } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

/*
 * The Belleair Beach location page, on the homepage's light design system
 * (its tokens, header, footer, buttons, cards and FAQ accordion) with its own
 * layouts and its own copy. No sentence here is on the homepage. It is the
 * indexed page for Belleair Beach and the landing page for paid ads.
 *
 * Belleair Beach is the one page that promises the same technician every
 * week (the owner's sanctioned exception; elsewhere techs alternate).
 *
 * Not built yet, on purpose: a reviews section (until there are Belleair
 * Beach reviews; the homepage's are not reused) and "Meet your technician"
 * (needs a real photo, name and credentials).
 *
 * TODO(owner): the "first two weeks free" offer and its terms. It appears in
 * the hero, the trust row, step 3, the commitments, the FAQ and the form card.
 * It is not in the Service Agreement today; if it isn't approved, replace every
 * mention with the 2-week money-back guarantee wording.
 */

const PAGE_TITLE = 'Belleair Beach Pool Service & Cleaning | Suncoast Pool Pros';
const PAGE_DESC =
  'Weekly pool service for Belleair Beach homes. The same technician every week, chemicals included, and a photo report after every visit. First two weeks on us.';

// The hero photo's files. Phones get the 800px landscape crop (the frame is
// ~343×250); tablets and up the 1535, or the 1920 at 2x. heroPreload below
// mirrors these exactly, so each screen preloads only the file it paints.
const HERO_IMG = {
  mobile: '/belleair-beach-hero-mobile.webp',
  mobileJpg: '/belleair-beach-hero-mobile.jpg',
  desktop: '/belleair-beach-hero.webp',
  wide: '/belleair-beach-hero-1920.webp',
  fallback: '/belleair-beach-hero.jpg',
};

// ── The sample service report card ──────────────────────────────────────────

// A sample, drawn as the real email report lays out a visit. "Alex" names who
// did this one visit, as the real report does.
const READINGS = [
  ['Chlorine', '3.5'],
  ['pH', '7.4'],
  ['Alkalinity', '98'],
  ['Salt', '2,950'],
] as const;

const ReportCard = ({ large = false }: { large?: boolean }) => (
  <figure
    aria-label="Sample visit report"
    className={`rounded-[14px] bg-white shadow-[0_0_0_1px_rgba(16,24,40,0.05),0_12px_24px_-6px_rgba(16,24,40,0.14),0_32px_60px_-16px_rgba(16,24,40,0.30)] ${
      large ? 'p-6 sm:p-7' : 'p-4'
    }`}
  >
    <div className="flex items-center justify-between gap-3">
      <p className={`font-semibold tracking-[-0.01em] text-[#1c2f47] ${large ? 'text-[17px]' : 'text-[14px]'}`}>
        The Whitman Residence
      </p>
      <Tick />
    </div>
    <p className={`mt-0.5 text-[rgba(36,58,85,0.55)] ${large ? 'text-[13px]' : 'text-[11.5px]'}`}>
      Belleair Beach · Thu, 11:42 AM · Alex
    </p>
    <dl className={`grid grid-cols-4 gap-2 border-t border-sc-navy/[0.08] ${large ? 'mt-5 pt-5' : 'mt-3 pt-3'}`}>
      {READINGS.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className={`text-[rgba(36,58,85,0.55)] ${large ? 'text-[12px]' : 'text-[10.5px]'}`}>{label}</dt>
          <dd
            className={`mt-0.5 font-semibold tracking-[-0.02em] text-[#1c2f47] ${large ? 'text-[22px]' : 'text-[17px]'}`}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
    <p
      className={`border-t border-sc-navy/[0.08] text-[rgba(36,58,85,0.62)] ${
        large ? 'mt-5 pt-4 text-[13.5px]' : 'mt-3 pt-2.5 text-[11.5px]'
      }`}
    >
      <span className="font-semibold text-[#059669]">Balanced</span> · GPS verified · 6 photos attached
    </p>
  </figure>
);

// ── 1. Hero ─────────────────────────────────────────────────────────────────

const outlinedPhoneButton =
  'inline-flex h-[50px] items-center justify-center gap-2 rounded-[10px] bg-white text-[16px] font-semibold text-sc-navy shadow-[0_0_0_1px_rgba(36,58,85,0.18)]';

// Phones: text, actions, trust row, then the photo (250px) with the report
// card inset 10px a side and hanging 26px below it. Upright tablets: two
// columns (1.08 / 0.92, 36px gap), photo 440px, card 288px over its
// bottom-left corner. Desktop: photo 500px, card 310px, 36px out and 32px down.
const Hero = () => (
  <section data-cta="hero" className="relative bg-[#f5f9fd]">
    <Container className="grid items-center gap-10 pb-[60px] pt-8 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] md:gap-x-9 md:py-14 md:pb-[84px] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-x-16 lg:pb-[104px] lg:pt-[72px]">
      <div className="min-w-0">
        <h1 className="text-[36px] font-semibold leading-[1.06] tracking-[-0.03em] text-[#243a55] md:text-[40px] lg:text-[48px] lg:leading-[1.07]">
          Weekly pool service for Belleair Beach homes.
        </h1>

        {/* TODO(owner): "Your first two weeks are on us" (see the header note). */}
        <p className="mt-4 text-pretty text-[17px] leading-[1.6] text-[rgba(36,58,85,0.78)] md:hidden">
          One technician, the same day each week. Chemicals included, no contract.{' '}
          <span className="font-semibold text-[#243a55]">Your first two weeks are on us.</span>
        </p>
        <p className="mt-4 hidden text-pretty text-[17px] leading-[1.6] text-[rgba(36,58,85,0.78)] md:block lg:mt-5 lg:text-[18px]">
          One technician who knows your pool, on the same day each week. Chemicals are part of the rate, each visit
          is GPS-stamped, and you can stop whenever you like.{' '}
          <span className="font-semibold text-[#243a55]">Your first two weeks are on us.</span>
        </p>

        {/* #get-price: the bottom bar waits for this button to scroll away. */}
        <div className="mt-[26px] md:flex md:flex-wrap md:items-center md:gap-x-6 md:gap-y-3 lg:mt-8">
          <div id="get-price">
            <QuoteLink className="h-[54px] w-full px-[22px] text-[17px] md:h-12 md:w-auto md:px-6 md:text-base" />
          </div>
          <div className="hidden md:block">
            <p className="text-[13px] leading-snug text-[rgba(36,58,85,0.62)]">prefer the phone?</p>
            <a
              href={PHONE_HREF}
              className="block text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[#243a55] underline-offset-[3px] hover:underline"
            >
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 md:hidden">
          <a href={PHONE_HREF} className={outlinedPhoneButton}>
            <Phone aria-hidden="true" className="h-[18px] w-[18px] text-[#2a78b8]" strokeWidth={2.25} />
            Call
          </a>
          <a href={SMS_HREF} className={outlinedPhoneButton}>
            <MessageSquare aria-hidden="true" className="h-[18px] w-[18px] text-[#2a78b8]" strokeWidth={2.25} />
            Text us
          </a>
        </div>

        {/* One line at every width: spread across it below 1024px, then
            side by side with hairline dividers. */}
        <ul className="mt-7 flex items-center justify-between gap-2 whitespace-nowrap border-t border-[rgba(36,58,85,0.12)] pt-4 text-[12.5px] text-sc-navy/75 lg:mt-10 lg:justify-start lg:gap-4 lg:pt-5 lg:text-[13.5px] lg:[&>li+li]:border-l lg:[&>li+li]:border-sc-navy/15 lg:[&>li+li]:pl-4">
          <li>
            <GoogleRating />
          </li>
          <li>First two weeks free</li>
          <li>No contract</li>
        </ul>
      </div>

      <div className="relative min-w-0">
        <div className="relative h-[250px] overflow-hidden rounded-[12px] bg-sc-sky/20 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_16px_40px_-16px_rgba(16,24,40,0.22)] md:h-[440px] lg:h-[500px]">
          <picture>
            <source media="(max-width: 767px)" type="image/webp" srcSet={HERO_IMG.mobile} />
            <source media="(max-width: 767px)" srcSet={HERO_IMG.mobileJpg} />
            <source type="image/webp" srcSet={`${HERO_IMG.desktop} 1x, ${HERO_IMG.wide} 2x`} />
            <img
              src={HERO_IMG.fallback}
              alt="Waterfront pool at a Belleair Beach, FL home"
              width={1535}
              height={1024}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-[50%_62%]"
            />
          </picture>
        </div>
        <div className="absolute inset-x-2.5 -bottom-[26px] md:inset-x-auto md:-bottom-7 md:-left-5 md:w-[288px] lg:-bottom-8 lg:-left-9 lg:w-[310px]">
          <ReportCard />
        </div>
      </div>
    </Container>
  </section>
);

// ── 2. Care ─────────────────────────────────────────────────────────────────

const CARE = [
  {
    title: 'One technician, not a rotation',
    body: 'The person at your gate each week is the same one: background-checked, and familiar with your equipment, your access and your preferences.',
  },
  {
    title: 'Chemistry set for coastal sun',
    body: 'Strong UV burns through chlorine by mid-afternoon. We hold stabilizer and sanitizer in the range that lasts from one visit to the next.',
  },
  {
    title: 'An eye on the equipment pad',
    body: 'Salt air shortens the life of heaters, pump fittings and salt cells. We look them over on every visit and tell you early when something is wearing.',
  },
  {
    title: 'Cared for while the house is empty',
    body: 'If you spend part of the year elsewhere, the schedule does not change. Each visit is verified and photographed, so the pool is ready when you return.',
  },
];

// Phones: stacked, 10px apart, 18px × 20px padding. Two by two from 768px.
const cardPad = 'px-5 py-[18px] md:px-[26px] md:pb-6 md:pt-[26px]';

const Care = () => (
  <section aria-labelledby="care-title" className={`bg-white ${sectionY}`}>
    <Container>
      <h2 id="care-title" className={`${h2} text-sc-navy`}>
        Pool care shaped by where Belleair Beach sits.
      </h2>
      <p className={lead}>
        Gulf on one side, Intracoastal on the other. Salt, sun and wind work on a pool here every day of the year, so
        the service is built around them.
      </p>
      <ul className="mt-8 grid gap-2.5 md:mt-10 md:grid-cols-2 md:gap-4 lg:gap-5">
        {CARE.map((c) => (
          <li key={c.title} className={`${card} ${cardPad}`}>
            <h3 className={h3}>{c.title}</h3>
            <p className={`mt-2 ${body}`}>{c.body}</p>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

// ── 3. Report (dark) ────────────────────────────────────────────────────────

const REPORT_POINTS = [
  { title: 'Arrival confirmed by GPS', body: 'The visit is time-stamped at your address.' },
  {
    title: 'Water readings recorded',
    body: 'Chlorine, pH, alkalinity, salt and more, with anything out of range explained.',
  },
  { title: 'Chemicals itemised', body: 'What went in and how much, so nothing is a mystery.' },
  { title: 'Photos of the finished pool', body: 'Taken once the work is done.' },
];

const Report = () => (
  <section aria-labelledby="report-title" className={`bg-[#0a0d13] ${sectionY}`}>
    <Container className="grid items-center gap-10 md:grid-cols-2 md:gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-20">
      <div className="min-w-0">
        <h2 id="report-title" className={`${h2} text-white`}>
          See every visit, wherever you are.
        </h2>
        <p className={leadDark}>
          A written report follows each service, usually within minutes. It is the simplest way to know the pool is
          looked after when you are not standing beside it.
        </p>
        <ul className="mt-8">
          {REPORT_POINTS.map((p) => (
            <li key={p.title} className="border-t border-white/10 py-4 last:pb-0">
              <h3 className="text-[16.5px] font-semibold tracking-[-0.01em] text-white">{p.title}</h3>
              <p className="mt-1 text-[15.5px] leading-[1.6] text-white/[0.72]">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-full max-w-[440px] justify-self-center md:justify-self-end">
        <ReportCard large />
      </div>
    </Container>
  </section>
);

// ── 4. Checklist ────────────────────────────────────────────────────────────

// TODO(owner): confirm these eight match what technicians do on every visit.
const CHECKLIST = [
  'Surface skimmed clear of leaves, palm fronds and blown sand',
  'Walls, steps and tile line brushed',
  'Floor vacuumed',
  'Skimmer and pump baskets emptied',
  'Filter checked, then cleaned or backwashed when due',
  'Water tested and balanced: chlorine, pH, alkalinity, stabilizer, salt',
  'Equipment pad inspected for corrosion, leaks and scale on the salt cell',
  'Routine chemicals added at no extra charge',
];

// Upright tablets: the items in two columns inside the card (the hairline
// above each row, except the first row of each column).
const Checklist = () => (
  <section aria-labelledby="checklist-title" className={`bg-[#f7f9fc] ${sectionY}`}>
    <Container className="grid gap-8 md:gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
      <div>
        <h2 id="checklist-title" className={`${h2} text-sc-navy`}>
          Eight things done at your pool every week.
        </h2>
        <p className={lead}>The routine does not vary with the season or with who is home.</p>
      </div>
      <ul className="rounded-[12px] bg-white px-5 shadow-[0_0_0_1px_rgba(36,58,85,0.08)] sm:px-6 md:grid md:grid-cols-2 md:gap-x-8 lg:block">
        {CHECKLIST.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 border-t border-sc-navy/10 py-4 text-[16px] leading-[1.5] text-sc-navy first:border-t-0 md:max-lg:[&:nth-child(2)]:border-t-0"
          >
            <Tick className="mt-0.5" />
            {item}
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

// ── 5. Getting started ──────────────────────────────────────────────────────

// TODO(owner): confirm the steps (same-day reply Monday to Saturday, start on
// the next route day) match how new enquiries are handled. Step 3 carries the
// two-free-weeks offer (see the header note).
const STEPS = [
  {
    title: 'Ask for a quote',
    body: 'Use the form below, call, or text a photo of the pool and its equipment. We reply the same day, Monday to Saturday.',
  },
  {
    title: 'Receive one flat price',
    body: 'A single monthly figure with routine chemicals inside it. Nothing is added later for chlorine demand.',
  },
  {
    title: 'Two weeks on us',
    body: 'Your technician begins on the next route day. The first two weekly visits cost nothing, and you decide after that.',
  },
];

// Phones: compact rows, the number in a 40px column beside the text.
// Three across from 768px.
const GettingStarted = () => (
  <section aria-labelledby="start-title" className={`bg-white ${sectionY}`}>
    <Container>
      <h2 id="start-title" className={`${h2} text-sc-navy`}>
        Starting service takes one short conversation.
      </h2>
      <p className={lead}>Nothing to sign up front, and you do not have to be at the house.</p>
      <ol className="mt-8 grid gap-2.5 md:mt-10 md:grid-cols-3 md:gap-4 lg:gap-5">
        {STEPS.map((s, i) => (
          <li key={s.title} className={`${card} ${cardPad} grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 md:block`}>
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full text-[16px] font-semibold text-sc-blue ring-1 ring-inset ring-[rgba(38,118,182,0.35)]"
            >
              {i + 1}
            </span>
            <div className="min-w-0 md:mt-5">
              <h3 className={h3}>{s.title}</h3>
              <p className={`mt-1.5 ${body}`}>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8 md:mt-10">
        <QuoteLink className="h-12 w-full px-6 text-base sm:w-auto" />
      </div>
    </Container>
  </section>
);

// ── 6. Commitments ──────────────────────────────────────────────────────────

// TODO(owner): confirm the reworded Always Blue Guarantee and the cancellation
// terms match the Service Agreement; "First two weeks free" is the offer in
// the header note.
const COMMITMENTS = [
  {
    title: 'First two weeks free',
    body: 'Two complete weekly visits with chemicals, at no cost, for new weekly customers. Continue only if the pool and the reports meet your standard.',
  },
  {
    title: 'Always Blue Guarantee',
    body: 'Clear, balanced water between visits as well as on service day. If it slips while we alone manage the chemistry, we return and correct it without charge.',
  },
  {
    title: 'No contract',
    body: "Service runs month to month. Give 30 days' notice to stop, with no cancellation fee.",
  },
];

const Commitments = () => (
  <section aria-labelledby="commit-title" className={`bg-[#f7f9fc] ${sectionY}`}>
    <Container>
      <h2 id="commit-title" className={`${h2} text-sc-navy`}>
        What we commit to before you pay anything.
      </h2>
      <p className={lead}>Each of these is set out in the Service Agreement.</p>
      <ul className="mt-8 grid gap-2.5 md:mt-10 md:grid-cols-3 md:gap-4 lg:gap-5">
        {COMMITMENTS.map((c) => (
          <li key={c.title} className={`${card} ${cardPad}`}>
            <h3 className={h3}>{c.title}</h3>
            <p className={`mt-2 ${body}`}>{c.body}</p>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

// ── 7. FAQ ──────────────────────────────────────────────────────────────────

const Faq = () => (
  <section data-cta="FAQ" aria-labelledby="faq-title" className={`bg-[#f5f9fd] ${sectionY}`}>
    <Container className="grid gap-8 md:gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
      <div>
        <h2 id="faq-title" className={`${h2} text-sc-navy`}>
          Questions from Belleair Beach owners.
        </h2>
        <p className={lead}>
          Prefer to ask in person? Call{' '}
          <a href={PHONE_HREF} className={`${inlineLink} whitespace-nowrap text-sc-navy`}>
            {PHONE_DISPLAY}
          </a>
          , Monday to Saturday, 8 AM to 6 PM.
        </p>
      </div>
      <FaqList faqs={belleairBeachFaqs} />
    </Container>
  </section>
);

// ── 8. Quote form (dark, #quote) ────────────────────────────────────────────

const QUOTE_POINTS = [
  'A photo report after every visit, so you see the pool without being there',
  'Every scheduled visit made, storm weeks included',
  'Chemicals in the price, and no contract',
];

// Phones: the form card first. The heading, rating and paragraph are only
// visually hidden there (the card has its own heading); the points and the
// phone line follow the card. Two equal columns on upright tablets.
const QuoteSection = () => (
  <section
    id={QUOTE_ID}
    data-cta="quote section"
    aria-labelledby="quote-title"
    className={`border-b border-white/[0.08] bg-[#0a0d13] ${sectionY}`}
  >
    <Container className="grid items-center gap-8 md:grid-cols-2 md:gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-20">
      <div className="min-w-0">
        <div className="max-md:sr-only">
          <h2
            id="quote-title"
            className="text-balance text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-white"
          >
            Get your flat weekly rate for Belleair Beach.
          </h2>
          <p className="mt-3 text-[14px] text-white/[0.72]">
            <GoogleRating strongClass="font-semibold text-white" />
          </p>
          <p className="mt-4 text-pretty text-[16px] leading-[1.6] text-white/[0.72] md:text-[17px]">
            Leave your name and number and we&rsquo;ll come back the same day with one flat monthly price, whether
            you&rsquo;re here all year or checking the photo reports from somewhere else.
          </p>
        </div>
        <ul className="space-y-3 md:mt-7">
          {QUOTE_POINTS.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[15.5px] leading-[1.55] text-white/[0.85]">
              <Tick className="mt-0.5" />
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[15px] text-white/[0.72]">
          Prefer to talk?{' '}
          <a href={PHONE_HREF} className={`${inlineLink} text-white`}>
            Call or text {PHONE_DISPLAY}
          </a>
          .
        </p>
      </div>

      {/* TODO(owner): "Your first two weeks are on us" (see the header note). */}
      <div className="w-full rounded-[12px] bg-white p-6 shadow-[0_0_0_1px_rgba(16,24,40,0.05),0_24px_60px_-20px_rgba(0,0,0,0.55)] max-md:order-first sm:p-8 lg:max-w-[460px] lg:justify-self-end">
        <p className="text-balance text-[21px] font-semibold leading-[1.25] tracking-[-0.02em] text-sc-navy">
          Your first two weeks are on us.
        </p>
        <p className="mt-1.5 text-[15.5px] leading-[1.55] text-[rgba(36,58,85,0.78)]">
          Tell us where to reach you and we&rsquo;ll reply the same day with your flat monthly rate.
        </p>
        <div className="mt-6">
          <ShortQuoteForm
            idPrefix="belleair-quote"
            source="belleair-beach-quote-form"
            submitLabel="Get My Belleair Beach Quote"
            fieldHeight="h-14 md:h-[52px]"
            buttonHeight="h-14 md:h-[52px]"
            footnote={<>Text a photo of the pool and equipment to <span className="whitespace-nowrap">{PHONE_DISPLAY}</span> for a tighter number.</>}
            successTitle="Got it — we will be in touch today."
            successBody="We will come back with your flat weekly rate and the day your pool would sit on our Belleair Beach route."
          />
        </div>
      </div>
    </Container>
  </section>
);

// ── Page ────────────────────────────────────────────────────────────────────

// Page JSON-LD, through usePageMeta so it lands in the PRERENDERED head.
// No LocalBusiness node of its own: the site-wide one in index.html (same
// @id, full NAP, Belleair Beach in its areaServed) is the page's one business
// entity. A second node with that @id but a different url and areaServed read
// as two conflicting businesses (removed from Clearwater and St. Pete Beach
// for the same reason).
const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: belleairBeachFaqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Belleair Beach', path: '/belleair-beach-fl/' },
  ]),
];

export const BelleairBeachPage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/belleair-beach-fl/',
    heroPreload: { mobile: HERO_IMG.mobile, desktop: HERO_IMG.desktop, wide: HERO_IMG.wide },
    // The homepage's set: Geist for the page, Montserrat for the wordmark.
    fontPreload: [FONTS.geist, FONTS.montserrat],
    jsonLd: PAGE_SCHEMA,
  });

  // overflow-x-clip, not -hidden: hidden makes the wrapper a scroll
  // container, and the sticky header would stop sticking.
  return (
    <div className="landing-canvas force-static-motion relative min-h-screen overflow-x-clip bg-white font-sans text-sc-navy antialiased max-md:[&_h2]:text-balance">
      <LandingHeader onQuote={scrollToQuote} quoteLabel="Get my free quote" strongPhone />
      <main>
        <Hero />
        <Care />
        <Report />
        <Checklist />
        <GettingStarted />
        <Commitments />
        <Faq />
        <QuoteSection />
      </main>
      <Footer />
      <LocationStickyBar />
    </div>
  );
};
