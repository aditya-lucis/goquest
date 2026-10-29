"use client";

import { create } from "zustand";
import { toast } from "@/hooks/use-toast";
import type {
  FullCharacterState,
  QuestPhase,
  Rank,
  Screen,
} from "@/game/types";
import { getAchievement, getItem } from "@/game/data/core";
import { playAchievement, playBossDefeat, playChallengePass } from "@/lib/sfx";

// ============================================================
// GAME STORE — state machine SPA GoQuest
// ============================================================

interface LevelUpOverlay {
  levels: number[];
  rank: Rank;
}

interface QuestCompleteResult {
  gainedXp: number;
  gainedGold: number;
  levelsGained: number[];
  streak: number;
  unlockedAchievements: string[];
  newRank: { id: string; name: string } | null;
}

export interface DailyClaimResult {
  gainedXp: number;
  gainedGold: number;
  levelsGained: number[];
  grantedItems: string[];
  streak: number;
}

interface GameState {
  character: FullCharacterState | null;
  sessionChecked: boolean;
  /** true jika daily reward hari ini sudah diklaim */
  dailyClaimed: boolean;
  /** hasil klaim terakhir — untuk animasi perayaan di dashboard */
  dailyResult: DailyClaimResult | null;

  screen: Screen;
  activeQuestId: string | null;
  questPhase: QuestPhase;
  lastQuestResult: QuestCompleteResult | null;
  levelUpOverlay: LevelUpOverlay | null;

  initSession: () => Promise<void>;
  enterRealm: (username: string, avatarClass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  navigate: (screen: Screen) => void;
  openQuest: (questId: string) => void;
  setQuestPhase: (phase: QuestPhase) => void;
  /** dipanggil quest-screen saat challenge lulus (untuk sfx) */
  notifyChallengePassed: () => void;
  /** dipanggil quest-screen saat boss kalah (untuk sfx) */
  notifyBossDefeated: () => void;
  completeQuest: (questId: string, score: number) => Promise<QuestCompleteResult | null>;
  claimDaily: () => Promise<DailyClaimResult | null>;
  dismissDaily: () => void;
  dismissLevelUp: () => void;
}

export const useGame = create<GameState>((set, get) => ({
  character: null,
  sessionChecked: false,
  dailyClaimed: false,
  dailyResult: null,

  screen: "landing",
  activeQuestId: null,
  questPhase: "story",
  lastQuestResult: null,
  levelUpOverlay: null,

  initSession: async () => {
    if (get().sessionChecked) return;
    try {
      const res = await fetch("/api/realm/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        set({
          character: {
            ...data.character,
            questProgress: data.questProgress,
            achievements: data.achievements,
            inventory: data.inventory,
            skills: data.skills,
          },
          dailyClaimed: data.dailyClaimed ?? false,
          screen: "dashboard",
        });
      }
    } catch {
      // offline-friendly: biarkan di landing
    } finally {
      set({ sessionChecked: true });
    }
  },

  enterRealm: async (username, avatarClass) => {
    try {
      const res = await fetch("/api/realm/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatarClass }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Portal menolak masuk",
          description: data.error ?? "Terjadi kesalahan.",
          variant: "destructive",
        });
        return false;
      }
      // ambil state lengkap
      const meRes = await fetch("/api/realm/me", { cache: "no-store" });
      const me = await meRes.json();
      set({
        character: {
          ...me.character,
          questProgress: me.questProgress,
          achievements: me.achievements,
          inventory: me.inventory,
          skills: me.skills,
        },
        dailyClaimed: me.dailyClaimed ?? false,
        screen: "dashboard",
      });
      toast({
        title: data.isNew ? `Selamat datang, ${username}!` : `Selamat datang kembali, ${username}!`,
        description: data.isNew
          ? "Petualanganmu dimulai. Ke Act 1: Awakening!"
          : "Progres petualanganmu telah dipulihkan.",
      });
      return true;
    } catch {
      toast({
        title: "Koneksi terputus",
        description: "Tidak bisa menghubungi realm. Coba lagi.",
        variant: "destructive",
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await fetch("/api/realm/logout", { method: "POST" });
    } catch {
      // ignore
    }
    document.cookie = "goquest_uid=; path=/; max-age=0";
    set({ character: null, screen: "landing", activeQuestId: null, dailyClaimed: false, dailyResult: null });
  },

  navigate: (screen) => set({ screen, activeQuestId: screen === "quest" ? get().activeQuestId : null }),

  openQuest: (questId) => set({ activeQuestId: questId, questPhase: "story", screen: "quest" }),

  setQuestPhase: (phase) => set({ questPhase: phase }),

  notifyChallengePassed: () => {
    playChallengePass();
  },

  notifyBossDefeated: () => {
    playBossDefeat();
  },

  completeQuest: async (questId, score) => {
    try {
      const res = await fetch("/api/realm/quest/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId, score }),
      });
      if (!res.ok) return null;
      const data = await res.json();

      // merge karakter + re-fetch state lengkap (skill/item/achievement baru)
      const prev = get().character;
      const meRes = await fetch("/api/realm/me", { cache: "no-store" });
      const me = meRes.ok
        ? await meRes.json()
        : null;

      set({
        character: prev
          ? {
              ...prev,
              ...(me?.character ?? data.character),
              questProgress: me?.questProgress ?? [
                ...(prev.questProgress ?? []).filter((q) => q.questId !== questId),
                { questId, status: "completed" as const, score, completedAt: new Date().toISOString() },
              ],
              achievements: me?.achievements ?? prev.achievements,
              inventory: me?.inventory ?? prev.inventory,
              skills: me?.skills ?? prev.skills,
            }
          : null,
        dailyClaimed: me?.dailyClaimed ?? get().dailyClaimed,
        lastQuestResult: {
          gainedXp: data.gainedXp,
          gainedGold: data.gainedGold,
          levelsGained: data.levelsGained,
          streak: data.streak,
          unlockedAchievements: data.unlockedAchievements,
          newRank: data.newRank,
        },
        levelUpOverlay:
          data.levelsGained.length > 0 && data.newRank
            ? { levels: data.levelsGained, rank: data.newRank as unknown as Rank }
            : null,
      });

      // toast + sfx untuk achievements
      for (const id of data.unlockedAchievements as string[]) {
        const ach = getAchievement(id);
        if (ach) {
          toast({
            title: `${ach.emoji} Achievement Unlocked: ${ach.name}`,
            description: ach.description,
          });
        }
      }
      if ((data.unlockedAchievements as string[]).length > 0) {
        setTimeout(() => playAchievement(), 600);
      }
      const item = getItem(questId);
      void item;

      return {
        gainedXp: data.gainedXp,
        gainedGold: data.gainedGold,
        levelsGained: data.levelsGained,
        streak: data.streak,
        unlockedAchievements: data.unlockedAchievements,
        newRank: data.newRank,
      };
    } catch {
      toast({
        title: "Gagal menyimpan progress",
        description: "Koneksi ke realm terputus. Coba lagi.",
        variant: "destructive",
      });
      return null;
    }
  },

  claimDaily: async () => {
    try {
      const res = await fetch("/api/realm/daily", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Peti sudah terbuka",
          description: data.error ?? "Reward harian sudah diklaim.",
        });
        return null;
      }

      const prev = get().character;
      const meRes = await fetch("/api/realm/me", { cache: "no-store" });
      const me = meRes.ok ? await meRes.json() : null;

      set({
        character: prev
          ? {
              ...prev,
              ...(me?.character ?? data.character),
              questProgress: me?.questProgress ?? prev.questProgress,
              achievements: me?.achievements ?? prev.achievements,
              inventory: me?.inventory ?? prev.inventory,
              skills: me?.skills ?? prev.skills,
            }
          : null,
        dailyClaimed: true,
        dailyResult: {
          gainedXp: data.gainedXp,
          gainedGold: data.gainedGold,
          levelsGained: data.levelsGained,
          grantedItems: data.grantedItems,
          streak: data.streak,
        },
        levelUpOverlay:
          data.levelsGained.length > 0 && data.newRank
            ? { levels: data.levelsGained, rank: data.newRank as unknown as Rank }
            : null,
      });

      return {
        gainedXp: data.gainedXp,
        gainedGold: data.gainedGold,
        levelsGained: data.levelsGained,
        grantedItems: data.grantedItems,
        streak: data.streak,
      };
    } catch {
      toast({
        title: "Koneksi terputus",
        description: "Tidak bisa menghubungi realm. Coba lagi.",
        variant: "destructive",
      });
      return null;
    }
  },

  dismissDaily: () => set({ dailyResult: null }),

  dismissLevelUp: () => set({ levelUpOverlay: null }),
}));
