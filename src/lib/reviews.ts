import { GOOGLE_PROFILE_URL } from '@/lib/contact';

// Real Google reviews, quoted as written (including the owner's name spelled
// two ways). No review count anywhere: only what can be shown in full.
export const GOOGLE_REVIEWS_URL = GOOGLE_PROFILE_URL;

export const REVIEWS = [
  {
    name: 'Michelle M.',
    quote:
      'My pool has never looked better. After struggling with my former pool company for years, it’s such a relief to finally have a company I can count on and not have to worry about my pool service. Jonathan and Warren have both been wonderful to work with. They’re responsive, reliable, and do exactly what they say they’re going to do.',
  },
  {
    name: 'Jack K.',
    quote:
      'Johnathan with Suncoast Pools provides a value service. Reasonable price, and very reliable service. They replaced my filter system and pump after the hurricane, then converted my pool to a salt system. Outstanding service.',
  },
  {
    name: 'Praxitelis',
    quote: 'Excellent service. Of the 5 years I’ve had pool service, this is by far the best!',
  },
];

export type Review = (typeof REVIEWS)[number];
