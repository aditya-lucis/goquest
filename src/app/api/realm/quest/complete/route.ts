import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionAdventurer, todayJakarta, yesterdayJakarta } from "@/lib/session";
import { getQuest, QUESTS } from "@/game/data/quests";
import { applyXp, getRank } from "@/game/progression";

/**
 * POST /api/realm/quest/complete
 * Body: { questId: string, score: number }
 * Menghitung XP, gold, streak, unlock item/skill/achievement — semua atomik.
 */
export async function POST(req: NextRequest) {
  const adv = await getSessionAdventurer();
  if (!adv) {
    return NextResponse.json({ error: "Belum masuk realm." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { questId?: string; score?: number };
    const questId = body.questId ?? "";
    const score = Math.max(0, Math.min(100, Math.round(body.score ?? 70)));
    const quest = getQuest(questId);

    if (!quest || quest.comingSoon) {
      return NextResponse.json({ error: "Quest tidak ditemukan." }, { status: 404 });
    }

    const existingProgress = adv.questProgress.find((q) => q.questId === questId);
    const alreadyCompleted = existingProgress?.status === "completed";

    // ---------------- STREAK ----------------
    const today = todayJakarta();
    let streak = adv.streak;
    if (adv.lastActiveDay === today) {
      // sudah aktif hari ini — streak tetap
    } else if (adv.lastActiveDay === yesterdayJakarta()) {
      streak += 1;
    } else {
      streak = 1;
    }
    const bestStreak = Math.max(adv.bestStreak, streak);

    // ---------------- XP & LEVEL ----------------
    const gainedXp = alreadyCompleted ? Math.round(quest.xpReward * 0.1) : quest.xpReward;
    const gainedGold = alreadyCompleted ? Math.round(quest.goldReward * 0.25) : quest.goldReward;
    const { level, xp, levelsGained } = applyXp(adv.level, adv.xp, gainedXp);

    // ---------------- PERSIST ----------------
    const [updated] = await db.$transaction([
      db.adventurer.update({
        where: { id: adv.id },
        data: {
          level,
          xp,
          gold: adv.gold + gainedGold,
          streak,
          bestStreak,
          lastActiveDay: today,
        },
      }),
      db.questProgress.upsert({
        where: { adventurerId_questId: { adventurerId: adv.id, questId } },
        create: { adventurerId: adv.id, questId, status: "completed", score, completedAt: new Date() },
        update: alreadyCompleted
          ? { score: Math.max(existingProgress!.score, score) }
          : { status: "completed", score, completedAt: new Date() },
      }),
    ]);

    // ---------------- REWARDS ----------------
    if (!alreadyCompleted) {
      if (quest.itemReward) {
        await db.inventoryItem.upsert({
          where: { adventurerId_itemId: { adventurerId: adv.id, itemId: quest.itemReward } },
          create: { adventurerId: adv.id, itemId: quest.itemReward },
          update: {},
        });
      }
      await db.skillUnlock.upsert({
        where: { adventurerId_skillId: { adventurerId: adv.id, skillId: quest.skillId } },
        create: { adventurerId: adv.id, skillId: quest.skillId },
        update: {},
      });
    }

    // ---------------- ACHIEVEMENTS ----------------
    const completedIds = new Set(
      [...adv.questProgress.filter((q) => q.status === "completed").map((q) => q.questId), questId],
    );
    const playableAct1 = QUESTS.filter((q) => q.act === 1 && !q.comingSoon);
    const playableAct2 = QUESTS.filter((q) => q.act === 2 && !q.comingSoon);
    const playableAct3 = QUESTS.filter((q) => q.act === 3 && !q.comingSoon);

    const unlockedAchievements: string[] = [];
    const currentAchievements = new Set(adv.achievements.map((a) => a.achievementId));

    const candidates: Array<[string, boolean]> = [
      ["ach-first-step", completedIds.size >= 1],
      ["ach-hello-world", completedIds.has("q1-2")],
      ["ach-bug-slayer", completedIds.size >= 1],
      ["ach-act1", playableAct1.every((q) => completedIds.has(q.id))],
      ["ach-act2", playableAct2.length > 0 && playableAct2.every((q) => completedIds.has(q.id))],
      ["ach-act3", playableAct3.length > 0 && playableAct3.every((q) => completedIds.has(q.id))],
      ["ach-level5", level >= 5],
      ["ach-level10", level >= 10],
      ["ach-streak3", streak >= 3],
      ["ach-streak7", streak >= 7],
      ["ach-perfect", score >= 100],
      ["ach-gold500", updated.gold >= 500],
    ];

    for (const [id, cond] of candidates) {
      if (cond && !currentAchievements.has(id)) {
        unlockedAchievements.push(id);
      }
    }

    for (const id of unlockedAchievements) {
      await db.achievement.upsert({
        where: { adventurerId_achievementId: { adventurerId: adv.id, achievementId: id } },
        create: { adventurerId: adv.id, achievementId: id },
        update: {},
      });
    }

    return NextResponse.json({
      ok: true,
      alreadyCompleted,
      gainedXp,
      gainedGold,
      levelsGained,
      streak,
      newRank: levelsGained.length > 0 ? getRank(level) : null,
      unlockedAchievements,
      character: {
        id: updated.id,
        username: updated.username,
        avatarClass: updated.avatarClass,
        level: updated.level,
        xp: updated.xp,
        gold: updated.gold,
        streak: updated.streak,
        bestStreak: updated.bestStreak,
        lastActiveDay: updated.lastActiveDay,
      },
    });
  } catch (e) {
    console.error("quest complete error", e);
    return NextResponse.json({ error: "Gagal menyelesaikan quest." }, { status: 500 });
  }
}
