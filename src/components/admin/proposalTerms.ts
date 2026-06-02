/**
 * Condensed standard terms appended to the proposal PDF (small print), so an
 * accepted proposal is contractually meaningful. Sourced from Suncoast's full
 * Service Agreement (src/pages/ServiceAgreementPage.tsx) — keep these in sync
 * with that page. The full agreement always governs; this is a summary.
 */
export type TermItem = { heading: string; text: string };

export const PROPOSAL_TERMS: TermItem[] = [
  {
    heading: 'Acceptance',
    text: 'Replying "APPROVED" to the proposal email — or otherwise providing written or electronic acceptance — authorizes Suncoast Pool Pros LLC to provide the services described at the service address, and constitutes acceptance of this proposal and these terms.',
  },
  {
    heading: 'All-Inclusive Chemicals (Recurring)',
    text: 'Recurring weekly service includes all standard and specialty maintenance chemicals and salt, plus routine salt-cell maintenance, provided Suncoast Pool Pros maintains exclusive control over water chemistry. Restoration fees may apply if chemicals are added by others or for excessive chemical loss (e.g., a running fill hose, draining/refilling, or leaks).',
  },
  {
    heading: 'One-Time & Specialty Service',
    text: 'For non-recurring jobs, full prepayment of estimated labor and the service call is required to secure a date; work begins once payment is confirmed. Chemicals and materials are billed separately at current rates. A one-time visit is not an ongoing maintenance agreement and carries no guarantee of future water clarity.',
  },
  {
    heading: 'Billing & Payment',
    text: 'Recurring service is billed monthly in advance unless otherwise agreed. Invoices not paid within 10 days of the due date may incur a $25 late fee, and accounts more than 15 days past due may be subject to service suspension. The customer is responsible for any declined or returned-payment fees.',
  },
  {
    heading: 'Cancellation',
    text: 'No long-term contract is required. A minimum 30-day written notice is required to cancel recurring service; service and billing continue during the notice period to maintain scheduling consistency.',
  },
  {
    heading: 'Pricing Adjustments',
    text: 'Pricing may be reviewed and adjusted to reflect operating costs, with at least 30 days written notice. Continued service after the notice period constitutes acceptance of the updated pricing.',
  },
  {
    heading: 'Customer Responsibilities',
    text: 'The customer agrees to provide safe, unobstructed access; maintain proper water level; keep equipment powered and a working hose available; secure pets during visits; avoid adding chemicals without notifying us; and inform us of landscaping, construction, or exterior work that may affect water quality.',
  },
  {
    heading: 'Equipment & Limitation of Liability',
    text: 'Routine maintenance supports water clarity but cannot guarantee results when equipment problems exist. Suncoast Pool Pros is not responsible for issues caused by aging equipment, pre-existing damage, improper installation, or declined repairs. Liability is limited to the most recent monthly service charge where permitted by law.',
  },
];

// Canonical link to the full agreement, surfaced on the PDF and in the email.
export const SERVICE_AGREEMENT_URL = 'https://suncoastpoolpros.com/service-agreement';
export const SERVICE_AGREEMENT_DISPLAY = 'suncoastpoolpros.com/service-agreement';

// Short note shown on the PDF directing the customer to the full agreement.
export const TERMS_FOOTNOTE =
  'This is a summary of standard terms. Our full Service Agreement governs all service — read it at';
