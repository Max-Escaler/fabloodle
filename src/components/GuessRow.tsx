import { useEffect, useState, type ReactNode } from "react";
import type { GuessResult, CellResult } from "../utils/gameLogic";
import { DISPLAY_GRID_CATEGORY_KEYS } from "../utils/gameLogic";
import { CardAvatar } from "./CardAvatar";
import { PitchDots } from "./ui/Pitch";
import { BOARD_COLUMNS, BOARD_MIN_WIDTH, COMPACT_COLUMNS } from "./CategoryHeader";

const NUMERIC_KEYS = new Set(["attack", "defense", "cost"]);
const TAG_KEYS = new Set([
  "type",
  "talent",
  "keywords",
  "subtypes",
  "releases",
  "heroClass",
]);

const DISPLAY_SHORT: Record<string, string> = {
  "Defense Reaction": "Def React",
  "Attack Reaction":  "Atk React",
  "Super Rare":       "S. Rare",
  "Demi-Hero":        "Demi-Hero",
};

const CELL_LABELS: Record<string, string> = {
  type:        "Type",
  subtypes:    "Subtype",
  attack:      "Attack",
  defense:     "Defense",
  cost:        "Cost",
  pitchValues: "Colors",
  talent:      "Talent",
  heroClass:   "Class",
  keywords:    "Keywords",
  releases:    "Sets",
};

// Phone board: ten columns in ~31px each, so tag values are abbreviated.
// The full values are a tap away (the row expands) and in each tile's tooltip.
const ABBREV: Record<string, string> = {
  Action: "Act",
  Instant: "Inst",
  "Defense Reaction": "DR",
  "Attack Reaction": "AR",
  Equipment: "Eqp",
  Weapon: "Wpn",
  Resource: "Res",
  Mentor: "Mntr",
  Companion: "Comp",
  "Demi-Hero": "Demi",
  Token: "Tkn",
  Block: "Blk",
  Generic: "Gen",
  "Non-Attack": "NA",
  Attack: "Atk",
  Mechanologist: "Mech",
  Illusionist: "Illu",
  Runeblade: "Rune",
  Guardian: "Guar",
  Brute: "Brut",
  Ranger: "Rang",
  Warrior: "War",
  Wizard: "Wiz",
  Assassin: "Assn",
};

function abbreviate(value: string): string {
  if (ABBREV[value]) return ABBREV[value];
  const words = value.split(/[\s-]+/).filter(Boolean);
  if (words.length > 1) {
    return words
      .map((w) => (/^\d+$/.test(w) ? w : w[0].toUpperCase()))
      .join("")
      .slice(0, 4);
  }
  return value.slice(0, 4);
}

interface CellProps {
  cellKey: string;
  result: CellResult;
  delay: number;
  /** Show category label inside the cell (mobile) */
  showLabel?: boolean;
}

function Arrow({ direction }: { direction: "higher" | "lower" | null }) {
  if (!direction) return null;
  return (
    <span
      className="text-[11px] font-bold leading-none opacity-80"
      aria-label={direction === "higher" ? "Answer is higher" : "Answer is lower"}
    >
      {direction === "higher" ? "▲" : "▼"}
    </span>
  );
}

function Pitch({ values, small }: { values: number[]; small?: boolean }) {
  if (values.length === 0) {
    return <span className="opacity-60 text-sm">—</span>;
  }
  return (
    <span className="flex justify-center">
      <PitchDots values={values} dotClass={small ? "w-3 h-3" : "w-3.5 h-3.5"} />
    </span>
  );
}

function KeywordTags({ values, small }: { values: string[]; small?: boolean }) {
  if (values.length === 0) {
    return <span className="opacity-60 text-sm">—</span>;
  }
  // Cells are a fixed height, so long lists (a reprinted card's sets) show the
  // first few and a "+N" chip; the full list is in the cell's tooltip.
  const max = small ? 2 : 3;
  const shown = values.length > max ? values.slice(0, max - 1) : values;
  const hidden = values.length - shown.length;
  const chip = `max-w-full truncate font-semibold leading-tight bg-current/12 rounded-[4px] px-1 py-px ${
    small ? "text-[9px]" : "text-[10px]"
  }`;
  return (
    <div className="flex flex-col items-center gap-0.5 px-1 w-full min-w-0">
      {shown.map((kw) => (
        <span key={kw} className={chip}>
          {DISPLAY_SHORT[kw] ?? kw}
        </span>
      ))}
      {hidden > 0 && <span className={`${chip} opacity-80`}>+{hidden} more</span>}
    </div>
  );
}

function Cell({ cellKey, result, delay, showLabel = false }: CellProps) {
  const revealed = useRevealed(delay);
  const showArrow = NUMERIC_KEYS.has(cellKey) && result.status !== "correct";
  const isPitch = cellKey === "pitchValues";
  const isTags = TAG_KEYS.has(cellKey);
  const tone = toneFor(result, revealed);

  return (
    <div
      className={`w-full flex flex-col items-center justify-center gap-1 rounded-md transition-colors duration-300 ${tone} ${
        revealed ? "cell-flip" : ""
      } ${showLabel ? "h-[70px]" : "h-[84px]"}`}
      style={{ animationDelay: `${delay}ms` }}
      title={
        revealed && Array.isArray(result.value) && typeof result.value[0] === "string"
          ? (result.value as string[]).join(", ")
          : undefined
      }
    >
      {showLabel && (
        <span className="text-[9px] font-semibold uppercase tracking-[0.08em] leading-none opacity-70">
          {CELL_LABELS[cellKey]}
        </span>
      )}
      {revealed && (
        <>
          {isPitch ? (
            <Pitch values={result.value as number[]} small={showLabel} />
          ) : isTags ? (
            <KeywordTags values={result.value as string[]} small={showLabel} />
          ) : (
            <span
              className={`tnum font-bold leading-tight text-center px-1 w-full break-words line-clamp-2 ${
                showLabel ? "text-xs" : "text-[13px]"
              }`}
            >
              {DISPLAY_SHORT[String(result.value)] ?? String(result.value)}
            </span>
          )}
          {showArrow && <Arrow direction={result.direction} />}
        </>
      )}
    </div>
  );
}

function useRevealed(delay: number) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return revealed;
}

function toneFor(result: CellResult, revealed: boolean) {
  if (!revealed) return "bg-sunken text-faint ring-1 ring-inset ring-line";
  return result.status === "correct"
    ? "bg-hit text-on-hit"
    : result.status === "close"
      ? "bg-near text-on-near"
      : "bg-miss text-on-miss";
}

/** One tile of the one-line board used below the desktop breakpoint. */
function CompactCell({ cellKey, result, delay }: Omit<CellProps, "showLabel">) {
  const revealed = useRevealed(delay);
  const showArrow = NUMERIC_KEYS.has(cellKey) && result.status !== "correct";
  const isPitch = cellKey === "pitchValues";
  const isTags = TAG_KEYS.has(cellKey);
  const tags = isTags ? (result.value as string[]) : [];
  const full = isTags
    ? tags.join(", ") || "None"
    : isPitch
      ? undefined
      : String(result.value);

  const arrow =
    showArrow && result.direction ? (result.direction === "higher" ? "▲" : "▼") : null;

  let content: ReactNode = null;
  let more = 0;
  if (revealed) {
    if (isPitch) {
      const values = result.value as number[];
      content =
        values.length === 0 ? (
          <span className="opacity-60">—</span>
        ) : (
          <PitchDots
            values={values}
            dotClass="w-[7px] h-[7px] min-[375px]:w-2 min-[375px]:h-2 sm:w-2.5 sm:h-2.5"
            gap="gap-px min-[375px]:gap-[2px]"
          />
        );
    } else if (isTags) {
      if (tags.length === 0) {
        content = <span className="opacity-60">—</span>;
      } else {
        more = tags.length - 1;
        content = (
          <>
            <span className="sm:hidden">{abbreviate(tags[0])}</span>
            <span className="hidden sm:block max-w-full truncate px-0.5">
              {DISPLAY_SHORT[tags[0]] ?? tags[0]}
            </span>
          </>
        );
      }
    } else {
      content = (
        <span className="tnum inline-flex items-baseline gap-px text-[14px] sm:text-[15px]">
          {DISPLAY_SHORT[String(result.value)] ?? String(result.value)}
          {arrow && <span className="text-[8px] sm:text-[9px] opacity-80">{arrow}</span>}
        </span>
      );
    }
  }

  return (
    <div
      className={`relative min-w-0 h-9 sm:h-11 flex items-center justify-center rounded-[5px] text-[9px] min-[375px]:text-[10px] sm:text-[11px] font-bold leading-none text-center overflow-hidden ${toneFor(
        result,
        revealed
      )} ${revealed ? "cell-flip" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
      title={revealed ? full : undefined}
    >
      {content}
      {more > 0 && (
        <span className="absolute top-[2px] right-[3px] text-[7.5px] sm:text-[8px] font-semibold opacity-70">
          +{more}
        </span>
      )}
    </div>
  );
}

interface GuessRowProps {
  result: GuessResult;
  rowIndex: number;
  /** All grid categories matched the answer but the card itself is different */
  isSameStats?: boolean;
}

export function GuessRow({ result, rowIndex, isSameStats = false }: GuessRowProps) {
  const BASE_DELAY = rowIndex * 50;
  const CELL_STAGGER = 120;

  const sameStatsBadge = (
    <span className="inline-block shrink-0 text-accent-text bg-accent-soft text-[10px] font-bold uppercase tracking-[0.06em] rounded-sm px-1.5 py-0.5 leading-none">
      Same stats
    </span>
  );

  return (
    <>
      {/* Phones and tablets: name line over all ten categories on one row. */}
      <div
        className={`lg:hidden rounded-md px-1.5 pt-1.5 pb-1.5 sm:px-2 ${
          isSameStats ? "bg-accent-soft ring-1 ring-inset ring-accent/50" : "bg-surface ring-1 ring-inset ring-line"
        }`}
      >
        <div className="flex items-baseline gap-1.5 min-w-0 px-0.5 mb-1">
          <span className="min-w-0 truncate text-[13px] font-semibold leading-tight">
            {result.card.name}
          </span>
          <span className="shrink-0 text-[11px] text-muted leading-tight">
            {result.card.type.join(" // ")}
          </span>
          {isSameStats && <span className="ml-auto self-center">{sameStatsBadge}</span>}
        </div>
        <div className="grid gap-[3px] sm:gap-1" style={{ gridTemplateColumns: COMPACT_COLUMNS }}>
          {DISPLAY_GRID_CATEGORY_KEYS.map((key, i) => (
            <CompactCell
              key={key}
              cellKey={key}
              result={result.cells[key]}
              delay={BASE_DELAY + i * CELL_STAGGER}
            />
          ))}
        </div>
      </div>

      {/* Desktop: one board row per guess. */}
      <div
        className={`hidden lg:grid items-center gap-1.5 w-full px-3 py-1.5 rounded-lg ${BOARD_MIN_WIDTH} ${
          isSameStats ? "bg-accent-soft ring-1 ring-inset ring-accent/50" : ""
        }`}
        style={{ gridTemplateColumns: BOARD_COLUMNS }}
      >
        <div className="flex items-center gap-3 min-w-0 pr-1">
          <CardAvatar card={result.card} size={52} />
          <div className="min-w-0">
            <span className="text-sm font-semibold leading-snug line-clamp-2 block">
              {result.card.name}
            </span>
            <span className="text-muted text-xs truncate block mt-0.5">
              {result.card.type.join(" // ")}
            </span>
            {isSameStats && <span className="block mt-1">{sameStatsBadge}</span>}
          </div>
        </div>
        {DISPLAY_GRID_CATEGORY_KEYS.map((key, i) => (
          <Cell
            key={key}
            cellKey={key}
            result={result.cells[key]}
            delay={BASE_DELAY + i * CELL_STAGGER}
          />
        ))}
      </div>
    </>
  );
}
