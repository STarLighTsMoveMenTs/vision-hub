import { useMemo, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { CheckCircle2, FileSignature, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { publicModules, roleJourneys, roleLabels, type AppRole, type AssignmentStatus } from "@/lib/onboarding";

type WorkspaceProps = {
  role: AppRole;
  variant?: "role" | "management" | "admin";
};

const statusMap: { label: string; value: AssignmentStatus }[] = [
  { label: "Offen", value: "open" },
  { label: "In Bearbeitung", value: "in_progress" },
  { label: "Unterschrieben", value: "signed" },
  { label: "Überfällig", value: "overdue" },
];

async function hashSignature(payload: string) {
  const bytes = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function SignatureWorkspace({ role, variant = "role" }: WorkspaceProps) {
  const journey = roleJourneys[role];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [signerName, setSignerName] = useState("");
  const [selectedModule, setSelectedModule] = useState(publicModules[0]?.title ?? "Onboarding Modul");
  const [confirmation, setConfirmation] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<AssignmentStatus>("open");

  const filteredModules = useMemo(() => publicModules.filter((module) => module.audience.includes(roleLabels[role]) || module.audience.includes("Alle Rollen") || variant !== "role"), [role, variant]);
  const visibleModules = filteredModules.length > 0 ? filteredModules : publicModules.slice(0, 4);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = point(event);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "currentColor";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitSignature = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setMessage("Bitte zuerst einloggen, damit Signaturen sicher gespeichert werden können.");
      return;
    }
    const cleanName = signerName.trim();
    if (cleanName.length < 2 || !confirmation) {
      setMessage("Bitte Namen eintragen und die rechtliche Bestätigung aktivieren.");
      return;
    }
    const signatureImage = canvasRef.current?.toDataURL("image/png") ?? "";
    if (signatureImage.length < 2000) {
      setMessage("Bitte im Unterschriftsfeld unterschreiben.");
      return;
    }

    const confirmationText = "Ich bestätige, dass ich die Kurzfassung gelesen, verstanden und verbindlich akzeptiert habe.";
    const hashPayload = `${user.id}|${selectedModule}|2026.1|${cleanName}|${signatureImage}|${new Date().toISOString()}`;
    const signatureHash = await hashSignature(hashPayload);

    const { error } = await supabase.from("legal_signatures").insert({
      user_id: user.id,
      signer_name: cleanName,
      signer_role: role,
      signed_content_title: selectedModule,
      signed_content_version: "2026.1",
      confirmation_text: confirmationText,
      signature_data: { type: "canvas_png", image: signatureImage },
      signature_hash: signatureHash,
      audit_data: { userAgent: navigator.userAgent, roleArea: role, status },
    });

    if (error) {
      setMessage(error.message);
      return;
    }
    setStatus("signed");
    setMessage("Signatur wurde rechtlich dokumentiert gespeichert.");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-secondary/40 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{roleLabels[role]} · Onboarding</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{journey.headline}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{journey.focus}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[520px]">
            {statusMap.map((item) => (
              <button key={item.value} type="button" onClick={() => setStatus(item.value)} className={`rounded-md border px-3 py-3 text-left text-sm ${status === item.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {journey.actions.map((action) => (
              <div key={action} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <ListChecks className="h-5 w-5 text-primary" />
                <p className="mt-4 text-sm font-medium leading-6">{action}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Themenbasierte Kurzmodule</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {visibleModules.map((module) => (
                <button key={module.slug} type="button" onClick={() => setSelectedModule(module.title)} className={`rounded-lg border p-5 text-left transition-colors ${selectedModule === module.title ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-accent"}`}>
                  <p className="text-sm font-semibold">{module.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.summary}</p>
                  <p className="mt-4 text-xs font-medium text-muted-foreground">{module.audience}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileSignature className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Verbindliche Unterschrift</h2>
          </div>
          <form onSubmit={submitSignature} className="mt-5 space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              Name der unterschreibenden Person
              <input value={signerName} onChange={(event) => setSignerName(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" maxLength={120} />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Inhalt / Thema
              <select value={selectedModule} onChange={(event) => setSelectedModule(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                {publicModules.map((module) => <option key={module.slug} value={module.title}>{module.title}</option>)}
              </select>
            </label>
            <div>
              <p className="text-sm font-medium">Unterschriftsfeld</p>
              <canvas ref={canvasRef} width={620} height={190} onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={() => { drawing.current = false; }} onPointerLeave={() => { drawing.current = false; }} className="mt-2 h-44 w-full touch-none rounded-md border border-input bg-background" />
              <button type="button" onClick={clearSignature} className="mt-2 text-sm text-muted-foreground hover:text-foreground">Unterschrift löschen</button>
            </div>
            <label className="flex items-start gap-3 rounded-md border border-border bg-muted p-3 text-sm leading-6 text-muted-foreground">
              <input type="checkbox" checked={confirmation} onChange={(event) => setConfirmation(event.target.checked)} className="mt-1" />
              Ich bestätige, dass ich die Kurzfassung gelesen, verstanden und verbindlich akzeptiert habe.
            </label>
            {message && <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">{message}</p>}
            <Button type="submit" className="w-full">Signatur sicher speichern</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
