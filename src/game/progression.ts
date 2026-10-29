import type { Rank, RankId } from "./types";

// ============================================================
// XP CURVE & RANK PROGRESSION
// ============================================================

/** XP yang dibutuhkan untuk naik dari `level` ke `level+1` */
export function xpForNextLevel(level: number): number {
  return 100 + (level - 1) * 60;
}

/** Total XP kumulatif yang dibutuhkan untuk mencapai sebuah level */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForNextLevel(l);
  return total;
}

export const MAX_LEVEL = 30;

/** Terapkan gain XP → return state baru + daftar level yang dilewati */
export function applyXp(level: number, xp: number, gained: number) {
  let newLevel = level;
  let newXp = xp + gained;
  const levelsGained: number[] = [];

  while (newLevel < MAX_LEVEL && newXp >= xpForNextLevel(newLevel)) {
    newXp -= xpForNextLevel(newLevel);
    newLevel += 1;
    levelsGained.push(newLevel);
  }
  if (newLevel >= MAX_LEVEL) newXp = Math.min(newXp, xpForNextLevel(MAX_LEVEL));

  return { level: newLevel, xp: newXp, levelsGained };
}

export const RANKS: Rank[] = [
  {
    id: "novice",
    name: "Novice",
    title: "Pemula yang Berbinar",
    minLevel: 1,
    maxLevel: 4,
    color: "text-slate-300",
    glow: "glow-purple",
    description: "Perjalananmu baru saja dimulai. Cahaya ajaib compiler masih asing bagimu.",
  },
  {
    id: "apprentice",
    name: "Apprentice",
    title: "Pelajar Rune Kode",
    minLevel: 5,
    maxLevel: 9,
    color: "text-cyan-300",
    glow: "glow-cyan",
    description: "Rune dasar Go mulai merespon panggilanmu. Struct dan slice tak lagi menakutkan.",
  },
  {
    id: "mage",
    name: "Mage",
    title: "Penenun Goroutine",
    minLevel: 10,
    maxLevel: 12,
    color: "text-violet-300",
    glow: "glow-purple",
    description: "Kau menenun concurrency seperti mantra. Channel mendengar perintahmu.",
  },
  {
    id: "archmage",
    name: "Archmage",
    title: "Penguasa Generics",
    minLevel: 13,
    maxLevel: 15,
    color: "text-amber-300",
    glow: "glow-gold",
    description: "Generics dan reflection tunduk pada kehendakmu. Sedikit lagi menuju puncak.",
  },
  {
    id: "legend",
    name: "Go Legend",
    title: "Legenda Realm Golang",
    minLevel: 16,
    maxLevel: MAX_LEVEL,
    color: "text-amber-400",
    glow: "glow-gold",
    description: "Namamu diukir di Hall of Fame. Production-ready di setiap baris kodemu.",
  },
];

export function getRank(level: number): Rank {
  return RANKS.find((r) => level >= r.minLevel && level <= r.maxLevel) ?? RANKS[0];
}

export function getNextRank(level: number): Rank | null {
  const current = getRank(level);
  const idx = RANKS.findIndex((r) => r.id === current.id);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export function rankById(id: RankId): Rank {
  return RANKS.find((r) => r.id === id) ?? RANKS[0];
}
