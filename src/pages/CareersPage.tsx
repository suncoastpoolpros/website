import React, { useEffect } from 'react';
import { m } from 'motion/react';
import {
  Mail,
  ShieldCheck,
  Clock,
  HeartHandshake,
  Sparkles,
  Truck,
  GraduationCap,
  Wallet,
  CalendarCheck,
  Eye,
  Award,
  Sun,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Glass } from '@/components/Glass';
import { Container } from '@/components/Container';
import { EMAIL } from '@/lib/contact';

const APPLY_SUBJECT = 'Pool Service Technician — Application';
const APPLY_BODY =
  'Hi Suncoast Pool Pros team,%0D%0A%0D%0AI\'d like to apply for the Pool Service Technician role.%0D%0A%0D%0AName:%0D%0APhone:%0D%0AArea you live in:%0D%0APool / field experience:%0D%0A%0D%0A(Attach your resume if you have one — but it\'s not required.)';
const APPLY_HREF = `mailto:${EMAIL}?subject=${encodeURIComponent(APPLY_SUBJECT)}&body=${APPLY_BODY}`;

const PAGE_TITLE = 'Careers — Pool Service Technician | Suncoast Pool Pros';
const PAGE_DESC =
  'Join Suncoast Pool Pros in the Tampa Bay area. We hire reliable, professional pool technicians — competitive weekly pay, consistent routes, paid training, and a company truck. Now hiring.';

const lookFor = [
  {
    icon: ShieldCheck,
    title: 'Reliability above all',
    body: 'Our whole reputation is built on never missing a visit. We hire people who show up, every time, and take ownership of their routes.',
  },
  {
    icon: Eye,
    title: 'Discretion & professionalism',
    body: "Many of our pools are at high-value waterfront homes. We look for techs who are respectful, quiet, and trustworthy on someone's property.",
  },
  {
    icon: HeartHandshake,
    title: 'A customer-first attitude',
    body: 'You represent us at every home. Friendly, honest communication and pride in your work matter as much as technical skill.',
  },
  {
    icon: Sun,
    title: 'Willing to learn coastal pool care',
    body: "Experience helps, but it's not required. If you're dependable and teachable, we'll train you on water chemistry, equipment, and the Gulf-coast specifics.",
  },
];

const offer = [
  {
    icon: Wallet,
    title: 'Competitive weekly pay',
    body: 'Steady, competitive pay every week — and we treat our techs like the professionals they are, not a number.',
  },
  {
    icon: CalendarCheck,
    title: 'Consistent routes & schedule',
    body: 'The same routes week to week, a predictable Monday–Saturday schedule, and home every night. No rotating chaos.',
  },
  {
    icon: GraduationCap,
    title: 'Paid training & growth',
    body: "We'll train you on everything from chemistry to equipment, and there's real room to grow as the company grows.",
  },
  {
    icon: Truck,
    title: 'Truck, gear & fuel provided',
    body: 'Show up ready to work — we provide the company vehicle, equipment, and fuel so you keep more of what you earn.',
  },
];

const values = [
  {
    icon: CalendarCheck,
    title: 'Consistency, not rotating crews',
    body: 'Each customer gets the same dedicated technician. It builds trust, it produces better pools, and it makes your job easier because you know every property on your route.',
  },
  {
    icon: Award,
    title: 'Accountability we can prove',
    body: 'GPS-verified visits and a photo report after every clean. It protects the customer — and it protects you, because your good work is always documented.',
  },
  {
    icon: Sparkles,
    title: 'Respect — for homes and for each other',
    body: "We treat customers' homes like our own and we treat our team like family. No yelling, no chaos, no cutting corners. Just steady, honest work done right.",
  },
];

const dayInLife = [
  'Start your day with a set route of pools you know well',
  'Brush, skim, vacuum, and empty baskets at each stop',
  'Test and balance water chemistry; check the pump, filter & salt cell',
  'Snap a photo-backed service report so the customer sees the work',
  'Flag anything that needs attention before it becomes a problem',
  'Wrap up and head home — no late nights, no weekend surprises',
];

const Hero = () => (
  <div className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-mesh opacity-60" />
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[70%] h-[60%] bg-brand-blue/15 rounded-full blur-[150px] animate-float" />
      <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-[#07111c] to-transparent" />
    </div>
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <Glass className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange" />
          </span>
          <span className="text-xs font-medium text-cyan-50 tracking-wider uppercase">
            Now Hiring · St. Pete / Clearwater
          </span>
        </Glass>

        <h1 className="font-display font-bold text-white tracking-tight text-4xl sm:text-5xl md:text-[3.5rem] leading-[1.05] mb-6">
          Build a career you can{' '}
          <span className="text-brand-blue-light">count on.</span>
        </h1>

        <p className="text-lg text-gray-300 font-light max-w-2xl mx-auto leading-relaxed mb-9">
          We're a locally owned pool service that runs on reliability, respect, and doing
          honest work right. If you're dependable and take pride in your work, there's a
          steady route and a real team waiting for you.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a href={APPLY_HREF} className="btn btn-blue">
            <Mail className="w-[18px] h-[18px]" />
            Apply — Email Your Resume
          </a>
          <a
            href="#open-role"
            className="btn btn-glass"
          >
            See the Open Role
          </a>
        </div>
        <p className="mt-4 text-[13px] text-gray-500">
          No resume? No problem — email us and tell us a bit about yourself.
        </p>
      </m.div>
    </div>
  </div>
);

type Item = { icon: React.ComponentType<{ className?: string }>; title: string; body: string };

const CardGrid = ({
  eyebrow,
  heading,
  sub,
  items,
  cols = 2,
}: {
  eyebrow: string;
  heading: string;
  sub: string;
  items: Item[];
  cols?: 2 | 3;
}) => (
  <Container>
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-2xl mb-12"
    >
      <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
        {eyebrow}
      </span>
      <h2 className="section-heading text-white leading-tight mb-4">{heading}</h2>
      <p className="section-subtext">{sub}</p>
    </m.div>
    <div className={`grid grid-cols-1 ${cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-5`}>
      {items.map((item, i) => (
        <m.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="glass-panel rounded-2xl p-6 md:p-7 flex gap-5"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
            <item.icon className="w-6 h-6 text-brand-blue-light" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white mb-2">{item.title}</h3>
            <p className="text-gray-400 leading-relaxed text-[15px]">{item.body}</p>
          </div>
        </m.div>
      ))}
    </div>
  </Container>
);

const OfferBand = () => (
  <section className="py-20 md:py-28 bg-gradient-to-b from-[#07111c] to-[#0a1628] relative overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-brand-blue/[0.07] rounded-full blur-[150px] pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          What We Offer
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          A real job with real support.
        </h2>
        <p className="section-subtext">
          We invest in our techs because steady, well-treated people deliver the
          consistency our customers count on.
        </p>
      </m.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {offer.map((item, i) => (
          <m.div
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.09 }}
            className="text-center px-4 py-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-brand-blue/30 hover:bg-white/[0.05] transition-colors"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue/25 to-brand-blue/5 border border-brand-blue/30 flex items-center justify-center mb-5 shadow-lg shadow-brand-blue/10">
              <item.icon className="w-8 h-8 text-brand-blue-light" />
            </div>
            <h3 className="text-base font-display font-bold text-white mb-2 leading-snug">
              {item.title}
            </h3>
            <p className="text-gray-400 leading-relaxed text-sm">{item.body}</p>
          </m.div>
        ))}
      </div>
    </Container>
  </section>
);

const ValuesSection = () => (
  <section className="py-20 md:py-28 bg-[#0a1628] relative">
    <Container>
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
        {/* Left: the manifesto statement */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:sticky lg:top-28"
        >
          <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
            How We Run Things
          </span>
          <h2 className="section-heading text-white leading-tight mb-4">
            No rotating crews. No cutting corners.
          </h2>
          <p className="section-subtext">
            The way we run the business is the whole reason customers stay — and the
            reason this is a good place to work. It comes down to three things we
            don't compromise on.
          </p>
        </m.div>

        {/* Right: numbered editorial list */}
        <div className="space-y-10">
          {values.map((item, i) => (
            <m.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-6"
            >
              <span className="font-display font-bold text-4xl md:text-5xl text-brand-blue/30 leading-none tabular-nums shrink-0 w-14">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="border-b border-white/10 pb-9">
                <h3 className="text-xl font-display font-bold text-white mb-2 flex items-center gap-2.5">
                  <item.icon className="w-5 h-5 text-brand-blue-light" />
                  {item.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{item.body}</p>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </Container>
  </section>
);

const OpenRole = () => (
  <section id="open-role" className="py-20 md:py-28 bg-gradient-to-b from-[#0a1628] to-[#07111c] relative scroll-mt-20">
    <Container>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-panel rounded-3xl p-8 md:p-12"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
              Open Role
            </span>
            <h2 className="font-display font-bold text-white text-3xl md:text-4xl leading-tight">
              Pool Service Technician
            </h2>
            <p className="text-gray-400 mt-2">Full-time · Tampa Bay / Pinellas County routes</p>
          </div>
          <a href={APPLY_HREF} className="btn btn-orange shrink-0">
            <Mail className="w-[18px] h-[18px]" />
            Apply Now
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-8 border-t border-white/10 pt-8">
          <div>
            <h3 className="text-white font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-blue-light" />
              A day on the route
            </h3>
            <ul className="space-y-2.5">
              {dayInLife.map((line) => (
                <li key={line} className="flex items-start gap-3 text-gray-300 text-[15px] leading-relaxed">
                  <CheckCircle2 className="w-[18px] h-[18px] text-brand-blue-light shrink-0 mt-0.5" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-display font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-blue-light" />
              What you'll need
            </h3>
            <ul className="space-y-2.5 text-gray-300 text-[15px] leading-relaxed">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-[18px] h-[18px] text-brand-blue-light shrink-0 mt-0.5" />
                A valid driver's license and clean driving record
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-[18px] h-[18px] text-brand-blue-light shrink-0 mt-0.5" />
                Reliability and a strong work ethic — non-negotiable
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-[18px] h-[18px] text-brand-blue-light shrink-0 mt-0.5" />
                Ability to pass a background check
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-[18px] h-[18px] text-brand-blue-light shrink-0 mt-0.5" />
                Comfortable working outdoors in Florida weather
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-[18px] h-[18px] text-brand-blue-light shrink-0 mt-0.5" />
                Pool experience is a plus — we'll train the right person
              </li>
            </ul>
          </div>
        </div>
      </m.div>
    </Container>
  </section>
);

const ApplyCta = () => (
  <section className="py-16 md:py-24 bg-[#07111c] relative">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="section-heading text-white leading-tight mb-4">
          Ready to join the team?
        </h2>
        <p className="section-subtext mb-8">
          Email us your resume — or just a quick note about yourself and your experience.
          We read every application and reply to the ones that are a fit.
        </p>
        <a href={APPLY_HREF} className="btn btn-blue text-base px-8 py-3.5">
          <Mail className="w-5 h-5" />
          Email {EMAIL}
        </a>
      </m.div>
    </div>
  </section>
);

export const CareersPage = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = PAGE_TITLE;

    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    const created = !meta;
    const prevDesc = meta?.getAttribute('content') ?? null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', PAGE_DESC);

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'Pool Service Technician',
      description:
        'Full-time pool service technician for Suncoast Pool Pros in the Tampa Bay area. Competitive weekly pay, consistent routes, paid training, and a company truck. Reliability and professionalism required; pool experience a plus.',
      employmentType: 'FULL_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Suncoast Pool Pros',
        sameAs: 'https://suncoastpoolpros.com/',
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'St. Petersburg',
          addressRegion: 'FL',
          addressCountry: 'US',
        },
      },
      applicantLocationRequirements: { '@type': 'AdministrativeArea', name: 'Pinellas County, FL' },
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (created) meta!.remove();
      else if (prevDesc !== null) meta!.setAttribute('content', prevDesc);
      ld.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#1669AE] selection:text-white">
      <div className="fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <section className="py-16 md:py-20 bg-[#07111c]">
          <CardGrid
            eyebrow="What We Look For"
            heading="The right person matters more than the right resume."
            sub="Skills can be taught. Character can't. Here's what earns a spot on our team."
            items={lookFor}
          />
        </section>
        <OfferBand />
        <ValuesSection />
        <OpenRole />
        <ApplyCta />
        <Footer />
      </div>
    </div>
  );
};
