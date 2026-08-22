/**
 * The one place the commercial bid PDF is built.
 *
 * Mirrors src/lib/proposalPdf.tsx: @react-pdf/renderer is ~1.4MB, so it is
 * dynamic-imported here and stays a lazy chunk fetched on the click that needs
 * it — never part of the initial /admin JS.
 */
import type { BusinessProfile, CommercialData } from '@/lib/adminApi';

/** The date under the masthead. */
export const commercialDateLabel = (iso?: string): string => {
  const d = iso ? new Date(iso) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  return safe.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Named for the property rather than a person.
 *
 * A commercial bid is filed by the board or the management company under the
 * association's name, often alongside two competing bids — so "Sunset-Cove"
 * is what makes it findable, and a contact's name would not be.
 */
export const commercialFilename = (propertyName: string, proposalNumber?: number | null): string => {
  const name = propertyName.trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const num = proposalNumber ? `-${proposalNumber}` : '';
  return `Suncoast-Commercial-Proposal${num}${name ? '-' + name : ''}.pdf`;
};

export const renderCommercialPdf = async ({
  data,
  business,
  dateLabel,
  proposalNumber,
}: {
  data: CommercialData;
  business: BusinessProfile;
  dateLabel: string;
  proposalNumber?: number | null;
}): Promise<Blob> => {
  const [{ pdf }, { CommercialDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/admin/CommercialDocument'),
  ]);
  return pdf(
    <CommercialDocument
      data={data}
      business={business}
      dateLabel={dateLabel}
      proposalNumber={proposalNumber}
    />,
  ).toBlob();
};
