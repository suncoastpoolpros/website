import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  FlaskConical,
  Droplets,
  Sprout,
  CloudRain,
  Leaf,
  Ban,
  Zap,
  Bug,
  TestTube,
  Calculator,
  Waves,
  RefreshCw,
  ShieldCheck,
  Plus,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { QuoteSheetProvider } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Why nitrates matter — light-band explainer cards. The third card carries the
// page's core teaching point (no chemical removes nitrates — unlike phosphates).
const WHY_CARDS = [
  {
    icon: Bug,
    title: 'Invisible algae fuel',
    text: "Nitrates are nitrogen — a primary algae nutrient. A pool can test perfect for chlorine and pH and still keep going green, because the algae has all the food it needs to outpace your sanitizer.",
  },
  {
    icon: Zap,
    title: 'Chlorine that never holds',
    text: 'High nitrates make chlorine demand soar. You keep adding chlorine and it keeps vanishing, because it’s being burned up faster than you can add it. Until the nitrates come down, it’s a reading you can’t hold.',
  },
  {
    icon: Ban,
    title: 'No chemical removes them',
    text: 'This is the key difference from phosphates: a phosphate remover precipitates phosphates out, but there is no additive that takes nitrates out of pool water. The only effective fix is dilution — draining and refilling.',
  },
];

// Where Florida pools pick up nitrates — dark 2x2 source grid.
const SOURCE_CARDS = [
  {
    icon: Droplets,
    title: 'Fill & well water',
    text: 'Tap water — and especially well water around Pinellas — can carry nitrates straight into your pool every time you top off. A pool that’s topped up all summer slowly concentrates them.',
  },
  {
    icon: Sprout,
    title: 'Lawn & garden runoff',
    text: 'Lawn fertilizer is mostly nitrogen. Rain and irrigation wash it off the grass and flower beds and carry it right into the pool — a common culprit on well-kept Florida yards.',
  },
  {
    icon: CloudRain,
    title: 'Storms & rain',
    text: 'Heavy Gulf-coast storms pull nitrogen out of the air and rinse it off surrounding surfaces into an open pool. A wet season can move the needle on its own.',
  },
  {
    icon: Leaf,
    title: 'Organic debris & pets',
    text: 'Decaying leaves, grass clippings, and pet or wildlife waste all break down into nitrogen compounds in the water — a steady trickle that adds up between drains.',
  },
];

// Red-flag symptoms that point to a nitrate problem — the "Algae Warning" band.
const WARNING_SIGNS = [
  'Your pool turns green again within days of shocking it',
  'Chlorine reads zero a day after you added plenty',
  'You’re using more chemicals than ever and the water still looks dull or cloudy',
  'Algae keeps coming back in the same spots no matter how you brush',
];

// The treatment plan — also the source for the HowTo JSON-LD below.
const TREATMENT_STEPS = [
  {
    title: 'Confirm with a nitrate test',
    text: 'Nitrates don’t show up on a standard chlorine/pH test. We use a dedicated nitrate test for an actual ppm reading — above ~10 ppm is where algae and chlorine demand take off.',
  },
  {
    title: 'Calculate the drain',
    text: 'Removal is pure dilution: replace half the water and the reading drops by roughly half. We measure your gallons and work out exactly how much to drain to reach a safe level — no guessing.',
  },
  {
    title: 'Partial drain & refill',
    text: 'We lower the pool to the calculated level and refill with fresh, low-nitrate water — done carefully to protect the plaster or liner and avoid floating the pool out of the ground.',
  },
  {
    title: 'Re-balance the fresh water',
    text: 'Fresh fill water resets everything. We re-balance chlorine, pH, alkalinity, and stabilizer (CYA) so the pool comes back swim-ready, not just diluted.',
  },
  {
    title: 'Lock in prevention',
    text: 'We pin down the source — usually fill water or lawn runoff — and adjust your routine so nitrates don’t quietly creep back up between visits.',
  },
];

// Page-specific FAQ — drives both the on-page accordion and the FAQPage JSON-LD.
const NITRATE_FAQ = [
  {
    question: 'Can you remove nitrates from a pool with chemicals?',
    answer:
      'No. Unlike phosphates, there is no additive that removes nitrates from pool water. The only effective fix is dilution — partially draining and refilling with low-nitrate water.',
  },
  {
    question: "What's a safe nitrate level for a pool?",
    answer:
      'Aim for under 10 ppm. Above that, nitrates start fueling algae and pushing chlorine demand up; problem pools often test 20–50+ ppm.',
  },
  {
    question: 'How much water do I need to drain?',
    answer:
      'Nitrate dilution is linear: draining and replacing about half the water roughly halves the reading. We measure your gallons and calculate the exact percentage to reach a safe level.',
  },
  {
    question: 'Why does my chlorine keep disappearing?',
    answer:
      'High nitrates feed algae around the clock, so chlorine gets consumed as fast as you add it. Until the nitrates come down, you’re chasing a reading you can’t hold.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to lower high nitrates in a pool',
  description:
    'How to bring down high nitrate levels in a swimming pool — testing, calculating the drain, partial drain and refill, re-balancing, and prevention. From Suncoast Pool Pros in St. Petersburg, FL.',
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
  mainEntity: NITRATE_FAQ.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const NitratesPageInner = () => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'Pool Nitrates: What They Are & How to Lower Them',
    description:
      'What are pool nitrates? Dissolved nitrogen that feeds algae and burns up your chlorine — and no chemical removes it. See the causes, signs, and how to lower them.',
    canonicalPath: '/pool-care/nitrates/',
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
        { name: 'Pool Nitrates', path: '/pool-care/nitrates/' },
      ]),
    ]);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-50 pointer-events-none" />

      <div className="absolute top-0 inset-x-0 h-[520px] pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[520px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">Pool Water Chemistry</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            High nitrates in your pool? Here&rsquo;s the fix.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            Nitrates feed algae and keep your chlorine from holding &mdash; and no chemical removes
            them. Here&rsquo;s what they are, where Florida pools pick them up, and the dilution
            treatment plan that actually brings them down.
          </p>
        </section>

        {/* ── 1. Why nitrates matter — light band, 3-card grid ─────── */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                What Are Nitrates
              </span>
              <h2 className="font-display font-bold text-[#0a1628] text-3xl sm:text-4xl leading-tight mb-3">
                Why a &ldquo;perfect&rdquo; pool still turns green
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Nitrates are dissolved nitrogen &mdash; invisible, tasteless, and one of the most
                stubborn reasons a pool fights you all season.
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

        {/* ── 2. Where they come from — dark 2x2 grid ──────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Where They Come From
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                How Florida pools pick up nitrates
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Knowing the source is half the fix &mdash; because once you&rsquo;ve diluted them
                out, you want to keep them from coming back.
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

        {/* ── Algae Warning — symptoms that point to nitrates ──────── */}
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
                      Algae Warning
                    </span>
                    <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight">
                      Signs nitrates are behind your green pool
                    </h2>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">
                  If any of these sound familiar, stop pouring chlorine into the problem &mdash;
                  it&rsquo;s money down the drain until the nitrates come down. It&rsquo;s time to
                  get the water tested.
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {WARNING_SIGNS.map((sign) => (
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
                The Treatment Plan
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                The only fix that works: dilution
              </h2>
              <p className="text-gray-400 leading-relaxed">
                There&rsquo;s no chemical shortcut for nitrates. Here&rsquo;s the exact, measured
                process we use to bring a high-nitrate pool back &mdash; and keep it there.
              </p>
            </div>

            <ol className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
              {TREATMENT_STEPS.map((step, i) => {
                const StepIcon = [TestTube, Calculator, Waves, RefreshCw, ShieldCheck][i];
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

            {/* Cross-link: the drain calculation needs the pool's gallons. */}
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
                    Need your pool&rsquo;s gallons to figure the drain?
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

        {/* ── Quick answers — mini FAQ accordion ───────────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                  Nitrate questions, answered
                </h2>
                <p className="text-gray-400">
                  The questions homeowners ask most about high nitrates.{' '}
                  <a href="/faq" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {NITRATE_FAQ.map((faq) => {
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

        {/* Closing note — resource page for existing customers, not a sales CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Think this might be your pool?
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                If your water&rsquo;s been a constant battle, just mention nitrates to your Suncoast
                tech &mdash; we&rsquo;ll test for it on your next visit and put together a plan.
                Questions in the meantime? Reach us anytime at{' '}
                <a href={PHONE_HREF} className="text-brand-orange hover:text-brand-orange-dark font-semibold whitespace-nowrap">
                  {PHONE_DISPLAY}
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </div>

    </div>
  );
};

export const NitratesPage = () => (
  <QuoteSheetProvider>
    <NitratesPageInner />
  </QuoteSheetProvider>
);
