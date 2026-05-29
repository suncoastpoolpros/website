import React from 'react';

/**
 * Shared form field styling used by the signup page and the homepage quote form.
 * Light "almost white" fields with a floating label that starts centered inside
 * an empty field and animates up on focus / when filled.
 */

// Shared visual base for every control: light field, rounded, blue focus.
// `h-14` (56px) locks inputs, selects, and the date field to one height so a row
// of mixed controls lines up exactly. `pt-6 pb-2` leaves room for the floated
// label and keeps the value text in the lower portion of the field.
const fieldBase =
  'peer w-full h-14 rounded-xl border border-stone-300 bg-stone-100 px-5 pt-6 pb-2 text-stone-900 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50 hover:border-stone-400 transition-all';

// Text inputs.
export const fieldClass = `${fieldBase} placeholder-transparent`;

// Native <select> — same height/padding as inputs so it aligns, with a pointer
// cursor. Keeps the browser's native dropdown chevron.
export const selectClass = `${fieldBase} cursor-pointer`;

// Textarea — no fixed height (it grows with rows); anchors content near the top.
export const textareaClass =
  'peer w-full rounded-xl border border-stone-300 bg-stone-100 px-5 pt-6 pb-2 text-stone-900 placeholder-transparent focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50 hover:border-stone-400 transition-all resize-y';

// Floating label base.
const floatLabelBase =
  'pointer-events-none absolute left-5 text-stone-500 transition-all duration-150';
// Forced small/top position — used for selects & date inputs that never report
// `placeholder-shown`.
const floatLabelFloating = 'top-2 text-xs font-medium';
const floatLabelFloatOnFill =
  'peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-medium peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium';
// Single-line resting state: vertically centered when empty.
const floatLabelResting = `top-1/2 -translate-y-1/2 text-base ${floatLabelFloatOnFill}`;
// Multiline (textarea) resting state: anchored near the top, not centered.
const floatLabelRestingMultiline = `top-4 text-base ${floatLabelFloatOnFill}`;

interface FieldShellProps {
  id: string;
  label: React.ReactNode;
  /** When true, the label stays in the small top position (selects, date). */
  floated?: boolean;
  /** Anchor the resting label to the top instead of centering (textarea). */
  multiline?: boolean;
  className?: string;
  children: React.ReactNode;
}

// Wraps a control + its floating label. The control is passed as children so
// inputs, selects, and textareas can all reuse the same shell.
export const FieldShell = ({ id, label, floated, multiline, className, children }: FieldShellProps) => {
  const labelState = floated
    ? floatLabelFloating
    : multiline
      ? floatLabelRestingMultiline
      : floatLabelResting;
  return (
    <div className={`relative ${className ?? ''}`}>
      {children}
      <label htmlFor={id} className={`${floatLabelBase} ${labelState}`}>
        {label}
      </label>
    </div>
  );
};
