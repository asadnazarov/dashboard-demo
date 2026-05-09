import { useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.webp";

export function Login() {
  const [selectedRole, setSelectedRole] = useState<"boshliq" | "admin" | "ustoz" | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRoleSelect = (role: "boshliq" | "admin" | "ustoz") => {
    if (role === "boshliq") {
      setSelectedRole(role);
      setPassword("");
      setError("");
    } else {
      localStorage.setItem("role", role);
      window.location.reload();
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "4455") {
      localStorage.setItem("role", "boshliq");
      window.location.reload();
    } else {
      setError("Parol noto'g'ri");
      setPassword("");
    }
  };

  if (selectedRole === "boshliq") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <img src={logo} alt="AVTOTEST7" className="h-12" />
          </div>
          <div className="bg-card border border-border rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Boshliq</h1>
            <p className="text-sm text-muted-foreground mb-6">Parolni kiriting</p>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="Parol"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <button
                type="submit"
                className="w-full bg-foreground text-background py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                Kirish
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null);
                  setPassword("");
                  setError("");
                }}
                className="w-full bg-secondary text-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/80 transition"
              >
                Orqaga
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <img src={logo} alt="AVTOTEST7" className="h-14" />
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleRoleSelect("boshliq")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl",
              "border border-border bg-card hover:bg-secondary transition text-left"
            )}
          >
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Boshliq</div>
              <div className="text-xs text-muted-foreground">Parol bilan kirish</div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("admin")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl",
              "border border-border bg-card hover:bg-secondary transition text-left"
            )}
          >
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <LogIn className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Admin</div>
              <div className="text-xs text-muted-foreground">Bepul kirish</div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("ustoz")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl",
              "border border-border bg-card hover:bg-secondary transition text-left"
            )}
          >
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <LogIn className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Ustoz</div>
              <div className="text-xs text-muted-foreground">Bepul kirish</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
