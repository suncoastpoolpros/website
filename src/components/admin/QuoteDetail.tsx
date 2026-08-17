/**
 * /admin → Quotes → one quote. Everything the database holds about it.
 *
 * The list answers "what's outstanding". This answers "what exactly did I send
 * this person, and what did they agree to" — the pool as surveyed, every tier
 * quoted with its bullets, and once accepted, the signature and the evidence
 * behind it (timestamp, IP, browser, agreement version).
 *
 * EMPTY MEANS INVISIBLE, the same rule the customer-facing documents follow: a
 * field that wasn't filled in prints nothing, and a section with no filled
 * fields doesn't render at all. A screen full of "—" makes a thin quote look
 * broken instead of simply short.
 *
 * Reads /api/admin/quote/:id, behind the same PIN session as everything here.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  Link2,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { formatPrice } from '@/lib/adminApi';
import { STATUS_META, ago, onDate, onDateTime, statusOf } from './quoteFormat';

type Pool = Record<string, unknown>;
type Tier = {
  name?: string;
  price?: string;
  tagline?: string;
  priceNote?: string;
  includes?: string[];
  recommended?: boolean;
  valueNote?: string;
  finePrint?: string;
};
type Proposal = {
  scope?: string;
  price?: string;
  addOns?: Array<{ label?: string; price?: string }>;
  emailNote?: string;
  pricingMode?: string;
  tiers?: Tier[];
};
type Onboarding = Record<string, unknown>;
type Detail = {
  id: string;
  createdAt: string;
  expiresAt: string;
  customer: { name: string; email: string; phone: string | null; address: string | null };
  pool: Pool;
  proposal: Proposal;
  accepted: {
    at: string;
    plan: string | null;
    ip: string | null;
    userAgent: string | null;
    termsVersion: string | null;
    onboarding: Onboarding | null;
  } | null;
};

type Load = { kind: 'loading' } | { kind: 'ready'; quote: Detail } | { kind: 'error' };

/** Trim anything to a display string; non-strings (numbers, legacy values) included. */
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());

/** [label, value] pairs with the blanks already dropped. */
type Rows = Array<[string, string]>;
const rows = (pairs: Array<[string, unknown]>): Rows =>
  pairs.map(([k, v]) => [k, str(v)] as [string, string]).filter(([, v]) => v !== '');

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
    <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">{title}</h2>
    {children}
  </section>
);

/**
 * A definition list, not a grid: the label column is fixed so values line up
 * down the page, and on a phone it stacks instead of squeezing both into a
 * column too narrow to read.
 */
const RowList = ({ items }: { items: Rows }) => (
  <dl className="divide-y divide-white/5">
    {items.map(([label, value]) => (
      <div key={label} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
        <dt className="shrink-0 text-sm text-gray-500 sm:w-40">{label}</dt>
        <dd className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-gray-100">{value}</dd>
      </div>
    ))}
  </dl>
);

export const QuoteDetail = ({ id, onBack }: { id: string; onBack: () => void }) => {
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoad({ kind: 'loading' });
    fetch(`/api/admin/quote/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; quote?: Detail };
        if (!active) return;
        if (res.ok && data.ok && data.quote) setLoad({ kind: 'ready', quote: data.quote });
        else setLoad({ kind: 'error' });
      })
      .catch(() => {
        if (active) setLoad({ kind: 'error' });
      });
    return () => {
      active = false;
    };
  }, [id]);

  const quote = load.kind === 'ready' ? load.quote : null;

  const poolRows = useMemo((): Rows => {
    const p = quote?.pool ?? {};
    const dims = [
      str(p.length) && `${str(p.length)} ft L`,
      str(p.width) && `${str(p.width)} ft W`,
      str(p.avgDepth) && `${str(p.avgDepth)} ft avg`,
    ]
      .filter(Boolean)
      .join(' × ');
    const gallons = str(p.gallons);
    // Matches how the PDF read this exact field, so the screen can't claim the
    // quote promised something the document didn't. Anything that isn't a
    // deliberate yes/no prints nothing.
    const filterAnswer =
      p.filterServiceIncluded === 'yes'
        ? 'Included in the monthly cost'
        : p.filterServiceIncluded === 'no'
          ? 'Quoted separately when needed'
          : '';
    return rows([
      ['Sanitization', p.sanitization],
      ['Filter type', p.filterType],
      ['Filter service', filterAnswer],
      ['Filter make & model', p.filter],
      ['Volume', gallons && `${gallons} gallons`],
      ['Dimensions', dims],
      ['Shape', p.shape],
      ['Pump', p.pump],
      ['Heater', p.heater],
      ['Automation', p.automation],
      ['Equipment notes', p.equipmentNotes],
    ]);
  }, [quote]);

  const contactRows = useMemo((): Rows => {
    const c = quote?.customer;
    return rows([
      ['Service address', c?.address],
      ['Email', c?.email],
      ['Phone', c?.phone],
    ]);
  }, [quote]);

  const acceptanceRows = useMemo((): Rows => {
    const a = quote?.accepted;
    if (!a) return [];
    const ob = a.onboarding ?? {};
    const billing =
      ob.billingSameAsService === false
        ? [
            str(ob.billingName),
            str(ob.billingAddress),
            [str(ob.billingCity), str(ob.billingState), str(ob.billingZip)].filter(Boolean).join(', '),
            str(ob.billingEmail),
          ]
            .filter(Boolean)
            .join('\n')
        : 'Same as service address';
    return rows([
      ['Plan chosen', a.plan],
      ['Accepted', onDateTime(a.at)],
      ['Signed', str(ob.signature)],
      ['Agreement version', a.termsVersion],
      ['Billing', billing],
      ['Preferred start', ob.preferredStart],
      ['Access notes', ob.accessNotes],
      ['IP address', a.ip],
      ['Browser', a.userAgent],
    ]);
  }, [quote]);

  const copyLink = async () => {
    const url = `${window.location.origin}/approve/?t=${encodeURIComponent(id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy the approve link:', url);
    }
  };

  const back = (
    <button
      onClick={onBack}
      className="mb-1 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white"
    >
      <ChevronLeft className="h-4 w-4" /> All quotes
    </button>
  );

  if (load.kind === 'loading') {
    return (
      <div className="min-h-dvh px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-3xl">
          {back}
          <div className="flex justify-center py-20">
            <LoaderCircle className="h-8 w-8 animate-spin text-brand-blue-light" />
          </div>
        </div>
      </div>
    );
  }

  if (load.kind === 'error' || !quote) {
    return (
      <div className="min-h-dvh px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-3xl">
          {back}
          <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-6 text-center text-gray-200">
            <AlertCircle className="mx-auto mb-3 h-7 w-7 text-red-400" />
            Couldn&apos;t open that quote. Go back and try again.
          </div>
        </div>
      </div>
    );
  }

  const status = statusOf({ acceptedAt: quote.accepted?.at ?? null, expiresAt: quote.expiresAt });
  const meta = STATUS_META[status];
  const tiers = quote.proposal.tiers ?? [];
  const addOns = (quote.proposal.addOns ?? []).filter((a) => str(a?.label) || str(a?.price));
  const scope = str(quote.proposal.scope);
  const emailNote = str(quote.proposal.emailNote);
  const singlePrice = str(quote.proposal.price);
  const acceptedPlan = str(quote.accepted?.plan);

  return (
    <div className="min-h-dvh px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl">
        {back}

        <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-white">{quote.customer.name || '—'}</h1>
            <p className="mt-1 text-sm text-gray-400">
              Sent {onDate(quote.createdAt)} · {ago(quote.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${meta.chip}`}
          >
            <meta.Icon className="h-4 w-4" />
            {meta.label}
          </span>
        </div>

        <div className="space-y-4">
          {/* Acceptance leads: when a quote has come back, the record of what
              they agreed to is the reason you opened the page. */}
          {quote.accepted && (
            <section className="rounded-2xl border border-green-500/25 bg-green-500/[0.07] p-5">
              <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-green-300">
                <ShieldCheck className="h-4 w-4" /> Accepted &amp; signed
              </h2>
              <RowList items={acceptanceRows} />
              <p className="mt-3 text-xs leading-relaxed text-gray-400">
                Typed name accepted as signature. The timestamp, IP and browser above were captured at the
                moment they submitted.
              </p>
            </section>
          )}

          {contactRows.length > 0 && (
            <Card title="Customer">
              <RowList items={contactRows} />
              <div className="mt-3 flex flex-wrap gap-2">
                {quote.customer.email && (
                  <a
                    href={`mailto:${quote.customer.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    <Mail className="h-3.5 w-3.5" /> Email
                  </a>
                )}
                {quote.customer.phone && (
                  <a
                    href={`tel:${quote.customer.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call
                  </a>
                )}
                {quote.customer.address && (
                  <a
                    href={`https://maps.apple.com/?q=${encodeURIComponent(quote.customer.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Map
                  </a>
                )}
              </div>
            </Card>
          )}

          {poolRows.length > 0 && (
            <Card title="The pool">
              <RowList items={poolRows} />
            </Card>
          )}

          {(tiers.length > 0 || singlePrice) && (
            <Card title={tiers.length > 1 ? 'Plans quoted' : 'What was quoted'}>
              {tiers.length > 0 ? (
                <div className="space-y-3">
                  {tiers.map((t, i) => {
                    const name = str(t.name);
                    const chosen = !!acceptedPlan && name.toLowerCase() === acceptedPlan.toLowerCase();
                    const includes = (t.includes ?? []).map(str).filter(Boolean);
                    return (
                      <div
                        key={`${name}-${i}`}
                        className={`rounded-xl border p-4 ${
                          chosen ? 'border-green-500/40 bg-green-500/[0.07]' : 'border-white/10 bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-white">{name || 'Plan'}</span>
                            {t.recommended && (
                              <span className="rounded-full bg-brand-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                Recommended
                              </span>
                            )}
                            {chosen && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-300">
                                <Check className="h-3 w-3" /> Chosen
                              </span>
                            )}
                          </div>
                          {str(t.price) && (
                            <span className="font-bold text-brand-blue-light">{formatPrice(str(t.price))}</span>
                          )}
                        </div>
                        {str(t.priceNote) && <p className="mt-0.5 text-xs text-gray-400">{str(t.priceNote)}</p>}
                        {str(t.tagline) && <p className="mt-1 text-sm text-gray-300">{str(t.tagline)}</p>}
                        {includes.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {includes.map((line, j) => (
                              <li key={`${j}-${line.slice(0, 24)}`} className="flex gap-2 text-sm text-gray-300">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {str(t.valueNote) && (
                          <p className="mt-2 text-xs leading-relaxed text-gray-400">{str(t.valueNote)}</p>
                        )}
                        {str(t.finePrint) && (
                          <p className="mt-2 text-xs leading-relaxed text-gray-500">{str(t.finePrint)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-lg font-bold text-brand-blue-light">{formatPrice(singlePrice)}</p>
              )}

              {addOns.length > 0 && (
                <div className="mt-4 border-t border-white/5 pt-3">
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">Add-ons</h3>
                  <ul className="space-y-1">
                    {addOns.map((a, i) => (
                      <li key={`${i}-${str(a.label).slice(0, 24)}`} className="flex justify-between gap-4 text-sm">
                        <span className="text-gray-300">{str(a.label)}</span>
                        <span className="shrink-0 text-gray-400">{formatPrice(str(a.price))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {scope && (
            <Card title="Scope of work">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">{scope}</p>
            </Card>
          )}

          {emailNote && (
            <Card title="Your note in the email">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">{emailNote}</p>
            </Card>
          )}

          <Card title="The approve link">
            <p className="text-sm text-gray-300">
              {status === 'accepted'
                ? `Already accepted — the link now shows their decision. Expires ${onDate(quote.expiresAt)}.`
                : status === 'expired'
                  ? `Expired ${ago(quote.expiresAt)}. Send a fresh proposal to give them a live link.`
                  : `Live until ${onDate(quote.expiresAt)}.`}
            </p>
            {status !== 'expired' && (
              <button
                onClick={copyLink}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-brand-blue-light hover:bg-white/5 hover:text-white"
              >
                <Link2 className="h-4 w-4" /> {copied ? 'Link copied' : 'Copy approve link'}
              </button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
