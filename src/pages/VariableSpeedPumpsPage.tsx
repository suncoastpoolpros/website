import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import {
  Zap,
  Gauge,
  Waves,
  Timer,
  TrendingDown,
  Volume2,
  Wrench,
  ShieldCheck,
  DollarSign,
  Calculator,
  ArrowRight,
  Plus,
  Star,
  BookOpen,
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

// The science — why a single-speed pump quietly drains the wallet (light band).
const SCIENCE_CARDS = [
  {
    icon: Gauge,
    title: 'Power follows the cube of speed',
    text: 'A pool pump is a centrifugal pump, so its power draw scales with the cube of motor speed. Slow it to half speed and it pulls just one-eighth the watts. That single fact is where all the savings come from.',
  },
  {
    icon: Waves,
    title: 'Flow only drops in step',
    text: 'Cut the speed in half and you move half the water per minute — so you run about twice as long to turn the pool over once. Power down 8×, time up 2×: the same clean water for roughly a quarter of the energy.',
  },
  {
    icon: Zap,
    title: 'Single-speed only knows full blast',
    text: 'An old single-speed pump has one setting: 100%. It roars at full power whether it’s vacuuming the pool or just gently skimming on a quiet Tuesday — burning peak wattage every hour it runs.',
  },
  {
    icon: Timer,
    title: 'Your pool rarely needs the surge',
    text: 'Day to day, a pool only needs slow, steady circulation to skim and filter. High flow is for short jobs — vacuuming, heating, running a spa or water feature. A variable-speed pump gives you the surge only when you ask for it.',
  },
];

// Beyond the dollar savings (brand-blue accent cards).
const BENEFIT_CARDS = [
  {
    icon: Volume2,
    title: 'Noticeably quieter',
    text: 'At low RPM a variable-speed pump is a quiet hum instead of a constant roar. If your equipment pad sits near a lanai, a bedroom window, or a neighbor, that alone is worth it.',
  },
  {
    icon: Waves,
    title: 'Cleaner, clearer water',
    text: 'Slow, steady flow gives your filter more contact time and avoids the channeling you get at full blast. Many owners see clearer water running long-and-low than a single-speed run hard and short.',
  },
  {
    icon: Wrench,
    title: 'Equipment that lasts longer',
    text: 'Gentler starts and lower running speeds mean less heat and stress on the motor, plumbing, and filter. A pump that loafs along most of the day simply wears out more slowly.',
  },
  {
    icon: ShieldCheck,
    title: 'Basically the standard now',
    text: 'Since July 2021 a U.S. Department of Energy rule has effectively required variable- or two-speed motors on most replacement pool pumps above 1.1 total HP. Replace a big single-speed today and you’re getting a VSP anyway — so you may as well capture the savings.',
  },
];

// A reference sample of real pool pumps for the comparison table — variable-
// speed models plus the common single-speeds people are usually replacing.
// `hp` is the size key into KW_BY_HP: a single-speed's own HP, or the
// comparable single-speed a VSP would replace (used to estimate running cost).
// `pick` flags the few we'd steer a neighbor toward. Not exhaustive, not an
// endorsement — the conversion goal is weekly pool service, not pump sales.
type PumpRow = {
  brand: string;
  model: string;
  type: 'Variable' | 'Single';
  size: string;
  hp: number;
  bestFor: string;
  pick?: boolean;
};

const PUMP_LIST: PumpRow[] = [
  // Variable-speed
  { brand: 'Pentair', model: 'SuperFlo VS', type: 'Variable', size: '1.5 THP', hp: 1.5, bestFor: 'Small-to-mid pools, easy drop-in', pick: true },
  { brand: 'Hayward', model: 'MaxFlo VS', type: 'Variable', size: '1.65 THP', hp: 1.5, bestFor: 'Small-to-mid pools, value' },
  { brand: 'Hayward', model: 'Super Pump VS', type: 'Variable', size: '1.65 THP', hp: 1.5, bestFor: 'Drop-in for a Super Pump' },
  { brand: 'Jandy', model: 'VS FloPro', type: 'Variable', size: '1.65 THP', hp: 1.5, bestFor: 'Compact and budget-friendly' },
  { brand: 'Hayward', model: 'TriStar VS', type: 'Variable', size: '2.7 THP', hp: 2.5, bestFor: 'Standard-to-large pools', pick: true },
  { brand: 'Jandy', model: 'VS PlusHP', type: 'Variable', size: '2.7 THP', hp: 2.5, bestFor: 'High-head plumbing, spa jets' },
  { brand: 'Waterway', model: 'Power Defender 270', type: 'Variable', size: '2.7 THP', hp: 2.5, bestFor: 'Full-size, value pick' },
  { brand: 'Pentair', model: 'IntelliFlo3 VSF', type: 'Variable', size: '3.0 THP', hp: 3, bestFor: 'Large pools, features, pool + spa', pick: true },
  // Single-speed — for reference / to find what you've probably got now
  { brand: 'Hayward', model: 'Super Pump', type: 'Single', size: '1 HP', hp: 1, bestFor: 'Common older pump' },
  { brand: 'Hayward', model: 'Super Pump', type: 'Single', size: '1.5 HP', hp: 1.5, bestFor: 'Very common older pump' },
  { brand: 'Pentair', model: 'SuperFlo', type: 'Single', size: '1.5 HP', hp: 1.5, bestFor: 'Very common older pump' },
  { brand: 'Hayward', model: 'Super II', type: 'Single', size: '2 HP', hp: 2, bestFor: 'High-flow older pump' },
  { brand: 'Pentair', model: 'WhisperFlo', type: 'Single', size: '2 HP', hp: 2, bestFor: 'Larger older pump' },
];

const PUMP_FILTERS = [
  { id: 'variable', label: 'Variable-speed' },
  { id: 'single', label: 'Single-speed' },
  { id: 'all', label: 'All' },
] as const;
type PumpFilter = (typeof PUMP_FILTERS)[number]['id'];

// Page-specific FAQ — drives the accordion and the FAQPage JSON-LD.
const VSP_FAQ = [
  {
    question: 'How much does a variable speed pump actually save?',
    answer:
      'It depends on your pump size, how long you run it, and your power rate — but most Florida pool owners save somewhere between $400 and $1,200 a year, often cutting pump electricity by around 70–80%. Use the calculator above with your own numbers to get a realistic figure.',
  },
  {
    question: 'Are variable speed pumps worth it?',
    answer:
      'For almost any pool that runs daily, yes. The pump is usually the second-biggest electricity user in a home after the air conditioner, and a variable-speed pump attacks the largest, most controllable part of that. The energy savings typically cover the price difference in one to three years, and the pump keeps saving long after.',
  },
  {
    question: 'How long until it pays for itself?',
    answer:
      'A variable-speed pump costs a few hundred dollars more than a comparable single-speed, plus install. At $500–$1,000 a year in savings, most pay back the difference in roughly one to three years — and Florida utilities sometimes offer rebates that shorten that further.',
  },
  {
    question: 'Do I have to run it 24/7?',
    answer:
      'No. The usual setup is a long, low-speed circulation block for filtering and skimming, plus a short higher-speed burst for vacuuming, heating, or running a spa. Once it’s programmed to your pool, it runs that schedule automatically — you never touch it.',
  },
  {
    question: 'Are single-speed pumps still legal?',
    answer:
      'You can keep running an existing single-speed pump, but as of July 2021 a federal Department of Energy efficiency rule effectively blocks the sale of most new single-speed pumps above 1.1 total HP. In practice, when it’s time to replace a larger pump, the replacement will be variable- or two-speed.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: VSP_FAQ.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Variable Speed Pool Pumps: How Much They Save',
  description:
    'Why a variable-speed pool pump cuts pump electricity by around 70–80% — the pump affinity laws behind the savings, the extra benefits, and a calculator to estimate your own annual savings.',
  about: ['Variable speed pool pump', 'Pool energy savings', 'Pool equipment', 'Pump affinity laws'],
};

// Typical single-speed motor draw (kW) by nameplate HP — used by the calculator.
const HP_OPTIONS = [1, 1.5, 2, 2.5];
const KW_BY_HP: Record<number, number> = { 0.75: 1.1, 1: 1.5, 1.5: 1.9, 2: 2.3, 2.5: 2.7, 3: 3.0 };

// A variable-speed pump uses ~75% less energy for the same daily turnover —
// the figure the affinity laws predict (energy ∝ speed²; half speed → a quarter
// of the energy) and where most real-world installs land.
const VSP_SAVINGS_FRACTION = 0.75;

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const VariableSpeedPumpsPageInner = () => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const { open: openQuoteSheet } = useQuoteSheet();
  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  // Interactive savings calculator. These defaults render identically on the
  // server and the first client paint, so hydration matches (no React #418).
  const [rate, setRate] = useState(0.15); // $/kWh — Florida average-ish
  const [hp, setHp] = useState(1.5); // single-speed nameplate HP
  const [hours, setHours] = useState(8); // single-speed daily run hours

  const singleKw = KW_BY_HP[hp] ?? 1.9;
  const singleAnnual = singleKw * hours * 365 * rate;
  const vspAnnual = singleAnnual * (1 - VSP_SAVINGS_FRACTION);
  const annualSavings = singleAnnual - vspAnnual;

  // Comparison table — filter + per-pump running cost, driven by the same rate
  // and run-hours the calculator above uses, so the whole page stays in sync.
  const [pumpFilter, setPumpFilter] = useState<PumpFilter>('variable');
  const visiblePumps = PUMP_LIST.filter((p) =>
    pumpFilter === 'all' ? true : pumpFilter === 'variable' ? p.type === 'Variable' : p.type === 'Single',
  );
  const pumpCost = (p: PumpRow) => {
    const skw = KW_BY_HP[p.hp] ?? 1.9;
    // VSP gets the same turnover for ~25% of a comparable single-speed's energy.
    const annual = skw * hours * (p.type === 'Variable' ? 1 - VSP_SAVINGS_FRACTION : 1) * 365 * rate;
    const save = p.type === 'Variable' ? skw * hours * VSP_SAVINGS_FRACTION * 365 * rate : null;
    return { annual, save };
  };

  usePageMeta({
    title: 'Variable Speed Pool Pumps, St. Petersburg FL | Save 70–80%',
    description:
      'A variable-speed pool pump cuts pump electricity 70–80% — often $600–$1,000/yr on St. Petersburg pools. See what you’d save with our free calculator.',
    canonicalPath: '/pool-care/variable-speed-pumps/',
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify([
      articleSchema,
      faqSchema,
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Pool Care', path: '/pool-care/' },
        { name: 'Variable Speed Pumps', path: '/pool-care/variable-speed-pumps/' },
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
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">Pool Equipment &amp; Energy</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            The single biggest way to cut your{' '}
            <span className="bg-gradient-to-r from-brand-blue-light via-cyan-300 to-brand-orange bg-clip-text text-transparent">
              pool’s electric bill
            </span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            Your pool pump is usually the second-hungriest thing in the house after the air
            conditioner. Swapping a single-speed pump for a variable-speed one is the rare upgrade
            that pays for itself — here’s the physics behind why, with a live savings calculator.
          </p>
        </section>

        {/* Pull stat */}
        <section className="pb-16">
          <Container>
            <div className="max-w-5xl mx-auto text-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 sm:py-12">
              <div className="font-display font-bold text-white leading-none text-5xl sm:text-6xl mb-4">
                ≈&nbsp;75%
              </div>
              <p className="text-gray-300 text-lg leading-relaxed max-w-xl mx-auto">
                less electricity a variable-speed pump uses to keep the same pool just as clean. On a
                typical St. Pete pool that’s often{' '}
                <span className="text-white font-semibold">$600–$1,000 off your power bill</span>{' '}
                every year — for doing nothing differently.
              </p>
            </div>
          </Container>
        </section>

        {/* ── 1. The science — light band, card grid ───────────────── */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                The Science
              </span>
              <h2 className="font-display font-bold text-[#0a1628] text-3xl sm:text-4xl leading-tight mb-3">
                Why a single-speed pump quietly drains your wallet
              </h2>
              <p className="text-slate-600 leading-relaxed">
                It comes down to one quirk of how pumps work — and it’s the same reason a fan on low
                sips power while a fan on high gulps it.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 max-w-5xl mx-auto">
              {SCIENCE_CARDS.map((card, i) => (
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

            {/* The math, stated plainly for the curious. */}
            <div className="max-w-5xl mx-auto mt-8 rounded-2xl border border-brand-blue/20 bg-brand-blue/[0.06] p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <TrendingDown className="w-[18px] h-[18px] text-brand-blue" />
                <h3 className="text-[#0a1628] font-display font-bold text-base">The math, in one line</h3>
              </div>
              <p className="text-slate-700 text-[15px] leading-relaxed">
                For the same daily turnover, energy use scales with the{' '}
                <span className="font-semibold">square of pump speed</span> &mdash; because{' '}
                <span className="font-semibold">power ∝ speed³</span> and{' '}
                <span className="font-semibold">time ∝ 1 ÷ speed</span>. Run at half speed and you use
                about a quarter of the electricity. Half the speed, a quarter of the bill.
              </p>
            </div>
          </Container>
        </section>

        {/* ── 2. The savings calculator ────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Your Savings
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                What a variable-speed pump would save you
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Three numbers from your own pool — your power rate, your pump size, and how long it
                runs — and you’ll see the difference a switch makes.
              </p>
            </div>

            <div className="max-w-5xl mx-auto rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              {/* Electricity rate */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <label htmlFor="rate-range" className="text-white font-semibold flex items-center gap-2">
                  <DollarSign className="w-[18px] h-[18px] text-brand-orange" />
                  Your electricity rate
                </label>
                <span className="font-display font-bold text-white text-2xl tabular-nums">
                  ${rate.toFixed(2)}{' '}
                  <span className="text-gray-500 text-base font-sans font-normal">/ kWh</span>
                </span>
              </div>
              <input
                id="rate-range"
                type="range"
                min={0.1}
                max={0.3}
                step={0.01}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-brand-orange cursor-pointer"
                aria-label="Electricity rate in dollars per kilowatt-hour"
              />
              <div className="flex justify-between text-[11px] text-gray-500 mb-6 px-0.5">
                <span>$0.10</span>
                <span>$0.20</span>
                <span>$0.30</span>
              </div>

              {/* Pump size */}
              <div className="mb-6">
                <span className="text-white font-semibold flex items-center gap-2 mb-3">
                  <Gauge className="w-[18px] h-[18px] text-brand-orange" />
                  Your current pump size
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {HP_OPTIONS.map((opt) => {
                    const active = hp === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setHp(opt)}
                        aria-pressed={active}
                        className={`rounded-xl border py-3 text-center font-display font-bold tabular-nums transition-colors ${
                          active
                            ? 'border-brand-orange bg-brand-orange/[0.12] text-white'
                            : 'border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/[0.05]'
                        }`}
                      >
                        {opt} <span className="text-xs font-sans font-normal">HP</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily run hours */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <label htmlFor="hours-range" className="text-white font-semibold flex items-center gap-2">
                  <Timer className="w-[18px] h-[18px] text-brand-orange" />
                  Hours you run it per day
                </label>
                <span className="font-display font-bold text-white text-2xl tabular-nums">
                  {hours} <span className="text-gray-500 text-base font-sans font-normal">hrs</span>
                </span>
              </div>
              <input
                id="hours-range"
                type="range"
                min={4}
                max={12}
                step={1}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full accent-brand-orange cursor-pointer"
                aria-label="Hours the pump runs per day"
              />
              <div className="flex justify-between text-[11px] text-gray-500 mb-8 px-0.5">
                <span>4</span>
                <span>8</span>
                <span>12</span>
              </div>

              {/* Results */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Single-speed
                  </div>
                  <div className="font-display font-bold text-white text-2xl tabular-nums">
                    {usd(singleAnnual)}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">per year</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Variable-speed
                  </div>
                  <div className="font-display font-bold text-white text-2xl tabular-nums">
                    {usd(vspAnnual)}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">per year</div>
                </div>
                <div className="rounded-2xl border border-brand-orange/40 bg-brand-orange/[0.1] p-4 text-center">
                  <div className="text-brand-orange-light text-xs font-semibold uppercase tracking-wider mb-1.5">
                    You’d save
                  </div>
                  <div className="font-display font-bold text-white text-2xl tabular-nums">
                    {usd(annualSavings)}
                  </div>
                  <div className="text-brand-orange-light/70 text-xs mt-0.5">every year</div>
                </div>
              </div>

              <p className="text-center text-gray-300 text-[15px] mt-5">
                That’s about{' '}
                <span className="text-white font-semibold">{usd(annualSavings * 5)}</span> over 5 years
                — and <span className="text-white font-semibold">{usd(annualSavings * 10)}</span> over 10.
              </p>

              <p className="text-gray-500 text-xs mt-4 text-center max-w-2xl mx-auto leading-relaxed">
                Assumes a variable-speed pump uses about 75% less electricity than a single-speed for
                the same daily turnover — the figure the affinity laws above predict and most installs
                land near. Single-speed wattage is estimated from typical motor draw at each size; your
                real savings depend on your pump, schedule, and rate.
              </p>
            </div>

            {/* Cross-link to the heating cost calculator (same energy theme). */}
            <Link
              to="/tools/pool-heating-cost-calculator/"
              className="max-w-5xl mx-auto mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors p-5 group"
            >
              <span className="flex items-center gap-4 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-brand-blue-light" />
                </span>
                <span className="min-w-0">
                  <span className="block text-white font-semibold text-[15px] leading-tight">
                    Heating the pool too?
                  </span>
                  <span className="block text-gray-400 text-sm mt-0.5">
                    See what it costs to warm your pool with our free heating-cost calculator.
                  </span>
                </span>
              </span>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </Container>
        </section>

        {/* ── 3. Compare the pumps — filterable reference table ────── */}
        <section className="py-16 sm:py-20 bg-white/[0.015] border-y border-white/[0.06]">
          <Container>
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Compare The Pumps
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                How the popular pumps stack up
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Running costs use the rate and run-time you set in the calculator above. Switch to{' '}
                <span className="text-white">single-speed</span> to find what you’ve probably got now —
                then see the gap. <span className="text-brand-orange-light">★</span> marks our picks.
              </p>
            </div>

            <div className="max-w-5xl mx-auto mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
                {PUMP_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPumpFilter(f.id)}
                    aria-pressed={pumpFilter === f.id}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-[13px] sm:text-sm font-semibold transition-colors ${
                      pumpFilter === f.id
                        ? 'bg-brand-orange text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="text-gray-500 text-xs tabular-nums">
                at ${rate.toFixed(2)}/kWh · {hours} hrs/day
              </span>
            </div>

            <div className="max-w-5xl mx-auto overflow-hidden rounded-3xl border border-white/10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.05] text-gray-300 text-[11px] sm:text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6 font-semibold">Pump</th>
                    <th className="py-3.5 px-2 sm:px-4 font-semibold">Size</th>
                    <th className="py-3.5 px-2 sm:px-4 font-semibold">Est. cost/yr</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold">Save vs 1-speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {visiblePumps.map((p) => {
                    const { annual, save } = pumpCost(p);
                    return (
                      <tr
                        key={`${p.brand}-${p.model}-${p.size}`}
                        className="bg-white/[0.015] hover:bg-white/[0.04] transition-colors align-top"
                      >
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="flex items-center gap-1.5">
                            {p.pick && (
                              <Star className="w-3.5 h-3.5 text-brand-orange fill-brand-orange shrink-0" />
                            )}
                            <span className="text-white font-semibold text-[14px] sm:text-[15px] leading-tight">
                              {p.brand} {p.model}
                            </span>
                          </span>
                          <span className="block text-gray-500 text-xs mt-0.5">{p.bestFor}</span>
                        </td>
                        <td className="py-3.5 px-2 sm:px-4 align-middle">
                          <span className="block text-gray-200 text-sm font-semibold tabular-nums leading-tight">
                            {p.size}
                          </span>
                          <span
                            className={`block text-[10px] uppercase tracking-wider ${
                              p.type === 'Variable' ? 'text-brand-blue-light' : 'text-gray-500'
                            }`}
                          >
                            {p.type === 'Variable' ? 'Variable · ENERGY STAR' : 'Single-speed'}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 sm:px-4 align-middle text-white font-semibold tabular-nums">
                          {usd(annual)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 align-middle tabular-nums">
                          {save !== null ? (
                            <span className="text-brand-orange-light font-semibold">{usd(save)}</span>
                          ) : (
                            <span className="text-gray-600">— baseline</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* The authoritative bit — how to read a pump spec and what's real */}
            <div className="max-w-5xl mx-auto mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7">
              <div className="flex items-center gap-2.5 mb-4">
                <BookOpen className="w-[18px] h-[18px] text-brand-orange shrink-0" />
                <h3 className="text-white font-display font-bold text-lg">How to actually compare pool pumps</h3>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 text-[14px] text-gray-300 leading-relaxed">
                <li>
                  <span className="text-white font-semibold">THP, not HP.</span> Since the DOE’s July
                  2021 rule, pumps are rated by <span className="text-white">total horsepower</span> on a
                  standardized test — the old “HP” number was mostly marketing. Match THP to your pool,
                  not a bigger-is-better hunch.
                </li>
                <li>
                  <span className="text-white font-semibold">WEF is the efficiency score.</span> The
                  Weighted Energy Factor (higher is better) is the standardized DOE/ENERGY STAR number
                  for how efficiently a pump moves water — the one spec worth comparing head-to-head.
                </li>
                <li>
                  <span className="text-white font-semibold">Flow &amp; watts are curves, not one
                  number.</span> GPM and wattage change with the speed you run and your plumbing’s
                  resistance — a 2.7 THP pump might pull ~2,000 W wide-open but only ~150 W loafing on
                  low. That low range is where the savings live.
                </li>
                <li>
                  <span className="text-white font-semibold">Look for the ENERGY STAR label.</span> Every
                  variable-speed pump above is ENERGY STAR certified — which is also what unlocks most
                  Florida utility rebates.
                </li>
              </ul>
              <p className="mt-5 pt-4 border-t border-white/10 text-gray-500 text-xs leading-relaxed">
                Specs from manufacturer data sheets (Pentair, Hayward, Jandy, Waterway) and the ENERGY
                STAR certified pool-pump database; efficiency rules per the U.S. Department of Energy
                Dedicated-Purpose Pool Pump standard (effective July 2021). “Est. cost/yr” and “Save vs
                1-speed” are modeled from the calculator above (≈75% less energy for the same turnover)
                — a realistic estimate, not a meter reading. A reference sample, not the whole market,
                and not an endorsement of any one model.
              </p>
            </div>
          </Container>
        </section>

        {/* ── 4. Beyond the savings (brand-blue accent) ────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Beyond the Savings
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                The bill is just the start
              </h2>
              <p className="text-gray-400 leading-relaxed">
                The lower power draw gets the headlines, but the everyday upgrades are what owners end
                up loving most.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 max-w-5xl mx-auto">
              {BENEFIT_CARDS.map((card, i) => (
                <m.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-brand-blue/20 bg-brand-blue/[0.04] p-6 hover:bg-brand-blue/[0.08] transition-colors"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center mb-4">
                    <card.icon className="w-5 h-5 text-brand-blue-light" />
                  </span>
                  <h3 className="text-white font-display font-bold text-lg mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-[15px] leading-relaxed">{card.text}</p>
                </m.div>
              ))}
            </div>

            <p className="max-w-3xl mx-auto mt-8 text-center text-gray-500 text-xs leading-relaxed">
              Sources: pump affinity laws (centrifugal pump theory); U.S. Department of Energy
              Dedicated-Purpose Pool Pump conservation standard, effective July 2021; ENERGY STAR pool
              pump program. Dollar figures are estimates — your actual savings depend on pump size, run
              time, and local electricity rates.
            </p>
          </Container>
        </section>

        {/* ── Quick answers — FAQ accordion ────────────────────────── */}
        <section className="pb-16 sm:pb-20">
          <Container>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                  Variable-speed pumps, answered
                </h2>
                <p className="text-gray-400">
                  The questions homeowners ask most before they upgrade.{' '}
                  <a href="/faq/" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {VSP_FAQ.map((faq) => {
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
                            isOpen ? 'rotate-45 text-brand-orange' : ''
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

              {/* Back to the pool-care hub for the rest of the guides. */}
              <Link
                to="/pool-care/"
                className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors p-5 group"
              >
                <span className="flex items-center gap-4 min-w-0">
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                    <Waves className="w-5 h-5 text-brand-blue-light" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-white font-semibold text-[15px] leading-tight">
                      More pool-care guides
                    </span>
                    <span className="block text-gray-400 text-sm mt-0.5">
                      Water chemistry, green-pool rescue, and the numbers that keep a pool clear.
                    </span>
                  </span>
                </span>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </div>
          </Container>
        </section>

        {/* Closing CTA — pivot from pump topic to weekly pool service */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                A new pump won’t balance your water.
              </h2>
              <p className="text-gray-400 mb-7 max-w-lg mx-auto">
                The other half of a cheap, low-hassle pool is chemistry that’s right every week —
                tested, balanced, and cleaned so the water’s always swim-ready and your equipment
                lasts. That’s what we do across St. Petersburg and Tampa Bay, for one flat monthly rate.
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

export const VariableSpeedPumpsPage = () => (
  <QuoteSheetProvider>
    <VariableSpeedPumpsPageInner />
  </QuoteSheetProvider>
);
