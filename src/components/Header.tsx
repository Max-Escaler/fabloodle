import { Link } from "react-router-dom";

interface HeaderProps {
  /** Active puzzle date shown in subtitle (YYYY-MM-DD) */
  playDate: string;
  isArchiveGame?: boolean;
}

export function Header({ playDate, isArchiveGame = false }: HeaderProps) {
  return (
    <header className="w-full border-b border-[#3a3a3c] py-4 px-6 flex items-center justify-between">
      <div className="w-12 flex items-center justify-start">
        <Link
          to="/archive"
          className="text-[#818384] hover:text-[#d4a843] transition-colors text-xs font-semibold uppercase tracking-wide"
        >
          Past Fabloodles
        </Link>
      </div>
      <div className="flex flex-col items-center">
        <Link to="/" className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-widest text-[#d4a843] uppercase">
            Fabloodle
          </h1>
        </Link>
        {isArchiveGame ? (
          <div className="flex flex-col items-center mt-1 gap-1">
            <span className="rounded-full border border-[#d4a843]/40 bg-[#d4a843]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f4d36f]">
              Archive Puzzle
            </span>
            <span className="text-xs text-[#818384] tracking-wide">
              Playing {playDate}
            </span>
          </div>
        ) : (
          <span className="text-xs text-[#818384] mt-0.5 tracking-wide">
            Guess today&apos;s FAB card · {playDate}
          </span>
        )}
      </div>
      <div className="w-24 flex items-center justify-end text-[11px] text-[#6f7073] tracking-wide">
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
    </header>
  );
}
