import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Sun,
  Wind,
  Camera,
  CalendarClock,
  MessageSquareText,
  Plus,
  Minus,
  Users,
  Home,
  Droplets,
  Wrench,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ArrowRight,
  ClipboardCheck,
  Waves,
} from 'lucide-react';
import { Container } from '@/components/Container';
import { SmartLink } from '@/components/SmartLink';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { reviewCard } from '@/components/landing/ReviewCard';
import { GuaranteeCards } from '@/components/landing/GuaranteeCards';
import { REVIEWS } from '@/lib/reviews';
import { stPeteBeachFaqs } from '@/pages/stPeteBeachFaqs';

/*
 * Everything below the St. Pete Beach hero. The page keeps its own layout and
 * copy, in the homepage brand: the gold button with navy text, blue #1f7fdb
 * accents on light sections, Geist headings at weight 600.
 *
 * Light sections alternate white and #f5f7fa, and their cards take the other
 * tone with a hairline border. Dark sections (the photo band, "One pool, two
 * lives", the promise strip, the quote form) sit on the page's navy.
 *
 * Scroll fade-ins run only from 768px with motion allowed (Reveal); on
 * phones and for reduced motion everything is simply there.
 */

// ── Shared styles ──────────────────────────────────────────────────

const h2Base = 'font-display text-3xl md:text-[2.5rem] font-semibold tracking-[-0.02em] leading-tight';
const h2Light = `${h2Base} text-[#243a55]`;
const h2Dark = `${h2Base} text-white`;
const labelLight = 'block mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#1f7fdb]';
const labelDark = 'block mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-light';
const subLight = 'text-base sm:text-lg leading-relaxed text-[#475569]';
const cardEdge = 'border border-[rgba(10,22,40,0.10)]';
const iconBoxLight = 'flex items-center justify-center rounded-xl border border-[#1f7fdb]/20 bg-[#1f7fdb]/10';
const goldButton = 'btn bg-[#f7b500] text-[#243a55] hover:bg-[#ffc01f]';
const linkLight =
  'font-semibold text-[#1f7fdb] underline decoration-[#1f7fdb]/30 underline-offset-[3px] transition-colors hover:text-[#243a55] hover:decoration-[#243a55]';

// ── Scroll reveal (desktop, motion allowed) ────────────────────────

const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const REVEAL_WHEN = '(min-width: 768px) and (prefers-reduced-motion: no-preference)';

// Fades its content up the first time it scrolls into view. Progressive: the
// hidden state (data-reveal="") is only set once this has run, and only for
// content still below the fold, so the prerendered HTML is always visible.
const Reveal = ({
  delay = 0,
  className = '',
  children,
}: {
  // This project's JSX types don't add `key` to component props on their own.
  key?: React.Key;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useBeforePaint(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || !window.matchMedia(REVEAL_WHEN).matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.setAttribute('data-reveal', '');
    if (delay) el.style.transitionDelay = `${delay}s`;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      el.setAttribute('data-reveal', 'in');
      io.disconnect();
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

// false until mounted, to match the prerendered HTML.
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
};

// ── Reviews (white) ────────────────────────────────────────────────

// The homepage's Google reviews, as written there (ReviewCard), on grey cards.
const PAGE_REVIEWS = ['Michelle M.', 'Jack K.'].flatMap((name) => REVIEWS.filter((r) => r.name === name));

const ReviewsSection = () => (
  <section aria-labelledby="spb-reviews-title" className="py-16 md:py-24 bg-white">
    <Container>
      <Reveal className="max-w-2xl mb-10 md:mb-12">
        <span className={labelLight}>On the island every week</span>
        <h2 id="spb-reviews-title" className={h2Light}>
          Trusted by St. Pete Beach pool owners.
        </h2>
      </Reveal>
      <ul className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 [&>li]:border-[rgba(10,22,40,0.10)] [&>li]:bg-[#f5f7fa] [&>li]:shadow-none">
        {PAGE_REVIEWS.map(reviewCard)}
      </ul>
    </Container>
  </section>
);

// ── "The barrier-island toll" (light grey) ─────────────────────────
// St. Pete Beach's distinct angle: a beachfront pool simply wears faster.
// Salt air, blowing sand, relentless sun, and heavy use all hit at once.
// This is NOT the absentee-owner framing from Treasure — it's about the
// physical environment of a Gulf barrier island.
const islandToll = [
  {
    icon: Wind,
    title: 'Salt air eats equipment',
    body:
      "Live a few hundred feet from the Gulf and the salt air goes to work on everything metal — heater cabinets, the screws, pump unions, the rings around your pool lights. Stuff that lasts a decade inland starts rusting here in a couple of years, and a salt cell scales up on top of it. So we actually look at the equipment pad every week. Rinse it down, catch the $40 fitting before it's a seized pump on the Fourth of July.",
  },
  {
    icon: Wind,
    title: "Sand never stops blowing in",
    body:
      "It's the beach. Sand ends up in the pool, the skimmer baskets, the pump basket — and after a windy week, it's everywhere. Left alone it scratches up the finish and chokes your circulation. We clear it out every visit so the water keeps turning over like it should.",
  },
  {
    icon: Sun,
    title: 'The sun burns chlorine off fast',
    body:
      "West-facing pool, no shade, full Florida sun — that combination strips unprotected chlorine in a matter of hours. The fix isn't more chlorine, it's the right amount of stabilizer (cyanuric acid) to shield it from UV without choking it out. Get that band right and the water's still sanitized at 5 p.m. Get it wrong and it's gone by lunch. Honestly, that's most of the job on a beach pool.",
  },
  {
    icon: Users,
    title: 'These pools get used',
    body:
      "Between family, weekend guests, and renters, a St. Pete Beach pool rarely sits quiet for long — and every swimmer takes a bite out of the sanitizer that a still pool never would. We dose for how yours actually gets used, not for some calm, untouched backyard nobody's swimming in.",
  },
];

// Cards from 768px. On phones each card is a tap-to-open row (the first one
// open), collapsed by CSS (.spb-acc) from the first paint, so nothing shifts
// on hydration.
const IslandTollSection = () => {
  const phone = useMediaQuery('(max-width: 767px)');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section aria-labelledby="spb-toll-title" className="py-16 md:py-24 bg-[#f5f7fa]">
      <Container>
        <Reveal className="max-w-2xl mb-10 md:mb-12">
          <span className={labelLight}>Why Beach Pools Are Different</span>
          <h2 id="spb-toll-title" className={`${h2Light} mb-4`}>
            St. Pete Beach pool service, built for barrier-island wear.
          </h2>
          <p className={subLight}>
            St. Pete Beach is a thin strip of sand between the Gulf and Boca Ciega
            Bay — beautiful to live on, brutal on a pool. From Pass-a-Grille up to
            Upham Beach, salt air, blowing sand, full sun, and steady use gang up in
            a way an inland pool never deals with. Our weekly pool cleaning is tuned
            for exactly that.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
          {islandToll.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal
                key={item.title}
                delay={i * 0.08}
                className={`spb-acc ${isOpen ? 'is-open' : ''} rounded-2xl bg-white ${cardEdge} md:flex md:gap-5 md:p-7`}
              >
                <div className={`${iconBoxLight} hidden md:flex shrink-0 w-12 h-12`}>
                  <item.icon className="w-6 h-6 text-[#1f7fdb]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-display font-semibold tracking-[-0.02em] text-[#243a55]">
                    <button
                      type="button"
                      id={`spb-toll-q-${i}`}
                      aria-expanded={!phone || isOpen}
                      aria-controls={`spb-toll-a-${i}`}
                      tabIndex={phone ? undefined : -1}
                      onClick={() => phone && setOpenIndex(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:mb-2 md:cursor-default md:p-0"
                    >
                      {item.title}
                      {isOpen ? (
                        <Minus aria-hidden="true" className="w-5 h-5 shrink-0 text-[#1f7fdb] md:hidden" />
                      ) : (
                        <Plus aria-hidden="true" className="w-5 h-5 shrink-0 text-[#475569] md:hidden" />
                      )}
                    </button>
                  </h3>
                  <div className="spb-acc-body" id={`spb-toll-a-${i}`} role="region" aria-labelledby={`spb-toll-q-${i}`}>
                    <div>
                      <p className="px-5 pb-5 md:p-0 text-[#475569] leading-relaxed text-[15px]">{item.body}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Contextual internal link → cyanuric-acid guide. The stabilizer band is
            the single biggest lever on a full-sun beach pool, so this is the
            natural place to send curious owners deeper (and it passes link
            equity to the pillar guide for SEO). */}
        <Reveal className="mt-6 rounded-2xl border border-[#1f7fdb]/20 bg-[#1f7fdb]/[0.05] p-6 md:p-7 flex flex-col sm:flex-row sm:items-center gap-5">
          <p className="text-[#475569] leading-relaxed text-[15px] flex-1">
            Getting that stabilizer-to-chlorine band right is honestly half the
            job out here — it's the line between water that's still sanitized at
            sunset and water that quit by lunch. Curious how it actually works?
            We wrote up the real science (and the county limits most services
            never mention).
          </p>
          <SmartLink
            to="/pool-care/cyanuric-acid/"
            className="group inline-flex items-center gap-2 shrink-0 text-[#1f7fdb] font-semibold text-[15px] hover:text-[#243a55] transition-colors"
          >
            Read our cyanuric acid guide
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </SmartLink>
        </Reveal>
      </Container>
    </section>
  );
};

// ── Gulf photo band (dark) ─────────────────────────────────────────
// The light section above meets the photo with a hard edge; the bottom still
// dissolves into the dark "One pool, two lives" below.
const InterludeBand = () => (
  <section className="relative h-[42vh] min-h-[360px] md:h-[50vh] md:min-h-[460px] overflow-hidden">
    <div className="interlude-bg-stpetebeach-desktop absolute inset-0 hidden md:block bg-cover bg-center" />
    <div className="interlude-bg-stpetebeach-mobile absolute inset-0 md:hidden bg-cover bg-center" />

    <div className="interlude-tint-stpetebeach absolute inset-0 pointer-events-none" />
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07111c] to-transparent pointer-events-none" />

    <div className="relative h-full flex items-center justify-center">
      <Reveal>
        <p className="text-shadow-interlude font-display italic text-white/90 text-2xl sm:text-3xl md:text-[2.25rem] leading-snug text-center px-6 max-w-2xl tracking-tight">
          The Gulf takes its toll. We take it off your plate.
        </p>
      </Reveal>
    </div>
  </section>
);

// ── "One pool, two lives" (dark) ───────────────────────────────────
// St. Pete Beach's signature mix: a pool that's a private retreat half the
// year and a guest/rental pool the other half. Distinct from Treasure's
// "during a booking / between bookings" failure framing — this is about the
// dual identity of the same pool, and tuning service to both modes.
const TwoModesSection = () => (
  <section aria-labelledby="spb-modes-title" className="py-16 md:py-24 bg-[#07111c] relative overflow-hidden">
    <div className="absolute top-1/3 -right-20 w-[420px] h-[420px] rounded-full bg-brand-blue/[0.06] blur-[140px] pointer-events-none" />
    <div className="absolute bottom-0 -left-24 w-[420px] h-[420px] rounded-full bg-brand-blue/[0.05] blur-[140px] pointer-events-none" />

    <Container className="relative z-10">
      <Reveal className="max-w-2xl mb-10 md:mb-12">
        <span className={labelDark}>One Pool, Two Lives</span>
        <h2 id="spb-modes-title" className={`${h2Dark} mb-4`}>
          Your retreat one month, a guest's highlight the next.
        </h2>
        <p className="section-subtext">
          A lot of St. Pete Beach pools live a double life — your private getaway
          part of the year, a vacation rental or family hub the rest. From
          Gulf-front condos near the Don CeSar to single-family homes on Vina del
          Mar, each mode asks something different from the water. Our weekly pool
          service covers both, so the handoff is invisible.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Mode 1 — your retreat */}
        <Reveal className="relative glass-panel rounded-2xl p-7 md:p-8">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
              <Home className="w-6 h-6 text-brand-blue-light" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue-light">
                When it's yours
              </p>
              <h3 className="text-xl font-display font-semibold tracking-[-0.02em] text-white leading-tight">
                A retreat that's always ready
              </h3>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed text-[15px] mb-5">
            When it's your turn in the pool, you don't want to think about it.
            You walk out the lanai door and the water's clear and balanced — no
            test kit, no chores. We keep the chemistry dialed and the equipment
            quiet so it's just{' '}
            <span className="text-white">ready whenever you are</span>.
          </p>
          <p className="text-gray-300 leading-relaxed text-[15px] mb-6">
            And since we're there every week, the slow problems don't get a
            chance to surface. A stabilizer level creeping up, a salt cell
            starting to scale — caught early, never on the morning you actually
            wanted to swim.
          </p>

          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
              What "ready" actually means
            </p>
            <ul className="grid grid-cols-1 gap-y-1.5 text-sm text-gray-300">
              <li>Balanced, swim-ready chemistry</li>
              <li>Clean tile, baskets, and skimmers</li>
              <li>Equipment running quiet and efficient</li>
              <li>No to-do list waiting for you</li>
            </ul>
          </div>
        </Reveal>

        {/* Mode 2 — guests & renters */}
        <Reveal delay={0.08} className="relative glass-panel rounded-2xl p-7 md:p-8">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                When it's theirs
              </p>
              <h3 className="text-xl font-display font-semibold tracking-[-0.02em] text-white leading-tight">
                Guest-safe under real load
              </h3>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed text-[15px] mb-5">
            Now fill that same pool with guests on a 90-degree afternoon.
            Sunscreen, sweat, sand, a half-dozen people — it chews through
            sanitizer fast. Free chlorine can crash to{' '}
            <span className="text-white">genuinely unsafe levels in a single day</span>,
            and the pool still looks perfect. That's the trap.
          </p>
          <p className="text-gray-300 leading-relaxed text-[15px] mb-6">
            So the dosing gets set against how hard your pool is really working,
            with enough held in reserve to carry it to the next visit. What your
            guests wade into is genuinely sanitary water — not water that merely
            photographs well.
          </p>

          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
              What "clear but unsafe" actually costs
            </p>
            <ul className="grid grid-cols-1 gap-y-1.5 text-sm text-gray-300">
              <li>A guest steps into under-sanitized water</li>
              <li>Skin or ear irritation traced back to the pool</li>
              <li>A one-star line about "the green pool"</li>
              <li>An emergency call the day a family arrives</li>
            </ul>
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-10 flex items-center justify-center gap-3 text-center">
        <Droplets className="w-5 h-5 text-brand-blue-light shrink-0" />
        <p className="text-gray-400 text-[15px]">
          One weekly service —
          <span className="text-white"> tuned to whichever life your pool is living that week.</span>
        </p>
      </Reveal>
    </Container>
  </section>
);

// ── "What actually gets done every week" (white) ───────────────────
// The page sells the philosophy well but never lists the concrete weekly
// checklist owners actually want to see. This grounds the promise (and is
// dense with the literal "pool cleaning" search terms a service page should
// rank for). Kept truthful to a standard full-service weekly visit.
const weeklyChecklist = [
  'Skim the surface — leaves, blown sand, lovebugs, whatever the Gulf left behind',
  'Brush the walls, steps, and waterline tile so nothing gets a foothold',
  'Vacuum the floor whenever it needs it, not just when you ask',
  'Empty the skimmer and pump baskets',
  'Check the filter and clean or backwash it on schedule',
  'Test and balance the full panel — chlorine, pH, alkalinity, stabilizer, salt',
  'Walk the equipment pad for salt corrosion, leaks, and a scaling salt cell',
  'Add your standard weekly chemicals — already in the flat rate',
];

const WeeklyVisitSection = () => (
  <section aria-labelledby="spb-weekly-title" className="py-16 md:py-24 bg-white">
    <Container>
      <Reveal className="max-w-2xl mb-10 md:mb-12">
        <span className={labelLight}>What's In Every Weekly Visit</span>
        <h2 id="spb-weekly-title" className={`${h2Light} mb-4`}>
          No mystery to it. Here's the actual checklist.
        </h2>
        <p className={subLight}>
          Same routine, same order, every single week — whether you're standing
          on the deck watching or somewhere up north for the season. This is what
          your St. Pete Beach pool cleaning covers, start to finish, before the
          report lands in your inbox.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {weeklyChecklist.map((item, i) => (
          <Reveal
            key={item}
            delay={(i % 2) * 0.06}
            className={`flex items-start gap-3 rounded-xl bg-[#f5f7fa] ${cardEdge} p-4 md:p-5`}
          >
            <CheckCircle2 className="w-5 h-5 text-[#1f7fdb] shrink-0 mt-0.5" />
            <p className="text-[#475569] text-[15px] leading-relaxed">{item}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-8 flex items-center justify-center gap-3 text-center">
        <ClipboardCheck className="w-5 h-5 text-[#1f7fdb] shrink-0" />
        <p className="text-[#475569] text-[15px]">
          Then it's all written up —
          <span className="text-[#243a55]"> numbers, what got done, and photos in your inbox before we leave.</span>
        </p>
      </Reveal>
    </Container>
  </section>
);

// ── "Simple for you. Thorough at the pool." (light grey) ───────────
const processSteps = [
  {
    icon: CalendarClock,
    step: 'A familiar tech, same day every week',
    body:
      "Your pool goes on a consistent route — same day each week, with a vetted tech who learns your equipment, how to get to the lanai, the way your particular pool handles the salt and the sun. Nobody's relearning your property from scratch.",
  },
  {
    icon: Camera,
    step: 'A report hits your inbox after every visit',
    body:
      "Chemistry numbers, what got done, photos of the pool — in your inbox before we leave the property. At the house, up north, or forwarding it to a guest, you always know exactly where the water stands. No guessing whether anyone showed up.",
  },
  {
    icon: MessageSquareText,
    step: 'Need us? Text a real local',
    body:
      "Extra clean before the family flies in, a question after a storm blows through — you text or call an actual person here on the coast and hear back the same day. We're a St. Pete crew. Not a call center, not a franchise.",
  },
];

const ProcessSection = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  return (
    <section aria-labelledby="spb-process-title" className="py-16 md:py-24 bg-[#f5f7fa]">
      <Container>
        <Reveal className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <span className={labelLight}>How Weekly Service Works</span>
          <h2 id="spb-process-title" className={`${h2Light} mb-4`}>
            Simple for you. Thorough at the pool.
          </h2>
          <p className={subLight}>
            You shouldn't have to manage your pool service. Here's the whole
            arrangement — three things, then it just runs.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
          {processSteps.map((item, i) => (
            <Reveal
              key={item.step}
              delay={i * 0.1}
              className={`rounded-2xl bg-white ${cardEdge} shadow-[0_1px_2px_rgba(10,22,40,0.04)] p-6 md:p-7`}
            >
              <div className={`${iconBoxLight} w-12 h-12 mb-5`}>
                <item.icon className="w-6 h-6 text-[#1f7fdb]" />
              </div>
              <h3 className="text-lg font-display font-semibold tracking-[-0.02em] text-[#243a55] mb-2 leading-snug">
                {item.step}
              </h3>
              <p className="text-[#475569] leading-relaxed text-[15px]">{item.body}</p>
            </Reveal>
          ))}
        </div>

        {/* Phones: the sticky bar covers this. */}
        <Reveal className="mt-12 flex flex-col items-center gap-3 max-md:hidden">
          <button type="button" onClick={openQuoteSheet} className={goldButton}>
            Get My Beach Pool Quote
          </button>
          <p className="text-[#475569] text-sm text-center">
            Flat monthly rate · Chemicals included · Cancel any time
          </p>
        </Reveal>
      </Container>
    </section>
  );
};

// ── Services (white) ───────────────────────────────────────────────

const SERVICES = [
  {
    title: 'Weekly pool service',
    line: 'Cleaning, testing and every standard chemical, on a set day.',
    to: '/services/weekly-pool-service/',
  },
  {
    title: 'Saltwater pool care',
    line: 'Cell inspection and chemistry tuned for salt systems near the Gulf.',
    to: '/services/saltwater-pool-service/',
  },
  {
    title: 'Pool repair',
    line: 'Pumps, heaters and fittings worn by salt air, quoted before any work.',
    to: '/services/pool-repair/',
  },
  {
    title: 'Condo and community pools',
    line: 'Weekly care for Gulf Boulevard condominiums and association pools.',
    to: '/services/hoa-pool-service/',
  },
  {
    title: 'Storm cleanup',
    line: 'Debris removed and water rebalanced after a named storm.',
    to: '/services/storm-cleanup/',
  },
  {
    title: 'Green pool recovery',
    line: 'From green back to clear, with an up-front price.',
    to: '/services/green-pool-cleanup/',
  },
];

// Cards from 600px (two across, three from 900px); below 600px compact rows,
// title and arrow only.
const ServicesSection = () => (
  <section aria-labelledby="spb-services-title" className="py-16 md:py-24 bg-white">
    <Container>
      <Reveal className="max-w-2xl mb-10 md:mb-12">
        <span className={labelLight}>More than the weekly visit</span>
        <h2 id="spb-services-title" className={`${h2Light} mb-4`}>
          One local team for everything your pool needs.
        </h2>
        <p className={subLight}>
          Most St. Pete Beach owners start with weekly service. When something else comes up, the same team handles
          it.
        </p>
      </Reveal>
      <ul className="grid grid-cols-1 gap-2.5 min-[600px]:grid-cols-2 min-[600px]:gap-4 min-[900px]:grid-cols-3">
        {SERVICES.map((svc) => (
          <li key={svc.to} className="flex">
            <SmartLink
              to={svc.to}
              className={`group flex w-full items-center justify-between gap-3 rounded-[14px] bg-[#f5f7fa] ${cardEdge} px-4 py-3.5 transition-colors hover:border-[#1f7fdb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7fdb] min-[600px]:flex-col min-[600px]:items-start min-[600px]:justify-start min-[600px]:p-6`}
            >
              <span className="block text-[16px] font-display font-semibold tracking-[-0.02em] leading-snug text-[#243a55] min-[600px]:text-[17px]">
                {svc.title}
              </span>
              <span className="hidden flex-1 text-[14.5px] leading-[1.5] text-[#475569] min-[600px]:block">
                {svc.line}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[14px] font-semibold text-[#1f7fdb] min-[600px]:mt-2">
                <span className="hidden min-[600px]:inline">Learn more</span>
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-[3px]"
                  strokeWidth={2.25}
                />
              </span>
            </SmartLink>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

// ── "St. Pete Beach, north to south" (light grey) ──────────────────
// The island top to bottom: a vertical line with a dot per stretch, NORTH at
// the top and SOUTH at the bottom.
const STRETCHES = [
  {
    name: 'Upham Beach and the north end',
    body: 'Open Gulf exposure near Blind Pass. Wind carries sand into the pool, so baskets and filters get extra attention.',
  },
  {
    name: 'Belle Vista',
    body: 'Bayside streets and canal-front homes. Pools sit close to the seawall, where salt spray reaches the equipment pad.',
  },
  {
    name: 'Gulf Boulevard and the Don CeSar area',
    body: 'Condominiums and resort-side homes. Community pools and private pools both need steady chemistry under heavy use.',
  },
  {
    name: 'Vina del Mar',
    body: 'Island homes on Boca Ciega Bay. Water on every side means salt air year-round, and many owners are here for part of the year.',
  },
  {
    name: 'Pass-a-Grille',
    body: 'The historic southern tip, a few blocks wide between Gulf and bay. Smaller, older pools where equipment care matters most.',
  },
];

const compass = 'text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1f7fdb]';

const NorthToSouthSection = () => (
  <section aria-labelledby="spb-area-title" className="py-16 md:py-24 bg-[#f5f7fa]">
    <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:items-start">
      <Reveal>
        <span className={labelLight}>Where we work</span>
        <h2 id="spb-area-title" className={`${h2Light} mb-4`}>
          St. Pete Beach, north to south.
        </h2>
        <p className={subLight}>
          Our route runs the length of the island every week. Each stretch treats a pool a little differently, and
          your technician knows which one you&rsquo;re on.
        </p>
        <p className="mt-6 text-[15px] leading-relaxed text-[#475569]">
          Also nearby:{' '}
          <SmartLink to="/treasure-island-fl/" className={linkLight}>
            Treasure Island
          </SmartLink>{' '}
          ·{' '}
          <SmartLink to="/snell-isle-fl/" className={linkLight}>
            Snell Isle
          </SmartLink>{' '}
          ·{' '}
          <SmartLink to="/" className={linkLight}>
            St. Petersburg
          </SmartLink>
        </p>
      </Reveal>

      <Reveal className="relative">
        {/* The island's line, between the NORTH and SOUTH labels. */}
        <span aria-hidden="true" className="absolute left-[6px] top-7 bottom-7 w-0.5 rounded-full bg-[#1f7fdb]/25" />
        <p aria-hidden="true" className={compass}>
          North
        </p>
        <ol className="relative mt-5 space-y-6">
          {STRETCHES.map((s) => (
            <li key={s.name} className="relative pl-9">
              <span
                aria-hidden="true"
                className="absolute left-0 top-[5px] h-3.5 w-3.5 rounded-full bg-white ring-[3px] ring-[#1f7fdb]"
              />
              <h3 className="text-[17px] font-display font-semibold tracking-[-0.02em] leading-snug text-[#243a55]">
                {s.name}
              </h3>
              <p className="mt-1 text-[15px] leading-relaxed text-[#475569]">{s.body}</p>
            </li>
          ))}
        </ol>
        <p aria-hidden="true" className={`${compass} mt-5`}>
          South
        </p>
      </Reveal>
    </Container>
  </section>
);

// ── "Salt-tested. Sun-ready. Always clear." (dark) ─────────────────
const PromiseStrip = () => (
  // Transparent — the page's navy and bg-mesh show through. The two hairline
  // rules top and bottom are what frame it as a distinct band.
  <section aria-labelledby="spb-strip-title" className="py-16 md:py-24 relative overflow-hidden">
    <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[80%] h-[100%] bg-brand-blue/[0.07] rounded-full blur-[150px] pointer-events-none" />
    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.025] via-transparent to-transparent pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <div className="page-container max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
      <Reveal>
        <h2 id="spb-strip-title" className={`${h2Dark} mb-4`}>
          Salt-tested. Sun-ready. Always clear.
        </h2>
        <p className="section-subtext max-w-2xl mx-auto mb-8">
          A consistent, vetted technician, full chemistry balance, and a
          photo-verified report after every visit — for one flat monthly rate.
          No contracts, no surprise chemical bills, no green water on the beach.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-300">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-blue-light" /> Always Blue Guarantee
          </span>
          <span className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-brand-blue-light" /> Equipment checked every visit
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-blue-light" /> GPS-verified service
          </span>
        </div>

        {/* Local service-area line — names the neighborhoods we cover for
            long-tail local search ("pool service [neighborhood]"). Real
            geography, kept truthful to the St. Pete Beach barrier island. */}
        <p className="mt-8 text-[13px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Serving pools across St. Pete Beach, FL — Pass-a-Grille, Vina del Mar,
          Don CeSar, Upham Beach, Belle Vista, and the Gulf Blvd condos and
          waterfront homes along Boca Ciega Bay.
        </p>
      </Reveal>
    </div>
  </section>
);

// ── FAQ (white) ────────────────────────────────────────────────────
const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section aria-labelledby="spb-faq-title" className="py-16 md:py-24 bg-white">
      <div className="page-container max-w-3xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-10 md:mb-12">
          <span className={labelLight}>St. Pete Beach Pool Service</span>
          <h2 id="spb-faq-title" className={h2Light}>
            Questions, answered.
          </h2>
        </Reveal>

        <div className="space-y-3">
          {stPeteBeachFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `spb-faq-panel-${index}`;
            const buttonId = `spb-faq-button-${index}`;
            return (
              <div
                key={index}
                className={`faq-item rounded-2xl overflow-hidden bg-[#f5f7fa] ${cardEdge} transition-colors hover:bg-[#eef2f6] ${isOpen ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  id={buttonId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left gap-4"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="text-[#243a55] font-semibold tracking-[-0.02em] text-[17px]">{faq.q}</span>
                  {isOpen ? (
                    <Minus className="w-5 h-5 shrink-0 text-[#1f7fdb]" />
                  ) : (
                    <Plus className="w-5 h-5 shrink-0 text-[#475569]" />
                  )}
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-inner">
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-6 pb-6 text-[#475569] leading-relaxed border-t border-[rgba(10,22,40,0.08)] pt-4"
                    >
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── Pool care guides (light grey) ──────────────────────────────────
// Internal-link cluster → our pillar guides. Every topic here is one the
// barrier-island copy already raises (sun/stabilizer, salt cells, green-pool
// recovery, equipment), so the links are genuinely relevant — which is what
// makes them worth crawling, and what keeps a curious owner on the site.
const relatedGuides: Array<{
  to: string;
  icon: typeof Sun;
  title: string;
  blurb: string;
}> = [
  {
    to: '/pool-care/cyanuric-acid/',
    icon: Sun,
    title: 'Cyanuric acid & your chlorine',
    blurb:
      "The stabilizer band that decides whether your chlorine survives the afternoon sun — and the county limits most services skip.",
  },
  {
    to: '/pool-care/salt-water-vs-chlorine/',
    icon: Droplets,
    title: 'Salt water vs. chlorine',
    blurb:
      "What a salt system really does near the coast, what it costs, and whether it's worth it for a beach pool.",
  },
  {
    to: '/pool-care/green-pool/',
    icon: Waves,
    title: 'How to clear a green pool',
    blurb:
      "Why a pool turns after a storm or a missed week, and the step-by-step that actually brings it back to blue.",
  },
  {
    to: '/pool-care/variable-speed-pumps/',
    icon: Wrench,
    title: 'Variable-speed pumps',
    blurb:
      "The upgrade that quietly cuts a pool's biggest energy bill — and why it matters more when salt air is wearing on your gear.",
  },
];

const RelatedGuidesSection = () => (
  <section aria-labelledby="spb-guides-title" className="py-16 md:py-24 bg-[#f5f7fa]">
    <Container>
      <Reveal className="max-w-2xl mb-10 md:mb-12">
        <span className={labelLight}>Pool Care, Explained</span>
        <h2 id="spb-guides-title" className={`${h2Light} mb-4`}>
          The stuff we'd tell you at the pool anyway.
        </h2>
        <p className={subLight}>
          We put the things people ask us most into plain-English guides — no
          jargon, no upsell. Whether you're a customer or just trying to keep your
          own beach pool honest, dig in.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        {relatedGuides.map((g, i) => (
          <Reveal key={g.to} delay={(i % 2) * 0.06}>
            <SmartLink
              to={g.to}
              className={`group rounded-2xl bg-white ${cardEdge} p-6 md:p-7 flex items-start gap-4 h-full transition-colors hover:border-[#1f7fdb]/40`}
            >
              <div className={`${iconBoxLight} shrink-0 w-11 h-11`}>
                <g.icon className="w-5 h-5 text-[#1f7fdb]" />
              </div>
              <div className="flex-1">
                <h3 className="text-[17px] font-display font-semibold tracking-[-0.02em] text-[#243a55] mb-1.5 flex items-center gap-1.5">
                  {g.title}
                  <ArrowRight className="w-4 h-4 text-[#475569]/60 transition-all group-hover:text-[#1f7fdb] group-hover:translate-x-0.5" />
                </h3>
                <p className="text-[#475569] text-[14px] leading-relaxed">{g.blurb}</p>
              </div>
            </SmartLink>
          </Reveal>
        ))}
      </div>
    </Container>
  </section>
);

// ── Promises (white, directly above the quote form) ────────────────
// The homepage's three written promises (GuaranteeCards holds the terms),
// with the plain cards on grey to sit on white.
const PromisesSection = () => (
  <section aria-labelledby="spb-promises-title" className="py-16 md:py-24 bg-white">
    <Container>
      <Reveal className="max-w-2xl mb-10 md:mb-12">
        <span className={labelLight}>In writing</span>
        <h2 id="spb-promises-title" className={h2Light}>
          Three promises, in your Service Agreement.
        </h2>
      </Reveal>
      <GuaranteeCards className="min-[900px]:grid-cols-3 [&>li:not(:first-child)]:bg-[#f5f7fa]" />
    </Container>
  </section>
);

// In the order the page reads; the quote form (dark) follows in
// StPeteBeachPage.
const StPeteBeachBelowFold = () => (
  <>
    <ReviewsSection />
    <IslandTollSection />
    <InterludeBand />
    <TwoModesSection />
    <WeeklyVisitSection />
    <ProcessSection />
    <ServicesSection />
    <NorthToSouthSection />
    <PromiseStrip />
    <FaqSection />
    <RelatedGuidesSection />
    <PromisesSection />
  </>
);

export default StPeteBeachBelowFold;
