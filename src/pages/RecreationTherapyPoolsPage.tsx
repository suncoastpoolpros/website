import { ClipboardCheck, Droplets, Thermometer, Waves } from 'lucide-react';
import { ServiceLandingPage, type ServiceLandingConfig } from '@/components/landing/ServiceLanding';

// Recreation and aquatic centers, and medical or therapy pools. Same
// sourcing rule as the commercial page. The warm-water and bather-load lines
// are general pool chemistry, not claims about the company.
const CONFIG: ServiceLandingConfig = {
  path: '/services/recreation-therapy-pools/',
  title: 'Recreation and Therapy Pool Service in St. Petersburg, FL',
  description:
    'Pool service for recreation centers, aquatic centers and therapy pools in St. Petersburg, FL. Warm and indoor water, heavy use, visits up to daily, readings logged every visit.',
  name: 'Recreation and therapy pools',
  h1: (
    <>
      Recreation and therapy pool service in <span className="whitespace-nowrap">St. Petersburg, FL</span>.
    </>
  ),
  lead: 'Recreation and aquatic centers, therapy pools and medical facilities, serviced as often as daily, with the readings, chemicals and photos from every visit in a GPS-verified report.',
  card: {
    title: 'For high-use and warm-water pools',
    items: [
      '3 or 5 visits a week, or daily',
      'Indoor, outdoor or both',
      'Salt, chlorine or bromine',
      'A report after every visit',
    ],
  },
  covers: {
    title: 'What we look after.',
    sub: 'Pools that see more swimmers, warmer water or both need closer attention.',
    groups: [
      {
        icon: Waves,
        title: 'Recreation and aquatic centers',
        items: ['Lap, leisure and wading pools', 'Spas on the same schedule', 'Chemistry kept up with heavy use'],
      },
      {
        icon: Thermometer,
        title: 'Therapy and medical pools',
        items: ['Warm water, which uses sanitizer faster', 'Indoor pools and spas', 'Bromine systems and feeders'],
      },
      {
        icon: Droplets,
        title: 'Water chemistry',
        items: ['Tested and balanced at every visit', 'Automated controllers and feeders', 'Filter pressure logged'],
      },
      {
        icon: ClipboardCheck,
        title: 'Records',
        items: ['Readings logged at every visit', 'Chemicals added, listed', 'GPS-verified, time-stamped visits'],
      },
    ],
  },
  steps: {
    title: 'How we set up your service.',
    sub: 'We confirm what your facility requires before we quote.',
    items: [
      { title: 'Tell us about the facility', body: 'The pools and spas, indoor or outdoor, the sanitizer and how chemicals are fed.' },
      { title: 'We confirm the schedule', body: 'We agree how often the water needs service and what each visit covers, then quote.' },
      { title: 'Service starts', body: 'Your team gets a report after every visit with the readings and what we added.' },
    ],
  },
  form: {
    source: 'recreation-therapy-form',
    service: 'recreation',
    title: 'Get your facility quote.',
    sub: 'Two quick questions about the facility and your contact details.',
    points: ['Visits up to daily', 'Warm-water and indoor pools', 'Readings logged every visit'],
    formTitle: 'Your recreation or therapy pool quote',
    segments: [
      {
        name: 'facility',
        label: 'What kind of facility?',
        options: [
          { value: 'Recreation or aquatic center', label: 'Recreation' },
          { value: 'Medical or therapy facility', label: 'Therapy' },
        ],
        missingText: 'Choose one.',
      },
      {
        name: 'setting',
        label: 'Indoor or outdoor?',
        options: [
          { value: 'Outdoor', label: 'Outdoor' },
          { value: 'Indoor', label: 'Indoor' },
          { value: 'Both', label: 'Both' },
        ],
        missingText: 'Choose one.',
      },
    ],
    successTitle: 'Got it. We’ll be in touch.',
    successBody: 'We’ll confirm what your facility needs and come back with a clear quote.',
  },
  faqs: [
    {
      q: 'Do you service therapy and medical pools?',
      a: 'Yes. We look after therapy pools and spas at medical and therapy facilities, including warm-water and indoor pools.',
    },
    {
      q: 'Why do warm therapy pools need more attention?',
      a: 'Warm water uses up sanitizer faster and grows algae and bacteria more readily, so the chemistry needs checking more often than a typical pool.',
    },
    {
      q: 'How often can you visit?',
      a: 'Three or five visits a week, or daily. We confirm what your facility requires before we quote.',
    },
    {
      q: 'Do you work with bromine?',
      a: 'Yes. We service salt, chlorine and bromine pools, including ones fed by automated controllers or feeders.',
    },
  ],
  schema: {
    serviceType: 'Recreation and Therapy Pool Service',
    description:
      'Pool service for recreation centers, aquatic centers and therapy pools in St. Petersburg, FL and across Pinellas County: warm-water and indoor pools, salt, chlorine or bromine, serviced three or five times a week or daily, with a GPS-verified report of readings and chemicals after every visit.',
  },
};

export const RecreationTherapyPoolsPage = () => <ServiceLandingPage c={CONFIG} />;
