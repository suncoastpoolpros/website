/**
 * Autosaves the in-progress proposal to localStorage so the admin can leave the
 * page (e.g. pop over to the pool-volume calculator) and come back with every
 * field still filled in. Nothing is lost until clearDraft() is called.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { type ProposalData, emptyProposal } from './adminApi';

const KEY = 'scpp_proposal_draft';
const SAVE_DEBOUNCE_MS = 400;

// Merge a stored draft over the empty shape so a draft saved before a field was
// added doesn't leave that field undefined.
const loadDraft = (): ProposalData => {
  const base = emptyProposal();
  if (typeof window === 'undefined') return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<ProposalData>;
    return {
      customer: { ...base.customer, ...saved.customer },
      pool: { ...base.pool, ...saved.pool },
      proposal: { ...base.proposal, ...saved.proposal },
    };
  } catch {
    return base;
  }
};

type Section = keyof ProposalData;

export function useProposalDraft() {
  const [data, setData] = useState<ProposalData>(loadDraft);
  // Skip the very first save (it would just rewrite what we loaded).
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(data));
      } catch {
        /* storage full / disabled — non-fatal */
      }
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [data]);

  // Typed single-field setter: update('customer', 'email', value).
  const update = useCallback(
    <S extends Section, F extends keyof ProposalData[S]>(
      section: S,
      field: F,
      value: ProposalData[S][F],
    ) => {
      setData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    },
    [],
  );

  const clearDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setData(emptyProposal());
  }, []);

  return { data, setData, update, clearDraft };
}
