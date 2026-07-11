// ── Online platform learner records ─────────────────────────────────────
// Extends the "Online Dostup" phone-whitelist idea with real progress data
// so the boss can see who actually studies and their results.

export type Lang = "Ingliz" | "Rus" | "Koreys" | "Arab";

export interface ModuleProgress {
  name: string;
  lessonsDone: number;
  lessonsTotal: number;
  avgScore: number;      // 0..100 test ball
}

export interface ActivityItem {
  text: string;
  at: string;            // dd.mm.yyyy, HH:MM
}

export interface OnlineStudent {
  id: string;
  name: string;
  phone: string;
  course: Lang;
  level: string;
  accessActive: boolean;
  grantedAt: string;         // berilgan sana (dd.mm.yyyy)
  lastSeen: string | null;   // oxirgi kirish
  daysSince: number;         // 999 = never
  device: string | null;
  currentModule: string;
  currentLesson: string;     // qayerda to'xtagan
  progressPct: number;
  lessonsDone: number;
  lessonsTotal: number;
  testsPassed: number;
  testsTotal: number;
  avgScore: number;
  watchHours: number;
  streakDays: number;
  modules: ModuleProgress[];
  activity: ActivityItem[];
}

export const LANGS: Lang[] = ["Ingliz", "Rus", "Koreys", "Arab"];

// chart-friendly per-language accent (hsl)
export const LANG_HSL: Record<Lang, string> = {
  Ingliz: "hsl(230 70% 55%)",
  Rus: "hsl(199 89% 48%)",
  Koreys: "hsl(262 83% 62%)",
  Arab: "hsl(38 92% 50%)",
};

export const WEEK_ACTIVITY = [
  { day: "Du", faol: 62 }, { day: "Se", faol: 71 }, { day: "Ch", faol: 58 },
  { day: "Pa", faol: 80 }, { day: "Ju", faol: 66 }, { day: "Sh", faol: 41 }, { day: "Ya", faol: 28 },
];

const MODULE_SETS: Record<Lang, [string, number][]> = {
  Ingliz: [["Grammar Foundation", 12], ["Vocabulary Builder", 10], ["Listening", 8], ["Speaking Practice", 10], ["IELTS Prep", 14]],
  Rus:    [["Alifbo va talaffuz", 8], ["Grammatika 1", 12], ["Suhbat", 10], ["Matn tahlili", 9]],
  Koreys: [["Hangul", 6], ["TOPIK 1 Grammar", 12], ["Tinglash", 8], ["Yozuv", 8]],
  Arab:   [["Harflar", 6], ["Grammatika (Nahv)", 12], ["O'qish", 8], ["Suhbat", 9]],
};

const LEVELS: Record<Lang, string[]> = {
  Ingliz: ["Beginner", "Elementary", "Pre-Intermediate", "Intermediate", "Upper-Intermediate"],
  Rus: ["Boshlang'ich", "O'rta", "Yuqori"],
  Koreys: ["Boshlang'ich", "TOPIK 1", "TOPIK 2"],
  Arab: ["Boshlang'ich", "O'rta"],
};

const NAMES: [string, Lang][] = [
  ["Azizbek Tursunov", "Ingliz"], ["Madina Karimova", "Rus"], ["Sardor Yusupov", "Ingliz"],
  ["Munisa Ergasheva", "Ingliz"], ["Javohir Nematov", "Koreys"], ["Sevinch Juraeva", "Ingliz"],
  ["Dilshoda Mahmudova", "Ingliz"], ["Nodira Yakubova", "Ingliz"], ["Gulrux Jo'rayeva", "Rus"],
  ["Temur Malikov", "Ingliz"], ["Shahnoza Ibrohimova", "Rus"], ["Bekzod Rahimov", "Arab"],
  ["Oybek Qodirov", "Koreys"], ["Asilbek To'xtayev", "Koreys"], ["Zarina Usmonova", "Arab"],
  ["Alisher Temirov", "Koreys"], ["Rahimjon Sodiqov", "Arab"], ["Nilufar Ahmedova", "Ingliz"],
];

function seededRand(seedStr: string) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return ((h >>> 0) % 1000) / 1000; };
}

function daysAgoDate(days: number, hour = 9, min = 15): string | null {
  if (days >= 999) return null;
  const d = new Date(2025, 5, 18, hour, min);
  d.setDate(d.getDate() - days);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function grantedDate(days: number): string {
  const d = new Date(2025, 5, 18);
  d.setDate(d.getDate() - days);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function buildStudent(name: string, course: Lang, i: number): OnlineStudent {
  const r = seededRand(name + course);
  const set = MODULE_SETS[course];
  const levels = LEVELS[course];
  const level = levels[Math.floor(r() * levels.length)];

  const accessActive = r() > 0.12;
  const daysSince = !accessActive ? 999 : [0, 0, 1, 1, 2, 3, 5, 8, 14, 21][Math.floor(r() * 10)];
  const grantedDays = 20 + Math.floor(r() * 90);

  const totalLessons = set.reduce((s, m) => s + m[1], 0);
  const overallFrac = accessActive ? 0.15 + r() * 0.8 : 0.05 + r() * 0.3;
  let doneBudget = Math.round(totalLessons * overallFrac);
  const modules: ModuleProgress[] = set.map(([mname, total]) => {
    const done = Math.max(0, Math.min(total, doneBudget));
    doneBudget -= done;
    const avgScore = done === 0 ? 0 : 55 + Math.floor(r() * 45);
    return { name: mname, lessonsDone: done, lessonsTotal: total, avgScore };
  });
  const lessonsDone = modules.reduce((s, m) => s + m.lessonsDone, 0);
  const progressPct = Math.round((lessonsDone / totalLessons) * 100);

  const cur = modules.find((m) => m.lessonsDone < m.lessonsTotal) ?? modules[modules.length - 1];
  const curLessonNo = Math.min(cur.lessonsTotal, cur.lessonsDone + 1);

  const scored = modules.filter((m) => m.avgScore > 0);
  const avgScore = scored.length ? Math.round(scored.reduce((s, m) => s + m.avgScore, 0) / scored.length) : 0;
  const testsTotal = Math.round(lessonsDone / 2);
  const testsPassed = Math.round(testsTotal * (0.7 + r() * 0.3));
  const watchHours = Math.round(lessonsDone * (0.6 + r() * 0.5) * 10) / 10;
  const streakDays = daysSince <= 1 && accessActive ? 2 + Math.floor(r() * 20) : 0;
  const lastSeen = daysAgoDate(daysSince, 8 + Math.floor(r() * 12), Math.floor(r() * 59));

  const activity: ActivityItem[] = [];
  if (lastSeen) {
    activity.push({ text: `"${cur.name}" — ${curLessonNo}-dars ko'rildi`, at: lastSeen });
    activity.push({ text: `Test topshirildi — ${50 + Math.floor(r() * 50)}%`, at: daysAgoDate(daysSince + 1 + Math.floor(r() * 3)) ?? "" });
    activity.push({ text: `"${cur.name}" moduliga kirildi`, at: daysAgoDate(daysSince + 4 + Math.floor(r() * 4)) ?? "" });
  }
  activity.push({ text: "Platformaga ruxsat berildi", at: grantedDate(grantedDays) });

  return {
    id: `os_${i.toString().padStart(2, "0")}`,
    name,
    phone: `+998 9${Math.floor(r() * 9)} ${100 + Math.floor(r() * 899)} ${10 + Math.floor(r() * 89)} ${10 + Math.floor(r() * 89)}`,
    course, level, accessActive,
    grantedAt: grantedDate(grantedDays),
    lastSeen, daysSince,
    device: lastSeen ? `dev-${(i * 7841).toString(16)}` : null,
    currentModule: cur.name,
    currentLesson: `${curLessonNo}-dars / ${cur.lessonsTotal}`,
    progressPct, lessonsDone, lessonsTotal: totalLessons,
    testsPassed, testsTotal, avgScore, watchHours, streakDays,
    modules,
    activity: activity.filter((a) => a.at),
  };
}

export const SEED_ONLINE: OnlineStudent[] = NAMES.map(([n, c], i) => buildStudent(n, c, i + 1));

export function statusOf(s: OnlineStudent): { label: string; cls: string } {
  if (!s.accessActive) return { label: "Bloklangan", cls: "bg-secondary text-muted-foreground" };
  if (s.daysSince <= 2) return { label: "Faol", cls: "bg-emerald-100 text-emerald-700" };
  if (s.daysSince <= 7) return { label: "Sust", cls: "bg-amber-100 text-amber-700" };
  return { label: "Nofaol", cls: "bg-red-100 text-red-600" };
}
