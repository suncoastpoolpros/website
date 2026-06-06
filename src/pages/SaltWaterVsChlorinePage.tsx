import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Waves,
  Activity,
  Infinity as InfinityIcon,
  FlaskConical,
  Smile,
  Droplets,
  ShieldCheck,
  Shirt,
  Info,
  Zap,
  Recycle,
  Sun,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { QuoteSheetProvider } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// The core difference — light-band explainer cards. The whole page hangs on the
// third card's point: salt water isn't a different chemical, it's the SAME
// chlorine delivered steadily instead of in slugs.
const DIFFERENCE_CARDS = [
  {
    icon: Activity,
    title: 'Liquid chlorine is a sawtooth',
    text: 'Every jug you pour spikes the chlorine high, then it drifts down toward zero before the next dose. The water swings from over-chlorinated right after, to under-protected by the end of the week — a constant up and down.',
  },
  {
    icon: InfinityIcon,
    title: 'A salt cell holds the line',
    text: 'A salt system makes a little chlorine all day as water passes through the cell. Instead of peaks and valleys, the free chlorine sits in a tight, steady band — the same level Monday morning as Friday night.',
  },
  {
    icon: FlaskConical,
    title: 'It’s still chlorine — just steadier',
    text: 'Salt water isn’t chlorine-free. The cell makes the exact same sanitizer, continuously, instead of in big slugs from a bottle. That steadiness — not some different chemical — is the whole difference you feel.',
  },
];

// What steady chlorine gives you — dark 2x2 benefit grid. This is the heart of
// the page: every card is a downstream payoff of holding the level steady.
const BENEFIT_CARDS = [
  {
    icon: Smile,
    title: 'Gentler on skin & eyes',
    text: 'The red eyes and itchy, dry skin people blame on chlorine come from the spikes right after a dose. Hold the level low and steady, and the water stays easy on swimmers all week long.',
  },
  {
    icon: Droplets,
    title: 'Softer, silkier water',
    text: 'The small amount of dissolved salt gives the water a noticeably smoother, softer feel. Most people describe a salt pool as gentler and less harsh the moment they get in.',
  },
  {
    icon: ShieldCheck,
    title: 'Sanitation that never dips',
    text: 'Because the chlorine never bottoms out between doses, algae and bacteria don’t get the window they need to take hold. The water just stays clear instead of teetering on the edge of a bloom.',
  },
  {
    icon: Shirt,
    title: 'Easy on hair, swimwear & surfaces',
    text: 'No chlorine spikes means less fading on swimsuits, less dried-out hair, and less stress on liners, seals, and pool surfaces. Steady is gentler on everything it touches.',
  },
];

// The chloramine myth — the bullets under the blue info band.
const SMELL_POINTS = [
  'That sharp smell means there’s too little free chlorine, not too much',
  'It’s strongest at busy public pools — exactly where chlorine gets used up fastest',
  'A steady salt-generated residual keeps breaking chloramines down before they build up',
  'Less chloramine also means less of the eye and lung irritation that comes with the smell',
];

// How a salt system works — concise 3-step loop. It’s a process explainer (not a
// how-to task), so it doesn’t feed a HowTo schema.
const HOW_STEPS = [
  {
    icon: Droplets,
    title: 'Salt in the water',
    text: 'Your pool holds a low level of dissolved salt — about a tenth as salty as the ocean, low enough that most people can’t taste it. It’s the raw material, and it doesn’t get used up.',
  },
  {
    icon: Zap,
    title: 'The cell makes chlorine',
    text: 'As water flows through the salt cell, a small electric charge splits the salt and generates pure chlorine right there in the plumbing — fresh, on demand, every time the pump runs.',
  },
  {
    icon: Recycle,
    title: 'It reverts back to salt',
    text: 'Once that chlorine has sanitized the water, it recombines back into salt — and the cycle starts over. No jugs to haul, no slug doses, just a steady stream of sanitizer.',
  },
];

// Page-specific FAQ — drives both the on-page accordion and the FAQPage JSON-LD.
const SALT_FAQ = [
  {
    question: 'Is a salt water pool chlorine-free?',
    answer:
      'No. A salt system makes chlorine continuously from the dissolved salt — it’s still a chlorine pool, just one that doses itself steadily instead of from a jug.',
  },
  {
    question: 'Does salt water feel like swimming in the ocean?',
    answer:
      'No. A salt pool runs about a tenth of the salt concentration of seawater — most people can’t taste it. What you do notice is softer, smoother-feeling water.',
  },
  {
    question: 'Why is salt water gentler on skin and eyes?',
    answer:
      'Because the chlorine stays at a low, steady level instead of spiking after each dose. Those spikes — not chlorine itself — are what cause the irritation and red eyes.',
  },
  {
    question: 'What is that “chlorine smell,” really?',
    answer:
      'Chloramines — chlorine that’s already been used up and not replaced. A steady free-chlorine residual keeps breaking them down, which is why a well-run salt pool smells cleaner, not stronger.',
  },
  {
    question: 'Do salt water pools still need chemicals?',
    answer:
      'Yes. You still balance pH, alkalinity, and stabilizer (CYA), and the salt level needs topping up occasionally. The cell just takes over the day-to-day chlorine dosing.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: SALT_FAQ.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const SaltWaterVsChlorinePageInner = () => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'Salt Water vs. Chlorine: Why Steady Chlorine Wins',
    description:
      'A salt generator makes chlorine continuously for a steady level — not the spike-and-crash of liquid chlorine. Gentler on skin and eyes, softer water, no harsh smell.',
    canonicalPath: '/pool-care/salt-water-vs-chlorine/',
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify([
      faqSchema,
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Pool Care', path: '/pool-care/' },
        { name: 'Salt Water vs. Chlorine', path: '/pool-care/salt-water-vs-chlorine/' },
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

      <div className="absolute top-0 inset-x-0 h-[520px] pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[520px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <Waves className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">Salt Water Pools</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Salt water vs. liquid chlorine: steady wins
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            A salt system doesn&rsquo;t replace chlorine &mdash; it <em className="text-gray-300 not-italic font-semibold">makes</em> it,
            continuously, so your water holds a steady level instead of spiking and crashing between
            jugs. Here&rsquo;s what that stability changes about how your pool feels, smells, and swims.
          </p>
        </section>

        {/* ── 1. The core difference — light band, 3-card grid ─────── */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                The Core Difference
              </span>
              <h2 className="font-display font-bold text-[#0a1628] text-3xl sm:text-4xl leading-tight mb-3">
                Peaks and valleys vs. a steady line
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Liquid chlorine and a salt cell both sanitize with chlorine. The difference is how
                steadily they deliver it &mdash; and that one thing changes everything downstream.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
              {DIFFERENCE_CARDS.map((card, i) => (
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

        {/* ── 2. What steady chlorine gives you — dark 2x2 grid ────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                What You Actually Feel
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                What steady chlorine gives you
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Hold the chlorine low and steady, and the payoff shows up everywhere you touch the
                water &mdash; not on a spreadsheet, but on your skin.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 max-w-4xl mx-auto">
              {BENEFIT_CARDS.map((card, i) => (
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

        {/* ── Myth-buster band — the "chlorine smell" is chloramines ─ */}
        <section className="pb-4 sm:pb-8">
          <Container>
            <div className="max-w-4xl mx-auto rounded-3xl border border-brand-blue/30 bg-gradient-to-br from-brand-blue/[0.14] via-brand-blue/[0.04] to-transparent p-7 sm:p-9 relative overflow-hidden">
              <div className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-start gap-3.5 mb-4">
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5 text-brand-blue-light" />
                  </span>
                  <div>
                    <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs block mb-1">
                      The Chlorine-Smell Myth
                    </span>
                    <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight">
                      That &ldquo;chlorine smell&rdquo; isn&rsquo;t chlorine
                    </h2>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">
                  The strong smell everyone associates with chlorine actually comes from{' '}
                  <span className="text-white font-semibold">chloramines</span> &mdash; chlorine
                  that&rsquo;s already been used up fighting contaminants. It&rsquo;s a sign of too
                  little fresh chlorine, not too much.
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {SMELL_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-gray-200 text-[15px] leading-snug">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-blue-light shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* ── 3. How a salt system works — concise 3-step loop ─────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                How It Works
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                A chlorine pool that doses itself
              </h2>
              <p className="text-gray-400 leading-relaxed">
                No tanks of acid, no weekly jugs to haul. A salt system runs one simple loop every
                time the pump turns on.
              </p>
            </div>

            <ol className="grid gap-4 sm:gap-5 sm:grid-cols-3 max-w-5xl mx-auto">
              {HOW_STEPS.map((step, i) => (
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
                    <step.icon className="w-[18px] h-[18px] text-brand-orange/80" />
                  </div>
                  <h3 className="text-white font-semibold mb-1.5 leading-snug">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.text}</p>
                </m.li>
              ))}
            </ol>

            {/* Cross-link: salt pools still run stabilizer — the FC:CYA ratio
                decides whether that steady chlorine actually sanitizes. */}
            <Link
              to="/pool-care/cyanuric-acid"
              className="mt-6 mx-auto max-w-4xl flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors p-5 group"
            >
              <span className="flex items-center gap-4 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5 text-brand-blue-light" />
                </span>
                <span className="min-w-0">
                  <span className="block text-white font-semibold text-[15px] leading-tight">
                    Salt pools still need stabilizer
                  </span>
                  <span className="block text-gray-400 text-sm mt-0.5">
                    Free chlorine to CYA is the ratio that keeps that steady chlorine working &mdash; see the guide.
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
                  Salt water questions, answered
                </h2>
                <p className="text-gray-400">
                  The questions homeowners ask most about salt vs. chlorine.{' '}
                  <a href="/faq" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {SALT_FAQ.map((faq) => {
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

        {/* Closing note — educational resource, not a sales CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Curious whether salt is right for your pool?
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                If you&rsquo;re weighing a salt system, just ask your Suncoast tech on the next visit
                &mdash; we&rsquo;ll talk through how it&rsquo;d fit your pool, no pressure. Questions
                in the meantime? Reach us anytime at{' '}
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

export const SaltWaterVsChlorinePage = () => (
  <QuoteSheetProvider>
    <SaltWaterVsChlorinePageInner />
  </QuoteSheetProvider>
);
