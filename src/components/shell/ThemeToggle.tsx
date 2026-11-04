import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "../ui/icons";

type Mode = "dark" | "light";
// The boot script in index.html reads the same key before first paint.
const STORAGE_KEY = "fabloodle-theme";

function readMode(): Mode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const [mode, setMode] = useState<Mode>(readMode);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", mode === "light" ? "#f6f3ef" : "#131110");
  }, [mode]);

  const toggle = () => {
    const next: Mode = mode === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode / blocked storage: the switch still applies this visit.
    }
    setMode(next);
  };

  const label = mode === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={
        withLabel
          ? "btn btn-ghost btn-sm justify-start w-full"
          : "inline-grid place-items-center w-9 h-9 rounded-md text-muted hover:text-fg hover:bg-sunken transition-colors"
      }
    >
      {mode === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
      {withLabel && <span>{mode === "dark" ? "Light theme" : "Dark theme"}</span>}
    </button>
  );
}
