import { useState } from "react";
import type { FabCard } from "../data/cards";

interface CardAvatarProps {
  card: FabCard;
  size: number;
  className?: string;
}

export function CardAvatar({ card, size, className = "" }: CardAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initial = card.name.charAt(0).toUpperCase();
  // FaB cards are portrait: ~63×88mm → height ≈ width × 1.4
  const imgHeight = Math.round(size * 1.4);

  if (card.imageUrl && !imgError) {
    return (
      <img
        src={card.imageUrl}
        alt={card.name}
        width={size}
        height={imgHeight}
        loading="lazy"
        onError={() => setImgError(true)}
        className={`rounded-sm object-cover object-top shrink-0 bg-sunken ring-1 ring-line ${className}`}
        style={{ width: size, height: imgHeight }}
      />
    );
  }

  return (
    <div
      className={`rounded-sm flex items-center justify-center font-display font-bold text-muted bg-raised ring-1 ring-line text-sm shrink-0 ${className}`}
      style={{ width: size, height: imgHeight }}
      aria-label={card.name}
    >
      {initial}
    </div>
  );
}
