import {
  Waves,
  Sprout,
  CloudRain,
  Droplets,
  Filter,
  Wrench,
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
    to: '/services/',
    label: 'Weekly Pool Cleaning',
    title: 'Weekly pool cleaning',
    blurb:
      'The core service — brushing, skimming, vacuuming and full chemical balancing every week, for one flat monthly rate with the chemicals included.',
    icon: Waves,
  },
  {
    slug: 'green',
    to: '/services/green-pool-recovery/',
    label: 'Green Pool Recovery',
    title: 'Green pool recovery',
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
    label: 'Salt & Chemistry',
    title: 'Salt systems & chemistry',
    blurb:
      'Salt cell cleaning and replacement, system diagnostics, and the chemistry tuning that coastal pools need more of than inland ones.',
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
    label: 'Equipment Repair',
    title: 'Equipment repair & upgrades',
    blurb:
      'Pumps, heaters, timers and automation — diagnosed before anything is quoted, and replaced only when a repair genuinely will not hold.',
    icon: Wrench,
  },
];

/** Where a surface should link a service: its own page, or its hub section. */
export const serviceHref = (s: Service) => s.to ?? `/services/#${s.slug}`;

/** Services with a dedicated page — what the nav dropdown lists. */
export const pagedServices = services.filter((s) => s.to);
