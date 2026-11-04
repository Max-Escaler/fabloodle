import { PITCH_NAMES } from "../../utils/pitch";

// Pitch (colour) dots in the shared pitch tokens: 1 red, 2 yellow, 3 blue.

const PITCH_BG: Record<number, string> = {
  1: "bg-pitch-1",
  2: "bg-pitch-2",
  3: "bg-pitch-3",
};

export function PitchDot({ value, className = "w-3 h-3" }: { value: number; className?: string }) {
  return (
    <span
      className={`rounded-full inline-block shrink-0 ring-1 ring-black/20 ${PITCH_BG[value] ?? "bg-faint"} ${className}`}
      title={PITCH_NAMES[value]}
    />
  );
}

export function PitchDots({
  values,
  dotClass = "w-3 h-3",
  gap = "gap-1",
}: {
  values: number[];
  dotClass?: string;
  gap?: string;
}) {
  if (values.length === 0) return null;
  return (
    <span className={`inline-flex ${gap} items-center`}>
      {values.map((v) => (
        <PitchDot key={v} value={v} className={dotClass} />
      ))}
    </span>
  );
}
