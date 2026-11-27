import { Droplets, FlaskConical, MessageSquare, Phone, Settings2 } from 'lucide-react';
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
  smallCaps,
} from '@/components/landing/locationKit';
import { LocationStickyBar } from '@/components/landing/LocationStickyBar';
import { ShortQuoteForm } from '@/components/landing/ShortQuoteForm';
import { Footer } from '@/components/Footer';
import { SmartLink as Link } from '@/components/SmartLink';
import { PHONE_DISPLAY, PHONE_HREF, SMS_HREF } from '@/lib/contact';
import { gulfportFaqs } from '@/pages/gulfportFaqs';
import { usePageMeta, FONTS } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

/*
 * The Gulfport location page, on the homepage's design system with its own
 * layouts and copy. Only the hero's two-column frame, the buttons, the header,
 * the footer and the bottom bar are shared with Belleair Beach; every section
 * below the hero is laid out differently on purpose.
 *
 * Techs alternate on this page's routes: the copy promises the set day and a
 * technician who knows the pool, never one permanent person (Belleair Beach
 * is the only page that does).
 *
 * Not built yet, on purpose: a reviews section (until there are Gulfport
 * reviews) and any photo beyond the hero background.
 *
 * TODO(owner), before launch:
 *  1. The "two weeks free" offer and its terms (hero, stepper, offer card,
 *     FAQ, quote card). It is not in the Service Agreement today.
 *  2. The reworded Always Blue Guarantee and cancellation terms match the
 *     Service Agreement (offer section).
 *  3. What the flat rate includes and what is priced separately (plan card).
 *  4. That we service homes inside Pasadena Yacht & Country Club and
 *     community pools such as Town Shores (areas).
 *  5. The local descriptions in the "up against" rows and the areas.
 *  6. The sample visit times and readings are presented as samples.
 *  7. A real Gulfport pool photo for the hero (see HERO_IMG).
 */

const PAGE_TITLE = 'Gulfport Pool Cleaning & Service | Suncoast Pool Pros';
const PAGE_DESC =
  'Weekly pool cleaning in Gulfport, FL. A technician who knows your pool on a set day, standard chemicals in one flat rate, and a report after every visit. Two weeks free.';

// TODO(owner): a real Gulfport pool photo. Treasure Island's stands in (a
// modest backyard pool under shade trees suits this page better than a
// waterfront estate). To swap it, add files under NEW names (immutable image
// caching) and change these paths; heroPreload reads them too.
const HERO_IMG = {
  mobile: '/treasure-island-hero-mobile-v2.webp',
  tablet: '/treasure-island-hero-1536.webp',
  desktop: '/treasure-island-hero-1536.webp',
  wide: '/treasure-island-hero-1920.webp',
  fallback: '/treasure-island-hero.jpg',
  // The landscape Treasure Island files carry dark bars baked into their top
  // and bottom (~8% of the height each). From 768px the image box runs 9.25%
  // past the hero's top and bottom so the bars fall outside it. The phone file
  // is clean. Set false for a clean photo.
  letterboxed: true,
};

// ── 1. Hero ─────────────────────────────────────────────────────────────────

// TODO(owner): sample times and readings, labelled "Sample" on the card.
const TIMELINE = [
  ['9:12 AM', 'Arrived. GPS check-in at your address.'],
  ['9:14 AM', 'Surface skimmed, baskets emptied.'],
  ['9:26 AM', 'Walls brushed, floor vacuumed.'],
  ['9:38 AM', 'Water tested: chlorine 3.2, pH 7.5.'],
  ['9:44 AM', 'Chemicals added, equipment checked.'],
  ['9:47 AM', 'Report and photos sent to your inbox.'],
] as const;

const TimelineCard = () => (
  <div className="rounded-[12px] bg-white p-6 shadow-[0_0_0_1px_rgba(16,24,40,0.05),0_24px_60px_-18px_rgba(16,24,40,0.45)] sm:p-7">
    <div className="flex items-baseline justify-between gap-4">
      <p className="text-[17px] font-semibold tracking-[-0.01em] text-sc-navy">A Thursday visit in Gulfport</p>
      <p className={smallCaps}>Sample</p>
    </div>
    <ol className="relative mt-6">
      <span
        aria-hidden="true"
        className="absolute bottom-3 left-[7px] top-2 w-0.5 rounded-full bg-gradient-to-b from-[rgba(38,118,182,0.45)] to-[rgba(38,118,182,0.12)]"
      />
      {TIMELINE.map(([time, text], i) => {
        const last = i === TIMELINE.length - 1;
        return (
          <li key={time} className="relative pb-4 pl-8 last:pb-0">
            <span
              aria-hidden="true"
              className={`absolute left-0 top-[3px] h-4 w-4 rounded-full ring-[3px] ring-white ${
                last ? 'bg-white shadow-[inset_0_0_0_2px_#2676b6]' : 'bg-emerald-500'
              }`}
            />
            <p className="text-[12px] leading-none text-sc-navy/55">{time}</p>
            <p className="mt-1.5 text-[15px] leading-[1.4] text-sc-navy">{text}</p>
          </li>
        );
      })}
    </ol>
  </div>
);

const outlinedPhoneButton =
  'inline-flex h-[50px] items-center justify-center gap-2 rounded-[10px] bg-white text-[16px] font-semibold text-sc-navy shadow-[0_0_0_1px_rgba(36,58,85,0.18)]';

// The photo is the hero's background (not a card) from 768px, under a
// left-to-right wash and a fade to white at the bottom (.gulfport-hero-wash).
// Phones: plain #f5f9fd behind the text, the photo only in the lower 58%,
// behind the timeline card. Desktop and sideways tablets fill the screen
// below the header; upright tablets and phones take their natural height.
const Hero = () => (
  <section
    data-cta="hero"
    className="relative overflow-hidden bg-[#f5f9fd] lg:landscape:flex lg:landscape:min-h-[calc(100dvh-64px)] lg:landscape:items-center"
  >
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[58%] overflow-hidden md:inset-0 md:h-auto">
      <picture>
        <source media="(max-width: 767px)" srcSet={HERO_IMG.mobile} type="image/webp" />
        <source media="(max-width: 1023px)" srcSet={HERO_IMG.tablet} type="image/webp" />
        <source srcSet={`${HERO_IMG.desktop} 1x, ${HERO_IMG.wide} 2x`} type="image/webp" />
        <img
          src={HERO_IMG.fallback}
          alt=""
          width={1500}
          height={1000}
          fetchPriority="high"
          decoding="async"
          className={`absolute inset-x-0 top-0 h-full w-full object-cover object-[50%_62%] md:object-[right_30%]${
            HERO_IMG.letterboxed ? ' md:top-[-9.25%] md:h-[118.5%]' : ''
          }`}
        />
      </picture>
    </div>
    <div aria-hidden="true" className="gulfport-hero-wash absolute inset-0" />

    <Container className="relative grid items-center gap-10 pb-14 pt-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-x-9 md:pb-24 md:pt-14 lg:gap-x-16 lg:py-20">
      <div className="min-w-0">
        <h1 className="text-[36px] font-semibold leading-[1.06] tracking-[-0.03em] text-[#243a55] md:text-[40px] lg:text-[48px] lg:leading-[1.07]">
          Gulfport pool cleaning that shows up every week.
        </h1>

        {/* TODO(owner): "Try us free for two weeks" (offer, item 1). */}
        <p className="mt-4 text-pretty text-[17px] leading-[1.6] text-[rgba(36,58,85,0.78)] md:hidden">
          Set day, familiar technician, one flat rate with chemicals in it.{' '}
          <span className="font-semibold text-[#243a55]">Try us free for two weeks.</span>
        </p>
        <p className="mt-4 hidden text-pretty text-[17px] leading-[1.6] text-[rgba(36,58,85,0.78)] md:block lg:mt-5 lg:max-w-[33rem] lg:text-[18px]">
          A set day, a technician who knows your pool, and a report in your inbox when the work is done. One flat
          monthly rate covers the visit and the routine chemicals.{' '}
          <span className="font-semibold text-[#243a55]">Try us free for two weeks.</span>
        </p>

        {/* #get-price: the bottom bar waits for this button to scroll away. */}
        <div className="mt-[26px] md:flex md:flex-wrap md:items-center md:gap-x-6 md:gap-y-3 lg:mt-8">
          <div id="get-price">
            <QuoteLink className="h-[54px] w-full px-[22px] text-[17px] md:h-12 md:w-auto md:px-6 md:text-base" />
          </div>
          <p className="hidden text-[15px] text-sc-navy/70 md:block">
            or{' '}
            <a href={SMS_HREF} className={`${inlineLink} text-sc-navy`}>
              text us a photo of your pool
            </a>
          </p>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 md:hidden">
          <a href={PHONE_HREF} className={outlinedPhoneButton}>
            <Phone aria-hidden="true" className="h-[18px] w-[18px] text-[#2a78b8]" strokeWidth={2.25} />
            Call
          </a>
          <a href={SMS_HREF} className={outlinedPhoneButton}>
            <MessageSquare aria-hidden="true" className="h-[18px] w-[18px] text-[#2a78b8]" strokeWidth={2.25} />
            Text a photo
          </a>
        </div>

        {/* Below 1024px three centred columns split by hairlines (the three
            don't fit one line on a phone); then one row with dividers. */}
        <ul className="mt-7 grid grid-cols-3 items-center divide-x divide-sc-navy/10 border-t border-[rgba(36,58,85,0.12)] pt-4 text-center text-[12.5px] leading-snug text-sc-navy/75 [&>li]:px-1.5 lg:mt-10 lg:flex lg:divide-x-0 lg:gap-x-4 lg:whitespace-nowrap lg:pt-5 lg:text-left lg:text-[13.5px] lg:[&>li]:px-0 lg:[&>li+li]:border-l lg:[&>li+li]:border-sc-navy/15 lg:[&>li+li]:pl-4">
          <li>
            <GoogleRating />
          </li>
          <li>Based in St. Petersburg</li>
          <li>No contract</li>
        </ul>
      </div>

      <div className="min-w-0">
        <TimelineCard />
      </div>
    </Container>
  </section>
);

// ── 2. Numbered editorial rows ──────────────────────────────────────────────

// TODO(owner): the local descriptions (item 5).
const CONDITIONS = [
  {
    title: 'Leaves, most weeks of the year',
    body: 'Shaded, tree-lined streets look wonderful and fill a skimmer fast. We clear the surface and the baskets every visit so the pump is never starved of water.',
  },
  {
    title: 'Bay air on the equipment',
    body: 'Boca Ciega Bay is close enough to put salt on pump housings and heater cabinets. We check for corrosion weekly and flag parts before they fail.',
  },
  {
    title: 'Systems that have seen some summers',
    body: 'Plenty of pools here have been in the ground for decades. We learn how yours behaves, keep the filter on schedule, and tell you plainly when a repair is worth doing.',
  },
  {
    title: 'Afternoon storms',
    body: 'A summer downpour dilutes sanitizer and washes debris in. Weekly testing brings the water back into range before algae gets a start.',
  },
];

// No cards. Phones and upright tablets: the numeral in a 56px column, title
// and text stacked beside it. Desktop: numeral, title, text across one row.
const Conditions = () => (
  <section aria-labelledby="conditions-title" className={`bg-white ${sectionY}`}>
    <Container>
      <h2 id="conditions-title" className={`${h2} text-sc-navy`}>
        What a Gulfport pool is up against.
      </h2>
      <p className={lead}>
        Older homes, mature trees and a bay a few blocks away make for a particular kind of pool. This is what we
        plan around.
      </p>
      <ol className="mt-8 border-t border-[rgba(36,58,85,0.12)] md:mt-10">
        {CONDITIONS.map((c, i) => (
          <li
            key={c.title}
            className="grid grid-cols-[56px_minmax(0,1fr)] gap-y-2 border-b border-[rgba(36,58,85,0.12)] py-7 lg:grid-cols-[96px_minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-x-10 lg:py-9"
          >
            <span
              aria-hidden="true"
              className="row-span-2 text-[30px] font-semibold leading-none tracking-[-0.03em] text-[rgba(36,58,85,0.28)] lg:row-span-1 lg:text-[40px]"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="text-[21px] font-semibold leading-[1.25] tracking-[-0.02em] text-sc-navy">{c.title}</h3>
            <p className="col-start-2 text-[16.5px] leading-[1.6] text-sc-navy/[0.78] lg:col-start-3">{c.body}</p>
          </li>
        ))}
      </ol>
    </Container>
  </section>
);

// ── 3. What the rate includes (dark) ────────────────────────────────────────

// TODO(owner): what the flat rate includes and what is priced separately (item 3).
const INCLUDED = [
  'A visit on your set day',
  'Standard chemicals, whatever the water needs that week',
  'Skimming, brushing and vacuuming',
  'Basket and filter care',
  'A look over the pump, filter and heater',
  'An emailed report with readings and photos',
];
const SEPARATE = ['Repairs and replacement parts', 'Bringing a green pool back to clear', 'Clean-up after a named storm'];

const Plan = () => (
  <section aria-labelledby="plan-title" className={`bg-[#0a0d13] ${sectionY}`}>
    <Container className="grid items-center gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-9 lg:gap-20">
      <div className="min-w-0">
        <h2 id="plan-title" className={`${h2} text-white`}>
          Everything in one flat monthly rate.
        </h2>
        <p className={leadDark}>
          No tiers and no add-on menu. Your quote is a single number, and this is what it buys.
        </p>
        <div className="mt-8">
          <QuoteLink />
        </div>
      </div>
      <div className="rounded-[12px] bg-white p-6 shadow-[0_0_0_1px_rgba(16,24,40,0.05),0_24px_60px_-20px_rgba(0,0,0,0.55)] sm:p-8">
        <p className={smallCaps}>Included every week</p>
        <ul className="mt-4 space-y-3">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[16px] leading-[1.5] text-sc-navy">
              <Tick className="mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-sc-navy/10 pt-6">
          <p className={smallCaps}>Priced separately, before any work starts</p>
          <ul className="mt-3 space-y-2">
            {SEPARATE.map((item) => (
              <li key={item} className="text-[15px] leading-[1.5] text-sc-navy/[0.62]">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  </section>
);

// ── 4. Areas ────────────────────────────────────────────────────────────────

// TODO(owner): confirm we service homes inside Pasadena Yacht & Country Club
// and community pools such as Town Shores (item 4), and the descriptions (5).
const AREAS = [
  {
    name: 'Waterfront Arts District',
    body: 'Cottages and bungalows near Beach Boulevard, often with compact pools tucked into shaded yards.',
  },
  {
    name: 'Marina District',
    body: 'Homes close to the municipal marina and the bay, where salt air reaches the equipment pad.',
  },
  {
    name: 'Pasadena Yacht & Country Club',
    body: 'Larger waterfront and golf-course homes. We work with gate access and community rules.',
  },
];

const NEARBY = [
  { name: 'St. Pete Beach', to: '/st-pete-beach-fl/' },
  { name: 'Snell Isle', to: '/snell-isle-fl/' },
  { name: 'Treasure Island', to: '/treasure-island-fl/' },
];

// No cards: columns divided by hairlines. One column on phones, two by two on
// upright tablets, four across from 1024px.
const areaCell =
  'border-b border-[rgba(36,58,85,0.12)] py-6 last:border-b-0 md:max-lg:px-6 md:max-lg:odd:pl-0 md:max-lg:even:border-l md:max-lg:even:pr-0 md:max-lg:[&:nth-child(n+3)]:border-b-0 lg:border-b-0 lg:border-l lg:px-6 lg:py-7 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0';

const Areas = () => (
  <section aria-labelledby="areas-title" className={`bg-[#f7f9fc] ${sectionY}`}>
    <Container>
      <h2 id="areas-title" className={`${h2} text-sc-navy`}>
        Where we work in Gulfport.
      </h2>
      <p className={lead}>From the bungalows near Beach Boulevard to the homes behind the gate at Pasadena.</p>
      <ul className="mt-8 grid border-t border-[rgba(36,58,85,0.12)] md:mt-10 md:grid-cols-2 lg:grid-cols-4">
        {AREAS.map((a) => (
          <li key={a.name} className={areaCell}>
            <h3 className={h3}>{a.name}</h3>
            <p className={`mt-2 ${body}`}>{a.body}</p>
          </li>
        ))}
        <li className={areaCell}>
          <h3 className={h3}>Town Shores and condo communities</h3>
          <p className={`mt-2 ${body}`}>
            Shared pools need steadier chemistry under heavier use. See our{' '}
            <Link to="/services/hoa-pool-service/" className={`${inlineLink} text-sc-navy`}>
              community pool service
            </Link>
            .
          </p>
        </li>
      </ul>
      <p className="mt-8 text-[15px] text-sc-navy/70">
        Also nearby:{' '}
        {NEARBY.map((n, i) => (
          <span key={n.to}>
            {i > 0 && ' · '}
            <Link to={n.to} className={`${inlineLink} text-sc-navy`}>
              {n.name}
            </Link>
          </span>
        ))}
      </p>
    </Container>
  </section>
);

// ── 5. Sample report, three panels ──────────────────────────────────────────

const READINGS = [
  ['Free chlorine', '3.2 ppm'],
  ['pH', '7.5'],
  ['Alkalinity', '96 ppm'],
  ['Stabilizer', '45 ppm'],
] as const;
const WORK = [
  'Skimmed, brushed and vacuumed',
  'Skimmer and pump baskets emptied',
  'Filter pressure checked',
  'Acid added to bring pH down',
];
// Tinted tiles until there are real sample photos (none beyond the hero yet).
const PHOTOS = [
  { label: 'Pool', Icon: Droplets },
  { label: 'Equipment', Icon: Settings2 },
  { label: 'Test kit', Icon: FlaskConical },
];

const SampleReport = () => (
  <section aria-labelledby="report-title" className={`bg-white ${sectionY}`}>
    <Container>
      <h2 id="report-title" className={`${h2} text-sc-navy`}>
        The report you get after each visit.
      </h2>
      <p className={lead}>
        Sent by email before the truck pulls away, so you never have to wonder whether anyone came.
      </p>
      <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-3 lg:gap-5">
        <div className={`${card} p-6`}>
          <p className={smallCaps}>Readings</p>
          <dl className="mt-3 divide-y divide-sc-navy/[0.08]">
            {READINGS.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-[15px] text-sc-navy/[0.78]">{label}</dt>
                <dd className="text-right text-[15px] leading-tight">
                  <span className="font-semibold text-sc-navy">{value}</span>
                  <span className="ml-1.5 text-[13px] text-[#059669] md:max-lg:ml-0 md:max-lg:block">in range</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={`${card} p-6`}>
          <p className={smallCaps}>Work done</p>
          <ul className="mt-4 space-y-3">
            {WORK.map((w) => (
              <li key={w} className="flex items-start gap-3 text-[15px] leading-[1.45] text-sc-navy">
                <Tick className="mt-px" />
                {w}
              </li>
            ))}
          </ul>
        </div>
        <div className={`${card} p-6`}>
          <p className={smallCaps}>Photos</p>
          <ul className="mt-4 grid grid-cols-3 gap-2.5">
            {PHOTOS.map(({ label, Icon }) => (
              <li key={label}>
                <span
                  aria-hidden="true"
                  className="grid aspect-square place-items-center rounded-[8px] bg-[#e6eef7] text-sc-blue/60"
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="mt-1.5 block text-center text-[12.5px] text-sc-navy/70">{label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13.5px] text-sc-navy/60">Taken when the work is finished.</p>
        </div>
      </div>
    </Container>
  </section>
);

// ── 6. Horizontal stepper ───────────────────────────────────────────────────

// TODO(owner): step 3 carries the "two weeks free" offer (item 1).
const STEPS = [
  {
    title: 'Send a photo or fill in the form',
    body: 'One picture of the pool and one of the equipment is usually all we need.',
  },
  {
    title: 'Get your flat rate the same day',
    body: 'We answer Monday to Saturday with a single monthly figure.',
  },
  {
    title: 'We start on our next Gulfport day',
    body: 'Your first two weekly visits are free. Carry on only if you like what you see.',
  },
];

// Not cards. From 768px the steps sit in a row, a 2px line joining their
// circles; on phones the line runs down the left with the text beside it.
const Stepper = () => (
  <section aria-labelledby="steps-title" className={`bg-[#f5f9fd] ${sectionY}`}>
    <Container>
      <h2 id="steps-title" className={`${h2} text-sc-navy`}>
        From first message to first visit.
      </h2>
      <ol className="mt-8 grid md:mt-10 md:grid-cols-3 md:gap-x-6 lg:gap-x-10">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0 md:block md:pb-0"
          >
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-[19px] top-10 w-0.5 bg-[rgba(38,118,182,0.3)] md:bottom-auto md:left-10 md:right-[-24px] md:top-[19px] md:h-0.5 md:w-auto lg:right-[-40px]"
              />
            )}
            <span
              aria-hidden="true"
              className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-[16px] font-semibold text-sc-blue ring-[1.5px] ring-inset ring-[rgba(38,118,182,0.5)]"
            >
              {i + 1}
            </span>
            <div className="min-w-0 pt-2 md:mt-5 md:pr-4 md:pt-0">
              <h3 className={h3}>{s.title}</h3>
              <p className={`mt-1.5 ${body}`}>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Container>
  </section>
);

// ── 7. Offer and promises ───────────────────────────────────────────────────

// TODO(owner): the offer (item 1) and the reworded guarantee and cancellation
// terms (item 2).
const PROMISES = [
  {
    title: 'Always Blue Guarantee',
    body: 'If the water goes off between visits while we are the only ones dosing it, we come back and put it right, free.',
  },
  { title: 'Month to month', body: "Stop with 30 days' notice. There is no contract and no exit fee." },
];

const Offer = () => (
  <section aria-labelledby="offer-title" className={`bg-white ${sectionY}`}>
    <Container className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-5">
      <div className="flex flex-col justify-center rounded-[12px] border border-[#1f7fdb] bg-[rgba(31,127,219,0.045)] p-7 shadow-[0_0_0_1px_#1f7fdb] sm:p-10">
        <h2 id="offer-title" className={`${h2} text-sc-navy`}>
          Two weeks free, then decide.
        </h2>
        <p className="mt-3 max-w-[34rem] text-pretty text-[16px] leading-[1.6] text-sc-navy/[0.78] md:text-[17px]">
          New weekly customers get their first two visits, chemicals included, at no charge. If the pool and the
          reports are not what you hoped for, you stop there and owe nothing.
        </p>
        <div className="mt-7">
          <QuoteLink className="h-12 w-full px-6 text-base sm:w-auto" />
        </div>
      </div>
      <div className="grid gap-4 lg:gap-5">
        {PROMISES.map((p) => (
          <div key={p.title} className={`${card} flex flex-col justify-center px-6 py-6 sm:px-7`}>
            <h3 className={h3}>{p.title}</h3>
            <p className={`mt-2 ${body}`}>{p.body}</p>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

// ── 8. FAQ, one centred column ──────────────────────────────────────────────

const Faq = () => (
  <section data-cta="FAQ" aria-labelledby="faq-title" className={`bg-[#f7f9fc] ${sectionY}`}>
    <Container>
      <div className="mx-auto max-w-[820px]">
        <h2 id="faq-title" className={`${h2} text-center text-sc-navy`}>
          Gulfport pool service, asked and answered.
        </h2>
        <div className="mt-8 md:mt-10">
          <FaqList faqs={gulfportFaqs} />
        </div>
      </div>
    </Container>
  </section>
);

// ── 9. Quote card (#quote) ──────────────────────────────────────────────────

// A contained navy card in a white section, not a full-width dark band.
// Phones: the pitch above the form, 28px × 20px padding. Upright tablets keep
// two columns with a 340px form.
const QuoteSection = () => (
  <section id={QUOTE_ID} data-cta="quote section" aria-labelledby="quote-title" className={`bg-white ${sectionY}`}>
    <Container>
      <div className="gulfport-quote-card grid items-center gap-8 rounded-[12px] px-5 py-7 md:grid-cols-[minmax(0,1fr)_340px] md:gap-8 md:p-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14 lg:p-14">
        <div className="min-w-0">
          <h2 id="quote-title" className={`${h2} text-white`}>
            Get your Gulfport flat rate today.
          </h2>
          {/* TODO(owner): "your first two weeks free" (item 1). */}
          <p className="mt-3 text-pretty text-[16px] leading-[1.6] text-white/[0.75] md:text-[17px]">
            Leave a name and number. We reply the same day, Monday to Saturday, with one monthly price and your first
            two weeks free.
          </p>
          <p className="mt-5 text-[15px] text-white/[0.72]">
            Rather talk?{' '}
            <a href={PHONE_HREF} className={`${inlineLink} whitespace-nowrap text-white`}>
              {PHONE_DISPLAY}
            </a>{' '}
            ·{' '}
            <a href={SMS_HREF} className={`${inlineLink} whitespace-nowrap text-white`}>
              text a photo
            </a>
          </p>
        </div>
        <div className="rounded-[12px] bg-white p-6 shadow-[0_0_0_1px_rgba(16,24,40,0.05),0_24px_50px_-24px_rgba(0,0,0,0.5)] sm:p-7">
          <ShortQuoteForm
            idPrefix="gulfport-quote"
            source="gulfport-quote-form"
            submitLabel="Get my Gulfport quote"
            nameLabel="Full name"
            fieldHeight="h-[54px]"
            buttonHeight="h-[54px]"
            successTitle="Thanks, we have your details."
            successBody="Expect a call or text today with one flat monthly price for your Gulfport pool."
          />
        </div>
      </div>
    </Container>
  </section>
);

// ── Page ────────────────────────────────────────────────────────────────────

// Page JSON-LD, through usePageMeta so it lands in the PRERENDERED head.
// No LocalBusiness node of its own: the site-wide one in index.html (same
// @id, full NAP, Gulfport in its areaServed) is the page's one business
// entity, as on every other location page.
const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: gulfportFaqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Gulfport', path: '/gulfport-fl/' },
  ]),
];

export const GulfportPage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/gulfport-fl/',
    heroPreload: {
      mobile: HERO_IMG.mobile,
      tablet: HERO_IMG.tablet,
      desktop: HERO_IMG.desktop,
      wide: HERO_IMG.wide,
    },
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
        <Conditions />
        <Plan />
        <Areas />
        <SampleReport />
        <Stepper />
        <Offer />
        <Faq />
        <QuoteSection />
      </main>
      <Footer />
      <LocationStickyBar />
    </div>
  );
};
