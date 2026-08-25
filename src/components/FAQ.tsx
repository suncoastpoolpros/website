import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import { Container } from '@/components/Container';

// Exported so LandingPage can emit matching FAQPage JSON-LD without duplicating
// the copy — Google requires the structured data to match the visible answers.
export const homepageFaqs = [
  {
    question: "What areas does Suncoast Pool Pros service?",
    answer: "We serve all of St. Petersburg — including waterfront neighborhoods like Snell Isle, Historic Old Northeast, Coffee Pot Bayou, Shore Acres, Venetian Isles, Bayway Isles, Broadwater, and Pinellas Point — plus Gulfport, St. Pete Beach, Treasure Island, Seminole, Largo, Belleair Beach, Clearwater, and the surrounding Tampa Bay area. If you're nearby, contact us to confirm availability."
  },
  {
    question: "What makes your pool service different?",
    answer: "Consistent technicians, proactive equipment checks, and clear communication. No rotating crews or guessing games."
  },
  {
    question: "Do you look at the equipment, or just clean the pool?",
    answer: "Both. Your pump, heater, filter and salt cell get checked on every visit, and anything starting to go gets flagged in writing while it is still small rather than turning up as a surprise. Where something needs work beyond that, we will tell you exactly what it needs so you are not guessing."
  },
  {
    question: "How much does pool cleaning cost in St. Petersburg, FL?",
    answer: "An average pool runs approximately $150 per month for weekly cleaning, which includes brushing, skimming, vacuuming, and chemical balancing — though pricing varies based on trees, pool size, and many other factors. That flat rate covers weekly cleaning and all standard chemicals — no surprise surcharges. Storm cleanups and any larger one-off work are quoted and approved separately at honest rates, and credit card payments include a small processing fee (ACH bank transfers are free)."
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

const faqs = homepageFaqs;

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-24 relative">
      <Container>
        <div className="text-center mb-10 md:mb-12">
          <h2 className="section-heading text-white mb-4">
            Pool service questions from St. Pete homeowners.
          </h2>
        </div>

        <div className="space-y-3 md:space-y-4 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`faq-item glass-panel rounded-2xl overflow-hidden transition-colors hover:bg-white/10 ${openIndex === index ? 'is-open' : ''}`}
            >
              {/* The heading WRAPS the button (the ARIA accordion pattern), it
                  does not sit inside it — <button> only takes phrasing content,
                  so an <h3> nested inside would be invalid HTML. These questions
                  are phrased as real long-tail queries, so they belong in the
                  heading outline; wrapping keeps the visual result identical
                  (Tailwind preflight zeroes heading margins, and the h3 is a bare
                  block around an already-full-width button). */}
              <h3>
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
              </h3>
              <div className="faq-answer">
                <div className="faq-answer-inner">
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-[14px] sm:text-[15px] text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/faq/"
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
