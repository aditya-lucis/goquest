import type { Achievement, AvatarClassInfo, Item, SkillNode } from "../types";

// ============================================================
// AVATAR CLASSES — dipilih saat character creation
// ============================================================

export const AVATAR_CLASSES: AvatarClassInfo[] = [
  {
    id: "swordsman",
    name: "Code Swordsman",
    tagline: "Tebas bug dengan satu baris",
    description:
      "Petarung garis depan yang menulis kode dengan cepat dan tegas. Pedangnya adalah editor, perisainya adalah compiler.",
    emoji: "⚔️",
    bonus: "Motto: \"Kode yang jalan lebih baik daripada kode yang sempurna.\"",
  },
  {
    id: "mage",
    name: "Arcane Coder",
    tagline: "Menenun mantra concurrency",
    description:
      "Peneliti rune kuno (dokumentasi) yang memahami kekuatan gelap goroutine. Ritualnya: baca error message sampai tuntas.",
    emoji: "🔮",
    bonus: "Motto: \"Setiap panic() adalah kesempatan recover().\"",
  },
  {
    id: "ranger",
    name: "Bug Ranger",
    tagline: "Melacak null dari kejauhan",
    description:
      "Pemburu legendaris yang bisa melihat jejak bug dari 300 baris kode. Panahnya tidak pernah meleset (kecuali off-by-one).",
    emoji: "🏹",
    bonus: "Motto: \"Satu unit test setiap hari mengusir regression.\"",
  },
  {
    id: "alchemist",
    name: "Refactor Alchemist",
    tagline: "Mengubah legacy jadi emas",
    description:
      "Ahli kimia kode yang percaya semua spaghetti bisa diubah menjadi arsitektur yang bersih dengan resep yang tepat.",
    emoji: "⚗️",
    bonus: "Motto: \"go fmt adalah doa harianku.\"",
  },
];

export function getAvatarClass(id: string): AvatarClassInfo {
  return AVATAR_CLASSES.find((c) => c.id === id) ?? AVATAR_CLASSES[0];
}

// ============================================================
// SKILL TREE — node terbuka saat quest selesai
// ============================================================

export const SKILL_TREE: SkillNode[] = [
  // --- Act 1 ---
  { id: "skill-lore", name: "Lore of Go", description: "Memahami sejarah dan filosofi bahasa Go.", emoji: "📜", act: 1, requires: [], questId: "q1-1" },
  { id: "skill-hello", name: "First Incantation", description: "Menuliskan mantra pertama: fmt.Println.", emoji: "✨", act: 1, requires: ["skill-lore"], questId: "q1-2" },
  { id: "skill-variable", name: "Rune Binding", description: "Mengikat nilai ke nama dengan variable & constant.", emoji: "🔐", act: 1, requires: ["skill-hello"], questId: "q1-3" },
  { id: "skill-control", name: "Path Weaving", description: "Mengatur alur takdir dengan if/else, for, dan switch.", emoji: "🌀", act: 1, requires: ["skill-variable"], questId: "q1-4" },
  { id: "skill-function", name: "Spell Crafting", description: "Menciptakan mantra reusable bernama function.", emoji: "🪄", act: 1, requires: ["skill-control"], questId: "q1-5" },
  { id: "skill-collection", name: "Bag of Holding", description: "Menyimpan banyak item dengan array, slice, dan map.", emoji: "🎒", act: 1, requires: ["skill-function"], questId: "q1-6" },
  { id: "skill-struct", name: "Golem Blueprint", description: "Membangun tipe custom dengan struct dan method.", emoji: "🗿", act: 1, requires: ["skill-collection"], questId: "q1-7" },
  // --- Act 2 ---
  { id: "skill-pointer", name: "Mirror Magic", description: "Menunjuk lokasi memori langsung dengan pointer.", emoji: "🪞", act: 2, requires: ["skill-struct"], questId: "q2-1" },
  { id: "skill-interface", name: "Polymorph Rune", description: "Satu kontrak, banyak wujud: interface.", emoji: "🎭", act: 2, requires: ["skill-pointer"], questId: "q2-2" },
  { id: "skill-error", name: "Shield of Errors", description: "Menangkap kegagalan dengan elegan via error handling.", emoji: "🛡️", act: 2, requires: ["skill-interface"], questId: "q2-3" },
  { id: "skill-concurrent", name: "Twin Threads", description: "Menenun goroutine dan channel untuk sihir paralel.", emoji: "🧵", act: 2, requires: ["skill-error"], questId: "q2-4" },
  { id: "skill-package", name: "Guild Organization", description: "Menata kode dalam package dan module.", emoji: "📦", act: 2, requires: ["skill-concurrent"], questId: "q2-5" },
  { id: "skill-testing", name: "Trial Mirror", description: "Membuktikan mantra bekerja dengan unit test.", emoji: "🪞", act: 2, requires: ["skill-package"], questId: "q2-6" },
  // --- Act 3 ---
  { id: "skill-generics", name: "Type Shapeshifting", description: "Menulis kode yang bekerja untuk semua tipe.", emoji: "🧬", act: 3, requires: ["skill-testing"], questId: "q3-1" },
  { id: "skill-context", name: "Time Weaver", description: "Mengontrol timeout dan cancellation dengan context.", emoji: "⏳", act: 3, requires: ["skill-generics"], questId: "q3-2" },
  { id: "skill-reflection", name: "Deep Sight", description: "Melihat struktur tipe saat runtime dengan reflection.", emoji: "👁️", act: 3, requires: ["skill-context"], questId: "q3-3" },
  { id: "skill-performance", name: "Swift Caster", description: "Profiling dan optimasi performa aplikasi.", emoji: "⚡", act: 3, requires: ["skill-reflection"], questId: "q3-4" },
  { id: "skill-api", name: "Gate Keeper", description: "Membangun REST API dengan Gin.", emoji: "🚪", act: 3, requires: ["skill-performance"], questId: "q3-5" },
  { id: "skill-database", name: "Vault Keeper", description: "Mengelola data persisten dengan GORM & sqlc.", emoji: "🗄️", act: 3, requires: ["skill-api"], questId: "q3-6" },
  { id: "skill-deploy", name: "Realm Ascension", description: "Deploy ke production dengan best practice.", emoji: "🚀", act: 3, requires: ["skill-database"], questId: "q3-7" },
];

// ============================================================
// ITEMS — reward quest & toko (future)
// ============================================================

export const ITEMS: Item[] = [
  // Act 1
  { id: "item-ancient-scroll", name: "Ancient Scroll of Go", description: "Gulungan keramat berisi filosofi para pencipta Go di Google, tahun 2009.", emoji: "📜", category: "trophy", rarity: "rare" },
  { id: "item-hello-charm", name: "Charm of Greeting", description: "Jimat pertama yang berpendar saat fmt.Println berhasil dipanggil.", emoji: "💬", category: "badge", rarity: "common" },
  { id: "item-rune-ink", name: "Rune Ink Vial", description: "Tinta ajaib untuk mengikat nilai ke dalam variable.", emoji: "🖋️", category: "potion", rarity: "common" },
  { id: "item-compass", name: "Compass of Fate", description: "Kompas yang selalu menunjuk cabang if yang benar.", emoji: "🧭", category: "weapon", rarity: "rare" },
  { id: "item-spellbook", name: "Spellbook of Functions", description: "Buku mantra berisi resep function yang bisa dipanggil kapan saja.", emoji: "📕", category: "weapon", rarity: "rare" },
  { id: "item-bag-holding", name: "Bag of Slices", description: "Tas ajaib yang bisa membesar sendiri — seperti slice dengan append().", emoji: "🎒", category: "shield", rarity: "epic" },
  { id: "item-sword-pointers", name: "Sword of Pointers", description: "Pedang legendaris yang menunjuk ALAMAT memori musuh, bukan nilainya. Menembus armor apapun.", emoji: "🗡️", category: "weapon", rarity: "legendary" },
  // Act 2
  { id: "item-shield-concurrency", name: "Shield of Concurrency", description: "Perisai yang memantulkan serangan balik data race.", emoji: "🛡️", category: "shield", rarity: "legendary" },
  { id: "item-mask-interface", name: "Mask of Interfaces", description: "Topeng yang membuat pemakainya dikenali lewat perilaku, bukan wujud.", emoji: "🎭", category: "shield", rarity: "epic" },
  { id: "item-crate-module", name: "Module Crate", description: "Peti pengiriman resmi bertuliskan go.mod — identitas guild-mu di mata dunia.", emoji: "📦", category: "badge", rarity: "rare" },
  { id: "item-mirror-testing", name: "Mirror of Testing", description: "Cermin yang memantulkan kebenaran kode — tak ada bug yang bisa bersembunyi.", emoji: "🪞", category: "shield", rarity: "epic" },
  // Act 3
  { id: "item-rune-generics", name: "Rune of Generics", description: "Rune yang berubah wujud mengikuti tipe pemegangnya. Satu rune, semua tipe.", emoji: "🧬", category: "weapon", rarity: "epic" },
  { id: "item-hourglass-context", name: "Hourglass of Context", description: "Jam pasir yang membatalkan mantra apa pun yang melebihi waktunya.", emoji: "⏳", category: "shield", rarity: "epic" },
  { id: "item-eye-reflection", name: "Eye of Reflection", description: "Mata batin yang membaca struktur tipe tanpa membuka petinya.", emoji: "👁️", category: "trophy", rarity: "epic" },
  { id: "item-lightning-perf", name: "Lightning of Performance", description: "Kilat utara yang menghukum kode O(n²) tanpa pengadilan.", emoji: "⚡", category: "weapon", rarity: "epic" },
  { id: "item-gatekey-api", name: "Gate Key of API", description: "Kunci gerbang yang menghubungkan realm-mu dengan galaksi luar.", emoji: "🗝️", category: "weapon", rarity: "epic" },
  { id: "item-vaultkey-db", name: "Vault Key of Database", description: "Kunci vault abadi — pemegangnya tak pernah kehilangan ingatan.", emoji: "🔑", category: "shield", rarity: "epic" },
  { id: "item-crown-legend", name: "Crown of Go Legend", description: "Mahkota yang hanya dipakai oleh mereka yang menaklukkan seluruh realm.", emoji: "👑", category: "trophy", rarity: "legendary" },
  // Special / achievement
  { id: "item-potion-daily", name: "Flask of Daily Flame", description: "Ramuan harian yang menjaga api semangat belajarmu tetap menyala. Diberikan setiap kali klaim daily reward.", emoji: "🧪", category: "potion", rarity: "common" },
  { id: "title-first-blood", name: "Title: Bug Slayer", description: "Gelar untuk pemburu bug pertama kali. Katanya sekali tebas langsung mati.", emoji: "📛", category: "title", rarity: "common" },
  { id: "title-streak-master", name: "Title: Streak Master", description: "Gelar bagi adventurer yang konsisten 7 hari berturut-turut.", emoji: "🔥", category: "title", rarity: "epic" },
];

export function getItem(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}

// ============================================================
// ACHIEVEMENTS / TROPHY
// ============================================================

export const ACHIEVEMENTS: Achievement[] = [
  { id: "ach-first-step", name: "Langkah Pertama", description: "Menyelesaikan quest pertama di Act 1.", emoji: "🌱", condition: "complete >= 1 quest" },
  { id: "ach-hello-world", name: "Halo, Dunia!", description: "Menuliskan mantra Hello World pertamamu.", emoji: "🌍", condition: "complete q1-2" },
  { id: "ach-bug-slayer", name: "Pembasmi Bug", description: "Mengalahkan boss debugging pertamamu.", emoji: "🐛", condition: "defeat first boss" },
  { id: "ach-act1", name: "Sangat Bertenaga", description: "Menuntaskan seluruh Act 1: Awakening.", emoji: "⚡", condition: "complete all Act 1" },
  { id: "ach-act2", name: "Kekuatan Dalam Diri", description: "Menuntaskan seluruh Act 2: The Power Within.", emoji: "🔮", condition: "complete all Act 2" },
  { id: "ach-act3", name: "Jalan Sang Legenda", description: "Menuntaskan seluruh Act 3: Legendary Path.", emoji: "🏆", condition: "complete all Act 3" },
  { id: "ach-level5", name: "Naik Pangkat", description: "Mencapai level 5 dan menjadi Apprentice.", emoji: "🎖️", condition: "reach level 5" },
  { id: "ach-level10", name: "Penenun Mantra", description: "Mencapai level 10 dan menjadi Mage.", emoji: "🧙", condition: "reach level 10" },
  { id: "ach-streak3", name: "Api Semangat", description: "Belajar 3 hari berturut-turut.", emoji: "🔥", condition: "streak >= 3" },
  { id: "ach-streak7", name: "Api Tak Padam", description: "Belajar 7 hari berturut-turut.", emoji: "🌋", condition: "streak >= 7" },
  { id: "ach-perfect", name: "Eksekusi Sempurna", description: "Menyelesaikan quest dengan output sempurna tanpa retry.", emoji: "💎", condition: "perfect run" },
  { id: "ach-gold500", name: "Kolektor Emas", description: "Mengumpulkan 500 gold di realm GoQuest.", emoji: "💰", condition: "gold >= 500" },
];

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function getSkillNodeById(id: string): SkillNode | undefined {
  return SKILL_TREE.find((s) => s.id === id);
}
