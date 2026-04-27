import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from "react";
import jsPDF from "jspdf";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  FileSignature,
  FileText,
  ListChecks,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { publicModules, roleJourneys, roleLabels, roleRoutes, type AppRole, type AssignmentStatus } from "@/lib/onboarding";

type WorkspaceProps = {
  role: AppRole;
  variant?: "role" | "management" | "admin";
};

type ModuleRecord = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  public_summary?: string | null;
  audience?: string;
  audience_roles?: AppRole[];
  released_roles?: AppRole[];
  version?: string;
  status?: string;
  visibility_scope?: "internal" | "external" | "both";
  is_public_teaser?: boolean;
};

type SignatureRecord = {
  id: string;
  user_id: string;
  signer_name: string;
  signer_role: AppRole;
  signed_content_title: string;
  signed_content_version: string;
  confirmation_text: string;
  signature_hash: string;
  audit_data: Record<string, unknown>;
  signed_at: string;
};

type AssignmentRecord = {
  id: string;
  assigned_to: string;
  module_id: string;
  status: AssignmentStatus;
  due_at: string | null;
  notes: string | null;
  updated_at: string;
  modules?: { title?: string } | null;
};

type ProfileRecord = {
  user_id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  age?: number | null;
  linkedin_url?: string | null;
  phone?: string | null;
  integration_request?: string | null;
  intake_completed?: boolean;
  onboarding_status?: AssignmentStatus;
};

type FormRecord = {
  id: string;
  user_id: string;
  kind: string;
  form_data: Record<string, unknown>;
  status: AssignmentStatus;
  review_status?: "draft" | "submitted" | "in_review" | "approved" | "rejected" | "changes_requested";
  review_notes?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
};

const roles: AppRole[] = ["applicant", "partner", "employee", "colleague", "team", "management", "admin"];
const externalRoles: AppRole[] = ["applicant", "partner"];
const formRoles: AppRole[] = ["applicant", "partner", "employee", "team"];

const statusMap: { label: string; value: AssignmentStatus }[] = [
  { label: "Offen", value: "open" },
  { label: "In Bearbeitung", value: "in_progress" },
  { label: "Unterschrieben", value: "signed" },
  { label: "Überfällig", value: "overdue" },
];

const fallbackModules: ModuleRecord[] = publicModules.map((module) => ({
  ...module,
  public_summary: module.summary,
  audience_roles: roles.filter((roleItem) => module.audience.includes(roleLabels[roleItem]) || module.audience.includes("Alle Rollen")),
  released_roles: roles.filter((roleItem) => module.audience.includes(roleLabels[roleItem]) || module.audience.includes("Alle Rollen")),
  version: "2026.1",
  status: "active",
  is_public_teaser: true,
  visibility_scope: "both",
}));

function formatDate(value?: string | null) {
  if (!value) return "Kein Datum";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function assignmentProgress(status: AssignmentStatus) {
  if (status === "signed") return 100;
  if (status === "in_progress") return 55;
  if (status === "overdue") return 20;
  return 10;
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

async function hashSignature(payload: string) {
  const bytes = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function SignatureWorkspace({ role, variant = "role" }: WorkspaceProps) {
  const journey = roleJourneys[role];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleRecord[]>(fallbackModules);
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [selectedModule, setSelectedModule] = useState(fallbackModules[0]?.title ?? "Onboarding Modul");
  const [signerName, setSignerName] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<AssignmentStatus>("open");
  const [loading, setLoading] = useState(true);
  const [intake, setIntake] = useState({ firstName: "", lastName: "", age: "", linkedin: "", phone: "", request: "" });
  const [formText, setFormText] = useState("");

  const canManage = variant === "admin" || variant === "management";
  const selectedModuleRecord = modules.find((item) => item.title === selectedModule) ?? modules[0];
  const nowStamp = useMemo(() => new Intl.DateTimeFormat("de-DE", { dateStyle: "full", timeStyle: "medium" }).format(new Date()), [message, loading]);

  const visibleModules = useMemo(() => {
    if (canManage) return modules;
    return modules.filter((module) => module.released_roles?.includes(role) || module.audience_roles?.includes(role) || module.audience?.includes(roleLabels[role]) || module.audience?.includes("Alle Rollen"));
  }, [canManage, modules, role]);

  const moduleTitleById = useMemo(() => new Map(modules.filter((module) => module.id).map((module) => [module.id as string, module.title])), [modules]);

  const ownAssignments = userId ? assignments.filter((assignment) => assignment.assigned_to === userId) : assignments;
  const signedCount = ownAssignments.filter((assignment) => assignment.status === "signed").length + signatures.filter((signature) => signature.user_id === userId).length;
  const openCount = ownAssignments.filter((assignment) => assignment.status === "open").length;
  const progressBase = Math.max(visibleModules.length, ownAssignments.length, 1);
  const progressValue = Math.min(100, Math.round((signedCount / progressBase) * 100));

  const loadData = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    setUserId(user?.id ?? null);

    await (supabase.rpc("refresh_overdue_assignments") as any);

    const [{ data: moduleData }, { data: signatureData }, { data: assignmentData }, { data: profileData }, { data: formData }] = await Promise.all([
      (supabase.from("onboarding_modules") as any).select("*").order("title"),
      (supabase.from("legal_signatures") as any).select("*").order("signed_at", { ascending: false }),
      (supabase.from("onboarding_assignments") as any).select("*").order("updated_at", { ascending: false }),
      (supabase.from("profiles") as any).select("*"),
      (supabase.from("onboarding_forms") as any).select("*").order("updated_at", { ascending: false }),
    ]);

    const dbModules = (moduleData as ModuleRecord[] | null)?.length ? (moduleData as ModuleRecord[]) : fallbackModules;
    setModules(dbModules);
    setSignatures((signatureData as SignatureRecord[] | null) ?? []);
    setAssignments((assignmentData as AssignmentRecord[] | null) ?? []);
    setProfiles((profileData as ProfileRecord[] | null) ?? []);
    setForms((formData as FormRecord[] | null) ?? []);

    const ownProfile = ((profileData as ProfileRecord[] | null) ?? []).find((item) => item.user_id === user?.id) ?? null;
    setProfile(ownProfile);
    if (ownProfile) {
      setSignerName(ownProfile.full_name || `${ownProfile.first_name ?? ""} ${ownProfile.last_name ?? ""}`.trim());
      setIntake({
        firstName: ownProfile.first_name ?? "",
        lastName: ownProfile.last_name ?? "",
        age: ownProfile.age ? String(ownProfile.age) : "",
        linkedin: ownProfile.linkedin_url ?? "",
        phone: ownProfile.phone ?? "",
        request: ownProfile.integration_request ?? "",
      });
    }
    if (dbModules[0]) setSelectedModule((current) => dbModules.some((item) => item.title === current) ? current : dbModules[0].title);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#d6b25e";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitIntake = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return setMessage("Bitte zuerst einloggen.");
    const ageNumber = Number(intake.age);
    if (intake.firstName.trim().length < 2 || intake.lastName.trim().length < 2 || !Number.isFinite(ageNumber) || ageNumber < 16 || intake.phone.trim().length < 6 || intake.request.trim().length < 10) {
      setMessage("Bitte Vorname, Nachname, Alter, Telefon und Integrationsanfrage vollständig ausfüllen.");
      return;
    }
    const fullName = `${intake.firstName.trim()} ${intake.lastName.trim()}`;
    const { error } = await (supabase.from("profiles") as any).upsert({
      user_id: userId,
      full_name: fullName,
      first_name: intake.firstName.trim(),
      last_name: intake.lastName.trim(),
      age: ageNumber,
      linkedin_url: intake.linkedin.trim() || null,
      phone: intake.phone.trim(),
      integration_request: intake.request.trim(),
      intake_completed: true,
    }, { onConflict: "user_id" });
    if (error) return setMessage(error.message);
    setSignerName(fullName);
    setMessage("Integrationsdaten gespeichert. Lernmodule und Formulare sind freigeschaltet.");
    await loadData();
  };

  const submitWorkflowForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return setMessage("Bitte zuerst einloggen.");
    if (!profile?.intake_completed) return setMessage("Bitte zuerst den Integration Request abschließen.");
    if (formText.trim().length < 20) return setMessage("Bitte den Formularinhalt ausführlicher beschreiben.");
    const { error } = await (supabase.from("onboarding_forms") as any).insert({
      user_id: userId,
      kind: role === "colleague" ? "team" : role,
      submitted_by_role: role,
      form_data: { text: formText.trim(), submittedFrom: roleRoutes[role], profileSnapshot: intake },
      review_status: "submitted",
      status: "in_progress",
    });
    if (error) return setMessage(error.message);
    setFormText("");
    setMessage("Formular eingereicht. Status: Review-Phase.");
    await loadData();
  };

  const submitSignature = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (!userId) return setMessage("Bitte zuerst einloggen, damit Signaturen sicher gespeichert werden können.");
    if (!profile?.intake_completed) return setMessage("Bitte zuerst Vorname, Nachname, Alter, LinkedIn/Telefon und Integrationsanfrage speichern.");
    const cleanName = signerName.trim();
    if (cleanName.length < 2 || !confirmation) return setMessage("Bitte Namen eintragen und die rechtliche Bestätigung aktivieren.");
    const signatureImage = canvasRef.current?.toDataURL("image/png") ?? "";
    if (signatureImage.length < 2000) return setMessage("Bitte im Unterschriftsfeld unterschreiben.");

    const confirmationText = "Ich bestätige, dass ich die Kurzfassung gelesen, verstanden und verbindlich akzeptiert habe.";
    const signatureTime = new Date().toISOString();
    const hashPayload = `${userId}|${selectedModule}|${selectedModuleRecord?.version ?? "2026.1"}|${cleanName}|${signatureImage}|${signatureTime}`;
    const signatureHash = await hashSignature(hashPayload);

    const { error } = await (supabase.from("legal_signatures") as any).insert({
      user_id: userId,
      module_id: selectedModuleRecord?.id ?? null,
      signer_name: cleanName,
      signer_role: role,
      signed_content_title: selectedModule,
      signed_content_version: selectedModuleRecord?.version ?? "2026.1",
      confirmation_text: confirmationText,
      signature_data: { type: "canvas_png", image: signatureImage },
      signature_hash: signatureHash,
      audit_data: { userAgent: navigator.userAgent, roleArea: role, status, timestamp: signatureTime, profile: intake },
    });

    if (error) return setMessage(error.message);
    setStatus("signed");
    setMessage("Signatur wurde rechtlich dokumentiert gespeichert und ist im Admin-/Management-Panel sichtbar.");
    await loadData();
  };

  const toggleRoleRelease = async (module: ModuleRecord, releaseRole: AppRole) => {
    if (!module.id) return;
    const nextRoles = module.released_roles?.includes(releaseRole) ? module.released_roles.filter((item) => item !== releaseRole) : [...(module.released_roles ?? []), releaseRole];
    const hasInternal = nextRoles.some((item) => !externalRoles.includes(item));
    const hasExternal = nextRoles.some((item) => externalRoles.includes(item));
    const visibility_scope = hasInternal && hasExternal ? "both" : hasExternal ? "external" : "internal";
    const { error } = await (supabase.from("onboarding_modules") as any).update({ released_roles: nextRoles, visibility_scope, is_public_teaser: true, public_summary: module.summary.slice(0, 220) }).eq("id", module.id);
    if (error) return setMessage(error.message);
    setMessage("Modul-Freigabe aktualisiert. Die öffentliche Kurzversion wurde synchronisiert.");
    await loadData();
  };

  const setDueDate = async (assignmentId: string, dateValue: string) => {
    const dueAt = dateValue ? new Date(dateValue).toISOString() : null;
    const { error } = await (supabase.from("onboarding_assignments") as any).update({ due_at: dueAt }).eq("id", assignmentId);
    if (error) return setMessage(error.message);
    setMessage("Fälligkeitsdatum gespeichert. Überfällige Aufgaben werden automatisch markiert.");
    await loadData();
  };

  const updateFormReview = async (formId: string, reviewStatus: FormRecord["review_status"]) => {
    const { error } = await (supabase.from("onboarding_forms") as any).update({ review_status: reviewStatus, review_notes: `Review durch ${roleLabels[role]} am ${new Date().toISOString()}` }).eq("id", formId);
    if (error) return setMessage(error.message);
    setMessage("Review-Status aktualisiert.");
    await loadData();
  };

  const exportSignaturesCsv = () => {
    const rows = signatures.map((signature) => [signature.signed_at, signature.signer_name, signature.signer_role, signature.signed_content_title, signature.signed_content_version, signature.signature_hash, signature.audit_data]);
    const csv = [["Zeitpunkt", "Name", "Rolle", "Modul", "Version", "Hash", "Audit-Daten"].map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
    downloadFile(`signaturen-audit-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
  };

  const exportSignaturesPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Signaturen Audit Export", 14, 16);
    doc.setFontSize(9);
    doc.text(`Erstellt: ${formatDate(new Date().toISOString())}`, 14, 24);
    let y = 34;
    signatures.forEach((signature, index) => {
      if (y > 185) {
        doc.addPage("landscape");
        y = 18;
      }
      doc.text(`${index + 1}. ${formatDate(signature.signed_at)} · ${signature.signer_name} · ${roleLabels[signature.signer_role]} · ${signature.signed_content_title}`, 14, y);
      doc.text(`Hash: ${signature.signature_hash.slice(0, 86)}`, 14, y + 5);
      doc.text(`Audit: ${JSON.stringify(signature.audit_data).slice(0, 130)}`, 14, y + 10);
      y += 16;
    });
    doc.save(`signaturen-audit-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const dashboardItems = statusMap.map((item) => ({ ...item, count: ownAssignments.filter((assignment) => assignment.status === item.value).length + (item.value === "signed" ? signatures.filter((signature) => signature.user_id === userId).length : 0) }));

  return (
    <main className="aura-shell relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="matrix-rain" aria-hidden="true" />
      <div className="star-stream" aria-hidden="true" />
      <div className="lightning-bolt" aria-hidden="true" />

      <section className="relative border-b border-border/70 bg-secondary/45 px-6 py-8 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-border bg-card/70 px-3 py-1 text-sm font-medium text-muted-foreground shadow-[var(--shadow-aura)]"><Sparkles className="h-4 w-4 text-primary" />{roleLabels[role]} · Onboarding · {nowStamp}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">{journey.headline}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{journey.focus}</p>
          </div>
          <div className="w-full rounded-lg border border-border bg-card/75 p-4 shadow-[var(--shadow-aura)] backdrop-blur md:w-[420px]">
            <div className="flex items-center justify-between gap-3 text-sm"><span>Persönlicher Fortschritt</span><span>{progressValue}%</span></div>
            <Progress value={progressValue} className="mt-3" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {dashboardItems.map((item) => (
                <button key={item.value} type="button" onClick={() => setStatus(item.value)} className={`rounded-md border px-3 py-3 text-left text-sm transition ${status === item.value ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-gold)]" : "border-border bg-background/55 text-muted-foreground hover:bg-accent"}`}>
                  <span className="block text-lg font-semibold">{item.count}</span>{item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto grid max-w-7xl gap-6 px-6 py-8 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {journey.actions.map((action) => (
              <div key={action} className="rounded-lg border border-border bg-card/75 p-5 shadow-[var(--shadow-aura)] backdrop-blur">
                <ListChecks className="h-5 w-5 text-primary" />
                <p className="mt-4 text-sm font-medium leading-6">{action}</p>
              </div>
            ))}
          </div>

          <section className="rounded-lg border border-border bg-card/75 p-6 shadow-[var(--shadow-aura)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Rollen-Dashboard</h2></div>
              {loading && <span className="text-sm text-muted-foreground">Synchronisiere…</span>}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {dashboardItems.map((item) => (
                <div key={item.value} className="rounded-md border border-border bg-background/55 p-4">
                  <p className="text-3xl font-semibold">{item.count}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {ownAssignments.slice(0, 5).map((assignment) => (
                <div key={assignment.id} className="flex flex-col gap-3 rounded-md border border-border bg-background/55 p-4 md:flex-row md:items-center md:justify-between">
                  <div><p className="font-medium">Zuweisung {assignment.module_id.slice(0, 8)}</p><p className="text-sm text-muted-foreground">Status {assignment.status} · Fällig {formatDate(assignment.due_at)}</p></div>
                  <Progress value={assignment.status === "signed" ? 100 : assignment.status === "in_progress" ? 55 : assignment.status === "overdue" ? 20 : 10} className="md:w-48" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card/75 p-6 shadow-[var(--shadow-aura)] backdrop-blur">
            <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Freigegebene Lernmodule</h2></div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {visibleModules.map((module) => (
                <button key={module.slug} type="button" onClick={() => setSelectedModule(module.title)} className={`rounded-lg border p-5 text-left transition ${selectedModule === module.title ? "border-primary bg-primary/15 shadow-[var(--shadow-gold)]" : "border-border bg-background/60 hover:bg-accent"}`}>
                  <p className="text-sm font-semibold">{module.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.public_summary || module.summary}</p>
                  <p className="mt-4 text-xs font-medium text-muted-foreground">Freigegeben: {(module.released_roles ?? []).map((item) => roleLabels[item]).join(", ") || "Noch nicht gesetzt"}</p>
                </button>
              ))}
            </div>
          </section>

          {!profile?.intake_completed && !canManage && (
            <section className="rounded-lg border border-primary/50 bg-card/80 p-6 shadow-[var(--shadow-gold)] backdrop-blur">
              <div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Integration Request vor Start</h2></div>
              <form onSubmit={submitIntake} className="mt-5 grid gap-4 md:grid-cols-2">
                <input placeholder="Vorname" value={intake.firstName} onChange={(e) => setIntake({ ...intake, firstName: e.target.value })} className="h-10 rounded-md border border-input bg-background/70 px-3 text-sm" maxLength={80} />
                <input placeholder="Nachname" value={intake.lastName} onChange={(e) => setIntake({ ...intake, lastName: e.target.value })} className="h-10 rounded-md border border-input bg-background/70 px-3 text-sm" maxLength={80} />
                <input placeholder="Alter" type="number" value={intake.age} onChange={(e) => setIntake({ ...intake, age: e.target.value })} className="h-10 rounded-md border border-input bg-background/70 px-3 text-sm" min={16} max={100} />
                <input placeholder="Telefonnummer" value={intake.phone} onChange={(e) => setIntake({ ...intake, phone: e.target.value })} className="h-10 rounded-md border border-input bg-background/70 px-3 text-sm" maxLength={40} />
                <input placeholder="LinkedIn Profil" value={intake.linkedin} onChange={(e) => setIntake({ ...intake, linkedin: e.target.value })} className="h-10 rounded-md border border-input bg-background/70 px-3 text-sm md:col-span-2" maxLength={255} />
                <textarea placeholder="Integration Request / Motivation / Zuordnung" value={intake.request} onChange={(e) => setIntake({ ...intake, request: e.target.value })} className="min-h-24 rounded-md border border-input bg-background/70 px-3 py-2 text-sm md:col-span-2" maxLength={1000} />
                <Button type="submit" className="md:col-span-2">Integration Request speichern</Button>
              </form>
            </section>
          )}

          {formRoles.includes(role) && (
            <section className="rounded-lg border border-border bg-card/75 p-6 shadow-[var(--shadow-aura)] backdrop-blur">
              <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Formular-Workflow</h2></div>
              <form onSubmit={submitWorkflowForm} className="mt-5 space-y-4">
                <textarea value={formText} onChange={(event) => setFormText(event.target.value)} placeholder="Angaben für Review-Phase eintragen" className="min-h-28 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm" maxLength={1600} />
                <Button type="submit">Formular einreichen</Button>
              </form>
              <div className="mt-5 grid gap-3">
                {forms.filter((item) => item.user_id === userId).map((item) => <div key={item.id} className="rounded-md border border-border bg-background/55 p-3 text-sm">{item.kind} · {item.review_status ?? item.status} · {formatDate(item.submitted_at)}</div>)}
              </div>
            </section>
          )}
        </section>

        <section className="space-y-6">
          <section className="rounded-lg border border-border bg-card/80 p-6 shadow-[var(--shadow-aura)] backdrop-blur">
            <div className="flex items-center gap-3"><FileSignature className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Einzelnes Modul unterschreiben</h2></div>
            <form onSubmit={submitSignature} className="mt-5 space-y-4">
              <label className="block space-y-2 text-sm font-medium">Name der unterschreibenden Person<input value={signerName} onChange={(event) => setSignerName(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus:ring-2 focus:ring-ring" maxLength={120} /></label>
              <label className="block space-y-2 text-sm font-medium">Inhalt / Thema<select value={selectedModule} onChange={(event) => setSelectedModule(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus:ring-2 focus:ring-ring">{visibleModules.map((module) => <option key={module.slug} value={module.title}>{module.title}</option>)}</select></label>
              <div><p className="text-sm font-medium">Unterschriftsfeld</p><canvas ref={canvasRef} width={620} height={190} onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={() => { drawing.current = false; }} onPointerLeave={() => { drawing.current = false; }} className="mt-2 h-44 w-full touch-none rounded-md border border-input bg-background/80" /><button type="button" onClick={clearSignature} className="mt-2 text-sm text-muted-foreground hover:text-foreground">Unterschrift löschen</button></div>
              <label className="flex items-start gap-3 rounded-md border border-border bg-muted/70 p-3 text-sm leading-6 text-muted-foreground"><input type="checkbox" checked={confirmation} onChange={(event) => setConfirmation(event.target.checked)} className="mt-1" />Ich bestätige, dass ich die Kurzfassung gelesen, verstanden und verbindlich akzeptiert habe.</label>
              {message && <p className="rounded-md border border-border bg-muted/80 p-3 text-sm text-muted-foreground">{message}</p>}
              <Button type="submit" className="w-full">Signatur sicher speichern</Button>
            </form>
          </section>

          {canManage && (
            <>
              <section className="rounded-lg border border-border bg-card/80 p-6 shadow-[var(--shadow-aura)] backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Download className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Signatur-Audit Export</h2></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={exportSignaturesCsv}>CSV</Button><Button type="button" onClick={exportSignaturesPdf}>PDF</Button></div></div>
                <div className="mt-5 space-y-3">
                  {signatures.slice(0, 6).map((signature) => <div key={signature.id} className="rounded-md border border-border bg-background/55 p-3 text-sm"><p className="font-medium">{signature.signer_name} · {signature.signed_content_title}</p><p className="text-muted-foreground">{formatDate(signature.signed_at)} · {signature.signature_hash.slice(0, 28)}…</p></div>)}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card/80 p-6 shadow-[var(--shadow-aura)] backdrop-blur">
                <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Modul-Freigaben intern/extern</h2></div>
                <div className="mt-5 space-y-4">
                  {modules.map((module) => <div key={module.slug} className="rounded-md border border-border bg-background/55 p-4"><p className="font-medium">{module.title}</p><p className="mt-1 text-sm text-muted-foreground">Öffentlich: {module.public_summary || module.summary}</p><div className="mt-3 flex flex-wrap gap-2">{roles.map((item) => <button key={item} type="button" onClick={() => toggleRoleRelease(module, item)} className={`rounded-md border px-2 py-1 text-xs ${(module.released_roles ?? []).includes(item) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>{externalRoles.includes(item) ? "Extern" : "Intern"} · {roleLabels[item]}</button>)}</div></div>)}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card/80 p-6 shadow-[var(--shadow-aura)] backdrop-blur">
                <div className="flex items-center gap-3"><CalendarClock className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Fälligkeiten & Overdue</h2></div>
                <div className="mt-5 space-y-3">
                  {assignments.slice(0, 8).map((assignment) => <div key={assignment.id} className="rounded-md border border-border bg-background/55 p-3"><p className="text-sm font-medium">Nutzer {assignment.assigned_to.slice(0, 8)} · {assignment.status}</p><div className="mt-2 flex items-center gap-2"><input type="datetime-local" onChange={(event) => setDueDate(assignment.id, event.target.value)} className="h-9 rounded-md border border-input bg-background/70 px-2 text-sm" /><span className="text-xs text-muted-foreground">{formatDate(assignment.due_at)}</span></div></div>)}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card/80 p-6 shadow-[var(--shadow-aura)] backdrop-blur">
                <div className="flex items-center gap-3"><UsersRound className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Admin Panel: Profile, Review, Lernkurve</h2></div>
                <div className="mt-5 grid gap-3">
                  {profiles.map((item) => <div key={item.user_id} className="rounded-md border border-border bg-background/55 p-4"><p className="font-medium">{item.first_name || item.full_name} {item.last_name ?? ""}</p><p className="text-sm text-muted-foreground">Alter {item.age ?? "—"} · Telefon {item.phone ?? "—"} · LinkedIn {item.linkedin_url ?? "—"}</p><p className="mt-2 text-sm text-muted-foreground">{item.integration_request ?? "Kein Integration Request"}</p><Progress value={item.onboarding_status === "signed" ? 100 : item.onboarding_status === "in_progress" ? 55 : 15} className="mt-3" /></div>)}
                </div>
                <div className="mt-6 space-y-3">
                  {forms.slice(0, 8).map((form) => <div key={form.id} className="rounded-md border border-border bg-background/55 p-4"><p className="font-medium">Formular {form.kind} · {form.review_status ?? form.status}</p><p className="text-sm text-muted-foreground">{formatDate(form.submitted_at)}</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => updateFormReview(form.id, "in_review")}>Review</Button><Button type="button" size="sm" onClick={() => updateFormReview(form.id, "approved")}>Freigeben</Button><Button type="button" size="sm" variant="outline" onClick={() => updateFormReview(form.id, "changes_requested")}>Änderung</Button></div></div>)}
                </div>
              </section>
            </>
          )}

          <section className="rounded-lg border border-border bg-card/75 p-5 shadow-[var(--shadow-aura)] backdrop-blur">
            <div className="grid grid-cols-3 gap-3 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />Timestamp</span><span className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />Audit</span><span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Aura</span></div>
          </section>
        </section>
      </div>
    </main>
  );
}
