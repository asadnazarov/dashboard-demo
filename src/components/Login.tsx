import { useState } from "react";
import { Lock, LogIn, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "boshliq" | "admin" | "ustoz";

export function Login() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const PASSWORDS: Record<string, string> = {
    boshliq: "4455",
    admin:   "7890",
    ustoz:   "1221",
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setPassword("");
    setError("");
  };

  const handleSubmit = () => {
    if (password === PASSWORDS[selectedRole!]) {
      localStorage.setItem("role", selectedRole!);
      window.location.reload();
    } else {
      setError("Parol noto'g'ri");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="h-10 mb-8" />

        {!selectedRole ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {(["boshliq", "admin", "ustoz"] as Role[]).map((role, i) => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-secondary",
                  i !== 2 && "border-b border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  {role === "boshliq"
                    ? <Lock className="h-4 w-4 text-muted-foreground" />
                    : <LogIn className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-medium text-sm capitalize">
                    {role === "boshliq" ? "Boshliq" : role === "admin" ? "Admin" : "Ustoz"}
                  </span>
                </div>
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold capitalize">
                {selectedRole === "boshliq" ? "Boshliq" : selectedRole === "admin" ? "Admin" : "Ustoz"}
              </h3>
              <button onClick={() => setSelectedRole(null)}
                className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">Parol</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="••••"
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
            <button onClick={handleSubmit}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition">
              Kirish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
