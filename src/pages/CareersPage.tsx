import React from 'react';
import {
  ArrowRight,
  Award,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  HeartHandshake,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Sun,
  Truck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { EMAIL } from '@/lib/contact';
import { FONTS, usePageMeta } from '@/lib/usePageMeta';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Container, Eyebrow, buttonClass, h2, lead, sectionY } from '@/components/landing/sectionKit';
import { Footer } from '@/components/Footer';

/*
 * /careers: the open job, on the homepage's light design (as the FAQ page).
 *
 * The posting is also a schema.org JobPosting in the prerendered head, which
 * is what Google for Jobs reads. When the role is re-posted or changes, update
 * POSTED (and VALID_THROUGH) together, plus the /careers/ date in
 * scripts/sitemap-dates.json. Only re-date a real re-post: Google treats a
 * date that keeps moving on an unchanged job as spam.
 */

const ROLE = 'Full-Time Pool Service Technician';
/** When this posting went up (YYYY-MM-DD), and the date it lapses unless re-posted. */
const POSTED = '2026-11-08';
const VALID_THROUGH = '2027-01-07';
/** Written out rather than formatted, so the server and browser render the same text. */
const POSTED_LABEL = 'Nov 8, 2026';
/** Starting weekly pay, and the stops in a full route it covers. */
const START_PAY = 800;
const ROUTE_STOPS = 70;

const APPLY_SUBJECT = `${ROLE} — Application`;
const APPLY_BODY =
  "Hi Suncoast Pool Pros team,%0D%0A%0D%0AI'd like to apply for the full-time Pool Service Technician role.%0D%0A%0D%0AName:%0D%0APhone:%0D%0AArea you live in:%0D%0APool / field experience:%0D%0A%0D%0A(Attach your resume if you have one, but it's not required.)";
const APPLY_HREF = `mailto:${EMAIL}?subject=${encodeURIComponent(APPLY_SUBJECT)}&body=${APPLY_BODY}`;

const PAGE_TITLE = 'Full-Time Pool Tech Job: Clearwater, Largo & Palm Harbor';
const PAGE_DESC =
  'Hiring a full-time pool tech in the Clearwater, Largo & Palm Harbor area. From $800/week for about 70 stops, paid training and a company truck.';

type Item = { icon: LucideIcon; title: string; body: string };

const offer: Item[] = [
  {
    icon: Wallet,
    title: `Starting at $${START_PAY} a week`,
    body: 'Paid weekly from day one, and you earn more as your route grows. We treat our techs like the professionals they are.',
  },
  {
    icon: CalendarCheck,
    title: `About ${ROUTE_STOPS} stops a week`,
    body: `Not the 100+ pools some companies pile on. A full route here is about ${ROUTE_STOPS} stops on a set Monday–Saturday schedule, so there's time to do every pool right and still get home every night.`,
  },
  {
    icon: GraduationCap,
    title: 'Paid training & growth',
    body: "We'll train you on everything from chemistry to equipment, with real room to grow as the company grows.",
  },
  {
    icon: Truck,
    title: 'Truck, gear & fuel provided',
    body: 'We provide the company vehicle, equipment and fuel, so you keep more of what you earn.',
  },
];

const dayInLife = [
  'Start your day with a set route of pools',
  'Brush, skim, vacuum and empty baskets at each stop',
  'Test and balance water chemistry; check the pump, filter and salt cell',
  'Send a photo-backed service report so the customer sees the work',
  'Flag anything that needs attention before it becomes a problem',
  'Wrap up and head home: no late nights, no weekend surprises',
];

const requirements = [
  "A valid driver's license and clean driving record",
  'Reliability and a strong work ethic (non-negotiable)',
  'Ability to pass a background check',
  'Comfortable working outdoors in Florida weather',
  "Pool experience is a plus; we'll train the right person",
];

const lookFor: Item[] = [
  {
    icon: ShieldCheck,
    title: 'Reliability above all',
    body: 'Our reputation is built on never missing a visit. We hire people who show up, every time, and take ownership of their routes.',
  },
  {
    icon: Eye,
    title: 'Discretion & professionalism',
    body: "Many of our pools are at waterfront homes. We look for techs who are respectful, quiet and trustworthy on someone's property.",
  },
  {
    icon: HeartHandshake,
    title: 'A customer-first attitude',
    body: 'You represent us at every home. Friendly, honest communication and pride in your work matter as much as technical skill.',
  },
  {
    icon: Sun,
    title: 'Willing to learn coastal pool care',
    body: "Experience helps, but it's not required. If you're dependable and teachable, we'll train you on water chemistry, equipment and the Gulf-coast specifics.",
  },
];

const values: Item[] = [
  {
    icon: CalendarCheck,
    title: 'One standard on every visit',
    body: 'Every customer has a locked-in service day and the same checklist every week. You run set routes and get to know the properties on them, and the work is the same standard no matter the stop.',
  },
  {
    icon: Award,
    title: 'Accountability we can prove',
    body: 'GPS-verified visits and a photo report after every clean. It protects the customer, and it protects you, because your good work is always documented.',
  },
  {
    icon: Sparkles,
    title: 'Respect, for homes and for each other',
    body: "We treat customers' homes like our own and our team like family. No yelling, no chaos, no cutting corners. Just steady, honest work done right.",
  },
];

// The homepage's card edge: a hairline ring and a soft drop.
const cardShadow = 'shadow-[0_0_0_1px_rgba(36,58,85,0.08),0_10px_24px_-16px_rgba(36,58,85,0.3)]';
const iconRing = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ring-1 ring-inset ring-sc-navy/[0.12]';

const ApplyButton = ({ label = 'Apply by email', className = '' }: { label?: string; className?: string }) => (
  <a href={APPLY_HREF} className={`${buttonClass.gold} ${className}`}>
    <Mail className="h-[18px] w-[18px]" />
    {label}
  </a>
);

const CheckList = ({ items }: { items: string[] }) => (
  <ul className="mt-4 space-y-2.5">
    {items.map((line) => (
      <li key={line} className="flex items-start gap-3 text-[15.5px] leading-[1.55] text-sc-navy/[0.82]">
        <CheckCircle2 className="mt-[3px] h-[18px] w-[18px] shrink-0 text-sc-blue" />
        {line}
      </li>
    ))}
  </ul>
);

// Page JSON-LD. Passed through the page-meta hook so it lands in the
// PRERENDERED head — an effect never runs during renderToString, so the HTML
// a crawler reads on first fetch would otherwise carry none of these nodes.
const PAGE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: ROLE,
    datePosted: POSTED,
    validThrough: `${VALID_THROUGH}T23:59:59-05:00`,
    description: [
      `<p>Suncoast Pool Pros is hiring a full-time pool service technician for our routes in the Clearwater, Largo and Palm Harbor area of Pinellas County, FL.</p>`,
      `<p><strong>What you get:</strong></p><ul>${offer.map((o) => `<li>${o.title}: ${o.body}</li>`).join('')}</ul>`,
      `<p><strong>A day on the route:</strong></p><ul>${dayInLife.map((d) => `<li>${d}</li>`).join('')}</ul>`,
      `<p><strong>What you'll need:</strong></p><ul>${requirements.map((r) => `<li>${r}</li>`).join('')}</ul>`,
      `<p>To apply, email ${EMAIL} with your resume or a short note about yourself and your experience.</p>`,
    ].join(''),
    employmentType: 'FULL_TIME',
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: { '@type': 'QuantitativeValue', minValue: START_PAY, unitText: 'WEEK' },
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Suncoast Pool Pros',
      sameAs: 'https://suncoastpoolpros.com/',
      logo: 'https://suncoastpoolpros.com/logo-icon.png',
    },
    jobLocation: [
      {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: 'Clearwater', addressRegion: 'FL', addressCountry: 'US' },
      },
      {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: 'Largo', addressRegion: 'FL', addressCountry: 'US' },
      },
      {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: 'Palm Harbor', addressRegion: 'FL', addressCountry: 'US' },
      },
    ],
    applicantLocationRequirements: { '@type': 'AdministrativeArea', name: 'Pinellas County, FL' },
    directApply: false,
  },
];

export const CareersPage = () => {
  const { open: openQuoteSheet } = useQuoteSheet();

  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/careers/',
    // Inter for the page, Montserrat for the header's wordmark (the homepage's set).
    fontPreload: [FONTS.inter, FONTS.montserrat],
    jsonLd: PAGE_SCHEMA,
    // Its own share card, so a texted job link shows the role, pay and route size.
    ogImage: 'https://suncoastpoolpros.com/og-careers-v1.jpg',
    ogImageAlt: 'Now hiring: Full-Time Pool Service Technician, from $800 a week, about 70 stops',
  });

  return (
    <div className="landing-canvas force-static-motion relative min-h-screen overflow-x-clip bg-white font-sans text-sc-navy antialiased">
      <LandingHeader onQuote={openQuoteSheet} />

      <main>
        {/* Hero: white into the mist the job card sits on. */}
        <section className="bg-[linear-gradient(#fff,#f5f9fd)] px-4 pb-14 pt-14 text-center sm:px-8 sm:pt-20">
          <div className="mx-auto max-w-3xl">
            <Eyebrow centered>Now hiring · Clearwater, Largo &amp; Palm Harbor</Eyebrow>
            <h1 className="mt-4 text-balance text-[38px] font-[650] leading-[1.06] tracking-[-0.04em] text-sc-navy sm:text-[52px]">
              Now hiring a full-time pool service technician
            </h1>
            <p className="mt-5 text-[18px] font-semibold tracking-[-0.01em] text-sc-navy sm:text-[20px]">
              Starting at ${START_PAY}/week · about {ROUTE_STOPS} stops, not 100+
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-[17px] leading-[1.6] text-sc-muted sm:text-[18px]">
              We're a locally owned pool service that runs on reliability, respect and doing honest work right. If
              you're dependable and take pride in your work, there's a steady route and a real team waiting for you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ApplyButton className="w-full sm:w-auto" />
              <a href="#open-role" className={`${buttonClass.outline} w-full sm:w-auto`}>
                See the job
              </a>
            </div>
            <p className="mt-4 text-[14px] text-sc-muted">
              No resume? No problem. Email us and tell us a bit about yourself.
            </p>
          </div>
        </section>

        {/* The job: navy header band on a white card, the proposal-card pairing. */}
        <section id="open-role" aria-labelledby="role-title" className="scroll-mt-20 bg-sc-mist px-0 pb-20 sm:pb-24">
          <Container>
            <article className={`overflow-hidden rounded-[20px] bg-white ${cardShadow}`}>
              <header className="flex flex-col gap-6 bg-sc-navy px-6 py-8 text-white sm:px-10 sm:py-10 md:flex-row md:items-end md:justify-between">
                <div>
                  <Eyebrow gold>Open role</Eyebrow>
                  <h2 id="role-title" className="mt-3 text-[28px] font-[650] leading-[1.12] tracking-[-0.03em] sm:text-[36px]">
                    {ROLE}
                  </h2>
                  <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14.5px] text-white/75">
                    <li className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-sc-glacier" /> Full-time · Mon–Sat
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-sc-glacier" /> From ${START_PAY}/week · ~{ROUTE_STOPS} stops
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-sc-glacier" /> Clearwater, Largo &amp; Palm Harbor area
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-sc-glacier" />
                      <span>
                        Posted <time dateTime={POSTED}>{POSTED_LABEL}</time>
                      </span>
                    </li>
                  </ul>
                </div>
                <ApplyButton label="Apply now" className="w-full shrink-0 md:w-auto" />
              </header>

              <div className="grid gap-10 px-6 py-9 sm:px-10 sm:py-10 md:grid-cols-2">
                <div>
                  <h3 className="text-[19px] font-[650] tracking-[-0.02em]">A day on the route</h3>
                  <CheckList items={dayInLife} />
                </div>
                <div>
                  <h3 className="text-[19px] font-[650] tracking-[-0.02em]">What you'll need</h3>
                  <CheckList items={requirements} />
                </div>
              </div>

              <div className="border-t border-sc-navy/[0.08] px-6 py-9 sm:px-10 sm:py-10">
                <h3 className="text-[19px] font-[650] tracking-[-0.02em]">What you get</h3>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {offer.map((item) => (
                    <div key={item.title}>
                      <span className={iconRing}>
                        <item.icon className="h-5 w-5 text-sc-blue" />
                      </span>
                      <p className="mt-4 text-[16px] font-semibold tracking-[-0.01em]">{item.title}</p>
                      <p className="mt-1.5 text-[15px] leading-[1.55] text-sc-navy/70">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </Container>
        </section>

        {/* What we look for */}
        <section aria-labelledby="look-for-title" className={`bg-white ${sectionY}`}>
          <Container>
            <div className="max-w-2xl">
              <Eyebrow>What we look for</Eyebrow>
              <h2 id="look-for-title" className={h2}>
                The right person matters more than the right resume.
              </h2>
              <p className={lead}>Skills can be taught. Character can't. Here's what earns a spot on our team.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {lookFor.map((item) => (
                <div key={item.title} className={`flex gap-5 rounded-[16px] bg-white p-6 sm:p-7 ${cardShadow}`}>
                  <span className={iconRing}>
                    <item.icon className="h-5 w-5 text-sc-blue" />
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-[-0.015em]">{item.title}</h3>
                    <p className="mt-2 text-[15.5px] leading-[1.6] text-sc-navy/[0.72]">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* How we run things: a numbered ledger on the mist. */}
        <section aria-labelledby="values-title" className={`bg-sc-mist ${sectionY}`}>
          <Container>
            <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div className="lg:sticky lg:top-28">
                <Eyebrow>How we run things</Eyebrow>
                <h2 id="values-title" className={h2}>
                  Set routes. One standard. No cutting corners.
                </h2>
                <p className={lead}>
                  The way we run the business is the reason customers stay, and the reason this is a good place to
                  work. It comes down to three things we don't compromise on.
                </p>
              </div>
              <ol className="space-y-8">
                {values.map((item, i) => (
                  <li key={item.title} className="flex gap-6 border-b border-sc-navy/[0.1] pb-8 last:border-0 last:pb-0">
                    <span className="w-12 shrink-0 text-[36px] font-[650] leading-none tracking-[-0.04em] text-sc-blue/35 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="flex items-center gap-2.5 text-[19px] font-[650] tracking-[-0.02em]">
                        <item.icon className="h-5 w-5 text-sc-blue" />
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[15.5px] leading-[1.6] text-sc-navy/[0.72]">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Container>
        </section>

        {/* Closing CTA: the homepage's navy card. */}
        <section aria-labelledby="apply-title" className={`bg-white ${sectionY}`}>
          <Container>
            <div className="cta-depth rounded-[24px] px-6 py-14 text-center sm:px-12 sm:py-[72px]">
              <h2 id="apply-title" className={`${h2} mx-auto max-w-2xl text-white`}>
                Ready to join the team?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-pretty text-[17px] leading-[1.6] text-white/75">
                Email us your resume, or just a quick note about yourself and your experience. We read every
                application and reply to the ones that are a fit.
              </p>
              <div className="mt-8 flex justify-center">
                <a href={APPLY_HREF} className={`${buttonClass.gold} h-[52px] w-full px-7 sm:w-auto`}>
                  Email {EMAIL}
                  <ArrowRight
                    className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-[3px]"
                    strokeWidth={2.5}
                  />
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
