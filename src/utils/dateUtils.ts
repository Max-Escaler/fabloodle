import type { FabCard } from "../data/cards";

/**
 * Deterministic hash of a "YYYY-MM-DD" string.
 * Produces a well-distributed unsigned 32-bit integer so consecutive
 * days don't just walk the card list in order.
 */
function hashDateString(dateStr: string): number {
  let h = 0x811c9dc5; // FNV-1a 32-bit offset basis
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0; // FNV prime, keep unsigned 32-bit
  }
  return h;
}

export function getDailyCard(cards: FabCard[]): FabCard {
  const today = getTodayString();
  const idx = hashDateString(today) % cards.length;
  return cards[idx];
}

export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
