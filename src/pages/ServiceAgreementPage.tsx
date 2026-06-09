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
import { usePageMeta } from '@/lib/usePageMeta';

const LAST_UPDATED = '02-22-2026';

// Each block is one clause. `lead` renders a bolded inline label before the text
// (used for the bulleted definition-style items in the original document).
type Block =
  | { type: 'p'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'list'; items: Array<{ lead?: string; text: string }> };

interface Section {
  id: string;
  number: number;
  title: string;
  blocks: Block[];
}

const SECTIONS: Section[] = [
      {
        id: 'authorization',
        number: 1,
        title: 'Service Authorization',
        blocks: [
          {
            type: 'p',
            text: 'By submitting our customer onboarding form, approving an estimate, or otherwise providing written or electronic acceptance of service, you authorize SUNCOAST POOL PROS LLC ("Company," "we," or "us") to provide professional swimming pool maintenance at the service address provided.',
          },
          {
            type: 'p',
            text: 'Electronic submission of our onboarding form constitutes electronic acceptance of this Service Agreement.',
          },
        ],
      },
      {
        id: 'weekly',
        number: 2,
        title: 'Routine Weekly Service',
        blocks: [
          { type: 'subheading', text: 'Recurring service generally includes:' },
          {
            type: 'list',
            items: [
              {
                lead: '100% All-Inclusive Chemical & Salt Management:',
                text: 'Testing and balancing of the standard and specialty maintenance chemicals a standard, balanced pool requires — including Liquid/Tab Chlorine, Muriatic Acid, Shock, Salt, Stabilizer, Phosphate Removers, and routine algaecide — in the normal quantities needed to keep that pool clear.',
              },
              {
                lead: 'Full Salt System Maintenance:',
                text: 'Routine inspections and periodic acid-washing/cleaning of the salt cell to ensure optimal chlorine production.',
              },
              { text: 'Surface skimming and debris removal' },
              { text: 'Brushing pool walls, steps, and tile line' },
              { text: 'Emptying skimmer, pump, and cleaner baskets' },
            ],
          },
          {
            type: 'p',
            text: 'Service schedules may occasionally adjust due to weather, holidays, safety conditions, or operational needs.',
          },
          { type: 'subheading', text: 'Recurring weekly service does not include:' },
          {
            type: 'list',
            items: [
              {
                lead: 'Equipment Repairs:',
                text: 'Troubleshooting, diagnostics, parts replacement, or labor for mechanical failures (e.g., failed motors, leaking housings, or expired salt cells).',
              },
              {
                lead: 'Filter Components:',
                text: 'Replacement of filter media, cartridges, grids, or internal filter components.',
              },
              {
                lead: 'Extreme Corrective Actions:',
                text: '"Green-to-Clean" recoveries or heavy debris removal required due to storms, "Acts of God," construction runoff, or pool neglect prior to start of service.',
              },
              { text: 'Any service outside routine weekly maintenance without prior approval' },
            ],
          },
          {
            type: 'p',
            text: 'Chemical & Salt Coverage Exceptions: Suncoast Pool Pros provides all chemicals, salt, and cell maintenance required for the operation of a standard, balanced pool. To honor this flat-rate model, the following exceptions apply:',
          },
          {
            type: 'list',
            items: [
              {
                lead: 'Customer Interference:',
                text: 'If the Customer or a third party adds salt, chemicals, or foreign substances to the water without our written consent, a Restoration Fee will apply to return the pool to balance.',
              },
              {
                lead: 'Excessive Dilution:',
                text: 'Extreme chemical loss caused by leaving a fill-hose running, pool draining/refilling, or structural leaks is not covered under the flat rate.',
              },
              {
                lead: 'Equipment Failure:',
                text: 'Imbalances caused by malfunctioning customer equipment (broken pumps or old/expired filters) are not covered until the equipment is repaired/replaced.',
              },
              {
                lead: 'Severe Algae & Heavy Treatment:',
                text: 'The flat rate covers algaecide, shock, and chlorine in the routine quantities a standard, balanced pool requires. Severe, recurring, or chemical-resistant algae blooms — including black, mustard, or green algae, and blooms driven by heat, heavy rainfall, high bather load, shade, debris, water features, or circulation limitations — can require specialty algaecides, copper- or polymer-based treatments, metal sequestrants, clarifiers, or chlorine in quantities well beyond routine maintenance. Any treatment beyond routine levels is billed separately at current market rates, quoted per treatment and approved by the Customer before work proceeds.',
              },
              {
                lead: 'Exclusive Control:',
                text: 'To maintain our "Always Blue" guarantee, Suncoast Pool Pros must maintain exclusive control over water chemistry.',
              },
            ],
          },
        ],
      },
      {
        id: 'specialty',
        number: 3,
        title: 'One-Time & Specialty Services',
        blocks: [
          {
            type: 'p',
            text: 'For customers not enrolled in recurring weekly maintenance (e.g., One-Time Cleanups, "Green-to-Clean" recoveries, or Storm Cleanups):',
          },
          {
            type: 'list',
            items: [
              {
                lead: 'Prepayment Required:',
                text: 'Full payment for the estimated labor and initial service call is required in advance to secure a service date. Work will not commence until payment is confirmed.',
              },
              {
                lead: 'Chemicals & Materials:',
                text: 'Unlike our recurring weekly service, chemicals and salt are not included in a flat rate for one-time jobs. Any chemicals required to stabilize the water will be billed separately at current market rates upon completion of the visit.',
              },
              {
                lead: 'Scope of Work:',
                text: 'Service is strictly limited to the specific tasks outlined in the approved estimate.',
              },
              {
                lead: 'No Ongoing Guarantee:',
                text: 'A one-time service visit does not constitute an ongoing maintenance agreement or a guarantee of future water clarity once the technician leaves the site.',
              },
            ],
          },
        ],
      },
      {
        id: 'billing-terms',
        number: 4,
        title: 'Billing & Payment Terms',
        blocks: [
          {
            type: 'list',
            items: [
              {
                lead: 'Recurring Weekly Service:',
                text: 'Service is billed monthly in advance unless otherwise agreed. Invoices not paid within 10 days of the due date may incur a $25 late fee. Accounts more than 15 days past due may be subject to service suspension until the balance is cleared.',
              },
              {
                lead: 'One-Time & Specialty Service:',
                text: 'Full payment for estimated labor and service calls is required in advance to secure a service date. Work will not commence until prepayment is confirmed. Any additional materials or chemicals used during the visit will be invoiced immediately upon completion and are due upon receipt.',
              },
              {
                lead: 'Payment Methods:',
                text: 'A valid payment method should remain on file unless other terms are agreed to. Certain payment methods may include processing fees reflecting actual transaction costs where permitted by law.',
              },
              {
                lead: 'Returned Payments:',
                text: 'Customer is responsible for any declined payment or returned payment fees.',
              },
              {
                lead: 'Transparency:',
                text: 'We strive to maintain transparent pricing and consistent billing across all service types.',
              },
            ],
          },
        ],
      },
      {
        id: 'pricing',
        number: 5,
        title: 'Pricing Adjustments',
        blocks: [
          {
            type: 'p',
            text: 'Suncoast Pool Pros periodically reviews service pricing to reflect changes in chemical costs, labor, fuel, equipment, insurance, and general operating expenses. We reserve the right to adjust service pricing as necessary to maintain consistent service quality and operational standards.',
          },
          {
            type: 'p',
            text: 'Customers will receive at least 30 days written notice prior to any pricing adjustment. Written notice may be provided in accordance with the Communication & Written Notice section of this agreement.',
          },
          {
            type: 'p',
            text: 'Continued service after the notice period constitutes acceptance of the updated pricing.',
          },
        ],
      },
      {
        id: 'cancellation',
        number: 6,
        title: 'Cancellation Policy',
        blocks: [
          {
            type: 'p',
            text: 'Suncoast Pool Pros does not require long-term contracts. However:',
          },
          {
            type: 'p',
            text: 'A minimum 30-day written notice is required to cancel recurring service.',
          },
          {
            type: 'p',
            text: 'Service and billing will continue during the notice period to maintain scheduling consistency and route efficiency.',
          },
        ],
      },
      {
        id: 'communication',
        number: 7,
        title: 'Communication & Written Notice',
        blocks: [
          {
            type: 'p',
            text: 'For purposes of this agreement, "written notice" includes communication provided via email, text message (SMS), customer portal notification, invoice messaging, or other documented electronic communication.',
          },
          {
            type: 'p',
            text: 'Phone calls alone do not constitute written notice unless followed by written confirmation.',
          },
          {
            type: 'p',
            text: 'Customers are responsible for keeping contact information current so important service communications can be delivered.',
          },
        ],
      },
      {
        id: 'customer-responsibilities',
        number: 8,
        title: 'Customer Responsibilities',
        blocks: [
          { type: 'p', text: 'To ensure consistent service quality, customers agree to:' },
          {
            type: 'list',
            items: [
              { text: 'Provide safe, unobstructed access to the pool and equipment' },
              { text: 'Maintain proper water level between service visits' },
              { text: 'Avoid adding chemicals or treatments without notifying us' },
              {
                text: 'Inform us of landscaping, fertilizer application, construction, or exterior work that may impact water quality',
              },
              { text: 'Ensure electrical power to pool equipment remains operational' },
              { text: 'Maintain a functioning garden hose and water supply' },
              { text: 'Secure pets during service visits' },
              { text: 'Maintain pool equipment in operational condition' },
              {
                text: 'Notify us promptly of access changes, scheduling concerns, or exterior work',
              },
            ],
          },
          {
            type: 'p',
            text: 'Failure to meet these conditions may result in missed service, additional charges, or temporary suspension of service.',
          },
        ],
      },
      {
        id: 'equipment',
        number: 9,
        title: 'Equipment Condition & Repairs',
        blocks: [
          {
            type: 'p',
            text: 'Routine maintenance supports water clarity but cannot guarantee results when equipment problems exist.',
          },
          {
            type: 'list',
            items: [
              { text: 'Repair recommendations will be communicated when issues are identified.' },
              { text: 'Diagnostic visits may incur service charges.' },
              { text: 'Declined repairs may impact water clarity or equipment performance.' },
            ],
          },
          {
            type: 'p',
            text: 'Suncoast Pool Pros is not responsible for issues caused by aging equipment, improper installation, pre-existing damage, or declined repairs.',
          },
        ],
      },
      {
        id: 'repairs',
        number: 10,
        title: 'Repairs & Additional Services',
        blocks: [
          { type: 'p', text: 'Repairs, installations, cleanups, or specialty services:' },
          {
            type: 'list',
            items: [
              { text: 'Are quoted separately from routine maintenance or recurring weekly service' },
              { text: 'Require approval before work begins' },
              { text: 'May require deposits for parts or larger projects' },
            ],
          },
          {
            type: 'p',
            text: 'Diagnostic service time may be billable even if repairs are declined.',
          },
        ],
      },
      {
        id: 'construction',
        number: 11,
        title: 'Construction, Pressure Washing & Exterior Work',
        blocks: [
          {
            type: 'p',
            text: 'Construction, remodeling, pressure washing, landscaping, painting, roofing, or similar exterior work near the pool can significantly impact water quality, water chemistry, and equipment operation.',
          },
          {
            type: 'p',
            text: 'These activities may introduce debris, dust, plaster, chemicals, or contaminants into the pool.',
          },
          {
            type: 'p',
            text: 'Suncoast Pool Pros is not responsible for water clarity issues, chemical imbalance, or equipment strain resulting from such activities. Additional cleaning, chemicals, or service visits required will be billed separately.',
          },
          {
            type: 'p',
            text: 'Customers are encouraged to notify us in advance of planned exterior work whenever possible.',
          },
        ],
      },
      {
        id: 'weather',
        number: 12,
        title: 'Weather, Storms & Environmental Factors',
        blocks: [
          {
            type: 'p',
            text: 'Florida weather conditions — including heavy rain, storms, hurricanes, high winds, or landscaping debris — may significantly impact pool conditions.',
          },
          {
            type: 'list',
            items: [
              { text: 'Water chemistry may fluctuate' },
              { text: 'Debris or contaminants may enter the pool' },
              { text: 'Additional chemicals or service may be required' },
            ],
          },
          {
            type: 'p',
            text: 'Additional service required due to environmental factors may incur additional charges.',
          },
        ],
      },
      {
        id: 'water-level',
        number: 13,
        title: 'Water Level & Structural Conditions',
        blocks: [
          {
            type: 'p',
            text: 'Customers are responsible for maintaining proper water level at all times.',
          },
          { type: 'p', text: 'We are not responsible for:' },
          {
            type: 'list',
            items: [
              { text: 'Damage caused by low water levels' },
              { text: 'Pool leaks or structural issues' },
              { text: 'Underground plumbing failures' },
              { text: 'Pre-existing equipment conditions' },
            ],
          },
        ],
      },
      {
        id: 'access',
        number: 14,
        title: 'Access & Safety',
        blocks: [
          { type: 'p', text: 'Service may be postponed if conditions are unsafe, including:' },
          {
            type: 'list',
            items: [
              { text: 'Severe weather' },
              { text: 'Electrical hazards' },
              { text: 'Aggressive animals' },
              { text: 'Unsafe or obstructed access' },
            ],
          },
          {
            type: 'p',
            text: 'Missed visits due to safety conditions may not always be rescheduled the same week.',
          },
        ],
      },
      {
        id: 'liability',
        number: 15,
        title: 'Limitation of Liability',
        blocks: [
          { type: 'p', text: 'While reasonable care is exercised in all services:' },
          {
            type: 'list',
            items: [
              { text: 'We are not responsible for pre-existing pool or equipment issues.' },
              {
                text: 'Liability is limited to the most recent monthly service charge where permitted by law.',
              },
              { text: 'Indirect or consequential damages are excluded where legally allowed.' },
            ],
          },
        ],
      },
      {
        id: 'satisfaction',
        number: 16,
        title: 'Communication & Customer Satisfaction',
        blocks: [
          {
            type: 'p',
            text: 'Customer satisfaction is extremely important to us. If concerns arise, please contact us directly first so we can work toward a fair resolution.',
          },
        ],
      },
      {
        id: 'governing-law',
        number: 17,
        title: 'Governing Law',
        blocks: [
          {
            type: 'p',
            text: 'This Agreement is governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict-of-law provisions.',
          },
          {
            type: 'p',
            text: 'Any dispute arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction and venue of the state and federal courts located in Pinellas County, Florida.',
          },
        ],
      },
      {
        id: 'severability',
        number: 18,
        title: 'Severability',
        blocks: [
          {
            type: 'p',
            text: 'If any provision of this Agreement is found to be invalid, unlawful, or unenforceable, that provision will be limited or removed to the minimum extent necessary, and the remaining provisions will continue in full force and effect.',
          },
        ],
      },
      {
        id: 'entire-agreement',
        number: 19,
        title: 'Entire Agreement',
        blocks: [
          {
            type: 'p',
            text: 'This Agreement, together with any estimates, invoices, or written terms expressly referenced herein, constitutes the entire agreement between you and Suncoast Pool Pros LLC regarding the services described, and supersedes any prior or contemporaneous discussions, representations, or agreements. Any changes to this Agreement must be made in writing as described in the Communication & Written Notice section.',
          },
        ],
      },
      {
        id: 'force-majeure',
        number: 20,
        title: 'Force Majeure',
        blocks: [
          {
            type: 'p',
            text: 'Suncoast Pool Pros LLC is not liable for any delay, interruption, or failure to perform service caused by events beyond our reasonable control, including but not limited to severe weather, hurricanes, floods, fires, natural disasters, "Acts of God," power or water outages, supply shortages, labor disruptions, or government actions.',
          },
          {
            type: 'p',
            text: 'In such events, we will make reasonable efforts to resume service as soon as conditions safely allow.',
          },
        ],
      },
      {
        id: 'assignment',
        number: 21,
        title: 'Assignment',
        blocks: [
          {
            type: 'p',
            text: 'Suncoast Pool Pros LLC may assign or transfer this Agreement, in whole or in part, to a successor or affiliated entity, including in connection with a sale or reorganization of the business. The Customer may not assign or transfer this Agreement without our prior written consent.',
          },
        ],
      },
      {
        id: 'acceptance',
        number: 22,
        title: 'Agreement Acceptance',
        blocks: [
          {
            type: 'p',
            text: 'By submitting onboarding information, approving service, or continuing recurring service, you acknowledge that:',
          },
          {
            type: 'list',
            items: [
              { text: 'You have read this Service Agreement' },
              { text: 'You understand the policies outlined above' },
              { text: 'You agree to these terms of service with Suncoast Pool Pros' },
            ],
          },
          {
            type: 'p',
            text: 'Electronic submission of our onboarding form constitutes legally binding electronic acceptance of this agreement.',
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
    case 'p':
    default:
      return (
        <p key={i} className="text-gray-300 leading-relaxed mb-4">
          {block.text}
        </p>
      );
  }
};

export const ServiceAgreementPage = () => {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  usePageMeta({
    title: 'Service Agreement — Suncoast Pool Pros | St. Petersburg, FL',
    description:
      'The Suncoast Pool Pros service agreement: weekly pool service terms, what’s covered under the flat rate, billing, and the Always Blue Guarantee.',
    canonicalPath: '/service-agreement/',
  });

  useEffect(() => {
    // Keep this legal page out of search results so it doesn't compete with
    // the marketing pages. Remove the tag again on unmount.
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, follow';
    document.head.appendChild(robots);
    return () => {
      document.head.removeChild(robots);
    };
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
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10">
          <p className="text-brand-blue-light font-semibold tracking-[0.15em] uppercase text-sm mb-2">
            Suncoast Pool Pros LLC
          </p>
          <h1 className="font-display font-bold tracking-tight text-white text-4xl sm:text-5xl leading-[1.05] mb-4">
            Service Agreement
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <p className="text-gray-400 text-sm">Last updated: {LAST_UPDATED}</p>
            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-gray-300 backdrop-blur-[10px] transition-colors hover:border-brand-blue/50 hover:text-white hover:bg-white/[0.07]"
            >
              <Printer className="w-4 h-4 text-brand-blue-light transition-transform group-hover:-translate-y-0.5" />
              Print / Save PDF
            </button>
          </div>
          <p className="text-gray-300 leading-relaxed max-w-2xl">
            This Service Agreement governs the pool maintenance services provided by
            Suncoast Pool Pros LLC. Please review it carefully — by submitting our
            onboarding form or continuing service, you agree to the terms below.
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
                  Questions about this agreement? Reach out anytime.
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
