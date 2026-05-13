import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Loader2, AlertCircle, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SHEET_ID = "1xnLEN8Rxx-jk1KDMSVO4qUagdvvGdn0678shPpfKjFM";
const API_KEY  = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";

type Period = "bugun" | "hafta" | "oy" | "barchasi";
type Tab = "taklif" | "shikoyat";

interface Row { text: string; sana: string; }

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/,/g, ".");
  const parts = cleaned.split(".");
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function filterByPeriod(rows: Row[], period: Period): Row[] {
  if (period === "barchasi") return rows;
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(now).getTime();
  return rows.filter(r => {
    const d = parseDate(r.sana);
    if (!d) return false;
    if (period === "bugun") return startOfDay(d).getTime() === todayStart;
    if (period === "hafta") {
      const diff = (now.getTime() - d.getTime()) / (1000*60*60*24);
      return diff >= 0 && diff < 7;
    }
    if (period === "oy") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

const PERIODS: { id: Period; label: string }[] = [
  { id: "bugun",    label: "Bugun"    },
  { id: "hafta",    label: "Hafta"    },
  { id: "oy",       label: "Oy"       },
  { id: "barchasi", label: "Barchasi" },
];

export function TaklifShikoyat() {
  const [takliflar,  setTakliflar]  = useState<Row[]>([]);
  const [shikoyatlar, setShikoyatlar] = useState<Row[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [period,     setPeriod]     = useState<Period>("barchasi");
  const [tab,        setTab]        = useState<Tab>("taklif");

  useEffect(() => {
    setLoading(true);
    const u1 = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Taklif!A:B?key=${API_KEY}`;
    const u2 = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Shikoyat!A:B?key=${API_KEY}`;
    Promise.all([fetch(u1), fetch(u2)])
      .then(async ([r1, r2]) => {
        if (!r1.ok) throw new Error(`Taklif xatosi: ${r1.status}`);
        if (!r2.ok) throw new Error(`Shikoyat xatosi: ${r2.status}`);
        return Promise.all([r1.json(), r2.json()]);
      })
      .then(([d1, d2]) => {
        const t: Row[] = (d1.values ?? []).slice(1).filter((r: string[]) => r[0]).map((r: string[]) => ({ text: r[0] ?? "", sana: r[1] ?? "" }));
        const s: Row[] = (d2.values ?? []).slice(1).filter((r: string[]) => r[0]).map((r: string[]) => ({ text: r[0] ?? "", sana: r[1] ?? "" }));
        setTakliflar(t.reverse());
        setShikoyatlar(s.reverse());
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /><span>Yuklanmoqda…</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 gap-3 text-red-500">
      <AlertCircle className="h-5 w-5" /><span>Xatolik: {error}</span>
    </div>
  );

  const displayed = filterByPeriod(
    tab === "taklif" ? takliflar : shikoyatlar,
    period
  );

  return (
    <div>
      <Header title="Taklif va Shikoyatlar" subtitle="Mijozlardan kelgan fikrlar" />

      {/* Период */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition",
              period === p.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ThumbsUp className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-emerald-700">Takliflar</span>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{filterByPeriod(takliflar, period).length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
              <ThumbsDown className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-sm font-medium text-red-700">Shikoyatlar</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{filterByPeriod(shikoyatlar, period).length}</p>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("taklif")}
          className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2",
            tab === "taklif" ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground hover:text-foreground")}>
          <ThumbsUp className="h-3.5 w-3.5" />
          Takliflar ({filterByPeriod(takliflar, period).length})
        </button>
        <button onClick={() => setTab("shikoyat")}
          className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2",
            tab === "shikoyat" ? "bg-red-500 text-white" : "bg-secondary text-muted-foreground hover:text-foreground")}>
          <ThumbsDown className="h-3.5 w-3.5" />
          Shikoyatlar ({filterByPeriod(shikoyatlar, period).length})
        </button>
      </div>

      {/* Список */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-16 text-center text-muted-foreground text-sm">
            Bu davr uchun ma'lumot yo'q
          </div>
        ) : displayed.map((r, i) => (
          <div key={i} className={cn("bg-card rounded-2xl border p-4",
            tab === "taklif" ? "border-emerald-500/20" : "border-red-500/20")}>
            <div className="flex items-start gap-3">
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                tab === "taklif" ? "bg-emerald-500/10" : "bg-red-500/10")}>
                {tab === "taklif"
                  ? <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                  : <ThumbsDown className="h-3.5 w-3.5 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed">{r.text}</p>
                {r.sana && (
                  <p className="text-xs text-muted-foreground mt-1.5">{r.sana}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
