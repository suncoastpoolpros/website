import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Droplets,
  Filter,
  Gauge,
  Zap,
  Sparkles,
  CloudRain,
  Eye,
  Waves,
  AlertTriangle,
  TestTube,
  ShieldCheck,
  Sprout,
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

// What cloudy water actually is — light-band explainer. The through-line: cloud
// is millions of particles too fine for the filter to catch, and three systems
// (filtration, balance, sanitizer) decide whether they clear or hang in the water.
const WHY_CARDS = [
  {
    icon: Eye,
    title: 'It’s particles, not a color',
    text: 'Cloudy water is millions of tiny suspended particles — dead algae, fine dirt, body oils, scale — too small for your filter to grab on the first pass. The water isn’t stained; it’s full of stuff that hasn’t been removed yet.',
  },
  {
    icon: Gauge,
    title: 'Often the chemistry “looks fine”',
    text: 'This is the maddening part: your strip reads okay and it’s still cloudy. That usually means it’s circulation or a number the strip doesn’t show well — high calcium or pH pushing solids out of the water — not your chlorine.',
  },
  {
    icon: CloudRain,
    title: 'Florida stacks the deck',
    text: 'Heat, heavy bather loads, pollen, fresh plaster, and storms that dump runoff and swing your pH all cloud a pool fast. A summer pool in Tampa Bay is fighting cloud from several directions at once.',
  },
];

// The five real causes — dark diagnostic grid, the page's centerpiece for the
// "why is my pool cloudy" search. Order = roughly how often each is the culprit.
const CAUSE_CARDS = [
  {
    icon: Filter,
    title: '1. Filtration & circulation',
    text: 'The #1 cause. A dirty or undersized filter, a too-short run time, or poor flow means the water never fully turns over — so fine particles just keep floating. In Florida heat you often need the pump running far longer than people think.',
  },
  {
    icon: Gauge,
    title: '2. Chemistry out of balance',
    text: 'High pH, high total alkalinity, or high calcium hardness push minerals out of solution as a fine white haze — the classic “balanced but cloudy” pool. Brand-new plaster does the same thing as it cures.',
  },
  {
    icon: Zap,
    title: '3. Sanitizer can’t keep up',
    text: 'Low free chlorine — or chlorine “locked up” by too much stabilizer (CYA) — lets a haze of early algae and bacteria build before it ever goes green. The reading can look normal while the chlorine does almost nothing.',
  },
  {
    icon: Droplets,
    title: '4. Particles too fine to filter',
    text: 'Sometimes everything’s balanced and the filter’s clean, but the particles are just smaller than the filter can catch. This is what a clarifier or flocculant is for — clumping the fines so they can finally be removed.',
  },
  {
    icon: CloudRain,
    title: '5. Environmental overload',
    text: 'A pool party, a dust or pollen bloom, or a heavy storm can dump more debris and organics in than the system can clear in a day. The water clouds until filtration and sanitizer catch back up.',
  },
];

// "Balanced but cloudy" is the single most-searched frustration — give it a
// dedicated callout that points straight at the two usual culprits.
const BALANCED_POINTS = [
  'Check calcium hardness and pH — high levels turn the water hazy white even when chlorine and alkalinity look fine. A test strip barely shows calcium.',
  'Run the filter longer before blaming chemistry — a pool that only runs 6–8 hours in Florida summer often just isn’t turning the water over enough.',
  'Clean the filter element itself — a sand bed or cartridge that’s “done” lets fines pass straight back through, no matter what the numbers say.',
  'If it’s all dialed in and still cloudy, the particles are too fine to catch — that’s a clarifier-or-floc job, not more chlorine.',
];

// The clear-it-up plan — also the source for the HowTo JSON-LD below.
const TREATMENT_STEPS = [
  {
    title: 'Test the full panel',
    text: 'Not just chlorine and pH — we test calcium hardness, total alkalinity, and CYA too, because the cloud usually hides in one of those. The reading tells us which of the five causes we’re actually fixing.',
  },
  {
    title: 'Clean the filter & run it 24/7',
    text: 'We backwash or clean the element so it can actually grab particles, then run the pump non-stop. Continuous circulation is what physically pulls the cloud out — a timer schedule won’t clear an already-cloudy pool.',
  },
  {
    title: 'Correct the real culprit',
    text: 'Bring pH, alkalinity, and calcium back into range, and restore an effective free-chlorine level. Fix the number that’s causing the haze and the water often starts clearing on its own.',
  },
  {
    title: 'Clarify or floc the fines',
    text: 'For particles too small to filter, a clarifier clumps them so the filter can catch them, or a flocculant sinks them to the floor to be vacuumed. We pick based on how cloudy it is and how fast you need it clear.',
  },
  {
    title: 'Vacuum, retest & balance',
    text: 'We vacuum out anything the floc dropped, then retest and rebalance so the water comes back swim-ready — clear and sanitized, not just clear for a day.',
  },
];

// Clarifier vs flocculant — a real product-intent query ("clarifier vs floc"),
// answered as a tight 2-card comparison.
const COMPARE_CARDS = [
  {
    icon: Sparkles,
    title: 'Clarifier — slow & easy',
    points: [
      'Clumps fine particles into bigger ones your filter can catch',
      'The cloud clears through the filter over 1–3 days',
      'Low effort — no heavy vacuuming, pump stays on normally',
      'Best for mild, everyday haze you’re not in a rush to fix',
    ],
  },
  {
    icon: Waves,
    title: 'Flocculant — fast but hands-on',
    points: [
      'Sinks all the particles into a cloud on the pool floor',
      'Clears a badly cloudy pool in roughly a day',
      'High effort — you vacuum to waste (not through the filter)',
      'Best for heavy cloudiness when you need it clear now',
    ],
  },
];

// Page-specific FAQ — drives both the on-page accordion and the FAQPage JSON-LD.
const CLOUDY_FAQ = [
  {
    question: 'Why is my pool cloudy but the chemicals are fine?',
    answer:
      'Almost always filtration or a number your strip doesn’t show well. The two usual culprits are circulation — the filter is dirty or the pump isn’t running long enough to turn the water over — and high calcium hardness or pH, which push a fine white haze out of solution even when chlorine and alkalinity read normal. Clean the filter, run it 24/7, and test calcium and pH before adding anything.',
  },
  {
    question: 'How long does it take to clear a cloudy pool?',
    answer:
      'A mild haze usually clears in 24–48 hours once you balance the water, clean the filter, and run the pump non-stop. A clarifier works over 1–3 days; a flocculant can clear a badly cloudy pool in about a day but you have to vacuum it out afterward.',
  },
  {
    question: 'Is it safe to swim in a cloudy pool?',
    answer:
      'Best not to. Cloudy water can mean your sanitizer is overwhelmed, and — more importantly — if you can’t clearly see the bottom, it’s a real drowning hazard because a swimmer in trouble can be hidden. Get it clear and chlorine back to 1–4 ppm first.',
  },
  {
    question: 'Will shock clear a cloudy pool?',
    answer:
      'Only if low or ineffective chlorine is the cause. Shocking kills algae and burns off organics, which helps a sanitizer-driven cloud — but if the problem is filtration or high calcium, shock won’t fix it. Diagnose first; don’t just keep pouring chlorine in.',
  },
  {
    question: 'My pool went cloudy right after a storm — why?',
    answer:
      'Heavy Florida rain dilutes your chlorine, swings your pH, and washes in dirt, phosphates, and organic debris all at once — more than the filter and sanitizer can clear in a day. Test and rebalance after any big storm, clean the filter, and run the pump continuously until it clears.',
  },
  {
    question: 'Clarifier or flocculant — which should I use?',
    answer:
      'Use a clarifier for everyday mild cloudiness — it clumps the fines so your filter catches them over a day or two with little effort. Use a flocculant for heavy cloudiness you need gone fast: it sinks everything to the floor in about a day, but you have to vacuum it to waste afterward.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to clear a cloudy pool',
  description:
    'How to clear cloudy swimming pool water — test the full chemistry panel, clean the filter and run it continuously, correct pH, alkalinity, calcium and chlorine, clarify or flocculate the fine particles, then vacuum and retest. From Suncoast Pool Pros in St. Petersburg, FL.',
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
  mainEntity: CLOUDY_FAQ.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const CloudyPoolWaterPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'Cloudy Pool Water? What Causes It & How to Clear It Fast',
    description:
      'Pool cloudy but the chemicals seem fine? The 5 real causes — filtration, balance, chlorine — and how to clear a cloudy pool fast. From St. Pete pool pros.',
    canonicalPath: '/pool-care/cloudy-pool-water/',
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
        { name: 'Cloudy Pool Water', path: '/pool-care/cloudy-pool-water/' },
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

      <div className="absolute top-0 inset-x-0 h-[520px] pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[520px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <Droplets className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">Cloudy &amp; Hazy Water</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Cloudy pool water? Here&rsquo;s how to clear it.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            Cloudy water comes down to five causes &mdash; and the trick is fixing the right one
            instead of dumping in more chemicals. Here&rsquo;s how to tell which it is, the fix in the
            order that works, and whether you need a clarifier or a flocculant.
          </p>
        </section>

        {/* ── 1. What cloudy water is — light band, 3-card grid ────── */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                What Cloudy Water Is
              </span>
              <h2 className="font-display font-bold text-[#0a1628] text-3xl sm:text-4xl leading-tight mb-3">
                It&rsquo;s not a stain &mdash; it&rsquo;s stuff in the water
              </h2>
              <p className="text-slate-600 leading-relaxed">
                A hazy pool is full of fine particles that haven&rsquo;t been removed yet. Three things
                decide whether they clear or hang there clouding the water.
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

        {/* ── 2. The five causes — dark grid (diagnostic centerpiece) ── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Why Pools Go Cloudy
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                The five real causes
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Nearly every cloudy pool traces back to one of these. Figure out which one you&rsquo;ve
                got and you stop wasting chemicals on the wrong fix.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {CAUSE_CARDS.map((card, i) => (
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

        {/* ── "Balanced but cloudy" — the most-searched frustration ─── */}
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
                      Cloudy But Chemicals Fine?
                    </span>
                    <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight">
                      The number your test strip is hiding
                    </h2>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">
                  If chlorine and pH read fine and it&rsquo;s still hazy, stop adding chlorine &mdash;
                  the cause is almost always one of these instead. Work down the list before you reach
                  for another chemical.
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {BALANCED_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-gray-200 text-[15px] leading-snug">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* ── 3. The clear-it-up plan — step timeline (centerpiece) ── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Cloudy To Clear
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                The fix, in the order that works
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Five steps, every time. Do them in this order and most cloudy pools are crystal clear
                again within a day or two.
              </p>
            </div>

            <ol className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
              {TREATMENT_STEPS.map((step, i) => {
                const StepIcon = [TestTube, Filter, Gauge, Sparkles, Waves][i];
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

            {/* Cross-link: dosing clarifier/floc and balancing needs the pool's gallons. */}
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
                    Need your pool&rsquo;s gallons to dose it right?
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

        {/* ── Clarifier vs flocculant — product-intent comparison ──── */}
        <section className="pb-16 sm:pb-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 max-w-2xl mx-auto">
                <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  Which Product
                </span>
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight mb-3">
                  Clarifier vs. flocculant
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  Both gather the fine particles a filter can&rsquo;t catch &mdash; the difference is
                  speed versus effort. Here&rsquo;s when to reach for each.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {COMPARE_CARDS.map((card, i) => (
                  <m.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                        <card.icon className="w-5 h-5 text-brand-orange" />
                      </span>
                      <h3 className="text-white font-display font-bold text-lg leading-tight">
                        {card.title}
                      </h3>
                    </div>
                    <ul className="space-y-2.5">
                      {card.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-gray-300 text-[14px] leading-snug">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </m.div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ── If it won't clear — internal-link band to related guides ── */}
        <section className="pb-16 sm:pb-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 max-w-2xl mx-auto">
                <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  If It Won&rsquo;t Clear
                </span>
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight mb-3">
                  When cloudy is a symptom of something else
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  A pool that stays hazy no matter what you do usually has a driver underneath. These
                  two are the ones to rule out next.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  to="/pool-care/green-pool"
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-colors p-5"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                    <Sprout className="w-5 h-5 text-brand-orange" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-white font-semibold text-[15px] leading-tight">
                      Cloudy turning green
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                    </span>
                    <span className="block text-gray-400 text-sm mt-1 leading-relaxed">
                      A cloudy pool with a green tint is an algae bloom getting started. See the green
                      pool rescue guide.
                    </span>
                  </span>
                </Link>

                <Link
                  to="/pool-care/cyanuric-acid"
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-colors p-5"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-brand-orange" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-white font-semibold text-[15px] leading-tight">
                      Chlorine that does nothing
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                    </span>
                    <span className="block text-gray-400 text-sm mt-1 leading-relaxed">
                      Too much stabilizer locks up your chlorine, so a haze builds at a &ldquo;normal&rdquo;
                      reading. See the cyanuric acid guide.
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
                  Cloudy pool questions, answered
                </h2>
                <p className="text-gray-400">
                  The questions homeowners ask most about cloudy water.{' '}
                  <a href="/faq" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {CLOUDY_FAQ.map((faq) => {
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

        {/* Closing CTA — cloudy-pool searchers are high-intent, so offer to take it on */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Rather just have it handled?
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                We clear cloudy pools across St. Petersburg and the Tampa Bay area &mdash; and keep the
                water crystal clear with weekly service for one flat rate.
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

export const CloudyPoolWaterPage = () => (
  <QuoteSheetProvider>
    <CloudyPoolWaterPageInner />
  </QuoteSheetProvider>
);
