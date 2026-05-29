/**
 * Single source of truth for Suncoast Pool Pros contact info (NAP) and the
 * derived links used across the site. Change a value here and it updates
 * everywhere — navbar, footer, hero, CTAs, quote popups, forms, legal pages.
 *
 * NAP consistency matters for local SEO, so nothing below should be duplicated
 * as a string literal anywhere else in the app.
 */

// Raw values
export const PHONE_E164 = '+17272953621'; // for tel:/sms: links
export const PHONE_DISPLAY = '(727) 295-3621'; // for on-screen text
export const EMAIL = 'Suncoastpoolpros@gmail.com';

export const BUSINESS_NAME = 'Suncoast Pool Pros';
export const ADDRESS_LINE = '1701 Central Ave, Unit 279';
export const ADDRESS_CITY_STATE_ZIP = 'St. Petersburg, FL 33713';
export const HOURS_DISPLAY = 'Mon–Sat: 8:00 AM – 6:00 PM';
export const HOURS_SHORT = 'Mon–Sat, 8 AM–6 PM';

// Prefilled SMS body for the "text us photos for a quote" flow.
export const SMS_QUOTE_BODY =
  'Hi! Here are photos of my pool and equipment, plus my address — can I get a flat-rate quote?';

// Derived links — always build hrefs from the constants above, never hardcode.
export const PHONE_HREF = `tel:${PHONE_E164}`;
export const SMS_HREF = `sms:${PHONE_E164}`;
export const SMS_QUOTE_HREF = `sms:${PHONE_E164}?&body=${encodeURIComponent(SMS_QUOTE_BODY)}`;
export const EMAIL_HREF = `mailto:${EMAIL}`;
