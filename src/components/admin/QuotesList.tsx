/**
 * /admin → Quotes. Every proposal sent, and what happened to it.
 *
 * Three states a quote can be in, and they're the whole point of the screen:
 * ACCEPTED (they chose a plan — act on it), AWAITING (sent, no answer yet —
 * maybe follow up), EXPIRED (the link is dead — resend if it still matters).
 * Accepted rises to the top because it's the only one with work attached.
 *
 * Reads /api/admin/quotes, which is behind the same PIN session as everything
 * else here.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LoaderCircle,
  LogOut,
  ChevronLeft,
  Check,
  Clock,
  CircleSlash,
  Search,
  Link2,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
} from 'lucide-react';
import { formatPrice } from '@/lib/adminApi';

type Quote = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedPlan: string | null;
  price: string;
  planNames: string[];
};

type Status = 'accepted' | 'awaiting' | 'expired';

type Load =
  | { kind: 'loading' }
  | { kind: 'ready'; quotes: Quote[]; storage: boolean }
  | { kind: 'error' };

const statusOf = (q: Quote): Status => {
  if (q.acceptedAt) return 'accepted';
  return new Date(q.expiresAt).getTime() < Date.now() ? 'expired' : 'awaiting';
};

/** "3 days ago" reads faster than a date when you're scanning for stale ones. */
const ago = (iso: string): string => {
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

const onDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const STATUS_META: Record<Status, { label: string; chip: string; accent: string; Icon: typeof Check }> = {
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

export const QuotesList = ({ onLogout, onBack }: { onLogout: () => void; onBack: () => void }) => {
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuotes = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/quotes');
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        storage?: boolean;
        quotes?: Quote[];
      };
      if (res.ok && data.ok) {
        setLoad({ kind: 'ready', quotes: data.quotes ?? [], storage: data.storage !== false });
      } else {
        setLoad({ kind: 'error' });
      }
    } catch {
      setLoad({ kind: 'error' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const quotes = load.kind === 'ready' ? load.quotes : [];

  const counts = useMemo(() => {
    const c = { all: quotes.length, accepted: 0, awaiting: 0, expired: 0 };
    for (const q of quotes) c[statusOf(q)] += 1;
    return c;
  }, [quotes]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return quotes
      .filter((q) => filter === 'all' || statusOf(q) === filter)
      .filter(
        (q) =>
          !needle ||
          q.name.toLowerCase().includes(needle) ||
          q.email.toLowerCase().includes(needle) ||
          (q.address ?? '').toLowerCase().includes(needle),
      )
      // Accepted first — it's the only status with work attached — then newest.
      .sort((a, b) => {
        const rank = (q: Quote) => (statusOf(q) === 'accepted' ? 0 : statusOf(q) === 'awaiting' ? 1 : 2);
        return rank(a) - rank(b) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [quotes, filter, query]);

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}/approve/?t=${encodeURIComponent(id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
    } catch {
      window.prompt('Copy the approve link:', url);
    }
  };

  return (
    <div className="min-h-dvh px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              onClick={onBack}
              className="mb-1 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" /> All documents
            </button>
            <h1 className="font-display text-2xl font-bold text-white">Quotes</h1>
            <p className="text-sm text-gray-400">Everything sent, and what came back.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchQuotes(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" /> Lock
            </button>
          </div>
        </div>

        {load.kind === 'loading' && (
          <div className="flex justify-center py-20">
            <LoaderCircle className="h-8 w-8 animate-spin text-brand-blue-light" />
          </div>
        )}

        {load.kind === 'error' && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-6 text-center text-gray-200">
            <AlertCircle className="mx-auto mb-3 h-7 w-7 text-red-400" />
            Couldn&apos;t load your quotes. Check the connection and try Refresh.
          </div>
        )}

        {load.kind === 'ready' && !load.storage && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-amber-100">
            <h2 className="font-display text-lg font-bold">Quote storage isn&apos;t connected</h2>
            <p className="mt-2 text-sm leading-relaxed">
              Proposals still send normally — they just don&apos;t carry an accept link, and nothing is
              recorded here. Bind the D1 database <span className="font-mono text-amber-200">DB</span> to this
              Pages project and redeploy to switch it on.
            </p>
          </div>
        )}

        {load.kind === 'ready' && load.storage && quotes.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <Mail className="mx-auto mb-4 h-8 w-8 text-gray-500" />
            <h2 className="font-display text-lg font-bold text-white">No quotes sent yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-400">
              Every proposal you send from here will appear on this page — who it went to, what you quoted,
              and which plan they chose.
            </p>
          </div>
        )}

        {load.kind === 'ready' && load.storage && quotes.length > 0 && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ['all', 'Sent', counts.all],
                  ['accepted', 'Accepted', counts.accepted],
                  ['awaiting', 'Awaiting', counts.awaiting],
                  ['expired', 'Expired', counts.expired],
                ] as const
              ).map(([key, label, n]) => {
                const on = filter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    aria-pressed={on}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      on
                        ? 'border-brand-blue-light bg-brand-blue/20'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                    }`}
                  >
                    <span className="block text-2xl font-bold text-white">{n}</span>
                    <span className="block text-xs uppercase tracking-wider text-gray-400">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email or address"
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none"
              />
            </div>

            {visible.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-gray-400">
                Nothing matches that.
              </p>
            ) : (
              <ul className="space-y-3">
                {visible.map((q) => {
                  const status = statusOf(q);
                  const meta = STATUS_META[status];
                  return (
                    <li
                      key={q.id}
                      className={`rounded-xl border border-l-4 border-white/10 bg-white/[0.03] p-4 ${meta.accent}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{q.name || '—'}</p>
                          <a
                            href={`mailto:${q.email}`}
                            className="block truncate text-sm text-gray-400 hover:text-white"
                          >
                            {q.email}
                          </a>
                          {q.address && <p className="truncate text-xs text-gray-500">{q.address}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.chip}`}
                          >
                            <meta.Icon className="h-3.5 w-3.5" />
                            {meta.label}
                          </span>
                          {q.price && (
                            <span className="text-sm font-bold text-brand-blue-light">
                              {formatPrice(q.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                        {status === 'accepted' ? (
                          <span className="text-green-300">
                            Chose <span className="font-semibold">{q.acceptedPlan}</span> ·{' '}
                            {ago(q.acceptedAt!)}
                          </span>
                        ) : status === 'expired' ? (
                          <span>Link expired {ago(q.expiresAt)}</span>
                        ) : (
                          <span>No answer yet</span>
                        )}
                        <span>Sent {onDate(q.createdAt)}</span>
                        {q.phone && (
                          <a href={`tel:${q.phone}`} className="inline-flex items-center gap-1 hover:text-white">
                            <Phone className="h-3 w-3" /> {q.phone}
                          </a>
                        )}
                        {status === 'awaiting' && (
                          <button
                            onClick={() => copyLink(q.id)}
                            className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-blue-light hover:text-white"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            {copied === q.id ? 'Link copied' : 'Copy approve link'}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};
