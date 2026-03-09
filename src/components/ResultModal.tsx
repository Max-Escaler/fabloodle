import { useState } from "react";
import type { GuessResult } from "../utils/gameLogic";
import { buildShareText } from "../utils/shareUtils";
import type { FabCard } from "../data/cards";
import { CardAvatar } from "./CardAvatar";
import type { GameStats } from "../utils/statsUtils";

const PITCH_COLORS: Record<number, string> = { 1: "#e74c3c", 2: "#f1c40f", 3: "#3498db" };
const PITCH_NAMES: Record<number, string> = { 1: "Red", 2: "Yellow", 3: "Blue" };

interface ResultModalProps {
  won: boolean;
  answer: FabCard;
  guesses: GuessResult[];
  stats: GameStats;
  onClose: () => void;
}

export function ResultModal({ won, answer, guesses, stats, onClose }: ResultModalProps) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const text = buildShareText(guesses, won);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const pitchLabel =
    answer.pitchValues.length === 0
      ? "Colorless"
      : answer.pitchValues.map((v) => PITCH_NAMES[v] ?? v).join(", ");

  const cardDetails = [
    { label: "Type",    value: answer.type },
    { label: "Attack",  value: answer.attack ?? "—" },
    { label: "Defense", value: answer.defense ?? "—" },
    { label: "Cost",    value: answer.costDisplay },
    { label: "Colors",  value: pitchLabel },
    { label: "Talent",  value: answer.talent },
    { label: "Class",   value: answer.heroClass },
    { label: "Rarity",  value: answer.rarity },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1b] border border-[#3a3a3c] rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card image + title */}
        <div className="flex flex-col items-center mb-4">
          <CardAvatar card={answer} size={100} className="mb-3 rounded-xl" />
          <p className="text-[#818384] text-sm uppercase tracking-widest mb-1">
            {won ? "🎉 Correct!" : "Today's Card"}
          </p>
          <h2 className="text-white text-2xl font-bold text-center leading-tight">
            {answer.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[#d4a843] text-sm">{answer.type}</span>
            {answer.pitchValues.length > 0 && (
              <div className="flex gap-1">
                {answer.pitchValues.map((v) => (
                  <span
                    key={v}
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: PITCH_COLORS[v] }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Streak & wins */}
        {won && (
          <div className="flex justify-center gap-6 mb-5">
            <div className="flex flex-col items-center bg-[#121213] rounded-xl px-5 py-3 min-w-[90px]">
              <span className="text-3xl font-bold text-[#d4a843] leading-none">
                {stats.streak}
              </span>
              <span className="text-[#818384] text-xs uppercase tracking-wide mt-1">
                🔥 Streak
              </span>
            </div>
            <div className="flex flex-col items-center bg-[#121213] rounded-xl px-5 py-3 min-w-[90px]">
              <span className="text-3xl font-bold text-[#538d4e] leading-none">
                {stats.totalWins}
              </span>
              <span className="text-[#818384] text-xs uppercase tracking-wide mt-1">
                ★ Total Wins
              </span>
            </div>
          </div>
        )}

        {/* Card stats grid */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {cardDetails.map((s) => (
            <div key={s.label} className="bg-[#121213] rounded-lg p-2 text-center">
              <div className="text-[#818384] text-[10px] uppercase tracking-wide mb-0.5">
                {s.label}
              </div>
              <div className="text-white text-xs font-semibold leading-tight">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Share preview */}
        <div className="bg-[#121213] rounded-lg p-3 mb-4 text-center">
          <p className="text-[#818384] text-xs mb-2 uppercase tracking-wide">Share</p>
          <pre className="text-sm text-white font-mono leading-relaxed whitespace-pre-wrap break-words">
            {buildShareText(guesses, won)}
          </pre>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-xl bg-[#538d4e] hover:bg-[#6aad65] text-white font-bold text-base transition-colors"
          >
            {copied ? "Copied! ✓" : "Copy Results"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-[#3a3a3c] hover:bg-[#4a4a4e] text-white font-bold text-base transition-colors"
          >
            Close
          </button>
        </div>

        <p className="text-center text-[#818384] text-sm mt-3">
          {won
            ? `Solved in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`
            : `Answer: ${answer.name}`}
        </p>
      </div>
    </div>
  );
}
