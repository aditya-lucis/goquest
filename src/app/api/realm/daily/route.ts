import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionAdventurer, todayJakarta } from "@/lib/session";
import { applyXp, getRank } from "@/game/progression";

/**
 * POST /api/realm/daily — klaim daily reward (sekali per hari, zona Jakarta).
 * Reward tumbuh bersama streak: XP = 40 + min(streak,7)*10, Gold = 20 + min(streak,7)*5.
 * Milestone item: streak >= 7 → Title: Streak Master.
 */
export async function POST() {
  const adv = await getSessionAdventurer();
  if (!adv) {
    return NextResponse.json({ error: "Belum masuk realm." }, { status: 401 });
  }

  const today = todayJakarta();

  if (adv.lastDailyClaim === today) {
    return NextResponse.json(
      { error: "Reward harian sudah diklaim. Kembali besok!" },
      { status: 400 },
    );
  }

  // ---------------- HITUNG REWARD ----------------
  const streakBonus = Math.min(adv.streak, 7);
  const gainedXp = 40 + streakBonus * 10;
  const gainedGold = 20 + streakBonus * 5;

  const { level, xp, levelsGained } = applyXp(adv.level, adv.xp, gainedXp);

  // ---------------- PERSIST ----------------
  const [updated] = await db.$transaction([
    db.adventurer.update({
      where: { id: adv.id },
      data: {
        level,
        xp,
        gold: adv.gold + gainedGold,
        lastDailyClaim: today,
      },
    }),
  ]);

  // ---------------- ITEM MILESTONE ----------------
  const grantedItems: string[] = [];

  // Flask of Daily Flame — selalu dicoba (upsert, sekali seumur hidup)
  await db.inventoryItem.upsert({
    where: { adventurerId_itemId: { adventurerId: adv.id, itemId: "item-potion-daily" } },
    create: { adventurerId: adv.id, itemId: "item-potion-daily" },
    update: {},
  });
  grantedItems.push("item-potion-daily");

  // Streak >= 7 → Title: Streak Master
  if (adv.streak >= 7) {
    const existingTitle = await db.inventoryItem.findUnique({
      where: { adventurerId_itemId: { adventurerId: adv.id, itemId: "title-streak-master" } },
    });
    if (!existingTitle) {
      await db.inventoryItem.create({
        data: { adventurerId: adv.id, itemId: "title-streak-master" },
      });
      grantedItems.push("title-streak-master");
    }
  }

  return NextResponse.json({
    ok: true,
    claimed: true,
    gainedXp,
    gainedGold,
    levelsGained,
    newRank: levelsGained.length > 0 ? getRank(level) : null,
    grantedItems,
    streak: adv.streak,
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
      lastDailyClaim: updated.lastDailyClaim,
    },
  });
}
