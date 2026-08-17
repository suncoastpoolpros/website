/**
 * Status and date formatting shared by the Quotes list and the single-quote view.
 *
 * Lives on its own so the two screens can't drift: a quote that reads "Awaiting"
 * in the list must not read "Expired" once you open it.
 */
import { Check, Clock, CircleSlash } from 'lucide-react';

export type Status = 'accepted' | 'awaiting' | 'expired';

/** Everything the status depends on — deliberately narrow so both screens fit. */
export type Statusable = { acceptedAt: string | null; expiresAt: string };

export const statusOf = (q: Statusable): Status => {
  if (q.acceptedAt) return 'accepted';
  return new Date(q.expiresAt).getTime() < Date.now() ? 'expired' : 'awaiting';
};

/** "3 days ago" reads faster than a date when you're scanning for stale ones. */
export const ago = (iso: string): string => {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  if (days < 31) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
};

export const onDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Date AND time, in Florida time. The acceptance record is evidence, so it gets
 * the precise moment and an explicit zone — "Aug 16" isn't a timestamp, and a
 * timestamp without a zone is an argument waiting to happen.
 */
export const onDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  })} ET`;
};

export const STATUS_META: Record<
  Status,
  { label: string; chip: string; accent: string; Icon: typeof Check }
> = {
  accepted: {
    label: 'Accepted',
    chip: 'border-green-500/30 bg-green-500/15 text-green-300',
    accent: 'border-l-green-500/60',
    Icon: Check,
  },
  awaiting: {
    label: 'Awaiting',
    chip: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    accent: 'border-l-amber-400/50',
    Icon: Clock,
  },
  expired: {
    label: 'Expired',
    chip: 'border-white/15 bg-white/5 text-gray-400',
    accent: 'border-l-white/15',
    Icon: CircleSlash,
  },
};
