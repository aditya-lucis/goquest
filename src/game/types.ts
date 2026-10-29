// ============================================================
// GoQuest — Core Type Definitions
// Semua entitas game didefinisikan di sini (single source of truth)
// ============================================================

export type RankId = "novice" | "apprentice" | "mage" | "archmage" | "legend";

export interface Rank {
  id: RankId;
  name: string;
  title: string;
  minLevel: number;
  maxLevel: number;
  color: string; // tailwind text color class
  glow: string; // tailwind glow class
  description: string;
}

export type AvatarClass = "swordsman" | "mage" | "ranger" | "alchemist";

export interface AvatarClassInfo {
  id: AvatarClass;
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  bonus: string;
}

export type QuestDifficulty = "easy" | "normal" | "hard" | "epic";

// ============================================================
// QUEST SYSTEM
// ============================================================

export interface CodeValidator {
  /** Pola yang dicek pada kode user */
  kind: "includes" | "regex";
  pattern: string;
  flags?: string;
  /** Feedback ramah saat pola tidak ditemukan */
  hint: string;
}

export interface Challenge {
  /** Instruksi challenge */
  prompt: string;
  hint: string;
  starterCode: string;
  /** Output terminal yang diharapkan (per-line compare, trim) */
  expectedOutput: string;
  /** Validasi tambahan pada source code (bukan cuma output) */
  validators: CodeValidator[];
}

export interface BossFight {
  name: string;
  emoji: string;
  taunt: string;
  /** Deskripsi misi mengalahkan boss */
  prompt: string;
  /** Kode bermasalah (utk boss debugging) atau kerangka kode (utk mini project) */
  starterCode: string;
  expectedOutput: string;
  validators: CodeValidator[];
  hp: number;
  hint?: string;
  /** Narasi kemenangan */
  victoryStory: string;
}

export type QuestPhase = "story" | "lesson" | "challenge" | "boss" | "victory";

export interface Quest {
  id: string;
  act: 1 | 2 | 3;
  order: number;
  title: string;
  subtitle: string;
  emoji: string;
  difficulty: QuestDifficulty;
  xpReward: number;
  goldReward: number;
  /** Skill node yang ter-unlock setelah quest selesai */
  skillId: string;
  /** Item yang didapat setelah quest selesai */
  itemReward?: string;
  /** Quest roadmap — tampil di map tapi belum bisa dimainkan */
  comingSoon?: boolean;
  /** Narasi intro (tiap elemen = 1 paragraf cinematic) */
  story: string[];
  objectives: string[];
  /** Materi pelajaran dalam markdown */
  lesson: string;
  challenge: Challenge;
  boss: BossFight;
}

export interface Act {
  id: 1 | 2 | 3;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  theme: string; // warna aksen act
}

// ============================================================
// SKILL TREE
// ============================================================

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  emoji: string;
  act: 1 | 2 | 3;
  /** Skill yang harus di-unlock dulu */
  requires: string[];
  /** Quest yang membuka skill ini */
  questId: string;
}

// ============================================================
// ITEMS & INVENTORY
// ============================================================

export type ItemCategory = "weapon" | "shield" | "badge" | "title" | "trophy" | "potion";

export interface Item {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: ItemCategory;
  rarity: "common" | "rare" | "epic" | "legendary";
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Kondisi unlock dalam bentuk deskripsi + checker id */
  condition: string;
}

// ============================================================
// RUNTIME STATE (store)
// ============================================================

export type Screen =
  | "landing"
  | "dashboard"
  | "world-map"
  | "quest"
  | "skill-tree"
  | "character"
  | "trophy"
  | "leaderboard";

export interface CharacterState {
  id: string;
  username: string;
  avatarClass: AvatarClass;
  level: number;
  xp: number;
  gold: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null;
}

export interface QuestProgressState {
  questId: string;
  status: "in_progress" | "completed";
  score: number;
  completedAt: string | null;
}

export interface FullCharacterState extends CharacterState {
  questProgress: QuestProgressState[];
  achievements: string[];
  inventory: string[];
  skills: string[];
}

export interface LeaderboardEntry {
  position?: number;
  username: string;
  avatarClass: string;
  level: number;
  xp: number;
  rank: RankId;
  streak: number;
  questsCompleted: number;
}
