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

const post = async (apiKey: string, path: string, body: unknown): Promise<{ data?: { id?: string } }> => {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { authorization: apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`quo_${path}_${res.status}: ${(await res.text()).slice(0, 250)}`);
  return (await res.json().catch(() => ({}))) as { data?: { id?: string } };
};

/**
 * The customer's access notes (gate code, pets) as a note on the Quo contact,
 * so whoever answers their text sees them. A versioned endpoint without /v1 —
 * Quo's contact notes live on the newer dated API.
 */
const addNote = async (apiKey: string, contactId: string, text: string): Promise<void> => {
  const res = await fetch(`https://api.quo.com/contacts/${encodeURIComponent(contactId)}/notes`, {
    method: 'POST',
    headers: { authorization: apiKey, 'content-type': 'application/json', 'quo-api-version': '2026-03-30' },
    body: JSON.stringify({ text: text.slice(0, 2000) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`quo_note_${res.status}: ${(await res.text()).slice(0, 250)}`);
};

/** One text from the business line. Throws on failure — callers decide how loud. */
export const sendText = async (apiKey: string, to: string, content: string): Promise<void> => {
  await post(apiKey, '/messages', { from: FROM, to: [to], content });
};

/** Logged, and turned into the line the owner reads in the ACCEPTED email. */
const failed = (what: string, err: unknown): string => {
  const msg = String(err).slice(0, 300);
  console.log(`[quo] ${what}_failed:`, msg);
  // Quo's 402/403 on a text are the two the office can act on.
  const why = /_402:/.test(msg)
    ? 'out of API credits or subscription lapsed'
    : /_403:/.test(msg)
      ? 'daily texting cap reached'
      : /_400:/.test(msg) && /a2p/i.test(msg)
        ? 'texting registration (A2P) not approved'
        : /timeout|abort/i.test(msg)
          ? "Quo didn't answer"
          : (/_(\d{3}):/.exec(msg)?.[1] ?? 'error');
  return `${what} FAILED (${why}) — do it by hand in Quo`;
};

/**
 * Creates the contact, then its access note. Returns one line per step for the
 * owner's email; never throws.
 */
const contactWithNote = async (
  apiKey: string,
  label: string,
  body: unknown,
  note: string,
): Promise<string[]> => {
  let id: string | undefined;
  try {
    id = (await post(apiKey, '/contacts', body)).data?.id;
  } catch (err) {
    return [failed(`${label} contact`, err), ...(note ? [`${label} access note not added (no contact)`] : [])];
  }
  if (!note) return [`${label} contact added`];
  try {
    if (!id) throw new Error('no contact id in the create response');
    await addNote(apiKey, id, note);
    return [`${label} contact added, with the access note`];
  } catch (err) {
    return [`${label} contact added`, failed(`${label} access note`, err)];
  }
};

/**
 * Everything Quo does for a signed quote. Never throws: the acceptance is
 * already recorded. Returns the lines for the owner's ACCEPTED email, so a
 * text that didn't go out is seen the same day rather than never.
 */
export const onboardInQuo = async (
  apiKey: string,
  c: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    /** Gate code, pets — added as a note on each contact created. */
    accessNotes?: string;
    /** Saved as a contact only — never texted, they agreed to nothing. */
    second?: { name: string; phone: string; relationship: string };
    proposalNumber?: number | null;
  },
): Promise<string[]> => {
  const [firstName = 'Customer', ...rest] = c.name.trim().split(/\s+/);
  const phone = toE164(c.phone);
  const note = (c.accessNotes ?? '').trim();

  const contact = contactWithNote(
    apiKey,
    'Customer',
    {
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
    },
    note,
  );

  // No usable mobile number means no text — the contact is still worth having.
  const text: Promise<string[]> = phone
    ? post(apiKey, '/messages', { from: FROM, to: [phone], content: welcomeText(firstName) }).then(
        () => ['Welcome text sent'],
        (err) => [failed('Welcome text', err)],
      )
    : Promise.resolve([`Welcome text NOT sent — no usable mobile number on the quote`]);

  // Filed the same way, with who they are in Quo's Role field. A second contact
  // without a usable number is no use in a phone system, so it's skipped.
  const secondPhone = toE164(c.second?.phone);
  const [secondFirst, ...secondRest] = (c.second?.name || 'Contact').trim().split(/\s+/);
  const second: Promise<string[]> =
    c.second && secondPhone
      ? contactWithNote(
          apiKey,
          'Second',
          {
            defaultFields: {
              firstName: `Customer ${secondFirst}`,
              lastName: secondRest.join(' ') || null,
              company: c.address?.trim() || null,
              role: c.second.relationship || null,
              phoneNumbers: [{ name: 'Mobile', value: secondPhone }],
            },
            source: 'suncoastpoolpros.com',
            ...(c.proposalNumber ? { externalId: `proposal-${c.proposalNumber}-2` } : {}),
          },
          note,
        )
      : Promise.resolve(c.second ? ['Second contact NOT added — no usable phone number'] : []);

  return (await Promise.all([contact, text, second])).flat().map((l) => `Quo: ${l}`);
};
