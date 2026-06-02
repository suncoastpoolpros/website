import React, { useCallback, useEffect, useState } from 'react';
import { Delete, Lock, LoaderCircle } from 'lucide-react';
import { login } from '@/lib/adminApi';

/**
 * Phone-style 6-digit PIN lock screen for /admin. The PIN is verified
 * server-side (/api/admin/login) — nothing here is a secret. On success the
 * server sets an HttpOnly session cookie and we call onUnlock().
 *
 * NOTE: Turnstile bot-check is temporarily bypassed (see REQUIRE_TURNSTILE in
 * functions/api/admin/login.ts). To restore it, mount the invisible widget via
 * useTurnstile() here and pass the token into login(pin, token).
 */
const PIN_LENGTH = 6;

type Status = 'idle' | 'checking' | 'error';

export const AdminKeypad = ({ onUnlock }: { onUnlock: () => void }) => {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const press = useCallback((digit: string) => {
    setStatus((s) => (s === 'error' ? 'idle' : s));
    setPin((prev) => (prev.length >= PIN_LENGTH ? prev : prev + digit));
  }, []);

  const backspace = useCallback(() => {
    setStatus((s) => (s === 'error' ? 'idle' : s));
    setPin((prev) => prev.slice(0, -1));
  }, []);

  // Submit automatically once all digits are in.
  useEffect(() => {
    if (pin.length !== PIN_LENGTH || status === 'checking') return;
    let cancelled = false;
    setStatus('checking');
    login(pin).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        onUnlock();
      } else {
        setStatus('error');
        setPin('');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  // Physical keyboard support (desktop): digits + backspace.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') backspace();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, backspace]);

  const checking = status === 'checking';

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xs text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Lock className="h-6 w-6 text-brand-blue-light" />
        </div>
        <h1 className="font-display text-xl font-bold text-white">Suncoast Admin</h1>
        <p className="mt-1 text-sm text-gray-400">Enter your 6-digit code</p>

        {/* PIN dots */}
        <div className="mt-8 flex justify-center gap-3" aria-hidden="true">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <span
                key={i}
                className={[
                  'h-3.5 w-3.5 rounded-full border transition-all',
                  filled ? 'bg-brand-blue-light border-brand-blue-light' : 'border-white/25',
                  status === 'error' ? 'border-red-400/70' : '',
                ].join(' ')}
              />
            );
          })}
        </div>

        <div className="mt-4 h-5 text-sm">
          {status === 'error' && <span className="text-red-300">Incorrect code — try again</span>}
          {checking && (
            <span className="inline-flex items-center gap-2 text-gray-400">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Checking…
            </span>
          )}
        </div>

        {/* Keypad */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <KeypadButton key={d} onClick={() => press(d)} disabled={checking}>
              {d}
            </KeypadButton>
          ))}
          <span />
          <KeypadButton onClick={() => press('0')} disabled={checking}>
            0
          </KeypadButton>
          <KeypadButton onClick={backspace} disabled={checking} ariaLabel="Delete">
            <Delete className="mx-auto h-6 w-6" />
          </KeypadButton>
        </div>
      </div>
    </div>
  );
};

type KeypadButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

const KeypadButton: React.FC<KeypadButtonProps> = ({ children, onClick, disabled, ariaLabel }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className="flex h-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-semibold text-white transition-colors hover:bg-white/10 active:bg-white/15 disabled:opacity-40"
  >
    {children}
  </button>
);
