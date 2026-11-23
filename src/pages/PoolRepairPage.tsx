import { Cpu, Filter, Gauge, Zap } from 'lucide-react';
import { ServiceLandingPage, type ServiceLandingConfig } from '@/components/landing/ServiceLanding';

// Equipment repair. Sources: the services list (pumps, heaters, timers and
// automation; diagnosed before anything is quoted; replaced only when a
// repair won't hold), the saltwater page (generator repairs, cell
// replacements, conversions), the filter service, and a customer review
// (filter system and pump replaced after a hurricane, then a salt
// conversion). No warranty, licence or turnaround claims: add them only once
// the owner confirms them.
const CONFIG: ServiceLandingConfig = {
  path: '/services/pool-repair/',
  title: 'Pool Repair in St. Petersburg, FL | Suncoast Pool Pros',
  description:
    'Pool repair in St. Petersburg, FL: pumps, filters, heaters, timers, automation and salt systems. Diagnosed first, a clear quote, and nothing done until you approve it.',
  name: 'Pool repair',
  h1: (
    <>
      Pool repair in <span className="whitespace-nowrap">St. Petersburg, FL</span>.
    </>
  ),
  lead: 'Pumps, filters, heaters, timers, automation and salt systems, diagnosed before anything is quoted. We repair what will hold and replace only what won’t, and nothing happens until you approve it.',
  card: {
    title: 'How we handle a repair',
    items: [
      'Diagnosed first, then a clear quote',
      'Repaired when a repair will hold',
      'Replaced only when it won’t',
      'Nothing done without your approval',
    ],
  },
  covers: {
    title: 'What we repair.',
    sub: 'The equipment that keeps your water moving, filtered, warm and sanitized.',
    groups: [
      {
        icon: Zap,
        title: 'Pumps and motors',
        items: ['Pumps that won’t prime, hum or run loud', 'Motors that trip or overheat', 'Replacement when a repair won’t last'],
      },
      {
        icon: Filter,
        title: 'Filters',
        items: ['Cartridge, DE and sand filters', 'Properly cleaned, not just hosed off', 'Replaced when cleaning stops helping'],
      },
      {
        icon: Gauge,
        title: 'Heaters, timers and automation',
        items: ['Heaters and heat pumps checked', 'Timers and automation set right', 'Faults traced before anything is swapped'],
      },
      {
        icon: Cpu,
        title: 'Salt systems',
        items: ['Salt cells cleaned or replaced', 'Generator faults diagnosed', 'Conversions from chlorine to salt'],
      },
    ],
  },
  steps: {
    title: 'How a repair works.',
    sub: 'You know what’s wrong and what it costs before any work starts.',
    items: [
      { title: 'Tell us what’s happening', body: 'Call, text a photo of the equipment, or use the form. A short video of a noisy pump helps too.' },
      { title: 'We diagnose and quote', body: 'We find the cause and give you a clear quote: what we’d repair, what we’d replace, and why.' },
      { title: 'You approve, we fix it', body: 'Nothing starts until you say yes. If you’re on weekly service, the fix shows up in your next report.' },
    ],
  },
  form: {
    source: 'pool-repair-form',
    service: 'repair',
    title: 'Get your repair quote.',
    sub: 'Tell us what needs fixing. We’ll reply with next steps, usually the same day.',
    points: ['Diagnosed before anything is quoted', 'Repair first, replace only when needed', 'Your approval before any work'],
    formTitle: 'Your pool repair quote',
    segments: [
      {
        name: 'equipment',
        label: 'What needs fixing?',
        options: [
          { value: 'Pump', label: 'Pump' },
          { value: 'Filter', label: 'Filter' },
          { value: 'Heater', label: 'Heater' },
          { value: 'Salt system', label: 'Salt' },
        ],
        missingText: 'Choose the closest one.',
      },
      {
        name: 'running',
        label: 'Is the equipment running?',
        options: [
          { value: 'Running', label: 'Running' },
          { value: 'Not running', label: 'Not running' },
          { value: 'Not sure', label: 'Not sure' },
        ],
        missingText: 'Choose one, or Not sure.',
      },
    ],
    successTitle: 'Got it. We’ll be in touch today.',
    successBody: 'We’ll come back with next steps for the repair. If a photo of the equipment would help, we’ll ask for one.',
  },
  faqs: [
    {
      q: 'What pool equipment do you repair?',
      a: 'Pumps and motors, cartridge, DE and sand filters, heaters, timers and automation, and salt systems, including salt cells and generators.',
    },
    {
      q: 'Do you repair or replace?',
      a: 'We diagnose first and repair what will hold. We only recommend replacing equipment when a repair genuinely won’t last, and we tell you why.',
    },
    {
      q: 'Will I know the cost before you start?',
      a: 'Yes. You get a clear quote after the diagnosis, and no work starts until you approve it.',
    },
    {
      q: 'Can you convert my pool to saltwater?',
      a: 'Yes. We install salt systems and convert chlorine pools, then look after the cell and salinity as part of weekly service if you’d like.',
    },
    {
      q: 'Do I need to be on weekly service?',
      a: 'No, call or send the form either way. On weekly service, your tech flags problems in the visit report early, often before they turn into a repair.',
    },
  ],
  schema: {
    serviceType: 'Pool Equipment Repair',
    description:
      'Pool repair in St. Petersburg, FL and across Pinellas County: pumps and motors, cartridge, DE and sand filters, heaters, timers, automation and salt systems. Diagnosed before anything is quoted, repaired when a repair will hold, and nothing done without the owner’s approval.',
  },
};

export const PoolRepairPage = () => <ServiceLandingPage c={CONFIG} />;
