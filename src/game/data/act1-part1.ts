import type { Quest } from "../types";

// ============================================================
// ACT 1: AWAKENING — Quest 1-4
// ============================================================

export const ACT1_QUESTS_PART1: Quest[] = [
  // ------------------------------------------------------------
  {
    id: "q1-1",
    act: 1,
    order: 1,
    title: "Panggilan dari Realm Go",
    subtitle: "Mengenal Bahasa Go & Filosofinya",
    emoji: "📜",
    difficulty: "easy",
    xpReward: 60,
    goldReward: 20,
    skillId: "skill-lore",
    itemReward: "item-ancient-scroll",
    story: [
      "Kau terbangun di dasar Dungeon of Legacy Code. Debu ribuan baris kode kuno melayang di udara. Di kejauhan, cahaya ungu berpendar dari sebuah gua — mereka menyebutnya *The Go Realm*.",
      "Sebuah gulungan tua terbang menghampirimu dan membuka dirinya sendiri. Tulisan api muncul di udara: \"Hai, traveler. Aku Zephyrus, Guildmaster of Go. Realm ini dibangun oleh Three Wizards — Rob Pike, Ken Thompson, dan Robert Griesemer — di menara Google, tahun 2009.\"",
      "\"Mereka lelah melihat bahasa lain yang lambat dikompilasi, berbelit sintaksnya, dan lemah di concurrency. Maka mereka menempa bahasa baru: sederhana seperti mantra pemula, cepat seperti naga, dan paralel seperti pasukan goblin. Namanya... **Go**.\"",
      "Zephyrus menatapmu. \"Sebelum melangkah lebih jauh, buktikan bahwa jiwa adventurer mengalir dalam dirimu. Tunjukkan banner semangatmu ke seluruh realm!\"",
    ],
    objectives: [
      "Pelajari lore singkat bahasa Go dan kenapa ia diciptakan",
      "Kenali struktur dasar program Go",
      "Cetak banner adventurer dengan fmt.Println",
      "Kalahkan Shadow of Doubt — bug pertamamu",
    ],
    lesson: `## Kenapa Dunia Membutuhkan Go?

Bayangkan bahasa pemrograman sebagai senjata. **C++** adalah pedang raksasa — kuat tapi berat diangkat. **Python** adalah tongkat sihir — mudah dipakai tapi lambat. Lalu tahun 2009, di menara Google, tiga penyihir legendaris menempa senjata baru.

Go lahir dari keluhan nyata para engineer Google:
- **Compile lambat** — proyek besar butuh puluhan menit hanya untuk build
- **Sintaks rumit** — terlalu banyak aturan sebelum bisa menulis logika
- **Concurrency itu menyiksa** — thread dan lock membuat kepala meledak

### Filosofi Go: Less is More

Go sengaja dibuat **minim**. Kamu bisa menguasai 95% fitur Go dalam hitungan hari, bukan bulan. Beberapa prinsipnya:

- **Satu cara yang benar** — Go memaksa kode semua orang terlihat seragam (\`go fmt\` merapikan otomatis)
- **Compile secepat kilat** — proyek raksasa ter-build dalam hitungan detik
- **Goroutine** — menjalankan ribuan tugas paralel semudah menulis satu kata \`go\`
- **Single binary** — hasil build adalah SATU file yang bisa dijalankan di mana saja tanpa dependensi

### Siapa yang Memakai Go?

Go adalah bahasa di balik kerajaan-kerajaan besar: **Docker** (kapal kontainer kode), **Kubernetes** (jenderal orkestrasi container), **Terraform** (arsitek infrastruktur), **Discord**, dan **Tokopedia**. Hampir seluruh dunia cloud modern berdiri di atas Go.

### Wujud Sebuah Program Go

Setiap program Go dimulai dari dua mantra sakral:

\`\`\`go
package main // setiap program eksekusi dimulai dari "package main"

import "fmt" // fmt = perpustakaan untuk input/output format

func main() { // titik nol — tempat program mulai berjalan
    fmt.Println("Halo, Realm!") // mencetak satu baris ke layar
}
\`\`\`

Tiga hal yang wajib kamu ingat:
- \`package main\` → deklarasi "ini program utama, bukan pustaka"
- \`func main()\` → pintu masuk eksekusi, Go selalu mulai dari sini
- \`fmt.Println(...)\` → mantra mencetak ke layar, otomatis diakhiri baris baru

> **TIP GUILDMASTER:** Nama fungsi, variable, dan package di Go menggunakan *camelCase* untuk lokal dan *PascalCase* untuk yang akan dipakai pihak lain (exported).`,
    challenge: {
      prompt:
        "Tulis mantra pertamamu! Cetak banner adventurer ke layar TEPAT 3 baris: baris pertama '=========================================' (41 karakter '='), baris kedua '   GOQUEST ADVENTURER HAS AWAKENED', dan baris ketuga sama dengan baris pertama.",
      hint: "Gunakan fmt.Println tiga kali. Baris pembatas berisi 41 tanda sama-dengan tanpa spasi.",
      starterCode: `package main

import "fmt"

func main() {
    // Cetak banner adventurer-mu di sini!
    // Baris 1: 41 tanda '='
    // Baris 2: "   GOQUEST ADVENTURER HAS AWAKENED"
    // Baris 3: 41 tanda '=' lagi
}
`,
      expectedOutput:
        "=========================================\n   GOQUEST ADVENTURER HAS AWAKENED\n=========================================",
      validators: [
        {
          kind: "includes",
          pattern: "fmt.Println",
          hint: "Mantra pencetakan di Go adalah fmt.Println(...) — jangan lupa huruf besar di P!",
        },
      ],
    },
    boss: {
      name: "Shadow of Doubt",
      emoji: "🌫️",
      taunt: "Kau... yakin... bisa... coding? Hahaha... PrintLine? Println? Mana yang benar...? Bingung... kan...?",
      prompt:
        "Sang bayang-bayang meracuni mantra seorang adventurer lain! Ada kesalahan penulisan pada kode di bawah — perbaiki sehingga program mencetak 'Rune of Courage: UNLOCKED' dan 'Doubt akan dikalahkan hari ini!'.",
      starterCode: `package main

import "fmt"

func main() {
    // Shadow of Doubt merusak baris di bawah ini...
    fmt.Printline("Rune of Courage: UNLOCKED")
    fmt.Println("Doubt akan dikalahkan hari ini!")
}
`,
      expectedOutput: "Rune of Courage: UNLOCKED\nDoubt akan dikalahkan hari ini!",
      validators: [
        {
          kind: "regex",
          pattern: "Println",
          hint: "Nama fungsi yang benar adalah fmt.Println — diawali huruf besar 'P', sisanya huruf kecil, dan diakhiri 'ln' (line).",
        },
      ],
      hp: 40,
      victoryStory:
        "Shadow of Doubt menjerit dan mencair menjadi kabut tipis. Tulisan api muncul lagi: \"Bagus sekali! Kesalahan penulisan (typo) adalah monster paling sering muncul — bahkan penyihir senior pun sesekali kena. Compiler adalah temanmu: ia menunjuk persis di mana mantramu rusak.\"",
    },
  },

  // ------------------------------------------------------------
  {
    id: "q1-2",
    act: 1,
    order: 2,
    title: "Mantra Pertama: Hello, Gopher!",
    subtitle: "Instalasi Go & Program Pertamamu",
    emoji: "🐹",
    difficulty: "easy",
    xpReward: 70,
    goldReward: 25,
    skillId: "skill-hello",
    itemReward: "item-hello-charm",
    story: [
      "Zephyrus mengantarmu ke Guild Hall. Di dindingnya tergantung ribuan pedang, namun satu slot kosong menunggu milikmu. \"Setiap adventurer Go memulai dengan hal yang sama,\" ujarnya sambil tersenyum, \"mantra Hello World.\"",
      "Ia membuka jendela terminal bercahaya cyan. \"Di realm asli, kau harus mengunduh Go dari go.dev/dl dan menuliskan 'go mod init quest' untuk menciptakan wilayah proyekmu. Tapi tenang — di GoQuest, Playground Ajaib kami sudah menyediakan segalanya.\"",
      "\"Sekarang, ukir namamu di dunia. Katakan hallo kepada seluruh realm... dengan cara para Gopher menyapanya!\"",
    ],
    objectives: [
      "Pahami cara instalasi Go & go mod init di dunia nyata",
      "Kenali perbedaan go run vs go build",
      "Cetak sapaan Hello Gopher ke layar",
      "Kalahkan Grumpy Gremlin yang mencuri tanda kutip",
    ],
    lesson: `## Menyiapkan Senjatamu (Instalasi)

Di dunia nyata, langkah memulai perjalanan Go:

1. **Unduh** Go dari situs resmi \`go.dev/dl\` (tersedia untuk Windows, macOS, Linux)
2. **Verifikasi** dengan perintah \`go version\` di terminal
3. **Ciptakan proyek** dengan \`go mod init nama-proyek\` — ini membuat file \`go.mod\`, akta kelahiran proyekmu yang mencatat nama module dan versi Go

> Di GoQuest, kamu tidak perlu instal apa pun — **Playground Ajaib** di setiap quest langsung menjalankan kodemu.

### go run vs go build

Dua mantra eksekusi yang harus kamu hafal:

\`\`\`bash
go run main.go   # compile + jalankan SEKALUS (cepat untuk eksperimen)
go build         # menghasilkan file BINARY siap pakai (single file executable!)
\`\`\`

Hasil \`go build\` adalah satu file mandiri — bisa kau bawa ke server mana pun TANPA install Go. Ini salah satu keunggulan terbesar Go.

### Mantra fmt.Println

\`\`\`go
fmt.Println("Hello, Gopher!")  // teks biasa
fmt.Println("HP:", 100)        // beberapa nilai dipisah spasi otomatis
fmt.Print("tanpa ")            // tanpa baris baru
fmt.Print("baris baru")
\`\`\`

- \`Println\` selalu menambahkan **baris baru** di akhir
- Beberapa argumen otomatis dipisah **satu spasi**
- String harus dibungkus **tanda kutip dua** \`"..."\` — kutip satu tidak sah untuk string di Go!

> **TIP GUILDMASTER:** String di Go pakai kutip dua. Kutip satu (\`'\`) hanya untuk karakter \`rune\`, seperti 'g'. Grumpy Gremlin suka mencuri kutip — waspadai error \`syntax error: unexpected newline in string\``,
    challenge: {
      prompt:
        "Waktunya menyapa realm! Cetak dua baris: 'Hello, Gopher!' lalu 'Aku siap menaklukkan GoQuest!'. Gunakan fmt.Println dua kali.",
      hint: "Jangan lupa tanda kutip dua sebelum dan sesudah setiap kalimat.",
      starterCode: `package main

import "fmt"

func main() {
    // Cetak sapaanmu di sini
}
`,
      expectedOutput: "Hello, Gopher!\nAku siap menaklukkan GoQuest!",
      validators: [
        {
          kind: "regex",
          pattern: "\"Hello, Gopher!\"",
          hint: "Kalimat pertama harus persis: \"Hello, Gopher!\" — perhatikan koma dan tanda seru.",
        },
      ],
    },
    boss: {
      name: "Grumpy Gremlin",
      emoji: "👺",
      taunt: "Hehehe... aku mencuri satu tanda kutip dari kodemu! Coba compile deh... pasti error! Kau tidak akan menemukannya!",
      prompt:
        "Grumpy Gremlin menyelinap ke kode seorang adventurer dan mencuri tanda kutip penutup! Perbaiki program agar mencetak 'The Gremlin has been defeated!' dan 'Kutipan kembali aman.'.",
      starterCode: `package main

import "fmt"

func main() {
    // Gremlin mencuri sesuatu di baris bawah...
    fmt.Println("The Gremlin has been defeated!)
    fmt.Println("Kutipan kembali aman.")
}
`,
      expectedOutput: "The Gremlin has been defeated!\nKutipan kembali aman.",
      validators: [
        {
          kind: "regex",
          pattern: "defeated!\"\\s*\\)|defeated!\"",
          hint: "Cari string yang buka kutipnya ada tapi tutup kutipnya hilang — tambahkan tanda kutip penutup sebelum tanda kurung tutup.",
        },
      ],
      hp: 50,
      victoryStory:
        "Grumpy Gremlin menggilas dirinya sendiri dan melempar Charm of Greeting kepadamu. \"Kau belajar hal penting,\" kata Zephyrus, \"compiler Go selalu menunjuk lokasi error dengan presisi. Baca pesan errornya pelan-pelan — ia lebih ramah dari penampilannya.\"",
    },
  },

  // ------------------------------------------------------------
  {
    id: "q1-3",
    act: 1,
    order: 3,
    title: "Brankas Rune: Variable & Type",
    subtitle: "Variable, Tipe Data, dan Constant",
    emoji: "🔐",
    difficulty: "normal",
    xpReward: 90,
    goldReward: 30,
    skillId: "skill-variable",
    itemReward: "item-rune-ink",
    story: [
      "Di kedalaman guild, sebuah brankas raksasa berdiri dengan tiga slot rune kosong. \"Brankas penyimpanan nilai,\" jelas Zephyrus. \"Ia hanya membuka pintunya bagi mereka yang bisa MENGIKAT nilai ke nama dengan benar.\"",
      "\"Di Go, setiap nilai punya JENIS — seperti setiap rune punya elemennya. Angka utuh, angka pecahan, teks, kebenaran... salah mengikat jenisnya, dan brankas ini akan menolak mantramu.\"",
      "\"Tulis pengikatan yang tepat, young adventurer, dan Rune Ink Vial akan menjadi milikmu.\"",
    ],
    objectives: [
      "Kuasai 3 cara mendeklarasikan variable (var, :=, const)",
      "Hafal 4 tipe dasar: int, float64, string, bool",
      "Pahami zero value & type inference",
      "Gunakan fmt.Printf dengan format verb",
      "Kalahkan Type Tyrant",
    ],
    lesson: `## Mengikat Nilai ke Nama

Ada tiga mantra pengikatan di Go:

\`\`\`go
var heroName string = "Aria"  // cara formal: tipe ditulis eksplisit
var heroLevel = 1             // type inference: Go menebak tipenya
gold := 50                    // short declaration: PALING POPULER di dalam fungsi
const MAX_HP = 100            // constant: nilai yang tak bisa berubah selamanya
\`\`\`

**Kapan pakai yang mana?**
- \`:=\` → pilihan utama **di dalam fungsi** (singkat & jelas)
- \`var\` → untuk deklarasi di level package, atau saat butuh zero value dulu
- \`const\` → untuk nilai tetap seperti batas maksimum, nama realm, dsb

> \`:=\` HANYA bisa di dalam fungsi. Menulis \`gold := 50\` di luar func = compile error!

### Empat Elemen Dasar

| Tipe      | Isi                    | Contoh                |
|-----------|------------------------|-----------------------|
| \`int\`     | bilangan bulat         | \`42\`, \`-7\`           |
| \`float64\` | bilangan pecahan       | \`3.14\`, \`0.5\`         |
| \`string\`  | teks                   | \`"Gopher"\`            |
| \`bool\`    | kebenaran              | \`true\`, \`false\`       |

### Zero Value — Nilai Bawaan Yang Baik

Go benci \"nilai kosong tak jelas\". Setiap tipe punya default:

\`\`\`go
var hp int      // 0
var name string // "" (string kosong)
var alive bool  // false
\`\`\`

Tidak ada \`null\` yang mengintai seperti di bahasa lain. Ini bagian dari filosofi Go: **nilai selalu terdefinisi**.

### Type Tidak Bisa Berubah Pikiran

\`\`\`go
var power int = 100
power = "tinggi"   // ERROR! power sudah berikrar sebagai int selamanya
\`\`\`

### fmt.Printf — Berbicara dengan Format Verb

\`\`\`go
fmt.Printf("Hero: %s | Level: %d | HP: %.1f\\n", "Aria", 5, 97.5)
// %s = string, %d = integer, %f = float, %.1f = float 1 desimal
// %v = apa pun (generic), %T = tampilkan TIPE-nya
\`\`\`

Perhatikan \`\\n\` di akhir — berbeda dengan Println, \`Printf\` TIDAK menambahkan baris baru otomatis.`,
    challenge: {
      prompt:
        "Isi brankas rune! Deklarasikan hero dengan ketentuan: name bertipe string bernilai \"Aria\", level int bernilai 7, power float64 bernilai 82.5, dan const REALM bernilai \"GoQuest\". Lalu cetak dengan format: 'Hero: Aria | Level: 7' (satu baris), 'Power: 82.5' (baris kedua), 'Realm: GoQuest' (baris ketiga). Gunakan fmt.Printf atau fmt.Println.",
      hint: "Gunakan := untuk variable dan const untuk REALM. Angka 82.5 otomatis bertipe float64. Untuk float gunakan %.1f agar tampil '82.5'.",
      starterCode: `package main

import "fmt"

func main() {
    // Ikati nilai-nilai hero-mu di sini
    // name := ...
    // level := ...
    // power := ...
    // const REALM = ...

    // Cetak: "Hero: Aria | Level: 7", lalu "Power: 82.5", lalu "Realm: GoQuest"
}
`,
      expectedOutput: "Hero: Aria | Level: 7\nPower: 82.5\nRealm: GoQuest",
      validators: [
        {
          kind: "regex",
          pattern: "const\\s+REALM",
          hint: "REALM harus dideklarasikan dengan keyword const — nilainya tidak pernah berubah.",
        },
        {
          kind: "includes",
          pattern: ":=",
          hint: "Gunakan short declaration := untuk minimal satu variable di dalam fungsi.",
        },
      ],
    },
    boss: {
      name: "Type Tyrant",
      emoji: "🗿",
      taunt: "Aku adalah penjaga TIPE! Angka adalah angka! Teks adalah teks! Kau berani mencampuradukkannya di hadapanku?!",
      prompt:
        "Type Tyrant meracuni kode dengan tipe yang salah! Ada variable yang diikrarkan int tapi diisi string. Perbaiki agar program mencetak 'Damage: 250' dan 'Critical: true'. (Baca error compiler dengan teliti!).",
      starterCode: `package main

import "fmt"

func main() {
    damage := 250
    critical := "true"

    // Type Tyrant meracuni baris di atas...
    fmt.Println("Damage:", damage)
    fmt.Println("Critical:", critical)
}
`,
      expectedOutput: "Damage: 250\nCritical: true",
      validators: [
        {
          kind: "regex",
          pattern: "critical\\s*:?=?\\s*true|critical\\s*=\\s*true",
          hint: "Variable critical harus berisi nilai bool true (tanpa tanda kutip), bukan string \"true\".",
        },
      ],
      hp: 60,
      victoryStory:
        "Type Tyrant berlutut. \"Kau... memahami diriku...\" gumamnya sebelum mengubah diri menjadi patung. Zephyrus tertawa: \"Sistem tipe Go memang ketat, tapi justru itu kekuatannya — error tertangkap SAAT COMPILE, bukan saat aplikasi crash di tengah malam.\"",
    },
  },

  // ------------------------------------------------------------
  {
    id: "q1-4",
    act: 1,
    order: 4,
    title: "Persimpangan Takdir",
    subtitle: "Control Flow: if, for, dan switch",
    emoji: "🌀",
    difficulty: "normal",
    xpReward: 100,
    goldReward: 35,
    skillId: "skill-control",
    itemReward: "item-compass",
    story: [
      "Jalanan berbatu membawamu ke Gerbang Tiga Pintu. Di atasnya terukir: \"if kiri, else if kanan, else lurus — tapi hanya kode yang benar yang sampai tujuan.\"",
      "Angin malam membawa bisikan Zephyrus: \"Sebuah program yang hanya berjalan lurus adalah petualang yang tidak pernah meninggalkan desa. Loop dan percabangan adalah caranya program MENGAMBIL KEPUTUSAN dan MENGULANG usaha.\"",
      "\"Pilih jalanmu dengan bijak. Dan waspadai makhluk yang terjebak mengulang selamanya... dia menunggumu di ujung gerbang.\"",
    ],
    objectives: [
      "Kuasai if / else if / else dengan init statement",
      "Kuasai 3 bentuk for: C-style, kondisi, dan range",
      "Pahami break & continue",
      "Gunakan switch untuk bercabang lebih elegan",
      "Kalahkan Infinite Loop Wraith",
    ],
    lesson: `## Mengambil Keputusan: if / else

\`\`\`go
hp := 35

if hp > 50 {
    fmt.Println("Masih kuat!")
} else if hp > 20 {
    fmt.Println("Hati-hati...")
} else {
    fmt.Println("Minum potion!")
}
\`\`\`

Go punya trik elegan — **init statement** di dalam if:

\`\`\`go
if damage := calculateDamage(); damage > 100 {
    // damage hanya ada di dalam blok if ini
    fmt.Println("Critical hit!", damage)
}
\`\`\`

Kurung \`()\` TIDAK diperlukan di sekitar kondisi, tapi kurung kurawal \`{}\` WAJIB — bahkan untuk satu baris.

## Loop: Hanya for, Tapi Segalanya

Go hanya punya \`for\` — tapi ia berwujud tiga:

\`\`\`go
// 1. Gaya klasik C
for i := 0; i < 5; i++ {
    fmt.Println("Gelombang", i)
}

// 2. Seperti while di bahasa lain
hp := 100
for hp > 0 {
    hp -= 25
}

// 3. Tanpa kondisi = loop selamanya (dengan break!)
for {
    fmt.Println("...")
    break // tanpa break, loop ini tak berujung
}
\`\`\`

**break** = keluar dari loop sekarang. **continue** = lompat ke iterasi berikutnya.

### range — Menelusuri Koleksi

\`\`\`go
spells := []string{"Fire", "Ice", "Thunder"}
for index, spell := range spells {
    fmt.Println(index, spell)
}
// Tidak butuh index? Gunakan underscore:
for _, spell := range spells {
    fmt.Println(spell)
}
\`\`\`

\`_\` (underscore) adalah cara Go berkata \"aku sengaja mengabaikan nilai ini\" — wajib, karena Go melarang variable tak terpakai.

## switch: Percabangan multi yang bersih

\`\`\`go
rank := "mage"
switch rank {
case "novice":
    fmt.Println("Pemula")
case "mage", "archmage": // dua nilai sekaligus
    fmt.Println("Penyihir")
default:
    fmt.Println("Tidak dikenal")
}
\`\`\`

Tidak perlu \`break\` di tiap case — Go otomatis berhenti (tidak seperti C/Java!).`,
    challenge: {
      prompt:
        "Buat penentu rank guild! Buat variable level bernilai 12, lalu gunakan if/else if/else untuk menentukan rank dengan aturan: level >= 20 → 'Go Legend', level >= 10 → 'Mage', level >= 5 → 'Apprentice', selain itu → 'Novice'. Cetak dua baris: 'Level: 12' dan 'Rank: Mage'.",
      hint: "Urutkan kondisi dari yang paling ketat (>= 20) ke yang paling longgar. fmt.Println(\"Rank:\", rank) akan menghasilkan 'Rank: Mage'.",
      starterCode: `package main

import "fmt"

func main() {
    level := 12
    var rank string

    // Tentukan rank berdasarkan level dengan if / else if / else

    fmt.Println("Level:", level)
    fmt.Println("Rank:", rank)
}
`,
      expectedOutput: "Level: 12\nRank: Mage",
      validators: [
        {
          kind: "includes",
          pattern: "else if",
          hint: "Gunakan else if untuk rantai kondisi berjenjang — jangan banyak if terpisah.",
        },
      ],
    },
    boss: {
      name: "Infinite Loop Wraith",
      emoji: "♾️",
      taunt: "Kau... tidak akan... pernah... selesai... Ia lupa menaikkan angkanya... ha... ha... ha... (echo berulang tanpa henti)",
      prompt:
        "Seorang adventurer mencoba menghitung mundur dari 3, tapi mantranya terjebak loop abadi! Ada yang hilang dari loop-nya. Perbaiki agar outputnya: '3', '2', '1', 'LUNCUR!'.",
      starterCode: `package main

import "fmt"

func main() {
    i := 3
    for i > 0 {
        fmt.Println(i)
        // Sesuatu hilang di sini...
    }
    fmt.Println("LUNCUR!")
}
`,
      expectedOutput: "3\n2\n1\nLUNCUR!",
      validators: [
        {
          kind: "regex",
          pattern: "i--|i -= 1|i = i - 1",
          hint: "Loop tidak pernah berakhir karena i tidak pernah berkurang. Tambahkan i-- di dalam loop.",
        },
      ],
      hp: 70,
      victoryStory:
        "Loop tanpa ujung itu robek seperti kain tua. \"Infinite loop adalah kutukan klasik,\" kata Zephyrus sambil memukul Compass of Fate ke tanganmu. \"Ingat tiga bagian for: MULAI, SYARAT, LANGKAH. Lupa satu, dan kau terjebak selamanya. Di GoQuest, playground kami memasang batas langkah agar jiawamu selamat.\"",
    },
  },
];
