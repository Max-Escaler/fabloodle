/**
 * Generates src/data/cards.ts using the @flesh-and-blood/cards npm package.
 * Groups cards by name (deduplicates across pitch versions), collects all pitch
 * values, and picks the canonical (lowest-pitch) version for stats.
 *
 * Run: node scripts/generate-cards.mjs
 */

import { cards as fabCards } from "@flesh-and-blood/cards";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Set code → release year (for image URL construction) ─────────────────────
const SET_YEARS = {
  WTR: 2019, ARC: 2020, CRU: 2020,
  MON: 2021, ELE: 2021,
  EVR: 2022, UPR: 2022, DYN: 2022,
  OUT: 2023, EVO: 2023, DTD: 2023,
  MST: 2024, ROS: 2024, HVY: 2024,
  SEA: 2025, HNT: 2025, GEM: 2025, OMN: 2025,
  IRA: 2020, BVO: 2020, BEN: 2020, AZL: 2020,
  KSI: 2020, KYO: 2020, AKO: 2020, KAT: 2020,
  KSU: 2020, TEA: 2020, RNR: 2020, RHI: 2020, ASR: 2020,
  DRO: 2021, BOL: 2021, CHN: 2021, PSM: 2021,
  LXI: 2021, BRI: 2021, OLD: 2021, LEV: 2021,
  MPG: 2021, ASB: 2021, "1HP": 2021,
  FAI: 2022, ZEN: 2022, NUU: 2022, ENG: 2022,
  WOD: 2022, ARK: 2022, ARA: 2022, AAZ: 2022,
  ARR: 2022, RIP: 2022, VIC: 2022,
  AAC: 2023, UZU: 2023, FLR: 2023, CIN: 2023,
  AIO: 2023, AMX: 2023, KMX: 2023,
  OSC: 2024, OLA: 2024, VER: 2024, AST: 2024,
  AUA: 2024, AUR: 2024, AHA: 2024, AJV: 2024, DVR: 2024,
  APS: 2025, FNG: 2025, SMP: 2025, SUP: 2025,
  AGV: 2025, DNI: 2025, ZBD: 2025,
  HER: 2019, JDG: 2023, LSS: 2022, TCC: 2023, TER: 2025, SBZ: 2025,
};

const MAIN_SETS = new Set([
  "WTR", "ARC", "CRU", "MON", "ELE", "EVR", "UPR", "DYN",
  "OUT", "EVO", "DTD", "MST", "ROS", "HVY", "SEA", "HNT", "GEM", "OMN",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function setCodeFromId(identifier) {
  return identifier.match(/^([A-Z0-9]+?)\d/)?.[1] ?? null;
}

const IMG_BASE = "https://legendstory-production-s3-public.s3.amazonaws.com/media/cards/large/";

function getImageUrl(printings) {
  const scored = printings.map((p) => {
    const code = setCodeFromId(p.identifier);
    const year = code ? (SET_YEARS[code] ?? 9999) : 9999;
    return {
      p, code, year,
      isMain: code ? MAIN_SETS.has(code) : false,
      hasTreatment: !!p.treatment,
      isExpansion: !!p.isExpansionSlot,
    };
  });
  scored.sort((a, b) => {
    if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
    if (a.hasTreatment !== b.hasTreatment) return a.hasTreatment ? 1 : -1;
    if (a.isExpansion !== b.isExpansion) return a.isExpansion ? 1 : -1;
    return a.year - b.year;
  });
  const best = scored[0];
  if (!best) return "";
  return `${IMG_BASE}${best.p.identifier}.webp`;
}

// Subtypes on Action cards that should be used as the card's type label directly.
// Checked in priority order before falling back to Attack/Non-Attack.
const NAMED_ACTION_SUBTYPES = [
  "Aura", "Item", "Evo", "Invocation", "Construct", "Trap",
  "Song", "Landmark", "Ally", "Affliction",
];

function getCardType(types, subtypes) {
  if (types.includes("Action")) {
    // Named subtypes take priority over generic attack/non-attack labels
    for (const sub of NAMED_ACTION_SUBTYPES) {
      if (subtypes.includes(sub)) return sub;
    }
    return subtypes.includes("Attack") ? "Attack Action" : "Non-Attack Action";
  }
  if (types.includes("Defense Reaction")) return "Defense Reaction";
  if (types.includes("Attack Reaction")) return "Attack Reaction";
  if (types.includes("Instant")) return "Instant";
  if (types.includes("Equipment")) return "Equipment";
  if (types.includes("Weapon")) return "Weapon";
  if (types.includes("Mentor")) return "Mentor";
  if (types.includes("Block")) return "Block";
  if (types.includes("Resource")) return "Resource";
  if (types.includes("Macro")) return "Macro";
  return types[0] ?? "Unknown";
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

function getHeroClass(classes) {
  const skip = new Set(["NotClassed", "Generic"]);
  return classes.find((c) => !skip.has(c)) ?? "Generic";
}

function getTalent(talents) {
  if (!talents || talents.length === 0) return "None";
  return talents[0];
}

function toId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Main ──────────────────────────────────────────────────────────────────────

const playable = fabCards.filter(
  (c) => !c.types.includes("Hero") && !c.types.includes("Token")
);

// Group by name (each unique card name may have red/yellow/blue versions)
const byName = new Map();
for (const c of playable) {
  if (!byName.has(c.name)) byName.set(c.name, []);
  byName.get(c.name).push(c);
}

console.log(`Unique card names (non-hero, non-token): ${byName.size}`);

const cards = [];
const idSet = new Set();

for (const [name, versions] of byName) {
  // Sort: non-pitched first (pitch=undefined), then by ascending pitch (red=1, yellow=2, blue=3)
  const sorted = [...versions].sort((a, b) => (a.pitch ?? 0) - (b.pitch ?? 0));
  const canonical = sorted[0];

  const pitchValues = [...new Set(versions.map((v) => v.pitch).filter((v) => v != null))].sort();

  const type = getCardType(canonical.types ?? [], canonical.subtypes ?? []);
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

  const talent = getTalent(canonical.talents);
  const heroClass = getHeroClass(canonical.classes ?? []);
  const rarity = getMainRarity(canonical.rarities ?? []);
  const imageUrl = getImageUrl(canonical.printings ?? []);

  let id = toId(name);
  let counter = 1;
  while (idSet.has(id)) { id = `${toId(name)}-${++counter}`; }
  idSet.add(id);

  cards.push({ id, name, imageUrl, type, attack, defense, costDisplay, pitchValues, talent, heroClass, rarity });
}

// Sort alphabetically
cards.sort((a, b) => a.name.localeCompare(b.name));

// ── Write TypeScript (compact: one card per line) ─────────────────────────────

const lines = [
  `export interface FabCard {`,
  `  id: string;`,
  `  name: string;`,
  `  imageUrl: string;`,
  `  /** "Attack Action" | "Non-Attack Action" | "Aura" | "Instant" | "Defense Reaction" | "Attack Reaction" | "Equipment" | "Weapon" | "Mentor" | "Block" | "Resource" */`,
  `  type: string;`,
  `  attack: number | null;`,
  `  defense: number | null;`,
  `  /** "0","1","2" etc. | "X","XX","2X" etc. | "—" (no cost) */`,
  `  costDisplay: string;`,
  `  /** Pitch values this card comes in: [] = colorless, [1]=red, [2]=yellow, [3]=blue */`,
  `  pitchValues: number[];`,
  `  talent: string;`,
  `  heroClass: string;`,
  `  rarity: string;`,
  `}`,
  ``,
  `export const CARDS: FabCard[] = [`,
];

for (const c of cards) {
  lines.push(
    `  {id:${JSON.stringify(c.id)},name:${JSON.stringify(c.name)},imageUrl:${JSON.stringify(c.imageUrl)},type:${JSON.stringify(c.type)},attack:${JSON.stringify(c.attack)},defense:${JSON.stringify(c.defense)},costDisplay:${JSON.stringify(c.costDisplay)},pitchValues:${JSON.stringify(c.pitchValues)},talent:${JSON.stringify(c.talent)},heroClass:${JSON.stringify(c.heroClass)},rarity:${JSON.stringify(c.rarity)}},`
  );
}

lines.push(`];`);
lines.push(``);

const outPath = join(__dirname, "..", "src", "data", "cards.ts");
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
cards.forEach((c) => { typeCounts[c.type] = (typeCounts[c.type] ?? 0) + 1; });
console.log("\nCard types:");
Object.entries(typeCounts).sort((a,b) => b[1]-a[1]).forEach(([t,n]) => console.log(`  ${t}: ${n}`));
