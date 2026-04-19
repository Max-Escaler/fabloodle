import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams, Navigate, useLocation, useNavigate } from "react-router-dom";
import { CARDS } from "../data/cards";
import { getDailyCardForDate, getTodayString } from "../utils/dateUtils";
import {
  evaluateGuess,
  isCorrectGuess,
  getNextHintKeyForGuess,
  effectiveClass,
} from "../utils/gameLogic";
import { getCardReleases } from "../utils/cardReleases";
import type { GuessResult, CategoryKey, CellResult } from "../utils/gameLogic";
import { Header } from "../components/Header";
import { CardSearch } from "../components/CardSearch";
import { GuessGrid } from "../components/GuessGrid";
import { ResultModal } from "../components/ResultModal";
import { HowToPlayModal } from "../components/HowToPlayModal";
import type { FabCard } from "../data/cards";
import { recordWin, loadStats } from "../utils/statsUtils";
import type { GameStats } from "../utils/statsUtils";
import { loadProgress, reconstructGuesses, saveProgress } from "../utils/progressUtils";
import { isValidPlayDate } from "../utils/playDate";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  fetchCardIdForDate,
  submitGameCompletion,
  fetchGuessStats,
} from "../utils/puzzleService";
import type { GuessStats } from "../utils/puzzleService";
import { isHowToPlayDismissed } from "../utils/howToPlayStorage";
import {
  trackGuessSubmitted,
  trackPuzzleStarted,
  trackPuzzleWon,
  trackHintUsed,
  trackResultModalOpened,
  trackHowToPlayOpened,
} from "../utils/analytics";

const PITCH_COLORS: Record<number, string> = { 1: "#e74c3c", 2: "#f1c40f", 3: "#3498db" };
const PITCH_NAMES: Record<number, string> = { 1: "Red", 2: "Yellow", 3: "Blue" };

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  type: "Type",
  subtypes: "Subtype",
  attack: "Attack",
  defense: "Defense",
  cost: "Cost",
  pitchValues: "Colors",
  talent: "Talent",
  heroClass: "Class",
  keywords: "Keywords",
  releases: "Sets",
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
        <p className="text-[#818384] text-sm mb-4">
          The correct <span className="text-white font-semibold">{label}</span> is:
        </p>

        <div className="flex items-center justify-center min-h-[48px] mb-5">
          {isPitch ? (
            <div className="flex gap-2 justify-center">
              {(value as number[]).length === 0 ? (
                <span className="text-white text-lg font-bold">Colorless</span>
              ) : (
                (value as number[]).map((v) => (
                  <span
                    key={v}
                    className="w-7 h-7 rounded-full inline-block"
                    style={{ backgroundColor: PITCH_COLORS[v] }}
                    title={PITCH_NAMES[v]}
                  />
                ))
              )}
            </div>
          ) : isStringArray ? (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {(value as string[]).length === 0 ? (
                <span className="text-white text-lg font-bold">—</span>
              ) : (
                (value as string[]).map((s) => (
                  <span
                    key={s}
                    className="bg-white/10 text-white text-sm font-semibold rounded px-2 py-0.5"
                  >
                    {s}
                  </span>
                ))
              )}
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

type GameState = "playing" | "won";

export function PlayPage() {
  const { date: dateParam } = useParams<{ date?: string }>();
  if (dateParam && !isValidPlayDate(dateParam)) {
    return <Navigate to="/" replace />;
  }
  const playDate = dateParam ?? getTodayString();
  return <PlayPageInner key={playDate} playDate={playDate} />;
}

function PlayPageInner({ playDate }: { playDate: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isArchiveGame = playDate !== getTodayString();
  const savedProgress = useMemo(() => loadProgress(playDate), [playDate]);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [gameState, setGameState] = useState<GameState>(savedProgress.gameState);
  const [answerCard, setAnswerCard] = useState<FabCard | null>(null);
  const [puzzleError, setPuzzleError] = useState<string | null>(null);
  const [puzzleLoading, setPuzzleLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStats>(() => loadStats());
  const [hintPopup, setHintPopup] = useState<HintPopupData | null>(null);
  const [globalStats, setGlobalStats] = useState<GuessStats | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(() => !isHowToPlayDismissed());

  const completionSentRef = useRef(false);
  // Once we submit a guess from the Card Browser flow, `handleGuess`'s
  // useCallback identity changes (its deps include `guesses`) which re-fires
  // the effect below before react-router has committed our state-clearing
  // navigate(). This ref de-dupes by guessCardId so we don't submit twice and
  // trigger a spurious "Already guessed!" toast.
  const processedGuessCardIdRef = useRef<string | null>(null);
  // StrictMode-safe marker so we fire puzzle_started at most once per playDate.
  const puzzleStartedFiredRef = useRef<string | null>(null);
  // Prevents duplicate result_modal_opened events when the modal reopens.
  const prevShowModalRef = useRef(false);
  const manualModalOpenRef = useRef(false);
  const howToPlayOpenedFiredRef = useRef(false);

  useEffect(() => {
    if (showHowToPlay && !howToPlayOpenedFiredRef.current) {
      howToPlayOpenedFiredRef.current = true;
      trackHowToPlayOpened({ autoOpened: true });
    }
  }, [showHowToPlay]);

  useEffect(() => {
    if (gameState !== "won" || !isSupabaseConfigured()) return;
    void fetchGuessStats(playDate).then(setGlobalStats);
  }, [playDate, gameState]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setPuzzleError(null);
      setAnswerCard(null);
      setPuzzleLoading(true);
      let card: FabCard | undefined;
      if (isSupabaseConfigured()) {
        const id = await fetchCardIdForDate(playDate);
        if (cancelled) return;
        if (!id) {
          setPuzzleError("No puzzle for this date. Add a row in Supabase daily_puzzles.");
          setPuzzleLoading(false);
          return;
        }
        card = CARDS.find((c) => c.id === id);
        if (!card) {
          setPuzzleError("Puzzle card id is not in this app's card list.");
          setPuzzleLoading(false);
          return;
        }
      } else {
        card = getDailyCardForDate(CARDS, playDate);
      }
      if (cancelled) return;
      setAnswerCard(card);
      if (savedProgress.cardIds.length > 0) {
        setGuesses(reconstructGuesses(savedProgress, card, CARDS));
      }
      setPuzzleLoading(false);
      if (puzzleStartedFiredRef.current !== playDate) {
        puzzleStartedFiredRef.current = playDate;
        trackPuzzleStarted({
          playDate,
          isArchive: isArchiveGame,
          resumed: savedProgress.cardIds.length > 0,
          initialGuessCount: savedProgress.cardIds.length,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playDate, savedProgress]);

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.card.id)), [guesses]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  const handleGuess = useCallback(
    (card: FabCard) => {
      if (!answerCard) return;
      if (gameState !== "playing") return;
      if (guessedIds.has(card.id)) {
        showToast("Already guessed!");
        return;
      }

      const result = evaluateGuess(card, answerCard);
      const newGuesses = [...guesses, result];

      trackGuessSubmitted({
        playDate,
        guessNumber: newGuesses.length,
        won: result.isExactMatch,
      });

      if (result.isExactMatch) {
        const newState: GameState = "won";
        setGuesses(newGuesses);
        setGameState(newState);
        saveProgress(playDate, newGuesses, newState);
        const updated = recordWin();
        setStats(updated);
        setGlobalStats(null);

        const hintCount = newGuesses.reduce(
          (sum, g) => sum + (g.hintedKeys?.length ?? 0),
          0
        );
        trackPuzzleWon({
          playDate,
          isArchive: isArchiveGame,
          guessCount: newGuesses.length,
          hintCount,
        });

        if (isSupabaseConfigured() && !completionSentRef.current) {
          completionSentRef.current = true;
          void (async () => {
            await submitGameCompletion(playDate, newGuesses.length);
            const s = await fetchGuessStats(playDate);
            setGlobalStats(s);
          })();
        }

        setTimeout(
          () => setShowModal(true),
          newGuesses.length * 50 + 10 * 120 + 500
        );
      } else {
        setGuesses(newGuesses);
        saveProgress(playDate, newGuesses, "playing");
        if (isCorrectGuess(result)) {
          showToast("Same stats — but that's not the card!");
        }
      }
    },
    [answerCard, gameState, guesses, guessedIds, playDate, isArchiveGame]
  );

  const canUseHint =
    gameState === "playing" &&
    guesses.length > 0 &&
    getNextHintKeyForGuess(guesses[guesses.length - 1]) !== null;

  const handleHintClick = useCallback(() => {
    if (!answerCard) return;
    if (gameState !== "playing") return;
    if (guesses.length === 0) return;

    const latestIndex = guesses.length - 1;
    const latest = guesses[latestIndex];
    const key: CategoryKey | null = getNextHintKeyForGuess(latest);
    if (key === null) return;

    const hintedKeys = Array.from(new Set([...(latest.hintedKeys ?? []), key]));
    const updated: GuessResult = { ...latest, hintedKeys };
    const newGuesses = [...guesses];
    newGuesses[latestIndex] = updated;
    setGuesses(newGuesses);
    saveProgress(playDate, newGuesses, gameState);

    let hintValue: CellResult["value"];
    switch (key) {
      case "type":
        hintValue = answerCard.type;
        break;
      case "subtypes":
        hintValue = answerCard.subtypes;
        break;
      case "attack":
        hintValue = answerCard.attack ?? "—";
        break;
      case "defense":
        hintValue = answerCard.defense ?? "—";
        break;
      case "cost":
        hintValue = answerCard.costDisplay;
        break;
      case "pitchValues":
        hintValue = answerCard.pitchValues;
        break;
      case "talent":
        hintValue = answerCard.talent;
        break;
      case "heroClass":
        hintValue = effectiveClass(answerCard);
        break;
      case "keywords":
        hintValue = answerCard.keywords;
        break;
      case "releases":
        hintValue = getCardReleases(answerCard).map((r) => String(r));
        break;
    }
    setHintPopup({ label: CATEGORY_LABELS[key], value: hintValue });
    trackHintUsed({
      playDate,
      guessNumber: guesses.length,
      hintCategory: key,
    });
  }, [answerCard, gameState, guesses, playDate]);

  const openResultsModal = useCallback(() => {
    manualModalOpenRef.current = true;
    setShowModal(true);
    if (gameState === "won" && globalStats === null && isSupabaseConfigured()) {
      void fetchGuessStats(playDate).then(setGlobalStats);
    }
  }, [gameState, globalStats, playDate]);

  useEffect(() => {
    if (showModal && !prevShowModalRef.current) {
      const trigger: "auto" | "manual" = manualModalOpenRef.current ? "manual" : "auto";
      manualModalOpenRef.current = false;
      trackResultModalOpened({
        won: gameState === "won",
        playDate,
        guessCount: guesses.length,
        trigger,
      });
    }
    prevShowModalRef.current = showModal;
  }, [showModal, gameState, playDate, guesses.length]);

  // If the user came back from the Card Browser with a card to guess,
  // submit it once the puzzle is loaded, then clear the state so a refresh
  // doesn't re-submit the same guess.
  useEffect(() => {
    const id = (location.state as { guessCardId?: string } | null)?.guessCardId;
    if (!id || !answerCard) return;
    if (processedGuessCardIdRef.current === id) return;
    processedGuessCardIdRef.current = id;
    const card = CARDS.find((c) => c.id === id);
    if (card) handleGuess(card);
    navigate(location.pathname, { replace: true, state: null });
  }, [answerCard, location.state, location.pathname, handleGuess, navigate]);

  return (
    <div className="min-h-screen bg-[#121213] flex flex-col">
      <Header playDate={playDate} isArchiveGame={isArchiveGame} />

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-sm font-bold px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <main className="flex-1 flex flex-col items-center gap-4 sm:gap-6 pt-4 sm:pt-6 pb-10 px-3 sm:px-4 w-full">
        {puzzleLoading && (
          <p className="text-[#818384] text-sm">Loading puzzle…</p>
        )}
        {puzzleError && (
          <p className="text-red-400/90 text-sm text-center max-w-md px-4">{puzzleError}</p>
        )}

        {!puzzleLoading && !puzzleError && answerCard && (
          <>
            {isArchiveGame && (
              <div className="w-full max-w-2xl rounded-xl border border-[#d4a843]/30 bg-[#d4a843]/10 px-4 py-3 text-center">
                <p className="text-[#f4d36f] text-xs font-semibold uppercase tracking-[0.2em]">
                  Archive Puzzle
                </p>
                <p className="mt-1 text-sm text-[#d7d7d7]">
                  You are playing the puzzle from <span className="font-semibold text-white">{playDate}</span>, not today&apos;s game.
                </p>
              </div>
            )}

            <div className="w-full max-w-2xl">
              <CardSearch
                cards={CARDS}
                guessedIds={guessedIds}
                onSelect={handleGuess}
                disabled={gameState !== "playing"}
              />
            </div>

            <div className="text-[#818384] text-sm">
              {guesses.length} {guesses.length === 1 ? "guess" : "guesses"}
            </div>

            {gameState === "playing" && (
              <button
                onClick={handleHintClick}
                disabled={!canUseHint}
                className="px-4 py-2 bg-[#3a3a3c] disabled:bg-[#202022] disabled:text-[#555] hover:bg-[#4a4a4e] text-white font-semibold rounded-lg text-sm transition-colors"
              >
                {canUseHint ? "Get a hint" : "No more hints"}
              </button>
            )}

            {guesses.length > 0 && (
              <div className="w-full max-w-[1280px] sm:overflow-x-auto">
                <GuessGrid guesses={guesses} />
              </div>
            )}

            {gameState === "won" && !showModal && (
              <button
                onClick={openResultsModal}
                className="mt-2 px-8 py-4 bg-[#538d4e] hover:bg-[#6aad65] text-white font-bold rounded-lg text-base transition-colors"
              >
                🎉 See Results
              </button>
            )}
          </>
        )}
      </main>

      {hintPopup && (
        <HintPopup data={hintPopup} onClose={() => setHintPopup(null)} />
      )}

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {showModal && answerCard && (
        <ResultModal
          won={gameState === "won"}
          answer={answerCard}
          guesses={guesses}
          stats={stats}
          playDate={playDate}
          globalStats={globalStats}
          showGlobalAverage={isSupabaseConfigured()}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
