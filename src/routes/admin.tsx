import { createFileRoute } from "@tanstack/react-router";
import { SignatureWorkspace } from "@/components/onboarding/signature-workspace";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Control Center — Onboarding" }, { name: "description", content: "Admin-Bereich zur Verwaltung von Rollen, Modulen, Zuweisungen, Formularen und Signaturen." }] }),
  component: () => <SignatureWorkspace role="admin" variant="admin" />,
});
