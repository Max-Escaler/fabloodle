const CATEGORIES = [
  { key: "type",        label: "Type" },
  { key: "attack",      label: "Attack" },
  { key: "defense",     label: "Defense" },
  { key: "cost",        label: "Cost" },
  { key: "pitchValues", label: "Colors" },
  { key: "talent",      label: "Talent" },
  { key: "heroClass",   label: "Class" },
];

export function CategoryHeader() {
  return (
    <div
      className="hidden sm:grid items-center gap-2 w-full px-3 min-w-[780px]"
      style={{ gridTemplateColumns: "minmax(200px, 260px) repeat(7, minmax(96px, 120px))" }}
    >
      {/* Spacer for the card name/avatar column */}
      <div />
      {CATEGORIES.map((cat) => (
        <div
          key={cat.key}
          className="text-center text-xs font-semibold text-[#818384] uppercase tracking-wide"
        >
          {cat.label}
        </div>
      ))}
    </div>
  );
}
