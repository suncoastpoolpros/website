import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import {
  Wind,
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

// ── Before the storm ───────────────────────────────────────────────
// The half of this subject almost no competitor page covers. It's also where
// the most expensive mistake lives, so the "don't drain it" card leads and is
// visually separated from the rest of the checklist.
const PREP_CARDS: Array<{
  icon: typeof Wind;
  title: string;
  body: string;
}> = [
  {
    icon: Droplets,
    title: 'Leave the water in it',
    body:
      "The water is what's holding your pool down. Days of rain saturate the ground around the shell, and the pressure of all that groundwater pushes up underneath it — a full pool has the weight to push back. Drain it first and you've removed the ballast at the exact moment you need it most.",
  },
  {
    icon: Zap,
    title: 'Kill the power at the breaker',
    body:
      "Shut the pump, heater, and salt system off at the panel — not just at the timer. It protects the equipment from the surge when power comes back, and it means nothing is energized if the pad ends up underwater. Leave it off until you've actually looked at the equipment afterward.",
  },
  {
    icon: TestTube,
    title: 'Shock it the day before',
    body:
      "Run the chlorine high before the weather arrives. You're building a buffer that has to survive several days with no pump, no filtration, and a lot of organic debris landing in the water. A pool that goes into a storm at the low end of normal is green on the other side.",
  },
  {
    icon: Ban,
    title: "Don't put the cover on",
    body:
      "A cover doesn't protect a pool in a hurricane — it collects branches and roof debris, then tears, sinks, or drags all of it across the finish. The water itself handles falling debris better than a cover does, and an uncovered pool is far easier to clean out after.",
  },
  {
    icon: Waves,
    title: 'Lower it a foot, at most',
    body:
      "If serious flooding is forecast and you want the extra freeboard, take it down about a foot — no further, and only if you have time to do it properly. Anything more starts trading a manageable overflow for the much bigger problem in the first card.",
  },
  {
    icon: Wind,
    title: 'Furniture: use your judgment',
    body:
      "The old advice was to throw everything in the pool. It does stop a chair going through a window — but it can also chip plaster and leave rust marks, and cushions turn into a soup that stains. If there's room in the garage, that's better. If there isn't, the pool beats the alternative.",
  },
];

// ── What the cleanup actually covers ───────────────────────────────
const CLEANUP_STEPS: Array<{ icon: typeof Wind; title: string; body: string }> = [
  {
    icon: Brush,
    title: 'Everything out of the water',
    body:
      'Surface debris, the layer sitting on the floor, and the material packed into the skimmer throats and pump basket — which is usually where the real blockage is hiding after a storm.',
  },
  {
    icon: Filter,
    title: 'The filter, cleaned properly',
    body:
      "A storm load will blind a filter in a single cycle. It gets backwashed or pulled and cleaned, not just glanced at — otherwise you're running the recovery through something that can't pass water.",
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
      "Before anything gets switched back on: how high the water came, whether the motor got wet, and whether the pad drained. A flooded pump motor that gets energized is a replacement, not a repair.",
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
    question: 'Should I drain my pool before a hurricane?',
    answer:
      "No — this is the single most common and most expensive storm mistake. The water in your pool is ballast holding the shell in the ground. Saturated soil around an empty or half-empty pool puts upward pressure on it, and that is how shells crack or lift. Leave the water in. If flooding is forecast and you want extra room, lower it by about a foot and no more.",
  },
  {
    question: 'My pool turned green two days after the storm. Is it ruined?',
    answer:
      "Almost never. Green after a storm is an algae bloom that got going while the pump was off, fed by debris and runoff — not damage to the pool. It takes a proper shock, a filter that can actually pass water, and a few days of running to clear. The pool surface underneath is generally fine.",
  },
  {
    question: 'Can I run my pump during the storm?',
    answer:
      "No. Shut it down at the breaker before the weather arrives. Running through a storm risks the motor if the pad floods, and leaves the equipment exposed to the surge when the grid comes back. Leave it off until someone has looked at the pad and confirmed nothing got wet.",
  },
  {
    question: 'The power has been out for days. What can I do myself?',
    answer:
      "Skim what you can reach, brush the walls and floor daily to keep algae from anchoring, and hand-broadcast liquid chlorine around the perimeter rather than dropping tabs in a floater — with no circulation a floater just sits in one place and can bleach the surface under it. Don't swim until it's balanced again. Once power returns, run the pump continuously for the first couple of days.",
  },
  {
    question: 'How quickly can you get out after a storm?',
    answer:
      "Honestly: it depends on how wide the damage is. After a major storm we're triaging a whole route, and existing weekly customers come first. Call or text as early as you can — even before the weather clears — and we'll give you a real position in the queue rather than a promise we can't keep.",
  },
  {
    question: 'Does my pool need to be drained and acid washed after a storm?',
    answer:
      "Usually not, and be careful with anyone who leads with that. Draining a pool in saturated Florida ground carries real risk, and most post-storm pools — even genuinely awful-looking ones — come back with debris removal, a proper filter clean, and a shock-and-hold cycle. A full drain is a last resort, not a starting point.",
  },
  {
    question: 'Will my insurance cover the cleanup?',
    answer:
      "It varies a lot by policy, so it's worth a call to your carrier before you assume either way. Structural damage and equipment are treated differently from debris removal and water chemistry, and deductibles on named storms often work differently from the rest of the policy. Keep photos from before and after — they help whichever way it goes.",
  },
];

// JSON-LD, passed through usePageMeta({ jsonLd }) so it lands in the
// PRERENDERED head — NOT appended from a useEffect. An effect never runs during
// renderToString, so the HTML a crawler reads on first fetch would carry none of
// these nodes; they'd only appear after the page hydrates. That matters more
// here than anywhere else on the site: this page's whole reason for shipping in
// August is being indexed fast, ahead of a named storm.
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
      'Hurricane and storm pool cleanup across St. Petersburg & Pinellas — debris out, filter cleaned, chemistry rebuilt. Plus what to do before it hits.',
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
            Debris out, filter cleaned, chemistry rebuilt from wherever the rain left it, and
            eyes on the equipment before anything gets switched back on. We cover
            St.&nbsp;Petersburg, Clearwater, Largo, Palm Harbor and the rest of Pinellas.
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

        {/* Two doors. People land here in one of two very different moments —
            watching a cone on the news, or standing over a brown pool — and
            they need opposite halves of the page. Anchors, not tabs, so both
            halves stay in the DOM and crawlable. */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <a
              href="#before"
              className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 flex items-start gap-3.5 hover:bg-white/[0.06] hover:border-white/15 transition-colors text-left"
            >
              <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span className="w-11 h-11 shrink-0 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                <CloudRain className="w-5 h-5 text-brand-blue-light" />
              </span>
              <span className="min-w-0">
                <span className="block font-display font-bold text-white text-[15px] leading-snug mb-1">
                  There&rsquo;s one coming
                </span>
                <span className="block text-[13px] text-gray-400 leading-snug">
                  What to do this week — and the one thing not to
                  <ArrowRight className="inline w-3.5 h-3.5 ml-1 -mt-0.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </a>

            <a
              href="#after"
              className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 flex items-start gap-3.5 hover:bg-white/[0.06] hover:border-white/15 transition-colors text-left"
            >
              <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span className="w-11 h-11 shrink-0 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                <Waves className="w-5 h-5 text-brand-blue-light" />
              </span>
              <span className="min-w-0">
                <span className="block font-display font-bold text-white text-[15px] leading-snug mb-1">
                  It already hit
                </span>
                <span className="block text-[13px] text-gray-400 leading-snug">
                  What the cleanup covers and how fast we can get there
                  <ArrowRight className="inline w-3.5 h-3.5 ml-1 -mt-0.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </a>
          </div>
        </section>

        {/* ── THE LIGHT BAND — before the storm ─────────────────── */}
        {/* The page's one polarity flip, and it goes here on purpose: the
            pre-storm half is the part that earns trust (and links), so it gets
            the surface that stops the scroll. Site rule is exactly ONE light
            band per page. */}
        <section
          id="before"
          className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] scroll-mt-20"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Before It Hits
              </span>
              <h2 className="section-heading text-[#0a1628] leading-tight mb-4">
                Six things to do — and one to never do.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Most of the damage we clean up after a storm was decided in the two days
                before it. None of this takes long, and it changes how bad the other side
                looks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
              {PREP_CARDS.map((card, i) => (
                <m.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.08 }}
                  className="rounded-2xl bg-white border border-brand-blue/15 shadow-[0_10px_30px_-18px_rgba(10,22,40,0.45)] p-6"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4">
                    <card.icon className="w-5 h-5 text-brand-blue" />
                  </span>
                  <h3 className="text-[#0a1628] font-display font-bold text-lg mb-2 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed">{card.body}</p>
                </m.div>
              ))}
            </div>

            <p className="text-center text-slate-500 text-sm max-w-xl mx-auto mt-10">
              If you&rsquo;re a weekly customer, we handle the shock-and-shutdown pass on our
              last visit before the storm. You don&rsquo;t need to do any of this yourself.
            </p>
          </Container>
        </section>

        {/* ── The clock ─────────────────────────────────────────── */}
        <section id="after" className="py-16 md:py-24 relative overflow-hidden bg-[#07111c] scroll-mt-16">
          <div className="absolute top-0 right-1/4 w-[50%] h-[40%] bg-brand-blue/[0.06] rounded-full blur-[150px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="max-w-2xl mb-10 md:mb-12">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                After It Passes
              </span>
              <h2 className="section-heading text-white leading-[1.1] mb-4">
                A still pool in August doesn&rsquo;t stay clear for long.
              </h2>
              <p className="section-subtext">
                The pool usually survives the storm fine. What gets it is the days
                afterward, and that part is a race.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {[
                {
                  icon: Zap,
                  title: 'No pump, no filtration',
                  body:
                    "Nothing is moving, so nothing is being filtered and the chlorine that is left sits in whatever corner it started in. In Florida summer heat, a pool with organic debris in it and no circulation can turn in a day or two.",
                },
                {
                  icon: CloudRain,
                  title: 'The rain thinned everything out',
                  body:
                    'Inches of rainwater dilute chlorine, stabilizer, and alkalinity together. Without stabilizer, whatever chlorine survives burns off in hours once the sun is back out.',
                },
                {
                  icon: Droplets,
                  title: 'The runoff brought food',
                  body:
                    'Everything the water crossed on the way in — lawn fertilizer, soil, street debris — lands in the pool as phosphates and nitrates. That is what turns a recoverable pool into one that keeps going green.',
                },
              ].map((item) => (
                <m.div
                  key={item.title}
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
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-[15px] leading-relaxed">{item.body}</p>
                </m.div>
              ))}
            </div>

            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-6 rounded-2xl border border-brand-orange/20 bg-brand-orange/[0.04] p-6 md:p-7 flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <p className="text-gray-300 leading-relaxed text-[15px] flex-1">
                If it already went green, that is its own job with its own order of
                operations — and the full walkthrough is written up if you would rather take
                it on yourself.
              </p>
              <SmartLink
                to="/pool-care/green-pool/"
                className="group inline-flex items-center gap-2 shrink-0 text-brand-orange-light font-semibold text-[15px] hover:text-white transition-colors"
              >
                Read the green pool guide
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </SmartLink>
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

        {/* ── Power outage case ─────────────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <Container className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-12 items-start">
              <div className="lg:pt-2">
                <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  While The Power Is Out
                </span>
                <h2 className="section-heading text-white leading-[1.1] mb-4">
                  The pump is down and it&rsquo;s going to be a few days.
                </h2>
                <p className="section-subtext mb-6">
                  This is the most common call we get after a storm, and there is genuinely
                  useful holding work you can do in the meantime. It will not clear the pool,
                  but it decides whether we are cleaning it or recovering it.
                </p>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-3">
                    The moment power returns
                  </p>
                  <p className="text-white font-semibold text-[15px] leading-relaxed">
                    Check the pad before you flip the breaker. If the motor sat in water,
                    energizing it is what turns a repair into a replacement.
                  </p>
                </div>
              </div>

              <div className="relative glass-panel rounded-3xl p-6 sm:p-8 overflow-hidden">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <ul className="flex flex-col gap-4">
                  {[
                    'Brush the walls and floor once a day — algae needs to anchor before it can bloom, and brushing keeps knocking it loose.',
                    'Hand-pour liquid chlorine around the perimeter rather than dropping tabs in a floater. With no flow, a floater parks in one spot and can bleach the finish under it.',
                    'Skim whatever you can reach. Organic debris is what is eating your chlorine.',
                    'Leave the water level alone unless it is genuinely about to overflow into the house.',
                    'Nobody swims until it is tested and balanced — clear-looking water after a storm is not the same as sanitized water.',
                    'Once power is back and the pad checks out, run the pump continuously for the first couple of days, not on the timer.',
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

        {/* ── Response & pricing ────────────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden">
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
            </div>
          </Container>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-blue/12 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Don&rsquo;t wait for the water to turn.
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                Send us photos now and we&rsquo;ll get you a flat quote and a real position in
                the queue — even if the power is still out.
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
              <p className="text-gray-500 text-sm max-w-lg mx-auto mt-6">
                Storms are the reason a lot of people stop doing this themselves. If you want
                it handled year-round instead,{' '}
                <Link to="/how-it-works/" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                  here&rsquo;s how weekly service works
                </Link>
                .
              </p>
            </div>
          </div>
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
