import React, { useState } from 'react';
import { m } from 'motion/react';
import {
  Waves,
  Home,
  Sun,
  Wind,
  Droplets,
  KeyRound,
  Trees,
  Bug,
  ShieldCheck,
  Camera,
  Gauge,
  MapPin,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import { Container } from '@/components/Container';
import { SmartLink } from '@/components/SmartLink';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { clearwaterFaqs } from '@/pages/clearwaterFaqs';

// ── Clearwater's design identity ─────────────────────────────────────────────
// Same dark navy palette as the rest of the site, but its own LAYOUT language —
// no other city page shares these structures: one panel split by "The
// Intracoastal" divider, a numbered 01–06 checklist ledger, directory-style
// ruled coverage lists, a numbered route line for the steps, and a single
// divided FAQ card. Two page-wide finishing systems tie it together:
// every kicker leads with a short orange rule, and every major panel carries
// an "edge light" — a faint top hairline glint — so the cards read lit, not
// flat.

// Kicker with the page's signature leading rule. `center` flanks the text with
// rules on both sides (used by the centered FAQ header); `light` switches to
// the blue-on-light treatment the homepage and guide pages use on light bands.
const Kicker = ({
  children,
  center = false,
  light = false,
}: {
  children: React.ReactNode;
  center?: boolean;
  light?: boolean;
}) => {
  const rule = light ? 'bg-brand-blue/60' : 'bg-brand-orange/70';
  const text = light ? 'text-brand-blue' : 'text-brand-orange-light';
  return (
    <span className={`flex items-center gap-3 mb-4 ${center ? 'justify-center' : ''}`}>
      <span className={`h-px w-10 shrink-0 ${rule}`} aria-hidden />
      <span className={`font-bold tracking-[0.2em] uppercase text-xs ${text}`}>{children}</span>
      {center && <span className={`h-px w-10 shrink-0 ${rule}`} aria-hidden />}
    </span>
  );
};

// Faint top hairline glint for major panels (parent must be relative).
const EdgeLight = () => (
  <span
    aria-hidden
    className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
  />
);

// ── Section 1: two worlds, one standard ─────────────────────────────────────
// Clearwater's signature angle: it's two towns sharing a name. A barrier-island
// beach world and a big established mainland — genuinely different pools with
// genuinely different problems. Rendered as ONE panel split down the middle by
// a hairline labeled "The Intracoastal" — the literal line that splits the
// city — beach column on the Gulf side, mainland on the other.
const beachPoints = [
  {
    icon: Sun,
    title: 'Built for full Gulf sun',
    body:
      "Out on Clearwater Beach and Sand Key there's no shade and no mercy — UV burns off chlorine and pushes stabilizer all day. We tune your chemistry for the sun load so the water doesn't go flat by Thursday.",
  },
  {
    icon: Droplets,
    title: 'Salt systems, watched weekly',
    body:
      "Most island pools run salt. We check the cell, keep production matched to demand, and catch scaling before it kills the cell — not after you're buying a new one.",
  },
  {
    icon: Wind,
    title: 'Sand & wind, rinsed out',
    body:
      "Blowing sand and grit are what turn a beach pool cloudy. We brush, vacuum, and keep the filter clear so the water stays glass, not gray.",
  },
  {
    icon: KeyRound,
    title: 'Rentals & condos, guest-ready',
    body:
      "Lots of island pools are vacation rentals their owners never see. Dependable weekly day, photo report every visit — clear for the next check-in whether you're in town or not.",
  },
];
const mainlandPoints = [
  {
    icon: Trees,
    title: 'Oak debris, handled',
    body:
      "Countryside, Del Oro, and Morningside sit under mature oaks and live oaks. Leaf litter, spring pollen, the debris through a torn screen — we skim it, empty the baskets, and keep the filter breathing.",
  },
  {
    icon: Home,
    title: 'Screened cages, our everyday',
    body:
      "Most mainland Clearwater pools live under a screen enclosure. We work around the cage every week and flag a tear or a drainage issue before it lets a season's worth of debris in.",
  },
  {
    icon: Gauge,
    title: 'Established equipment, real eyes',
    body:
      "Many of these homes have been here for decades, and so has the pad. We check the pump, filter, and heater every visit and give you a straight answer on repair-or-replace — no commission, no scare tactics.",
  },
  {
    icon: Bug,
    title: 'Full-time pools, kept swimmable',
    body:
      "These aren't twice-a-year second homes — families and retirees swim in them year-round. We keep the water balanced and safe to jump into any day of the week.",
  },
];

const ZoneColumn = ({
  badge,
  badgeIcon: BadgeIcon,
  title,
  points,
  accent,
  side,
}: {
  badge: string;
  badgeIcon: typeof Sun;
  title: string;
  points: { icon: typeof Sun; title: string; body: string }[];
  accent: 'blue' | 'orange';
  side: 'left' | 'right';
}) => {
  const tile =
    accent === 'blue'
      ? 'bg-brand-blue/10 border-brand-blue/25 text-brand-blue-light'
      : 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange-light';
  const mark = accent === 'blue' ? 'text-brand-blue-light' : 'text-brand-orange-light';
  // Extra padding on the divider side (lg only) so column text never runs
  // under the absolutely-positioned "The Intracoastal" pill on the center rule.
  const clear = side === 'left' ? 'lg:pr-20' : 'lg:pl-20';
  return (
    <div className={`p-7 md:p-9 ${clear}`}>
      <div className="flex items-center gap-3.5 mb-3">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${tile}`}>
          <BadgeIcon className="w-5 h-5" />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">{badge}</p>
          <p className="text-white font-display font-bold text-xl">{title}</p>
        </div>
      </div>
      <ul className="divide-y divide-white/[0.07]">
        {points.map((p) => (
          <li key={p.title} className="py-4 last:pb-0">
            <h3 className="flex items-center gap-2 text-white font-semibold text-[15px] mb-1 leading-snug">
              <p.icon className={`w-4 h-4 shrink-0 ${mark}`} />
              {p.title}
            </h3>
            <p className="text-gray-400 text-[14px] leading-relaxed">{p.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TwoWorldsSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#07111c] via-[#0a141f] to-[#07111c]">
    <div className="absolute top-0 left-1/4 w-[50%] h-[42%] bg-brand-blue/[0.07] rounded-full blur-[150px] pointer-events-none" />
    <div className="absolute -bottom-24 -right-28 w-[460px] h-[460px] rounded-full bg-brand-orange/[0.05] blur-[150px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <Kicker>Two Towns, One Name</Kicker>
        <h2 className="section-heading text-balance text-white leading-tight mb-4">
          A beach pool and a mainland pool aren't the same job.
        </h2>
        <p className="section-subtext">
          Clearwater is split right down the Intracoastal — the barrier-island
          beach world on one side, the big established mainland on the other. Each
          has its own challenges, and we built our weekly service to handle both,
          held to the same clear-water standard.
        </p>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-panel rounded-3xl overflow-hidden relative"
      >
        <EdgeLight />
        <div className="relative grid grid-cols-1 lg:grid-cols-2">
          {/* The dividing line — the Intracoastal itself. */}
          <span className="hidden lg:block absolute inset-y-8 left-1/2 w-px bg-white/10" aria-hidden />
          <span className="hidden lg:inline-flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center rounded-full bg-[#0a1628] border border-white/20 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-300 whitespace-nowrap">
            The Intracoastal
          </span>
          <ZoneColumn
            badge="The Beach & Islands"
            badgeIcon={Waves}
            title="Clearwater Beach · Sand Key"
            points={beachPoints}
            accent="blue"
            side="left"
          />
          <div className="border-t border-white/[0.07] lg:border-t-0">
            <ZoneColumn
              badge="The Mainland"
              badgeIcon={Home}
              title="Countryside · Del Oro"
              points={mainlandPoints}
              accent="orange"
              side="right"
            />
          </div>
        </div>
        <div className="border-t border-white/[0.07] bg-white/[0.02] px-6 py-4 text-center">
          <span className="text-gray-300 text-[14px]">
            Two very different pools.{' '}
            <span className="text-white font-semibold">One clear-water standard.</span>
          </span>
        </div>
      </m.div>
    </Container>
  </section>
);

// ── Interlude band ──────────────────────────────────────────────────────────
const InterludeBand = () => (
  <section className="relative h-[40vh] min-h-[340px] md:h-[46vh] md:min-h-[420px] overflow-hidden">
    <div className="interlude-bg-clearwater-desktop absolute inset-0 hidden md:block bg-cover bg-center" />
    <div className="interlude-bg-clearwater-mobile absolute inset-0 md:hidden bg-cover bg-center" />
    <div className="interlude-tint-clearwater absolute inset-0 pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07111c] to-transparent pointer-events-none" />
    {/* Bottom dissolves into the LIGHT band that follows — sea mist, the
        same dark → light handoff the homepage makes before its light section. */}
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#e4e9f0] to-transparent pointer-events-none" />
    <div className="relative h-full flex flex-col items-center justify-center px-6">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <span className="h-px w-16 bg-white/35 mb-6" aria-hidden />
        <p className="text-shadow-interlude font-display italic text-white/90 text-2xl sm:text-3xl md:text-[2.25rem] leading-snug text-center max-w-2xl tracking-tight">
          The town is named for clear water. We just keep the promise.
        </p>
      </m.div>
    </div>
  </section>
);

// ── Section 2: the Clearwater clarity standard ──────────────────────────────
// The weekly checklist as a numbered 01–06 ledger on a deep-navy card — the
// same navy-card DNA as our proposals and emails. Statement left, ledger right.
const standardItems = [
  { label: 'Full water test & balance', sub: 'chlorine, pH, alkalinity, stabilizer, salt' },
  { label: 'All standard chemicals', sub: 'included in your flat rate — no add-ons' },
  { label: 'Skim, brush & vacuum', sub: 'walls, floor, waterline, baskets' },
  { label: 'Filter & equipment check', sub: 'pump, filter, heater, salt cell, valves' },
  { label: 'Photo report every visit', sub: 'see your clear water from anywhere' },
  { label: 'Always Blue Guarantee', sub: 'drifts under our care, we come back free' },
];

// LIGHT band — the homepage's daylight break, carrying Clearwater's signature
// content: the navy 01–06 ledger reads like our proposal card sitting on the
// light page, the same navy-on-light pairing as the hero's chooser card.
const StandardSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7]">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
    <Container className="relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-5"
        >
          <Kicker light>The Clearwater Standard</Kicker>
          <h2 className="section-heading text-balance text-[#0a1628] leading-tight mb-4">
            "Clear" isn't a vibe. It's a checklist.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
            Every weekly visit hits the same standard, beach or mainland. No
            skipped steps on a busy week, no "looks fine" without a real test —
            the same thorough service every single time, all on one flat rate.
          </p>
          <div className="inline-flex items-center gap-2.5 rounded-xl bg-white border border-black/5 shadow-sm shadow-black/5 px-4 py-3">
            <Droplets className="w-5 h-5 text-brand-orange shrink-0" />
            <span className="text-slate-700 text-[14px]">
              Water you'd be happy to see your own name on.
            </span>
          </div>
        </m.div>

        {/* The proposal-navy ledger card, now sitting on the light band. */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="lg:col-span-7 rounded-3xl bg-[#0a1628] p-7 md:p-9 shadow-2xl shadow-[#0a1628]/25 relative overflow-hidden"
        >
          <EdgeLight />
          <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange-light">
              The weekly checklist
            </p>
            <p className="text-[12px] text-gray-400">One flat rate</p>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
            {standardItems.map((s, i) => (
              <li key={s.label} className="flex items-start gap-4">
                <span className="font-display font-black text-brand-orange-light text-lg leading-none pt-0.5 w-8 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="leading-tight">
                  <p className="text-white font-semibold text-[15px]">{s.label}</p>
                  <p className="text-gray-400 text-[13px] mt-0.5">{s.sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </m.div>
      </div>
    </Container>
  </section>
);

// ── Section 3: coverage — zoned by beach/islands vs mainland ─────────────────
// Crawlable local-SEO text (real Clearwater neighborhoods + ZIPs) as a clean
// directory: two ruled lists under zone headers, ZIPs as one big display line.
const BEACH_AREAS = ['Clearwater Beach', 'Sand Key', 'Island Estates'];
const MAINLAND_AREAS = [
  'Countryside',
  'Morningside',
  'Del Oro',
  'Skycrest',
  'Harbor Oaks',
  'Coachman',
  'Sunset Point',
  'Eastwood',
];
const ZIPS = ['33755', '33756', '33759', '33761', '33763', '33764', '33765', '33767'];

// Continues the light passage: the ruled directory reads like a printed index
// on white, and the passage closes with the homepage's CTA payoff before the
// page returns to dark.
const CoverageSection = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  return (
    <section className="py-20 md:py-28 bg-white border-t border-black/[0.06] relative overflow-hidden">
      <Container className="relative z-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-12"
        >
          <Kicker light>Across All of Clearwater</Kicker>
          <h2 className="section-heading text-balance text-[#0a1628] leading-tight mb-4">
            From the sand to the suburbs, on a set day.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            We run weekly routes across both sides of Clearwater — over the
            Memorial Causeway to the island and through the mainland neighborhoods.
            You get a <span className="text-[#0a1628] font-semibold">fixed service day</span>, not a
            vague "sometime this week."
          </p>
        </m.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-10">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-baseline gap-2.5 pb-3 border-b-2 border-brand-blue/40">
              <Waves className="w-5 h-5 text-brand-blue self-center" />
              <h3 className="text-[#0a1628] font-display font-bold text-lg">
                The Beach &amp; Islands
              </h3>
              <span className="ml-auto text-[12px] text-slate-500">
                {BEACH_AREAS.length} areas
              </span>
            </div>
            <ul>
              {BEACH_AREAS.map((n) => (
                <li
                  key={n}
                  className="flex items-center gap-2.5 py-3 border-b border-black/[0.06] text-[15px] text-slate-700"
                >
                  <MapPin className="w-4 h-4 text-brand-blue shrink-0" />
                  {n}
                </li>
              ))}
            </ul>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
          >
            <div className="flex items-baseline gap-2.5 pb-3 border-b-2 border-brand-orange/50">
              <Home className="w-5 h-5 text-brand-orange self-center" />
              <h3 className="text-[#0a1628] font-display font-bold text-lg">The Mainland</h3>
              <span className="ml-auto text-[12px] text-slate-500">
                {MAINLAND_AREAS.length} areas
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8">
              {MAINLAND_AREAS.map((n) => (
                <li
                  key={n}
                  className="flex items-center gap-2.5 py-3 border-b border-black/[0.06] text-[15px] text-slate-700"
                >
                  <MapPin className="w-4 h-4 text-brand-orange shrink-0" />
                  {n}
                </li>
              ))}
            </ul>
          </m.div>
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t border-black/[0.06]"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-3">
            Clearwater ZIP codes we cover
          </p>
          <p className="font-display font-bold text-xl md:text-2xl tracking-wide">
            {ZIPS.map((z, i) => (
              <React.Fragment key={z}>
                {i > 0 && (
                  <span className="text-slate-400 mx-2.5" aria-hidden>
                    ·
                  </span>
                )}
                <span className="text-[#0a1628]">{z}</span>
              </React.Fragment>
            ))}
          </p>
          <p className="text-slate-500 text-[13px] leading-relaxed mt-4 max-w-2xl">
            Don't see your neighborhood? It's not a full list — if you've got a pool
            in Clearwater, on the island or the mainland, we almost certainly
            already cover your street. Just ask.
          </p>
        </m.div>

        {/* CTA payoff closing the light passage — the homepage's move. */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 flex flex-col items-center gap-3"
        >
          <button type="button" onClick={openQuoteSheet} className="btn btn-orange">
            Get a Flat-Rate Quote
          </button>
          <p className="text-slate-500 text-sm">
            Same-day response · No contracts · Beach &amp; mainland, one rate
          </p>
        </m.div>
      </Container>
    </section>
  );
};

// ── Section 4: getting started ──────────────────────────────────────────────
// Three numbered stops on a horizontal route line — open layout, no step cards.
const steps = [
  {
    title: 'Tell us about your pool',
    body:
      "Call, text, or grab a free quote here. Tell us if it's a beach pool or a mainland pool, a couple of quick questions and a look, and we send you a flat monthly price — usually the same day.",
  },
  {
    title: 'We take it from there',
    body:
      "We set your weekly day and your assigned tech, handle the switch from your old service with no gap, and get the water dialed in if it's drifted at all.",
  },
  {
    title: 'You stop thinking about it',
    body:
      "Same tech, same day, photo report after every visit. The water just stays clear — backed by the Always Blue Guarantee. That's the whole idea.",
  },
];

const ProcessSection = () => (
  <section className="py-20 md:py-28 bg-[#0a1422] relative overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[45%] bg-brand-blue/[0.06] rounded-full blur-[160px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <Kicker>Getting Started</Kicker>
        <h2 className="section-heading text-balance text-white leading-tight mb-4">
          Three steps, then it runs itself.
        </h2>
        <p className="section-subtext">
          New to Clearwater, fed up with your current service, or just inherited a
          pool you'd rather not babysit? Getting started takes about one phone
          call.
        </p>
      </m.div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
        {/* The route line connecting the three stops (desktop) — orange at the
            stops, fading between them. */}
        <span
          className="hidden md:block absolute top-5 left-[8%] right-[8%] h-px bg-gradient-to-r from-brand-orange/50 via-white/10 to-brand-orange/50"
          aria-hidden
        />
        {steps.map((s, i) => (
          <m.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative md:pr-6"
          >
            {/* Outlined stop, not a filled glowing disc — solid bg so the
                route line doesn't show through it. */}
            <span className="relative z-10 w-10 h-10 rounded-full bg-[#0a1422] border border-brand-orange/50 text-brand-orange-light font-display font-bold text-[15px] flex items-center justify-center mb-5">
              {i + 1}
            </span>
            <h3 className="text-xl font-display font-bold text-white mb-2">{s.title}</h3>
            <p className="text-gray-400 leading-relaxed text-[15px]">{s.body}</p>
          </m.div>
        ))}
      </div>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-14 pt-8 border-t border-white/[0.07] flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-300"
      >
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-orange-light" /> Always Blue Guarantee
        </span>
        <span className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-brand-orange-light" /> Photo report every visit
        </span>
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-orange-light" /> GPS-verified service
        </span>
      </m.div>
    </Container>
  </section>
);

// ── Section 5: related pool-care guides (internal-link cluster) ─────────────
// Sends link equity to our pillar guides and keeps curious Clearwater owners
// on-site. Topics picked for the beach (salt) + mainland (equipment) split.
const relatedGuides: Array<{
  to: string;
  icon: typeof Sun;
  title: string;
  blurb: string;
}> = [
  {
    to: '/pool-care/salt-water-vs-chlorine',
    icon: Droplets,
    title: 'Salt water vs. chlorine',
    blurb:
      "Thinking about a salt system for your beach pool — or wondering if yours is worth keeping? The honest comparison, costs and all.",
  },
  {
    to: '/pool-care/cyanuric-acid',
    icon: Sun,
    title: 'Cyanuric acid & your chlorine',
    blurb:
      "The stabilizer that climbs in full Gulf sun until your chlorine quits working — and how to keep it in line.",
  },
  {
    to: '/pool-care/variable-speed-pumps',
    icon: Gauge,
    title: 'Variable-speed pumps',
    blurb:
      "If the old single-speed pump on your mainland pad is fading, here's why the replacement pays for itself — plus the Florida rebate.",
  },
  {
    to: '/pool-care/green-pool',
    icon: Waves,
    title: 'How to clear a green pool',
    blurb:
      "A closed-up rental or a pool left over a hot summer? Here's exactly how a green pool comes back to blue, step by step.",
  },
];

const RelatedGuidesSection = () => (
  <section className="py-20 md:py-28 bg-[#0e1c2e] relative overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <div className="absolute top-0 right-1/4 w-[50%] h-[40%] bg-brand-blue/[0.05] rounded-full blur-[150px] pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <Kicker>Pool Care, Explained</Kicker>
        <h2 className="section-heading text-balance text-white leading-tight mb-4">
          Straight answers, even if you never hire us.
        </h2>
        <p className="section-subtext">
          We put the questions Clearwater homeowners ask us most into plain-English
          guides — no jargon, no upsell. Dig in.
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
              className="group glass-panel rounded-2xl p-6 md:p-7 flex items-start gap-4 h-full hover:bg-white/10 hover:border-brand-blue/30 transition-colors"
            >
              <div className="shrink-0 w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/25 flex items-center justify-center">
                <g.icon className="w-5 h-5 text-brand-blue-light" />
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

// ── FAQ ─────────────────────────────────────────────────────────────────────
const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="py-20 md:py-28 bg-[#07111c] relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Kicker center>Clearwater Pool Service</Kicker>
          <h2 className="section-heading text-white">Questions, answered.</h2>
        </m.div>

        <div className="glass-panel rounded-3xl divide-y divide-white/[0.07] overflow-hidden relative">
          <EdgeLight />
          {clearwaterFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `clearwater-faq-panel-${index}`;
            const buttonId = `clearwater-faq-button-${index}`;
            return (
              <div key={index}>
                <button
                  type="button"
                  id={buttonId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 md:px-7 py-5 flex items-center justify-between text-left gap-4 transition-colors hover:bg-white/[0.04]"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="flex items-start gap-4 min-w-0">
                    <span
                      className="font-display font-bold text-gray-600 text-[13px] w-7 shrink-0 pt-1"
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-white font-semibold text-[16px]">{faq.q}</span>
                  </span>
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
                    className="pl-[68px] md:pl-[72px] pr-6 md:pr-7 pb-6 text-gray-400 leading-relaxed"
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

const ClearwaterBelowFold = () => (
  <>
    <TwoWorldsSection />
    <InterludeBand />
    <StandardSection />
    <CoverageSection />
    <ProcessSection />
    <RelatedGuidesSection />
    <FaqSection />
  </>
);

export default ClearwaterBelowFold;
