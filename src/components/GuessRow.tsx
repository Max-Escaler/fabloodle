import { useEffect, useState } from "react";
import type { GuessResult, CellResult } from "../utils/gameLogic";
import { CardAvatar } from "./CardAvatar";

const NUMERIC_KEYS = new Set(["attack", "defense", "cost"]);

const DISPLAY_SHORT: Record<string, string> = {
  "Attack Action":     "Attack",
  "Non-Attack Action": "Non-Attack",
  "Defense Reaction":  "Def React",
  "Attack Reaction":   "Atk React",
  "Super Rare":        "S. Rare",
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
}

function Arrow({ direction }: { direction: "higher" | "lower" | null }) {
  if (!direction) return null;
  return (
    <span className="text-white font-bold text-sm leading-none">
      {direction === "higher" ? "▲" : "▼"}
    </span>
  );
}

function PitchDots({ values }: { values: number[] }) {
  if (values.length === 0) {
    return <span className="text-white/50 text-sm">—</span>;
  }
  return (
    <div className="flex gap-1.5 justify-center flex-wrap">
      {values.map((v) => (
        <span
          key={v}
          className="w-4 h-4 rounded-full inline-block shrink-0"
          style={{ backgroundColor: PITCH_COLORS[v] ?? "#818384" }}
          title={v === 1 ? "Red" : v === 2 ? "Yellow" : "Blue"}
        />
      ))}
    </div>
  );
}

function Cell({ cellKey, result, delay }: CellProps) {
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
      className={`w-full h-[104px] flex flex-col items-center justify-center gap-1 rounded-lg transition-all duration-300 ${bgColor} ${
        revealed ? "cell-flip" : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {revealed && (
        <>
          {isPitch ? (
            <PitchDots values={result.value as number[]} />
          ) : (
            <span className="text-white text-[13px] font-bold leading-tight text-center px-1 w-full break-words line-clamp-3">
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
}

const CELL_KEYS = [
  "type",
  "attack",
  "defense",
  "cost",
  "pitchValues",
  "talent",
  "heroClass",
  "rarity",
] as const;

export function GuessRow({ result, rowIndex }: GuessRowProps) {
  const BASE_DELAY = rowIndex * 50;
  const CELL_STAGGER = 120;

  return (
    <div
      className="grid items-center gap-2 w-full px-3 min-w-[880px]"
      style={{ gridTemplateColumns: "minmax(200px, 260px) repeat(8, minmax(96px, 120px))" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <CardAvatar card={result.card} size={72} className="shrink-0" />
        <div className="min-w-0">
          <span className="text-white text-sm font-semibold leading-snug line-clamp-2 block">
            {result.card.name}
          </span>
          <span className="text-[#818384] text-xs truncate block mt-0.5">
            {result.card.type}
          </span>
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
  );
}
