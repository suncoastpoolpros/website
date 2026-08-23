import React, { useState } from 'react';
import { m } from 'motion/react';
import {
  Wind,
  Sprout,
  ShieldOff,
  CloudRain,
  Ban,
  Zap,
  AlertTriangle,
  Droplets,
  Filter,
  TestTube,
  Brush,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
  CalendarClock,
  Waves,
  Wrench,
  Plus,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { SmartLink } from '@/components/SmartLink';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { ServiceAreaStrip } from '@/components/ServiceAreaStrip';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta, FONTS, NAV_FONTS } from '@/lib/usePageMeta';
import { serviceSchema } from '@/lib/businessSchema';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

const CANONICAL = '/services/storm-cleanup/';

// ── What the cleanup actually covers ───────────────────────────────
const CLEANUP_STEPS: Array<{ icon: typeof Wind; title: string; body: string }> = [
  {
    icon: Brush,
    title: 'Debris out before the pump goes back on',
    body:
      'Order matters here. Branches and mulch get netted out before anything is switched on, because running the pump with that in the water is how you pack the suction lines and turn a cleanup into a repair. Skimmer throats and pump basket get cleared at the same time.',
  },
  {
    icon: Filter,
    title: 'Vacuumed to waste, filter cleaned properly',
    body:
      "A storm load will blind a filter in a single cycle, so the heavy silt goes out to waste rather than through it. The filter itself then gets backwashed or pulled and cleaned, not just glanced at — otherwise the recovery is running through something that cannot pass water.",
  },
  {
    icon: TestTube,
    title: 'Rebalanced from where it actually is',
    body:
      "Heavy rain dilutes chlorine, stabilizer, and alkalinity all at once, so the water isn't just low on sanitizer — the whole panel has moved. We test the full set and rebuild it from the real numbers.",
  },
  {
    icon: CloudRain,
    title: 'A check for what the runoff brought',
    body:
      'Storm water carries lawn fertilizer, soil, and street runoff into the pool. That loads it with phosphates and nitrates — algae food that keeps the pool turning even after the chlorine is back up.',
  },
  {
    icon: Wrench,
    title: 'Eyes on the equipment pad',
    body:
      "Before anything gets switched back on: how high the water came, whether the motor got wet, and whether the pad drained. A motor that sat in water can often be dried and cleaned professionally — but silt inside one that gets energised first will seize it, and then it is a replacement.",
  },
  {
    icon: CalendarClock,
    title: 'A return visit, because one pass is not enough',
    body:
      "Chlorine crashes again as the debris load keeps breaking down. We come back and hold the numbers until they stay put, rather than declaring it done while it's still climbing back.",
  },
];

const STORM_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'Is it safe to swim after a storm?',
    answer:
      "Not until it has been tested, and usually not for a few days. Storm runoff carries sewage-associated bacteria into the pool at the same time the rain has diluted your chlorine to nothing, so the water can be genuinely unsafe while looking completely normal. Clear is not the same as sanitized. Nobody should be getting in until the numbers are back in a safe band and holding there.",
  },
  {
    question: 'My pool looks fine. Do I still need it cleaned?',
    answer:
      "Probably, and this is the one that catches people. Debris settles out and the water goes clear on its own, which makes it look finished — while there is still no measurable sanitizer in it. The visible mess is the easy part. What actually needs doing is rebuilding the chemistry and holding it long enough to be confident the water is safe again.",
  },
  {
    question: 'How quickly can you get out after a storm?',
    answer:
      "It depends on how wide the damage is. After a major storm we are triaging a whole route, and existing weekly customers come first. Call or text as early as you can — even before the power is back — and we will give you a real position in the queue rather than a promise we cannot keep. Getting on the list costs nothing and it decides how big the job is by the time we arrive.",
  },
  {
    question: 'How long until my pool is usable again?',
    answer:
      "Most storm pools take two visits. The first clears the debris and rebuilds the chemistry; the second, a few days later, confirms the numbers held and finishes the polish. We manage that because we vacuum sand straight to waste and use filtered vacuums for the sludge, rather than pushing everything through your filter and coming back every time it blinds. A pool that sat untouched for a week or more, or one that took genuine flooding, takes longer — and we will say so once we have seen it.",
  },
  {
    question: 'My pool overflowed. Is that a problem?',
    answer:
      "It needs bringing back down, yes. Above the skimmer mouth the skimmers stop working entirely, so nothing is being pulled off the surface. What matters more is what people do about it: this is the moment homeowners decide to empty the pool out, on the one day of the year the ground is most saturated — which is exactly when a shell is most likely to lift. We bring the level down to the tile line as part of the visit.",
  },
  {
    question: 'Does my pool need to be drained and acid washed after a storm?',
    answer:
      "Usually not, and be careful with anyone who leads with that. Draining a pool in saturated Florida ground carries real risk, and we run vacuums with integrated filtration — the debris and sludge come out of the pool without the water going with them. Most post-storm pools, even genuinely awful-looking ones, come back with cleaning and chemistry. A full drain is a last resort, not a starting point.",
  },
  {
    question: 'My pump was underwater. Can it be saved?',
    answer:
      "Often, yes — but not by switching it on to find out. A motor that sat in floodwater can usually be dried and cleaned professionally. What kills it is energising it with silt still inside, which seizes the bearings and turns a service call into a replacement. Leave the breaker off until someone has actually looked at it.",
  },
  {
    question: 'What does storm cleanup cost?',
    answer:
      "It is a flat quote given up front from photos, not an hourly meter. The number moves with how much debris is in the pool, how long it has been sitting, and what shape the equipment is in. Storm work is the easiest place in this industry to run a meter on someone who has just had a rough week, and we would rather you knew the price before anyone turns up.",
  },
  {
    question: 'Will my insurance cover the cleanup?',
    answer:
      "It varies a lot by policy, so it is worth a call to your carrier before you assume either way. Structural damage and equipment are treated differently from debris removal and water chemistry, and deductibles on named storms often work differently from the rest of the policy. Keep photos from before and after — they help whichever way it goes.",
  },
];

const STORM_SCHEMA = [
  serviceSchema({
    serviceType: 'Storm & Hurricane Pool Cleanup',
    description:
      'Storm and hurricane pool cleanup across St. Petersburg and Pinellas County, FL — debris removal, filter cleaning, full chemical rebalance after rainwater dilution, phosphate and nitrate check from storm runoff, and an equipment-pad inspection before anything is switched back on.',
    url: CANONICAL,
  }),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: STORM_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  },
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services/' },
    { name: 'Storm Cleanup', path: CANONICAL },
  ]),
];

const StormCleanupPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    // Carries both "hurricane" (urgent) and "storm" (broader) — the old title
    // had only the first.
    title: 'Hurricane & Storm Pool Cleanup — St. Petersburg, FL',
    description:
      'Hurricane and storm pool cleanup across St. Petersburg & Pinellas. Storm runoff leaves pools genuinely unsafe, not just dirty — debris out, chemistry rebuilt, flat quote.',
    canonicalPath: CANONICAL,
    // No hero photo on this page, so no heroPreload — the head stays lean and
    // the H1 paints as soon as the fonts land. Montserrat 900 is the display
    // weight above the fold; Inter 400 carries the lede.
    fontPreload: [...NAV_FONTS, FONTS.inter400, FONTS.montserrat900],
    jsonLd: STORM_SCHEMA,
  });

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />

      {/* Ambient wash behind the hero — blue only, matching the homepage. */}
      <div className="absolute top-0 inset-x-0 h-[520px] pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[520px] rounded-full bg-brand-blue/20 blur-[140px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5">
            <Wind className="w-3.5 h-3.5 text-brand-blue-light" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">
              Storm &amp; Hurricane Service
            </span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Storm and hurricane pool cleanup, across Pinellas.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            Storm runoff leaves a pool unsafe, not just ugly — and the rain washed out the
            chlorine that would normally handle it. We clear it, rebuild the chemistry, and
            tell you in writing when it is safe again. <span className="text-white">Most pools
            are done in two visits.</span> St.&nbsp;Petersburg, Clearwater, Largo, Palm Harbor
            and the rest of Pinellas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#quote" onClick={handleQuoteClick} className="btn btn-orange w-full sm:w-auto">
              <MessageSquare className="w-[18px] h-[18px]" />
              Get a Cleanup Quote
            </a>
            <a href={PHONE_HREF} className="btn btn-glass w-full sm:w-auto">
              <Phone className="w-[18px] h-[18px]" />
              {PHONE_DISPLAY}
            </a>
          </div>
        </section>

        <ServiceAreaStrip intro="A named storm does not stop at a city line, and neither do we. Post-storm cleanup runs across Pinellas County and into South Tampa." />

        {/* ── THE LIGHT BAND — why it is a health job ───────────── */}
        {/* The page's one polarity flip, and it earns the position: this is the
            argument that turns "I'll get to it" into a booking. Grounded in CDC
            guidance on floodwater and on tropical-storm-associated waterborne
            illness — claims stay at "what floodwater carries" and "your
            disinfectant is gone", which is what the sources support. No
            diagnosing, no scare statistics. */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Why It Is Not Just Dirty
              </span>
              <h2 className="section-heading text-[#0a1628] leading-tight mb-4">
                A storm pool is a health problem before it is a cleaning one.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Two things happen at once in a hurricane, and it is the combination that
                matters: contaminated water gets into the pool at the exact moment its
                disinfectant is wiped out.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto mb-6">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-white border border-brand-blue/15 shadow-[0_10px_30px_-18px_rgba(10,22,40,0.45)] p-6 sm:p-7"
              >
                <span className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4">
                  <Droplets className="w-5 h-5 text-brand-blue" />
                </span>
                <h3 className="text-[#0a1628] font-display font-bold text-lg mb-3 leading-snug">
                  What the water brought in
                </h3>
                <p className="text-slate-600 text-[15px] leading-relaxed mb-3">
                  Floodwater and heavy runoff carry sewage-associated bacteria, viruses and
                  protozoa. The CDC lists illness from contaminated floodwater ranging from
                  stomach upset through to dysentery and infectious hepatitis, and names
                  E.&nbsp;coli and Enterococci among the organisms routinely found in it.
                </p>
                <p className="text-slate-600 text-[15px] leading-relaxed">
                  In Pinellas that water has usually crossed septic drainfields, storm drains,
                  lawns and street runoff on its way into your backyard. A screen enclosure
                  does not filter any of it.
                </p>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 }}
                className="rounded-2xl bg-white border border-brand-blue/15 shadow-[0_10px_30px_-18px_rgba(10,22,40,0.45)] p-6 sm:p-7"
              >
                <span className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4">
                  <ShieldOff className="w-5 h-5 text-brand-blue" />
                </span>
                <h3 className="text-[#0a1628] font-display font-bold text-lg mb-3 leading-snug">
                  And the defence that was gone
                </h3>
                <p className="text-slate-600 text-[15px] leading-relaxed mb-3">
                  A pool is safe because its disinfectant is held in a working range. Inches of
                  rain dilute chlorine and stabilizer together, the pump has been off for days,
                  and the debris load consumes whatever is left. By the time the water is still
                  again there is often no measurable sanitizer at all.
                </p>
                <p className="text-slate-600 text-[15px] leading-relaxed">
                  The CDC is explicit that it is <em>properly maintained</em> disinfectant that
                  makes treated water low-risk. After a storm, that is precisely the thing your
                  pool no longer has.
                </p>
              </m.div>
            </div>

            {/* The timing fact, which is the part people get wrong */}
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-5xl mx-auto rounded-2xl bg-white border border-brand-blue/15 shadow-[0_10px_30px_-18px_rgba(10,22,40,0.45)] p-6 sm:p-7 mb-6"
            >
              <div className="flex items-start gap-4">
                <span className="w-11 h-11 shrink-0 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5 text-brand-blue" />
                </span>
                <div>
                  <h3 className="text-[#0a1628] font-display font-bold text-lg mb-2 leading-snug">
                    It gets less safe over the following week, not more
                  </h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed">
                    Research on storm-affected water systems found E.&nbsp;coli loads climbing
                    within 12 to 24 hours of a storm starting — and <em>Legionella</em> rising
                    four to five days later. That second window is the one people miss: the
                    water has stopped looking dramatic, the panic has passed, and everyone has
                    moved on to the roof. It is also when the pool is at its worst.
                  </p>
                </div>
              </div>
            </m.div>

            {/* The clear-water trap */}
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-5xl mx-auto rounded-2xl border border-brand-orange/30 bg-brand-orange/[0.07] p-6 sm:p-7"
            >
              <div className="flex items-start gap-4">
                <span className="w-11 h-11 shrink-0 rounded-xl bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#c85400]" />
                </span>
                <div>
                  <h3 className="text-[#0a1628] font-display font-bold text-lg mb-2 leading-snug">
                    Clear water is not the same as safe water
                  </h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed">
                    This is the trap. Debris settles, the water goes clear again, and it looks
                    finished — with no sanitizer in it whatsoever. You cannot see bacteria, and
                    a pool that looks swimmable four days after a hurricane is exactly the one
                    nobody should be getting into. The only way to know is to test it, and the
                    only way to fix it is to rebuild the chemistry properly and hold it there.
                  </p>
                </div>
              </div>
            </m.div>

            <p className="text-center text-slate-500 text-sm max-w-2xl mx-auto mt-8">
              Nobody swims until the numbers are back in a safe band — and we will tell you
              when that is, in writing, rather than when it merely looks clear.
            </p>
          </Container>
        </section>

        {/* ── The water is too high ─────────────────────────────── */}
        {/* "My pool overflowed" is a real post-storm search and the page had
            nothing for it. It is also where people talk themselves into
            draining — the pool is disgusting AND too full, right when the
            ground is at its most saturated. */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <div className="absolute top-1/4 -left-24 w-[420px] h-[420px] rounded-full bg-brand-blue/[0.06] blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-12 items-start">
              <div className="lg:pt-2">
                <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  If It Overflowed
                </span>
                <h2 className="section-heading text-white leading-[1.1] mb-4">
                  Too full is a real problem — and still not a reason to drain it.
                </h2>
                <p className="section-subtext mb-6">
                  A foot of rain puts the water over the skimmer mouth, which means the skimmers
                  stop skimming and the surface debris just sits there. Worth fixing quickly. But
                  this is also the moment people decide to empty the pool out and start again,
                  and it is the worst possible moment to do it.
                </p>
                <div className="rounded-2xl border border-brand-orange/25 bg-brand-orange/[0.05] p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-brand-orange-light shrink-0 mt-0.5" />
                    <p className="text-white font-semibold text-[15px] leading-relaxed">
                      The ground is more saturated the day after a storm than at any other point
                      in the year. Taking the water out then is exactly when a shell is most
                      likely to lift.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative glass-panel rounded-3xl p-6 sm:p-8 overflow-hidden">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-4">
                  How we bring it back down
                </p>
                <ul className="flex flex-col gap-4">
                  {[
                    'We take it to halfway up the skimmer opening — the middle of the waterline tile. Not lower, and never to empty.',
                    'It comes down in stages, off the equipment or with our own pump depending on what the pad looks like.',
                    'While the level is still high the skimmers are doing nothing, so the surface gets cleared by hand on the same visit.',
                    'The equipment pad gets checked before anything is run, so we are not pushing water through a motor that sat in a flood.',
                    'You get the numbers and photos afterwards, the same as any other visit.',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-blue-light shrink-0 mt-0.5" />
                      <span className="text-[15px] text-gray-300 leading-snug">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Photo interlude ───────────────────────────────────── */}
        {/* The one light band is spoken for, and a second would break the
            site's one-per-page rule. This is the OTHER device the city pages
            already use for exactly this problem: a full-bleed photo that
            interrupts a long dark run without going light. Reuses the existing
            our own filtered vacuum working through storm silt. It was standing
            in with the Pinellas beach photo, which read as holiday rather than
            aftermath. A real job photo also does work no stock image can: it
            shows the equipment the page keeps claiming we use. */}
        <section className="relative h-[38vh] min-h-[320px] md:h-[44vh] md:min-h-[400px] overflow-hidden">
          <div className="interlude-bg-stormvac-desktop absolute inset-0 hidden md:block bg-cover bg-center" aria-hidden />
          <div className="interlude-bg-stormvac-mobile absolute inset-0 md:hidden bg-cover bg-center" aria-hidden />
          <div className="interlude-tint-stormvac absolute inset-0 pointer-events-none" aria-hidden />

          {/* Hard cut into the photo at the top — the fade made it look like
              the image was struggling to load rather than like a deliberate
              band. Hard cut at the bottom too — a soft edge there against a
              hard one above read as unintentional. Text legibility comes from
              the local scrim, not from fading the band's edges. */}
          <div className="interlude-scrim-stormvac absolute inset-0 pointer-events-none" aria-hidden />

          {/* Copy sits RIGHT of centre on desktop. Centred, it landed straight
              on the vacuum head — burying the one thing the photo is here to
              show. The right side of the frame is open silt, which takes text
              cleanly. Mobile's crop puts the head mid-frame, so there the copy
              drops to the open silt below it instead. */}
          <div className="relative h-full flex items-end pb-10 justify-center md:items-center md:pb-0 md:justify-end md:pr-[7%]">
            <m.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="text-shadow-interlude font-display italic text-white/90 text-2xl sm:text-3xl md:text-[2.1rem] leading-snug text-center md:text-right px-6 max-w-2xl md:max-w-[26rem] tracking-tight"
            >
              The storm is the easy part to see. What it left behind is not.
            </m.p>
          </div>
        </section>

        {/* ── Equipment: the actual differentiator ──────────────── */}
        {/* Sits straight after the interlude on purpose — the photo shows the
            vacuum, this explains why there are two of them. Most competitors
            run storm debris through the customer's own filter because it is the
            only method they have, which is what turns a two-visit job into a
            fortnight or a drain quote. */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
          <div className="absolute top-0 right-1/4 w-[50%] h-[40%] bg-brand-blue/[0.06] rounded-full blur-[150px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="max-w-2xl mb-10 md:mb-12">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Why We Are Faster
              </span>
              <h2 className="section-heading text-white leading-[1.1] mb-4">
                Two vacuums, because storm debris is not one thing.
              </h2>
              <p className="section-subtext">
                Sand behaves nothing like leaf litter, and a pool full of both needs a
                different answer than either alone. Most services own one method and make
                every pool fit it. We pick the tool for what is actually on your floor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-6">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative glass-panel rounded-2xl p-7 md:p-8"
              >
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
                    <Waves className="w-6 h-6 text-brand-blue-light" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue-light">
                      For sand and heavy silt
                    </p>
                    <h3 className="text-xl font-display font-bold text-white leading-tight">
                      Vacuumed straight to waste
                    </h3>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed text-[15px] mb-4">
                  Storm surge and runoff drop fine sand and grit that will pack a filter solid
                  in a single pass. This one sends it out of the pool entirely, bypassing your
                  filter rather than loading it — so the heavy material is gone in one go
                  instead of being pushed through equipment that then has to be stripped.
                </p>
                <p className="text-gray-400 leading-relaxed text-[15px]">
                  It costs some water, which we top back up. That is a fair trade when the
                  alternative is a blinded filter and three more visits.
                </p>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 }}
                className="relative glass-panel rounded-2xl p-7 md:p-8"
              >
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                    <Filter className="w-6 h-6 text-white" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      For leaf litter and sludge
                    </p>
                    <h3 className="text-xl font-display font-bold text-white leading-tight">
                      Filtered on board, water stays
                    </h3>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed text-[15px] mb-4">
                  Our other vacuums carry their own filtration. The debris comes out and the
                  water goes back in, so the level does not drop — which matters when the
                  ground is already saturated and taking a pool down is the last thing anyone
                  should be doing.
                </p>
                <p className="text-gray-400 leading-relaxed text-[15px]">
                  This is the one that clears pools other companies look at and quote a full
                  drain and acid wash on.
                </p>
              </m.div>
            </div>

            {/* The payoff */}
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-2xl border border-brand-orange/25 bg-brand-orange/[0.05] p-6 md:p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center">
                <div className="text-center md:text-left md:border-r md:border-white/10 md:pr-8">
                  <span className="font-display font-black text-white text-5xl md:text-6xl leading-none block">
                    2
                  </span>
                  <span className="text-brand-orange-light font-semibold text-sm uppercase tracking-[0.16em]">
                    visits, typically
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg mb-2 leading-snug">
                    That is what having both gets you.
                  </h3>
                  <p className="text-gray-300 text-[15px] leading-relaxed">
                    Most storm pools are done in two: the first clears the debris and rebuilds
                    the chemistry, the second confirms the numbers held and finishes the
                    polish. A service running everything through your filter cannot do that —
                    they are back a third and fourth time because the filter keeps blinding,
                    or they are quoting you a drain. Genuinely destroyed pools take longer, and
                    we will say so when we have seen it.
                  </p>
                </div>
              </div>
            </m.div>
          </Container>
        </section>

        {/* ── What the cleanup covers ───────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -right-28 w-[460px] h-[460px] rounded-full bg-brand-blue/[0.05] blur-[150px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="max-w-2xl mb-10 md:mb-12">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                What We Actually Do
              </span>
              <h2 className="section-heading text-white leading-[1.1] mb-4">
                Storm cleanup, start to finish.
              </h2>
              <p className="section-subtext">
                Same sequence every time, whether it was a squall line that dropped half a
                tree in the pool or a named storm that took the power out for a week.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {CLEANUP_STEPS.map((step, i) => (
                <m.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 2) * 0.06 }}
                  className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 md:p-7 flex gap-5 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)]"
                >
                  <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-brand-blue-light" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-white mb-2 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-[15px]">{step.body}</p>
                  </div>
                </m.div>
              ))}
            </div>

            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 flex items-start sm:items-center justify-center gap-3 text-center max-w-2xl mx-auto"
            >
              <ClipboardCheck className="w-5 h-5 text-brand-blue-light shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-gray-400 text-[15px] text-left sm:text-center">
                Every visit is written up the same way as our weekly service —
                <span className="text-white"> chemistry numbers, what got done, and photos in your inbox.</span>
              </p>
            </m.div>
          </Container>
        </section>

        {/* ── The clock is on you, not us ───────────────────────── */}
        {/* This was a "what you can do while the power is out" checklist. It
            coached the customer through holding the pool themselves, on the
            one page whose entire job is to get the work booked. Replaced with
            the reason waiting costs them. */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <Container className="relative z-10">
            <div className="max-w-2xl mb-10 md:mb-12">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Why It Gets Worse
              </span>
              <h2 className="section-heading text-white leading-[1.1] mb-4">
                Every day it sits is a longer job.
              </h2>
              <p className="section-subtext">
                A storm pool does not hold steady while you wait for a call back. It moves in
                one direction, and each stage costs more to reverse than the one before it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {[
                {
                  icon: CalendarClock,
                  t: 'First 48 hours',
                  b: 'Debris is loose on the surface and the chemistry is only diluted. This is the cheapest the job will ever be, and usually a single visit.',
                },
                {
                  icon: Sprout,
                  t: 'Days three to five',
                  b: 'Organics have settled and started breaking down, the algae has taken hold, and what was a cleanup becomes a recovery with several visits.',
                },
                {
                  icon: AlertTriangle,
                  t: 'Past a week',
                  b: 'Sludge on the floor, stained plaster, and a filter that will need pulling apart. Standing water is also breeding mosquitoes by this point.',
                },
              ].map((item) => (
                <m.div
                  key={item.t}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)]"
                >
                  <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-brand-blue-light" />
                  </span>
                  <h3 className="font-display font-bold text-white text-base mb-2 leading-snug">
                    {item.t}
                  </h3>
                  <p className="text-gray-400 text-[15px] leading-relaxed">{item.b}</p>
                </m.div>
              ))}
            </div>

            <m.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 text-center text-gray-400 text-[15px] max-w-2xl mx-auto"
            >
              Call or text as early as you can —
              <span className="text-white"> even before the power is back and before we can get to you.</span>{' '}
              Getting in the queue costs nothing and it is what decides which of those three
              columns your pool is in when we arrive.
            </m.p>
          </Container>
        </section>

        {/* ── Response & pricing ────────────────────────────────── */}
        {/* #02050a — the footer's tier, the only surface on the site darker
            than the page base. Used here so the commercial moment reads as a
            distinct block. Going DOWN a step separates it without competing
            with the light band for attention. */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-[#02050a]">
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[80%] h-[100%] bg-brand-blue/[0.07] rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="section-heading text-white leading-tight mb-4">
                Quoted from photos. Not by the hour.
              </h2>
              <p className="section-subtext max-w-2xl mx-auto mb-8">
                Text us a few pictures of the pool and we will come back with a flat number
                for the cleanup — before anyone turns up. Storm work is the easiest place in
                this industry to run a meter, and we would rather you knew the price up front.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-300 mb-8">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-blue-light" /> Weekly customers first
                </span>
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-brand-blue-light" /> Honest queue position
                </span>
                <span className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-brand-blue-light" /> Photo report every visit
                </span>
              </div>
              {/* The close lives here now, with the price. It used to sit in
                  its own card below the FAQ, which put the ask a full section
                  away from the reason to say yes. */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <a href="#quote" onClick={handleQuoteClick} className="btn btn-orange w-full sm:w-auto">
                  <MessageSquare className="w-[18px] h-[18px]" />
                  Get a Cleanup Quote
                </a>
                <a href={PHONE_HREF} className="btn btn-glass w-full sm:w-auto">
                  <Phone className="w-[18px] h-[18px]" />
                  {PHONE_DISPLAY}
                </a>
              </div>
              <p className="text-gray-400 text-[15px] max-w-xl mx-auto mb-8">
                Send photos now and you get a flat number and a real position in the queue —
                even if the power is still out.
              </p>

              <p className="text-[13px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Serving pools across Pinellas County — St.&nbsp;Petersburg,{' '}
                <SmartLink to="/st-pete-beach-fl/" className="text-gray-400 hover:text-white transition-colors">
                  St.&nbsp;Pete Beach
                </SmartLink>
                ,{' '}
                <SmartLink to="/treasure-island-fl/" className="text-gray-400 hover:text-white transition-colors">
                  Treasure Island
                </SmartLink>
                ,{' '}
                <SmartLink to="/clearwater-fl/" className="text-gray-400 hover:text-white transition-colors">
                  Clearwater
                </SmartLink>
                , Largo, Seminole, and the barrier islands that take it worst.
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
                  Storm Questions
                </span>
                <h2 className="section-heading text-white mb-3">Asked every hurricane season.</h2>
                <p className="text-gray-400">
                  The ones that come up every June through November.{' '}
                  <SmartLink to="/faq/" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </SmartLink>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {STORM_FAQ.map((faq) => {
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

              <p className="text-center text-gray-500 text-sm mt-8 max-w-lg mx-auto leading-relaxed">
                Storms are the reason a lot of people stop doing this themselves. If you want it
                handled year-round instead,{' '}
                <SmartLink
                  to="/how-it-works/"
                  className="text-brand-orange hover:text-brand-orange-dark font-semibold"
                >
                  here&rsquo;s how weekly service works
                </SmartLink>
                .
              </p>
            </div>
          </Container>
        </section>

        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};

export const StormCleanupPage = () => (
  <QuoteSheetProvider>
    <StormCleanupPageInner />
  </QuoteSheetProvider>
);
