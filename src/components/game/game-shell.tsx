"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Map as MapIcon, GitBranch, User, Trophy, Crown,
  LogOut, Flame, Coins, Menu, X, ScrollText, Volume2, VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { xpForNextLevel, getRank } from "@/game/progression";
import { getAvatarClass } from "@/game/data/core";
import { sfx } from "@/lib/sfx";
import type { Screen } from "@/game/types";

// ============================================================
// GAME SHELL — layout utama dengan sidebar game-map + topbar
// ============================================================

const NAV_ITEMS: Array<{ screen: Screen; label: string; icon: React.ElementType }> = [
  { screen: "dashboard", label: "Camp (Dashboard)", icon: LayoutDashboard },
  { screen: "world-map", label: "World Map", icon: MapIcon },
  { screen: "skill-tree", label: "Skill Tree", icon: GitBranch },
  { screen: "character", label: "Karakter", icon: User },
  { screen: "trophy", label: "Trophy Room", icon: Trophy },
  { screen: "leaderboard", label: "Leaderboard", icon: Crown },
];

export function GameShell({ children }: { children: React.ReactNode }) {
  const { screen, navigate, character, logout } = useGame();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [muted, setMuted] = React.useState(false);

  React.useEffect(() => {
    setMuted(sfx.isMuted());
  }, []);

  const toggleMute = () => {
    const next = sfx.toggle();
    setMuted(next);
  };

  if (!character) return null;
  const rank = getRank(character.level);
  const nextXp = xpForNextLevel(character.level);
  const pct = Math.min(100, Math.round((character.xp / nextXp) * 100));
  const cls = getAvatarClass(character.avatarClass);

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* logo */}
      <button
        onClick={() => navigate("dashboard")}
        className="flex items-center gap-2.5 px-5 pt-6 pb-5 text-left"
      >
        <ScrollText className="w-7 h-7 text-gold" />
        <div>
          <p className="font-black text-lg leading-none">
            Go<span className="text-gold">Quest</span>
          </p>
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">
            Learn • Fight • Level Up
          </p>
        </div>
      </button>

      {/* character mini card */}
      <div className="mx-4 rounded-xl border border-border bg-card/80 p-3.5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-xl shrink-0">
            {cls.emoji}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{character.username}</p>
            <p className={`text-[11px] font-semibold ${rank.color}`}>
              Lv.{character.level} {rank.name}
            </p>
          </div>
        </div>
        {/* xp bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>EXP</span>
            <span>
              {character.xp} / {nextXp}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full xp-bar-shine bg-gradient-to-r from-violet-500 to-fuchsia-400"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = screen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => {
                navigate(item.screen);
                setMobileOpen(false);
              }}
              className={`relative w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {active ? (
                <motion.div
                  layoutId="nav-active"
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-gradient-to-b from-violet-400 to-cyan-300"
                />
              ) : null}
              <item.icon className={`w-4.5 h-4.5 w-[18px] h-[18px] ${active ? "text-neon" : ""}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Tinggalkan Realm
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar dungeon-grid">
        {SidebarContent}
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 border-r border-border bg-sidebar dungeon-grid lg:hidden"
            >
              <button
                className="absolute right-3 top-4 text-muted-foreground"
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
              {SidebarContent}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* topbar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
            <button
              className="lg:hidden text-muted-foreground"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <p className="font-mono text-sm text-muted-foreground hidden sm:block truncate">
              <span className="text-neon">~/realm</span>
              <span className="mx-1.5">/</span>
              {NAV_ITEMS.find((n) => n.screen === screen)?.label ?? "Quest"}
            </p>
            <div className="ml-auto flex items-center gap-3 sm:gap-4">
              <button
                onClick={toggleMute}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={muted ? "Nyalakan efek suara" : "Matikan efek suara"}
                aria-label={muted ? "Nyalakan efek suara" : "Matikan efek suara"}
              >
                {muted ? <VolumeX className="w-4.5 h-4.5 w-[18px] h-[18px]" /> : <Volume2 className="w-[18px] h-[18px] text-neon" />}
              </button>
              <div className="flex items-center gap-1.5 text-sm" title="Streak harian">
                <Flame
                  className={`w-4 h-4 ${character.streak > 0 ? "text-orange-400" : "text-muted-foreground"}`}
                />
                <span className="font-bold">{character.streak}</span>
                <span className="text-muted-foreground text-xs hidden sm:inline">hari</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm" title="Gold">
                <Coins className="w-4 h-4 text-gold" />
                <span className="font-bold">{character.gold}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-sm" title="Level">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${rank.color} border-current/30`}>
                  Lv.{character.level}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* content */}
        <main className="flex-1 relative">
          <div className="dungeon-grid-fine absolute inset-0 pointer-events-none" />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
