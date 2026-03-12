import type { FabCard } from "../data/cards";

export type CellStatus = "correct" | "close" | "wrong";
export type Direction = "higher" | "lower" | null;

export interface CellResult {
  status: CellStatus;
  direction: Direction;
  /** For pitch cells this is number[]; for all others it's string or number */
  value: string | number | number[];
}

export interface GuessResult {
  card: FabCard;
  /** True only when the guessed card's id matches the daily answer exactly. */
  isExactMatch: boolean;
  cells: {
    type: CellResult;
    attack: CellResult;
    defense: CellResult;
    cost: CellResult;
    pitchValues: CellResult;
    talent: CellResult;
    heroClass: CellResult;
  };
}

/**
 * A card with a talent but no dedicated class shows "None" for class,
 * because "Generic" would be misleading — it belongs to a talent not a class.
 * Only truly classless + talentless cards say "Generic".
 */
export function effectiveClass(card: FabCard): string {
  if (card.heroClass === "Generic" && card.talent !== "None") return "None";
  return card.heroClass;
}

// Null / missing values compare as -1 (below zero), so arrows always appear
function toNum(val: number | null): number {
  return val ?? -1;
}

// Parse a costDisplay string to a comparable number.
// "0","1","2" → the integer; "X","XX","—" → null (treated as -1)
function costToNum(display: string): number {
  const n = parseInt(display, 10);
  return isNaN(n) ? -1 : n;
}

function numericCell(
  guessVal: number | null,
  answerVal: number | null,
  closeThreshold: number
): CellResult {
  const g = toNum(guessVal);
  const a = toNum(answerVal);
  if (g === a) {
    return { status: "correct", direction: null, value: guessVal ?? "—" };
  }
  const diff = Math.abs(g - a);
  const direction: Direction = g < a ? "higher" : "lower";
  return {
    status: diff <= closeThreshold ? "close" : "wrong",
    direction,
    value: guessVal ?? "—",
  };
}

function costCell(guessDisplay: string, answerDisplay: string): CellResult {
  if (guessDisplay === answerDisplay) {
    return { status: "correct", direction: null, value: guessDisplay };
  }
  const g = costToNum(guessDisplay);
  const a = costToNum(answerDisplay);
  const diff = Math.abs(g - a);
  const direction: Direction = g < a ? "higher" : "lower";
  return {
    status: diff <= 1 ? "close" : "wrong",
    direction,
    value: guessDisplay,
  };
}

function pitchCell(guessVals: number[], answerVals: number[]): CellResult {
  const aSet = new Set(answerVals);
  const isExact =
    guessVals.length === answerVals.length &&
    guessVals.every((v) => aSet.has(v));
  if (isExact) {
    return { status: "correct", direction: null, value: guessVals };
  }
  const hasOverlap = guessVals.some((v) => aSet.has(v));
  return { status: hasOverlap ? "close" : "wrong", direction: null, value: guessVals };
}

function exactCell(guessVal: string, answerVal: string): CellResult {
  return {
    status: guessVal === answerVal ? "correct" : "wrong",
    direction: null,
    value: guessVal,
  };
}

export function evaluateGuess(guess: FabCard, answer: FabCard): GuessResult {
  return {
    card: guess,
    isExactMatch: guess.id === answer.id,
    cells: {
      type: exactCell(guess.type, answer.type),
      attack: numericCell(guess.attack, answer.attack, 2),
      defense: numericCell(guess.defense, answer.defense, 1),
      cost: costCell(guess.costDisplay, answer.costDisplay),
      pitchValues: pitchCell(guess.pitchValues, answer.pitchValues),
      talent: exactCell(guess.talent, answer.talent),
      heroClass: exactCell(effectiveClass(guess), effectiveClass(answer)),
    },
  };
}

export function isCorrectGuess(result: GuessResult): boolean {
  return Object.values(result.cells).every((c) => c.status === "correct");
}
