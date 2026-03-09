import type { FabCard } from "../data/cards";

const EPOCH = new Date("2026-01-01T00:00:00Z");

export function getDayIndex(): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const epochDay = Date.UTC(
    EPOCH.getUTCFullYear(),
    EPOCH.getUTCMonth(),
    EPOCH.getUTCDate()
  );
  return Math.floor((today - epochDay) / 86400000);
}

export function getDailyCard(cards: FabCard[]): FabCard {
  const idx = getDayIndex();
  return cards[((idx % cards.length) + cards.length) % cards.length];
}

export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
