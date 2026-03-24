import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { getTodayString } from "../utils/dateUtils";
import { isSupabaseConfigured } from "../lib/supabase";
import { fetchPuzzleDatesInRange } from "../utils/puzzleService";
import { loadArchiveSummary } from "../utils/archiveSummary";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toISODate(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** First grid column (0=Sun) for the 1st of month, and days in month */
function monthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return { startPad, lastDay };
}

export function ArchivePage() {
  const today = getTodayString();
  const [now] = useState(() => new Date());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [puzzleDates, setPuzzleDates] = useState<Set<string>>(new Set());
  const [loadingMonth, setLoadingMonth] = useState(false);

  const monthStart = toISODate(viewYear, viewMonth + 1, 1);
  const monthEnd = toISODate(viewYear, viewMonth + 1, new Date(viewYear, viewMonth + 1, 0).getDate());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoadingMonth(true);
      const set = await fetchPuzzleDatesInRange(monthStart, monthEnd, today);
      if (cancelled) return;
      setPuzzleDates(set);
      setLoadingMonth(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [monthStart, monthEnd, today]);

  const summary = loadArchiveSummary();
  const puzzleDatesForGrid = isSupabaseConfigured() ? puzzleDates : new Set<string>();

  const { startPad, lastDay } = monthGrid(viewYear, viewMonth);
  const cells: ({ kind: "empty" } | { kind: "day"; dateStr: string; dayNum: number })[] = [];
  for (let i = 0; i < startPad; i++) cells.push({ kind: "empty" });
  for (let d = 1; d <= lastDay; d++) {
    cells.push({ kind: "day", dateStr: toISODate(viewYear, viewMonth + 1, d), dayNum: d });
  }
  while (cells.length % 7 !== 0) cells.push({ kind: "empty" });

  const publishedInMonth = [...puzzleDatesForGrid].filter((d) => d >= monthStart && d <= monthEnd);
  const wonInMonth = publishedInMonth.filter((d) => summary[d]?.status === "won").length;
  const toPlayInMonth = publishedInMonth.length - wonInMonth;

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#121213] flex flex-col">
      <Header playDate={today} />

      <main className="flex-1 flex flex-col items-center gap-6 pt-6 pb-12 px-4 w-full max-w-3xl mx-auto">
        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={goPrevMonth}
            className="text-[#d4a843] text-sm font-semibold hover:underline"
          >
            Previous
          </button>
          <h2 className="text-xl font-bold text-white tracking-wide">Archive</h2>
          <button
            type="button"
            onClick={goNextMonth}
            className="text-[#d4a843] text-sm font-semibold hover:underline"
          >
            Next
          </button>
        </div>

        <p className="text-[#d4a843] text-lg font-semibold">{monthName}</p>

        {!isSupabaseConfigured() && (
          <p className="text-[#818384] text-sm text-center">
            Set <code className="text-[#d4a843]">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-[#d4a843]">VITE_SUPABASE_ANON_KEY</code> to load puzzles here. Until
            then, use <Link to="/" className="text-[#d4a843] underline">today&apos;s game</Link> only.
          </p>
        )}

        {isSupabaseConfigured() && (
          <>
            {loadingMonth && (
              <p className="text-[#818384] text-sm">Loading calendar…</p>
            )}
            <div className="w-full grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-emerald-400/90 text-[10px] font-bold uppercase py-1">
                  {w}
                </div>
              ))}
              {cells.map((cell, i) => {
                if (cell.kind === "empty") {
                  return <div key={`e-${i}`} className="min-h-[52px]" />;
                }
                const { dateStr, dayNum } = cell;
                const hasPuzzle = puzzleDatesForGrid.has(dateStr);
                const isFuture = dateStr > today;
                const entry = summary[dateStr];
                const won = entry?.status === "won";
                const playing = entry?.status === "playing" && entry.guessCount > 0;

                const clickable = hasPuzzle && !isFuture;
                const inner = (
                  <div
                    className={`rounded-lg min-h-[52px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-xs ${
                      won
                        ? "bg-[#1a2e28] border border-emerald-500/50"
                        : playing
                          ? "bg-[#1a1a24] border border-[#d4a843]/40"
                          : clickable
                            ? "bg-[#1a1a1b] border border-[#3a3a3c] hover:border-[#d4a843]/60"
                            : "opacity-35 border border-transparent"
                    }`}
                  >
                    <span className={`font-bold ${won ? "text-emerald-400" : "text-[#d4a843]"}`}>
                      {dayNum}
                    </span>
                    {won && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                        ✓ {entry?.guessCount}
                      </span>
                    )}
                    {playing && !won && (
                      <span className="text-[10px] text-[#818384]">{entry?.guessCount}…</span>
                    )}
                  </div>
                );

                return clickable ? (
                  <Link key={dateStr} to={`/play/${dateStr}`} className="block">
                    {inner}
                  </Link>
                ) : (
                  <div key={dateStr}>{inner}</div>
                );
              })}
            </div>

            <p className="text-[#818384] text-sm">
              <span className="text-[#d4a843] font-semibold">{toPlayInMonth}</span> to play ·{" "}
              <span className="text-emerald-400 font-semibold">✓ {wonInMonth}</span> played
            </p>
          </>
        )}

        <Link
          to="/"
          className="text-[#818384] hover:text-white text-sm underline underline-offset-2"
        >
          Back to today
        </Link>
      </main>
    </div>
  );
}
