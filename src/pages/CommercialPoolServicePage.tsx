import { Building2, ClipboardCheck, Droplets, Gauge } from 'lucide-react';
import { ServiceLandingPage, type ServiceLandingConfig } from '@/components/landing/ServiceLanding';

// Commercial pools. Built only from what the business confirmed in the quote
// popup's facility questions (several bodies of water, indoor or outdoor,
// salt, chlorine or bromine, controllers or feeders, 3 or 5 visits a week or
// daily) and the visit report every customer gets. No certification,
// inspection or compliance claims until the owner confirms them.
const CONFIG: ServiceLandingConfig = {
  path: '/services/commercial-pool-service/',
  title: 'Commercial Pool Service in St. Petersburg, FL | Suncoast Pool Pros',
  description:
    'Commercial pool service in St. Petersburg, FL for hotels, apartments, gyms and businesses. Visits up to daily, readings logged every visit, a GPS-verified report each time.',
  name: 'Commercial pool service',
  h1: (
    <>
      Commercial pool service in <span className="whitespace-nowrap">St. Petersburg, FL</span>.
    </>
  ),
  lead: 'Pool and spa care for hotels, apartment communities, gyms and other businesses, on the schedule your facility needs, with every visit’s readings, chemicals and photos in a GPS-verified report.',
  card: {
    title: 'Built around your facility',
    items: [
      '3 or 5 visits a week, or daily',
      'Every pool and spa on site',
      'Salt, chlorine or bromine',
      'A report after every visit',
    ],
  },
  covers: {
    title: 'What commercial service covers.',
    sub: 'The same careful weekly routine, scaled to more water and more swimmers.',
    groups: [
      {
        icon: Droplets,
        title: 'Water chemistry',
        items: ['Tested and balanced at every visit', 'Salt, chlorine and bromine systems', 'Automated controllers and feeders'],
      },
      {
        icon: Building2,
        title: 'Every body of water',
        items: ['Main pools, spas and wading pools', 'Indoor and outdoor', 'One schedule for the whole site'],
      },
      {
        icon: Gauge,
        title: 'Equipment',
        items: ['Pumps, filters and feeders checked', 'Filter pressure logged', 'Problems flagged before they close the pool'],
      },
      {
        icon: ClipboardCheck,
        title: 'Records',
        items: ['Readings logged at every visit', 'Photos of how we left the pool', 'GPS-verified, time-stamped visits'],
      },
    ],
  },
  steps: {
    title: 'How we set up your service.',
    sub: 'We confirm what your facility requires before we quote.',
    items: [
      { title: 'Tell us about the site', body: 'How many pools and spas, indoor or outdoor, the sanitizer and how chemicals are fed.' },
      { title: 'We confirm the schedule', body: 'We agree how often the pools need service and what the visit covers, then send one clear quote.' },
      { title: 'Service starts', body: 'Your team gets a report after every visit, so you always know the state of the water.' },
    ],
  },
  form: {
    source: 'commercial-service-form',
    service: 'commercial',
    title: 'Get your commercial quote.',
    sub: 'Two quick questions about the site and your contact details.',
    points: ['Visits up to daily', 'Readings logged every visit', 'One point of contact'],
    formTitle: 'Your commercial pool quote',
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
    successBody: 'We’ll confirm what your facility needs and come back with a clear quote.',
  },
  faqs: [
    {
      q: 'What kinds of commercial pools do you service?',
      a: 'Pools and spas at hotels, apartment and condo communities, gyms and other businesses across St. Petersburg and Pinellas County, indoor or outdoor.',
    },
    {
      q: 'How often can you service a commercial pool?',
      a: 'Three or five visits a week, or daily. We confirm what your facility requires before we quote.',
    },
    {
      q: 'Do you work with bromine and chemical controllers?',
      a: 'Yes. We service salt, chlorine and bromine pools, including ones fed by automated controllers, feeders or by hand.',
    },
    {
      q: 'What records do we get?',
      a: 'A report after every visit with the readings, the chemicals added and photos, GPS-verified and time-stamped at your property.',
    },
  ],
  schema: {
    serviceType: 'Commercial Pool Service',
    description:
      'Commercial pool service in St. Petersburg, FL and across Pinellas County: pools and spas at hotels, apartment communities, gyms and businesses, indoor or outdoor, salt, chlorine or bromine, serviced three or five times a week or daily, with a GPS-verified report of readings, chemicals and photos after every visit.',
  },
};

export const CommercialPoolServicePage = () => <ServiceLandingPage c={CONFIG} />;
