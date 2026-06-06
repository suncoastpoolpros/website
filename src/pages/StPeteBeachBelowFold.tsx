import React, { useState } from 'react';
import { m } from 'motion/react';
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
  XCircle,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ArrowRight,
  ClipboardCheck,
  Waves,
} from 'lucide-react';
import { Container } from '@/components/Container';
import { SmartLink } from '@/components/SmartLink';
import { stPeteBeachFaqs } from '@/pages/stPeteBeachFaqs';

// ── Section 1: "The barrier-island toll" ───────────────────────────
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
      "Between family, weekend guests, and renters, a St. Pete Beach pool rarely sits quiet for long — and a busy pool burns through sanitizer in a way an empty one never will. We dose for how yours actually gets used, not for some calm, untouched backyard nobody's swimming in.",
  },
];

// ── Section 3: process steps (beach-specific framing) ──────────────
const processSteps = [
  {
    icon: CalendarClock,
    step: 'Same tech, same day, every week',
    body:
      "One technician owns your pool. Same day each week, every week. They learn your equipment, how to get to the lanai, the way your particular pool handles the salt and the sun — so nobody's relearning your property from scratch.",
  },
  {
    icon: Camera,
    step: 'A report hits your inbox after every visit',
    body:
      "Chemistry numbers, what got done, photos of the pool — usually in your inbox within the hour. At the house, up north, or forwarding it to a guest, you always know exactly where the water stands. No guessing whether anyone showed up.",
  },
  {
    icon: MessageSquareText,
    step: 'Need us? Text a real local',
    body:
      "Extra clean before the family flies in, a question after a storm blows through — you text or call an actual person here on the coast and hear back the same day. We're a St. Pete crew. Not a call center, not a franchise.",
  },
];

const faqs = stPeteBeachFaqs;

const IslandTollSection = () => (
  // Bright, sun-bleached coastal wash — warmer and lighter than the deep-Gulf
  // tone of the other city pages, to read "open beach" rather than "quiet cove".
  <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#07111c] via-[#0b1622] to-[#07111c]">
    <div className="absolute top-[-10%] left-1/4 w-[55%] h-[45%] bg-brand-orange/[0.06] rounded-full blur-[150px] pointer-events-none" />
    <div className="absolute -bottom-28 -left-32 w-[520px] h-[520px] rounded-full bg-brand-blue/[0.06] blur-[150px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Why Beach Pools Are Different
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          St. Pete Beach pool service, built for barrier-island wear.
        </h2>
        <p className="section-subtext">
          St. Pete Beach is a thin strip of sand between the Gulf and Boca Ciega
          Bay — beautiful to live on, brutal on a pool. From Pass-a-Grille up to
          Upham Beach, salt air, blowing sand, full sun, and steady use gang up in
          a way an inland pool never deals with. Our weekly pool cleaning is tuned
          for exactly that.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {islandToll.map((item, i) => (
          <m.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="glass-panel rounded-2xl p-6 md:p-7 flex gap-5"
          >
            <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center">
              <item.icon className="w-6 h-6 text-brand-orange-light" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-[15px]">{item.body}</p>
            </div>
          </m.div>
        ))}
      </div>

      {/* Contextual internal link → cyanuric-acid guide. The stabilizer band is
          the single biggest lever on a full-sun beach pool, so this is the
          natural place to send curious owners deeper (and it passes link
          equity to the pillar guide for SEO). */}
      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-6 rounded-2xl border border-brand-orange/20 bg-brand-orange/[0.04] p-6 md:p-7 flex flex-col sm:flex-row sm:items-center gap-5"
      >
        <p className="text-gray-300 leading-relaxed text-[15px] flex-1">
          Getting that stabilizer-to-chlorine band right is honestly half the
          job out here — it's the line between water that's still sanitized at
          sunset and water that quit by lunch. Curious how it actually works?
          We wrote up the real science (and the county limits most services
          never mention).
        </p>
        <SmartLink
          to="/pool-care/cyanuric-acid"
          className="group inline-flex items-center gap-2 shrink-0 text-brand-orange-light font-semibold text-[15px] hover:text-white transition-colors"
        >
          Read our cyanuric acid guide
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </SmartLink>
      </m.div>
    </Container>
  </section>
);

// ── Section: "What actually gets done every week" ───────────────────
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
  <section className="py-20 md:py-28 bg-[#0a1422] relative overflow-hidden">
    <div className="absolute top-0 right-1/4 w-[50%] h-[40%] bg-brand-blue/[0.06] rounded-full blur-[150px] pointer-events-none" />
    <div className="absolute -bottom-24 -right-28 w-[460px] h-[460px] rounded-full bg-brand-orange/[0.05] blur-[150px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          What's In Every Weekly Visit
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          No mystery to it. Here's the actual checklist.
        </h2>
        <p className="section-subtext">
          Same routine, same order, every single week — whether you're standing
          on the deck watching or somewhere up north for the season. This is what
          your St. Pete Beach pool cleaning covers, start to finish, before the
          report lands in your inbox.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {weeklyChecklist.map((item, i) => (
          <m.div
            key={item}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 2) * 0.06 }}
            className="flex items-start gap-3 glass-panel rounded-xl p-4 md:p-5"
          >
            <CheckCircle2 className="w-5 h-5 text-brand-orange-light shrink-0 mt-0.5" />
            <p className="text-gray-300 text-[15px] leading-relaxed">{item}</p>
          </m.div>
        ))}
      </div>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 flex items-center justify-center gap-3 text-center"
      >
        <ClipboardCheck className="w-5 h-5 text-brand-orange-light shrink-0" />
        <p className="text-gray-400 text-[15px]">
          Then it's all written up —
          <span className="text-white"> numbers, what got done, and photos in your inbox, usually within the hour.</span>
        </p>
      </m.div>
    </Container>
  </section>
);

// ── Section 2: interlude band — beach-specific line ────────────────
const InterludeBand = () => (
  <section className="relative h-[42vh] min-h-[360px] md:h-[50vh] md:min-h-[460px] overflow-hidden">
    <div className="interlude-bg-stpetebeach-desktop absolute inset-0 hidden md:block bg-cover bg-center" />
    <div className="interlude-bg-stpetebeach-mobile absolute inset-0 md:hidden bg-cover bg-center" />

    <div className="interlude-tint-stpetebeach absolute inset-0 pointer-events-none" />

    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07111c] to-transparent pointer-events-none" />
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a1422] to-transparent pointer-events-none" />

    <div className="relative h-full flex items-center justify-center">
      <m.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="text-shadow-interlude font-display italic text-white/90 text-2xl sm:text-3xl md:text-[2.25rem] leading-snug text-center px-6 max-w-2xl tracking-tight"
      >
        The Gulf takes its toll. We take it off your plate.
      </m.p>
    </div>
  </section>
);

// ── Section 3: "Two pools, one address" ────────────────────────────
// St. Pete Beach's signature mix: a pool that's a private retreat half the
// year and a guest/rental pool the other half. Distinct from Treasure's
// "during a booking / between bookings" failure framing — this is about the
// dual identity of the same pool, and tuning service to both modes.
const TwoModesSection = () => (
  <section className="py-20 md:py-28 bg-[#0a1422] relative overflow-hidden">
    <div className="absolute top-1/3 -right-20 w-[420px] h-[420px] rounded-full bg-brand-blue/[0.06] blur-[140px] pointer-events-none" />
    <div className="absolute bottom-0 -left-24 w-[420px] h-[420px] rounded-full bg-brand-orange/[0.05] blur-[140px] pointer-events-none" />

    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          One Pool, Two Lives
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Your retreat one month, a guest's highlight the next.
        </h2>
        <p className="section-subtext">
          A lot of St. Pete Beach pools live a double life — your private getaway
          part of the year, a vacation rental or family hub the rest. From
          Gulf-front condos near the Don CeSar to single-family homes on Vina del
          Mar, each mode asks something different from the water. Our weekly pool
          service covers both, so the handoff is invisible.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Mode 1 — your retreat */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel rounded-2xl p-7 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
              <Home className="w-6 h-6 text-brand-blue-light" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue-light">
                When it's yours
              </p>
              <h3 className="text-xl font-display font-bold text-white leading-tight">
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
        </m.div>

        {/* Mode 2 — guests & renters */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="glass-panel rounded-2xl p-7 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-brand-orange-light" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-orange-light">
                When it's theirs
              </p>
              <h3 className="text-xl font-display font-bold text-white leading-tight">
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
            So we dose for the load your pool actually carries and leave a buffer
            behind every visit. The water your guests step into is safe to swim
            in — not just pretty in the listing photo.
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
        </m.div>
      </div>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-10 flex items-center justify-center gap-3 text-center"
      >
        <Droplets className="w-5 h-5 text-brand-orange-light shrink-0" />
        <p className="text-gray-400 text-[15px]">
          One weekly service —
          <span className="text-white"> tuned to whichever life your pool is living that week.</span>
        </p>
      </m.div>
    </Container>
  </section>
);

const ProcessSection = () => (
  <section className="py-20 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#0a1422] via-[#0c1828] to-[#0e1c2e]">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[45%] bg-brand-blue/[0.06] rounded-full blur-[160px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          How Weekly Service Works
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Simple for you. Thorough at the pool.
        </h2>
        <p className="section-subtext">
          You shouldn't have to manage your pool service. Here's the whole
          arrangement — three things, then it just runs.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {processSteps.map((item, i) => (
          <m.div
            key={item.step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel rounded-2xl p-7"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-5">
              <item.icon className="w-6 h-6 text-brand-orange-light" />
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-2">
              {item.step}
            </h3>
            <p className="text-gray-400 leading-relaxed text-[15px]">{item.body}</p>
          </m.div>
        ))}
      </div>
    </Container>
  </section>
);

// ── Section 5: why-us comparison — retuned to beachfront pain ──────
const WHY_US_PAIRS: Array<{
  failure: string;
  failureDetail: string;
  us: string;
  usDetail: string;
}> = [
  {
    failure: 'Equipment rusts out with no warning',
    failureDetail:
      "Most services skim the pool and leave. Nobody's looking at the pad, so the salt air just keeps working on your heater and pump until something seizes. You find out the day the pool goes down — and the tech is already quoting a replacement.",
    us: 'We look at the pad every single visit',
    usDetail:
      "Corrosion, leaks, salt-cell scaling — we check for it weekly and tell you while it's still a small repair. On a barrier island, that one habit is the whole difference between a $40 part and a rebuild.",
  },
  {
    failure: 'Chemistry that quits by mid-afternoon',
    failureDetail:
      "A routine built for an inland pool can't handle full Gulf sun plus a busy beach pool. The water tests fine in the morning. By the time anyone actually swims, the chlorine's gone.",
    us: 'Dosing built for sun and real use',
    usDetail:
      "We set stabilizer and chlorine for the UV and the bather load your pool really takes — so there's a working buffer left at 5 p.m., not just at breakfast.",
  },
  {
    failure: "You never know if anyone showed up",
    failureDetail:
      "No report, no photo, nothing. If you split time up north it's worse — you're just hoping the pool got done, or finding out from a guest that it didn't.",
    us: 'A photo report, proven, every visit',
    usDetail:
      "Every visit is GPS-confirmed at your address, and a timestamped report with chemistry and photos hits your inbox right after. You know it was serviced and exactly how it read. No faith required.",
  },
  {
    failure: 'A bill that quietly climbs',
    failureDetail:
      "\"Extra chemicals.\" \"Demand surcharge.\" \"Storm cleanup.\" Vague lines you can't check, on an invoice that somehow never matches the price you agreed to.",
    us: 'One flat rate, chemicals included',
    usDetail:
      "Standard weekly chemicals are baked into the monthly price. Anything bigger — a recovery, a part, real storm work — gets quoted and okayed before we touch it. The bill is the bill.",
  },
];

const WhyUsSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden bg-[#0e1c2e]">
    <div className="absolute top-1/4 right-[-10%] w-[460px] h-[460px] rounded-full bg-brand-orange/[0.05] blur-[150px] pointer-events-none" />
    <div className="absolute bottom-0 left-[-8%] w-[400px] h-[400px] rounded-full bg-brand-blue/[0.05] blur-[140px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />

    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12 md:mb-14"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          What Trips Up Most Services
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Four ways St. Pete Beach pool service goes wrong.
        </h2>
        <p className="section-subtext">
          A pool a few blocks from the Gulf has needs that an inland route just
          isn't set up for. Here's where most St. Pete Beach pool service falls
          short — and how our weekly pool cleaning is built differently.
        </p>
      </m.div>

      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {WHY_US_PAIRS.map((pair, i) => (
          <m.div
            key={pair.failure}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.015]"
          >
            <div className="p-6 md:p-7 border-b md:border-b-0 md:border-r border-white/[0.08] bg-black/[0.18]">
              <div className="flex items-start gap-3 mb-2">
                <XCircle className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  What usually happens
                </p>
              </div>
              <h3 className="text-[17px] font-display font-bold text-gray-300 leading-snug mb-2">
                {pair.failure}
              </h3>
              <p className="text-gray-500 text-[14px] leading-relaxed">
                {pair.failureDetail}
              </p>
            </div>

            <div className="p-6 md:p-7 bg-brand-orange/[0.05]">
              <div className="flex items-start gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-brand-orange-light shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange-light">
                  How we run it
                </p>
              </div>
              <h3 className="text-[17px] font-display font-bold text-white leading-snug mb-2">
                {pair.us}
              </h3>
              <p className="text-gray-300 text-[14px] leading-relaxed">
                {pair.usDetail}
              </p>
            </div>
          </m.div>
        ))}
      </div>

      <m.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-10 md:mt-12 text-center text-gray-400 text-[15px] max-w-2xl mx-auto leading-relaxed"
      >
        It comes down to one thing: a beachfront pool needs a service that{' '}
        <span className="text-white">understands the island it sits on</span>{' '}
        — and most don't.
      </m.p>
    </Container>
  </section>
);

const PromiseStrip = () => (
  <section className="py-16 md:py-20 relative overflow-hidden bg-[#101e30]">
    <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[80%] h-[100%] bg-brand-orange/[0.08] rounded-full blur-[150px] pointer-events-none" />
    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.025] via-transparent to-transparent pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="section-heading text-white leading-tight mb-4">
          Salt-tested. Sun-ready. Always clear.
        </h2>
        <p className="section-subtext max-w-2xl mx-auto mb-8">
          One dedicated technician, full chemistry balance, and a photo-verified
          report after every visit — for one flat monthly rate. No contracts, no
          surprise chemical bills, no green water on the beach.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-300">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-orange-light" /> Always Blue Guarantee
          </span>
          <span className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-brand-orange-light" /> Equipment checked every visit
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-orange-light" /> GPS-verified service
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
      </m.div>
    </div>
  </section>
);

// ── Section: related pool-care guides ──────────────────────────────
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
    to: '/pool-care/cyanuric-acid',
    icon: Sun,
    title: 'Cyanuric acid & your chlorine',
    blurb:
      "The stabilizer band that decides whether your chlorine survives the afternoon sun — and the county limits most services skip.",
  },
  {
    to: '/pool-care/salt-water-vs-chlorine',
    icon: Droplets,
    title: 'Salt water vs. chlorine',
    blurb:
      "What a salt system really does near the coast, what it costs, and whether it's worth it for a beach pool.",
  },
  {
    to: '/pool-care/green-pool',
    icon: Waves,
    title: 'How to clear a green pool',
    blurb:
      "Why a pool turns after a storm or a missed week, and the step-by-step that actually brings it back to blue.",
  },
  {
    to: '/pool-care/variable-speed-pumps',
    icon: Wrench,
    title: 'Variable-speed pumps',
    blurb:
      "The upgrade that quietly cuts a pool's biggest energy bill — and why it matters more when salt air is wearing on your gear.",
  },
];

const RelatedGuidesSection = () => (
  <section className="py-20 md:py-24 bg-[#07111c] relative overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <div className="absolute top-0 left-1/4 w-[50%] h-[40%] bg-brand-blue/[0.05] rounded-full blur-[150px] pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Pool Care, Explained
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          The stuff we'd tell you at the pool anyway.
        </h2>
        <p className="section-subtext">
          We put the things people ask us most into plain-English guides — no
          jargon, no upsell. Whether you're a customer or just trying to keep your
          own beach pool honest, dig in.
        </p>
      </m.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        {relatedGuides.map((g, i) => (
          <m.div
            key={g.to}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 2) * 0.06 }}
          >
            <SmartLink
              to={g.to}
              className="group glass-panel rounded-2xl p-6 md:p-7 flex items-start gap-4 h-full hover:bg-white/10 transition-colors"
            >
              <div className="shrink-0 w-11 h-11 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center">
                <g.icon className="w-5 h-5 text-brand-orange-light" />
              </div>
              <div className="flex-1">
                <h3 className="text-[17px] font-display font-bold text-white mb-1.5 flex items-center gap-1.5">
                  {g.title}
                  <ArrowRight className="w-4 h-4 text-gray-500 transition-all group-hover:text-brand-orange-light group-hover:translate-x-0.5" />
                </h3>
                <p className="text-gray-400 text-[14px] leading-relaxed">{g.blurb}</p>
              </div>
            </SmartLink>
          </m.div>
        ))}
      </div>
    </Container>
  </section>
);

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="py-20 md:py-24 bg-[#07111c] relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
            St. Pete Beach Pool Service
          </span>
          <h2 className="section-heading text-white">Questions, answered.</h2>
        </m.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `spb-faq-panel-${index}`;
            const buttonId = `spb-faq-button-${index}`;
            return (
              <div
                key={index}
                className="glass-panel rounded-2xl overflow-hidden transition-colors hover:bg-white/10"
              >
                <button
                  type="button"
                  id={buttonId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left gap-4"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="text-white font-semibold text-[17px]">{faq.q}</span>
                  {isOpen ? (
                    <Minus className="w-5 h-5 shrink-0 text-brand-orange-light" />
                  ) : (
                    <Plus className="w-5 h-5 shrink-0 text-gray-400" />
                  )}
                </button>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const StPeteBeachBelowFold = () => (
  <>
    <IslandTollSection />
    <InterludeBand />
    <TwoModesSection />
    <WeeklyVisitSection />
    <ProcessSection />
    <WhyUsSection />
    <PromiseStrip />
    <FaqSection />
    <RelatedGuidesSection />
  </>
);

export default StPeteBeachBelowFold;
