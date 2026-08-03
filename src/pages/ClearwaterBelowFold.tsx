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
  Navigation,
} from 'lucide-react';
import { Container } from '@/components/Container';
import { SmartLink } from '@/components/SmartLink';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { clearwaterFaqs } from '@/pages/clearwaterFaqs';
import { cn } from '@/lib/utils';

// ── Clearwater — light theme, one section = one idea ─────────────────────────
// The design rule for this page: every section gets its OWN structural language
// so nothing reads templated. A two-tone "Intracoastal" diptych, a quiet
// watermark breather, an editorial spec-sheet grid, a map-style pill index, a
// numbered path, a divided reading list, a single accordion. The only repeated
// element — the connective tissue — is the indexed overline (a faded section
// number, an orange rule, an uppercase kicker). Palette stays light throughout:
// airy white + pale aqua, brand navy headings, slate body, orange the single CTA
// color, brand blue the "clear water" accent.

const NAVY = 'text-[#0a1628]';

// The page's one repeated motif: an indexed overline. Ties the sections together
// without making their bodies look alike.
const Overline = ({
  index,
  children,
  center = false,
}: {
  index: string;
  children: React.ReactNode;
  center?: boolean;
}) => (
  <span className={cn('flex items-center gap-3 mb-5', center && 'justify-center')}>
    <span className="font-display font-bold text-[13px] text-slate-300 tabular-nums">{index}</span>
    <span className="h-px w-8 shrink-0 bg-brand-orange" aria-hidden />
    <span className="font-bold tracking-[0.2em] uppercase text-xs text-brand-orange">{children}</span>
  </span>
);

// ═══════════════════════════════════════════════════════════════════════════
// 01 · TWO WORLDS — the two-tone "Intracoastal" diptych
// Clearwater is two towns sharing a name. So the section is literally split in
// two: a cool-blue water side and a warm-sand land side, divided by a line
// labeled "The Intracoastal." The two grounds tell the story before a word is
// read.
// ═══════════════════════════════════════════════════════════════════════════
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
      "A lot of these pools went in decades ago, and the equipment pads show it. We look over the pump, filter, and heater every single visit — and when a part is genuinely aging out, you hear it straight: repair or replace, with no commission behind the recommendation.",
  },
  {
    icon: Bug,
    title: 'Full-time pools, kept swimmable',
    body:
      "These aren't twice-a-year second homes — families and retirees swim in them year-round. We keep the water balanced and safe to jump into any day of the week.",
  },
];

const BoldZonePanel = ({
  index,
  badge,
  badgeIcon: BadgeIcon,
  title,
  points,
  accent,
}: {
  index: string;
  badge: string;
  badgeIcon: typeof Sun;
  title: string;
  points: { icon: typeof Sun; title: string; body: string }[];
  accent: 'blue' | 'orange';
}) => {
  const isBlue = accent === 'blue';
  const ground = isBlue ? 'bg-gradient-to-br from-[#0f4d80] to-[#1669ae]' : 'bg-[#0a1628]';
  const tile = isBlue ? 'bg-white/15' : 'bg-brand-orange';
  const mark = isBlue ? 'text-brand-blue-light' : 'text-brand-orange-light';
  return (
    <div className={cn('relative overflow-hidden p-8 md:p-10 lg:p-12', ground)}>
      {/* Oversized ghost index. */}
      <span
        aria-hidden
        className="pointer-events-none select-none absolute -top-5 right-3 font-display font-black text-white/[0.06] text-[9rem] leading-none"
      >
        {index}
      </span>
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <span className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', tile)}>
            <BadgeIcon className="w-5 h-5 text-white" />
          </span>
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/70">{badge}</p>
        </div>
        <h3 className="font-display font-black text-white text-2xl md:text-[1.75rem] leading-tight mb-8">
          {title}
        </h3>
        <ul className="space-y-5">
          {points.map((p) => (
            <li key={p.title} className="flex gap-3.5">
              <p.icon className={cn('w-5 h-5 mt-0.5 shrink-0', mark)} />
              <div>
                <h4 className="text-white font-bold text-[15px] mb-1 leading-snug">{p.title}</h4>
                <p className="text-white/65 text-[14px] leading-relaxed">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const TwoWorldsSection = () => (
  <section className="py-20 md:py-28 bg-white">
    <Container>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <Overline index="01">Two Towns, One Name</Overline>
        <h2 className="font-display font-black text-[#0a1628] text-4xl md:text-5xl tracking-tight leading-[1.05] text-balance mb-5">
          A beach pool and a mainland pool aren't the same job.
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Clearwater is split right down the Intracoastal — the barrier-island beach world on one
          side, the big established mainland on the other. Each has its own challenges, and we built
          our weekly service to handle both, held to the same clear-water standard.
        </p>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-[1.75rem] overflow-hidden shadow-[0_40px_90px_-35px_rgba(3,12,24,0.65)]"
      >
        <div className="grid lg:grid-cols-2">
          <BoldZonePanel
            index="01"
            badge="The Beach & Islands"
            badgeIcon={Waves}
            title="Clearwater Beach · Sand Key"
            points={beachPoints}
            accent="blue"
          />
          {/* Mobile seam — the Intracoastal between the stacked panels. */}
          <div className="lg:hidden relative flex items-center justify-center bg-[#0a1628] py-3">
            <span className="absolute inset-x-8 top-1/2 h-px bg-white/15" aria-hidden />
            <span className="relative inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0a1628] shadow">
              <Navigation className="w-3.5 h-3.5 text-brand-blue" />
              The Intracoastal
            </span>
          </div>
          <BoldZonePanel
            index="02"
            badge="The Mainland"
            badgeIcon={Home}
            title="Countryside · Del Oro"
            points={mainlandPoints}
            accent="orange"
          />
        </div>
        {/* Desktop divider — the literal line that splits the city. */}
        <span className="hidden lg:block absolute inset-y-12 left-1/2 w-px bg-white/15" aria-hidden />
        <span className="hidden lg:inline-flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center gap-2 rounded-full bg-white shadow-lg px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0a1628] whitespace-nowrap">
          <Navigation className="w-3.5 h-3.5 text-brand-blue" />
          The Intracoastal
        </span>
      </m.div>

      <p className="text-center text-slate-600 text-[15px] mt-8">
        Two very different pools. <span className="font-bold text-[#0a1628]">One clear-water standard.</span>
      </p>
    </Container>
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════
// 02 · BREATHER — the thesis on aqua, with a giant watermark word
// The only "quiet" section: no cards, no lists. Just the page's whole premise in
// display italic, over an oversized faded "clear" so the band has texture.
// ═══════════════════════════════════════════════════════════════════════════
const InterludeBand = () => (
  <section className="relative overflow-hidden bg-[#0a1628] py-24 md:py-36">
    {/* Faint oversized watermark for graphic texture. */}
    <span
      aria-hidden
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
    >
      <span className="font-display font-black text-white/[0.04] leading-none tracking-tighter text-[40vw] md:text-[24vw]">
        clear
      </span>
    </span>
    <Container className="relative text-center">
      <m.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <span className="block w-12 h-[3px] bg-brand-orange mx-auto mb-8" aria-hidden />
        <p className="font-display font-black text-white text-3xl sm:text-4xl md:text-[3.5rem] leading-[1.06] tracking-tight max-w-4xl mx-auto">
          The town is named for <span className="text-brand-orange">clear water.</span> We just keep the
          promise.
        </p>
      </m.div>
    </Container>
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════
// 03 · THE STANDARD — an editorial spec sheet
// Not a floating card: a bordered grid with oversized ghost numerals, framed by
// a label bar like a real specification. The last cell (the guarantee) is the
// one tinted, accented row — the thing they should remember.
// ═══════════════════════════════════════════════════════════════════════════
const standardItems = [
  { label: 'Full water test & balance', sub: 'chlorine, pH, alkalinity, stabilizer, salt' },
  { label: 'All standard chemicals', sub: 'included in your flat rate — no add-ons' },
  { label: 'Skim, brush & vacuum', sub: 'walls, floor, waterline, baskets' },
  { label: 'Filter & equipment check', sub: 'pump, filter, heater, salt cell, valves' },
  { label: 'Photo report every visit', sub: 'see your clear water from anywhere' },
  { label: 'Always Blue Guarantee', sub: 'drifts under our care, we come back free' },
];

const StandardSection = () => (
  <section className="py-20 md:py-28 bg-white">
    <Container>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-10"
      >
        <Overline index="02">The Clearwater Standard</Overline>
        <h2 className={cn('section-heading text-balance leading-tight mb-4', NAVY)}>
          "Clear" isn't a vibe. It's a checklist.
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Every weekly visit hits the same standard, beach or mainland. No skipped steps on a busy
          week, no "looks fine" without a real test — the same thorough service every single time, all
          on one flat rate.
        </p>
      </m.div>

      {/* The spec sheet. */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between border-b-2 border-[#0a1628] pb-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0a1628]">
            The weekly checklist
          </span>
          <span className="text-[12px] text-slate-500">Included · one flat rate</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-slate-200">
          {standardItems.map((s, i) => {
            const isGuarantee = i === standardItems.length - 1;
            return (
              <div
                key={s.label}
                className={cn(
                  'relative border-r border-b border-slate-200 p-6 md:p-7',
                  isGuarantee && 'bg-brand-orange/[0.05]',
                )}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      'font-display font-black text-4xl leading-none tabular-nums',
                      isGuarantee ? 'text-brand-orange' : 'text-slate-200',
                    )}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="pt-0.5 leading-tight">
                    <p className={cn('font-semibold text-[15px] flex items-center gap-1.5', NAVY)}>
                      {isGuarantee && <ShieldCheck className="w-4 h-4 text-brand-orange shrink-0" />}
                      {s.label}
                    </p>
                    <p className="text-slate-500 text-[13px] mt-1">{s.sub}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="flex items-center gap-2.5 mt-5 text-slate-600 text-[14px]">
          <Droplets className="w-5 h-5 text-brand-orange shrink-0" />
          Water you'd be happy to see your own name on.
        </p>
      </m.div>
    </Container>
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════
// 04 · COVERAGE — a map-style index
// Neighborhoods as pills grouped by zone (not ruled rows), with a dotted route
// motif and the ZIPs blown up as display type. Crawlable local-SEO text in a
// structure that reads like a coverage map, not another card.
// ═══════════════════════════════════════════════════════════════════════════
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

const ZoneGroup = ({
  icon: Icon,
  label,
  areas,
  accent,
}: {
  icon: typeof Waves;
  label: string;
  areas: string[];
  accent: 'blue' | 'orange';
}) => {
  const dot = accent === 'blue' ? 'bg-brand-blue' : 'bg-brand-orange';
  const ic = accent === 'blue' ? 'text-brand-blue' : 'text-brand-orange';
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className={cn('w-[18px] h-[18px] shrink-0', ic)} />
        <h3 className={cn('font-display font-bold text-base', NAVY)}>{label}</h3>
        <span className="text-[12px] text-slate-400">{areas.length} areas</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {areas.map((a) => (
          <span
            key={a}
            className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-slate-200 px-3.5 py-1.5 text-[14px] text-[#0a1628] shadow-sm"
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', dot)} aria-hidden />
            {a}
          </span>
        ))}
      </div>
    </div>
  );
};

const CoverageSection = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  return (
    <section className="py-20 md:py-28 bg-[#eef4fa]">
      <Container>
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-12"
        >
          <Overline index="03">Across All of Clearwater</Overline>
          <h2 className={cn('section-heading text-balance leading-tight mb-4', NAVY)}>
            From the sand to the suburbs, on a set day.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Our trucks cross the Memorial Causeway and thread the mainland grid every single week —
            Belcher out to the beach, Sunset Point down toward Belleair Road. Your visit lands on the{' '}
            <span className={cn('font-semibold', NAVY)}>same day, every week</span>, so you always
            know when we're coming.
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative grid lg:grid-cols-2 gap-10 lg:gap-16"
        >
          {/* Dotted route dividing the two zones (desktop). */}
          <span
            className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[64%] border-l-2 border-dashed border-slate-300"
            aria-hidden
          />
          <ZoneGroup icon={Waves} label="The Beach & Islands" areas={BEACH_AREAS} accent="blue" />
          <ZoneGroup icon={Home} label="The Mainland" areas={MAINLAND_AREAS} accent="orange" />
        </m.div>

        {/* ZIPs blown up as display type — the one oversized line in the section. */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t border-slate-200"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <MapPin className="w-[18px] h-[18px] shrink-0 text-brand-blue" />
            <h3 className={cn('font-display font-bold text-base', NAVY)}>ZIP codes we cover</h3>
            <span className="text-[12px] text-slate-400">{ZIPS.length} covered</span>
          </div>
          <p className="font-display font-bold text-2xl md:text-4xl tracking-tight leading-relaxed">
            {ZIPS.map((z, i) => (
              <React.Fragment key={z}>
                <span className={cn('whitespace-nowrap', NAVY)}>
                  {z}
                  {i < ZIPS.length - 1 && (
                    <span className="text-brand-orange/60 mx-2 md:mx-3" aria-hidden>
                      ·
                    </span>
                  )}
                </span>{' '}
              </React.Fragment>
            ))}
          </p>
        </m.div>

        <m.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-slate-500 text-[13px] leading-relaxed mt-6 max-w-2xl"
        >
          Treat this list as a sampling, not a boundary line. The routes above criss-cross the whole
          city, island and mainland alike — if your pool has a Clearwater address, chances are a
          truck already passes your street. Call and we'll confirm.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <button
            type="button"
            onClick={openQuoteSheet}
            className="btn btn-orange shadow-lg shadow-brand-orange/20"
          >
            Get a Flat-Rate Quote
            <ArrowRight className="w-[18px] h-[18px]" />
          </button>
          <p className="text-slate-500 text-sm">
            Same-day response · No contracts · Beach &amp; mainland, one rate
          </p>
        </m.div>
      </Container>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 05 · GETTING STARTED — a numbered path
// A timeline: vertical rail on mobile, horizontal rail on desktop, with solid
// numbered nodes. Movement, not boxes — distinct from the spec sheet's static
// ghost numerals.
// ═══════════════════════════════════════════════════════════════════════════
const steps = [
  {
    title: 'One quick conversation',
    body:
      "Call, text, or use the quote form. Tell us which side of the Intracoastal you're on and what your equipment pad is running, and we'll put a firm monthly number in front of you — typically before the day is out.",
  },
  {
    title: 'You land on a route',
    body:
      "We slot you onto one of our Clearwater routes: a dedicated tech, a locked-in day of the week. Leaving another company? We coordinate the handoff so the pool never misses a visit — and if the chemistry needs rescuing first, we rescue it.",
  },
  {
    title: 'The water stays clear',
    body:
      "After that it's rhythm — your tech, your day, a photo report in your inbox when the gate closes behind us. And every week of it is backed by the Always Blue Guarantee.",
  },
];

const ProcessSection = () => (
  <section className="py-20 md:py-28 bg-white">
    <Container>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <Overline index="04">Getting Started</Overline>
        <h2 className={cn('section-heading text-balance leading-tight mb-4', NAVY)}>
          Getting started is the easy part.
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Buying on the island, settling into the mainland, or just done doing this yourself? From
          first call to first visit is usually under a week — here's the whole process.
        </p>
      </m.div>

      <div className="relative">
        {/* Mobile: vertical rail. Desktop: horizontal rail behind the nodes. */}
        <span className="md:hidden absolute left-5 top-3 bottom-3 w-px bg-slate-200" aria-hidden />
        <span
          className="hidden md:block absolute top-5 left-[16%] right-[16%] h-px bg-gradient-to-r from-brand-orange/50 via-slate-200 to-brand-orange/50"
          aria-hidden
        />
        <ol className="grid md:grid-cols-3 gap-8 md:gap-8">
          {steps.map((s, i) => (
            <m.li
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative flex md:block gap-5"
            >
              <span className="relative z-10 w-10 h-10 shrink-0 rounded-full bg-brand-orange text-white font-display font-bold text-[15px] flex items-center justify-center shadow-md shadow-brand-orange/30 md:mb-5">
                {i + 1}
              </span>
              <div className="pt-1.5 md:pt-0">
                <h3 className={cn('text-xl font-display font-bold mb-2', NAVY)}>{s.title}</h3>
                <p className="text-slate-600 leading-relaxed text-[15px]">{s.body}</p>
              </div>
            </m.li>
          ))}
        </ol>
      </div>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-14 pt-8 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-600"
      >
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-orange" /> Always Blue Guarantee
        </span>
        <span className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-brand-orange" /> Photo report every visit
        </span>
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-orange" /> GPS-verified service
        </span>
      </m.div>
    </Container>
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════
// 06 · POOL CARE — a divided reading list
// Internal-link cluster as an editorial index (one bordered list, big arrows),
// not a 2×2 grid of floating cards.
// ═══════════════════════════════════════════════════════════════════════════
const relatedGuides: Array<{ to: string; icon: typeof Sun; title: string; blurb: string }> = [
  {
    to: '/pool-care/salt-water-vs-chlorine/',
    icon: Droplets,
    title: 'Salt water vs. chlorine',
    blurb:
      "Thinking about a salt system for your beach pool — or wondering if yours is worth keeping? The honest comparison, costs and all.",
  },
  {
    to: '/pool-care/cyanuric-acid/',
    icon: Sun,
    title: 'Cyanuric acid & your chlorine',
    blurb:
      "The stabilizer that climbs in full Gulf sun until your chlorine quits working — and how to keep it in line.",
  },
  {
    to: '/pool-care/variable-speed-pumps/',
    icon: Gauge,
    title: 'Variable-speed pumps',
    blurb:
      "Still running a single-speed pump on the mainland pad? What a variable-speed swap does to your electric bill — and the Florida rebate that softens the price.",
  },
  {
    to: '/pool-care/green-pool/',
    icon: Waves,
    title: 'How to clear a green pool',
    blurb:
      "A rental that sat closed up, or a summer that got away from you? The full recovery, from swamp back to swimmable, explained stage by stage.",
  },
];

const RelatedGuidesSection = () => (
  <section className="py-20 md:py-28 bg-[#eef4fa]">
    <Container>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <Overline index="05">The Reading List</Overline>
        <h2 className={cn('section-heading text-balance leading-tight mb-4', NAVY)}>
          Clear answers, free to keep.
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Salt cells, stabilizer, pump upgrades, green-pool rescues — the things Clearwater pool
          owners actually wonder about, written the way we'd explain them standing at your equipment
          pad.
        </p>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden divide-y divide-slate-200"
      >
        {relatedGuides.map((g) => (
          <SmartLink
            key={g.to}
            to={g.to}
            className="group flex items-center gap-5 p-5 sm:p-6 transition-colors hover:bg-slate-50"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
              <g.icon className="w-5 h-5 text-brand-blue" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={cn('font-display font-bold text-[17px] leading-tight mb-0.5', NAVY)}>
                {g.title}
              </h3>
              <p className="text-slate-600 text-[14px] leading-snug">{g.blurb}</p>
            </div>
            <ArrowRight className="w-5 h-5 shrink-0 text-slate-300 transition-all group-hover:text-brand-orange group-hover:translate-x-0.5" />
          </SmartLink>
        ))}
      </m.div>
    </Container>
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════
// 07 · FAQ — one divided accordion
// Answers stay in the DOM (CSS grid-rows collapse) so all 9 Q&As prerender for
// crawlers; the `.faq-item`/`.faq-answer` mechanism is color-agnostic.
// ═══════════════════════════════════════════════════════════════════════════
const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="relative bg-white pt-20 md:pt-28 pb-24 md:pb-32">
      {/* Soft handoff into the dark CtaBand that follows. */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#07111c] pointer-events-none"
        aria-hidden
      />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Overline index="08" center>
            Clearwater Pool Service
          </Overline>
          <h2 className={cn('section-heading', NAVY)}>Questions, answered.</h2>
        </m.div>

        <div className="rounded-2xl bg-white ring-1 ring-slate-200 divide-y divide-slate-200 overflow-hidden">
          {clearwaterFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `clearwater-faq-panel-${index}`;
            const buttonId = `clearwater-faq-button-${index}`;
            return (
              <div key={index} className={cn('faq-item', isOpen && 'is-open')}>
                <button
                  type="button"
                  id={buttonId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 md:px-7 py-5 flex items-center justify-between text-left gap-4 transition-colors hover:bg-slate-50"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="flex items-start gap-4 min-w-0">
                    <span
                      className="font-display font-bold text-brand-orange/70 text-[13px] w-7 shrink-0 pt-1 tabular-nums"
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={cn('font-semibold text-[16px]', NAVY)}>{faq.q}</span>
                  </span>
                  {isOpen ? (
                    <Minus className="w-5 h-5 shrink-0 text-brand-orange" />
                  ) : (
                    <Plus className="w-5 h-5 shrink-0 text-slate-400" />
                  )}
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-inner">
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="pl-[68px] md:pl-[72px] pr-6 md:pr-7 pb-6 text-slate-600 leading-relaxed"
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
