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
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { type ProposalData, type Tier, formatPrice, tierDelta } from '@/lib/adminApi';
import { BENEFITS_HEADING, includedBenefits, benefitsNote } from './proposalBenefits';

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

  // ----- Masthead (page 1 only) — email-style: eyebrow + large title, with the
  // brand-blue accent as the card's bottom border (not a bar inside it) -----
  header: {
    backgroundColor: NAVY,
    borderRadius: 10,
    borderBottomWidth: 3,
    borderBottomColor: BRAND_BLUE,
    paddingTop: 26,
    paddingBottom: 24,
    // Same padding + outward bleed as the other boxes, so every box shares one
    // left/right edge AND the header text lines up with the body copy.
    paddingHorizontal: 18,
    marginHorizontal: -18,
    marginBottom: 28,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandCol: { flex: 1 },
  eyebrow: { fontSize: 9, color: '#8ea2c0', letterSpacing: 2.8, textTransform: 'uppercase' },
  headerTitle: { fontSize: 23, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginTop: 9, letterSpacing: 0.3 },
  metaCol: { alignItems: 'flex-end', paddingTop: 2 },
  metaLabel: { fontSize: 7, color: '#8ea2c0', letterSpacing: 1.5, textTransform: 'uppercase' },
  metaValue: { fontSize: 10.5, color: '#ffffff', marginTop: 3, fontFamily: 'Helvetica-Bold' },

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
  colLeft: { width: '50%', flexShrink: 0, paddingRight: 18 },
  colRight: { width: '50%', flexShrink: 0, paddingLeft: 18 },
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
    // Bleed out by the padding so the box's text lines up with the body text.
    marginHorizontal: -18,
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
    paddingHorizontal: 18,
    marginHorizontal: -18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 1.5, textTransform: 'uppercase', lineHeight: 1 },
  priceValue: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: BLUE_DARK, lineHeight: 1 },

  // ----- Tier comparison -----
  tierRow: { flexDirection: 'row', marginHorizontal: -18, marginBottom: 10 },
  tierCol: { width: '50%', flexShrink: 0, paddingHorizontal: 5, flexDirection: 'column' },
  // NOTE: no `height: '100%'` here. The parent column has no definite height,
  // so the percentage resolves against nothing and corrupts the layout for the
  // WHOLE page — the masthead clipped its own title and every row's leading
  // collapsed. Verified by rendering.
  tierCard: {
    // flexGrow (not height:'100%') levels the two cards to the taller one.
    flexGrow: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 11,
  },
  tierCardRec: { borderWidth: 1.5, borderColor: BRAND_BLUE, backgroundColor: TINT },
  ribbon: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND_BLUE,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 5,
  },
  ribbonText: { fontSize: 6.5, lineHeight: 1.2, fontFamily: 'Helvetica-Bold', color: '#ffffff', letterSpacing: 1 },
  tierName: { fontSize: 12, lineHeight: 1.2, fontFamily: 'Helvetica-Bold', color: NAVY },
  tierTagline: { fontSize: 7.5, color: MUTED, marginTop: 1.5, lineHeight: 1.25 },
  // Every fontSize here is paired with an explicit lineHeight: react-pdf sizes
  // the line box from the INHERITED font size otherwise, so a large value in a
  // small-text context reserves too little room and the next line overlaps it.
  tierPrice: { fontSize: 18, lineHeight: 1.15, fontFamily: 'Helvetica-Bold', color: BLUE_DARK, marginTop: 6 },
  tierDeltaText: { fontSize: 8.5, lineHeight: 1.3, fontFamily: 'Helvetica-Bold', color: BRAND_BLUE, marginTop: 3 },
  tierRule: { borderTopWidth: 1, borderTopColor: LINE, marginTop: 7, marginBottom: 6 },
  tierBuildsOn: { fontSize: 8, lineHeight: 1.3, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 5 },
  tierItem: { flexDirection: 'row', marginBottom: 2.5 },
  tierCheck: { color: GREEN, fontFamily: 'Helvetica-Bold', width: 10, fontSize: 7.8, lineHeight: 1.28 },
  tierItemText: { flex: 1, fontSize: 7.8, color: INK, lineHeight: 1.28 },
  // Terms render FULL WIDTH beneath the comparison, not inside the cards. The
  // same sentence wraps to ~2 lines across the page but 6–7 inside a 250pt
  // column, and that height was enough to push the whole (unbreakable)
  // comparison onto page 2.
  finePrintBlock: { marginTop: 2, marginBottom: 12 },
  finePrintLine: { fontSize: 6.4, color: FAINT, lineHeight: 1.35, marginBottom: 2 },
  finePrintName: { fontFamily: 'Helvetica-Bold', color: MUTED },
  valueNoteBox: {
    backgroundColor: '#fff8ec',
    borderWidth: 1,
    borderColor: '#f0dcb4',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 18,
    marginHorizontal: -18,
    marginBottom: 12,
  },
  valueNoteText: { fontSize: 8, color: '#8a5a10', lineHeight: 1.32 },
  // The non-recommended plan's note explains the service rather than selling an
  // offer, so it reads as information (blue tint) not promotion (amber).
  valueNoteBoxPlain: { backgroundColor: TINT, borderColor: TINT_BORDER },
  valueNoteTextPlain: { color: BLUE_DARK },

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
    marginHorizontal: -18,
    marginBottom: 22,
  },
  acceptText: { fontSize: 8.5, color: GREEN, lineHeight: 1.3 },

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

/**
 * One plan card. The upgrade card lists ONLY its extras, under an explicit
 * "Everything in <base>, plus:" line — so the base plan never reads as the
 * stripped-down option, and the added value is what stands out.
 */
const TierCard = ({
  tier,
  buildsOn,
  delta,
}: {
  tier: Tier;
  /** Name of the cheaper tier, when this one builds on it. */
  buildsOn?: string;
  /** Pre-formatted upgrade cost, e.g. "+$12/mo". */
  delta?: string;
}) => {
  const items = tier.includes.map((i) => i.trim()).filter(Boolean);
  return (
    <View style={[styles.tierCard, tier.recommended ? styles.tierCardRec : null]}>
      {tier.recommended ? (
        <View style={styles.ribbon}>
          <Text style={styles.ribbonText}>RECOMMENDED</Text>
        </View>
      ) : null}
      <Text style={styles.tierName}>{tier.name.trim()}</Text>
      {tier.tagline.trim() ? <Text style={styles.tierTagline}>{tier.tagline.trim()}</Text> : null}
      {tier.price.trim() ? <Text style={styles.tierPrice}>{formatPrice(tier.price)}</Text> : null}
      {delta ? <Text style={styles.tierDeltaText}>{delta} more than {buildsOn}</Text> : null}
      {/* No divider when there's nothing under it — the base card carries only a
          price, because the service it buys is listed once above the cards. */}
      {items.length || buildsOn ? <View style={styles.tierRule} /> : null}
      {buildsOn ? <Text style={styles.tierBuildsOn}>Everything in {buildsOn}, plus:</Text> : null}
      {items.map((item, i) => (
        <View key={i} style={styles.tierItem}>
          <Text style={styles.tierCheck}>•</Text>
          <Text style={styles.tierItemText}>{item}</Text>
        </View>
      ))}
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
  const tiered = proposal.pricingMode === 'tiers' && proposal.tiers.length > 0;
  // Every "what's included" surface is derived from THIS pool's filter, so a
  // sand-filter customer never reads a promise about cartridge elements.
  const filterOption = { type: pool.filterType, included: pool.filterServiceIncluded };
  const tiers = tiered ? proposal.tiers : [];
  const [baseTier, upgradeTier] = tiers;
  const delta = tierDelta(baseTier, upgradeTier);
  // With tiers on, the recommended plan's name is the word the customer replies
  // with, so acceptance can't be ambiguous.
  const recommended = tiers.find((t) => t.recommended) ?? upgradeTier ?? baseTier;
  const finePrints = tiers
    .map((t) => ({ name: t.name.trim(), text: t.finePrint.trim() }))
    .filter((f) => f.text !== '');
  const acceptWords = tiers
    .map((t) => t.name.trim().toUpperCase())
    .filter(Boolean)
    // Recommended first — the first option listed is the one most people take.
    .sort((a, b) => (a === recommended?.name.trim().toUpperCase() ? -1 : b === recommended?.name.trim().toUpperCase() ? 1 : 0));
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
                  <Row
                    label="Filter"
                    value={[pool.filterType, pool.filter].filter((v) => v.trim()).join(' — ')}
                    labelWidth={88}
                  />
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

        {/* In tier mode this box IS the service definition — both plans include
            the same service, so it's stated once here rather than repeated in
            each card — and it always renders regardless of the toggle. */}
        {proposal.includeBenefits || tiered ? (
          <View style={styles.includedBox} wrap={false}>
            <Text style={styles.includedHeading}>{BENEFITS_HEADING}</Text>
            {includedBenefits(filterOption).map((b, i) => (
              <View key={i} style={styles.includedItem}>
                <Text style={styles.includedCheck}>•</Text>
                <Text style={styles.includedItemText}>{b}</Text>
              </View>
            ))}
            <Text style={styles.includedNote}>{benefitsNote(filterOption)}</Text>
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

        {tiered ? (
          /* The heading, both cards and the value note travel as ONE unbreakable
             block. A comparison split across a page break can't be compared, and
             wrapping only the cards left the heading stranded at the foot of the
             previous page (react-pdf won't break a container's first child). */
          <View style={styles.section}>
            {/* The heading and BOTH cards are one unbreakable unit — a comparison
                split across a page break can't be compared, and wrapping only the
                cards leaves the heading stranded (react-pdf won't break a
                container's first child). The value note is deliberately OUTSIDE
                it: including it made the unit taller than the space left under a
                normal scope of work, which bumped the whole comparison to page 2
                and left page 1 40% empty. */}
            <View wrap={false}>
              <Text style={styles.sectionLabel}>Choose Your Plan</Text>
              <View style={styles.tierRow}>
                {tiers.map((tier, i) => (
                  <View key={i} style={styles.tierCol}>
                    <TierCard
                      tier={tier}
                      buildsOn={i > 0 ? tiers[i - 1].name.trim() : undefined}
                      delta={i > 0 ? delta : ''}
                    />
                  </View>
                ))}
              </View>
            </View>
            {finePrints.length ? (
              <View style={styles.finePrintBlock}>
                {finePrints.map((f, i) => (
                  <Text key={i} style={styles.finePrintLine}>
                    {finePrints.length > 1 ? <Text style={styles.finePrintName}>{f.name}: </Text> : null}
                    {f.text}
                  </Text>
                ))}
              </View>
            ) : null}
            {/* Every plan's note renders, in card order: the base plan explains
                what the all-in rate covers, the recommended one sells the offer. */}
            {tiers.map((tier, i) =>
              tier.valueNote.trim() ? (
                <View
                  key={i}
                  style={[styles.valueNoteBox, tier.recommended ? null : styles.valueNoteBoxPlain]}
                  wrap={false}
                >
                  <Text
                    style={[styles.valueNoteText, tier.recommended ? null : styles.valueNoteTextPlain]}
                  >
                    {tier.valueNote.trim()}
                  </Text>
                </View>
              ) : null,
            )}
          </View>
        ) : proposal.price.trim() ? (
          <View style={styles.section}>
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
            {acceptWords.length > 1
              ? `To accept, simply reply to the email this was attached to with the plan you'd like — ${acceptWords.join(' or ')} — and we'll get you on the schedule.`
              : 'To accept this proposal, simply reply "APPROVED" to the email it was attached to, and we\'ll get you on the schedule.'}
          </Text>
        </View>

        {/* Photos — forced onto their own page (after the accept callout) via `break`. */}
        {photos.length ? (
          <View style={styles.section} break>
            <Text style={styles.sectionLabel}>Photos</Text>
            <View style={styles.photoGrid}>
              {photos.map((src, i) => (
                <Image key={i} src={src} style={styles.photo} />
              ))}
            </View>
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
