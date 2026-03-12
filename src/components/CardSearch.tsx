import { useState, useRef, useEffect } from "react";
import type { FabCard } from "../data/cards";
import { CardAvatar } from "./CardAvatar";

const PITCH_COLORS: Record<number, string> = { 1: "#e74c3c", 2: "#f1c40f", 3: "#3498db" };

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

  useEffect(() => { setHighlighted(0); }, [query]);

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
        <span className="absolute left-4 text-[#818384] pointer-events-none text-lg">🔍</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Congratulations! 🎉" : "Search for a card…"}
          className="w-full pl-11 pr-5 py-4 rounded-xl bg-[#1a1a1b] border border-[#3a3a3c] text-white placeholder-[#818384] focus:outline-none focus:border-[#818384] text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-[#1a1a1b] border border-[#3a3a3c] rounded-xl overflow-y-auto max-h-72 shadow-2xl"
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
              className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${
                i === highlighted ? "bg-[#3a3a3c] text-white" : "text-[#d7d7d7] hover:bg-[#2a2a2b]"
              }`}
            >
              <CardAvatar card={card} size={40} />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm leading-tight block truncate">{card.name}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[#818384] text-xs truncate">
                    {card.type}
                    {card.heroClass !== "Generic" ? ` · ${card.heroClass}` : ""}
                    {card.talent !== "None" ? ` · ${card.talent}` : ""}
                  </span>
                  {card.pitchValues.length > 0 && (
                    <div className="flex gap-0.5 shrink-0">
                      {card.pitchValues.map((v) => (
                        <span
                          key={v}
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: PITCH_COLORS[v] ?? "#818384" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[#818384] text-xs shrink-0">{card.rarity}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
