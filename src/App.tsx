import { useState, useCallback } from "react";
import { CARDS } from "./data/cards";
import { getDailyCard } from "./utils/dateUtils";
import { evaluateGuess, isCorrectGuess, getNextHintKeyForGuess, effectiveClass } from "./utils/gameLogic";
import type { GuessResult, CategoryKey } from "./utils/gameLogic";
import { Header } from "./components/Header";
import { CardSearch } from "./components/CardSearch";
import { GuessGrid } from "./components/GuessGrid";
import { ResultModal } from "./components/ResultModal";
import type { FabCard } from "./data/cards";
import { recordWin, loadStats } from "./utils/statsUtils";
import type { GameStats } from "./utils/statsUtils";
import { loadProgress, saveProgress } from "./utils/progressUtils";

const DAILY_CARD = getDailyCard(CARDS);

type GameState = "playing" | "won";

export default function App() {
  const [guesses, setGuesses] = useState<GuessResult[]>(() => loadProgress().guesses);
  const [gameState, setGameState] = useState<GameState>(() => loadProgress().gameState);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStats>(() => loadStats());
  const [isHinting, setIsHinting] = useState(false);

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
    if (isHinting) return;

    const latestIndex = guesses.length - 1;
    const latest = guesses[latestIndex];
    const key: CategoryKey | null = getNextHintKeyForGuess(latest);
    if (key === null) return;

    setIsHinting(true);
    const hintedKeys = Array.from(new Set([...(latest.hintedKeys ?? []), key]));

    // Compute the true answer value for this category
    let hintValue: string | number | number[] | string[];
    switch (key) {
      case "type":
        hintValue = DAILY_CARD.type;
        break;
      case "subtypes":
        hintValue = DAILY_CARD.subtypes;
        break;
      case "attack":
        hintValue = DAILY_CARD.attack ?? "—";
        break;
      case "defense":
        hintValue = DAILY_CARD.defense ?? "—";
        break;
      case "cost":
        hintValue = DAILY_CARD.costDisplay;
        break;
      case "pitchValues":
        hintValue = DAILY_CARD.pitchValues;
        break;
      case "talent":
        hintValue = DAILY_CARD.talent;
        break;
      case "heroClass":
        hintValue = effectiveClass(DAILY_CARD);
        break;
      case "keywords":
        hintValue = DAILY_CARD.keywords;
        break;
      case "set":
        hintValue = DAILY_CARD.set;
        break;
      default:
        hintValue = latest.cells[key].value;
        break;
    }

    const updatedCells: GuessResult["cells"] = {
      ...latest.cells,
      [key]: { ...latest.cells[key], value: hintValue },
    };

    const updated: GuessResult = { ...latest, hintedKeys, cells: updatedCells };
    const newGuesses = [...guesses];
    newGuesses[latestIndex] = updated;
    setGuesses(newGuesses);
    saveProgress(newGuesses, gameState);
    setIsHinting(false);
  }, [gameState, guesses, isHinting]);

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
          <span className="flex items-center gap-2 text-white/40">
            <span className="w-4 h-4 rounded-sm border border-[#d4a843] inline-block" />
            Hint used
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
            disabled={!canUseHint || isHinting}
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
