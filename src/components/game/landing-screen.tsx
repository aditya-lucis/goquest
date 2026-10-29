"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Wand2, Flame, Rocket, ChevronRight, Sparkles, Trophy,
  Terminal, Map as MapIcon, Brain, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGame } from "@/game/store";
import { AVATAR_CLASSES } from "@/game/data/core";

// ============================================================
// LANDING — hero sinematik + character creation
// ============================================================

const FEATURES = [
  {
    icon: MapIcon,
    title: "World Map RPG",
    desc: "20+ quest dalam 3 Act, dari Hello World hingga production deploy.",
  },
  {
    icon: Terminal,
    title: "Playground Ajaib",
    desc: "Tulis & jalankan kode Go langsung di browser dengan auto-grader.",
  },
  {
    icon: Brain,
    title: "Skill Tree Interaktif",
    desc: "Buka skill Golang satu per satu: dari Rune Binding hingga Deep Sight.",
  },
  {
    icon: Trophy,
    title: "Trophy & Rank",
    desc: "Kumpulkan item legendaris, naik rank dari Novice sampai Go Legend.",
  },
];

export function LandingScreen() {
  const { enterRealm } = useGame();
  const [username, setUsername] = useState("");
  const [avatarClass, setAvatarClass] = useState("mage");
  const [entering, setEntering] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const handleEnter = async () => {
    if (username.trim().length < 2) {
      setShowCreate(true);
      return;
    }
    setEntering(true);
    const ok = await enterRealm(username.trim(), avatarClass);
    if (!ok) setEntering(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden dungeon-grid vignette">
      {/* glow orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[oklch(0.62_0.21_293/0.18)] blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-[oklch(0.85_0.14_195/0.12)] blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-[450px] h-[300px] rounded-full bg-[oklch(0.82_0.16_85/0.08)] blur-[100px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-full border border-[oklch(0.85_0.14_195/0.4)] bg-[oklch(0.85_0.14_195/0.08)] px-4 py-1.5 text-xs text-cyan-200 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Belajar Golang jadi petualangan RPG
        </motion.div>

        {/* title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-5xl sm:text-7xl font-black tracking-tight"
        >
          <span className="text-glow-purple bg-gradient-to-br from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            Go
          </span>
          <span className="text-glow-gold bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            Quest
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mt-5 max-w-xl text-muted-foreground text-base sm:text-lg leading-relaxed"
        >
          Bukan sekadar tutorial.{" "}
          <span className="text-foreground font-medium">
            Naik level, buka skill tree, kalahkan monster bug,
          </span>{" "}
          dan tempuh jalan dari Novice menjadi{" "}
          <span className="text-gold font-semibold">Go Legend</span>.
        </motion.p>

        {/* terminal teaser */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-10 w-full max-w-md rounded-xl border border-border bg-[oklch(0.11_0.015_295)] overflow-hidden scanlines relative glow-purple"
        >
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/60">
            <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.65_0.22_25)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.82_0.16_85)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.8_0.2_145)]" />
            <span className="ml-2 text-[11px] font-mono text-muted-foreground">quest_1.go</span>
          </div>
          <div className="px-5 py-4 text-left font-mono text-[13px] leading-7">
            <p className="text-fuchsia-400">
              func <span className="text-violet-300">main</span>()
              <span className="text-slate-300"> {"{"}</span>
            </p>
            <p className="pl-5 text-slate-300">
              fmt.<span className="text-cyan-300">Println</span>(
              <span className="text-emerald-300">&quot;Halo, Realm!&quot;</span>)
            </p>
            <p className="text-slate-300">{"}"}</p>
            <p className="text-emerald-300/80 mt-1">
              $ go run quest_1.go <span className="terminal-caret">▌</span>
            </p>
          </div>
        </motion.div>

        {/* CTA / character creation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mt-10 w-full max-w-xl"
        >
          <AnimatePresence mode="wait">
            {!showCreate ? (
              <motion.div key="cta" exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  className="h-14 px-10 text-base font-bold animate-pulse-glow bg-primary hover:bg-primary/90"
                  onClick={() => setShowCreate(true)}
                >
                  <Swords className="w-5 h-5 mr-2" />
                  Masuki Realm
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Gratis • Tanpa instalasi • Progress tersimpan otomatis
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card/90 backdrop-blur p-5 sm:p-6 text-left"
              >
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-neon" />
                  Ciptakan Adventurer-mu
                </h2>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Nama ini akan terukir di papan peringkat realm.
                </p>

                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nama Adventurer
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cth: Aria si Pembasmi Bug"
                  maxLength={24}
                  className="mt-1.5 mb-4 h-11 bg-secondary/50 font-medium"
                  onKeyDown={(e) => e.key === "Enter" && handleEnter()}
                />

                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pilih Kelas
                </label>
                <div className="grid grid-cols-2 gap-2.5 mt-1.5 mb-5">
                  {AVATAR_CLASSES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setAvatarClass(c.id)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        avatarClass === c.id
                          ? "border-primary bg-primary/15 glow-purple"
                          : "border-border bg-secondary/40 hover:border-primary/50"
                      }`}
                    >
                      <span className="text-2xl">{c.emoji}</span>
                      <p className="font-bold text-sm mt-1">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug">{c.tagline}</p>
                    </button>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="w-full h-12 font-bold bg-primary hover:bg-primary/90"
                  onClick={handleEnter}
                  disabled={entering}
                >
                  {entering ? (
                    <>
                      <Rocket className="w-4 h-4 mr-2 animate-pulse" />
                      Membuka gerbang realm...
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4 mr-2" />
                      Mulai Petualangan!
                    </>
                  )}
                </Button>
                <button
                  className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowCreate(false)}
                >
                  ← Kembali
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* features */}
        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="rounded-2xl border border-border bg-card/70 p-5 text-left hover:border-primary/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-neon" />
              </div>
              <h3 className="font-bold text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* learning path strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground"
        >
          <Zap className="w-3.5 h-3.5 text-gold" />
          <span className="font-semibold text-foreground">Act 1: Awakening</span>
          <span>→</span>
          <span className="font-semibold text-foreground">Act 2: The Power Within</span>
          <span>→</span>
          <span className="font-semibold text-gold">Act 3: Legendary Path</span>
        </motion.div>
      </div>
    </div>
  );
}
