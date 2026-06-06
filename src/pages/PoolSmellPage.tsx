import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Wind,
  FlaskConical,
  TrendingDown,
  Eye,
  Users,
  Droplets,
  Leaf,
  Ban,
  Zap,
  TestTube,
  RefreshCw,
  ShowerHead,
  Waves,
  AlertTriangle,
  ShieldCheck,
  Calculator,
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

// The myth-buster — light band. The whole page hinges on this: a strong smell is
// chloramines (used-up chlorine), which means too LITTLE free chlorine, not too much.
const WHY_CARDS = [
  {
    icon: FlaskConical,
    title: 'It isn’t chlorine you smell',
    text: 'That sharp “pool” smell is chloramines — what’s left after chlorine reacts with sweat, oils, sunscreen, and urine. Clean, properly chlorinated water barely smells at all. The strong smell is the byproduct, not the sanitizer.',
  },
  {
    icon: TrendingDown,
    title: 'It means too little, not too much',
    text: 'This is the part that trips everyone up. A strong smell means your free chlorine ran low and let chloramines build up. The fix is more chlorine — a shock — to burn them off, not backing off and waiting.',
  },
  {
    icon: Eye,
    title: 'Same thing stings your eyes',
    text: 'Red eyes and itchy skin after swimming get blamed on “too much chlorine.” It’s actually those same chloramines, often with an off pH. Balanced, well-chlorinated water doesn’t burn — irritation is a sign something’s off.',
  },
];

// What feeds chloramines — dark 2x2 grid. Knowing the inputs is how you keep them
// from building back up after you shock.
const SOURCE_CARDS = [
  {
    icon: Users,
    title: 'Swimmers bring the fuel',
    text: 'Sweat, body oils, sunscreen, lotions, and deodorant all rinse off into the water. The more people in the pool — and the hotter the day — the more material there is for chlorine to react with and turn into chloramines.',
  },
  {
    icon: Droplets,
    title: 'Ammonia & nitrogen',
    text: 'Urine and other nitrogen sources combine with chlorine to form the smelliest, most irritating chloramines of all. It’s the classic “busy pool on a hot weekend” smell — and no, it’s not the chlorine doing it.',
  },
  {
    icon: Leaf,
    title: 'Organic debris',
    text: 'Leaves, pollen, grass, and rain runoff add a steady organic load for chlorine to chew through. In Florida that load never really stops, so chloramines build quietly between proper shocks.',
  },
  {
    icon: Ban,
    title: 'Free chlorine too low to finish',
    text: 'Chloramines only clear when free chlorine is high enough to break them apart. Let it drift low — or lock it up with too much stabilizer — and they pile up faster than the chlorine left can destroy them.',
  },
];

// The mistakes that make the smell worse — amber caution band. The headline error
// is treating a strong smell as "too much chlorine" and adding less.
const MISTAKES = [
  'Adding less chlorine because it “smells too strong” — backwards. Low free chlorine is exactly what let the chloramines build in the first place.',
  'Waiting for it to air out — in a busy outdoor pool chloramines re-form as fast as they gas off. You have to break them with a shock, not wait them out.',
  'Adding just a small dose — a half-measure stalls below “breakpoint” and can make the smell worse before better. You have to clear the hump in one go.',
  'Blaming red eyes on too much chlorine — it’s chloramines plus an off pH. Balanced, well-sanitized water doesn’t sting.',
];

// The fix — breakpoint chlorination. Also the source for the HowTo JSON-LD below.
const TREATMENT_STEPS = [
  {
    title: 'Test free and combined chlorine',
    text: 'Total chlorine minus free chlorine equals your chloramines (combined chlorine). Anything over about 0.5 ppm combined is what’s making the smell — and tells us how hard we need to shock.',
  },
  {
    title: 'Shock past breakpoint',
    text: 'We raise free chlorine high enough — roughly ten times the combined chlorine reading — to blow past “breakpoint” and actually destroy the chloramines. A timid dose won’t do it. Done at dusk so the sun doesn’t burn it off first.',
  },
  {
    title: 'Run the filter & circulate',
    text: 'We keep the pump running so the shock reaches every corner and the broken-down chloramines gas off at the surface. Circulation is half the job — still water holds the smell.',
  },
  {
    title: 'Cut the contaminant load',
    text: 'A quick rinse-off before swimming, no peeing in the pool, and skimming out debris all mean less for chlorine to react with — so chloramines don’t just build straight back up after the shock.',
  },
  {
    title: 'Retest & rebalance',
    text: 'We confirm combined chlorine is back near zero, then rebalance free chlorine and pH so the water is comfortable again — no smell, no sting, properly sanitized.',
  },
];

// Page-specific FAQ — drives both the on-page accordion and the FAQPage JSON-LD.
const SMELL_FAQ = [
  {
    question: 'Why does my pool smell strongly of chlorine?',
    answer:
      'That sharp smell isn’t chlorine — it’s chloramines, the byproduct left when chlorine reacts with sweat, oils, sunscreen, and urine. A strong smell almost always means your free chlorine ran low and let chloramines build up. The fix is to shock the pool to burn them off, not to add less chlorine.',
  },
  {
    question: 'Does a strong chlorine smell mean too much chlorine?',
    answer:
      'No — it usually means the opposite. Properly chlorinated water barely smells. The strong “pool smell” is combined chlorine (chloramines), which builds up when free chlorine is too low to break it down. So a strong smell is a sign you need more chlorine, in the form of a shock, not less.',
  },
  {
    question: 'Why does the pool make my eyes red and sting?',
    answer:
      'Red, stinging eyes and itchy skin are caused by chloramines and an off pH — not “too much chlorine,” which is the common myth. Clean water balanced to the right pH and free-chlorine level doesn’t burn. Irritation is a signal the water needs attention, not avoidance.',
  },
  {
    question: 'How do I get rid of the chlorine smell in my pool?',
    answer:
      'Shock it. Test free and combined chlorine, then raise free chlorine past “breakpoint” — about ten times the combined reading — to destroy the chloramines, ideally at dusk. Keep the filter running to circulate and let them gas off, then retest and rebalance pH and chlorine.',
  },
  {
    question: 'Is it safe to swim in a pool that smells strongly of chlorine?',
    answer:
      'A strong smell means chloramines are high and your sanitizer is overwhelmed, so it’s best to shock and clear it first — especially for anyone with sensitive eyes, skin, or asthma. Once the smell is gone and free chlorine is back in the 1–4 ppm range, the water is comfortable and properly sanitized.',
  },
  {
    question: 'How do I stop the smell from coming back?',
    answer:
      'Keep free chlorine steady in range so chloramines never get a chance to build, manage bather load on hot busy days, rinse off before swimming, and keep your stabilizer (CYA) from getting so high it locks up your chlorine. Steady sanitation is what keeps the water smelling like nothing at all.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to get rid of a chlorine smell in a pool',
  description:
    'How to clear the strong chlorine smell from a swimming pool — test free and combined chlorine, shock past breakpoint to destroy the chloramines, circulate, cut the contaminant load, then retest and rebalance. From Suncoast Pool Pros in St. Petersburg, FL.',
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
  mainEntity: SMELL_FAQ.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const PoolSmellPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'Why Does My Pool Smell Like Chlorine? Causes & Fix',
    description:
      'Why does your pool smell like chlorine? It’s not too much — it’s chloramines, which means too little. What it is and how to clear the smell fast.',
    canonicalPath: '/pool-care/pool-smells-like-chlorine/',
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
        { name: 'Pool Smells Like Chlorine', path: '/pool-care/pool-smells-like-chlorine/' },
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
            <Wind className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">Smell &amp; Irritation</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Pool smells like chlorine? It&rsquo;s not too much.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            That strong &ldquo;chlorine&rdquo; smell is the one thing in pool care almost everyone
            gets backwards. It isn&rsquo;t too much chlorine &mdash; it&rsquo;s a sign you have too
            little. Here&rsquo;s what you&rsquo;re really smelling, and how to clear it for good.
          </p>
        </section>

        {/* ── 1. The myth-buster — light band, 3-card grid ─────────── */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                What You&rsquo;re Smelling
              </span>
              <h2 className="font-display font-bold text-[#0a1628] text-3xl sm:text-4xl leading-tight mb-3">
                The smell is used-up chlorine
              </h2>
              <p className="text-slate-600 leading-relaxed">
                A clean, properly chlorinated pool barely smells. That sharp smell is chloramines
                &mdash; and spotting it is pool-care 101. If your water&rsquo;s getting to the smelly
                stage, it&rsquo;s fair to ask how closely it&rsquo;s really being looked after.
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

        {/* ── 2. What feeds chloramines — dark 2x2 grid ────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Where The Smell Comes From
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                What turns chlorine into chloramines
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Chloramines form when chlorine reacts with everything swimmers and nature bring in.
                Knowing the sources is how you keep the smell from building back up.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 max-w-4xl mx-auto">
              {SOURCE_CARDS.map((card, i) => (
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

        {/* ── Caution — the mistakes that make the smell worse ─────── */}
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
                      Don&rsquo;t Back Off The Chlorine
                    </span>
                    <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight">
                      Four moves that make the smell worse
                    </h2>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">
                  Almost every pool that &ldquo;smells too strong&rdquo; got there by treating the
                  smell as too much chlorine. Do the opposite of these and the smell clears fast.
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

        {/* ── 3. The fix — step timeline (centerpiece) ─────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Clear The Smell
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                The fix is breakpoint chlorination
              </h2>
              <p className="text-gray-400 leading-relaxed">
                There&rsquo;s no air-freshener trick for a pool &mdash; you have to destroy the
                chloramines. Here&rsquo;s the exact process that does it, in the order that works.
              </p>
            </div>

            <ol className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
              {TREATMENT_STEPS.map((step, i) => {
                const StepIcon = [TestTube, Zap, RefreshCw, ShowerHead, Waves][i];
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

            {/* Cross-link: dosing the shock to breakpoint needs the pool's gallons. */}
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

        {/* ── If it keeps coming back — internal-link band ─────────── */}
        <section className="pb-16 sm:pb-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 max-w-2xl mx-auto">
                <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  If It Keeps Coming Back
                </span>
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight mb-3">
                  A smell that returns is a chlorine problem
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  If the smell is back within days of shocking, your free chlorine isn&rsquo;t holding.
                  These two are the usual reasons why.
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
                      Chlorine that&rsquo;s locked up
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                    </span>
                    <span className="block text-gray-400 text-sm mt-1 leading-relaxed">
                      Too much stabilizer (CYA) keeps chlorine from reaching breakpoint, so chloramines
                      never fully clear. See the cyanuric acid guide.
                    </span>
                  </span>
                </Link>

                <Link
                  to="/pool-care/cloudy-pool-water"
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-colors p-5"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5 text-brand-orange" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-white font-semibold text-[15px] leading-tight">
                      Smelly and a little hazy?
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                    </span>
                    <span className="block text-gray-400 text-sm mt-1 leading-relaxed">
                      Low free chlorine that lets chloramines build often clouds the water too. See the
                      cloudy pool water guide.
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
                  Chlorine smell questions, answered
                </h2>
                <p className="text-gray-400">
                  The questions homeowners ask most about a smelly pool.{' '}
                  <a href="/faq" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {SMELL_FAQ.map((faq) => {
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

        {/* Closing CTA — smelly-pool searchers are high-intent, so offer to take it on */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Rather not chase the chemistry?
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                We keep free chlorine steady and chloramines at zero across St. Petersburg and the
                Tampa Bay area &mdash; clear, comfortable water every week for one flat rate.
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

export const PoolSmellPage = () => (
  <QuoteSheetProvider>
    <PoolSmellPageInner />
  </QuoteSheetProvider>
);
