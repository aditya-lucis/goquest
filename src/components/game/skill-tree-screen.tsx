"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Lock, Sparkles, Zap } from "lucide-react";
import { useGame } from "@/game/store";
import { SKILL_TREE } from "@/game/data/core";
import { getQuest, isActUnlocked } from "@/game/data/quests";

// ============================================================
// SKILL TREE — pohon keahlian: setiap quest menyetor satu node
// ============================================================

const ACT_THEME = {
  1: {
    text: "text-cyan-300",
    border: "border-cyan-400/40",
    glow: "glow-cyan",
    ring: "bg-cyan-400/10 border-cyan-400/50",
    line: "bg-cyan-400/30",
    chip: "text-cyan-200",
  },
  2: {
    text: "text-violet-300",
    border: "border-violet-400/40",
    glow: "glow-purple",
    ring: "bg-violet-400/10 border-violet-400/50",
    line: "bg-violet-400/30",
    chip: "text-violet-200",
  },
  3: {
    text: "text-amber-300",
    border: "border-amber-400/40",
    glow: "glow-gold",
    ring: "bg-amber-400/10 border-amber-400/50",
    line: "bg-amber-400/30",
    chip: "text-amber-200",
  },
} as const;

export function SkillTreeScreen() {
  const { character, openQuest } = useGame();
  if (!character) return null;

  const unlocked = new Set(character.skills);
  const completedIds = new Set(
    character.questProgress.filter((q) => q.status === "completed").map((q) => q.questId),
  );

  // node "available" = semua prerequisite terbuka tapi node ini belum
  const isAvailable = (requires: string[]) =>
    requires.length > 0 && requires.every((r) => unlocked.has(r)) === true;

  const totalUnlocked = unlocked.size;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <span className="text-3xl">🌳</span> Skill Tree
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Setiap quest yang dituntaskan menyalakan satu rune keahlian.{" "}
          <span className="text-neon font-semibold">
            {totalUnlocked}/{SKILL_TREE.length}
          </span>{" "}
          rune telah menyala dalam jiwamu.
        </p>
        {/* progress keseluruhan */}
        <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden max-w-md">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-300 xp-bar-shine"
            initial={{ width: 0 }}
            animate={{ width: `${(totalUnlocked / SKILL_TREE.length) * 100}%` }}
            transition={{ duration: 0.9 }}
          />
        </div>
      </motion.div>

      <div className="mt-8 space-y-10">
        {([1, 2, 3] as const).map((act) => {
          const theme = ACT_THEME[act];
          const nodes = SKILL_TREE.filter((s) => s.act === act);
          const actUnlocked = isActUnlocked(act, [...completedIds]);
          const doneCount = nodes.filter((n) => unlocked.has(n.id)).length;

          return (
            <motion.section
              key={act}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (act - 1) * 0.12 }}
              className={`relative rounded-2xl border ${theme.border} bg-card p-5 sm:p-6 ${
                actUnlocked ? "" : "opacity-70"
              }`}
            >
              <div className="dungeon-grid-fine absolute inset-0 pointer-events-none rounded-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                  <h2 className={`font-black text-base sm:text-lg ${theme.text}`}>
                    {act === 1 ? "🌅 Act 1 — Fundamentals" : act === 2 ? "🔮 Act 2 — Intermediate" : "👑 Act 3 — Legendary"}
                  </h2>
                  <span className={`text-xs font-bold ${theme.chip}`}>
                    {doneCount}/{nodes.length} rune
                  </span>
                </div>

                {/* rantai skill vertikal */}
                <div className="relative">
                  <div className={`absolute left-[21px] top-3 bottom-3 w-0.5 ${theme.line}`} />
                  <div className="space-y-3">
                    {nodes.map((node, i) => {
                      const isUnlocked = unlocked.has(node.id);
                      const available = !isUnlocked && isAvailable(node.requires) && actUnlocked;
                      const quest = getQuest(node.questId);
                      const questDone = quest ? completedIds.has(quest.id) : false;

                      return (
                        <motion.div
                          key={node.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className="relative flex items-center gap-4"
                        >
                          {/* node */}
                          <div
                            className={`relative z-10 w-[44px] h-[44px] rounded-xl border-2 flex items-center justify-center text-xl shrink-0 ${
                              isUnlocked
                                ? `${theme.ring} ${theme.glow} bg-card`
                                : available
                                  ? `${theme.ring} animate-pulse-glow bg-card`
                                  : "border-border bg-secondary/40 opacity-50 grayscale"
                            }`}
                          >
                            {node.emoji}
                            {isUnlocked ? (
                              <span className="absolute -right-1.5 -top-1.5 w-[18px] h-[18px] rounded-full bg-emerald-500 flex items-center justify-center border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </span>
                            ) : null}
                          </div>

                          {/* info */}
                          <div
                            className={`flex-1 min-w-0 rounded-xl border px-4 py-3 ${
                              isUnlocked
                                ? "border-border bg-secondary/30"
                                : available
                                  ? `${theme.border} bg-secondary/20`
                                  : "border-border/60 bg-secondary/10 opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="font-bold text-sm">{node.name}</p>
                              {isUnlocked ? (
                                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-400/40 bg-emerald-400/10 rounded px-1.5 py-0.5">
                                  Aktif
                                </span>
                              ) : available ? (
                                <span className="text-[9px] font-black uppercase tracking-wider text-neon border border-neon/40 bg-cyan-400/10 rounded px-1.5 py-0.5 flex items-center gap-1">
                                  <Zap className="w-2.5 h-2.5" /> Bisa dibuka
                                </span>
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {node.description}
                            </p>
                            {quest && !questDone ? (
                              <button
                                onClick={() => openQuest(quest.id)}
                                disabled={quest.comingSoon || !actUnlocked}
                                className={`mt-2 text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                                  quest.comingSoon || !actUnlocked
                                    ? "text-muted-foreground cursor-not-allowed"
                                    : `${theme.text} hover:underline`
                                }`}
                              >
                                <Sparkles className="w-3 h-3" />
                                Buka lewat: {quest.title}
                                {quest.comingSoon ? " (segera)" : ""}
                              </button>
                            ) : null}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {!actUnlocked ? (
                  <p className="relative text-[11px] text-muted-foreground mt-4 flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> Tuntaskan Act {act - 1} untuk menyalakan cabang ini
                  </p>
                ) : null}
              </div>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
