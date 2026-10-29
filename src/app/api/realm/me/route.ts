import { NextResponse } from "next/server";
import { getSessionAdventurer, todayJakarta } from "@/lib/session";
import { getRank } from "@/game/progression";

/**
 * GET /api/realm/me
 * State lengkap karakter: stats, progress quest, achievement, inventory, skill,
 * plus status klaim daily reward.
 */
export async function GET() {
  const adv = await getSessionAdventurer();
  if (!adv) {
    return NextResponse.json({ error: "Belum masuk realm." }, { status: 401 });
  }

  return NextResponse.json({
    character: {
      id: adv.id,
      username: adv.username,
      avatarClass: adv.avatarClass,
      level: adv.level,
      xp: adv.xp,
      gold: adv.gold,
      streak: adv.streak,
      bestStreak: adv.bestStreak,
      lastActiveDay: adv.lastActiveDay,
      lastDailyClaim: adv.lastDailyClaim,
      rank: getRank(adv.level).id,
    },
    dailyClaimed: adv.lastDailyClaim === todayJakarta(),
    questProgress: adv.questProgress.map((q) => ({
      questId: q.questId,
      status: q.status,
      score: q.score,
      completedAt: q.completedAt?.toISOString() ?? null,
    })),
    achievements: adv.achievements.map((a) => a.achievementId),
    inventory: adv.inventoryItems.map((i) => i.itemId),
    skills: adv.skillUnlocks.map((s) => s.skillId),
  });
}
