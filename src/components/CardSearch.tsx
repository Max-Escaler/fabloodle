import { useState, useRef, useEffect } from "react";
import type { FabCard } from "../data/cards";
import { CardAvatar } from "./CardAvatar";
import { PitchDots } from "./ui/Pitch";
import { SearchIcon } from "./ui/icons";



interface CardSearchProps {
  cards: FabCard[];
  guessedIds: Set<string>;
  onSelect: (card: FabCard) => void;
  disabled: boolean;
}

export function CardSearch({ cards, guessedIds, onSelect, disabled }: CardSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query.trim()
    ? cards
        .filter(
          (c) =>
            !guessedIds.has(c.id) &&
            c.name.toLowerCase().includes(query.toLowerCase().trim())
        )
        .slice(0, 12)
    : [];

  function handleSelect(card: FabCard) {
    onSelect(card);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) handleSelect(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (listRef.current && filtered.length > 0) {
      const item = listRef.current.children[highlighted] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, filtered.length]);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <SearchIcon size={20} className="absolute left-4 text-faint pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Solved! Come back tomorrow for a new card." : "Search for a card to guess…"}
          aria-label="Search for a card to guess"
          className="field w-full h-14 pl-12 pr-4 !text-base shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-30 mt-1.5 w-full panel !shadow-lg overflow-y-auto max-h-80 p-1"
        >
          {filtered.map((card, i) => (
            <li
              key={card.id}
              onMouseDown={() => handleSelect(card)}
              onTouchStart={(e) => {
                // Record where the finger started so we can distinguish tap vs scroll
                (e.currentTarget as HTMLElement).dataset.touchStartY =
                  String(e.touches[0].clientY);
              }}
              onTouchEnd={(e) => {
                const startY = parseFloat(
                  (e.currentTarget as HTMLElement).dataset.touchStartY ?? "0"
                );
                const endY = e.changedTouches[0].clientY;
                // Only treat as a tap if the finger moved less than 10px vertically
                if (Math.abs(endY - startY) < 10) {
                  e.preventDefault();
                  handleSelect(card);
                }
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={`px-2.5 py-2 rounded-md cursor-pointer flex items-center gap-3 transition-colors ${
                i === highlighted ? "bg-accent-soft text-fg" : "text-fg"
              }`}
            >
              <CardAvatar card={card} size={34} />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm leading-tight block truncate">{card.name}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-muted text-xs truncate">
                    {card.type.join(" // ")}
                    {card.heroClass.some((c) => c !== "Generic") ? ` · ${card.heroClass.filter((c) => c !== "Generic").join("/")}` : ""}
                    {card.talent.some((t) => t !== "None") ? ` · ${card.talent.filter((t) => t !== "None").join("/")}` : ""}
                  </span>
                  <PitchDots values={card.pitchValues} dotClass="w-2.5 h-2.5" gap="gap-0.5" />
                </div>
              </div>
              <span className="text-faint text-xs shrink-0">{card.rarity}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
