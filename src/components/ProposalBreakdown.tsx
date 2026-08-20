/**
 * The proposal's case for itself, as HTML.
 *
 * Built for the customer who was TEXTED a link and never got the email or the
 * PDF. For them the approve page was the whole proposal, and it opened straight
 * on two priced cards with nothing explaining what the money buys.
 *
 * HTML rather than an embedded PDF on purpose. A texted link opens on a phone,
 * and that's exactly where PDF-in-an-iframe is worst — iOS Safari commonly
 * renders a blob-URL PDF as a blank frame or hands it to the system viewer,
 * which takes the customer out of the page and the Continue button with them.
 * It would also pull the ~1.4MB PDF engine on load, on cellular, before they've
 * seen anything, to show a document laid out for Letter paper on a 390px
 * screen. The actual PDF stays one tap away via the download link.
 *
 * Every section here is DERIVED from the same modules the PDF and the email
 * use — includedBenefits() and includedExtras() — so this can't drift into
 * saying something the document doesn't. Nothing is written twice.
 */
import React from 'react';
import { Check } from 'lucide-react';
import { BENEFITS_HEADING, includedBenefits } from '@/components/admin/proposalBenefits';
import {
  EXTRAS_COL_THEIRS,
  EXTRAS_COL_YOURS,
  EXTRAS_HEADING,
  EXTRAS_INCLUDED_LABEL,
  EXTRAS_INTRO,
  EXTRAS_NOTE,
  includedExtras,
} from '@/components/admin/includedExtras';

type Pool = {
  gallons?: string;
  length?: string;
  width?: string;
  avgDepth?: string;
  shape?: string;
  sanitization?: string;
  filterType?: string;
  filter?: string;
  filterServiceIncluded?: string | boolean;
  pump?: string;
  heater?: string;
  equipmentNotes?: string;
};

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-4 rounded-2xl border border-[#e3e8ef] bg-white p-5">
    <h2 className="mb-3 font-display text-base font-bold text-[#0a1628]">{title}</h2>
    {children}
  </section>
);

export const ProposalBreakdown = ({
  pool,
  scope,
  includeBenefits = true,
}: {
  pool: Pool;
  scope?: string;
  includeBenefits?: boolean;
}) => {
  // `=== 'yes'` exactly, matching how the PDF read the same field. Anything else
  // means the question wasn't answered, and an unanswered question must not
  // become a promise.
  const filter = { type: str(pool.filterType), included: pool.filterServiceIncluded === 'yes' };
  const benefits = includeBenefits ? includedBenefits(filter, str(pool.sanitization)) : [];
  const extras = includeBenefits ? includedExtras(filter, str(pool.sanitization)) : [];

  const dims = [
    str(pool.length) && `${str(pool.length)} ft L`,
    str(pool.width) && `${str(pool.width)} ft W`,
    str(pool.avgDepth) && `${str(pool.avgDepth)} ft avg`,
  ]
    .filter(Boolean)
    .join(' × ');

  // Empty means invisible, the same rule the PDF and the email follow: a field
  // nobody filled in prints nothing rather than an em-dash.
  const poolRows: Array<[string, string]> = (
    [
      ['Sanitization', str(pool.sanitization)],
      ['Filter', [str(pool.filterType), str(pool.filter)].filter(Boolean).join(' — ')],
      ['Volume', str(pool.gallons) && `${str(pool.gallons)} gallons`],
      ['Dimensions', dims],
      ['Shape', str(pool.shape)],
      ['Pump', str(pool.pump)],
      ['Heater', str(pool.heater)],
      ['Notes', str(pool.equipmentNotes)],
    ] as Array<[string, string]>
  ).filter(([, v]) => v !== '');

  // Parsed the way the PDF parses it: lines starting with a bullet or dash are
  // list items, everything else is a paragraph.
  const scopeLines = (scope ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div>
      {poolRows.length > 0 && (
        <Card title="Your pool">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {poolRows.map(([label, value]) => (
              <div key={label} className="flex gap-3 text-sm">
                <dt className="w-28 shrink-0 text-[#6b7280]">{label}</dt>
                <dd className="min-w-0 flex-1 text-[#0a1628]">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {benefits.length > 0 && (
        <Card title={BENEFITS_HEADING}>
          {/* CSS columns, not a grid: a grid aligns rows, so a two-line bullet
              opposite a one-line one leaves a hole under the short one. */}
          <ul className="sm:columns-2 sm:gap-x-8">
            {benefits.map((b, i) => (
              <li
                key={i}
                className="mb-4 flex break-inside-avoid gap-2 text-sm leading-relaxed text-[#1f2937]"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1d7a33]" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {extras.length > 0 && (
        <Card title={EXTRAS_HEADING}>
          <p className="max-w-3xl text-sm leading-relaxed text-[#374151]">{EXTRAS_INTRO}</p>
          <div className="mt-4 flex items-baseline justify-end gap-6 text-[11px] uppercase tracking-wider text-[#6b7280]">
            <span className="w-24 text-right">{EXTRAS_COL_THEIRS}</span>
            <span className="w-20 text-right">{EXTRAS_COL_YOURS}</span>
          </div>
          <ul className="divide-y divide-[#eef1f5] border-t border-[#eef1f5]">
            {extras.map((x, i) => (
              <li key={i} className="flex items-center gap-6 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#0a1628]">{x.label}</span>
                  <span className="block text-xs text-[#6b7280]">{x.basis}</span>
                </span>
                <span className="w-24 shrink-0 text-right text-sm text-[#6b7280] line-through">
                  {x.typical}
                </span>
                <span className="w-20 shrink-0 text-right text-sm font-bold text-[#1d7a33]">
                  {EXTRAS_INCLUDED_LABEL}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-[#6b7280]">{EXTRAS_NOTE}</p>
        </Card>
      )}

      {scopeLines.length > 0 && (
        <Card title="What we do, every visit">
          <div className="max-w-3xl">
            {scopeLines.map((line, i) =>
              /^[•\-]/.test(line) ? (
                <p key={i} className="mb-3 flex gap-2 text-sm leading-relaxed text-[#374151]">
                  <span className="text-[#1669AE]">•</span>
                  <span>{line.replace(/^[•-]\s*/, '')}</span>
                </p>
              ) : (
                <p key={i} className="mb-3.5 text-sm leading-relaxed text-[#374151]">
                  {line}
                </p>
              ),
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
