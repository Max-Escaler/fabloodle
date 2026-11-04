import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams, Navigate, useLocation, useNavigate, Link } from "react-router-dom";
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
import { Modal } from "../components/ui/Modal";
import { Page, PageHeader } from "../components/ui/Page";
import { PitchDots } from "../components/ui/Pitch";
import { BulbIcon, HelpIcon, TrophyIcon } from "../components/ui/icons";
import { SiteFooter } from "../components/shell/SiteFooter";
import { formatPlayDate } from "../utils/formatDate";


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
    <Modal onClose={onClose} width="max-w-xs" label="Hint" className="p-6 text-center">
      <span className="inline-grid place-items-center w-10 h-10 rounded-full bg-accent-soft text-accent-text mb-3">
        <BulbIcon size={20} />
      </span>
      <p className="eyebrow !text-accent-text mb-1">Hint</p>
      <p className="text-muted text-sm mb-4">
        The answer&apos;s <span className="text-fg font-semibold">{label}</span> is
      </p>

      <div className="flex items-center justify-center min-h-[56px] mb-5 rounded-lg bg-sunken px-3 py-3">
        {isPitch ? (
          (value as number[]).length === 0 ? (
            <span className="font-display text-lg font-bold">Colorless</span>
          ) : (
            <PitchDots values={value as number[]} dotClass="w-7 h-7" gap="gap-2" />
          )
        ) : isStringArray ? (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {(value as string[]).length === 0 ? (
              <span className="font-display text-lg font-bold">—</span>
            ) : (
              (value as string[]).map((s) => (
                <span
                  key={s}
                  className="bg-raised text-fg text-sm font-semibold rounded-sm px-2 py-0.5"
                >
                  {s}
                </span>
              ))
            )}
          </div>
        ) : (
          <span className="tnum font-display text-2xl font-bold">{String(value)}</span>
        )}
      </div>

      <button type="button" onClick={onClose} className="btn btn-primary w-full">
        Got it
      </button>
    </Modal>
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

export function PlayPageInner({ playDate }: { playDate: string }) {
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

  function openHowToPlay() {
    howToPlayOpenedFiredRef.current = true;
    trackHowToPlayOpened({ autoOpened: false });
    setShowHowToPlay(true);
  }

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

  const solved = gameState === "won";

  return (
    <>
      {toast && (
        <div
          role="status"
          className="toast-in fixed top-[calc(var(--shell-top)+12px)] left-1/2 lg:left-[calc(50%+var(--shell-left)/2)] -translate-x-1/2 z-50 panel !shadow-lg px-4 py-2.5 text-sm font-semibold"
        >
          {toast}
        </div>
      )}

      <Page width="max-w-6xl">
        <PageHeader
          eyebrow={
            isArchiveGame ? (
              <span className="inline-flex items-center gap-2">
                <span className="rounded-sm bg-accent-soft text-accent-text px-1.5 py-0.5">
                  Archive
                </span>
                <span className="tnum">{formatPlayDate(playDate)}</span>
              </span>
            ) : (
              <span className="tnum">Daily puzzle · {formatPlayDate(playDate)}</span>
            )
          }
          title={isArchiveGame ? "Guess this day's card" : "Guess today's card"}
          subtitle={
            isArchiveGame ? (
              <>
                You&apos;re playing a past puzzle.{" "}
                <Link to="/" className="font-medium text-accent-text hover:underline">
                  Play today&apos;s instead
                </Link>
              </>
            ) : (
              "Pick any Flesh and Blood card. Each guess shows how close its stats are to the answer."
            )
          }
          actions={
            <button type="button" onClick={openHowToPlay} className="btn btn-secondary btn-sm">
              <HelpIcon size={16} />
              How to play
            </button>
          }
        />

        {puzzleLoading && <p className="text-muted text-sm">Loading puzzle…</p>}
        {puzzleError && (
          <p className="panel px-4 py-3 text-loss text-sm max-w-xl">{puzzleError}</p>
        )}

        {!puzzleLoading && !puzzleError && answerCard && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 max-w-2xl">
              <CardSearch
                cards={CARDS}
                guessedIds={guessedIds}
                onSelect={handleGuess}
                disabled={solved}
              />

              <div className="flex flex-wrap items-center gap-2 min-h-8">
                <span className="tnum inline-flex items-center gap-1.5 text-sm text-muted">
                  <span className="text-fg font-semibold">{guesses.length}</span>
                  {guesses.length === 1 ? "guess" : "guesses"}
                </span>
                <div className="flex-1" />
                {gameState === "playing" && (
                  <button
                    type="button"
                    onClick={handleHintClick}
                    disabled={!canUseHint}
                    className="btn btn-secondary btn-sm"
                    title={
                      guesses.length === 0
                        ? "Make a guess first"
                        : canUseHint
                          ? "Reveal one category of the answer"
                          : "No more hints for this guess"
                    }
                  >
                    <BulbIcon size={16} />
                    {guesses.length > 0 && !canUseHint ? "No more hints" : "Get a hint"}
                  </button>
                )}
                {solved && !showModal && (
                  <button type="button" onClick={openResultsModal} className="btn btn-primary btn-sm">
                    <TrophyIcon size={16} />
                    See results
                  </button>
                )}
              </div>
            </div>

            {guesses.length > 0 ? (
              <div className="w-full lg:overflow-x-auto -mx-1 px-1">
                <GuessGrid guesses={guesses} />
              </div>
            ) : (
              <div className="panel px-5 py-8 text-center max-w-2xl">
                <p className="section-title">No guesses yet</p>
                <p className="text-sm text-muted mt-1.5">
                  Search above to make your first guess. Green tiles match the answer, amber tiles
                  are close, and arrows point toward the answer&apos;s number.
                </p>
              </div>
            )}
          </div>
        )}
      </Page>
      <SiteFooter />

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
    </>
  );
}
