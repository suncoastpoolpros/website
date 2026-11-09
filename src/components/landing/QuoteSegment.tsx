import { useRef, useState } from 'react';

/*
 * A short choice as buttons, for the city pages' quote forms (Seminole,
 * Treasure Island). The hidden input carries the value under `name` and stays
 * required: an empty submit stops on it like any other field, with our message
 * in place of the browser bubble. Same label style as those forms' fields.
 */

const labelClass = 'mb-1.5 mt-4 block text-[12px] font-semibold text-sc-muted';

export const QuoteSegment = ({
  name,
  label,
  options,
  missingText,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  missingText: string;
}) => {
  const [value, setValue] = useState('');
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const labelId = `quote-${name}-label`;
  // Three fit one row; four go two by two on phones.
  const cols = options.length === 4 ? 'grid-cols-2 min-[480px]:grid-cols-4' : 'grid-cols-3';
  return (
    <>
      <p id={labelId} className={labelClass}>
        {label}
      </p>
      <div ref={ref} role="group" aria-labelledby={labelId} className={`relative grid gap-2 ${cols}`}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setValue(o.value);
                setMissing(false);
              }}
              className={`min-h-11 rounded-[10px] px-1 py-[11px] text-[14px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue ${
                on ? 'bg-sc-navy text-white' : 'text-sc-navy ring-1 ring-inset ring-sc-navy/15 hover:ring-sc-navy/30'
              }`}
            >
              {o.label}
            </button>
          );
        })}
        <input
          name={name}
          value={value}
          onChange={() => {}}
          required
          tabIndex={-1}
          aria-hidden="true"
          onInvalid={(e) => {
            e.preventDefault();
            setMissing(true);
            // Bring focus here only when this is the first field still missing.
            const input = e.currentTarget;
            const first = Array.from(input.form?.elements ?? []).find(
              (el) => !(el as HTMLInputElement).validity?.valid,
            );
            if (first === input) requestAnimationFrame(() => ref.current?.querySelector('button')?.focus());
          }}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
      </div>
      {missing && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-red-700">
          {missingText}
        </p>
      )}
    </>
  );
};
