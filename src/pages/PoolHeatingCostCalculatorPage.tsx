import React, { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Phone,
  MessageSquare,
  Info,
  Thermometer,
  Clock,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// ── Heating physics ───────────────────────────────────────────────
// Energy to raise a body of water:  BTU = gallons × 8.34 lb/gal × ΔT°F
// (1 BTU raises 1 lb of water 1°F; water ≈ 8.34 lb/US gallon.)
const LB_PER_GAL = 8.34;
const BTU_PER_THERM = 100_000; // 1 therm of natural gas = 100,000 BTU
const BTU_PER_KWH = 3412; // 1 kWh = 3,412 BTU

// Real-world efficiencies / performance.
//  - Gas heaters lose ~15–20% up the flue; 0.82 is a fair modern average.
//  - A heat pump's COP (heat moved ÷ electricity used) is high in warm FL air;
//    ~5.0 is realistic for Florida's climate (it drops in cold air, but FL
//    pool season rarely runs the pump in the cold).
const GAS_EFFICIENCY = 0.82;
const HEAT_PUMP_COP = 5.0;

// Typical equipment sizing, used for the "hours to heat" estimate.
const GAS_BTU_PER_HR = 400_000; // common residential gas heater output
const HEAT_PUMP_BTU_PER_HR = 120_000; // common ~140k-BTU heat pump, derated

// Florida residential energy averages (editable by the user). Dated so it's
// clearly an estimate — update the note if these are refreshed.
const DEFAULT_GAS_PRICE = 1.8; // $ per therm
const DEFAULT_KWH_PRICE = 0.14; // $ per kWh
const RATES_AS_OF = 'mid-2026';

type HeaterKey = 'gas' | 'heatPump';

type Result = {
  key: HeaterKey;
  label: string;
  cost: number;
  hours: number;
  detail: string;
};

const clampNum = (v: string, min: number, max: number): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const fmtMoney = (n: number): string =>
  n >= 100 ? `$${Math.round(n)}` : `$${n.toFixed(2)}`;

const fmtHours = (h: number): string => {
  if (h < 1) return `${Math.round(h * 60)} min`;
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins ? `${whole} hr ${mins} min` : `${whole} hr`;
};

// ── FAQ (drives both the on-page accordion and the FAQPage JSON-LD) ──
const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much does it cost to heat a pool in Florida?',
    a: 'It depends on pool size, how many degrees you want to raise the water, and your heater type. A typical 15,000-gallon pool heated about 10°F costs roughly $20–$30 in natural gas, or a few dollars in electricity with a heat pump — because a heat pump moves about five times more heat than the electricity it consumes. Use the calculator above for your exact numbers.',
  },
  {
    q: 'Is a gas heater or a heat pump cheaper to run?',
    a: "For day-to-day heating in Florida's warm climate, an electric heat pump is far cheaper to operate — often 3–5× less than natural gas — because it moves existing heat from the air rather than burning fuel. Gas heaters cost more per hour but heat faster, so they suit owners who want the pool warm on short notice. The calculator compares both side by side.",
  },
  {
    q: 'How long does it take to heat a pool?',
    a: 'A gas heater (~400,000 BTU) typically raises a 15,000-gallon pool about 1–1.5°F per hour. A heat pump is slower — roughly 0.3–0.5°F per hour — but costs far less to run. To go from 72°F to 86°F, expect a few hours on gas or most of a day on a heat pump.',
  },
  {
    q: 'How is the heating cost calculated?',
    a: 'Energy needed = gallons × 8.34 × the temperature rise in °F (BTU). For gas we divide by 100,000 BTU per therm and an ~82% efficiency, then multiply by your gas price. For a heat pump we divide by 3,412 BTU per kWh and a COP of about 5 (heat moved per unit of electricity), then multiply by your electricity price. These are estimates — real results vary with weather, wind, and whether you use a cover.',
  },
];

const PoolHeatingCostCalculatorInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();

  usePageMeta({
    title: 'Pool Heating Cost Calculator — Gas vs. Heat Pump (Florida)',
    description:
      'Free pool heating cost calculator — enter pool size and target temp to compare gas heater vs. electric heat pump costs. Built by Florida pool pros.',
    canonicalPath: '/tools/pool-heating-cost-calculator/',
  });

  usePageSchema();

  const [gallons, setGallons] = useState('15000');
  const [startTemp, setStartTemp] = useState('72');
  const [targetTemp, setTargetTemp] = useState('86');
  const [gasPrice, setGasPrice] = useState(String(DEFAULT_GAS_PRICE));
  const [kwhPrice, setKwhPrice] = useState(String(DEFAULT_KWH_PRICE));
  const [showMath, setShowMath] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const results = useMemo<Result[] | null>(() => {
    const gal = clampNum(gallons, 100, 500_000);
    const t0 = clampNum(startTemp, 32, 110);
    const t1 = clampNum(targetTemp, 32, 110);
    const deltaT = t1 - t0;
    if (deltaT <= 0) return null;

    const btu = gal * LB_PER_GAL * deltaT;

    const gp = clampNum(gasPrice, 0, 50);
    const kp = clampNum(kwhPrice, 0, 5);

    const therms = btu / BTU_PER_THERM / GAS_EFFICIENCY;
    const gasCost = therms * gp;
    const gasHours = btu / (GAS_BTU_PER_HR * GAS_EFFICIENCY);

    const kwh = btu / BTU_PER_KWH / HEAT_PUMP_COP;
    const hpCost = kwh * kp;
    const hpHours = btu / HEAT_PUMP_BTU_PER_HR;

    return [
      {
        key: 'heatPump',
        label: 'Electric Heat Pump',
        cost: hpCost,
        hours: hpHours,
        detail: `${kwh.toFixed(1)} kWh @ ${fmtMoney(kp)}/kWh · COP ${HEAT_PUMP_COP}`,
      },
      {
        key: 'gas',
        label: 'Natural Gas Heater',
        cost: gasCost,
        hours: gasHours,
        detail: `${therms.toFixed(1)} therms @ ${fmtMoney(gp)}/therm · ${Math.round(
          GAS_EFFICIENCY * 100,
        )}% eff.`,
      },
    ];
  }, [gallons, startTemp, targetTemp, gasPrice, kwhPrice]);

  const deltaInvalid =
    clampNum(targetTemp, 32, 110) - clampNum(startTemp, 32, 110) <= 0;

  // Cheapest option for the highlight badge.
  const cheapest = results
    ? results.reduce((a, b) => (a.cost <= b.cost ? a : b))
    : null;

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  const inputCls =
    'w-full px-4 py-3 bg-[#0a1628]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 text-base focus:outline-none focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/50 transition';
  const labelCls =
    'block text-[13px] font-semibold text-gray-300 mb-1.5';

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-50 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[460px] pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[500px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5">
            <Flame className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">
              Free Pool Tool
            </span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.25rem] leading-[1.05] tracking-tight mb-5">
            Pool Heating Cost Calculator
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            Estimate what it costs — and how long it takes — to heat your pool
            with a gas heater versus an electric heat pump. Built by Florida pool
            pros. Free, no email required.
          </p>
        </section>

        {/* Calculator */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label htmlFor="gallons" className={labelCls}>
                  Pool volume (gallons)
                </label>
                <input
                  id="gallons"
                  inputMode="numeric"
                  value={gallons}
                  onChange={(e) => setGallons(e.target.value.replace(/[^0-9]/g, ''))}
                  className={inputCls}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Not sure?{' '}
                  <a
                    href="/tools/pool-volume-calculator"
                    className="text-brand-blue-light hover:text-white underline underline-offset-2"
                  >
                    Use our pool volume calculator
                  </a>
                  .
                </p>
              </div>

              <div>
                <label htmlFor="startTemp" className={labelCls}>
                  Current temp (°F)
                </label>
                <input
                  id="startTemp"
                  inputMode="numeric"
                  value={startTemp}
                  onChange={(e) => setStartTemp(e.target.value.replace(/[^0-9]/g, ''))}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="targetTemp" className={labelCls}>
                  Target temp (°F)
                </label>
                <input
                  id="targetTemp"
                  inputMode="numeric"
                  value={targetTemp}
                  onChange={(e) => setTargetTemp(e.target.value.replace(/[^0-9]/g, ''))}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="kwhPrice" className={labelCls}>
                  Electricity price ($/kWh)
                </label>
                <input
                  id="kwhPrice"
                  inputMode="decimal"
                  value={kwhPrice}
                  onChange={(e) => setKwhPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="gasPrice" className={labelCls}>
                  Natural gas price ($/therm)
                </label>
                <input
                  id="gasPrice"
                  inputMode="decimal"
                  value={gasPrice}
                  onChange={(e) => setGasPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  className={inputCls}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Prices prefilled with Florida residential averages ({RATES_AS_OF}).
              Edit them to match your utility bill.
            </p>

            {/* Results */}
            <div className="mt-7 pt-7 border-t border-white/[0.06]">
              {deltaInvalid ? (
                <p className="text-center text-gray-400 text-sm py-4">
                  Set a target temperature higher than the current temperature to
                  see the cost.
                </p>
              ) : (
                <>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-4 text-center">
                    Cost to heat from {clampNum(startTemp, 32, 110)}° to{' '}
                    {clampNum(targetTemp, 32, 110)}°F
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results!.map((r) => {
                      const isCheapest = cheapest?.key === r.key;
                      return (
                        <div
                          key={r.key}
                          className={`rounded-xl border p-5 ${
                            isCheapest
                              ? 'border-green-400/40 bg-green-500/[0.07]'
                              : 'border-white/10 bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-white font-semibold text-[15px]">
                              {r.label}
                            </span>
                            {isCheapest && (
                              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-400/30">
                                Cheapest
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <DollarSign className="w-4 h-4 text-brand-orange shrink-0 self-center" />
                            <span className="text-3xl font-display font-bold text-white tabular-nums">
                              {fmtMoney(r.cost)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 flex items-center gap-1.5 mb-3">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            ~{fmtHours(r.hours)} to heat
                          </p>
                          <p className="text-[11px] text-gray-500 leading-snug">
                            {r.detail}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-gray-500 text-center mt-4 leading-relaxed">
                    Estimates for a one-time heat-up. Real cost varies with
                    weather, wind, and whether you run a pool cover.
                  </p>
                </>
              )}
            </div>

            {/* How we calculate this */}
            <button
              type="button"
              onClick={() => setShowMath((s) => !s)}
              className="mt-6 w-full flex items-center justify-between text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-brand-blue-light" />
                How we calculate this
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showMath ? 'rotate-180' : ''}`}
              />
            </button>
            {showMath && (
              <div className="mt-3 text-[13px] text-gray-400 leading-relaxed space-y-2 rounded-lg bg-[#0a1628]/40 border border-white/[0.06] p-4">
                <p>
                  Energy needed ={' '}
                  <span className="text-gray-200">
                    gallons × 8.34 × (target − current °F)
                  </span>{' '}
                  in BTU.
                </p>
                <p>
                  <span className="text-gray-200">Natural gas:</span> ÷ 100,000
                  BTU/therm ÷ {Math.round(GAS_EFFICIENCY * 100)}% efficiency ×
                  your gas price.
                </p>
                <p>
                  <span className="text-gray-200">Heat pump:</span> ÷ 3,412
                  BTU/kWh ÷ COP {HEAT_PUMP_COP} (heat moved per unit of
                  electricity) × your electricity price.
                </p>
              </div>
            )}
          </div>

          {/* Conversion CTA */}
          <div className="mt-8 rounded-2xl border border-brand-blue/20 bg-gradient-to-b from-brand-blue/[0.10] to-white/[0.02] p-6 sm:p-8 text-center">
            <h2 className="text-white font-display font-bold text-xl sm:text-2xl mb-2">
              Tired of surprise pool bills?
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-6 max-w-md mx-auto">
              We keep St. Petersburg pools clean and balanced for one flat
              monthly rate — no chemical surprises. Get a free quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#quote" onClick={handleQuoteClick} className="btn btn-orange">
                <MessageSquare className="w-[18px] h-[18px]" />
                Get a Free Quote
              </a>
              <a href={PHONE_HREF} className="btn btn-glass">
                <Phone className="w-[18px] h-[18px]" />
                {PHONE_DISPLAY}
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12">
            <h2 className="section-heading text-white text-center mb-6">
              Pool heating, answered
            </h2>
            <div className="space-y-3">
              {FAQS.map((f, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className="text-white font-semibold text-[15px]">
                      {f.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <p className="px-5 pb-5 -mt-1 text-sm text-gray-400 leading-relaxed">
                      {f.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

// JSON-LD (LocalBusiness + FAQPage) injected client-side. Title, description,
// and canonical come from usePageMeta (so they're in the prerendered HTML);
// usePageMeta doesn't do JSON-LD, so this effect adds it after mount. Google
// re-renders and picks it up. (Same pattern as the city pages — CLAUDE.md #9.)
const usePageSchema = () => {
  useEffect(() => {
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'LocalBusiness',
          '@id': 'https://suncoastpoolpros.com/#business',
          name: 'Suncoast Pool Pros',
          telephone: '+1-727-295-3621',
          url: 'https://suncoastpoolpros.com/',
          areaServed: { '@type': 'City', name: 'St. Petersburg', addressRegion: 'FL' },
          priceRange: '$$',
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQS.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
    });
    document.head.appendChild(ld);

    const bc = document.createElement('script');
    bc.type = 'application/ld+json';
    bc.text = JSON.stringify(
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Pool Tools', path: '/tools/' },
        { name: 'Pool Heating Cost Calculator', path: '/tools/pool-heating-cost-calculator/' },
      ]),
    );
    document.head.appendChild(bc);

    return () => {
      document.head.removeChild(ld);
      document.head.removeChild(bc);
    };
  }, []);
};

export const PoolHeatingCostCalculatorPage = () => (
  <QuoteSheetProvider>
    <PoolHeatingCostCalculatorInner />
  </QuoteSheetProvider>
);
