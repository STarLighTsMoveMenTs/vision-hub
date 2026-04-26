import { createFileRoute } from "@tanstack/react-router";
import { SignatureWorkspace } from "@/components/onboarding/signature-workspace";

export const Route = createFileRoute("/management")({
  head: () => ({ meta: [{ title: "Management Dashboard — Onboarding" }, { name: "description", content: "Management-Ansicht für Fortschritt, Zuweisungen, offene Signaturen und Rollenstatus." }] }),
  component: () => <SignatureWorkspace role="management" variant="management" />,
});
