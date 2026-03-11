import type { GuessResult } from "../utils/gameLogic";
import { GuessRow } from "./GuessRow";
import { CategoryHeader } from "./CategoryHeader";

interface GuessGridProps {
  guesses: GuessResult[];
}

export function GuessGrid({ guesses }: GuessGridProps) {
  return (
    <div className="flex flex-col gap-2 w-full pb-2">
      <CategoryHeader />
      <div className="flex flex-col gap-2 sm:gap-1.5 w-full">
        {[...guesses].reverse().map((g, i) => (
          <GuessRow key={g.card.id} result={g} rowIndex={guesses.length - 1 - i} />
        ))}
      </div>
    </div>
  );
}
