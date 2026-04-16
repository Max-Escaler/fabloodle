import type { GuessResult } from "./gameLogic";
import { updateArchiveSummary } from "./archiveSummary";

type GameState = "playing" | "won";

const SCHEMA_VERSION = 5;

interface SavedProgress {
  schemaVersion: number;
  date: string;
  guesses: GuessResult[];
  gameState: GameState;
}

function progressStorageKey(playDate: string): string {
  return `fabloodle_progress_v3_${playDate}`;
}

/**
 * Migrate saved guesses from schema v4 (heroClass as string) to v5 (heroClass
 * as string[]). Touches both the card object and the heroClass cell value on
 * every guess.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateV4toV5(saved: any): SavedProgress {
  for (const g of saved.guesses) {
    if (typeof g.card?.heroClass === "string") {
      g.card.heroClass = [g.card.heroClass];
    }
    const hcCell = g.cells?.heroClass;
    if (hcCell && typeof hcCell.value === "string") {
      hcCell.value = [hcCell.value];
    }
  }
  saved.schemaVersion = SCHEMA_VERSION;
  return saved as SavedProgress;
}

export function loadProgress(playDate: string): { guesses: GuessResult[]; gameState: GameState } {
  try {
    const raw = localStorage.getItem(progressStorageKey(playDate));
    if (!raw) return { guesses: [], gameState: "playing" };

    let saved = JSON.parse(raw);

    if (saved.date !== playDate) {
      localStorage.removeItem(progressStorageKey(playDate));
      return { guesses: [], gameState: "playing" };
    }

    if (saved.schemaVersion === 4) {
      saved = migrateV4toV5(saved);
      localStorage.setItem(progressStorageKey(playDate), JSON.stringify(saved));
    }

    if (saved.schemaVersion !== SCHEMA_VERSION) {
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
