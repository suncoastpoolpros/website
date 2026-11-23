import {
  Waves,
  Sprout,
  CloudRain,
  Droplets,
  Filter,
  Wrench,
  Building2,
  Users,
  HeartPulse,
} from 'lucide-react';

/**
 * The one list of services, read by the /services/ hub, the header dropdown,
 * the footer column, and the homepage services grid.
 *
 * It exists because those four surfaces were guaranteed to drift otherwise —
 * the homepage already carried two near-duplicate salt cards and no storm card
 * at all, which is exactly the kind of thing a single source prevents.
 *
 * `to` is set only once a service has its own page. Everything else points at
 * its section on the hub, so no surface ever renders a dead end and the link
 * simply gets better when the page ships. When you add a service page: create
 * it, set `to`, and every surface updates itself.
 */
export type Service = {
  /** Anchor id on the hub page. Also the React key. */
  slug: string;
  /** Dedicated page path, once one exists. */
  to?: string;
  /** Short label for the nav dropdown and footer. */
  label: string;
  /** Card heading on the hub and homepage. */
  title: string;
  /** One-line description. */
  blurb: string;
  icon: typeof Waves;
};

export const services: Service[] = [
  {
    slug: 'weekly',
    to: '/services/weekly-pool-service/',
    label: 'Weekly Pool Cleaning',
    title: 'Weekly pool cleaning',
    blurb:
      'The core service — brushing, skimming, vacuuming and full chemical balancing every week, for one flat monthly rate with the chemicals included.',
    icon: Waves,
  },
  {
    slug: 'green',
    to: '/services/green-pool-recovery/',
    label: 'Green Pool Cleanup',
    title: 'Green pool cleanup',
    blurb:
      'Back to blue from any state, with an honest timeline up front. We vacuum the sludge out rather than draining the pool.',
    icon: Sprout,
  },
  {
    slug: 'storm',
    to: '/services/storm-cleanup/',
    label: 'Storm Cleanup',
    title: 'Storm & hurricane cleanup',
    blurb:
      'Debris out, filter cleaned, chemistry rebuilt and the equipment checked before anything is switched back on. Plus what to do before it hits.',
    icon: CloudRain,
  },
  {
    slug: 'salt',
    to: '/services/saltwater-pool-service/',
    label: 'Saltwater Pool Service',
    title: 'Saltwater pool service',
    blurb:
      'Weekly care built around the salt system — the cell cleaned and the salt topped up in the rate, the generator checked every visit, algae kept out.',
    icon: Droplets,
  },
  {
    slug: 'filter',
    label: 'Filter Service',
    title: 'Filter cleaning & replacement',
    blurb:
      'Cartridge, DE and sand — stripped and properly cleaned rather than hosed off, then replaced when cleaning stops buying you anything.',
    icon: Filter,
  },
  {
    slug: 'equipment',
    to: '/services/pool-repair/',
    label: 'Pool Repair',
    title: 'Pool repair',
    blurb:
      'Pumps, filters, heaters, timers, automation and salt systems, diagnosed before anything is quoted and replaced only when a repair genuinely will not hold.',
    icon: Wrench,
  },
  {
    slug: 'commercial',
    to: '/services/commercial-pool-service/',
    label: 'Commercial Pool Service',
    title: 'Commercial pool service',
    blurb:
      'Pools and spas at hotels, apartment communities, gyms and businesses, serviced up to daily, with readings logged in a report after every visit.',
    icon: Building2,
  },
  {
    slug: 'hoa',
    to: '/services/hoa-pool-service/',
    label: 'HOA Pool Service',
    title: 'HOA pool service',
    blurb:
      'Community pools kept clean, balanced and open for residents on a set schedule, with a report after every visit for the board or manager.',
    icon: Users,
  },
  {
    slug: 'recreation',
    to: '/services/recreation-therapy-pools/',
    label: 'Recreation & Therapy Pools',
    title: 'Recreation and therapy pools',
    blurb:
      'Recreation and aquatic centers, therapy pools and medical facilities, including warm-water and indoor pools, serviced up to daily.',
    icon: HeartPulse,
  },
];

/** Where a surface should link a service: its own page, or its hub section. */
export const serviceHref = (s: Service) => s.to ?? `/services/#${s.slug}`;

/** Services with a dedicated page — what the nav dropdown lists. */
export const pagedServices = services.filter((s) => s.to);
