import { Link, useLocation } from "react-router-dom";
import { trackNavLinkClicked } from "../utils/analytics";
import type { NavLink as NavLinkName } from "../utils/analytics";

interface HeaderProps {
  /** Active puzzle date shown in subtitle (YYYY-MM-DD) */
  playDate: string;
  isArchiveGame?: boolean;
}

const NAV_LINK_BASE =
  "inline-flex items-center justify-center rounded-lg border border-[#3a3a3c] bg-[#1a1a1b] px-3 py-1.5 text-[#d7d7d7] hover:text-white hover:border-[#d4a843]/60 active:bg-[#2a2a2b] transition-colors text-[11px] sm:text-xs font-semibold uppercase tracking-wide whitespace-nowrap shrink-0";

function BrandBlock({ playDate, isArchiveGame }: { playDate: string; isArchiveGame: boolean }) {
  return (
    <div className="flex flex-col items-center text-center min-w-0 px-1">
      <Link to="/" className="text-center">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-widest text-[#d4a843] uppercase">
          Fabloodle
        </h1>
      </Link>
      {isArchiveGame ? (
        <div className="flex flex-col items-center mt-1 gap-1">
          <span className="rounded-full border border-[#d4a843]/40 bg-[#d4a843]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f4d36f]">
            Archive Puzzle
          </span>
          <span className="text-[11px] sm:text-xs text-[#818384] tracking-wide break-words max-w-full">
            Playing {playDate}
          </span>
        </div>
      ) : (
        <span className="text-[11px] sm:text-xs text-[#818384] mt-0.5 tracking-wide leading-snug max-w-[min(100%,20rem)]">
          Guess today&apos;s FAB card · {playDate}
        </span>
      )}
    </div>
  );
}

function ArchiveLink({ className, from }: { className?: string; from: string }) {
  return (
    <Link
      to="/archive"
      className={className ?? NAV_LINK_BASE}
      onClick={() => trackNavLinkClicked({ link: "past_fabloodles", from })}
    >
      Past Fabloodles
    </Link>
  );
}

interface BrowseLinkProps {
  className?: string;
  /** Path to return to from the browser page (preserves the active puzzle date). */
  returnTo: string;
  /** When true, render as the "Back to Puzzle" variant. */
  onBrowserPage: boolean;
  /** The pathname we're currently on — logged with the nav event. */
  from: string;
}

function BrowseLink({ className, returnTo, onBrowserPage, from }: BrowseLinkProps) {
  if (onBrowserPage) {
    const safeReturn = returnTo && returnTo !== "/cards" ? returnTo : "/";
    const linkName: NavLinkName = "back_to_puzzle";
    return (
      <Link
        to={safeReturn}
        className={className ?? NAV_LINK_BASE}
        onClick={() => trackNavLinkClicked({ link: linkName, from })}
      >
        Back to Puzzle
      </Link>
    );
  }
  const linkName: NavLinkName = "browse_cards";
  return (
    <Link
      to="/cards"
      state={{ returnTo }}
      className={className ?? NAV_LINK_BASE}
      onClick={() => trackNavLinkClicked({ link: linkName, from })}
    >
      Browse Cards
    </Link>
  );
}

function Credit({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "text-[10px] sm:text-[11px] text-[#6f7073] tracking-wide whitespace-nowrap shrink-0 text-right"
      }
    >
      <span className="mr-1">Made by:</span>
      <a
        href="https://twitter.com/mx_bloom"
        target="_blank"
        rel="noopener noreferrer"
        title="MXBloom on Twitter"
        className="text-[#818384] hover:text-[#d4a843] transition-colors"
      >
        MXBloom
      </a>
    </div>
  );
}

export function Header({ playDate, isArchiveGame = false }: HeaderProps) {
  const location = useLocation();
  const onBrowserPage = location.pathname === "/cards";
  // When clicking Browse Cards from anywhere, remember the current path so the
  // user can return to the same puzzle (today's, or a specific archive date).
  const returnTo = onBrowserPage
    ? ((location.state as { returnTo?: string } | null)?.returnTo ?? "/")
    : location.pathname;

  return (
    <header className="w-full border-b border-[#3a3a3c] py-3 px-4 sm:py-4 sm:px-6">
      {/* Mobile: brand, then nav buttons paired together, then credit on its own row */}
      <div className="flex sm:hidden flex-col items-center gap-2.5">
        <BrandBlock playDate={playDate} isArchiveGame={isArchiveGame} />
        <div className="flex items-center justify-center gap-2 pt-0.5">
          <ArchiveLink from={location.pathname} />
          <BrowseLink returnTo={returnTo} onBrowserPage={onBrowserPage} from={location.pathname} />
        </div>
        <div className="flex w-full max-w-md mx-auto items-center justify-center pt-0.5 border-t border-[#3a3a3c]/60">
          <Credit className="text-[10px] text-[#6f7073] tracking-wide whitespace-nowrap" />
        </div>
      </div>

      {/* sm+: three columns. Left column has the two nav buttons side by side. */}
      <div className="hidden sm:flex items-center justify-between gap-3 lg:gap-6">
        <div className="flex-shrink-0 min-w-0 flex items-center gap-2">
          <ArchiveLink from={location.pathname} />
          <BrowseLink returnTo={returnTo} onBrowserPage={onBrowserPage} from={location.pathname} />
        </div>
        <div className="flex-1 flex justify-center min-w-0">
          <BrandBlock playDate={playDate} isArchiveGame={isArchiveGame} />
        </div>
        <div className="flex-shrink-0 min-w-0 max-w-[min(11rem,32%)] flex justify-end">
          <Credit className="text-[11px] text-[#6f7073] tracking-wide text-right leading-snug" />
        </div>
      </div>
    </header>
  );
}
