import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "goquest_uid";

/** Ambil adventurer dari cookie session */
export async function getSessionAdventurer() {
  const cookieStore = await cookies();
  const uid = cookieStore.get(SESSION_COOKIE)?.value;
  if (!uid) return null;
  try {
    return await db.adventurer.findUnique({
      where: { id: uid },
      include: {
        questProgress: true,
        achievements: true,
        inventoryItems: true,
        skillUnlocks: true,
      },
    });
  } catch {
    return null;
  }
}

/** Tanggal hari ini (YYYY-MM-DD) versi lokal Jakarta */
export function todayJakarta(): string {
  const now = new Date();
  const jakarta = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7
  return jakarta.toISOString().slice(0, 10);
}

/** Tanggal kemarin (YYYY-MM-DD) versi Jakarta */
export function yesterdayJakarta(): string {
  const now = new Date();
  const jakarta = new Date(now.getTime() + 7 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  return jakarta.toISOString().slice(0, 10);
}
