import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { usePageMeta } from '@/lib/usePageMeta';
import { checkSession } from '@/lib/adminApi';
import { AdminKeypad } from '@/components/admin/AdminKeypad';
import { ProposalBuilder } from '@/components/admin/ProposalBuilder';

type AuthState = 'loading' | 'locked' | 'unlocked';

/**
 * /admin — private proposal builder. Client-only route (NOT prerendered; not in
 * PRERENDER_ROUTES). On load it asks the server whether the session cookie is
 * valid and shows either the PIN keypad or the builder. The keypad/builder JS
 * holds no secrets — the PIN is checked server-side — so it's safe that the
 * bundle is reachable.
 */
export const AdminPage = () => {
  usePageMeta({ title: 'Admin · Suncoast Pool Pros', description: '', noindex: true });
  const [auth, setAuth] = useState<AuthState>('loading');

  useEffect(() => {
    let active = true;
    checkSession().then((ok) => {
      if (active) setAuth(ok ? 'unlocked' : 'locked');
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-dvh bg-navy text-white">
      {auth === 'loading' && (
        <div className="flex min-h-dvh items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-brand-blue-light" />
        </div>
      )}
      {auth === 'locked' && <AdminKeypad onUnlock={() => setAuth('unlocked')} />}
      {auth === 'unlocked' && <ProposalBuilder onLogout={() => setAuth('locked')} />}
    </main>
  );
};
