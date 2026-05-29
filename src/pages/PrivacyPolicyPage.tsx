import React, { useEffect, useRef, useState } from 'react';
import { Phone, Mail, Printer } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  PHONE_DISPLAY,
  PHONE_HREF,
  EMAIL,
  EMAIL_HREF,
  BUSINESS_NAME,
  ADDRESS_LINE,
  ADDRESS_CITY_STATE_ZIP,
} from '@/lib/contact';

const LAST_UPDATED = '02-20-2026';

// Each block is one clause. `lead` renders a bolded inline label before the text.
type Block =
  | { type: 'p'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'list'; items: Array<{ lead?: string; text: string }> }
  | { type: 'contact' };

interface Section {
  id: string;
  number: number;
  title: string;
  blocks: Block[];
}

const SECTIONS: Section[] = [
  {
    id: 'introduction',
    number: 1,
    title: 'Introduction',
    blocks: [
      {
        type: 'p',
        text: 'Suncoast Pool Pros ("Company," "we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, disclose, and safeguard your information when you visit our website, submit a form (including our customer onboarding form), request service, or otherwise interact with us.',
      },
      {
        type: 'p',
        text: 'By accessing our website or providing information to us, you agree to the practices described in this Privacy Policy.',
      },
    ],
  },
  {
    id: 'information-we-collect',
    number: 2,
    title: 'Information We Collect',
    blocks: [
      { type: 'subheading', text: 'Information You Provide to Us' },
      {
        type: 'p',
        text: 'We may collect personal information that you voluntarily provide, including:',
      },
      {
        type: 'list',
        items: [
          { text: 'Full name' },
          { text: 'Service address' },
          { text: 'Email address' },
          { text: 'Phone number' },
          { text: 'Billing information' },
          { text: 'Payment details (processed through secure third-party providers)' },
        ],
      },
      { type: 'subheading', text: 'Automatically Collected Information' },
      {
        type: 'p',
        text: 'When you visit our website, we may automatically collect certain information such as:',
      },
      {
        type: 'list',
        items: [
          { text: 'IP address' },
          { text: 'Browser type' },
          { text: 'Device type' },
          { text: 'Pages viewed' },
          { text: 'Website usage data' },
          { text: 'Cookies and tracking data' },
        ],
      },
    ],
  },
  {
    id: 'how-we-use',
    number: 3,
    title: 'How We Use Your Information',
    blocks: [
      { type: 'p', text: 'We use the information we collect to:' },
      {
        type: 'list',
        items: [
          { text: 'Provide pool maintenance and related services' },
          { text: 'Schedule and manage service appointments' },
          { text: 'Process payments' },
          { text: 'Send invoices and billing notices' },
          { text: 'Respond to customer inquiries' },
          { text: 'Improve website performance and user experience' },
          { text: 'Comply with legal obligations' },
        ],
      },
      { type: 'p', text: 'We do not sell your personal information.' },
    ],
  },
  {
    id: 'payment-processing',
    number: 4,
    title: 'Payment Processing',
    blocks: [
      {
        type: 'p',
        text: 'Payments are processed through secure third-party providers (such as Stripe or similar services). We do not store full credit card numbers on our servers. Payment processors maintain their own privacy and security policies.',
      },
    ],
  },
  {
    id: 'sharing',
    number: 5,
    title: 'Sharing of Information',
    blocks: [
      {
        type: 'p',
        text: 'We may share limited information with trusted third-party providers solely for business purposes, including:',
      },
      {
        type: 'list',
        items: [
          { text: 'Payment processors' },
          { text: 'Customer relationship management (CRM) platforms' },
          { text: 'Scheduling or invoicing software' },
          { text: 'Accounting providers' },
          { text: 'Website hosting providers' },
        ],
      },
      {
        type: 'p',
        text: 'These providers are required to safeguard your information and may not use it for unrelated purposes.',
      },
      { type: 'p', text: 'We do not sell or rent your personal data.' },
    ],
  },
  {
    id: 'cookies',
    number: 6,
    title: 'Cookies and Tracking Technologies',
    blocks: [
      {
        type: 'p',
        text: 'Our website may use cookies and similar tracking technologies to enhance user experience, analyze traffic, and improve functionality.',
      },
      {
        type: 'p',
        text: 'You may disable cookies in your browser settings; however, some features of our website may not function properly.',
      },
    ],
  },
  {
    id: 'data-security',
    number: 7,
    title: 'Data Security',
    blocks: [
      {
        type: 'p',
        text: 'We implement reasonable administrative, technical, and physical safeguards to protect your personal information. However, no method of online transmission or storage is completely secure, and we cannot guarantee absolute security.',
      },
    ],
  },
  {
    id: 'data-retention',
    number: 8,
    title: 'Data Retention',
    blocks: [
      {
        type: 'p',
        text: 'We retain personal information for as long as necessary to provide our services, maintain your account, fulfill the purposes described in this Privacy Policy, and comply with our legal, tax, accounting, and recordkeeping obligations.',
      },
      {
        type: 'p',
        text: 'When information is no longer needed for these purposes, we take reasonable steps to delete it or securely retain it where required by law.',
      },
    ],
  },
  {
    id: 'your-rights',
    number: 9,
    title: 'Your Rights',
    blocks: [
      {
        type: 'p',
        text: 'Depending on your location and applicable law, you may have the right to:',
      },
      {
        type: 'list',
        items: [
          { text: 'Access the personal information we have about you' },
          { text: 'Correct inaccurate or incomplete information' },
          { text: 'Request deletion of your information (where legally permitted)' },
          { text: 'Opt out of marketing communications' },
        ],
      },
      {
        type: 'p',
        text: 'To exercise any of these rights, please contact us using the information below. We will respond to verified requests within a reasonable timeframe and in accordance with applicable law. We may need to confirm your identity before fulfilling certain requests.',
      },
    ],
  },
  {
    id: 'third-party-links',
    number: 10,
    title: 'Third-Party Links',
    blocks: [
      {
        type: 'p',
        text: 'Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those websites.',
      },
    ],
  },
  {
    id: 'childrens-privacy',
    number: 11,
    title: "Children's Privacy",
    blocks: [
      {
        type: 'p',
        text: 'Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from minors.',
      },
    ],
  },
  {
    id: 'changes',
    number: 12,
    title: 'Changes to This Privacy Policy',
    blocks: [
      {
        type: 'p',
        text: 'We may update this Privacy Policy periodically. The updated version will be posted on this page with a revised "Last Updated" date.',
      },
    ],
  },
  {
    id: 'contact',
    number: 13,
    title: 'Contact Information',
    blocks: [
      {
        type: 'p',
        text: 'If you have questions about this Privacy Policy, please contact:',
      },
      { type: 'contact' },
    ],
  },
  {
    id: 'sms',
    number: 14,
    title: 'SMS / Text Messaging Communications',
    blocks: [
      {
        type: 'p',
        text: 'By providing your phone number to Suncoast Pool Pros, you consent to receive text messages related to your pool service. These may include service scheduling updates, appointment reminders, billing notifications, service-related alerts, and occasional customer service communications.',
      },
      { type: 'p', text: 'Message frequency may vary depending on your service activity.' },
      { type: 'p', text: 'Standard message and data rates may apply based on your mobile carrier.' },
      {
        type: 'p',
        text: 'You may opt out of text communications at any time by replying STOP to any message or by contacting us directly. Reply HELP if you need assistance.',
      },
      {
        type: 'p',
        text: 'We do not sell or share your phone number with third parties for marketing purposes.',
      },
    ],
  },
  {
    id: 'email',
    number: 15,
    title: 'Email Communications & Marketing',
    blocks: [
      {
        type: 'p',
        text: 'By providing your email address to Suncoast Pool Pros, you consent to receive email communications related to your pool service. These may include service updates, invoices, appointment reminders, customer support messages, promotional offers, seasonal service information, and occasional marketing communications.',
      },
      {
        type: 'p',
        text: 'You may unsubscribe from marketing emails at any time by using the unsubscribe link included in our emails or by contacting us directly. Please note that even if you opt out of marketing emails, we may still send service-related communications necessary to maintain your account or scheduled services.',
      },
      {
        type: 'p',
        text: 'We do not sell, rent, or share your email address with third parties for marketing purposes.',
      },
    ],
  },
];

const renderBlock = (block: Block, i: number) => {
  switch (block.type) {
    case 'subheading':
      return (
        <p key={i} className="text-white font-semibold mt-6 mb-3">
          {block.text}
        </p>
      );
    case 'list':
      return (
        <ul key={i} className="space-y-2.5 mb-4">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-gray-300 leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue-light" />
              <span>
                {item.lead && <span className="font-semibold text-white">{item.lead} </span>}
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      );
    case 'contact':
      return (
        <div key={i} className="mb-4 space-y-1.5 text-gray-300 leading-relaxed">
          <p className="text-white font-semibold">Suncoast Pool Pros</p>
          <p>
            <span className="font-semibold text-white">Phone:</span>{' '}
            <a
              href={PHONE_HREF}
              className="text-brand-blue-light hover:text-white transition-colors"
            >
              {PHONE_DISPLAY}
            </a>
          </p>
          <p>
            <span className="font-semibold text-white">Email:</span>{' '}
            <a
              href={EMAIL_HREF}
              className="text-brand-blue-light hover:text-white transition-colors break-all"
            >
              {EMAIL}
            </a>
          </p>
        </div>
      );
    case 'p':
    default:
      return (
        <p key={i} className="text-gray-300 leading-relaxed mb-4">
          {block.text}
        </p>
      );
  }
};

export const PrivacyPolicyPage = () => {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    document.title = 'Privacy Policy — Suncoast Pool Pros | St. Petersburg, FL';
    // Intentionally indexable: SMS carrier / A2P 10DLC registration typically
    // requires a publicly reachable privacy policy with the consent language.
  }, []);

  // Scroll-spy: highlight the TOC entry for whichever section is nearest the
  // top of the viewport. The rootMargin biases the "active" zone to the upper
  // third so a section lights up as its heading scrolls into view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: 0 }
    );
    observerRef.current = observer;
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleTocClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111c] relative selection:bg-[#ff720f] selection:text-white">
      <div className="fixed inset-0 bg-mesh opacity-40 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10">
          <p className="text-brand-blue-light font-semibold tracking-[0.15em] uppercase text-sm mb-2">
            Suncoast Pool Pros LLC
          </p>
          <h1 className="font-display font-bold tracking-tight text-white text-4xl sm:text-5xl leading-[1.05] mb-4">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <p className="text-gray-400 text-sm">Last updated: {LAST_UPDATED}</p>
            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-gray-300 backdrop-blur-sm transition-colors hover:border-brand-blue/50 hover:text-white hover:bg-white/[0.07]"
            >
              <Printer className="w-4 h-4 text-brand-blue-light transition-transform group-hover:-translate-y-0.5" />
              Print / Save PDF
            </button>
          </div>
          <p className="text-gray-300 leading-relaxed max-w-2xl">
            This Privacy Policy explains how Suncoast Pool Pros LLC collects, uses, and
            protects your personal information. By using our website or providing your
            information, you agree to the practices described below.
          </p>
        </section>

        {/* TOC sidebar + content */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
            {/* Table of contents */}
            <nav aria-label="Sections" className="mb-8 lg:mb-0">
              <div className="lg:sticky lg:top-24">
                <p className="text-gray-500 font-semibold tracking-[0.15em] uppercase text-[11px] mb-3 px-3">
                  On this page
                </p>
                <ul className="space-y-0.5 max-h-[70vh] overflow-y-auto no-scrollbar">
                  {SECTIONS.map((section) => {
                    const active = section.id === activeId;
                    return (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          onClick={(e) => handleTocClick(e, section.id)}
                          aria-current={active ? 'true' : undefined}
                          className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                            active
                              ? 'text-white bg-white/[0.05]'
                              : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                          }`}
                        >
                          <span className="text-gray-500 mr-1.5">{section.number}.</span>
                          {section.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>

            {/* Content */}
            <div className="min-w-0">
              <div className="space-y-12">
                {SECTIONS.map((section) => (
                  <article key={section.id} id={section.id} className="scroll-mt-24">
                    <h2 className="font-display font-bold text-white text-xl sm:text-2xl mb-4 flex items-baseline gap-3">
                      <span className="text-brand-blue-light text-2xl sm:text-3xl font-bold">
                        {section.number}.
                      </span>
                      {section.title}
                    </h2>
                    <div>{section.blocks.map((block, i) => renderBlock(block, i))}</div>
                  </article>
                ))}
              </div>

              {/* Contact footer card */}
              <div className="glass-panel rounded-2xl p-6 sm:p-8 mt-6 text-center">
                <p className="text-gray-400 mb-4 text-sm">
                  Questions about this Privacy Policy? Reach out anytime.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a href={PHONE_HREF} className="btn btn-glass w-full sm:w-auto">
                    <Phone className="w-[18px] h-[18px]" />
                    {PHONE_DISPLAY}
                  </a>
                  <a
                    href={EMAIL_HREF}
                    className="btn btn-glass w-full sm:w-auto"
                  >
                    <Mail className="w-[18px] h-[18px]" />
                    {EMAIL}
                  </a>
                </div>
                <p className="text-gray-500 text-xs mt-5">
                  {BUSINESS_NAME} LLC · {ADDRESS_LINE}, {ADDRESS_CITY_STATE_ZIP}
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};
