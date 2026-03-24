import { useState } from "react";
import type { GuessResult } from "../utils/gameLogic";
import { getTodayString } from "../utils/dateUtils";
import { buildShareText } from "../utils/shareUtils";
import type { FabCard } from "../data/cards";
import { CardAvatar } from "./CardAvatar";
import type { GameStats } from "../utils/statsUtils";
import type { GuessStats } from "../utils/puzzleService";

const PITCH_COLORS: Record<number, string> = { 1: "#e74c3c", 2: "#f1c40f", 3: "#3498db" };

interface ResultModalProps {
  won: boolean;
  answer: FabCard;
  guesses: GuessResult[];
  stats: GameStats;
  /** Puzzle date for share text */
  playDate: string;
  /** Community average after win; null = still loading. Ignored when showGlobalAverage is false. */
  globalStats: GuessStats | null;
  /** When false, hide the global average block (offline / no Supabase). */
  showGlobalAverage?: boolean;
  onClose: () => void;
}

export function ResultModal({
  won,
  answer,
  guesses,
  stats,
  playDate,
  globalStats,
  showGlobalAverage = true,
  onClose,
}: ResultModalProps) {
  const [copied, setCopied] = useState(false);
  const isArchiveGame = playDate !== getTodayString();

  function handleShare() {
    const text = buildShareText(guesses, won, playDate);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

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
            {won ? "🎉 Correct!" : isArchiveGame ? "Archive Puzzle" : "Today's Card"}
          </p>
          <h2 className="text-white text-2xl font-bold text-center leading-tight">
            {answer.name}
          </h2>
          {isArchiveGame && (
            <p className="mt-1 text-xs uppercase tracking-wide text-[#f4d36f]">
              Puzzle date: {playDate}
            </p>
          )}
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

        {won && showGlobalAverage && (
          <div className="mb-5 text-center bg-[#121213] rounded-xl px-4 py-3">
            <p className="text-[#818384] text-[10px] uppercase tracking-wide mb-1">
              Global average (this puzzle)
            </p>
            {globalStats === null ? (
              <p className="text-[#818384] text-sm">Loading…</p>
            ) : globalStats.completionCount === 0 ? (
              <p className="text-[#818384] text-sm">No community data yet.</p>
            ) : (
              <p className="text-white text-lg font-bold">
                {globalStats.avgGuesses} guesses
                <span className="text-[#818384] text-sm font-normal ml-2">
                  ({globalStats.completionCount}{" "}
                  {globalStats.completionCount === 1 ? "player" : "players"})
                </span>
              </p>
            )}
          </div>
        )}

        {/* Share preview */}
        <div className="bg-[#121213] rounded-lg p-3 mb-4 text-center">
          <p className="text-[#818384] text-xs mb-2 uppercase tracking-wide">Share</p>
          <pre className="text-sm text-white font-mono leading-relaxed whitespace-pre-wrap break-words">
            {buildShareText(guesses, won, playDate)}
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
