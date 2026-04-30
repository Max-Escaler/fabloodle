import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { PlayPageInner } from "./pages/PlayPage";
import { CardBrowserPage } from "./pages/CardBrowserPage";
import { ArchivePage } from "./pages/ArchivePage";
import { getTodayString } from "./utils/dateUtils";
import { isValidPlayDate } from "./utils/playDate";

/**
 * Top-level layout that keeps each page mounted across navigations within the
 * same tab. Switching between Play, Browse Cards, and Archive only toggles
 * visibility (`display: none`) so that page state, scroll-independent UI
 * state, and any in-flight loads aren't thrown away when the user hops back
 * and forth (e.g. Browse Cards <-> Back to Puzzle).
 *
 * Pages other than the puzzle are lazy-mounted on first visit so we don't pay
 * their startup cost for users who never open them.
 */
export function App() {
  const location = useLocation();
  const path = location.pathname;

  const cardsRoute = path === "/cards";
  const archiveRoute = path === "/archive";
  const playMatch = path.match(/^\/play\/(.+)$/);
  const playRoute = path === "/" || playMatch !== null;

  const dateParam = playMatch?.[1];
  const invalidDate = dateParam !== undefined && !isValidPlayDate(dateParam);
  const unknownRoute = !cardsRoute && !archiveRoute && !playRoute;

  // The play date the puzzle page should currently render. When the user is on
  // /cards or /archive we don't change this — the underlying puzzle page keeps
  // showing whichever puzzle they were on so coming back is instant.
  const playDateFromRoute =
    dateParam && isValidPlayDate(dateParam)
      ? dateParam
      : path === "/"
        ? getTodayString()
        : null;

  const [activePlayDate, setActivePlayDate] = useState<string>(
    () => playDateFromRoute ?? getTodayString()
  );
  useEffect(() => {
    if (playDateFromRoute && playDateFromRoute !== activePlayDate) {
      setActivePlayDate(playDateFromRoute);
    }
  }, [playDateFromRoute, activePlayDate]);

  // Lazy-mount each page on first visit so we don't pay startup cost
  // (analytics events, puzzle/network loads, expensive memos) for pages the
  // user never opens.
  const [playVisited, setPlayVisited] = useState(playRoute && !invalidDate);
  const [cardsVisited, setCardsVisited] = useState(cardsRoute);
  const [archiveVisited, setArchiveVisited] = useState(archiveRoute);
  useEffect(() => {
    if (playRoute && !invalidDate) setPlayVisited(true);
    if (cardsRoute) setCardsVisited(true);
    if (archiveRoute) setArchiveVisited(true);
  }, [playRoute, invalidDate, cardsRoute, archiveRoute]);

  if (invalidDate || unknownRoute) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {playVisited && (
        <div className={playRoute ? undefined : "hidden"}>
          <PlayPageInner key={activePlayDate} playDate={activePlayDate} />
        </div>
      )}
      {cardsVisited && (
        <div className={cardsRoute ? undefined : "hidden"}>
          <CardBrowserPage />
        </div>
      )}
      {archiveVisited && (
        <div className={archiveRoute ? undefined : "hidden"}>
          <ArchivePage />
        </div>
      )}
    </>
  );
}
