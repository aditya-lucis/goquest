import type { Quest } from "../types";

// ============================================================
// ACT 3: LEGENDARY PATH — Generics, Context, Reflection,
// Performance, REST API, Database, Deploy (semua playable)
// ============================================================

export const ACT3_QUESTS: Quest[] = [
  // ------------------------------------------------------------
  // q3-1: GENERICS
  // ------------------------------------------------------------
  {
    id: "q3-1",
    act: 3,
    order: 1,
    title: "Rune Fleksibel",
    subtitle: "Generics: Satu Mantra untuk Semua Tipe",
    emoji: "🧬",
    difficulty: "epic",
    xpReward: 250,
    goldReward: 90,
    skillId: "skill-generics",
    itemReward: "item-rune-generics",
    story: [
      "Pintu Act 3 menjulang setinggi langit, dan rune di ambangnya berubah wujud tanpa henti: pedang, perisai, tongkat, lalu kembali menjadi cahaya murni. Rune yang sama — wujud yang berbeda.",
      "\"Selama puluhan tahun, para penyihir Go menulis mantra yang SAMA berulang-ulang: MaxInt, MaxFloat, MaxString...\" Zephyrus menggeleng. \"Sampai akhirnya, di Go 1.18, lahir GENERICS — satu mantra untuk semua tipe. Disiplin ilmu tertinggi yang hanya dikuasai para Archmage.\"",
      "\"Tapi kau harus MERASAKAN dulu sakitnya duplikasi sebelum menghargai obatnya. Lawan Code Duplication Golem — dan biarkan tubuhmu mengingat mengapa generics diciptakan.\"",
    ],
    objectives: [
      "Merasakan masalah duplikasi fungsi per-tipe",
      "Memahami type parameter [T any]",
      "Mengenal constraints: any, comparable, constraints.Ordered",
      "Kalahkan Code Duplication Golem",
    ],
    lesson: `## Masalah: Satu Logika, Banyak Tipe

Sebelum generics, logika yang sama harus ditulis ulang untuk SETIAP tipe:

\`\`\`go
func MaxInt(a, b int) int {
    if a > b { return a }
    return b
}

func MaxFloat64(a, b float64) float64 {
    if a > b { return a }
    return b
}

func MaxString(a, b string) string {
    if a > b { return a }
    return b
}
// Copy-paste... tiga kali. MELELAHkan.
\`\`\`

## Solusi: Type Parameter

Go 1.18+ memungkinkan fungsi menerima TIPE sebagai parameter — ditulis di antara \`[]\`:

\`\`\`go
func Max[T constraints.Ordered](a, b T) T {
    if a > b { return a }
    return b
}

Max(42, 17)          // T ter-infer sebagai int
Max(3.14, 2.71)      // T ter-infer sebagai float64
Max("aria", "zephyr") // T ter-infer sebagai string
\`\`\`

SATU fungsi. Compiler yang mengerjakan sisanya — dan type safety TETAP terjaga penuh (kompilasi gagal jika tipe tidak didukung).

## Constraints — Membatasi T

\`T\` tidak boleh bar-bar. Constraints menentukan tipe apa saja yang boleh masuk:

\`\`\`go
// any = semua tipe (alias interface{})
func Print[T any](v T) { fmt.Println(v) }

// comparable = tipe yang bisa dibandingkan dengan ==
func Contains[T comparable](xs []T, target T) bool {
    for _, x := range xs {
        if x == target { return true }
    }
    return false
}

// union type custom
type Number interface {
    ~int | ~int64 | ~float64
}

func Sum[T Number](xs []T) T { ... }
\`\`\`

\`constraints.Ordered\` dari package \`golang.org/x/exp/constraints\` mengizinkan semua tipe yang bisa di-\`<\` \`>\` (angka & string).

### Generic Type — Container

Tipe juga bisa generik:

\`\`\`go
type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }
func (s *Stack[T]) Pop() T {
    last := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return last
}
\`\`\`

> **CATATAN SIMULASI:** Playground GoQuest menjalankan subset Go non-generik, jadi challenge-nya mengajarmu MASALAH yang generics selesaikan (duplikasi!), sementara boss battle memperkenalkan solusinya lewat lesson ini. Tulis kode generics pertamamu di mesin Go sungguhan — rasakan bedanya!

> **TIP GUILDMASTER:** Jangan generics-kan segalanya. Mulai dengan fungsi konkret; baru jadikan generik saat duplikasi BENAR-BENAR muncul. Generics itu alat, bukan gaya hidup.`,
    challenge: {
      prompt:
        "Rasakan letihnya masa lalu! Buat DUA fungsi dengan logika IDENTIK: (1) MaxInt(a int, b int) int — kembalikan yang lebih besar; (2) MaxString(a string, b string) string — kembalikan yang lebih besar (perbandingan alfabetis). Di main: cetak MaxInt(42, 17) lalu MaxString(\"aria\", \"zephyr\"). Perhatikan betapa identiknya isi kedua fungsi — rasa lelah itu adalah pelajarannya!",
      hint: "Kedua fungsi berisi logika sama persis: if a > b { return a }; return b. Hanya tipe parameternya yang berbeda.",
      starterCode: `package main

import "fmt"

// MaxInt: kembalikan bilangan yang lebih besar
// MaxString: kembalikan string yang lebih besar (alfabetis)

func main() {
    fmt.Println(MaxInt(42, 17))
    fmt.Println(MaxString("aria", "zephyr"))
}
`,
      expectedOutput: "42\nzephyr",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s+MaxInt\\s*\\(\\s*\\w+\\s+int\\s*,\\s*\\w+\\s+int\\s*\\)\\s+int",
          hint: "Signature: func MaxInt(a int, b int) int.",
        },
        {
          kind: "regex",
          pattern: "func\\s+MaxString\\s*\\(\\s*\\w+\\s+string\\s*,\\s*\\w+\\s+string\\s*\\)\\s+string",
          hint: "Signature: func MaxString(a string, b string) string.",
        },
      ],
    },
    boss: {
      name: "Code Duplication Golem",
      emoji: "🗿",
      taunt: "TIGA versi fungsi yang sama... SEPULUH versi... SERATUS... Aku tumbuh setiap kali kau menekan Ctrl+C Ctrl+V... TIDAK ADA YANG BISA MENGHENTIKANKU...",
      prompt:
        "Code Duplication Golem tumbuh setiap kali kode disalin! Lengkapi trinitas duplikasi: MaxInt dan MaxString sudah tersedia — tambahkan MaxFloat64(a float64, b float64) float64 dengan logika yang sama, lalu di main cetak MaxInt(42, 17), MaxString(\"aria\", \"zephyr\"), dan MaxFloat64(3.14, 2.71) dalam urutan itu. Tiga fungsi identik... rasakan kelemahanmu golem makin kuat!",
      starterCode: `package main

import "fmt"

func MaxInt(a int, b int) int {
    if a > b {
        return a
    }
    return b
}

func MaxString(a string, b string) string {
    if a > b {
        return a
    }
    return b
}

// GOLEM MENUNTUT SATU LAGI SALINAN:
// MaxFloat64(a float64, b float64) float64 — logika yang SAMA...

func main() {
    fmt.Println(MaxInt(42, 17))
    fmt.Println(MaxString("aria", "zephyr"))
    // cetak juga MaxFloat64(3.14, 2.71)
}
`,
      expectedOutput: "42\nzephyr\n3.14",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s+MaxFloat64\\s*\\(\\s*\\w+\\s+float64\\s*,\\s*\\w+\\s+float64\\s*\\)\\s+float64",
          hint: "Salinan ketiga: func MaxFloat64(a float64, b float64) float64 — isi sama: if a > b { return a }; return b.",
        },
      ],
      hp: 160,
      victoryStory:
        "Golem tercekat — bukan karena kau menghancurkannya, tapi karena kau MENEMUKAN SENJATANYA: generics! Di Go sungguhan, cukup SATU fungsi: func Max[T constraints.Ordered](a, b T) T — dan tiga salinan itu lenyap. Zephyrus tersenyum: \"Kau baru saja merasakan 15 tahun sejarah Go dalam satu quest. Generics lahir dari letih yang kau rasakan barusan. Gunakan dengan bijak — dan golem tak akan pernah tumbuh lagi.\"",
    },
  },

  // ------------------------------------------------------------
  // q3-2: CONTEXT
  // ------------------------------------------------------------
  {
    id: "q3-2",
    act: 3,
    order: 2,
    title: "Penenun Waktu",
    subtitle: "Context: Mengendalikan Waktu dan Pembatalan",
    emoji: "⏳",
    difficulty: "epic",
    xpReward: 270,
    goldReward: 95,
    skillId: "skill-context",
    itemReward: "item-hourglass-context",
    story: [
      "Menara jam pasir raksasa berdiri di antara awan. Setiap butir pasir adalah request yang menunggu — dan Penenun Waktulah yang memutuskan mana yang berlanjut, mana yang harus dibatalkan sebelum menghabiskan seluruh realm.",
      "\"Bayangkan ribuan request masuk ke servermu,\" kata Penenun Waktu tanpa menoleh. \"Sebagian lambat. Sebagian tidak akan pernah selesai. Tanpa context, mereka menumpuk seperti pasir ini — sampai seluruh realm runtuh oleh goroutine yang tak pernah berhenti.\"",
      "\"Context adalah kontrak WAKTU: setiap request membawa jam pasirnya sendiri. Habis waktunya? Semua pekerjaan turunannya dibatalkan serentak. Kuasai pola ini, dan tak ada lagi request yang menyandera realm.\"",
    ],
    objectives: [
      "Memahami deadline & pembatalan (cancellation)",
      "Menggunakan context.WithTimeout & ctx.Done()",
      "Menerapkan pola pengecekan sinyal antar tugas",
      "Kalahkan Timeout Titan",
    ],
    lesson: `## Context — Kontrak Waktu Setiap Request

Package \`context\` membawa tiga hal: deadline, sinyal pembatalan, dan nilai request-scoped:

\`\`\`go
import (
    "context"
    "time"
)

func main() {
    // beri batas waktu 2 detik untuk seluruh operasi
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel() // selalu panggil cancel — bebaskan sumber daya!

    select {
    case <-ctx.Done():
        fmt.Println("waktu habis:", ctx.Err()) // context deadline exceeded
    case result := <-doWork():
        fmt.Println("selesai:", result)
    }
}
\`\`\`

## ctx.Done() — Channel Pembatalal

\`ctx.Done()\` adalah channel yang TERTUTUP saat waktu habis atau cancel() dipanggil. Pola paling penting — periksa di antara tugas:

\`\`\`go
func worker(ctx context.Context, tasks []string) int {
    done := 0
    for _, task := range tasks {
        select {
        case <-ctx.Done():          // waktu habis? berhenti SEKARANG
            return done
        default:
            process(task)           // masih ada waktu? kerjakan
            done++
        }
    }
    return done
}
\`\`\`

## WithCancel — Pembatalan Manual

\`\`\`go
ctx, cancel := context.WithCancel(context.Background())
go func() {
    if bahaya() {
        cancel() // batalkan semua turunan ctx
    }
}()
\`\`\`

### Aturan Suci Context

1. Context masuk sebagai parameter PERTAMA: \`func Serve(ctx context.Context, req Request)\`
2. JANGAN simpan context di dalam struct
3. Setiap operasi yang bisa lama WAJIB menerima ctx
4. Selalu \`defer cancel()\`

> **CATATAN SIMULASI:** Playground GoQuest tidak menjalankan package context sungguhan (tidak ada waktu nyata di realm ini). Jadi kau akan membangun polanya dengan bahan murni: batas tugas (deadline) dan channel done — persis cara context bekerja di balik tirai. \`ctx.Err()\` yang kau kenal akan muncul sebagai error \"context deadline exceeded\".`,
    challenge: {
      prompt:
        "Tenun jam pasir pertamamu! Buat fungsi ProcessWithDeadline(tasks []string, deadline int) (int, error): setiap tugas memakan satu 'tick'. Loop semua tugas: jika jumlah tugas selesai SUDAH >= deadline, kembalikan (jumlahSelesai, errors.New(\"context deadline exceeded\")) — jangan proses sisanya. Jika semua tugas selesai sebelum deadline, kembalikan (jumlahTugas, nil). Di main: batchA = 5 tugas dengan deadline 3, batchB = 2 tugas dengan deadline 3 — cetak hasilnya: 'Batch A: <n> tugas — dibatalkan: <error>' untuk batch pertama dan 'Batch B: <n> tugas — sukses' untuk batch kedua.",
      hint: "done := 0; for range tasks { if done >= deadline { return done, errors.New(\"context deadline exceeded\") }; done++ } lalu return done, nil. Di main periksa err != nil untuk memilih format cetak.",
      starterCode: `package main

import (
    "errors"
    "fmt"
)

// ProcessWithDeadline: proses tugas dengan batas 'tick'
// - tugas ke-N hanya dikerjakan jika done < deadline
// - deadline tercapai → return (done, errors.New("context deadline exceeded"))
// - semua selesai → return (done, nil)

func main() {
    batchA := []string{"gigi", "sisik", "cakar", "ekor", "jantung"}
    batchB := []string{"gigi", "sisik"}

    // Batch A (deadline 3): jika error != nil →
    //   fmt.Println("Batch A:", n, "tugas — dibatalkan:", err)
    // Batch B (deadline 3): sukses →
    //   fmt.Println("Batch B:", n, "tugas — sukses")
}
`,
      expectedOutput:
        "Batch A: 3 tugas — dibatalkan: context deadline exceeded\nBatch B: 2 tugas — sukses",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s+ProcessWithDeadline\\s*\\(",
          hint: "Definisikan fungsi: func ProcessWithDeadline(tasks []string, deadline int) (int, error).",
        },
        {
          kind: "includes",
          pattern: "context deadline exceeded",
          hint: "Gunakan pesan error kanonik Go: errors.New(\"context deadline exceeded\").",
        },
      ],
    },
    boss: {
      name: "Timeout Titan",
      emoji: "⌛",
      taunt: "AKU MENUNGGU SELAMANYA... request demi request menumpuk tanpa akhir... dan kau... kau akan MENUNGGU BERSAMAKU... sampai realm ini runtuh... waktumu TIDAK ADA BATASNYA... atau adakah?",
      prompt:
        "Timeout Titan menghantam di tengah misi! Di bawah ini, sinyal pembatalan (channel done) DIKIRIM saat tugas 'cakar' mulai diproses — tapi loop TIDAK PERNAH memeriksa sinyal itu, sehingga semua tugas tetap dikerjakan. Tambahkan pola context: SEBELUM memproses setiap tugas, periksa 'if len(done) > 0' — jika ada sinyal, konsumsi dengan <-done, cetak 'dibatalkan saat memproses: <task>', lalu break. Jika aman, cetak 'selesai memproses: <task>' dan tambah counter. Di akhir cetak 'total: <finished> tugas'.",
      starterCode: `package main

import "fmt"

func main() {
    done := make(chan bool, 1) // channel sinyal (pola ctx.Done())
    tasks := []string{"gigi", "sisik", "cakar", "ekor"}
    finished := 0

    for _, task := range tasks {
        // TITAN MENGHANTAM: sinyal dikirim saat tugas "cakar" tiba
        if task == "cakar" {
            done <- true
        }

        // POLA CONTEXT HILANG DISERAP TITAN!
        // Periksa sinyal SEBELUM memproses:
        // if len(done) > 0 { ... <-done ... "dibatalkan saat memproses: <task>" ... break }

        fmt.Println("selesai memproses:", task)
        finished++
    }
    fmt.Println("total:", finished, "tugas")
}
`,
      expectedOutput:
        "selesai memproses: gigi\nselesai memproses: sisik\ndibatalkan saat memproses: cakar\ntotal: 2 tugas",
      validators: [
        {
          kind: "regex",
          pattern: "len\\(\\s*done\\s*\\)\\s*>\\s*0",
          hint: "Periksa sinyal pembatalan sebelum tiap tugas: if len(done) > 0 { ... }.",
        },
        {
          kind: "regex",
          pattern: "<-done",
          hint: "Konsumsi sinyal dari channel dengan <-done — seperti membaca <-ctx.Done().",
        },
      ],
      hp: 170,
      victoryStory:
        "Titan berlutut saat request-request berbahaya mulai MEMATIKAN DIRINYA SENDIRI tepat waktu. Penenun Waktu membalik jam pasir terakhir: \"Kau memahami essensi context: bukan magic — hanya DISIPLIN memeriksa sinyal di antara tugas. WithTimeout, WithCancel, ctx.Done()... semuanya melayani pola yang barusan kau tulis. Server sungguhan akan berterima kasih — dan pengguna-mu tidak akan pernah menatap spinner tanpa akhir lagi.\"",
    },
  },

  // ------------------------------------------------------------
  // q3-3: REFLECTION
  // ------------------------------------------------------------
  {
    id: "q3-3",
    act: 3,
    order: 3,
    title: "Mata Batin",
    subtitle: "Reflection: Membaca Struktur di Balik Kabut",
    emoji: "👁️",
    difficulty: "epic",
    xpReward: 280,
    goldReward: 100,
    skillId: "skill-reflection",
    itemReward: "item-eye-reflection",
    story: [
      "Kuil tanpa cahaya. Di dalamnya, para biarawan membaca isi peti KETERANGAN TIPE hanya dari gema suaranya — tanpa pernah membukanya. \"Refleksi,\" kata biarawan tertua, \"adalah melihat ke dalam.\"",
      "\"Bayangkan mantra yang mengubah struct apa pun menjadi JSON. Mantra itu tidak tahu struct apa yang akan datang — Hero, Monster, Quest... Ia membaca struktur mereka SAAT PROGRAM BERJALAN. Itulah reflection: mata batin kode.\"",
      "\"encoding/json, GORM, testing — semua memakainya. Hari ini kau akan membangun 'mata batin' itu dengan tanganmu sendiri, dari nol. Hanya mereka yang pernah membuatnya yang layak memakainya.\"",
    ],
    objectives: [
      "Memahami metadata tipe saat runtime",
      "Membaca field struct secara programatik",
      "Membangun schema registry (pola ORM)",
      "Kalahkan Opaque Oracle",
    ],
    lesson: `## Reflection — Kode yang Membaca Kode

Package \`reflect\` memungkinkan program memeriksa tipe & nilai SAAT BERJALAN:

\`\`\`go
import "reflect"

type Hero struct {
    Name string \`json:"name"\`
    HP   int    \`json:"hp"\`
}

h := Hero{Name: "Aria", HP: 100}

t := reflect.TypeOf(h)
fmt.Println(t.Name())  // "Hero"
fmt.Println(t.Kind())  // struct
fmt.Println(t.NumField()) // 2

for i := 0; i < t.NumField(); i++ {
    f := t.Field(i)
    fmt.Println(f.Name, f.Type, f.Tag.Get("json"))
    // Name string name
    // HP int hp
}
\`\`\`

## Siapa yang Memakainya?

- **encoding/json** — mengubah struct menjadi JSON & sebaliknya, membaca struct tag
- **GORM / sqlx** — memetakan struct ke tabel database
- **testing** — mengidentifikasi fungsi \`TestXxx\` dan menjalankannya
- **fmt** — mencetak nilai apa pun dengan \%v

## Struct Tag — Metadata di Balik Backtick

\`\`\`go
type Quest struct {
    Title string \`json:"title" validate:"required"\`
}
\`\`\`

Tag adalah metadata yang menempel pada field — dibaca lewat reflection oleh library. Satu field bisa membawa banyak instruksi.

### Harga yang Harus Dibayar

Reflection LAMBAT (bypass optimasi compiler), dan mengorbankan type safety — error baru muncul SAAT BERJALAN, bukan saat kompilasi. Aturannya: pakai reflection di LIBRARY, hindari di LOGIKA BISNIS.

> **CATATAN SIMULASI:** Playground GoQuest tidak menjalankan package reflect. Jadi kau akan membangun yang biasanya reflect lakukan OTOMATIS — schema registry & JSON marshal — dengan TANGAN. Setelah quest ini, saat memakai \`json.Marshal(h)\` di Go sungguhan, kau tahu persis sihir apa yang terjadi di baliknya.`,
    challenge: {
      prompt:
        "Bangun mata batin versi tangan! Definisikan struct FieldInfo dengan field Name string, Kind string, JSON string. Lalu fungsi HeroSchema() yang mengembalikan []FieldInfo berisi DUA baris: {\"Name\", \"string\", \"name\"} dan {\"HP\", \"int\", \"hp\"} — metadata dari struct Hero{Name string; HP int} dengan tag json. Di main: loop hasil HeroSchema() dan cetak tiap baris: fmt.Println(f.Name, \"(\" + f.Kind + \") -> json: \" + f.JSON).",
      hint: "return []FieldInfo{{Name: \"Name\", Kind: \"string\", JSON: \"name\"}, {Name: \"HP\", Kind: \"int\", JSON: \"hp\"}} lalu for _, f := range HeroSchema() { ... }.",
      starterCode: `package main

import "fmt"

// FieldInfo = metadata satu field (yang biasanya reflect baca otomatis)
// field: Name string, Kind string, JSON string

// HeroSchema() []FieldInfo — metadata dari struct Hero:
// type Hero struct {
//     Name string \`json:"name"\`
//     HP   int    \`json:"hp"\`
// }

func main() {
    // loop hasil HeroSchema() dan cetak:
    // fmt.Println(f.Name, "(" + f.Kind + ") -> json: " + f.JSON)
}
`,
      expectedOutput: "Name (string) -> json: name\nHP (int) -> json: hp",
      validators: [
        {
          kind: "regex",
          pattern: "type\\s+FieldInfo\\s+struct",
          hint: "Definisikan struct metadata: type FieldInfo struct { Name string; Kind string; JSON string }.",
        },
        {
          kind: "regex",
          pattern: "func\\s+HeroSchema\\s*\\(\\s*\\)\\s+\\[\\]FieldInfo",
          hint: "Signature: func HeroSchema() []FieldInfo — mengembalikan tabel metadata.",
        },
      ],
    },
    boss: {
      name: "Opaque Oracle",
      emoji: "🔮",
      taunt: "Kau TIDAK tahu isi struct-ku... tidak bisa... tidak akan... JSON-mu cacat... marshal-mu gagal... buktikan kau pantas melihat ke dalam...",
      prompt:
        "Opaque Oracle menelan marshal-mu! Buat fungsi MarshalHero(h Hero) string yang mengubah struct Hero{Name string; HP int} menjadi JSON MANUAL: {\"name\":\"<Name>\",\"hp\":<HP>} — persis format json.Marshal Go. Gunakan strconv.Itoa untuk angka. Di main: buat Hero{Name: \"Aria\", HP: 100}, cetak MarshalHero(h). Ini yang encoding/json lakukan otomatis lewat reflection — kau lakukan dengan mata batin sendiri!",
      starterCode: `package main

import (
    "fmt"
    "strconv"
)

type Hero struct {
    Name string
    HP   int
}

// MarshalHero(h Hero) string → {\"name\":\"Aria\",\"hp\":100}
// Rangkai dengan: "{\"name\":\"" + h.Name + "\",\"hp\":" + strconv.Itoa(h.HP) + "}"

func main() {
    h := Hero{Name: "Aria", HP: 100}
    // cetak MarshalHero(h)
}
`,
      expectedOutput: `{"name":"Aria","hp":100}`,
      validators: [
        {
          kind: "regex",
          pattern: "func\\s+MarshalHero\\s*\\(\\s*\\w+\\s+Hero\\s*\\)\\s+string",
          hint: "Signature: func MarshalHero(h Hero) string.",
        },
        {
          kind: "includes",
          pattern: "strconv.Itoa",
          hint: "Angka tidak bisa disambung langsung ke string — konversi dengan strconv.Itoa(h.HP).",
        },
      ],
      hp: 180,
      victoryStory:
        "JSON sempurna keluar dari tanganmu, dan kabut Oracle terangkat. \"json.Marshal(h) — SATU baris itu,\" gumam biarawan tertua, \"kini tak lagi sihir bagimu. Ia membaca field lewat reflection, menghormati struct tag, dan merangkai string persis seperti yang barusan kau lakukan manual. Kekuatan sejati bukan menghafal mantra — tapi MEMAHAMINYA.\"",
    },
  },

  // ------------------------------------------------------------
  // q3-4: PERFORMANCE & PROFILING
  // ------------------------------------------------------------
  {
    id: "q3-4",
    act: 3,
    order: 4,
    title: "Kilat Utara",
    subtitle: "Performance: Mengukur Sebelum Mengoptimasi",
    emoji: "⚡",
    difficulty: "epic",
    xpReward: 300,
    goldReward: 105,
    skillId: "skill-performance",
    itemReward: "item-lightning-perf",
    story: [
      "Arena Kilat Utara: sirkuit balapan tempat mantra tercepat di realm diadu. Papan skor pprof berkilau emas, mencatat setiap nanodetik dan setiap byte yang terbuang. Para penonton bersorak setiap ada program yang runtuh oleh O(n²).",
      "\"Semua orang BISA menulis kode lambat,\" kata sang wasit arena. \"Menulis kode CEPAT itu ilmu: ukur dulu, temukan hotspot-nya, baru optimasi. Mengoptimasi tanpa mengukur itu bukan ilmu — itu takhayul.\"",
      "\"Musuhmu hari ini bukan program yang lambat — tapi program yang MENGULANG pekerjaan yang sama jutaan kali. Hancurkan Memory Leak Leviathan dengan senjata para legenda: memoization dan strings.Join.\"",
    ],
    objectives: [
      "Memahami benchmark (go test -bench) & pprof",
      "Mengoptimasi rekursi dengan memoization",
      "Menghindari string concat O(n²) di loop",
      "Kalahkan Memory Leak Leviathan",
    ],
    lesson: `## Benchmark — Angka, Bukan Perasaan

Go punya benchmark bawaan di file \`_test.go\`:

\`\`\`go
func BenchmarkFastFib(b *testing.B) {
    for i := 0; i < b.N; i++ {
        FastFib(30, map[int]int{})
    }
}
\`\`\`

\`\`\`bash
go test -bench=. -benchmem
# BenchmarkFastFib-8   2000000    850 ns/op    320 B/op   2 allocs/op
\`\`\`

\`b.N\` diatur otomatis agar hasil stabil. \`ns/op\` = nanodetik per operasi, \`B/op\` = byte yang dialokasikan, \`allocs/op\` = jumlah alokasi memori.

## pprof — Menemukan Hotspot

\`\`\`bash
go test -cpuprofile=cpu.out -bench=.
go tool pprof cpu.out
# (pprof) top — 10 fungsi paling boros CPU
\`\`\`

Optimasi tanpa profil itu seperti menembak dalam gelap.

## Memoization — Jangan Hitung Dua Kali

Fibonacci naif menghitung fib(28) BERULANG-ULANG — kompleksitas meledak jadi O(2ⁿ):

\`\`\`go
func FastFib(n int, memo map[int]int) int {
    if n < 2 {
        return n
    }
    if v, ok := memo[n]; ok { // sudah pernah dihitung? AMBIL!
        return v
    }
    v := FastFib(n-1, memo) + FastFib(n-2, memo)
    memo[n] = v // simpan untuk masa depan
    return v
}
\`\`\`

Dengan cache: O(n). fib(50) yang mustahil bagi versi naif selesai dalam sekejap.

## Jebakan String Concat di Loop

\`\`\`go
// LAMBAT: setiap += menyalin SELURUH string lama → O(n²)
s := ""
for _, w := range words {
    s += w + "-"
}

// CEPAT: satu pass, satu alokasi
s := strings.Join(words, "-")
\`\`\`

> **TIP GUILDMASTER:** \"Premature optimization is the root of all evil\" — Knuth. Tapi ukur dulu dengan benchmark SEBELUM memutuskan apa pun yang perlu dioptimasi. Angka dulu, kapak kemudian.`,
    challenge: {
      prompt:
        "Bangun kilat pertamamu! Buat fungsi FastFib(n int, memo map[int]int) int: jika n < 2 kembalikan n; jika memo[n] sudah ada (pola comma-ok: if v, ok := memo[n]; ok) kembalikan v; hitung FastFib(n-1, memo) + FastFib(n-2, memo), simpan ke memo[n], lalu kembalikan. Di main: buat memo := map[int]int{} lalu cetak 'fib(30) = ' hasil FastFib(30, memo). Versi naif fib(30) butuh 1,6 juta panggilan — versimu cukup puluhan!",
      hint: "if v, ok := memo[n]; ok { return v } adalah kuncinya — cek cache sebelum menghitung. Simpan hasil: memo[n] = v.",
      starterCode: `package main

import "fmt"

// FastFib: fibonacci dengan cache (memoization)
// 1. n < 2        → return n
// 2. memo[n] ada  → return nilai cache (pola: if v, ok := memo[n]; ok)
// 3. hitung, simpan di memo[n], return

func main() {
    memo := map[int]int{}
    fmt.Println("fib(30) =", FastFib(30, memo))
}
`,
      expectedOutput: "fib(30) = 832040",
      validators: [
        {
          kind: "regex",
          pattern: "map\\[int\\]int",
          hint: "Memo harus berupa map[int]int — kunci n, nilai hasil fib(n).",
        },
        {
          kind: "regex",
          pattern: "memo\\[\\s*\\w+\\s*\\]\\s*=",
          hint: "Simpan hasil ke cache: memo[n] = v — tanpa ini, tetap O(2^n)!",
        },
      ],
    },
    boss: {
      name: "Memory Leak Leviathan",
      emoji: "🐋",
      taunt: "AKU MEMAKAN SEMUA RAM-MU... pelan-pelan... satu salinan string demi satu salinan... kau takkan melihatku di awal... tapi di production... pukul 3 pagi... AKU ADALAH SEGALANYA...",
      prompt:
        "Memory Leak Leviathan menyembunyi dua racun di fungsi Banner: (1) result = result + words[i] + \"-\" di dalam loop menyalin SELURUH string berulang-ulang (O(n²)), dan (2) tanda '-' nyangkut di ujung hasil! Ganti seluruh implementasi Banner dengan strings.Join(words, \"-\") dari package strings. Output harus 'aria-brunto-cira-dova' — bersih, tanpa '-' di ujung.",
      starterCode: `package main

import "fmt"

// LEVIATHAN MENULAR: concat O(n²) + '-' nyangkut di ujung!
func Banner(words []string) string {
    result := ""
    for i := 0; i < len(words); i++ {
        result = result + words[i] + "-" // salin seluruh string TIAP iterasi!
    }
    return result // 'aria-brunto-cira-dova-' — LAMBAT & SALAH
}

func main() {
    words := []string{"aria", "brunto", "cira", "dova"}
    fmt.Println(Banner(words))
}
`,
      expectedOutput: "aria-brunto-cira-dova",
      validators: [
        {
          kind: "includes",
          pattern: "strings.Join",
          hint: "Ganti loop concat dengan strings.Join(words, \"-\") — satu pass, satu alokasi, tanpa '-' nyangkut.",
        },
      ],
      hp: 190,
      victoryStory:
        "Leviathan menguap menjadi gelembung memori yang padam — tak ada lagi salinan-salinan liar yang menggerogoti RAM. Sang wasit arena mengangkat tanganmu: \"Kau memahami hukum pertama performance: JANGAN MENGULANG pekerjaan. Memoization untuk hitungan, strings.Join untuk rangkaian, preallocate untuk slice. Ukur dengan benchmark, buktikan dengan pprof — dan jadilah kilat, bukan guntur yang hanya berisik.\"",
    },
  },

  // ------------------------------------------------------------
  // q3-5: REST API
  // ------------------------------------------------------------
  {
    id: "q3-5",
    act: 3,
    order: 5,
    title: "Penjaga Gerbang API",
    subtitle: "REST API: Membangun Gerbang Dunia Luar",
    emoji: "🚪",
    difficulty: "epic",
    xpReward: 320,
    goldReward: 110,
    skillId: "skill-api",
    itemReward: "item-gatekey-api",
    story: [
      "Gerbang raksasa penghubung realm Go dengan dunia luar. Ribuan request berbaris seperti panah menunggu dilepaskan — GET untuk membaca, POST untuk menciptakan, dan penjaga gerbang yang memutuskan mana yang dilayani dan mana yang ditolak.",
      "\"Dunia tidak peduli struct-mu yang cantik,\" kata penjaga gerbang. \"Mereka berbicara HTTP: method, path, status code, dan JSON. 200 berhasil. 404 hilang. 500 darurat. Pahami bahasa ini, dan realm-mu terhubung dengan segala galaxi.\"",
      "\"Kau akan membangun gerbangmu sendiri: ROUTER — peta dari 'GET /heroes' ke handler. Framework seperti Gin hanyalah router yang sudah ditempa rapi. Hari ini kau menempa versimu sendiri dari nol.\"",
    ],
    objectives: [
      "Memahami method, path, dan status code HTTP",
      "Membangun router: routing table + handler",
      "Menangani 404 untuk path tak dikenal",
      "Kalahkan CORS Chimera",
    ],
    lesson: `## Anatomi REST API

Request HTTP membawa tiga hal utama:

\`\`\`
GET /heroes/aria HTTP/1.1      ← METHOD + PATH
Host: goquest.realm
\`\`\`

Server menjawab dengan status code:

| Kode | Arti |
|------|------|
| 200 | OK — berhasil |
| 201 | Created — data baru lahir |
| 400 | Bad Request — inputmu rusak |
| 403 | Forbidden — kau dilarang masuk |
| 404 | Not Found — tak ada di sini |
| 500 | Internal Error — server terbakar |

## Router — Peta Menuju Handler

Router memetakan "METHOD + path" ke fungsi handler:

\`\`\`go
// Dengan Gin:
r := gin.Default()
r.GET("/heroes/:name", func(c *gin.Context) {
    name := c.Param("name")
    c.JSON(200, gin.H{"hero": name, "hp": 100})
})
r.Run(":8080")
\`\`\`

Dan beginilah isi router versi telanjang — yang akan kau bangun:

\`\`\`go
type Router struct {
    routes map[string]string // "GET /heroes" → response
}

func (r *Router) GET(path string, response string) {
    r.routes["GET "+path] = response
}

func (r *Router) Serve(method, path string) (string, int) {
    if resp, ok := r.routes[method+" "+path]; ok {
        return resp, 200 // ketemu → OK
    }
    return "404 page not found", 404 // tak ada → 404
}
\`\`\`

## Handler di Dunia Nyata (Gin)

\`\`\`bash
go get github.com/gin-gonic/gin
\`\`\`

\`\`\`go
r.POST("/heroes", func(c *gin.Context) {
    var h Hero
    c.BindJSON(&h)      // JSON → struct (pakai reflection!)
    c.JSON(201, h)      // struct → JSON
})
\`\`\`

> **CATATAN SIMULASI:** Playground GoQuest tidak membuka port jaringan — jadi gerbangmu bekerja secara in-memory: daftarkan route, lalu "kirim" request dengan memanggil Serve. Pola routing, status code, dan handler-nya 100% sama dengan dunia nyata.`,
    challenge: {
      prompt:
        "Bangun gerbang realm-mu! Buat struct Router dengan satu field routes map[string]string. Method pointer receiver: (1) GET(path string, response string) — simpan ke routes dengan kunci \"GET \" + path; (2) Serve(method string, path string) (string, int) — dengan comma-ok: jika routes[method+\" \"+path] ada, kembalikan (response, 200); jika tidak, kembalikan (\"404 page not found\", 404). Di main: buat Router, daftarkan r.GET(\"/heroes\", \"daftar hero\") dan r.GET(\"/quests\", \"daftar quest\"), lalu layani dua request: Serve(\"GET\", \"/heroes\") dan Serve(\"GET\", \"/monsters\") — cetak 'fmt.Println(code, \"->\", resp)' untuk masing-masing.",
      hint: "routes diisi di GET dengan r.routes[\"GET \"+path] = response. Di Serve pakai: if resp, ok := r.routes[method+\" \"+path]; ok { return resp, 200 } return \"404 page not found\", 404.",
      starterCode: `package main

import "fmt"

// Router: peta "METHOD /path" → response
type Router struct {
    routes map[string]string
}

// GET(path, response): daftarkan route "GET <path>"

// Serve(method, path) (string, int):
// - route ada → (response, 200)
// - route tak ada → ("404 page not found", 404)

func main() {
    r := Router{routes: map[string]string{}}
    r.GET("/heroes", "daftar hero")
    r.GET("/quests", "daftar quest")

    resp, code := r.Serve("GET", "/heroes")
    fmt.Println(code, "->", resp)

    resp2, code2 := r.Serve("GET", "/monsters")
    fmt.Println(code2, "->", resp2)
}
`,
      expectedOutput: "200 -> daftar hero\n404 -> 404 page not found",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s*\\(\\s*\\w+\\s+\\*Router\\s*\\)\\s+GET\\s*\\(",
          hint: "Method dengan pointer receiver: func (r *Router) GET(path string, response string).",
        },
        {
          kind: "regex",
          pattern: "func\\s*\\(\\s*\\w+\\s+\\*Router\\s*\\)\\s+Serve\\s*\\(",
          hint: "Signature: func (r *Router) Serve(method string, path string) (string, int).",
        },
      ],
    },
    boss: {
      name: "CORS Chimera",
      emoji: "🦁",
      taunt: "REQUEST-MU... DITOLAK... dari asal yang tak dikenal... gerbangmu TIDAK punya middleware... tak ada pemeriksaan... tak ada perlindungan... semua lolos... atau SEMUA MATI...",
      prompt:
        "CORS Chimera menembus gerbang tanpa pemeriksaan! Router-mu perlu MIDDLEWARE pertama: blokir path terlarang. Tambahkan (1) field baru blocked map[string]bool pada Router; (2) method Block(path string) yang menandai r.blocked[path] = true; (3) di AWAL Serve: jika r.blocked[path] ada, kembalikan (\"ditolak oleh CORS Chimera\", 403) SEBELUM memeriksa routes. main sudah mendaftarkan /heroes dan memblokir /admin, lalu melayani: GET /heroes, GET /admin, GET /monsters. Output: tiga baris — 200, 403, 404.",
      starterCode: `package main

import "fmt"

type Router struct {
    routes  map[string]string
    blocked map[string]bool // CHIMERA: proteksi hilang!
}

func (r *Router) GET(path string, response string) {
    r.routes["GET "+path] = response
}

func (r *Router) Serve(method string, path string) (string, int) {
    // CHIMERA MENGHAPUS PERIKSAAN BLOKIR DI SINI!
    // Jika r.blocked[path] ada → return "ditolak oleh CORS Chimera", 403

    if resp, ok := r.routes[method+" "+path]; ok {
        return resp, 200
    }
    return "404 page not found", 404
}

func main() {
    r := Router{
        routes:  map[string]string{},
        blocked: map[string]bool{},
    }
    r.GET("/heroes", "daftar hero")

    // middleware: blokir path admin
    r.blocked["/admin"] = true

    resp, code := r.Serve("GET", "/heroes")
    fmt.Println(code, "->", resp)
    resp2, code2 := r.Serve("GET", "/admin")
    fmt.Println(code2, "->", resp2)
    resp3, code3 := r.Serve("GET", "/monsters")
    fmt.Println(code3, "->", resp3)
}
`,
      expectedOutput:
        "200 -> daftar hero\n403 -> ditolak oleh CORS Chimera\n404 -> 404 page not found",
      validators: [
        {
          kind: "regex",
          pattern: "r\\.blocked\\[\\s*path\\s*\\]",
          hint: "Periksa blokir di awal Serve: if _, banned := r.blocked[path]; banned { return \"ditolak oleh CORS Chimera\", 403 }.",
        },
        {
          kind: "includes",
          pattern: "403",
          hint: "Path terblokir dijawab dengan status code 403 (Forbidden).",
        },
      ],
      hp: 200,
      victoryStory:
        "Chimera mengaum terakhir kali lalu mundur — gerbangmu kini punya garis pertahanan PERTAMA. Penjaga gerbang tersenyum: \"Middleware adalah lapisan baja di antara dunia liar dan realm-mu: CORS, autentikasi, rate-limit, logging... semuanya pola yang barusan kau tulis — periksa SEBELUM melayani. Di Gin: r.Use(AuthMiddleware()). Di gerbangmu: satu if di awal Serve. Sama saja — hanya skala yang berbeda.\"",
    },
  },

  // ------------------------------------------------------------
  // q3-6: DATABASE
  // ------------------------------------------------------------
  {
    id: "q3-6",
    act: 3,
    order: 6,
    title: "Penjaga Vault",
    subtitle: "Database: Mengelola Ingatan Abadi Realm",
    emoji: "🗄️",
    difficulty: "epic",
    xpReward: 350,
    goldReward: 120,
    skillId: "skill-database",
    itemReward: "item-vaultkey-db",
    story: [
      "Vault abadi tempat seluruh kenangan realm tersimpan — setiap hero yang pernah lahir, setiap quest yang pernah dituntaskan. Barang siapa menguasainya mampu memanggil kembali data dari kehampaan... selama tahu mantranya.",
      "\"Dunia luar menyebutnya database,\" kata Penjaga Vault sambil membuka pintu baja. \"Kau akan bertemu tiga mazhab: SQL mentah — penuh kendali, penuh tangan kotor; GORM — ORM yang memetakan struct ke tabel dengan reflection; dan sqlc — SQL-first yang menghasilkan kode Go yang type-safe.\"",
      "\"Tapi jauh di dalam, semuanya memuja pola yang sama: REPOSITORY — satu pintu untuk menyimpan, mencari, dan menghapus. Hari ini kau membangun vault-mu sendiri — dan menghadapi ular paling tua di realm: SQL Injection Serpent.\"",
    ],
    objectives: [
      "Memahami SQL, ORM (GORM), dan sqlc",
      "Membangun pola repository (Save/Find)",
      "Mencegah N+1 dan memilih index",
      "Kalahkan SQL Injection Serpent",
    ],
    lesson: `## Tiga Mazhab Database

**1. database/sql — SQL mentah, kendali penuh:**

\`\`\`go
db, _ := sql.Open("sqlite3", "quest.db")
row := db.QueryRow("SELECT name, hp FROM heroes WHERE name = ?", name)
\`\`\`

**2. GORM — ORM, struct jadi tabel:**

\`\`\`go
db, _ := gorm.Open(sqlite.Open("quest.db"), &gorm.Config{})
db.AutoMigrate(&Hero{})             // buat tabel dari struct!
db.Create(&Hero{Name: "Aria", HP: 100}) // INSERT otomatis

var hero Hero
db.First(&hero, "name = ?", "Aria")     // SELECT otomatis
\`\`\`

**3. sqlc — SQL-first, kode dihasilkan:**

Tulis SQL di file \`.sql\`, sqlc menghasilkan fungsi Go yang type-safe. Kau menulis SQL (ahli), compiler menjaga tipe (ketat).

## Pola Repository — Satu Pintu

Tak mazhab mana pun, pola lapisan data terbaiknya sama:

\`\`\`go
type HeroRepo struct {
    db *sql.DB
}

func (r *HeroRepo) Save(h Hero) error   { ... } // INSERT/UPDATE
func (r *HeroRepo) Find(name string) (Hero, error) { ... } // SELECT
\`\`\`

Logika bisnismu TIDAK PERNAH menyentuh SQL langsung — hanya lewat repo. Ganti SQLite → PostgreSQL tanpa menyentuh handler.

### Waspada N+1

\`\`\`go
// BENCANA: 1 query guild + 1000 query hero = 1001 query!
for _, g := range guilds {
    db.First(&g.Hero, g.HeroID)
}
// OBAT: preload / JOIN — satu query untuk semuanya
db.Preload("Heroes").Find(&guilds)
\`\`\`

> **CATATAN SIMULASI:** Playground GoQuest tidak membuka koneksi database — vault-mu akan in-memory (map). Pola Save/Find/sentinel-nya persis repository sungguhan; setelah quest ini, GORM akan terasa seperti memakai vault yang sudah kau bangun sendiri.`,
    challenge: {
      prompt:
        "Bangun vault in-memory! Buat struct Vault dengan field heroes map[string]int. Buat fungsi NewVault() Vault yang mengembalikan Vault dengan map kosong. Method pointer receiver: (1) Save(name string, hp int) — simpan v.heroes[name] = hp; (2) Find(name string) int — dengan comma-ok ambil v.heroes[name]; jika TIDAK ada kembalikan -1 (sentinel 'tidak ditemukan'), jika ada kembalikan hp-nya. main sudah disediakan: menyimpan aria=100 dan brunto=85, lalu mencetak hasil Find(\"aria\"), Find(\"hantu\"), dan total record len(v.heroes).",
      hint: "Di Find: hp, ok := v.heroes[name]; if !ok { return -1 }; return hp. Pemanggilan: v := NewVault(); v.Save(\"aria\", 100).",
      starterCode: `package main

import "fmt"

// Vault = repository in-memory untuk data hero
type Vault struct {
    heroes map[string]int
}

// NewVault() Vault — vault baru dengan map kosong

// Save(name string, hp int)  — simpan/ubah record
// Find(name string) int      — -1 jika tak ada, hp jika ada

func main() {
    v := NewVault()
    v.Save("aria", 100)
    v.Save("brunto", 85)

    fmt.Println("aria:", v.Find("aria"))
    fmt.Println("hantu:", v.Find("hantu"))
    fmt.Println("total record:", len(v.heroes))
}
`,
      expectedOutput: "aria: 100\nhantu: -1\ntotal record: 2",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s+NewVault\\s*\\(\\s*\\)\\s+Vault",
          hint: "Constructor: func NewVault() Vault { return Vault{heroes: map[string]int{}} }.",
        },
        {
          kind: "regex",
          pattern: "func\\s*\\(\\s*\\w+\\s+\\*Vault\\s*\\)\\s+Save\\s*\\(",
          hint: "Method penyimpanan dengan pointer receiver: func (v *Vault) Save(name string, hp int).",
        },
      ],
    },
    boss: {
      name: "SQL Injection Serpent",
      emoji: "🐍",
      taunt: "Sssserahkan datamu... aku menyusup lewat input... 'x'; DROP TABLE heroes;-- ... satu string licik... dan seluruh tabel-mu... HILANG... sss...",
      prompt:
        "SQL Injection Serpent menyusup lewat input mentah! Fungsi FindHeroRaw menempelkan name LANGSUNG ke query — input jahat seperti \"x'; DROP TABLE heroes;--\" menjadi perintah yang merusak. Bangun pertahanan: fungsi FindHeroSafe(name string) (string, error) — jika name mengandung tanda kutip tunggal ( ' ), titik koma ( ; ), atau \"--\" (periksa dengan strings.Contains), kembalikan (\"\", errors.New(\"input berbahaya ditolak\")); jika bersih, kembalikan (\"SELECT * FROM heroes WHERE name = '\" + name + \"'\", nil). main sudah disediakan: uji input 'aria' (bersih) dan input serangan (ditolak).",
      starterCode: `package main

import (
    "errors"
    "fmt"
    "strings"
)

// BERBAHAYA: input mentah ditempel langsung ke query!
func FindHeroRaw(name string) string {
    return "SELECT * FROM heroes WHERE name = '" + name + "'"
}

// FindHeroSafe(name) (string, error):
// - mengandung "'" atau ";" atau "--" → ("", errors.New("input berbahaya ditolak"))
// - bersih → (query valid, nil)

func main() {
    // ujian 1: input bersih
    q1, err1 := FindHeroSafe("aria")
    if err1 != nil {
        fmt.Println("error:", err1)
    } else {
        fmt.Println(q1)
    }

    // ujian 2: SERANGAN INJECTION!
    q2, err2 := FindHeroSafe("x'; DROP TABLE heroes;--")
    if err2 != nil {
        fmt.Println("error:", err2)
    } else {
        fmt.Println(q2)
    }
}
`,
      expectedOutput:
        "SELECT * FROM heroes WHERE name = 'aria'\nerror: input berbahaya ditolak",
      validators: [
        {
          kind: "includes",
          pattern: "strings.Contains",
          hint: "Periksa karakter berbahaya dengan strings.Contains(name, \"'\") — dan juga \";\" serta \"--\".",
        },
        {
          kind: "includes",
          pattern: "errors.New",
          hint: "Tolak input jahat dengan error: errors.New(\"input berbahaya ditolak\").",
        },
      ],
      hp: 220,
      victoryStory:
        "Serpent menggeliat lalu membatu — input jahatnya menabrak tembok validasi. Penjaga Vault mengunci pintu baja: \"Di dunia nyata, pertahanan sejati bukan validasi manual — tapi PARAMETERIZED QUERY: db.Query(\\\"SELECT ... WHERE name = ?\\\", name) — driver mengirim input sebagai DATA, bukan kode, sehingga injection mustahil. Validasimu barusan adalah lapisan pertama; placeholder ? adalah benteng terakhir. Keduanya dipasang? Vault-mu nyaris mustahil ditembus.\"",
    },
  },

  // ------------------------------------------------------------
  // q3-7: DEPLOY — FINAL BOSS
  // ------------------------------------------------------------
  {
    id: "q3-7",
    act: 3,
    order: 7,
    title: "Kenaikan Realm",
    subtitle: "Deploy & Production: Ujian Akhir Sang Legenda",
    emoji: "🚀",
    difficulty: "epic",
    xpReward: 600,
    goldReward: 250,
    skillId: "skill-deploy",
    itemReward: "item-crown-legend",
    story: [
      "Puncak tertinggi realm: Platform of Ascension. Di atasnya, mahkota Crown of Go Legend mengambang dikelilingi badai data. Menara-menara server berdenyut di kejauhan; kabut production membungkus segalanya.",
      "\"Di bawah sana, kode yang jalan di laptopmu adalah mainan,\" Zephyrus berbisik. \"Di sini, kode-mu melayani jutaan pengguna: yang tidur pada jam 3 pagi, yang bangun saat server mati, yang tidak pernah tahu namamu tapi bergantung padamu.\"",
      "\"Docker untuk mengemas. Env untuk konfigurasi. Graceful shutdown untuk pamit yang sopan. Health check untuk detak jantung. Ini ujian terakhirmu — Downtime Dragon sudah menunggu di gerbang production. Kalahkan dia... dan mahkota itu MILIKMU.\"",
    ],
    objectives: [
      "Memahami Docker multi-stage build",
      "Konfigurasi lewat environment variable",
      "Menerapkan graceful shutdown (defer + break)",
      "KALAHKAN DOWNTIME DRAGON — FINAL BOSS",
    ],
    lesson: `## Docker — Kemas Realm-mu

Multi-stage build = image kecil dan aman:

\`\`\`dockerfile
# TAHAP 1: bangun binary
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o /quest .

# TAHAP 2: image final — hanya binary-nya
FROM alpine:latest
COPY --from=builder /quest /quest
EXPOSE 8080
CMD ["/quest"]
\`\`\`

Image 15MB, bukan 1GB — karena compiler Go TIDAK ikut ke production.

## Konfigurasi — Jangan Hardcode!

\`\`\`go
port := os.Getenv("PORT")        // dari environment!
if port == "" {
    port = "8080" // default
}
\`\`\`

Port, database URL, secret — SEMUA lewat env var. Kode yang sama, perilaku beda, tanpa recompile.

## Graceful Shutdown — Pamit yang Sopan

\`\`\`go
srv := &http.Server{Addr: ":8080"}

go func() {
    if err := srv.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}()

// tunggu sinyal SIGTERM (mis. docker stop)
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGTERM)
<-quit
log.Println("shutdown dimulai...")

// beri waktu 5 detik: selesaikan request yang sedang jalan
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
srv.Shutdown(ctx) // pamit sopan — bukan mati mendadak
\`\`\`

Tanpa graceful shutdown: request terpotong di tengah, data setengah jadi, pengguna marah. Dengan: dunia berpisah dengan damai.

## Health Check — Detak Jantung

\`\`\`go
r.GET("/health", func(c *gin.Context) {
    c.JSON(200, gin.H{"status": "ok"})
})
\`\`\`

Docker/Kubernetes mengecek /health secara berkala — server yang tak menjawab akan dimatikan dan diganti.

> **CATATAN SIMULASI:** Playground tidak menjalankan Docker ataupun sinyal OS — jadi lifecyclemu disimulasikan: boot, layani request, tangani sinyal (break), dan defer menjalankan cleanup di akhir. Persis urutan graceful shutdown sungguhan.

> **TIP GUILDMASTER:** Production bukan tempat bereksperimen — semua yang bisa diprediksi, PREDIKSI. Setiap yang bisa gagal, RENCANAKAN kegagalannya. Legenda bukan yang tak pernah gagal — tapi yang gagal dengan rencana.`,
    challenge: {
      prompt:
        "Nyalakan layanan pertamamu! Di main: (1) cetak \"[boot] GoQuest API berjalan di :8080\"; (2) daftarkan defer fmt.Println(\"[shutdown] server ditutup dengan anggun\"); (3) loop requests := []string{\"/heroes\", \"/quests\", \"/dragon\", \"/health\"}: jika req == \"/dragon\" cetak \"[500] /dragon - internal error, hentikan proses\" lalu BREAK; selain itu cetak \"[200] <req>\" dan tambah handled; (4) setelah loop cetak \"[stats] <handled> request ditangani\". Perhatikan: defer berjalan PALING AKHIR — itulah cleanup yang anggun.",
      hint: "Urutan: Println boot → defer Println shutdown → loop dengan if req == \"/dragon\" { ...; break } → Println stats. Defer akan mencetak baris TERAKHIR setelah semuanya selesai.",
      starterCode: `package main

import "fmt"

func main() {
    // 1. Boot: "[boot] GoQuest API berjalan di :8080"
    // 2. defer: "[shutdown] server ditutup dengan anggun"
    // 3. Loop requests: /heroes, /quests, /dragon, /health
    //    "/dragon" → "[500] /dragon - internal error, hentikan proses" + break
    //    lainnya   → "[200] <req>" + handled++
    // 4. Akhir: "[stats] <handled> request ditangani"
}
`,
      expectedOutput:
        "[boot] GoQuest API berjalan di :8080\n[200] /heroes\n[200] /quests\n[500] /dragon - internal error, hentikan proses\n[stats] 2 request ditangani\n[shutdown] server ditutup dengan anggun",
      validators: [
        {
          kind: "regex",
          pattern: "defer\\s+fmt\\.Println",
          hint: "Daftarkan cleanup SEBELUM melayani request: defer fmt.Println(\"[shutdown] server ditutup dengan anggun\").",
        },
        {
          kind: "includes",
          pattern: "break",
          hint: "Hentikan loop saat error fatal: break — jangan layani request setelah server terluka.",
        },
      ],
    },
    boss: {
      name: "Downtime Dragon",
      emoji: "🐲",
      taunt: "AKU ADALAH KETAKUTAN SETIAP ENGINEER... PUKUL 3 PAGI... PRODUCTION DOWN... RIBUAN PENGGUNA TERBANGUN... DAN SEMUA MATA... MEMANDANGMU... runtuhlah bersamaku... TANPA graceful shutdown...",
      prompt:
        "FINAL BOSS! Downtime Dragon meracuni server: saat error /dragon datang, server TETAP melayani request berikutnya tanpa peduli — dan saat program berakhir, TIDAK ADA cleanup. Pulihkan tiga ritual production: (1) daftarkan defer fmt.Println(\"[shutdown] koneksi ditutup\") SEGERA setelah baris boot; (2) saat req == \"/dragon\", cetak \"[500] /dragon - internal error\" lalu \"[shutdown] berhenti menerima request baru\" lalu BREAK — jangan layani request setelah error; (3) setelah loop, cetak \"[stats] <handled> request ditangani\". Output lengkap harus 7 baris — baris terakhir adalah cleanup dari defer.",
      starterCode: `package main

import "fmt"

func main() {
    fmt.Println("[boot] server siap")

    requests := []string{"/health", "/status", "/dragon", "/users"}
    handled := 0
    for _, req := range requests {
        if req == "/dragon" {
            fmt.Println("[500]", req, "- internal error")
            fmt.Println("[shutdown] berhenti menerima request baru")
            // DRAGON MERUSAK: tidak ada break — request tetap dilayani!
            continue
        }
        fmt.Println("[200]", req)
        handled++
    }
    fmt.Println("[stats]", handled, "request ditangani")

    // DRAGON MENGHAPUS CLEANUP: tidak ada defer shutdown!
}
`,
      expectedOutput:
        "[boot] server siap\n[200] /health\n[200] /status\n[500] /dragon - internal error\n[shutdown] berhenti menerima request baru\n[stats] 2 request ditangani\n[shutdown] koneksi ditutup",
      validators: [
        {
          kind: "regex",
          pattern: "defer\\s+fmt\\.Println\\s*\\(\\s*\"\\[shutdown\\] koneksi ditutup\"\\s*\\)",
          hint: "Daftarkan cleanup setelah boot: defer fmt.Println(\"[shutdown] koneksi ditutup\") — berjalan otomatis di akhir, apa pun yang terjadi.",
        },
        {
          kind: "regex",
          pattern: "break",
          hint: "Ganti continue dengan break — server yang terluka berhenti menerima request baru.",
        },
      ],
      hp: 300,
      victoryStory:
        "Downtime Dragon jatuh perlahan — dan untuk pertama kalinya dalam sejarah realm, ia jatuh dengan ANGKUN: request tersisa ditolak sopan, koneksi ditutup bersih, statistik tercatat. Badai data di atas Platform of Ascension padam. Zephyrus menurunkan Crown of Go Legend ke kepalamu: \"Dari Hello World hingga graceful shutdown... kau telah menempuh seluruh jalan. Tapi ingat, legenda — mahkota ini bukan akhir. Ini TANGGUNG JAWAB. Production menunggumu. Tulis kode seolah ia akan bangunkanmu jam 3 pagi.\"",
    },
  },
];
