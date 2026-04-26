import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { roleLabels, roleRoutes, type AppRole } from "@/lib/onboarding";

const roles: AppRole[] = ["applicant", "partner", "employee", "colleague", "team", "management", "admin"];

export function AuthPanel() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<AppRole>("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail || password.length < 8 || (mode === "signup" && cleanName.length < 2)) {
      setMessage("Bitte E-Mail, Passwort mit mindestens 8 Zeichen und Namen korrekt ausfüllen.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: cleanName, requested_role: role },
        },
      });
      setLoading(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Zugang angelegt. Bitte E-Mail bestätigen; Admin weist danach die finale Rolle zu.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    navigate({ to: roleRoutes[role] });
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-stretch">
        <section className="flex flex-1 flex-col justify-between rounded-lg border border-border bg-card p-8 shadow-sm">
          <div>
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Zurück zur Übersicht
            </Link>
            <div className="mt-14 flex h-14 w-14 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight">Sicherer Onboarding-Zugang</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Getrennte Bereiche für Bewerber, Partner, Mitarbeiter, Kollegen, Teams, Management und Admin. Rollen werden nach Registrierung administrativ bestätigt.
            </p>
          </div>
          <div className="mt-10 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <span>Rollenbasierte Inhalte</span>
            <span>Auditierte Signaturen</span>
            <span>Management-Fortschritt</span>
            <span>Admin-Verwaltung</span>
          </div>
        </section>

        <section className="w-full rounded-lg border border-border bg-card p-6 shadow-sm lg:max-w-md">
          <div className="grid grid-cols-2 rounded-md bg-muted p-1">
            <button type="button" onClick={() => setMode("login")} className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Login
            </button>
            <button type="button" onClick={() => setMode("signup")} className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Zugang beantragen
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <label className="block space-y-2 text-sm font-medium">
                Vollständiger Name
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring" maxLength={120} />
              </label>
            )}
            <label className="block space-y-2 text-sm font-medium">
              E-Mail
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring" maxLength={255} />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Passwort
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring" minLength={8} />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Bereich
              <select value={role} onChange={(event) => setRole(event.target.value as AppRole)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring">
                {roles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}
              </select>
            </label>
            {message && <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">{message}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Bitte warten" : mode === "login" ? "Einloggen" : "Zugang anfordern"}</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
