import React, { useEffect, useId, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

/*
 * The quote form's address field, with suggestions as you type.
 *
 * Suggestions come from /api/address-suggest (functions/api/), which calls
 * Mapbox server-side, so no Mapbox script or token ships on the page. If that
 * endpoint returns nothing (it fails quietly by design), this is just a text
 * input: the form never depends on it.
 *
 * Follows the ARIA combobox pattern: arrows move through the list, Enter picks
 * the highlighted suggestion (or submits the form when none is highlighted),
 * Escape closes it.
 */

export type Suggestion = {
  id: string;
  line1: string;
  line2: string;
  full: string;
  city: string;
  /** Where Mapbox places it. Only the admin lead finder reads these. */
  lat?: number;
  lng?: number;
};

const MIN_CHARS = 3;
const DEBOUNCE_MS = 200;

/**
 * `onPick` reports the suggestion the field now holds, or null as soon as the
 * visitor types (a hand-edited address is no longer the one Mapbox matched).
 */
export const AddressAutocomplete = ({
  name,
  defaultValue = '',
  placeholder = "Enter your pool's address",
  near,
  onPick,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  /** Rank suggestions nearest this city (a NEAR key in address-suggest.ts). */
  near?: string;
  onPick?: (s: Suggestion | null) => void;
}) => {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Set when a suggestion is picked, so filling the field doesn't look up the
  // address it was just filled with. Starts true so mounting with an address
  // already in it (back from step 2) doesn't spend a lookup either.
  const picked = useRef(true);
  const listId = useId();

  useEffect(() => {
    if (picked.current) {
      picked.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < MIN_CHARS) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const nearParam = near ? `&near=${encodeURIComponent(near)}` : '';
        const res = await fetch(`/api/address-suggest?q=${encodeURIComponent(q)}${nearParam}`, { signal: ctrl.signal });
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
        setActive(-1);
      } catch {
        // Aborted by the next keystroke, or offline: keep it a plain field.
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value, near]);

  const showList = open && suggestions.length > 0;

  // The field sits low in the hero, so an opening list can run off the bottom
  // of the screen (or under a phone's keyboard, which visualViewport accounts
  // for). Once per opening, scroll just enough to show it, never so far that
  // the field itself leaves the top.
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!showList || !listRef.current || !inputRef.current) return;
    const vv = window.visualViewport;
    const visibleTop = vv?.offsetTop ?? 0;
    const visibleBottom = visibleTop + (vv?.height ?? window.innerHeight);
    const overflow = listRef.current.getBoundingClientRect().bottom + 12 - visibleBottom;
    const room = inputRef.current.getBoundingClientRect().top - visibleTop - 8;
    const by = Math.min(overflow, room);
    if (by <= 0) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollBy({ top: by, behavior: reduce ? 'auto' : 'smooth' });
  }, [showList]);

  const pick = (s: Suggestion) => {
    picked.current = true;
    setValue(s.full);
    onPick?.(s);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">Your pool's address</span>
      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-sc-navy/50" />
      <input
        ref={inputRef}
        name={name}
        type="text"
        // Our own list replaces the browser's, so the two don't stack up.
        autoComplete="off"
        // Phone keyboards: capitalize street names, and label return "Go".
        autoCapitalize="words"
        enterKeyHint="go"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onPick?.(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-12 w-full rounded-[10px] bg-transparent pl-11 pr-3 text-[16.5px] text-sc-navy placeholder:text-sc-navy/50 focus:outline-none"
      />
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Address suggestions"
        className={`absolute inset-x-0 top-[calc(100%+12px)] z-30 rounded-[14px] bg-white p-1.5 shadow-[0_16px_40px_-16px_rgba(36,58,85,0.35)] ring-1 ring-sc-navy/10 ${showList ? '' : 'hidden'}`}
      >
        {suggestions.map((s, i) => (
          <li
            key={s.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            // mousedown, not click: it lands before the input's blur closes the list.
            onMouseDown={(e) => {
              e.preventDefault();
              pick(s);
            }}
            onMouseEnter={() => setActive(i)}
            className={`flex cursor-pointer items-start gap-2.5 rounded-[10px] px-3 py-2 ${i === active ? 'bg-[#f5f9fd]' : ''}`}
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sc-navy/40" />
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold text-sc-navy">{s.line1}</span>
              {s.line2 && <span className="block truncate text-[13px] text-sc-navy/60">{s.line2}</span>}
            </span>
          </li>
        ))}
        <li role="presentation" className="px-3 pb-1 pt-1.5 text-right text-[11px] text-sc-navy/40">
          © Mapbox
        </li>
      </ul>
    </label>
  );
};
