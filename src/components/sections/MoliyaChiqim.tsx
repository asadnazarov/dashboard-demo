import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const STORAGE_KEY = "demo:moliyachiqim";

const CHIQIM_COLORS: Record<string, string> = {
  "Marketing":      "hsl(230 70% 55%)",
  "Suniy Intelekt": "hsl(270 60% 55%)",
  "Oylik":          "hsl(142 60% 45%)",
  "Soliq":          "hsl(38 92% 50%)",
  "Arenda":         "hsl(200 70% 50%)",
  "Ofis harajat":   "hsl(160 50% 45%)",
  "KPI":            "hsl(25 85% 55%)",
  "Bonus":          "hsl(340 70% 55%)",
  "Pul qaytildi":   "hsl(0 70% 55%)",
  "Boshqa":         "hsl(220 9% 60%)",
};

const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString("ru-RU") + " so'm";

function parseDate(sana: string): Date | null {
  const parts = sana.trim().split(".");
  if (parts.length < 3) return null;
  const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  if (isNaN(d.getTime())) return null;
  return d;
}

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function inputToDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function defaultFrom(): string {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
}

function defaultTo(): string {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

interface Row {
  sana:       string;
  filial:     string;
  summa:      number;
  chiqimTuri: string;
}

function fmtSana(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function generateSeedRows(): Row[] {
  const filiallar = ["Novza", "Yunusobod"];
  const turlar = ["Marketing", "Suniy Intelekt", "Oylik", "Soliq", "Arenda", "Ofis harajat", "KPI", "Bonus"];
  const rows: Row[] = [];
  const now = new Date();
  let seed = 42;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  for (let i = 0; i < 75; i++) {
    const daysAgo = Math.floor(rand() * 60);
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
    const filial = filiallar[Math.floor(rand() * filiallar.length)];
    const turi = turlar[Math.floor(rand() * turlar.length)];
    let summa: number;
    if (turi === "Oylik") summa = 4000000 + Math.floor(rand() * 8000000);
    else if (turi === "Arenda") summa = 8000000 + Math.floor(rand() * 10000000);
    else if (turi === "Marketing") summa = 500000 + Math.floor(rand() * 4000000);
    else if (turi === "Soliq") summa = 1000000 + Math.floor(rand() * 4000000);
    else if (turi === "Suniy Intelekt") summa = 200000 + Math.floor(rand() * 1500000);
    else if (turi === "KPI") summa = 500000 + Math.floor(rand() * 2000000);
    else if (turi === "Bonus") summa = 300000 + Math.floor(rand() * 1500000);
    else summa = 100000 + Math.floor(rand() * 1000000);

    rows.push({ sana: fmtSana(d), filial, summa: -summa, chiqimTuri: turi });
  }
  return rows;
}

function loadRows(): Row[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Row[];
  } catch { /* ignore */ }
  const seeded = generateSeedRows();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)); } catch { /* ignore */ }
  return seeded;
}

export function MoliyaChiqim() {
  const [rows,    setRows]    = useState<Row[]>([]);
  const [from,    setFrom]    = useState(defaultFrom());
  const [to,      setTo]      = useState(defaultTo());
  const [filial,  setFilial]  = useState("Barchasi");

  useEffect(() => {
    setRows(loadRows());
  }, []);

  const fromDate = inputToDate(from);
  const toDate   = inputToDate(to);

  const filtered = rows.filter(r => {
    const d = parseDate(r.sana);
    if (!d) return false;
    if (fromDate && d < fromDate) return false;
    if (toDate   && d >= toDate)  return false;
    if (filial !== "Barchasi" && r.filial !== filial) return false;
    return true;
  });

  // Группировка по chiqimTuri
  const grouped: Record<string, number> = {};
  filtered.forEach(r => {
    const key = r.chiqimTuri || "Boshqa";
    grouped[key] = (grouped[key] ?? 0) + Math.abs(r.summa);
  });

  const total = Object.values(grouped).reduce((a, b) => a + b, 0);

  const sorted = Object.entries(grouped)
    .sort((a, b) => b[1] - a[1]);

  const pieData = sorted.map(([name, value]) => ({
    name,
    value,
    color: CHIQIM_COLORS[name] ?? CHIQIM_COLORS["Boshqa"],
  }));

  return (
    <div>
      <Header title="Moliya Chiqim Analizi" subtitle="Xarajatlar tahlili kategoriyalar bo'yicha" />

      {/* Фильтры */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dan</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Gacha</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Filial</label>
            <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
              {["Barchasi", "Novza", "Yunusobod"].map(f => (
                <button key={f} onClick={() => setFilial(f)}
                  className={cn("flex-1 py-2 px-2 transition border-r border-border last:border-0 text-xs",
                    filial === f ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 text-center text-muted-foreground text-sm">
          Bu davr uchun chiqimlar yo'q
        </div>
      ) : (
        <>
          {/* Итого */}
          <div className="bg-card rounded-2xl border border-red-500/20 bg-red-500/5 p-5 mb-6">
            <p className="text-sm font-medium text-red-700 mb-1">Jami chiqim</p>
            <p className="text-3xl font-bold text-red-600">{fmt(total)}</p>
            <p className="text-xs text-red-500 mt-1">{sorted.length} ta kategoriya · {filtered.length} ta tranzaksiya</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Список категорий */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold">Kategoriyalar bo'yicha</h3>
              </div>
              <div className="divide-y divide-border">
                {sorted.map(([name, summa]) => {
                  const pct = total > 0 ? (summa / total * 100).toFixed(1) : "0";
                  const color = CHIQIM_COLORS[name] ?? CHIQIM_COLORS["Boshqa"];
                  return (
                    <div key={name} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{name}</span>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <div className="text-xs font-semibold mt-1" style={{ color }}>
                          {fmt(summa)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Пирог */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-semibold mb-4">Taqsimot</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name"
                    innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    formatter={(val: number) => [fmt(val), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                {pieData.map(e => (
                  <div key={e.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                    <span className="truncate text-muted-foreground">{e.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Детальная таблица */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Batafsil jadval</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border">
                    <th className="px-4 py-3 font-medium">Kategoriya</th>
                    <th className="px-4 py-3 font-medium text-right">Summa</th>
                    <th className="px-4 py-3 font-medium text-right">Ulushi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.map(([name, summa]) => {
                    const pct = total > 0 ? (summa / total * 100).toFixed(1) : "0";
                    const color = CHIQIM_COLORS[name] ?? CHIQIM_COLORS["Boshqa"];
                    return (
                      <tr key={name} className="hover:bg-secondary/40 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                            <span className="font-medium">{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-red-500">
                          -{fmt(summa)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-secondary/50 font-semibold">
                    <td className="px-4 py-3">Jami</td>
                    <td className="px-4 py-3 text-right text-red-600">-{fmt(total)}</td>
                    <td className="px-4 py-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
