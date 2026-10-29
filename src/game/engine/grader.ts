import type { CodeValidator } from "../types";
import { runGoCode, type RunResult } from "./interpreter";

// ============================================================
// GRADER — menilai kode user dengan feedback yang ramah
// ============================================================

export interface GradeResult {
  passed: boolean;
  runOutput: string;
  error?: string;
  errorKind?: RunResult["errorKind"];
  /** true jika output sudah benar tapi ada validator yang belum terpenuhi */
  outputMatched: boolean;
  failedValidators: Array<{ hint: string }>;
}

function normalizeOutput(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l, i, arr) => !(l === "" && i === arr.length - 1));
}

export function gradeSubmission(
  source: string,
  expectedOutput: string,
  validators: CodeValidator[],
): GradeResult {
  // 1. Jalankan kode
  const result = runGoCode(source);

  if (!result.ok) {
    return {
      passed: false,
      runOutput: result.output,
      error: result.error?.message,
      errorKind: result.errorKind,
      outputMatched: false,
      failedValidators: [],
    };
  }

  // 2. Bandingkan output
  const gotLines = normalizeOutput(result.output);
  const wantLines = normalizeOutput(expectedOutput);
  const outputMatched =
    gotLines.length === wantLines.length && gotLines.every((l, i) => l === wantLines[i]);

  // 3. Validasi pola pada source code
  const failedValidators: Array<{ hint: string }> = [];
  for (const v of validators) {
    const ok =
      v.kind === "includes"
        ? source.includes(v.pattern)
        : new RegExp(v.pattern, v.flags ?? "m").test(source);
    if (!ok) failedValidators.push({ hint: v.hint });
  }

  if (outputMatched && failedValidators.length === 0) {
    return { passed: true, runOutput: result.output, outputMatched: true, failedValidators: [] };
  }

  return {
    passed: false,
    runOutput: result.output,
    outputMatched,
    failedValidators,
  };
}

/** Pesan error yang sudah diterjemahkan jadi tips ramah */
export function friendlyError(result: RunResult): string | null {
  if (result.ok || !result.error) return null;
  const msg = result.error.message;
  type TipFactory = string | ((m: RegExpMatchArray) => string);
  const tips: Array<[RegExp, TipFactory]> = [
    [/undefined: fmt/i, "Hmm, kayaknya kamu lupa import \"fmt\" di bagian atas program. fmt adalah package untuk mencetak ke layar!"],
    [/string literal/i, "Cek tanda kutip dua (\") penutup kalimatmu — ada yang hilang atau kelewat, nih."],
    [/unexpected newline in string/i, "String di Go harus ditutup dalam SATU baris. Cek lagi tanda kutipnya ya!"],
    [/index out of range/i, "Index keluar batas! Ingat: index slice/array mulai dari 0, jadi index terakhir = panjang - 1."],
    [/divide by zero/i, "Waduh, pembagian dengan nol! Tambahkan pengecekan pembagi != 0 dulu sebelum membagi."],
    [/integer divide by zero/i, "Waduh, pembagian dengan nol! Tambahkan pengecekan pembagi != 0 dulu sebelum membagi."],
    [/infinite loop/i, "Loop-mu tidak pernah berhenti! Pastikan ada kondisi berhenti — misalnya counter yang bertambah (i++) atau i < len(x)."],
    [/no new variables on left side/i, ":= hanya boleh jika ada minimal SATU variable baru di kiri. Kalau semua sudah ada, gunakan = biasa."],
    [/not enough arguments/i, "Argumen fungsi kurang! Baca lagi signature fungsinya — hitung jumlah parameternya."],
    [/too many arguments/i, "Argumen fungsi kebanyakan! Baca lagi signature fungsinya — hitung jumlah parameternya."],
    [/does not implement/i, "Ada tipe yang belum memenuhi kontrak interface. Lihat method apa yang diminta interface, lalu tambahkan method itu!"],
    [/missing method/i, "Ada method yang hilang! Interface menuntut method tertentu — lengkapi method itu pada struct-mu."],
    [/nil pointer/i, "Pointer-mu masih nil (kosong). Pastikan pointer sudah menunjuk ke nilai sebelum dipakai."],
    [/cannot use .+ as .+ value/i, "Tipe tidak cocok! Di Go, variable yang sudah bertipe int tidak bisa diisi string (atau sebaliknya). Periksa tipemu."],
    [/all goroutines are asleep/i, "Deadlock! Channel-mu kosong saat dibaca. Dalam simulasi ini, pastikan kirim (ch <- v) terjadi sebelum menerima (<-ch)."],
    [/channel penuh/i, "Channel penuh! Buffer channel-mu sudah maksimal. Perbesar kapasitasnya: make(chan T, n) dengan n lebih besar, atau kosongkan dengan menerima (<-ch)."],
    [/Maximum call stack size exceeded/i, "Rekursi tanpa ujung! Fungsi memanggil dirinya sendiri tanpa kondisi berhenti (base case). Tambahkan kondisi seperti: if n < 2 { return n }"],
    [/func main belum/i, "Setiap program Go butuh func main() — titik awal eksekusi. Tambahkan ya!"],
    [/package .+ tidak tersedia/i, "Package itu belum tersedia di GoQuest Playground. Yang bisa dipakai: fmt, errors, strings, strconv."],
    [/undefined: (\w+)/i, (m) => `Nama '${m[1]}' belum dideklarasikan. Cek ejaannya (huruf besar/kecil itu penting di Go!) atau deklarasikan dulu dengan := atau var.`],
  ];

  for (const [re, tip] of tips) {
    if (re.test(msg)) {
      return typeof tip === "function" ? tip(msg.match(re) as RegExpMatchArray) : tip;
    }
  }
  return null;
}
