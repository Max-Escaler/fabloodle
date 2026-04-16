import type { FabCard } from "../data/cards";
import type { GuessResult, CategoryKey } from "./gameLogic";
import { evaluateGuess } from "./gameLogic";
import { updateArchiveSummary } from "./archiveSummary";

type GameState = "playing" | "won";

const SCHEMA_VERSION = 6;

interface SavedProgress {
  schemaVersion: number;
  date: string;
  cardIds: string[];
  hintedKeysByGuess: (CategoryKey[] | undefined)[];
  gameState: GameState;
}

export interface LoadedProgress {
  cardIds: string[];
  hintedKeysByGuess: (CategoryKey[] | undefined)[];
  gameState: GameState;
}

function progressStorageKey(playDate: string): string {
  return `fabloodle_progress_v3_${playDate}`;
}

/**
 * Load saved progress. Returns only the stable identifiers (card IDs, hinted
 * keys, game state) regardless of which schema version was persisted. Full
 * GuessResult objects are rebuilt later via {@link reconstructGuesses}.
 */
export function loadProgress(playDate: string): LoadedProgress {
  const empty: LoadedProgress = { cardIds: [], hintedKeysByGuess: [], gameState: "playing" };
  try {
    const raw = localStorage.getItem(progressStorageKey(playDate));
    if (!raw) return empty;

    const saved = JSON.parse(raw);
    if (saved.date !== playDate) {
      localStorage.removeItem(progressStorageKey(playDate));
      return empty;
    }

    // Current format: cardIds stored directly
    if (Array.isArray(saved.cardIds)) {
      return {
        cardIds: saved.cardIds,
        hintedKeysByGuess: saved.hintedKeysByGuess ?? [],
        gameState: saved.gameState ?? "playing",
      };
    }

    // Legacy format: extract IDs from full GuessResult objects
    if (Array.isArray(saved.guesses)) {
      const cardIds: string[] = [];
      const hintedKeysByGuess: (CategoryKey[] | undefined)[] = [];
      for (const g of saved.guesses) {
        const id = g.card?.id;
        if (id) {
          cardIds.push(id);
          hintedKeysByGuess.push(g.hintedKeys);
        }
      }
      return { cardIds, hintedKeysByGuess, gameState: saved.gameState ?? "playing" };
    }

    return empty;
  } catch {
    return empty;
  }
}

/**
 * Rebuild full GuessResult objects from card IDs using the current card data
 * and game logic. This is the only place schema-dependent objects are created,
 * so future schema changes never require migration code.
 */
export function reconstructGuesses(
  { cardIds, hintedKeysByGuess }: LoadedProgress,
  answerCard: FabCard,
  allCards: FabCard[]
): GuessResult[] {
  const cardMap = new Map(allCards.map((c) => [c.id, c]));
  const results: GuessResult[] = [];
  for (let i = 0; i < cardIds.length; i++) {
    const card = cardMap.get(cardIds[i]);
    if (!card) continue;
    const result = evaluateGuess(card, answerCard);
    const hintedKeys = hintedKeysByGuess[i];
    results.push(hintedKeys ? { ...result, hintedKeys } : result);
  }
  return results;
}

export function saveProgress(
  playDate: string,
  guesses: GuessResult[],
  gameState: GameState
): void {
  try {
    const data: SavedProgress = {
      schemaVersion: SCHEMA_VERSION,
      date: playDate,
      cardIds: guesses.map((g) => g.card.id),
      hintedKeysByGuess: guesses.map((g) => g.hintedKeys),
      gameState,
    };
    localStorage.setItem(progressStorageKey(playDate), JSON.stringify(data));
    updateArchiveSummary(playDate, gameState, guesses.length);
  } catch {
    // localStorage unavailable
  }
}
