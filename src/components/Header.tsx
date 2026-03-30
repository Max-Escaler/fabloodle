import { Link } from "react-router-dom";

interface HeaderProps {
  /** Active puzzle date shown in subtitle (YYYY-MM-DD) */
  playDate: string;
  isArchiveGame?: boolean;
}

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

function ArchiveLink({ className }: { className?: string }) {
  return (
    <Link
      to="/archive"
      className={
        className ??
        "text-[#818384] hover:text-[#d4a843] transition-colors text-[10px] sm:text-xs font-semibold uppercase tracking-wide whitespace-nowrap shrink-0"
      }
    >
      Past Fabloodles
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
  return (
    <header className="w-full border-b border-[#3a3a3c] py-3 px-4 sm:py-4 sm:px-6">
      {/* Mobile: brand full width, then a single row for links — no overlap */}
      <div className="flex sm:hidden flex-col items-center gap-2.5">
        <BrandBlock playDate={playDate} isArchiveGame={isArchiveGame} />
        <div className="flex w-full max-w-md mx-auto items-center justify-between gap-3 pt-0.5 border-t border-[#3a3a3c]/60">
          <ArchiveLink />
          <Credit />
        </div>
      </div>

      {/* sm+: three columns with balanced space — sides no longer crush the center */}
      <div className="hidden sm:flex items-center justify-between gap-3 lg:gap-6">
        <div className="flex-shrink-0 min-w-0 max-w-[min(11rem,32%)]">
          <ArchiveLink className="text-[#818384] hover:text-[#d4a843] transition-colors text-xs font-semibold uppercase tracking-wide leading-snug" />
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
