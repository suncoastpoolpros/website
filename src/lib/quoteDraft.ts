/**
 * Quote-form draft persistence.
 *
 * Saves in-progress form state to localStorage so a buyer who closes the
 * popup, refreshes the tab, or comes back tomorrow can pick up exactly
 * where they left off. Pure browser storage — no server involvement, no
 * outreach, no consent issues.
 *
 * Lifecycle:
 *   - read on QuoteChooser mount → hydrate state
 *   - write on every field change (debounced by React's render cycle)
 *   - clear on successful submit
 *   - auto-expire entries older than DRAFT_TTL_MS so stale half-forms
 *     don't haunt a shared computer indefinitely
 */

const STORAGE_KEY = 'spp.quoteDraft.v1';
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type QuoteDraft = {
  /** Which step the user was on. */
  step: 1 | 2;
  /** Service slug they picked. */
  service: string;
  /** Step 1 values. Keys: name, email, phone, address, service. */
  step1: Record<string, string>;
  /** Step 2 values. Keys are the field `name` attributes (poolSize, etc.). */
  step2: Record<string, string>;
  /** Epoch ms when the draft was last saved. Used for TTL expiry. */
  updatedAt: number;
};

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Read the saved draft, if any. Returns null if missing, malformed, or expired.
 * Expired drafts are deleted on read so they don't accumulate.
 */
export const readDraft = (): QuoteDraft | null => {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuoteDraft>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return null;
    }
    if (Date.now() - parsed.updatedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Coerce to our shape with safe defaults so a partial save (e.g. an
    // older app version with fewer fields) never crashes hydration.
    return {
      step: parsed.step === 2 ? 2 : 1,
      service: typeof parsed.service === 'string' ? parsed.service : '',
      step1: (parsed.step1 ?? {}) as Record<string, string>,
      step2: (parsed.step2 ?? {}) as Record<string, string>,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
};

/**
 * Write a draft. Silently no-ops if storage is unavailable (private mode in
 * some browsers, storage quota exceeded, etc.) — persistence is a nice-to-
 * have, never a requirement.
 */
export const writeDraft = (draft: Omit<QuoteDraft, 'updatedAt'>): void => {
  if (!isBrowser()) return;
  // Don't save a totally-empty draft (no service, no step 1 fields). Avoids
  // creating an entry just because the user opened the popup.
  const hasAnyStep1 = Object.values(draft.step1).some((v) => v && v.trim());
  const hasAnyStep2 = Object.values(draft.step2).some((v) => v && v.trim());
  if (!draft.service && !hasAnyStep1 && !hasAnyStep2) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...draft, updatedAt: Date.now() } satisfies QuoteDraft)
    );
  } catch {
    /* storage full / disabled — fail silently */
  }
};

export const clearDraft = (): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};
