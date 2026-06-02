/**
 * The printable PDF proposal, built with @react-pdf/renderer (vector text, not a
 * screenshot — crisp at any zoom). This module is imported DYNAMICALLY at send
 * time only (see ProposalBuilder), so @react-pdf never lands in the marketing
 * bundles or even the initial /admin chunk.
 *
 * Keep the layout visually in step with the HTML preview in ProposalBuilder.
 */
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { type ProposalData, formatPrice } from '@/lib/adminApi';

const NAVY = '#0a1628';
const BLUE_DARK = '#0f4d80';
const INK = '#1f2937';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';

const styles = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 48, fontSize: 10, color: INK, fontFamily: 'Helvetica' },
  header: {
    backgroundColor: NAVY,
    color: '#ffffff',
    paddingVertical: 22,
    paddingHorizontal: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { height: 26, marginRight: 12 },
  brand: { fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase' },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  headerMetaLabel: { fontSize: 8, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },
  headerMetaValue: { fontSize: 10, color: '#ffffff', marginTop: 2, textAlign: 'right' },
  body: { paddingHorizontal: 40, paddingTop: 24 },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    color: BLUE_DARK,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  section: { marginBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 4 },
  rowLabel: { width: 110, color: MUTED },
  rowValue: { flex: 1, color: INK },
  hr: { borderBottomWidth: 1, borderBottomColor: LINE, marginVertical: 4 },
  scope: { lineHeight: 1.5, color: INK },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  photo: {
    width: 244,
    height: 150,
    objectFit: 'cover',
    borderRadius: 4,
    margin: 4,
    borderWidth: 1,
    borderColor: LINE,
  },
  priceBox: {
    marginTop: 6,
    backgroundColor: '#f1f6fb',
    borderWidth: 1,
    borderColor: '#d6e6f3',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: { fontSize: 11, color: MUTED },
  priceValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BLUE_DARK },
  acceptBox: {
    marginTop: 18,
    backgroundColor: '#eefaf0',
    borderWidth: 1,
    borderColor: '#bfe7c6',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  acceptText: { color: '#1d7a33', lineHeight: 1.5 },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
    fontSize: 8,
    color: MUTED,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const Row = ({ label, value }: { label: string; value?: string }) => {
  const v = (value ?? '').trim();
  if (!v) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{v}</Text>
    </View>
  );
};

const dimensionsLine = (pool: ProposalData['pool']): string => {
  const { length, width, avgDepth } = pool;
  const parts = [length && `${length} ft L`, width && `${width} ft W`, avgDepth && `${avgDepth} ft avg depth`]
    .filter(Boolean)
    .join(' × ');
  return parts;
};

export const ProposalDocument = ({
  data,
  photos = [],
  dateLabel,
}: {
  data: ProposalData;
  /** Data-URL JPEGs (already downscaled by the builder) to embed in the PDF. */
  photos?: string[];
  dateLabel: string;
}) => {
  const { customer, pool, proposal } = data;
  const hasPoolBasics = pool.gallons || dimensionsLine(pool) || pool.shape || pool.sanitization;
  const hasEquipment = pool.pump || pool.filter || pool.heater || pool.automation || pool.equipmentNotes;

  return (
    <Document title="Suncoast Pool Pros — Proposal" author="Suncoast Pool Pros">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            {/* Resolves against the page origin at render time (public/email-logo.png). */}
            <Image src="/email-logo.png" style={styles.logo} />
            <View>
              <Text style={styles.brand}>Suncoast Pool Pros</Text>
              <Text style={styles.docTitle}>Service Proposal</Text>
            </View>
          </View>
          <View>
            <Text style={styles.headerMetaLabel}>Date</Text>
            <Text style={styles.headerMetaValue}>{dateLabel}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Prepared For</Text>
            <Row label="Name" value={customer.name} />
            <Row label="Service Address" value={customer.address} />
            <Row label="Email" value={customer.email} />
            <Row label="Phone" value={customer.phone} />
          </View>

          {hasPoolBasics ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Pool — Size & Volume</Text>
              <Row label="Volume" value={pool.gallons ? `${pool.gallons} gallons` : ''} />
              <Row label="Dimensions" value={dimensionsLine(pool)} />
              <Row label="Shape" value={pool.shape} />
              <Row label="Sanitization" value={pool.sanitization} />
            </View>
          ) : null}

          {hasEquipment ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Equipment</Text>
              <Row label="Pump" value={pool.pump} />
              <Row label="Filter" value={pool.filter} />
              <Row label="Heater" value={pool.heater} />
              <Row label="Automation" value={pool.automation} />
              <Row label="Notes" value={pool.equipmentNotes} />
            </View>
          ) : null}

          {photos.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Photos</Text>
              <View style={styles.photoGrid}>
                {photos.map((src, i) => (
                  <Image key={i} src={src} style={styles.photo} />
                ))}
              </View>
            </View>
          ) : null}

          {proposal.scope.trim() ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Scope of Work</Text>
              <Text style={styles.scope}>{proposal.scope.trim()}</Text>
            </View>
          ) : null}

          {proposal.price.trim() ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Investment</Text>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Total</Text>
                <Text style={styles.priceValue}>{formatPrice(proposal.price)}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.acceptBox}>
            <Text style={styles.acceptText}>
              To accept this proposal, simply reply &quot;APPROVED&quot; to the email it was attached
              to, and we&apos;ll get you on the schedule.
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Suncoast Pool Pros · St. Petersburg, FL</Text>
          <Text>suncoastpoolpros.com</Text>
        </View>
      </Page>
    </Document>
  );
};
