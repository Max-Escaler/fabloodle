import { getTodayString } from "../utils/dateUtils";

export function Header() {
  return (
    <header className="w-full border-b border-[#3a3a3c] py-4 px-6 flex items-center justify-between">
      <div className="w-12" />
      <div className="flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-widest text-[#d4a843] uppercase">
          Fabloodle
        </h1>
        <span className="text-xs text-[#818384] mt-0.5 tracking-wide">
          Guess today's FAB card · {getTodayString()}
        </span>
      </div>
      <div className="w-12 flex items-center justify-end">
        <a
          href="https://fabtcg.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Flesh and Blood TCG"
          className="text-[#818384] hover:text-white transition-colors text-sm"
        >
          FAB
        </a>
      </div>
    </header>
  );
}
