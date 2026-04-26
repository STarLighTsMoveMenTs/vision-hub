import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AssignmentStatus = Database["public"]["Enums"]["assignment_status"];

export const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  management: "Management",
  team: "Team",
  colleague: "Kollegen",
  employee: "Mitarbeiter",
  partner: "Partner",
  applicant: "Bewerber",
};

export const roleRoutes: Record<AppRole, string> = {
  admin: "/admin",
  management: "/management",
  team: "/team",
  colleague: "/kollegen",
  employee: "/mitarbeiter",
  partner: "/partner",
  applicant: "/bewerber",
};

export const publicModules = [
  {
    title: "Governance & Struktur",
    slug: "enterprise-governance-struktur",
    summary: "Rollen, Verantwortung, Eskalation und Management-Steuerung als kurze Orientierung.",
    audience: "Management, Admin, Teams",
  },
  {
    title: "Code of Conduct",
    slug: "code-of-conduct-ethik",
    summary: "Verhalten, Integrität, Transparenz und Zusammenarbeit im täglichen Unternehmenskontext.",
    audience: "Alle Rollen",
  },
  {
    title: "AI Tool Compliance",
    slug: "ai-tool-compliance",
    summary: "Sichere KI-Nutzung, Datenverantwortung und Nachvollziehbarkeit bei Tool-Einsatz.",
    audience: "Mitarbeiter, Teams, Management",
  },
  {
    title: "Privacy & Datenschutz",
    slug: "privacy-datenschutz-governance",
    summary: "Minimalprinzip, Zugriffskontrollen und dokumentierter Umgang mit sensiblen Daten.",
    audience: "Mitarbeiter, Partner, Management",
  },
  {
    title: "Partner & Bewerber Onboarding",
    slug: "partner-onboarding-zusammenarbeit",
    summary: "Strukturierte Anfragen, Erwartungen, Prüfprozesse und nächste Schritte.",
    audience: "Bewerber, Partner, Admin",
  },
  {
    title: "NDA & Vertraulichkeit",
    slug: "nda-vertraulichkeit",
    summary: "Schutz vertraulicher Informationen und klare Meldewege bei Risiken.",
    audience: "Bewerber, Partner, Mitarbeiter",
  },
];

export const roleJourneys: Record<AppRole, { headline: string; focus: string; actions: string[] }> = {
  applicant: {
    headline: "Bewerber-Onboarding",
    focus: "Erwartungen, Struktur, Vertraulichkeit und nächste Schritte vor dem Kennenlernen.",
    actions: ["Profil und Motivation erfassen", "NDA-Kurzmodul bestätigen", "Bewerbungsstatus verfolgen"],
  },
  partner: {
    headline: "Partner-Onboarding",
    focus: "Kooperationsziele, Governance, Datenschutz und operative Fähigkeiten sauber erfassen.",
    actions: ["Partnership Request ausfüllen", "Compliance-Module unterschreiben", "Review mit Management vorbereiten"],
  },
  employee: {
    headline: "Mitarbeiter-Onboarding",
    focus: "Interne Regeln, AI-/Cloud-Nutzung, Datenschutz und Code of Conduct bestätigen.",
    actions: ["Pflichtmodule bearbeiten", "Digitale Signatur abgeben", "Offene Aufgaben schließen"],
  },
  colleague: {
    headline: "Kollegen-Bereich",
    focus: "Teamregeln, Vision Style, Verhalten und Zusammenarbeit im operativen Alltag.",
    actions: ["Teamkodex lesen", "Zusammenarbeitsregeln bestätigen", "Offene Team-Aufgaben prüfen"],
  },
  team: {
    headline: "Team-Kameraden Hub",
    focus: "Gemeinsames Onboarding mit Aufgaben, Status und klaren Verantwortlichkeiten.",
    actions: ["Team-Fortschritt prüfen", "Module gemeinsam abschließen", "Risiken an Management eskalieren"],
  },
  management: {
    headline: "Management-Ansicht",
    focus: "Fortschritt, offene Signaturen, Zuweisungen und Governance-Risiken überblicken.",
    actions: ["Status je Rolle prüfen", "Überfällige Aufgaben priorisieren", "Signaturen auditieren"],
  },
  admin: {
    headline: "Admin Control Center",
    focus: "Rollen, Profile, Module, Zuweisungen, Formulare und Signaturen zentral verwalten.",
    actions: ["Nutzerrollen pflegen", "Module versionieren", "Zuweisungen und Formulare steuern"],
  },
};

export const managementMetrics = [
  { label: "Aktive Module", value: "8", status: "Themen live" },
  { label: "Rollenbereiche", value: "7", status: "getrennte Zugänge" },
  { label: "Signaturstatus", value: "Audit", status: "rechtlich dokumentiert" },
  { label: "Form-Flows", value: "5", status: "Bewerber bis Management" },
];
