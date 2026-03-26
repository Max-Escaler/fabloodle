const STORAGE_KEY = "fabloodle_how_to_play_dismissed_v1";

export function isHowToPlayDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function dismissHowToPlay(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // localStorage unavailable
  }
}
