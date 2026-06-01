import React, { useState } from 'react';
import {
  Leaf,
  Gem,
  Maximize2,
  Trees,
  Droplets,
  Camera,
  CalendarClock,
  MessageSquareText,
  Plus,
  Minus,
  ShieldCheck,
  Wrench,
  XCircle,
  CheckCircle2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { m } from 'motion/react';
import { Container } from '@/components/Container';
import { snellIsleFaqs } from '@/pages/snellIsleFaqs';

// ── Section 1: "Estate pools have estate problems" ─────────────────
// Snell Isle's distinct angle: large custom pools, a mature tree canopy,
// premium finishes, and high-value homes. Not the beach/salt story of the
// barrier-island pages — this is established mainland estate maintenance.
const estateCare = [
  {
    icon: Trees,
    title: 'A mature canopy that never stops shedding',
    body:
      "Snell Isle's old oaks and royal palms are part of what makes it beautiful — and a year-round source of leaves, pollen, fronds, and catkins in your pool. All that organic matter loads the water with phosphates that feed algae. We skim, brush, and manage phosphates every visit so the canopy doesn't quietly turn the pool green.",
  },
  {
    icon: Gem,
    title: 'Premium finishes worth protecting',
    body:
      "Pebble, quartz, glass tile, natural stone coping — the finishes on Snell Isle pools are an investment, and unbalanced water etches, stains, and scales them over time. We hold calcium, pH, and alkalinity in the range that protects the surface you paid for, not just the range that happens to look clear that day.",
  },
  {
    icon: Maximize2,
    title: 'Bigger, more complex pools',
    body:
      "Spas, sun shelves, raised water features, larger volumes — estate pools have more going on than a standard backyard rectangle. That means more circulation to manage and more equipment to watch. We size the weekly visit to the actual pool instead of running every property on the same quick checklist.",
  },
  {
    icon: Droplets,
    title: 'Screened lanais change the chemistry',
    body:
      "A screen enclosure cuts the big debris but traps pollen, holds humidity, and softens the sun — which shifts how algae and sanitizer behave versus an open pool. We adjust for a screened pool rather than treating it the same, and keep an eye on enclosure hardware, which corrodes near the bay.",
  },
];

// ── Section 3: process steps (estate framing) ──────────────────────
const processSteps = [
  {
    icon: CalendarClock,
    step: 'One technician who knows your property',
    body:
      "You get one assigned, background-checked tech — not a rotating crew. Over a few visits they come to know your equipment pad, your enclosure, your finish, and exactly how your pool behaves under that canopy. On a property like this, that familiarity is what keeps small things from slipping through.",
  },
  {
    icon: Camera,
    step: 'A documented report after every visit',
    body:
      "Chemistry readings, what was done, and condition photos in your inbox within the hour. Whether you're home, traveling, or coordinating with a property manager, you have a clear record of exactly how your pool is being cared for.",
  },
  {
    icon: MessageSquareText,
    step: 'A real local you can reach',
    body:
      "Question about your spa heater, a request before guests arrive, a heads-up after a storm — you reach an actual person here in St. Pete with a same-day reply. Not a call center, not a rotating crew that's never seen your pool.",
  },
];

const faqs = snellIsleFaqs;

const EstateCareSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#07111c] via-[#0a141f] to-[#07111c]">
    <div className="absolute top-0 right-1/4 w-[55%] h-[42%] bg-brand-blue/[0.07] rounded-full blur-[150px] pointer-events-none" />
    <div className="absolute -bottom-28 -left-32 w-[520px] h-[520px] rounded-full bg-brand-orange/[0.05] blur-[150px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Built for Snell Isle Estates
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Snell Isle pool service for established estate homes.
        </h2>
        <p className="section-subtext">
          The pools on Snell Isle aren't standard backyard rectangles — they're
          larger, custom-built, set under a mature canopy, and finished in
          materials worth protecting. From Brightwaters Blvd to the streets along
          Coffee Pot Bayou, our weekly service is built around how an estate pool
          actually lives.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {estateCare.map((item, i) => (
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
    </Container>
  </section>
);

const InterludeBand = () => (
  <section className="relative h-[42vh] min-h-[360px] md:h-[50vh] md:min-h-[460px] overflow-hidden">
    <div className="interlude-bg-snellisle-desktop absolute inset-0 hidden md:block bg-cover bg-center" />
    <div className="interlude-bg-snellisle-mobile absolute inset-0 md:hidden bg-cover bg-center" />

    <div className="interlude-tint-snellisle absolute inset-0 pointer-events-none" />

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
        A signature pool deserves a signature standard of care.
      </m.p>
    </div>
  </section>
);

// ── Section 3: "Two things that quietly wreck an estate pool" ───────
// Distinct from the beach pages: this is about the canopy/phosphate->algae
// load and chemistry that damages premium finishes — the two failure modes
// specific to a shaded, high-end Snell Isle pool.
const FailureModesSection = () => (
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
          Where Estate Pools Go Wrong
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Two slow problems most services miss here.
        </h2>
        <p className="section-subtext">
          An estate pool rarely fails fast. It fails slowly, in two ways a
          quick weekly skim won't catch — one fed by the trees above it, one
          working on the finish beneath it. We watch for both.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Failure 1 — the canopy / phosphate load */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel rounded-2xl p-7 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
              <Leaf className="w-6 h-6 text-brand-orange-light" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-orange-light">
                From above
              </p>
              <h3 className="text-xl font-display font-bold text-white leading-tight">
                The canopy feeding the water
              </h3>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed text-[15px] mb-5">
            Every leaf, frond, and dusting of pollen that lands in the pool
            breaks down into <span className="text-white">phosphates</span> —
            the nutrient algae lives on. Under a mature Snell Isle canopy that
            load is constant, so a pool that looks clear on Monday can be hazy
            and fighting algae by the weekend, no matter how much chlorine gets
            dumped in.
          </p>
          <p className="text-gray-300 leading-relaxed text-[15px] mb-6">
            We treat the cause, not just the symptom — physically removing
            debris, keeping baskets and circulation clear, and managing
            phosphates so the chlorine you do use actually holds.
          </p>

          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
              What the canopy quietly causes
            </p>
            <ul className="grid grid-cols-1 gap-y-1.5 text-sm text-gray-300">
              <li>Recurring green or hazy water</li>
              <li>Tannin staining on the finish</li>
              <li>Chlorine that "disappears" too fast</li>
              <li>Clogged baskets and weak circulation</li>
            </ul>
          </div>
        </m.div>

        {/* Failure 2 — finish damage from bad chemistry */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="glass-panel rounded-2xl p-7 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
              <Gem className="w-6 h-6 text-brand-blue-light" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue-light">
                From beneath
              </p>
              <h3 className="text-xl font-display font-bold text-white leading-tight">
                Chemistry eating the finish
              </h3>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed text-[15px] mb-5">
            The slower, more expensive failure happens to the surface itself.
            Water that drifts out of balance — low calcium, swinging pH —
            <span className="text-white"> etches plaster, stains stone, and
            scales tile</span>. By the time it's visible, you're not looking at
            a chemistry fix; you're looking at a resurface.
          </p>
          <p className="text-gray-300 leading-relaxed text-[15px] mb-6">
            On a pebble or glass-tile pool that's a five-figure repair. Weekly
            balancing that respects the finish keeps it off the table — which
            matters a lot more on an estate pool than on a builder-grade one.
          </p>

          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
              What unbalanced water costs later
            </p>
            <ul className="grid grid-cols-1 gap-y-1.5 text-sm text-gray-300">
              <li>Etched or roughened plaster</li>
              <li>Calcium scaling on glass tile</li>
              <li>Staining on natural-stone coping</li>
              <li>Premature resurfacing</li>
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
        <Sparkles className="w-5 h-5 text-brand-orange-light shrink-0" />
        <p className="text-gray-400 text-[15px]">
          One weekly visit —
          <span className="text-white"> protecting both the water and the pool itself.</span>
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
          Discreet, consistent, fully documented.
        </h2>
        <p className="section-subtext">
          On a high-value property, good service is quiet and dependable. Here's
          how it runs once you're on the route.
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

// ── Section 5: why-us comparison — tuned to estate/high-value pain ──
const WHY_US_PAIRS: Array<{
  failure: string;
  failureDetail: string;
  us: string;
  usDetail: string;
}> = [
  {
    failure: 'A quick skim that ignores the finish',
    failureDetail:
      "Plenty of routes do a five-minute skim and a chlorine tab, and never test the calcium or pH that actually protect your surface. The pool looks fine for a year — then the plaster's etched and tile's scaled.",
    us: 'Chemistry that protects the surface',
    usDetail:
      "We balance calcium, pH, and alkalinity to protect pebble, quartz, tile, and stone — not just to pass a quick clarity glance. On an estate pool, the finish is the asset.",
  },
  {
    failure: "Debris that's skimmed, not solved",
    failureDetail:
      "Under a mature canopy, skimming the surface isn't enough — the phosphate load keeps feeding algae, so the pool keeps going hazy and the 'fix' is just dumping more chemicals every week.",
    us: 'We manage the canopy load at the source',
    usDetail:
      "Thorough debris removal, clean baskets and circulation, and phosphate management so algae loses its fuel. The water stays clear because the underlying cause is handled, not masked.",
  },
  {
    failure: 'A rotating crew on a private property',
    failureDetail:
      "Different person every week, none of whom know your enclosure, your spa, or your gate. On a high-value home, that's both inconsistent service and a parade of strangers.",
    us: 'One dedicated, background-checked tech',
    usDetail:
      "The same person every week, who knows your property and equipment and respects that it's your home. Consistency and discretion, not a new face each visit.",
  },
  {
    failure: "A bill that never matches the quote",
    failureDetail:
      '"Extra chemicals," "large pool surcharge," "algae treatment" — vague add-ons that quietly inflate the monthly invoice with nothing you can verify.',
    us: 'One flat rate, standard chemicals included',
    usDetail:
      "Standard weekly chemicals are in the flat monthly price, sized to your pool up front. Major work — recovery, parts, storm response — is quoted and approved before we start.",
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
          What Sets Our Service Apart
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Four ways estate pool service usually slips.
        </h2>
        <p className="section-subtext">
          If you've owned a Snell Isle pool for a while, you've probably seen at
          least one of these. Here's why they happen — and how our weekly
          service is built to avoid them.
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
        The pattern is the same: an estate pool needs a service that treats it
        like <span className="text-white">the investment it is</span> — most
        routes are built for volume instead.
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
          Clear water. Protected finish. Zero hassle.
        </h2>
        <p className="section-subtext max-w-2xl mx-auto mb-8">
          One dedicated technician, finish-safe chemistry, full debris and
          equipment care, and a photo report after every visit — for one flat
          monthly rate. No contracts, no surprise chemical bills.
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
      </m.div>
    </div>
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
            Snell Isle Pool Service
          </span>
          <h2 className="section-heading text-white">Questions, answered.</h2>
        </m.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `si-faq-panel-${index}`;
            const buttonId = `si-faq-button-${index}`;
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

const SnellIsleBelowFold = () => (
  <>
    <EstateCareSection />
    <InterludeBand />
    <FailureModesSection />
    <ProcessSection />
    <WhyUsSection />
    <PromiseStrip />
    <FaqSection />
  </>
);

export default SnellIsleBelowFold;
