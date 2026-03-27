/** GA4 custom event when the player submits a valid new guess (gtag from index.html). */
export function trackGuessSubmitted(payload: {
  playDate: string;
  guessNumber: number;
  won: boolean;
}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "guess_submitted", {
    play_date: payload.playDate,
    guess_number: payload.guessNumber,
    won: payload.won,
  });
}
