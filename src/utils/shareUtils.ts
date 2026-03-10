import type { GuessResult } from "./gameLogic";
import { getTodayString } from "./dateUtils";

const EMOJI: Record<string, string> = {
  correct: "🟩",
  close: "🟨",
  wrong: "⬛",
};

const CATEGORY_KEYS = [
  "type",
  "attack",
  "defense",
  "cost",
  "pitchValues",
  "talent",
  "heroClass",
] as const;

export function buildShareText(guesses: GuessResult[], won: boolean): string {
  const date = getTodayString();
  const score = won
    ? `${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`
    : "X";
  const header = `Fabloodle ${date} — ${score}`;

  const rows = guesses
    .map((g) =>
      CATEGORY_KEYS.map((key) => EMOJI[g.cells[key].status]).join("")
    )
    .join("\n");

  return `${header}\n${rows}`;
}
