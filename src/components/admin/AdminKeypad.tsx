import React, { useCallback, useEffect, useState } from 'react';
import { Delete, LoaderCircle } from 'lucide-react';
import { login } from '@/lib/adminApi';
import { useTurnstile } from '@/lib/turnstile';
import { cardClass } from './adminKit';

/**
 * Phone-style 6-digit PIN lock screen for /admin. The PIN is verified
 * server-side (/api/admin/login) — nothing here is a secret. On success the
 * server sets an HttpOnly session cookie and we call onUnlock().
 *
 * The invisible Turnstile widget starts loading on the first digit, and its
 * token goes with the PIN (enforced in functions/api/admin/login.ts whenever
 * TURNSTILE_SECRET_KEY is set).
 */
const PIN_LENGTH = 6;

type Status = 'idle' | 'checking' | 'error';

/** What went wrong, in words — a failed bot check is not a wrong PIN. */
const errorText = (error: string | undefined): string =>
  error === 'captcha_missing' || error === 'captcha_failed'
    ? "Security check didn't load — refresh and try again"
    : error === 'too_many_attempts'
      ? 'Too many tries — wait 15 minutes'
      : error === 'network'
        ? 'No connection — try again'
        : 'Incorrect code — try again';

export const AdminKeypad = ({ onUnlock }: { onUnlock: () => void }) => {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | undefined>();
  const turnstile = useTurnstile();

  const press = useCallback((digit: string) => {
    turnstile.warm();
    setStatus((s) => (s === 'error' ? 'idle' : s));
    setPin((prev) => (prev.length >= PIN_LENGTH ? prev : prev + digit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    turnstile
      .execute()
      .catch(() => '')
      .then((token) => login(pin, token))
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          onUnlock();
        } else {
          setError(res.error);
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
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div className={`${cardClass} w-full max-w-sm p-8 text-center`}>
        <img src="/icon-mark.svg" alt="" aria-hidden="true" width={37} height={24} className="mx-auto mb-5 h-9 w-auto" />
        <h1 className="text-[24px] font-[650] tracking-[-0.03em] text-sc-navy">Suncoast Admin</h1>
        <p className="mt-1 text-[15px] text-sc-navy/65">Enter your 6-digit code</p>

        {/* PIN dots */}
        <div className="mt-8 flex justify-center gap-3" aria-hidden="true">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <span
                key={i}
                className={[
                  'h-3.5 w-3.5 rounded-full border transition-all',
                  filled ? 'border-sc-navy bg-sc-navy' : 'border-sc-navy/30',
                  status === 'error' ? 'border-red-500' : '',
                ].join(' ')}
              />
            );
          })}
        </div>

        <div className="mt-4 h-5 text-sm">
          {status === 'error' && <span className="font-medium text-red-700">{errorText(error)}</span>}
          {checking && (
            <span className="inline-flex items-center gap-2 text-sc-navy/60">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Checking…
            </span>
          )}
        </div>

        {/* The invisible Turnstile widget mounts here. */}
        <div ref={turnstile.containerRef} />

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
    className="flex h-16 items-center justify-center rounded-[12px] bg-white text-2xl font-semibold text-sc-navy ring-1 ring-inset ring-sc-navy/[0.14] transition-colors hover:bg-sc-mist active:bg-[#eef5fb] disabled:opacity-40"
  >
    {children}
  </button>
);
