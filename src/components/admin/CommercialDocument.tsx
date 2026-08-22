/**
 * The printable commercial bid, built with @react-pdf/renderer. Dynamic-imported
 * at download time only, so @react-pdf never lands in the /admin chunk.
 *
 * SECTION ORDER IS THE ARGUMENT. A manager skims the front for disqualifiers,
 * the board reads the middle, and somebody at the end sets the price beside two
 * other bids. So: what the property is, what water is on it, what the law
 * requires, what we do, who covers the gaps, what we exclude — and only then
 * what it costs. Nothing persuasive is allowed above the facts, because a board
 * that has been sold to before the scope is stated reads the scope suspiciously.
 *
 * Two departures from the residential document, both deliberate:
 *
 * The EQUIPMENT PAD prints above the water. These pools do not fail inspection
 * because the water is dirty — they fail on an empty acid croc or flow off its
 * permitted rate — so leading with the pad is the whole thesis of the bid.
 *
 * EXCLUSIONS get a headed section rather than a footnote. It looks like giving
 * ground and it is the page that wins the comparison: boards are coached to
 * reject vague scope, so the bid that says plainly what it does not cover reads
 * as the honest one.
 *
 * react-pdf notes carried over the hard way: every fontSize is paired with an
 * explicit lineHeight (the line box is otherwise sized from the INHERITED size
 * and the leading collapses); fixed splits use width percentages rather than
 * flex:1, which sizes to content; and long sections carry no outer border,
 * because a bordered panel cannot break across a page and an unbreakable block
 * that does not fit pushes everything behind it onto the next one.
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { BusinessProfile, CommercialData, WaterBody } from '@/lib/adminApi';
import { classificationFor, CLASSIFICATION_DISCLAIMER } from './commercialClassification';
import {
  COMMERCIAL_CONTINUITY,
  COMMERCIAL_EXCLUSIONS,
  COMMERCIAL_REPORTING,
  COMMERCIAL_SCOPE,
  LOG_MODELS,
} from './commercialScope';
import {
  COMMERCIAL_DIFFERENCE,
  INSURANCE_OFFER,
  RESPONSE_TERMS,
  afterHoursTerm,
  bidValidityTerm,
  chemicalTerm,
  paymentTerm,
  repairThresholdTerm,
  termAndRenewalTerm,
} from './commercialTerms';

const NAVY = '#0a1628';
const BRAND_BLUE = '#1669ae';
const BLUE_DARK = '#0f4d80';
const INK = '#1f2937';
const MUTED = '#6b7280';
const FAINT = '#8a93a3';
const LINE = '#e6e9ef';
const TINT = '#f1f7fc';
const TINT_BORDER = '#d4e6f4';
const AMBER = '#8a5a06';
const AMBER_TINT = '#fdf6e7';
const AMBER_BORDER = '#efdcae';

const MARGIN_X = 46;
const PAD = 18;

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

  // ----- Masthead (page 1 only — in flow, not `fixed`, so it never repeats) --
  header: {
    backgroundColor: NAVY,
    borderRadius: 10,
    borderBottomWidth: 3,
    borderBottomColor: BRAND_BLUE,
    paddingTop: 26,
    paddingBottom: 24,
    paddingHorizontal: PAD,
    marginHorizontal: -PAD,
    marginBottom: 24,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandCol: { width: '68%', flexShrink: 0 },
  eyebrow: { fontSize: 9, lineHeight: 1.3, color: '#8ea2c0', letterSpacing: 2.8, textTransform: 'uppercase' },
  headerTitle: { fontSize: 17.5, lineHeight: 1.2, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginTop: 9 },
  headerSub: { fontSize: 9, lineHeight: 1.35, color: '#b8c8dd', marginTop: 6 },
  metaCol: { width: '30%', flexShrink: 0, alignItems: 'flex-end', paddingTop: 2 },
  metaLabel: { fontSize: 7, lineHeight: 1.3, color: '#8ea2c0', letterSpacing: 1.5, textTransform: 'uppercase' },
  metaValue: { fontSize: 10.5, lineHeight: 1.25, color: '#ffffff', marginTop: 3, fontFamily: 'Helvetica-Bold' },
  metaGap: { marginTop: 9 },

  // ----- Shared tokens -----
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 8.5,
    lineHeight: 1.3,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2,
    color: BLUE_DARK,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionIntro: { fontSize: 8.5, lineHeight: 1.4, color: MUTED, marginBottom: 8 },
  para: { fontSize: 8.5, lineHeight: 1.4, color: INK, marginBottom: 5 },
  bullet: { flexDirection: 'row', marginBottom: 3.5 },
  bulletDot: { width: 11, fontSize: 8.5, lineHeight: 1.4, color: BRAND_BLUE },
  bulletText: { flex: 1, fontSize: 8.5, lineHeight: 1.4, color: INK },

  row: { flexDirection: 'row', marginBottom: 2.5 },
  rowLabel: { width: 110, color: MUTED, paddingRight: 8, fontSize: 8.5, lineHeight: 1.35 },
  rowValue: { flex: 1, color: INK, fontSize: 8.5, lineHeight: 1.35 },
  twoCol: { flexDirection: 'row', marginBottom: 14 },
  colLeft: { width: '50%', flexShrink: 0, paddingRight: PAD },
  colRight: { width: '50%', flexShrink: 0, paddingLeft: PAD },
  valueLine: { fontSize: 8.5, lineHeight: 1.35, color: INK, marginBottom: 2 },

  // ----- Bid summary card on page 1 -----
  summaryBox: {
    backgroundColor: TINT,
    borderWidth: 1,
    borderColor: TINT_BORDER,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: PAD,
    marginHorizontal: -PAD,
    marginBottom: 20,
  },
  summaryHead: { fontSize: 11, lineHeight: 1.25, fontFamily: 'Helvetica-Bold', color: BLUE_DARK, marginBottom: 8 },
  freqRow: { flexDirection: 'row', marginTop: 4 },
  freqCell: { width: '33.33%', flexShrink: 0 },
  freqLabel: { fontSize: 7, lineHeight: 1.3, color: MUTED, letterSpacing: 1.1, textTransform: 'uppercase' },
  freqValue: { fontSize: 16, lineHeight: 1.2, fontFamily: 'Helvetica-Bold', color: BLUE_DARK, marginTop: 2 },
  freqPer: { fontSize: 7, lineHeight: 1.3, color: FAINT, marginTop: 1 },
  summaryNote: { fontSize: 7.5, lineHeight: 1.4, color: FAINT, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: TINT_BORDER },

  // ----- Classification -----
  classStatus: { fontSize: 9.5, lineHeight: 1.35, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 5 },
  classTest: { fontSize: 7.5, lineHeight: 1.35, color: FAINT, marginBottom: 7 },
  disclaimer: { fontSize: 7, lineHeight: 1.4, color: FAINT, marginTop: 7, fontStyle: 'italic' },

  // ----- Tables -----
  tHeadRow: { flexDirection: 'row', paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: LINE },
  tHeadCell: { fontSize: 6.5, lineHeight: 1.3, color: FAINT, letterSpacing: 0.8, textTransform: 'uppercase' },
  tRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4.5, borderBottomWidth: 1, borderBottomColor: LINE },
  tTotalRow: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 6, marginTop: 1 },
  bodyCol: { flex: 1, paddingRight: 10 },
  bodyName: { fontSize: 8.5, lineHeight: 1.3, fontFamily: 'Helvetica-Bold', color: NAVY },
  bodyMeta: { fontSize: 6.8, lineHeight: 1.3, color: FAINT, marginTop: 1 },
  priceCol: { width: 62, textAlign: 'right' },
  priceText: { fontSize: 8.5, lineHeight: 1.3, color: INK, textAlign: 'right' },
  totalText: { fontSize: 9.5, lineHeight: 1.3, fontFamily: 'Helvetica-Bold', color: BLUE_DARK, textAlign: 'right' },
  totalLabel: { fontSize: 8.5, lineHeight: 1.3, fontFamily: 'Helvetica-Bold', color: NAVY },

  // ----- Log models, side by side -----
  logRow: { flexDirection: 'row', marginHorizontal: -PAD },
  logCol: { width: '50%', flexShrink: 0, paddingHorizontal: 5, flexDirection: 'column' },
  logCard: { flexGrow: 1, borderWidth: 1, borderColor: LINE, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 11 },
  logCardRec: { borderWidth: 1.5, borderColor: BRAND_BLUE, backgroundColor: TINT },
  ribbon: { alignSelf: 'flex-start', backgroundColor: BRAND_BLUE, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 5 },
  ribbonText: { fontSize: 6.5, lineHeight: 1.2, fontFamily: 'Helvetica-Bold', color: '#ffffff', letterSpacing: 1 },
  logTitle: { fontSize: 9.5, lineHeight: 1.25, fontFamily: 'Helvetica-Bold', color: NAVY },
  logPrice: { fontSize: 14, lineHeight: 1.2, fontFamily: 'Helvetica-Bold', color: BLUE_DARK, marginTop: 5 },
  logSummary: { fontSize: 7.6, lineHeight: 1.35, color: MUTED, marginTop: 4 },
  logRule: { borderTopWidth: 1, borderTopColor: LINE, marginTop: 7, marginBottom: 6 },
  logWho: { fontSize: 7.6, lineHeight: 1.35, fontFamily: 'Helvetica-Bold', color: NAVY },
  logDoes: { fontSize: 7.6, lineHeight: 1.35, color: INK, marginBottom: 4 },

  // ----- The daily-duty callout -----
  amberBox: {
    backgroundColor: AMBER_TINT,
    borderWidth: 1,
    borderColor: AMBER_BORDER,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 12,
  },
  amberHead: { fontSize: 8.5, lineHeight: 1.35, fontFamily: 'Helvetica-Bold', color: AMBER, marginBottom: 3 },
  amberText: { fontSize: 8, lineHeight: 1.4, color: '#6b4a08' },

  // ----- Signature -----
  signBox: { borderWidth: 1, borderColor: LINE, borderRadius: 8, paddingVertical: 14, paddingHorizontal: PAD, marginTop: 4 },
  signIntro: { fontSize: 8.5, lineHeight: 1.4, color: INK, marginBottom: 12 },
  signRow: { flexDirection: 'row', marginTop: 14 },
  signCell: { width: '50%', flexShrink: 0, paddingRight: 16 },
  signRule: { borderBottomWidth: 1, borderBottomColor: '#9aa3b0', height: 20 },
  signLabel: { fontSize: 7, lineHeight: 1.3, color: MUTED, marginTop: 4, letterSpacing: 0.6, textTransform: 'uppercase' },

  footer: {
    position: 'absolute',
    bottom: 26,
    left: MARGIN_X,
    right: MARGIN_X,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  footerText: { fontSize: 8, lineHeight: 1.3, color: FAINT },
});

// ---------------------------------------------------------------------------

const KIND_LABEL: Record<string, string> = {
  pool: 'Swimming pool',
  spa: 'Spa',
  wading: 'Wading pool',
  feature: 'Water feature',
};

const num = (v: string): number => {
  const n = Number(String(v ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const money = (n: number): string =>
  n > 0 ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—';

const sum = (bodies: WaterBody[], field: keyof WaterBody): number =>
  bodies.reduce((t, b) => t + num(String(b[field])), 0);

/** "48,000 gal · DE · permit 12-3456" — only the parts that were filled in. */
const bodyMetaLine = (b: WaterBody): string =>
  [
    KIND_LABEL[b.kind] ?? '',
    b.gallons.trim() ? `${b.gallons.trim()} gal` : '',
    b.filterType.trim() ? `${b.filterType.trim()} filter` : '',
    b.permittedGpm.trim() ? `${b.permittedGpm.trim()} GPM permitted` : '',
    b.permitNumber.trim() ? `Permit ${b.permitNumber.trim()}` : '',
  ]
    .filter((x) => x)
    .join('  ·  ');

/**
 * One priced row. A FACTORY rather than a component: @react-pdf/renderer
 * reshapes the JSX attribute types, so `key` on a custom component is a type
 * error — setting it on the react-pdf <View> it returns is not.
 */
const priceRow = (b: WaterBody) => (
  <View style={styles.tRow} wrap={false} key={b.id}>
    <View style={styles.bodyCol}>
      <Text style={styles.bodyName}>{b.label.trim() || 'Body of water'}</Text>
      {bodyMetaLine(b) ? <Text style={styles.bodyMeta}>{bodyMetaLine(b)}</Text> : null}
    </View>
    <View style={styles.priceCol}>
      <Text style={styles.priceText}>{money(num(b.price2x))}</Text>
    </View>
    <View style={styles.priceCol}>
      <Text style={styles.priceText}>{money(num(b.price3x))}</Text>
    </View>
    <View style={styles.priceCol}>
      <Text style={styles.priceText}>{money(num(b.price5x))}</Text>
    </View>
  </View>
);

const Bullets = ({ items }: { items: string[] }) => (
  <View>{items.filter((t) => t.trim()).map(bulletRow)}</View>
);

/**
 * A heading, its intro and its FIRST bullet as one unbreakable unit; the rest
 * of the bullets flow normally.
 *
 * Wrapping the heading alone was not enough — it simply landed at the foot of a
 * page with its list overleaf, which is how the first render put "RESPONSE AND
 * ESCALATION" on one page and every one of its bullets on the next.
 * `minPresenceAhead` cannot fix that either: it pushes the whole list instead
 * of gluing the join. Making the heading plus one line atomic is the only thing
 * that reliably keeps them together while still letting a long list break.
 */
const SectionHead = ({ label, intro }: { label: string; intro?: string }) => (
  <>
    <Text style={styles.sectionLabel}>{label}</Text>
    {intro ? <Text style={styles.sectionIntro}>{intro}</Text> : null}
  </>
);

const bulletRow = (t: string) => (
  <View style={styles.bullet} key={t}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{t}</Text>
  </View>
);

/**
 * Heading + intro + first bullet glued; the remainder flows.
 *
 * A FACTORY rather than a component, for the same reason as priceRow:
 * @react-pdf/renderer reshapes the JSX attribute types, so `key` on a custom
 * component is a type error — on the <View> it returns it is fine.
 */
const bulletSection = ({
  label,
  intro,
  items,
}: {
  label: string;
  intro?: string;
  items: string[];
}) => {
  const list = items.filter((t) => t.trim());
  if (!list.length) return null;
  return (
    <View style={styles.section} key={label}>
      <View wrap={false}>
        <SectionHead label={label} intro={intro} />
        {bulletRow(list[0])}
      </View>
      {list.slice(1).map(bulletRow)}
    </View>
  );
};

export const CommercialDocument = ({
  data,
  business,
  dateLabel,
  proposalNumber,
}: {
  data: CommercialData;
  business: BusinessProfile;
  dateLabel: string;
  proposalNumber?: number | null;
}) => {
  const { property, bodies, bid } = data;
  const classification = classificationFor(property.classification);
  const exclusions = bid.exclusions.length ? bid.exclusions : COMMERCIAL_EXCLUSIONS;

  const totals = {
    twice: sum(bodies, 'price2x'),
    thrice: sum(bodies, 'price3x'),
    fivex: sum(bodies, 'price5x'),
    daily: sum(bodies, 'price7x'),
  };
  const priced = bodies.filter(
    (b) => num(b.price2x) + num(b.price3x) + num(b.price5x) + num(b.price7x) > 0,
  );

  const recommended = bid.logModel === 'daily' ? 'daily' : 'audited';
  // The audited-log column has no single price of its own — it is whichever
  // frequency the board picks — so it shows the mid option and says so. Only
  // the daily model has one number, because there is only one way to buy it.
  const auditedHeadline = totals.thrice || totals.fivex || totals.twice;

  const contactLine = [property.contactName.trim(), property.contactTitle.trim()]
    .filter((x) => x)
    .join(', ');

  const insuranceLines = [
    business.glPerOccurrence.trim()
      ? `General liability: $${business.glPerOccurrence.trim()} per occurrence${
          business.glAggregate.trim() ? `, $${business.glAggregate.trim()} aggregate` : ''
        }`
      : '',
    business.workersComp === 'carried' ? "Workers' compensation carried on all field staff" : '',
    business.licenseNumber.trim() ? `Florida licence ${business.licenseNumber.trim()}` : '',
    business.certificationNumber.trim()
      ? `Public Pool Service Technician certification ${business.certificationNumber.trim()} — posted in your equipment room as 64E-9.018 requires`
      : '',
  ].filter((x) => x);

  return (
    <Document
      title={`Commercial pool service proposal — ${property.name || 'Suncoast Pool Pros'}`}
      author="Suncoast Pool Pros"
    >
      <Page size="LETTER" style={styles.page}>
        {/* ---------- 1. Masthead ---------- */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandCol}>
              <Text style={styles.eyebrow}>Suncoast Pool Pros</Text>
              <Text style={styles.headerTitle}>Commercial Pool Service Proposal</Text>
              {property.name.trim() ? (
                <Text style={styles.headerSub}>Prepared for {property.name.trim()}</Text>
              ) : null}
            </View>
            <View style={styles.metaCol}>
              {proposalNumber ? (
                <>
                  <Text style={styles.metaLabel}>Proposal</Text>
                  <Text style={styles.metaValue}>#{proposalNumber}</Text>
                </>
              ) : null}
              <View style={proposalNumber ? styles.metaGap : undefined}>
                <Text style={styles.metaLabel}>Date</Text>
              </View>
              <Text style={styles.metaValue}>{dateLabel}</Text>
            </View>
          </View>
        </View>

        {/* ---------- 2. Bid summary — the page a manager puts in a board packet ---------- */}
        {priced.length > 0 ? (
          <View style={styles.summaryBox} wrap={false}>
            <Text style={styles.summaryHead}>Monthly service — all bodies of water</Text>
            <View style={styles.freqRow}>
              <View style={styles.freqCell}>
                <Text style={styles.freqLabel}>Twice weekly</Text>
                <Text style={styles.freqValue}>{money(totals.twice)}</Text>
                <Text style={styles.freqPer}>per month</Text>
              </View>
              <View style={styles.freqCell}>
                <Text style={styles.freqLabel}>Three times weekly</Text>
                <Text style={styles.freqValue}>{money(totals.thrice)}</Text>
                <Text style={styles.freqPer}>per month</Text>
              </View>
              <View style={styles.freqCell}>
                <Text style={styles.freqLabel}>Five times weekly</Text>
                <Text style={styles.freqValue}>{money(totals.fivex)}</Text>
                <Text style={styles.freqPer}>per month</Text>
              </View>
            </View>
            <Text style={styles.summaryNote}>
              All chemicals, filter service and the reporting described in this proposal are included
              at every frequency. The full breakdown by body of water is on the pricing page.
            </Text>
          </View>
        ) : null}

        {/* ---------- 3. Prepared for ---------- */}
        <View style={styles.twoCol}>
          <View style={styles.colLeft}>
            <Text style={styles.sectionLabel}>Prepared For</Text>
            {property.name.trim() ? <Text style={styles.valueLine}>{property.name.trim()}</Text> : null}
            {contactLine ? <Text style={styles.valueLine}>{contactLine}</Text> : null}
            {property.managementCompany.trim() ? (
              <Text style={styles.valueLine}>c/o {property.managementCompany.trim()}</Text>
            ) : null}
            {property.address.trim() ? <Text style={styles.valueLine}>{property.address.trim()}</Text> : null}
            {property.email.trim() ? <Text style={styles.valueLine}>{property.email.trim()}</Text> : null}
            {property.phone.trim() ? <Text style={styles.valueLine}>{property.phone.trim()}</Text> : null}
          </View>
          <View style={styles.colRight}>
            <Text style={styles.sectionLabel}>Prepared By</Text>
            <Text style={styles.valueLine}>Suncoast Pool Pros</Text>
            <Text style={styles.valueLine}>St. Petersburg, Florida</Text>
            <Text style={styles.valueLine}>(727) 295-3621</Text>
            <Text style={styles.valueLine}>service@suncoastpoolpros.com</Text>
          </View>
        </View>

        {/* ---------- 4. Classification ---------- */}
        {classification ? (
          <View style={styles.section}>
            <View wrap={false}>
              <SectionHead
                label="Your Pool Under Florida Law"
                intro="Stated up front because it decides what this proposal can and cannot promise."
              />
              <Text style={styles.classStatus}>{classification.status}</Text>
            </View>
            <Text style={styles.classTest}>
              {classification.label}
              {property.unitCount.trim() ? ` — ${property.unitCount.trim()} units` : ''}.{' '}
              {classification.test}.
            </Text>
            <Bullets items={classification.obligations} />
            <Text style={styles.disclaimer}>{CLASSIFICATION_DISCLAIMER}</Text>
          </View>
        ) : null}

        {/* ---------- 5. Bodies of water ---------- */}
        <View style={styles.section}>
          <View wrap={false}>
            <SectionHead
              label="Bodies of Water Covered"
              intro="Each is surveyed, scoped and priced separately, so scope can be adjusted without renegotiating the whole agreement."
            />
            {bodies.slice(0, 1).map((b) => (
              <View style={styles.tRow} key={b.id}>
                <View style={styles.bodyCol}>
                  <Text style={styles.bodyName}>{b.label.trim() || 'Body of water'}</Text>
                  {bodyMetaLine(b) ? <Text style={styles.bodyMeta}>{bodyMetaLine(b)}</Text> : null}
                  {b.filter.trim() || b.feeders.trim() ? (
                    <Text style={styles.bodyMeta}>
                      {[b.filter.trim(), b.feeders.trim()].filter((x) => x).join('  ·  ')}
                    </Text>
                  ) : null}
                  {b.notes.trim() ? <Text style={styles.bodyMeta}>{b.notes.trim()}</Text> : null}
                </View>
              </View>
            ))}
          </View>
          {bodies.slice(1).map((b) => (
            <View style={styles.tRow} key={b.id} wrap={false}>
              <View style={styles.bodyCol}>
                <Text style={styles.bodyName}>{b.label.trim() || 'Body of water'}</Text>
                {bodyMetaLine(b) ? <Text style={styles.bodyMeta}>{bodyMetaLine(b)}</Text> : null}
                {b.filter.trim() || b.feeders.trim() ? (
                  <Text style={styles.bodyMeta}>
                    {[b.filter.trim(), b.feeders.trim()].filter((x) => x).join('  ·  ')}
                  </Text>
                ) : null}
                {b.notes.trim() ? <Text style={styles.bodyMeta}>{b.notes.trim()}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        {/* ---------- 6. Scope ---------- */}
        {COMMERCIAL_SCOPE.map((g) =>
          bulletSection({ label: g.title, intro: g.rationale, items: g.items }),
        )}

        {bid.scopeNotes.trim() ? (
          <View style={styles.section}>
            <SectionHead label="Specific To This Property" />
            <Text style={styles.para}>{bid.scopeNotes.trim()}</Text>
          </View>
        ) : null}

        {/* ---------- 7. Who covers the days between ---------- */}
        {/* The whole argument is one unbreakable block — heading, the statutory
            point, and both priced options. Split across a page it reads as two
            unrelated things, and this is the section that has to be understood
            in one go: it is where the board is being asked to make a choice
            they did not know they had. At roughly 280pt it always fits. */}
        <View style={styles.section} wrap={false}>
          <SectionHead label="Who Covers The Days Between Visits" />
          <View style={styles.amberBox}>
            <Text style={styles.amberHead}>
              Florida requires pH and disinfectant to be tested and logged at least once every 24
              hours a regulated public pool is open.
            </Text>
            <Text style={styles.amberText}>
              That duty rests with the owner or operator, and no schedule of two, three or five
              visits a week satisfies it on its own. Rather than leave that unsaid, both workable
              arrangements are set out below with their prices. Whichever you choose, it is written
              into the agreement.
            </Text>
          </View>

          <View style={styles.logRow}>
            {LOG_MODELS.map((m) => {
              const isRec = m.key === recommended;
              const price = m.key === 'daily' ? totals.daily : auditedHeadline;
              return (
                <View style={styles.logCol} key={m.key}>
                  <View style={isRec ? [styles.logCard, styles.logCardRec] : styles.logCard}>
                    {isRec ? (
                      <View style={styles.ribbon}>
                        <Text style={styles.ribbonText}>RECOMMENDED</Text>
                      </View>
                    ) : null}
                    <Text style={styles.logTitle}>{m.title}</Text>
                    {price > 0 ? (
                      <Text style={styles.logPrice}>
                        {money(price)}
                        <Text style={styles.logSummary}>
                          {m.key === 'daily' ? ' / month' : ' / month at three visits weekly'}
                        </Text>
                      </Text>
                    ) : null}
                    <Text style={styles.logSummary}>{m.summary}</Text>
                    <View style={styles.logRule} />
                    {m.split.map((s) => (
                      <View key={s.who}>
                        <Text style={styles.logWho}>{s.who}</Text>
                        <Text style={styles.logDoes}>{s.does}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ---------- 8. Reporting ---------- */}
        {bulletSection({
          label: 'What You Receive',
          intro:
            "A board's record of the pool should survive being read by somebody else — an inspector, an insurer, an owner with a complaint.",
          items: COMMERCIAL_REPORTING,
        })}

        {/* ---------- 9. Why this bid differs ---------- */}
        <View style={styles.section}>
          {bulletSection({
            label: 'Why This Proposal Is Different',
            items: COMMERCIAL_DIFFERENCE,
          })}
          <Text style={styles.para}>{COMMERCIAL_CONTINUITY}</Text>
        </View>

        {/* ---------- 10. Response ---------- */}
        <View style={styles.section}>
          {bulletSection({ label: 'Response And Escalation', items: RESPONSE_TERMS })}
          {repairThresholdTerm(bid.repairThreshold) ? (
            <Text style={styles.para}>{repairThresholdTerm(bid.repairThreshold)}</Text>
          ) : null}
        </View>

        {/* ---------- 11. Exclusions ---------- */}
        {bulletSection({
          label: 'Not Included',
          intro: 'Stated plainly so this proposal can be compared line by line against any other.',
          items: exclusions,
        })}

        {/* ---------- 12. Pricing ---------- */}
        <View style={styles.section}>
          <View wrap={false}>
            <SectionHead label="Pricing" />
            <View style={styles.tHeadRow}>
              <View style={styles.bodyCol}>
                <Text style={styles.tHeadCell}>Body of water</Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.tHeadCell}>2× / week</Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.tHeadCell}>3× / week</Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.tHeadCell}>5× / week</Text>
              </View>
            </View>
            {bodies.slice(0, 1).map(priceRow)}
          </View>
          {bodies.slice(1).map(priceRow)}
          <View style={styles.tTotalRow}>
            <View style={styles.bodyCol}>
              <Text style={styles.totalLabel}>Total per month</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.totalText}>{money(totals.twice)}</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.totalText}>{money(totals.thrice)}</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.totalText}>{money(totals.fivex)}</Text>
            </View>
          </View>
          {totals.daily > 0 ? (
            <Text style={styles.disclaimer}>
              Daily service — seven visits weekly, with the every-24-hours testing entirely ours —
              is {money(totals.daily)} per month for the same bodies of water.
            </Text>
          ) : null}
          <View style={{ marginTop: 8 }}>
            <Text style={styles.para}>{chemicalTerm(bid.chemicalBandPct)}</Text>
            {afterHoursTerm(bid.afterHoursMultiplier) ? (
              <Text style={styles.para}>{afterHoursTerm(bid.afterHoursMultiplier)}</Text>
            ) : null}
            <Text style={styles.para}>{paymentTerm(bid.paymentTerms)}</Text>
          </View>
        </View>

        {/* ---------- 13. Insurance ---------- */}
        <View style={styles.section}>
          <SectionHead label="Insurance, Licensing And Certification" />
          {insuranceLines.length ? <Bullets items={insuranceLines} /> : null}
          <Text style={styles.para}>{INSURANCE_OFFER}</Text>
        </View>

        {/* ---------- 14. Terms and acceptance ---------- */}
        <View style={styles.section}>
          <SectionHead label="Terms" />
          <Text style={styles.para}>
            {termAndRenewalTerm(bid.termMonths, bid.noticeDays, bid.escalatorPct)}
          </Text>
          <Text style={styles.para}>{bidValidityTerm(bid.bidValidDays)}</Text>
        </View>

        <View style={styles.signBox} wrap={false}>
          <Text style={styles.sectionLabel}>Acceptance</Text>
          <Text style={styles.signIntro}>
            To proceed, indicate the service frequency selected and return one signed copy. We will
            confirm the start date and provide the certificate of insurance before the first visit.
          </Text>
          <View style={styles.signRow}>
            <View style={styles.signCell}>
              <View style={styles.signRule} />
              <Text style={styles.signLabel}>Frequency selected</Text>
            </View>
            <View style={styles.signCell}>
              <View style={styles.signRule} />
              <Text style={styles.signLabel}>Monthly rate agreed</Text>
            </View>
          </View>
          <View style={styles.signRow}>
            <View style={styles.signCell}>
              <View style={styles.signRule} />
              <Text style={styles.signLabel}>Signature</Text>
            </View>
            <View style={styles.signCell}>
              <View style={styles.signRule} />
              <Text style={styles.signLabel}>Date</Text>
            </View>
          </View>
          <View style={styles.signRow}>
            <View style={styles.signCell}>
              <View style={styles.signRule} />
              <Text style={styles.signLabel}>Printed name</Text>
            </View>
            <View style={styles.signCell}>
              <View style={styles.signRule} />
              <Text style={styles.signLabel}>Title / authority</Text>
            </View>
          </View>
        </View>

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
