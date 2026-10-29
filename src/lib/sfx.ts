// ============================================================
// SFX ENGINE — efek suara sintesis via Web Audio API
// Tanpa file audio: semua nada dibangkitkan oscillator.
// Mute state persist di localStorage.
// ============================================================

export type SfxName =
  | "levelUp"
  | "questComplete"
  | "bossDefeat"
  | "dailyReward"
  | "achievement"
  | "challengePass";

const MUTE_KEY = "goquest_sfx_muted";

class SfxEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = window.localStorage.getItem(MUTE_KEY) === "1";
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    }
  }

  toggle(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** AudioContext dibuat lazy (butuh user gesture di sebagian browser) */
  private ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  /** Satu nada dengan envelope sederhana */
  private tone(opts: {
    freq: number;
    start: number; // offset detik dari sekarang
    dur: number;
    type?: OscillatorType;
    gain?: number;
    slideTo?: number; // frekuensi tujuan glide
  }): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + opts.start;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = opts.type ?? "triangle";
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + opts.dur);
    }

    const peak = opts.gain ?? 0.12;
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);

    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.05);
  }

  play(name: SfxName): void {
    if (this.muted) return;
    switch (name) {
      // ⚡ LEVEL UP — fanfare arpeggio naik + shimmer
      case "levelUp": {
        const seq = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
        seq.forEach((f, i) => {
          this.tone({ freq: f, start: i * 0.09, dur: 0.22, type: "triangle", gain: 0.14 });
        });
        // shimmer akhir
        this.tone({ freq: 1318.5, start: 0.36, dur: 0.5, type: "sine", gain: 0.07 });
        this.tone({ freq: 1567.98, start: 0.4, dur: 0.45, type: "sine", gain: 0.05 });
        break;
      }

      // ✅ QUEST COMPLETE — fanfare pendek + koin
      case "questComplete": {
        this.tone({ freq: 392.0, start: 0, dur: 0.14, type: "triangle", gain: 0.13 });
        this.tone({ freq: 523.25, start: 0.12, dur: 0.26, type: "triangle", gain: 0.14 });
        this.tone({ freq: 659.25, start: 0.24, dur: 0.3, type: "sine", gain: 0.09 });
        // koin
        this.tone({ freq: 1318.5, start: 0.34, dur: 0.1, type: "square", gain: 0.05 });
        this.tone({ freq: 1760.0, start: 0.42, dur: 0.14, type: "square", gain: 0.045 });
        break;
      }

      // 🐲 BOSS DEFEAT — dramatis rendah lalu triumph
      case "bossDefeat": {
        this.tone({ freq: 110, start: 0, dur: 0.5, type: "sawtooth", gain: 0.1, slideTo: 55 });
        this.tone({ freq: 220, start: 0.05, dur: 0.4, type: "square", gain: 0.05, slideTo: 110 });
        // triumph chord
        this.tone({ freq: 440, start: 0.4, dur: 0.35, type: "triangle", gain: 0.11 });
        this.tone({ freq: 554.37, start: 0.46, dur: 0.35, type: "triangle", gain: 0.1 });
        this.tone({ freq: 659.25, start: 0.52, dur: 0.45, type: "triangle", gain: 0.11 });
        break;
      }

      // 🎁 DAILY REWARD — jingle peti harta
      case "dailyReward": {
        const coins = [1318.5, 1567.98, 2093.0, 2637.02];
        coins.forEach((f, i) => {
          this.tone({ freq: f, start: i * 0.07, dur: 0.18, type: "square", gain: 0.05 });
        });
        this.tone({ freq: 1046.5, start: 0.3, dur: 0.4, type: "triangle", gain: 0.09 });
        break;
      }

      // 🏆 ACHIEVEMENT — bel kemenangan
      case "achievement": {
        this.tone({ freq: 1046.5, start: 0, dur: 0.6, type: "sine", gain: 0.11 });
        this.tone({ freq: 1567.98, start: 0.08, dur: 0.55, type: "sine", gain: 0.08 });
        break;
      }

      // 🌟 CHALLENGE PASS — blip sukses singkat
      case "challengePass": {
        this.tone({ freq: 523.25, start: 0, dur: 0.1, type: "triangle", gain: 0.1 });
        this.tone({ freq: 783.99, start: 0.09, dur: 0.16, type: "triangle", gain: 0.1 });
        break;
      }
    }
  }
}

/** Singleton — aman dipakai di client components */
export const sfx = new SfxEngine();

// ---------------- helper terpusat ----------------
export const playLevelUp = () => sfx.play("levelUp");
export const playQuestComplete = () => sfx.play("questComplete");
export const playBossDefeat = () => sfx.play("bossDefeat");
export const playDailyReward = () => sfx.play("dailyReward");
export const playAchievement = () => sfx.play("achievement");
export const playChallengePass = () => sfx.play("challengePass");
