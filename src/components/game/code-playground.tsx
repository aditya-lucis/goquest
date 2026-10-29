"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle2, RotateCcw, Lightbulb, TerminalSquare, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CodeValidator } from "@/game/types";
import { runGoCode, gradeSubmission, friendlyError, type RunResult } from "@/game/engine";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
      Memanggil editor misteri...
    </div>
  ),
});

// ============================================================
// CODE PLAYGROUND — Monaco + Go engine + auto-grader
// ============================================================

interface CodePlaygroundProps {
  starterCode: string;
  hint?: string;
  expectedOutput?: string;
  validators?: CodeValidator[];
  /** true = tampilkan tombol Periksa (grading) */
  gradeable?: boolean;
  onPassed?: () => void;
  onFailed?: () => void;
  height?: string;
}

type Feedback =
  | { type: "idle" }
  | { type: "running" }
  | { type: "output"; output: string }
  | { type: "error"; message: string; friendly?: string | null; kind?: string; partial?: string }
  | { type: "passed"; output: string }
  | {
      type: "failed";
      output: string;
      friendly?: string | null;
      message?: string;
      hints: string[];
      outputMatched?: boolean;
    };

export function CodePlayground({
  starterCode,
  hint,
  expectedOutput,
  validators = [],
  gradeable = false,
  onPassed,
  onFailed,
  height = "380px",
}: CodePlaygroundProps) {
  const [code, setCode] = useState(starterCode);
  const [feedback, setFeedback] = useState<Feedback>({ type: "idle" });
  const [showHint, setShowHint] = useState(false);
  const [monacoFailed, setMonacoFailed] = useState(false);
  const [editorMounted, setEditorMounted] = useState(false);
  // guard agar onPassed hanya sekali per challenge (terikat starterCode)
  const [passedStarter, setPassedStarter] = useState<string | null>(null);

  // reset state saat prop starterCode berganti (pola adjust-during-render React)
  const [prevStarter, setPrevStarter] = useState(starterCode);
  if (prevStarter !== starterCode) {
    setPrevStarter(starterCode);
    setCode(starterCode);
    setFeedback({ type: "idle" });
    setShowHint(false);
  }

  // fallback: jika Monaco (CDN) tak kunjung termuat dalam 8 detik
  useEffect(() => {
    const t = setTimeout(() => {
      if (!editorMounted) setMonacoFailed(true);
    }, 8000);
    return () => clearTimeout(t);
  }, [editorMounted]);

  const runCode = useCallback(() => {
    setFeedback({ type: "running" });
    // beri satu frame agar spinner tampil
    setTimeout(() => {
      const result = runGoCode(code);
      if (result.ok) {
        setFeedback({ type: "output", output: result.output });
      } else {
        setFeedback({
          type: "error",
          message: result.error?.message ?? "unknown error",
          friendly: friendlyError(result),
          kind: result.errorKind,
          partial: result.output,
        });
      }
    }, 30);
  }, [code]);

  const submitCode = useCallback(() => {
    if (!expectedOutput) return;
    setFeedback({ type: "running" });
    setTimeout(() => {
      const grade = gradeSubmission(code, expectedOutput, validators);
      if (grade.passed) {
        setFeedback({ type: "passed", output: grade.runOutput });
        if (passedStarter !== starterCode) {
          setPassedStarter(starterCode);
          onPassed?.();
        }
      } else if (grade.error) {
        onFailed?.();
        setFeedback({
          type: "error",
          message: grade.error,
          friendly: friendlyError({ ok: false, output: grade.runOutput, error: { message: grade.error }, errorKind: grade.errorKind as RunResult["errorKind"] }),
          kind: grade.errorKind,
          partial: grade.runOutput,
        });
      } else {
        onFailed?.();
        setFeedback({
          type: "failed",
          output: grade.runOutput,
          friendly: grade.outputMatched ? null : undefined,
          hints: grade.failedValidators.map((v) => v.hint),
          outputMatched: grade.outputMatched,
        });
      }
    }, 30);
  }, [code, expectedOutput, validators, onPassed, onFailed, passedStarter, starterCode]);

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      {/* toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/70 border-b border-border flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-auto">
          <TerminalSquare className="w-4 h-4 text-neon" />
          <span className="font-mono">main.go</span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 gap-1.5 text-xs"
          onClick={() => {
            setCode(starterCode);
            setFeedback({ type: "idle" });
          }}
          title="Kembalikan kode awal"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>
        {hint ? (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setShowHint((v) => !v)}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${showHint ? "text-gold" : ""}`} />
            {showHint ? "Sembunyikan Hint" : "Hint"}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          className="h-8 gap-1.5 text-xs"
          onClick={runCode}
        >
          <Play className="w-3.5 h-3.5 text-emerald-400" /> Jalankan
        </Button>
        {gradeable ? (
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90"
            onClick={submitCode}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Periksa Jawaban
          </Button>
        ) : null}
      </div>

      {/* hint */}
      <AnimatePresence>
        {showHint && hint ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-[oklch(0.82_0.16_85/0.07)]"
          >
            <div className="px-4 py-3 text-[13px] leading-relaxed flex gap-2">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-gold" />
              <p>{hint}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* editor */}
      <div className="relative" style={{ height }}>
        {monacoFailed ? (
          <FallbackEditor code={code} onChange={setCode} />
        ) : (
          <MonacoEditor
            height="100%"
            defaultLanguage="go"
            language="go"
            theme="goquest-dark"
            value={code}
            onChange={(v) => setCode(v ?? "")}
            beforeMount={(monaco) => {
              monaco.editor.defineTheme("goquest-dark", {
                base: "vs-dark",
                inherit: true,
                rules: [
                  { token: "keyword", foreground: "e879f9" },
                  { token: "string", foreground: "6ee7b7" },
                  { token: "number", foreground: "fcd34d" },
                  { token: "comment", foreground: "64748b", fontStyle: "italic" },
                  { token: "type", foreground: "67e8f9" },
                  { token: "identifier", foreground: "d4c9f0" },
                  { token: "delimiter", foreground: "a8a3c7" },
                  { token: "operator", foreground: "f0abfc" },
                ],
                colors: {
                  "editor.background": "#150f28",
                  "editor.lineHighlightBackground": "#221a3d",
                  "editorLineNumber.foreground": "#565178",
                  "editorLineNumber.activeForeground": "#c4b5fd",
                  "editorCursor.foreground": "#67e8f9",
                  "editor.selectionBackground": "#3b2d68",
                  "editorIndentGuide.background": "#2a2145",
                },
              });
            }}
            onMount={() => setEditorMounted(true)}
            options={{
              fontSize: 13.5,
              fontFamily: "var(--font-jetbrains), JetBrains Mono, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 14, bottom: 14 },
              smoothScrolling: true,
              cursorBlinking: "phase",
              renderLineHighlight: "line",
              automaticLayout: true,
              tabSize: 4,
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            }}
          />
        )}
      </div>

      {/* terminal output */}
      <div className="border-t border-border bg-[oklch(0.11_0.015_295)]">
        <div className="scanlines relative">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.65_0.22_25)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.82_0.16_85)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.8_0.2_145)]" />
            </div>
            <span className="text-[11px] font-mono text-muted-foreground ml-2">
              output — go run main.go
            </span>
          </div>
          <div className="px-4 py-3 min-h-[88px] max-h-52 overflow-y-auto">
            <AnimatePresence mode="wait">
              {feedback.type === "idle" ? (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-muted-foreground text-[13px] font-mono"
                >
                  $ Menunggu mantra-mu...
                  <span className="terminal-caret text-neon">▌</span>
                </motion.p>
              ) : feedback.type === "running" ? (
                <motion.p
                  key="running"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-cyan-300 text-[13px] font-mono"
                >
                  $ go run main.go
                  <span className="terminal-caret text-neon">▌</span>
                </motion.p>
              ) : feedback.type === "output" ? (
                <motion.pre
                  key="out"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-emerald-200/90 text-[13px] font-mono whitespace-pre-wrap"
                >
                  {feedback.output || "(tidak ada output — tambahkan fmt.Println!)"}
                </motion.pre>
              ) : feedback.type === "error" ? (
                <motion.div key="err" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  {feedback.partial ? (
                    <pre className="text-emerald-200/90 text-[13px] font-mono whitespace-pre-wrap">
                      {feedback.partial}
                    </pre>
                  ) : null}
                  <pre className="text-red-300 text-[13px] font-mono whitespace-pre-wrap">
                    {feedback.kind === "panic" ? "" : "✗ "}
                    {feedback.message}
                  </pre>
                  {feedback.friendly ? (
                    <div className="flex gap-2 items-start rounded-lg bg-[oklch(0.62_0.21_293/0.12)] border border-[oklch(0.62_0.21_293/0.35)] px-3 py-2">
                      <Sparkles className="w-4 h-4 text-violet-300 shrink-0 mt-0.5" />
                      <p className="text-[12.5px] text-violet-200 leading-relaxed">
                        {feedback.friendly}
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              ) : feedback.type === "failed" ? (
                <motion.div key="fail" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <pre className="text-emerald-200/90 text-[13px] font-mono whitespace-pre-wrap">
                    {feedback.output || "(tidak ada output — tambahkan fmt.Println!)"}
                  </pre>
                  <div className="flex gap-2 items-start rounded-lg bg-[oklch(0.82_0.16_85/0.08)] border border-[oklch(0.82_0.16_85/0.35)] px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <div className="text-[12.5px] text-amber-100 leading-relaxed space-y-1.5">
                      <p className="font-semibold">
                        {feedback.outputMatched
                          ? "Output sudah sesuai target, tetapi ada aturan kode yang belum terpenuhi:"
                          : "Belum tepat — output belum sesuai target."}
                      </p>
                      {feedback.hints.map((h, i) => (
                        <p key={i}>• {h}</p>
                      ))}
                      {!feedback.output.trim() ? (
                        <p>• Program-mu belum mencetak apa pun — pastikan fmt.Println terpanggil di func main.</p>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ) : feedback.type === "passed" ? (
                <motion.div
                  key="pass"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-2"
                >
                  <pre className="text-emerald-200/90 text-[13px] font-mono whitespace-pre-wrap">
                    {feedback.output}
                  </pre>
                  <div className="flex items-center gap-2 rounded-lg bg-[oklch(0.8_0.2_145/0.1)] border border-[oklch(0.8_0.2_145/0.4)] px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-[13px] text-emerald-200 font-semibold">
                      SEMPURNA! Output cocok. Mantra berhasil! ✨
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Editor cadangan bila CDN Monaco tak tersedia */
function FallbackEditor({ code, onChange }: { code: string; onChange: (v: string) => void }) {
  return (
    <div className="relative h-full bg-[#150f28]">
      <div className="dungeon-grid-fine absolute inset-0 pointer-events-none" />
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="relative w-full h-full bg-transparent text-[13.5px] leading-relaxed font-mono text-[#d4c9f0] resize-none outline-none px-4 py-3.5"
        aria-label="Editor kode Go"
      />
    </div>
  );
}
