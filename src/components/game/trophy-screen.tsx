"use client";

import { motion } from "framer-motion";
import { Trophy, Lock, Sparkles } from "lucide-react";
import { useGame } from "@/game/store";
import { ACHIEVEMENTS } from "@/game/data/core";

// ============================================================
// TROPHY ROOM — galeri achievement yang telah/belum diraih
// ============================================================

export function TrophyScreen() {
  const { character } = useGame();
  if (!character) return null;

  const unlocked = new Set(character.achievements);
  const doneCount = unlocked.size;
  const pct = Math.round((doneCount / ACHIEVEMENTS.length) * 100);

  // urutkan: yang sudah terbuka dulu, sisanya urutan data
  const sorted = [...ACHIEVEMENTS].sort(
    (a, b) => Number(unlocked.has(b.id)) - Number(unlocked.has(a.id)),
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <span className="text-3xl">🏆</span> Trophy Room
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Ruang pameran kenangan kemenanganmu. Setiap trofi punya kisah.
        </p>
      </motion.div>

      {/* progress */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="relative rounded-2xl border border-gold/40 bg-card p-5 sm:p-6 mt-6 overflow-hidden glow-gold"
      >
        <div className="dungeon-grid-fine absolute inset-0 pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ rotate: -12, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", damping: 10, delay: 0.2 }}
              className="w-14 h-14 rounded-2xl bg-gold/15 border border-gold/50 flex items-center justify-center"
            >
              <Trophy className="w-7 h-7 text-gold" />
            </motion.div>
            <div>
              <p className="text-2xl font-black">
                {doneCount}
                <span className="text-muted-foreground text-lg"> / {ACHIEVEMENTS.length}</span>
              </p>
              <p className="text-xs text-muted-foreground">trofi telah menghuni ruangan ini</p>
            </div>
          </div>
          <div className="w-full sm:w-56">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Koleksi</span>
              <span className="text-gold font-bold">{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full xp-bar-shine bg-gradient-to-r from-amber-400 to-yellow-300"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* grid trofi */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {sorted.map((ach, i) => {
          const have = unlocked.has(ach.id);
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.04 }}
              className={`relative rounded-2xl border p-5 ${
                have
                  ? "border-gold/40 bg-gradient-to-br from-gold/10 via-card to-card glow-gold"
                  : "border-border bg-secondary/20"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shrink-0 ${
                    have
                      ? "border-gold/50 bg-gold/10"
                      : "border-border bg-secondary/40 grayscale opacity-50"
                  }`}
                >
                  {have ? ach.emoji : <Lock className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-sm ${have ? "" : "text-muted-foreground"}`}>
                    {ach.name}
                  </p>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      have ? "text-foreground/80" : "text-muted-foreground/80"
                    }`}
                  >
                    {ach.description}
                  </p>
                  <p
                    className={`text-[10px] mt-2 font-mono rounded-md border px-2 py-1 inline-flex items-center gap-1 ${
                      have
                        ? "border-gold/30 bg-gold/5 text-gold"
                        : "border-border bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    {have ? (
                      <>
                        <Sparkles className="w-3 h-3" /> DIRAIH
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" /> {ach.condition}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-muted-foreground text-xs mt-8"
      >
        Trofi terus bertambah seiring petualanganmu. Jangan berhenti menjelajah, Adventurer!
      </motion.p>
    </div>
  );
}
