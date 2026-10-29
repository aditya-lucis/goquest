import type { Quest } from "../types";

// ============================================================
// ACT 2: THE POWER WITHIN — Pointer, Interface, Error,
// Goroutine & Channel, Package & Module, Testing (semua playable)
// ============================================================

export const ACT2_QUESTS: Quest[] = [
  // ------------------------------------------------------------
  {
    id: "q2-1",
    act: 2,
    order: 1,
    title: "Cermin Dua Arah",
    subtitle: "Pointer: Menyentuh Nilai Asli",
    emoji: "🪞",
    difficulty: "hard",
    xpReward: 140,
    goldReward: 50,
    skillId: "skill-pointer",
    itemReward: "item-sword-pointers",
    story: [
      "Gerbang Act 2 terbuka dengan deru guntur. Di dalamnya, sebuah ruangan penuh cermin uap. Setiap cermin tidak memantulkan wajahmu — melainkan menampilkan LOKASI benda-benda di ruangan lain.",
      "Penjaga ruangan, arwah tua bernama Aster, berbisik: \"Di banyak bahasa, mengubah nilai jauh adalah sihir gelap yang dilarang. Go memilih jalan jujur: jika kau ingin mengubah ASLINYA, kau harus menyentuh alamatnya — lewat POINTER.\"",
      "\"Pegang pedangmu. Sword of Pointers yang kau bawa hanya akan berkedip jika kau memahami kekuatannya. Hancurkan bayangan yang meniru dirimu tanpa jiwamu.\"",
    ],
    objectives: [
      "Pahami operator & (alamat) dan * (nilai di alamat)",
      "Buat method dengan pointer receiver",
      "Pahami pass-by-value vs pass-by-reference",
      "Kalahkan The Shadow Clone",
    ],
    lesson: `## Pointer = Alamat, Bukan Rumah

Setiap variable tinggal di alamat memori. Pointer menyimpan ALAMAT itu:

\`\`\`go
hp := 100
ptr := &hp // & = "berikan aku alamatnya"

fmt.Println(ptr)  // 0xc000012345 (alamat di memori)
fmt.Println(*ptr) // 100 — * = "ambil isi di alamat ini"

*ptr = 75         // mengubah isi alamat → hp ikut berubah!
fmt.Println(hp)   // 75
\`\`\`

Analogi: \`hp\` adalah rumahnya, \`&hp\` adalah alamat surat-menyuratnya, dan \`*ptr\` adalah \"pergi ke alamat itu dan lihat/ubah isinya\".

## Kenapa Go Butuh Ini? Pass-by-Value!

Go MENGOPY setiap nilai yang dikirim ke function:

\`\`\`go
func levelUpWrong(level int) {
    level++ // hanya mengubah SALINAN — yang asli tak tersentuh!
}

func levelUpRight(level *int) {
    *level++ // menyentuh nilai ASLI lewat alamatnya
}

func main() {
    lvl := 7
    levelUpWrong(lvl)  // lvl tetap 7
    levelUpRight(&lvl) // lvl jadi 8
}
\`\`\`

### Pointer Receiver — Method yang Bisa Mengubah

\`\`\`go
type Hero struct {
    Name string
    HP   int
}

// POINTER receiver: bisa mengubah hero ASLI
func (h *Hero) TakeDamage(dmg int) {
    h.HP -= dmg // Go otomatis dereference: sama dengan (*h).HP
}

aria := Hero{Name: "Aria", HP: 100}
aria.TakeDamage(30) // Go otomatis mengirim &aria
fmt.Println(aria.HP) // 70
\`\`\

**Aturan emas:** method yang MENGUBAH state → pointer receiver \`*Hero\`. Method yang hanya membaca → value receiver \`Hero\`.

> **TENANG:** Go tidak punya aritmetika pointer seperti C. Tidak ada \`ptr++\` ke alamat acak. Pointer Go aman — tidak ada sihir liar.`,
    challenge: {
      prompt:
        "Buktikan kekuatan pointer! Buat struct Hero dengan field Name string dan Level int. Buat method dengan POINTER receiver: LevelUp() yang menambah Level sebesar 1. Di main: buat hero Aria level 7, panggil LevelUp() DUA kali, lalu cetak 'Aria mencapai level 9'.",
      hint: "func (h *Hero) LevelUp() { h.Level++ } — lalu panggil aria.LevelUp() dua kali.",
      starterCode: `package main

import "fmt"

// Struct Hero: Name string, Level int

// Method pointer receiver: LevelUp() menambah Level sebesar 1

func main() {
    // Hero Aria level 7, LevelUp() dua kali
    // Cetak: "Aria mencapai level 9"
}
`,
      expectedOutput: "Aria mencapai level 9",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s*\\(\\s*\\w+\\s+\\*Hero\\s*\\)\\s*LevelUp",
          hint: "LevelUp harus memakai pointer receiver: func (h *Hero) LevelUp() — perhatikan tanda * sebelum Hero.",
        },
      ],
    },
    boss: {
      name: "The Shadow Clone",
      emoji: "👥",
      taunt: "AKU BAYANGANMU... Kau menyentuhku... tapi ASLIMU tidak berubah... Level 10? Tidak... kau masih level 10... Gagal... kau gagal...",
      prompt:
        "The Shadow Clone menyerap semua serangan karena hero hanya memukul SALINANNYA! Fungsi powerUp di bawah menerima SALINAN power (pass-by-value). Ubah menjadi pointer agar seranganmu mengenai yang asli! Output: 'Power sebelum: 50', 'Power sesudah: 500'.",
      starterCode: `package main

import "fmt"

func powerUp(power int) {
    power = 500 // hanya mengubah salinan... sia-sia!
}

func main() {
    power := 50
    fmt.Println("Power sebelum:", power)
    powerUp(power)
    fmt.Println("Power sesudah:", power)
}
`,
      expectedOutput: "Power sebelum: 50\nPower sesudah: 500",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s+powerUp\\s*\\(\\s*\\w+\\s+\\*int\\s*\\)",
          hint: "Ubah signature menjadi powerUp(power *int) dan di dalamnya tulis *power = 500. Panggil dengan powerUp(&power).",
        },
      ],
      hp: 100,
      victoryStory:
        "Sword of Pointers berkilau di tanganmu dan Shadow Clone tercermin kembali ke void miliknya. \"Kau pahami rahasianya,\" Aster tersenyum. \"Menyalin itu aman tapi mahal dan tak mengubah asli. Menunjuk itu jujur — perubahan terjadi di sumbernya. Pilih dengan sadar, dan kodemu akan seperti pedang: tajam dan tepat sasaran.\"",
    },
  },

  // ------------------------------------------------------------
  {
    id: "q2-2",
    act: 2,
    order: 2,
    title: "Topeng Seribu Wajah",
    subtitle: "Interface: Satu Kontrak, Banyak Wujud",
    emoji: "🎭",
    difficulty: "hard",
    xpReward: 150,
    goldReward: 55,
    skillId: "skill-interface",
    itemReward: "item-mask-interface",
    story: [
      "Ruang berikutnya adalah balai topeng raksasa. Ribuan topeng melayang — dari yang sederhana sampai yang menjulang seperti mahkota. Namun anehnya, tak satu pun punya wajah.",
      "\"Topeng-topeng ini tidak peduli SIAPA pemakainya,\" kata Aster. \"Mereka hanya peduli APA YANG BISA DILAKUKAN pemakainya. Bisa terbang? Topeng ini untukmu. Bisa menyelam? Ambil yang itu.\"",
      "\"Beginilah cara Go berpikir tentang interface: jangan tanya 'dia tipe apa', tanyalah 'dia punya method apa'. Ini disebut duck typing — jika berenang seperti bebek dan bersuara seperti bebek, ia bisa memakai topeng bebek.\"",
    ],
    objectives: [
      "Deklarasikan interface dengan method set",
      "Pahami implementasi IMPLISIT (tanpa kata kunci implements)",
      "Simpan berbagai struct dalam satu interface",
      "Kalahkan The Shapeshifter",
    ],
    lesson: `## Interface — Kontrak Perilaku

\`\`\`go
type Attacker interface {
    Attack() string // siapa pun yang PUNYA method Attack() string... 
}
\`\`\`

...otomatis memenuhi kontrak ini. **TANPA** deklarasi \`implements\` seperti di Java! Ini fitur paling elegan di Go:

\`\`\`go
type Dragon struct{ Name string }
func (d Dragon) Attack() string { return d.Name + " menyemburkan api!" }

type Goblin struct{ Name string }
func (g Goblin) Attack() string { return g.Name + " menusuk dengan belati!" }

// Dragon dan Goblin OTOMATIS adalah Attacker
\`\`\`

## Satu Variabel, Banyak Wujud

\`\`\`go
attackers := []Attacker{
    Dragon{Name: "Ignis"},
    Goblin{Name: "Grum"},
}

for _, a := range attackers {
    fmt.Println(a.Attack()) // masing-masing memakai perilakunya sendiri
}
\`\`\`

Inilah **polymorphism** ala Go: satu kontrak, banyak wujud, dan method yang dipanggil menyesuaikan wujud ASLI di balik topeng.

### Interface Kosong — interface{}

\`\`\`go
var anything interface{} // menampung APA PUN
fmt.Println(anything)    // cocok untuk utilitas seperti fmt.Println
\`\`\

\`fmt.Println\` menerima segala tipe karena parameternya adalah interface kosong.

> **TIP GUILDMASTER:** Aturan praktis: \"Accept interfaces, return structs.\" Terima interface sebagai parameter (fleksibel), kembalikan struct konkret (jelas).`,
    challenge: {
      prompt:
        "Buat balai topengmu sendiri! Definisikan interface Speaker dengan satu method Speak() string. Buat dua struct: Dragon (Name string) dengan method Speak() mengembalikan Name + \" menjerit: ROAAAR!\" dan Ghost (Name string) dengan method Speak() mengembalikan Name + \" berbisik: boo...\". Buat slice []Speaker berisi keduanya, lalu loop dan cetak dua baris: 'Draco menjerit: ROAAAR!' dan 'Casper berbisik: boo...'.",
      hint: "type Speaker interface { Speak() string } — struct yang punya method Speak() otomatis memenuhi kontraknya, tanpa implements.",
      starterCode: `package main

import "fmt"

// Interface Speaker: method Speak() string

// Struct Dragon dengan method Speak()
// Struct Ghost dengan method Speak()

func main() {
    // Slice []Speaker berisi Dragon "Draco" dan Ghost "Casper"
    // Loop dan cetak hasil Speak() masing-masing
}
`,
      expectedOutput: "Draco menjerit: ROAAAR!\nCasper berbisik: boo...",
      validators: [
        {
          kind: "regex",
          pattern: "type\\s+Speaker\\s+interface",
          hint: "Definisikan interface: type Speaker interface { Speak() string }",
        },
        {
          kind: "regex",
          pattern: "\\[\\]Speaker",
          hint: "Buat slice bertipe []Speaker untuk menampung kedua monster.",
        },
      ],
    },
    boss: {
      name: "The Shapeshifter",
      emoji: "🦎",
      taunt: "AKU BISA MENJADI APA PUN! Tapi... kontrakmu... kontrakmu menuntut method yang TIDAK AKU PUNYA... tolol! Tolol kau! Berikan aku method itu dan AKU TETAP TIDAK TUNDUK!",
      prompt:
        "The Shapeshifter ingin masuk guild Warrior tapi tidak punya method yang diwajibkan interface Warrior (method BattleCry() string). Lengkapi method yang hilang pada struct Shapeshifter agar program mencetak: 'Shapeshifter berteriak: UNTUK GUILD!' dan 'Shapeshifter diterima di guild Warrior.'.",
      starterCode: `package main

import "fmt"

type Warrior interface {
    BattleCry() string
}

type Shapeshifter struct {
    Name string
}

// Method yang dibutuhkan kontrak Warrior HILANG...
// Tambahkan di sini!

func main() {
    var w Warrior = Shapeshifter{Name: "Shapeshifter"}
    fmt.Println(w.BattleCry())
    fmt.Println("Shapeshifter diterima di guild Warrior.")
}
`,
      expectedOutput: "Shapeshifter berteriak: UNTUK GUILD!\nShapeshifter diterima di guild Warrior.",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s*\\(\\s*\\w+\\s+Shapeshifter\\s*\\)\\s+BattleCry",
          hint: "Tambahkan method pada Shapeshifter: func (s Shapeshifter) BattleCry() string { return s.Name + \" berteriak: UNTUK GUILD!\" }",
        },
      ],
      hp: 110,
      victoryStory:
        "Shapeshifter menyerahkan Mask of Interfaces dan mengambil wujud gopher kecil yang rendah hati. \"Kontrak, bukan keturunan,\" gumam Aster. \"Di Go, kau tidak dihakimi karena TIPEmu, tapi karena KEMAMPUANmu. Dunia yang adil untuk para struct.\"",
    },
  },

  // ------------------------------------------------------------
  {
    id: "q2-3",
    act: 2,
    order: 3,
    title: "Perisai Kesalahan",
    subtitle: "Error Handling: Gagal Itu Terencana",
    emoji: "🛡️",
    difficulty: "hard",
    xpReward: 160,
    goldReward: 60,
    skillId: "skill-error",
    story: [
      "Koridor berubah menjadi jembatan sempit di atas jurang api. Di ujungnya, menara pengawal dengan perisai raksasa menyala merah. Setiap langkah salah di jembatan ini memicu jebakan — dan tidak ada peringatan kedua.",
      "\"Di banyak kerajaan, kesalahan dilempar seperti bola api dan ditangkap entah di mana,\" Aster berbicara lirih. \"Go membencinya. Di Go, kesalahan adalah NILAI — kau mengembalikannya, memeriksanya, dan menanganinya dengan sadar. Tepat di tempat kejadiannya.\"",
      "\"Panji panjang di menara tertulis: PANIC BUKAN STRATEGI. Naiklah, dan buktikan kau bisa gagal dengan anggun.\"",
    ],
    objectives: [
      "Kembalikan error dari function (pola value, err)",
      "Gunakan errors.New dan fmt.Errorf",
      "Kuasai pola if err != nil",
      "Kalahkan Panic Wraith",
    ],
    lesson: `## Error Hanyalah Nilai

Di Go, error adalah interface super sederhana:

\`\`\`go
type error interface {
    Error() string
}
\`\`\

Karena itu, kau bisa MENGEMBALIKANNYA seperti nilai biasa — pola paling ikonik di Go:

\`\`\`go
import (
    "errors"
    "fmt"
)

func divide(a int, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("pembagi tidak boleh nol")
    }
    return a / b, nil // nil = "tidak ada error, tenang saja"
}
\`\`\

## Memeriksa: if err != nil

\`\`\`go
result, err := divide(10, 0)
if err != nil {
    fmt.Println("Gagal:", err) // tangani di sini, saat itu juga
    return
}
fmt.Println("Hasil:", result)
\`\`\

Aturan mainnya:
- Fungsi yang BISA gagal → kembalikan \`(hasil, error)\`
- Pemanggil WAJIB memeriksa \`err != nil\` sebelum memakai hasil
- \`nil\` berarti \"semuanya baik-baik saja\"

### fmt.Errorf — Error dengan Konteks

\`\`\`go
func findHero(name string) (string, error) {
    if name == "" {
        return "", fmt.Errorf("nama hero kosong: tidak bisa mencari")
    }
    return name + " ditemukan!", nil
}
\`\`\

> **KENAPA BUKAN try/catch?** Rob Pike pernah bilang: nilai adalah sesuatu yang bisa kau program. try/catch membuat alur kontrol melompat liar; error sebagai nilai membuat kegagalan jadi BAGIAN dari logika yang kau rancang. Kurangi kejutan, tambah kontrol.`,
    challenge: {
      prompt:
        "Tempa perisai kesalahanmu! Buat fungsi heal(hp int, amount int) (int, error): jika amount negatif, kembalikan (0, errors.New(\"jumlah heal tidak boleh negatif\")); jika tidak, kembalikan (hp + amount, nil) MAKSIMAL 100. Di main: panggil heal(90, 30) → cetak 'HP: 100'. Lalu panggil heal(50, -5) → karena error, cetak 'Gagal: jumlah heal tidak boleh negatif'.",
      hint: "Pola klasik: hasil, err := heal(90, 30); if err != nil { ... } else { fmt.Println(\"HP:\", hasil) }. Batasi maksimal 100 dengan if.",
      starterCode: `package main

import (
    "errors"
    "fmt"
)

// Fungsi heal(hp, amount int) (int, error)
// - amount negatif → return 0, errors.New("jumlah heal tidak boleh negatif")
// - sukses → return hp + amount (maks 100), nil

func main() {
    // Panggil heal(90, 30) → cetak "HP: 100"
    // Panggil heal(50, -5) → tangani error, cetak "Gagal: <pesan error>"
}
`,
      expectedOutput: "HP: 100\nGagal: jumlah heal tidak boleh negatif",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s+heal\\s*\\(\\s*\\w+\\s+int\\s*,\\s*\\w+\\s+int\\s*\\)\\s*\\(\\s*int\\s*,\\s*error\\s*\\)",
          hint: "Signature fungsi: func heal(hp int, amount int) (int, error) — dua nilai kembali.",
        },
        {
          kind: "regex",
          pattern: "errors\\.New|fmt\\.Errorf",
          hint: "Gunakan errors.New(...) untuk membuat error baru.",
        },
        {
          kind: "regex",
          pattern: "err\\s*!=\\s*nil",
          hint: "Periksa error dengan pola: if err != nil { ... }",
        },
      ],
    },
    boss: {
      name: "Panic Wraith",
      emoji: "💀",
      taunt: "SSSKRREEE! Input salah?! PANIC! SEMUA PANIC! Biarkan seluruh program runtuh! Tak ada perisai! Tak ada rencana! HANYA KEGADUHAN!",
      prompt:
        "Panic Wraith mengutuk fungsi pembagian agar PANIC saat pembagi nol, meruntuhkan seluruh program. Ubah menjadi error handling yang anggun: kembalikan error alih-alih panic. Output harus: 'Hasil: 25' lalu 'Gagal: pembagi tidak boleh nol'.",
      starterCode: `package main

import (
    "errors"
    "fmt"
)

func divide(a int, b int) (int, error) {
    if b == 0 {
        panic("pembagi nol!") // Wraith memaksa PANIC!
    }
    return a / b, nil
}

func main() {
    hasil1, err1 := divide(100, 4)
    if err1 != nil {
        fmt.Println("Gagal:", err1)
    } else {
        fmt.Println("Hasil:", hasil1)
    }

    hasil2, err2 := divide(10, 0)
    if err2 != nil {
        fmt.Println("Gagal:", err2)
    } else {
        fmt.Println("Hasil:", hasil2)
    }
}
`,
      expectedOutput: "Hasil: 25\nGagal: pembagi tidak boleh nol",
      validators: [
        {
          kind: "regex",
          pattern: "errors\\.New\\s*\\(\\s*\"pembagi tidak boleh nol\"\\s*\\)",
          hint: "Ganti panic(...) dengan return 0, errors.New(\"pembagi tidak boleh nol\").",
        },
      ],
      hp: 120,
      victoryStory:
        "Panic Wraith menguap menjadi kabut merah yang lalu menetap sebagai lapisan Perisai Kesalahan di lenganmu. Aster mengangguk khidmat: \"Gagal itu pasti. Yang membedakan engineer biasa dan legenda adalah CARA gagal: terencana, tertangani, dan tanpa drama.\"",
    },
  },

  // ------------------------------------------------------------
  // q2-4: GOROUTINE & CHANNEL
  // ------------------------------------------------------------
  {
    id: "q2-4",
    act: 2,
    order: 4,
    title: "Jurang Thread Ganda",
    subtitle: "Goroutine & Channel: Seribu Tangan, Satu Antrean",
    emoji: "🧵",
    difficulty: "epic",
    xpReward: 180,
    goldReward: 65,
    skillId: "skill-concurrent",
    itemReward: "item-shield-concurrency",
    story: [
      "Mantra penyelah gerbang akhirnya pecah. Di hadapanmu terbentang jurang raksasa yang berdentum serentak — Goroutine Legion sedang berlatih. Ribuan prajurit mengerjakan tugas yang sama, bersamaan, tanpa saling menginjak.",
      "\"Satu kata kunci,\u201d kata Aster sambil menunjuk legiom. \"go. Cukup satu kata di depan sebuah pemanggilan fungsi, dan tugas itu berjalan di alur sendiri. Ringan — hanya sekitar 2KB per goroutine. Bandingkan dengan thread OS yang rakus puluhan megabyte.\"",
      "\"Tapi seribu tangan tanpa aturan adalah kekacauan,\" lanjutnya serius. \"Channel adalah antrean suci mereka: satu mengirim (ch <- v), satu menerima (<-ch). Lewat channel, goroutine berbagi hasil tanpa saling merebut. Kuasai keduanya, dan Jurang Thread Ganda akan tunduk.\"",
    ],
    objectives: [
      "Menjalankan fungsi secara paralel dengan kata kunci go",
      "Membuat channel dengan make(chan T, n)",
      "Mengirim (ch <- v) dan menerima (<-ch) lewat channel",
      "Kalahkan Data Race Hydra",
    ],
    lesson: `## Goroutine — Kata Kunci "go"

Tambahkan \`go\` di depan pemanggilan fungsi, dan fungsi itu berjalan sebagai **goroutine** — alur eksekusi ringan yang berjalan "bersamaan" dengan main:

\`\`\`go
func forge(name string) {
    fmt.Println(name, "sedang menempa...")
}

func main() {
    go forge("Aria")  // berjalan di alur sendiri!
    go forge("Brunto") // ini juga — dua tukan tempa bekerja serentak
    fmt.Println("main tetap jalan...")
}
\`\`\`

Setiap goroutine hanya memakan ~2KB memori — Go bisa menjalankan RATUSAN RIBU goroutine sekaligus. Inilah senjata yang membuat Go memerintah dunia backend.

## Channel — Antrean Suci

Goroutine tanpa komunikasi = kekacauan. Channel adalah pipa/antrean resmi:

\`\`\`go
ch := make(chan string, 2) // channel berbuffer 2 (bisa menampung 2 pesan)

ch <- "hasil siap"  // KIRIM: masukkan pesan ke antrean
msg := <-ch         // TERIMA: ambil pesan (yang pertama masuk, pertama keluar)
\`\`\`

- \`ch <- v\` = kirim \`v\` ke channel
- \`v := <-ch\` = terima dari channel
- \`make(chan string)\` TANPA angka = unbuffered (butuh penerima siap); \`make(chan string, 2)\` = berbuffer 2

Pola **worker** paling klasik:

\`\`\`go
func worker(name string, ch chan string) {
    ch <- name + " selesai bekerja" // kirim laporan
}

func main() {
    ch := make(chan string, 2)
    go worker("Aria", ch)   // dua goroutine
    go worker("Brunto", ch)
    fmt.Println(<-ch) // terima laporan pertama
    fmt.Println(<-ch) // terima laporan kedua
}
\`\`\`

> **CATATAN SIMULASI:** GoQuest menjalankan \`go\` secara berurutan-deterministik (bukan benar-benar paralel) supaya hasil selalu bisa diprediksi. Aturan praktisnya sama: **kirim dulu, terima kemudian**. Di Go sungguhan kau juga akan bertemu \`sync.WaitGroup\` untuk menunggu semua goroutine selesai.

> **TIP GUILDMASTER:** "Don't communicate by sharing memory; share memory by communicating." — jangan berebut variable yang sama antar goroutine. Lewatkan datamu lewat channel, dan urutan tetap terjaga.`,
    challenge: {
      prompt:
        "Bangun bengkel paralel! Buat fungsi smith(name string, ch chan string) yang mengirim laporan name + \" menempa pedang\" ke channel. Di main: buat channel string BERBUFFER 2, jalankan dua goroutine — go smith(\"Aria\", ch) dan go smith(\"Brunto\", ch) — lalu terima dan cetak dua laporan dengan fmt.Println(<-ch). Output: 'Aria menempa pedang' lalu 'Brunto menempa pedang'.",
      hint: "ch := make(chan string, 2) → go smith(\"Aria\", ch) → go smith(\"Brunto\", ch) → fmt.Println(<-ch) dua kali. Di dalam smith: ch <- name + \" menempa pedang\".",
      starterCode: `package main

import "fmt"

// Fungsi smith(name string, ch chan string):
// kirim laporan name + " menempa pedang" ke channel

func main() {
    // 1. Buat channel string berbuffer 2
    // 2. Luncurkan DUA goroutine: go smith("Aria", ch) dan go smith("Brunto", ch)
    // 3. Terima & cetak dua laporan: fmt.Println(<-ch)
}
`,
      expectedOutput: "Aria menempa pedang\nBrunto menempa pedang",
      validators: [
        {
          kind: "regex",
          pattern: "\\bgo\\s+(func|smith)\\b",
          hint: "Gunakan kata kunci go untuk meluncurkan goroutine: go smith(\"Aria\", ch).",
        },
        {
          kind: "regex",
          pattern: "make\\(chan\\s+string\\s*,\\s*2\\)",
          hint: "Buat channel berbuffer 2: ch := make(chan string, 2) — dua laporan butuh dua slot.",
        },
      ],
    },
    boss: {
      name: "Data Race Hydra",
      emoji: "🐉",
      taunt: "AKU PUNYA SERIBU KEPALA... semuanya MENULIS ke variable yang SAMA... tanpa antrean... tanpa ampun... rusaklah kau bersamakuuu...",
      prompt:
        "Kedua kepala Hydra mengirim tanda tunduk lewat channel yang sama — tapi Hydra MENGHABISURKAN buffer antreannya! Program terserang 'channel penuh' karena dua kiriman berebut masuk ke antrean berkapasitas satu. Pulihkan antrean: buat channel berbuffer 2 agar kedua kepala bisa mengirim tertib. Output harus: 'Kepala-Kiri tunduk' lalu 'Kepala-Kanan tunduk'.",
      starterCode: `package main

import "fmt"

func head(name string, ch chan string) {
    ch <- name + " tunduk"
}

func main() {
    ch := make(chan string) // HYDRA MENGHABISURKAN BUFFER! (unbuffered)
    go head("Kepala-Kiri", ch)
    go head("Kepala-Kanan", ch)
    fmt.Println(<-ch)
    fmt.Println(<-ch)
}
`,
      expectedOutput: "Kepala-Kiri tunduk\nKepala-Kanan tunduk",
      validators: [
        {
          kind: "regex",
          pattern: "make\\(chan\\s+string\\s*,\\s*2\\)",
          hint: "Pulihkan antrean dengan buffer: make(chan string, 2) — satu slot untuk setiap kepala Hydra.",
        },
      ],
      hp: 150,
      victoryStory:
        "Antrean pulih, dan seribu kepala Hydra jatuh tertib SATU PER SATU — tidak ada yang saling menabrak. Aster meletakkan Shield of Concurrency di lengannya: \"Variable yang sama, ditulis banyak goroutine sekaligus, adalah race condition — iblis yang bahkan compiler tak selalu melihatnya. Di Go sungguhan kau akan memakai sync.WaitGroup dan mutex. Tapi fondasinya satu: komunikasi lewat antrean, bukan perebutan.\"",
    },
  },

  // ------------------------------------------------------------
  // q2-5: PACKAGE & MODULE
  // ------------------------------------------------------------
  {
    id: "q2-5",
    act: 2,
    order: 5,
    title: "Gerbang Guild",
    subtitle: "Package & Module: Menata Kekuatan",
    emoji: "📦",
    difficulty: "normal",
    xpReward: 150,
    goldReward: 55,
    skillId: "skill-package",
    itemReward: "item-crate-module",
    story: [
      "Menara Guild Master menjulang — tempat ribuan kode dari berbagai penjuru realm dikemas, diberi nama, dan dikirim ke seluruh dunia lewat sistem teleportasi module. Para kurir berlalu-lalang membawa crate bertuliskan nama package.",
      "\"Proyek kecil boleh berantakan di satu file,\" kata Guildmaster sambil menyerahkan map padamu. \"Tapi proyek sungguhan? Ribuan baris, puluhan kontributor. Tanpa aturan pengemasan, realm akan runtuh oleh kekacauan bernama spaghetti.\"",
      "\"Di sini kau akan belajar dua hal: PACKAGE — cara menata kode dalam kotak-kotak bernama, dan MODULE — identitas resmi seluruh proyekmu di mata dunia. Buka crate pertamamu, adventurer.\"",
    ],
    objectives: [
      "Memahami package dan cara kerja import",
      "Membedakan identifier Ekspor (Kapital) vs privat (kecil)",
      "Membuat module dengan go mod init dan go.mod",
      "Kalahkan Circular Dependency Wyrm",
    ],
    lesson: `## Package — Kotak Bernama

Setiap file Go dimulai dengan deklarasi package. Semua file dalam satu folder = satu package:

\`\`\`go
package arsenal // file ini bagian dari package arsenal
\`\`\`

Untuk memakai kode dari package lain, \`import\` path-nya:

\`\`\`go
import (
    "fmt"
    "goquest-adventures/arsenal" // package milik module-mu sendiri
)
\`\`\`

## Aturan Emas: Kapital = Publik

Go tidak punya \`public\`/\`private\`. Visibilitas ditentukan oleh **HURUF PERTAMA**:

\`\`\`go
package arsenal

func ForgeSword() {}    // KAPITAL → diekspor: bisa dipanggil package lain
func validateMaterial() {} // kecil → privat: hanya untuk dalam package arsenal
\`\`\`

Ini berlaku untuk fungsi, struct, method, field, dan variable. Satu huruf besar — dan seluruh dunia bisa melihatnya.

## Module — Identitas Proyek

Module adalah koleksi package di bawah satu path. \`go.mod\` adalah akta kelahirannya:

\`\`\`bash
go mod init github.com/aria/goquest-adventures
\`\`\`

\`\`\`
module github.com/aria/goquest-adventures

go 1.22
\`\`\`

Butuh library luar? \`go get github.com/gin-gonic/gin\` — dan Go mencatat versinya di \`go.mod\` agar seluruh tim memakai versi yang SAMA.

### Struktur Proyek Sehat

\`\`\`
goquest-adventures/
├── go.mod
├── main.go            // package main — gerbang masuk
├── arsenal/
│   └── arsenal.go     // package arsenal
└── guild/
    └── guild.go       // package guild
\`\`\`

> **TIP GUILDMASTER:** Package yang baik itu kecil, fokus, dan namanya menjelaskan isinya. Kalau nama package-mu sulit diucapkan (\`util2\`, \`helpers-extra\`), itu tanda isinya terlalu campur aduk. Pecah lagi!`,
    challenge: {
      prompt:
        "Susun arsenal guild! Buat TIGA fungsi mengikuti aturan visibilitas Go: (1) ForgeSword(material string) string — EKSPOR (huruf kapital); (2) ForgeShield(material string) string — EKSPOR; (3) validateMaterial(material string) bool — PRIVAT (huruf kecil), mengembalikan true hanya untuk \"besi\" atau \"mithril\". Kedua fungsi Forge memanggil validateMaterial: kalau material ditolak kembalikan \"material ditolak\", kalau valid kembalikan \"Pedang <material> ditempa\" / \"Perisai <material> ditempa\". main sudah disediakan dan hanya memanggil fungsi EKSPOR. Output: 'Pedang mithril ditempa' lalu 'material ditolak'.",
      hint: "Perhatikan HURUF PERTAMA setiap nama fungsi: ForgeSword & ForgeShield (kapital, ekspor), validateMaterial (kecil, privat). Di dalam Forge: if !validateMaterial(material) { return \"material ditolak\" }.",
      starterCode: `package main

import "fmt"

// ===== [ simulasi package arsenal ] =====
// 1. ForgeSword(material string) string  — EKSPOR (kapital)
//    - material valid → "Pedang " + material + " ditempa"
//    - material ditolak → "material ditolak"
// 2. ForgeShield(material string) string — EKSPOR (kapital)
//    - material valid → "Perisai " + material + " ditempa"
//    - material ditolak → "material ditolak"
// 3. validateMaterial(material string) bool — PRIVAT (kecil)
//    - true hanya untuk "besi" atau "mithril"

func main() {
    // main = "package lain": HANYA boleh memanggil fungsi kapital
    fmt.Println(ForgeSword("mithril"))
    fmt.Println(ForgeShield("kayu"))
}
`,
      expectedOutput: "Pedang mithril ditempa\nmaterial ditolak",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s+ForgeSword\\s*\\(",
          hint: "Fungsi ekspor harus diawali HURUF KAPITAL: func ForgeSword(material string) string.",
        },
        {
          kind: "regex",
          pattern: "func\\s+validateMaterial\\s*\\(",
          hint: "Helper privat diawali huruf kecil: func validateMaterial(material string) bool — hanya bisa dipanggil dari dalam package.",
        },
      ],
    },
    boss: {
      name: "Circular Dependency Wyrm",
      emoji: "🌀",
      taunt: "AKU MENGIMPORMU... dan kau MENGIMPORKU... lingkaran abadi... takkan pernah selesai compile... terjeratlah bersamaku... SELAMANYA...",
      prompt:
        "Circular Dependency Wyrm membelit guild: package weapons memanggil ArmorReport, dan armor memanggil balik WeaponsReport — lingkaran abadi yang membuat compiler menolak bekerja! Putuskan belitan: (1) Buat helper bersama guildStamp() string yang mengembalikan \"Guild GoQuest\"; (2) WeaponsReport() string = \"Weapons OK [\" + guildStamp() + \"]\" — TANPA memanggil ArmorReport; (3) ArmorReport() string = \"Armor OK [\" + guildStamp() + \"]\" — TANPA memanggil WeaponsReport; (4) main mencetak WeaponsReport() dulu, lalu ArmorReport().",
      starterCode: `package main

import "fmt"

// [package weapons] memanggil armor — dan armor memanggil BALIK!
// WYRM MEMBELIT: lingkaran abadi... program tak akan pernah berhenti...

func WeaponsReport() string {
    return "Weapons OK (" + ArmorReport() + ")"
}

func ArmorReport() string {
    return "Armor OK (" + WeaponsReport() + ")"
}

func main() {
    fmt.Println(WeaponsReport())
    fmt.Println(ArmorReport())
}
`,
      expectedOutput: "Weapons OK [Guild GoQuest]\nArmor OK [Guild GoQuest]",
      validators: [
        {
          kind: "regex",
          pattern: "func\\s+guildStamp\\s*\\(\\s*\\)\\s+string",
          hint: "Ciptakan helper bersama: func guildStamp() string { return \"Guild GoQuest\" } — shared dependency memutus lingkaran.",
        },
      ],
      hp: 130,
      victoryStory:
        "Belitan Wyrm terputus saat kedua package berjabat tangan lewat helper yang SAMA, bukan saling mencengkeram. Guildmaster mengangguk: \"Dependency itu aliran satu arah. Kalau dua package saling memanggil, keputusanmu hanya dua: cari peran ketiga sebagai penengah, atau gabungkan mereka jadi satu. Go compiler akan menolak lingkaran — dan itu BERKAH: kekacauan dicegah sebelum lahir.\"",
    },
  },

  // ------------------------------------------------------------
  // q2-6: TESTING
  // ------------------------------------------------------------
  {
    id: "q2-6",
    act: 2,
    order: 6,
    title: "Cermin Ujian",
    subtitle: "Testing: Membuktikan Mantra Bekerja",
    emoji: "🪞",
    difficulty: "normal",
    xpReward: 160,
    goldReward: 60,
    skillId: "skill-testing",
    itemReward: "item-mirror-testing",
    story: [
      "Ruang terakhir Act 2 adalah balai cermin pengadilan. Cermin-cermin ini tidak memantulkan wajahmu — mereka memantulkan KEBENARAN kode-mu. Tak ada yang bisa berbohong di hadapan Cermin Ujian.",
      "\"Engineer biasa berkata: 'sudah kucoba, jalan kok',\" bisik penjaga cermin. \"Engineer legenda berkata: 'ini BUKTI bahwa ia jalan — dan ini bukti ia akan tetap jalan besok, minggu depan, dan setelah refactor besar-besaran.'\"",
      "\"Kau akan membangun meja uji sendiri: tabel kasus, hasil nyata vs hasil harapan, dan vonis PASS atau FAIL. Mereka yang lulus ujian ini tidak takut pada Regression Phantom — hantu yang merusak kode diam-diam.\"",
    ],
    objectives: [
      "Memahami pola got vs want dalam pengujian",
      "Membangun table-driven test dengan struct + slice",
      "Menjalankan pengujian dan menghitung PASS/FAIL",
      "Kalahkan Regression Phantom",
    ],
    lesson: `## Testing di Go — Sederhana dan Bawaan

Go punya framework test BAWAAN. File berakhiran \`_test.go\` berisi fungsi \`TestXxx\`:

\`\`\`go
// hero_test.go
package main

import "testing"

func TestDamage(t *testing.T) {
    got := Damage(10, 4)
    want := 6
    if got != want {
        t.Errorf("Damage(10,4) = %d; ingin %d", got, want)
    }
}
\`\`\`

Jalankan dengan:

\`\`\`bash
go test ./...        # semua test
go test -cover       # plus cakupan kode
go test -v           # verbose: tampilkan tiap test
\`\`\`

## Table-Driven Test — Pola Paling Go-Banget

Daripada menulis 10 fungsi test yang mirip, kumpulkan semua kasus dalam SATU tabel:

\`\`\`go
func TestDamage(t *testing.T) {
    tests := []struct {
        name string
        atk  int
        def  int
        want int
    }{
        {"serangan normal", 10, 4, 6},
        {"ditahan penuh", 5, 9, 0},
        {"imbang", 7, 7, 0},
    }

    for _, tc := range tests {
        got := Damage(tc.atk, tc.def)
        if got != tc.want {
            t.Errorf("%s: Damage(%d,%d) = %d; ingin %d",
                tc.name, tc.atk, tc.def, got, tc.want)
        }
    }
}
\`\`\`

Menambah kasus baru = menambah SATU BARIS. Itulah keindahannya.

### t.Errorf vs t.Fatalf

- \`t.Errorf\` — catat kegagalan, LANJUT ke kasus berikutnya
- \`t.Fatalf\` — hentikan test ini seketika (kalau lanjutnya pasti ikut gagal)

> **CATATAN SIMULASI:** GoQuest menjalankan subset Go di browser — \`go test\` tidak tersedia di sini. Jadi kau akan membangun meja uji versi mini: tabel kasus + perbandingan got vs want + laporan PASS/FAIL. Pola pikirnya 100% sama. Setelah lulus quest ini, buka terminal dan rasakan \`go test\` asli!`,
    challenge: {
      prompt:
        "Bangun meja uji untuk fungsi Damage! Fungsi Damage SUDAH disediakan (serangan bersih = atk - def, minimal 0). Tugasmu di main: (1) definisikan struct TestCase dengan field name string, atk int, def int, want int; (2) buat slice []TestCase berisi TIGA kasus: {\"serangan normal\", 10, 4, 6}, {\"ditahan penuh\", 5, 9, 0}, {\"imbang\", 7, 7, 0}; (3) loop semua kasus: bandingkan got := Damage(tc.atk, tc.def) dengan tc.want — kalau sama cetak 'PASS: <name>' dan tambah counter passed, kalau beda cetak 'FAIL: <name> - got <got> want <want>'; (4) di akhir cetak '<passed> dari <total> tes lulus'.",
      hint: "tests := []TestCase{{\"serangan normal\", 10, 4, 6}, {\"ditahan penuh\", 5, 9, 0}, {\"imbang\", 7, 7, 0}} lalu for _, tc := range tests { got := Damage(tc.atk, tc.def); if got == tc.want { ... } else { ... } }. Total = len(tests).",
      starterCode: `package main

import "fmt"

// KODE DI BAWAH UJIAN (jangan diubah):
// serangan bersih = atk - def, tidak boleh negatif
func Damage(atk int, def int) int {
    if atk <= def {
        return 0
    }
    return atk - def
}

// TestCase = satu baris di tabel uji
// field: name string, atk int, def int, want int

func main() {
    // 1. Tabel uji: slice TestCase berisi 3 kasus
    // 2. Loop: got := Damage(tc.atk, tc.def)
    //    sama dengan want  → "PASS: <name>", passed++
    //    beda dengan want → "FAIL: <name> - got <got> want <want>"
    // 3. Cetak akhir: "<passed> dari <total> tes lulus"
}
`,
      expectedOutput:
        "PASS: serangan normal\nPASS: ditahan penuh\nPASS: imbang\n3 dari 3 tes lulus",
      validators: [
        {
          kind: "regex",
          pattern: "type\\s+TestCase\\s+struct",
          hint: "Definisikan struct kasus uji: type TestCase struct { name string; atk int; def int; want int }.",
        },
        {
          kind: "regex",
          pattern: "for\\s+_,\\s*\\w+\\s*:=\\s*range\\s+\\w+",
          hint: "Loop semua kasus uji dengan: for _, tc := range tests { ... }.",
        },
      ],
    },
    boss: {
      name: "Regression Phantom",
      emoji: "👻",
      taunt: "Kau memperbaiki SATU hal... dan diam-diam aku merusak TIGA hal lain... tanpa test, kau TIDAK AKAN PERNAH tahu... hahaha... hiburanmu adalah bug production pukul 3 pagi...",
      prompt:
        "Regression Phantom menyembunyikan bug di balik test yang 'hijau'! Fungsi Heal TIDAK membatasi HP maksimal 100 — tapi tabel uji hanya memuat satu kasus yang kebetulan lolos. Tugasmu: (1) PERBAIKI Heal: hasil tidak boleh melebihi 100 (jika hp+amount > 100, kembalikan 100); (2) TAMBAHKAN kasus uji batas {\"batas maksimum\", 90, 30, 100} SETELAH kasus pertama; (3) pastikan output '2 dari 2 tes lulus'. Urutan output: 'PASS: heal normal' lalu 'PASS: batas maksimum'.",
      starterCode: `package main

import "fmt"

// BUG PHANTOM: Heal tidak membatasi HP maksimal 100!
func Heal(hp int, amount int) int {
    return hp + amount
}

type HealCase struct {
    name   string
    hp     int
    amount int
    want   int
}

func main() {
    tests := []HealCase{
        {"heal normal", 10, 20, 30},
        // PHANTOM MENYEMBUNYIKAN KASUS BATAS:
        // Heal(90, 30) SEHARUSNYA 100, bukan 120!
    }

    passed := 0
    for _, tc := range tests {
        got := Heal(tc.hp, tc.amount)
        if got == tc.want {
            passed++
            fmt.Println("PASS:", tc.name)
        } else {
            fmt.Println("FAIL:", tc.name, "- got", got, "want", tc.want)
        }
    }
    fmt.Println(passed, "dari", len(tests), "tes lulus")
}
`,
      expectedOutput: "PASS: heal normal\nPASS: batas maksimum\n2 dari 2 tes lulus",
      validators: [
        {
          kind: "regex",
          pattern: ">\\s*100|100\\s*<",
          hint: "Batasi Heal: if hp+amount > 100 { return 100 } — HP tidak boleh melebihi 100.",
        },
        {
          kind: "includes",
          pattern: "batas maksimum",
          hint: "Tambahkan kasus batas ke tabel: {\"batas maksimum\", 90, 30, 100}.",
        },
      ],
      hp: 140,
      victoryStory:
        "Kasus batas ditambahkan, bug diperbaiki, dan Phantom kehilangan sumber kekuatannya: kegelapan tanpa pengawasan. Cermin Ujian berpendar hijau. \"Beginilah cara legenda tidur nyenyak,\" kata penjaga cermin. \"Test yang baik bukan soal jumlah — tapi soal KASUS BATAS: nol, kosong, maksimal, paling awal, paling akhir. Di situlah bug bersembunyi. Dan dengan table-driven test, menutup celah itu cukup satu baris.\"",
    },
  },
];
