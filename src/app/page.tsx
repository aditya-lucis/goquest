"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import type { Screen } from "@/game/types";

import { LandingScreen } from "@/components/game/landing-screen";
import { GameShell } from "@/components/game/game-shell";
import { DashboardScreen } from "@/components/game/dashboard-screen";
import { WorldMapScreen } from "@/components/game/world-map-screen";
import { QuestScreen } from "@/components/game/quest-screen";
import { SkillTreeScreen } from "@/components/game/skill-tree-screen";
import { CharacterScreen } from "@/components/game/character-screen";
import { TrophyScreen } from "@/components/game/trophy-screen";
import { LeaderboardScreen } from "@/components/game/leaderboard-screen";
import { playLevelUp } from "@/lib/sfx";

// ============================================================
// GoQuest — RPG Tutorial Platform Golang
// SPA state machine: landing → shell(dashboard/map/quest/...)
// ============================================================

export default function Home() {
  const { character, sessionChecked, screen, initSession, levelUpOverlay, dismissLevelUp } =
    useGame();

  useEffect(() => {
    void initSession();
  }, [initSession]);

  // scroll ke atas tiap pindah layar
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  // ─── 1. SPLASH: cek session ───
  if (!sessionChecked) {
    return <SplashScreen />;
  }

  // ─── 2. LANDING: belum punya karakter ───
  if (!character) {
    return <LandingScreen />;
  }

  // ─── 3. IN-REALM: game shell + router ───
  return (
    <>
      <GameShell>
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ScreenRouter screen={screen} />
          </motion.div>
        </AnimatePresence>
      </GameShell>

      {/* overlay level-up */}
      <AnimatePresence>
        {levelUpOverlay ? <LevelUpOverlay onDone={dismissLevelUp} /> : null}
      </AnimatePresence>
    </>
  );
}

function ScreenRouter({ screen }: { screen: Screen }) {
  switch (screen) {
    case "dashboard":
      return <DashboardScreen />;
    case "world-map":
      return <WorldMapScreen />;
    case "quest":
      return <QuestScreen />;
    case "skill-tree":
      return <SkillTreeScreen />;
    case "character":
      return <CharacterScreen />;
    case "trophy":
      return <TrophyScreen />;
    case "leaderboard":
      return <LeaderboardScreen />;
    default:
      return <DashboardScreen />;
  }
}

// ============================================================
// SPLASH — gerbang realm sedang diperiksa
// ============================================================

function SplashScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 dungeon-grid vignette">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14 }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-3xl bg-primary/15 border-2 border-primary/50 flex items-center justify-center glow-purple">
          <ScrollText className="w-10 h-10 text-gold" />
        </div>
        <motion.div
          className="absolute -inset-3 rounded-[1.75rem] border border-primary/20"
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      <div className="text-center">
        <p className="font-black text-2xl">
          Go<span className="text-gold">Quest</span>
        </p>
        <p className="text-muted-foreground text-xs mt-2 flex items-center gap-1.5 justify-center">
          <Sparkles className="w-3 h-3 animate-pulse text-neon" />
          Memeriksa kutukan session-mu...
        </p>
      </div>
    </div>
  );
}

// ============================================================
// LEVEL-UP OVERLAY — perayaan kenaikan level & rank
// ============================================================

function LevelUpOverlay({ onDone }: { onDone: () => void }) {
  const overlay = useGame((s) => s.levelUpOverlay);

  // ⚡ SFX: fanfare level-up saat overlay muncul
  useEffect(() => {
    if (overlay) playLevelUp();
  }, [overlay]);

  if (!overlay) return null;

  const rank = overlay.rank;
  const isRankUp = rank.minLevel === overlay.levels[overlay.levels.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onDone}
    >
      {/* partikel cahaya */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${(i * 7 + 8) % 100}%`,
            top: "50%",
            background: i % 3 === 0 ? "oklch(0.82 0.16 85)" : i % 3 === 1 ? "oklch(0.62 0.21 293)" : "oklch(0.85 0.14 195)",
          }}
          initial={{ y: 0, opacity: 1, scale: 0 }}
          animate={{
            y: -180 - (i % 5) * 60,
            x: (i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 30),
            opacity: [1, 1, 0],
            scale: [0, 1.4, 0.6],
          }}
          transition={{ duration: 1.6 + (i % 3) * 0.4, delay: i * 0.06, ease: "easeOut" }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.7, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 16, delay: 0.1 }}
        className="relative max-w-md w-full rounded-3xl border border-gold/50 bg-card p-8 sm:p-10 text-center overflow-hidden glow-gold"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dungeon-grid absolute inset-0 pointer-events-none" />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative text-[10px] font-black uppercase tracking-[0.4em] text-gold"
        >
          ⚡ Level Up ⚡
        </motion.p>

        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 10, delay: 0.35 }}
          className="relative text-6xl sm:text-7xl mt-4"
        >
          {isRankUp ? "👑" : "🌟"}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="relative text-3xl sm:text-4xl font-black mt-4 text-glow-gold text-gold"
        >
          LEVEL {overlay.levels[overlay.levels.length - 1]}
        </motion.h2>

        {overlay.levels.length > 1 ? (
          <p className="relative text-xs text-muted-foreground mt-1.5 font-mono">
            melompat {overlay.levels.length} level sekaligus!
          </p>
        ) : null}

        {isRankUp ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative mt-5 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3.5"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Pangkat baru diraih
            </p>
            <p className={`text-xl font-black mt-1 ${rank.color}`}>{rank.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{rank.title}</p>
            <p className="text-[11px] text-foreground/70 mt-2 leading-relaxed">{rank.description}</p>
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="relative mt-6"
        >
          <Button
            size="lg"
            className="font-bold bg-gold text-black hover:bg-gold/90"
            onClick={onDone}
          >
            Lanjutkan Petualangan ✦
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
