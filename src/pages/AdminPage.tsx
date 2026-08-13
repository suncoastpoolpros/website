import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { usePageMeta } from '@/lib/usePageMeta';
import { checkSession } from '@/lib/adminApi';
import { AdminKeypad } from '@/components/admin/AdminKeypad';
import { AdminHome } from '@/components/admin/AdminHome';
import { ProposalBuilder } from '@/components/admin/ProposalBuilder';
import { InspectionBuilder } from '@/components/admin/InspectionBuilder';
import { LAST_DOC_KEY, type DocKind } from '@/components/admin/docKinds';

type AuthState = 'loading' | 'locked' | 'unlocked';

const readLastDoc = (): DocKind | null => {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(LAST_DOC_KEY);
    return v === 'proposal' || v === 'inspection' ? v : null;
  } catch {
    return null;
  }
};

/**
 * /admin — private document builder. Client-only route (NOT prerendered; not in
 * PRERENDER_ROUTES). On load it asks the server whether the session cookie is
 * valid and shows either the PIN keypad or the builders. The keypad/builder JS
 * holds no secrets — the PIN is checked server-side — so it's safe that the
 * bundle is reachable.
 *
 * Once unlocked the admin picks a document (proposal or first-service report);
 * each builder owns its own autosaved draft.
 */
export const AdminPage = () => {
  usePageMeta({ title: 'Admin · Suncoast Pool Pros', description: '', noindex: true });
  const [auth, setAuth] = useState<AuthState>('loading');
  const [doc, setDoc] = useState<DocKind | null>(readLastDoc);

  useEffect(() => {
    let active = true;
    checkSession().then((ok) => {
      if (active) setAuth(ok ? 'unlocked' : 'locked');
    });
    return () => {
      active = false;
    };
  }, []);

  const pickDoc = (kind: DocKind | null) => {
    setDoc(kind);
    try {
      if (kind) window.localStorage.setItem(LAST_DOC_KEY, kind);
      else window.localStorage.removeItem(LAST_DOC_KEY);
    } catch {
      /* storage disabled — non-fatal, the picker just won't be remembered */
    }
  };

  const lock = () => setAuth('locked');
  const backToHome = () => pickDoc(null);

  return (
    <main className="min-h-dvh bg-navy text-white">
      {auth === 'loading' && (
        <div className="flex min-h-dvh items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-brand-blue-light" />
        </div>
      )}
      {auth === 'locked' && <AdminKeypad onUnlock={() => setAuth('unlocked')} />}
      {auth === 'unlocked' && doc === null && <AdminHome onPick={pickDoc} onLogout={lock} />}
      {auth === 'unlocked' && doc === 'proposal' && (
        <ProposalBuilder onLogout={lock} onBack={backToHome} />
      )}
      {auth === 'unlocked' && doc === 'inspection' && (
        <InspectionBuilder onLogout={lock} onBack={backToHome} />
      )}
    </main>
  );
};
