import { useState } from "react";
import type { FabCard } from "../data/cards";

const TYPE_COLORS: Record<string, string> = {
  Action:             "#1a4a6b",
  Instant:            "#1a6b5a",
  "Defense Reaction": "#2d5a27",
  "Attack Reaction":  "#6b4a1a",
  Equipment:          "#5a4a1a",
  Weapon:             "#6b1a1a",
  Mentor:             "#1a3a6b",
  Block:              "#3a1a6b",
  Resource:           "#4a3a1a",
  "Demi-Hero":        "#6b1a6b",
  Companion:          "#1a6b6b",
};

interface CardAvatarProps {
  card: FabCard;
  size: number;
  className?: string;
}

export function CardAvatar({ card, size, className = "" }: CardAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initial = card.name.charAt(0).toUpperCase();
  const bgColor = TYPE_COLORS[card.type] ?? "#3a3a3c";
  // FaB cards are portrait: ~63×88mm → height ≈ width × 1.4
  const imgHeight = Math.round(size * 1.4);

  if (card.imageUrl && !imgError) {
    return (
      <img
        src={card.imageUrl}
        alt={card.name}
        width={size}
        height={imgHeight}
        onError={() => setImgError(true)}
        className={`rounded-md object-cover object-top shrink-0 ${className}`}
        style={{ width: size, height: imgHeight }}
      />
    );
  }

  return (
    <div
      className={`rounded-md flex items-center justify-center font-bold text-white text-sm shrink-0 ${className}`}
      style={{ width: size, height: imgHeight, backgroundColor: bgColor }}
      aria-label={card.name}
    >
      {initial}
    </div>
  );
}
