import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  X,
  Phone,
  Plus,
  DollarSign,
  Sparkles,
  Wrench,
  MapPin,
  Rocket,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { faqs, FAQ_CATEGORIES, type Faq, type FaqCategory } from '@/data/faqs';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { FONTS, usePageMeta } from '@/lib/usePageMeta';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Container, Eyebrow, buttonClass, h2, sectionY } from '@/components/landing/sectionKit';
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

// The homepage's card edge (a hairline ring and a soft drop) and its raised
// input shadow.
const cardShadow = 'shadow-[0_0_0_1px_rgba(36,58,85,0.08),0_10px_24px_-16px_rgba(36,58,85,0.3)]';
const raised =
  'shadow-[0_0_0_1px_rgba(36,58,85,0.14),0_1px_2px_rgba(16,24,40,0.05),0_12px_32px_-14px_rgba(36,58,85,0.28)]';

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

// Page JSON-LD. Passed through the page-meta hook so it lands in the
// PRERENDERED head — an effect never runs during renderToString, so the HTML
// a crawler reads on first fetch would otherwise carry none of these nodes.
const PAGE_SCHEMA = [faqSchema];

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
    // Inter for the page, Montserrat for the header's wordmark (the homepage's set).
    fontPreload: [FONTS.inter, FONTS.montserrat],
    jsonLd: PAGE_SCHEMA,
  });

  // Inject FAQPage JSON-LD for this route.
  // A FAQ is *shown* when it matches the search query (across every category) or,
  // with no query, belongs to the active category tab. Every FAQ is still
  // rendered into the DOM (see the list below) — this only toggles visibility,
  // so all 40 answers stay in the prerendered HTML for crawlers.
  const isShown = (f: Faq) => {
    const q = query.trim().toLowerCase();
    if (q) {
      return (
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
      );
    }
    return f.category === filter;
  };
  const shownCount = useMemo(
    () => faqs.filter(isShown).length,
    // isShown is a pure function of query + filter
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, filter],
  );

  return (
    <div className="landing-canvas force-static-motion relative min-h-screen overflow-x-clip bg-white font-sans text-sc-navy antialiased">
      <LandingHeader onQuote={openQuoteSheet} />

      <main>
        {/* Hero: white into the mist the topics and answers sit on. */}
        <section className="bg-[linear-gradient(#fff,#f5f9fd)] px-4 pb-12 pt-14 text-center sm:px-8 sm:pt-20">
          <div className="mx-auto max-w-3xl">
            <Eyebrow centered>Help center</Eyebrow>
            <h1 className="mt-4 text-balance text-[40px] font-[650] leading-[1.05] tracking-[-0.04em] text-sc-navy sm:text-[52px]">
              How can we help?
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[17px] leading-[1.6] text-sc-muted sm:text-[18px]">
              Pricing, what's included, equipment, service areas — everything you
              need to know about weekly pool care in the Tampa Bay area.
            </p>

            <div className="relative mx-auto mt-8 max-w-xl">
              <Search aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-sc-navy/45" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for an answer…"
                aria-label="Search FAQ"
                className={`h-14 w-full rounded-[14px] bg-white pl-[3.25rem] pr-12 text-[15.5px] text-sc-navy placeholder:text-sc-navy/45 outline-none transition focus:ring-2 focus:ring-sc-blue/50 ${raised}`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-sc-navy/50 transition-colors hover:bg-sc-navy/[0.06] hover:text-sc-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <p className="mt-5 text-[14px] text-sc-muted">
              <span className="font-semibold tabular-nums text-sc-navy">{faqs.length}</span> answers across{' '}
              <span className="font-semibold tabular-nums text-sc-navy">{FAQ_CATEGORIES.length}</span> topics
            </p>
          </div>
        </section>

        {/* Two-column: sticky category sidebar (left) + answers (right) */}
        <div className="bg-sc-mist">
          <div className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-8 sm:pb-24">
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[256px_1fr] lg:gap-12">
              {/* LEFT — category tabs */}
              <aside className="lg:sticky lg:top-24">
                <p className="mb-3 hidden px-3 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-sc-navy/55 lg:block">
                  Browse by topic
                </p>
                {/* Horizontal scroll on mobile, vertical stack on desktop */}
                <nav aria-label="FAQ topics" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 py-1 lg:mx-0 lg:flex-col lg:px-0">
                  {FAQ_CATEGORIES.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    const active = filter === cat && !query.trim();
                    return (
                      <button
                        key={cat}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setQuery('');
                          setFilter(cat);
                          setOpenKey(null);
                        }}
                        className={`group inline-flex shrink-0 items-center gap-3 rounded-[12px] px-2.5 py-2 text-[13.5px] font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue sm:text-[14px] lg:w-full lg:px-3 lg:py-2.5 ${
                          active
                            ? `bg-white text-sc-navy ${cardShadow}`
                            : 'text-sc-navy/70 hover:text-sc-navy lg:hover:bg-white/70'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] transition-colors duration-150 ${
                            active ? 'bg-sc-blue text-white' : 'bg-white text-sc-blue ring-1 ring-inset ring-sc-navy/[0.08]'
                          }`}
                        >
                          <Icon className="h-[15px] w-[15px]" />
                        </span>
                        <span className="whitespace-nowrap lg:flex-1 lg:whitespace-normal lg:text-left">{cat}</span>
                        <span
                          className={`hidden shrink-0 text-[12px] tabular-nums transition-colors duration-150 lg:block ${
                            active ? 'font-semibold text-sc-blue' : 'text-sc-navy/40 group-hover:text-sc-navy/60'
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
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <h2 className="text-[22px] font-[650] tracking-[-0.025em] text-sc-navy sm:text-[26px]">
                    {query.trim() ? 'Search results' : filter}
                  </h2>
                  <span className="shrink-0 text-[12px] uppercase tabular-nums tracking-[0.12em] text-sc-navy/50">
                    {shownCount} {shownCount === 1 ? 'question' : 'questions'}
                  </span>
                </div>

                {/* Every Q&A is rendered into the DOM (answers collapsed via the
                    CSS `.faq-answer` grid, not conditionally mounted) so all 40
                    answers ship in the prerendered HTML for crawlers. Category and
                    search just toggle each item's visibility with `hidden`.
                    Each item draws a rule above it; the card clips the first
                    shown one (-mt-px), whichever that is. */}
                <div className={`overflow-hidden rounded-[18px] bg-white ${cardShadow} ${shownCount ? '' : 'hidden'}`}>
                  <div className="-mt-px">
                    {faqs.map((faq, i) => {
                      const isOpen = openKey === faq.question;
                      const shown = isShown(faq);
                      return (
                        <div
                          key={faq.question}
                          className={`faq-item border-t border-sc-navy/10 px-5 sm:px-7 ${isOpen ? 'is-open' : ''} ${shown ? '' : 'hidden'}`}
                        >
                          <h3>
                            <button
                              type="button"
                              id={`faq-q-${i}`}
                              onClick={() => setOpenKey(isOpen ? null : faq.question)}
                              aria-expanded={isOpen}
                              aria-controls={`faq-a-${i}`}
                              className="group flex w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue"
                            >
                              <span className="min-w-0 break-words text-[16px] font-semibold leading-snug text-sc-navy transition-colors group-hover:text-sc-blue sm:text-[16.5px]">
                                {faq.question}
                              </span>
                              <span
                                aria-hidden="true"
                                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sc-mist text-sc-blue transition-transform duration-200 ${
                                  isOpen ? 'rotate-45' : ''
                                }`}
                              >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                              </span>
                            </button>
                          </h3>
                          <div className="faq-answer">
                            <div className="faq-answer-inner">
                              <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="-mt-1 max-w-3xl pb-6 pr-10">
                                {query.trim() && (
                                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-sc-blue">
                                    {faq.category}
                                  </p>
                                )}
                                <p className="text-[15.5px] leading-[1.7] text-sc-navy/[0.78]">{faq.answer}</p>
                                {faq.relatedTool && (
                                  <Link
                                    to={faq.relatedTool.href}
                                    className="mt-4 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-sc-blue underline decoration-sc-blue/30 decoration-1 underline-offset-[3px] transition hover:decoration-sc-blue"
                                  >
                                    {faq.relatedTool.label}
                                    <ArrowRight className="h-4 w-4" />
                                  </Link>
                                )}
                                {faq.quoteCta && (
                                  <div className="mt-5">
                                    <button type="button" onClick={openQuoteSheet} className={buttonClass.gold}>
                                      Get a Free Quote
                                      <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-[3px]" strokeWidth={2.5} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Empty state — only when a live search matches nothing. (SSR
                    always shows the active category, so this never prerenders.) */}
                {query.trim() && shownCount === 0 && (
                  <div className={`rounded-[18px] bg-white px-6 py-16 text-center ${cardShadow}`}>
                    <p className="mb-2 text-[18px] font-semibold text-sc-navy">No questions match “{query}”.</p>
                    <p className="text-[14.5px] text-sc-muted">
                      Try a different search, or{' '}
                      <a href={PHONE_HREF} className="font-semibold text-sc-blue underline decoration-sc-blue/30 underline-offset-[3px] hover:decoration-sc-blue">
                        call us at {PHONE_DISPLAY}
                      </a>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Closing CTA — the homepage's navy card. */}
        <section aria-labelledby="faq-cta-title" className={`bg-white ${sectionY}`}>
          <Container>
            <div className="cta-depth rounded-[24px] px-6 py-14 text-center sm:px-12 sm:py-[72px]">
              <h2 id="faq-cta-title" className={`${h2} mx-auto max-w-2xl text-white`}>
                Still have a question?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-pretty text-[17px] leading-[1.6] text-white/75">
                Text us photos of your pool for the fastest flat-rate quote, or give us a call —
                we answer Monday through Saturday.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button type="button" onClick={openQuoteSheet} className={`${buttonClass.gold} h-[52px] w-full px-7 sm:w-auto`}>
                  Get a Free Quote
                  <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-[3px]" strokeWidth={2.5} />
                </button>
                <a
                  href={PHONE_HREF}
                  className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] px-6 text-base font-semibold text-white ring-1 ring-white/25 transition hover:ring-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
                >
                  <Phone className="h-[18px] w-[18px] text-white/70" />
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export const FaqPage = () => <FaqPageInner />;
