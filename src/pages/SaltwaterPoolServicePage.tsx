import React, { useState } from 'react';
import { m } from 'motion/react';
import {
  Droplets,
  Zap,
  Gauge,
  TestTube,
  Sun,
  Leaf,
  CloudRain,
  Timer,
  Brush,
  FlaskConical,
  Wrench,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle2,
  ClipboardCheck,
  ArrowRight,
  Plus,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ServiceQuoteForm } from '@/components/ServiceQuoteForm';
import { Container } from '@/components/Container';
import { SmartLink } from '@/components/SmartLink';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { ServiceAreaStrip } from '@/components/ServiceAreaStrip';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta, FONTS, NAV_FONTS } from '@/lib/usePageMeta';
import { serviceSchema } from '@/lib/businessSchema';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

const CANONICAL = '/services/saltwater-pool-service/';

// ── What every visit covers on a salt pool ─────────────────────────
// The light band's content. Split three ways because a salt pool is three
// systems that fail independently — the water, the cell, and the generator
// driving it — and "we service salt pools" means nothing until each is named.
//
// Positioning rule (recurring-only): everything on this page is sold as part of
// the weekly plan. Generator repairs, cell replacements and conversions are
// real services, but only for pools already on the route — never a one-off
// call-out. Keep the copy that way.
const SYSTEMS: Array<{ icon: typeof Droplets; label: string; items: string[] }> = [
  {
    icon: Droplets,
    label: 'The water',
    items: [
      'Salinity tested every visit, and salt added when rain has diluted it — the salt is in the rate',
      'pH brought back down — salt cells push it up week after week',
      'Stabilizer held around 60–80 ppm, where a salt pool wants it',
      'Calcium watched, because it is what scales the cell',
    ],
  },
  {
    icon: Zap,
    label: 'The cell',
    items: [
      'Checked for scale on the plates at every visit',
      'Acid-washed when it needs it, typically quarterly — included on every plan',
      'Never cleaned on a timer for the sake of it; acid wears the coating that makes the chlorine',
    ],
  },
  {
    icon: Gauge,
    label: 'The generator',
    items: [
      'Output set for the season, not left where the installer put it',
      'Warning lights read and traced to the actual cause',
      'Pump schedule checked, since the cell only makes chlorine while water is moving',
    ],
  },
];

// ── Why salt pools still grow algae ────────────────────────────────
// The section the page was commissioned for. The myth that salt pools don't get
// algae is common, and every one of these is a way the cell quietly stops
// keeping up while the control panel still looks fine.
const ALGAE_CAUSES = [
  {
    icon: Zap,
    title: 'A scaled cell',
    body:
      'Calcium builds up on the plates and chlorine output drops, often with no warning light at all. The generator reports it is running at the percentage you set. It just is not making what that number used to mean.',
  },
  {
    icon: CloudRain,
    title: 'Salt diluted by the rain',
    body:
      'A Florida summer adds inches of fresh water and the overflow carries salt away. Below its range, most cells cut output or stop, which is exactly when the heat and the rain are feeding algae fastest.',
  },
  {
    icon: Timer,
    title: 'Not enough run time',
    body:
      'The cell only produces while water flows through it. A variable-speed pump turned down low, or a timer shortened to save power, can leave the pool under-chlorinated for half the day.',
  },
  {
    icon: TestTube,
    title: 'pH creeping up',
    body:
      'Salt pools drift upward on pH. As it climbs, the chlorine the cell makes loses much of its strength, so the pool has sanitizer in it that is barely doing anything.',
  },
  {
    icon: Sun,
    title: 'Stabilizer out of band',
    body:
      'Too little and the sun burns the chlorine off before noon. Too much and it is locked up, so no amount of cell output fixes it. Either way the pool looks sanitized on paper and is not.',
  },
  {
    icon: Leaf,
    title: 'Phosphates and nitrates',
    body:
      'Lawn runoff, fertilizer and storm water feed algae faster than a cell making a steady trickle of chlorine can kill it. A salt system is built to hold a clean pool clean, not to win that fight.',
  },
];

// ── Clearing algae in a salt pool ──────────────────────────────────
const CLEAR_STEPS = [
  {
    title: 'Shock with liquid chlorine',
    body:
      'Not "boost" mode. Even at full output a cell makes chlorine far too slowly to get ahead of a bloom, and running it flat-out for days wears it faster.',
  },
  {
    title: 'Brush every surface',
    body:
      'Algae on the walls and steps is sheltered from the water. Brushing exposes it to the chlorine. Mustard algae in particular hides in shaded corners and comes back if skipped.',
  },
  {
    title: 'Fix what let it in',
    body:
      'Clean the cell, restore the salt, correct pH and stabilizer, reset the run time. Clearing the water without this means it greens up again in a week.',
  },
  {
    title: 'Hand it back to the cell',
    body:
      'Once the chlorine holds on its own, the generator goes back to doing the daily work at an output that matches the season.',
  },
];

// ── The generator itself ───────────────────────────────────────────
const GENERATOR_WORK = [
  {
    icon: Wrench,
    title: 'Troubleshooting',
    body:
      '"Check salt", "no flow" and "inspect cell" lights, low output and readings that do not match the water. Most turn out to be a scaled cell, low salt, a flow problem or a sensor, and get fixed at the cause rather than reset.',
  },
  {
    icon: RefreshCw,
    title: 'Cell replacement',
    body:
      'Cells wear out — commonly after three to five years, sooner if they run hot or have been over-cleaned. We test it properly before calling it, and quote the replacement before anything is ordered.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Converting to salt',
    body:
      'Moving a chlorine pool over to a salt system: sized to the pool, installed, the water brought up to salinity and the output dialled in over the first few weeks.',
  },
];

const SALT_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'Do saltwater pools get algae?',
    answer:
      "Yes. A salt pool is still a chlorine pool — the cell just makes the chlorine instead of you pouring it in. When the cell falls behind, algae grows exactly as it would in any other pool. The usual reasons are a scaled cell, salt diluted by rain, pump run time that's too short, high pH, stabilizer out of range, or phosphates and nitrates from runoff.",
  },
  {
    question: 'Why is my salt pool green when the generator is running?',
    answer:
      "Because running is not the same as producing enough. A cell coated in calcium makes far less chlorine at the same setting, and a pump schedule that's too short leaves hours of the day with no chlorine being made at all. High pH can also leave the chlorine that is there too weak to work. Turning the output up rarely fixes it — the pool needs shocking with liquid chlorine and the underlying cause corrected.",
  },
  {
    question: 'How often should a salt cell be cleaned?',
    answer:
      "When it's scaled, not on a fixed schedule. On most Pinellas pools that works out to roughly every three months, more often if the water is hard or pH has been running high. Cleaning is a mild acid soak, and because acid wears the coating on the plates, cleaning a cell that doesn't need it shortens its life. We check it every visit and wash it when it needs it.",
  },
  {
    question: 'Is the salt and the cell cleaning included?',
    answer:
      "Yes, on every plan. The salt to top the pool up after rain and the cell acid washes are both part of the flat monthly rate, along with the rest of the standard chemistry. They're the items other companies most often bill on top, which is why we list them out.",
  },
  {
    question: 'What salt level should my pool be at?',
    answer:
      "It depends on the system, and the exact range is printed on the generator's label. Most residential systems want roughly 2,700 to 3,400 ppm, with about 3,200 as the target. Too low and the cell cuts back or stops; too high and some systems throw an error and the water starts to taste salty.",
  },
  {
    question: 'My generator says low salt, but I just added some. Why?',
    answer:
      "A reading from the generator is not a salt test. A scaled cell, a failing sensor or cold water can all make it report low salt when the water is actually fine — and adding more on the strength of that reading is how pools end up badly over-salted. Test the water itself before adding anything.",
  },
  {
    question: 'How long does a salt cell last?',
    answer:
      "Commonly three to five years, depending on how many hours it runs, how hot the water gets, and how it has been cleaned. Florida pools run their cells hard. Keeping salt and pH in range and not over-cleaning are the biggest things that stretch the life out.",
  },
  {
    question: 'Do you repair salt systems for people who are not customers?',
    answer:
      "No. Generator troubleshooting, cell replacements and salt conversions are things we do for pools on our weekly service, because we are there every week to see the system working and to keep it that way. If your salt system is giving you trouble, start weekly service and sorting it out is part of taking the pool on.",
  },
];

// JSON-LD in the PRERENDERED head via usePageMeta({ jsonLd }), like the other
// service pages — a useEffect would never run during renderToString.
const SALT_SCHEMA = [
  serviceSchema({
    serviceType: 'Saltwater Pool Service',
    description:
      'Weekly saltwater pool service across St. Petersburg and Pinellas County, FL — salinity testing and salt top-ups, salt cell inspection and acid cleaning, salt chlorine generator troubleshooting, and algae prevention, all in one flat monthly rate.',
    url: CANONICAL,
  }),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SALT_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  },
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services/' },
    { name: 'Saltwater Pool Service', path: CANONICAL },
  ]),
];

const SaltwaterPoolServicePageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'Saltwater Pool Service St. Petersburg, FL — Salt Cell Care',
    description:
      'Weekly saltwater pool service in St. Petersburg & Pinellas. Salt cell cleaning and salt included, generator checked every visit, algae kept out. One flat rate.',
    canonicalPath: CANONICAL,
    fontPreload: [...NAV_FONTS, FONTS.inter400, FONTS.montserrat900],
    jsonLd: SALT_SCHEMA,
  });

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />

      <div className="absolute top-0 inset-x-0 h-[520px] pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[520px] rounded-full bg-brand-blue/20 blur-[140px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5">
            <Droplets className="w-3.5 h-3.5 text-brand-blue-light" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">
              Saltwater Pool Service
            </span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Saltwater pool service in St.&nbsp;Petersburg, FL.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            Weekly service built around the salt system — the cell cleaned when it needs it, the
            salt topped up after the rain, and the generator checked every visit. All of it in
            one flat monthly rate, across St.&nbsp;Petersburg and Pinellas County.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#quote" onClick={handleQuoteClick} className="btn btn-orange w-full sm:w-auto">
              <MessageSquare className="w-[18px] h-[18px]" />
              Get a Salt Pool Quote
            </a>
            <a href={PHONE_HREF} className="btn btn-glass w-full sm:w-auto">
              <Phone className="w-[18px] h-[18px]" />
              {PHONE_DISPLAY}
            </a>
          </div>
        </section>

        <ServiceAreaStrip intro="Salt systems are everywhere on the Gulf side of the county, and the beaches run them hardest. These are the cities our weekly salt pool routes cover." />

        {/* ── THE LIGHT BAND — what each visit covers ───────────── */}
        {/* The page's one polarity flip. One navy-headed white card split into
            three columns (proposal-card DNA), not three separate cards — so it
            reads as ONE visit covering three systems, and so it doesn't repeat
            the green page's three-card light band. */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Every Visit
              </span>
              <h2 className="section-heading text-[#0a1628] leading-tight mb-4">
                A salt pool is three systems, and we look after all three.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Most services test the water and leave. On a salt pool the water is only a third
                of it — the cell and the generator decide whether that water stays clear.
              </p>
            </div>

            <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden bg-white border border-black/5 shadow-sm">
              <div className="bg-[#0a1628] px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-white font-display font-bold text-base sm:text-lg">
                  Weekly salt pool visit
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue-light">
                  All in the flat rate
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/[0.07]">
                {SYSTEMS.map((sys) => (
                  <div key={sys.label} className="p-6 sm:p-7">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-10 h-10 rounded-full border border-brand-blue/30 flex items-center justify-center">
                        <sys.icon className="w-[18px] h-[18px] text-brand-blue" />
                      </span>
                      <h3 className="text-[#0a1628] font-display font-bold text-lg">{sys.label}</h3>
                    </div>
                    <ul className="flex flex-col gap-3.5">
                      {sys.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-[18px] h-[18px] text-brand-blue shrink-0 mt-0.5" />
                          <span className="text-slate-600 text-[15px] leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-slate-500 text-sm max-w-xl mx-auto mt-10">
              Every visit ends with the same photo report as the rest of our service — salinity
              and the full chemistry panel included.
            </p>
          </Container>
        </section>

        {/* ── Algae in salt pools ───────────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
          <div className="absolute top-0 right-1/4 w-[50%] h-[40%] bg-brand-blue/[0.06] rounded-full blur-[150px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-14 items-start">
              <div>
                <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  Algae &amp; Salt Pools
                </span>
                <h2 className="section-heading text-white leading-[1.1] mb-4">
                  Salt pools get algae too. Here&rsquo;s why.
                </h2>
                <p className="section-subtext mb-6">
                  A salt system doesn&rsquo;t replace chlorine — it makes it, a little at a time,
                  all day. That steady trickle holds a clean pool clean. The moment anything
                  cuts into it, the pool has less protection than it looks like it has, and in
                  Florida heat algae needs only a few days.
                </p>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
                    The tell
                  </p>
                  <p className="text-white font-semibold text-[15px] leading-relaxed">
                    The generator panel says everything is fine and the walls feel slippery
                    anyway. The panel reports what it is set to, not what the water holds.
                  </p>
                </div>
              </div>

              <ol className="flex flex-col divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {ALGAE_CAUSES.map((cause, i) => (
                  <m.li
                    key={cause.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="py-6 flex gap-5"
                  >
                    <span className="shrink-0 font-display font-bold text-brand-orange text-sm tabular-nums pt-1 w-6">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="flex items-center gap-2.5 text-lg font-display font-bold text-white mb-2 leading-snug">
                        <cause.icon className="w-[18px] h-[18px] text-brand-blue-light shrink-0" />
                        {cause.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed text-[15px]">{cause.body}</p>
                    </div>
                  </m.li>
                ))}
              </ol>
            </div>
          </Container>
        </section>

        {/* ── Clearing it ───────────────────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -right-28 w-[460px] h-[460px] rounded-full bg-brand-blue/[0.05] blur-[150px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="max-w-2xl mb-10 md:mb-12">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Chemical Treatment
              </span>
              <h2 className="section-heading text-white leading-[1.1] mb-4">
                Clearing algae in a salt pool is not a job for the cell.
              </h2>
              <p className="section-subtext">
                The instinct is to turn the generator up to 100% and wait. It almost never
                works, and it is hard on the cell. This is the order that does.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {CLEAR_STEPS.map((step, i) => (
                <m.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)]"
                >
                  <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue-light mb-3">
                    Step {i + 1}
                  </p>
                  <h3 className="font-display font-bold text-white text-base mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-[15px] leading-relaxed">{step.body}</p>
                </m.div>
              ))}
            </div>

            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 md:p-7 flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <p className="text-gray-300 leading-relaxed text-[15px] flex-1">
                Already solid green, salt or not? That&rsquo;s a recovery before it&rsquo;s weekly
                service — honest timelines and a flat quote from photos.
              </p>
              <SmartLink
                to="/services/green-pool-recovery/"
                className="group inline-flex items-center gap-2 shrink-0 text-brand-blue-light font-semibold text-[15px] hover:text-white transition-colors"
              >
                Green pool recovery
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </SmartLink>
            </m.div>
          </Container>
        </section>

        {/* ── The generator ─────────────────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <Container className="relative z-10">
            <div className="max-w-2xl mb-10 md:mb-12">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Salt Generators
              </span>
              <h2 className="section-heading text-white leading-[1.1] mb-4">
                When the salt system itself needs work.
              </h2>
              <p className="section-subtext">
                For pools on our weekly service, the generator is ours to keep running — not a
                referral to someone else. Anything beyond routine care is quoted before it
                happens.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {GENERATOR_WORK.map((c) => (
                <m.div
                  key={c.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)]"
                >
                  <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5 text-brand-blue-light" />
                  </span>
                  <h3 className="font-display font-bold text-white text-base mb-2 leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-gray-400 text-[15px] leading-relaxed">{c.body}</p>
                </m.div>
              ))}
            </div>

            <p className="text-gray-500 text-sm mt-6">
              Generator work, cell replacements and conversions are for pools on our weekly
              plan. We don&rsquo;t take one-off repair calls.
            </p>
          </Container>
        </section>

        {/* ── Pricing ──────────────────────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[80%] h-[100%] bg-brand-blue/[0.07] rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="section-heading text-white leading-tight mb-4">
                One flat rate. The salt and the cell cleaning are in it.
              </h2>
              <p className="section-subtext max-w-2xl mx-auto mb-8">
                A salt pool costs the same to service with us as any other pool its size — most
                residential pools land around $150 a month. The salt and the cell acid washes are
                the two things other companies most often bill on top. Here they&rsquo;re part of
                the rate.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-300 mb-8">
                <span className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-brand-blue-light" /> Salt top-ups included
                </span>
                <span className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-brand-blue-light" /> Cell acid washes included
                </span>
                <span className="flex items-center gap-2">
                  <Brush className="w-4 h-4 text-brand-blue-light" /> Brushed, skimmed &amp; vacuumed weekly
                </span>
                <span className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-brand-blue-light" /> Photo report every visit
                </span>
              </div>
              <p className="text-[13px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Weighing up salt against chlorine first?{' '}
                <SmartLink
                  to="/pool-care/salt-water-vs-chlorine/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Salt water vs. chlorine, explained
                </SmartLink>
                . Stabilizer is the number behind most salt pool trouble —{' '}
                <SmartLink to="/pool-care/cyanuric-acid/" className="text-gray-400 hover:text-white transition-colors">
                  here&rsquo;s how it works
                </SmartLink>
                .
              </p>
            </m.div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section className="py-16 md:py-24 bg-[#07111c] relative">
          <Container>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10 md:mb-12">
                <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  Salt Pool Questions
                </span>
                <h2 className="section-heading text-white mb-3">What salt pool owners ask us.</h2>
                <p className="text-gray-400">
                  Including the ones you can fix yourself.{' '}
                  <SmartLink to="/faq/" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </SmartLink>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {SALT_FAQ.map((faq) => {
                  const isOpen = openFaq === faq.question;
                  return (
                    <div key={faq.question} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : faq.question)}
                        aria-expanded={isOpen}
                        className="w-full flex items-start justify-between gap-4 text-left px-5 sm:px-6 py-4"
                      >
                        <span className="font-display font-normal text-white text-[15px] sm:text-base leading-snug">
                          {faq.question}
                        </span>
                        <span
                          className={`shrink-0 mt-0.5 text-gray-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-45 text-brand-blue-light' : ''
                          }`}
                        >
                          <Plus className="w-5 h-5" />
                        </span>
                      </button>
                      <div className="faq-answer">
                        <div className="faq-answer-inner">
                          <p className="px-5 sm:px-6 pb-5 -mt-1 text-gray-400 leading-relaxed text-[15px]">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        {/* ── On-page quote form ────────────────────────────
            A real prerendered <form> (CLAUDE.md #13). Centered + orange: the
            green page is form-left/blue, storm is form-right/orange and the hub
            is centered/blue, so this is the one silhouette not yet used. The two
            qualifying questions tell us the system and its state before we
            reply, which is what the quote actually depends on. */}
        <ServiceQuoteForm
          layout="centered"
          accent="orange"
          eyebrow="Salt Pool Quote"
          heading="Put your salt pool on the route."
          intro={
            <>
              Tell us what system you have and what it&rsquo;s doing, and we&rsquo;ll come back
              the same day with your flat weekly rate — salt and cell care included.
            </>
          }
          points={[
            'Salt, cell acid washes and standard chemistry in one monthly price',
            'Generator checked every visit, not just when it throws a light',
            'No contract, and a photo report after every visit',
          ]}
          service={{ value: 'salt', label: 'Saltwater pool service' }}
          extraFields={[
            {
              id: 'saltSystem',
              label: 'What salt system do you have?',
              type: 'select',
              required: true,
              options: [
                { value: 'hayward', label: 'Hayward (AquaRite, TurboCell)' },
                { value: 'pentair', label: 'Pentair (IntelliChlor, iChlor)' },
                { value: 'jandy', label: 'Jandy (AquaPure, TruClear)' },
                { value: 'other', label: 'Another brand' },
                { value: 'unsure', label: 'Not sure' },
                { value: 'none-yet', label: 'None yet — thinking of converting' },
              ],
            },
            {
              id: 'saltSystemState',
              label: 'How is it doing right now?',
              type: 'select',
              required: true,
              options: [
                { value: 'fine', label: 'Working fine — I want it looked after' },
                { value: 'warning', label: 'Showing a warning light' },
                { value: 'cloudy-green', label: 'The water is cloudy or turning green' },
                { value: 'converting', label: 'Not salt yet — I want to convert' },
              ],
            },
          ]}
          source="saltwater-pool-service-quote-form"
          submitLabel="Get My Salt Pool Quote"
          successTitle="Got it — we will be in touch today."
          successBody="We will come back with your flat weekly rate, and if the system is giving you trouble, what we think is behind it."
          footnote={<>A photo of the generator panel helps — text it to {PHONE_DISPLAY} any time.</>}
        />

        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};

export const SaltwaterPoolServicePage = () => (
  <QuoteSheetProvider>
    <SaltwaterPoolServicePageInner />
  </QuoteSheetProvider>
);
