import { CalendarCheck, ClipboardCheck, Droplets, Users } from 'lucide-react';
import { ServiceLandingPage, type ServiceLandingConfig } from '@/components/landing/ServiceLanding';

// Community and HOA pools. Same sourcing rule as the commercial page: only
// what the quote popup's facility questions and the visit report establish.
const CONFIG: ServiceLandingConfig = {
  path: '/services/hoa-pool-service/',
  title: 'HOA Pool Service in St. Petersburg, FL | Suncoast Pool Pros',
  description:
    'HOA and community pool service in St. Petersburg, FL. A set schedule, every standard chemical included, and a GPS-verified report after every visit for your board or manager.',
  name: 'HOA pool service',
  h1: (
    <>
      HOA pool service in <span className="whitespace-nowrap">St. Petersburg, FL</span>.
    </>
  ),
  lead: 'Community pools kept clean, balanced and open for residents, on a set schedule, with a GPS-verified report after every visit so the board or manager always knows the state of the water.',
  card: {
    title: 'For boards and managers',
    items: [
      'A set schedule, up to daily',
      'Every pool and spa in the community',
      'A report after every visit',
      'One clear quote, no surprises',
    ],
  },
  covers: {
    title: 'What community pool service covers.',
    sub: 'Everything a shared pool needs to stay ready for residents.',
    groups: [
      {
        icon: Droplets,
        title: 'Clean, balanced water',
        items: ['Brushed, skimmed and vacuumed', 'Tested and balanced at every visit', 'Salt, chlorine or bromine'],
      },
      {
        icon: Users,
        title: 'Busy weekends covered',
        items: ['Chemistry kept up with heavy use', 'Pools and spas on one schedule', 'Issues flagged before they close the pool'],
      },
      {
        icon: CalendarCheck,
        title: 'A schedule you can count on',
        items: ['3 or 5 visits a week, or daily', 'We confirm what your community needs', 'Visits GPS-verified and time-stamped'],
      },
      {
        icon: ClipboardCheck,
        title: 'Records for the board',
        items: ['Readings logged at every visit', 'Chemicals added, listed', 'Photos of how we left the pool'],
      },
    ],
  },
  steps: {
    title: 'How we take over your community pool.',
    sub: 'A clear quote first, then a smooth handover from your current company.',
    items: [
      { title: 'Tell us about the pools', body: 'How many pools and spas, how they’re sanitized, and how often you need service.' },
      { title: 'We confirm and quote', body: 'We agree the schedule and what every visit covers, then send one clear quote for the board.' },
      { title: 'We start on your day', body: 'Service starts on the agreed schedule, and every visit lands as a report.' },
    ],
  },
  form: {
    source: 'hoa-service-form',
    service: 'hoa',
    title: 'Get your HOA pool quote.',
    sub: 'Two quick questions about the community and your contact details.',
    points: ['Schedules up to daily', 'A report after every visit', 'One point of contact for the board'],
    formTitle: 'Your HOA pool service quote',
    segments: [
      {
        name: 'poolCount',
        label: 'How many pools and spas?',
        options: [
          { value: 'One', label: 'One' },
          { value: 'Two', label: 'Two' },
          { value: 'Three or more', label: '3+' },
        ],
        missingText: 'Choose how many.',
      },
      {
        name: 'frequency',
        label: 'How often do you need service?',
        options: [
          { value: '3 visits a week', label: '3× a week' },
          { value: '5 visits a week', label: '5× a week' },
          { value: 'Daily', label: 'Daily' },
          { value: 'Not sure', label: 'Not sure' },
        ],
        missingText: 'Choose one, or Not sure.',
      },
    ],
    successTitle: 'Got it. We’ll be in touch.',
    successBody: 'We’ll confirm what your community needs and come back with a clear quote for the board.',
  },
  faqs: [
    {
      q: 'Do you service HOA and condo pools?',
      a: 'Yes. We look after community pools and spas for HOAs, condo associations and apartment communities across St. Petersburg and Pinellas County.',
    },
    {
      q: 'How often will you service our pool?',
      a: 'Three or five visits a week, or daily. We confirm what your community needs before we quote.',
    },
    {
      q: 'What does the board get after each visit?',
      a: 'A report with the readings, the chemicals added and photos, GPS-verified and time-stamped at the pool.',
    },
    {
      q: 'Can you take over from our current company?',
      a: 'Yes. Once the quote is approved, we start on the agreed schedule, so there’s no gap in service.',
    },
  ],
  schema: {
    serviceType: 'HOA Pool Service',
    description:
      'HOA and community pool service in St. Petersburg, FL and across Pinellas County: pools and spas brushed, skimmed, vacuumed, tested and balanced three or five times a week or daily, with a GPS-verified report of readings, chemicals and photos after every visit.',
  },
};

export const HoaPoolServicePage = () => <ServiceLandingPage c={CONFIG} />;
