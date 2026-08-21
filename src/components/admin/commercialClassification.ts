/**
 * What a commercial property IS under Florida law, and what that obliges.
 *
 * WHY THIS IS ON THE PROPOSAL AT ALL, rather than being something you just know
 * in the truck: "commercial" is not one category in Florida, and the obligation
 * changes completely with the unit count and the rental rules in the recorded
 * documents. A board is usually hazy on which one they are, and no competing
 * bid tells them. Stating it turns the first page from a sales document into
 * evidence that you understand their property better than they do.
 *
 * It also does quiet defensive work. The classification decides how much of the
 * compliance burden is genuinely yours, so printing it is how the scope section
 * later stops being read as a promise to handle "all of it".
 *
 * NOT LEGAL ADVICE, and the document says so. These are summarised from Fla.
 * Stat. Ch. 514 and Fla. Admin. Code 64E-9 for the purpose of writing a bid;
 * anything about to be signed should be confirmed against Pinellas County DOH.
 */

export type ClassificationKey =
  | 'condo-small'
  | 'condo-large'
  | 'public-lodging'
  | 'short-term';

export type Classification = {
  key: ClassificationKey;
  /** What the operator picks in the builder. */
  label: string;
  /** The qualifying test, shown under the label so the pick is checkable. */
  test: string;
  /** One line: what this property is under the statute. */
  status: string;
  /** What that actually requires, in the order it matters to a board. */
  obligations: string[];
};

export const CLASSIFICATIONS: Classification[] = [
  {
    key: 'condo-small',
    label: 'Condominium or co-op, 32 units or fewer',
    test: 'Not operated as a public lodging establishment',
    status:
      'Exempt from supervision under Ch. 514 except as to water quality.',
    obligations: [
      'Water quality remains regulated even though the pool is otherwise exempt — the exemption is narrower than it sounds.',
      'No routine Department of Health inspection regime applies.',
      'The association still carries the duty of care to its residents, which is where a documented service record earns its keep.',
    ],
  },
  {
    key: 'condo-large',
    label: 'Condominium or co-op, more than 32 units',
    test: 'Recorded documents prohibit rental or sublease for periods under 60 days',
    status:
      'Exempt from supervision except for permitting, with annual inspection.',
    obligations: [
      'The association must hold a current operating permit, with construction plans previously approved.',
      'The Department of Health inspects annually — or sooner at the request of any single unit owner, which is worth knowing before a dispute starts.',
      'Inspection covers water quality and lifesaving equipment.',
    ],
  },
  {
    key: 'public-lodging',
    label: 'Apartments, hotel, motel, mobile home or RV park, townhouses',
    test: 'Five or more living units sharing the pool',
    status: 'A public pool. Fully regulated under Ch. 514 and 64E-9.',
    obligations: [
      'Routine Department of Health inspection.',
      'pH and disinfectant tested and logged at least once every 24 hours the pool is open.',
      'A monthly pool report kept at the pool and produced on request.',
      'Proof of service technician certification posted in the equipment room of each pool serviced.',
    ],
  },
  {
    key: 'short-term',
    label: 'Condominium permitting short-term rentals',
    test: 'Units rent for periods under 60 days, whatever the unit count',
    status:
      'A public pool — the under-60-day carve-out does not apply.',
    obligations: [
      'Regulated exactly as a public pool: routine inspection, daily testing and logging, posted certification.',
      'This catches associations out. A board that has quietly begun allowing short lets has changed its own obligations, usually without being told.',
      'Worth confirming against the recorded documents rather than against what the board believes to be true.',
    ],
  },
];

export const classificationFor = (key: string): Classification | undefined =>
  CLASSIFICATIONS.find((c) => c.key === key);

/**
 * Whether this classification carries the every-24-hours testing duty.
 *
 * This is the single most consequential thing on the page, because it decides
 * whether the proposal has to spell out who covers the days we are not there.
 * See commercialScope.ts — a bid that leaves it unsaid is promising something
 * a three-visit week cannot deliver.
 */
export const requiresDailyLog = (key: string): boolean =>
  key === 'public-lodging' || key === 'short-term';

/** Printed under the classification block. The document should say this itself
 *  rather than leaving the reader to assume a licence we do not hold. */
export const CLASSIFICATION_DISCLAIMER =
  'Classification is stated to scope this proposal accurately and is not legal advice. We are glad to confirm it with the Florida Department of Health before any agreement is signed.';
