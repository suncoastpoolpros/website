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
import { BENEFITS_HEADING, INCLUDED_BENEFITS, BENEFITS_NOTE } from './proposalBenefits';

const NAVY = '#0a1628';
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
    fontSize: 8.5,
    color: INK,
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
  },

  // ----- Masthead (page 1 only) — email-style: eyebrow + large title + accent -----
  header: {
    backgroundColor: NAVY,
    borderRadius: 10,
    paddingTop: 26,
    paddingBottom: 24,
    paddingHorizontal: 30,
    marginBottom: 28,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandCol: { flex: 1 },
  eyebrow: { fontSize: 9, color: '#8ea2c0', letterSpacing: 2.8, textTransform: 'uppercase' },
  headerTitle: { fontSize: 23, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginTop: 9, letterSpacing: 0.3 },
  metaCol: { alignItems: 'flex-end', paddingTop: 2 },
  metaLabel: { fontSize: 7, color: '#8ea2c0', letterSpacing: 1.5, textTransform: 'uppercase' },
  metaValue: { fontSize: 10.5, color: '#ffffff', marginTop: 3, fontFamily: 'Helvetica-Bold' },
  titleAccent: { marginTop: 16, height: 3, backgroundColor: BRAND_BLUE, borderRadius: 2 },

  // ----- Shared section tokens -----
  section: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2,
    color: BLUE_DARK,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: { flexDirection: 'row', marginBottom: 2.5 },
  rowLabel: { width: 118, color: MUTED, paddingRight: 8 },
  rowValue: { flex: 1, color: INK },
  twoCol: { flexDirection: 'row', marginBottom: 14 },
  colLeft: { width: '50%', paddingRight: 18 },
  colRight: { width: '50%', paddingLeft: 18 },
  valueLine: { fontSize: 8.5, color: INK, marginBottom: 2 },

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
  includedItem: { flexDirection: 'row', marginBottom: 3 },
  includedCheck: { color: GREEN, fontFamily: 'Helvetica-Bold', width: 13 },
  includedItemText: { color: NAVY, flex: 1, fontFamily: 'Helvetica-Bold' },
  includedNote: { marginTop: 6, fontSize: 8.5, color: MUTED, fontStyle: 'italic' },
  includedFootnote: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: TINT_BORDER, fontSize: 8, color: FAINT, lineHeight: 1.4 },

  // ----- Scope -----
  scopeIntro: { fontSize: 8.5, color: INK, marginBottom: 5, lineHeight: 1.35 },
  scopePara: { fontSize: 8.5, color: INK, marginBottom: 5, lineHeight: 1.35 },
  scopeBullet: { fontSize: 8.5, color: INK, marginBottom: 3, lineHeight: 1.35 },
  scopeBulletDot: { color: BRAND_BLUE },

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
  priceLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 1.5, textTransform: 'uppercase', lineHeight: 1 },
  priceValue: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: BLUE_DARK, lineHeight: 1 },

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
  acceptText: { fontSize: 8.5, color: GREEN, lineHeight: 1.3 },

  // ----- Terms -----
  termsSection: { marginTop: 4 },
  termsItem: { marginBottom: 5 },
  termsHeading: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 1.5 },
  termsText: { fontSize: 7.3, color: '#5b6470', lineHeight: 1.3 },
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

const Row = ({ label, value, labelWidth }: { label: string; value?: string; labelWidth?: number }) => {
  const v = (value ?? '').trim();
  if (!v) return null;
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, labelWidth ? { width: labelWidth } : null]}>{label}</Text>
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
  // Drop blank/whitespace-only lines so the scope renders tight regardless of
  // how the text was spaced (blank lines between bullets were rendering as gaps).
  const scopeLines = proposal.scope.trim()
    ? proposal.scope.split('\n').map((l) => l.trim()).filter(Boolean)
    : [];

  return (
    <Document title="Suncoast Pool Pros — Proposal" author="Suncoast Pool Pros">
      <Page size="LETTER" style={styles.page}>
        {/* Masthead — page 1 only (not `fixed`, so it doesn't repeat). */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandCol}>
              <Text style={styles.eyebrow}>Suncoast Pool Pros</Text>
              <Text style={styles.headerTitle}>Service Proposal</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Proposal Date</Text>
              <Text style={styles.metaValue}>{dateLabel}</Text>
            </View>
          </View>
          <View style={styles.titleAccent} />
        </View>

        {hasPoolBasics || hasEquipment ? (
          <View style={styles.twoCol}>
            <View style={styles.colLeft}>
              <Text style={styles.sectionLabel}>Prepared For</Text>
              {customer.name.trim() ? <Text style={styles.valueLine}>{customer.name.trim()}</Text> : null}
              {customer.address.trim() ? <Text style={styles.valueLine}>{customer.address.trim()}</Text> : null}
              {customer.email.trim() ? <Text style={styles.valueLine}>{customer.email.trim()}</Text> : null}
              {customer.phone.trim() ? <Text style={styles.valueLine}>{customer.phone.trim()}</Text> : null}
            </View>
            <View style={styles.colRight}>
              {hasPoolBasics ? (
                <View>
                  <Text style={styles.sectionLabel}>Pool — Size & Volume</Text>
                  <Row label="Volume" value={pool.gallons ? `${pool.gallons} gallons` : ''} labelWidth={88} />
                  <Row label="Dimensions" value={dimensionsLine(pool)} labelWidth={88} />
                  <Row label="Shape" value={pool.shape} labelWidth={88} />
                  <Row label="Sanitization" value={pool.sanitization} labelWidth={88} />
                </View>
              ) : null}
              {hasEquipment ? (
                <View style={hasPoolBasics ? { marginTop: 10 } : undefined}>
                  <Text style={styles.sectionLabel}>Equipment</Text>
                  <Row label="Pump" value={pool.pump} labelWidth={88} />
                  <Row label="Filter" value={pool.filter} labelWidth={88} />
                  <Row label="Heater" value={pool.heater} labelWidth={88} />
                  <Row label="Automation" value={pool.automation} labelWidth={88} />
                  <Row label="Notes" value={pool.equipmentNotes} labelWidth={88} />
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Prepared For</Text>
            {customer.name.trim() ? <Text style={styles.valueLine}>{customer.name.trim()}</Text> : null}
            {customer.address.trim() ? <Text style={styles.valueLine}>{customer.address.trim()}</Text> : null}
            {customer.email.trim() ? <Text style={styles.valueLine}>{customer.email.trim()}</Text> : null}
            {customer.phone.trim() ? <Text style={styles.valueLine}>{customer.phone.trim()}</Text> : null}
          </View>
        )}

        {proposal.includeBenefits ? (
          <View style={styles.includedBox} wrap={false}>
            <Text style={styles.includedHeading}>{BENEFITS_HEADING}</Text>
            {INCLUDED_BENEFITS.map((b, i) => (
              <View key={i} style={styles.includedItem}>
                <Text style={styles.includedCheck}>•</Text>
                <Text style={styles.includedItemText}>{b}</Text>
              </View>
            ))}
            <Text style={styles.includedNote}>{BENEFITS_NOTE}</Text>
          </View>
        ) : null}

        {scopeLines.length ? (
          <View style={styles.section} minPresenceAhead={72}>
            <Text style={styles.sectionLabel}>Scope of Work</Text>
            {scopeLines.map((line, i) =>
              /^[•\-]/.test(line) ? (
                <Text key={i} style={styles.scopeBullet}>
                  <Text style={styles.scopeBulletDot}>•&nbsp;&nbsp;</Text>
                  {line.replace(/^[•\-]\s*/, '')}
                </Text>
              ) : (
                <Text key={i} style={styles.scopePara}>
                  {line}
                </Text>
              ),
            )}
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

        {proposal.price.trim() ? (
          <View style={styles.section} minPresenceAhead={72}>
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
