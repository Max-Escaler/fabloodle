// Desktop board columns: card, then one column per category. Shared by the
// header and every guess row so they line up.
export const BOARD_COLUMNS = "minmax(170px, 1.6fr) repeat(10, minmax(66px, 1fr))";
export const BOARD_MIN_WIDTH = "min-w-[900px]";

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
