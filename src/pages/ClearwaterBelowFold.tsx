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
  Filter,
  Bug,
  ShieldCheck,
  CalendarCheck,
  Camera,
  Gauge,
  Beaker,
  Sparkles,
  MapPin,
  MessageSquareText,
  ArrowRight,
  Scale,
  Plus,
  Minus,
} from 'lucide-react';
import { Container } from '@/components/Container';
import { SmartLink } from '@/components/SmartLink';
import { clearwaterFaqs } from '@/pages/clearwaterFaqs';

// ── Section 1: two worlds, one standard ─────────────────────────────────────
// Clearwater's signature angle: it's two towns sharing a name. A barrier-island
// beach world and a big established mainland — genuinely different pools with
// genuinely different problems. This side-by-side comparison is the content no
// other city page has, and ties straight back to the hero's dual-zone card.
// Deliberately NOT Largo's sticky-intro + 2×2 grid.
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
  delay,
}: {
  badge: string;
  badgeIcon: typeof Sun;
  title: string;
  points: { icon: typeof Sun; title: string; body: string }[];
  accent: 'blue' | 'orange';
  delay: number;
}) => {
  const ring =
    accent === 'blue'
      ? 'bg-brand-blue/10 border-brand-blue/25 text-brand-blue-light'
      : 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange-light';
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="glass-panel rounded-2xl p-7 md:p-8 flex flex-col"
    >
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${ring}`}>
          <BadgeIcon className="w-6 h-6" />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">{badge}</p>
          <p className="text-white font-display font-bold text-xl">{title}</p>
        </div>
      </div>
      <ul className="space-y-5">
        {points.map((p) => (
          <li key={p.title} className="flex items-start gap-3.5">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${ring}`}>
              <p.icon className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-[15px] mb-1 leading-snug">{p.title}</h3>
              <p className="text-gray-400 text-[14px] leading-relaxed">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </m.div>
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
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Two Towns, One Name
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          A beach pool and a mainland pool aren't the same job.
        </h2>
        <p className="section-subtext">
          Clearwater is split right down the Intracoastal — the barrier-island
          beach world on one side, the big established mainland on the other. Each
          has its own challenges, and we built our weekly service to handle both,
          held to the same clear-water standard.
        </p>
      </m.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <ZoneColumn
          badge="The Beach & Islands"
          badgeIcon={Waves}
          title="Clearwater Beach · Sand Key"
          points={beachPoints}
          accent="blue"
          delay={0}
        />
        <ZoneColumn
          badge="The Mainland"
          badgeIcon={Home}
          title="Countryside · Del Oro"
          points={mainlandPoints}
          accent="orange"
          delay={0.1}
        />
      </div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-10 flex items-center justify-center"
      >
        <div className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.03] border border-white/10 px-5 py-2.5">
          <Droplets className="w-4 h-4 text-brand-orange-light shrink-0" />
          <span className="text-gray-300 text-[14px]">
            Two very different pools. <span className="text-white">One clear-water standard.</span>
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
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a1422] to-transparent pointer-events-none" />
    <div className="relative h-full flex items-center justify-center">
      <m.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="text-shadow-interlude font-display italic text-white/90 text-2xl sm:text-3xl md:text-[2.25rem] leading-snug text-center px-6 max-w-2xl tracking-tight"
      >
        The town is named for clear water. We just keep the promise.
      </m.p>
    </div>
  </section>
);

// ── Section 2: the Clearwater clarity standard ──────────────────────────────
// What every weekly visit includes, framed as "the standard we hold your water
// to" — Clearwater's name-led trust angle made concrete. Distinct from Largo's
// 3-card "no-upsell promise": a single panel, statement left + a checklist of
// what's-included right.
const standardItems = [
  { icon: Beaker, label: 'Full water test & balance', sub: 'chlorine, pH, alkalinity, stabilizer, salt' },
  { icon: Droplets, label: 'All standard chemicals', sub: 'included in your flat rate — no add-ons' },
  { icon: Sparkles, label: 'Skim, brush & vacuum', sub: 'walls, floor, waterline, baskets' },
  { icon: Filter, label: 'Filter & equipment check', sub: 'pump, filter, heater, salt cell, valves' },
  { icon: Camera, label: 'Photo report every visit', sub: 'see your clear water from anywhere' },
  { icon: ShieldCheck, label: 'Always Blue Guarantee', sub: 'drifts under our care, we come back free' },
];

const StandardSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#0a1422] via-[#0c1828] to-[#0e1c2e]">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[45%] bg-brand-blue/[0.07] rounded-full blur-[160px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-5"
        >
          <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
            The Clearwater Standard
          </span>
          <h2 className="section-heading text-white leading-tight mb-4">
            "Clear" isn't a vibe. It's a checklist.
          </h2>
          <p className="section-subtext mb-6">
            Every weekly visit hits the same standard, beach or mainland. No
            skipped steps on a busy week, no "looks fine" without a real test —
            the same thorough service every single time, all on one flat rate.
          </p>
          <div className="inline-flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3">
            <Droplets className="w-5 h-5 text-brand-orange-light shrink-0" />
            <span className="text-gray-300 text-[14px]">
              Water you'd be happy to see your own name on.
            </span>
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8"
        >
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {standardItems.map((s) => (
              <li key={s.label} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-brand-orange-light" />
                </div>
                <div className="leading-tight pt-0.5">
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
// Crawlable local-SEO text (real Clearwater neighborhoods + ZIPs), grouped into
// the two zones so it reinforces the page's whole duality angle instead of
// reading as Largo's single flat grid.
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

const CoverageSection = () => (
  <section className="py-20 md:py-24 bg-[#0e1c2e] relative overflow-hidden">
    <div className="absolute top-0 left-1/4 w-[55%] h-[45%] bg-brand-blue/[0.05] rounded-full blur-[150px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Across All of Clearwater
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          From the sand to the suburbs, on a set day.
        </h2>
        <p className="section-subtext">
          We run weekly routes across both sides of Clearwater — over the
          Memorial Causeway to the island and through the mainland neighborhoods.
          You get a <span className="text-white">fixed service day</span>, not a
          vague "sometime this week."
        </p>
      </m.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-brand-blue/20 bg-brand-blue/[0.05] p-7"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <Waves className="w-5 h-5 text-brand-blue-light" />
            <h3 className="text-white font-display font-bold text-lg">The Beach & Islands</h3>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {BEACH_AREAS.map((n) => (
              <span
                key={n}
                className="rounded-xl bg-brand-blue/[0.1] border border-brand-blue/25 px-3.5 py-2 text-[14px] text-cyan-50/90"
              >
                {n}
              </span>
            ))}
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-brand-orange/20 bg-brand-orange/[0.04] p-7"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <Home className="w-5 h-5 text-brand-orange-light" />
            <h3 className="text-white font-display font-bold text-lg">The Mainland</h3>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {MAINLAND_AREAS.map((n) => (
              <span
                key={n}
                className="rounded-xl bg-brand-orange/[0.08] border border-brand-orange/20 px-3.5 py-2 text-[14px] text-orange-50/90"
              >
                {n}
              </span>
            ))}
          </div>
        </m.div>
      </div>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-7"
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {ZIPS.map((z) => (
            <span
              key={z}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-1.5 text-sm font-semibold text-gray-200"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-orange-light" /> {z}
            </span>
          ))}
        </div>
        <p className="text-gray-500 text-[13px] leading-relaxed">
          Don't see your neighborhood? It's not a full list — if you've got a pool
          in Clearwater, on the island or the mainland, we almost certainly
          already cover your street. Just ask.
        </p>
      </m.div>
    </Container>
  </section>
);

// ── Section 4: getting started ──────────────────────────────────────────────
// Switching/starting framed simply. Step-pill cards with a top accent bar —
// deliberately NOT Largo's big ghost-number cards.
const steps = [
  {
    icon: MessageSquareText,
    title: 'Tell us about your pool',
    body:
      "Call, text, or grab a free quote here. Tell us if it's a beach pool or a mainland pool, a couple of quick questions and a look, and we send you a flat monthly price — usually the same day.",
  },
  {
    icon: CalendarCheck,
    title: 'We take it from there',
    body:
      "We set your weekly day and your assigned tech, handle the switch from your old service with no gap, and get the water dialed in if it's drifted at all.",
  },
  {
    icon: ShieldCheck,
    title: 'You stop thinking about it',
    body:
      "Same tech, same day, photo report after every visit. The water just stays clear — backed by the Always Blue Guarantee. That's the whole idea.",
  },
];

const ProcessSection = () => (
  <section className="py-20 md:py-24 bg-[#0a1422] relative overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[45%] bg-brand-blue/[0.06] rounded-full blur-[160px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Getting Started
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Three steps, then it runs itself.
        </h2>
        <p className="section-subtext">
          New to Clearwater, fed up with your current service, or just inherited a
          pool you'd rather not babysit? Getting started takes about one phone
          call.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((s, i) => (
          <m.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="h-1 bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-orange" />
            <div className="p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-brand-orange-light" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-2">{s.title}</h3>
              <p className="text-gray-400 leading-relaxed text-[15px]">{s.body}</p>
            </div>
          </m.div>
        ))}
      </div>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-300"
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
  <section className="py-20 md:py-24 bg-[#0e1c2e] relative overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <div className="absolute top-0 right-1/4 w-[50%] h-[40%] bg-brand-blue/[0.05] rounded-full blur-[150px] pointer-events-none" />
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

// ── FAQ ─────────────────────────────────────────────────────────────────────
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
            Clearwater Pool Service
          </span>
          <h2 className="section-heading text-white">Questions, answered.</h2>
        </m.div>

        <div className="space-y-4">
          {clearwaterFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `clearwater-faq-panel-${index}`;
            const buttonId = `clearwater-faq-button-${index}`;
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
