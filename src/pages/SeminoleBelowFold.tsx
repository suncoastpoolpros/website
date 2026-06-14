import React, { useState } from 'react';
import { m } from 'motion/react';
import {
  ShieldCheck,
  Camera,
  Users,
  Sun,
  Wallet,
  Plus,
  Minus,
  MapPin,
  Leaf,
  Wind,
  Droplets,
  Check,
  X,
  CalendarCheck,
  FileText,
  MessageSquareText,
  Waves,
} from 'lucide-react';
import { Container } from '@/components/Container';
import { seminoleFaqs } from '@/pages/seminoleFaqs';

// ── Section 1: Neighborhoods + ZIPs band ───────────────────────────────────
// A Seminole-specific local-SEO block none of the beach pages have: real,
// crawlable neighborhood + ZIP text. Horizontal pill/tile treatment.
const NEIGHBORHOODS = [
  'Bardmoor',
  'Seminole Lake',
  'Oakhurst',
  'Bay Pines',
  'Lake Seminole',
  'Boca Ciega',
  'Pine Hills',
  'Ridgewood',
];
const ZIPS = ['33772', '33776', '33777', '33778'];

const NeighborhoodsBand = () => (
  <section className="py-16 md:py-20 bg-[#07111c] relative overflow-hidden border-b border-white/[0.05]">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[60%] bg-brand-blue/[0.05] rounded-full blur-[150px] pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10"
      >
        <div className="max-w-xl">
          <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
            Where We Run Our Routes
          </span>
          <h2 className="section-heading text-white leading-tight">
            Every corner of Seminole, every week.
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {ZIPS.map((z) => (
            <span
              key={z}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-1.5 text-sm font-semibold text-gray-200"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-orange-light" /> {z}
            </span>
          ))}
        </div>
      </m.div>

      <div className="flex flex-wrap gap-2.5">
        {NEIGHBORHOODS.map((n, i) => (
          <m.span
            key={n}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="rounded-full bg-brand-blue/[0.08] border border-brand-blue/20 px-4 py-2 text-[15px] text-cyan-50/90"
          >
            {n}
          </m.span>
        ))}
      </div>
      <p className="text-gray-400 text-[15px] mt-7 max-w-2xl leading-relaxed">
        Structured weekly routes through mid-Pinellas mean your pool gets a{' '}
        <span className="text-white">set day every week</span> — not a vague
        "sometime this week." Don't see your street? Call us; if you've got a pool
        in Seminole, we almost certainly cover it.
      </p>
    </Container>
  </section>
);

// ── Section 2: "Built for pools that get used" — 3-pillar row ───────────────
const livedInPillars = [
  {
    icon: Users,
    title: 'Dosed for real, daily use',
    body:
      "Kids after school, grandkids on the weekend, your morning laps — a pool that's in the water every day burns through chlorine far faster than one that just sits. We balance for the load your pool actually carries and leave a safe buffer, so it's swim-ready the day after we visit, not just clear-looking.",
  },
  {
    icon: ShieldCheck,
    title: "You're home — and you'll notice",
    body:
      "Most of our Seminole customers live at the house we service. That's the opposite of a hands-off rental: a skipped week, a cloudy corner, or a sloppy job gets noticed the same day. We built our service to hold up to people who actually look at their pool.",
  },
  {
    icon: Wallet,
    title: 'One flat rate, no nickel-and-diming',
    body:
      "All standard chemicals are in your monthly rate — no surprise 'extra chlorine' or 'high-demand' lines at the end of the month. The price you're quoted is the price you pay, and anything bigger (a repair, a part) is quoted and approved before we touch it.",
  },
];

const LivedInSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#07111c] via-[#0a141f] to-[#07111c]">
    <div className="absolute top-0 right-1/4 w-[50%] h-[40%] bg-brand-orange/[0.05] rounded-full blur-[150px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Built for Full-Time Homes
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          For the pool you swim in — not the one you visit.
        </h2>
        <p className="section-subtext">
          Seminole isn't a beach rental town. It's families and retirees who live
          here year-round and use their pool like part of the house. Our weekly
          service is built around exactly that.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {livedInPillars.map((p, i) => (
          <m.div
            key={p.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel rounded-2xl p-7 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-5">
              <p.icon className="w-6 h-6 text-brand-orange-light" />
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-2">{p.title}</h3>
            <p className="text-gray-400 leading-relaxed text-[15px]">{p.body}</p>
          </m.div>
        ))}
      </div>
    </Container>
  </section>
);

// ── Interlude band ─────────────────────────────────────────────────────────
const InterludeBand = () => (
  <section className="relative h-[40vh] min-h-[340px] md:h-[46vh] md:min-h-[420px] overflow-hidden">
    <div className="interlude-bg-seminole-desktop absolute inset-0 hidden md:block bg-cover bg-center" />
    <div className="interlude-bg-seminole-mobile absolute inset-0 md:hidden bg-cover bg-center" />
    <div className="interlude-tint-seminole absolute inset-0 pointer-events-none" />
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
        A pool that's actually part of the house.
      </m.p>
    </div>
  </section>
);

// ── Section 3: Inland reality / screened pools ─────────────────────────────
// Seminole-specific technical content the salt-air beach pages can't claim.
const inlandFactors = [
  {
    icon: Wind,
    title: 'Screen-cage debris',
    body:
      "Most Seminole pools are screened — and fine debris still blows right through the mesh. We clear the waterline, skimmers, and pump basket of what the cage lets in, and flag a torn panel or sagging door before it turns into a bigger debris (and bug) problem.",
  },
  {
    icon: Leaf,
    title: 'Oak pollen & leaf load',
    body:
      "Spring oak pollen and the tree cover around Lake Seminole and Bardmoor drop a steady organic load into the water. Left alone it feeds algae and eats chlorine. Weekly brushing, skimming, and the right sanitizer level keep ahead of it.",
  },
  {
    icon: Droplets,
    title: 'Inland chemistry, done right',
    body:
      "No salt spray here, but Pinellas fill water runs hard, and stabilizer (CYA) quietly climbs until chlorine stops working. We track hardness and CYA over time and correct the drift early — the slow problems that sink a pool between 'fine' visits.",
  },
  {
    icon: Waves,
    title: 'Salt cells, maintained',
    body:
      "On salt pools we check cell output and clean off scale as part of the regular visit — the step most services skip until the cell dies years early. Chlorine or salt, your equipment gets looked at every single week, not just your water.",
  },
];

const InlandSection = () => (
  <section className="py-20 md:py-28 bg-[#0a1422] relative overflow-hidden">
    <div className="absolute top-1/4 -left-24 w-[420px] h-[420px] rounded-full bg-brand-blue/[0.06] blur-[150px] pointer-events-none" />
    <div className="absolute bottom-0 -right-24 w-[420px] h-[420px] rounded-full bg-brand-orange/[0.05] blur-[150px] pointer-events-none" />
    <Container className="relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-5 lg:sticky lg:top-28"
        >
          <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
            Built for Inland Pinellas
          </span>
          <h2 className="section-heading text-white leading-tight mb-4">
            Seminole pools have their own problems.
          </h2>
          <p className="section-subtext mb-6">
            A screened, tree-shaded Seminole pool doesn't fight salt air the way a
            beach pool does — it fights pollen, leaf load, hard fill water, and the
            slow chemistry drift no one sees until the water turns. We service for
            the conditions you actually have.
          </p>
          <div className="inline-flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3">
            <Sun className="w-5 h-5 text-brand-orange-light shrink-0" />
            <span className="text-gray-300 text-[14px]">
              Same dedicated tech who learns your screen, your trees, your water.
            </span>
          </div>
        </m.div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inlandFactors.map((f, i) => (
            <m.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-panel rounded-2xl p-6"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-brand-blue-light" />
              </div>
              <h3 className="text-[17px] font-display font-bold text-white mb-2 leading-snug">
                {f.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-[14px]">{f.body}</p>
            </m.div>
          ))}
        </div>
      </div>
    </Container>
  </section>
);

// ── Section 4: Flat-rate value panel ───────────────────────────────────────
// Distinct from Treasure's 4-row failure/us split: a single in/out checklist
// panel that makes the "no surprise bills" promise concrete.
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
const NOT_NICKELED = [
  '"Extra chlorine" line items',
  '"High-demand month" surcharges',
  'Per-visit chemical add-ons',
  'Long-term contracts',
];

// LIGHT band — the same daylight break the homepage's "How It Works" section
// gives the landing page, but with Seminole's own content: the flat-rate
// in/out checklist reads like a paper quote on white, which is the whole
// point of "the price we quote is the price you pay."
const ValueSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#e4e9f0] to-[#dce3ec]">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          One Flat Rate
        </span>
        <h2 className="section-heading text-[#0a1628] leading-tight mb-4">
          The price we quote is the price you pay.
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Seminole has no shortage of pool companies — and plenty of them let the
          monthly bill creep with chemical add-ons you can't verify. We don't. Here's
          exactly what's in your flat rate, and what you'll never see tacked on.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* What's included — white "paper quote" card */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-white border border-black/5 shadow-sm shadow-black/5 p-7 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-brand-orange" />
            </div>
            <h3 className="text-xl font-display font-bold text-[#0a1628] leading-tight">
              In your flat rate
            </h3>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14px] text-slate-700">
                <Check className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </m.div>

        {/* What you'll never see — navy card, the visual "no" to the white "yes" */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl bg-[#0a1628] p-7 md:p-8 shadow-xl shadow-[#0a1628]/20"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
              <X className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-xl font-display font-bold text-gray-200 leading-tight">
              What you'll never see
            </h3>
          </div>
          <ul className="grid grid-cols-1 gap-y-3">
            {NOT_NICKELED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14px] text-gray-400">
                <X className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                <span className="line-through decoration-gray-600/60">{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-500 text-[13px] mt-6 leading-relaxed border-t border-white/10 pt-5">
            Bigger work — a pump, a heater, a green-pool recovery — is always quoted
            and approved before we start. No surprises, ever.
          </p>
        </m.div>
      </div>
    </Container>
  </section>
);

// ── Section 5: Process as a horizontal numbered timeline ───────────────────
const steps = [
  {
    icon: CalendarCheck,
    title: 'Same day, every week',
    body: "Your pool goes on a fixed weekly route — same day, same tech, same checklist. No reminding us, no chasing.",
  },
  {
    icon: FileText,
    title: 'Photo report when we leave',
    body: "Within the hour you get chemistry readings, what was done, and condition photos — emailed, every visit.",
  },
  {
    icon: MessageSquareText,
    title: 'A real person to text',
    body: "Question, a heads-up, an extra clean before company comes? Text or call us directly for a same-day reply.",
  },
];

// Continues the light passage started by ValueSection, then the page returns
// to dark at the FAQ — the same dark → light → dark arc as the homepage,
// rendered with Seminole's icon timeline instead of the homepage medallions.
const ProcessTimeline = () => (
  <section className="py-20 md:py-24 bg-[#dce3ec] border-t border-black/[0.06] relative overflow-hidden">
    <Container>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          How It Runs
        </span>
        <h2 className="section-heading text-[#0a1628] leading-tight mb-4">
          You don't manage it. We do.
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          The whole point of weekly service is that it disappears into the
          background. Three steps, then you stop thinking about your pool.
        </p>
      </m.div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
        {/* Connecting line — desktop only */}
        <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-brand-orange/0 via-brand-orange/40 to-brand-orange/0" />
        {steps.map((s, i) => (
          <m.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative text-center md:px-2"
          >
            <div className="relative z-10 mx-auto w-14 h-14 rounded-full bg-white border-2 border-brand-orange/40 shadow-sm flex items-center justify-center mb-5">
              <s.icon className="w-6 h-6 text-brand-orange" />
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
            </div>
            <h3 className="text-lg font-display font-bold text-[#0a1628] mb-2">{s.title}</h3>
            <p className="text-slate-600 leading-relaxed text-[14px] max-w-xs mx-auto">{s.body}</p>
          </m.div>
        ))}
      </div>

      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-700"
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

// ── FAQ ────────────────────────────────────────────────────────────────────
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
            Seminole Pool Service
          </span>
          <h2 className="section-heading text-white">Questions, answered.</h2>
        </m.div>

        <div className="space-y-4">
          {seminoleFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `sem-faq-panel-${index}`;
            const buttonId = `sem-faq-button-${index}`;
            return (
              <div
                key={index}
                className={`faq-item glass-panel rounded-2xl overflow-hidden transition-colors hover:bg-white/10 ${isOpen ? 'is-open' : ''}`}
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
                <div className="faq-answer">
                  <div className="faq-answer-inner">
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4"
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

const SeminoleBelowFold = () => (
  <>
    <NeighborhoodsBand />
    <LivedInSection />
    <InterludeBand />
    <InlandSection />
    <ValueSection />
    <ProcessTimeline />
    <FaqSection />
  </>
);

export default SeminoleBelowFold;
