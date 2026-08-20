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
  ChevronRight,
  Search,
  Link2,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { approveUrl, quoteUrl } from '@/lib/quoteLinks';
import { formatPrice } from '@/lib/adminApi';
import { QuoteDetail } from './QuoteDetail';
import { STATUS_META, type Status, ago, onDate, statusOf } from './quoteFormat';

type Quote = {
  id: string;
  number?: number | null;
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

type Load =
  | { kind: 'loading' }
  | { kind: 'ready'; quotes: Quote[]; storage: boolean }
  | { kind: 'error' };

export const QuotesList = ({ onLogout, onBack }: { onLogout: () => void; onBack: () => void }) => {
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // The open quote. Kept here rather than in a route so the list's filter,
  // search and scroll survive the round trip — closing a quote must put you back
  // exactly where you were, not at the top of an unfiltered list.
  const [openId, setOpenId] = useState<string | null>(null);

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
          String(q.number ?? '').includes(needle) ||
          q.email.toLowerCase().includes(needle) ||
          (q.address ?? '').toLowerCase().includes(needle),
      )
      // Accepted first — it's the only status with work attached — then newest.
      .sort((a, b) => {
        const rank = (q: Quote) => (statusOf(q) === 'accepted' ? 0 : statusOf(q) === 'awaiting' ? 1 : 2);
        return rank(a) - rank(b) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [quotes, filter, query]);

  /**
   * Two links to the same quote, differing in where they open.
   *
   * The two links carry the SAME secret and differ only by the word in the
   * path — /quote-… opens on the breakdown, /approve-… opens on the plans. Text
   * the first to a lead who has read nothing; the second is what an emailed
   * customer already received, and is the one to resend when they've read the
   * proposal and just need to sign.
   */
  const copyLink = async (id: string, number: number | null | undefined, withBreakdown = false) => {
    const url = withBreakdown
      ? quoteUrl(window.location.origin, id, number)
      : approveUrl(window.location.origin, id, number);
    const key = withBreakdown ? `${id}:full` : id;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      window.prompt('Copy the link:', url);
    }
  };

  // The detail view replaces the list rather than opening over it. This screen
  // is mostly a phone screen, and a modal holding this much record would be a
  // scroll trap inside a scroll.
  if (openId) {
    return (
      <QuoteDetail
        id={openId}
        onBack={() => {
          setOpenId(null);
          // A customer could have accepted while it was open — cheap to re-check
          // and it keeps the tiles honest.
          fetchQuotes(true);
        }}
      />
    );
  }

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
                      className={`group relative rounded-xl border border-l-4 border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/25 hover:bg-white/[0.06] focus-within:border-white/25 sm:pr-10 ${meta.accent}`}
                    >
                      {/* A stretched button rather than a clickable <li>: the row
                          already contains a mailto, a tel and a copy button, and
                          nesting those inside a <button> is invalid HTML. This
                          covers the row and sits UNDER those three (they carry
                          `relative z-10`), so clicking the row's own text opens
                          it while the shortcuts still do their own thing. */}
                      <button
                        onClick={() => setOpenId(q.id)}
                        className="absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-light"
                      >
                        <span className="sr-only">Open the quote for {q.name || 'this customer'}</span>
                      </button>
                      <ChevronRight className="absolute right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-gray-600 transition-colors group-hover:text-gray-300 sm:block" />
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">
                            {q.name || '—'}
                            {q.number ? (
                              <span className="ml-2 text-xs font-normal text-gray-500">#{q.number}</span>
                            ) : null}
                          </p>
                          {q.email ? (
                            <a
                              href={`mailto:${q.email}`}
                              className="relative z-10 block truncate text-sm text-gray-400 hover:text-white"
                            >
                              {q.email}
                            </a>
                          ) : (
                            // A texted quote may have no address. Say so rather
                            // than rendering an empty mailto: link.
                            <span className="block text-sm italic text-gray-500">No email — sent as a link</span>
                          )}
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
                          <a
                            href={`tel:${q.phone}`}
                            className="relative z-10 inline-flex items-center gap-1 hover:text-white"
                          >
                            <Phone className="h-3 w-3" /> {q.phone}
                          </a>
                        )}
                        {status === 'awaiting' && (
                          <span className="relative z-10 ml-auto inline-flex items-center gap-4">
                            <button
                              onClick={() => copyLink(q.id, q.number, true)}
                              title="Opens with the full breakdown before the pricing — for texting"
                              className="inline-flex items-center gap-1 font-semibold text-brand-blue-light hover:text-white"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              {copied === `${q.id}:full` ? 'Copied' : 'Copy text link'}
                            </button>
                            <button
                              onClick={() => copyLink(q.id, q.number)}
                              title="Opens straight on the plans — the link that was emailed"
                              className="inline-flex items-center gap-1 font-semibold text-brand-blue-light hover:text-white"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              {copied === q.id ? 'Copied' : 'Copy approve link'}
                            </button>
                          </span>
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
