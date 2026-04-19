/**
 * Small typed wrapper around gtag ('gtag.js' is loaded by index.html).
 *
 * Keep event names in GA4 `snake_case`. Add new events by extending the
 * `EventName` union and adding a thin `track*` wrapper — the single generic
 * `track()` helper handles the gtag guard and the actual dispatch.
 */

type EventName =
  | "guess_submitted"
  | "puzzle_started"
  | "puzzle_won"
  | "hint_used"
  | "browse_cards_opened"
  | "browse_filter_applied"
  | "browse_card_viewed"
  | "browse_card_guessed"
  | "browse_filters_reset"
  | "archive_opened"
  | "archive_month_changed"
  | "archive_date_selected"
  | "result_modal_opened"
  | "share_clicked"
  | "how_to_play_opened"
  | "how_to_play_dismissed"
  | "nav_link_clicked";

function track(event: EventName, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

// --- Puzzle lifecycle ---------------------------------------------------

export function trackGuessSubmitted(p: {
  playDate: string;
  guessNumber: number;
  won: boolean;
}): void {
  track("guess_submitted", {
    play_date: p.playDate,
    guess_number: p.guessNumber,
    won: p.won,
  });
}

export function trackPuzzleStarted(p: {
  playDate: string;
  isArchive: boolean;
  resumed: boolean;
  initialGuessCount: number;
}): void {
  track("puzzle_started", {
    play_date: p.playDate,
    is_archive: p.isArchive,
    resumed: p.resumed,
    initial_guess_count: p.initialGuessCount,
  });
}

export function trackPuzzleWon(p: {
  playDate: string;
  isArchive: boolean;
  guessCount: number;
  hintCount: number;
}): void {
  track("puzzle_won", {
    play_date: p.playDate,
    is_archive: p.isArchive,
    guess_count: p.guessCount,
    hint_count: p.hintCount,
  });
}

export function trackHintUsed(p: {
  playDate: string;
  guessNumber: number;
  hintCategory: string;
}): void {
  track("hint_used", {
    play_date: p.playDate,
    guess_number: p.guessNumber,
    hint_category: p.hintCategory,
  });
}

// --- Card Browser -------------------------------------------------------

export function trackBrowseCardsOpened(p: {
  returnTo: string | null;
  hadPersistedFilters: boolean;
}): void {
  track("browse_cards_opened", {
    return_to: p.returnTo ?? "none",
    had_persisted_filters: p.hadPersistedFilters,
  });
}

export function trackBrowseFilterApplied(p: {
  resultCount: number;
  activeFilterCount: number;
  usedType: boolean;
  usedSubtype: boolean;
  usedClass: boolean;
  usedTalent: boolean;
  usedSet: boolean;
  usedPitch: boolean;
  usedKeyword: boolean;
  usedCost: boolean;
  usedAttack: boolean;
  usedDefense: boolean;
  keywordCount: number;
}): void {
  track("browse_filter_applied", {
    result_count: p.resultCount,
    active_filter_count: p.activeFilterCount,
    used_type: p.usedType,
    used_subtype: p.usedSubtype,
    used_class: p.usedClass,
    used_talent: p.usedTalent,
    used_set: p.usedSet,
    used_pitch: p.usedPitch,
    used_keyword: p.usedKeyword,
    used_cost: p.usedCost,
    used_attack: p.usedAttack,
    used_defense: p.usedDefense,
    keyword_count: p.keywordCount,
  });
}

export function trackBrowseCardViewed(p: {
  cardId: string;
  cardName: string;
  cardSet: string;
  resultPosition: number;
  resultCount: number;
}): void {
  track("browse_card_viewed", {
    card_id: p.cardId,
    card_name: p.cardName,
    card_set: p.cardSet,
    result_position: p.resultPosition,
    result_count: p.resultCount,
  });
}

export function trackBrowseCardGuessed(p: {
  cardId: string;
  cardName: string;
  returnTo: string;
}): void {
  track("browse_card_guessed", {
    card_id: p.cardId,
    card_name: p.cardName,
    return_to: p.returnTo,
  });
}

export function trackBrowseFiltersReset(p: {
  activeFilterCountBefore: number;
}): void {
  track("browse_filters_reset", {
    active_filter_count_before: p.activeFilterCountBefore,
  });
}

// --- Archive ------------------------------------------------------------

export function trackArchiveOpened(): void {
  track("archive_opened");
}

export function trackArchiveMonthChanged(p: {
  direction: "prev" | "next";
  viewYear: number;
  viewMonth: number;
}): void {
  track("archive_month_changed", {
    direction: p.direction,
    view_year: p.viewYear,
    view_month: p.viewMonth,
  });
}

export function trackArchiveDateSelected(p: {
  playDate: string;
  previouslyPlayed: boolean;
}): void {
  track("archive_date_selected", {
    play_date: p.playDate,
    previously_played: p.previouslyPlayed,
  });
}

// --- Results / share ----------------------------------------------------

export function trackResultModalOpened(p: {
  won: boolean;
  playDate: string;
  guessCount: number;
  trigger: "auto" | "manual";
}): void {
  track("result_modal_opened", {
    won: p.won,
    play_date: p.playDate,
    guess_count: p.guessCount,
    trigger: p.trigger,
  });
}

export function trackShareClicked(p: {
  playDate: string;
  won: boolean;
  guessCount: number;
}): void {
  track("share_clicked", {
    play_date: p.playDate,
    won: p.won,
    guess_count: p.guessCount,
  });
}

// --- Onboarding / navigation -------------------------------------------

export function trackHowToPlayOpened(p: { autoOpened: boolean }): void {
  track("how_to_play_opened", { auto_opened: p.autoOpened });
}

export function trackHowToPlayDismissed(): void {
  track("how_to_play_dismissed");
}

export type NavLink = "past_fabloodles" | "browse_cards" | "back_to_puzzle";

export function trackNavLinkClicked(p: { link: NavLink; from: string }): void {
  track("nav_link_clicked", { link: p.link, from: p.from });
}
