import type { Release } from "@flesh-and-blood/types";
import type { FabCard } from "../data/cards";
import { SETS_BY_CARD_NAME } from "../data/setsByCardName";

/**
 * All {@link Release} products this card name appears in (from `card.sets` ∪
 * `printings[].set` in `@flesh-and-blood/cards`). Falls back to the app’s debut `set`
 * when the name is missing from the generated map.
 */
export function getCardReleases(card: FabCard): Release[] {
  const fromPackage = SETS_BY_CARD_NAME[card.name];
  if (fromPackage?.length) {
    return [...fromPackage] as Release[];
  }
  return [card.set as Release];
}
