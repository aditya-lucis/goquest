"use client";

import { motion } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import {
  Coins, Flame, Swords, Shield, ScrollText, Sparkles, Lock,
  Medal, User, Trophy as TrophyIcon,
} from "lucide-react";
import { useGame } from "@/game/store";
import { getRank, getNextRank, RANKS, xpForNextLevel } from "@/game/progression";
import { getAvatarClass, ITEMS } from "@/game/data/core";
import { QUESTS } from "@/game/data/quests";
import type { ItemCategory } from "@/game/types";

// ============================================================
// KARAKTER — character sheet + inventory + rank roadmap
// ============================================================

const RARITY_STYLE: Record<string, { border: string; text: string; glow: string }> = {
  common: { border: "border-slate-400/40", text: "text-slate-300", glow: "" },
  rare: { border: "border-cyan-400/50", text: "text-cyan-300", glow: "glow-cyan" },
  epic: { border: "border-violet-400/50", text: "text-violet-300", glow: "glow-purple" },
  legendary: { border: "border-amber-400/60", text: "text-gold", glow: "glow-gold" },
};

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  weapon: "Senjata",
  shield: "Perisai",
  badge: "Lencana",
  title: "Gelar",
  trophy: "Trofi",
  potion: "Ramuan",
};

const CATEGORY_ICON: Record<ItemCategory, ElementType> = {
  weapon: Swords,
  shield: Shield,
  badge: Medal,
  title: ScrollText,
  trophy: TrophyIcon,
  potion: Sparkles,
};

export function CharacterScreen() {
  const { character } = useGame();
  if (!character) return null;

  const rank = getRank(character.level);
  const nextRank = getNextRank(character.level);
  const nextXp = xpForNextLevel(character.level);
  const pct = Math.min(100, Math.round((character.xp / nextXp) * 100));
  const cls = getAvatarClass(character.avatarClass);

  const owned = new Set(character.inventory);
  const doneQuests = new Set(
    character.questProgress.filter((q) => q.status === "completed").map((q) => q.questId),
  );

  const titles = ITEMS.filter((i) => i.category === "title" && owned.has(i.id));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <User className="w-7 h-7 text-neon" /> Karakter
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Lembar identitas adventurer-mu di realm GoQuest.
        </p>
      </motion.div>

      {/* ============ CHARACTER SHEET ============ */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="relative rounded-2xl border border-primary/40 bg-card overflow-hidden glow-purple mt-6"
      >
        <div className="dungeon-grid absolute inset-0 pointer-events-none" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl bg-primary/15 border-2 border-primary/50 flex items-center justify-center text-6xl animate-float-slow">
                {cls.emoji}
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold/50 bg-background px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-gold">
                Lv. {character.level}
              </span>
            </div>

            {/* identitas */}
            <div className="text-center sm:text-left min-w-0 flex-1">
              <h2 className="text-2xl font-black truncate">{character.username}</h2>
              <p className={`text-sm font-bold mt-0.5 ${rank.color}`}>
                {rank.name} — {rank.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-md">
                {cls.description}
              </p>
              <p className="text-[11px] text-neon font-medium mt-1.5 italic">{cls.bonus}</p>

              {/* xp bar */}
              <div className="mt-4 max-w-md">
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>EXP {character.xp}</span>
                  <span>{nextXp}</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full xp-bar-shine bg-gradient-to-r from-violet-500 to-fuchsia-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay: 0.3 }}
                  />
                </div>
                {nextRank ? (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {nextXp - character.xp} XP lagi menuju{" "}
                    <span className={`${nextRank.color} font-semibold`}>{nextRank.name}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-gold mt-1.5 font-semibold">
                    Puncak karier tercapai — Go Legend! 👑
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
            <StatTile icon={<Coins className="w-4 h-4 text-gold" />} label="Gold" value={String(character.gold)} />
            <StatTile icon={<Flame className="w-4 h-4 text-orange-400" />} label="Streak" value={`${character.streak} hari`} />
            <StatTile icon={<Flame className="w-4 h-4 text-red-400" />} label="Best Streak" value={`${character.bestStreak} hari`} />
            <StatTile
              icon={<TrophyIcon className="w-4 h-4 text-violet-300" />}
              label="Quest Tuntas"
              value={`${doneQuests.size}/${QUESTS.filter((q) => !q.comingSoon).length}`}
            />
          </div>
        </div>
      </motion.div>

      {/* ============ RANK ROADMAP ============ */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="rounded-2xl border border-border bg-card p-5 sm:p-6 mt-5"
      >
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Medal className="w-4 h-4 text-gold" /> Jalan Kariermu
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {RANKS.map((r, i) => {
            const current = r.id === rank.id;
            const reached = character.level >= r.minLevel;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className={`rounded-xl border p-2.5 text-center transition-all ${
                  current
                    ? "border-gold/60 bg-gold/10 glow-gold"
                    : reached
                      ? "border-emerald-400/30 bg-emerald-400/5"
                      : "border-border bg-secondary/30 opacity-60"
                }`}
              >
                <p className="text-lg leading-none">
                  {reached ? ["🌱", "📘", "🔮", "🧙", "👑"][i] : "🔒"}
                </p>
                <p className={`text-[10px] sm:text-xs font-black mt-1.5 ${reached ? r.color : "text-muted-foreground"}`}>
                  {r.name}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  Lv. {r.minLevel}+
                </p>
              </motion.div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          <Sparkles className="w-3 h-3 inline text-neon mr-1" />
          {rank.description}
        </p>
      </motion.div>

      {/* ============ GELAR ============ */}
      {titles.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gold/40 bg-card p-5 sm:p-6 mt-5"
        >
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-gold" /> Gelar Teraih
          </h3>
          <div className="flex flex-wrap gap-2">
            {titles.map((t) => (
              <span
                key={t.id}
                className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-sm font-bold text-gold"
              >
                {t.emoji} {t.name.replace("Title: ", "")}
              </span>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* ============ INVENTORY ============ */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="rounded-2xl border border-border bg-card p-5 sm:p-6 mt-5"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-neon" /> Inventory
          </h3>
          <span className="text-xs text-muted-foreground">
            {owned.size}/{ITEMS.length} item terkumpul
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ITEMS.map((item, i) => {
            const have = owned.has(item.id);
            const rarity = RARITY_STYLE[item.rarity];
            const CatIcon = CATEGORY_ICON[item.category];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.28 + i * 0.03 }}
                className={`rounded-xl border p-3.5 flex items-start gap-3 ${
                  have ? `${rarity.border} bg-secondary/30 ${rarity.glow}` : "border-border/60 bg-secondary/10 opacity-50"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center text-2xl shrink-0 ${
                    have ? "border-border bg-secondary/60" : "border-border/40 bg-secondary/20 grayscale"
                  }`}
                >
                  {have ? item.emoji : "❔"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-bold text-sm leading-tight ${have ? "" : "text-muted-foreground"}`}>
                      {have ? item.name : "Item Tersegel"}
                    </p>
                    <span
                      className={`text-[8px] font-black uppercase tracking-wider rounded px-1.5 py-0.5 border ${
                        have ? `${rarity.text} ${rarity.border}` : "text-muted-foreground border-border"
                      }`}
                    >
                      {item.rarity}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {have ? item.description : "Diraih dari quest tertentu. Teruslah menjelajah!"}
                  </p>
                  <p className="text-[9px] text-muted-foreground/70 mt-1.5 flex items-center gap-1 uppercase tracking-wider font-semibold">
                    {have ? <CatIcon className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {CATEGORY_LABEL[item.category]}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 border border-border px-3 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className="text-lg font-black mt-1">{value}</p>
    </div>
  );
}
