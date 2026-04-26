import { createFileRoute } from "@tanstack/react-router";
import { SignatureWorkspace } from "@/components/onboarding/signature-workspace";

export const Route = createFileRoute("/mitarbeiter")({
  head: () => ({ meta: [{ title: "Mitarbeiter-Onboarding" }, { name: "description", content: "Mitarbeiterbereich für interne Compliance-Module, Aufgaben und Signaturen." }] }),
  component: () => <SignatureWorkspace role="employee" />,
});
