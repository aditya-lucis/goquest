"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronRight, Swords, Skull, ArrowLeft, Home,
  Trophy, Sparkles, Gift, Zap, Star, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { getQuest, QUESTS } from "@/game/data/quests";
import { getItem, getSkillNodeById } from "@/game/data/core";
import { CodePlayground } from "./code-playground";
import { MarkdownLesson } from "./markdown-lesson";
import { playQuestComplete } from "@/lib/sfx";

// ============================================================
// QUEST SCREEN — mesin fase: story → lesson → challenge → boss → victory
// ============================================================

export function QuestScreen() {
  const { character, activeQuestId, questPhase, setQuestPhase, navigate, completeQuest, notifyChallengePassed, notifyBossDefeated } = useGame();
  const [attempts, setAttempts] = useState(0);
  const [bossPassed, setBossPassed] = useState(false);

  const quest = activeQuestId ? getQuest(activeQuestId) : undefined;
  const completedIds = useMemo(
    () =>
      new Set(
        (character?.questProgress ?? []).filter((q) => q.status === "completed").map((q) => q.questId),
      ),
    [character?.questProgress],
  );

  if (!character || !quest) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Quest tidak ditemukan.</p>
        <Button className="mt-4" onClick={() => navigate("world-map")}>
          Kembali ke World Map
        </Button>
      </div>
    );
  }

  // cek akses: quest boleh dibuka jika sudah selesai ATAU semua quest playable sebelumnya tuntas
  const playableBefore = QUESTS.filter(
    (q) => !q.comingSoon && (q.act < quest.act || (q.act === quest.act && q.order < quest.order)),
  );
  const unlocked = completedIds.has(quest.id) || playableBefore.every((q) => completedIds.has(q.id));

  if (quest.comingSoon) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-4">
          ⏳
        </motion.div>
        <h1 className="text-2xl font-black">{quest.title}</h1>
        <p className="text-muted-foreground mt-2">
          Quest ini masih disegel para Guildmaster. Selesaikan quest sebelumnya dan tunggu update realm!
        </p>
        <Button className="mt-6" onClick={() => navigate("world-map")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Map
        </Button>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-black">Gerbang Masih Terkunci</h1>
        <p className="text-muted-foreground mt-2">
          Selesaikan quest sebelumnya untuk membuka gerbang ini.
        </p>
        <Button className="mt-6" onClick={() => navigate("world-map")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Map
        </Button>
      </div>
    );
  }

  const score = attempts === 0 ? 100 : Math.max(70, 100 - attempts * 10);

  const handleBossPassed = async () => {
    if (bossPassed) return;
    setBossPassed(true);
    notifyBossDefeated(); // 🐵 SFX: boss tumbang
    await completeQuest(quest.id, score);
    setQuestPhase("victory");
  };

  const phases: Array<{ id: typeof questPhase; label: string; icon: React.ElementType }> = [
    { id: "story", label: "Kisah", icon: BookOpen },
    { id: "lesson", label: "Materi", icon: BookOpen },
    { id: "challenge", label: "Challenge", icon: Swords },
    { id: "boss", label: "Boss Fight", icon: Skull },
    { id: "victory", label: "Kemenangan", icon: Trophy },
  ];
  const currentIdx = phases.findIndex((p) => p.id === questPhase);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* header quest */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            onClick={() => navigate("world-map")}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> World Map
          </button>
          <h1 className="text-xl sm:text-2xl font-black mt-1.5 flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">{quest.emoji}</span>
            {quest.title}
          </h1>
          <p className="text-muted-foreground text-sm">{quest.subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
            Act {quest.act}
          </span>
          <span className="rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-bold text-violet-200">
            +{quest.xpReward} XP
          </span>
        </div>
      </div>

      {/* fase indicator */}
      <div className="flex items-center gap-1.5 sm:gap-2 mt-6 mb-7">
        {phases.map((p, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={p.id} className="flex items-center gap-1.5 sm:gap-2 flex-1 last:flex-none">
              <div
                className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3.5 py-1.5 text-[10px] sm:text-xs font-bold border transition-colors ${
                  done
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : active
                      ? "border-primary/60 bg-primary/15 text-violet-200 glow-purple"
                      : "border-border text-muted-foreground"
                }`}
              >
                {done ? <span className="text-emerald-400">✓</span> : <p.icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{p.label}</span>
              </div>
              {i < phases.length - 1 ? (
                <div className={`h-0.5 flex-1 rounded ${done ? "bg-emerald-400/40" : "bg-border"}`} />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* ================= STORY ================= */}
      <AnimatePresence mode="wait">
        {questPhase === "story" ? (
          <motion.div
            key="story"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative rounded-2xl border border-primary/30 bg-card overflow-hidden"
          >
            <div className="dungeon-grid absolute inset-0 pointer-events-none" />
            <div className="relative p-6 sm:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neon mb-6">
                ✦ Bab {quest.act}-{quest.order} ✦
              </p>
              <div className="space-y-5">
                {quest.story.map((par, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.45 }}
                    className="text-[15px] sm:text-base leading-8 text-foreground/90"
                  >
                    {renderStoryText(par)}
                  </motion.p>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + quest.story.length * 0.45 }}
                className="mt-9"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-gold" /> Misi:
                </p>
                <ul className="space-y-2">
                  {quest.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Star className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + quest.story.length * 0.45 }}
                className="mt-9 flex justify-end"
              >
                <Button
                  size="lg"
                  className="font-bold bg-primary hover:bg-primary/90"
                  onClick={() => setQuestPhase("lesson")}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Pelajari Mantranya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ) : null}

        {/* ================= LESSON ================= */}
        {questPhase === "lesson" ? (
          <motion.div
            key="lesson"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl border border-border bg-card p-5 sm:p-8"
          >
            <MarkdownLesson content={quest.lesson} />
            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between gap-3 flex-wrap">
              <Button variant="secondary" onClick={() => setQuestPhase("story")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Kisah
              </Button>
              <Button
                size="lg"
                className="font-bold bg-primary hover:bg-primary/90"
                onClick={() => setQuestPhase("challenge")}
              >
                <Swords className="w-4 h-4 mr-2" />
                Tempuh Challenge!
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        ) : null}

        {/* ================= CHALLENGE ================= */}
        {questPhase === "challenge" ? (
          <motion.div
            key="challenge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-cyan-400/30 bg-card p-5 sm:p-6 glow-cyan">
              <h2 className="font-black text-lg flex items-center gap-2.5">
                <Swords className="w-5 h-5 text-neon" />
                Coding Challenge
              </h2>
              <p className="text-sm sm:text-[15px] leading-relaxed mt-3 text-foreground/90">
                {quest.challenge.prompt}
              </p>
              <div className="mt-4 rounded-xl bg-secondary/50 border border-border px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Output yang diharapkan
                </p>
                <pre className="text-[12.5px] font-mono text-emerald-300 whitespace-pre-wrap">
                  {quest.challenge.expectedOutput}
                </pre>
              </div>
            </div>

            <CodePlayground
              starterCode={quest.challenge.starterCode}
              hint={quest.challenge.hint}
              expectedOutput={quest.challenge.expectedOutput}
              validators={quest.challenge.validators}
              gradeable
              onPassed={() => {
                notifyChallengePassed(); // 🌟 SFX: challenge lulus
                setQuestPhase("boss");
              }}
            />

            <div className="flex justify-between flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setQuestPhase("lesson")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Materi
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  setAttempts((a) => a + 1);
                  toastRetry();
                }}
              >
                Tandai Percobaan Ulang (retake)
              </Button>
            </div>
          </motion.div>
        ) : null}

        {/* ================= BOSS FIGHT ================= */}
        {questPhase === "boss" ? (
          <motion.div
            key="boss"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            {/* boss card */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px oklch(0.65 0.22 25 / 0.3)",
                  "0 0 34px oklch(0.65 0.22 25 / 0.55)",
                  "0 0 20px oklch(0.65 0.22 25 / 0.3)",
                ],
              }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="rounded-2xl border border-red-400/40 bg-card p-5 sm:p-6 relative overflow-hidden"
            >
              <div className="dungeon-grid-fine absolute inset-0 pointer-events-none" />
              <div className="relative">
                <div className="flex items-start gap-4 flex-wrap">
                  <motion.div
                    animate={{ rotate: [0, -4, 4, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-5xl sm:text-6xl"
                  >
                    {quest.boss.emoji}
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
                      ⚔ Boss Fight
                    </p>
                    <h2 className="text-xl sm:text-2xl font-black mt-1 text-red-200">
                      {quest.boss.name}
                    </h2>
                    <p className="text-sm text-red-300/80 italic mt-2 leading-relaxed">
                      &ldquo;{quest.boss.taunt}&rdquo;
                    </p>
                  </div>
                </div>

                {/* HP bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">
                    <span>HP Boss</span>
                    <span>{quest.boss.hp} / {quest.boss.hp}</span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden border border-red-400/20">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-600 via-red-500 to-orange-400"
                      initial={{ width: "100%" }}
                      animate={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-secondary/50 border border-border px-4 py-3.5">
                  <p className="text-sm leading-relaxed">{quest.boss.prompt}</p>
                </div>
              </div>
            </motion.div>

            <CodePlayground
              starterCode={quest.boss.starterCode}
              hint={quest.boss.validators[0]?.hint ?? "Baca lagi taunt boss-nya — petunjuk tersembunyi di sana!"}
              expectedOutput={quest.boss.expectedOutput}
              validators={quest.boss.validators}
              gradeable
              onPassed={() => {
                void handleBossPassed();
              }}
            />

            <div className="flex justify-between flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setQuestPhase("challenge")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Latihan Ulang
              </Button>
            </div>
          </motion.div>
        ) : null}

        {/* ================= VICTORY ================= */}
        {questPhase === "victory" ? <VictoryPhase quest={quest} /> : null}
      </AnimatePresence>
    </div>
  );
}

function toastRetry() {
  // inline info — grader tetap satu-satunya penentu
  if (typeof window !== "undefined") {
    void window;
  }
}

/** Render **bold** dan *italic* pada teks story */
function renderStoryText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**")) {
      return (
        <strong key={i} className="text-gold font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*")) {
      return (
        <em key={i} className="text-violet-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ============================================================
// VICTORY — layar reward dengan animasi
// ============================================================

function VictoryPhase({ quest }: { quest: NonNullable<ReturnType<typeof getQuest>> }) {
  const { lastQuestResult, navigate, character } = useGame();
  const item = quest.itemReward ? getItem(quest.itemReward) : undefined;
  const skill = getSkillNodeById(quest.skillId);
  const xp = lastQuestResult?.gainedXp ?? quest.xpReward;
  const gold = lastQuestResult?.gainedGold ?? quest.goldReward;

  // ✅ SFX: fanfare kemenangan quest
  useEffect(() => {
    playQuestComplete();
  }, []);

  // quest berikutnya
  const nextQuest = QUESTS.find(
    (q) =>
      !q.comingSoon &&
      q.id !== quest.id &&
      (q.act > quest.act || (q.act === quest.act && q.order > quest.order)) &&
      !(character?.questProgress ?? []).some((p) => p.questId === q.id && p.status === "completed"),
  );

  return (
    <motion.div
      key="victory"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-2xl border border-gold/50 bg-card overflow-hidden glow-gold"
    >
      <div className="dungeon-grid absolute inset-0 pointer-events-none" />
      <div className="relative p-6 sm:p-10 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12 }}
          className="text-6xl sm:text-7xl mb-4"
        >
          {quest.boss.emoji}
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[10px] font-black uppercase tracking-[0.35em] text-gold"
        >
          ⚡ Quest Selesai ⚡
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl sm:text-3xl font-black mt-2 text-glow-gold"
        >
          {quest.boss.name} Dikalahkan!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-sm sm:text-base text-foreground/85 leading-relaxed mt-4 max-w-xl mx-auto whitespace-pre-line"
        >
          {quest.boss.victoryStory}
        </motion.p>

        {/* reward cards */}
        <div className="grid sm:grid-cols-2 gap-4 mt-8 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-4"
          >
            <Zap className="w-6 h-6 text-violet-300 mx-auto" />
            <p className="text-2xl font-black mt-1.5 text-violet-200">+{xp} XP</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Experience
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-4"
          >
            <span className="text-2xl">🪙</span>
            <p className="text-2xl font-black mt-1 text-gold">+{gold}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Gold</p>
          </motion.div>
        </div>

        {/* skill unlock */}
        {skill ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="mt-4 max-w-lg mx-auto rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-4 flex items-center gap-4"
          >
            <span className="text-3xl">{skill.emoji}</span>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-neon flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Skill Tree Unlocked
              </p>
              <p className="font-bold">{skill.name}</p>
              <p className="text-xs text-muted-foreground">{skill.description}</p>
            </div>
          </motion.div>
        ) : null}

        {/* item reward */}
        {item ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1, type: "spring", damping: 14 }}
            className="mt-4 max-w-lg mx-auto rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-400/15 to-transparent px-4 py-4 flex items-center gap-4 glow-gold"
          >
            <motion.span
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
              className="text-4xl"
            >
              {item.emoji}
            </motion.span>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
                <Gift className="w-3 h-3" /> Item Diraih • {item.rarity}
              </p>
              <p className="font-bold">{item.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          </motion.div>
        ) : null}

        {/* streak info */}
        {lastQuestResult ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.15 }}
            className="mt-5 text-sm text-muted-foreground"
          >
            🔥 Streak: <span className="text-orange-300 font-bold">{lastQuestResult.streak} hari</span>
            {lastQuestResult.levelsGained.length > 0 ? (
              <span className="text-gold font-bold">
                {" "}
                • LEVEL UP → {lastQuestResult.levelsGained.join(", ")}!
              </span>
            ) : null}
          </motion.p>
        ) : null}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button variant="secondary" size="lg" onClick={() => navigate("dashboard")}>
            <Home className="w-4 h-4 mr-2" /> Kembali ke Camp
          </Button>
          {nextQuest ? (
            <Button size="lg" className="font-bold bg-primary hover:bg-primary/90" onClick={() => useGame.getState().openQuest(nextQuest.id)}>
              Quest Berikutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button size="lg" className="font-bold bg-gold text-black hover:bg-gold/90" onClick={() => navigate("trophy")}>
              <Trophy className="w-4 h-4 mr-2" /> Lihat Trophy Room
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
