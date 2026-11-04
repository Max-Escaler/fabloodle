// Desktop board columns: card, then one column per category. Shared by the
// header and every guess row so they line up.
export const BOARD_COLUMNS = "minmax(170px, 1.6fr) repeat(10, minmax(66px, 1fr))";
export const BOARD_MIN_WIDTH = "min-w-[900px]";

// Phone / tablet board: ten equal columns on one line.
export const COMPACT_COLUMNS = "repeat(10, minmax(0, 1fr))";

const COMPACT_LABELS: Record<string, string> = {
  type: "Type",
  subtypes: "Sub",
  attack: "Atk",
  defense: "Def",
  cost: "Cst",
  pitchValues: "Pit",
  talent: "Tal",
  heroClass: "Cls",
  keywords: "Kw",
  releases: "Set",
};

export const CATEGORIES = [
  { key: "type", label: "Type" },
  { key: "subtypes", label: "Subtype" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "cost", label: "Cost" },
  { key: "pitchValues", label: "Colors" },
  { key: "talent", label: "Talent" },
  { key: "heroClass", label: "Class" },
  { key: "keywords", label: "Keywords" },
  { key: "releases", label: "Sets" },
] as const;

export function CategoryHeader() {
  return (
    <div
      className={`hidden lg:grid items-end gap-1.5 w-full px-3 pb-1 ${BOARD_MIN_WIDTH}`}
      style={{ gridTemplateColumns: BOARD_COLUMNS }}
    >
      <div className="eyebrow">Guess</div>
      {CATEGORIES.map((cat) => (
        <div key={cat.key} className="eyebrow text-center">
          {cat.label}
        </div>
      ))}
    </div>
  );
}

/** Column labels for the one-line board, pinned under the top bar while scrolling. */
export function CompactCategoryHeader() {
  return (
    <div className="lg:hidden sticky top-[var(--shell-top)] z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 py-1.5 bg-canvas/95 backdrop-blur">
      <div
        className="grid gap-[3px] sm:gap-1 px-[7px] sm:px-[9px]"
        style={{ gridTemplateColumns: COMPACT_COLUMNS }}
      >
        {CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="text-center text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.04em] text-muted"
          >
            <span className="sm:hidden">{COMPACT_LABELS[cat.key]}</span>
            <span className="hidden sm:inline">{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
