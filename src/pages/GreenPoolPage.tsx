import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Sprout,
  Zap,
  Bug,
  CloudRain,
  Waves,
  Wind,
  Ban,
  Search,
  AlertTriangle,
  TestTube,
  Brush,
  Filter,
  Sparkles,
  Calculator,
  ShieldCheck,
  ArrowRight,
  Plus,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Why a pool turns green — light-band explainer. The through-line: green water is
// almost always an algae bloom that has out-run your chlorine, not a mystery.
const WHY_CARDS = [
  {
    icon: Zap,
    title: 'Chlorine lost the race',
    text: 'Green is algae winning. The moment free chlorine dips — a hot week, a busy weekend, a stabilizer that got too high — algae spores already in the water start multiplying faster than the chlorine left can kill them.',
  },
  {
    icon: Bug,
    title: 'It blooms overnight',
    text: 'Algae doubles fast. A pool that looked a little dull on Friday can be full-on green by Sunday. That speed is why "I’ll deal with it next week" almost never works — you have to hit it hard and early.',
  },
  {
    icon: CloudRain,
    title: 'Florida hands it every advantage',
    text: 'Our heat speeds algae up and burns chlorine off; summer storms dump acidic rain that drops your pH and dilutes your sanitizer, then wash phosphate-rich runoff in to feed the bloom. Green-after-a-storm is a Tampa Bay classic.',
  },
];

// Algae ID — dark 2x2. Knowing which one you have changes how hard you have to
// hit it (mustard and black are far more stubborn than common green).
const ALGAE_CARDS = [
  {
    icon: Waves,
    title: 'Green algae (most common)',
    text: 'Bright green, slimy, free-floating or clinging to walls and steps. It clouds the whole pool and it’s the easiest to kill — a proper shock and good filtration usually clears it in a day or two.',
  },
  {
    icon: Wind,
    title: 'Mustard / yellow algae',
    text: 'Looks like pollen, sand, or dirt dusted on the floor and shady walls — and brushes away then comes right back. It’s chlorine-resistant, so it needs a much harder, repeated shock to truly clear.',
  },
  {
    icon: Ban,
    title: 'Black algae',
    text: 'Dark blue-green spots with roots that dig into plaster and grout. The toughest of the three: it has to be scrubbed open and spot-treated, or it keeps coming back from the same spots no matter how much you shock.',
  },
  {
    icon: Search,
    title: 'Sure it’s even algae?',
    text: 'Green-tinted but clear (not cloudy) water is often dissolved metals — usually copper from fill water or an off pH — not algae. Yellow “dust” can just be pollen. The fix is completely different, so it’s worth confirming before you dump in shock.',
  },
];

// The mistakes that turn a one-day fix into a one-week battle — amber caution band.
const MISTAKES = [
  'Shocking in the middle of the day — Florida sun burns the chlorine off before it can finish the job. Shock at dusk or after dark.',
  'Skipping the brushing — algae hides under a slime layer that shrugs off chlorine until you physically break it up first.',
  'Under-dosing the shock — a green pool needs double, triple, or more of a normal dose by how bad it is. A timid dose just feeds a comeback.',
  'Turning the pump off — the filter is what actually removes the dead algae. It needs to run 24/7 until the water clears, not on a timer.',
];

// Green-to-clean treatment plan — also the source for the HowTo JSON-LD below.
const TREATMENT_STEPS = [
  {
    title: 'Balance the water first',
    text: 'Chlorine barely works above pH 7.8, so we test and bring pH and alkalinity into range before shocking. Skip this and most of the shock you add is wasted.',
  },
  {
    title: 'Brush every surface',
    text: 'Walls, floor, steps, and the shady corners where algae hides. Brushing breaks the protective layer so the chlorine can actually reach and kill it.',
  },
  {
    title: 'Shock hard — at night',
    text: 'We shock to a high free-chlorine level, dosed to how green it is (double or triple a normal dose), after sundown so the sun doesn’t burn it off. Mustard and black algae get repeat doses.',
  },
  {
    title: 'Run the filter 24/7',
    text: 'As the algae dies it turns gray and cloudy — that haze is the filter’s job. We run the pump non-stop and backwash or clean the filter as it loads up with dead algae.',
  },
  {
    title: 'Clarify, vacuum & retest',
    text: 'A clarifier or floc gathers the fine dead algae so we can vacuum it out, then we retest and rebalance chlorine, pH, and stabilizer so the water comes back swim-ready — not just clear.',
  },
];

// Page-specific FAQ — drives both the on-page accordion and the FAQPage JSON-LD.
const GREEN_POOL_FAQ = [
  {
    question: 'How long does it take to clear a green pool?',
    answer:
      'A normal green-algae pool usually clears in 24–48 hours once you balance, shock hard, and run the filter non-stop. A deep green, or stubborn mustard or black algae, can take three to five days and more than one shock.',
  },
  {
    question: 'Is it safe to swim in a green pool?',
    answer:
      'No. Green water means algae and bacteria are thriving and your sanitizer is overwhelmed, plus you can’t see the bottom — which is a real drowning hazard. Wait until the water is clear and chlorine has settled back to a normal 1–4 ppm.',
  },
  {
    question: 'My pool turned green right after a storm — why?',
    answer:
      'Heavy Florida rain is mildly acidic, so it drops your pH and dilutes your chlorine, while runoff washes in phosphates and debris that feed algae. With our heat, that combination can turn a pool green within a day. Test and re-shock after any big storm.',
  },
  {
    question: 'Can I just add algaecide instead of shocking?',
    answer:
      'Algaecide is a preventer, not a cure for a full bloom. To clear a green pool you need chlorine to actually kill the algae — shock is what does that. Algaecide is best used afterward to help keep it from coming back.',
  },
  {
    question: 'Why does my pool keep turning green no matter what I do?',
    answer:
      'A pool that goes green again and again almost always has an underlying driver: high cyanuric acid (stabilizer) locking up your chlorine, or nitrates and phosphates feeding the algae faster than you can sanitize. Until that root cause is fixed, you’re treating the symptom.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to clear a green pool',
  description:
    'How to clear a green, algae-filled swimming pool — balance the water, brush every surface, shock hard at night, run the filter continuously, then clarify, vacuum, and retest. From Suncoast Pool Pros in St. Petersburg, FL.',
  step: TREATMENT_STEPS.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.text,
  })),
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: GREEN_POOL_FAQ.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const GreenPoolPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'Green Pool? Why It Happens & How to Clear It Fast',
    description:
      'Why your pool turned green and how to clear it fast — identify the algae, then balance, brush, shock, and filter it back to blue. Plain-English guide from working St. Petersburg pool pros.',
    canonicalPath: '/pool-care/green-pool/',
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify([
      howToSchema,
      faqSchema,
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Pool Care', path: '/pool-care/' },
        { name: 'Green Pool', path: '/pool-care/green-pool/' },
      ]),
    ]);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-50 pointer-events-none" />

      <div className="absolute top-0 inset-x-0 h-[520px] pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[520px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <Sprout className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">Algae &amp; Green Water</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Green pool? Here&rsquo;s how to get it clear.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            A green pool is an algae bloom that out-ran your chlorine &mdash; and the fix is the same
            order every time. Here&rsquo;s what turned it green, how to tell which algae you&rsquo;ve
            got, and the step-by-step plan that takes it back to blue.
          </p>
        </section>

        {/* ── 1. Why it went green — light band, 3-card grid ───────── */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Why Pools Turn Green
              </span>
              <h2 className="font-display font-bold text-[#0a1628] text-3xl sm:text-4xl leading-tight mb-3">
                It&rsquo;s algae &mdash; and it moves fast
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Green water isn&rsquo;t a mystery. It&rsquo;s algae that bloomed the moment your
                sanitizer slipped &mdash; and in Florida, it gets a lot of help.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
              {WHY_CARDS.map((card, i) => (
                <m.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-white border border-black/5 shadow-sm shadow-black/5 p-6"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-4">
                    <card.icon className="w-5 h-5 text-brand-blue" />
                  </span>
                  <h3 className="text-[#0a1628] font-display font-bold text-lg mb-2">{card.title}</h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed">{card.text}</p>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── 2. Know your algae — dark 2x2 grid ───────────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Know What You&rsquo;re Fighting
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                Not all green is the same
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Which algae you&rsquo;ve got decides how hard you have to hit it &mdash; and whether a
                single shock will do it or you&rsquo;re in for a few rounds.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 max-w-4xl mx-auto">
              {ALGAE_CARDS.map((card, i) => (
                <m.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center mb-4">
                    <card.icon className="w-5 h-5 text-brand-orange" />
                  </span>
                  <h3 className="text-white font-display font-bold text-lg mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-[15px] leading-relaxed">{card.text}</p>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── Caution — the mistakes that drag it out ──────────────── */}
        <section className="pb-4 sm:pb-8">
          <Container>
            <div className="max-w-4xl mx-auto rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.12] via-amber-500/[0.04] to-transparent p-7 sm:p-9 relative overflow-hidden">
              <div className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-start gap-3.5 mb-4">
                  <span className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </span>
                  <div>
                    <span className="text-amber-400 font-bold tracking-[0.2em] uppercase text-xs block mb-1">
                      Before You Dump In Shock
                    </span>
                    <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight">
                      Four mistakes that turn a one-day fix into a one-week battle
                    </h2>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">
                  Most pools that &ldquo;won&rsquo;t clear&rdquo; got tripped up by one of these. Get
                  the order right and the same chemicals do the job in a fraction of the time.
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {MISTAKES.map((sign) => (
                    <li key={sign} className="flex items-start gap-2.5 text-gray-200 text-[15px] leading-snug">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* ── 3. The treatment plan — step timeline (centerpiece) ──── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Green To Clean
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                The fix, in the order that works
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Five steps, every time. Do them in this order and most green pools are blue again
                inside a couple of days.
              </p>
            </div>

            <ol className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
              {TREATMENT_STEPS.map((step, i) => {
                const StepIcon = [TestTube, Brush, Zap, Filter, Sparkles][i];
                return (
                  <m.li
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="inline-flex w-9 h-9 rounded-full bg-brand-orange text-white font-display font-bold items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <StepIcon className="w-[18px] h-[18px] text-brand-orange/80" />
                    </div>
                    <h3 className="text-white font-semibold mb-1.5 leading-snug">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.text}</p>
                  </m.li>
                );
              })}
            </ol>

            {/* Cross-link: dosing shock correctly needs the pool's gallons. */}
            <Link
              to="/tools/pool-volume-calculator"
              className="mt-6 mx-auto max-w-4xl flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors p-5 group"
            >
              <span className="flex items-center gap-4 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-brand-blue-light" />
                </span>
                <span className="min-w-0">
                  <span className="block text-white font-semibold text-[15px] leading-tight">
                    Need your pool&rsquo;s gallons to dose the shock?
                  </span>
                  <span className="block text-gray-400 text-sm mt-0.5">
                    Free pool volume calculator &mdash; any shape, no email needed.
                  </span>
                </span>
              </span>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </Container>
        </section>

        {/* ── Keeps coming back — internal-link band to the chemistry guides ── */}
        <section className="pb-16 sm:pb-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 max-w-2xl mx-auto">
                <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  If It Keeps Coming Back
                </span>
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight mb-3">
                  Clearing it once isn&rsquo;t the same as fixing it
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  A pool that goes green again and again has an underlying driver. These two are the
                  usual suspects &mdash; worth ruling out before the next bloom.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  to="/pool-care/cyanuric-acid"
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-colors p-5"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-brand-orange" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-white font-semibold text-[15px] leading-tight">
                      Chlorine that won&rsquo;t hold
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                    </span>
                    <span className="block text-gray-400 text-sm mt-1 leading-relaxed">
                      Too much cyanuric acid locks up your chlorine so it can&rsquo;t kill algae, even
                      at a &ldquo;normal&rdquo; reading. See the CYA guide.
                    </span>
                  </span>
                </Link>

                <Link
                  to="/pool-care/nitrates"
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-colors p-5"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                    <Sprout className="w-5 h-5 text-brand-orange" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-white font-semibold text-[15px] leading-tight">
                      Algae that keeps being fed
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                    </span>
                    <span className="block text-gray-400 text-sm mt-1 leading-relaxed">
                      Nitrates feed algae around the clock and no chemical removes them. See the
                      nitrates guide.
                    </span>
                  </span>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Quick answers — mini FAQ accordion ───────────────────── */}
        <section className="pb-16 sm:pb-20">
          <Container>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                  Green pool questions, answered
                </h2>
                <p className="text-gray-400">
                  The questions homeowners ask most about a green pool.{' '}
                  <a href="/faq" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {GREEN_POOL_FAQ.map((faq) => {
                  const isOpen = openFaq === faq.question;
                  return (
                    <div key={faq.question}>
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
                            isOpen ? 'rotate-45 text-brand-orange' : ''
                          }`}
                        >
                          <Plus className="w-5 h-5" />
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <m.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <p className="px-5 sm:px-6 pb-5 -mt-1 text-gray-400 leading-relaxed text-[15px]">
                              {faq.answer}
                            </p>
                          </m.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        {/* Closing CTA — green-pool searchers are high-intent, so offer to take it on */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Rather not fight it yourself?
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                We clear green pools across St. Petersburg and the Tampa Bay area &mdash; and keep them
                blue with weekly service for one flat rate.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="#quote" onClick={handleQuoteClick} className="btn btn-orange w-full sm:w-auto">
                  <MessageSquare className="w-[18px] h-[18px]" />
                  Get a Free Quote
                </a>
                <a href={PHONE_HREF} className="btn btn-glass w-full sm:w-auto">
                  <Phone className="w-[18px] h-[18px]" />
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export const GreenPoolPage = () => (
  <QuoteSheetProvider>
    <GreenPoolPageInner />
  </QuoteSheetProvider>
);
