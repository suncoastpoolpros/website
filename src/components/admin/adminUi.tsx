/**
 * Small shared chrome for the admin document builders: the dark form section
 * card, and the light preview blocks/rows that mirror the PDF.
 *
 * PreviewRow renders NOTHING when its value is blank — the PDF does the same, so
 * an unfilled field never leaves a stray label behind on either side.
 */
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="glass-panel rounded-2xl p-5 sm:p-6">
    <h2 className="mb-5 font-display text-base font-bold text-white">{title}</h2>
    <div className="space-y-5">{children}</div>
  </section>
);

/**
 * A Section that starts SHUT for input that is usually skipped.
 *
 * Pool size is optional and most quotes are written off site, where nobody has
 * the dimensions — so the section spent its height asking a question the
 * operator could not answer. Collapsed, it is one row that says it is optional;
 * a draft that already has data in it mounts open (pass defaultOpen), so
 * collapsing never hides something typed.
 *
 * State is deliberately component-local rather than in the draft: whether a
 * panel is open is about THIS sitting, not about the proposal.
 */
export const CollapsibleSection = ({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  /** Muted note beside the chevron while shut, e.g. "Optional". */
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <h2 className="font-display text-base font-bold text-white">{title}</h2>
        <span className="flex shrink-0 items-center gap-2">
          {!open && hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>
      {open ? <div className="mt-5 space-y-5">{children}</div> : null}
    </section>
  );
};

export const PreviewBlock = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brand-blue-dark">{label}</div>
    <div className="space-y-1">{children}</div>
  </div>
);

export const PreviewRow = ({ label, value }: { label: string; value?: string }) => {
  const v = (value ?? '').trim();
  if (!v) return null;
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 text-stone-500">{label}</span>
      <span className="flex-1 text-stone-800">{v}</span>
    </div>
  );
};
