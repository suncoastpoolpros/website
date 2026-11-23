/**
 * The site-wide quote sheet IS the homepage's 3-option popup (QuotePopup, via
 * LandingQuoteSheet): text photos, schedule a call, or answer a few questions.
 * Every page that opens a quote through useQuoteSheet() (Navbar, the sticky
 * phone bar, the older pages' buttons) gets that one popup, so there is a
 * single quote flow everywhere and no address-first entry point.
 *
 * Kept as its own module so the many existing imports keep working. Both names
 * are the same provider and hook, so a page-level provider (the homepage and
 * the city pages) and the app-root one share one context: the nearest wins.
 */
export {
  LandingQuoteSheetProvider as QuoteSheetProvider,
  useLandingQuoteSheet as useQuoteSheet,
} from '@/components/landing/LandingQuoteSheet';
