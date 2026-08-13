/**
 * Small shared chrome for the admin document builders: the dark form section
 * card, and the light preview blocks/rows that mirror the PDF.
 *
 * PreviewRow renders NOTHING when its value is blank — the PDF does the same, so
 * an unfilled field never leaves a stray label behind on either side.
 */
import React from 'react';

export const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="glass-panel rounded-2xl p-5 sm:p-6">
    <h2 className="mb-5 font-display text-base font-bold text-white">{title}</h2>
    <div className="space-y-5">{children}</div>
  </section>
);

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
