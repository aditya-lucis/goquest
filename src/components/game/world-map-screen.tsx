"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Lock, Play, Sparkles, Clock } from "lucide-react";
import { useGame } from "@/game/store";
import { ACTS, getQuestsByAct, isActUnlocked, actProgress } from "@/game/data/quests";
import type { Quest } from "@/game/types";

// ============================================================
// WORLD MAP — peta petualangan 3 Act dengan jalur quest
// ============================================================

const ACT_THEME = {
  1: {
    border: "border-cyan-400/40",
    glow: "glow-cyan",
    text: "text-cyan-300",
    line: "from-cyan-400/60",
    chip: "bg-cyan-400/10 text-cyan-200 border-cyan-400/30",
  },
  2: {
    border: "border-violet-400/40",
    glow: "glow-purple",
    text: "text-violet-300",
    line: "from-violet-400/60",
    chip: "bg-violet-400/10 text-violet-200 border-violet-400/30",
  },
  3: {
    border: "border-amber-400/40",
    glow: "glow-gold",
    text: "text-amber-300",
    line: "from-amber-400/60",
    chip: "bg-amber-400/10 text-amber-200 border-amber-400/30",
  },
} as const;

export function WorldMapScreen() {
  const { character, openQuest } = useGame();
  if (!character) return null;

  const completedIds = new Set(
    character.questProgress.filter((q) => q.status === "completed").map((q) => q.questId),
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <span className="text-3xl">🗺️</span> World Map
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Pilih jalurmu, Adventurer. Setiap quest adalah langkah menuju{" "}
          <span className="text-gold font-semibold">Go Legend</span>.
        </p>
      </motion.div>

      <div className="mt-8 space-y-12">
        {ACTS.map((act, actIdx) => {
          const theme = ACT_THEME[act.id];
          const quests = getQuestsByAct(act.id);
          const unlocked = isActUnlocked(act.id, [...completedIds]);
          const prog = actProgress(act.id, [...completedIds]);
          // quest "current" = quest playable pertama di act ini yang belum tuntas
          const currentQuestId = unlocked
            ? quests.find((q) => !q.comingSoon && !completedIds.has(q.id))?.id
            : undefined;

          return (
            <motion.section
              key={act.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: actIdx * 0.12 }}
            >
              {/* act header */}
              <div
                className={`relative rounded-2xl border ${theme.border} bg-card p-5 sm:p-6 overflow-hidden ${
                  unlocked ? "" : "opacity-70"
                }`}
              >
                <div className="dungeon-grid absolute inset-0 pointer-events-none" />
                <div className="relative flex flex-wrap items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/80 border border-border flex items-center justify-center text-3xl shrink-0">
                    {act.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className={`text-lg sm:text-xl font-black ${theme.text}`}>{act.title}</h2>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mt-0.5">
                      {act.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${theme.chip}`}>
                      {prog}% tuntas
                    </span>
                    {!unlocked ? (
                      <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 justify-end">
                        <Lock className="w-3 h-3" /> Tuntaskan Act {act.id - 1}
                      </p>
                    ) : null}
                  </div>
                </div>
                {/* progress line */}
                <div className="relative mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${theme.line} to-transparent`}
                    initial={{ width: 0 }}
                    animate={{ width: `${prog}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>

              {/* quest path */}
              <div className="relative mt-6 pl-2">
                {/* garis vertikal jalur */}
                <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-border sm:left-[31px]" />

                <div className="space-y-3">
                  {quests.map((quest, qi) => {
                    const done = completedIds.has(quest.id);
                    const isCurrent = quest.id === currentQuestId;
                    const locked = !unlocked && !done;

                    return (
                      <QuestNode
                        key={quest.id}
                        quest={quest}
                        index={qi}
                        done={done}
                        current={isCurrent}
                        locked={locked}
                        actTheme={theme}
                        onOpen={() => openQuest(quest.id)}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.section>
          );
        })}
      </div>

      <div className="mt-14 text-center">
        <p className="text-muted-foreground text-sm">
          <Sparkles className="w-4 h-4 inline text-gold mr-1" />
          Act baru dan quest baru ditempa setiap bulan oleh Guild GoQuest
        </p>
      </div>
    </div>
  );
}

function QuestNode({
  quest,
  index,
  done,
  current,
  locked,
  actTheme,
  onOpen,
}: {
  quest: Quest;
  index: number;
  done: boolean;
  current: boolean;
  locked: boolean;
  actTheme: (typeof ACT_THEME)[keyof typeof ACT_THEME];
  onOpen: () => void;
}) {
  const isBoss = quest.boss.hp >= 150 || quest.difficulty === "epic";
  const clickable = (done || current) && !quest.comingSoon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="relative"
    >
      {/* node pada jalur */}
      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-2xl border-2 flex items-center justify-center text-2xl z-10 bg-card ${
          done
            ? "border-emerald-400/60 bg-emerald-400/10"
            : current
              ? `${actTheme.border} ${actTheme.glow} animate-pulse-glow`
              : "border-border opacity-60"
        }`}
      >
        {quest.emoji}
        {done ? (
          <span className="absolute -right-1.5 -top-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center bg-card border border-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </span>
        ) : null}
      </div>

      {/* kartu quest */}
      <button
        disabled={!clickable}
        onClick={onOpen}
        className={`ml-[64px] sm:ml-[76px] w-[calc(100%-64px)] sm:w-[calc(100%-76px)] rounded-2xl border p-4 text-left transition-all ${
          !clickable
            ? "border-border bg-card/40 opacity-70 cursor-not-allowed"
            : done
              ? "border-emerald-400/30 bg-card hover:border-emerald-400/60"
              : `border-primary/40 bg-card hover:border-primary ${actTheme.glow} cursor-pointer`
        } ${isBoss && clickable ? "border-gold/50" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base truncate">
                {quest.order}. {quest.title}
              </h3>
              {isBoss ? (
                <span className="text-[9px] font-black uppercase tracking-wider text-gold border border-gold/40 bg-gold/10 rounded px-1.5 py-0.5">
                  Boss
                </span>
              ) : null}
              {quest.comingSoon ? (
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Segera
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{quest.subtitle}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[10px]">
              <span className="rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-violet-200 font-semibold">
                +{quest.xpReward} XP
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-muted-foreground capitalize">
                {quest.difficulty}
              </span>
              {quest.itemReward ? (
                <span className="rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-gold">
                  🎁 Item
                </span>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 self-center">
            {done ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : current ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-neon">
                <Play className="w-4 h-4" /> MULAI
              </span>
            ) : quest.comingSoon ? (
              <Clock className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>
    </motion.div>
  );
}
