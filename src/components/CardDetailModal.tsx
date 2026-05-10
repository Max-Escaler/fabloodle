import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FabCard } from "../data/cards";
import { effectiveClass } from "../utils/gameLogic";
import { getCardReleases } from "../utils/cardReleases";
import { trackBrowseCardGuessed } from "../utils/analytics";

const PITCH_COLORS: Record<number, string> = { 1: "#e74c3c", 2: "#f1c40f", 3: "#3498db" };
const PITCH_NAMES: Record<number, string> = { 1: "Red", 2: "Yellow", 3: "Blue" };

interface CardDetailModalProps {
  card: FabCard;
  /** If non-null, "Guess this card" navigates here with state.guessCardId. */
  returnTo: string | null;
  onClose: () => void;
}

function StatRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-[#818384] font-semibold uppercase tracking-wide text-[10px] mt-0.5 w-20 shrink-0">
        {label}
      </span>
      <span className="text-white flex-1 min-w-0">{children}</span>
    </div>
  );
}

function Chips({ values }: { values: string[] }) {
  if (values.length === 0) return <span className="text-[#6f7073]">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((v) => (
        <span
          key={v}
          className="bg-white/10 text-white text-xs font-semibold rounded px-1.5 py-0.5"
        >
          {v}
        </span>
      ))}
    </div>
  );
}

export function CardDetailModal({ card, returnTo, onClose }: CardDetailModalProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cls = effectiveClass(card);
  const releases = getCardReleases(card).map(String);

  function handleGuess() {
    const dest = returnTo ?? "/";
    trackBrowseCardGuessed({
      cardId: card.id,
      cardName: card.name,
      returnTo: dest,
    });
    navigate(dest, { state: { guessCardId: card.id } });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1b] border border-[#3a3a3c] rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <h2 className="text-white text-lg font-bold leading-tight min-w-0 break-words">
            {card.name}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#818384] hover:text-white text-xl leading-none shrink-0 px-1"
          >
            ×
          </button>
        </div>

        <div className="px-5 pb-4 flex flex-col items-center">
          {card.imageUrl && !imgError ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              onError={() => setImgError(true)}
              className="rounded-lg w-full max-w-[320px] h-auto"
            />
          ) : (
            <div className="rounded-lg w-full max-w-[320px] aspect-[63/88] bg-[#2a2a2b] flex items-center justify-center text-[#818384] text-sm">
              No image available
            </div>
          )}
        </div>

        <div className="px-5 pb-4 flex flex-col gap-2">
          <StatRow label="Type">
            <Chips values={card.type} />
          </StatRow>
          {card.subtypes.length > 0 && (
            <StatRow label="Subtypes">
              <Chips values={card.subtypes} />
            </StatRow>
          )}
          <StatRow label="Class">
            <Chips values={cls} />
          </StatRow>
          <StatRow label="Talent">
            <Chips values={card.talent} />
          </StatRow>
          <StatRow label="Cost">{card.costDisplay}</StatRow>
          <StatRow label="Attack">{card.attack ?? "—"}</StatRow>
          <StatRow label="Defense">{card.defense ?? "—"}</StatRow>
          <StatRow label="Colors">
            {card.pitchValues.length === 0 ? (
              <span className="text-[#6f7073]">Colorless</span>
            ) : (
              <div className="flex gap-1.5">
                {card.pitchValues.map((v) => (
                  <span
                    key={v}
                    className="w-5 h-5 rounded-full inline-block border border-black/30"
                    style={{ backgroundColor: PITCH_COLORS[v] ?? "#818384" }}
                    title={PITCH_NAMES[v]}
                  />
                ))}
              </div>
            )}
          </StatRow>
          {card.keywords.length > 0 && (
            <StatRow label="Keywords">
              <Chips values={card.keywords} />
            </StatRow>
          )}
          <StatRow label="Sets">
            <Chips values={releases} />
          </StatRow>
          <StatRow label="Rarity">{card.rarity}</StatRow>
        </div>

        <div className="sticky bottom-0 bg-[#1a1a1b] border-t border-[#3a3a3c] px-5 py-3 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#3a3a3c] hover:bg-[#4a4a4e] text-white font-semibold text-sm transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleGuess}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#538d4e] hover:bg-[#6aad65] text-white font-bold text-sm transition-colors"
          >
            Guess this card
          </button>
        </div>
      </div>
    </div>
  );
}
