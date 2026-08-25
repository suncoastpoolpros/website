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
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Path,
} from "@react-pdf/renderer";
import {
  type ProposalData,
  type Tier,
  formatPrice,
  splitTierIncludes,
  tierDelta,
} from "@/lib/adminApi";
import {
  benefitsFootnote,
  BENEFITS_HEADING,
  BENEFITS_PLAN_SCOPE,
  includedBenefits,
} from "./proposalBenefits";
import { sanitizationLabel } from "./sanitization";
import { PRICING_CONDITION_TERM_SHORT } from "./proposalTerms";
import {
  jobAssurances,
  jobKindOf,
  showsConditionTerm,
  showsExtrasTable,
  trustHeading,
} from "./jobKinds";
import { cadenceLabel } from "./serviceCadence";
import {
  ALL_COMPLETE_DIFFERENTIATORS,
  filterTypeLabel,
} from "./filterService";
import {
  EXTRAS_ALSO_INCLUDED_HEADING,
  EXTRAS_NOT_INCLUDED_HEADING,
  EXTRAS_COL_COMPLETE,
  EXTRAS_COL_ESSENTIALS,
  EXTRAS_COL_THEIRS,
  EXTRAS_EXCLUDED_LABEL,
  extrasIntroFor,
  EXTRAS_COL_YOURS,
  EXTRAS_HEADING,
  EXTRAS_INCLUDED_LABEL,
  EXTRAS_NOTE,
  EXTRAS_PLAN_QUALIFIER,
  includedExtras,
} from "./includedExtras";

const NAVY = "#0a1628";
const BRAND_BLUE = "#1669ae";
const BLUE_DARK = "#0f4d80";
const INK = "#1f2937";
const MUTED = "#6b7280";
const FAINT = "#8a93a3";
const LINE = "#e6e9ef";
const TINT = "#f1f7fc";
const TINT_BORDER = "#d4e6f4";
const GREEN = "#1d7a33";
// The ✗ on an Essentials row. Deep enough to read as "not included" at 7.8pt
// without turning the card into an error state — the text beside it stays muted.
const EXCLUDED_RED = "#c0392b";

// Uniform page margins (so continuation pages get clean top/side margins too).
const MARGIN_X = 46;

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 62,
    paddingHorizontal: MARGIN_X,
    fontSize: 8.5,
    color: INK,
    fontFamily: "Helvetica",
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandCol: { flex: 1 },
  eyebrow: {
    fontSize: 9,
    color: "#8ea2c0",
    letterSpacing: 2.8,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 23,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginTop: 9,
    letterSpacing: 0.3,
  },
  metaCol: { alignItems: "flex-end", paddingTop: 2 },
  metaLabel: {
    fontSize: 7,
    color: "#8ea2c0",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 10.5,
    color: "#ffffff",
    marginTop: 3,
    fontFamily: "Helvetica-Bold",
  },

  // ----- Shared section tokens -----
  section: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: BLUE_DARK,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  row: { flexDirection: "row", marginBottom: 2.5 },
  rowLabel: { width: 118, color: MUTED, paddingRight: 8 },
  rowValue: { flex: 1, color: INK },
  twoCol: { flexDirection: "row", marginBottom: 14 },
  colLeft: { width: "50%", flexShrink: 0, paddingRight: 18 },
  colRight: { width: "50%", flexShrink: 0, paddingLeft: 18 },
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
  includedHeading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: BLUE_DARK,
    marginBottom: 9,
  },
  includedItem: { flexDirection: "row", marginBottom: 6 },
  includedCheck: {
    color: GREEN,
    fontFamily: "Helvetica-Bold",
    width: 13,
    fontSize: 8.5,
    lineHeight: 1.45,
  },
  // fontSize is set explicitly alongside lineHeight — react-pdf sizes the line
  // box from the INHERITED size otherwise, which throws the leading out.
  includedItemText: {
    color: NAVY,
    flex: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    lineHeight: 1.45,
  },
  includedScope: {
    fontSize: 7.6,
    lineHeight: 1.35,
    color: BRAND_BLUE,
    marginBottom: 6,
  },
  includedFootnote: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: TINT_BORDER,
    fontSize: 8,
    color: FAINT,
    lineHeight: 1.4,
  },

  // ----- Value stack (what others bill separately) -----
  // No outer border: a bordered panel can't split across a page, which forced
  // the whole section to be unbreakable — and an unbreakable block that doesn't
  // fit pushes EVERYTHING behind it to the next page, so the scope of work fell
  // off page 1 entirely and left a half-empty page. As a plain table it flows.
  extrasBox: { marginBottom: 18 },
  extraRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  extraHeadRow: {
    flexDirection: "row",
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  extraHeadCell: {
    fontSize: 6.5,
    lineHeight: 1.3,
    color: FAINT,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  extraLabelCol: { flex: 1, paddingRight: 10 },
  extraLabel: {
    fontSize: 8.5,
    lineHeight: 1.3,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  extraBasis: { fontSize: 6.8, lineHeight: 1.3, color: FAINT, marginTop: 1 },
  // Struck through: the number the customer is NOT going to be billed.
  // Wide enough that the "OTHERS CHARGE" heading sits on one line — at 62pt it
  // wrapped and the second word collided with the next column's heading.
  extraPrice: {
    width: 80,
    fontSize: 8.5,
    lineHeight: 1.3,
    color: MUTED,
    textDecoration: "line-through",
    textAlign: "right",
  },
  extraIncluded: {
    width: 54,
    fontSize: 8,
    lineHeight: 1.3,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    textAlign: "right",
  },
  // The Essentials column on a three-plan quote. Same metrics as the Complete
  // column so the two read as a pair the eye compares straight across.
  // Same width as the text column it replaces, so the header above still
  // sits over its own values.
  extraMarkCol: {
    width: 54,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  extraEssentialsOff: {
    width: 54,
    fontSize: 8,
    lineHeight: 1.3,
    fontFamily: "Helvetica-Bold",
    color: EXCLUDED_RED,
    textAlign: "right",
  },
  extrasIntro: { fontSize: 8.5, lineHeight: 1.4, color: INK, marginBottom: 9 },
  extrasNote: {
    marginTop: 7,
    fontSize: 7.5,
    color: FAINT,
    fontStyle: "italic",
    lineHeight: 1.4,
  },

  // ----- Scope -----
  scopeIntro: { fontSize: 8.5, color: INK, marginBottom: 5, lineHeight: 1.35 },
  scopePara: { fontSize: 8.5, color: INK, marginBottom: 5, lineHeight: 1.35 },
  scopeBullet: { fontSize: 8.5, color: INK, marginBottom: 3, lineHeight: 1.35 },
  scopeBulletDot: { color: BRAND_BLUE },

  // ----- Photos -----
  photoGrid: { flexDirection: "row", flexWrap: "wrap" },
  photo: {
    width: 248,
    height: 156,
    objectFit: "cover",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    lineHeight: 1,
  },
  priceValue: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: BLUE_DARK,
    lineHeight: 1,
  },

  // ----- Tier comparison -----
  tierRow: { flexDirection: "row", marginHorizontal: -18, marginBottom: 10 },
  tierCol: {
    width: "50%",
    flexShrink: 0,
    paddingHorizontal: 5,
    flexDirection: "column",
  },
  // Three plans share the same row. Width is set explicitly rather than by
  // flex because @react-pdf sizes flex children by content, which made the
  // longest card the widest — see the note in react-pdf gotchas.
  tierColThird: {
    width: "33.333%",
    flexShrink: 0,
    paddingHorizontal: 3.5,
    flexDirection: "column",
  },
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
  tierCardRec: {
    borderWidth: 1.5,
    borderColor: BRAND_BLUE,
    backgroundColor: TINT,
  },
  ribbon: {
    alignSelf: "flex-start",
    backgroundColor: BRAND_BLUE,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 5,
  },
  ribbonText: {
    fontSize: 6.5,
    lineHeight: 1.2,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 1,
  },
  tierName: {
    fontSize: 12,
    lineHeight: 1.2,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  tierTagline: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 1.5,
    lineHeight: 1.25,
  },
  // Every fontSize here is paired with an explicit lineHeight: react-pdf sizes
  // the line box from the INHERITED font size otherwise, so a large value in a
  // small-text context reserves too little room and the next line overlaps it.
  tierPrice: {
    fontSize: 18,
    lineHeight: 1.15,
    fontFamily: "Helvetica-Bold",
    color: BLUE_DARK,
    marginTop: 6,
  },
  tierCadence: {
    fontSize: 7,
    lineHeight: 1.3,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tierDeltaText: {
    fontSize: 8.5,
    lineHeight: 1.3,
    fontFamily: "Helvetica-Bold",
    color: BRAND_BLUE,
    marginTop: 3,
  },
  tierBillingNote: {
    fontSize: 7,
    lineHeight: 1.35,
    color: MUTED,
    marginTop: 2,
  },
  tierRule: {
    borderTopWidth: 1,
    borderTopColor: LINE,
    marginTop: 7,
    marginBottom: 6,
  },
  tierBuildsOn: {
    fontSize: 8,
    lineHeight: 1.3,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 5,
  },
  tierItem: { flexDirection: "row", marginBottom: 2.5 },
  tierCheck: {
    color: GREEN,
    fontFamily: "Helvetica-Bold",
    width: 10,
    fontSize: 7.8,
    lineHeight: 1.28,
  },
  tierItemText: { flex: 1, fontSize: 7.8, color: INK, lineHeight: 1.28 },
  // The ✗ rows: same metrics as an included row so the columns stay on a grid,
  // muted so the eye reads a block of yes and a block of no without comparing
  // wording. FAINT rather than a red — this is a plan's scope, not an error.
  tierExcludeMark: {
    fontFamily: "Helvetica-Bold",
    width: 10,
    fontSize: 7.8,
    lineHeight: 1.28,
    color: EXCLUDED_RED,
  },
  tierExcludeText: { flex: 1, fontSize: 7.8, color: FAINT, lineHeight: 1.28 },
  // "ALSO INCLUDED" / "NOT INCLUDED" — twins at the same position on every
  // card, so the ✓ and ✗ rows they head stay level across the comparison.
  tierBlockLabel: {
    fontSize: 6.4,
    lineHeight: 1.3,
    fontFamily: "Helvetica-Bold",
    color: FAINT,
    letterSpacing: 0.5,
    marginTop: 5,
    marginBottom: 2,
  },
  // Terms render FULL WIDTH beneath the comparison, not inside the cards. The
  // same sentence wraps to ~2 lines across the page but 6–7 inside a 250pt
  // column, and that height was enough to push the whole (unbreakable)
  // comparison onto page 2.
  finePrintBlock: { marginTop: 2, marginBottom: 12 },
  finePrintLine: {
    fontSize: 6.4,
    color: FAINT,
    lineHeight: 1.35,
    marginBottom: 2,
  },
  finePrintName: { fontFamily: "Helvetica-Bold", color: MUTED },
  valueNoteBox: {
    backgroundColor: "#fff8ec",
    borderWidth: 1,
    borderColor: "#f0dcb4",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 18,
    marginHorizontal: -18,
    marginBottom: 12,
  },
  valueNoteText: { fontSize: 8, color: "#8a5a10", lineHeight: 1.32 },
  // The non-recommended plan's note explains the service rather than selling an
  // offer, so it reads as information (blue tint) not promotion (amber).
  valueNoteBoxPlain: { backgroundColor: TINT, borderColor: TINT_BORDER },
  valueNoteTextPlain: { color: BLUE_DARK },

  // ----- Add-ons -----
  addonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  addonLabel: { color: INK, flex: 1, paddingRight: 12 },
  addonPrice: { color: INK, fontFamily: "Helvetica-Bold" },

  // ----- Accept -----
  acceptBox: {
    backgroundColor: "#eef8f0",
    borderWidth: 1,
    borderColor: "#c2e6c8",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginHorizontal: -18,
    // No bottom margin. react-pdf counts trailing margin when deciding whether
    // a wrap={false} block fits, so 22pt of space that nothing ever occupies
    // was enough to push the accept box — the call to action — onto a page of
    // its own. It is either the last element, where the page padding already
    // provides the gap, or it is followed by photos, which force their own
    // page break regardless.
    marginBottom: 0,
  },
  acceptText: { fontSize: 8.5, color: GREEN, lineHeight: 1.3 },

  // ----- Footer (every page) -----
  footer: {
    position: "absolute",
    bottom: 28,
    left: MARGIN_X,
    right: MARGIN_X,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: FAINT },
});

const Row = ({
  label,
  value,
  labelWidth,
}: {
  label: string;
  value?: string;
  labelWidth?: number;
}) => {
  const v = (value ?? "").trim();
  if (!v) return null;
  return (
    <View style={styles.row}>
      <Text
        style={[styles.rowLabel, labelWidth ? { width: labelWidth } : null]}
      >
        {label}
      </Text>
      <Text style={styles.rowValue}>{v}</Text>
    </View>
  );
};

/**
 * One plan card. The upgrade card lists ONLY its extras, under an explicit
 * "Everything in <base>, plus:" line — so the base plan never reads as the
 * stripped-down option, and the added value is what stands out.
 */
/**
 * The value-stack marks, DRAWN rather than typed.
 *
 * Standard Helvetica has no glyph for U+2713 ✓, U+2717 ✗ or their heavy
 * variants — verified by rendering them, where every one came out as an empty
 * box. Typing a check into this document would silently blank the column on
 * the printed page while the web version looked fine. These are vector paths,
 * so they match the page's icons and stay crisp at any zoom.
 */
const MarkTick = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24">
    <Path d="M20 6 L9 17 L4 12" stroke={GREEN} strokeWidth={3.5} fill="none" />
  </Svg>
);
const MarkCross = () => (
  <Svg width={9} height={9} viewBox="0 0 24 24">
    <Path d="M18 6 L6 18" stroke={EXCLUDED_RED} strokeWidth={3.5} fill="none" />
    <Path d="M6 6 L18 18" stroke={EXCLUDED_RED} strokeWidth={3.5} fill="none" />
  </Svg>
);

const TierCard = ({
  tier,
  buildsOn,
  baseIncludes = [],
  delta,
  cadence,
  blockLabel,
}: {
  tier: Tier;
  /** Name of the cheaper tier, when this one builds on it. */
  buildsOn?: string;
  /** The cheaper plan's list, for rebuilding the legacy stored shape. */
  baseIncludes?: string[];
  /** Pre-formatted upgrade cost, e.g. "+$12/mo". */
  delta?: string;
  /** "Weekly service" / "Every other week", under the rate. Empty = omit. */
  cadence?: string;
  /** "ALSO INCLUDED", on three-plan Complete cards only. */
  blockLabel?: string;
}) => {
  const split = splitTierIncludes(tier, baseIncludes);
  const items = [...split.shared, ...split.extras];
  // Print shows only what this plan ADDS; the base card carries the rest and
  // sits immediately to its left, so the reference is never a forward one.
  const shown = split.extras.length ? split.extras : split.shared;
  return (
    <View
      style={[styles.tierCard, tier.recommended ? styles.tierCardRec : null]}
    >
      {tier.recommended ? (
        <View style={styles.ribbon}>
          {/* Same word as the approve page. The customer reads both documents,
              often side by side, and two names for one thing invites the
              question of whether they are the same thing. */}
          <Text style={styles.ribbonText}>BEST VALUE</Text>
        </View>
      ) : null}
      <Text style={styles.tierName}>{tier.name.trim()}</Text>
      {tier.tagline.trim() ? (
        <Text style={styles.tierTagline}>{tier.tagline.trim()}</Text>
      ) : null}
      {tier.price.trim() ? (
        <Text style={styles.tierPrice}>{formatPrice(tier.price)}</Text>
      ) : null}
      {/* The cadence directly under the rate — the divisor for the number
          above it, same as the approve page. On both cards, because it is the
          same service either way. */}
      {cadence ? <Text style={styles.tierCadence}>{cadence}</Text> : null}
      {/* An explicit note beats the computed delta: an annual plan shown at its
          effective monthly rate needs "$1,958 billed once", not "+$X more". */}
      {tier.priceNote.trim() ? (
        <Text style={styles.tierDeltaText}>{tier.priceNote.trim()}</Text>
      ) : null}
      {tier.billingNote?.trim() ? (
        <Text style={styles.tierBillingNote}>{tier.billingNote.trim()}</Text>
      ) : delta ? (
        <Text style={styles.tierDeltaText}>
          {delta} more than {buildsOn}
        </Text>
      ) : null}
      {/* No divider when there's nothing under it — the base card carries only a
          price, because the service it buys is listed once above the cards. */}
      {/* THE PDF KEEPS THE CROSS-REFERENCE, and deliberately diverges from the
          approve page here.

          "Everything in <base>, plus:" broke on the page because a phone stacks
          the cards with the recommended one FIRST, so it pointed at something
          not yet read. A PDF has no such problem: the page is a fixed width,
          the two cards are always side by side, and the base plan is always to
          the left of the sentence referring to it. The reference is unambiguous
          in print and it keeps the card short, which matters far more on a
          document that has to share a page with the scope and the price.

          So the PDF shows only this plan's OWN extras — items.slice(0, extras)
          — while the page shows the full list. Same stored data, read two ways,
          because the two media fail differently. Old quotes have no extrasCount
          and fall back to printing everything, which is exactly what they were
          sent. */}
      {shown.length || buildsOn ? <View style={styles.tierRule} /> : null}
      {buildsOn ? (
        <Text style={styles.tierBuildsOn}>Everything in {buildsOn}, plus:</Text>
      ) : null}
      {shown.map((item, i) => {
        // The first differentiator opens the labelled block — its twin is the
        // "NOT INCLUDED" label on the Essentials card at the same position.
        const opensBlock =
          !!blockLabel &&
          ALL_COMPLETE_DIFFERENTIATORS.includes(item.trim()) &&
          !ALL_COMPLETE_DIFFERENTIATORS.includes((shown[i - 1] ?? "").trim());
        // An ARRAY, not a Fragment: this file never imports React (the
        // @react-pdf JSX runtime is automatic), and a keyed array renders the
        // optional label and its row as siblings just the same.
        return [
          opensBlock ? (
            <Text key={`l${i}`} style={styles.tierBlockLabel}>
              {blockLabel}
            </Text>
          ) : null,
          <View key={i} style={styles.tierItem}>
            <Text style={styles.tierCheck}>•</Text>
            <Text style={styles.tierItemText}>{item}</Text>
          </View>,
        ];
      })}
      {/* WHAT THIS PLAN LEAVES OUT — Essentials only. The print version of the
          page's ✗ rows, and the reason the cheaper rate is defensible when the
          first parts invoice arrives: the customer was told, on the document
          they kept, before they chose. */}
      {tier.excludes?.length ? (
        <>
          {/* No rule, for the same reason as the page: these rows pair with ✓
              rows at the same position on the card alongside. The label is
              that pairing's other half. */}
          <Text style={styles.tierBlockLabel}>
            {EXTRAS_NOT_INCLUDED_HEADING.toUpperCase()}
          </Text>
          {tier.excludes.map((item, i) => (
            <View key={i} style={styles.tierItem}>
              <Text style={styles.tierExcludeMark}>×</Text>
              <Text style={styles.tierExcludeText}>{item}</Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
};

const dimensionsLine = (pool: ProposalData["pool"]): string => {
  const { length, width, avgDepth } = pool;
  return [
    length && `${length} ft L`,
    width && `${width} ft W`,
    avgDepth && `${avgDepth} ft avg depth`,
  ]
    .filter(Boolean)
    .join(" × ");
};

export const ProposalDocument = ({
  data,
  photos = [],
  dateLabel,
  proposalNumber,
}: {
  data: ProposalData;
  /** Data-URL JPEGs (already downscaled by the builder) to embed in the PDF. */
  photos?: string[];
  dateLabel: string;
  /** Reserved before this renders. Null on quotes sent before numbering, and
   *  whenever storage is unavailable — the masthead then just omits it. */
  proposalNumber?: number | null;
}) => {
  const { customer, pool, proposal } = data;
  const hasPoolBasics =
    pool.gallons || dimensionsLine(pool) || pool.shape || pool.sanitization;
  const hasEquipment =
    pool.pump ||
    pool.filterType ||
    pool.filter ||
    pool.heater ||
    pool.equipmentNotes;
  const addOns = proposal.addOns.filter(
    (a) => a.label.trim() || a.price.trim(),
  );
  const tiered = proposal.pricingMode === "tiers" && proposal.tiers.length > 0;
  const kind = jobKindOf(proposal.jobKind);
  const hasCustomer = [
    customer.name,
    customer.address,
    customer.email,
    customer.phone,
  ].some((v) => v.trim());
  // Every "what's included" surface is derived from THIS pool's filter, so a
  // sand-filter customer never reads a promise about cartridge elements.
  const filterOption = {
    type: pool.filterType,
    // Boolean true is the legacy stored shape — the send endpoint accepted
    // both. Reading only 'yes' made the PDF show filter service as excluded
    // while the approve page it was downloaded from showed it included.
    included:
      pool.filterServiceIncluded === "yes" ||
      (pool.filterServiceIncluded as unknown) === true,
  };
  const hasEssentials = proposal.tiers.some((t) => t.essentials);
  const extras = includedExtras(filterOption, pool.sanitization, hasEssentials);
  const tiers = tiered ? proposal.tiers : [];
  const [baseTier, upgradeTier] = tiers;
  const delta = tierDelta(baseTier, upgradeTier);
  // With tiers on, the recommended plan's name is the word the customer replies
  // with, so acceptance can't be ambiguous.
  const recommended =
    tiers.find((t) => t.recommended) ?? upgradeTier ?? baseTier;
  const finePrints = tiers
    .map((t) => ({ name: t.name.trim(), text: t.finePrint.trim() }))
    .filter((f) => f.text !== "");
  const acceptWords = tiers
    .map((t) => t.name.trim().toUpperCase())
    .filter(Boolean)
    // Recommended first — the first option listed is the one most people take.
    .sort((a, b) =>
      a === recommended?.name.trim().toUpperCase()
        ? -1
        : b === recommended?.name.trim().toUpperCase()
          ? 1
          : 0,
    );
  // Drop blank/whitespace-only lines so the scope renders tight regardless of
  // how the text was spaced (blank lines between bullets were rendering as gaps).
  const scopeLines = proposal.scope.trim()
    ? proposal.scope
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
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
              {proposalNumber ? (
                <>
                  <Text style={styles.metaLabel}>Proposal</Text>
                  <Text style={styles.metaValue}>#{proposalNumber}</Text>
                  <Text style={[styles.metaLabel, { marginTop: 7 }]}>Date</Text>
                </>
              ) : (
                <Text style={styles.metaLabel}>Proposal Date</Text>
              )}
              <Text style={styles.metaValue}>{dateLabel}</Text>
            </View>
          </View>
        </View>

        {hasPoolBasics || hasEquipment ? (
          <View style={styles.twoCol}>
            <View style={styles.colLeft}>
              {/* Suppressed when every line under it is blank — a quote raised
                  from an address alone, which the texted-lead flow makes
                  routine, otherwise printed a heading over nothing. */}
              {hasCustomer ? (
                <Text style={styles.sectionLabel}>Prepared For</Text>
              ) : null}
              {customer.name.trim() ? (
                <Text style={styles.valueLine}>{customer.name.trim()}</Text>
              ) : null}
              {customer.address.trim() ? (
                <Text style={styles.valueLine}>{customer.address.trim()}</Text>
              ) : null}
              {customer.email.trim() ? (
                <Text style={styles.valueLine}>{customer.email.trim()}</Text>
              ) : null}
              {customer.phone.trim() ? (
                <Text style={styles.valueLine}>{customer.phone.trim()}</Text>
              ) : null}
            </View>
            <View style={styles.colRight}>
              {hasPoolBasics ? (
                <View>
                  <Text style={styles.sectionLabel}>Pool — Size & Volume</Text>
                  <Row
                    label="Volume"
                    value={pool.gallons ? `${pool.gallons} gallons` : ""}
                    labelWidth={88}
                  />
                  <Row
                    label="Dimensions"
                    value={dimensionsLine(pool)}
                    labelWidth={88}
                  />
                  <Row label="Shape" value={pool.shape} labelWidth={88} />
                  <Row
                    label="Sanitization"
                    value={sanitizationLabel(pool.sanitization)}
                    labelWidth={88}
                  />
                </View>
              ) : null}
              {hasEquipment ? (
                <View style={hasPoolBasics ? { marginTop: 10 } : undefined}>
                  <Text style={styles.sectionLabel}>Equipment</Text>
                  <Row label="Pump" value={pool.pump} labelWidth={88} />
                  <Row
                    label="Filter"
                    value={[filterTypeLabel(pool.filterType), pool.filter]
                      .filter((v) => v.trim())
                      .join(" — ")}
                    labelWidth={88}
                  />
                  <Row label="Heater" value={pool.heater} labelWidth={88} />
                  <Row
                    label="Notes"
                    value={pool.equipmentNotes}
                    labelWidth={88}
                  />
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            {hasCustomer ? (
              <Text style={styles.sectionLabel}>Prepared For</Text>
            ) : null}
            {customer.name.trim() ? (
              <Text style={styles.valueLine}>{customer.name.trim()}</Text>
            ) : null}
            {customer.address.trim() ? (
              <Text style={styles.valueLine}>{customer.address.trim()}</Text>
            ) : null}
            {customer.email.trim() ? (
              <Text style={styles.valueLine}>{customer.email.trim()}</Text>
            ) : null}
            {customer.phone.trim() ? (
              <Text style={styles.valueLine}>{customer.phone.trim()}</Text>
            ) : null}
          </View>
        )}

        {/* In tier mode this box IS the service definition — both plans include
            the same service, so it's stated once here rather than repeated in
            each card — and it always renders regardless of the toggle. */}
        {/* The trust block, chosen by what this job actually is.
            A one-time recovery used to carry the weekly-service promises — "a
            report after every visit", a two-week guarantee — which on a job
            with three visits and a four-day life reads as a template nobody
            adjusted. It is replaced rather than removed: a one-off buyer is not
            less anxious, they are anxious about the price moving and about
            being told the pool needs draining. See jobKinds.ts. */}
        {proposal.includeBenefits || tiered ? (
          <View style={styles.includedBox} wrap={false}>
            <Text style={styles.includedHeading}>
              {kind === "recurring" ? BENEFITS_HEADING : trustHeading(kind)}
            </Text>
            {/* Names the plan these promises belong to. Without it page one
                states "all chemicals included" and "cartridge replacement
                included" on a quote whose Essentials card removes exactly
                those — see BENEFITS_PLAN_SCOPE. */}
            {kind === "recurring" && tiers.some((t) => t.essentials) ? (
              <Text style={styles.includedScope}>{BENEFITS_PLAN_SCOPE}</Text>
            ) : null}
            {(kind === "recurring"
              ? includedBenefits(filterOption, pool.sanitization)
              : jobAssurances(kind)
            ).map((b, i) => (
              <View key={i} style={styles.includedItem}>
                <Text style={styles.includedCheck}>•</Text>
                <Text style={styles.includedItemText}>{b}</Text>
              </View>
            ))}
            {/* THE EXCLUDED-FILTER DISCLOSURE, finally rendered. The box above
                says "Filter cleaning — included", and benefitsFootnote was
                written precisely so that can't be misread as elements-included
                — then never wired to any surface (this style sat unused). On
                an excluded quote it is the only sentence in the Difference box
                telling the customer parts are quoted separately, which is what
                makes the lower rate defensible when the first element comes
                due. Included quotes keep their fuller terms in the plan-card
                fine print; repeating them here said everything twice. */}
            {kind === "recurring" && !filterOption.included ? (
              <Text style={styles.includedFootnote}>
                {benefitsFootnote(filterOption)}
              </Text>
            ) : null}
          </View>
        ) : null}

        {showsExtrasTable(kind) &&
        (proposal.includeBenefits || tiered) &&
        extras.length ? (
          <View style={styles.section}>
            <View style={styles.extrasBox}>
              {extras.map((x, i) => (
                // The heading, the reasoning, the column headers and the FIRST
                // row travel together; the remaining rows flow, so the table can
                // split across a page instead of blocking the page behind it.
                <View key={i} wrap={i === 0 ? false : undefined}>
                  {i === 0 ? (
                    <View>
                      <Text style={styles.sectionLabel}>{EXTRAS_HEADING}</Text>
                      <Text style={styles.extrasIntro}>
                        {extrasIntroFor(filterOption.included, hasEssentials)}
                      </Text>
                      <View style={styles.extraHeadRow}>
                        <Text
                          style={[styles.extraLabelCol, styles.extraHeadCell]}
                        >
                          {" "}
                        </Text>
                        <Text
                          style={[
                            styles.extraPrice,
                            styles.extraHeadCell,
                            { textDecoration: "none" },
                          ]}
                        >
                          {EXTRAS_COL_THEIRS}
                        </Text>
                        {hasEssentials ? (
                          <Text
                            style={[
                              styles.extraIncluded,
                              styles.extraHeadCell,
                              { color: FAINT },
                            ]}
                          >
                            {EXTRAS_COL_ESSENTIALS}
                          </Text>
                        ) : null}
                        <Text
                          style={[
                            styles.extraIncluded,
                            styles.extraHeadCell,
                            { color: FAINT },
                          ]}
                        >
                          {hasEssentials
                            ? EXTRAS_COL_COMPLETE
                            : EXTRAS_COL_YOURS}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.extraRow,
                      i === extras.length - 1 ? { borderBottomWidth: 0 } : null,
                    ]}
                  >
                    <View style={styles.extraLabelCol}>
                      <Text style={styles.extraLabel}>{x.label}</Text>
                      <Text style={styles.extraBasis}>{x.basis}</Text>
                    </View>
                    <Text style={styles.extraPrice}>{x.typical}</Text>
                    {hasEssentials ? (
                      <View style={styles.extraMarkCol}>
                        {x.essentialsCovers ? <MarkTick /> : <MarkCross />}
                      </View>
                    ) : null}
                    <View style={styles.extraMarkCol}>
                      <MarkTick />
                    </View>
                  </View>
                </View>
              ))}
              <Text style={styles.extrasNote}>
                {EXTRAS_NOTE}
                {tiers.some((t) => t.essentials)
                  ? ` ${EXTRAS_PLAN_QUALIFIER}`
                  : ""}
              </Text>
            </View>
          </View>
        ) : null}

        {/* minPresenceAhead is 40pt (~3 lines), not 72. The reserve exists so
            "Scope of Work" never lands alone at the foot of a page, and three
            lines settles that. At 72 it demanded six, which on a short one-time
            quote missed fitting by a couple of points and pushed the scope, the
            price AND the accept box onto a second page that was then two thirds
            empty — a quote that reads as padded rather than brief. */}
        {scopeLines.length ? (
          <View style={styles.section} minPresenceAhead={40}>
            <Text style={styles.sectionLabel}>Scope of Work</Text>
            {scopeLines.map((line, i) =>
              /^[•\-]/.test(line) ? (
                <Text key={i} style={styles.scopeBullet}>
                  <Text style={styles.scopeBulletDot}>•&nbsp;&nbsp;</Text>
                  {line.replace(/^[•\-]\s*/, "")}
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
                  <View
                    key={i}
                    style={
                      tiers.length >= 3 ? styles.tierColThird : styles.tierCol
                    }
                  >
                    <TierCard
                      tier={tier}
                      /*
                       * The cross-reference works by PREFIX: sharedCount (or a
                       * base list) splits a card's bullets into shared-then-
                       * extra. Pay Monthly differs from Essentials by a single
                       * bullet sitting in the MIDDLE of its list — one filter
                       * line swapped for another — so a prefix split can't
                       * express it, and the card printed all six bullets under
                       * "Everything in Essentials, plus:" as though every one
                       * were an addition. It stands alone instead; its tagline
                       * already names the upgrade. Pay Annually keeps the
                       * reference: its extras genuinely are a suffix.
                       */
                      buildsOn={
                        i > 0 && !tier.essentials && !tiers[i - 1].essentials
                          ? tiers[i - 1].name.trim()
                          : undefined
                      }
                      baseIncludes={
                        i > 0 && !tier.essentials && !tiers[i - 1].essentials
                          ? tiers[i - 1].includes
                          : []
                      }
                      /* The computed "+$X more than Y" delta is only ever
                         derived for the two-plan pair; on three plans each
                         card carries its own priceNote and the tagline names
                         the upgrade, so a delta here would be wrong. */
                      delta={tiers.length >= 3 ? "" : i > 0 ? delta : ""}
                      cadence={cadenceLabel(proposal.cadence)}
                      blockLabel={
                        hasEssentials && !tier.essentials
                          ? EXTRAS_ALSO_INCLUDED_HEADING.toUpperCase()
                          : undefined
                      }
                    />
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.finePrintBlock}>
              {finePrints.map((f, i) => (
                <Text key={i} style={styles.finePrintLine}>
                  {finePrints.length > 1 ? (
                    <Text style={styles.finePrintName}>{f.name}: </Text>
                  ) : null}
                  {f.text}
                </Text>
              ))}
            </View>
            {/* Every plan's note renders, in card order: the base plan explains
                what the all-in rate covers, the recommended one sells the offer. */}
            {tiers.map((tier, i) =>
              tier.valueNote.trim() ? (
                <View
                  key={i}
                  style={[
                    styles.valueNoteBox,
                    tier.recommended ? null : styles.valueNoteBoxPlain,
                  ]}
                  wrap={false}
                >
                  <Text
                    style={[
                      styles.valueNoteText,
                      tier.recommended ? null : styles.valueNoteTextPlain,
                    ]}
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
              <Text style={styles.priceValue}>
                {formatPrice(proposal.price)}
              </Text>
              {/* Same divisor as the tier cards: a single-price recurring
                  quote is "$165/mo" too. Empty on one-time jobs and on
                  quotes from before the field existed, so nothing prints. */}
              {cadenceLabel(proposal.cadence) ? (
                <Text style={styles.tierCadence}>
                  {cadenceLabel(proposal.cadence)}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {addOns.length ? (
          <View style={styles.section} minPresenceAhead={72}>
            <Text style={styles.sectionLabel}>Additional Services</Text>
            {addOns.map((a, i) => (
              <View key={i} style={styles.addonRow}>
                <Text style={styles.addonLabel}>{a.label.trim() || "—"}</Text>
                <Text style={styles.addonPrice}>{formatPrice(a.price)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* The condition the PRICE assumes — on RECURRING work only.
            It sits outside the tiered/single branch because a single-price
            weekly quote needs it just as much as a tiered one. But on a
            one-time job it is absurd: "pricing assumes the pool is clean and in
            balanced condition" on a green-to-clean, where the pool being filthy
            IS the job, reads either as a copy-paste error or as a trapdoor to
            raise the price on arrival. */}
        {showsConditionTerm(kind) ? (
          <View style={styles.finePrintBlock}>
            <Text style={styles.finePrintLine}>
              {PRICING_CONDITION_TERM_SHORT}
            </Text>
          </View>
        ) : null}

        <View style={styles.acceptBox} wrap={false}>
          <Text style={styles.acceptText}>
            {acceptWords.length > 1
              ? `To accept, simply reply to the email this was attached to with the plan you'd like — ${acceptWords.join(" or ")} — and we'll get you on the schedule.`
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
          <Text style={styles.footerText}>
            Suncoast Pool Pros · St. Petersburg, FL
          </Text>
          <Text
            style={styles.footerText}
            fixed
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
          <Text style={styles.footerText}>suncoastpoolpros.com</Text>
        </View>
      </Page>
    </Document>
  );
};
