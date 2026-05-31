import React, { useState } from 'react';
import { m } from 'motion/react';
import {
  ShieldCheck,
  Sun,
  Camera,
  UserCheck,
  CalendarCheck,
  MessageSquareText,
  Plus,
  Minus,
  Users,
  Droplets,
  FlaskConical,
  XCircle,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { Container } from '@/components/Container';
import { belleairBeachFaqs } from '@/pages/belleairBeachFaqs';

// Coastal pain → our answer. Maintenance-first framing, no hard price lead.
const coastalCare = [
  {
    icon: UserCheck,
    title: 'The same technician, every week',
    body:
      "You get one dedicated, background-checked technician who learns your pool and your property — not a rotating crew. Discreet, respectful service that fits your schedule and your home.",
  },
  {
    icon: Sun,
    title: 'Built for salt air & relentless sun',
    body:
      'Gulf-front pools take a beating — UV burns off chlorine fast and salt air accelerates wear. We stay ahead of it with consistent weekly chemistry and close equipment care.',
  },
  {
    icon: ShieldCheck,
    title: 'Equipment protected, not just cleaned',
    body:
      'Maintenance is the whole point. We monitor pumps, filters, and salt cells closely so coastal wear gets caught early — long before it becomes a costly repair or replacement.',
  },
  {
    icon: Camera,
    title: "Looked after when you're away",
    body:
      'Many island homes sit empty for stretches. GPS-verified visits and a photo report after every clean mean your pool stays guest-ready and protected whether you are in town or not.',
  },
];

const processSteps = [
  {
    icon: CalendarCheck,
    step: 'Structured weekly service',
    body:
      'A set day, every week, with a documented checklist. No missed visits, no guesswork — your pool is maintained on a rhythm you can count on.',
  },
  {
    icon: Camera,
    step: 'Proof after every visit',
    body:
      'A photo-backed service report lands in your inbox after each clean, showing exactly what was done and the state of your water. Total transparency, even when you are away.',
  },
  {
    icon: MessageSquareText,
    step: 'A real person, one call away',
    body:
      'Questions or a special request? You reach the same local team directly — same-day response, no call centers, no runaround.',
  },
];

const faqs = belleairBeachFaqs;

const CoastalCareSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#07111c] via-[#08131f] to-[#07111c]">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-brand-blue/[0.06] rounded-full blur-[140px] pointer-events-none" />
    <div className="absolute -bottom-24 -left-32 w-[520px] h-[520px] rounded-full bg-[#0a2540]/45 blur-[150px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Island Pool Care
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Service built for homes that demand consistency.
        </h2>
        <p className="section-subtext">
          Belleair Beach sits right on the Gulf, and that environment is unforgiving on
          pools and equipment. Our weekly service is built around staying ahead of it —
          quietly, reliably, and on a schedule you never have to think about.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {coastalCare.map((item, i) => (
          <m.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="glass-panel rounded-2xl p-6 md:p-7 flex gap-5"
          >
            <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
              <item.icon className="w-6 h-6 text-brand-blue-light" />
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

// Photographic "breath moment" — static CSS background, no scroll-driven
// parallax. The previous useScroll/useTransform implementation pulled an
// extra ~9 KB chunk for a subtle drift that wasn't load-bearing.
const InterludeBand = () => (
  <section className="relative h-[42vh] min-h-[360px] md:h-[50vh] md:min-h-[460px] overflow-hidden">
    {/* Desktop photo */}
    <div className="interlude-bg-pinellas-desktop absolute inset-0 hidden md:block bg-cover bg-center" />
    {/* Mobile photo */}
    <div className="interlude-bg-pinellas-mobile absolute inset-0 md:hidden bg-cover bg-center" />

    <div className="interlude-tint-pinellas absolute inset-0 pointer-events-none" />

    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07111c] to-transparent pointer-events-none" />
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a1628] to-transparent pointer-events-none" />

    <div className="relative h-full flex items-center justify-center">
      <m.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="font-display italic text-white/90 text-2xl sm:text-3xl md:text-[2.25rem] leading-snug text-center px-6 max-w-2xl tracking-tight"
        style={{ textShadow: '0 2px 24px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.5)' }}
      >
        Quietly handled. Year-round.
      </m.p>
    </div>
  </section>
);

const ChemistrySection = () => (
  <section className="py-20 md:py-28 bg-[#0a1628] relative overflow-hidden">
    <div className="absolute top-1/3 -left-20 w-[420px] h-[420px] rounded-full bg-brand-blue/[0.07] blur-[140px] pointer-events-none" />
    <div className="absolute bottom-0 -right-24 w-[420px] h-[420px] rounded-full bg-brand-orange/[0.04] blur-[140px] pointer-events-none" />

    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Why Precise Chemistry Matters
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Balanced water protects two things at once.
        </h2>
        <p className="section-subtext">
          A pool that <em>looks</em> clear isn't necessarily a pool that's safe — or
          one that won't slowly destroy itself. Real weekly chemistry guards the
          people swimming and the surfaces holding the water. Most services watch
          one. We watch both.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel rounded-2xl p-7 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-brand-blue-light" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue-light">
                For the people in it
              </p>
              <h3 className="text-xl font-display font-bold text-white leading-tight">
                Sanitation, not just clarity
              </h3>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed text-[15px] mb-5">
            Clear water and <em>sanitized</em> water aren't the same thing. When free
            chlorine drops or pH drifts, bacteria like <span className="text-white">Pseudomonas aeruginosa</span> (hot-tub rash) and waterborne pathogens that cause ear
            and skin infections quietly multiply — even in a pool that looks fine to
            the eye.
          </p>
          <p className="text-gray-300 leading-relaxed text-[15px] mb-6">
            Belleair Beach pools take in guests, salt spray, sunscreen, and warm Gulf
            air — all of which burn through sanitizer fast. We test and rebalance
            every visit so your water is genuinely safe to swim in, not just pretty.
          </p>

          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
              What we monitor for swimmer safety
            </p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-gray-300">
              <li>Free chlorine</li>
              <li>Combined chlorine</li>
              <li>pH</li>
              <li>Cyanuric acid (stabilizer)</li>
            </ul>
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="glass-panel rounded-2xl p-7 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
              <Droplets className="w-6 h-6 text-brand-blue-light" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue-light">
                For the pool itself
              </p>
              <h3 className="text-xl font-display font-bold text-white leading-tight">
                Surfaces, equipment, longevity
              </h3>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed text-[15px] mb-5">
            Water that's even slightly off can quietly eat your pool. Acidic water
            etches plaster, dissolves grout, and corrodes heater components. Water
            that's too hard the other way scales tile, clogs salt cells, and crusts
            up your heat exchanger — repairs that run into thousands.
          </p>
          <p className="text-gray-300 leading-relaxed text-[15px] mb-6">
            On a coastal pool, that drift happens faster. We track the full balance
            — including <span className="text-white">calcium saturation</span> — so
            the water itself stays neutral to your finish and your equipment, year
            after year.
          </p>

          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
              What we monitor for surface &amp; equipment health
            </p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-gray-300">
              <li>pH</li>
              <li>Total alkalinity</li>
              <li>Calcium hardness</li>
              <li>Calcium Saturation Index</li>
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
        <FlaskConical className="w-5 h-5 text-brand-blue-light shrink-0" />
        <p className="text-gray-400 text-[15px]">
          One technician, one weekly visit, one balanced pool —
          <span className="text-white"> protected on both sides.</span>
        </p>
      </m.div>
    </Container>
  </section>
);

const ProcessSection = () => (
  <section className="py-20 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#08131f] via-[#0a1729] to-[#0c1a30]">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[45%] bg-[#3a6b9c]/[0.07] rounded-full blur-[160px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          How It Works
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          No surprises. No missed visits. No headaches.
        </h2>
        <p className="section-subtext">
          A structured service with professional oversight and clear communication at
          every step — so your pool is simply handled.
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
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-5">
              <item.icon className="w-6 h-6 text-brand-blue-light" />
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

const WHY_US_PAIRS: Array<{
  failure: string;
  failureDetail: string;
  us: string;
  usDetail: string;
}> = [
  {
    failure: 'A different tech every week',
    failureDetail:
      "Whoever's free that day. They don't know your pool, your equipment, or where the gate code is taped.",
    us: 'The same dedicated technician — every visit',
    usDetail:
      'Background-checked. Assigned to your property. Learns your pool the way only consistency can.',
  },
  {
    failure: '"Trust us, we balanced it"',
    failureDetail:
      "No proof a tech ever came, no record of what your water actually read. You find out it's off when the water turns.",
    us: 'Photo-verified report after every visit',
    usDetail:
      'A documented service report in your inbox: what was done, what your chemistry read, what you should know. Every time.',
  },
  {
    failure: 'Chemical surcharges that keep climbing',
    failureDetail:
      'Low quoted rate, then "high chlorine demand this month" fees that turn $150 into $230 — month after month.',
    us: 'One flat rate, all standard chemicals',
    usDetail:
      "Standard weekly chemicals are included in the rate you were quoted. Specialty treatments (rare) are always quoted before any work — never billed by surprise.",
  },
  {
    failure: 'Missed visits, no communication',
    failureDetail:
      "Was the truck here today? Did they skip the week? You're guessing — and your pool is the one that loses.",
    us: 'GPS-verified, structured weekly schedule',
    usDetail:
      "A set day every week, GPS-confirmed at the property, with a real person you can reach the same day — not a call-center menu.",
  },
];

const WhyUsSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden bg-[#08131f]">
    <div className="absolute top-1/4 right-[-10%] w-[460px] h-[460px] rounded-full bg-brand-blue/[0.06] blur-[150px] pointer-events-none" />
    <div className="absolute bottom-0 left-[-8%] w-[400px] h-[400px] rounded-full bg-[#0a2540]/40 blur-[140px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />

    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12 md:mb-14"
      >
        <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Not All Pool Companies Are Equal
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          The four things most pool services get wrong.
        </h2>
        <p className="section-subtext">
          Every pool company calls itself "weekly service." Most of the time, what
          that actually means looks very different from what waterfront homeowners
          assume. Here's the gap — and how we close it.
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
                  Most pool services
                </p>
              </div>
              <h3 className="text-[17px] font-display font-bold text-gray-300 leading-snug mb-2">
                {pair.failure}
              </h3>
              <p className="text-gray-500 text-[14px] leading-relaxed">
                {pair.failureDetail}
              </p>
            </div>

            <div className="p-6 md:p-7 bg-brand-blue/[0.05]">
              <div className="flex items-start gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-brand-blue-light shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-blue-light">
                  Suncoast Pool Pros
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
        If you've experienced any of the left column, that's not what weekly pool
        service is supposed to be.{' '}
        <span className="text-white">It's what most companies have settled for.</span>
      </m.p>
    </Container>
  </section>
);

const PromiseStrip = () => (
  <section className="py-16 md:py-20 relative overflow-hidden bg-[#0c1a30]">
    <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[80%] h-[100%] bg-brand-blue/[0.10] rounded-full blur-[150px] pointer-events-none" />
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
          Consistent care. Protected equipment. Always swim-ready.
        </h2>
        <p className="section-subtext max-w-2xl mx-auto mb-8">
          The same dedicated technician every week, full chemical balancing, and a
          documented report after every visit — all for one flat monthly rate, with no
          contracts and no surprise chemical bills.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-300">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-blue-light" /> Always Blue Guarantee
          </span>
          <span className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-blue-light" /> Photo report every visit
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-blue-light" /> GPS-verified service
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
          <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
            Belleair Beach Pool Service
          </span>
          <h2 className="section-heading text-white">Questions, answered.</h2>
        </m.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;
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
                    <Minus className="w-5 h-5 shrink-0 text-brand-blue-light" />
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

// Wraps every below-the-fold section so the page can load all of them as one
// lazy chunk after the hero is painted.
const BelleairBeachBelowFold = () => (
  <>
    <CoastalCareSection />
    <InterludeBand />
    <ChemistrySection />
    <ProcessSection />
    <WhyUsSection />
    <PromiseStrip />
    <FaqSection />
  </>
);

export default BelleairBeachBelowFold;
