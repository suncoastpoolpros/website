import { Building2, CalendarCheck, CloudLightning, Droplet, RefreshCw, Users, Waves, Wrench } from 'lucide-react';

/**
 * Everything the company does, as the homepage's eight service tiles, in
 * order. The service pages reuse it for their "other services" row. A tile
 * links once its service has a page (`to`); without one it renders as a
 * plain tile, never a dead link.
 */
export const SERVICE_TILES: { icon: typeof Wrench; name: string; to?: string }[] = [
  { icon: CalendarCheck, name: 'Weekly pool service', to: '/services/weekly-pool-service/' },
  { icon: Droplet, name: 'Saltwater pool maintenance', to: '/services/saltwater-pool-service/' },
  { icon: RefreshCw, name: 'Green pool cleanup', to: '/services/green-pool-cleanup/' },
  { icon: CloudLightning, name: 'Storm cleanup', to: '/services/storm-cleanup/' },
  { icon: Wrench, name: 'Pool repair', to: '/services/pool-repair/' },
  { icon: Building2, name: 'Commercial pool service', to: '/services/commercial-pool-service/' },
  { icon: Users, name: 'HOA pool service', to: '/services/hoa-pool-service/' },
  { icon: Waves, name: 'Recreation and therapy', to: '/services/recreation-therapy-pools/' },
];
