import type { GuessResult } from "./gameLogic";
import { getTodayString } from "./dateUtils";

const EMOJI: Record<string, string> = {
  correct: "🟩",
  close: "🟨",
  wrong: "⬛",
};

const CATEGORY_KEYS = [
  "type",
  "subtypes",
  "attack",
  "defense",
  "cost",
  "pitchValues",
  "talent",
  "heroClass",
  "keywords",
] as const;

export function buildShareText(
  guesses: GuessResult[],
  won: boolean,
  playDate: string = getTodayString()
): string {
  const date = playDate;
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
