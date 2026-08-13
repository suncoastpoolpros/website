/**
 * Autosaves an in-progress admin document to localStorage so the admin can leave
 * the page (e.g. pop over to the pool-volume calculator) and come back with every
 * field still filled in. Nothing is lost until clearDraft() is called.
 *
 * The proposal and the first-service report keep SEPARATE drafts (separate keys),
 * so working on a quote for one customer never disturbs a report for another.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type InspectionData,
  type ProposalData,
  emptyInspection,
  emptyProposal,
} from './adminApi';

const SAVE_DEBOUNCE_MS = 400;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// Merge a stored draft over the empty shape, one top-level section at a time, so
// a draft saved before a field was added doesn't leave that field undefined.
const mergeDraft = <T extends object>(base: T, saved: Partial<T>): T => {
  const out = { ...base };
  for (const key of Object.keys(base) as (keyof T)[]) {
    const b = base[key];
    const s = saved?.[key];
    if (s === undefined) continue;
    out[key] = isPlainObject(b) && isPlainObject(s) ? ({ ...b, ...s } as T[keyof T]) : (s as T[keyof T]);
  }
  return out;
};

function useAdminDraft<T extends object>(storageKey: string, empty: () => T) {
  const [data, setData] = useState<T>(() => {
    const base = empty();
    if (typeof window === 'undefined') return base;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return base;
      return mergeDraft(base, JSON.parse(raw) as Partial<T>);
    } catch {
      return base;
    }
  });
  // Skip the very first save (it would just rewrite what we loaded).
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        /* storage full / disabled — non-fatal */
      }
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [data, storageKey]);

  // Typed single-field setter: update('customer', 'email', value).
  const update = useCallback(
    <S extends keyof T, F extends keyof T[S]>(section: S, field: F, value: T[S][F]) => {
      setData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }) as T);
    },
    [],
  );

  const clearDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setData(empty());
    // `empty` is a stable module-level factory in both call sites.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  return { data, setData, update, clearDraft };
}

export const useProposalDraft = () =>
  useAdminDraft<ProposalData>('scpp_proposal_draft', emptyProposal);

export const useInspectionDraft = () =>
  useAdminDraft<InspectionData>('scpp_inspection_draft', emptyInspection);
