import React, { useState } from 'react';
import { m } from 'motion/react';
import {
  Gauge,
  Wrench,
  Settings,
  Handshake,
  ShieldCheck,
  FileText,
  BadgeCheck,
  CalendarCheck,
  MessageSquareText,
  Waves,
  Sun,
  Scale,
  MapPin,
  Camera,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import { Container } from '@/components/Container';
import { SmartLink } from '@/components/SmartLink';
import { largoFaqs } from '@/pages/largoFaqs';

// ── Section 1: the Largo angle — established homes, aging equipment ──────────
// Largo is the big, mature residential core of Pinellas: decades-old homes whose
// pools and equipment have real age on them. This is the page's signature angle
// — equipment lifecycle + honest, no-upsell advice — deliberately NOT Seminole's
// "pool you actually live with" framing or the beaches' salt-air story.
const equipmentPillars = [
  {
    icon: Gauge,
    title: 'We watch the equipment, not just the water',
    body:
      "A lot of Largo pads have a pump or heater that's been running since the second Bush administration. Most services skim and leave — nobody's listening for the bearing that's about to go. We put eyes (and ears) on the pad every single week, so the slow failures get spotted while they're still cheap.",
  },
  {
    icon: Handshake,
    title: 'Repair or replace — straight talk',
    body:
      "When something does start to go, you get a plain explanation and an honest call: fix it, or is it genuinely time to replace? We don't work on commission and we don't scare people into equipment they don't need. If a $40 part buys you two more seasons, that's what we'll tell you.",
  },
  {
    icon: Wrench,
    title: 'Small fixes beat big failures',
    body:
      "A weeping union, a worn lid o-ring, a filter limping into another summer — caught early, these are quick, cheap fixes. Ignored, they're the reason a pump seizes in July or a pool turns green over a long weekend. Weekly eyes are the whole point.",
  },
  {
    icon: Settings,
    title: 'Old setups? We work with what you have',
    body:
      "Mismatched plumbing, a mechanical timer from another era, a quirky valve layout — older Largo pools are full of them, and we're comfortable there. We keep your existing setup running smoothly instead of insisting on a tear-out the first day we show up.",
  },
];

const EquipmentSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#07111c] via-[#0a141f] to-[#07111c]">
    <div className="absolute top-0 right-1/4 w-[50%] h-[42%] bg-brand-orange/[0.06] rounded-full blur-[150px] pointer-events-none" />
    <div className="absolute -bottom-24 -left-28 w-[460px] h-[460px] rounded-full bg-brand-blue/[0.06] blur-[150px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-5 lg:sticky lg:top-28"
        >
          <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
            Built for Established Homes
          </span>
          <h2 className="section-heading text-white leading-tight mb-4">
            Largo's pools have some age on them. Good.
          </h2>
          <p className="section-subtext mb-6">
            Largo is the established heart of Pinellas — neighborhoods that have
            been here for decades, and plenty of pools and equipment that have too.
            That's not a problem to us; it's the whole reason a careful weekly
            service is worth having. We keep older pools running honestly, and tell
            you the truth about what's worth fixing.
          </p>
          <div className="inline-flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3">
            <BadgeCheck className="w-5 h-5 text-brand-orange-light shrink-0" />
            <span className="text-gray-300 text-[14px]">
              No commission. No scare tactics. Just a straight answer.
            </span>
          </div>
        </m.div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {equipmentPillars.map((p, i) => (
            <m.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-panel rounded-2xl p-6"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5 text-brand-orange-light" />
              </div>
              <h3 className="text-[17px] font-display font-bold text-white mb-2 leading-snug">
                {p.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-[14px]">{p.body}</p>
            </m.div>
          ))}
        </div>
      </div>
    </Container>
  </section>
);

// ── Interlude band ──────────────────────────────────────────────────────────
const InterludeBand = () => (
  <section className="relative h-[40vh] min-h-[340px] md:h-[46vh] md:min-h-[420px] overflow-hidden">
    <div className="interlude-bg-largo-desktop absolute inset-0 hidden md:block bg-cover bg-center" />
    <div className="interlude-bg-largo-mobile absolute inset-0 md:hidden bg-cover bg-center" />
    <div className="interlude-tint-largo absolute inset-0 pointer-events-none" />
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
        Straight answers. Clear water. Every single week.
      </m.p>
    </div>
  </section>
);

// ── Section 2: coverage — Heart of Pinellas ─────────────────────────────────
// Crawlable local-SEO text (real Largo neighborhoods + ZIPs). Styled as a
// bordered "coverage card" rather than Seminole's full-width pill cloud, so the
// two inland pages don't read as the same block twice.
const NEIGHBORHOODS = [
  'Largo Central',
  'Harbor Bluffs',
  'East Bay',
  'Highland Lakes',
  'Ridgecrest',
  'Belcher',
  'Walsingham',
  'Rosery',
];
const ZIPS = ['33770', '33771', '33773', '33774', '33778'];

const CoverageSection = () => (
  <section className="py-20 md:py-24 bg-[#0a1422] relative overflow-hidden">
    <div className="absolute top-0 left-1/4 w-[55%] h-[45%] bg-brand-blue/[0.05] rounded-full blur-[150px] pointer-events-none" />
    <Container className="relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-5"
        >
          <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
            Right in the Heart of Pinellas
          </span>
          <h2 className="section-heading text-white leading-tight mb-4">
            Central location, tighter routes, set days.
          </h2>
          <p className="section-subtext">
            Largo sits dead center in our service area, so our routes through it
            are short and our weekly days are dependable. You get a{' '}
            <span className="text-white">fixed service day</span>, not a vague
            "sometime this week" — and a local crew that's only ever a few minutes
            away when something comes up.
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.02] p-7 md:p-8"
        >
          <div className="flex flex-wrap gap-2 mb-6">
            {ZIPS.map((z) => (
              <span
                key={z}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-1.5 text-sm font-semibold text-gray-200"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-orange-light" /> {z}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {NEIGHBORHOODS.map((n, i) => (
              <m.span
                key={n}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl bg-brand-blue/[0.08] border border-brand-blue/20 px-3 py-2.5 text-[14px] text-center text-cyan-50/90"
              >
                {n}
              </m.span>
            ))}
          </div>
          <p className="text-gray-500 text-[13px] mt-6 leading-relaxed border-t border-white/5 pt-5">
            Don't see your neighborhood? It's not a full list — if you've got a
            pool in Largo, we almost certainly already cover your street. Just ask.
          </p>
        </m.div>
      </div>
    </Container>
  </section>
);

// ── Section 3: the no-upsell promise ────────────────────────────────────────
// Largo's trust angle made concrete, framed around REPAIRS/equipment honesty
// (not Seminole's chemical-billing checklist) so the value sections stay
// distinct between the two inland pages.
const promises = [
  {
    icon: Wrench,
    title: 'We fix before we replace',
    body:
      "A new pump or heater is the easy sale. It's rarely the right first move. We exhaust the honest repair first and only call for a replacement when the gear is genuinely done.",
  },
  {
    icon: FileText,
    title: 'Every repair quoted up front',
    body:
      "Nothing beyond normal weekly care happens without a clear number and your okay first. No mystery line items, no work you didn't approve showing up on the bill.",
  },
  {
    icon: Scale,
    title: 'No commission, no pressure',
    body:
      "Our techs aren't paid to push parts, so the advice you get is the advice we'd give our own neighbor. You'll never feel sold to on the side of your own pool.",
  },
];

const PromiseSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#0a1422] via-[#0c1828] to-[#0e1c2e]">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[45%] bg-brand-orange/[0.06] rounded-full blur-[160px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          The No-Upsell Promise
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          The honest pool company Largo's been looking for.
        </h2>
        <p className="section-subtext">
          Ask around Largo and you'll hear the same gripes: the bill that creeps,
          the surprise "you need a new heater," the tech you never see twice. We
          built our service to be the opposite of all of that.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {promises.map((p, i) => (
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
            <h3 className="text-lg font-display font-bold text-white mb-2 leading-snug">
              {p.title}
            </h3>
            <p className="text-gray-400 leading-relaxed text-[15px]">{p.body}</p>
          </m.div>
        ))}
      </div>

      <m.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-10 text-center text-gray-400 text-[15px] max-w-2xl mx-auto leading-relaxed"
      >
        All of it backed by the{' '}
        <span className="text-white">Always Blue Guarantee</span> — if the water
        drifts under our care, we come back and fix it at no charge.
      </m.p>
    </Container>
  </section>
);

// ── Section 4: switching is easy (process, switcher-framed) ──────────────────
// Largo is competitive and full of people unhappy with their current service, so
// the process is framed as "switching is painless" rather than Seminole's
// generic "how it runs" — and uses a numbered-card row, not a circle timeline.
const steps = [
  {
    icon: MessageSquareText,
    title: 'Tell us about your pool',
    body:
      "Call, text, or grab a free quote here. A couple of quick questions and a look, and we send you a flat monthly price — usually the same day.",
  },
  {
    icon: CalendarCheck,
    title: 'We take it from there',
    body:
      "We set your weekly day and assigned tech, handle the switch from your old service with no gap, and get the water dialed in if it's drifted.",
  },
  {
    icon: ShieldCheck,
    title: 'You stop thinking about it',
    body:
      "Same tech, same day, photo report after every visit. The pool just stays clear and the equipment stays watched. That's the whole idea.",
  },
];

const ProcessSection = () => (
  <section className="py-20 md:py-24 bg-[#0e1c2e] relative overflow-hidden">
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
          Switching Is Easy
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Three steps, then it runs itself.
        </h2>
        <p className="section-subtext">
          Fed up with your current service, or just inherited a pool you'd rather
          not babysit? Getting started takes about one phone call.
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
            className="relative glass-panel rounded-2xl p-7 overflow-hidden"
          >
            <span className="absolute -top-3 -right-1 text-[5rem] font-display font-black leading-none text-white/[0.04] select-none">
              {i + 1}
            </span>
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-5">
                <s.icon className="w-6 h-6 text-brand-orange-light" />
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
// Sends link equity to our pillar guides and keeps curious Largo owners on-site.
// Topics chosen for the established-home/equipment angle.
const relatedGuides: Array<{
  to: string;
  icon: typeof Sun;
  title: string;
  blurb: string;
}> = [
  {
    to: '/pool-care/variable-speed-pumps',
    icon: Gauge,
    title: 'Variable-speed pumps',
    blurb:
      "If your old single-speed pump is on its way out, here's why the replacement pays for itself — and the Florida rebate worth knowing about.",
  },
  {
    to: '/pool-care/pool-service-vs-diy',
    icon: Scale,
    title: 'Pool service vs. DIY',
    blurb:
      "The honest math on doing it yourself versus handing it off — chemicals, time, and the cost of one mistake.",
  },
  {
    to: '/pool-care/cyanuric-acid',
    icon: Sun,
    title: 'Cyanuric acid & your chlorine',
    blurb:
      "The stabilizer level that quietly climbs in inland pools until your chlorine stops working — and how to keep it in line.",
  },
  {
    to: '/pool-care/green-pool',
    icon: Waves,
    title: 'How to clear a green pool',
    blurb:
      "Let it slip over a long weekend? Here's exactly how a green pool comes back to blue, step by step.",
  },
];

const RelatedGuidesSection = () => (
  <section className="py-20 md:py-24 bg-[#0a1422] relative overflow-hidden">
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
          We put the questions Largo homeowners ask us most into plain-English
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
            Largo Pool Service
          </span>
          <h2 className="section-heading text-white">Questions, answered.</h2>
        </m.div>

        <div className="space-y-4">
          {largoFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `largo-faq-panel-${index}`;
            const buttonId = `largo-faq-button-${index}`;
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

const LargoBelowFold = () => (
  <>
    <EquipmentSection />
    <InterludeBand />
    <CoverageSection />
    <PromiseSection />
    <ProcessSection />
    <RelatedGuidesSection />
    <FaqSection />
  </>
);

export default LargoBelowFold;
