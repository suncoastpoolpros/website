import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import {
  Droplets,
  ArrowDownToLine,
  Power,
  SlidersHorizontal,
  MapPin,
  Waves,
  Timer,
  RefreshCw,
  AlertTriangle,
  CloudRain,
  FlaskConical,
  Wrench,
  Sun,
  Plus,
  ArrowRight,
  Phone,
  MessageSquare,
  Ban,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Why you'd lower a pool — light-band explainer cards. Framed around partial
// draining (the safe, common case), never a full drain.
const REASONS = [
  {
    icon: CloudRain,
    title: 'Rain overfilled it',
    text: "A Florida downpour can push the water over the skimmer mouth, so it stops skimming. Siphoning a few inches back off gets the skimmer working again.",
  },
  {
    icon: FlaskConical,
    title: 'Diluting the chemistry',
    text: "High CYA (stabilizer), salt, or total dissolved solids can only come down one way — replacing water. You drain part of the pool and refill with fresh.",
  },
  {
    icon: Wrench,
    title: 'Before a repair',
    text: "Replacing a light, patching the liner, or acid-washing the surface all need the water dropped below the work area first.",
  },
  {
    icon: Sun,
    title: 'Storm or freeze prep',
    text: "Ahead of a big storm, lowering the level a bit leaves room for heavy rain so the pool doesn't overflow onto the deck and equipment.",
  },
];

// Step-by-step — also the source for the HowTo JSON-LD below. Keep the on-page
// copy and the schema text in sync (both read from STEPS).
const STEPS = [
  {
    icon: Power,
    title: 'Turn the pump off first',
    text: "Shut the pump down at the timer or breaker before you touch anything. As the water drops below the skimmer, a running pump pulls air and runs dry — which burns up the seal and impeller. Nothing on the equipment pad should be running while you drain.",
  },
  {
    icon: SlidersHorizontal,
    title: 'Close the skimmers, open the main drain',
    text: "On the suction side of the pad, turn the skimmer valve(s) fully closed and open the main-drain valve all the way. The skimmer can only pull water down to its own mouth; the main drain sits on the deep-end floor, so drawing only off the main drain is what lets you take the level lower — and it keeps a siphon from breaking when the water passes the skimmer.",
  },
  {
    icon: ArrowDownToLine,
    title: 'Pick a discharge point that sits lower',
    text: "A siphon is pure gravity — water only flows if the hose's open end is lower than the pool's surface, and the bigger the drop, the faster it runs. Choose somewhere legal and safe to send it (more on that below), well away from the house, plants, and your neighbors.",
  },
  {
    icon: Droplets,
    title: 'Prime the garden hose',
    text: "Fill the whole hose with water so there's no air left in it — air won't siphon. Either submerge the entire hose in the pool until the bubbles stop, or screw it onto a spigot, run it full, and cap the end with your thumb before you move it.",
  },
  {
    icon: Waves,
    title: 'Start and anchor the siphon',
    text: "Keep one end underwater at the deep end (near the main drain) and carry the capped end down to your lower discharge point, then let go. Water should start flowing on its own. Weight or tie the pool end so it stays submerged at the bottom and can't slip out and break the siphon.",
  },
  {
    icon: Timer,
    title: 'Monitor and stop at your target level',
    text: "A garden hose moves water slowly, so a real drop can take hours — check on it, don't leave it running overnight. Mark your target (just below the tile, below the skimmer, or your dilution line) and pull the hose the moment you hit it so you never run the pool dry.",
  },
  {
    icon: RefreshCw,
    title: 'Refill, reset the valves, re-balance',
    text: "Top back up with fresh water, reopen the skimmer valve(s), and prime the pump before you restart it so it doesn't run dry on startup. Then re-test and balance chlorine, pH, alkalinity, and stabilizer — fresh fill water changes all of them.",
  },
];

// Where the drained water can go — short, practical guidance.
const WHERE_WATER = [
  {
    icon: MapPin,
    title: 'A sewer cleanout (where allowed)',
    text: "Many municipalities want pool water sent to the sanitary sewer via a cleanout, not the storm drain. Check your local rules first — they vary by city and county.",
  },
  {
    icon: Ban,
    title: 'Not onto lawns or storm drains',
    text: "Chlorinated water — and especially salt water — kills grass and plants, and chlorinated runoff into a storm drain is often a code violation since it flows straight to the bay.",
  },
  {
    icon: Sun,
    title: 'Let chlorine dissipate first',
    text: "If you're spreading it over your own property, stop chlorinating a day or two ahead and let the level drop near zero, then move the discharge around so no single spot gets soaked.",
  },
];

// Page-specific FAQ — drives both the on-page accordion and the FAQPage JSON-LD.
const DRAIN_FAQ = [
  {
    question: 'Can you really drain a pool with a garden hose?',
    answer:
      "Yes. A garden hose works as a gravity siphon as long as the open end sits lower than the pool's water level. It's slow — fine for lowering the level or a partial drain — but it needs no pump and no electricity.",
  },
  {
    question: 'Why turn the pump off and close the skimmer valves?',
    answer:
      "The skimmer can only pull water down to its own mouth, and a running pump will suck air and run dry once the level drops past it — which burns up the pump. Closing the skimmers and drawing only off the main drain lets you take the water lower and keeps the equipment safe.",
  },
  {
    question: 'Should I ever fully drain my pool myself?',
    answer:
      "Usually not. A fully drained pool can float out of the ground or crack from groundwater (hydrostatic) pressure, and vinyl liners can shrink and shift. Full drains should be left to a pro who can manage hydrostatic relief. Siphoning is for lowering the level or a partial drain.",
  },
  {
    question: 'How long does it take to drain a pool with a hose?',
    answer:
      "Slowly — a single garden hose might move only a few hundred gallons an hour, so dropping the level a foot can take several hours. A larger-diameter hose or a bigger height drop speeds it up; a submersible pump is far faster if you need it.",
  },
  {
    question: 'Where is it legal to drain pool water?',
    answer:
      "Somewhere safe and within local rules — often a sanitary sewer cleanout, or spread across your own property away from the house, plants, and neighbors. Chlorinated and salt water can kill landscaping and violate stormwater rules, so check your city or county guidelines first.",
  },
  {
    question: 'Can I siphon out through the main drain instead of dropping a hose in?',
    answer:
      "Yes. With the pump off, the skimmer valves closed, and the main drain open, you can run a siphon off the main-drain line at the equipment pad if the pad sits below the water line. The main drain is the lowest point in the pool, so it pulls the level down the furthest.",
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to drain a pool with a garden hose (siphon method)',
  description:
    'How to lower or partially drain a swimming pool with a garden hose: turn the pump off, close the skimmer valves and open the main drain, prime the hose, start a gravity siphon, and do it safely. From Suncoast Pool Pros in St. Petersburg, FL.',
  step: STEPS.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.text,
  })),
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: DRAIN_FAQ.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

// ── Diagram 1: equipment-pad suction valves ───────────────────────────────
// Pump OFF, both skimmer valves CLOSED (amber, handle across the pipe), main
// drain OPEN (blue, handle inline) so the siphon draws only off the bottom.
const ValveDiagram = () => (
  <figure className="h-full flex flex-col justify-center rounded-2xl border border-white/10 bg-[#0b1b2e] p-5 sm:p-7">
    <svg viewBox="0 0 620 300" className="w-full h-auto" role="img"
      aria-label="Equipment pad suction valves: pump off, both skimmer valves closed, main drain valve open.">
      {/* pump box */}
      <rect x="436" y="40" width="150" height="74" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
      <text x="511" y="70" textAnchor="middle" fill="#cbd5e1" fontSize="16" fontWeight="700" fontFamily="sans-serif">PUMP</text>
      <text x="511" y="94" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="700" fontFamily="sans-serif">OFF</text>
      {/* header pipe to pump */}
      <line x1="120" y1="77" x2="436" y2="77" stroke="#475569" strokeWidth="11" strokeLinecap="round" />
      {/* three drop pipes */}
      {[150, 290, 430].map((x) => (
        <line key={x} x1={x} y1="77" x2={x} y2="232" stroke="#475569" strokeWidth="11" strokeLinecap="round" />
      ))}
      {/* main-drain pipe active (blue) over the gray */}
      <line x1="430" y1="77" x2="430" y2="232" stroke="#4a93d1" strokeWidth="7" strokeLinecap="round" />
      <line x1="430" y1="77" x2="436" y2="77" stroke="#4a93d1" strokeWidth="7" strokeLinecap="round" />
      {/* flow arrow up the main drain */}
      <path d="M430 210 l0 -150" stroke="#4a93d1" strokeWidth="3" fill="none" />
      <path d="M424 80 l6 -10 l6 10 z" fill="#4a93d1" />

      {/* valves: skimmers closed (amber), main drain open (blue) */}
      {[
        { x: 150, open: false },
        { x: 290, open: false },
        { x: 430, open: true },
      ].map(({ x, open }) => (
        <g key={x}>
          <circle cx={x} cy="150" r="22" fill={open ? '#0e2a3f' : '#2a1d08'} stroke={open ? '#4a93d1' : '#f59e0b'} strokeWidth="3" />
          {/* handle: inline (vertical) when open, across (horizontal) when closed */}
          {open ? (
            <rect x={x - 3.5} y="131" width="7" height="38" rx="3.5" fill="#4a93d1" />
          ) : (
            <rect x={x - 19} y="146.5" width="38" height="7" rx="3.5" fill="#f59e0b" />
          )}
        </g>
      ))}

      {/* status chips */}
      {[
        { x: 150, label: 'CLOSED', open: false },
        { x: 290, label: 'CLOSED', open: false },
        { x: 430, label: 'OPEN', open: true },
      ].map(({ x, label, open }) => (
        <text key={x} x={x} y="120" textAnchor="middle" fill={open ? '#7cc0ec' : '#fbbf24'} fontSize="12.5" fontWeight="700" fontFamily="sans-serif">{label}</text>
      ))}

      {/* bottom labels */}
      <text x="150" y="262" textAnchor="middle" fill="#94a3b8" fontSize="14" fontFamily="sans-serif">Skimmer</text>
      <text x="290" y="262" textAnchor="middle" fill="#94a3b8" fontSize="14" fontFamily="sans-serif">Skimmer</text>
      <text x="430" y="262" textAnchor="middle" fill="#cbd5e1" fontSize="14" fontWeight="700" fontFamily="sans-serif">Main drain</text>
    </svg>
    <figcaption className="text-gray-400 text-sm leading-relaxed mt-3">
      Pump off, both skimmer valves <span className="text-amber-400 font-semibold">closed</span>, main drain{' '}
      <span className="text-brand-blue-light font-semibold">open</span> — so the water comes off the deep-end floor and
      the level can drop below the skimmer.
    </figcaption>
  </figure>
);

// ── Diagram 2: garden-hose gravity siphon ─────────────────────────────────
const SiphonDiagram = () => (
  <figure className="h-full flex flex-col justify-center rounded-2xl border border-white/10 bg-[#0b1b2e] p-5 sm:p-7">
    <svg viewBox="0 0 620 300" className="w-full h-auto" role="img"
      aria-label="Garden hose siphon: intake at the deep end, hose over the edge, discharge end sitting lower than the pool's water level.">
      {/* pool shell (cross-section, deep end on the right) */}
      <path d="M40 90 L300 90 L300 230 Q300 250 280 250 L150 250 Q70 250 60 170 L40 90 Z"
        fill="#0e2a3f" stroke="#334155" strokeWidth="2" />
      {/* water */}
      <path d="M48 110 L300 110 L300 230 Q300 250 280 250 L150 250 Q72 250 63 172 L48 110 Z"
        fill="#1f6fae" fillOpacity="0.55" />
      {/* water-level dashed line + label, extended to the right */}
      <line x1="48" y1="110" x2="560" y2="110" stroke="#7cc0ec" strokeWidth="2" strokeDasharray="7 6" />
      <text x="150" y="102" fill="#7cc0ec" fontSize="13" fontWeight="700" fontFamily="sans-serif">Water level</text>

      {/* the garden hose: intake at deep-end floor, up & over the coping, down to a low discharge */}
      <path d="M275 238 L275 96 Q275 70 320 70 L470 70 Q500 70 500 110 L500 250"
        fill="none" stroke="#ff8a3a" strokeWidth="9" strokeLinecap="round" />
      {/* flow arrows along the hose */}
      <path d="M275 150 l0 -1" stroke="#ff8a3a" strokeWidth="0" />
      <path d="M269 180 l6 10 l6 -10 z" fill="#ffb27a" transform="rotate(180 275 185)" />
      <path d="M494 200 l6 10 l6 -10 z" fill="#ffb27a" />

      {/* discharge point marker */}
      <circle cx="500" cy="250" r="6" fill="#ff8a3a" />

      {/* the height-drop callout: water level vs discharge */}
      <line x1="540" y1="110" x2="540" y2="250" stroke="#fbbf24" strokeWidth="2" />
      <path d="M534 120 l6 -10 l6 10 z" fill="#fbbf24" />
      <path d="M534 240 l6 10 l6 -10 z" fill="#fbbf24" />
      <text x="552" y="176" fill="#fbbf24" fontSize="12.5" fontWeight="700" fontFamily="sans-serif">Discharge</text>
      <text x="552" y="193" fill="#fbbf24" fontSize="12.5" fontWeight="700" fontFamily="sans-serif">must sit</text>
      <text x="552" y="210" fill="#fbbf24" fontSize="12.5" fontWeight="700" fontFamily="sans-serif">LOWER</text>

      {/* labels */}
      <text x="150" y="240" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontFamily="sans-serif">Intake at deep end</text>
      <text x="500" y="278" textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="sans-serif">To drain / yard</text>
    </svg>
    <figcaption className="text-gray-400 text-sm leading-relaxed mt-3">
      A siphon runs on gravity alone. As long as the hose&rsquo;s open end stays{' '}
      <span className="text-amber-400 font-semibold">lower than the water</span>, the pool pushes itself out — no pump
      needed. The bigger the drop, the faster it flows.
    </figcaption>
  </figure>
);

const DrainPoolPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'How to Drain a Pool With a Garden Hose (Siphon)',
    description:
      'How to drain a pool with a garden hose: set up a gravity siphon, turn the pump off, close the skimmer valves and pull only off the main drain — and how to lower the water safely without floating the pool.',
    canonicalPath: '/pool-care/how-to-drain-a-pool/',
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
        { name: 'How to Drain a Pool', path: '/pool-care/how-to-drain-a-pool/' },
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
            <ArrowDownToLine className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">Draining &amp; Water Level</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            How to drain a pool with a <span className="text-brand-orange">garden hose</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            Lowering your pool doesn&rsquo;t take a special pump &mdash; just a garden hose, gravity, and the right
            valve setup. Here&rsquo;s how to set up a siphon, why you turn the pump off and pull only off the main
            drain, and how to do it without damaging the pool.
          </p>
        </section>

        {/* ── Safety first — partial drain, not a full one ─────────────── */}
        <section className="pb-10">
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
                      Read This First
                    </span>
                    <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight">
                      Lower the water &mdash; don&rsquo;t fully drain it
                    </h2>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed max-w-2xl">
                  This guide is for <span className="text-white font-semibold">lowering the level or a partial drain</span> &mdash;
                  the everyday reasons below. A <span className="text-white font-semibold">completely empty</span> in-ground
                  pool can float out of the ground or crack from groundwater pressure, and a vinyl liner can shrink and
                  shift. If you need the pool fully empty, that&rsquo;s a job for a pro who can manage the hydrostatic
                  pressure &mdash; <a href={PHONE_HREF} className="text-amber-300 hover:text-amber-200 font-semibold whitespace-nowrap">call us</a> before you do.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Why you'd lower the water — light band ────────────────────── */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                When You&rsquo;d Do It
              </span>
              <h2 className="font-display font-bold text-[#0a1628] text-3xl sm:text-4xl leading-tight mb-3">
                Why lower the water at all?
              </h2>
              <p className="text-slate-600 leading-relaxed">
                A few inches off the top, or a partial drain &mdash; these are the common reasons a Florida pool owner
                reaches for a hose.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
              {REASONS.map((card, i) => (
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

        {/* ── How a siphon works — diagram + explainer ──────────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch max-w-5xl mx-auto">
              <div className="flex flex-col justify-center">
                <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  The Idea
                </span>
                <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-4">
                  A garden hose siphon is just gravity
                </h2>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Fill a hose completely with water, keep one end submerged in the pool, and run the other end to a spot{' '}
                  <span className="text-white">lower than the water surface</span>. Gravity pulls that lower column down
                  and drags the whole pool along behind it &mdash; no pump, no power.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  The only catch: the open end has to sit below the water line, and the bigger that drop, the faster it
                  flows. If your yard is dead flat with nowhere lower to send it, you&rsquo;ll need a submersible pump
                  instead.
                </p>
              </div>
              <SiphonDiagram />
            </div>
          </Container>
        </section>

        {/* ── The valve setup — diagram + explainer (the core ask) ──────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch max-w-5xl mx-auto">
              <div className="lg:order-2 flex flex-col justify-center">
                <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  At The Equipment Pad
                </span>
                <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-4">
                  Pump off, skimmers closed, main drain open
                </h2>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Pools pull water from two places: the <span className="text-white">skimmers</span> at the waterline and
                  the <span className="text-white">main drain</span> on the deep-end floor. To take the level{' '}
                  <span className="text-white">below the skimmer</span>, you have to draw from the bottom &mdash; so close
                  the skimmer valves and open the main drain all the way.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  That keeps the water dropping past the skimmer (which would otherwise suck air and break the siphon)
                  and stops the pump from running dry. Always{' '}
                  <span className="text-white">shut the pump off before you move any valve</span> &mdash; running it
                  against a closed line will wreck it.
                </p>
              </div>
              <div className="lg:order-1 h-full">
                <ValveDiagram />
              </div>
            </div>
          </Container>
        </section>

        {/* ── Step-by-step (centerpiece) ────────────────────────────────── */}
        <section className="py-16 sm:py-20 bg-white/[0.015] border-y border-white/5">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Step By Step
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                Draining your pool with a hose
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Seven steps, start to finish &mdash; from shutting the pump down to balancing the fresh water on the way
                back up.
              </p>
            </div>

            <ol className="max-w-3xl mx-auto space-y-4">
              {STEPS.map((step, i) => (
                <m.li
                  key={step.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.05, 0.2) }}
                  className="flex gap-4 sm:gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <span className="inline-flex w-10 h-10 rounded-full bg-brand-orange text-white font-display font-bold items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <step.icon className="w-[18px] h-[18px] text-brand-orange/80 shrink-0" />
                      <h3 className="text-white font-display font-bold text-lg leading-snug">{step.title}</h3>
                    </div>
                    <p className="text-gray-400 text-[15px] leading-relaxed">{step.text}</p>
                  </div>
                </m.li>
              ))}
            </ol>
          </Container>
        </section>

        {/* ── Where the water goes ──────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Don&rsquo;t Skip This
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                Where the drained water can go
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Pool water isn&rsquo;t garden water. Where you send it matters &mdash; for your lawn, your neighbors,
                and the local code.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3 max-w-5xl mx-auto">
              {WHERE_WATER.map((card, i) => (
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

            {/* Cross-link: dilution drains need the pool's gallons. */}
            <Link
              to="/tools/pool-volume-calculator/"
              className="mt-8 mx-auto max-w-3xl flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors p-5 group"
            >
              <span className="flex items-center gap-4 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                  <Droplets className="w-5 h-5 text-brand-blue-light" />
                </span>
                <span className="min-w-0">
                  <span className="block text-white font-semibold text-[15px] leading-tight">
                    Draining to dilute the chemistry?
                  </span>
                  <span className="block text-gray-400 text-sm mt-0.5">
                    Figure out how many gallons you&rsquo;re replacing &mdash; free pool volume calculator.
                  </span>
                </span>
              </span>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </Container>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                  Draining questions, answered
                </h2>
                <p className="text-gray-400">
                  The questions homeowners ask most about lowering a pool.{' '}
                  <a href="/faq/" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {DRAIN_FAQ.map((faq) => {
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
            </div>
          </Container>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Rather not babysit a hose all afternoon?
              </h2>
              <p className="text-gray-400 mb-7 max-w-lg mx-auto">
                Whether it&rsquo;s a quick lower-down, a dilution drain for high chemistry, or a full job that needs to
                be done right, we handle it &mdash; across St. Petersburg and the Tampa Bay area.
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

export const DrainPoolPage = () => (
  <QuoteSheetProvider>
    <DrainPoolPageInner />
  </QuoteSheetProvider>
);
