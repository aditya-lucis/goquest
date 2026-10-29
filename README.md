# ⚔️ GoQuest — Belajar Golang Lewat Petualangan RPG

GoQuest adalah platform pembelajaran **Golang interaktif** dengan gamifikasi ala RPG.
Kamu berperan sebagai *Adventurer*: menaklukkan bug, menyelesaikan *quest* pemrograman,
naik level, dan menjadi **Go Legend**.

## ✨ Fitur Utama

- **Sistem Karakter** — nama, avatar, level, EXP, dan rank (Novice → Apprentice → Mage → Archmage → Go Legend)
- **3 Act Petualangan (20 Quest playable)** — dari Hello World hingga Generics, Context, REST API, Database, dan Deploy/Final Boss
- **Playground Go Interaktif** — editor ber-syntax-highlighting + interpreter Go mini yang berjalan di browser (tanpa server)
- **Boss Battle** — tantangan debugging & proyek mini di akhir tiap act
- **Skill Tree** — buka node skill seiring naiknya level
- **Streak & Daily Quest** — jaga api semangat belajar harian
- **Leaderboard & Trophy Room** — papan peringkat dan ruang prestasi
- **Inventori RPG** — 20+ item legendaris seperti *Sword of Pointers*, *Rune of Generics*, hingga *Crown of Go Legend*
- **Daily Reward** — peti harta harian dengan bonus yang tumbuh bersama streak
- **Sound Effects** — fanfare level-up, kemenangan quest, boss tumbang, dan jingle peti (Web Audio API, tanpa file audio, bisa di-mute)

## 🧱 Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Framer Motion |
| State | Zustand |
| Database | Prisma + SQLite |
| Engine | Interpreter Go mini custom (tokenizer → parser → evaluator) |

## 🚀 Cara Menjalankan

> Prasyarat: **Node.js 18+** (atau **Bun 1.1+**). Contoh di bawah memakai Bun;
> ganti `bun` → `npm run` bila memakai npm.

```bash
# 1. Masuk folder & install dependensi
bun install

# 2. Siapkan environment
cp .env.example .env

# 3. Generate Prisma client & buat database SQLite
bun run db:generate
bun run db:push

# 4. Jalankan dev server
bun run dev
```

Buka **http://localhost:3000** — buat karaktermu, dan petualangan dimulai! 🗺️

### Build Produksi

```bash
bun run build
bun run start
```

## 📁 Struktur Proyek

```
goquest/
├── prisma/schema.prisma     # Skema DB (Adventurer, QuestProgress, dst.)
├── db/                      # Database SQLite (dibuat oleh db:push)
├── public/                  # Aset statis
└── src/
    ├── app/                 # Halaman + API routes (App Router)
    │   └── api/realm/       # enter, me, quest/complete, daily, leaderboard
    ├── components/game/     # UI layar game (dashboard, world map, quest, playground, ...)
    ├── game/
    │   ├── data/            # Konten 20 quest playable dalam 3 act
    │   ├── engine/          # Interpreter Go mini (tokenizer, parser, grader)
    │   ├── store.ts         # State global Zustand
    │   ├── progression.ts   # Logika XP, level, rank, streak
    │   └── types.ts         # Tipe domain
    └── lib/                 # Prisma client & helper session
```

## 🎮 Alur Bermain

1. **Buat Adventurer** di landing page (nama + avatar + kelas)
2. **World Map** menampilkan 3 act dan progres quest
3. Buka **Quest** → baca materi → kerjakan **challenge** di playground
4. Kode dievaluasi oleh *grader* (unit test + pattern matching) → dapat EXP & item
5. Kumpulkan **streak harian**, panjat **leaderboard**, dan isi **trophy room**

## ⚙️ Catatan

- Database disimpan di `db/custom.db` (SQLite) — hapus file itu untuk reset progres.
- Interpreter Go berjalan sepenuhnya di browser: subset Go (variabel, kontrol alur,
  fungsi, slice/map, struct) untuk latihan, sehingga tidak butuh kompiler di server.
