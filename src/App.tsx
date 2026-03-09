import { useState, useCallback } from "react";
import { CARDS } from "./data/cards";
import { getDailyCard } from "./utils/dateUtils";
import { evaluateGuess, isCorrectGuess } from "./utils/gameLogic";
import type { GuessResult } from "./utils/gameLogic";
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

      if (isCorrectGuess(result)) {
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
      }
    },
    [gameState, guesses, guessedIds]
  );

  return (
    <div className="min-h-screen bg-[#121213] flex flex-col">
      <Header />

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-sm font-bold px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <main className="flex-1 flex flex-col items-center gap-6 pt-6 pb-10 px-4 w-full">
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

        {/* Guess grid — centered, scrolls horizontally on small screens */}
        {guesses.length > 0 && (
          <div className="w-full max-w-[1280px] overflow-x-auto">
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
