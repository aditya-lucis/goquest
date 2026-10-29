import type { Act, Quest } from "../types";
import { ACT1_QUESTS_PART1 } from "./act1-part1";
import { ACT1_QUESTS_PART2 } from "./act1-part2";
import { ACT2_QUESTS } from "./act2";
import { ACT3_QUESTS } from "./act3";

export const ACTS: Act[] = [
  {
    id: 1,
    title: "Act 1: Awakening",
    subtitle: "Fundamentals",
    description:
      "Bangun dari nol: kenal Go, tulis mantra pertama, kuasai variable, control flow, function, koleksi, hingga struct & method.",
    emoji: "🌅",
    theme: "cyan",
  },
  {
    id: 2,
    title: "Act 2: The Power Within",
    subtitle: "Intermediate",
    description:
      "Kekuatan dalam diri: pointer, interface, error handling, dan gerbang menuju sihir concurrency.",
    emoji: "🔮",
    theme: "violet",
  },
  {
    id: 3,
    title: "Act 3: Legendary Path",
    subtitle: "Advanced",
    description:
      "Jalan para legenda: generics, context, reflection, performance, REST API, database, hingga production.",
    emoji: "👑",
    theme: "gold",
  },
];

export const QUESTS: Quest[] = [
  ...ACT1_QUESTS_PART1,
  ...ACT1_QUESTS_PART2,
  ...ACT2_QUESTS,
  ...ACT3_QUESTS,
].sort((a, b) => a.act - b.act || a.order - b.order);

export function getQuest(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}

export function getQuestsByAct(act: 1 | 2 | 3): Quest[] {
  return QUESTS.filter((q) => q.act === act);
}

export function getAct(act: number): Act | undefined {
  return ACTS.find((a) => a.id === act);
}

/** Quest pertama yang belum selesai (untuk tombol Continue) */
export function getNextQuest(completedQuestIds: string[]): Quest | undefined {
  return QUESTS.find((q) => !q.comingSoon && !completedQuestIds.includes(q.id));
}

/** Selesaikan semua quest playable di act sebelumnya? */
export function isActUnlocked(act: 1 | 2 | 3, completedQuestIds: string[]): boolean {
  if (act === 1) return true;
  const prevAct = (act - 1) as 1 | 2;
  const prevQuests = QUESTS.filter((q) => q.act === prevAct && !q.comingSoon);
  return prevQuests.every((q) => completedQuestIds.includes(q.id));
}

/** Hitung persentase penyelesaian sebuah act */
export function actProgress(act: 1 | 2 | 3, completedQuestIds: string[]): number {
  const actQuests = QUESTS.filter((q) => q.act === act && !q.comingSoon);
  if (actQuests.length === 0) return 0;
  const done = actQuests.filter((q) => completedQuestIds.includes(q.id)).length;
  return Math.round((done / actQuests.length) * 100);
}
