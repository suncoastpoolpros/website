import React from 'react';
import { AlertCircle, Check, CheckCircle, ChevronDown, ChevronRight, Phone } from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { Footer } from '@/components/Footer';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingQuoteSheetProvider } from '@/components/landing/LandingQuoteSheet';
import { StickyQuoteBar } from '@/components/landing/StickyQuoteBar';
import { QuoteSegment } from '@/components/landing/QuoteSegment';
import { Container, QuoteButton, buttonClass } from '@/components/landing/sectionKit';
import { useQuoteFormSubmit } from '@/components/ServiceQuoteForm';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta, FONTS } from '@/lib/usePageMeta';
import { serviceSchema } from '@/lib/businessSchema';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';
import { SERVICE_TILES } from '@/lib/serviceTiles';

/*
 * One service page on the homepage's design: the light header, a text hero
 * with a summary card, what the service covers, how it runs, a real on-page
 * quote form, an FAQ, and links to the other services.
 *
 * Each page passes its own copy, qualifying questions and FAQ. That matters
 * for search: near-duplicate boilerplate across a site is discounted, so no
 * two pages share a paragraph, and each form asks what that service needs.
 *
 * Search basics, all in the PRERENDERED html: the title and h1 carry the
 * service and "St. Petersburg, FL"; the form is a real <form> (CLAUDE.md
 * #13); the Service, FAQPage and BreadcrumbList JSON-LD go through
 * usePageMeta, and the FAQ schema is built from the FAQ the page renders.
 *
 * Every claim must be true of how the company works. Don't add numbers,
 * certifications or guarantees the site can't back up.
 */

export type ServiceLandingConfig = {
  /** Canonical path with trailing slash, e.g. /services/pool-repair/. */
  path: string;
  title: string;
  description: string;
  /** Short name for the breadcrumb and the "other services" row. */
  name: string;
  h1: React.ReactNode;
  lead: string;
  /** The hero's summary card. */
  card: { title: string; items: string[] };
  /** What the service covers: a heading, a line under it, and 2–4 groups. */
  covers: {
    title: string;
    sub: string;
    groups: { icon: typeof Check; title: string; items: string[] }[];
  };
  /** How it runs, in order. */
  steps: { title: string; sub: string; items: { title: string; body: string }[] };
  form: {
    /** Lead source tag, e.g. "pool-repair-form". */
    source: string;
    /** The backend's service slug (functions/api/contact.ts humanizeService). */
    service: string;
    title: string;
    sub: string;
    points: string[];
    formTitle: string;
    segments: { name: string; label: string; options: { value: string; label: string }[]; missingText: string }[];
    successTitle: string;
    successBody: string;
  };
  faqs: { q: string; a: string }[];
  schema: { serviceType: string; description: string };
};

const sectionY = 'py-[76px] lg:py-28';
const h2 = 'text-balance text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-sc-navy md:text-[30px]';
const sub = 'mt-2.5 max-w-[40rem] text-pretty text-[16px] leading-[1.55] text-[rgba(36,58,85,0.66)] md:text-[17px]';
const card = 'rounded-[12px] border border-[rgba(36,58,85,0.1)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]';
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7fdb]';
const fieldLabel = 'mb-1.5 mt-4 block text-[12px] font-semibold text-sc-muted';
// 16px on phones so iOS doesn't zoom into the field on focus.
const inputClass =
  'h-[46px] w-full rounded-[10px] bg-white px-3.5 text-base text-sc-navy ring-1 ring-inset ring-sc-navy/15 transition outline-none focus:ring-2 focus:ring-[#1f7fdb] min-[960px]:text-[15px]';

const checkItem = (text: string) => (
  <li key={text} className="flex items-start gap-2.5 text-[15px] leading-snug text-[rgba(36,58,85,0.8)]">
    <Check aria-hidden="true" className="mt-[2px] h-4 w-4 shrink-0 text-[#1f7fdb]" strokeWidth={2.5} />
    <span>{text}</span>
  </li>
);

const Hero = ({ c }: { c: ServiceLandingConfig }) => (
  <section className="bg-[#f5f9fd]">
    <Container className="grid items-center gap-10 pb-16 pt-8 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16 lg:pb-24 lg:pt-14">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="text-[13px] text-sc-navy/60">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link to="/" className="hover:text-sc-navy hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </li>
            <li>
              <Link to="/services/" className="hover:text-sc-navy hover:underline">
                Services
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </li>
            <li aria-current="page" className="text-sc-navy/80">
              {c.name}
            </li>
          </ol>
        </nav>
        <h1 className="mt-5 text-balance text-[36px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#243a55] lg:text-[46px]">
          {c.h1}
        </h1>
        <p className="mt-4 max-w-[34rem] text-pretty text-[17px] leading-[1.6] text-[rgba(36,58,85,0.78)] lg:mt-5 lg:text-[18px]">
          {c.lead}
        </p>
        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 lg:mt-8">
          <div id="get-price" className="scroll-mt-24">
            <QuoteButton
              variant="flat"
              label="Get my free quote"
              className="h-[54px] w-full px-[22px] text-[17px] sm:h-12 sm:w-auto sm:text-base"
            />
          </div>
          <a
            href={PHONE_HREF}
            className="inline-flex items-center gap-2 text-[16px] font-semibold text-[#243a55] underline-offset-[3px] hover:underline max-sm:justify-center"
          >
            <Phone aria-hidden="true" className="h-[18px] w-[18px] text-[#1f7fdb]" strokeWidth={2} />
            Call {PHONE_DISPLAY}
          </a>
        </div>
      </div>

      <div className={`${card} p-6 sm:p-7`}>
        <p className="text-[17px] font-semibold tracking-[-0.015em] text-[#243a55]">{c.card.title}</p>
        <ul className="mt-4 grid gap-3">
          {c.card.items.map(checkItem)}
        </ul>
      </div>
    </Container>
  </section>
);

const Covers = ({ c }: { c: ServiceLandingConfig }) => (
  <section aria-labelledby="covers-title" className={`bg-white ${sectionY}`}>
    <Container>
      <h2 id="covers-title" className={h2}>
        {c.covers.title}
      </h2>
      <p className={sub}>{c.covers.sub}</p>
      <ul className="mt-9 grid gap-3 sm:grid-cols-2 lg:mt-12">
        {c.covers.groups.map(({ icon: Icon, title, items }) => (
          <li key={title} className={`${card} p-6`}>
            <div className="flex items-center gap-2.5">
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-[#1f7fdb]" strokeWidth={1.6} />
              <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#243a55]">{title}</h3>
            </div>
            <ul className="mt-4 grid gap-2.5">
              {items.map(checkItem)}
            </ul>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

const Steps = ({ c }: { c: ServiceLandingConfig }) => (
  <section aria-labelledby="steps-title" className={`bg-[#f7f9fc] ${sectionY}`}>
    <Container>
      <h2 id="steps-title" className={h2}>
        {c.steps.title}
      </h2>
      <p className={sub}>{c.steps.sub}</p>
      <ol className="mt-9 grid gap-3 lg:mt-12 lg:grid-cols-3">
        {c.steps.items.map((s, i) => (
          <li key={s.title} className={`${card} p-6`}>
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-full bg-[#1c2f47] text-[13px] font-semibold text-white"
            >
              {i + 1}
            </span>
            <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-[#243a55]">{s.title}</h3>
            <p className="mt-1.5 text-[15px] leading-[1.6] text-[rgba(36,58,85,0.72)]">{s.body}</p>
          </li>
        ))}
      </ol>
    </Container>
  </section>
);

// The on-page form: a real <form> in the prerendered HTML. The submit is
// useQuoteFormSubmit, shared with the other on-page forms, so leads arrive
// through /api/contact like the rest, every named field as an email row.
const QuoteForm = ({ c }: { c: ServiceLandingConfig }) => {
  const f = c.form;
  const { submitted, setSubmitted, loading, error, turnstile, handleSubmit } = useQuoteFormSubmit(f.source);
  return (
    <section id="quote" aria-labelledby="form-title" className={`scroll-mt-24 bg-white ${sectionY}`}>
      <Container className="grid items-center gap-10 min-[960px]:grid-cols-2 min-[960px]:gap-14">
        <div>
          <h2 id="form-title" className={h2}>
            {f.title}
          </h2>
          <p className={sub}>{f.sub}</p>
          <ul className="mt-6 grid gap-3">
            {f.points.map(checkItem)}
          </ul>
          <p className="mt-6 text-[15px] text-[rgba(36,58,85,0.72)]">
            Prefer to talk? Call or text{' '}
            <a href={PHONE_HREF} className="whitespace-nowrap font-semibold text-[#243a55] underline decoration-sc-navy/30 underline-offset-[3px] hover:decoration-sc-navy">
              {PHONE_DISPLAY}
            </a>
            .
          </p>
        </div>

        <div className={`${card} p-6 sm:p-[30px]`}>
          {submitted ? (
            <div className="py-6 text-center">
              <CheckCircle aria-hidden="true" className="mx-auto h-12 w-12 text-[#0e9f57]" />
              <h3 className="mt-4 text-[20px] font-semibold text-sc-navy">{f.successTitle}</h3>
              <p className="mt-2 text-[15px] leading-[1.6] text-sc-muted">{f.successBody}</p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className={`mt-6 text-[15px] font-semibold text-[#1f7fdb] underline decoration-[#1f7fdb]/30 underline-offset-[3px] hover:decoration-[#1f7fdb] ${focusRing}`}
              >
                Send another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative">
              {/* Honeypot: off-screen and out of the tab order; bots fill it. */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px" />
              <div ref={turnstile.containerRef} aria-hidden="true" className="absolute -left-[9999px] h-px w-px" />
              <input type="hidden" name="service" value={f.service} />

              <h3 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-sc-navy">{f.formTitle}</h3>
              <p className="mt-1 text-[14px] text-sc-muted">Takes about a minute. No obligation.</p>

              {f.segments.map((sg) => (
                <React.Fragment key={sg.name}>
                  <QuoteSegment name={sg.name} label={sg.label} options={sg.options} missingText={sg.missingText} />
                </React.Fragment>
              ))}

              <div className="grid gap-x-2.5 min-[480px]:grid-cols-2">
                <div>
                  <label htmlFor="quote-name" className={fieldLabel}>
                    Full name
                  </label>
                  <input id="quote-name" type="text" name="name" required autoComplete="name" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="quote-phone" className={fieldLabel}>
                    Phone
                  </label>
                  <input id="quote-phone" type="tel" name="phone" required autoComplete="tel" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="quote-zip" className={fieldLabel}>
                    ZIP code
                  </label>
                  <input
                    id="quote-zip"
                    type="text"
                    name="zip"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    autoComplete="postal-code"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="quote-email" className={fieldLabel}>
                    Email <span className="font-normal">(optional)</span>
                  </label>
                  <input id="quote-email" type="email" name="email" autoComplete="email" className={inputClass} />
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-[10px] bg-red-50 px-4 py-3 text-[14px] text-red-700">
                  <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className={`${buttonClass.flat} mt-5 h-[50px] w-full text-[16px] disabled:cursor-wait disabled:opacity-70`}>
                {loading ? 'Sending…' : 'Get my free quote'}
              </button>
              <p className="mt-3 text-[11.5px] leading-relaxed text-sc-muted">
                By submitting, you agree to get texts about your request from Suncoast Pool Pros. Msg &amp; data rates may
                apply. Reply STOP to opt out.
              </p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
};

const Faq = ({ c }: { c: ServiceLandingConfig }) => (
  <section aria-labelledby="faq-title" className={`bg-[#f7f9fc] ${sectionY}`}>
    <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
      <div>
        <h2 id="faq-title" className={h2}>
          Questions, answered.
        </h2>
        <p className={sub}>
          Something else? Call{' '}
          <a href={PHONE_HREF} className="whitespace-nowrap font-semibold text-[#243a55] underline decoration-sc-navy/30 underline-offset-[3px] hover:decoration-sc-navy">
            {PHONE_DISPLAY}
          </a>{' '}
          or see{' '}
          <Link to="/faq/" className="font-semibold text-[#243a55] underline decoration-sc-navy/30 underline-offset-[3px] hover:decoration-sc-navy">
            all our FAQs
          </Link>
          .
        </p>
      </div>
      <div className={`${card} divide-y divide-sc-navy/10 px-5 sm:px-6`}>
        {c.faqs.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16.5px] font-semibold text-sc-navy [&::-webkit-details-marker]:hidden">
              <h3 className="tracking-[-0.02em]">{q}</h3>
              <ChevronDown className="h-5 w-5 shrink-0 text-sc-navy/45 transition-transform group-open:rotate-180" />
            </summary>
            <p className="-mt-1 pb-5 pr-10 text-[15.5px] leading-[1.6] text-[rgba(36,58,85,0.78)]">{a}</p>
          </details>
        ))}
      </div>
    </Container>
  </section>
);

const OtherServices = ({ c }: { c: ServiceLandingConfig }) => (
  <section aria-labelledby="more-title" className={`bg-white ${sectionY}`}>
    <Container>
      <h2 id="more-title" className={h2}>
        More from the same local team.
      </h2>
      <p className={sub}>Every service we offer across St. Petersburg and Pinellas County.</p>
      <ul className="mt-9 grid grid-cols-2 gap-3 lg:mt-12 lg:grid-cols-4">
        {SERVICE_TILES.filter((t) => t.to !== c.path).map(({ icon: Icon, name, to }) => (
          <li key={name} className="flex">
            {to ? (
              <Link
                to={to}
                className={`flex min-h-[72px] w-full items-center gap-2.5 rounded-[12px] border border-[rgba(36,58,85,0.1)] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition-colors hover:border-[#1f7fdb] ${focusRing}`}
              >
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-[#1f7fdb]" strokeWidth={1.6} />
                <span className="min-w-0 text-[15px] font-semibold leading-tight tracking-[-0.012em] text-[#243a55]">{name}</span>
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

export const ServiceLandingPage = ({ c }: { c: ServiceLandingConfig }) => {
  usePageMeta({
    title: c.title,
    description: c.description,
    canonicalPath: c.path,
    fontPreload: [FONTS.geist, FONTS.montserrat],
    jsonLd: [
      serviceSchema({ serviceType: c.schema.serviceType, description: c.schema.description, url: c.path }),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: c.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services/' },
        { name: c.name, path: c.path },
      ]),
    ],
  });

  // overflow-x-clip, not -hidden: hidden makes the wrapper a scroll
  // container, and the sticky header would stop sticking.
  return (
    <LandingQuoteSheetProvider>
      <div className="landing-canvas force-static-motion min-h-screen overflow-x-clip bg-white font-sans text-sc-navy antialiased">
        <LandingHeader quoteLabel="Get my free quote" strongPhone />
        <main>
          <Hero c={c} />
          <Covers c={c} />
          <Steps c={c} />
          <QuoteForm c={c} />
          <Faq c={c} />
          <OtherServices c={c} />
        </main>
        <Footer />
        <StickyQuoteBar />
      </div>
    </LandingQuoteSheetProvider>
  );
};
