import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import { getOrCreateClientId } from "./clientId";

export async function fetchCardIdForDate(playDate: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("daily_puzzles")
    .select("card_id")
    .eq("play_date", playDate)
    .maybeSingle();
  if (error) {
    console.error("fetchCardIdForDate", error);
    return null;
  }
  return data?.card_id ?? null;
}

/** play_date strings (YYYY-MM-DD) that have a puzzle and are <= maxDate */
export async function fetchPuzzleDatesInRange(
  start: string,
  end: string,
  maxDate: string
): Promise<Set<string>> {
  const supabase = getSupabase();
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from("daily_puzzles")
    .select("play_date")
    .gte("play_date", start)
    .lte("play_date", end)
    .lte("play_date", maxDate);
  if (error) {
    console.error("fetchPuzzleDatesInRange", error);
    return new Set();
  }
  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row && typeof row.play_date === "string") {
      set.add(row.play_date);
    }
  }
  return set;
}

export async function submitGameCompletion(
  playDate: string,
  guessCount: number
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("game_completions").insert({
    play_date: playDate,
    guess_count: guessCount,
    client_id: getOrCreateClientId(),
  });
  if (error) {
    if (error.code === "23505") return true;
    console.error("submitGameCompletion", error);
    return false;
  }
  return true;
}

export interface GuessStats {
  avgGuesses: number;
  completionCount: number;
}

export async function fetchGuessStats(playDate: string): Promise<GuessStats | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_guess_stats", {
    p_play_date: playDate,
  });
  if (error) {
    console.error("fetchGuessStats", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const avg = Number((row as { avg_guesses?: unknown }).avg_guesses);
  const count = Number((row as { completion_count?: unknown }).completion_count);
  return {
    avgGuesses: Number.isFinite(avg) ? avg : 0,
    completionCount: Number.isFinite(count) ? count : 0,
  };
}
