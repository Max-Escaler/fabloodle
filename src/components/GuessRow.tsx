import { useEffect, useState } from "react";
import type { GuessResult, CellResult } from "../utils/gameLogic";
import { CardAvatar } from "./CardAvatar";

const NUMERIC_KEYS = new Set(["attack", "defense", "cost"]);

const DISPLAY_SHORT: Record<string, string> = {
  "Attack Action":     "Attack",
  "Non-Attack Action": "Non-Atk",
  "Defense Reaction":  "Def React",
  "Attack Reaction":   "Atk React",
  "Super Rare":        "S. Rare",
};

const CELL_LABELS: Record<string, string> = {
  type:        "Type",
  attack:      "Attack",
  defense:     "Defense",
  cost:        "Cost",
  pitchValues: "Colors",
  talent:      "Talent",
  heroClass:   "Class",
};

const PITCH_COLORS: Record<number, string> = {
  1: "#e74c3c",
  2: "#f1c40f",
  3: "#3498db",
};

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
    <span className="text-white font-bold text-sm leading-none">
      {direction === "higher" ? "▲" : "▼"}
    </span>
  );
}

function PitchDots({ values, small }: { values: number[]; small?: boolean }) {
  if (values.length === 0) {
    return <span className="text-white/50 text-sm">—</span>;
  }
  return (
    <div className="flex gap-1 justify-center flex-wrap">
      {values.map((v) => (
        <span
          key={v}
          className={`rounded-full inline-block shrink-0 ${small ? "w-3 h-3" : "w-4 h-4"}`}
          style={{ backgroundColor: PITCH_COLORS[v] ?? "#818384" }}
          title={v === 1 ? "Red" : v === 2 ? "Yellow" : "Blue"}
        />
      ))}
    </div>
  );
}

function Cell({ cellKey, result, delay, showLabel = false }: CellProps) {
  const [revealed, setRevealed] = useState(false);
  const showArrow = NUMERIC_KEYS.has(cellKey) && result.status !== "correct";
  const isPitch = cellKey === "pitchValues";

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const bgColor = revealed
    ? result.status === "correct"
      ? "bg-[#538d4e]"
      : result.status === "close"
      ? "bg-[#b59f3b]"
      : "bg-[#3a3a3c]"
    : "bg-[#1a1a1b] border border-[#3a3a3c]";

  return (
    <div
      className={`w-full flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-300 ${bgColor} ${
        revealed ? "cell-flip" : ""
      } ${showLabel ? "h-[72px]" : "h-[104px]"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {showLabel && (
        <span className="text-white/50 text-[9px] font-semibold uppercase tracking-wide leading-none">
          {CELL_LABELS[cellKey]}
        </span>
      )}
      {revealed && (
        <>
          {isPitch ? (
            <PitchDots values={result.value as number[]} small={showLabel} />
          ) : (
            <span
              className={`text-white font-bold leading-tight text-center px-1 w-full break-words line-clamp-2 ${
                showLabel ? "text-[11px]" : "text-[13px]"
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

interface GuessRowProps {
  result: GuessResult;
  rowIndex: number;
  /** All 7 categories matched the answer but the card itself is different */
  isSameStats?: boolean;
}

const CELL_KEYS = [
  "type",
  "attack",
  "defense",
  "cost",
  "pitchValues",
  "talent",
  "heroClass",
] as const;

export function GuessRow({ result, rowIndex, isSameStats = false }: GuessRowProps) {
  const BASE_DELAY = rowIndex * 50;
  const CELL_STAGGER = 120;

  return (
    <>
      {/* ── Mobile layout: card info row + 4×2 grid ── */}
      <div
        className={`sm:hidden flex flex-col gap-2 p-2 rounded-xl bg-[#1a1a1b] border ${
          isSameStats ? "border-[#d4a843]" : "border-[#3a3a3c]"
        }`}
      >
        <div className="flex items-center gap-2">
          <CardAvatar card={result.card} size={48} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-white text-sm font-semibold leading-snug line-clamp-2 block">
              {result.card.name}
            </span>
            <span className="text-[#818384] text-xs truncate block mt-0.5">
              {result.card.type}
            </span>
          </div>
          {isSameStats && (
            <span className="shrink-0 text-[#d4a843] text-[10px] font-bold uppercase tracking-wide border border-[#d4a843] rounded px-1.5 py-0.5">
              Same stats!
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {CELL_KEYS.map((key, i) => (
            <Cell
              key={key}
              cellKey={key}
              result={result.cells[key]}
              delay={BASE_DELAY + i * CELL_STAGGER}
              showLabel
            />
          ))}
        </div>
      </div>

      {/* ── Desktop layout: horizontal grid row ── */}
      <div
        className="hidden sm:grid items-center gap-2 w-full px-3 min-w-[780px]"
        style={{ gridTemplateColumns: "minmax(200px, 260px) repeat(7, minmax(96px, 120px))" }}
      >
        <div
          className={`flex items-center gap-3 min-w-0 rounded-lg px-2 py-1 ${
            isSameStats ? "border-l-4 border-[#d4a843]" : ""
          }`}
        >
          <CardAvatar card={result.card} size={72} className="shrink-0" />
          <div className="min-w-0">
            <span className="text-white text-sm font-semibold leading-snug line-clamp-2 block">
              {result.card.name}
            </span>
            <span className="text-[#818384] text-xs truncate block mt-0.5">
              {result.card.type}
            </span>
            {isSameStats && (
              <span className="inline-block mt-1 text-[#d4a843] text-[10px] font-bold uppercase tracking-wide border border-[#d4a843] rounded px-1.5 py-0.5 leading-none">
                Same stats!
              </span>
            )}
          </div>
        </div>
        {CELL_KEYS.map((key, i) => (
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
