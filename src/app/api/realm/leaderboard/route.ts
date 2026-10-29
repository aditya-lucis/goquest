import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRank } from "@/game/progression";

/**
 * GET /api/realm/leaderboard
 * Papan peringkat adventurer seluruh realm.
 */
export async function GET() {
  try {
    const adventurers = await db.adventurer.findMany({
      include: { questProgress: { where: { status: "completed" } } },
      orderBy: [{ level: "desc" }, { xp: "desc" }],
      take: 20,
    });

    return NextResponse.json({
      entries: adventurers.map((a, i) => ({
        position: i + 1,
        username: a.username,
        avatarClass: a.avatarClass,
        level: a.level,
        xp: a.xp,
        rank: getRank(a.level).id,
        streak: a.streak,
        questsCompleted: a.questProgress.length,
      })),
    });
  } catch (e) {
    console.error("leaderboard error", e);
    return NextResponse.json({ entries: [] }, { status: 500 });
  }
}
