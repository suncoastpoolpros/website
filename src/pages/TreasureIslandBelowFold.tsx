import React, { useState } from 'react';
import { m } from 'motion/react';
import {
  ShieldCheck,
  Camera,
  KeyRound,
  CalendarCheck,
  MessageSquareText,
  Plus,
  Minus,
  Plane,
  EyeOff,
  FlaskConical,
  XCircle,
  CheckCircle2,
  MapPin,
  Home,
} from 'lucide-react';
import { Container } from '@/components/Container';
import { treasureIslandFaqs } from '@/pages/treasureIslandFaqs';

// "Built for absentee owners" — replaces the generic coastal care framing
// with cards written specifically for rental owners and second-home owners.
const absenteeCare = [
  {
    icon: KeyRound,
    title: 'One technician who knows your property',
    body:
      "The same background-checked tech every week — they learn your gate code, your equipment quirks, where the cleaner leaves the spare key. Remote ownership only works when the people on the ground are consistent.",
  },
  {
    icon: Camera,
    title: 'Photo proof in your inbox after every visit',
    body:
      "A timestamped service report — what was done, what your water read, photos of the pool. Forward it to your guest, your property manager, or just keep it for your records. No more wondering whether anyone actually came.",
  },
  {
    icon: Home,
    title: 'Guest-ready between every booking',
    body:
      "Weekly visits are timed so the pool is balanced and clear going into your high-turnover days. If a booking lands on the wrong side of the schedule, we can add a paid turnover clean — just text us the date.",
  },
  {
    icon: Plane,
    title: 'Maintained through your off-season',
    body:
      "Heading north for the summer? Your pool doesn't go on vacation. We catch slow algae, salt cell wear, and water-level issues early — so you come back to a pool that looks the way you left it.",
  },
];

const processSteps = [
  {
    icon: CalendarCheck,
    step: 'A set day, every week',
    body:
      "Your pool is on a structured weekly route — same day, same tech, same checklist. You don't have to coordinate with us, remind us, or check in. It just happens.",
  },
  {
    icon: Camera,
    step: 'Photo report after every visit',
    body:
      "Within an hour of finishing, you get a documented report by email — chemistry readings, what was done, condition photos. Forward it to whoever needs to see it.",
  },
  {
    icon: MessageSquareText,
    step: 'A real person, in your timezone or not',
    body:
      "Need a turnover clean, a heads-up call before a guest arrives, or want us to coordinate with your cleaner? You text or call us directly — same-day reply, every time.",
  },
];

const faqs = treasureIslandFaqs;

const AbsenteeCareSection = () => (
  // Warmer palette than Belleair — slightly more amber in the wash so the
  // page reads "sun-bleached beach town" rather than "deep Gulf discretion".
  <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#07111c] via-[#0a141f] to-[#07111c]">
    <div className="absolute top-0 right-1/3 w-[55%] h-[40%] bg-brand-orange/[0.05] rounded-full blur-[140px] pointer-events-none" />
    <div className="absolute -bottom-24 -right-32 w-[520px] h-[520px] rounded-full bg-[#1f2a3a]/40 blur-[150px] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Built for Absentee Owners
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Pool service that works when you're not there.
        </h2>
        <p className="section-subtext">
          Most of our Treasure Island customers don't live at the property they own.
          Vacation rentals, snowbird second homes, family beach houses — we built our
          weekly service around how absentee ownership actually works.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {absenteeCare.map((item, i) => (
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

// Interlude — same static photo treatment as Belleair, different
// overlay line that ties to the absentee-owner thesis.
const InterludeBand = () => (
  <section className="relative h-[42vh] min-h-[360px] md:h-[50vh] md:min-h-[460px] overflow-hidden">
    <div
      className="absolute inset-0 hidden md:block bg-cover bg-center"
      style={{
        backgroundImage:
          "image-set(url('/treasure-island-hero.webp') type('image/webp') 1x, url('/treasure-island-hero-1920.webp') type('image/webp') 2x, url('/treasure-island-hero.jpg') type('image/jpeg') 1x)",
        filter: 'saturate(1.25) brightness(0.55) contrast(1.08) hue-rotate(-6deg)',
      }}
    />
    <div
      className="absolute inset-0 md:hidden bg-cover bg-center"
      style={{
        backgroundImage:
          "image-set(url('/treasure-island-hero-mobile.webp') type('image/webp'), url('/treasure-island-hero-mobile.jpg') type('image/jpeg'))",
        filter: 'saturate(1.25) brightness(0.55) contrast(1.08) hue-rotate(-6deg)',
      }}
    />

    <div
      className="absolute inset-0 pointer-events-none"
      style={{ backgroundColor: '#1669AE', mixBlendMode: 'overlay', opacity: 0.35 }}
    />

    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07111c] to-transparent pointer-events-none" />
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a1422] to-transparent pointer-events-none" />

    <div className="relative h-full flex items-center justify-center">
      <m.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="font-display italic text-white/90 text-2xl sm:text-3xl md:text-[2.25rem] leading-snug text-center px-6 max-w-2xl tracking-tight"
        style={{ textShadow: '0 2px 24px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.5)' }}
      >
        Always handled. Even when you're not there.
      </m.p>
    </div>
  </section>
);

// "The two ways rental pools fail" — reframes Belleair's chemistry pillars
// into the absentee-owner story. The chemistry knowledge is still there,
// but told through the lens of remote ownership and rental turnover.
const RentalFailurePillars = () => (
  <section className="py-20 md:py-28 bg-[#0a1422] relative overflow-hidden">
    <div className="absolute top-1/3 -right-20 w-[420px] h-[420px] rounded-full bg-brand-orange/[0.06] blur-[140px] pointer-events-none" />
    <div className="absolute bottom-0 -left-24 w-[420px] h-[420px] rounded-full bg-brand-blue/[0.05] blur-[140px] pointer-events-none" />

    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-orange-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          How Rental Pools Quietly Fail
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Two failure modes most absentee owners never see.
        </h2>
        <p className="section-subtext">
          A pool can be failing in two completely different ways at the same
          time — one that bites you during a booking, one that bites you between
          bookings. Most weekly services only watch for one. We watch for both.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Failure 1 — the guest gap */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel rounded-2xl p-7 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
              <Home className="w-6 h-6 text-brand-orange-light" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-orange-light">
                During a booking
              </p>
              <h3 className="text-xl font-display font-bold text-white leading-tight">
                The guest gap
              </h3>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed text-[15px] mb-5">
            A pool with six guests in it on a 90° afternoon burns through
            sanitizer in a way an empty pool never does. Sunscreen, sweat, and
            warm Gulf air on top of normal bather load can drop free chlorine
            to <span className="text-white">unsafe levels in a single day</span>{' '}
            — even if the pool looked perfect at check-in.
          </p>
          <p className="text-gray-300 leading-relaxed text-[15px] mb-6">
            We dose for the load your pool actually carries — not the load of a
            quiet residence — and we leave a chlorine buffer with every weekly
            visit. The water you serve to a guest is genuinely safe to swim in,
            not just clear-looking.
          </p>

          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
              The "looks fine, isn't" risk
            </p>
            <ul className="grid grid-cols-1 gap-y-1.5 text-sm text-gray-300">
              <li>Hot-tub rash bacteria (Pseudomonas)</li>
              <li>Recreational water illness exposure</li>
              <li>Negative reviews tied to "the pool"</li>
              <li>Refund requests after the stay</li>
            </ul>
          </div>
        </m.div>

        {/* Failure 2 — the vacant-house gap */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="glass-panel rounded-2xl p-7 md:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
              <EyeOff className="w-6 h-6 text-brand-blue-light" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue-light">
                Between bookings
              </p>
              <h3 className="text-xl font-display font-bold text-white leading-tight">
                The vacant-house gap
              </h3>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed text-[15px] mb-5">
            The other failure mode is the opposite: a pool quietly drifts while
            no one's watching. A salt cell crusts up. A pump seal weeps. Stabilizer
            climbs out of range and chlorine stops working. By the time your next
            guest arrives — or you fly down for a long weekend — you're looking
            at a <span className="text-white">$1,800 recovery instead of a $180 month</span>.
          </p>
          <p className="text-gray-300 leading-relaxed text-[15px] mb-6">
            Weekly visits mean nothing drifts for more than seven days. We catch
            the small thing before it turns into a guest-facing problem or a
            cross-country phone call to a contractor.
          </p>

          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
              What we catch early so you don't pay later
            </p>
            <ul className="grid grid-cols-1 gap-y-1.5 text-sm text-gray-300">
              <li>Salt cell scaling &amp; voltage drop</li>
              <li>Pump bearing &amp; seal wear</li>
              <li>Stabilizer (CYA) creep</li>
              <li>Filter pressure trending up</li>
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
        <FlaskConical className="w-5 h-5 text-brand-orange-light shrink-0" />
        <p className="text-gray-400 text-[15px]">
          One technician, one weekly visit —
          <span className="text-white"> closing both gaps before they cost you.</span>
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
          How Weekly Service Runs
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          You don't manage it. We do.
        </h2>
        <p className="section-subtext">
          The whole point of weekly service is that it's one less thing in your inbox.
          Here's how it runs in the background.
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

// "Why most pool companies let rental owners down" — same comparison shape
// as Belleair's WhyUs, but every pair is retuned to absentee-owner pain.
const WHY_US_PAIRS: Array<{
  failure: string;
  failureDetail: string;
  us: string;
  usDetail: string;
}> = [
  {
    failure: "You don't know if anyone came",
    failureDetail:
      "No report, no photo, no proof. You're 1,200 miles away and finding out from a guest's review whether the pool was actually serviced this week.",
    us: 'Documented report in your inbox every visit',
    usDetail:
      "A timestamped service report with photos and chemistry readings lands in your email after every clean. Forward it to your guest, your manager, or just keep the paper trail.",
  },
  {
    failure: 'A rotating crew that doesn\'t know your property',
    failureDetail:
      "Different person every week. They don't know the gate code, the cleaner's schedule, or that the salt cell needs to be checked closely. Things get missed.",
    us: 'The same dedicated technician every week',
    usDetail:
      'Background-checked. Assigned to your property. Knows your access, your equipment, and the cleaner you work with. Consistency is the entire job.',
  },
  {
    failure: 'Surcharges that show up at month-end',
    failureDetail:
      '"High demand this month" fees. "Extra acid" charges. "Storm cleanup" lines you can\'t verify because you weren\'t there. The bill drifts up; the explanation never lands.',
    us: 'One flat monthly rate, all standard chemicals',
    usDetail:
      "Standard weekly chemicals are included in the rate you were quoted. Anything beyond that — major recovery, parts, storm response — is quoted and approved before any work happens.",
  },
  {
    failure: "Missed visits that surface during a booking",
    failureDetail:
      "The pool got skipped two weeks ago. You only find out when a guest texts you a green-pool photo on day one of their stay — and now you're scrambling on vacation.",
    us: 'GPS-verified weekly visits + a real person to text',
    usDetail:
      "Every visit is GPS-confirmed at the property. If something's off, we tell you the day it happens — not after the next guest is already in the house.",
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
          What Goes Wrong with Most Services
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Four ways rental owners get burned.
        </h2>
        <p className="section-subtext">
          If you've owned a Treasure Island rental for more than a year, you've
          probably hit at least one of these. Here's why they happen — and how
          our service is built to make them impossible.
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
        The common thread is the same: a service built around{' '}
        <span className="text-white">someone being on the property</span>{' '}
        — when most Treasure Island owners aren't.
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
          Guest-ready. Protected. Off your plate.
        </h2>
        <p className="section-subtext max-w-2xl mx-auto mb-8">
          One dedicated technician, full chemistry balance, and a photo-verified
          report after every visit — for one flat monthly rate, no contracts,
          no surprise chemical bills.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-300">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-orange-light" /> Always Blue Guarantee
          </span>
          <span className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-orange-light" /> Photo report every visit
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
            Treasure Island Pool Service
          </span>
          <h2 className="section-heading text-white">Questions, answered.</h2>
        </m.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `ti-faq-panel-${index}`;
            const buttonId = `ti-faq-button-${index}`;
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

const TreasureIslandBelowFold = () => (
  <>
    <AbsenteeCareSection />
    <InterludeBand />
    <RentalFailurePillars />
    <ProcessSection />
    <WhyUsSection />
    <PromiseStrip />
    <FaqSection />
  </>
);

export default TreasureIslandBelowFold;
