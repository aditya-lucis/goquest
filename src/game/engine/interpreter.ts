// ============================================================
// GoQuest Go Engine — INTERPRETER (tree-walking evaluator)
// Mendukung subset Go untuk kurikulum GoQuest:
// fmt/errors/strings/strconv, var/const, if/for/switch/range,
// func (multi-return, named return, defer, closure), array/slice/map,
// struct & method (value & pointer receiver), interface, pointer,
// channel (simulasi deterministik), go (eksekusi sekuensial).
// ============================================================

import {
  parseGo,
  typeNameOf,
  type Block,
  type Expr,
  type FuncDecl,
  type FuncType,
  type Program,
  type Stmt,
  type TypeExpr,
} from "./parser";
import { GoSyntaxError } from "./tokenizer";

// ---------------- ERRORS ----------------

export class GoRuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoRuntimeError";
  }
}

export class GoTimeoutError extends Error {
  constructor() {
    super(
      "program berjalan terlalu lama — kemungkinan infinite loop. Periksa kondisi berhenti loop-mu!",
    );
    this.name = "GoTimeoutError";
  }
}

class BreakSignal {}
class ContinueSignal {}
class ReturnSignal {
  values: RTValue[];
  constructor(values: RTValue[]) {
    this.values = values;
  }
}
class PanicSignal {
  message: string;
  constructor(message: string) {
    this.message = message;
  }
}

// ---------------- RUNTIME VALUES ----------------

export interface RTValue {
  kind: "int" | "float" | "string" | "bool" | "nil" | "array" | "slice" | "map" | "struct" | "func" | "ptr" | "error" | "chan" | "native" | "tuple" | "typearg";
  v?: unknown;
  [key: string]: unknown;
}

const VInt = (n: number): RTValue => ({ kind: "int", v: Math.trunc(n) });
const VFloat = (n: number): RTValue => ({ kind: "float", v: n });
const VStr = (s: string): RTValue => ({ kind: "string", v: s });
const VBool = (b: boolean): RTValue => ({ kind: "bool", v: b });
const VNil: RTValue = { kind: "nil" };
const VTuple = (vals: RTValue[]): RTValue => ({ kind: "tuple", v: vals });

interface RTSlice extends RTValue {
  kind: "slice";
  elemType: string;
  elems: RTValue[];
}
interface RTArray extends RTValue {
  kind: "array";
  elemType: string;
  length: number;
  elems: RTValue[];
}
interface RTMap extends RTValue {
  kind: "map";
  keyType: string;
  valType: string;
  entries: Map<string | number, RTValue>;
  keyOrder: (string | number)[];
}
interface RTStruct extends RTValue {
  kind: "struct";
  typeName: string;
  fields: Map<string, RTValue>;
  fieldOrder: string[];
}
interface RTPtr extends RTValue {
  kind: "ptr";
  typeName: string;
  cell: { get(): RTValue; set(v: RTValue): void };
}
interface RTFunc extends RTValue {
  kind: "func";
  decl: FuncDecl | { funcLit: true; type: FuncType; body: Block };
  closure: Env;
  boundReceiver?: RTValue;
  boundTypeName?: string;
  isLit: boolean;
}
interface RTError extends RTValue {
  kind: "error";
  msg: string;
}
interface RTChan extends RTValue {
  kind: "chan";
  elemType: string;
  buf: RTValue[];
  /** kapasitas buffer (dari make(chan T, n)); 0 = unbuffered (disimulasikan cap 1) */
  capacity?: number;
}
interface RTNative extends RTValue {
  kind: "native";
  name: string;
  call: (args: RTValue[]) => RTValue;
}

// ---------------- ENVIRONMENT ----------------

interface Cell {
  value: RTValue;
  declaredType?: string; // nama tipe statis (untuk checking ringan)
}

class Env {
  vars = new Map<string, Cell>();
  constructor(public parent: Env | null = null) {}

  lookup(name: string): Cell | null {
    const c = this.vars.get(name);
    if (c) return c;
    return this.parent ? this.parent.lookup(name) : null;
  }

  define(name: string, value: RTValue, declaredType?: string) {
    this.vars.set(name, { value, declaredType });
  }
}

// ---------------- FORMATTER ----------------

function utf8Len(s: string): number {
  return new TextEncoder().encode(s).length;
}

function formatValue(x: RTValue): string {
  switch (x.kind) {
    case "int":
      return String(Math.trunc(x.v as number));
    case "float": {
      const n = x.v as number;
      if (Number.isInteger(n)) return String(n); // Go %v: 97.0 → "97"
      return String(n);
    }
    case "string":
      return x.v as string;
    case "bool":
      return String(x.v);
    case "nil":
      return "<nil>";
    case "slice":
    case "array": {
      const elems = (x as RTSlice | RTArray).elems;
      return "[" + elems.map(formatValue).join(" ") + "]";
    }
    case "map": {
      const m = x as RTMap;
      const keys = [...m.keyOrder].sort((a, b) => String(a).localeCompare(String(b)));
      return "map[" + keys.map((k) => `${formatKey(k)}:${formatValue(m.entries.get(k)!)}`).join(" ") + "]";
    }
    case "struct": {
      const s = x as RTStruct;
      return "{" + s.fieldOrder.map((f) => formatValue(s.fields.get(f)!)).join(" ") + "}";
    }
    case "ptr": {
      const p = x as RTPtr;
      const inner = p.cell.get();
      if (inner.kind === "struct") return "&" + formatValue(inner);
      if (inner.kind === "nil") return "<nil>";
      return "0xc0000" + Math.abs(hashStr(p.typeName)).toString(16).padStart(8, "0").slice(0, 8);
    }
    case "error":
      return (x as RTError).msg;
    case "func":
    case "native":
      return "func";
    case "chan":
      return "chan";
    case "tuple":
      return ((x.v as RTValue[]) ?? []).map(formatValue).join(" ");
    default:
      return String(x.v ?? "");
  }
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function formatKey(k: string | number): string {
  return typeof k === "number" ? String(k) : k;
}

function typeOfValue(x: RTValue): string {
  switch (x.kind) {
    case "int": return "int";
    case "float": return "float64";
    case "string": return "string";
    case "bool": return "bool";
    case "slice": return `[]${(x as RTSlice).elemType}`;
    case "array": return `[${(x as RTArray).length}]${(x as RTArray).elemType}`;
    case "map": { const m = x as RTMap; return `map[${m.keyType}]${m.valType}`; }
    case "struct": return (x as RTStruct).typeName;
    case "ptr": return `*${(x as RTPtr).typeName}`;
    case "error": return "error";
    case "chan": return `chan ${(x as RTChan).elemType}`;
    case "func":
    case "native": return "func";
    case "nil": return "nil";
    case "tuple": return "(tuple)";
    default: return "unknown";
  }
}

// printf %T menggunakan typeOfValue; %q mengutip string
function quoteString(s: string): string {
  return JSON.stringify(s);
}

// ---------------- INTERPRETER ----------------

const STEP_LIMIT = 400_000;
const OUTPUT_LIMIT = 16_000;

export interface RunResult {
  ok: boolean;
  output: string;
  error?: { message: string; line?: number };
  errorKind?: "syntax" | "compile" | "runtime" | "timeout" | "panic";
}

export class Interpreter {
  private out: string[] = [];
  private steps = 0;
  private globals = new Env();
  private types = new Map<string, TypeExpr>();
  private methods = new Map<string, Map<string, FuncDecl>>();
  private imports = new Set<string>();
  private deferStack: Array<() => void>[] = [];

  run(source: string): RunResult {
    try {
      const program = parseGo(source);
      this.checkImports(program);
      this.loadDeclarations(program);
      const mainFunc = this.globals.vars.get("main");
      if (!mainFunc || mainFunc.value.kind !== "func") {
        return this.errResult("compile error: func main belum dideklarasikan di package main", "compile");
      }
      this.callFunction(mainFunc.value as RTFunc, [], "main");
      return { ok: true, output: this.out.join("") };
    } catch (e) {
      return this.toErrorResult(e);
    }
  }

  private toErrorResult(e: unknown): RunResult {
    const output = this.out.join("");
    if (e instanceof ReturnSignal) {
      return this.errResult("compile error: return di luar fungsi", "compile", output);
    }
    if (e instanceof BreakSignal) {
      return this.errResult("compile error: break di luar loop", "compile", output);
    }
    if (e instanceof ContinueSignal) {
      return this.errResult("compile error: continue di luar loop", "compile", output);
    }
    if (e instanceof PanicSignal) {
      return this.errResult("panic: " + e.message, "panic", output);
    }
    if (e instanceof GoTimeoutError) {
      return { ok: false, output, error: { message: e.message }, errorKind: "timeout" };
    }
    if (e instanceof GoRuntimeError) {
      return this.errResult(e.message, "runtime", output);
    }
    if (e instanceof GoSyntaxError) {
      return this.errResult(`syntax error: ${e.message}${e.line ? ` (baris ${e.line})` : ""}`, "syntax", output);
    }
    if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "GoParseError") {
      const pe = e as unknown as { message: string; line?: number };
      return this.errResult(pe.message, "syntax", output);
    }
    return this.errResult(String((e as Error)?.message ?? e), "runtime", output);
  }

  private errResult(message: string, kind: NonNullable<RunResult["errorKind"]>, output = ""): RunResult {
    return { ok: false, output, error: { message }, errorKind: kind };
  }

  private checkImports(program: Program) {
    const allowed = ["fmt", "errors", "strings", "strconv", "os"];
    for (const imp of program.imports) {
      if (!allowed.includes(imp)) {
        throw new GoRuntimeError(
          `compile error: package "${imp}" tidak tersedia di GoQuest Playground (tersedia: ${allowed.map((a) => `"${a}"`).join(", ")})`,
        );
      }
      this.imports.add(imp);
    }
  }

  private loadDeclarations(program: Program) {
    for (const t of program.types) this.types.set(t.name, t.type);
    for (const f of program.funcs) {
      if (!f.receiver) {
        this.globals.define(f.name!, { kind: "func", decl: f, closure: this.globals, isLit: false } as RTFunc);
      } else {
        const tname = typeNameOf(f.receiver.type).replace(/^\*/, "");
        if (!this.methods.has(tname)) this.methods.set(tname, new Map());
        this.methods.get(tname)!.set(f.name!, f);
      }
    }
    // package-level var/const — dieksekusi langsung di globals
    for (const d of program.varDecls) this.execStmt(d, this.globals);
  }

  // ---------------- STATEMENTS ----------------

  private tick() {
    if (++this.steps > STEP_LIMIT) throw new GoTimeoutError();
  }

  private execBlock(block: Block, env: Env) {
    for (const s of block.stmts) this.execStmt(s, env);
  }

  private execStmt(stmt: Stmt, env: Env) {
    this.tick();
    switch (stmt.kind) {
      case "EmptyStmt":
        return;
      case "ExprStmt":
        this.evalExpr(stmt.x, env);
        return;
      case "BlockStmt":
        this.execBlock(stmt.block, new Env(env));
        return;
      case "TypeDeclStmt":
        this.types.set(stmt.decl.name, stmt.decl.type);
        return;
      case "VarDecl":
        this.execVarDecl(stmt.names, stmt.type, stmt.values, env);
        return;
      case "ConstDecl":
        this.execVarDecl(stmt.names, stmt.type, stmt.values, env);
        return;
      case "AssignStmt":
        this.execAssign(stmt, env);
        return;
      case "IncDecStmt": {
        const cell = this.resolveLValue(stmt.x, env);
        const cur = cell.get();
        this.requireNumber(cur);
        const delta = stmt.op === "++" ? 1 : -1;
        cell.set(cur.kind === "int" ? VInt((cur.v as number) + delta) : VFloat((cur.v as number) + delta));
        return;
      }
      case "IfStmt": {
        const ifEnv = new Env(env);
        if (stmt.init) this.execStmt(stmt.init, ifEnv);
        const cond = this.evalExpr(stmt.cond, ifEnv);
        this.requireBool(cond, "kondisi if");
        if (cond.v) this.execBlock(stmt.then, new Env(ifEnv));
        else if (stmt.else) this.execStmt(stmt.else, new Env(ifEnv));
        return;
      }
      case "ForStmt": {
        const forEnv = new Env(env);
        if (stmt.init) this.execStmt(stmt.init, forEnv);
        for (;;) {
          this.tick();
          if (stmt.cond) {
            const c = this.evalExpr(stmt.cond, forEnv);
            this.requireBool(c, "kondisi for");
            if (!c.v) break;
          }
          try {
            this.execBlock(stmt.body, new Env(forEnv));
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) {
              /* lanjut ke post */
            } else throw e;
          }
          if (stmt.post) this.execStmt(stmt.post, forEnv);
        }
        return;
      }
      case "RangeStmt":
        this.execRange(stmt, env);
        return;
      case "SwitchStmt":
        this.execSwitch(stmt, env);
        return;
      case "ReturnStmt":
        throw this.makeReturn(stmt, env);
      case "BranchStmt":
        if (stmt.tok === "break") throw new BreakSignal();
        throw new ContinueSignal();
      case "GoStmt": {
        // Simulasi deterministik: eksekusi segera (sekuensial)
        this.evalExpr(stmt.call, env);
        return;
      }
      case "SendStmt": {
        // ch <- value (kirim ke channel)
        const chVal = this.evalExpr(stmt.ch, env);
        if (chVal.kind !== "chan") {
          throw new GoRuntimeError(`compile error: cannot send to ${typeOfValue(chVal)} — butuh channel`);
        }
        const ch = chVal as RTChan;
        const v = this.evalExpr(stmt.value, env);
        const cap = Math.max(ch.capacity ?? 0, 1); // unbuffered disimulasikan cap 1
        if (ch.buf.length >= cap) {
          throw new GoRuntimeError(
            "fatal error: channel penuh (buffer penuh) — tidak ada penerima yang mengosongkannya",
          );
        }
        ch.buf.push(v);
        return;
      }
      case "DeferStmt": {
        const fn = stmt.call;
        this.deferStack[this.deferStack.length - 1]?.push(() => {
          if (fn.kind === "CallExpr") {
            // evaluasi argumen SEKARANG (semantik defer Go), eksekusi nanti
            const args = fn.args.map((a) => this.evalExpr(a as Expr, env));
            const callee = this.evalExpr(fn.fn, env);
            this.invokeCallable(callee, args, "deferred");
          }
        });
        return;
      }
    }
  }

  private makeReturn(stmt: { values: Expr[] }, env: Env): ReturnSignal {
    if (stmt.values.length === 0) return new ReturnSignal([]);
    const vals = stmt.values.map((v) => this.evalExpr(v, env));
    if (vals.length === 1 && vals[0].kind === "tuple") {
      return new ReturnSignal([...(vals[0].v as RTValue[])]);
    }
    return new ReturnSignal(vals);
  }

  private execVarDecl(names: string[], type: TypeExpr | null, values: Expr[], env: Env) {
    if (values.length === 0) {
      // zero values
      const tz = type ? this.typeName(type) : null;
      for (const n of names) {
        if (n === "_") continue;
        env.define(n, this.zeroValue(type), tz ?? undefined);
      }
      return;
    }
    let vals: RTValue[];
    if (values.length === 1 && values[0].kind === "CallExpr") {
      const callResult = this.evalExpr(values[0], env);
      vals = callResult.kind === "tuple" ? [...(callResult.v as RTValue[])] : [callResult];
    } else if (values.length === 1 && values[0].kind === "IndexExpr") {
      // v, ok := m[k] — tanpa ok di var decl; cukup value
      vals = [this.evalExpr(values[0], env)];
    } else {
      vals = values.map((v) => this.evalExpr(v, env));
    }
    const tz = type ? this.typeName(type) : null;
    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      if (n === "_") continue;
      let val = vals[i] ?? VNil;
      if (tz) val = this.coerceAssign(val, tz, `variable ${n}`);
      if (!tz && val.kind === "func" && !(val as RTFunc).isLit) {
        // named function value
      }
      env.define(n, this.copyIfStruct(val), tz ?? (val.kind === "nil" ? undefined : typeOfValue(val)));
    }
  }

  private execAssign(stmt: Extract<Stmt, { kind: "AssignStmt" }>, env: Env) {
    // Evaluasi semua RHS dulu (semantik paralel)
    let rhsVals: RTValue[];
    if (stmt.rhs.length === 1 && stmt.rhs[0].kind === "CallExpr") {
      const r = this.evalExpr(stmt.rhs[0], env);
      rhsVals = r.kind === "tuple" ? [...(r.v as RTValue[])] : [r];
    } else if (
      stmt.rhs.length === 1 &&
      stmt.rhs[0].kind === "IndexExpr" &&
      stmt.lhs.length === 2 &&
      (stmt.op === ":=" || stmt.op === "=")
    ) {
      // v, ok := m[key] — atau v, ok = m[key]
      this.execMapOkAssign(stmt, env);
      return;
    } else {
      rhsVals = stmt.rhs.map((r) => this.evalExpr(r, env));
    }

    if (stmt.op === ":=") {
      const hasNew = stmt.lhs.some(
        (l) => l.kind === "Ident" && l.name !== "_" && !env.lookup(l.name),
      );
      if (!hasNew) {
        throw new GoRuntimeError("compile error: no new variables on left side of :=");
      }
      stmt.lhs.forEach((l, i) => {
        if (l.kind !== "Ident") throw new GoRuntimeError("compile error: operand kiri := harus identifier");
        if (l.name === "_") return;
        const cell = env.lookup(l.name);
        const val = this.copyIfStruct(rhsVals[i] ?? VNil);
        if (cell && cell.declaredType) {
          cell.value = this.coerceAssign(val, cell.declaredType, l.name);
        } else if (cell) {
          cell.value = val;
        } else {
          env.define(l.name, val, val.kind === "nil" ? undefined : typeOfValue(val));
        }
      });
      return;
    }

    // '=' dan compound assignment
    stmt.lhs.forEach((l, i) => {
      const cell = this.resolveLValue(l, env);
      let val = this.copyIfStruct(rhsVals[i] ?? VNil);
      if (stmt.op !== "=") {
        const op = stmt.op.slice(0, -1); // += → +
        const cur = cell.get();
        val = this.binaryOp(op, cur, val, "assignment");
      }
      const meta = this.lvalueDeclaredType(l, env);
      if (meta) val = this.coerceAssign(val, meta, "assignment");
      cell.set(val);
    });
  }

  private execMapOkAssign(stmt: Extract<Stmt, { kind: "AssignStmt" }>, env: Env) {
    const idx = stmt.rhs[0] as Extract<Expr, { kind: "IndexExpr" }>;
    const mapVal = this.evalExpr(idx.x, env);
    if (mapVal.kind !== "map") throw new GoRuntimeError("compile error: ,ok idiom hanya untuk map");
    const key = this.evalExpr(idx.index, env);
    const mapKey = this.mapKeyOf(key);
    const m = mapVal as RTMap;
    const exists = m.entries.has(mapKey);
    const val = exists ? m.entries.get(mapKey)! : this.zeroValue({ kind: "IdentType", name: m.valType });
    const lhs0 = stmt.lhs[0];
    const lhs1 = stmt.lhs[1];
    if (lhs0.kind !== "Ident") throw new GoRuntimeError("compile error: operand kiri := harus identifier");
    if (stmt.op === ":=") {
      env.define(lhs0.name, this.copyIfStruct(val), typeOfValue(val));
      if (lhs1 && lhs1.kind === "Ident" && lhs1.name !== "_") env.define(lhs1.name, VBool(exists));
    } else {
      const c0 = env.lookup(lhs0.name);
      if (c0) c0.value = this.copyIfStruct(val);
      if (lhs1 && lhs1.kind === "Ident") {
        const c1 = env.lookup(lhs1.name);
        if (c1) c1.value = VBool(exists);
      }
    }
  }

  private lvalueDeclaredType(l: Expr, env: Env): string | null {
    if (l.kind === "Ident") {
      const cell = env.lookup(l.name);
      return cell?.declaredType ?? null;
    }
    return null;
  }

  private execRange(stmt: Extract<Stmt, { kind: "RangeStmt" }>, env: Env) {
    const coll = this.evalExpr(stmt.rangeExpr, env);
    const defineLoopVars = () => {
      const loopEnv = new Env(env);
      return loopEnv;
    };

    const assignTarget = (target: Expr | null, value: RTValue, loopEnv: Env) => {
      if (!target || (target.kind === "Ident" && target.name === "_")) return;
      if (target.kind !== "Ident") throw new GoRuntimeError("compile error: variabel range harus identifier");
      if (stmt.op === ":=" || !env.lookup(target.name)) {
        loopEnv.vars.set(target.name, { value: this.copyIfStruct(value) });
      } else {
        const cell = env.lookup(target.name)!;
        cell.value = this.copyIfStruct(value);
      }
    };

    if (coll.kind === "slice" || coll.kind === "array") {
      const elems = (coll as RTSlice | RTArray).elems;
      for (let i = 0; i < elems.length; i++) {
        this.tick();
        const loopEnv = defineLoopVars();
        assignTarget(stmt.key, VInt(i), loopEnv);
        assignTarget(stmt.value, this.copyIfStruct(elems[i]), loopEnv);
        try {
          this.execBlock(stmt.body, loopEnv);
        } catch (e) {
          if (e instanceof BreakSignal) break;
          if (e instanceof ContinueSignal) continue;
          throw e;
        }
      }
    } else if (coll.kind === "map") {
      const m = coll as RTMap;
      for (const k of [...m.keyOrder]) {
        this.tick();
        const loopEnv = defineLoopVars();
        const keyVal = typeof k === "number" ? VInt(k) : VStr(k);
        assignTarget(stmt.key, keyVal, loopEnv);
        assignTarget(stmt.value, this.copyIfStruct(m.entries.get(k)!), loopEnv);
        try {
          this.execBlock(stmt.body, loopEnv);
        } catch (e) {
          if (e instanceof BreakSignal) break;
          if (e instanceof ContinueSignal) continue;
          throw e;
        }
      }
    } else if (coll.kind === "string") {
      const s = coll.v as string;
      for (let i = 0; i < s.length; i++) {
        this.tick();
        const loopEnv = defineLoopVars();
        assignTarget(stmt.key, VInt(i), loopEnv);
        assignTarget(stmt.value, VStr(s[i]), loopEnv);
        try {
          this.execBlock(stmt.body, loopEnv);
        } catch (e) {
          if (e instanceof BreakSignal) break;
          if (e instanceof ContinueSignal) continue;
          throw e;
        }
      }
    } else if (coll.kind === "chan") {
      const ch = coll as RTChan;
      while (ch.buf.length > 0) {
        this.tick();
        const loopEnv = defineLoopVars();
        assignTarget(stmt.value ?? stmt.key, ch.buf.shift()!, loopEnv);
        try {
          this.execBlock(stmt.body, loopEnv);
        } catch (e) {
          if (e instanceof BreakSignal) break;
          if (e instanceof ContinueSignal) continue;
          throw e;
        }
      }
    } else {
      throw new GoRuntimeError(`compile error: cannot range over ${typeOfValue(coll)}`);
    }
  }

  private execSwitch(stmt: Extract<Stmt, { kind: "SwitchStmt" }>, env: Env) {
    const swEnv = new Env(env);
    if (stmt.init) this.execStmt(stmt.init, swEnv);
    const tag = stmt.tag ? this.evalExpr(stmt.tag, swEnv) : null;

    for (const clause of stmt.clauses) {
      if (clause.isDefault) continue;
      let matched = false;
      for (const ce of clause.exprs) {
        const cv = this.evalExpr(ce, swEnv);
        if (tag ? this.valuesEqual(tag, cv) : this.truthy(cv)) {
          matched = true;
          break;
        }
      }
      if (matched) {
        this.execBlock(clause.body, new Env(swEnv));
        return;
      }
    }

    const def = stmt.clauses.find((c) => c.isDefault);
    if (def) this.execBlock(def.body, new Env(swEnv));
  }

  // ---------------- EXPRESSIONS ----------------

  private evalExpr(expr: Expr, env: Env): RTValue {
    this.tick();
    switch (expr.kind) {
      case "Ident": {
        if (expr.name === "_") throw new GoRuntimeError("compile error: cannot use _ as value");
        const cell = env.lookup(expr.name);
        if (cell) return cell.value;
        // builtin (len, append, make, ...)?
        const builtin = this.getBuiltin(expr.name);
        if (builtin) return builtin;
        throw new GoRuntimeError(`undefined: ${expr.name}`);
      }
      case "BasicLit": {
        switch (expr.litType) {
          case "int": return VInt(parseInt(expr.value, 10));
          case "float": return VFloat(parseFloat(expr.value));
          case "string": return VStr(expr.value);
          case "char": return VInt(parseInt(expr.value, 10));
          case "bool": return VBool(expr.value === "true");
          case "nil": return VNil;
        }
        return VNil;
      }
      case "ParenExpr":
        return this.evalExpr(expr.x, env);
      case "UnaryExpr":
        return this.evalUnary(expr, env);
      case "BinaryExpr":
        return this.evalBinary(expr, env);
      case "CallExpr":
        return this.evalCall(expr, env);
      case "SelectorExpr":
        return this.evalSelector(expr, env);
      case "IndexExpr":
        return this.evalIndex(expr, env);
      case "SliceExpr":
        return this.evalSlice(expr, env);
      case "CompositeLit":
        return this.evalComposite(expr, env);
      case "FuncLit":
        return { kind: "func", decl: { funcLit: true, type: expr.type, body: expr.body }, closure: env, isLit: true } as RTFunc;
    }
  }

  private evalUnary(expr: Extract<Expr, { kind: "UnaryExpr" }>, env: Env): RTValue {
    // & — address of
    if (expr.op === "&") {
      const cell = this.resolveLValue(expr.x, env);
      const base = cell.get();
      return {
        kind: "ptr",
        typeName: base.kind === "struct" ? (base as RTStruct).typeName : typeOfValue(base),
        cell,
      } as RTPtr;
    }
    if (expr.op === "<-") {
      const chVal = this.evalExpr(expr.x, env);
      if (chVal.kind !== "chan") throw new GoRuntimeError("compile error: <- hanya untuk channel");
      const ch = chVal as RTChan;
      if (ch.buf.length === 0) {
        throw new GoRuntimeError("fatal error: semua goroutine tertidur! deadlock — channel kosong dan tak ada pengirim (dalam mode simulasi, kirimlah sebelum menerima)");
      }
      return ch.buf.shift()!;
    }
    const x = this.evalExpr(expr.x, env);
    switch (expr.op) {
      case "-":
        this.requireNumber(x);
        return x.kind === "int" ? VInt(-(x.v as number)) : VFloat(-(x.v as number));
      case "!":
        this.requireBool(x, "operand !");
        return VBool(!x.v);
      case "*": {
        if (x.kind !== "ptr") throw new GoRuntimeError(`invalid operation: cannot indirect ${typeOfValue(x)}`);
        const inner = (x as RTPtr).cell.get();
        if (inner.kind === "nil") throw new GoRuntimeError("panic: runtime error: invalid memory address or nil pointer dereference");
        return inner;
      }
    }
    throw new GoRuntimeError(`operator ${expr.op} tidak didukung`);
  }

  private evalBinary(expr: Extract<Expr, { kind: "BinaryExpr" }>, env: Env): RTValue {
    // short-circuit
    if (expr.op === "&&") {
      const l = this.evalExpr(expr.l, env);
      this.requireBool(l, "operand &&");
      if (!l.v) return VBool(false);
      const r = this.evalExpr(expr.r, env);
      this.requireBool(r, "operand &&");
      return VBool(!!r.v);
    }
    if (expr.op === "||") {
      const l = this.evalExpr(expr.l, env);
      this.requireBool(l, "operand ||");
      if (l.v) return VBool(true);
      const r = this.evalExpr(expr.r, env);
      this.requireBool(r, "operand ||");
      return VBool(!!r.v);
    }
    const l = this.evalExpr(expr.l, env);
    const r = this.evalExpr(expr.r, env);
    return this.binaryOp(expr.op, l, r, "ekspresi");
  }

  private binaryOp(op: string, l: RTValue, r: RTValue, ctx: string): RTValue {
    // perbandingan
    if (["==", "!=", "<", "<=", ">", ">="].includes(op)) {
      const eq = this.valuesEqual(l, r);
      switch (op) {
        case "==": return VBool(eq);
        case "!=": return VBool(!eq);
      }
      this.requireComparable(l, r, ctx);
      const ln = l.v as number, rn = r.v as number;
      switch (op) {
        case "<": return VBool(ln < rn);
        case "<=": return VBool(ln <= rn);
        case ">": return VBool(ln > rn);
        case ">=": return VBool(ln >= rn);
      }
    }

    // string concat
    if (op === "+" && l.kind === "string" && r.kind === "string") {
      return VStr((l.v as string) + (r.v as string));
    }

    this.requireNumber(l, ctx);
    this.requireNumber(r, ctx);

    const bothInt = l.kind === "int" && r.kind === "int";
    const ln = l.v as number, rn = r.v as number;

    const make = (n: number): RTValue => (bothInt ? VInt(n) : VFloat(n));

    switch (op) {
      case "+": return make(ln + rn);
      case "-": return make(ln - rn);
      case "*": return make(ln * rn);
      case "/":
        if (rn === 0) {
          if (bothInt) throw new GoRuntimeError("panic: runtime error: integer divide by zero");
          return VFloat(Infinity);
        }
        return bothInt ? VInt(Math.trunc(ln / rn)) : VFloat(ln / rn);
      case "%":
        if (bothInt) {
          if (rn === 0) throw new GoRuntimeError("panic: runtime error: integer divide by zero");
          return VInt(ln % rn);
        }
        throw new GoRuntimeError(`invalid operation: % hanya untuk integer (${typeOfValue(l)} % ${typeOfValue(r)})`);
    }
    throw new GoRuntimeError(`operator '${op}' tidak didukung playground`);
  }

  private evalCall(expr: Extract<Expr, { kind: "CallExpr" }>, env: Env): RTValue {
    // konversi tipe: int(x), float64(x), string(x)
    if (expr.fn.kind === "Ident" && expr.fn.name.startsWith("__conv__")) {
      const target = expr.fn.name.replace("__conv__", "");
      const arg = this.evalExpr(expr.args[0] as Expr, env);
      return this.convertType(arg, target);
    }

    // METHOD CALL dengan addressability: x.Method(...) — cek sebelum evaluasi biasa
    if (expr.fn.kind === "SelectorExpr") {
      const sel = expr.fn;
      if (sel.x.kind === "Ident") {
        const baseCell = env.lookup(sel.x.name);
        if (baseCell) {
          const base = baseCell.value;
          const method = this.findMethodFor(base, sel.sel, {
            get: () => baseCell.value,
            set: (v) => {
              baseCell.value = v;
            },
          });
          if (method) {
            const args = expr.args.map((a) => this.evalExpr(a as Expr, env));
            return this.invokeCallable(method, args, sel.sel);
          }
        }
      }
    }
    // METHOD CALL pada index/field: arr[i].Method(...)
    if (expr.fn.kind === "SelectorExpr" && expr.fn.x.kind !== "Ident") {
      const sel = expr.fn;
      let baseCell: { get(): RTValue; set(v: RTValue): void } | null = null;
      try {
        baseCell = this.resolveLValue(sel.x, env);
      } catch {
        baseCell = null;
      }
      if (baseCell) {
        const base = baseCell.get();
        const method = this.findMethodFor(base, sel.sel, baseCell);
        if (method) {
          const args = expr.args.map((a) => this.evalExpr(a as Expr, env));
          return this.invokeCallable(method, args, sel.sel);
        }
      }
    }

    const fn = this.evalExpr(expr.fn, env);
    // make/new dengan TypeArg
    if (
      fn.kind === "native" &&
      expr.args.length > 0 &&
      (expr.args[0] as { kind?: string }).kind === "TypeArg"
    ) {
      const targ = expr.args[0] as unknown as { kind: "TypeArg"; type: TypeExpr };
      const extra = expr.args.slice(1).map((a) => this.evalExpr(a as Expr, env));
      return this.invokeCallable(fn, [{ kind: "typearg", t: targ.type } as RTValue, ...extra], "make/new");
    }
    const args = expr.args.map((a) => this.evalExpr(a as Expr, env));
    return this.invokeCallable(fn, args, this.describeCall(expr.fn));
  }

  private describeCall(fn: Expr): string {
    if (fn.kind === "Ident") return fn.name;
    if (fn.kind === "SelectorExpr") return `.${fn.sel}`;
    return "fungsi";
  }

  private invokeCallable(fn: RTValue, args: RTValue[], name: string): RTValue {
    if (fn.kind === "native") {
      return (fn as RTNative).call(args);
    }
    if (fn.kind !== "func") {
      throw new GoRuntimeError(`compile error: ${typeOfValue(fn)} bukan fungsi — tidak bisa dipanggil (${name})`);
    }
    return this.callFunction(fn as RTFunc, args, name);
  }

  private callFunction(fnv: RTFunc, args: RTValue[], name: string): RTValue {
    const decl = fnv.decl as FuncDecl;
    const ftype = (decl as { type: FuncType }).type;

    const callEnv = new Env(fnv.closure ?? this.globals);
    const defers: Array<() => void> = [];
    this.deferStack.push(defers);

    // daftar parameter: receiver (jika method) + params
    const paramList: Array<{ name: string | null; type: TypeExpr }> = [];
    if (fnv.boundReceiver && !fnv.isLit && (decl as FuncDecl).receiver) {
      paramList.push({ name: (decl as FuncDecl).receiver!.name, type: (decl as FuncDecl).receiver!.type });
    }
    for (const p of ftype.params) {
      for (const n of p.names) paramList.push({ name: n, type: p.type });
      if (p.names.length === 0) paramList.push({ name: null, type: p.type });
    }

    // susun argumen: receiver dulu (jika method), lalu args
    const allArgs: RTValue[] = [];
    if (fnv.boundReceiver && !fnv.isLit && (decl as FuncDecl).receiver) {
      allArgs.push(fnv.boundReceiver);
    }
    allArgs.push(...args);

    const expected = paramList.length;
    const actual = allArgs.length;
    if (actual < expected) {
      throw new GoRuntimeError(`compile error: not enough arguments in call to ${name} — butuh ${expected}, diberikan ${actual}`);
    }
    if (actual > expected) {
      throw new GoRuntimeError(`compile error: too many arguments in call to ${name} — butuh ${expected}, diberikan ${actual}`);
    }

    paramList.forEach((p, i) => {
      const argVal = this.copyIfStruct(allArgs[i] ?? VNil);
      if (p.name && p.name !== "_") {
        const tn = this.safeTypeName(p.type);
        callEnv.define(p.name, tn ? this.coerceAssign(argVal, tn, `parameter ${p.name}`) : argVal, tn ?? undefined);
      }
    });

    // named returns
    const namedResults: string[] = [];
    for (const r of ftype.results) {
      if (r.name) {
        namedResults.push(r.name);
        callEnv.define(r.name, this.zeroValue(r.type), this.safeTypeName(r.type) ?? undefined);
      }
    }

    let result: RTValue[];
    try {
      this.execBlock((decl as FuncDecl).body, new Env(callEnv));
      result = namedResults.map((n) => callEnv.lookup(n)!.value);
    } catch (e) {
      if (e instanceof ReturnSignal) {
        result =
          e.values.length > 0
            ? e.values
            : namedResults.map((n) => callEnv.lookup(n)!.value);
      } else {
        throw e;
      }
    } finally {
      // jalankan defer LIFO
      this.deferStack.pop();
      while (defers.length > 0) {
        const d = defers.pop()!;
        d();
      }
    }

    // validasi jumlah return
    const nResults = ftype.results.length;
    if (nResults === 0) return VNil;
    if (nResults === 1) return this.copyIfStruct(result[0] ?? VNil);
    return VTuple(result.map((r) => this.copyIfStruct(r)));
  }

  private evalSelector(expr: Extract<Expr, { kind: "SelectorExpr" }>, env: Env): RTValue {
    // package function: fmt.Println, errors.New, ...
    if (expr.x.kind === "Ident" && !env.lookup(expr.x.name)) {
      const pkg = expr.x.name;
      const KNOWN_PKGS = ["fmt", "errors", "strings", "strconv", "os"];
      const key = `${pkg}.${expr.sel}`;
      const func = this.packageFunctions()[key];
      if (func) {
        if (!this.imports.has(pkg)) {
          throw new GoRuntimeError(`compile error: undefined: ${key} — apakah kamu lupa import "${pkg}"?`);
        }
        return func;
      }
      if (KNOWN_PKGS.includes(pkg)) {
        throw new GoRuntimeError(`compile error: undefined: ${key} (fungsi tidak dikenal di package ${pkg})`);
      }
    }

    const base = this.evalExpr(expr.x, env);

    // method call pada value
    const method = this.findMethod(base, expr.sel);
    if (method) return method;

    // field struct
    if (base.kind === "ptr") {
      const inner = (base as RTPtr).cell.get();
      if (inner.kind === "struct") {
        const s = inner as RTStruct;
        if (!s.fields.has(expr.sel)) {
          throw new GoRuntimeError(`compile error: ${s.typeName}.${expr.sel} undefined (field '${expr.sel}' tidak ada)`);
        }
        return s.fields.get(expr.sel)!;
      }
    }
    if (base.kind === "struct") {
      const s = base as RTStruct;
      if (!s.fields.has(expr.sel)) {
        throw new GoRuntimeError(`compile error: ${s.typeName}.${expr.sel} undefined (field '${expr.sel}' tidak ada)`);
      }
      return s.fields.get(expr.sel)!;
    }
    if (base.kind === "error" && expr.sel === "Error") {
      return { kind: "func", decl: dummyErrorMethod, closure: this.globals, boundReceiver: base, isLit: false } as RTFunc;
    }
    throw new GoRuntimeError(`compile error: ${typeOfValue(base)}.${expr.sel} undefined`);
  }

  /** Cari method dengan dukungan auto-address utk pointer receiver */
  private findMethodFor(
    base: RTValue,
    methodName: string,
    baseCell: { get(): RTValue; set(v: RTValue): void } | null,
  ): RTValue | null {
    let typeName = "";
    let isPtr = false;
    if (base.kind === "struct") {
      typeName = (base as RTStruct).typeName;
    } else if (base.kind === "ptr") {
      typeName = (base as RTPtr).typeName;
      isPtr = true;
    } else if (base.kind === "error") {
      typeName = "errorString";
    } else {
      return null;
    }
    const m = this.methods.get(typeName)?.get(methodName);
    if (!m) return null;
    const receiverIsPtr = m.receiver ? m.receiver.type.kind === "PointerType" : false;

    // pointer receiver + value addressable → auto &x
    if (receiverIsPtr && !isPtr && baseCell && base.kind === "struct") {
      return {
        kind: "func",
        decl: m,
        closure: this.globals,
        boundReceiver: { kind: "ptr", typeName, cell: baseCell } as RTPtr,
        boundTypeName: typeName,
        isLit: false,
      } as RTFunc;
    }

    // value receiver + pointer → auto dereference
    let boundReceiver = base;
    if (!receiverIsPtr && isPtr) {
      const inner = (base as RTPtr).cell.get();
      boundReceiver = inner;
    }
    return {
      kind: "func",
      decl: m,
      closure: this.globals,
      boundReceiver: this.copyIfStruct(boundReceiver),
      boundTypeName: typeName,
      isLit: false,
    } as RTFunc;
  }

  private findMethod(base: RTValue, methodName: string): RTValue | null {
    return this.findMethodFor(base, methodName, null);
  }

  private evalIndex(expr: Extract<Expr, { kind: "IndexExpr" }>, env: Env): RTValue {
    const coll = this.evalExpr(expr.x, env);
    const idx = this.evalExpr(expr.index, env);
    if (coll.kind === "slice" || coll.kind === "array") {
      const arr = coll as RTSlice | RTArray;
      if (idx.kind !== "int") throw new GoRuntimeError("compile error: index harus integer");
      const i = idx.v as number;
      if (i < 0 || i >= arr.elems.length) {
        throw new GoRuntimeError(
          `panic: runtime error: index out of range [${i}] with length ${arr.elems.length}`,
        );
      }
      return arr.elems[i];
    }
    if (coll.kind === "map") {
      const m = coll as RTMap;
      const key = this.mapKeyOf(idx);
      if (!m.entries.has(key)) {
        return this.zeroValue({ kind: "IdentType", name: m.valType });
      }
      return m.entries.get(key)!;
    }
    if (coll.kind === "string") {
      const s = coll.v as string;
      if (idx.kind !== "int") throw new GoRuntimeError("compile error: index string harus integer");
      const i = idx.v as number;
      if (i < 0 || i >= s.length) {
        throw new GoRuntimeError(`panic: runtime error: index out of range [${i}] with length ${utf8Len(s)}`);
      }
      return VInt(s.charCodeAt(i));
    }
    throw new GoRuntimeError(`compile error: tidak bisa meng-index ${typeOfValue(coll)}`);
  }

  private evalSlice(expr: Extract<Expr, { kind: "SliceExpr" }>, env: Env): RTValue {
    const coll = this.evalExpr(expr.x, env);
    if (coll.kind !== "slice" && coll.kind !== "array" && coll.kind !== "string") {
      throw new GoRuntimeError(`compile error: tidak bisa slice ${typeOfValue(coll)}`);
    }
    const low = expr.low ? (this.evalExpr(expr.low, env).v as number) : 0;
    const high = expr.high ? (this.evalExpr(expr.high, env).v as number) : undefined;
    if (coll.kind === "string") {
      const s = coll.v as string;
      return VStr(s.slice(low, high));
    }
    const arr = coll as RTSlice | RTArray;
    const hi = high ?? arr.elems.length;
    if (low < 0 || hi > arr.elems.length || low > hi) {
      throw new GoRuntimeError(`panic: runtime error: slice bounds out of range [${low}:${hi}] with length ${arr.elems.length}`);
    }
    return {
      kind: "slice",
      elemType: arr.elemType,
      elems: arr.elems.slice(low, hi),
    } as RTSlice;
  }

  private evalComposite(expr: Extract<Expr, { kind: "CompositeLit" }>, env: Env): RTValue {
    const t = expr.type;
    if (t.kind === "ArrayType") {
      const elemT = this.typeName(t.elem);
      let length = 0;
      if (t.len) {
        const lv = this.evalExpr(t.len, env);
        length = lv.v as number;
      }
      const elems = expr.elts.map((e) => this.copyIfStruct(this.evalExpr(e.value, env)));
      if (length > 0 && expr.elts.length > 0 && expr.elts[0].key) {
        const filled = new Array(length).fill(this.zeroValue(t.elem));
        expr.elts.forEach((e) => {
          const idx = this.evalExpr(e.key!, env).v as number;
          filled[idx] = this.evalExpr(e.value, env);
        });
        return { kind: "array", elemType: elemT, length, elems: filled } as RTArray;
      }
      if (length > 0) {
        const filled = new Array(length).fill(this.zeroValue(t.elem));
        elems.forEach((e, i) => (filled[i] = e));
        return { kind: "array", elemType: elemT, length, elems: filled } as RTArray;
      }
      return { kind: "slice", elemType: elemT, elems } as RTSlice;
    }
    if (t.kind === "MapType") {
      const keyT = this.typeName(t.key);
      const valT = this.typeName(t.value);
      const m: RTMap = { kind: "map", keyType: keyT, valType: valT, entries: new Map(), keyOrder: [] };
      for (const e of expr.elts) {
        if (!e.key) throw new GoRuntimeError("compile error: elemen map literal harus key:value");
        const key = this.evalExpr(e.key, env);
        const val = this.copyIfStruct(this.evalExpr(e.value, env));
        const mk = this.mapKeyOf(key);
        if (!m.entries.has(mk)) m.keyOrder.push(mk);
        m.entries.set(mk, val);
      }
      return m;
    }
    if (t.kind === "IdentType" || t.kind === "SelectorType") {
      const tname = t.kind === "IdentType" ? t.name : t.name;
      const typeDef = this.types.get(tname);
      if (!typeDef || typeDef.kind !== "StructType") {
        throw new GoRuntimeError(`compile error: tipe ${tname} bukan struct (composite literal hanya untuk struct/array/map)`);
      }
      const s: RTStruct = { kind: "struct", typeName: tname, fields: new Map(), fieldOrder: [] };
      // urutan field dari definisi
      for (const f of typeDef.fields) {
        for (const n of f.names) {
          s.fieldOrder.push(n);
          s.fields.set(n, this.zeroValue(f.type));
        }
      }
      if (expr.elts.length > 0 && expr.elts[0].key) {
        for (const e of expr.elts) {
          if (!e.key || e.key.kind !== "Ident") {
            throw new GoRuntimeError("compile error: key struct literal harus nama field");
          }
          const fname = (e.key as { kind: "Ident"; name: string }).name;
          if (!s.fields.has(fname)) {
            throw new GoRuntimeError(`compile error: unknown field ${fname} in struct literal of type ${tname}`);
          }
          s.fields.set(fname, this.copyIfStruct(this.evalExpr(e.value, env)));
        }
      } else {
        // positional
        expr.elts.forEach((e, i) => {
          const fname = s.fieldOrder[i];
          if (!fname) throw new GoRuntimeError(`compile error: too many values in struct literal of type ${tname}`);
          s.fields.set(fname, this.copyIfStruct(this.evalExpr(e.value, env)));
        });
      }
      return s;
    }
    throw new GoRuntimeError("compile error: tipe composite literal tidak didukung");
  }

  // ---------------- LVALUES ----------------

  private resolveLValue(expr: Expr, env: Env): { get(): RTValue; set(v: RTValue): void } {
    if (expr.kind === "Ident") {
      const cell = env.lookup(expr.name);
      if (!cell) {
        if (expr.name === "_") return { get: () => VNil, set: () => {} };
        throw new GoRuntimeError(`undefined: ${expr.name}`);
      }
      // wrapper agar seragam dengan accessor lain (get/set)
      return {
        get: () => cell.value,
        set: (v: RTValue) => {
          cell.value = v;
        },
      };
    }
    if (expr.kind === "SelectorExpr") {
      // field assignment / method? field only
      const baseCell = this.resolveLValue(expr.x, env);
      const base = baseCell.get();
      let s: RTStruct | null = null;
      if (base.kind === "struct") s = base as RTStruct;
      else if (base.kind === "ptr") {
        const inner = (base as RTPtr).cell.get();
        if (inner.kind === "struct") s = inner as RTStruct;
      }
      if (!s) throw new GoRuntimeError(`compile error: tidak bisa assign field pada ${typeOfValue(base)}`);
      const struct = s;
      if (!struct.fields.has(expr.sel)) {
        throw new GoRuntimeError(`compile error: ${struct.typeName}.${expr.sel} undefined`);
      }
      return {
        get: () => struct.fields.get(expr.sel)!,
        set: (v) => struct.fields.set(expr.sel, this.copyIfStruct(v)),
      };
    }
    if (expr.kind === "IndexExpr") {
      const collCell = this.resolveLValue(expr.x, env);
      const coll = collCell.get();
      const idx = this.evalExpr(expr.index, env);
      if (coll.kind === "map") {
        const m = coll as RTMap;
        const mk = this.mapKeyOf(idx);
        return {
          get: () => (m.entries.has(mk) ? m.entries.get(mk)! : this.zeroValue({ kind: "IdentType", name: m.valType })),
          set: (v) => {
            if (!m.entries.has(mk)) m.keyOrder.push(mk);
            m.entries.set(mk, this.copyIfStruct(v));
          },
        };
      }
      if (coll.kind === "slice" || coll.kind === "array") {
        const arr = coll as RTSlice | RTArray;
        if (idx.kind !== "int") throw new GoRuntimeError("compile error: index harus integer");
        const i = idx.v as number;
        if (i < 0 || i >= arr.elems.length) {
          throw new GoRuntimeError(`panic: runtime error: index out of range [${i}] with length ${arr.elems.length}`);
        }
        return {
          get: () => arr.elems[i],
          set: (v) => (arr.elems[i] = this.copyIfStruct(v)),
        };
      }
      throw new GoRuntimeError(`compile error: tidak bisa meng-index ${typeOfValue(coll)}`);
    }
    if (expr.kind === "UnaryExpr" && expr.op === "*") {
      const p = this.evalExpr(expr.x, env);
      if (p.kind !== "ptr") throw new GoRuntimeError("compile error: bukan pointer");
      const cell = (p as RTPtr).cell;
      return cell;
    }
    throw new GoRuntimeError("compile error: target assignment tidak valid");
  }

  // ---------------- TYPE HELPERS ----------------

  private typeName(t: TypeExpr): string {
    switch (t.kind) {
      case "IdentType": return t.name;
      case "SelectorType": return `${t.pkg}.${t.name}`;
      case "PointerType": return `*${this.typeName(t.elem)}`;
      case "ArrayType": return t.len ? `[${this.typeName(t.elem)} array]` : `[]${this.typeName(t.elem)}`;
      case "MapType": return `map[${this.typeName(t.key)}]${this.typeName(t.value)}`;
      case "ChanType": return `chan ${this.typeName(t.elem)}`;
      case "StructType": return "struct{...}";
      case "InterfaceType": return "interface{...}";
      case "FuncTypeExpr": return "func";
    }
  }

  private safeTypeName(t: TypeExpr): string | null {
    switch (t.kind) {
      case "IdentType": return t.name;
      case "SelectorType": return `${t.pkg}.${t.name}`;
      default: return null;
    }
  }

  private zeroValue(t: TypeExpr | null): RTValue {
    if (!t) return VNil;
    switch (t.kind) {
      case "IdentType":
        switch (t.name) {
          case "int": case "int64": case "int32": case "uint": case "uint8": return VInt(0);
          case "float64": case "float32": return VFloat(0);
          case "string": return VStr("");
          case "bool": return VBool(false);
          default: {
            const def = this.types.get(t.name);
            if (def) return this.zeroValue(def);
            return VNil; // interface/ptr/func
          }
        }
      case "PointerType": return VNil;
      case "ArrayType": {
        if (t.len) {
          try {
            const len = parseInt(t.len && "value" in t.len ? String((t.len as { value?: string }).value) : "0", 10);
            return { kind: "array", elemType: this.typeName(t.elem), length: len, elems: new Array(len).fill(this.zeroValue(t.elem)) } as RTArray;
          } catch {
            return { kind: "array", elemType: this.typeName(t.elem), length: 0, elems: [] } as RTArray;
          }
        }
        return { kind: "slice", elemType: this.typeName(t.elem), elems: [] } as RTSlice;
      }
      case "MapType":
        return { kind: "map", keyType: this.typeName(t.key), valType: this.typeName(t.value), entries: new Map(), keyOrder: [] } as RTMap;
      case "ChanType":
        return { kind: "chan", elemType: this.typeName(t.elem), buf: [] } as RTChan;
      case "StructType": {
        const s: RTStruct = { kind: "struct", typeName: "anonymous", fields: new Map(), fieldOrder: [] };
        for (const f of t.fields) for (const n of f.names) { s.fieldOrder.push(n); s.fields.set(n, this.zeroValue(f.type)); }
        return s;
      }
      default:
        return VNil;
    }
  }

  private coerceAssign(val: RTValue, declaredType: string, target: string): RTValue {
    // error → interface error
    if (declaredType === "error") {
      if (val.kind === "error" || val.kind === "nil") return val;
      if (this.hasMethod(typeOfValue(val), "Error")) return val;
      throw new GoRuntimeError(`compile error: cannot use ${typeOfValue(val)} as error value in ${target} (butuh method Error() string)`);
    }
    // interface custom
    const idef = this.types.get(declaredType);
    if (idef && idef.kind === "InterfaceType") {
      if (val.kind === "nil") return val;
      const vt = typeOfValue(val);
      for (const m of idef.methods) {
        if (!this.hasMethod(vt, m.name)) {
          throw new GoRuntimeError(`compile error: ${vt} does not implement ${declaredType} (missing method ${m.name})`);
        }
      }
      return val;
    }
    // basic types
    switch (declaredType) {
      case "int": case "int64": case "int32":
        if (val.kind === "int") return val;
        // literal int → float64 slot tidak berlaku di sini
        throw new GoRuntimeError(
          `compile error: cannot use ${describeLiteral(val)} as ${declaredType} value in ${target}`,
        );
      case "float64": case "float32":
        if (val.kind === "float") return val;
        if (val.kind === "int") return VFloat(val.v as number); // konstanta untyped
        throw new GoRuntimeError(
          `compile error: cannot use ${describeLiteral(val)} as float64 value in ${target}`,
        );
      case "string":
        if (val.kind === "string") return val;
        throw new GoRuntimeError(
          `compile error: cannot use ${describeLiteral(val)} as string value in ${target}`,
        );
      case "bool":
        if (val.kind === "bool") return val;
        throw new GoRuntimeError(
          `compile error: cannot use ${describeLiteral(val)} as bool value in ${target}`,
        );
    }
    // named struct type
    if (val.kind === "struct") {
      const s = val as RTStruct;
      if (s.typeName === declaredType) return val;
      const aliased = this.types.get(declaredType);
      if (aliased?.kind === "StructType") {
        return { ...s, typeName: declaredType } as RTStruct;
      }
      throw new GoRuntimeError(`compile error: cannot use ${s.typeName} as ${declaredType} in ${target}`);
    }
    if (val.kind === "ptr" && declaredType.startsWith("*")) {
      const p = val as RTPtr;
      if (p.typeName === declaredType.slice(1)) return val;
    }
    if (val.kind === "nil") return val;
    return val;
  }

  private hasMethod(valueTypeName: string, methodName: string): boolean {
    if (valueTypeName === "errorString") return methodName === "Error";
    return this.methods.has(valueTypeName) && this.methods.get(valueTypeName)!.has(methodName);
  }

  private convertType(arg: RTValue, target: string): RTValue {
    switch (target) {
      case "int": case "int64": case "int32":
        if (arg.kind === "int") return arg;
        if (arg.kind === "float") return VInt(arg.v as number);
        throw new GoRuntimeError(`compile error: cannot convert ${typeOfValue(arg)} to int`);
      case "float64": case "float32":
        if (arg.kind === "int" || arg.kind === "float") return VFloat(arg.v as number);
        throw new GoRuntimeError(`compile error: cannot convert ${typeOfValue(arg)} to float64`);
      case "string":
        if (arg.kind === "string") return arg;
        if (arg.kind === "int") return VStr(String.fromCharCode(arg.v as number)); // rune → string
        throw new GoRuntimeError(`compile error: cannot convert ${typeOfValue(arg)} to string`);
      case "bool":
        if (arg.kind === "bool") return arg;
        throw new GoRuntimeError(`compile error: cannot convert ${typeOfValue(arg)} to bool`);
      default:
        return arg;
    }
  }

  // ---------------- VALUES HELPERS ----------------

  private requireNumber(x: RTValue, ctx = "operasi") {
    if (x.kind !== "int" && x.kind !== "float") {
      throw new GoRuntimeError(`runtime error: invalid operation — ${ctx} butuh angka, diberikan ${typeOfValue(x)} (${formatValue(x)})`);
    }
  }

  private requireBool(x: RTValue, ctx: string) {
    if (x.kind !== "bool") {
      throw new GoRuntimeError(`runtime error: ${ctx} harus bool (true/false), diberikan ${typeOfValue(x)}`);
    }
  }

  private requireComparable(l: RTValue, r: RTValue, ctx: string) {
    const numeric = (v: RTValue) => v.kind === "int" || v.kind === "float";
    if (numeric(l) && numeric(r)) return;
    if (l.kind === "string" && r.kind === "string") return;
    throw new GoRuntimeError(`runtime error: tidak bisa membandingkan ${typeOfValue(l)} dengan ${typeOfValue(r)} (${ctx})`);
  }

  private truthy(x: RTValue): boolean {
    this.requireBool(x, "switch tanpa tag");
    return !!x.v;
  }

  private valuesEqual(l: RTValue, r: RTValue): boolean {
    if (l.kind === "nil" || r?.kind === "nil") {
      return l.kind === r?.kind;
    }
    if (l.kind === "error" || r.kind === "error") {
      if (l.kind === "error" && r.kind === "error") return (l as RTError).msg === (r as RTError).msg;
      return l.kind === r.kind;
    }
    if (l.kind === "ptr" && r.kind === "ptr") {
      return (l as RTPtr).cell === (r as RTPtr).cell;
    }
    if (l.kind !== r.kind) {
      return false;
    }
    if (l.kind === "string") return l.v === r.v;
    if (l.kind === "int" || l.kind === "float") return l.v === r.v;
    if (l.kind === "bool") return l.v === r.v;
    if (l.kind === "slice" || l.kind === "array") {
      const a = (l as RTSlice).elems, b = (r as RTSlice).elems;
      return a.length === b.length && a.every((x, i) => this.valuesEqual(x, b[i]));
    }
    if (l.kind === "struct") {
      const a = l as RTStruct, b = r as RTStruct;
      return a.fieldOrder.every((f) => this.valuesEqual(a.fields.get(f)!, b.fields.get(f)!));
    }
    return l === r;
  }

  private mapKeyOf(v: RTValue): string | number {
    if (v.kind === "int") return v.v as number;
    if (v.kind === "string") return v.v as string;
    throw new GoRuntimeError(`compile error: tipe kunci map ${typeOfValue(v)} tidak didukung`);
  }

  private copyIfStruct(v: RTValue): RTValue {
    if (v.kind !== "struct") return v;
    const s = v as RTStruct;
    const clone: RTStruct = { kind: "struct", typeName: s.typeName, fields: new Map(), fieldOrder: [...s.fieldOrder] };
    for (const [k, val] of s.fields) {
      clone.fields.set(k, val.kind === "struct" ? this.copyIfStruct(val) : val);
    }
    return clone;
  }

  // ---------------- OUTPUT ----------------

  private write(s: string) {
    if (this.out.join("").length + s.length > OUTPUT_LIMIT) {
      throw new GoRuntimeError("runtime error: output terlalu panjang — program dihentikan");
    }
    this.out.push(s);
  }

  // ---------------- BUILTINS (tanpa import) ----------------

  private _builtins: Record<string, RTValue> | null = null;

  private getBuiltin(name: string): RTValue | null {
    if (!this._builtins) {
      const nat = (n: string, call: (args: RTValue[]) => RTValue): RTValue =>
        ({ kind: "native", name: n, call } as RTNative);

      const requireArgs = (n: string, args: RTValue[], min: number) => {
        if (args.length < min) {
          throw new GoRuntimeError(`compile error: not enough arguments in call to ${n}`);
        }
      };

      this._builtins = {
        len: nat("len", (args) => {
          requireArgs("len", args, 1);
          const x = args[0];
          if (x.kind === "string") return VInt(utf8Len(x.v as string));
          if (x.kind === "slice" || x.kind === "array") return VInt((x as RTSlice).elems.length);
          if (x.kind === "map") return VInt((x as RTMap).entries.size);
          if (x.kind === "chan") return VInt((x as RTChan).buf.length);
          throw new GoRuntimeError(`compile error: invalid argument: len(${typeOfValue(x)})`);
        }),
        cap: nat("cap", (args) => {
          requireArgs("cap", args, 1);
          const x = args[0];
          if (x.kind === "slice" || x.kind === "array") return VInt((x as RTSlice).elems.length);
          if (x.kind === "chan") return VInt((x as RTChan).capacity ?? 0);
          throw new GoRuntimeError(`compile error: invalid argument: cap(${typeOfValue(x)})`);
        }),
        append: nat("append", (args) => {
          requireArgs("append", args, 1);
          const first = args[0];
          if (first.kind !== "slice") {
            throw new GoRuntimeError(`compile error: first argument to append must be slice; punya ${typeOfValue(first)}`);
          }
          const s = first as RTSlice;
          const elems = [...s.elems.map((e) => (e.kind === "struct" ? this.copyIfStruct(e) : e))];
          for (let i = 1; i < args.length; i++) {
            const a = args[i];
            if (a.kind === "slice") {
              // append(s, other...) — spread
              elems.push(...((a as RTSlice).elems ?? []));
            } else {
              elems.push(a);
            }
          }
          return { kind: "slice", elemType: s.elemType, elems } as RTSlice;
        }),
        make: nat("make", (args) => {
          requireArgs("make", args, 1);
          const targ = args[0] as unknown as { kind: "typearg"; t: TypeExpr };
          if (!targ || targ.kind !== "typearg") {
            throw new GoRuntimeError("compile error: make membutuhkan tipe sebagai argumen pertama");
          }
          const zv = this.zeroValue(targ.t);
          // make(chan T, n) → simpan kapasitas buffer
          if (zv.kind === "chan") {
            const capArg = args[1];
            (zv as RTChan).capacity =
              capArg && capArg.kind === "int" ? (capArg.v as number) : 0;
          }
          return zv;
        }),
        new: nat("new", (args) => {
          requireArgs("new", args, 1);
          const targ = args[0] as unknown as { kind: "typearg"; t: TypeExpr };
          if (!targ || targ.kind !== "typearg") {
            throw new GoRuntimeError("compile error: new membutuhkan tipe sebagai argumen pertama");
          }
          const zv = this.zeroValue(targ.t);
          const holder = { value: zv } as { value: RTValue };
          const tn = targ.t.kind === "IdentType" ? targ.t.name : typeOfValue(zv);
          return {
            kind: "ptr",
            typeName: tn === "nil" ? "int" : tn,
            cell: { get: () => holder.value, set: (v) => (holder.value = v) },
          } as RTPtr;
        }),
        panic: nat("panic", (args) => {
          const msg = args[0] ? formatValue(args[0]) : "panic";
          throw new PanicSignal(msg);
        }),
        print: nat("print", (args) => {
          this.write(args.map(formatValue).join(" "));
          return VNil;
        }),
        println: nat("println", (args) => {
          this.write(args.map(formatValue).join(" ") + "\n");
          return VNil;
        }),
      };
    }
    return this._builtins[name] ?? null;
  }

  // ---------------- PACKAGE FUNCTIONS ----------------

  private _pkgFuncs: Record<string, RTValue> | null = null;

  private packageFunctions(): Record<string, RTValue> {
    if (this._pkgFuncs) return this._pkgFuncs;
    const nat = (name: string, call: (args: RTValue[]) => RTValue): RTValue =>
      ({ kind: "native", name, call } as RTNative);

    const fmtPrintln = (args: RTValue[]) => {
      this.write(args.map(formatValue).join(" ") + "\n");
      return VNil;
    };
    const fmtPrint = (args: RTValue[]) => {
      this.write(args.map(formatValue).join(" "));
      return VNil;
    };
    const doPrintf = (args: RTValue[], capture: boolean): RTValue => {
      if (args.length === 0) {
        if (!capture) this.write("%!(NOARGS)");
        return capture ? VStr("%!(NOARGS)") : VNil;
      }
      const format = args[0];
      if (format.kind !== "string") {
        const msg = "%!" + typeOfValue(format);
        if (capture) return VStr(msg);
        this.write(msg);
        return VNil;
      }
      let argIdx = 1;
      let out = "";
      const fmtStr = format.v as string;
      for (let i = 0; i < fmtStr.length; i++) {
        const c = fmtStr[i];
        if (c !== "%") {
          out += c;
          continue;
        }
        const next = fmtStr[i + 1];
        if (next === "%") {
          out += "%";
          i++;
          continue;
        }
        // parse width/precision like .2f
        let spec = "";
        let j = i + 1;
        while (j < fmtStr.length && /[0-9.]/.test(fmtStr[j])) {
          spec += fmtStr[j];
          j++;
        }
        const verb = fmtStr[j];
        const arg = args[argIdx];
        argIdx++;
        switch (verb) {
          case "d": {
            if (arg?.kind === "int") out += String(arg.v);
            else if (arg?.kind === "float") out += String(Math.trunc(arg.v as number));
            else out += "%!d(" + (arg ? typeOfValue(arg) + "=" + formatValue(arg) : "MISSING") + ")";
            break;
          }
          case "s": {
            out += arg ? (arg.kind === "string" ? (arg.v as string) : formatValue(arg)) : "%!s(MISSING)";
            break;
          }
          case "v": {
            out += arg ? formatValue(arg) : "%!v(MISSING)";
            break;
          }
          case "t": {
            out += arg?.kind === "bool" ? String(arg.v) : "%!t(" + (arg ? typeOfValue(arg) : "MISSING") + ")";
            break;
          }
          case "f": {
            if (arg && (arg.kind === "float" || arg.kind === "int")) {
              const n = arg.v as number;
              const precision = spec.includes(".") ? parseInt(spec.split(".")[1], 10) : 6;
              out += n.toFixed(precision);
            } else {
              out += "%!f(" + (arg ? typeOfValue(arg) : "MISSING") + ")";
            }
            break;
          }
          case "T": {
            out += arg ? typeOfValue(arg) : "%!T(MISSING)";
            break;
          }
          case "q": {
            out += arg?.kind === "string" ? quoteString(arg.v as string) : "%!q(" + (arg ? typeOfValue(arg) : "MISSING") + ")";
            break;
          }
          default: {
            out += "%" + (spec || "") + (verb ?? "") + "(" + (arg ? typeOfValue(arg) : "MISSING") + ")";
          }
        }
        i = j;
      }
      if (capture) return VStr(out);
      this.write(out);
      return VNil;
    };

    const funcs: Record<string, RTValue> = {
      // fmt — selalu tersedia (playground otomatis menyediakan fmt)
      "fmt.Println": nat("fmt.Println", fmtPrintln),
      "fmt.Print": nat("fmt.Print", fmtPrint),
      "fmt.Printf": nat("fmt.Printf", (a) => doPrintf(a, false)),
      "fmt.Sprintf": nat("fmt.Sprintf", (a) => doPrintf(a, true)),
      "fmt.Errorf": nat("fmt.Errorf", (a) => {
        const s = doPrintf(a, true);
        return { kind: "error", msg: s.v as string } as RTError;
      }),
      "errors.New": nat("errors.New", (a) => {
        if (a.length === 0 || a[0].kind !== "string") {
          throw new GoRuntimeError("compile error: errors.New membutuhkan satu argumen string");
        }
        return { kind: "error", msg: a[0].v as string } as RTError;
      }),
      // strings
      "strings.ToUpper": nat("strings.ToUpper", (a) => VStr((a[0]?.v as string ?? "").toUpperCase())),
      "strings.ToLower": nat("strings.ToLower", (a) => VStr((a[0]?.v as string ?? "").toLowerCase())),
      "strings.Contains": nat("strings.Contains", (a) => VBool((a[0]?.v as string ?? "").includes(a[1]?.v as string ?? ""))),
      "strings.HasPrefix": nat("strings.HasPrefix", (a) => VBool((a[0]?.v as string ?? "").startsWith(a[1]?.v as string ?? ""))),
      "strings.HasSuffix": nat("strings.HasSuffix", (a) => VBool((a[0]?.v as string ?? "").endsWith(a[1]?.v as string ?? ""))),
      "strings.Split": nat("strings.Split", (a) => ({
        kind: "slice",
        elemType: "string",
        elems: (a[0]?.v as string ?? "").split(a[1]?.v as string ?? "").map(VStr),
      } as RTSlice)),
      "strings.Join": nat("strings.Join", (a) => {
        const elems = (a[0] as RTSlice | undefined)?.elems ?? [];
        return VStr(elems.map((e) => formatValue(e)).join(a[1]?.v as string ?? ""));
      }),
      "strings.Repeat": nat("strings.Repeat", (a) => VStr((a[0]?.v as string ?? "").repeat(Math.max(0, a[1]?.v as number ?? 0)))),
      "strings.TrimSpace": nat("strings.TrimSpace", (a) => VStr((a[0]?.v as string ?? "").trim())),
      "strings.ReplaceAll": nat("strings.ReplaceAll", (a) =>
        VStr((a[0]?.v as string ?? "").split(a[1]?.v as string ?? "").join(a[2]?.v as string ?? ""))),
      // strconv
      "strconv.Itoa": nat("strconv.Itoa", (a) => VStr(String(a[0]?.v as number))),
      "strconv.Atoi": nat("strconv.Atoi", (a) => {
        const s = a[0]?.v as string;
        const n = parseInt(s, 10);
        if (isNaN(n)) {
          return VTuple([
            VInt(0),
            { kind: "error", msg: `strconv.Atoi: parsing "${s}": invalid syntax` } as RTError,
          ]);
        }
        return VTuple([VInt(n), VNil]);
      }),
      // os
      "os.Getenv": nat("os.Getenv", () => VStr("")),
    };
    this._pkgFuncs = funcs;
    return funcs;
  }
}

const dummyErrorMethod: FuncDecl = {
  name: "Error",
  receiver: { name: "e", type: { kind: "IdentType", name: "errorString" } },
  type: { params: [], results: [{ name: null, type: { kind: "IdentType", name: "string" } }] },
  body: { stmts: [] },
};

function describeLiteral(v: RTValue): string {
  switch (v.kind) {
    case "string": return `"${v.v}" (untyped string constant)`;
    case "int": return `${v.v} (untyped int constant)`;
    case "float": return `${v.v} (untyped float constant)`;
    case "bool": return `${v.v} (bool)`;
    default: return `${formatValue(v)} (${typeOfValue(v)})`;
  }
}

// ---------------- PUBLIC API ----------------

let sharedInterpreterWarned = false;
export function runGoCode(source: string): RunResult {
  if (!sharedInterpreterWarned) sharedInterpreterWarned = true;
  return new Interpreter().run(source);
}
