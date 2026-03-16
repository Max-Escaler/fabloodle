import { useState, useCallback } from "react";
import { CARDS } from "./data/cards";
import { getDailyCard } from "./utils/dateUtils";
import { evaluateGuess, isCorrectGuess, getNextHintKeyForGuess, effectiveClass } from "./utils/gameLogic";
import type { GuessResult, CategoryKey, CellResult } from "./utils/gameLogic";
import { Header } from "./components/Header";
import { CardSearch } from "./components/CardSearch";
import { GuessGrid } from "./components/GuessGrid";
import { ResultModal } from "./components/ResultModal";
import type { FabCard } from "./data/cards";
import { recordWin, loadStats } from "./utils/statsUtils";
import type { GameStats } from "./utils/statsUtils";
import { loadProgress, saveProgress } from "./utils/progressUtils";

const PITCH_COLORS: Record<number, string> = { 1: "#e74c3c", 2: "#f1c40f", 3: "#3498db" };
const PITCH_NAMES: Record<number, string> = { 1: "Red", 2: "Yellow", 3: "Blue" };

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  type:        "Type",
  subtypes:    "Subtype",
  attack:      "Attack",
  defense:     "Defense",
  cost:        "Cost",
  pitchValues: "Colors",
  talent:      "Talent",
  heroClass:   "Class",
  keywords:    "Keywords",
  set:         "Set",
};

interface HintPopupData {
  label: string;
  value: CellResult["value"];
}

function HintPopup({ data, onClose }: { data: HintPopupData; onClose: () => void }) {
  const { label, value } = data;
  const isArray = Array.isArray(value);
  const isPitch = isArray && (value as unknown[]).every((v) => typeof v === "number");
  const isStringArray = isArray && !isPitch;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1b] border border-[#d4a843] rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[#d4a843] text-xs font-bold uppercase tracking-widest mb-1">Hint</p>
        <p className="text-[#818384] text-sm mb-4">The correct <span className="text-white font-semibold">{label}</span> is:</p>

        <div className="flex items-center justify-center min-h-[48px] mb-5">
          {isPitch ? (
            <div className="flex gap-2 justify-center">
              {(value as number[]).length === 0
                ? <span className="text-white text-lg font-bold">Colorless</span>
                : (value as number[]).map((v) => (
                    <span
                      key={v}
                      className="w-7 h-7 rounded-full inline-block"
                      style={{ backgroundColor: PITCH_COLORS[v] }}
                      title={PITCH_NAMES[v]}
                    />
                  ))
              }
            </div>
          ) : isStringArray ? (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {(value as string[]).length === 0
                ? <span className="text-white text-lg font-bold">—</span>
                : (value as string[]).map((s) => (
                    <span key={s} className="bg-white/10 text-white text-sm font-semibold rounded px-2 py-0.5">
                      {s}
                    </span>
                  ))
              }
            </div>
          ) : (
            <span className="text-white text-2xl font-bold">{String(value)}</span>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#3a3a3c] hover:bg-[#4a4a4e] text-white font-bold text-sm transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

const DAILY_CARD = getDailyCard(CARDS);

type GameState = "playing" | "won";

export default function App() {
  const [guesses, setGuesses] = useState<GuessResult[]>(() => loadProgress().guesses);
  const [gameState, setGameState] = useState<GameState>(() => loadProgress().gameState);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStats>(() => loadStats());
  const [hintPopup, setHintPopup] = useState<HintPopupData | null>(null);

  const guessedIds = new Set(guesses.map((g) => g.card.id));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  const handleGuess = useCallback(
    (card: FabCard) => {
      if (gameState !== "playing") return;
      if (guessedIds.has(card.id)) {
        showToast("Already guessed!");
        return;
      }

      const result = evaluateGuess(card, DAILY_CARD);
      const newGuesses = [...guesses, result];

      if (result.isExactMatch) {
        const newState: GameState = "won";
        setGuesses(newGuesses);
        setGameState(newState);
        saveProgress(newGuesses, newState);
        const updated = recordWin();
        setStats(updated);
        setTimeout(
          () => setShowModal(true),
          newGuesses.length * 50 + 8 * 120 + 500
        );
      } else {
        setGuesses(newGuesses);
        saveProgress(newGuesses, "playing");
        if (isCorrectGuess(result)) {
          showToast("Same stats — but that's not the card!");
        }
      }
    },
    [gameState, guesses, guessedIds]
  );

  const canUseHint =
    gameState === "playing" &&
    guesses.length > 0 &&
    getNextHintKeyForGuess(guesses[guesses.length - 1]) !== null;

  const handleHintClick = useCallback(() => {
    if (gameState !== "playing") return;
    if (guesses.length === 0) return;

    const latestIndex = guesses.length - 1;
    const latest = guesses[latestIndex];
    const key: CategoryKey | null = getNextHintKeyForGuess(latest);
    if (key === null) return;

    // Track this key as hinted so the next click moves to the next category
    const hintedKeys = Array.from(new Set([...(latest.hintedKeys ?? []), key]));
    const updated: GuessResult = { ...latest, hintedKeys };
    const newGuesses = [...guesses];
    newGuesses[latestIndex] = updated;
    setGuesses(newGuesses);
    saveProgress(newGuesses, gameState);

    // Compute the true answer value for this category and show the popup
    let hintValue: CellResult["value"];
    switch (key) {
      case "type":      hintValue = DAILY_CARD.type; break;
      case "subtypes":  hintValue = DAILY_CARD.subtypes; break;
      case "attack":    hintValue = DAILY_CARD.attack ?? "—"; break;
      case "defense":   hintValue = DAILY_CARD.defense ?? "—"; break;
      case "cost":      hintValue = DAILY_CARD.costDisplay; break;
      case "pitchValues": hintValue = DAILY_CARD.pitchValues; break;
      case "talent":    hintValue = DAILY_CARD.talent; break;
      case "heroClass": hintValue = effectiveClass(DAILY_CARD); break;
      case "keywords":  hintValue = DAILY_CARD.keywords; break;
      default:          hintValue = DAILY_CARD.set; break;
    }
    setHintPopup({ label: CATEGORY_LABELS[key], value: hintValue });
  }, [gameState, guesses]);

  return (
    <div className="min-h-screen bg-[#121213] flex flex-col">
      <Header />

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-sm font-bold px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <main className="flex-1 flex flex-col items-center gap-4 sm:gap-6 pt-4 sm:pt-6 pb-10 px-3 sm:px-4 w-full">
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-5 text-sm text-[#818384]">
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-sm bg-[#538d4e] inline-block" />
            Correct
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-sm bg-[#b59f3b] inline-block" />
            Close
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-sm bg-[#3a3a3c] inline-block" />
            Wrong
          </span>
          <span className="flex items-center gap-2 text-white/40">
            ▲▼ = higher / lower
          </span>
        </div>

        {/* Search */}
        <div className="w-full max-w-2xl">
          <CardSearch
            cards={CARDS}
            guessedIds={guessedIds}
            onSelect={handleGuess}
            disabled={gameState !== "playing"}
          />
        </div>

        {/* Guess counter */}
        <div className="text-[#818384] text-sm">
          {guesses.length} {guesses.length === 1 ? "guess" : "guesses"}
        </div>

        {/* Hint button */}
        {gameState === "playing" && (
          <button
            onClick={handleHintClick}
            disabled={!canUseHint}
            className="px-4 py-2 bg-[#3a3a3c] disabled:bg-[#202022] disabled:text-[#555] hover:bg-[#4a4a4e] text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {canUseHint ? "Get a hint" : "No more hints"}
          </button>
        )}

        {/* Guess grid — stacked on mobile, horizontal on desktop */}
        {guesses.length > 0 && (
          <div className="w-full max-w-[1280px] sm:overflow-x-auto">
            <GuessGrid guesses={guesses} />
          </div>
        )}

        {/* Show results button after win */}
        {gameState === "won" && !showModal && (
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 px-8 py-4 bg-[#538d4e] hover:bg-[#6aad65] text-white font-bold rounded-lg text-base transition-colors"
          >
            🎉 See Results
          </button>
        )}
      </main>

      {hintPopup && (
        <HintPopup data={hintPopup} onClose={() => setHintPopup(null)} />
      )}

      {showModal && (
        <ResultModal
          won={gameState === "won"}
          answer={DAILY_CARD}
          guesses={guesses}
          stats={stats}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
