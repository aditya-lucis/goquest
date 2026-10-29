"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Flame, Target, BookOpen, Clock, Swords,
  CheckCircle2, Lock, Sparkles, Gift, Coins, Zap, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { getRank, getNextRank, xpForNextLevel } from "@/game/progression";
import { getAvatarClass, getItem } from "@/game/data/core";
import { getNextQuest, QUESTS, getQuestsByAct, actProgress } from "@/game/data/quests";
import { playDailyReward } from "@/lib/sfx";

// ============================================================
// DASHBOARD — Camp adventurer
// ============================================================

export function DashboardScreen() {
  const { character, openQuest, navigate } = useGame();
  const [claiming, setClaiming] = useState(false);
  if (!character) return null;

  const completedIds = character.questProgress
    .filter((q) => q.status === "completed")
    .map((q) => q.questId);
  const nextQuest = getNextQuest(completedIds);
  const rank = getRank(character.level);
  const nextRank = getNextRank(character.level);
  const nextXp = xpForNextLevel(character.level);
  const pct = Math.min(100, Math.round((character.xp / nextXp) * 100));
  const cls = getAvatarClass(character.avatarClass);
  const totalQuests = QUESTS.filter((q) => !q.comingSoon).length;
  const doneQuests = completedIds.length;
  const totalPct = Math.round((doneQuests / totalQuests) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-black">
          Selamat datang kembali,{" "}
          <span className="text-glow-purple bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
            {character.username}
          </span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {cls.emoji} {cls.name} • {rank.title}
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5 mt-7">
        {/* ============ KOLOM UTAMA ============ */}
        <div className="lg:col-span-2 space-y-5">
          {/* continue quest */}
          {nextQuest ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="relative rounded-2xl border border-primary/40 bg-card overflow-hidden glow-purple"
            >
              <div className="dungeon-grid absolute inset-0 pointer-events-none" />
              <div className="relative p-5 sm:p-6">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neon mb-3">
                  <Swords className="w-3.5 h-3.5" />
                  Quest Berikutnya — Act {nextQuest.act}
                </div>
                <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3">
                  <span className="text-3xl">{nextQuest.emoji}</span>
                  {nextQuest.title}
                </h2>
                <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
                  {nextQuest.subtitle}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                  <span className="rounded-full bg-primary/15 border border-primary/30 px-2.5 py-1 text-violet-200 font-semibold">
                    +{nextQuest.xpReward} XP
                  </span>
                  <span className="rounded-full bg-gold/10 border border-gold/30 px-2.5 py-1 text-gold font-semibold">
                    +{nextQuest.goldReward} Gold
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground capitalize">
                    {nextQuest.difficulty === "epic" ? "Epic ⚡" : nextQuest.difficulty}
                  </span>
                </div>
                <Button
                  size="lg"
                  className="mt-5 w-full sm:w-auto font-bold bg-primary hover:bg-primary/90"
                  onClick={() => openQuest(nextQuest.id)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Masuki Quest
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-gold/40 bg-card p-8 text-center glow-gold">
              <p className="text-4xl mb-3">👑</p>
              <h2 className="text-xl font-black text-gold">Semua Quest Tuntas!</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Kau telah menaklukkan seluruh 20 quest realm GoQuest — dari Hello World hingga
                graceful shutdown. Jagalah streak-mu, raih mahkota Go Legend, dan jadilah inspirasi
                bagi adventurer berikutnya!
              </p>
            </div>
          )}

          {/* progress per act */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-neon" />
              Kemajuan Petualangan
            </h3>
            <div className="space-y-4">
              {([1, 2, 3] as const).map((act) => {
                const prog = actProgress(act, completedIds);
                const actQuests = getQuestsByAct(act);
                const playableCount = actQuests.filter((q) => !q.comingSoon).length;
                return (
                  <button
                    key={act}
                    className="w-full text-left group"
                    onClick={() => navigate("world-map")}
                  >
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-semibold group-hover:text-neon transition-colors">
                        Act {act} — {act === 1 ? "Awakening" : act === 2 ? "The Power Within" : "Legendary Path"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {prog}% ({playableCount} quest)
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          act === 1
                            ? "bg-gradient-to-r from-cyan-400 to-cyan-300"
                            : act === 2
                              ? "bg-gradient-to-r from-violet-500 to-fuchsia-400"
                              : "bg-gradient-to-r from-amber-400 to-yellow-300"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${prog}%` }}
                        transition={{ duration: 0.9, delay: 0.2 + act * 0.1 }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* recent quests */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neon" />
              Riwayat Kemenangan
            </h3>
            {doneQuests === 0 ? (
              <p className="text-muted-foreground text-sm">
                Belum ada quest yang dituntaskan. Selesaikan quest pertamamu dan ukir namamu!
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {character.questProgress
                  .filter((q) => q.status === "completed")
                  .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
                  .map((qp) => {
                    const q = QUESTS.find((x) => x.id === qp.questId);
                    if (!q) return null;
                    return (
                      <button
                        key={qp.questId}
                        onClick={() => openQuest(qp.questId)}
                        className="w-full flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 hover:border-primary/40 transition-colors text-left"
                      >
                        <span className="text-xl">{q.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{q.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Act {q.act} • Quest {q.order}
                          </p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      </button>
                    );
                  })}
              </div>
            )}
          </motion.div>
        </div>

        {/* ============ SIDEBAR PANEL ============ */}
        <div className="space-y-5">
          {/* character card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-5 text-center relative overflow-hidden"
          >
            <div className="dungeon-grid-fine absolute inset-0 pointer-events-none" />
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/15 border-2 border-primary/40 flex items-center justify-center text-4xl animate-float-slow">
                {cls.emoji}
              </div>
              <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${rank.color}`}>
                {rank.name}
              </p>
              <p className="text-2xl font-black mt-0.5">Level {character.level}</p>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>EXP</span>
                  <span>
                    {character.xp}/{nextXp}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full xp-bar-shine bg-gradient-to-r from-violet-500 to-fuchsia-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay: 0.3 }}
                  />
                </div>
              </div>
              {nextRank ? (
                <p className="text-[11px] text-muted-foreground mt-2.5">
                  {nextXp - character.xp} XP lagi menuju{" "}
                  <span className={nextRank.color + " font-semibold"}>{nextRank.name}</span>
                </p>
              ) : (
                <p className="text-[11px] text-gold mt-2.5 font-semibold">PUNCAK KARIER TERCAPAI 👑</p>
              )}
            </div>
          </motion.div>

          {/* daily reward chest */}
          <DailyRewardCard claiming={claiming} setClaiming={setClaiming} />

          {/* stats ringkas */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h3 className="font-bold text-sm mb-3">Statistik</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <StatBox label="Quest" value={`${doneQuests}/${totalQuests}`} />
              <StatBox label="Gold" value={String(character.gold)} gold />
              <StatBox label="Skill" value={String(character.skills.length)} />
              <StatBox label="Trofi" value={String(character.achievements.length)} />
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                <span>Progress realm keseluruhan</span>
                <span className="text-foreground font-semibold">{totalPct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalPct}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DAILY REWARD CARD — peti harta harian
// ============================================================

function DailyRewardCard({
  claiming,
  setClaiming,
}: {
  claiming: boolean;
  setClaiming: (v: boolean) => void;
}) {
  const { character, dailyClaimed, claimDaily, dailyResult, dismissDaily } = useGame();
  if (!character) return null;

  const streakBonus = Math.min(character.streak, 7);
  const previewXp = 40 + streakBonus * 10;
  const previewGold = 20 + streakBonus * 5;

  const handleClaim = async () => {
    if (claiming || dailyClaimed) return;
    setClaiming(true);
    playDailyReward(); // jingle saat peti dibuka
    await claimDaily();
    setClaiming(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className={`relative rounded-2xl border p-5 overflow-hidden ${
          dailyClaimed
            ? "border-border bg-card"
            : "border-gold/50 bg-card glow-gold"
        }`}
      >
        {!dailyClaimed ? (
          <div className="dungeon-grid-fine absolute inset-0 pointer-events-none" />
        ) : null}
        <div className="relative">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
            <Gift className={`w-4 h-4 ${dailyClaimed ? "text-muted-foreground" : "text-gold"}`} />
            Daily Reward
          </h3>

          {/* peti */}
          <div className="rounded-xl bg-secondary/50 border border-border p-4 text-center">
            <motion.div
              className="text-5xl mx-auto"
              animate={
                dailyClaimed
                  ? { rotate: 0, scale: 1 }
                  : { rotate: [-4, 4, -4], scale: [1, 1.05, 1] }
              }
              transition={
                dailyClaimed
                  ? undefined
                  : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
              }
            >
              {dailyClaimed ? "📭" : "🎁"}
            </motion.div>

            {dailyClaimed ? (
              <>
                <p className="text-sm font-semibold mt-3 text-emerald-300 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Sudah diklaim hari ini
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Peti baru muncul besok — jaga streak-mu tetap menyala! 🔥
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold mt-3">
                  Peti Reward Harian menunggu!
                </p>
                <div className="flex items-center justify-center gap-3 mt-2.5 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-1 text-violet-200 font-semibold">
                    <Zap className="w-3 h-3" /> +{previewXp} XP
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 border border-gold/30 px-2.5 py-1 text-gold font-semibold">
                    <Coins className="w-3 h-3" /> +{previewGold} Gold
                  </span>
                </div>
                {streakBonus > 0 ? (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    termasuk bonus streak ×{streakBonus} 🔥
                  </p>
                ) : null}
                <Button
                  size="lg"
                  disabled={claiming}
                  className="mt-4 w-full font-bold bg-gold text-black hover:bg-gold/90"
                  onClick={handleClaim}
                >
                  {claiming ? "Membuka peti..." : "🎁 Klaim Reward"}
                </Button>
              </>
            )}
          </div>

          {/* streak tracker */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                Streak: <span className="text-foreground font-bold">{character.streak} hari</span>
              </span>
              <span className="text-muted-foreground">Best: {character.bestStreak}</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < Math.min(character.streak, 7)
                      ? "bg-gradient-to-r from-orange-400 to-amber-300"
                      : "bg-secondary"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Streak naik tiap hari kamu menyelesaikan quest. Bonus peti tumbuh sampai ×7!
            </p>
          </div>
        </div>
      </motion.div>

      {/* ====== modal perayaan klaim ====== */}
      <AnimatePresence>
        {dailyResult ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={dismissDaily}
          >
            <motion.div
              initial={{ scale: 0.7, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", damping: 16 }}
              className="relative max-w-sm w-full rounded-3xl border border-gold/50 bg-card p-8 text-center overflow-hidden glow-gold"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dungeon-grid absolute inset-0 pointer-events-none" />

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative text-[10px] font-black uppercase tracking-[0.35em] text-gold"
              >
                Daily Reward
              </motion.p>

              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10, delay: 0.25 }}
                className="relative text-6xl mt-3"
              >
                🎁
              </motion.div>

              {/* partikel koin */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-lg"
                  style={{ left: "50%", top: "45%" }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                  animate={{
                    x: (i % 2 === 0 ? 1 : -1) * (50 + (i % 4) * 32),
                    y: -40 - (i % 3) * 45,
                    opacity: 0,
                    scale: 1.1,
                  }}
                  transition={{ duration: 1.1, delay: 0.3 + i * 0.05, ease: "easeOut" }}
                >
                  {i % 3 === 0 ? "✨" : "🪙"}
                </motion.span>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative space-y-2 mt-5"
              >
                <div className="flex items-center justify-center gap-2 text-lg font-black text-violet-200">
                  <Zap className="w-5 h-5" /> +{dailyResult.gainedXp} XP
                </div>
                <div className="flex items-center justify-center gap-2 text-lg font-black text-gold">
                  <Coins className="w-5 h-5" /> +{dailyResult.gainedGold} Gold
                </div>
              </motion.div>

              {dailyResult.grantedItems.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="relative mt-4 space-y-1.5"
                >
                  {dailyResult.grantedItems.map((id) => {
                    const item = getItem(id);
                    if (!item) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-left"
                      >
                        <span className="text-xl">{item.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                        <Package className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
                      </div>
                    );
                  })}
                </motion.div>
              ) : null}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="relative mt-6"
              >
                <Button
                  size="lg"
                  className="font-bold bg-gold text-black hover:bg-gold/90"
                  onClick={dismissDaily}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Lanjutkan!
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function StatBox({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="rounded-xl bg-secondary/50 border border-border px-3 py-2.5 text-center">
      <p className={`text-lg font-black ${gold ? "text-gold" : ""}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}

export function QuestLockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Lock className="w-3 h-3" /> Terkunci
    </span>
  );
}
