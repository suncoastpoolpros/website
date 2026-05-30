import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import {
  Wrench,
  Calculator,
  Phone,
  MessageSquare,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';

type Tool = {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  available: boolean;
};

const TOOLS: Tool[] = [
  {
    to: '/tools/pool-volume-calculator',
    icon: Calculator,
    title: 'Pool Volume Calculator',
    description:
      'Find out how many gallons your pool holds — the number you need for dosing chemicals and sizing equipment.',
    available: true,
  },
];

const ToolsPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();

  useEffect(() => {
    document.title = 'Free Pool Tools & Calculators — Suncoast Pool Pros | St. Pete';
  }, []);

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="fixed inset-0 bg-mesh opacity-50 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[460px] pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[500px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm px-3.5 py-1.5">
            <Wrench className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-medium tracking-wide text-xs">Free Pool Tools</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Free pool tools &amp; calculators
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            Handy calculators for St. Petersburg pool owners — work out your volume, dosing, and
            more. Free to use, no email required.
          </p>
        </section>

        {/* Tools grid */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid gap-5 sm:grid-cols-2">
            {TOOLS.map((tool, i) => (
              <m.div
                key={tool.to}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={tool.to}
                  className="group flex flex-col h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] hover:border-white/20 transition-colors"
                >
                  <span className="w-12 h-12 rounded-xl bg-brand-orange/15 flex items-center justify-center mb-4">
                    <tool.icon className="w-6 h-6 text-brand-orange" />
                  </span>
                  <h2 className="text-white font-display font-bold text-xl mb-2">{tool.title}</h2>
                  <p className="text-gray-400 text-[15px] leading-relaxed flex-1">
                    {tool.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-brand-orange font-semibold text-sm mt-4 group-hover:gap-2.5 transition-all">
                    Open calculator
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </m.div>
            ))}

            {/* "More coming" placeholder card */}
            <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 min-h-[180px]">
              <p className="text-gray-400 font-medium mb-1">More tools coming soon</p>
              <p className="text-gray-600 text-sm">Chlorine dosage, salt, and more.</p>
            </div>
          </div>
        </section>

        {/* Lead-gen CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Skip the calculations entirely
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                We test, dose, and balance your water every week for one flat rate — across St.
                Petersburg and the Tampa Bay area.
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

      <StickyMobileCta />
    </div>
  );
};

export const ToolsPage = () => (
  <QuoteSheetProvider>
    <ToolsPageInner />
  </QuoteSheetProvider>
);
