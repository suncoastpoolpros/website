import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  Phone,
  MessageSquare,
  HelpCircle,
  DollarSign,
  Sparkles,
  Wrench,
  MapPin,
  Rocket,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { faqs, FAQ_CATEGORIES, type FaqCategory } from '@/data/faqs';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// Build the FAQPage JSON-LD once — single source of truth is the faqs array.
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const CATEGORY_ICONS: Record<FaqCategory, LucideIcon> = {
  'Pricing & Billing': DollarSign,
  'Our Service': Sparkles,
  'Equipment & Repairs': Wrench,
  'Service Areas': MapPin,
  'Getting Started': Rocket,
};

// Question count per category, computed once.
const CATEGORY_COUNTS: Record<FaqCategory, number> = FAQ_CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat] = faqs.filter((f) => f.category === cat).length;
    return acc;
  },
  {} as Record<FaqCategory, number>,
);

const FaqPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FaqCategory>(FAQ_CATEGORIES[0]);
  const [openKey, setOpenKey] = useState<string | null>(null);

  usePageMeta({
    title: 'Pool Service Questions, Answered — No Sales Fluff',
    description:
      "Straight answers on flat-rate weekly pool service — what’s included, how pricing works, and what happens if your water turns green. No sales fluff.",
    canonicalPath: '/faq/',
  });

  // Inject FAQPage JSON-LD for this route.
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // When searching, look across every category; otherwise honor the active tab.
    return faqs.filter((f) => {
      if (q) {
        return (
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
        );
      }
      return f.category === filter;
    });
  }, [query, filter]);

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />

      {/* FAQ hero — calm, balanced twin-blue glow with a faint warm center */}
      <div className="absolute top-0 inset-x-0 h-[460px] bg-gradient-to-b from-brand-blue/[0.08] to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[460px] pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="absolute left-[14%] -top-28 w-[480px] h-[460px] rounded-full bg-brand-blue/15 blur-[130px]" />
        <div className="absolute right-[14%] -top-28 w-[480px] h-[460px] rounded-full bg-brand-blue/15 blur-[130px]" />
        <div className="absolute left-1/2 -translate-x-1/2 -top-8 w-[320px] h-[320px] rounded-full bg-brand-orange/[0.07] blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">
              Help Center
            </span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            How can we help?
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            Pricing, what's included, equipment, service areas — everything you
            need to know about weekly pool care in the Tampa Bay area.
          </p>

          {/* Prominent SaaS search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for an answer…"
              aria-label="Search FAQ"
              className="w-full pl-[3.25rem] pr-12 py-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white text-[15px] placeholder-gray-500 shadow-xl shadow-black/20 focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/30 transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-2.5 mt-5 text-sm text-gray-500">
            <span><span className="text-gray-300 font-semibold tabular-nums">{faqs.length}</span> answers across <span className="text-gray-300 font-semibold tabular-nums">{FAQ_CATEGORIES.length}</span> topics</span>
          </div>
        </section>

        {/* Two-column: sticky category sidebar (left) + content (right) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[256px_1fr] gap-8 lg:gap-12 items-start">

            {/* LEFT — category tabs */}
            <aside className="lg:sticky lg:top-24">
              <p className="hidden lg:block text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-3 px-3">
                Browse by topic
              </p>
              {/* Horizontal scroll on mobile, vertical stack on desktop */}
              <nav className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
                {FAQ_CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  const active = filter === cat && !query.trim();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setFilter(cat);
                        setOpenKey(null);
                      }}
                      className={`group shrink-0 lg:w-full inline-flex items-center gap-3 rounded-lg px-2.5 lg:px-3 py-2 lg:py-2.5 text-[13px] sm:text-sm font-semibold transition-colors duration-150 ${
                        active
                          ? 'bg-white/[0.05] text-white'
                          : 'text-gray-400 hover:text-white lg:hover:bg-white/[0.03]'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors duration-150 ${
                          active
                            ? 'bg-brand-orange text-white'
                            : 'bg-white/[0.05] text-gray-500 group-hover:text-gray-300'
                        }`}
                      >
                        <Icon className="w-[15px] h-[15px]" />
                      </span>
                      <span className="whitespace-nowrap lg:whitespace-normal lg:flex-1 lg:text-left">
                        {cat}
                      </span>
                      <span
                        className={`hidden lg:block text-xs tabular-nums shrink-0 transition-colors duration-150 ${
                          active ? 'text-brand-orange font-semibold' : 'text-gray-600 group-hover:text-gray-400'
                        }`}
                      >
                        {CATEGORY_COUNTS[cat]}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* RIGHT — accordion */}
            <div className="min-w-0">
              {/* Result heading */}
              <div className="flex items-baseline justify-between gap-4 pb-4 mb-1 border-b border-white/[0.12]">
                <h2 className="text-white font-display font-bold text-xl sm:text-2xl">
                  {query.trim() ? 'Search results' : filter}
                </h2>
                <span className="text-xs uppercase tracking-[0.12em] text-gray-500 tabular-nums shrink-0">
                  {filtered.length} {filtered.length === 1 ? 'question' : 'questions'}
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] text-center py-16 px-6">
                  <p className="text-gray-300 text-lg mb-2">No questions match “{query}”.</p>
                  <p className="text-gray-500 text-sm">
                    Try a different search, or{' '}
                    <a href={PHONE_HREF} className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                      call us at {PHONE_DISPLAY}
                    </a>
                    .
                  </p>
                </div>
              ) : (
                <div>
                  {filtered.map((faq) => {
                    const isOpen = openKey === faq.question;
                    return (
                      <div
                        key={faq.question}
                        className={`group border-b border-white/[0.08] transition-colors ${
                          isOpen ? '' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenKey(isOpen ? null : faq.question)}
                          aria-expanded={isOpen}
                          className="w-full py-5 px-1 flex items-start justify-between gap-5 text-left"
                        >
                          <span
                            className={`min-w-0 break-words font-display font-normal text-[16px] sm:text-[17px] leading-snug transition-colors ${
                              isOpen ? 'text-brand-orange' : 'text-gray-100 group-hover:text-white'
                            }`}
                          >
                            {faq.question}
                          </span>
                          <span
                            className={`relative w-6 h-6 mt-0.5 shrink-0 flex items-center justify-center transition-colors duration-200 ${
                              isOpen ? 'text-brand-orange' : 'text-gray-500 group-hover:text-white'
                            }`}
                          >
                            {/* Horizontal line (always) + vertical line that collapses when open = +/× morph */}
                            <span className="absolute w-4 h-[2px] rounded-full bg-current" />
                            <span
                              className={`absolute w-[2px] h-4 rounded-full bg-current transition-transform duration-300 ${
                                isOpen ? 'rotate-90 scale-y-0' : 'rotate-0 scale-y-100'
                              }`}
                            />
                          </span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <m.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="pb-6 px-1 pr-10 -mt-1 max-w-3xl">
                                {query.trim() && (
                                  <p className="text-[11px] uppercase tracking-[0.15em] text-brand-blue-light font-semibold mb-2">
                                    {faq.category}
                                  </p>
                                )}
                                <p className="text-gray-300 leading-[1.75] text-[15px]">{faq.answer}</p>
                                {faq.relatedTool && (
                                  <Link
                                    to={faq.relatedTool.href}
                                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:text-brand-orange-dark transition-colors"
                                  >
                                    {faq.relatedTool.label}
                                    <ArrowRight className="w-4 h-4" />
                                  </Link>
                                )}
                              </div>
                            </m.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Closing CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
            <div className="relative">
            <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
              Still have a question?
            </h2>
            <p className="text-gray-400 mb-7 max-w-md mx-auto">
              Text us photos of your pool for the fastest flat-rate quote, or give us a call —
              we answer Monday through Saturday.
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

export const FaqPage = () => <FaqPageInner />;
