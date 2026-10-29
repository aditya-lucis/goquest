// ============================================================
// GoQuest Go Engine — TOKENIZER
// Mengubah source code Go menjadi deretan token,
// lengkap dengan aturan automatic semicolon insertion seperti Go asli.
// ============================================================

export type TokenType =
  | "ident"
  | "keyword"
  | "int"
  | "float"
  | "string"
  | "char"
  | "op"
  | "eof";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export class GoSyntaxError extends Error {
  line: number;
  col: number;
  constructor(message: string, line: number, col: number) {
    super(message);
    this.name = "GoSyntaxError";
    this.line = line;
    this.col = col;
  }
}

const KEYWORDS = new Set([
  "package", "import", "func", "var", "const", "type", "struct", "interface",
  "map", "chan", "go", "defer", "if", "else", "for", "range", "switch", "case",
  "default", "break", "continue", "return", "fallthrough", "select",
]);

const PREDECLARED = new Set([
  "nil", "true", "false", "make", "append", "len", "cap", "new", "panic",
  "print", "println", "recover",
]);

// Semua operator & punctuator Go (diurutkan dari terpanjang agar greedy match)
const OPERATORS = [
  "<<=", ">>=", "&^=", "...",
  "==", "!=", "<=", ">=", "&&", "||", "<-", "++", "--",
  "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", ":=",
  "+", "-", "*", "/", "%", "&", "|", "^", "<<", ">>", "&^",
  "<", ">", "=", "!", "(", ")", "[", "]", "{", "}", ",", ";", ".", ":", "~",
];

// Token yang BISA diikuti semicolon otomatis di akhir baris (aturan Go)
const SEMICOLON_TRIGGERS = new Set([
  "ident", "int", "float", "string", "char",
]);
const SEMICOLON_KEYWORDS = new Set([
  "break", "continue", "fallthrough", "return",
]);
const SEMICOLON_OPS = new Set(["++", "--", ")", "]", "}"]);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;
  const src = source;

  const pushTok = (type: TokenType, value: string, l = line, c = col) => {
    tokens.push({ type, value, line: l, col: c });
  };

  const advance = (n = 1) => {
    for (let k = 0; k < n; k++) {
      if (src[i] === "\n") {
        line++;
        col = 1;
      } else {
        col++;
      }
      i++;
    }
  };

  let lastMeaningful: Token | null = null;

  const maybeInsertSemicolon = () => {
    if (!lastMeaningful) return;
    const t = lastMeaningful;
    const ok =
      SEMICOLON_TRIGGERS.has(t.type) ||
      (t.type === "keyword" && SEMICOLON_KEYWORDS.has(t.value)) ||
      (t.type === "op" && SEMICOLON_OPS.has(t.value)) ||
      (t.type === "ident" && PREDECLARED.has(t.value) && t.value !== "nil" ? false : false);
    if (ok) pushTok("op", ";");
  };

  while (i < src.length) {
    const ch = src[i];

    // whitespace (tanpa newline → newline ditangani utk semicolon)
    if (ch === " " || ch === "\t" || ch === "\r") {
      advance();
      continue;
    }

    // newline → coba sisipkan semicolon
    if (ch === "\n") {
      maybeInsertSemicolon();
      advance();
      continue;
    }

    // line comment
    if (ch === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") advance();
      continue;
    }

    // block comment
    if (ch === "/" && src[i + 1] === "*") {
      advance(2);
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) advance();
      if (i >= src.length) throw new GoSyntaxError("comment tidak ditutup */", line, col);
      advance(2);
      continue;
    }

    // string literal
    if (ch === '"') {
      const l = line;
      const c = col;
      advance();
      let s = "";
      while (i < src.length && src[i] !== '"') {
        if (src[i] === "\n") throw new GoSyntaxError("string literal mengandung newline — kutip penutup hilang?", l, c);
        if (src[i] === "\\") {
          s += readEscape();
        } else {
          s += src[i];
          advance();
        }
      }
      if (i >= src.length) throw new GoSyntaxError("string literal tidak ditutup — tanda kutip \" hilang", l, c);
      advance(); // closing quote
      pushTok("string", s, l, c);
      lastMeaningful = tokens[tokens.length - 1];
      continue;
    }

    // raw string (backtick)
    if (ch === "`") {
      const l = line;
      const c = col;
      advance();
      let s = "";
      while (i < src.length && src[i] !== "`") {
        s += src[i];
        advance();
      }
      if (i >= src.length) throw new GoSyntaxError("raw string literal tidak ditutup — backtick ` hilang", l, c);
      advance();
      pushTok("string", s, l, c);
      lastMeaningful = tokens[tokens.length - 1];
      continue;
    }

    // char / rune literal
    if (ch === "'") {
      const l = line;
      const c = col;
      advance();
      let code = 0;
      if (src[i] === "\\") {
        const esc = readEscape();
        code = esc.length === 1 ? esc.charCodeAt(0) : 0;
      } else if (i < src.length) {
        code = src.charCodeAt(i);
        advance();
      }
      if (src[i] !== "'") throw new GoSyntaxError("rune literal tidak ditutup tanda kutip satu", l, c);
      advance();
      pushTok("char", String(code), l, c);
      lastMeaningful = tokens[tokens.length - 1];
      continue;
    }

    // number
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      const l = line;
      const c = col;
      let num = "";
      let isFloat = false;
      if (ch === "0" && (src[i + 1] === "x" || src[i + 1] === "X")) {
        num = "0x";
        advance(2);
        while (i < src.length && /[0-9a-fA-F_]/.test(src[i])) {
          num += src[i];
          advance();
        }
        pushTok("int", parseInt(num.replace(/_/g, ""), 16).toString(), l, c);
        lastMeaningful = tokens[tokens.length - 1];
        continue;
      }
      while (i < src.length && /[0-9_]/.test(src[i])) {
        num += src[i];
        advance();
      }
      if (src[i] === "." && /[0-9]/.test(src[i + 1] ?? "0")) {
        isFloat = true;
        num += ".";
        advance();
        while (i < src.length && /[0-9_]/.test(src[i])) {
          num += src[i];
          advance();
        }
      }
      if (src[i] === "e" || src[i] === "E") {
        isFloat = true;
        num += src[i];
        advance();
        if (src[i] === "+" || src[i] === "-") {
          num += src[i];
          advance();
        }
        while (i < src.length && /[0-9]/.test(src[i])) {
          num += src[i];
          advance();
        }
      }
      pushTok(isFloat ? "float" : "int", num.replace(/_/g, ""), l, c);
      lastMeaningful = tokens[tokens.length - 1];
      continue;
    }

    // identifier / keyword / predeclared
    if (/[a-zA-Z_]/.test(ch)) {
      const l = line;
      const c = col;
      let id = "";
      while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) {
        id += src[i];
        advance();
      }
      if (KEYWORDS.has(id)) pushTok("keyword", id, l, c);
      else pushTok("ident", id, l, c);
      lastMeaningful = tokens[tokens.length - 1];
      continue;
    }

    // operator
    let matched = false;
    for (const op of OPERATORS) {
      if (src.startsWith(op, i)) {
        pushTok("op", op, line, col);
        advance(op.length);
        lastMeaningful = tokens[tokens.length - 1];
        matched = true;
        break;
      }
    }
    if (matched) continue;

    throw new GoSyntaxError(`karakter tidak dikenal: '${ch}'`, line, col);
  }

  // semicolon di akhir file
  maybeInsertSemicolon();
  pushTok("eof", "");
  return tokens;

  function readEscape(): string {
    // dipanggil saat src[i] === "\\"
    advance(); // backslash
    const e = src[i];
    advance();
    switch (e) {
      case "n": return "\n";
      case "t": return "\t";
      case "r": return "\r";
      case "\\": return "\\";
      case '"': return '"';
      case "'": return "'";
      case "0": return "\0";
      default:
        throw new GoSyntaxError(`escape sequence tidak dikenal: \\${e}`, line, col);
    }
  }
}
