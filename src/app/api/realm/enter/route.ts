import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * POST /api/realm/enter
 * Masuk ke realm: buat adventurer baru atau lanjutkan petualangan yang ada.
 * Body: { username: string, avatarClass: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { username?: string; avatarClass?: string };
    const username = (body.username ?? "").trim().slice(0, 24);
    const avatarClass = ["swordsman", "mage", "ranger", "alchemist"].includes(
      body.avatarClass ?? "",
    )
      ? body.avatarClass!
      : "mage";

    if (username.length < 2) {
      return NextResponse.json(
        { error: "Nama adventurer minimal 2 karakter." },
        { status: 400 },
      );
    }
    if (!/^[a-zA-Z0-9_ .-]+$/.test(username)) {
      return NextResponse.json(
        { error: "Nama hanya boleh huruf, angka, spasi, titik, strip, underscore." },
        { status: 400 },
      );
    }

    const existing = await db.adventurer.findUnique({ where: { username } });

    let adventurer = existing;
    let isNew = false;

    if (!adventurer) {
      adventurer = await db.adventurer.create({
        data: { username, avatarClass },
      });
      isNew = true;
    } else if (adventurer.avatarClass !== avatarClass) {
      adventurer = await db.adventurer.update({
        where: { username },
        data: { avatarClass },
      });
    }

    const res = NextResponse.json({
      ok: true,
      isNew,
      adventurer: { id: adventurer.id, username: adventurer.username },
    });
    res.cookies.set(SESSION_COOKIE, adventurer.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 tahun
    });
    return res;
  } catch (e) {
    console.error("enter error", e);
    return NextResponse.json({ error: "Gagal memasuki realm." }, { status: 500 });
  }
}
