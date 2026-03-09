/**
 * Generates src/data/heroes.ts using the @flesh-and-blood/cards npm package.
 *
 * Run: node scripts/generate-heroes.mjs
 */

import { cards as fabCards } from "@flesh-and-blood/cards";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Set code → release year ───────────────────────────────────────────────────
const SET_YEARS = {
  // Main booster sets
  WTR: 2019, ARC: 2020, CRU: 2020,
  MON: 2021, ELE: 2021,
  EVR: 2022, UPR: 2022, DYN: 2022,
  OUT: 2023, EVO: 2023, DTD: 2023,
  MST: 2024, ROS: 2024, HVY: 2024,
  SEA: 2025, HNT: 2025, GEM: 2025, OMN: 2025,
  // Hero / Blitz decks
  IRA: 2020, BVO: 2020, BEN: 2020, AZL: 2020,
  KSI: 2020, KYO: 2020, AKO: 2020, KAT: 2020,
  KSU: 2020, TEA: 2020, RNR: 2020, RHI: 2020,
  ASR: 2020,
  DRO: 2021, BOL: 2021, CHN: 2021, PSM: 2021,
  LXI: 2021, BRI: 2021, OLD: 2021, LEV: 2021,
  MPG: 2021, ASB: 2021, "1HP": 2021,
  FAI: 2022, ZEN: 2022, NUU: 2022, ENG: 2022,
  WOD: 2022, ARK: 2022, ARA: 2022, AAZ: 2022,
  ARR: 2022, RIP: 2022, VIC: 2022,
  AAC: 2023, UZU: 2023, FLR: 2023, CIN: 2023,
  AIO: 2023, AMX: 2023, KMX: 2023,
  OSC: 2024, OLA: 2024, VER: 2024, AST: 2024,
  AUA: 2024, AUR: 2024, AHA: 2024, AJV: 2024,
  DVR: 2024,
  APS: 2025, FNG: 2025, SMP: 2025, SUP: 2025,
  AGV: 2025, DNI: 2025, ZBD: 2025,
  // Promos / special releases
  HER: 2019, JDG: 2023, LSS: 2022, TCC: 2023, TER: 2025, SBZ: 2025,
};

// ── Main booster set codes (preferred for image selection) ────────────────────
const MAIN_SETS = new Set([
  "WTR", "ARC", "CRU", "MON", "ELE", "EVR", "UPR", "DYN",
  "OUT", "EVO", "DTD", "MST", "ROS", "HVY", "SEA", "HNT",
  "GEM", "OMN",
]);

// ── Promo / special codes to exclude from release-year calculation ─────────────
const PROMO_CODES = new Set(["HER", "WIN", "JDG", "LSS", "TCC"]);

// ── Hero first name / full name → region ──────────────────────────────────────
const HERO_REGIONS = {
  Rhinar: "Rathe", Kayo: "Rathe", Riptide: "Rathe",
  Bolfar: "Rathe", "Gravy Bones": "Rathe", Gravy: "Rathe", Tuffnut: "Rathe",
  Bravo: "Solana", Dorinthea: "Solana", Boltyn: "Solana",
  "Ser Boltyn": "Solana", Prism: "Solana", Victor: "Solana",
  Lyath: "Solana", Brevant: "Solana", Betsy: "Solana",
  Katsu: "Misteria", Ira: "Misteria", Shiyana: "Misteria",
  Yoji: "Misteria", Zen: "Misteria", Nuu: "Misteria",
  Uzuri: "Misteria", Vesper: "Misteria", Phai: "Misteria",
  Hala: "Misteria",
  Dash: "Metrix", Kano: "Metrix", Data: "Metrix",
  Genis: "Metrix", Benji: "Metrix", Enigma: "Metrix",
  Teklovossen: "Metrix", Maxx: "Metrix", Pleiades: "Metrix",
  Frankie: "Metrix", Oscilio: "Metrix", Blaze: "Metrix",
  Kassai: "Volcor", Fai: "Volcor", Dromai: "Volcor",
  Emperor: "Volcor", Cindra: "Volcor",
  Azalea: "Demonastery", Viserai: "Demonastery", Levia: "Demonastery",
  Chane: "Demonastery", Florian: "Demonastery", Yorick: "Demonastery",
  Arakni: "Demonastery",
  Oldhim: "Aria", Lexi: "Aria", Briar: "Aria",
  Iyslander: "Aria", Verdance: "Aria", Vynnset: "Aria",
  Aurora: "Aria", Jarl: "Aria",
  Rosetta: "Wilderness", Minnow: "Wilderness", Kavdaen: "Wilderness",
  Loxodon: "Unknown",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRegion(name) {
  if (HERO_REGIONS[name]) return HERO_REGIONS[name];
  const first = name.split(/[\s,]/)[0];
  if (HERO_REGIONS[first]) return HERO_REGIONS[first];
  const twoWords = name.split(" ").slice(0, 2).join(" ");
  if (HERO_REGIONS[twoWords]) return HERO_REGIONS[twoWords];
  return "Unknown";
}

/** Extract set code from a card identifier like "DYN113" → "DYN" */
function setCodeFromId(identifier) {
  return identifier.match(/^([A-Z0-9]+?)\d/)?.[1] ?? null;
}

function getImageUrl(printings) {
  const scored = printings.map((p) => {
    const code = setCodeFromId(p.identifier);
    const year = code ? (SET_YEARS[code] ?? 9999) : 9999;
    return {
      p,
      code,
      year,
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
  return `https://legendstory-production-s3-public.s3.amazonaws.com/media/cards/large/${best.p.identifier}.webp`;
}

function getReleaseYear(printings) {
  let min = 9999;
  for (const p of printings) {
    const code = setCodeFromId(p.identifier);
    if (!code || PROMO_CODES.has(code)) continue;
    const y = SET_YEARS[code];
    if (y && y < min) min = y;
  }
  // If only promo printings, fall back to including them
  if (min === 9999) {
    for (const p of printings) {
      const code = setCodeFromId(p.identifier);
      if (!code) continue;
      const y = SET_YEARS[code];
      if (y && y < min) min = y;
    }
  }
  return min === 9999 ? 2019 : min;
}

function getHeroClass(classes) {
  const skip = new Set(["NotClassed", "Generic"]);
  return classes.find((c) => !skip.has(c)) ?? "Unknown";
}

function getTalent(talents) {
  if (!talents || talents.length === 0) return "None";
  return talents[0];
}

function toId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Main ──────────────────────────────────────────────────────────────────────

const heroCards = fabCards.filter(
  (c) =>
    c.types.includes("Hero") &&
    !c.types.includes("Token") &&
    !c.types.includes("Ally") &&
    !c.typeText?.includes("Demi-Hero")
);

console.log(`Found ${heroCards.length} hero cards in @flesh-and-blood/cards`);

const heroes = heroCards.map((c) => ({
  id: toId(c.name),
  name: c.name,
  releaseYear: getReleaseYear(c.printings),
  region: getRegion(c.name),
  talent: getTalent(c.talents),
  heroClass: getHeroClass(c.classes),
  intellect: c.intellect ?? 0,
  health: c.life ?? 0,
  isYoung: c.young === true,
  imageUrl: getImageUrl(c.printings),
}));

// Deduplicate by id (keep first occurrence)
const seen = new Set();
const unique = heroes.filter((h) => {
  if (seen.has(h.id)) return false;
  seen.add(h.id);
  return true;
});

// Adult heroes first, then young; alphabetical within each group
unique.sort((a, b) => {
  if (a.isYoung !== b.isYoung) return a.isYoung ? 1 : -1;
  return a.name.localeCompare(b.name);
});

// ── Generate TypeScript ───────────────────────────────────────────────────────

const tsLines = [
  `export interface Hero {`,
  `  id: string;`,
  `  name: string;`,
  `  releaseYear: number;`,
  `  region: string;`,
  `  talent: string;`,
  `  heroClass: string;`,
  `  intellect: number;`,
  `  health: number;`,
  `  isYoung: boolean;`,
  `  imageUrl: string;`,
  `}`,
  ``,
  `export const HEROES: Hero[] = [`,
];

for (const h of unique) {
  tsLines.push(`  {`);
  tsLines.push(`    id: ${JSON.stringify(h.id)},`);
  tsLines.push(`    name: ${JSON.stringify(h.name)},`);
  tsLines.push(`    releaseYear: ${h.releaseYear},`);
  tsLines.push(`    region: ${JSON.stringify(h.region)},`);
  tsLines.push(`    talent: ${JSON.stringify(h.talent)},`);
  tsLines.push(`    heroClass: ${JSON.stringify(h.heroClass)},`);
  tsLines.push(`    intellect: ${h.intellect},`);
  tsLines.push(`    health: ${h.health},`);
  tsLines.push(`    isYoung: ${h.isYoung},`);
  tsLines.push(`    imageUrl: ${JSON.stringify(h.imageUrl)},`);
  tsLines.push(`  },`);
}

tsLines.push(`];`);
tsLines.push(``);
tsLines.push(`export const REGIONS = [...new Set(HEROES.map((h) => h.region))].sort();`);
tsLines.push(`export const TALENTS = [...new Set(HEROES.map((h) => h.talent))].sort();`);
tsLines.push(`export const CLASSES = [...new Set(HEROES.map((h) => h.heroClass))].sort();`);
tsLines.push(``);

const output = tsLines.join("\n");
const outPath = join(__dirname, "..", "src", "data", "heroes.ts");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, output, "utf8");

console.log(`\nWritten ${unique.length} heroes to ${outPath}`);
console.log("\nSample:");
unique.slice(0, 5).forEach((h) =>
  console.log(
    `  ${h.name} | ${h.heroClass} | ${h.talent} | ${h.region} | HP:${h.health} INT:${h.intellect} | ${h.releaseYear} | img:${h.imageUrl ? "yes" : "NO"}`
  )
);

const missing = unique.filter((h) => !h.imageUrl);
if (missing.length) {
  console.log(`\nHeroes missing image (${missing.length}):`);
  missing.forEach((h) => console.log(`  - ${h.name} (${h.id})`));
}
