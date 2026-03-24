const SUMMARY_KEY = "fabloodle_archive_summary_v1";

export type DayPlayStatus = "won" | "playing";

export interface DaySummaryEntry {
  status: DayPlayStatus;
  guessCount: number;
}

export type ArchiveSummaryMap = Record<string, DaySummaryEntry>;

export function loadArchiveSummary(): ArchiveSummaryMap {
  try {
    const raw = localStorage.getItem(SUMMARY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ArchiveSummaryMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function updateArchiveSummary(
  playDate: string,
  gameState: "playing" | "won",
  guessCount: number
): void {
  try {
    const map = loadArchiveSummary();
    map[playDate] = {
      status: gameState === "won" ? "won" : "playing",
      guessCount,
    };
    localStorage.setItem(SUMMARY_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}
