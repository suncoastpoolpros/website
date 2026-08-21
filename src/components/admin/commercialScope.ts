/**
 * The commercial scope of work — written backwards from what actually closes
 * Florida commercial pools.
 *
 * THE INSIGHT THIS FILE ENCODES: these pools do not fail inspection because the
 * water is dirty. They fail at the equipment pad — an empty acid croc, a feeder
 * that stopped, circulation drifting below the permitted rate behind a filter
 * nobody has opened. So the pad section is the longest one here and is
 * deliberately printed above the water section, which is the reverse of every
 * residential document we produce.
 *
 * Boards are coached by their own management companies to compare bids on scope
 * first and price second, and to reject vague service language on sight. That
 * makes specificity worth real money: every line below names a thing and a
 * cadence, so the document can be set beside a competitor's "regular service as
 * needed" and win before the price is reached.
 *
 * NOT MIRRORED into functions/. The covering email is a note and a link now, so
 * none of this is restated server-side and there is nothing to drift — which is
 * exactly why deleting the duplicated email body was worth doing.
 */

export type ScopeGroup = {
  title: string;
  /** Why this group exists, in the board's terms. Printed small, under the title. */
  rationale: string;
  items: string[];
};

/**
 * Printed in this order. The pad comes first because that is where the risk is,
 * and leading with it is the whole argument of the document.
 */
export const COMMERCIAL_SCOPE: ScopeGroup[] = [
  {
    title: 'Equipment pad — every visit',
    rationale:
      'Where commercial pools actually fail their inspections, and the part a thinly-stretched route cannot keep up with.',
    items: [
      'Chlorine and acid feeders checked for operation, and their containers refilled — an empty container or a stopped feeder is grounds for immediate closure, and it is the most common finding of all.',
      'Filter pressure read and recorded against the baseline for this pool, so a rising trend is caught as a trend rather than as a failure.',
      'Circulation flow verified against the permitted rate for this pool, and reported when it drifts outside it.',
      'Pump, motor, valves, unions and visible plumbing inspected for leaks, noise and wear.',
      'Skimmer and pump baskets emptied; strainer lids and gaskets checked.',
      'Filter cleaned, backwashed or torn down on the schedule its type and pressure require, not on a fixed calendar.',
    ],
  },
  {
    title: 'Water chemistry — every visit',
    rationale: 'Tested and recorded on site, not estimated afterwards.',
    items: [
      'Free chlorine or bromine and pH tested and recorded, and balanced to the ranges required by 64E-9.004 — pH 7.0 to 7.8, free chlorine 1 to 10 mg/L in a conventional pool.',
      'Cyanuric acid tested weekly wherever stabilised chlorine is in use, and managed down before it makes the chlorine reading meaningless.',
      'Total alkalinity, calcium hardness and salt tested and trended, so a developing problem shows up in the record before it shows up in the water.',
      'Chemicals supplied and included in the monthly rate.',
    ],
  },
  {
    title: 'Pool and deck — every visit',
    rationale: 'The part residents see, and the only part most bids describe.',
    items: [
      'Surface skimmed, walls and steps brushed, floor vacuumed as required.',
      'Tile line cleaned at the waterline.',
      'Water level checked and corrected against the skimmer or gutter, since a level out of range stops the surface being skimmed at all.',
      'Deck rinsed of chemical residue in the immediate pool surround; furniture moved as needed to work.',
    ],
  },
  {
    title: 'Safety and code — every visit, documented monthly',
    rationale:
      'Checked on sight by an inspector, cheap to fix, and entirely a matter of whether anyone looked.',
    items: [
      'Life ring with rope and shepherd’s hook present, serviceable and mounted.',
      'Main drain and suction outlet covers inspected for damage and secure fit.',
      'Code-required rule signage and depth markings present and legible, and photographed monthly for the record.',
      'Gates, latches and self-closing hardware checked and reported.',
      'Our service technician certification kept posted in the equipment room, as 64E-9.018 requires of the pool being serviced.',
    ],
  },
];

/**
 * The two honest ways to handle the every-24-hours testing duty.
 *
 * Florida requires pH and disinfectant to be tested and logged at least once
 * every 24 hours that a regulated public pool is open, and the duty sits with
 * the owner or operator. Two, three or five visits a week does not satisfy that
 * on its own. A proposal that gestures at "full compliance" is therefore
 * writing a cheque the visit schedule cannot cash — and it is precisely the
 * sentence that gets read back to you afterwards.
 *
 * BOTH ARE PRINTED, side by side and priced. Showing a board what daily service
 * actually costs is what makes the audited-log option look like the sensible
 * choice rather than a limitation — and it moves the decision to them, on the
 * record, which is the whole point.
 */
export type LogModel = {
  key: 'audited' | 'daily';
  title: string;
  /** The one-line summary that sits above the price. */
  summary: string;
  /** Who does what, spelled out. Ambiguity here is the liability. */
  split: { who: string; does: string }[];
};

export const LOG_MODELS: LogModel[] = [
  {
    key: 'audited',
    title: 'Your log, set up and audited by us',
    summary:
      'We test and record on every visit we make, stand up the log, and check your entries on the days between.',
    split: [
      {
        who: 'We provide',
        does: 'The log book set up for this pool, a test kit, and a walk-through for your on-site staff on how to test and what to write down.',
      },
      {
        who: 'We do',
        does: 'Test and record on every scheduled visit, review the entries made since we were last here, and report gaps or out-of-range readings in writing.',
      },
      {
        who: 'You do',
        does: 'A pH and disinfectant test entered in the log on the days we are not scheduled, by staff already on site.',
      },
    ],
  },
  {
    key: 'daily',
    title: 'Daily service — the testing is entirely ours',
    summary:
      'We attend seven days a week, so the every-24-hours test is never anybody else’s job.',
    split: [
      {
        who: 'We do',
        does: 'Everything above, seven days a week. No on-site staff involvement and nothing for the association to maintain.',
      },
      {
        who: 'You do',
        does: 'Nothing. This is the option to choose where there is no reliable on-site staff, or where the property cannot carry the risk of a missed entry.',
      },
    ],
  },
];

/**
 * Exclusions get their own headed section, not a footnote.
 *
 * This is counter-intuitive and it is the single highest-leverage section in
 * the document. Boards are told to reject vague scope, so the bid that is
 * explicit about what it does NOT cover reads as the honest one — and it is the
 * page that survives being compared line by line against a cheaper competitor
 * who left it out.
 */
export const COMMERCIAL_EXCLUSIONS: string[] = [
  'Repairs and replacement parts above the pre-authorised threshold, which are quoted for approval before any work begins.',
  'Equipment replacement — pumps, motors, heaters, filters, controllers and salt cells.',
  'Draining, acid washing, resurfacing, tile and coping work.',
  'Green-to-clean recovery, storm debris and vandalism clean-up.',
  'Deck furniture, umbrellas, restrooms, showers and landscaping.',
  'Lifeguards, attendants and event staffing.',
  'Permit applications, plan approvals and impact fees.',
  'Repairs to bring a pre-existing condition into compliance, identified at survey and quoted separately.',
];

/**
 * What the board receives. Boards are explicitly advised to ask for a sample
 * report before signing, so the proposal should offer one rather than wait to
 * be asked — and this is the section where the technology genuinely separates
 * us from a clipboard.
 */
export const COMMERCIAL_REPORTING: string[] = [
  'A report after every visit: date, time, GPS-verified location, the readings taken, what was done and anything found.',
  'Photographs of the equipment pad, and of signage and safety equipment monthly.',
  'Readings trended over time rather than filed and forgotten, so stabiliser creep, calcium drift or a developing leak is flagged from the record rather than noticed late.',
  'A written note whenever a log entry is missing or a reading falls outside range.',
  'A pre-inspection walk before your annual health department visit, with anything likely to be flagged listed in advance.',
  'A sample report is available on request before you sign — please ask.',
];

/**
 * The continuity claim.
 *
 * Deliberately promises a CAPPED ROUTE and familiar faces rather than one named
 * individual: service alternates between technicians, and a board will hold you
 * to the literal sentence. The cap is the credible answer to why competitors'
 * pads degrade, and unlike a promise about which person turns up, it survives
 * an alternating schedule. No headcount appears — that is not the customer's
 * business, and a number invites an argument about staffing rather than about
 * outcomes.
 */
export const COMMERCIAL_CONTINUITY =
  'Your property is assigned to a named team on a capped route — familiar, background-checked technicians who know your equipment pad, not whoever is free that day. Because every visit follows the same documented checklist, a technician covering the route is never starting from zero.';
