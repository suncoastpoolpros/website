/**
 * The printable PDF proposal, built with @react-pdf/renderer (vector text, not a
 * screenshot — crisp at any zoom). This module is imported DYNAMICALLY at send
 * time only (see ProposalBuilder), so @react-pdf never lands in the marketing
 * bundles or even the initial /admin chunk.
 *
 * Layout intent: a clean, high-end one-to-three-page proposal. The branded
 * masthead appears on PAGE 1 ONLY (it's in normal flow, not `fixed`); every page
 * shares a uniform margin and a slim footer with page numbers. Spacing is driven
 * by a small set of shared style tokens so sections read as intentional.
 */
import { Document, Page, Text, View, Image, Link, StyleSheet } from '@react-pdf/renderer';
import { type ProposalData, formatPrice } from '@/lib/adminApi';
import {
  PROPOSAL_TERMS,
  TERMS_FOOTNOTE,
  SERVICE_AGREEMENT_URL,
  SERVICE_AGREEMENT_DISPLAY,
} from './proposalTerms';
import { BENEFITS_HEADING, INCLUDED_BENEFITS, BENEFITS_NOTE, BENEFITS_FOOTNOTE } from './proposalBenefits';

const NAVY = '#0a1628';
const NAVY_RULE = '#1d2d47';
const BRAND_BLUE = '#1669ae';
const BLUE_DARK = '#0f4d80';
const INK = '#1f2937';
const MUTED = '#6b7280';
const FAINT = '#8a93a3';
const LINE = '#e6e9ef';
const TINT = '#f1f7fc';
const TINT_BORDER = '#d4e6f4';
const GREEN = '#1d7a33';

// Uniform page margins (so continuation pages get clean top/side margins too).
const MARGIN_X = 46;

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 62,
    paddingHorizontal: MARGIN_X,
    fontSize: 10,
    color: INK,
    fontFamily: 'Helvetica',
    lineHeight: 1.45,
  },

  // ----- Masthead (page 1 only) -----
  header: {
    backgroundColor: NAVY,
    borderRadius: 10,
    paddingVertical: 22,
    paddingHorizontal: 26,
    marginBottom: 28,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 46, height: 33, marginRight: 12 },
  brandName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#ffffff', letterSpacing: 1.5 },
  brandTag: { fontSize: 7, color: '#8ea2c0', letterSpacing: 1.5, marginTop: 3, textTransform: 'uppercase' },
  metaCol: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 7, color: '#8ea2c0', letterSpacing: 1.5, textTransform: 'uppercase' },
  metaValue: { fontSize: 10.5, color: '#ffffff', marginTop: 3, fontFamily: 'Helvetica-Bold' },
  headerDivider: { height: 1, backgroundColor: NAVY_RULE, marginTop: 16, marginBottom: 14 },
  title: { fontSize: 21, fontFamily: 'Helvetica-Bold', color: '#ffffff', letterSpacing: 0.4 },
  titleAccent: { marginTop: 9, height: 3, width: 52, backgroundColor: BRAND_BLUE, borderRadius: 2 },

  // ----- Shared section tokens -----
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.3,
    color: BLUE_DARK,
    textTransform: 'uppercase',
    marginBottom: 9,
  },
  row: { flexDirection: 'row', marginBottom: 5 },
  rowLabel: { width: 118, color: MUTED },
  rowValue: { flex: 1, color: INK },

  // ----- Included highlight -----
  includedBox: {
    marginBottom: 22,
    backgroundColor: TINT,
    borderWidth: 1,
    borderColor: TINT_BORDER,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  includedHeading: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: BLUE_DARK, marginBottom: 9 },
  includedItem: { flexDirection: 'row', marginBottom: 5 },
  includedCheck: { color: GREEN, fontFamily: 'Helvetica-Bold', width: 14 },
  includedItemText: { color: NAVY, flex: 1, fontFamily: 'Helvetica-Bold' },
  includedNote: { marginTop: 8, fontSize: 9, color: MUTED, fontStyle: 'italic' },
  includedFootnote: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: TINT_BORDER, fontSize: 8, color: FAINT, lineHeight: 1.4 },

  // ----- Scope -----
  scopeIntro: { color: INK, marginBottom: 6, lineHeight: 1.45 },
  scopePara: { color: INK, marginBottom: 6, lineHeight: 1.45 },
  scopeBullet: { flexDirection: 'row', marginBottom: 4, paddingLeft: 2 },
  scopeBulletDot: { width: 12, color: BRAND_BLUE },
  scopeBulletText: { flex: 1, color: INK, lineHeight: 1.4 },

  // ----- Photos -----
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  photo: {
    width: 248,
    height: 156,
    objectFit: 'cover',
    borderRadius: 5,
    marginRight: 9,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: LINE,
  },

  // ----- Investment -----
  priceBox: {
    backgroundColor: TINT,
    borderWidth: 1,
    borderColor: TINT_BORDER,
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: { fontSize: 10, color: MUTED, letterSpacing: 1, textTransform: 'uppercase' },
  priceValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: BLUE_DARK },

  // ----- Add-ons -----
  addonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  addonLabel: { color: INK, flex: 1, paddingRight: 12 },
  addonPrice: { color: INK, fontFamily: 'Helvetica-Bold' },

  // ----- Accept -----
  acceptBox: {
    backgroundColor: '#eef8f0',
    borderWidth: 1,
    borderColor: '#c2e6c8',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  acceptText: { color: GREEN, lineHeight: 1.5 },

  // ----- Terms -----
  termsSection: { marginTop: 4 },
  termsItem: { marginBottom: 8 },
  termsHeading: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 2 },
  termsText: { fontSize: 7.8, color: '#5b6470', lineHeight: 1.45 },
  termsFootnote: { marginTop: 4, fontSize: 7.5, color: MUTED, fontStyle: 'italic' },
  termsLink: { color: BLUE_DARK, textDecoration: 'underline' },

  // ----- Footer (every page) -----
  footer: {
    position: 'absolute',
    bottom: 28,
    left: MARGIN_X,
    right: MARGIN_X,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: FAINT },
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
  return [length && `${length} ft L`, width && `${width} ft W`, avgDepth && `${avgDepth} ft avg depth`]
    .filter(Boolean)
    .join(' × ');
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
  const addOns = proposal.addOns.filter((a) => a.label.trim() || a.price.trim());
  const scopeLines = proposal.scope.trim() ? proposal.scope.split('\n') : [];

  return (
    <Document title="Suncoast Pool Pros — Proposal" author="Suncoast Pool Pros">
      <Page size="LETTER" style={styles.page}>
        {/* Masthead — page 1 only (not `fixed`, so it doesn't repeat). */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              {/* Resolves against the page origin at render time (public/email-logo.png). */}
              <Image src="/email-logo.png" style={styles.logo} />
              <View>
                <Text style={styles.brandName}>SUNCOAST POOL PROS</Text>
                <Text style={styles.brandTag}>Professional Pool Care · St. Petersburg, FL</Text>
              </View>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Proposal Date</Text>
              <Text style={styles.metaValue}>{dateLabel}</Text>
            </View>
          </View>
          <View style={styles.headerDivider} />
          <Text style={styles.title}>Service Proposal</Text>
          <View style={styles.titleAccent} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Prepared For</Text>
          <Row label="Name" value={customer.name} />
          <Row label="Service Address" value={customer.address} />
          <Row label="Email" value={customer.email} />
          <Row label="Phone" value={customer.phone} />
        </View>

        {proposal.includeBenefits ? (
          <View style={styles.includedBox} wrap={false} minPresenceAhead={90}>
            <Text style={styles.includedHeading}>{BENEFITS_HEADING}</Text>
            {INCLUDED_BENEFITS.map((b, i) => (
              <View key={i} style={styles.includedItem}>
                <Text style={styles.includedCheck}>•</Text>
                <Text style={styles.includedItemText}>{b}</Text>
              </View>
            ))}
            <Text style={styles.includedNote}>{BENEFITS_NOTE}</Text>
            <Text style={styles.includedFootnote}>{BENEFITS_FOOTNOTE}</Text>
          </View>
        ) : null}

        {hasPoolBasics ? (
          <View style={styles.section} minPresenceAhead={72}>
            <Text style={styles.sectionLabel}>Pool — Size & Volume</Text>
            <Row label="Volume" value={pool.gallons ? `${pool.gallons} gallons` : ''} />
            <Row label="Dimensions" value={dimensionsLine(pool)} />
            <Row label="Shape" value={pool.shape} />
            <Row label="Sanitization" value={pool.sanitization} />
          </View>
        ) : null}

        {hasEquipment ? (
          <View style={styles.section} minPresenceAhead={72}>
            <Text style={styles.sectionLabel}>Equipment</Text>
            <Row label="Pump" value={pool.pump} />
            <Row label="Filter" value={pool.filter} />
            <Row label="Heater" value={pool.heater} />
            <Row label="Automation" value={pool.automation} />
            <Row label="Notes" value={pool.equipmentNotes} />
          </View>
        ) : null}

        {photos.length ? (
          <View style={styles.section} minPresenceAhead={72}>
            <Text style={styles.sectionLabel}>Photos</Text>
            <View style={styles.photoGrid}>
              {photos.map((src, i) => (
                <Image key={i} src={src} style={styles.photo} />
              ))}
            </View>
          </View>
        ) : null}

        {scopeLines.length ? (
          <View style={styles.section} minPresenceAhead={72}>
            <Text style={styles.sectionLabel}>Scope of Work</Text>
            {scopeLines.map((raw, i) => {
              const line = raw.trim();
              if (!line) return <View key={i} style={{ height: 5 }} />;
              if (/^[•\-]/.test(line)) {
                return (
                  <View key={i} style={styles.scopeBullet}>
                    <Text style={styles.scopeBulletDot}>•</Text>
                    <Text style={styles.scopeBulletText}>{line.replace(/^[•\-]\s*/, '')}</Text>
                  </View>
                );
              }
              return (
                <Text key={i} style={styles.scopePara}>
                  {line}
                </Text>
              );
            })}
          </View>
        ) : null}

        {proposal.price.trim() ? (
          <View style={styles.section} minPresenceAhead={72}>
            <Text style={styles.sectionLabel}>Investment</Text>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.priceValue}>{formatPrice(proposal.price)}</Text>
            </View>
          </View>
        ) : null}

        {addOns.length ? (
          <View style={styles.section} minPresenceAhead={72}>
            <Text style={styles.sectionLabel}>Additional Services</Text>
            {addOns.map((a, i) => (
              <View key={i} style={styles.addonRow}>
                <Text style={styles.addonLabel}>{a.label.trim() || '—'}</Text>
                <Text style={styles.addonPrice}>{formatPrice(a.price)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.acceptBox} wrap={false}>
          <Text style={styles.acceptText}>
            To accept this proposal, simply reply &quot;APPROVED&quot; to the email it was attached to,
            and we&apos;ll get you on the schedule.
          </Text>
        </View>

        {proposal.includeTerms ? (
          <View style={styles.termsSection} minPresenceAhead={64}>
            <Text style={styles.sectionLabel}>Terms &amp; Conditions</Text>
            {PROPOSAL_TERMS.map((t, i) => (
              <View key={i} style={styles.termsItem} wrap={false}>
                <Text style={styles.termsHeading}>{t.heading}</Text>
                <Text style={styles.termsText}>{t.text}</Text>
              </View>
            ))}
            <Text style={styles.termsFootnote}>
              {TERMS_FOOTNOTE}{' '}
              <Link src={SERVICE_AGREEMENT_URL} style={styles.termsLink}>
                {SERVICE_AGREEMENT_DISPLAY}
              </Link>
              .
            </Text>
          </View>
        ) : null}

        {/* Footer — repeats on every page, with page numbers. */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Suncoast Pool Pros · St. Petersburg, FL</Text>
          <Text
            style={styles.footerText}
            fixed
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
          <Text style={styles.footerText}>suncoastpoolpros.com</Text>
        </View>
      </Page>
    </Document>
  );
};
