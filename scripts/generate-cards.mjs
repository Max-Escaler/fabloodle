/**
 * Generates src/data/cards.ts using the @flesh-and-blood/cards npm package.
 * Groups cards by name (deduplicates across pitch versions), collects all pitch
 * values, and picks the canonical (lowest-pitch) version for stats.
 *
 * Debut set, image choice and release filtering all come from the package's
 * release metadata, so new sets are picked up just by bumping the package.
 *
 * Run: npm run build:data (or node scripts/generate-cards.mjs)
 */

import { cards as fabCards, releases } from "@flesh-and-blood/cards";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Release metadata (from the package, so new sets need no code changes) ────

const releaseByName = new Map(releases.map((r) => [String(r.release), r]));
const BOOSTER_TYPES = new Set(["Standalone Booster", "Expansion Booster"]);

function releaseTime(name) {
  const date = releaseByName.get(String(name))?.releaseDate;
  return date ? Date.parse(date.replace(" ", "T") + "Z") : null;
}

function isBooster(name) {
  return BOOSTER_TYPES.has(releaseByName.get(String(name))?.releaseType);
}

// Cards are only included once at least one product they're printed in is out.
// Undated products (mostly promos) count as released. Override "today" with
// FAB_RELEASED_BEFORE=YYYY-MM-DD when regenerating ahead of a release.
const CUTOFF = process.env.FAB_RELEASED_BEFORE
  ? Date.parse(process.env.FAB_RELEASED_BEFORE + "T23:59:59Z")
  : Date.now();

function isReleased(card) {
  const names = new Set([...(card.sets ?? []), ...(card.printings ?? []).map((p) => p.set)]);
  for (const n of names) {
    const t = releaseTime(n);
    if (t == null || t <= CUTOFF) return true;
  }
  return false;
}

const IMG_BASE = "https://legendstory-production-s3-public.s3.amazonaws.com/media/cards/large/";

// Prefer the earliest booster printing without a special treatment.
function getImageUrl(printings) {
  const scored = printings.map((p) => ({
    p,
    time: releaseTime(p.set) ?? Infinity,
    isMain: isBooster(p.set),
    hasTreatment: !!p.treatment,
    isExpansion: !!p.isExpansionSlot,
  }));
  scored.sort((a, b) => {
    if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
    if (a.hasTreatment !== b.hasTreatment) return a.hasTreatment ? 1 : -1;
    if (a.isExpansion !== b.isExpansion) return a.isExpansion ? 1 : -1;
    return a.time - b.time;
  });
  const best = scored[0];
  if (!best) return "";
  return `${IMG_BASE}${best.p.identifier}.webp`;
}

// Order to display the (sometimes-multiple) types of a card. Meld cards have
// two types — front-face first, meld face second — and we want consistent
// ordering across cards. The list mirrors the previous getCardType priority.
const TYPE_ORDER = [
  "Action",
  "Defense Reaction",
  "Attack Reaction",
  "Instant",
  "Equipment",
  "Weapon",
  "Mentor",
  "Block",
  "Resource",
  "Macro",
  "Demi-Hero",
  "Companion",
];

function getCardTypes(types) {
  if (!types || types.length === 0) return ["Unknown"];
  const ranked = [...new Set(types)].sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a);
    const bi = TYPE_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  return ranked;
}

// Subtypes to omit from the game hint (redundant or overly niche)
const SKIP_SUBTYPES = new Set(["Young"]);

function getSubtypes(versions) {
  const all = versions.flatMap((v) => v.subtypes ?? []);
  return [...new Set(all)].filter((s) => !SKIP_SUBTYPES.has(s)).sort();
}

const RARITY_RANK = {
  Fabled: 8, Marvel: 7, Legendary: 6, Majestic: 5,
  "Super Rare": 4, Rare: 3, Common: 2, Basic: 1, Promo: 0,
};

function getMainRarity(rarities) {
  let best = "Common";
  let bestRank = -1;
  for (const r of rarities) {
    const rank = RARITY_RANK[r] ?? -1;
    if (rank > bestRank) { bestRank = rank; best = r; }
  }
  return best;
}

function getHeroClasses(classes) {
  const skip = new Set(["NotClassed", "Generic"]);
  const filtered = classes.filter((c) => !skip.has(c));
  return filtered.length > 0 ? filtered : ["Generic"];
}

function getTalents(talents) {
  if (!talents || talents.length === 0) return ["None"];
  return [...new Set(talents)].sort();
}

/**
 * The set a card debuted in: the earliest booster set it's printed in, else the
 * earliest released product of any kind (deck, promo, etc.).
 */
function getDebutSet(versions) {
  const names = new Set();
  for (const v of versions) {
    for (const n of v.sets ?? []) names.add(String(n));
    for (const p of v.printings ?? []) if (p.set != null) names.add(String(p.set));
  }
  const ranked = [...names]
    .filter((n) => { const t = releaseTime(n); return t == null || t <= CUTOFF; })
    .sort((a, b) => {
      if (isBooster(a) !== isBooster(b)) return isBooster(a) ? -1 : 1;
      return (releaseTime(a) ?? Infinity) - (releaseTime(b) ?? Infinity);
    });
  return ranked[0] ?? "Unknown";
}

function toId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Main ──────────────────────────────────────────────────────────────────────

const playable = fabCards.filter(
  (c) =>
    isReleased(c) &&
    !c.types.includes("Hero") &&
    !c.types.includes("Token") &&
    !c.types.includes("Equipment") &&
    !c.types.includes("Demi-Hero")
);

// Group by name (each unique card name may have red/yellow/blue versions)
const byName = new Map();
for (const c of playable) {
  if (!byName.has(c.name)) byName.set(c.name, []);
  byName.get(c.name).push(c);
}

console.log(`Unique card names (non-hero, non-token): ${byName.size}`);

// Card ids are stored in Supabase daily_puzzles, so they must never change.
// When the package renames a card, pin the new name to the old id here.
const ID_OVERRIDES = {
  "Tremor of i'Arathael": "tremor-of-arathael",
};

const cards = [];
const idSet = new Set();

for (const [name, versions] of byName) {
  // Sort: non-pitched first (pitch=undefined), then by ascending pitch (red=1, yellow=2, blue=3)
  const sorted = [...versions].sort((a, b) => (a.pitch ?? 0) - (b.pitch ?? 0));
  const canonical = sorted[0];

  const pitchValues = [...new Set(versions.map((v) => v.pitch).filter((v) => v != null))].sort();

  const type = getCardTypes(canonical.types ?? []);
  const subtypes = getSubtypes(versions);
  const attack = canonical.power ?? null;
  const defense = canonical.defense ?? null;

  let costDisplay;
  if (canonical.specialCost) {
    costDisplay = canonical.specialCost;
  } else if (canonical.cost != null) {
    costDisplay = String(canonical.cost);
  } else {
    costDisplay = "—";
  }

  const talent = getTalents(canonical.talents);
  const heroClass = getHeroClasses(canonical.classes ?? []);
  const rarity = getMainRarity(canonical.rarities ?? []);
  const imageUrl = getImageUrl(canonical.printings ?? []);
  const keywords = [...new Set(versions.flatMap((v) => v.keywords ?? []))].sort();
  const set = getDebutSet(versions);

  let id = ID_OVERRIDES[name] ?? toId(name);
  let counter = 1;
  while (idSet.has(id)) { id = `${toId(name)}-${++counter}`; }
  idSet.add(id);

  cards.push({ id, name, imageUrl, type, subtypes, attack, defense, costDisplay, pitchValues, talent, heroClass, rarity, keywords, set });
}

// Sort alphabetically
cards.sort((a, b) => a.name.localeCompare(b.name));

// ── Write TypeScript (compact: one card per line) ─────────────────────────────

const lines = [
  `export interface FabCard {`,
  `  id: string;`,
  `  name: string;`,
  `  imageUrl: string;`,
  `  /** Card types. Single-faced cards have one entry, e.g. ["Action"]. Meld cards (\`Front // Back\`) have one entry per face, e.g. ["Action","Instant"]. */`,
  `  type: string[];`,
  `  /** Subtypes, e.g. ["Attack","Arrow"] | ["1H","Sword"] | ["Head"] | ["Aura"] */`,
  `  subtypes: string[];`,
  `  attack: number | null;`,
  `  defense: number | null;`,
  `  /** "0","1","2" etc. | "X","XX","2X" etc. | "—" (no cost) */`,
  `  costDisplay: string;`,
  `  /** Pitch values this card comes in: [] = colorless, [1]=red, [2]=yellow, [3]=blue */`,
  `  pitchValues: number[];`,
  `  /** Talents on this card. Cards without a talent use ["None"]. Meld cards may include the talent of the meld face, e.g. ["Earth","Lightning"]. */`,
  `  talent: string[];`,
  `  heroClass: string[];`,
  `  rarity: string;`,
  `  /** Keywords on this card, e.g. ["Go again", "Boost"] */`,
  `  keywords: string[];`,
  `  /** First main set the card debuted in, e.g. "Welcome to Rathe" */`,
  `  set: string;`,
  `}`,
  ``,
  `export const CARDS: FabCard[] = [`,
];

for (const c of cards) {
  lines.push(
    `  {id:${JSON.stringify(c.id)},name:${JSON.stringify(c.name)},imageUrl:${JSON.stringify(c.imageUrl)},type:${JSON.stringify(c.type)},subtypes:${JSON.stringify(c.subtypes)},attack:${JSON.stringify(c.attack)},defense:${JSON.stringify(c.defense)},costDisplay:${JSON.stringify(c.costDisplay)},pitchValues:${JSON.stringify(c.pitchValues)},talent:${JSON.stringify(c.talent)},heroClass:${JSON.stringify(c.heroClass)},rarity:${JSON.stringify(c.rarity)},keywords:${JSON.stringify(c.keywords)},set:${JSON.stringify(c.set)}},`
  );
}

lines.push(`];`);
lines.push(``);

const outPath = join(__dirname, "..", "src", "data", "cards.ts");

// Guard against dropping ids that past or scheduled puzzles may point at.
if (existsSync(outPath)) {
  const prevIds = new Set([...readFileSync(outPath, "utf8").matchAll(/^\s*\{id:"([^"]+)"/gm)].map((m) => m[1]));
  const removed = [...prevIds].filter((id) => !idSet.has(id));
  if (removed.length) {
    console.error(`\n${removed.length} existing card id(s) would disappear:\n  ${removed.join("\n  ")}`);
    console.error("Add them to ID_OVERRIDES (renamed cards) or rerun with ALLOW_REMOVED_IDS=1.");
    if (!process.env.ALLOW_REMOVED_IDS) process.exit(1);
  }
  const added = [...idSet].filter((id) => !prevIds.has(id));
  console.log(`New cards since last run: ${added.length}`);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join("\n"), "utf8");

const noImg = cards.filter((c) => !c.imageUrl).length;
console.log(`\nWritten ${cards.length} cards to ${outPath}`);
console.log(`Cards missing image: ${noImg}`);
console.log("\nSample:");
cards.slice(0, 5).forEach((c) =>
  console.log(`  ${c.name} | ${c.type} | ATK:${c.attack} DEF:${c.defense} COST:${c.costDisplay} | PITCH:[${c.pitchValues}] | ${c.talent} ${c.heroClass} | ${c.rarity} | img:${c.imageUrl ? "yes" : "NO"}`)
);

// Type breakdown
const typeCounts = {};
cards.forEach((c) => {
  const key = c.type.join(" // ");
  typeCounts[key] = (typeCounts[key] ?? 0) + 1;
});
console.log("\nCard types:");
Object.entries(typeCounts).sort((a,b) => b[1]-a[1]).forEach(([t,n]) => console.log(`  ${t}: ${n}`));
