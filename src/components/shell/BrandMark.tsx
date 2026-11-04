// Fabloodle mark: the FAB Tools hexagon in the shared copper, holding a 2×2
// board of guess tiles (hit, near, miss) instead of letters.
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <path
        d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25L16 2.5Z"
        fill="var(--color-accent-soft)"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="10" y="10.5" width="5" height="5" rx="1" fill="var(--color-accent-text)" />
      <rect x="17" y="10.5" width="5" height="5" rx="1" fill="var(--color-hit)" />
      <rect x="10" y="17.5" width="5" height="5" rx="1" fill="var(--color-near)" />
      <rect x="17" y="17.5" width="5" height="5" rx="1" fill="var(--color-accent-text)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex flex-col leading-none">
      <span
        className="font-display text-[1.0625rem] font-extrabold text-fg"
        style={{ fontStretch: "112%", letterSpacing: "-0.02em" }}
      >
        Fabloodle
      </span>
      <span className="text-[11px] text-muted mt-1">Daily FAB card puzzle</span>
    </span>
  );
}
