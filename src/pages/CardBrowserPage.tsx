import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CARDS } from "../data/cards";
import type { FabCard } from "../data/cards";
import { effectiveClass } from "../utils/gameLogic";
import { getCardReleases } from "../utils/cardReleases";
import { CardAvatar } from "../components/CardAvatar";
import { CardDetailModal } from "../components/CardDetailModal";
import { Page, PageHeader } from "../components/ui/Page";
import { PitchDot } from "../components/ui/Pitch";
import { PITCH_NAMES } from "../utils/pitch";
import { ArrowLeftIcon, CloseIcon } from "../components/ui/icons";
import { SiteFooter } from "../components/shell/SiteFooter";
import {
  trackBrowseCardsOpened,
  trackBrowseFilterApplied,
  trackBrowseCardViewed,
  trackBrowseFiltersReset,
} from "../utils/analytics";


const RESULT_LIMIT = 240;

type Op = "=" | ">" | "<" | ">=" | "<=";

interface NumericFilter {
  op: Op;
  value: number | null;
}

interface Filters {
  type: string | null;
  talent: string | null;
  subtype: string | null;
  class: string | null;
  set: string | null;
  keywords: string[];
  pitch: number[];
  attack: NumericFilter;
  defense: NumericFilter;
  cost: NumericFilter;
}

const EMPTY_FILTERS: Filters = {
  type: null,
  talent: null,
  subtype: null,
  class: null,
  set: null,
  keywords: [],
  pitch: [],
  attack: { op: "=", value: null },
  defense: { op: "=", value: null },
  cost: { op: "=", value: null },
};

const FILTERS_STORAGE_KEY = "fabloodle:cardBrowserFilters";

function loadStoredFilters(): Filters {
  if (typeof window === "undefined") return EMPTY_FILTERS;
  try {
    const raw = window.sessionStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return EMPTY_FILTERS;
    const parsed = JSON.parse(raw) as Partial<Filters>;
    // Merge with EMPTY_FILTERS so older shapes (e.g. missing keys after a code
    // change) still produce a valid Filters object.
    return {
      ...EMPTY_FILTERS,
      ...parsed,
      attack: { ...EMPTY_FILTERS.attack, ...(parsed.attack ?? {}) },
      defense: { ...EMPTY_FILTERS.defense, ...(parsed.defense ?? {}) },
      cost: { ...EMPTY_FILTERS.cost, ...(parsed.cost ?? {}) },
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      pitch: Array.isArray(parsed.pitch) ? parsed.pitch : [],
    };
  } catch {
    return EMPTY_FILTERS;
  }
}

function uniqueSorted<T extends string | number>(values: Iterable<T>): T[] {
  return Array.from(new Set(values)).sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
}

/** Parse a costDisplay string into a comparable integer. "X","XX","—" → null. */
function parseCost(display: string): number | null {
  const n = parseInt(display, 10);
  return isNaN(n) ? null : n;
}

function isNumericFilterActive(f: NumericFilter): boolean {
  return f.value !== null;
}

function describeFilters(f: Filters) {
  const usedType = f.type !== null;
  const usedSubtype = f.subtype !== null;
  const usedClass = f.class !== null;
  const usedTalent = f.talent !== null;
  const usedSet = f.set !== null;
  const usedPitch = f.pitch.length > 0;
  const usedKeyword = f.keywords.length > 0;
  const usedCost = isNumericFilterActive(f.cost);
  const usedAttack = isNumericFilterActive(f.attack);
  const usedDefense = isNumericFilterActive(f.defense);
  const activeFilterCount = [
    usedType,
    usedSubtype,
    usedClass,
    usedTalent,
    usedSet,
    usedPitch,
    usedKeyword,
    usedCost,
    usedAttack,
    usedDefense,
  ].filter(Boolean).length;
  return {
    usedType,
    usedSubtype,
    usedClass,
    usedTalent,
    usedSet,
    usedPitch,
    usedKeyword,
    usedCost,
    usedAttack,
    usedDefense,
    keywordCount: f.keywords.length,
    activeFilterCount,
  };
}

function cmp(actual: number | null, filter: NumericFilter): boolean {
  if (filter.value === null) return true;
  if (actual === null) return false;
  switch (filter.op) {
    case "=": return actual === filter.value;
    case ">": return actual > filter.value;
    case "<": return actual < filter.value;
    case ">=": return actual >= filter.value;
    case "<=": return actual <= filter.value;
  }
}

export function CardBrowserPage() {
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? null;

  const [filters, setFilters] = useState<Filters>(() => loadStoredFilters());
  const [selected, setSelected] = useState<FabCard | null>(null);

  const openedFiredRef = useRef(false);
  useEffect(() => {
    if (openedFiredRef.current) return;
    openedFiredRef.current = true;
    const desc = describeFilters(filters);
    trackBrowseCardsOpened({
      returnTo,
      hadPersistedFilters: desc.activeFilterCount > 0,
    });
    // Intentionally only fire once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters across navigations within the same browser tab so the user
  // can hop back and forth between Browse Cards and the puzzle without losing
  // their search.
  useEffect(() => {
    try {
      window.sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // ignore quota / privacy mode errors — filters just won't persist
    }
  }, [filters]);

  const options = useMemo(() => {
    const types = new Set<string>();
    const talents = new Set<string>();
    const subtypes = new Set<string>();
    const classes = new Set<string>();
    const keywords = new Set<string>();
    const sets = new Set<string>();
    for (const c of CARDS) {
      c.type.forEach((t) => types.add(t));
      c.talent.forEach((t) => talents.add(t));
      c.subtypes.forEach((s) => subtypes.add(s));
      effectiveClass(c).forEach((cls) => {
        if (cls !== "None") classes.add(cls);
      });
      c.keywords.forEach((k) => keywords.add(k));
      getCardReleases(c).forEach((r) => sets.add(String(r)));
    }
    return {
      types: uniqueSorted(types),
      talents: uniqueSorted(talents),
      subtypes: uniqueSorted(subtypes),
      classes: uniqueSorted(classes),
      keywords: uniqueSorted(keywords),
      sets: uniqueSorted(sets),
    };
  }, []);

  const results = useMemo(() => {
    return CARDS.filter((c) => {
      if (filters.type && !c.type.includes(filters.type)) return false;
      if (filters.talent && !c.talent.includes(filters.talent)) return false;
      if (filters.subtype && !c.subtypes.includes(filters.subtype)) return false;
      if (filters.class && !effectiveClass(c).includes(filters.class)) return false;
      if (!filters.keywords.every((k) => c.keywords.includes(k))) return false;
      if (filters.set && !getCardReleases(c).map(String).includes(filters.set)) return false;
      if (!filters.pitch.every((p) => c.pitchValues.includes(p))) return false;
      if (!cmp(c.attack, filters.attack)) return false;
      if (!cmp(c.defense, filters.defense)) return false;
      if (!cmp(parseCost(c.costDisplay), filters.cost)) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [filters]);

  const truncated = results.length > RESULT_LIMIT;
  const visible = truncated ? results.slice(0, RESULT_LIMIT) : results;

  // Debounce filter_applied events so we don't flood GA while the user is
  // typing a numeric value or clicking through options. The latest values
  // for results and filters are captured by the timer callback itself.
  const firstFilterEffectRef = useRef(true);
  useEffect(() => {
    if (firstFilterEffectRef.current) {
      firstFilterEffectRef.current = false;
      return;
    }
    const desc = describeFilters(filters);
    if (desc.activeFilterCount === 0) return;
    const timer = window.setTimeout(() => {
      trackBrowseFilterApplied({
        resultCount: results.length,
        ...desc,
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [filters, results.length]);

  function toggleArrayValue<T>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  function reset() {
    const desc = describeFilters(filters);
    trackBrowseFiltersReset({ activeFilterCountBefore: desc.activeFilterCount });
    setFilters(EMPTY_FILTERS);
  }

  function handleCardClick(card: FabCard) {
    const index = visible.findIndex((c) => c.id === card.id);
    trackBrowseCardViewed({
      cardId: card.id,
      cardName: card.name,
      cardSet: getCardReleases(card).map(String).join(",") || "unknown",
      resultPosition: index >= 0 ? index : -1,
      resultCount: results.length,
    });
    setSelected(card);
  }

  const activeFilterCount = describeFilters(filters).activeFilterCount;
  const backTo = returnTo && returnTo !== "/cards" ? returnTo : "/";

  return (
    <>
      <Page width="max-w-6xl">
        <PageHeader
          eyebrow="Card browser"
          title="Browse the card pool"
          subtitle="Filter by Fabloodle's categories to narrow down the answer. Open a card to see it, or guess it on your puzzle."
          actions={
            <Link to={backTo} className="btn btn-secondary btn-sm">
              <ArrowLeftIcon size={16} />
              Back to puzzle
            </Link>
          }
        />

        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          options={options}
          toggleArrayValue={toggleArrayValue}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 mt-6 mb-3">
          <p className="tnum text-sm text-muted">
            <span className="text-fg font-semibold">{results.length.toLocaleString()}</span>{" "}
            {results.length === 1 ? "card" : "cards"}
            {truncated && (
              <span className="text-warn ml-2">
                Showing the first {RESULT_LIMIT}. Narrow your filters to see more.
              </span>
            )}
          </p>
          {activeFilterCount > 0 && (
            <button type="button" onClick={reset} className="btn btn-ghost btn-sm">
              <CloseIcon size={15} />
              Clear {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"}
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="panel text-center text-muted py-16 text-sm">
            No cards match these filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {visible.map((card) => {
              const cls = effectiveClass(card).filter((c) => c !== "Generic" && c !== "None");
              const talent = card.talent.filter((t) => t !== "None");
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleCardClick(card)}
                  className="group flex flex-col gap-2 p-2 rounded-lg bg-surface border border-line shadow-sm hover:border-accent/60 hover:bg-sunken transition-colors text-left"
                >
                  <span className="flex justify-center">
                    <CardAvatar card={card} size={110} />
                  </span>
                  <span className="w-full min-w-0 px-0.5">
                    <span className="block text-[13px] font-semibold leading-tight truncate group-hover:text-accent-text">
                      {card.name}
                    </span>
                    <span className="block text-muted text-[11px] mt-0.5 truncate">
                      {card.type.join(" // ")}
                      {cls.length > 0 ? ` · ${cls.join("/")}` : ""}
                      {talent.length > 0 ? ` · ${talent.join("/")}` : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Page>
      <SiteFooter />

      {selected && (
        <CardDetailModal
          card={selected}
          returnTo={returnTo}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

interface FilterPanelProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  options: {
    types: string[];
    talents: string[];
    subtypes: string[];
    classes: string[];
    keywords: string[];
    sets: string[];
  };
  toggleArrayValue: <T>(arr: T[], value: T) => T[];
}

function FilterPanel({ filters, setFilters, options, toggleArrayValue }: FilterPanelProps) {
  return (
    <div className="panel p-4 sm:p-5 flex flex-col gap-4">
      {/* Single-selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <SelectField
          label="Type"
          value={filters.type ?? ""}
          options={options.types}
          placeholder="Any type"
          onChange={(v) => setFilters((f) => ({ ...f, type: v || null }))}
        />
        <SelectField
          label="Subtype"
          value={filters.subtype ?? ""}
          options={options.subtypes}
          placeholder="Any subtype"
          onChange={(v) => setFilters((f) => ({ ...f, subtype: v || null }))}
        />
        <SelectField
          label="Class"
          value={filters.class ?? ""}
          options={options.classes}
          placeholder="Any class"
          onChange={(v) => setFilters((f) => ({ ...f, class: v || null }))}
        />
        <SelectField
          label="Talent"
          value={filters.talent ?? ""}
          options={options.talents}
          placeholder="Any talent"
          onChange={(v) => setFilters((f) => ({ ...f, talent: v || null }))}
        />
        <SelectField
          label="Set"
          value={filters.set ?? ""}
          options={options.sets}
          placeholder="Any set"
          onChange={(v) => setFilters((f) => ({ ...f, set: v || null }))}
        />
      </div>

      {/* Numeric filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NumericField
          label="Cost"
          filter={filters.cost}
          onChange={(nf) => setFilters((f) => ({ ...f, cost: nf }))}
        />
        <NumericField
          label="Attack"
          filter={filters.attack}
          onChange={(nf) => setFilters((f) => ({ ...f, attack: nf }))}
        />
        <NumericField
          label="Defense"
          filter={filters.defense}
          onChange={(nf) => setFilters((f) => ({ ...f, defense: nf }))}
        />
      </div>

      {/* Pitch (Colors) */}
      <FieldGroup label="Colors">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((p) => {
            const checked = filters.pitch.includes(p);
            return (
              <label
                key={p}
                className={`flex items-center gap-2 rounded-full px-3 h-8 cursor-pointer text-xs font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                  checked
                    ? "bg-accent-soft text-accent-text ring-1 ring-inset ring-accent"
                    : "bg-sunken text-fg ring-1 ring-inset ring-transparent hover:ring-line-strong"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() =>
                    setFilters((f) => ({
                      ...f,
                      pitch: toggleArrayValue(f.pitch, p),
                    }))
                  }
                />
                <PitchDot value={p} />
                {PITCH_NAMES[p]}
              </label>
            );
          })}
        </div>
      </FieldGroup>

      {/* Keyword: searchable multi-select dropdown */}
      <MultiSelectDropdown
        label="Keyword"
        placeholder="Search keywords…"
        options={options.keywords}
        selected={filters.keywords}
        onToggle={(v) =>
          setFilters((f) => ({ ...f, keywords: toggleArrayValue(f.keywords, v) }))
        }
        onClear={() => setFilters((f) => ({ ...f, keywords: [] }))}
      />
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="eyebrow">{label}</span>
      {children}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
}

function SelectField({ label, value, options, placeholder, onChange }: SelectFieldProps) {
  return (
    <FieldGroup label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field w-full h-10"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </FieldGroup>
  );
}

interface NumericFieldProps {
  label: string;
  filter: NumericFilter;
  onChange: (filter: NumericFilter) => void;
}

function NumericField({ label, filter, onChange }: NumericFieldProps) {
  return (
    <FieldGroup label={label}>
      <div className="flex gap-2">
        <select
          value={filter.op}
          onChange={(e) => onChange({ ...filter, op: e.target.value as Op })}
          className="field h-10 w-16 !px-2"
        >
          <option value="=">=</option>
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value=">=">&gt;=</option>
          <option value="<=">&lt;=</option>
        </select>
        <input
          type="number"
          inputMode="numeric"
          value={filter.value ?? ""}
          placeholder="any"
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange({ ...filter, value: null });
              return;
            }
            const n = parseInt(raw, 10);
            onChange({ ...filter, value: isNaN(n) ? null : n });
          }}
          className="field tnum flex-1 min-w-0 h-10"
        />
      </div>
    </FieldGroup>
  );
}

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}

function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selected,
  onToggle,
  onClear,
}: MultiSelectDropdownProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Keep highlighted in range / scrolled into view
  useEffect(() => {
    if (highlighted >= filtered.length) setHighlighted(0);
  }, [filtered.length, highlighted]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[highlighted];
      if (target) {
        onToggle(target);
        setQuery("");
        setHighlighted(0);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && selected.length > 0) {
      onToggle(selected[selected.length - 1]);
    }
  }

  return (
    <FieldGroup
      label={`${label}${selected.length > 0 ? ` · ${selected.length} selected` : ""}`}
    >
      <div className="relative" ref={containerRef}>
        <div
          className={`flex flex-wrap items-center gap-1.5 rounded-md border min-h-10 px-2 py-1 transition-colors cursor-text ${
            open
              ? "bg-surface border-accent shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_30%,transparent)]"
              : "bg-sunken border-transparent hover:border-line-strong"
          }`}
          onClick={() => {
            setOpen(true);
            const input = containerRef.current?.querySelector("input");
            (input as HTMLInputElement | null)?.focus();
          }}
        >
          {selected.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 rounded-sm bg-accent-soft text-accent-text text-xs font-semibold pl-2 pr-1 py-0.5"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle(value);
                }}
                className="inline-grid place-items-center w-4 h-4 rounded-[3px] opacity-80 hover:opacity-100 hover:bg-accent/20"
              >
                <CloseIcon size={12} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={query}
            placeholder={selected.length === 0 ? placeholder : ""}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlighted(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-[8ch] bg-transparent text-fg text-sm py-1 px-1 outline-none"
          />
          {selected.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
                setQuery("");
              }}
              className="text-muted hover:text-fg text-xs font-semibold px-1.5"
            >
              Clear
            </button>
          )}
        </div>

        {open && (
          <ul
            ref={listRef}
            className="absolute z-30 mt-1.5 w-full max-h-64 overflow-y-auto panel !shadow-lg p-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-faint text-sm">No matches</li>
            ) : (
              filtered.map((option, i) => {
                const isSelected = selected.includes(option);
                const isHighlighted = i === highlighted;
                return (
                  <li
                    key={option}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onToggle(option);
                    }}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-sm cursor-pointer text-sm ${
                      isHighlighted ? "bg-accent-soft text-fg" : "text-fg"
                    }`}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={isSelected}
                      tabIndex={-1}
                      className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer pointer-events-none shrink-0"
                    />
                    <span className="truncate">{option}</span>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </FieldGroup>
  );
}
