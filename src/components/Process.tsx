import React from 'react';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { Container } from '@/components/Container';

const steps = [
  {
    title: 'Reach Out',
    description: 'Call, text, or fill out the quick form — whatever’s easiest.',
  },
  {
    title: 'Get Your Quote',
    description: 'We send a fast, no-pressure flat-rate quote — same day.',
  },
  {
    title: 'Sit Back & Relax',
    description: 'We set up your service and handle the rest. You just swim.',
  },
];

export const Process = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  return (
    <section id="process" className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7]">
      {/* Soft brand-blue bloom for depth on the light band */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />

      <Container className="relative z-10">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
            How It Works
          </span>
          <h2 className="section-heading text-[#0a1628] leading-tight">
            Getting started takes 2 minutes.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative max-w-5xl mx-auto">
          {/* Connecting line (desktop), sits behind medallions */}
          <div
            className="hidden md:block absolute top-[3.25rem] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-brand-blue/0 via-brand-blue/40 to-brand-blue/0 z-0"
          />

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative z-10 flex flex-col items-center text-center"
            >
              {/* Numbered medallion — solid base so the connecting line is hidden behind it */}
              <div className="relative w-[5.5rem] h-[5.5rem] rounded-full flex items-center justify-center mb-5 transition-transform hover:scale-105">
                {/* opaque base disc (matches section bg so the line can't bleed through) */}
                <span className="absolute inset-0 rounded-full bg-[#e7ecf2]" />
                {/* blue tint + ring on top */}
                <span className="absolute inset-0 rounded-full bg-brand-blue/[0.08] border border-brand-blue/20 shadow-sm" />
                <span className="relative font-display font-bold text-4xl text-brand-blue">
                  {index + 1}
                </span>
              </div>
              <h3 className="text-xl font-display font-bold text-[#0a1628] mb-2">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed text-[15px] max-w-[15rem]">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA payoff */}
        <div className="mt-14 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={openQuoteSheet}
            className="btn btn-orange"
          >
            Get Your Free Quote
          </button>
          <p className="text-gray-500 text-sm">Same-day response · No contracts · No obligation</p>
        </div>
      </Container>
    </section>
  );
};
