import { useEffect, useState, type ReactNode } from "react";
import type { GuessResult } from "../utils/gameLogic";
import { getTodayString } from "../utils/dateUtils";
import { buildShareText } from "../utils/shareUtils";
import { trackShareClicked } from "../utils/analytics";
import type { FabCard } from "../data/cards";
import { CardAvatar } from "./CardAvatar";
import type { GameStats } from "../utils/statsUtils";
import type { GuessStats } from "../utils/puzzleService";
import { Modal, ModalClose } from "./ui/Modal";
import { PitchDots } from "./ui/Pitch";
import { CheckIcon, CopyIcon } from "./ui/icons";
import { formatPlayDate } from "../utils/formatDate";

function Stat({ value, label, tone = "text-fg" }: { value: ReactNode; label: string; tone?: string }) {
  return (
    <div className="flex flex-col rounded-md bg-sunken px-3 py-2.5 min-w-0">
      <span className={`tnum font-display text-2xl font-bold leading-none ${tone}`}>{value}</span>
      <span className="eyebrow mt-1.5 !text-[10px] truncate">{label}</span>
    </div>
  );
}



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
      ? 64
      : 76
  );
  const isArchiveGame = playDate !== getTodayString();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 480px)");
    const sync = () => setAvatarSize(mq.matches ? 64 : 76);
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

  const guessWord = guesses.length === 1 ? "guess" : "guesses";

  return (
    <Modal
      onClose={onClose}
      label="Results"
      className="max-h-[min(92dvh,680px)] flex flex-col min-h-0"
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <p className="eyebrow !text-accent-text">
            {won ? "Solved" : isArchiveGame ? "Archive puzzle" : "Today's card"}
            {isArchiveGame && <span className="tnum text-muted"> · {formatPlayDate(playDate)}</span>}
          </p>
          <h2 className="page-title !text-2xl mt-1">
            {won ? `Got it in ${guesses.length}` : answer.name}
          </h2>
        </div>
        <ModalClose onClick={onClose} className="-mr-2 -mt-1" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-4 space-y-4">
        <div className="flex gap-4 items-center">
          <CardAvatar card={answer} size={avatarSize} className="rounded-md shadow-md" />
          <div className="min-w-0 flex-1">
            <p className="section-title leading-tight">{answer.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-muted text-sm">{answer.type.join(" // ")}</span>
              <PitchDots values={answer.pitchValues} dotClass="w-3 h-3" />
            </div>
            {won && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Stat value={stats.streak} label="Streak" tone="text-accent-text" />
                <Stat value={stats.totalWins} label="Wins" tone="text-gain" />
              </div>
            )}
          </div>
        </div>

        {won && showGlobalAverage && (
          <div className="flex items-center justify-between gap-3 rounded-md bg-sunken px-3 py-2.5">
            <span className="eyebrow !text-[10px]">Everyone&apos;s average</span>
            {globalStats === null ? (
              <span className="text-muted text-sm">Loading…</span>
            ) : globalStats.completionCount === 0 ? (
              <span className="text-muted text-sm">No data yet</span>
            ) : (
              <span className="tnum text-sm font-semibold">{globalStats.avgGuesses} guesses</span>
            )}
          </div>
        )}

        <div>
          <p className="eyebrow mb-1.5">Share</p>
          <pre className="rounded-md bg-sunken px-3 py-2.5 text-[12px] sm:text-[13px] font-mono leading-snug whitespace-pre-wrap break-words max-h-[6rem] overflow-y-auto">
            {buildShareText(guesses, won, playDate)}
          </pre>
        </div>
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-line flex gap-2">
        <button type="button" onClick={handleShare} className="btn btn-primary flex-1">
          {copied ? <CheckIcon size={17} /> : <CopyIcon size={17} />}
          {copied ? "Copied" : "Copy results"}
        </button>
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Close
        </button>
      </div>
      <span className="sr-only">
        {won ? `Solved in ${guesses.length} ${guessWord}` : `Answer: ${answer.name}`}
      </span>
    </Modal>
  );
}
