import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import { Container } from '@/components/Container';

const faqs = [
  {
    question: "What areas does Suncoast Pool Pros service?",
    answer: "We serve St. Petersburg, Clearwater, Seminole, Largo, Gulfport, and the surrounding Tampa Bay Area. If you're nearby, contact us to confirm availability."
  },
  {
    question: "What makes your pool service different?",
    answer: "Consistent technicians, proactive equipment checks, and clear communication. No rotating crews or guessing games."
  },
  {
    question: "Do you handle repairs or just cleaning?",
    answer: "Both. We diagnose equipment issues, handle repairs, and keep your pool running smoothly year-round."
  },
  {
    question: "How much does pool cleaning cost in St. Petersburg, FL?",
    answer: "Pricing depends on your pool's size, condition, and equipment. Most residential pools in St. Petersburg cost between $140–$200 per month for weekly cleaning, which includes brushing, skimming, vacuuming, and chemical balancing. That flat rate covers weekly cleaning and all standard chemicals — no surprise surcharges. Storm cleanups and major equipment repairs are billed separately at honest rates, and credit card payments include a small processing fee (ACH bank transfers are free)."
  },
  {
    question: "How often should a pool be cleaned in Florida?",
    answer: "In Florida's warm and humid climate, weekly cleaning is ideal to prevent algae growth and maintain safe water chemistry. During storm season, an additional visit may be helpful."
  },
  {
    question: "Do you offer service for commercial or HOA pools?",
    answer: "Absolutely. We maintain community, apartment, and hotel pools, following local health standards and providing required logs and chemical records."
  },
  {
    question: "Do you clean saltwater pools?",
    answer: "Yes. We service both saltwater and traditional chlorine pools. For saltwater systems, we clean salt cells, check salinity levels, and balance your water chemistry to ensure your pool stays clear and gentle on skin."
  }
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-24 relative">
      <Container>
        <div className="text-center mb-10 md:mb-12">
          <h2 className="section-heading text-white mb-4">
            Common Questions
          </h2>
        </div>

        <div className="space-y-3 md:space-y-4 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="glass-panel rounded-2xl overflow-hidden transition-colors hover:bg-white/10"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left gap-4"
                aria-expanded={openIndex === index}
              >
                <span className="text-white font-semibold text-[15px] sm:text-[17px]">{faq.question}</span>
                {openIndex === index ? (
                  <Minus className="w-5 h-5 text-brand-orange" />
                ) : (
                  <Plus className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-[14px] sm:text-[15px] text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:text-brand-orange-dark transition-colors"
          >
            See all questions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
};
