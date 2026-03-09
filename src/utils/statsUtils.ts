export interface GameStats {
  streak: number;
  totalWins: number;
  lastWinDate: string | null; // "YYYY-MM-DD"
}

const STORAGE_KEY = "fabloodle_stats";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { streak: 0, totalWins: 0, lastWinDate: null };
    return JSON.parse(raw) as GameStats;
  } catch {
    return { streak: 0, totalWins: 0, lastWinDate: null };
  }
}

/**
 * Call once when the player wins today's puzzle.
 * Safe to call multiple times — duplicate wins on the same date are ignored.
 * Returns the updated stats.
 */
export function recordWin(): GameStats {
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86_400_000));

  const current = loadStats();

  // Already counted today's win — return as-is
  if (current.lastWinDate === today) return current;

  const newStreak =
    current.lastWinDate === yesterday
      ? current.streak + 1 // continued streak
      : 1;                 // first win or broken streak

  const updated: GameStats = {
    streak: newStreak,
    totalWins: current.totalWins + 1,
    lastWinDate: today,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private browsing, storage full, etc.)
  }

  return updated;
}
