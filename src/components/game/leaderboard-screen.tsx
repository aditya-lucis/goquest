"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Flame, RefreshCw, Swords } from "lucide-react";
import { useGame } from "@/game/store";
import { getAvatarClass } from "@/game/data/core";
import { rankById } from "@/game/progression";
import type { LeaderboardEntry } from "@/game/types";

// ============================================================
// LEADERBOARD — Hall of Fame para adventurer realm
// ============================================================

const MEDAL = ["🥇", "🥈", "🥉"];

export function LeaderboardScreen() {
  const { character } = useGame();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/realm/leaderboard", { cache: "no-store" });
      const data = await res.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const podium = (entries ?? []).slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-3 flex-wrap"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <Crown className="w-8 h-8 text-gold" /> Hall of Fame
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Para adventurer terkuat di seluruh realm GoQuest.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Muat ulang
        </button>
      </motion.div>

      {/* ============ PODIUM ============ */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-7 items-end">
        {[1, 0, 2].map((podiumIdx, i) => {
          const entry = podium[podiumIdx];
          if (!entry) {
            return (
              <div
                key={i}
                className="rounded-2xl border border-dashed border-border bg-secondary/10 p-4 text-center text-muted-foreground text-xs h-40 flex items-center justify-center"
              >
                Kursi kosong
              </div>
            );
          }
          const cls = getAvatarClass(entry.avatarClass);
          const rank = rankById(entry.rank);
          const heights = ["h-48", "h-40", "h-36"];
          const styles = [
            "border-gold/60 bg-gradient-to-b from-gold/15 to-card glow-gold",
            "border-slate-300/40 bg-gradient-to-b from-slate-300/10 to-card",
            "border-amber-600/50 bg-gradient-to-b from-amber-600/10 to-card",
          ];
          return (
            <motion.div
              key={entry.username}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className={`relative rounded-2xl border p-4 text-center ${styles[podiumIdx]} ${heights[podiumIdx]} flex flex-col items-center justify-center`}
            >
              <span className="text-2xl sm:text-3xl absolute top-3 left-1/2 -translate-x-1/2">
                {MEDAL[podiumIdx]}
              </span>
              <div className="w-14 h-14 rounded-2xl bg-secondary/70 border border-border flex items-center justify-center text-3xl mt-6">
                {cls.emoji}
              </div>
              <p className="font-bold text-sm mt-2 truncate w-full px-1">{entry.username}</p>
              <p className={`text-xs font-bold ${rank.color}`}>Lv. {entry.level} {rank.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                {entry.xp.toLocaleString("id-ID")} XP
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* ============ TABEL ============ */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-border bg-card mt-6 overflow-hidden"
      >
        <div className="grid grid-cols-[40px_1fr_auto_auto_auto] sm:grid-cols-[52px_1fr_90px_80px_70px_90px] items-center gap-2 px-4 py-3 border-b border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          <span>#</span>
          <span>Adventurer</span>
          <span className="hidden sm:block text-right">Rank</span>
          <span className="text-right">Level</span>
          <span className="text-right hidden sm:block">Streak</span>
          <span className="text-right">Quest</span>
        </div>

        {loading && entries === null ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 px-4 flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-secondary animate-pulse" />
                <div className="h-4 w-40 rounded bg-secondary animate-pulse" />
              </div>
            ))}
          </div>
        ) : entries !== null && entries.length === 0 ? (
          <div className="py-14 text-center">
            <Swords className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Papan peringkat masih kosong. Jadilah legenda pertama!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(entries ?? []).map((e, i) => {
              const cls = getAvatarClass(e.avatarClass);
              const rank = rankById(e.rank);
              const isMe = character?.username === e.username;
              return (
                <motion.div
                  key={e.username + i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                  className={`grid grid-cols-[40px_1fr_auto_auto_auto] sm:grid-cols-[52px_1fr_90px_80px_70px_90px] items-center gap-2 px-4 py-3 text-sm ${
                    isMe ? "bg-primary/10" : ""
                  }`}
                >
                  <span className="font-mono font-bold text-muted-foreground">
                    {i < 3 ? MEDAL[i] : e.position}
                  </span>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{cls.emoji}</span>
                    <p className="font-semibold truncate">
                      {e.username}
                      {isMe ? (
                        <span className="ml-1.5 text-[9px] font-black text-neon border border-neon/40 rounded px-1 py-px align-middle">
                          KAMU
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span className={`text-xs font-bold hidden sm:block text-right ${rank.color}`}>
                    {rank.name}
                  </span>
                  <span className="font-bold text-right">{e.level}</span>
                  <span className="text-right hidden sm:flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <Flame className="w-3 h-3 text-orange-400" />
                    {e.streak}
                  </span>
                  <span className="text-right font-mono text-xs text-muted-foreground">
                    {e.questsCompleted}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <p className="text-center text-muted-foreground text-xs mt-6">
        Peringkat dihitung dari Level, lalu total XP. Selesaikan quest untuk mendaki takhta!
      </p>
    </div>
  );
}
