import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { FabCard } from "../data/cards";
import { effectiveClass } from "../utils/gameLogic";
import { getCardReleases } from "../utils/cardReleases";
import { trackBrowseCardGuessed } from "../utils/analytics";
import { Modal, ModalClose } from "./ui/Modal";
import { PitchDots } from "./ui/Pitch";


interface CardDetailModalProps {
  card: FabCard;
  /** If non-null, "Guess this card" navigates here with state.guessCardId. */
  returnTo: string | null;
  onClose: () => void;
}

function StatRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm py-2 border-b border-line last:border-b-0">
      <span className="eyebrow !text-[10px] mt-0.5 w-20 shrink-0">{label}</span>
      <span className="tnum flex-1 min-w-0">{children}</span>
    </div>
  );
}

function Chips({ values }: { values: string[] }) {
  if (values.length === 0) return <span className="text-faint">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((v) => (
        <span
          key={v}
          className="bg-sunken text-fg text-xs font-semibold rounded-sm px-1.5 py-0.5"
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
    <Modal onClose={onClose} label={card.name} className="max-h-[92dvh] flex flex-col min-h-0">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <p className="eyebrow">{card.rarity}</p>
          <h2 className="page-title !text-xl mt-1 break-words">{card.name}</h2>
        </div>
        <ModalClose onClick={onClose} className="-mr-2 -mt-1" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="px-5 pb-4 flex flex-col items-center">
          {card.imageUrl && !imgError ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              onError={() => setImgError(true)}
              className="rounded-lg w-full max-w-[300px] h-auto shadow-md"
            />
          ) : (
            <div className="rounded-lg w-full max-w-[300px] aspect-[63/88] bg-sunken flex items-center justify-center text-muted text-sm">
              No image available
            </div>
          )}
        </div>

        <div className="px-5 pb-4">
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
              <span className="text-faint">Colorless</span>
            ) : (
              <PitchDots values={card.pitchValues} dotClass="w-4 h-4" gap="gap-1.5" />
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
        </div>
      </div>

      <div className="shrink-0 border-t border-line px-5 py-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
        <button type="button" onClick={onClose} className="btn btn-secondary w-full sm:w-auto">
          Close
        </button>
        <button type="button" onClick={handleGuess} className="btn btn-primary w-full sm:w-auto">
          Guess this card
        </button>
      </div>
    </Modal>
  );
}
