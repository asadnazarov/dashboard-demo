import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import {
  Phone, ArrowLeft, Loader2,
  Calendar, ChevronRight, ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";

const CALLS_KEY = "demo:sotuv-analizi-calls";
const SALES_KEY = "demo:sotuv-analizi-sales";

const MANAGERS = ["Ziyoda", "Rayhon", "Rais", "Jamshid"];
const EHTIYOJ_OPTIONS = ["B toifa", "A toifa", "C toifa", "AKP toifa"];
const LID_OPTIONS = ["issiq", "iliq", "sovuq"];

interface CallRow {
  callId:      string;
  managerName: string;
  status:      string;
  date:        string;
  score:       number;
  lidSifati:   string;
  ehtiyoj:     string;
  clientPhone: string;
}

type SalesMap = Record<string, number>;
type Period = "bugun" | "hafta" | "oy" | "barchasi";
type View   = "managers" | "calls";

function parseSheetDate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function parseSaleDate(raw: string): Date | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/,/g, ".");
  const parts = cleaned.split(".");
  if (parts.length === 3) {
    const day   = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year  = parseInt(parts[2]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function formatDate(raw: string): string {
  const d = parseSheetDate(raw);
  if (!d) return raw;
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function filterByPeriod(rows: CallRow[], period: Period): CallRow[] {
  if (period === "barchasi") return rows;
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(now).getTime();
  return rows.filter((r) => {
    const d = parseSheetDate(r.date);
    if (!d) return false;
    if (period === "bugun") return startOfDay(d).getTime() === todayStart;
    if (period === "hafta") {
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff < 7;
    }
    if (period === "oy") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

function filterSalesByPeriod(
  salesRows: { name: string; date: Date }[],
  period: Period
): { name: string; date: Date }[] {
  if (period === "barchasi") return salesRows;
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(now).getTime();
  return salesRows.filter(({ date: d }) => {
    if (period === "bugun") return startOfDay(d).getTime() === todayStart;
    if (period === "hafta") {
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff < 7;
    }
    if (period === "oy") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(score: number) {
  if (score >= 70) return "bg-emerald-500/10 border-emerald-500/30";
  if (score >= 50) return "bg-amber-500/10 border-amber-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function lidColor(lid: string) {
  const l = lid?.toLowerCase();
  if (l === "issiq") return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  if (l === "iliq")  return "bg-amber-500/15  text-amber-700  border-amber-500/30";
  if (l === "sovuq") return "bg-blue-500/15   text-blue-700   border-blue-500/30";
  return "bg-secondary text-muted-foreground border-border";
}

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-fuchsia-500 to-pink-600",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const PERIODS: { id: Period; label: string }[] = [
  { id: "bugun",    label: "Bugun"    },
  { id: "hafta",    label: "Hafta"    },
  { id: "oy",       label: "Oy"       },
  { id: "barchasi", label: "Barchasi" },
];

function fmtIso(d: Date): string {
  return d.toISOString();
}

function fmtSaleDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function generateSeedCalls(): CallRow[] {
  let seed = 23;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const now = new Date();
  const rows: CallRow[] = [];
  let callId = 1;
  MANAGERS.forEach((manager) => {
    const callsCount = 60 + Math.floor(rand() * 40);
    for (let i = 0; i < callsCount; i++) {
      const daysAgo = Math.floor(rand() * 45);
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 9 + Math.floor(rand() * 10), Math.floor(rand() * 60));
      rows.push({
        callId: String(callId++),
        managerName: manager,
        status: "done",
        date: fmtIso(d),
        score: 35 + Math.floor(rand() * 60),
        lidSifati: LID_OPTIONS[Math.floor(rand() * LID_OPTIONS.length)],
        ehtiyoj: EHTIYOJ_OPTIONS[Math.floor(rand() * EHTIYOJ_OPTIONS.length)],
        clientPhone: `+998 9${Math.floor(rand() * 10)} ${String(100 + Math.floor(rand() * 900))} ${String(10 + Math.floor(rand() * 90))} ${String(10 + Math.floor(rand() * 90))}`,
      });
    }
  });
  return rows;
}

function generateSeedSales(): { name: string; date: string }[] {
  let seed = 71;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const now = new Date();
  const sales: { name: string; date: string }[] = [];
  MANAGERS.forEach((manager) => {
    const salesCount = 18 + Math.floor(rand() * 25);
    for (let i = 0; i < salesCount; i++) {
      const daysAgo = Math.floor(rand() * 45);
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
      sales.push({ name: manager, date: fmtSaleDate(d) });
    }
  });
  return sales;
}

function loadCalls(): CallRow[] {
  try {
    const raw = localStorage.getItem(CALLS_KEY);
    if (raw) return JSON.parse(raw) as CallRow[];
  } catch { /* ignore */ }
  const seeded = generateSeedCalls();
  try { localStorage.setItem(CALLS_KEY, JSON.stringify(seeded)); } catch { /* ignore */ }
  return seeded;
}

function loadSales(): { name: string; date: string }[] {
  try {
    const raw = localStorage.getItem(SALES_KEY);
    if (raw) return JSON.parse(raw) as { name: string; date: string }[];
  } catch { /* ignore */ }
  const seeded = generateSeedSales();
  try { localStorage.setItem(SALES_KEY, JSON.stringify(seeded)); } catch { /* ignore */ }
  return seeded;
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-foreground transition mb-5 border border-border"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

export function SotuvAnalizi() {
  const [rows,     setRows]     = useState<CallRow[]>([]);
  const [allSales, setAllSales] = useState<{ name: string; date: Date }[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [period,   setPeriod]   = useState<Period>("barchasi");
  const [view,     setView]     = useState<View>("managers");
  const [selMgr,   setSelMgr]   = useState<string | null>(null);

  useEffect(() => {
    setRows(loadCalls());
    setAllSales(loadSales().map((s) => ({ name: s.name, date: parseSaleDate(s.date)! })).filter((s) => s.date));
    setLoading(false);
  }, []);

  const salesMap: SalesMap = {};
  filterSalesByPeriod(allSales, period).forEach(({ name }) => {
    const key = name.trim();
    salesMap[key] = (salesMap[key] ?? 0) + 1;
  });

  function openManager(name: string) { setSelMgr(name); setView("calls"); }
  function backToManagers()          { setView("managers"); setSelMgr(null); }

  const PeriodTabs = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          onClick={() => setPeriod(p.id)}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-medium transition",
            period === p.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center gap-3 py-32 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /><span>Yuklanmoqda…</span>
    </div>
  );

  const filtered = filterByPeriod(rows, period);

  if (view === "calls" && selMgr) {
    const mgrCalls = filterByPeriod(
      rows.filter((r) => r.managerName === selMgr),
      period
    ).sort((a, b) => {
      const da = parseSheetDate(a.date)?.getTime() ?? 0;
      const db = parseSheetDate(b.date)?.getTime() ?? 0;
      return db - da;
    });

    const avgScore   = mgrCalls.length ? Math.round(mgrCalls.reduce((s, c) => s + c.score, 0) / mgrCalls.length) : 0;
    const hotLeads   = mgrCalls.filter((c) => c.lidSifati?.toLowerCase() === "issiq").length;
    const salesCount = salesMap[selMgr] ?? 0;

    return (
      <div>
        <BackButton onClick={backToManagers} label="Barcha menejerlar" />
        <Header title={selMgr} subtitle={`${mgrCalls.length} ta zvonok tahlil qilindi`} />
        <PeriodTabs />

        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Zvonoklar</div>
            <div className="text-2xl font-bold">{mgrCalls.length}</div>
          </div>
          <div className={cn("rounded-2xl border p-4 text-center", scoreBg(avgScore))}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">O'rtacha ball</div>
            <div className={cn("text-2xl font-bold", scoreColor(avgScore))}>{avgScore || "—"}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Issiq lidlar</div>
            <div className="text-2xl font-bold text-emerald-500">{hotLeads}</div>
          </div>
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sotuvlar</div>
            <div className="text-2xl font-bold text-blue-500">{salesCount}</div>
          </div>
        </div>

        {mgrCalls.length === 0 ? (
          <p className="text-center py-16 text-sm text-muted-foreground">Bu davr uchun zvonoklar yo'q</p>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Zvonoklar</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Batafsil ko'rish uchun qatorga bosing</p>
            </div>
            <div className="hidden sm:grid grid-cols-[1fr_120px_110px_90px] gap-4 px-5 py-2.5 bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div>Telefon / Sana</div>
              <div>Lid sifati</div>
              <div>Ehtiyoj</div>
              <div className="text-right">Ball</div>
            </div>
            <div className="divide-y divide-border">
              {mgrCalls.map((c) => {
                const displayPhone = c.clientPhone || `#${c.callId}`;
                return (
                  <div
                    key={c.callId}
                    className="w-full text-left px-5 py-4 grid grid-cols-[1fr_120px_110px_90px] gap-4 items-center"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{displayPhone}</div>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{formatDate(c.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {c.lidSifati ? (
                        <span className={cn("text-xs px-2.5 py-1 rounded-full border font-semibold", lidColor(c.lidSifati))}>
                          {c.lidSifati}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div>
                      {c.ehtiyoj ? (
                        <span className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary text-muted-foreground font-medium">
                          {c.ehtiyoj}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={cn("text-xl font-bold", scoreColor(c.score))}>{c.score || "—"}</div>
                      <div className="text-xs text-muted-foreground">ball</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const byManager: Record<string, CallRow[]> = {};
  filtered.forEach((r) => {
    if (!byManager[r.managerName]) byManager[r.managerName] = [];
    byManager[r.managerName].push(r);
  });

  const managerList = Object.entries(byManager)
    .map(([name, calls]) => ({
      name,
      calls,
      avgScore: calls.length ? Math.round(calls.reduce((s, c) => s + c.score, 0) / calls.length) : 0,
      sales: salesMap[name] ?? 0,
    }))
    .sort((a, b) => b.calls.length - a.calls.length);

  return (
    <div>
      <Header title="Sotuv Analizi" subtitle="Menejerlar va zvonoklar tahlili" />
      <PeriodTabs />

      {managerList.length === 0 ? (
        <p className="text-center py-16 text-sm text-muted-foreground">Bu davr uchun ma'lumot yo'q</p>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold">Menejerlar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Batafsil ko'rish uchun qatorga bosing</p>
          </div>
          <div className="hidden sm:grid grid-cols-[1fr_100px_120px_120px_36px] gap-4 px-5 py-2.5 bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <div>Menejer</div>
            <div className="text-center">Zvonoklar</div>
            <div className="text-center">Sotuvlar</div>
            <div className="text-right">O'rtacha ball</div>
            <div></div>
          </div>
          <div className="divide-y divide-border">
            {managerList.map((m) => (
              <button
                key={m.name}
                onClick={() => openManager(m.name)}
                className="w-full text-left px-5 py-4 hover:bg-secondary/60 transition grid grid-cols-[1fr_100px_120px_120px_36px] gap-4 items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white text-sm shrink-0",
                    avatarColor(m.name)
                  )}>
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{m.name}</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold">{m.calls.length}</div>
                  <div className="text-xs text-muted-foreground">zvonok</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center text-blue-500">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span className="text-lg font-bold">{m.sales}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">sotuv</div>
                </div>

                <div className="text-right">
                  <div className={cn("text-lg font-bold", scoreColor(m.avgScore))}>{m.avgScore || "—"}</div>
                  <div className="text-xs text-muted-foreground">ball</div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
