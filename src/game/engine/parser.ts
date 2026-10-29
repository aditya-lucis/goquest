// ============================================================
// GoQuest Go Engine — PARSER (recursive descent)
// Menghasilkan AST dari deretan token.
// ============================================================

import { tokenize, type Token } from "./tokenizer";

// ---------------- AST TYPES ----------------

export type Expr =
  | { kind: "Ident"; name: string }
  | { kind: "BasicLit"; litType: "int" | "float" | "string" | "bool" | "nil" | "char"; value: string }
  | { kind: "UnaryExpr"; op: string; x: Expr }
  | { kind: "BinaryExpr"; op: string; l: Expr; r: Expr }
  | { kind: "CallExpr"; fn: Expr; args: Array<Expr | { kind: "TypeArg"; type: TypeExpr }>; ellipsis: boolean }
  | { kind: "SelectorExpr"; x: Expr; sel: string }
  | { kind: "IndexExpr"; x: Expr; index: Expr }
  | { kind: "SliceExpr"; x: Expr; low: Expr | null; high: Expr | null }
  | { kind: "CompositeLit"; type: TypeExpr; elts: Array<{ key: Expr | null; value: Expr }> }
  | { kind: "FuncLit"; type: FuncType; body: Block }
  | { kind: "ParenExpr"; x: Expr };

export type TypeArg = { kind: "TypeArg"; type: TypeExpr };

export type TypeExpr =
  | { kind: "IdentType"; name: string }
  | { kind: "SelectorType"; pkg: string; name: string }
  | { kind: "ArrayType"; len: Expr | null; elem: TypeExpr }
  | { kind: "MapType"; key: TypeExpr; value: TypeExpr }
  | { kind: "ChanType"; elem: TypeExpr }
  | { kind: "StructType"; fields: Array<{ names: string[]; type: TypeExpr }> }
  | { kind: "InterfaceType"; methods: Array<{ name: string; type: FuncType }> }
  | { kind: "FuncTypeExpr"; type: FuncType }
  | { kind: "PointerType"; elem: TypeExpr };

export interface FuncParam {
  names: string[]; // bisa kosong (unnamed)
  type: TypeExpr;
}

export interface FuncType {
  params: FuncParam[];
  results: Array<{ name: string | null; type: TypeExpr }>;
}

export type Stmt =
  | { kind: "ExprStmt"; x: Expr }
  | { kind: "AssignStmt"; lhs: Expr[]; op: string; rhs: Expr[] }
  | { kind: "IncDecStmt"; x: Expr; op: string }
  | { kind: "VarDecl"; names: string[]; type: TypeExpr | null; values: Expr[] }
  | { kind: "ConstDecl"; names: string[]; type: TypeExpr | null; values: Expr[] }
  | { kind: "IfStmt"; init: Stmt | null; cond: Expr; then: Block; else: Stmt | null }
  | { kind: "ForStmt"; init: Stmt | null; cond: Expr | null; post: Stmt | null; body: Block }
  | { kind: "RangeStmt"; key: Expr | null; value: Expr | null; op: string; rangeExpr: Expr; body: Block }
  | { kind: "SwitchStmt"; init: Stmt | null; tag: Expr | null; clauses: Array<{ exprs: Expr[]; isDefault: boolean; body: Block }> }
  | { kind: "ReturnStmt"; values: Expr[] }
  | { kind: "BranchStmt"; tok: "break" | "continue" }
  | { kind: "GoStmt"; call: Expr }
  | { kind: "SendStmt"; ch: Expr; value: Expr } // ch <- v
  | { kind: "DeferStmt"; call: Expr }
  | { kind: "BlockStmt"; block: Block }
  | { kind: "TypeDeclStmt"; decl: TypeDecl }
  | { kind: "EmptyStmt" };

export interface Block {
  stmts: Stmt[];
}

export interface TypeDecl {
  name: string;
  type: TypeExpr;
}

export interface FuncDecl {
  name: string | null; // null utk literal
  receiver: { name: string; type: TypeExpr } | null;
  type: FuncType;
  body: Block;
}

export interface Program {
  imports: string[];
  funcs: FuncDecl[]; // termasuk method (dengan receiver)
  types: TypeDecl[];
  varDecls: Stmt[];
  methodsByType: Record<string, FuncDecl[]>;
}

// ---------------- HELPERS ----------------

const BINARY_PREC: Record<string, number> = {
  "||": 1,
  "&&": 2,
  "==": 3, "!=": 3, "<": 3, "<=": 3, ">": 3, ">=": 3,
  "+": 4, "-": 4, "|": 4, "^": 4,
  "*": 5, "/": 5, "%": 5, "<<": 5, ">>": 5, "&": 5, "&^": 5,
};

export class GoParseError extends Error {
  line: number;
  constructor(message: string, line: number) {
    super(message);
    this.name = "GoParseError";
    this.line = line;
  }
}

// ---------------- PARSER ----------------

class Parser {
  private toks: Token[];
  private pos = 0;
  /** true saat memparse kondisi if/for/switch — composite literal T{...} dilarang di sana */
  private noComposite = false;

  constructor(source: string) {
    this.toks = tokenize(source);
  }

  private peek(offset = 0): Token {
    return this.toks[Math.min(this.pos + offset, this.toks.length - 1)];
  }

  private cur(): Token {
    return this.toks[this.pos];
  }

  private next(): Token {
    return this.toks[this.pos++];
  }

  private check(value: string): boolean {
    const t = this.cur();
    return (t.type === "op" || t.type === "keyword") && t.value === value;
  }

  private accept(value: string): boolean {
    if (this.check(value)) {
      this.pos++;
      return true;
    }
    return false;
  }

  private expect(value: string): Token {
    if (this.check(value)) return this.next();
    const t = this.cur();
    const got = t.type === "eof" ? "akhir file" : `'${t.value}'`;
    throw new GoParseError(`syntax error: unexpected ${got}, mengharapkan '${value}'`, t.line);
  }

  private expectIdent(): string {
    const t = this.cur();
    if (t.type === "ident") {
      this.pos++;
      return t.value;
    }
    const got = t.type === "eof" ? "akhir file" : `'${t.value}'`;
    throw new GoParseError(`syntax error: unexpected ${got}, mengharapkan identifier`, t.line);
  }

  private skipSemis() {
    while (this.check(";")) this.pos++;
  }

  // ---------------- PROGRAM ----------------

  parseProgram(): Program {
    const program: Program = {
      imports: [],
      funcs: [],
      types: [],
      varDecls: [],
      methodsByType: {},
    };

    // package clause
    this.expectKeyword("package");
    this.expectIdent();
    this.skipSemis();

    while (this.cur().type !== "eof") {
      this.skipSemis();
      if (this.cur().type === "eof") break;

      if (this.checkKeyword("import")) {
        this.parseImports(program);
      } else if (this.checkKeyword("func")) {
        const f = this.parseFuncDecl();
        program.funcs.push(f);
        if (f.receiver) {
          const tname = typeNameOf(f.receiver.type);
          (program.methodsByType[tname] ??= []).push(f);
        }
      } else if (this.checkKeyword("type")) {
        this.parseTypeDecl(program);
      } else if (this.checkKeyword("var") || this.checkKeyword("const")) {
        const s = this.parseGenDecl();
        program.varDecls.push(s);
      } else {
        const t = this.cur();
        throw new GoParseError(
          `syntax error: unexpected '${t.value}' di level atas (hanya boleh package/import/func/type/var/const)`,
          t.line,
        );
      }
    }
    return program;
  }

  private expectKeyword(kw: string) {
    const t = this.cur();
    if (t.type === "keyword" && t.value === kw) {
      this.pos++;
      return;
    }
    const got = t.type === "eof" ? "akhir file" : `'${t.value}'`;
    throw new GoParseError(`syntax error: unexpected ${got}, mengharapkan '${kw}'`, t.line);
  }

  private checkKeyword(kw: string): boolean {
    const t = this.cur();
    return t.type === "keyword" && t.value === kw;
  }

  private parseImports(program: Program) {
    this.expectKeyword("import");
    if (this.accept("(")) {
      this.skipSemis();
      while (!this.check(")")) {
        if (this.cur().type === "eof") throw new GoParseError("syntax error: import block tidak ditutup ')'", this.cur().line);
        const t = this.cur();
        if (t.type === "string") {
          program.imports.push(t.value);
          this.pos++;
        } else if (this.checkKeyword("var")) {
          break;
        } else {
          throw new GoParseError(`syntax error: unexpected '${t.value}' dalam import`, t.line);
        }
        this.skipSemis();
      }
      this.expect(")");
      this.skipSemis();
    } else {
      const t = this.cur();
      if (t.type !== "string") throw new GoParseError("syntax error: import harus diikuti string package", t.line);
      program.imports.push(t.value);
      this.pos++;
    }
    this.accept(";");
  }

  // ---------------- DECLARATIONS ----------------

  private parseTypeDecl(program: Program) {
    this.expectKeyword("type");
    const name = this.expectIdent();
    // `type X = Y` alias — perlakukan sama
    this.accept("=");
    const type = this.parseType();
    program.types.push({ name, type });
    this.accept(";");
  }

  private parseGenDecl(): Stmt {
    const isConst = this.cur().value === "const";
    this.pos++; // consume var/const
    const names: string[] = [this.expectIdent()];
    while (this.accept(",")) names.push(this.expectIdent());

    let type: TypeExpr | null = null;
    let values: Expr[] = [];

    if (!this.check("=")) {
      type = this.parseType();
    }
    if (this.accept("=")) {
      values = [this.parseExpr()];
      while (this.accept(",")) values.push(this.parseExpr());
    }
    this.accept(";");
    return isConst
      ? { kind: "ConstDecl", names, type, values }
      : { kind: "VarDecl", names, type, values };
  }

  private parseFuncDecl(): FuncDecl {
    this.expectKeyword("func");
    let receiver: { name: string; type: TypeExpr } | null = null;

    if (this.check("(")) {
      this.pos++;
      const name = this.expectIdent();
      const type = this.parseType();
      this.expect(")");
      receiver = { name, type };
    }

    const name = this.expectIdent();
    const type = this.parseFuncType();
    const body = this.parseBlock();
    return { name, receiver, type, body };
  }

  private parseFuncType(): FuncType {
    this.expect("(");
    const params: FuncParam[] = [];
    while (!this.check(")")) {
      const names: string[] = [];
      // peek: apakah diawali nama? (bisa juga tipe langsung utk unnamed)
      if (this.cur().type === "ident" || this.cur().value === "_") {
        // bisa `name type` atau hanya `type` (unnamed, mis. func(int) int)
        const first = this.expectIdent();
        if (this.cur().type === "ident" || this.check("*") || this.check("[") || this.check("map") || this.check("chan") || this.check("func") || this.check("struct") || this.check("interface")) {
          names.push(first);
          while (this.accept(",")) names.push(this.expectIdent());
          const t = this.parseType();
          params.push({ names, type: t });
        } else {
          // unnamed param: first adalah nama tipe
          params.push({ names: [], type: { kind: "IdentType", name: first } });
        }
      } else if (this.check("*") || this.check("[") || this.check("map") || this.check("chan") || this.check("func") || this.check("struct") || this.check("interface")) {
        const t = this.parseType();
        params.push({ names: [], type: t });
      } else {
        const t = this.cur();
        throw new GoParseError(`syntax error: unexpected '${t.value}' dalam parameter fungsi`, t.line);
      }
      if (!this.accept(",")) break;
    }
    this.expect(")");

    const results: Array<{ name: string | null; type: TypeExpr }> = [];
    if (this.check("(")) {
      this.pos++;
      while (!this.check(")")) {
        // named result: `name type` | unnamed: `type`
        if (this.cur().type === "ident" && (this.peek(1).type === "ident" || this.peek(1).value === "*" || this.peek(1).value === "[" || this.peek(1).value === "map" || this.peek(1).value === "chan" || this.peek(1).value === "func" || this.peek(1).value === "struct" || this.peek(1).value === "interface")) {
          const n = this.expectIdent();
          const t = this.parseType();
          results.push({ name: n, type: t });
        } else {
          const t = this.parseType();
          results.push({ name: null, type: t });
        }
        if (!this.accept(",")) break;
      }
      this.expect(")");
    } else if (
      this.cur().type === "ident" ||
      this.check("*") || this.check("[") || this.check("map") ||
      this.check("chan") || this.check("func") || this.check("struct") || this.check("interface")
    ) {
      // single unnamed result: T, *T, []T, map[K]V, chan T, func(...), struct{...}
      if (
        (this.cur().type === "ident" && !this.check("{")) ||
        this.check("*") || this.check("[") || this.check("map") ||
        this.check("chan") || this.check("func") || this.check("struct") || this.check("interface")
      ) {
        const t = this.parseType();
        results.push({ name: null, type: t });
      }
    }
    return { params, results };
  }

  // ---------------- TYPES ----------------

  private parseType(): TypeExpr {
    const t = this.cur();
    if (this.accept("*")) {
      return { kind: "PointerType", elem: this.parseType() };
    }
    if (this.check("[")) {
      this.pos++;
      if (this.accept("]")) {
        return { kind: "ArrayType", len: null, elem: this.parseType() };
      }
      const len = this.parseExpr();
      this.expect("]");
      return { kind: "ArrayType", len, elem: this.parseType() };
    }
    if (this.checkKeyword("map")) {
      this.pos++;
      this.expect("[");
      const key = this.parseType();
      this.expect("]");
      const value = this.parseType();
      return { kind: "MapType", key, value };
    }
    if (this.checkKeyword("chan")) {
      this.pos++;
      const elem = this.parseType();
      return { kind: "ChanType", elem };
    }
    if (this.checkKeyword("func")) {
      this.pos++;
      const type = this.parseFuncType();
      return { kind: "FuncTypeExpr", type };
    }
    if (this.checkKeyword("struct")) {
      this.pos++;
      this.expect("{");
      const fields: Array<{ names: string[]; type: TypeExpr }> = [];
      this.skipSemis();
      while (!this.check("}")) {
        if (this.cur().type === "eof") throw new GoParseError("syntax error: struct tidak ditutup '}'", this.cur().line);
        const names: string[] = [];
        // embedded type (satu nama tipe saja) atau named fields
        const first = this.cur();
        if (first.type !== "ident") {
          throw new GoParseError(`syntax error: unexpected '${first.value}' dalam field struct`, first.line);
        }
        this.pos++;
        names.push(first.value);
        while (this.accept(",")) names.push(this.expectIdent());
        const type = this.parseType();
        fields.push({ names, type });
        this.skipSemis();
      }
      this.expect("}");
      return { kind: "StructType", fields };
    }
    if (this.checkKeyword("interface")) {
      this.pos++;
      this.expect("{");
      const methods: Array<{ name: string; type: FuncType }> = [];
      this.skipSemis();
      while (!this.check("}")) {
        if (this.cur().type === "eof") throw new GoParseError("syntax error: interface tidak ditutup '}'", this.cur().line);
        const name = this.expectIdent();
        if (this.cur().type === "string") this.pos++; // doc? skip
        const type = this.parseFuncType();
        methods.push({ name, type });
        this.skipSemis();
      }
      this.expect("}");
      return { kind: "InterfaceType", methods };
    }
    if (t.type === "ident") {
      this.pos++;
      // pkg.Type
      if (this.check(".") && this.peek(1).type === "ident") {
        this.pos++; // dot
        const name = this.expectIdent();
        return { kind: "SelectorType", pkg: t.value, name };
      }
      return { kind: "IdentType", name: t.value };
    }
    throw new GoParseError(`syntax error: unexpected '${t.value}' saat membaca tipe`, t.line);
  }

  // ---------------- STATEMENTS ----------------

  private parseBlock(): Block {
    this.expect("{");
    const stmts: Stmt[] = [];
    this.skipSemis();
    while (!this.check("}")) {
      if (this.cur().type === "eof") throw new GoParseError("syntax error: blok tidak ditutup '}'", this.cur().line);
      stmts.push(this.parseStmt());
      this.skipSemis();
    }
    this.expect("}");
    return { stmts };
  }

  private parseStmt(): Stmt {
    const t = this.cur();

    switch (t.type) {
      case "keyword": {
        switch (t.value) {
          case "var":
          case "const":
            return this.parseGenDecl();
          case "type": {
            // type decl dalam blok — kembalikan via wrapper
            this.pos++;
            const name = this.expectIdent();
            this.accept("=");
            const type = this.parseType();
            this.accept(";");
            return { kind: "TypeDeclStmt", decl: { name, type } };
          }
          case "if":
            return this.parseIf();
          case "for":
            return this.parseFor();
          case "switch":
            return this.parseSwitch();
          case "return": {
            this.pos++;
            const values: Expr[] = [];
            if (!this.check(";") && !this.check("}")) {
              values.push(this.parseExpr());
              while (this.accept(",")) values.push(this.parseExpr());
            }
            this.accept(";");
            return { kind: "ReturnStmt", values };
          }
          case "break":
            this.pos++;
            this.accept(";");
            return { kind: "BranchStmt", tok: "break" };
          case "continue":
            this.pos++;
            this.accept(";");
            return { kind: "BranchStmt", tok: "continue" };
          case "go": {
            this.pos++;
            const call = this.parseExpr();
            this.accept(";");
            return { kind: "GoStmt", call };
          }
          case "defer": {
            this.pos++;
            const call = this.parseExpr();
            this.accept(";");
            return { kind: "DeferStmt", call };
          }
        }
        break;
      }
      case "op":
        if (t.value === "{") {
          return { kind: "BlockStmt", block: this.parseBlock() };
        }
        if (t.value === ";") {
          this.pos++;
          return { kind: "EmptyStmt" };
        }
        break;
    }

    // expression / assignment / incdec — dukung multi-assign: a, b := ...
    const first = this.parseExpr();

    // channel send: ch <- value
    if (this.check("<-")) {
      this.pos++;
      const value = this.parseExpr();
      this.accept(";");
      return { kind: "SendStmt", ch: first, value };
    }

    if (
      this.check("=") || this.check(":=") || this.check("+=") || this.check("-=") ||
      this.check("*=") || this.check("/=") || this.check("%=")
    ) {
      const op = this.next().value;
      const lhs = [first];
      while (this.accept(",")) lhs.push(this.parseExpr());
      const rhs = [this.parseExpr()];
      while (this.accept(",")) rhs.push(this.parseExpr());
      this.accept(";");
      return { kind: "AssignStmt", lhs, op, rhs };
    }
    // multi-assign: first, second, ... = / :=
    if (this.check(",")) {
      const lhs = [first];
      while (this.accept(",")) lhs.push(this.parseExpr());
      const op = this.next().value; // = atau :=
      const rhs = [this.parseExpr()];
      while (this.accept(",")) rhs.push(this.parseExpr());
      this.accept(";");
      return { kind: "AssignStmt", lhs, op, rhs };
    }
    if (this.check("++") || this.check("--")) {
      const op = this.next().value;
      this.accept(";");
      return { kind: "IncDecStmt", x: first, op };
    }

    this.accept(";");
    return { kind: "ExprStmt", x: first };
  }

  private parseIf(): Stmt {
    this.expectKeyword("if");

    // init statement: `if x := f(); x > 0 {` atau `if v, ok := m[k]; ok {`
    const save = this.pos;
    const first = this.parseExpr();

    const parseTail = (init: Stmt | null): Stmt => {
      const savedNoComp = this.noComposite;
      this.noComposite = true;
      const cond = this.parseExpr();
      this.noComposite = savedNoComp;
      const then = this.parseBlock();
      let els: Stmt | null = null;
      if (this.checkKeyword("else")) {
        this.pos++;
        if (this.checkKeyword("if")) els = this.parseIf();
        else els = { kind: "BlockStmt", block: this.parseBlock() };
      }
      return { kind: "IfStmt", init, cond, then, else: els };
    };

    // assignment init: if x := f(); cond — atau multi: if v, ok := m[k]; cond
    if (this.check(":=") || this.check("=")) {
      const op = this.next().value;
      const lhs = [first];
      while (this.accept(",")) lhs.push(this.parseExpr());
      const rhs = [this.parseExpr()];
      while (this.accept(",")) rhs.push(this.parseExpr());
      this.expect(";");
      return parseTail({ kind: "AssignStmt", lhs, op, rhs });
    }
    // multi-lhs assignment init: if v, ok := m[k]; cond (first = v, lalu ',')
    if (this.check(",")) {
      const lhs = [first];
      while (this.accept(",")) lhs.push(this.parseExpr());
      if (!this.check(":=") && !this.check("=")) {
        throw new GoParseError(
          `syntax error: unexpected ',' dalam kondisi if (harus assignment: if v, ok := ...)`,
          this.cur().line,
        );
      }
      const op = this.next().value;
      const rhs = [this.parseExpr()];
      while (this.accept(",")) rhs.push(this.parseExpr());
      this.expect(";");
      return parseTail({ kind: "AssignStmt", lhs, op, rhs });
    }
    // expression init: if f(); cond
    if (this.accept(";")) {
      return parseTail({ kind: "ExprStmt", x: first });
    }

    // tanpa init
    this.pos = save;
    return parseTail(null);
  }

  private parseFor(): Stmt {
    this.expectKeyword("for");

    // for range: `for i, v := range x {` atau `for v := range x {`
    const save = this.pos;
    const range = this.tryParseRange();
    if (range) return range;
    this.pos = save;

    // bentuk tanpa kondisi: for { }
    if (this.check("{")) {
      const body = this.parseBlock();
      return { kind: "ForStmt", init: null, cond: null, post: null, body };
    }

    // cek apakah ada init (diikuti ';') — parse dengan lookahead sulit,
    // jadi: parse stmt ringan secara manual
    let init: Stmt | null = null;
    let cond: Expr | null = null;
    let post: Stmt | null = null;

    if (!this.check(";")) {
      // bisa init (assign/incdec/expr) atau kondisi
      const first = this.parseExpr();
      if (this.check(":=") || this.check("=")) {
        const op = this.next().value;
        const lhs = [first];
        while (this.accept(",")) lhs.push(this.parseExpr());
        const rhs = [this.parseExpr()];
        while (this.accept(",")) rhs.push(this.parseExpr());
        init = { kind: "AssignStmt", lhs, op, rhs };
      } else if (this.check("++") || this.check("--")) {
        const op = this.next().value;
        init = { kind: "IncDecStmt", x: first, op };
      } else {
        cond = first;
      }
    } else {
      // `for ; cond; post` — init kosong
    }

    if (init || this.check(";")) {
      this.expect(";");
      if (!this.check(";")) {
        const savedNoComp = this.noComposite;
        this.noComposite = true;
        cond = this.parseExpr();
        this.noComposite = savedNoComp;
      }
      this.expect(";");
      if (!this.check("{")) {
        const postExpr = this.parseExpr();
        if (this.check("++") || this.check("--")) {
          post = { kind: "IncDecStmt", x: postExpr, op: this.next().value };
        } else {
          post = { kind: "ExprStmt", x: postExpr };
        }
      }
    }

    const body = this.parseBlock();
    return { kind: "ForStmt", init, cond, post, body };
  }

  private tryParseRange(): Stmt | null {
    // `for k, v := range X {` — coba parse; kembalikan null jika bukan range
    try {
      const keyExpr = this.parseExpr();
      let valueExpr: Expr | null = null;
      if (this.accept(",")) valueExpr = this.parseExpr();
      if (this.check(":=") || this.check("=")) {
        const op = this.next().value;
        if (this.checkKeyword("range")) {
          this.pos++;
          const savedNoComp = this.noComposite;
          this.noComposite = true;
          const rangeExpr = this.parseExpr();
          this.noComposite = savedNoComp;
          const body = this.parseBlock();
          return { kind: "RangeStmt", key: keyExpr, value: valueExpr, op, rangeExpr, body };
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private parseSwitch(): Stmt {
    this.expectKeyword("switch");
    let init: Stmt | null = null;
    let tag: Expr | null = null;

    if (!this.check("{")) {
      const first = this.parseExpr();
      if (this.accept(";")) {
        // init
        if (this.check(":=") || this.check("=")) {
          const op = this.next().value;
          const lhs = [first];
          while (this.accept(",")) lhs.push(this.parseExpr());
          const rhs = [this.parseExpr()];
          while (this.accept(",")) rhs.push(this.parseExpr());
          init = { kind: "AssignStmt", lhs, op, rhs };
        } else {
          init = { kind: "ExprStmt", x: first };
        }
        if (!this.check("{")) {
          const savedNoComp = this.noComposite;
          this.noComposite = true;
          tag = this.parseExpr();
          this.noComposite = savedNoComp;
        }
      } else {
        const savedNoComp = this.noComposite;
        this.noComposite = true;
        tag = first;
        this.noComposite = savedNoComp;
      }
    }

    this.expect("{");
    const clauses: Array<{ exprs: Expr[]; isDefault: boolean; body: Block }> = [];
    this.skipSemis();
    while (!this.check("}")) {
      if (this.cur().type === "eof") throw new GoParseError("syntax error: switch tidak ditutup '}'", this.cur().line);
      let exprs: Expr[] = [];
      let isDefault = false;
      if (this.checkKeyword("case")) {
        this.pos++;
        exprs.push(this.parseExpr());
        while (this.accept(",")) exprs.push(this.parseExpr());
      } else if (this.checkKeyword("default")) {
        this.pos++;
        isDefault = true;
      } else {
        throw new GoParseError(`syntax error: unexpected '${this.cur().value}' dalam switch (harus case/default)`, this.cur().line);
      }
      this.expect(":");
      const stmts: Stmt[] = [];
      this.skipSemis();
      while (!this.checkKeyword("case") && !this.checkKeyword("default") && !this.check("}")) {
        if (this.cur().type === "eof") throw new GoParseError("syntax error: switch tidak ditutup '}'", this.cur().line);
        stmts.push(this.parseStmt());
        this.skipSemis();
      }
      clauses.push({ exprs, isDefault, body: { stmts } });
    }
    this.expect("}");
    return { kind: "SwitchStmt", init, tag, clauses };
  }

  // ---------------- EXPRESSIONS ----------------

  private parseExpr(): Expr {
    return this.parseBinary(1);
  }

  private parseBinary(minPrec: number): Expr {
    let left = this.parseUnary();
    for (;;) {
      const t = this.cur();
      const prec = (t.type === "op" && BINARY_PREC[t.value]) || 0;
      if (prec < minPrec || prec === 0) return left;
      this.pos++;
      const right = this.parseBinary(prec + 1);
      left = { kind: "BinaryExpr", op: t.value, l: left, r: right };
    }
  }

  private parseUnary(): Expr {
    const t = this.cur();
    if (t.type === "op" && ["-", "!", "*", "&"].includes(t.value)) {
      this.pos++;
      return { kind: "UnaryExpr", op: t.value, x: this.parseUnary() };
    }
    if (t.type === "op" && t.value === "+") {
      this.pos++;
      return this.parseUnary();
    }
    if (t.type === "op" && t.value === "<-") {
      // receive dari channel: <-ch
      this.pos++;
      return { kind: "UnaryExpr", op: "<-", x: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    let x = this.parseOperand();

    for (;;) {
      if (this.check(".")) {
        this.pos++;
        const sel = this.expectIdent();
        x = { kind: "SelectorExpr", x, sel };
      } else if (this.check("(")) {
        // make(T, ...) / new(T) — argumen pertama adalah TYPE
        if (x.kind === "Ident" && (x.name === "make" || x.name === "new")) {
          this.pos++;
          const typeArg = this.parseType();
          const args: Array<Expr | TypeArg> = [{ kind: "TypeArg", type: typeArg }];
          while (this.accept(",")) args.push(this.parseExpr());
          this.expect(")");
          x = { kind: "CallExpr", fn: x, args, ellipsis: false };
        } else {
          this.pos++;
          const args: Array<Expr | TypeArg> = [];
          let ellipsis = false;
          while (!this.check(")")) {
            args.push(this.parseExpr());
            if (this.check("...")) {
              this.pos++;
              ellipsis = true;
            }
            if (!this.accept(",")) break;
          }
          this.expect(")");
          x = { kind: "CallExpr", fn: x, args, ellipsis };
        }
      } else if (this.check("[")) {
        this.pos++;
        if (this.check(":")) {
          this.pos++;
          let high: Expr | null = null;
          if (!this.check("]")) high = this.parseExpr();
          this.expect("]");
          x = { kind: "SliceExpr", x, low: null, high };
        } else {
          const first = this.parseExpr();
          if (this.check(":")) {
            this.pos++;
            let high: Expr | null = null;
            if (!this.check("]")) high = this.parseExpr();
            this.expect("]");
            x = { kind: "SliceExpr", x, low: first, high };
          } else {
            this.expect("]");
            x = { kind: "IndexExpr", x, index: first };
          }
        }
      } else if (
        this.check("{") &&
        !this.noComposite &&
        (x.kind === "Ident" || x.kind === "SelectorExpr")
      ) {
        // Composite literal: Hero{...}, pkg.Type{...}
        const savePos = this.pos;
        try {
          const type: TypeExpr =
            x.kind === "Ident"
              ? { kind: "IdentType", name: x.name }
              : { kind: "SelectorType", pkg: (x as { x: { name: string } }).x.name, name: x.sel };
          const lit = this.parseCompositeBody(type);
          x = lit;
        } catch {
          this.pos = savePos;
          return x;
        }
      } else {
        return x;
      }
    }
  }

  private parseOperand(): Expr {
    const t = this.cur();

    switch (t.type) {
      case "int":
      case "float":
        this.pos++;
        return { kind: "BasicLit", litType: t.type, value: t.value };
      case "string":
        this.pos++;
        return { kind: "BasicLit", litType: "string", value: t.value };
      case "char":
        this.pos++;
        return { kind: "BasicLit", litType: "char", value: t.value };
      case "ident": {
        // predeclared identifiers
        if (t.value === "true" || t.value === "false") {
          this.pos++;
          return { kind: "BasicLit", litType: "bool", value: t.value };
        }
        if (t.value === "nil") {
          this.pos++;
          return { kind: "BasicLit", litType: "nil", value: "nil" };
        }
        this.pos++;
        return { kind: "Ident", name: t.value };
      }
      case "op":
        if (t.value === "(") {
          this.pos++;
          const e = this.parseExpr();
          this.expect(")");
          return { kind: "ParenExpr", x: e };
        }
        if (t.value === "[") {
          // array/slice literal atau composite
          return this.parseCompositeOrConversion();
        }
        break;
      case "keyword":
        if (t.value === "func") {
          this.pos++;
          const type = this.parseFuncType();
          const body = this.parseBlock();
          return { kind: "FuncLit", type, body };
        }
        if (t.value === "map" || t.value === "chan" || t.value === "struct" || t.value === "interface") {
          return this.parseCompositeOrConversion();
        }
        break;
    }

    const got = t.type === "eof" ? "akhir file" : `'${t.value}'`;
    throw new GoParseError(`syntax error: unexpected ${got} dalam ekspresi`, t.line);
  }

  /** Parse isi composite literal `{...}` — dipakai parseCompositeOrConversion & postfix T{...} */
  private parseCompositeBody(type: TypeExpr): Expr {
    this.expect("{");
    const elts: Array<{ key: Expr | null; value: Expr }> = [];
    const elemHint = type.kind === "ArrayType" ? type.elem : null;
    const valueHint = type.kind === "MapType" ? type.value : null;
    this.skipSemis();
    while (!this.check("}")) {
      if (this.cur().type === "eof") throw new GoParseError("syntax error: composite literal tidak ditutup '}'", this.cur().line);
      // elemen elided: {Name: "x"} di dalam []Item{{...}}
      if (this.check("{") && elemHint) {
        const elided = this.parseCompositeBody(elemHint);
        elts.push({ key: null, value: elided });
        if (!this.accept(",") && !this.accept(";")) break;
        this.skipSemis();
        continue;
      }
      let key: Expr | null = null;
      const first = this.parseExpr();
      if (this.accept(":")) {
        key = first;
      }
      // value elided: map[string]Hero{"aria": {Name: "Aria"}}
      if (key !== null && this.check("{") && valueHint) {
        const elided = this.parseCompositeBody(valueHint);
        elts.push({ key, value: elided });
        if (!this.accept(",") && !this.accept(";")) break;
        this.skipSemis();
        continue;
      }
      const value = key !== null ? this.parseExpr() : first;
      elts.push({ key, value });
      if (!this.accept(",") && !this.accept(";")) break;
      this.skipSemis();
    }
    this.expect("}");
    return { kind: "CompositeLit", type, elts };
  }

  private parseCompositeOrConversion(): Expr {
    // bentuk: []T{...}, [N]T{...}, map[K]V{...}, T{...} (struct), T(expr) (conversion)
    const save = this.pos;
    let type: TypeExpr;
    try {
      type = this.parseType();
    } catch {
      this.pos = save;
      throw new GoParseError("syntax error: tidak dapat memparse tipe", this.cur().line);
    }

    if (this.check("{")) {
      return this.parseCompositeBody(type);
    }

    if (this.check("(")) {
      // type conversion: int(x), float64(x), string(x)
      this.pos++;
      const arg = this.parseExpr();
      this.expect(")");
      return { kind: "CallExpr", fn: { kind: "Ident", name: `__conv__${typeKindName(type)}` }, args: [arg], ellipsis: false };
    }

    this.pos = save;
    const t = this.cur();
    throw new GoParseError(`syntax error: unexpected '${t.value}' setelah tipe (harus '{' atau '(')`, t.line);
  }
}

function typeKindName(t: TypeExpr): string {
  if (t.kind === "IdentType") return t.name;
  if (t.kind === "SelectorType") return `${t.pkg}.${t.name}`;
  return "unknown";
}

export function typeNameOf(t: TypeExpr): string {
  switch (t.kind) {
    case "IdentType": return t.name;
    case "SelectorType": return `${t.pkg}.${t.name}`;
    case "PointerType": return `*${typeNameOf(t.elem)}`;
    case "ArrayType": return t.len ? `[array]${typeNameOf(t.elem)}` : `[]${typeNameOf(t.elem)}`;
    case "MapType": return `map[${typeNameOf(t.key)}]${typeNameOf(t.value)}`;
    default: return "?";
  }
}

export function parseGo(source: string): Program {
  return new Parser(source).parseProgram();
}
