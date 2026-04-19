import { useEffect, useState } from "react";
import type { GuessResult } from "../utils/gameLogic";
import { getTodayString } from "../utils/dateUtils";
import { buildShareText } from "../utils/shareUtils";
import { trackShareClicked } from "../utils/analytics";
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
  const [avatarSize, setAvatarSize] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches
      ? 76
      : 96
  );
  const isArchiveGame = playDate !== getTodayString();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 480px)");
    const sync = () => setAvatarSize(mq.matches ? 76 : 96);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  function handleShare() {
    const text = buildShareText(guesses, won, playDate);
    trackShareClicked({
      playDate,
      won,
      guessCount: guesses.length,
    });
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
        className="bg-[#1a1a1b] border border-[#3a3a3c] rounded-2xl p-4 sm:p-5 w-full max-w-md shadow-2xl max-h-[min(92dvh,640px)] flex flex-col min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-3">
          {/* Win: image + title left, stats right. Loss: centered header only */}
          {won ? (
            <div className="flex gap-3 items-start">
              <div className="flex flex-col items-center shrink-0 max-w-[45%] min-w-0">
                <CardAvatar
                  card={answer}
                  size={avatarSize}
                  className="rounded-xl mb-2"
                />
                <p className="text-[#818384] text-[10px] sm:text-xs uppercase tracking-widest mb-0.5 text-center leading-tight">
                  🎉 Correct!
                </p>
                <h2 className="text-white text-base sm:text-lg font-bold text-center leading-tight">
                  {answer.name}
                </h2>
                {isArchiveGame && (
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#f4d36f] text-center">
                    {playDate}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                  <span className="text-[#d4a843] text-xs">{answer.type}</span>
                  {answer.pitchValues.length > 0 && (
                    <div className="flex gap-0.5">
                      {answer.pitchValues.map((v) => (
                        <span
                          key={v}
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: PITCH_COLORS[v] }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center bg-[#121213] rounded-lg px-2 py-2">
                    <span className="text-xl sm:text-2xl font-bold text-[#d4a843] leading-none">
                      {stats.streak}
                    </span>
                    <span className="text-[#818384] text-[9px] uppercase tracking-wide mt-0.5 text-center leading-tight">
                      🔥 Streak
                    </span>
                  </div>
                  <div className="flex flex-col items-center bg-[#121213] rounded-lg px-2 py-2">
                    <span className="text-xl sm:text-2xl font-bold text-[#538d4e] leading-none">
                      {stats.totalWins}
                    </span>
                    <span className="text-[#818384] text-[9px] uppercase tracking-wide mt-0.5 text-center leading-tight">
                      ★ Wins
                    </span>
                  </div>
                </div>

                {showGlobalAverage && (
                  <div className="text-center bg-[#121213] rounded-lg px-2 py-2">
                    <p className="text-[#818384] text-[9px] uppercase tracking-wide mb-0.5 leading-tight">
                      Global avg (this puzzle)
                    </p>
                    {globalStats === null ? (
                      <p className="text-[#818384] text-xs">Loading…</p>
                    ) : globalStats.completionCount === 0 ? (
                      <p className="text-[#818384] text-xs leading-tight">No data yet.</p>
                    ) : (
                      <p className="text-white text-sm font-bold leading-tight">
                        {globalStats.avgGuesses} guesses
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <CardAvatar card={answer} size={avatarSize} className="mb-2 rounded-xl" />
              <p className="text-[#818384] text-xs uppercase tracking-widest mb-1 text-center">
                {isArchiveGame ? "Archive Puzzle" : "Today's Card"}
              </p>
              <h2 className="text-white text-xl font-bold text-center leading-tight">
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
          )}

          {/* Share preview — full width under the row above */}
          <div className="bg-[#121213] rounded-lg p-2 sm:p-3 text-center">
            <p className="text-[#818384] text-[10px] sm:text-xs mb-1 uppercase tracking-wide">
              Share
            </p>
            <pre className="text-[11px] sm:text-sm text-white font-mono leading-snug whitespace-pre-wrap break-words max-h-[4.5rem] sm:max-h-[5.5rem] overflow-y-auto">
              {buildShareText(guesses, won, playDate)}
            </pre>
          </div>
        </div>

        {/* Buttons + summary — stays visible at bottom of modal */}
        <div className="shrink-0 pt-3 space-y-2 border-t border-[#2a2a2b]">
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleShare}
              className="flex-1 py-2.5 sm:py-3 rounded-xl bg-[#538d4e] hover:bg-[#6aad65] text-white font-bold text-sm sm:text-base transition-colors"
            >
              {copied ? "Copied! ✓" : "Copy Results"}
            </button>
            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#3a3a3c] hover:bg-[#4a4a4e] text-white font-bold text-sm sm:text-base transition-colors"
            >
              Close
            </button>
          </div>
          <p className="text-center text-[#818384] text-xs sm:text-sm">
            {won
              ? `Solved in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`
              : `Answer: ${answer.name}`}
          </p>
        </div>
      </div>
    </div>
  );
}
