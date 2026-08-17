/**
 * The one place the proposal PDF is built.
 *
 * Two surfaces need the same document: the admin builder, which renders it and
 * emails it as an attachment, and the customer's approve page, which offers it
 * as a download. Rendering it in two places is how the emailed copy and the
 * downloaded copy quietly stop matching, so both call in here.
 *
 * @react-pdf/renderer is ~1.4MB and is dynamic-imported, so it stays a lazy
 * chunk fetched on the click that needs it — never part of the initial JS for
 * either page.
 *
 * WHAT "IDENTICAL" MEANS HERE. The download is regenerated from the quote as
 * stored, not a copy of the bytes that were emailed. That's deliberate: it
 * works for quotes sent before this existed, and it needs no blob storage. It
 * reproduces the emailed PDF exactly with one exception — PHOTOS. The builder
 * can attach photos to the PDF, but they are not saved with the quote (only
 * customer, pool and proposal are), so a regenerated copy has none. Everything
 * else, including the proposal date, comes back byte-for-byte because it's all
 * derived from the same stored fields.
 */
import type { ProposalData, Tier } from '@/lib/adminApi';

/** The date under the masthead. Pass the quote's createdAt so a download made
 *  months later still shows the date the proposal was actually sent. */
export const proposalDateLabel = (iso?: string): string => {
  const d = iso ? new Date(iso) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  return safe.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const proposalFilename = (customerName: string): string => {
  const name = customerName.trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `Suncoast-Proposal${name ? '-' + name : ''}.pdf`;
};

/** Render the proposal to a PDF blob. */
export const renderProposalPdf = async ({
  data,
  photos = [],
  dateLabel,
}: {
  data: ProposalData;
  /** Data-URL JPEGs. Only the builder has these; a regenerated copy has none. */
  photos?: string[];
  dateLabel: string;
}): Promise<Blob> => {
  const [{ pdf }, { ProposalDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/admin/ProposalDocument'),
  ]);
  return pdf(<ProposalDocument data={data} photos={photos} dateLabel={dateLabel} />).toBlob();
};

/** Hand a blob to the browser as a download and clean up the object URL. */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on the next tick rather than immediately: Safari has been known to
  // cancel the download if the URL dies in the same frame as the click.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

/**
 * Rebuild a ProposalData from what /api/quote/:token returns.
 *
 * The stored JSON was written by the builder so it has every field, but it
 * arrives as plain JSON — this restores the shape the document expects and
 * fills anything a very old draft might be missing, so one legacy row can't
 * throw while rendering.
 */
export const proposalDataFromQuote = (quote: {
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  pool?: Record<string, unknown> | null;
  proposal?: Record<string, unknown> | null;
}): ProposalData => {
  const pool = (quote.pool ?? {}) as Record<string, unknown>;
  const p = (quote.proposal ?? {}) as Record<string, unknown>;
  const tiers = Array.isArray(p.tiers) ? (p.tiers as Array<Record<string, unknown>>) : [];
  return {
    customer: {
      name: str(quote.customerName),
      address: str(quote.customerAddress),
      email: str(quote.customerEmail),
      phone: str(quote.customerPhone),
    },
    pool: {
      gallons: str(pool.gallons),
      length: str(pool.length),
      width: str(pool.width),
      avgDepth: str(pool.avgDepth),
      shape: str(pool.shape),
      sanitization: str(pool.sanitization),
      pump: str(pool.pump),
      filterType: str(pool.filterType),
      // Tri-state, and a legacy boolean must not become a promise: only the
      // literal 'yes' means the quote said the filter service was included.
      filterServiceIncluded: pool.filterServiceIncluded === 'yes' ? 'yes' : pool.filterServiceIncluded === 'no' ? 'no' : '',
      filter: str(pool.filter),
      heater: str(pool.heater),
      automation: str(pool.automation),
      equipmentNotes: str(pool.equipmentNotes),
    },
    proposal: {
      scope: str(p.scope),
      price: str(p.price),
      addOns: Array.isArray(p.addOns)
        ? (p.addOns as Array<Record<string, unknown>>).map((a) => ({
            label: str(a?.label),
            price: str(a?.price),
          }))
        : [],
      includeBenefits: p.includeBenefits !== false,
      emailNote: str(p.emailNote),
      pricingMode: p.pricingMode === 'tiers' ? 'tiers' : 'single',
      tiers: tiers.map(
        (t): Tier => ({
          name: str(t?.name),
          price: str(t?.price),
          tagline: str(t?.tagline),
          priceNote: str(t?.priceNote),
          includes: Array.isArray(t?.includes) ? (t.includes as unknown[]).map(str) : [],
          recommended: t?.recommended === true,
          valueNote: str(t?.valueNote),
          finePrint: str(t?.finePrint),
        }),
      ),
      presetVersion: typeof p.presetVersion === 'number' ? p.presetVersion : 0,
    },
  };
};
