'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface AutocompleteOption {
  label: string;
  /** secondary label shown to the right (e.g. parent région for a district) */
  hint?: string;
  /** opaque payload returned via onSelect (e.g. the suggestion kind) */
  value?: string;
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  /** called when an option is picked (click / Enter on a highlighted option) */
  onSelect?: (option: AutocompleteOption) => void;
  /** full option list — filtered internally as the user types */
  options: AutocompleteOption[];
  placeholder?: string;
  ariaLabel?: string;
  icon?: ReactNode;
  maxResults?: number;
  className?: string;
}

/** Diacritic-insensitive, case-insensitive normalization so "medecin" matches "Médecin". */
function normalize(input: string): string {
  return input.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function Autocomplete({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  ariaLabel,
  icon,
  maxResults = 8,
  className,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const query = normalize(value.trim());
  const results = (
    query === ''
      ? options
      : options.filter(
          (o) => normalize(o.label).includes(query) || (o.hint ? normalize(o.hint).includes(query) : false),
        )
  ).slice(0, maxResults);

  // Close when clicking outside the component.
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  const choose = (option: AutocompleteOption) => {
    onChange(option.label);
    onSelect?.(option);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && active >= 0 && results[active]) {
        e.preventDefault();
        choose(results[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const expanded = open && results.length > 0;

  return (
    <div ref={rootRef} className={cn('relative flex flex-1 items-center gap-2 px-3', className)}>
      {icon}
      <input
        type="text"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-12 w-full bg-transparent outline-none"
      />
      {expanded && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-auto rounded-xl border border-border bg-card py-1 text-left shadow-xl"
        >
          {results.map((option, i) => (
            <li
              key={`${option.label}-${option.hint ?? ''}`}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(option);
              }}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm',
                i === active && 'bg-muted',
              )}
            >
              <span className="truncate">{option.label}</span>
              {option.hint && <span className="shrink-0 text-xs text-muted-foreground">{option.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
