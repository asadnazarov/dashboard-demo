import { useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Users, Activity, TrendingUp, GraduationCap, AlertTriangle, Search, Clock, PlayCircle,
  CheckCircle2, Flame, Timer, X, Smartphone, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  SEED_ONLINE, WEEK_ACTIVITY, LANGS, LANG_HSL, statusOf, type OnlineStudent, type Lang,
} from "@/data/online";

const KEY = "demo:online-progress";
const BRAND = "hsl(230 70% 55%)";
const EMERALD = "hsl(152 60% 40%)";

function loadOverrides(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

export function OnlineDostup() {
  const [overrides, setOverrides] = useState<Record<string, boolean>>(loadOverrides);
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState<Lang | "all">("all");
  const [status, setStatus] = useState<"all" | "faol" | "nofaol" | "bloklangan">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const students: OnlineStudent[] = useMemo(
    () => SEED_ONLINE.map((s) => (s.id in overrides ? { ...s, accessActive: overrides[s.id] } : s)),
    [overrides],
  );

  const toggleAccess = (id: string, val: boolean) => {
    const next = { ...overrides, [id]: val };
    setOverrides(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const stats = useMemo(() => {
    const withAccess = students.filter((s) => s.accessActive);
    const active7 = students.filter((s) => s.accessActive && s.daysSince <= 7).length;
    const avgProgress = withAccess.length ? Math.round(withAccess.reduce((a, s) => a + s.progressPct, 0) / withAccess.length) : 0;
    const scored = students.filter((s) => s.avgScore > 0);
    const avgScore = scored.length ? Math.round(scored.reduce((a, s) => a + s.avgScore, 0) / scored.length) : 0;
    const atRisk = students.filter((s) => s.accessActive && s.daysSince > 7).length;
    const buckets = [{ name: "0–25%", value: 0 }, { name: "25–50%", value: 0 }, { name: "50–75%", value: 0 }, { name: "75–100%", value: 0 }];
    students.forEach((s) => { buckets[Math.min(3, Math.floor(s.progressPct / 25))].value++; });
    const byCourse = LANGS.map((l) => {
      const g = students.filter((s) => s.course === l);
      return { name: l, value: g.length ? Math.round(g.reduce((a, s) => a + s.progressPct, 0) / g.length) : 0 };
    });
    return { access: withAccess.length, active7, avgProgress, avgScore, atRisk, buckets, byCourse };
  }, [students]);

  const inactive = useMemo(
    () => students.filter((s) => s.accessActive && s.daysSince > 7).sort((a, b) => b.daysSince - a.daysSince),
    [students],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (course !== "all" && s.course !== course) return false;
      if (status === "faol" && !(s.accessActive && s.daysSince <= 2)) return false;
      if (status === "nofaol" && !(s.accessActive && s.daysSince > 7)) return false;
      if (status === "bloklangan" && s.accessActive) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.phone.includes(q)) return false;
      return true;
    });
  }, [students, search, course, status]);

  const selected = students.find((s) => s.id === selectedId) ?? null;

  return (
    <div>
      <Header title="Online Dostup" subtitle="Onlayn platformada o'quvchilar nazorati va natijalari" />

      {/* KPI */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
        <Kpi icon={<Users className="h-5 w-5" />} label="Ruxsat berilgan" value={stats.access} />
        <Kpi icon={<Activity className="h-5 w-5" />} label="Faol (7 kun)" value={stats.active7} />
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="O'rtacha progress" value={`${stats.avgProgress}%`} />
        <Kpi icon={<GraduationCap className="h-5 w-5" />} label="O'rtacha ball" value={stats.avgScore} />
        <Kpi icon={<AlertTriangle className="h-5 w-5" />} label="Xavf ostida" value={stats.atRisk} danger={stats.atRisk > 0} />
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card title="Haftalik faollik">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={WEEK_ACTIVITY} margin={{ left: -20, right: 8, top: 8 }}>
              <defs><linearGradient id="oa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND} stopOpacity={0.2} /><stop offset="100%" stopColor={BRAND} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v) => [`${v}%`, "Faol"]} />
              <Area type="monotone" dataKey="faol" stroke={BRAND} strokeWidth={2.5} fill="url(#oa)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Progress taqsimoti">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.buckets} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v) => [`${v} o'quvchi`, ""]} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={54} fill={EMERALD} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Kurs bo'yicha bajarilishi">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.byCourse} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} unit="%" />
              <Tooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v) => [`${v}%`, "o'rtacha"]} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={54}>
                {stats.byCourse.map((c) => <Cell key={c.name} fill={LANG_HSL[c.name as Lang]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* inactivity alert */}
      {inactive.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-2.5">
            <AlertTriangle className="h-4 w-4" /> Uzoq vaqt kirmagan o'quvchilar ({inactive.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {inactive.map((s) => (
              <button key={s.id} onClick={() => setSelectedId(s.id)}
                className="inline-flex items-center gap-2 bg-card border border-amber-200 rounded-xl px-3 py-1.5 text-sm hover:border-amber-400 transition">
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="text-xs text-red-500 font-semibold">{s.daysSince} kun</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* access list */}
      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border">
          <h3 className="font-semibold">O'quvchilar — dostup va natijalar</h3>
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism yoki telefon..."
              className="h-9 w-56 pl-9 pr-3 rounded-lg bg-secondary text-sm focus:bg-card focus:outline-none border border-transparent focus:border-border transition" />
          </div>
          <FilterSelect value={course} onChange={(v) => setCourse(v as Lang | "all")}
            options={[["all", "Barcha kurslar"], ...LANGS.map((l) => [l, l] as [string, string])]} />
          <FilterSelect value={status} onChange={(v) => setStatus(v as typeof status)}
            options={[["all", "Barcha statuslar"], ["faol", "Faol"], ["nofaol", "Nofaol"], ["bloklangan", "Bloklangan"]]} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border">
                <Th>O'quvchi</Th><Th>Kurs</Th><Th>Progress</Th><Th>Oxirgi kirish</Th><Th>Ball</Th><Th>Status</Th><Th>Ruxsat</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((s) => {
                const st = statusOf(s);
                return (
                  <tr key={s.id} className="hover:bg-secondary/40 transition">
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedId(s.id)}>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground num">{s.phone}</div>
                    </td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedId(s.id)}>{s.course}</td>
                    <td className="px-4 py-3 cursor-pointer min-w-[140px]" onClick={() => setSelectedId(s.id)}><ProgressBar pct={s.progressPct} /></td>
                    <td className="px-4 py-3 cursor-pointer whitespace-nowrap" onClick={() => setSelectedId(s.id)}>
                      {s.lastSeen ? <span className="num text-muted-foreground">{s.lastSeen}</span> : <span className="text-red-500">Hali kirmagan</span>}
                    </td>
                    <td className="px-4 py-3 cursor-pointer num font-semibold" onClick={() => setSelectedId(s.id)}>{s.avgScore || "—"}</td>
                    <td className="px-4 py-3"><span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", st.cls)}>{st.label}</span></td>
                    <td className="px-4 py-3"><Switch checked={s.accessActive} onCheckedChange={(v) => toggleAccess(s.id, v)} /></td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Topilmadi</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* student detail modal */}
      {selected && <StudentModal student={selected} onClose={() => setSelectedId(null)} onToggle={(v) => toggleAccess(selected.id, v)} />}
    </div>
  );
}

function StudentModal({ student: s, onClose, onToggle }: { student: OnlineStudent; onClose: () => void; onToggle: (v: boolean) => void }) {
  const st = statusOf(s);
  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl border border-border shadow-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg truncate">{s.name}</h3>
            <p className="text-xs text-muted-foreground num">{s.phone} · {s.course} · {s.level}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", st.cls)}>{st.label}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Oxirgi kirish: {s.lastSeen ?? "Hali kirmagan"}</span>
          </div>

          {/* where they stopped */}
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5"><PlayCircle className="h-4 w-4 text-brand" /> Hozir shu yerda to'xtagan</div>
            <div className="font-semibold">{s.currentModule}</div>
            <div className="text-sm text-muted-foreground">{s.currentLesson}</div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Umumiy progress</span>
              <span className="num font-semibold">{s.progressPct}%</span>
            </div>
            <ProgressBar pct={s.progressPct} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat icon={<CheckCircle2 className="h-4 w-4" />} label="Darslar" value={`${s.lessonsDone}/${s.lessonsTotal}`} />
            <MiniStat icon={<GraduationCap className="h-4 w-4" />} label="Testlar" value={`${s.testsPassed}/${s.testsTotal}`} />
            <MiniStat icon={<Flame className="h-4 w-4" />} label="Ketma-ket" value={`${s.streakDays} kun`} />
            <MiniStat icon={<Timer className="h-4 w-4" />} label="Ko'rildi" value={`${s.watchHours} soat`} />
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold mb-2.5"><BookOpen className="h-4 w-4 text-brand" /> Modullar bo'yicha</div>
            <div className="space-y-3">
              {s.modules.map((m) => {
                const pct = Math.round((m.lessonsDone / m.lessonsTotal) * 100);
                return (
                  <div key={m.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{m.name}</span>
                      <span className="num text-muted-foreground">{m.lessonsDone}/{m.lessonsTotal}{m.avgScore ? ` · ${m.avgScore}%` : ""}</span>
                    </div>
                    <ProgressBar pct={pct} thin />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2.5">Faollik tarixi</div>
            <ol className="relative border-l border-border ml-1.5 space-y-4">
              {s.activity.map((a, i) => (
                <li key={i} className="ml-5">
                  <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-card" />
                  <div className="text-sm">{a.text}</div>
                  <div className="num text-xs text-muted-foreground mt-0.5">{a.at}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
            <div>
              <div className="text-sm font-medium">Platformaga ruxsat</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                Berilgan: {s.grantedAt}
                {s.device && <span className="inline-flex items-center gap-1"><Smartphone className="h-3 w-3" />{s.device}</span>}
              </div>
            </div>
            <Switch checked={s.accessActive} onCheckedChange={onToggle} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ pct, thin }: { pct: number; thin?: boolean }) {
  const cls = pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className={cn("w-full rounded-full bg-secondary overflow-hidden", thin ? "h-1.5" : "h-2")}>
      <div className={cn("h-full rounded-full transition-all", cls)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{icon}{label}</div>
      <div className="num font-semibold">{value}</div>
    </div>
  );
}

function Kpi({ icon, label, value, danger }: { icon: React.ReactNode; label: string; value: string | number; danger?: boolean }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-soft p-4">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", danger ? "bg-red-50 text-red-500" : "bg-brand-soft text-brand")}>{icon}</div>
      <div className="num text-2xl font-bold mt-3">{value}</div>
      <div className="text-[13px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-soft p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-9 px-3 text-sm rounded-lg bg-card border border-border text-foreground focus:outline-none focus:border-primary cursor-pointer">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => <th className="px-4 py-3 font-medium whitespace-nowrap">{children}</th>;
