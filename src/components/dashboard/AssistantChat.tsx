import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  context: string;
}

const CANNED_REPLIES: Record<string, string[]> = {
  "Sotuv Analizi": [
    "Bugun jami 86 qo'ng'iroq qilindi, shulardan 32 tasi sotuvga aylandi — konversiya 37%.",
    "Eng yaxshi natija ko'rsatgan menejer — Ziyoda, bugun 9 ta sotuv yopdi.",
    "Haftalik trend ijobiy: sotuvlar o'tgan haftaga nisbatan 12% o'sgan.",
  ],
  "Moliya": [
    "Joriy oyda sof foyda taxminan 76 mln so'm, marja ~38%.",
    "Eng katta xarajat moddasi — oylik maoshlar, jami xarajatning 42%ini tashkil qiladi.",
    "Novza filiali bu oy Yunusobodga nisbatan ko'proq daromad keltirdi.",
  ],
  "Moliya Chiqim Analizi": [
    "Bu oy eng ko'p xarajat — ijara va oyliklarga ketgan.",
    "Marketing xarajatlari o'tgan oyga nisbatan biroz oshgan.",
  ],
  "O'quvchilar": [
    "Hozir faol o'quvchilar soni 24 ta, ulardan 6 tasi shu hafta imtihon topshiradi.",
    "Davomat ko'rsatkichi o'rtacha 87% atrofida.",
  ],
  "Hodimlar": [
    "Bugun barcha hodimlar ish boshlagan, o'rtacha samaradorlik 84%.",
    "Eng yuqori samaradorlik — Ziyoda Karimova, 94%.",
  ],
  "Taklif va Shikoyatlar": [
    "Bu hafta 3 ta taklif va 1 ta shikoyat tushgan, shikoyat hal qilindi.",
  ],
  "Online Dostup": [
    "Hozir 14 ta telefon raqamiga onlayn ruxsat berilgan.",
  ],
};

function getCannedReply(context: string): string {
  const pool = CANNED_REPLIES[context] ?? ["Tushunarli, bu savol bo'yicha tegishli bo'limda batafsil ma'lumot mavjud."];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function AssistantChat({ context }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Salom! Men o'quv markazi AI yordamchisiman. ${context} bo'limi bo'yicha savollaringizni bering.` },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (text.length > 1000) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const reply = getCannedReply(context);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 600 + Math.random() * 400);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-20 lg:bottom-6 right-5 lg:right-8 z-40",
          "inline-flex items-center gap-2 pl-3 pr-4 h-11 rounded-2xl",
          "bg-primary text-primary-foreground shadow-elevated",
          "hover:scale-[1.02] active:scale-[0.98] transition-transform",
          open && "opacity-0 pointer-events-none"
        )}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm font-medium">AI yordamchi</span>
      </button>

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Chat panel */}
      <div
        className={cn(
          "fixed z-50 bg-card border border-border shadow-elevated rounded-2xl flex flex-col",
          "bottom-4 right-4 left-4 lg:left-auto lg:bottom-6 lg:right-8",
          "w-auto lg:w-[380px] h-[70vh] lg:h-[560px] max-h-[640px]",
          "transition-all duration-200 origin-bottom-right",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              A7
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">AI Yordamchi</div>
              <div className="text-[11px] text-muted-foreground leading-tight flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Onlayn
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-muted-foreground px-3.5 py-2 rounded-2xl rounded-bl-md inline-flex items-center gap-2 text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Yozyapti...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex items-end gap-2 bg-secondary rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-ring/20 transition">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 1000))}
              onKeyDown={onKey}
              placeholder="Savolingizni yozing..."
              maxLength={1000}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none py-1"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition shrink-0",
                input.trim() && !loading
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
