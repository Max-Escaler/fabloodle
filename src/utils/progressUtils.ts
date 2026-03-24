import type { GuessResult } from "./gameLogic";
import { updateArchiveSummary } from "./archiveSummary";

type GameState = "playing" | "won";

const SCHEMA_VERSION = 3;

interface SavedProgress {
  schemaVersion: number;
  date: string;
  guesses: GuessResult[];
  gameState: GameState;
}

function progressStorageKey(playDate: string): string {
  return `fabloodle_progress_v3_${playDate}`;
}

export function loadProgress(playDate: string): { guesses: GuessResult[]; gameState: GameState } {
  try {
    const raw = localStorage.getItem(progressStorageKey(playDate));
    if (!raw) return { guesses: [], gameState: "playing" };

    const saved: SavedProgress = JSON.parse(raw);

    if (saved.date !== playDate || saved.schemaVersion !== SCHEMA_VERSION) {
      localStorage.removeItem(progressStorageKey(playDate));
      return { guesses: [], gameState: "playing" };
    }

    return { guesses: saved.guesses, gameState: saved.gameState };
  } catch {
    return { guesses: [], gameState: "playing" };
  }
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
      guesses,
      gameState,
    };
    localStorage.setItem(progressStorageKey(playDate), JSON.stringify(data));
    updateArchiveSummary(playDate, gameState, guesses.length);
  } catch {
    // localStorage unavailable
  }
}
