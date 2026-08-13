/**
 * The printable first-service & inspection report, built with @react-pdf/renderer.
 * Imported DYNAMICALLY at send time only (see InspectionBuilder), so @react-pdf
 * never lands in the marketing bundles or the initial /admin chunk.
 *
 * Shares the proposal's visual DNA: navy masthead card on page 1, uniform
 * margins, slim footer with page numbers.
 *
 * EMPTY MEANS INVISIBLE. Every field, row and whole section renders only when it
 * has content — a chemistry panel with no readings doesn't print the heading, and
 * an unread pH doesn't print the word "pH".
 */
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { InspectionData, IssueSeverity, RecPriority } from '@/lib/adminApi';
import {
  CHEMISTRY_FIELDS,
  PRIORITY_CHIPS,
  PRIORITY_ORDER,
  SEVERITY_CHIPS,
  SEVERITY_ORDER,
} from './inspectionPresets';

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

const MARGIN_X = 46;

// Chip palettes — issue severity (problem found) and recommendation priority.
const SEVERITY_CHIP: Record<IssueSeverity, { bg: string; border: string; text: string }> = {
  urgent: { bg: '#fdecec', border: '#f3c4c4', text: '#a32020' },
  soon: { bg: '#fdf4e6', border: '#efd7a6', text: '#8a5a10' },
  monitor: { bg: '#eef2f7', border: '#d8e0ea', text: '#4b5b70' },
};

const PRIORITY_CHIP: Record<RecPriority, { bg: string; border: string; text: string }> = {
  now: { bg: '#eaf3fb', border: '#c8dff2', text: BLUE_DARK },
  soon: { bg: '#eef2f7', border: '#d8e0ea', text: '#4b5b70' },
  optional: { bg: '#f5f5f4', border: '#e3e3e0', text: MUTED },
};

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

  // ----- Masthead (page 1 only) -----
  header: {
    backgroundColor: NAVY,
    borderRadius: 10,
    borderBottomWidth: 3,
    borderBottomColor: BRAND_BLUE,
    paddingTop: 26,
    paddingBottom: 24,
    paddingHorizontal: 18,
    marginHorizontal: -18,
    marginBottom: 28,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandCol: { flex: 1, paddingRight: 14 },
  eyebrow: { fontSize: 9, color: '#8ea2c0', letterSpacing: 2.8, textTransform: 'uppercase' },
  headerTitle: { fontSize: 21, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginTop: 9, letterSpacing: 0.3 },
  metaCol: { alignItems: 'flex-end', paddingTop: 2 },
  metaLabel: { fontSize: 7, color: '#8ea2c0', letterSpacing: 1.5, textTransform: 'uppercase' },
  metaValue: { fontSize: 10.5, color: '#ffffff', marginTop: 3, fontFamily: 'Helvetica-Bold' },
  metaSpacer: { marginTop: 8 },

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
  rowLabel: { width: 88, color: MUTED, paddingRight: 8 },
  rowValue: { flex: 1, color: INK },
  twoCol: { flexDirection: 'row', marginBottom: 14 },
  colLeft: { width: '50%', flexShrink: 0, paddingRight: 18 },
  colRight: { width: '50%', flexShrink: 0, paddingLeft: 18 },
  valueLine: { fontSize: 8.5, color: INK, marginBottom: 2 },

  // ----- Summary / overall condition -----
  summaryBox: {
    marginBottom: 22,
    backgroundColor: TINT,
    borderWidth: 1,
    borderColor: TINT_BORDER,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginHorizontal: -18,
  },
  summaryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryHeading: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: BLUE_DARK },
  overallChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: TINT_BORDER,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  overallChipText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: BLUE_DARK, letterSpacing: 0.6 },
  summaryPara: { fontSize: 8.5, color: INK, marginBottom: 4, lineHeight: 1.4 },

  // ----- Chemistry table -----
  chemHeadRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingBottom: 4,
    marginBottom: 2,
  },
  chemRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    alignItems: 'center',
  },
  chemHeadCell: { fontSize: 7, color: FAINT, letterSpacing: 1, textTransform: 'uppercase' },
  chemName: { flex: 1, color: INK, paddingRight: 10 },
  chemValue: { width: 92, color: NAVY, fontFamily: 'Helvetica-Bold' },
  chemIdeal: { width: 108, color: FAINT, fontSize: 8 },
  chemNote: { marginTop: 6, fontSize: 8, color: FAINT, fontStyle: 'italic', lineHeight: 1.4 },

  // ----- Bulleted body copy (work performed) -----
  bodyPara: { fontSize: 8.5, color: INK, marginBottom: 5, lineHeight: 1.35 },
  bodyBullet: { fontSize: 8.5, color: INK, marginBottom: 3, lineHeight: 1.35 },
  bulletDot: { color: BRAND_BLUE },

  // ----- Findings / recommendation rows -----
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  chipCol: { width: 104, paddingRight: 10 },
  chip: { alignSelf: 'flex-start', borderRadius: 3, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 2 },
  chipText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5, textTransform: 'uppercase' },
  itemBody: { flex: 1 },
  itemLabel: { fontSize: 8.5, color: NAVY, fontFamily: 'Helvetica-Bold' },
  itemNote: { fontSize: 8.5, color: MUTED, marginTop: 2, lineHeight: 1.35 },

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

  // ----- Closing note -----
  closingBox: {
    backgroundColor: '#eef8f0',
    borderWidth: 1,
    borderColor: '#c2e6c8',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginHorizontal: -18,
    marginBottom: 22,
  },
  closingText: { fontSize: 8.5, color: GREEN, lineHeight: 1.35 },

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

/**
 * A section heading. Sections render it glued to their first row inside a
 * `wrap={false}` View so the heading can never be stranded alone at the foot of
 * a page — a View that can't wrap moves to the next page whole.
 *
 * `minPresenceAhead` does NOT solve this: react-pdf refuses to break a
 * container's FIRST child (`breakingImprovesPresence` is false there), and
 * putting it on the section itself pushes the entire list to the next page even
 * when half of it would have fitted.
 */
const SectionLabel = ({ children }: { children: string }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

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

const dimensionsLine = (pool: InspectionData['pool']): string =>
  [pool.length && `${pool.length} ft L`, pool.width && `${pool.width} ft W`, pool.avgDepth && `${pool.avgDepth} ft avg depth`]
    .filter(Boolean)
    .join(' × ');

// Split multiline copy into renderable lines, dropping blanks so spacing stays
// tight however the admin typed it.
const toLines = (raw: string): string[] =>
  raw.trim() ? raw.split('\n').map((l) => l.trim()).filter(Boolean) : [];

const BodyLines = ({ lines }: { lines: string[] }) => (
  <>
    {lines.map((line, i) =>
      /^[•\-*]/.test(line) ? (
        <Text key={i} style={styles.bodyBullet}>
          <Text style={styles.bulletDot}>•&nbsp;&nbsp;</Text>
          {line.replace(/^[•\-*]\s*/, '')}
        </Text>
      ) : (
        <Text key={i} style={styles.bodyPara}>
          {line}
        </Text>
      ),
    )}
  </>
);

const ItemRow = ({
  chipLabel,
  chipColors,
  label,
  note,
}: {
  chipLabel: string;
  chipColors: { bg: string; border: string; text: string };
  label: string;
  note: string;
}) => (
  <View style={styles.itemRow} wrap={false}>
    <View style={styles.chipCol}>
      <View style={[styles.chip, { backgroundColor: chipColors.bg, borderColor: chipColors.border }]}>
        <Text style={[styles.chipText, { color: chipColors.text }]}>{chipLabel}</Text>
      </View>
    </View>
    <View style={styles.itemBody}>
      <Text style={styles.itemLabel}>{label}</Text>
      {note.trim() ? <Text style={styles.itemNote}>{note.trim()}</Text> : null}
    </View>
  </View>
);

export const InspectionDocument = ({
  data,
  photos = [],
  dateLabel,
}: {
  data: InspectionData;
  /** Data-URL JPEGs (already downscaled by the builder) to embed in the PDF. */
  photos?: string[];
  dateLabel: string;
}) => {
  const { customer, pool, visit, chemistry, surface, findings } = data;

  const hasPoolBasics = pool.gallons || dimensionsLine(pool) || pool.shape || pool.sanitization;
  const hasEquipment = pool.pump || pool.filter || pool.heater || pool.automation || pool.equipmentNotes;

  // Only readings the tech actually took — an untested value prints nothing at all.
  const readings = CHEMISTRY_FIELDS.map((f) => ({ ...f, value: chemistry[f.key].trim() })).filter(
    (f) => f.value !== '',
  );

  const workLines = toLines(visit.workPerformed);
  const summaryLines = toLines(visit.summary);

  const surfaceObservations = surface.observations.filter((o) => o.trim());
  const hasSurface =
    surface.material.trim() || surface.condition.trim() || surfaceObservations.length || surface.notes.trim();

  const issues = findings.issues.filter((i) => i.label.trim());
  const recs = findings.recommendations.filter((r) => r.label.trim());
  // Most urgent first, so the customer reads the important line first.
  const sortedIssues = [...issues].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
  const sortedRecs = [...recs].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );

  return (
    <Document title="Suncoast Pool Pros — First Service & Inspection Report" author="Suncoast Pool Pros">
      <Page size="LETTER" style={styles.page}>
        {/* Masthead — page 1 only (not `fixed`, so it doesn't repeat). */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandCol}>
              <Text style={styles.eyebrow}>Suncoast Pool Pros</Text>
              <Text style={styles.headerTitle}>First Service &amp; Inspection Report</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Service Date</Text>
              <Text style={styles.metaValue}>{dateLabel}</Text>
              {visit.technician.trim() ? (
                <View style={styles.metaSpacer}>
                  <Text style={styles.metaLabel}>Technician</Text>
                  <Text style={styles.metaValue}>{visit.technician.trim()}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {hasPoolBasics || hasEquipment ? (
          <View style={styles.twoCol}>
            <View style={styles.colLeft}>
              <SectionLabel>Prepared For</SectionLabel>
              {customer.name.trim() ? <Text style={styles.valueLine}>{customer.name.trim()}</Text> : null}
              {customer.address.trim() ? <Text style={styles.valueLine}>{customer.address.trim()}</Text> : null}
              {customer.email.trim() ? <Text style={styles.valueLine}>{customer.email.trim()}</Text> : null}
              {customer.phone.trim() ? <Text style={styles.valueLine}>{customer.phone.trim()}</Text> : null}
            </View>
            <View style={styles.colRight}>
              {hasPoolBasics ? (
                <View>
                  <SectionLabel>Your Pool</SectionLabel>
                  <Row label="Volume" value={pool.gallons ? `${pool.gallons} gallons` : ''} />
                  <Row label="Dimensions" value={dimensionsLine(pool)} />
                  <Row label="Shape" value={pool.shape} />
                  <Row label="Sanitization" value={pool.sanitization} />
                </View>
              ) : null}
              {hasEquipment ? (
                <View style={hasPoolBasics ? { marginTop: 10 } : undefined}>
                  <SectionLabel>Equipment</SectionLabel>
                  <Row label="Pump" value={pool.pump} />
                  <Row label="Filter" value={pool.filter} />
                  <Row label="Heater" value={pool.heater} />
                  <Row label="Automation" value={pool.automation} />
                  <Row label="Notes" value={pool.equipmentNotes} />
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <SectionLabel>Prepared For</SectionLabel>
            {customer.name.trim() ? <Text style={styles.valueLine}>{customer.name.trim()}</Text> : null}
            {customer.address.trim() ? <Text style={styles.valueLine}>{customer.address.trim()}</Text> : null}
            {customer.email.trim() ? <Text style={styles.valueLine}>{customer.email.trim()}</Text> : null}
            {customer.phone.trim() ? <Text style={styles.valueLine}>{customer.phone.trim()}</Text> : null}
          </View>
        )}

        {summaryLines.length || visit.overall.trim() ? (
          <View style={styles.summaryBox} wrap={false}>
            <View style={styles.summaryHead}>
              <Text style={styles.summaryHeading}>Where Your Pool Stands</Text>
              {visit.overall.trim() ? (
                <View style={styles.overallChip}>
                  <Text style={styles.overallChipText}>
                    Overall: {visit.overall.trim().toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>
            {summaryLines.map((line, i) => (
              <Text key={i} style={styles.summaryPara}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        {readings.length ? (
          <View style={styles.section}>
            {/* Heading + column header + first reading are glued together so
                the table never starts with a stranded heading. */}
            {readings.map((f, i) => (
              <View key={f.key} wrap={i === 0 ? false : undefined}>
                {i === 0 ? (
                  <View>
                    <SectionLabel>Water Chemistry — First Visit</SectionLabel>
                    <View style={styles.chemHeadRow}>
                      <Text style={[styles.chemName, styles.chemHeadCell]}>Reading</Text>
                      <Text style={[styles.chemValue, styles.chemHeadCell]}>Result</Text>
                      <Text style={[styles.chemIdeal, styles.chemHeadCell]}>Ideal Range</Text>
                    </View>
                  </View>
                ) : null}
                <View style={styles.chemRow}>
                  <Text style={styles.chemName}>{f.label}</Text>
                  <Text style={styles.chemValue}>{f.unit ? `${f.value} ${f.unit}` : f.value}</Text>
                  <Text style={styles.chemIdeal}>{f.ideal || ''}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.chemNote}>
              Ideal ranges are general targets for a residential pool — we balance to what your pool
              actually needs.
            </Text>
          </View>
        ) : null}

        {workLines.length ? (
          <View style={styles.section}>
            <View wrap={false}>
              <SectionLabel>What We Did On This Visit</SectionLabel>
              <BodyLines lines={workLines.slice(0, 1)} />
            </View>
            <BodyLines lines={workLines.slice(1)} />
          </View>
        ) : null}

        {hasSurface ? (
          <View style={styles.section}>
            <View wrap={false}>
              <SectionLabel>Surface &amp; Finish</SectionLabel>
              <Row label="Surface" value={surface.material} />
              <Row label="Condition" value={surface.condition} />
            </View>
            {surfaceObservations.length ? (
              <View style={{ marginTop: 4 }}>
                {surfaceObservations.map((o, i) => (
                  <Text key={i} style={styles.bodyBullet}>
                    <Text style={styles.bulletDot}>•&nbsp;&nbsp;</Text>
                    {o}
                  </Text>
                ))}
              </View>
            ) : null}
            {surface.notes.trim() ? (
              <View style={{ marginTop: 3 }}>
                <BodyLines lines={toLines(surface.notes)} />
              </View>
            ) : null}
          </View>
        ) : null}

        {sortedIssues.length ? (
          <View style={styles.section}>
            {/* Each row is wrapped in a keyed <View> because this project has
                no @types/react, so custom components don't accept `key`. The
                first one also carries the heading, unbreakably. */}
            {sortedIssues.map((issue, i) => (
              <View key={i} wrap={i === 0 ? false : undefined}>
                {i === 0 ? <SectionLabel>What Needs Attention</SectionLabel> : null}
                <ItemRow
                  chipLabel={SEVERITY_CHIPS[issue.severity]}
                  chipColors={SEVERITY_CHIP[issue.severity]}
                  label={issue.label.trim()}
                  note={issue.note}
                />
              </View>
            ))}
          </View>
        ) : null}

        {sortedRecs.length ? (
          <View style={styles.section}>
            {sortedRecs.map((rec, i) => (
              <View key={i} wrap={i === 0 ? false : undefined}>
                {i === 0 ? <SectionLabel>Our Recommendations</SectionLabel> : null}
                <ItemRow
                  chipLabel={PRIORITY_CHIPS[rec.priority]}
                  chipColors={PRIORITY_CHIP[rec.priority]}
                  label={rec.label.trim()}
                  note={rec.note}
                />
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.closingBox} wrap={false}>
          <Text style={styles.closingText}>
            {sortedIssues.length || sortedRecs.length
              ? 'Questions about anything in this report? Just reply to the email it came with — we’re happy to walk through it, and we can put together pricing on anything you’d like handled.'
              : 'Questions about anything in this report? Just reply to the email it came with — we’re happy to walk through it.'}
          </Text>
        </View>

        {/* Photos — forced onto their own page via `break`. */}
        {photos.length ? (
          <View style={styles.section} break>
            <SectionLabel>Photos From This Visit</SectionLabel>
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
