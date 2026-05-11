import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import {
  Loader2, AlertCircle, Search, Plus, X,
  ChevronDown, ChevronUp, Check, UserMinus
} from "lucide-react";
import { cn } from "@/lib/utils";

const SHEET_ID2   = "1StqPMbH2IWX_722F9MVp92gKOGitlTuUBVYrtZ7GUvI";
const SHEET_DAVO  = "14nKtubJjuMJhQ9NQO8ORIfFGYAbBVKYrKDZpB96vc6Q";
const API_KEY     = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";
const RANGE2      = "%D0%9B%D0%B8%D1%81%D1%821!A:Q";
const RANGE_DAVO  = "%D0%9B%D0%B8%D1%81%D1%821!A:F";
const WEBHOOK     = "https://n8n.srv1215497.hstgr.cloud/webhook/davomat";

const VAQTLAR = ["10:00","13:00","15:00","19:00","21:00"];

function todayStr(): string {
  const now = new Date();
  return `${String(now.getDate()).padStart(2,"0")}.${String(now.getMonth()+1).padStart(2,"0")}.${now.getFullYear()}`;
}

function todayInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

function toSheetDate(input: string): string {
  const p = input.split("-");
  if (p.length < 3) return input;
  return `${p[2]}.${p[1]}.${p[0]}`;
}

interface Student {
  rowIndex: number;
  ism:      string;
  telefon:  string;
  filial:   string;
  smena:    string;
  pravaOldi: string;
}

interface DavomatRow {
  ism:    string;
  telefon:string;
  filial: string;
  smena:  string;
  sana:   string;
  holat:  string;
}

type Tab = "davomat" | "jadval";

function Toggle({ left, right, value, onChange }: {
  left: string; right: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
      <button onClick={() => onChange(left)} className={cn("flex-1 py-2 px-3 transition", value === left ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>{left}</button>
      <button onClick={() => onChange(right)} className={cn("flex-1 py-2 px-3 transition border-l border-border", value === right ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>{right}</button>
    </div>
  );
}

export function Ustoz() {
  const [students,  setStudents]  = useState<Student[]>([]);
  const [davomat,   setDavomat]   = useState<DavomatRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [tab,       setTab]       = useState<Tab>("davomat");
  const [search,    setSearch]    = useState("");
  const [filterSmena,  setFilterSmena]  = useState("Barchasi");
  const [filterFilial, setFilterFilial] = useState("Barchasi");

  // Форма добавления
  const [showAdd,    setShowAdd]    = useState(false);
  const [addIsm,     setAddIsm]     = useState("");
  const [addTel,     setAddTel]     = useState("");
  const [addFilial,  setAddFilial]  = useState("Novza");
  const [addSmena,   setAddSmena]   = useState("10:00");
  const [addDars,    setAddDars]    = useState(todayInput());
  const [addLoading, setAddLoading] = useState(false);
  const [addResult,  setAddResult]  = useState<string | null>(null);

  // Отметка
  const [marking, setMarking] = useState<Record<string, boolean>>({});

  const fetchAll = () => {
    setLoading(true);
    const u1 = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID2}/values/${RANGE2}?key=${API_KEY}`;
    const u2 = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_DAVO}/values/${RANGE_DAVO}?key=${API_KEY}`;
    Promise.all([fetch(u1), fetch(u2)])
      .then(async ([r1, r2]) => {
        if (!r1.ok) throw new Error(`Baza xatosi: ${r1.status}`);
        if (!r2.ok) throw new Error(`Davomat xatosi: ${r2.status}`);
        return Promise.all([r1.json(), r2.json()]);
      })
      .then(([d1, d2]) => {
        const rows1: string[][] = d1.values ?? [];
        const parsed: Student[] = rows1.slice(1)
          .filter(r => r[1])
          .map((r, i) => ({
            rowIndex:  i + 2,
            ism:       r[1]  ?? "",
            telefon:   r[2]  ?? "",
            filial:    r[3]  ?? "",
            smena:     r[6]  ?? "",
            pravaOldi: r[15] ?? "",
          }))
          .filter(s => !s.pravaOldi || s.pravaOldi.trim() === "");
        setStudents(parsed);

        const rows2: string[][] = d2.values ?? [];
        const dav: DavomatRow[] = rows2.slice(1)
          .filter(r => r[0])
          .map(r => ({
            ism:    r[0] ?? "",
            telefon:r[1] ?? "",
            filial: r[2] ?? "",
            smena:  r[3] ?? "",
            sana:   r[4] ?? "",
            holat:  r[5] ?? "",
          }));
        setDavomat(dav);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // Получить записи посещаемости по телефону
  function getStudentDavomat(telefon: string): DavomatRow[] {
    return davomat
      .filter(d => d.telefon === telefon)
      .sort((a, b) => {
        const pa = a.sana.split(".").reverse().join("");
        const pb = b.sana.split(".").reverse().join("");
        return pa.localeCompare(pb);
      });
  }

  // Отмечена ли сегодня
  function isMarkedToday(telefon: string): string | null {
    const today = todayStr();
    const rec = davomat.find(d => d.telefon === telefon && d.sana === today);
    return rec ? rec.holat : null;
  }

  async function markDavomat(student: Student, holat: "Bor" | "Yo'q") {
    const key = student.telefon;
    setMarking(m => ({ ...m, [key]: true }));
    const today = todayStr();
    const davRows = getStudentDavomat(student.telefon);
    const kunRaqami = davRows.length + 1;
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:      "mark",
          ism:         student.ism,
          telefon:     student.telefon,
          filial:      student.filial,
          smena:       student.smena,
          sana:        today,
          holat,
          kun_raqami:  kunRaqami,
        }),
      });
      setTimeout(() => fetchAll(), 1500);
    } catch {}
    finally { setMarking(m => ({ ...m, [key]: false })); }
  }

  async function removeStudent(student: Student) {
    if (!confirm(`${student.ism} o'chirilsinmi?`)) return;
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:  "remove_student",
          ism:     student.ism,
          telefon: student.telefon,
          row:     student.rowIndex,
        }),
      });
      setTimeout(() => fetchAll(), 1500);
    } catch {}
  }

  async function submitAdd() {
    if (!addIsm || !addTel) { setAddResult("❌ Ism va telefonni kiriting"); return; }
    setAddLoading(true); setAddResult(null);
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:    "add_student",
          ism:       addIsm,
          telefon:   addTel,
          filial:    addFilial,
          smena:     addSmena,
          dars_kuni: toSheetDate(addDars),
        }),
      });
      setAddResult("✅ Saqlandi!");
      setAddIsm(""); setAddTel(""); setAddDars(todayInput());
      setTimeout(() => fetchAll(), 2000);
    } catch { setAddResult("❌ Xatolik"); }
    finally { setAddLoading(false); }
  }

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

  const today = todayStr();

  // Фильтр для Jadval
  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase();
    if (q && !s.ism.toLowerCase().includes(q) && !s.telefon.includes(q)) return false;
    if (filterSmena !== "Barchasi" && s.smena !== filterSmena) return false;
    if (filterFilial !== "Barchasi" && s.filial !== filterFilial) return false;
    return true;
  });

  // Группировка по сменам для Davomat
  const bySmena: Record<string, Student[]> = {};
  students.forEach(s => {
    const key = s.smena || "Noma'lum";
    if (!bySmena[key]) bySmena[key] = [];
    bySmena[key].push(s);
  });
  const sortedSmenas = VAQTLAR.filter(v => bySmena[v]).concat(
    Object.keys(bySmena).filter(k => !VAQTLAR.includes(k))
  );

  const totalToday = students.filter(s => isMarkedToday(s.telefon)).length;

  return (
    <div>
      <Header title="Ustoz Panel" subtitle={`Bugun: ${today}`} />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("davomat")}
          className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition",
            tab === "davomat" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
          Davomat
        </button>
        <button onClick={() => setTab("jadval")}
          className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition",
            tab === "jadval" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
          Jadval
        </button>
        <div className="ml-auto">
          <button onClick={() => { setShowAdd(!showAdd); setAddResult(null); }}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2",
              showAdd ? "bg-primary text-primary-foreground" : "bg-emerald-600 text-white hover:bg-emerald-700")}>
            {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAdd ? "Yopish" : "O'quvchi qo'shish"}
          </button>
        </div>
      </div>

      {/* Форма добавления */}
      {showAdd && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <h3 className="font-semibold mb-4">Yangi o'quvchi qo'shish</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ism Familiya</label>
              <input type="text" value={addIsm} onChange={e => setAddIsm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Telefon</label>
              <input type="tel" value={addTel} onChange={e => setAddTel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Filial</label>
              <Toggle left="Novza" right="Yunusobod" value={addFilial} onChange={setAddFilial} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Smena</label>
              <select value={addSmena} onChange={e => setAddSmena(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                {VAQTLAR.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dars boshlanish kuni</label>
              <input type="date" value={addDars} onChange={e => setAddDars(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
          </div>
          <button onClick={submitAdd} disabled={addLoading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 inline-flex items-center gap-2">
            {addLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda…</> : "Saqlash"}
          </button>
          {addResult && (
            <span className={cn("ml-3 text-sm font-medium",
              addResult.startsWith("✅") ? "text-emerald-600" : "text-red-500")}>
              {addResult}
            </span>
          )}
        </div>
      )}

      {/* DAVOMAT TAB */}
      {tab === "davomat" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Bugun belgilandi: <span className="font-semibold text-foreground">{totalToday}</span> / {students.length}
            </p>
          </div>

          {sortedSmenas.map(smena => {
            const list = bySmena[smena] ?? [];
            return (
              <div key={smena} className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-semibold text-sm">{smena} smena</span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">
                    {list.length} ta
                  </span>
                </div>

                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  {list.map((s, i) => {
                    const davRows  = getStudentDavomat(s.telefon);
                    const kunSoni  = davRows.length;
                    const markedToday = isMarkedToday(s.telefon);
                    const isLoading = marking[s.telefon];

                    return (
                      <div key={s.telefon}
                        className={cn("flex items-center gap-3 px-4 py-3 transition",
                          i !== list.length - 1 && "border-b border-border",
                          markedToday === "Bor" ? "bg-emerald-500/5" :
                          markedToday === "Yo'q" ? "bg-red-500/5" : "")}>

                        {/* Аватар */}
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm shrink-0 text-foreground">
                          {s.ism.charAt(0)}
                        </div>

                        {/* Инфо */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{s.ism}</div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {/* Точки посещаемости */}
                            <div className="flex gap-1">
                              {davRows.map((d, idx) => (
                                <div key={idx}
                                  className={cn("h-2 w-2 rounded-full",
                                    d.holat === "Bor" ? "bg-emerald-500" : "bg-red-400")}
                                  title={`${idx+1}-kun: ${d.holat} (${d.sana})`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {kunSoni} kun · {s.filial}
                            </span>
                            {markedToday && (
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                                markedToday === "Bor"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-red-500/10 text-red-500")}>
                                Bugun: {markedToday}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Кнопки */}
                        {!markedToday ? (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => markDavomat(s, "Bor")}
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50 inline-flex items-center gap-1">
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              Bor
                            </button>
                            <button
                              onClick={() => markDavomat(s, "Yo'q")}
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition disabled:opacity-50 inline-flex items-center gap-1">
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                              Yo'q
                            </button>
                          </div>
                        ) : (
                          <div className="shrink-0">
                            <span className={cn("text-xs px-3 py-1.5 rounded-lg font-medium",
                              markedToday === "Bor"
                                ? "bg-emerald-600 text-white"
                                : "bg-red-500 text-white")}>
                              ✓ {markedToday}
                            </span>
                          </div>
                        )}

                        {/* Удалить */}
                        <button onClick={() => removeStudent(s)}
                          className="h-8 w-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-muted-foreground hover:text-red-500 transition shrink-0">
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* JADVAL TAB */}
      {tab === "jadval" && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Ism yoki telefon..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm" />
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {["Barchasi", ...VAQTLAR].map(v => (
              <button key={v} onClick={() => setFilterSmena(v)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition border",
                  filterSmena === v
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground")}>
                {v}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            {["Barchasi", "Novza", "Yunusobod"].map(f => (
              <button key={f} onClick={() => setFilterFilial(f)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition border",
                  filterFilial === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground")}>
                {f}
              </button>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">O'quvchilar</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredStudents.length} ta</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border">
                    <th className="px-4 py-3 font-medium">Ism Familiya</th>
                    <th className="px-4 py-3 font-medium">Telefon</th>
                    <th className="px-4 py-3 font-medium">Filial</th>
                    <th className="px-4 py-3 font-medium">Smena</th>
                    <th className="px-4 py-3 font-medium">Davomat</th>
                    <th className="px-4 py-3 font-medium">Kun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">Topilmadi</td></tr>
                  ) : filteredStudents.map((s, i) => {
                    const davRows = getStudentDavomat(s.telefon);
                    const borSoni = davRows.filter(d => d.holat === "Bor").length;
                    return (
                      <tr key={i} className="hover:bg-secondary/40 transition">
                        <td className="px-4 py-3 font-medium">{s.ism}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.telefon}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border",
                            s.filial === "Novza"
                              ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                              : "bg-purple-500/10 text-purple-700 border-purple-500/20")}>
                            {s.filial}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{s.smena}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {davRows.map((d, idx) => (
                              <div key={idx}
                                className={cn("h-2.5 w-2.5 rounded-full",
                                  d.holat === "Bor" ? "bg-emerald-500" : "bg-red-400")}
                                title={`${idx+1}-kun: ${d.holat}`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{davRows.length}</span>
                          <span className="text-muted-foreground text-xs"> kun</span>
                          {borSoni > 0 && (
                            <span className="ml-1 text-xs text-emerald-600">({borSoni} bor)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
