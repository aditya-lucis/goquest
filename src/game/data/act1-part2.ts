import type { Quest } from "../types";

// ============================================================
// ACT 1: AWAKENING — Quest 5-7 (termasuk Boss Act 1)
// ============================================================

export const ACT1_QUESTS_PART2: Quest[] = [
  // ------------------------------------------------------------
  {
    id: "q1-5",
    act: 1,
    order: 5,
    title: "Bengkel Mantra",
    subtitle: "Function: Senjata yang Bisa Dipakai Ulang",
    emoji: "🪄",
    difficulty: "normal",
    xpReward: 110,
    goldReward: 40,
    skillId: "skill-function",
    itemReward: "item-spellbook",
    story: [
      "Asap dan percikan api menyambutmu di Bengkel Mantra. Paladin tua bernama Forgia sedang menempa sesuatu — bukan pedang, melainkan baris-baris cahaya yang berputar membentuk bunga api.",
      "\"Aku tidak menempa besi,\" katanya tanpa menoleh. \"Aku menempa PERINTAH. Sekali kau menempa function yang baik, kau bisa memanggilnya ribuan kali tanpa menulis ulang. Itu rahasia para master.\"",
      "Ia melempar palu ke arahmu. \"Tangkap. Sekarang tempa mantramu sendiri — dan jangan biarkan Recursion Demon memakan mantramu tanpa dasar yang kokoh.\"",
    ],
    objectives: [
      "Deklarasikan function dengan parameter & return value",
      "Kuasai multiple return value (khas Go!)",
      "Pahami named return value",
      "Kalahkan Recursion Demon",
    ],
    lesson: `## Menempa Mantra Baru

Function = mantra bernama yang bisa dipanggil kapan saja:

\`\`\`go
// func NAMA(parameter TIPE) TIPE-KEMBALIAN
func attackDamage(base int, bonus int) int {
    return base + bonus
}

// memanggil:
damage := attackDamage(50, 20) // damage = 70
\`\`\`

Perhatikan urutan anehnya bagi pemula: **nama dulu, baru tipe** (\`base int\`, bukan \`int base\`). Ini keputusan desain Go agar lebih mudah dibaca dari kiri ke kanan.

### Multiple Return — Ciri Khas Go

Function Go bisa mengembalikan BANYAK nilai sekaligus:

\`\`\`go
func attack(base int, bonus int) (int, string) {
    return base + bonus, "serangan berhasim!"
}

damage, message := attack(50, 20)
\`\`\`

Pola ini adalah fondasi **error handling** Go yang akan kau pelajari di Act 2: \`value, err := sesuatu()\`.

### Nilai Kembali Bernama (Named Return)

\`\`\`go
func heal(hp int, amount int) (newHp int) {
    newHp = hp + amount
    if newHp > 100 {
        newHp = 100 // tidak melebihi batas
    }
    return // otomatis mengembalikan newHp
}
\`\`\`

### Function Adalah Nilai

\`\`\`go
greeting := func(name string) string {
    return "Hai, " + name
}
fmt.Println(greeting("Gopher"))
\`\`\`

> **TIP FORGIA:** Function yang baik melakukan SATU hal dan melakukannya dengan baik. Jika mantramu butuh 5 parameter dan 50 baris, pecah menjadi beberapa mantra kecil.`,
    challenge: {
      prompt:
        "Tempa dua mantra di Bengkel: (1) fungsi attackDamage(base int, bonus int) int yang mengembalikan base + bonus. (2) fungsi heal(hp int, amount int) int yang mengembalikan hp + amount, MAKSIMAL 100 (jika lebih, jadikan 100). Lalu di main: cetak 'Damage: 85' dari attackDamage(60, 25), dan 'HP: 100' dari heal(90, 20).",
      hint: "Di dalam heal, gunakan if untuk membatasi hasil maksimal 100. fmt.Println(\"Damage:\", attackDamage(60, 25)) bisa langsung mencetak hasilnya.",
      starterCode: `package main

import "fmt"

// Tempa fungsi attackDamage di sini

// Tempa fungsi heal di sini (maksimal hasil 100)

func main() {
    fmt.Println("Damage:", attackDamage(60, 25))
    fmt.Println("HP:", heal(90, 20))
}
`,
      expectedOutput: "Damage: 85\nHP: 100",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s+attackDamage\\s*\\(",
          hint: "Deklarasikan fungsi bernama attackDamage: func attackDamage(base int, bonus int) int { ... }",
        },
        {
          kind: "regex",
          pattern: "func\\s+heal\\s*\\(",
          hint: "Deklarasikan fungsi bernama heal: func heal(hp int, amount int) int { ... }",
        },
      ],
    },
    boss: {
      name: "Recursion Demon",
      emoji: "😈",
      taunt: "fact(5) memanggil fact(4)... fact(4) memanggil fact(3)... fact(3) memanggil fact(2)... TIDAK ADA DASARNYA! TIDAK AKAN BERHENTI! Telan stack-ku semua!!",
      prompt:
        "Recursion Demon mengutuk fungsi factorial agar memanggil dirinya sendiri TANPA kondisi berhenti (base case). Tambahkan kondisi berhenti agar output: '5! = 120'. Petunjuk: factorial(0) atau factorial(1) = 1.",
      starterCode: `package main

import "fmt"

func factorial(n int) int {
    // Base case-nya hilang ditelan demon...
    return n * factorial(n-1)
}

func main() {
    fmt.Println("5! =", factorial(5))
}
`,
      expectedOutput: "5! = 120",
      validators: [
        {
          kind: "regex",
          pattern: "if\\s+n\\s*<=?\\s*1|if\\s+n\\s*==\\s*(0|1)",
          hint: "Tambahkan kondisi berhenti di awal fungsi: jika n <= 1, kembalikan 1 tanpa memanggil factorial lagi.",
        },
      ],
      hp: 80,
      victoryStory:
        "Recursion Demon menggigit ekornya sendiri dan menguap ke udara. \"Bagus!\" Forgia mengangkat palunya. \"Recursion itu indah TAPI harus punya pintu keluar. Setiap kali kau menulis fungsi rekursif, tanyakan: 'kapan ia BERHENTI memanggil dirinya?'\"",
    },
  },

  // ------------------------------------------------------------
  {
    id: "q1-6",
    act: 1,
    order: 6,
    title: "Tas Penyimpanan Ajaib",
    subtitle: "Array, Slice, dan Map",
    emoji: "🎒",
    difficulty: "hard",
    xpReward: 120,
    goldReward: 45,
    skillId: "skill-collection",
    itemReward: "item-bag-holding",
    story: [
      "Kau tiba di gudang artifact milik guild. Rak-rak tak terbatas memanjat setinggi menara, dan sebuah tas kulit tua tergantung di tengah — tas yang perutnya ternyata berisi DIMENSI LAIN.",
      "\"Bag of Holding,\" bisik Zephyrus. \"Di dunia Go, kita menyimpan koleksi dengan tiga cara: array yang ukurannya terkunci, slice yang bisa membesar sendiri, dan map yang memetakan kunci ke nilai.\"",
      "\"Sang Penjaga Gudang — Slice Serpent — tidur di rak nomor tiga. Ia gemar menggigit index yang tidak ada. Kuasai koleksi, dan tas ini menjadi milikmu.\"",
    ],
    objectives: [
      "Bedakan array (fixed) vs slice (dinamis)",
      "Kuasai append, len, dan slicing",
      "Gunakan map dengan make dan map literal",
      "Telusuri koleksi dengan for range",
      "Kalahkan Slice Serpent",
    ],
    lesson: `## Array — Kotak dengan Jumlah Terkunci

\`\`\`go
var runes [3]string          // 3 slot, terisi zero value ""
runes[0] = "Fire"            // isi slot pertama (index mulai dari 0!)
primes := [4]int{2, 3, 5, 7} // deklarasi + isi langsung

fmt.Println(len(primes))     // 4 — len() menghitung jumlah elemen
\`\`\`

Sekali array lahir dengan 4 slot, ia SELAMANYA 4 slot. Kaku? Ya — makanya di praktiknya kita lebih sering memakai...

## Slice — Tas yang Membesar Sendiri

\`\`\`go
spells := []string{"Fire", "Ice"} // perhatikan: TIDAK ada angka → slice!
spells = append(spells, "Thunder") // bertambah sendiri!

fmt.Println(spells[0])   // "Fire" — index mulai dari 0
fmt.Println(len(spells)) // 3
\`\`\`

**append** adalah mantra pertumbuhan — ia mengembalikan slice BARU, jadi selalu tulis \`spells = append(spells, ...)\`.

### Slicing — Mengambil Bagian

\`\`\`go
numbers := []int{10, 20, 30, 40, 50}
part := numbers[1:4] // ambil index 1, 2, 3 → [20 30 40]
\`\`\`

Irisan \`[1:4]\` berarti \"mulai index 1, berhenti SEBELUM index 4\".

## Map — Buku Sihir Kunci → Nilai

\`\`\`go
// cara 1: make
damage := make(map[string]int)
damage["fire"] = 50
damage["ice"] = 35

// cara 2: literal langsung
hp := map[string]int{
    "hero":  100,
    "goblin": 30,
}

fmt.Println(hp["hero"]) // 100
\`\`\

### Idiom "ok" — Apakah Kunci Ini Ada?

\`\`\`go
value, ok := damage["thunder"]
if ok {
    fmt.Println("Ditemukan:", value)
} else {
    fmt.Println("Mantra tidak dikenal")
}
\`\`\`

## Menelusuri dengan range

\`\`\`go
for index, value := range spells {
    fmt.Println(index, "→", value)
}
for key, value := range hp {
    fmt.Println(key, "=", value)
}
\`\`\`

> **TIP GUILDMASTER:** Lupa index? Pakai \`for _, v := range\`. Tidak pakai nilai juga? \`for i := range\`. Go melarang variable menganggur — ini menjaga kode tetap bersih.`,
    challenge: {
      prompt:
        "Kelola party-mu! Buat slice party berisi 3 nama: \"Aria\", \"Bram\", \"Cinta\". Buat map damage berisi \"Aria\":50, \"Bram\":35, \"Cinta\":42. Dengan satu loop range, cetak 3 baris laporan: 'Aria memberikan 50 damage', 'Bram memberikan 35 damage', 'Cinta memberikan 42 damage'.",
      hint: "for _, name := range party { fmt.Println(name, \"memberikan\", damage[name], \"damage\") } — gunakan nama dari slice untuk mengakses map.",
      starterCode: `package main

import "fmt"

func main() {
    // Buat slice party dengan 3 nama
    // Buat map damage untuk tiap anggota

    // Loop dan cetak laporan damage tiap anggota
}
`,
      expectedOutput:
        "Aria memberikan 50 damage\nBram memberikan 35 damage\nCinta memberikan 42 damage",
      validators: [
        {
          kind: "regex",
          pattern: "\\[\\]string\\{|\\[\\]string\\s*\\{",
          hint: "Deklarasikan slice string, contoh: party := []string{\"Aria\", \"Bram\", \"Cinta\"}",
        },
        {
          kind: "regex",
          pattern: "map\\[string\\]int",
          hint: "Deklarasikan map dengan tipe map[string]int untuk damage tiap hero.",
        },
        {
          kind: "includes",
          pattern: "range",
          hint: "Gunakan for ... range untuk menelusuri party.",
        },
      ],
    },
    boss: {
      name: "Slice Serpent",
      emoji: "🐍",
      taunt: "Sssss... tiga elemen... kau ingin membaca index ke tiga? SSSSAYA SIAP MENGIGIT! stack... overflow... sss...",
      prompt:
        "Slice Serpent menyesatkan seorang adventurer memakai kondisi i <= 3 pada slice berisi 3 elemen (index sah: 0, 1, 2). Perbaiki loop agar mencetak seluruh mantra tanpa panic: 'Fire', 'Ice', 'Thunder'.",
      starterCode: `package main

import "fmt"

func main() {
    spells := []string{"Fire", "Ice", "Thunder"}

    for i := 0; i <= 3; i++ {
        fmt.Println(spells[i])
    }
}
`,
      expectedOutput: "Fire\nIce\nThunder",
      validators: [
        {
          kind: "regex",
          pattern: "i\\s*<\\s*len\\(spells\\)|i\\s*<\\s*3|range\\s+spells",
          hint: "Perbaiki kondisi loop: gunakan i < len(spells) (atau i < 3). Index terakhir slice 3 elemen adalah 2, bukan 3.",
        },
      ],
      hp: 90,
      victoryStory:
        "Slice Serpent melilit dirinya sendiri dan menyusut jadi ukuran saku. Zephyrus menggantungkan Bag of Holding di bahumu: \"Tiga koleksi, tiga kepribadian: array si kaku, slice si lentur, map si pencatat. Pilih sesuai medan perang.\"",
    },
  },

  // ------------------------------------------------------------
  {
    id: "q1-7",
    act: 1,
    order: 7,
    title: "Cetak Biru Golem",
    subtitle: "Struct & Method — BOSS AKHIR ACT 1",
    emoji: "🗿",
    difficulty: "epic",
    xpReward: 200,
    goldReward: 100,
    skillId: "skill-struct",
    itemReward: "item-sword-pointers",
    story: [
      "Gempa mengguncang seluruh realm. Di gerbang terakhir Act 1, sebuah golem purba setinggi menara bangkit dari reruntuhan — tubuhnya tersusun dari blok cahaya yang menyala redup. Di dadanya, sebuah rongga kosong berbentuk... struct.",
      "\"THE NULL GOLEM,\" suara Zephyrus bergetar. \"Ia dibangun oleh peradaban kuno, tapi cetak birunya tak pernah dilengkapi. Tanpa field dan method, ia hanya bertubuh kosong yang mengamuk.\"",
      "\"Kau telah menguasai variable, kontrol alur, function, dan koleksi. Kini satukan SEMUANYA ke dalam cetak biru ini. Definisikan jiwanya... dan golem akan tunduk sebagai sekutumu.\"",
      "Ini dia. Ujian akhir Awakening. Jika kau lolos, Sword of Pointers — pedang legendaris penunjuk alamat memori — akan memilihmu sebagai pemiliknya.",
    ],
    objectives: [
      "Definisikan struct dengan berbagai tipe field",
      "Buat instance struct dengan struct literal",
      "Buat method dengan value receiver",
      "MINI PROJECT: Lengkapi cetak biru The Null Golem",
    ],
    lesson: `## Struct — Cetak Biru Makhluk Baru

Struct menggabungkan beberapa nilai menjadi SATU entitas:

\`\`\`go
type Hero struct {
    Name   string // PascalCase = bisa diakses dari package lain
    Level  int
    HP     float64
    Alive  bool
}

// menciptakan instance:
aria := Hero{Name: "Aria", Level: 7, HP: 97.5, Alive: true}

// mengakses field dengan titik:
fmt.Println(aria.Name)  // "Aria"
aria.Level = 8          // mengubah field
\`\`\`

### Struct dalam Slice — Pasukan Adventurer

\`\`\`go
party := []Hero{
    {Name: "Aria", Level: 7},
    {Name: "Bram", Level: 5},
}
for _, h := range party {
    fmt.Println(h.Name, h.Level)
}
\`\`\

## Method — Mantra yang Melekat pada Tipe

Method = function milik sebuah tipe:

\`\`\`go
// (h Hero) disebut RECEIVER — "fungsi ini milik semua Hero"
func (h Hero) BattleCry() string {
    return h.Name + " menyerang dengan keberanian!"
}

func (h Hero) IsDead() bool {
    return h.HP <= 0
}

// pemanggilan:
fmt.Println(aria.BattleCry())
\`\`\`

### Value vs Pointer Receiver (pengantar)

\`\`\`go
// value receiver: bekerja pada SALINAN hero
func (h Hero) PeekHP() int { return int(h.HP) }

// pointer receiver: mengubah hero ASLI
func (h *Hero) TakeDamage(dmg float64) {
    h.HP -= dmg
}
\`\`\`

Aturan praktis: butuh **mengubah** si pemilik? Pointer receiver \`*Hero\`. Cuma membaca? Value receiver cukup. (Kita dalami pointer di Act 2!)

> **TIP AKHIR ACT:** Struct + method + slice + loop = 90% kode Go di dunia nyata. Kuasai kombinasi ini, dan kau siap memasuki The Power Within.`,
    challenge: {
      prompt:
        "Buat pasukanmu! Definisikan struct Hero dengan field Name string dan Level int. Buat method BattleCry() string yang mengembalikan Name + \" siap bertarung!\". Buat method NextLevel() int yang mengembalikan Level + 1. Lalu di main: buat hero Aria level 7, cetak 'Aria siap bertarung!' (hasil BattleCry) dan 'Level berikutnya: 8'.",
      hint: "Method dideklarasikan: func (h Hero) BattleCry() string { return h.Name + \" siap bertarung!\" }",
      starterCode: `package main

import "fmt"

// Definisikan struct Hero dengan field Name (string) dan Level (int)

// Method BattleCry() string → Name + " siap bertarung!"

// Method NextLevel() int → Level + 1

func main() {
    // Buat hero Aria level 7, lalu cetak hasil kedua method-nya
}
`,
      expectedOutput: "Aria siap bertarung!\nLevel berikutnya: 8",
      validators: [
        {
          kind: "regex",
          pattern: "type\\s+Hero\\s+struct",
          hint: "Definisikan struct dengan: type Hero struct { ... }",
        },
        {
          kind: "regex",
          pattern: "func\\s*\\(\\s*\\w+\\s+Hero\\s*\\)\\s+BattleCry",
          hint: "Method BattleCry milik Hero: func (h Hero) BattleCry() string { ... }",
        },
      ],
    },
    boss: {
      name: "The Null Golem",
      emoji: "🗿",
      taunt: "...NULL... KOSONG... AKU TIDAK PUNYA NAMA... TIDAK PUNYA HP... TIDAK PUNYA SERANGAN... LENGKAPI AKU... ATAU HANCUR BERSAMAKU...",
      prompt:
        "MINI PROJECT AKHIR ACT 1 — Lengkapi cetak biru The Null Golem! Isi struct Monster dengan field Name string, HP int, Damage int. Buat method Roar() yang mencetak \"<Name> mengaum: GRAAA!\" dan method Attack() int yang mengembalikan Damage + 10. Setelah cetak biru lengkap, ciptakan golem bernama \"Null Golem\" dengan HP 500 dan Damage 45. Cetak: 'Null Golem mengaum: GRAAA!' lalu 'Serangan golem: 55' lalu 'Cetak biru lengkap. Golem kini tunduk padamu.'.",
      hint: "Method Roar bisa langsung fmt.Println di dalamnya. Method Attack mengembalikan int: func (m Monster) Attack() int { return m.Damage + 10 }.",
      starterCode: `package main

import "fmt"

// LENGKAPI: struct Monster dengan field Name, HP, Damage

// LENGKAPI: method Roar() — cetak "<Name> mengaum: GRAAA!"

// LENGKAPI: method Attack() int — kembalikan Damage + 10

func main() {
    // Ciptakan golem: Name "Null Golem", HP 500, Damage 45
    // Panggil Roar(), cetak "Serangan golem: <hasil Attack()>"
    // Terakhir cetak: "Cetak biru lengkap. Golem kini tunduk padamu."
}
`,
      expectedOutput:
        "Null Golem mengaum: GRAAA!\nSerangan golem: 55\nCetak biru lengkap. Golem kini tunduk padamu.",
      validators: [
        {
          kind: "regex",
          pattern: "type\\s+Monster\\s+struct",
          hint: "Definisikan struct: type Monster struct { Name string; HP int; Damage int }",
        },
        {
          kind: "regex",
          pattern: "func\\s*\\(\\s*\\w+\\s+Monster\\s*\\)\\s+(Roar|Attack)",
          hint: "Buat method Roar dan Attack dengan receiver Monster: func (m Monster) Roar() { ... }",
        },
      ],
      hp: 150,
      victoryStory:
        "Cahaya memenuhi rongga dada golem. Ia berlutut, lalu tubuhnya ratusan blok cahaya menyusun ulang diri menjadi... pedang. SWORD OF POINTERS kini milikmu.\n\nZephyrus muncul di antara debu berkilauan. \"Act 1: AWAKENING — TUNTAS. Kau telah bangun dari pemula menjadi programmer Go yang siap bertarung. Di depan sana menanti Act 2: THE POWER WITHIN — pointer, interface, error handling, dan sihir concurrency. Istirahatlah dulu, Go Legend masa depan. Level up dulu, kali ini sungguhan.\"",
    },
  },
];
