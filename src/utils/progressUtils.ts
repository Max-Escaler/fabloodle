import type { GuessResult } from "./gameLogic";

type GameState = "playing" | "won";

// Bump this whenever the GuessResult shape changes (new/removed cell keys).
// Any saved data with a different version is silently discarded.
const SCHEMA_VERSION = 3;

interface SavedProgress {
  schemaVersion: number;
  date: string;         // "YYYY-MM-DD" — must match today or is discarded
  guesses: GuessResult[];
  gameState: GameState;
}

const STORAGE_KEY = "fabloodle_progress";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadProgress(): { guesses: GuessResult[]; gameState: GameState } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { guesses: [], gameState: "playing" };

    const saved: SavedProgress = JSON.parse(raw);

    // Discard progress from a previous day or an incompatible schema
    if (saved.date !== todayStr() || saved.schemaVersion !== SCHEMA_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return { guesses: [], gameState: "playing" };
    }

    return { guesses: saved.guesses, gameState: saved.gameState };
  } catch {
    return { guesses: [], gameState: "playing" };
  }
}

export function saveProgress(guesses: GuessResult[], gameState: GameState): void {
  try {
    const data: SavedProgress = { schemaVersion: SCHEMA_VERSION, date: todayStr(), guesses, gameState };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable
  }
}
