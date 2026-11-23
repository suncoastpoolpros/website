import { BrushCleaning, ClipboardCheck, Droplets, Gauge } from 'lucide-react';
import { ServiceLandingPage, type ServiceLandingConfig } from '@/components/landing/ServiceLanding';

// The core service. "What every visit includes" moved here from the
// homepage: the same four parts, written fresh (sources: the FAQ, How It
// Works, the Service Agreement and the sample report).
const CONFIG: ServiceLandingConfig = {
  path: '/services/weekly-pool-service/',
  title: 'Weekly Pool Service in St. Petersburg, FL | Suncoast Pool Pros',
  description:
    'Weekly pool service in St. Petersburg, FL: cleaning, water chemistry with every standard chemical included, an equipment check and a GPS-verified visit report. One flat rate.',
  name: 'Weekly pool service',
  h1: (
    <>
      Weekly pool service in <span className="whitespace-nowrap">St. Petersburg, FL</span>.
    </>
  ),
  lead: 'Your pool cleaned, balanced and checked on the same day every week, for one flat monthly rate with every standard chemical included. A report lands in your inbox before we leave.',
  card: {
    title: 'One flat monthly rate',
    items: [
      '$0 chemical surcharges, even in summer',
      'No contract, month to month',
      '2-week money-back guarantee',
      'Our Always Blue guarantee',
    ],
  },
  covers: {
    title: 'What every weekly visit includes.',
    sub: 'Four parts, every visit, all covered by your flat rate.',
    groups: [
      {
        icon: BrushCleaning,
        title: 'Weekly cleaning',
        items: ['Walls and waterline brushed', 'Surface skimmed and the pool vacuumed', 'Skimmer and pump baskets emptied'],
      },
      {
        icon: Droplets,
        title: 'Water chemistry',
        items: [
          'Water tested and balanced at every visit',
          'Every standard chemical included',
          'Salt cell care and salinity checks on salt pools',
        ],
      },
      {
        icon: Gauge,
        title: 'Equipment check',
        items: ['Pump, filter and salt system looked over', 'Filter pressure read and logged', 'Issues flagged early, before they get costly'],
      },
      {
        icon: ClipboardCheck,
        title: 'Visit report',
        items: ['Readings, chemicals added and photos', 'GPS-verified at your address', 'Sent before we leave your driveway'],
      },
    ],
  },
  steps: {
    title: 'Getting started takes five minutes.',
    sub: 'No contract to sign, and you don’t need to be home.',
    items: [
      { title: 'Tell us about your pool', body: 'Answer a few quick questions or text us two photos: the pool and the equipment pad.' },
      { title: 'Get your flat monthly price', body: 'A clear number, usually the same day, Monday to Saturday. No obligation.' },
      { title: 'We take it from here', body: 'You get a set weekly day, and we usually start within days. Tell your old company you’re done; we handle the rest.' },
    ],
  },
  form: {
    source: 'weekly-service-form',
    service: 'weekly',
    title: 'Get your weekly service quote.',
    sub: 'Two quick questions and your contact details. We reply with one flat monthly price.',
    points: ['Every standard chemical in the price', 'Month to month, cancel with 30 days’ notice', 'A report after every visit'],
    formTitle: 'Your weekly pool service quote',
    segments: [
      {
        name: 'poolSize',
        label: 'About how big is your pool?',
        options: [
          { value: 'Small', label: 'Small' },
          { value: 'Medium', label: 'Medium' },
          { value: 'Large', label: 'Large' },
          { value: 'Not sure', label: 'Not sure' },
        ],
        missingText: 'Choose a size, or Not sure.',
      },
      {
        name: 'sanitizer',
        label: 'Saltwater or chlorine?',
        options: [
          { value: 'Saltwater', label: 'Saltwater' },
          { value: 'Chlorine', label: 'Chlorine' },
          { value: 'Not sure', label: 'Not sure' },
        ],
        missingText: 'Choose one, or Not sure.',
      },
    ],
    successTitle: 'Got it. We’ll be in touch today.',
    successBody: 'We’ll come back with your flat monthly rate and the day your pool would be on our route.',
  },
  faqs: [
    {
      q: 'What does weekly pool service include?',
      a: 'Every visit: walls and waterline brushed, the surface skimmed, the pool vacuumed and the baskets emptied; the water tested and balanced with every standard chemical included; the pump, filter and salt system checked; and a GPS-verified report with readings, chemicals and photos.',
    },
    {
      q: 'Are chemicals included in the price?',
      a: 'Yes. Every standard chemical is in your flat monthly rate, with no surcharge when summer pushes chlorine demand up.',
    },
    {
      q: 'Do I need to be home?',
      a: 'No. An unlocked gate on your service day, a gate code or a lockbox is all we need. The report shows exactly what we did.',
    },
    {
      q: 'Is there a contract?',
      a: 'No. Service is month to month, and you can stop any time with 30 days’ notice. New customers also get a 2-week money-back guarantee.',
    },
    {
      q: 'What costs extra?',
      a: 'Only major repairs, replacement parts, green-to-clean recovery and major storm cleanup are quoted separately, and nothing is done without your approval first.',
    },
  ],
  schema: {
    serviceType: 'Weekly Pool Service',
    description:
      'Weekly pool service in St. Petersburg, FL and across Pinellas County: walls and waterline brushed, skimmed and vacuumed, baskets emptied, water tested and balanced with every standard chemical included, salt cell care on salt pools, an equipment check, and a GPS-verified visit report. One flat monthly rate, no contract.',
  },
};

export const WeeklyPoolServicePage = () => <ServiceLandingPage c={CONFIG} />;
