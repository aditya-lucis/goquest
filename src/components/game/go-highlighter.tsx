"use client";

import React from "react";

// ============================================================
// Go syntax highlighter ringan untuk blok kode di lesson & preview
// ============================================================

const KEYWORDS = new Set([
  "package", "import", "func", "var", "const", "type", "struct", "interface",
  "map", "chan", "go", "defer", "if", "else", "for", "range", "switch", "case",
  "default", "break", "continue", "return", "fallthrough", "select",
]);
const TYPES = new Set([
  "int", "string", "bool", "float64", "float32", "byte", "rune", "error",
  "uint8", "uint", "int64", "int32", "any",
]);
const BUILTINS = new Set([
  "nil", "true", "false", "make", "append", "len", "cap", "new", "panic",
  "print", "println", "recover",
]);

type Piece = { text: string; cls: string };

function tokenizeGoLine(line: string): Piece[] {
  const pieces: Piece[] = [];
  let i = 0;
  const push = (text: string, cls: string) => {
    if (text) pieces.push({ text, cls });
  };

  while (i < line.length) {
    const ch = line[i];

    // comment
    if (ch === "/" && line[i + 1] === "/") {
      push(line.slice(i), "text-slate-500 italic");
      break;
    }

    // string
    if (ch === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') {
        if (line[j] === "\\") j++;
        j++;
      }
      push(line.slice(i, Math.min(j + 1, line.length)), "text-emerald-300");
      i = j + 1;
      continue;
    }
    if (ch === "`") {
      const end = line.indexOf("`", i + 1);
      push(line.slice(i, end === -1 ? line.length : end + 1), "text-emerald-300");
      i = end === -1 ? line.length : end + 1;
      continue;
    }

    // char/rune
    if (ch === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== "'") {
        if (line[j] === "\\") j++;
        j++;
      }
      push(line.slice(i, Math.min(j + 1, line.length)), "text-emerald-300");
      i = j + 1;
      continue;
    }

    // number
    if (/[0-9]/.test(ch) && !/[a-zA-Z_]/.test(line[i - 1] ?? "")) {
      let j = i;
      while (j < line.length && /[0-9._]/.test(line[j])) j++;
      push(line.slice(i, j), "text-amber-300");
      i = j;
      continue;
    }

    // identifier / keyword
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (KEYWORDS.has(word)) push(word, "text-fuchsia-400 font-medium");
      else if (TYPES.has(word)) push(word, "text-cyan-300");
      else if (BUILTINS.has(word)) push(word, "text-orange-300");
      else if (/^[A-Z]/.test(word)) push(word, "text-violet-300");
      else push(word, "");
      i = j;
      continue;
    }

    // operators
    if (/[+\-*/%=<>!&|^~]/.test(ch)) {
      push(ch, "text-pink-400");
      i++;
      continue;
    }

    // punctuation & lainnya
    push(ch, "text-slate-300");
    i++;
  }
  return pieces;
}

export function GoCode({ code, className = "" }: { code: string; className?: string }) {
  return (
    <pre className={`font-mono text-[12.5px] leading-relaxed whitespace-pre ${className}`}>
      {code.split("\n").map((line, idx) => (
        <React.Fragment key={idx}>
          {tokenizeGoLine(line).map((p, i) => (
            <span key={i} className={p.cls}>
              {p.text}
            </span>
          ))}
          {"\n"}
        </React.Fragment>
      ))}
    </pre>
  );
}
