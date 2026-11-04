import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Page, PageHeader } from "../components/ui/Page";
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from "../components/ui/icons";
import { SiteFooter } from "../components/shell/SiteFooter";
import { getTodayString } from "../utils/dateUtils";
import { isSupabaseConfigured } from "../lib/supabase";
import { fetchPuzzleDatesInRange } from "../utils/puzzleService";
import { loadArchiveSummary } from "../utils/archiveSummary";
import {
  trackArchiveOpened,
  trackArchiveMonthChanged,
  trackArchiveDateSelected,
} from "../utils/analytics";

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

  const openedFiredRef = useRef(false);
  useEffect(() => {
    if (openedFiredRef.current) return;
    openedFiredRef.current = true;
    trackArchiveOpened();
  }, []);

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
    const nextYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const nextMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    setViewYear(nextYear);
    setViewMonth(nextMonth);
    trackArchiveMonthChanged({
      direction: "prev",
      viewYear: nextYear,
      viewMonth: nextMonth + 1,
    });
  }

  function goNextMonth() {
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    setViewYear(nextYear);
    setViewMonth(nextMonth);
    trackArchiveMonthChanged({
      direction: "next",
      viewYear: nextYear,
      viewMonth: nextMonth + 1,
    });
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  return (
    <>
      <Page width="max-w-3xl">
        <PageHeader
          eyebrow="Archive"
          title="Past puzzles"
          subtitle="Missed a day? Every past Fabloodle is here. Your results are saved on this device."
          actions={
            <Link to="/" className="btn btn-secondary btn-sm">
              Today&apos;s puzzle
            </Link>
          }
        />

        {!isSupabaseConfigured() ? (
          <div className="panel px-5 py-6 text-sm text-muted">
            Set <code className="text-accent-text">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-accent-text">VITE_SUPABASE_ANON_KEY</code> to load puzzles here.
            Until then, only{" "}
            <Link to="/" className="text-accent-text font-medium hover:underline">
              today&apos;s game
            </Link>{" "}
            is available.
          </div>
        ) : (
          <div className="panel p-3 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <button
                type="button"
                onClick={goPrevMonth}
                aria-label="Previous month"
                className="btn btn-ghost btn-sm !px-2"
              >
                <ChevronLeftIcon size={18} />
              </button>
              <div className="text-center">
                <h2 className="section-title">{monthName}</h2>
                <p className="tnum text-xs text-muted mt-0.5">
                  {loadingMonth ? (
                    "Loading…"
                  ) : (
                    <>
                      <span className="text-fg font-semibold">{toPlayInMonth}</span> to play ·{" "}
                      <span className="text-gain font-semibold">{wonInMonth}</span> solved
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={goNextMonth}
                disabled={isCurrentMonth}
                aria-label="Next month"
                className="btn btn-ghost btn-sm !px-2"
              >
                <ChevronRightIcon size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
              {WEEKDAYS.map((w) => (
                <div key={w} className="eyebrow !text-[10px] py-1">
                  {w}
                </div>
              ))}
              {cells.map((cell, i) => {
                if (cell.kind === "empty") {
                  return <div key={`e-${i}`} className="min-h-[52px] sm:min-h-[60px]" />;
                }
                const { dateStr, dayNum } = cell;
                const hasPuzzle = puzzleDatesForGrid.has(dateStr);
                const isFuture = dateStr > today;
                const isToday = dateStr === today;
                const entry = summary[dateStr];
                const won = entry?.status === "won";
                const playing = entry?.status === "playing" && entry.guessCount > 0;

                const clickable = hasPuzzle && !isFuture;
                const inner = (
                  <div
                    className={`tnum rounded-md min-h-[52px] sm:min-h-[60px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-xs transition-colors ${
                      won
                        ? "bg-gain/15 text-gain ring-1 ring-inset ring-gain/40 hover:ring-gain"
                        : playing
                          ? "bg-accent-soft text-accent-text ring-1 ring-inset ring-accent/40 hover:ring-accent"
                          : clickable
                            ? "bg-sunken text-fg hover:ring-1 hover:ring-inset hover:ring-accent"
                            : "text-faint opacity-50"
                    } ${isToday ? "outline-2 outline-offset-1 outline-accent" : ""}`}
                  >
                    <span className="font-semibold text-sm">{dayNum}</span>
                    {won && (
                      <span className="text-[10px] font-semibold inline-flex items-center gap-0.5">
                        <CheckIcon size={11} />
                        {entry?.guessCount}
                      </span>
                    )}
                    {playing && !won && (
                      <span className="text-[10px] font-semibold">{entry?.guessCount}…</span>
                    )}
                  </div>
                );

                return clickable ? (
                  <Link
                    key={dateStr}
                    to={`/play/${dateStr}`}
                    className="block rounded-md"
                    aria-label={`Play ${dateStr}${won ? ", solved" : ""}`}
                    onClick={() =>
                      trackArchiveDateSelected({
                        playDate: dateStr,
                        previouslyPlayed: Boolean(entry),
                      })
                    }
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={dateStr}>{inner}</div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-line text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[4px] bg-gain/15 ring-1 ring-inset ring-gain/40" />
                Solved
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[4px] bg-accent-soft ring-1 ring-inset ring-accent/40" />
                In progress
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[4px] bg-sunken ring-1 ring-inset ring-line-strong" />
                Not played
              </span>
            </div>
          </div>
        )}
      </Page>
      <SiteFooter />
    </>
  );
}
