/**
 * Quo (formerly OpenPhone) — the business phone system.
 *
 * Called once a quote is signed: the new customer is added to the shared Quo
 * contacts and sent a welcome text from the business line. Both are courtesy,
 * not record: the acceptance is already written before this runs, so every
 * failure here is logged and swallowed rather than surfaced to the customer.
 *
 * Texts sent through the API draw on Quo's prepaid API credits ($0.01 per
 * segment). Keep WELCOME_TEXT plain ASCII — one emoji or curly quote switches
 * the whole message to 70-character segments and roughly doubles the cost.
 */

const API = 'https://api.quo.com/v1';
/** The business line, as listed in Quo. Texts go out from here. */
const FROM = '+17272953621';

/**
 * Two segments, never three: a multi-part SMS carries 153 GSM characters per
 * segment, so 306 is the ceiling. The fixed text is 270, leaving 36 for the
 * first name; a longer one drops to "Hi there" rather than tip into a third.
 */
const TWO_SEGMENTS = 306;
const welcomeText = (first: string): string => {
  const body = (name: string): string =>
    `Hi ${name}, welcome to the Suncoast family! You're all set. Save this number, it's our ` +
    `direct line, so text us anytime with questions or a photo of your pool. We'll reach out ` +
    `soon to confirm your first service day. Thank you for trusting us with your pool! - Suncoast Pool Pros`;
  const text = body(first);
  return text.length <= TWO_SEGMENTS && /^[\x20-\x7e]*$/.test(text) ? text : body('there');
};

/** US numbers only — anything else is left alone rather than guessed at. */
export const toE164 = (raw: string | null | undefined): string | null => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
};

const post = async (apiKey: string, path: string, body: unknown): Promise<void> => {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { authorization: apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`quo_${path}_${res.status}: ${(await res.text()).slice(0, 250)}`);
};

export const onboardInQuo = async (
  apiKey: string,
  c: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    /** Saved as a contact only — never texted, they agreed to nothing. */
    second?: { name: string; phone: string; relationship: string };
    proposalNumber?: number | null;
  },
): Promise<void> => {
  const [firstName = 'Customer', ...rest] = c.name.trim().split(/\s+/);
  const phone = toE164(c.phone);

  const contact = post(apiKey, '/contacts', {
    // Matches how the office files customers by hand: "Customer Mike Philips",
    // with the service address in the Company field.
    defaultFields: {
      firstName: `Customer ${firstName}`,
      lastName: rest.join(' ') || null,
      company: c.address?.trim() || null,
      emails: c.email ? [{ name: 'Email', value: c.email }] : [],
      phoneNumbers: phone ? [{ name: 'Mobile', value: phone }] : [],
    },
    source: 'suncoastpoolpros.com',
    // The proposal number, never the quote id — that id IS the customer's private link.
    ...(c.proposalNumber ? { externalId: `proposal-${c.proposalNumber}` } : {}),
  }).catch((err) => console.log('[quo] contact_failed:', String(err).slice(0, 300)));

  // No usable mobile number means no text — the contact is still worth having.
  const text = phone
    ? post(apiKey, '/messages', { from: FROM, to: [phone], content: welcomeText(firstName) }).catch((err) =>
        console.log('[quo] welcome_text_failed:', String(err).slice(0, 300)),
      )
    : Promise.resolve();

  // Filed the same way, with who they are in Quo's Role field. A second contact
  // without a usable number is no use in a phone system, so it's skipped.
  const secondPhone = toE164(c.second?.phone);
  const [secondFirst, ...secondRest] = (c.second?.name || 'Contact').trim().split(/\s+/);
  const secondContact =
    c.second && secondPhone
      ? post(apiKey, '/contacts', {
          defaultFields: {
            firstName: `Customer ${secondFirst}`,
            lastName: secondRest.join(' ') || null,
            company: c.address?.trim() || null,
            role: c.second.relationship || null,
            phoneNumbers: [{ name: 'Mobile', value: secondPhone }],
          },
          source: 'suncoastpoolpros.com',
          ...(c.proposalNumber ? { externalId: `proposal-${c.proposalNumber}-2` } : {}),
        }).catch((err) => console.log('[quo] second_contact_failed:', String(err).slice(0, 300)))
      : Promise.resolve();

  await Promise.all([contact, text, secondContact]);
};
